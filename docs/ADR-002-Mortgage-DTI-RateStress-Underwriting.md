# ADR-002: Dual-Method Mortgage Underwriting, Floating-Rate DTI Stress Testing & 10-Year Leverage IRR

- **Status:** Accepted & Implemented (v3.0)
- **Date:** 2026-11-27
- **Authors:** Truong Van Tinh (Principal Solution Architect — TVT Studio)
- **Components:** `src/engines/mortgageEngine.ts`, `src/engines/leverageEngine.ts`, `Kinetix.Domain.Services.MortgageUnderwritingEngine`, `POST /api/v1/underwriting/stress-test`

---

## 1. Context & Financial Domain Requirements

Luxury residential investors in Vietnam (Ho Chi Minh City / Thu Thiem) face three distinct underwriting risks that generic online mortgage widgets fail to model accurately:

1. **Promotional Rate Cliff (Floating-Rate Shock):** Vietnamese commercial banks (Vietcombank, Techcombank, Standard Chartered, HSBC) typically offer 12–24 month promotional teaser rates (`6.5%–7.5% p.a.`), after which loans reset to `COF + 3.0%–4.0%` (`9.5%–11.5% p.a.`). Underwriting solely at the teaser rate masks severe post-promo Debt-to-Income (DTI) breaches.
2. **Fixed Annuity vs. Reducing-Balance (Declining Principal) Conventions:** International expatriate buyers expect **Fixed-Annuity PMT** schedules, whereas local Vietnamese banks routinely originate **Reducing-Balance** mortgages (fixed monthly principal `P / N` plus interest on remaining balance), which carry a higher Month-1 payment but materially lower lifetime interest.
3. **Unlevered Cash vs. 70% Bank Leverage Capital Efficiency:** High-net-worth buyers deciding between an all-cash acquisition and 70% LTV financing need an exact **Net IRR** comparison incorporating Vietnam statutory rental tax (`10%`: 5% VAT + 5% PIT), tower service fees, `0.8`-month annual vacancy reserve, `3%/yr` rental escalation, and Vietnam's `2%` statutory personal income transfer tax upon Year-10 exit.

## 2. Architectural Decision

### 2.1 Isomorphic Shared Math Contract (TypeScript Frontend ↔ .NET 10 Backend)
Both `src/engines/` (browser real-time zero-latency sliders) and `Kinetix.Domain.Services.MortgageUnderwritingEngine` (authoritative server-side underwriting & API verification) implement the exact same deterministic financial formulas:

- **Fixed-Annuity PMT:**
  $$\text{PMT} = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1}, \quad r = \frac{i}{12}, \quad n = 12 \cdot T$$
  Final-month settlement explicitly pays `remainingBalance + finalMonthInterest` to guarantee **exact `0 VND` ending balance** with zero IEEE-754 floating-point residual drift.
- **Reducing-Balance Schedule (`.NET 10` API):**
  $$\text{Principal}_m = \frac{P}{n}, \quad \text{Interest}_m = B_{m-1} \cdot r, \quad \text{Payment}_m = \text{Principal}_m + \text{Interest}_m$$
  Reports `FirstMonthPaymentVnd`, `FinalMonthPaymentVnd`, `TotalInterestVnd`, and exact `InterestSavingsVsAnnuityVnd`.
- **Floating-Rate Stress Matrix (`+0%` / `+2%` / `+4%`) & Bank DTI Tiers:**
  $$\text{DTI}(\%) = \frac{\text{Stressed Monthly PMT}}{\text{Monthly Verified Income}} \times 100$$
  - `DTI <= 35.0%` → **`SAFE`** (Bank-grade private wealth underwriting threshold)
  - `35.0% < DTI <= 50.0%` → **`CAUTION`** (Moderate stretch; 12-month liquidity reserve recommended)
  - `DTI > 50.0%` → **`HIGH_RISK`** (Underwriting breach; lower LTV or extended tenure required)
- **Safeguarded Bracketed Bisection IRR Solver:**
  Instead of unbounded Newton-Raphson (which can diverge or oscillate when early leveraged cashflows are negative followed by a large Year-10 exit inflow), both TypeScript and C# solve $\text{NPV}(r) = \sum_{t=0}^{10} \frac{CF_t}{(1+r)^t} = 0$ via **bracketed bisection over `[-0.85, +3.0]`** (80 iterations, `<1e-9` precision) with automatic upper-bound doubling.

### 2.2 Statutory Vietnam Real Estate Fee & Tax Realism
- **Gross vs. Net Yield:** Deducts monthly tower management fee (`38,000–55,000 VND/m²/mo`), `0.8` months/year vacancy allowance, and `10%` statutory Vietnam rental tax (`5% VAT + 5% PIT`).
- **Exit Friction:** Applies Vietnam's mandatory `2%` resale transfer tax on Year-10 projected property value before deducting remaining loan principal to arrive at exact `NetExitProceedsVnd`.

## 3. Consequences & Verification

- **Positive:**
  - Instantaneous slider interactivity on GitHub Pages static deployment (client engine) backed by bit-consistent server verification via `POST /api/v1/underwriting/stress-test` in full-stack Docker deployments.
  - Zero `NaN` or non-convergent IRR states across extreme rate shocks (`0%` to `15%+`) and negative-cashflow high-LTV scenarios.
  - Cross-verified by **59 frontend Vitest tests** and **23 backend xUnit tests** (`UnderwritingTests`), explicitly asserting zero ending balance, reducing-balance interest savings, `+4%` DTI breach transition (`Caution -> HighRisk`), and `|NPV(IRR)| ≈ 0`.
- **Trade-offs:**
  - Maintaining parallel TypeScript and C# engines requires parity discipline on formula updates; mitigated by shared benchmark fixtures (`K-40P`, `68.5B VND`, `30% down`, `7.2%`, `20y`) verified continuously in both `npm test` and `dotnet test`.
