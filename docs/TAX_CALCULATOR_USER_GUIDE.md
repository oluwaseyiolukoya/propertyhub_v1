# Tax Calculator User Guide
## Nigeria Property Tax Calculator (NTA 2025 Compliant)

---

## 📋 Overview

The Tax Calculator helps property owners calculate their tax obligations for each property based on Nigeria Tax Act (NTA) 2025. It automatically fetches rental income and expenses from your property records and calculates the tax owed to the tax office.

**Key Features:**
- ✅ Auto-calculates rental income from active leases
- ✅ Auto-calculates property expenses (deductions)
- ✅ Applies NTA 2025 progressive tax rates (6 brackets)
- ✅ Optional: Capital Gains Tax, Stamp Duty, Land Use Charge
- ✅ Property-specific calculations only (not personal income)

---

## 🚀 How to Use the Tax Calculator

### Step 1: Access the Tax Calculator

1. Navigate to your **Property Owner Dashboard**
2. Click on **"Tax Calculator"** in the navigation menu
3. You'll see the calculator interface with three tabs:
   - **Calculator** (default) - Calculate new tax
   - **History** - View past calculations
   - **Settings** - Configure taxpayer information

---

### Step 2: Select Tax Year and Property

#### Tax Year (Required)
- **What you'll see:** A dropdown menu with years from 2020 to 2026
- **What to do:** Select the tax year you want to calculate for
- **Example:** Select "2025" to calculate taxes for the 2025 tax year

#### Property (Required)
- **What you'll see:** A dropdown menu listing all your properties
- **What to do:** Select the property you want to calculate taxes for
- **Example:** Select "Adewole Estate" to calculate taxes for that property

**Note:** Both fields are required. You cannot proceed without selecting them.

---

### Step 3: Review Auto-Fetched Data

Once you select a property and tax year, the system automatically:

#### ✅ Rental Income (Auto-Calculated)
- **What it does:** Calculates total rental income from all active leases for the selected property and year
- **How it works:** Uses the same logic as your financial reports
- **What you'll see:** This is calculated in the background (not shown as a field, but used in calculations)

#### ✅ Property Expenses (Auto-Fetched)
- **What you'll see:** A field showing the total expenses (₦0 or the calculated amount)
- **What it includes:** All expenses with status "paid" or "pending" for the selected property and year
- **Excludes:** Expenses categorized as "Property Tax" (shown separately)
- **Expense Breakdown:** If expenses exist, you'll see a breakdown by category:
  ```
  Expense Breakdown (by Category)
  ┌─────────────────────────────┐
  │ Maintenance    ₦50,000       │
  │ Repairs        ₦30,000       │
  │ Management     ₦20,000       │
  ├─────────────────────────────┤
  │ Total Deductions  ₦100,000  │
  └─────────────────────────────┘
  ```
- **Override option:** You can manually change the amount if needed

**If no expenses found:**
- You'll see a yellow warning: "No expenses found for this property in [year]"
- You can still enter expenses manually or ensure expenses are recorded in the Expenses section

---

### Step 4: Optional - Capital Gains Tax (If Selling Property)

**When to use:** Only if you're calculating tax on a property sale

#### Fields You'll See:

1. **Sale Price (₦)**
   - **Auto-fetched:** From property's current value
   - **Manual entry:** If different from auto-fetched value
   - **Example:** ₦50,000,000

2. **Purchase Price (₦)**
   - **Auto-fetched:** From property's purchase price
   - **Manual entry:** If different from auto-fetched value
   - **Example:** ₦30,000,000

3. **Cost of Improvements (₦)** - Optional
   - **What it is:** Money spent on renovations, upgrades, etc.
   - **Example:** ₦5,000,000 for renovations

4. **Disposal Costs (₦)** - Optional
   - **What it is:** Agent fees, legal fees, etc. paid when selling
   - **Example:** ₦500,000 for agent commission

5. **Primary Residence Checkbox**
   - **What it does:** If checked, exempts the property from Capital Gains Tax
   - **When to check:** If this is your primary residence (where you live)
   - **Note:** Primary residences are exempt from CGT under NTA 2025

