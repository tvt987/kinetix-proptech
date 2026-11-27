using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Kinetix.Domain.Models;

namespace Kinetix.Domain.Services;

/// <summary>
/// Thread-safe, idempotent unit escrow reservation locker preventing double-hold race conditions
/// across concurrent luxury residence buyers. Enforces strict Idempotency-Key semantics:
/// - First buyer acquires exclusive unit lock -> Created (201)
/// - Identical retry with same Idempotency-Key -> IdempotentReplay (200)
/// - Concurrent or subsequent distinct buyer on held unit -> ConflictAlreadyHeld (409)
/// - Reuse of Idempotency-Key across different unit payload -> ConflictIdempotencyKeyMismatch (409)
/// </summary>
public sealed class UnitEscrowLocker
{
    public const string TechcombankBin = "970407";
    public const string EscrowAccountNumber = "19036888999001";
    public const string EscrowAccountName = "THE KINETIX RESIDENCES ESCROW";

    private readonly ResidenceCatalog _catalog;
    private readonly TimeProvider _timeProvider;
    private readonly Lock _syncLock = new();
    private readonly Dictionary<string, EscrowHoldReceipt> _holdsByUnitId = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, EscrowHoldReceipt> _holdsByIdempotencyKey = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, EscrowHoldReceipt> _holdsByHoldId = new(StringComparer.OrdinalIgnoreCase);

    public UnitEscrowLocker(ResidenceCatalog catalog, TimeProvider? timeProvider = null)
    {
        _catalog = catalog;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public EscrowHoldResult AcquireHold(string idempotencyKey, EscrowHoldRequest request)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            return new EscrowHoldResult(
                EscrowHoldStatus.ValidationFailed,
                null,
                ErrorMessage: "Idempotency-Key header is required.");
        }

        if (string.IsNullOrWhiteSpace(request.UnitId) ||
            string.IsNullOrWhiteSpace(request.BuyerName) ||
            string.IsNullOrWhiteSpace(request.BuyerEmail) ||
            !request.BuyerEmail.Contains('@') ||
            request.DepositAmountVnd < 50_000_000L)
        {
            return new EscrowHoldResult(
                EscrowHoldStatus.ValidationFailed,
                null,
                ErrorMessage: "Invalid escrow hold request: valid unitId, buyerName, buyerEmail, and depositAmountVnd >= 50,000,000 VND are required.");
        }

        var unit = _catalog.GetById(request.UnitId.Trim());
        if (unit is null)
        {
            return new EscrowHoldResult(
                EscrowHoldStatus.UnitNotFound,
                null,
                ErrorMessage: $"Residence unit '{request.UnitId}' was not found.");
        }

        var trimmedKey = idempotencyKey.Trim();
        var now = _timeProvider.GetUtcNow();

        lock (_syncLock)
        {
            // 1. Check idempotency ledger first (replay safety)
            if (_holdsByIdempotencyKey.TryGetValue(trimmedKey, out var existingByKey))
            {
                if (!string.Equals(existingByKey.UnitId, unit.Id, StringComparison.OrdinalIgnoreCase) ||
                    existingByKey.DepositAmountVnd != request.DepositAmountVnd)
                {
                    return new EscrowHoldResult(
                        EscrowHoldStatus.ConflictIdempotencyKeyMismatch,
                        null,
                        ConflictHoldId: existingByKey.HoldId,
                        ConflictExpiresAtUtc: existingByKey.ExpiresAtUtc,
                        ErrorMessage: "Idempotency-Key was already used for a different unit or deposit amount.");
                }

                return new EscrowHoldResult(EscrowHoldStatus.IdempotentReplay, existingByKey);
            }

            // 2. Reject permanently SOLD units
            if (unit.Status == UnitAvailabilityStatus.Sold)
            {
                return new EscrowHoldResult(
                    EscrowHoldStatus.ConflictUnitSold,
                    null,
                    ErrorMessage: $"Residence {unit.Code} is already SOLD and cannot be held in escrow.");
            }

            // 3. Evict expired unit hold if TTL elapsed; otherwise reject concurrent buyer with 409 Conflict
            if (_holdsByUnitId.TryGetValue(unit.Id, out var existingUnitHold))
            {
                if (existingUnitHold.ExpiresAtUtc > now)
                {
                    return new EscrowHoldResult(
                        EscrowHoldStatus.ConflictAlreadyHeld,
                        null,
                        ConflictHoldId: existingUnitHold.HoldId,
                        ConflictExpiresAtUtc: existingUnitHold.ExpiresAtUtc,
                        ErrorMessage: $"Residence {unit.Code} is currently locked in active escrow hold '{existingUnitHold.HoldId}' until {existingUnitHold.ExpiresAtUtc:O}.");
                }

                _holdsByUnitId.Remove(unit.Id);
            }

            // 4. Atomically lock unit & persist idempotency receipt
            var durationHours = Math.Clamp(request.HoldDurationHours, 1, 168);
            var holdId = BuildDeterministicHoldId(unit.Code, trimmedKey);
            var transferMemo = string.IsNullOrWhiteSpace(request.LinkedVipPassCode)
                ? $"KINETIX HOLD {unit.Code} {holdId[^6..]}"
                : $"KINETIX HOLD {unit.Code} {request.LinkedVipPassCode.Trim().ToUpperInvariant()}";

            var receipt = new EscrowHoldReceipt(
                HoldId: holdId,
                IdempotencyKey: trimmedKey,
                UnitId: unit.Id,
                UnitCode: unit.Code,
                BuyerName: request.BuyerName.Trim(),
                BuyerEmail: request.BuyerEmail.Trim(),
                DepositAmountVnd: request.DepositAmountVnd,
                BankBin: TechcombankBin,
                AccountNumber: EscrowAccountNumber,
                AccountName: EscrowAccountName,
                TransferMemo: transferMemo,
                CreatedAtUtc: now,
                ExpiresAtUtc: now.AddHours(durationHours),
                LinkedVipPassCode: request.LinkedVipPassCode?.Trim()
            );

            _holdsByUnitId[unit.Id] = receipt;
            _holdsByIdempotencyKey[trimmedKey] = receipt;
            _holdsByHoldId[holdId] = receipt;

            return new EscrowHoldResult(EscrowHoldStatus.Created, receipt);
        }
    }

    public EscrowHoldReceipt? GetHoldById(string holdId) =>
        _holdsByHoldId.TryGetValue(holdId, out var receipt) ? receipt : null;

    public IReadOnlySet<string> GetActivelyHeldUnitIds()
    {
        var now = _timeProvider.GetUtcNow();
        lock (_syncLock)
        {
            return _holdsByUnitId
                .Where(kv => kv.Value.ExpiresAtUtc > now)
                .Select(kv => kv.Key)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
    }

    public int ActiveHoldCount => GetActivelyHeldUnitIds().Count;

    private static string BuildDeterministicHoldId(string unitCode, string idempotencyKey)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{unitCode}:{idempotencyKey}"));
        var suffix = Convert.ToHexString(hash)[..8];
        return $"ESC-{unitCode.Replace("-", "")}-{suffix}";
    }
}
