namespace Kinetix.Domain.Models;

public sealed record EscrowHoldRequest(
    string UnitId,
    string BuyerName,
    string BuyerEmail,
    long DepositAmountVnd,
    string? LinkedVipPassCode = null,
    int HoldDurationHours = 72
);

public sealed record EscrowHoldReceipt(
    string HoldId,
    string IdempotencyKey,
    string UnitId,
    string UnitCode,
    string BuyerName,
    string BuyerEmail,
    long DepositAmountVnd,
    string BankBin,
    string AccountNumber,
    string AccountName,
    string TransferMemo,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset ExpiresAtUtc,
    string? LinkedVipPassCode
);

public enum EscrowHoldStatus
{
    Created,
    IdempotentReplay,
    ConflictAlreadyHeld,
    ConflictIdempotencyKeyMismatch,
    ConflictUnitSold,
    UnitNotFound,
    ValidationFailed
}

public sealed record EscrowHoldResult(
    EscrowHoldStatus Status,
    EscrowHoldReceipt? Receipt,
    string? ConflictHoldId = null,
    DateTimeOffset? ConflictExpiresAtUtc = null,
    string? ErrorMessage = null
);