**Calculation:**
- **Total Allowable Costs** = Purchase Price + Improvements + Disposal Costs
- **Chargeable Gain** = Sale Price - Total Allowable Costs
- **CGT Rate:** 
  - Individual: Progressive PIT rates (15-25%)
  - Company: 30% flat rate
  - Primary Residence: 0% (exempt)

---

### Step 5: Optional - Stamp Duty (For Agreements)

**When to use:** If you need to calculate stamp duty on lease or sale agreements

#### Fields You'll See:

1. **Agreement Type**
   - **Options:** 
     - Lease Agreement
     - Sale Agreement

2. **Value (₦)**
   - **For Leases:** Annual Rent Value
   - **For Sales:** Total Property Value
   - **Example:** ₦12,000,000

3. **Lease Duration (Years)** - Only for leases
   - **Range:** 1-21 years
   - **Example:** 5 years

**Rates:**
- **Exemption:** If value < ₦10 million, rate is 0%
- **Sales:** 0.78% of property value
- **Short-term leases (< 7 years):** 0.78% of total lease value
- **Long-term leases (8-21 years):** 3% of total lease value

**Example:**
- Lease: ₦12M annual rent × 5 years = ₦60M total
- Since 5 years < 7 years: 0.78% × ₦60M = ₦468,000 stamp duty

---

### Step 6: Optional - Land Use Charge (State-Specific)

**When to use:** If you need to calculate state-specific property tax

#### Fields You'll See:

1. **State**
   - **What to enter:** State name (e.g., "Lagos", "Oyo", "Abuja")
   - **Example:** Lagos

2. **Usage Type**
   - **Options:**
     - Owner-Occupied Residential
     - Rented Residential
     - Commercial

3. **Payment Date**
   - **What it is:** Date you plan to pay (for early payment discount)
   - **Format:** Date picker (MM/DD/YYYY)
   - **Example:** January 15, 2025

**Rates (Example - Lagos 2025):**
- **Owner-Occupied:** 0.076% of property value
- **Rented/Commercial:** 0.76% of property value

**Early Payment Discount:**
- **15% discount** if paid within first 30 days of fiscal year
- **Example:** If LUC is ₦100,000 and paid by Jan 30, you pay ₦85,000

---

### Step 7: Calculate Tax

1. **Click the "Calculate Tax" button** (purple button at the bottom)
2. **Wait for calculation** (shows "Calculating..." with spinner)
3. **View results** in the right panel

---

## 📊 Understanding the Results

### Results Panel Layout

#### 1. Total Tax Liability (Top Section - Red/Orange)
- **What it shows:** The total amount you owe to the tax office
- **Format:** Large, bold number in red
- **Example:** ₦2,450,000

#### 2. Tax Breakdown (Middle Section)

Shows each component of your tax:

**Income & Deductions:**
- **Total Rental Income:** Sum of all rental income from active leases
- **Property Expenses:** Total deductions (reduces taxable income)
- **Net Taxable Income:** Rental Income - Expenses

**Tax Components:**
- **Personal Income Tax:** Calculated using progressive rates on net taxable income
  - First ₦800,000: 0% (Tax-Free)
  - Next ₦2,200,000: 15%
  - Next ₦9,000,000: 18%
  - Next ₦13,000,000: 21%
  - Next ₦25,000,000: 23%
  - Above ₦50,000,000: 25%

- **Capital Gains Tax:** Only shown if you entered sale/purchase prices
- **Stamp Duty:** Only shown if you entered stamp duty information
- **Land Use Charge:** Only shown if you entered LUC information
- **Property Taxes:** From expenses categorized as "Property Tax"
- **Withholding Tax:** 10% of rental income

#### 3. Tax Bracket Breakdown (Bottom Section)

Shows how your income is taxed across different brackets:

