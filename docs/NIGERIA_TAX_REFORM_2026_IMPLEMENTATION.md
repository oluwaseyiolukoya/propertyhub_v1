# Nigeria Property Tax Calculator (NTA 2025 Compliant) - Implementation Plan

## 📋 Executive Summary

This document outlines the logic and formulas required to build a tax calculator for property owners in Nigeria, based on the provisions of the **Nigeria Tax Act (NTA) 2025**, effective **January 1, 2026**.

The calculator enables property owners to calculate tax obligations **per property** by:

1. **Rental Income Tax Module (PIT)**: Calculates Personal Income Tax on net rental profit
2. **Capital Gains Tax (CGT) Module**: Calculates tax on property sales
3. **Stamp Duty Module**: Calculates duty on lease and sale agreements
4. **Regional Land Use Charge (LUC) Module**: Calculates state-specific property tax

**Scope**: Property-specific tax calculations with integration to financial reports for accurate revenue and expense data.

**Reference**:

- [Baker Tilly Nigeria - Nigeria's 2025 Tax Reform Acts Explained](https://www.bakertilly.ng/insights/nigerias-2025-tax-reform-acts-explained)
- Nigeria Tax Act (NTA) 2025

---

## 📚 Tax Calculation Modules (NTA 2025 Compliant)

### 1. Rental Income Tax Module (Personal Income Tax - PIT)

Landlords must pay PIT on the net profit derived from rental income. This net profit is added to the property owner's total annual taxable income.

#### Input Fields Required:

- **Gross Annual Rental Income (₦)**: Auto-calculated from active leases (financial reports logic)
- **Total Allowable Expenses (₦)**: Maintenance, Agency Fees, Security, Insurance - Auto-calculated from expense records
- **Other Sources of Income (₦)**: Salary, Business Profit, etc. (Optional - not included in property-specific calculations)

#### Calculation Steps:

1. **Net Taxable Profit (Property)**: Gross Annual Rental Income - Total Allowable Expenses
2. **Total Taxable Income**: Net Taxable Profit (Property) + Other Sources of Income
3. **Tax Calculation**: Apply progressive tax rates to Total Taxable Income

#### Progressive Tax Rates (NTA 2025):

| Taxable Income Band (Annual) | Rate          |
| ---------------------------- | ------------- |
| First ₦800,000               | 0% (Tax-Free) |
| Next ₦2,200,000              | 15%           |
| Next ₦9,000,000              | 18%           |
| Next ₦13,000,000             | 21%           |
| Next ₦25,000,000             | 23%           |
| Above ₦50,000,000            | 25%           |

**Note**: For property-specific calculations, we focus on Net Taxable Profit (Property) only, without other sources of income.

**Implementation**: Revenue and expenses are fetched from financial reports using the same logic as the financial overview and property performance endpoints.

---

### 2. Capital Gains Tax (CGT) Module

Calculates the tax due when a property (land or building) is sold for a profit.

#### Input Fields Required:

- **Sales Proceeds (₦)**: Auto-fetched from property `currentValue` or manual entry
- **Initial Acquisition Price (₦)**: Auto-fetched from property `purchasePrice` or manual entry
- **Cost of Improvements/Renovations (₦)**: Manual entry (optional)
- **Disposal Costs (₦)**: Agent/Legal Fees - Manual entry (optional)
- **Property Type**: Primary Residence / Other (from property settings)
- **Owner Type**: Individual / Company (from tax settings)

#### Calculation Steps:

1. **Total Allowable Costs**: Initial Acquisition Price + Cost of Improvements + Disposal Costs
2. **Chargeable Gain**: Sales Proceeds - Total Allowable Costs
3. **Exemption Check**: If Property Type is "Primary Residence," the Chargeable Gain is **0** (exempt)
4. **Tax Rate Application**:
   - **If Owner Type is "Individual"**: Chargeable Gain is taxed using the progressive PIT rates (Section 1)
   - **If Owner Type is "Company"**: Flat rate of **30%** is applied to the Chargeable Gain

**Reference**: [Baker Tilly Nigeria - Capital Gains Tax Reforms](https://www.bakertilly.ng/insights/nigerias-2025-tax-reform-acts-explained)

---

### 3. Stamp Duty Module

Calculates the duty required to legalize lease and sale agreements.

#### Input Fields Required:

- **Annual Rent Value (for leases)** or **Total Property Value (for sales)** (₦)
- **Lease Duration (Years)**: For lease agreements only
- **Agreement Type**: Lease / Sale

#### Calculation Logic:

**Exemption**: If Annual Rent Value / Total Property Value is **< ₦10 million**, the rate is **0%**.

**Sales Agreements**:

- Flat rate of **0.78%** of the total property value

**Lease Agreements**:

- **Short-term (< 7 years)**: **0.78%** of the total lease value (Annual Rent × Lease Duration)
- **Long-term (8–21 years)**: **3%** of the total lease value (Annual Rent × Lease Duration)

**Note**: Additional exemptions per NTA 2025:

- Agreements < ₦1,000,000
- Employee agreements
- Contracts for sale of goods/merchandise

**Reference**: [Baker Tilly Nigeria - Stamp Duty Reforms](https://www.bakertilly.ng/insights/nigerias-2025-tax-reform-acts-explained)

---

### 4. Regional Land Use Charge (LUC) Module

This tax is state-specific. The calculator requires a state/region selector.

#### Input Fields Required:

- **Property Market Value (₦)**: Auto-fetched from property `currentValue` or manual entry
- **Usage Type**: Owner-Occupied Residential / Rented Residential / Commercial
- **State**: e.g., Lagos, Oyo, Abuja (from property location)
- **Payment Date**: To check for early payment discount eligibility

#### Formula (General Logic - Rates vary by state/LGA):

```
LUC Owed = (Property Market Value) × (Applicable Annual Charge Rate for Usage Type)
```

#### Example Lagos 2025 Rates (Hardcoded for calculator logic):

- **Owner-Occupied Residential Rate**: **0.076%**
- **Rented Residential / Commercial Rate**: **0.76%**

#### Discount Logic:

If Payment Date is within the first 30 days of the fiscal year:

```
Final LUC = LUC Owed × 0.85 (15% discount)
```

**Note**: Rates vary by state and Local Government Area (LGA). The calculator should support state-specific rate configuration.

---

## 🏗️ Technical Architecture

### Current System Analysis

#### Existing Data Models

```prisma
model properties {
  id                    String
  propertyTaxes         Float?        // Existing field for property taxes
  purchasePrice         Float?        // For CGT calculation
  currentValue          Float?        // For property valuation
  avgRent               Float?        // Average rent
  location              String?       // For LUC state determination
  // ... other fields
}

model units {
  id                   String
  monthlyRent          Float
  status               String        // "occupied" | "vacant"
  // ... other fields
}

model leases {
  id                String
  monthlyRent       Float
  startDate         DateTime
  endDate           DateTime?
  status            String        // "active" | "terminated"
  // ... other fields
}

model expenses {
  id               String
  category         String        // Includes "Property Tax"
  amount           Float
  date             DateTime
  paidDate         DateTime?     // For tax year determination
  // ... other fields
}
```

#### Existing Financial Calculations

- ✅ Rental income calculation (handles annual vs monthly rent)
- ✅ Expense tracking (includes Property Tax category)
- ✅ Financial overview and reporting
- ✅ Property performance metrics

### Proposed Enhancements

#### 1. New Database Schema

```prisma
model tax_calculations {
  id                    String    @id @default(uuid())
  propertyId            String?   // Nullable for portfolio-level calculations
  customerId            String
  taxYear               Int       // e.g., 2026
  calculationType       String    // "annual" | "capital_gains" | "property_tax" | "stamp_duty" | "luc"

  // Income Data (Property-Specific)
  totalRentalIncome     Float     @default(0)  // Auto-calculated from active leases
  otherIncome           Float     @default(0)  // Not used (property-specific only)
  totalIncome           Float     @default(0)  // Same as totalRentalIncome

  // Deductions (Property Expenses)
  rentRelief            Float     @default(0)  // Not used (property-specific only)
  otherDeductions       Float     @default(0)  // Property expenses (auto-calculated)
  totalDeductions       Float     @default(0)  // Same as otherDeductions

  // Tax Calculation
  taxableIncome         Float     @default(0)
  personalIncomeTax     Float     @default(0)
  capitalGainsTax       Float     @default(0)
  propertyTaxes         Float     @default(0)  // Land Use Charge, etc.
  stampDuty             Float     @default(0)  // Stamp duty on agreements
  landUseCharge         Float     @default(0)  // State-specific LUC
  withholdingTax        Float     @default(0)   // 10% on rental income
  totalTaxLiability     Float     @default(0)

  // Capital Gains (if applicable)
  propertySalePrice     Float?
  propertyPurchasePrice Float?
  capitalGain           Float?
  isPrimaryResidence    Boolean   @default(false)

  // Stamp Duty (if applicable)
  stampDutyType         String?   // "lease" | "sale"
  stampDutyValue        Float?
  leaseDuration         Int?

  // Land Use Charge (if applicable)
  lucState              String?
  lucUsageType          String?   // "owner_occupied" | "rented_residential" | "commercial"
  lucPaymentDate        DateTime?

  // Metadata
  calculationDate       DateTime  @default(now())
  notes                 String?
  isFinalized           Boolean   @default(false)
  finalizedAt           DateTime?

  // Relations
  properties            properties? @relation(fields: [propertyId], references: [id])
  customers             customers    @relation(fields: [customerId], references: [id])

  @@unique([customerId, taxYear, calculationType, propertyId])
  @@index([customerId])
  @@index([taxYear])
  @@index([propertyId])
}

model tax_settings {
  id                    String    @id @default(uuid())
  customerId            String    @unique

  // Taxpayer Information
  taxpayerType          String    // "individual" | "company"
  taxIdentificationNumber String? // TIN

  // Note: Rent Relief and Other Income removed - property-specific calculations only

  // Property Tax Settings
  landUseChargeRate     Float?    // State-specific rate
  stampDutyRate          Float?    // Transaction rate

  // Preferences
  defaultTaxYear        Int       @default(2026)
  currency              String    @default("NGN")

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  customers             customers @relation(fields: [customerId], references: [id])
}
```

#### 2. Tax Calculation Service

**File**: `backend/src/services/tax-calculation.service.ts`

```typescript
// Progressive tax brackets for NTA 2025 (Nigeria Tax Act 2025)
// Effective January 1, 2026
const TAX_BRACKETS = [
  { min: 0, max: 800000, rate: 0 }, // First ₦800,000 - 0% (Tax-Free)
  { min: 800001, max: 3000000, rate: 0.15 }, // Next ₦2,200,000 - 15%
  { min: 3000001, max: 12000000, rate: 0.18 }, // Next ₦9,000,000 - 18%
  { min: 12000001, max: 25000000, rate: 0.21 }, // Next ₦13,000,000 - 21%
  { min: 25000001, max: 50000000, rate: 0.23 }, // Next ₦25,000,000 - 23%
  { min: 50000001, max: Infinity, rate: 0.25 }, // Above ₦50,000,000 - 25%
];

// Calculate Personal Income Tax using progressive rates
function calculateProgressiveTax(taxableIncome: number): number {
  let totalTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break;

    const bracketIncome = Math.min(
      remainingIncome,
      bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min + 1
    );

    totalTax += bracketIncome * bracket.rate;
    remainingIncome -= bracketIncome;
  }

  return totalTax;
}

// Calculate Capital Gains Tax
function calculateCapitalGainsTax(
  capitalGain: number,
  taxpayerType: "individual" | "company" = "individual",
  isPrimaryResidence: boolean = false
): number {
  // Primary residence exemption
  if (isPrimaryResidence) {
    return 0;
  }

  if (taxpayerType === "company") {
    return Math.round(capitalGain * 0.3 * 100) / 100; // 30% for companies
  }
  // For individuals, use progressive PIT rates
  return calculateProgressiveTax(capitalGain);
}

// Calculate Stamp Duty
function calculateStampDuty(
  value: number,
  agreementType: "lease" | "sale",
  leaseDuration?: number
): number {
  // Exemption: < ₦10 million
  if (value < 10000000) {
    return 0;
  }

  if (agreementType === "sale") {
    return Math.round(value * 0.0078 * 100) / 100; // 0.78% for sales
  }

  // Lease agreements
  const totalLeaseValue = value * (leaseDuration || 1);

  if (leaseDuration && leaseDuration < 7) {
    // Short-term (< 7 years)
    return Math.round(totalLeaseValue * 0.0078 * 100) / 100; // 0.78%
  } else if (leaseDuration && leaseDuration >= 8 && leaseDuration <= 21) {
    // Long-term (8–21 years)
    return Math.round(totalLeaseValue * 0.03 * 100) / 100; // 3%
  }

  return 0;
}

// Calculate Land Use Charge
function calculateLandUseCharge(
  propertyValue: number,
  usageType: "owner_occupied" | "rented_residential" | "commercial",
  state: string,
  paymentDate?: Date
): number {
  // State-specific rates (example: Lagos)
  const rates: Record<string, Record<string, number>> = {
    lagos: {
      owner_occupied: 0.00076, // 0.076%
      rented_residential: 0.0076, // 0.76%
      commercial: 0.0076, // 0.76%
    },
    // Add other states as needed
  };

  const stateRates = rates[state.toLowerCase()] || rates.lagos; // Default to Lagos
  const rate = stateRates[usageType] || 0.0076; // Default to 0.76%

  let lucOwed = propertyValue * rate;

  // Early payment discount (15% if paid within first 30 days of fiscal year)
  if (paymentDate) {
    const fiscalYearStart = new Date(paymentDate.getFullYear(), 0, 1);
    const daysDiff = Math.floor(
      (paymentDate.getTime() - fiscalYearStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 30) {
      lucOwed = lucOwed * 0.85; // 15% discount
    }
  }

  return Math.round(lucOwed * 100) / 100;
}
```

---

## 📊 Feature Specifications

### 1. Property Tax Calculator

**User Flow**:

1. Navigate to "Tax Calculator" from Property Owner Dashboard
2. **Select a property** (required) - dropdown shows all properties
3. **Select tax year** (2020-2026) - dropdown with available years
4. System **auto-fetches and displays**:
   - **Rental Income**: Auto-calculated from active leases for the selected property and year (financial reports logic)
   - **Property Expenses**: Auto-calculated from expense records (maintenance, repairs, etc.) for the selected property and year (financial reports logic)
   - **Property Prices**: Auto-fetched for capital gains calculation (if applicable)
5. User can override any auto-fetched values if needed
6. System displays real-time calculation:
   - **Property Revenue**: Total rental income from active leases
   - **Property Expenses**: Total expenses (deductions)
   - **Net Taxable Income**: Revenue - Expenses
   - **Progressive Tax Breakdown**: Tax calculated on net taxable income using NTA 2025 brackets
   - **Withholding Tax**: 10% on rental income
   - **Property Taxes**: Land Use Charge, Stamp Duty (if applicable)
   - **Capital Gains Tax**: If sale/purchase prices provided
   - **Total Tax Liability**: Amount owed to tax office
7. User can save calculation or generate report

**Key Features**:

- ✅ **Property-specific calculations** - one property at a time
- ✅ **Auto-calculate rental income** from active leases (financial reports logic)
- ✅ **Auto-calculate property expenses** from expense records (financial reports logic)
- ✅ **Real-time calculation updates** as values change
- ✅ **Visual tax bracket breakdown** showing progressive rates (NTA 2025)
- ✅ **Capital Gains Tax calculator** (optional - if sale prices provided)
- ✅ **Stamp Duty calculator** (for lease/sale agreements)
- ✅ **Land Use Charge calculator** (state-specific)
- ✅ **Save calculations** for future reference
- ✅ **Export to PDF/Excel** for tax filing

---

## 🎯 Implementation Status

### ✅ Completed (Current Implementation)

- ✅ Database schema (tax_calculations, tax_settings)
- ✅ Tax calculation service (property-specific calculations)
- ✅ API endpoints (calculate, settings, history, auto-fetch)
- ✅ Frontend Tax Calculator component
- ✅ Property selection (required field)
- ✅ Auto-fetch rental income from active leases (financial reports logic)
- ✅ Auto-fetch property expenses from expense records (financial reports logic)
- ✅ Real-time tax calculation
- ✅ Tax history and settings management
- ✅ Feature gating (Professional and Business plans)
- ✅ Progressive tax brackets (NTA 2025 - 6 brackets)
- ✅ Capital Gains Tax with primary residence exemption

### 📋 Current Calculation Flow

1. **User selects property** (required) from dropdown
2. **User selects tax year** (2020-2026) from dropdown
3. **System auto-fetches** (using financial reports logic):
   - Rental income from active leases for that property/year
   - Property expenses (excluding Property Tax) for that property/year (using paidDate for year determination)
   - Property purchase/sale prices (if available)
4. **System calculates**:
   - Net Taxable Income = Rental Income - Property Expenses
   - Personal Income Tax (progressive rates on net taxable income - NTA 2025 brackets)
   - Withholding Tax (10% on rental income)
   - Property Taxes (from expenses categorized as "Property Tax")
   - Capital Gains Tax (if sale/purchase prices provided, with primary residence exemption)
   - Total Tax Liability = Sum of all taxes
5. **User can save** calculation for future reference

### 🎯 Key Implementation Details

- **Scope**: Property-specific calculations only (not personal income or rent relief)
- **Formula**: Tax = Progressive Tax(Rental Income - Property Expenses) + Withholding Tax + Property Taxes + CGT
- **Data Sources**:
  - Rental Income: `leases` table (active leases for property/year) - financial reports logic
  - Property Expenses: `expenses` table (non-Property Tax expenses for property/year, using paidDate for year) - financial reports logic
  - Property Taxes: `expenses` table (Property Tax category for property/year)

### 🚧 Pending Implementation

- ⏳ Stamp Duty Module (lease/sale agreements)
- ⏳ Land Use Charge Module (state-specific rates)
- ⏳ Cost of Improvements/Renovations for CGT
- ⏳ Disposal Costs for CGT
- ⏳ Property Type (Primary Residence) setting
- ⏳ State/LGA selector for LUC

---

**Document Version**: 3.0  
**Last Updated**: December 2025  
**Status**: ✅ Implemented - Property-Specific Tax Calculator (NTA 2025 Compliant)  
**Tax Reform Reference**:

- [Baker Tilly Nigeria - Nigeria's 2025 Tax Reform Acts Explained](https://www.bakertilly.ng/insights/nigerias-2025-tax-reform-acts-explained)
- Nigeria Tax Act (NTA) 2025