```
Tax Bracket Breakdown
₦0 - ₦800,000          ₦0 (0%)
₦800,001 - ₦3,000,000  ₦330,000 (15%)
₦3,000,001 - ₦12,000,000  ₦1,620,000 (18%)
```

---

## 💡 Example Calculation

### Scenario:
- **Property:** Adewole Estate
- **Tax Year:** 2025
- **Rental Income:** ₦5,000,000 (auto-calculated from leases)
- **Property Expenses:** ₦500,000 (auto-fetched)
- **Net Taxable Income:** ₦4,500,000

### Calculation:
1. **Taxable Income:** ₦4,500,000
2. **Tax Brackets:**
   - First ₦800,000: ₦0 (0%)
   - Next ₦2,200,000: ₦330,000 (15%)
   - Next ₦1,500,000: ₦270,000 (18%)
   - **Total PIT:** ₦600,000
3. **Withholding Tax:** ₦500,000 (10% of rental income)
4. **Total Tax Liability:** ₦1,100,000

---

## 🔍 Common Questions

### Q: Why don't I see rental income as a field?
**A:** Rental income is auto-calculated in the background from your active leases. It's used in the calculation but not shown as an input field.

### Q: What if I have no expenses?
**A:** You can still calculate tax. The system will use ₦0 for expenses, meaning your full rental income is taxable.

### Q: Do I need to fill all optional sections?
**A:** No. Only fill sections that apply:
- **Capital Gains:** Only if selling property
- **Stamp Duty:** Only if calculating duty on agreements
- **Land Use Charge:** Only if calculating state-specific tax

### Q: Can I save my calculation?
**A:** Yes! Calculations are automatically saved when you click "Calculate Tax". View them in the "History" tab.

### Q: What if I make a mistake?
**A:** You can:
1. Recalculate with corrected values
2. View and delete old calculations in the "History" tab
3. Override auto-fetched values manually

---

## ⚙️ Settings Tab

### Taxpayer Information

Configure your taxpayer details:

1. **Taxpayer Type**
   - **Individual:** For personal property ownership
   - **Company:** For corporate property ownership
   - **Impact:** Affects Capital Gains Tax rate (30% for companies)

2. **Tax Identification Number (TIN)**
   - **What it is:** Your tax ID from FIRS
   - **Optional:** Can be left blank

3. **Default Tax Year**
   - **What it does:** Sets the default year when opening calculator
   - **Default:** Current year

---

## 📜 History Tab

### View Past Calculations

1. **Click "History" tab**
2. **See list of all calculations:**
   - Property name
   - Tax year
   - Total tax liability
   - Status (Draft/Finalized)
   - Date created

3. **Click on a calculation** to view details:
   - Full breakdown
   - All tax components
   - Tax brackets used

4. **Actions:**
   - **Finalize:** Mark calculation as final (cannot be edited)
   - **Delete:** Remove calculation from history

---

## ✅ Checklist: Before Calculating

- [ ] Selected tax year (2020-2026)
- [ ] Selected property
- [ ] Reviewed auto-fetched expenses (or entered manually)
- [ ] (Optional) Entered Capital Gains info if selling
- [ ] (Optional) Entered Stamp Duty info if needed
- [ ] (Optional) Entered Land Use Charge info if needed

---

## 🎯 Quick Start Guide

1. **Open Tax Calculator**
2. **Select Tax Year** → Choose year (e.g., 2025)
3. **Select Property** → Choose property (e.g., Adewole Estate)
4. **Review Expenses** → Check auto-fetched amount or enter manually
5. **Click "Calculate Tax"** → View results
6. **Review Results** → See total tax liability and breakdown

**That's it!** The calculator handles the rest automatically.

---

## 📞 Need Help?

- **Documentation:** See `docs/NIGERIA_TAX_REFORM_2026_IMPLEMENTATION.md` for technical details
- **Tax Rates:** Based on NTA 2025 (effective January 1, 2026)
- **Disclaimer:** Calculations are estimates. Consult a tax professional for official tax filing.

---

**Last Updated:** December 2025  
**Version:** 1.0  
**Compliance:** NTA 2025


