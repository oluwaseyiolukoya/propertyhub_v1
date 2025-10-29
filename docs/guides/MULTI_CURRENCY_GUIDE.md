# 💱 Multi-Currency System Guide

## Overview

This guide explains how to implement and use the multi-currency system in PropertyHub, allowing owners to manage properties in different currencies while maintaining accurate financial reporting.

---

## 🎯 How It Works

### Core Concept

1. **Property-Level Currency**: Each property has its own currency (set when creating the property)
2. **Store in Original Currency**: All transactions (rent, expenses) are stored in the property's currency
3. **Owner's Base Currency**: Each owner sets a preferred "base currency" for reporting
4. **On-Demand Conversion**: Dashboard converts and displays amounts in both currencies

### Example Scenario

```
Owner: John Smith (Base Currency: USD)

Property 1: "Lagos Apartments" (Currency: NGN)
- Monthly Rent: ₦500,000
- Security Deposit: ₦1,000,000
- Dashboard shows: $610 ($1 = ₦820)

Property 2: "New York Loft" (Currency: USD)
- Monthly Rent: $2,000
- Security Deposit: $4,000
- Dashboard shows: $2,000

Consolidated Dashboard (in USD):
- Total Monthly Income: $2,610 USD
  ├─ Lagos Apartments: $610 (₦500,000)
  └─ New York Loft: $2,000

Both amounts preserved in database ✅
```

---

## 📋 Implementation Steps

### Step 1: Update Database Schema

Add base currency to users and exchange rates table:

```prisma
// backend/prisma/schema.prisma

model users {
  id                String              @id
  customerId        String?
  name              String
  email             String              @unique
  baseCurrency      String              @default("NGN")  // ← ADD THIS
  // ... rest of fields
}

model exchange_rates {
  id            String   @id @default(cuid())
  fromCurrency  String   // e.g., "NGN"
  toCurrency    String   // e.g., "USD"
  rate          Float    // e.g., 0.0012
  date          DateTime @default(now())
  source        String?  // e.g., "manual", "api"
  createdAt     DateTime @default(now())
  
  @@unique([fromCurrency, toCurrency, date])
  @@index([date])
}
```

Apply the changes:

```bash
cd backend
npx prisma db push
```

### Step 2: Update Property Creation

When creating a property, the currency field is already there:

```typescript
// Backend: backend/src/routes/properties.ts

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const {
    name,
    propertyType,
    address,
    currency, // ← User selects this
    // ... other fields
  } = req.body;

  const property = await prisma.properties.create({
    data: {
      id: generateId(),
      customerId: user.customerId,
      ownerId: user.id,
      currency: currency || 'NGN', // Default to NGN
      // ... other fields
    }
  });

  res.json(property);
});
```

### Step 3: Update Financial Dashboard

Create an endpoint that returns finances in both currencies:

```typescript
// Backend: backend/src/routes/dashboard.ts

router.get('/owner/financials', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  // Get owner's base currency
  const owner = await prisma.users.findUnique({
    where: { id: user.id },
    select: { baseCurrency: true }
  });
  const baseCurrency = owner?.baseCurrency || 'NGN';

  // Get all properties with their currencies
  const properties = await prisma.properties.findMany({
    where: { ownerId: user.id },
    include: {
      leases: {
        where: { status: 'active' },
        select: {
          monthlyRent: true,
          currency: true,
        }
      }
    }
  });

  // Calculate income by property
  const propertyFinancials = properties.map(property => {
    const monthlyIncome = property.leases.reduce(
      (sum, lease) => sum + lease.monthlyRent,
      0
    );

    // Convert to base currency
    const converted = convertCurrency(
      monthlyIncome,
      property.currency,
      baseCurrency
    );

    return {
      propertyId: property.id,
      propertyName: property.name,
      originalAmount: monthlyIncome,
      originalCurrency: property.currency,
      convertedAmount: converted.convertedAmount,
      convertedCurrency: baseCurrency,
      exchangeRate: converted.exchangeRate,
      formatted: {
        original: converted.formattedOriginal,
        converted: converted.formattedConverted,
        display: `${converted.formattedConverted} (${converted.formattedOriginal})`
      }
    };
  });

  // Calculate totals
  const totalOriginal = propertyFinancials.reduce(
    (sum, p) => sum + p.convertedAmount,
    0
  );

  res.json({
    baseCurrency,
    properties: propertyFinancials,
    totals: {
      monthlyIncome: totalOriginal,
      formatted: formatCurrency(totalOriginal, baseCurrency)
    }
  });
});
```

---

## 🎨 Frontend Implementation

### 1. Display Property Finances

```tsx
// src/components/PropertyFinancialCard.tsx

import { formatCurrency, formatDualCurrency } from '@/lib/currency';

interface PropertyFinancial {
  propertyName: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
}

export function PropertyFinancialCard({ data }: { data: PropertyFinancial }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{data.propertyName}</h3>
      <div className="mt-2">
        <div className="text-2xl font-bold">
          {formatCurrency(data.convertedAmount, data.convertedCurrency)}
        </div>
        {data.originalCurrency !== data.convertedCurrency && (
          <div className="text-sm text-gray-500">
            {formatCurrency(data.originalAmount, data.originalCurrency)} {data.originalCurrency}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Dashboard Summary with Multi-Currency

```tsx
// src/components/FinancialDashboard.tsx

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';

interface FinancialSummary {
  baseCurrency: string;
  properties: PropertyFinancial[];
  totals: {
    monthlyIncome: number;
    formatted: string;
  };
}

export function FinancialDashboard({ data }: { data: FinancialSummary }) {
  return (
    <div className="space-y-6">
      {/* Total Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          Total Monthly Income (Base Currency: {data.baseCurrency})
        </h2>
        <div className="text-4xl font-bold text-green-600">
          {data.totals.formatted}
        </div>
      </Card>

      {/* Per-Property Breakdown */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Income by Property</h2>
        <div className="space-y-4">
          {data.properties.map((property) => (
            <div key={property.propertyId} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{property.propertyName}</div>
                <div className="text-sm text-gray-500">
                  {property.formatted.display}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(property.convertedAmount, data.baseCurrency)}
                </div>
                {property.originalCurrency !== data.baseCurrency && (
                  <div className="text-xs text-gray-400">
                    @ Rate: 1 {property.originalCurrency} = {property.exchangeRate.toFixed(4)} {data.baseCurrency}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 3. Currency Selector Component

```tsx
// src/components/CurrencySelector.tsx

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSupportedCurrencies } from '@/lib/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
}

export function CurrencySelector({ value, onChange, label }: CurrencySelectorProps) {
  const currencies = getSupportedCurrencies();

  return (
    <div>
      {label && <label className="text-sm font-medium mb-2 block">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.name} ({currency.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### 4. Use in Add Property Form

```tsx
// src/components/AddPropertyPage.tsx

import { CurrencySelector } from './CurrencySelector';

export function AddPropertyPage() {
  const [formData, setFormData] = useState({
    name: '',
    currency: 'NGN', // Default
    // ... other fields
  });

  return (
    <form>
      {/* ... other fields ... */}
      
      <CurrencySelector
        label="Property Currency"
        value={formData.currency}
        onChange={(currency) => setFormData({ ...formData, currency })}
      />
      
      {/* ... rest of form ... */}
    </form>
  );
}
```

---

## 📊 User Settings: Change Base Currency

Allow owners to set their preferred base currency:

```tsx
// src/components/OwnerSettings.tsx

import { CurrencySelector } from './CurrencySelector';
import { updateUserSettings } from '@/lib/api/users';

export function OwnerSettings() {
  const [baseCurrency, setBaseCurrency] = useState('NGN');

  const handleSave = async () => {
    await updateUserSettings({ baseCurrency });
    toast.success('Base currency updated! Dashboard will now show totals in ' + baseCurrency);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Financial Settings</h2>
      
      <CurrencySelector
        label="Base Currency for Reports"
        value={baseCurrency}
        onChange={setBaseCurrency}
      />
      
      <p className="text-sm text-gray-500 mt-2">
        Your dashboard will show all finances converted to this currency.
        Individual property currencies remain unchanged.
      </p>
      
      <Button onClick={handleSave} className="mt-4">
        Save Settings
      </Button>
    </Card>
  );
}
```

---

## 🔄 Updating Exchange Rates

### Option 1: Manual Admin Update

```tsx
// Admin panel to update exchange rates

import { updateExchangeRate } from '@/lib/api/currency';

export function ExchangeRateManager() {
  const handleUpdate = async () => {
    await updateExchangeRate({
      fromCurrency: 'NGN',
      toCurrency: 'USD',
      rate: 0.0012, // 1 NGN = 0.0012 USD
      source: 'manual'
    });
  };

  return (
    <Card className="p-6">
      <h2>Update Exchange Rates</h2>
      {/* Form to update rates */}
    </Card>
  );
}
```

### Option 2: Automatic API Update (Future Enhancement)

```typescript
// backend/src/lib/currency.ts

// You can integrate with APIs like:
// - exchangerate-api.com (free tier available)
// - fixer.io
// - currencyapi.com

async function fetchLatestRates() {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/NGN');
  const data = await response.json();
  
  // Update EXCHANGE_RATES object
  EXCHANGE_RATES.NGN = data.rates;
}
```

---

## 📈 Reports & Analytics

### Multi-Currency Income Report

```tsx
// Show income trend with currency breakdown

export function IncomeReportChart() {
  return (
    <Card className="p-6">
      <h2>Monthly Income Trend</h2>
      
      {/* Stacked bar chart */}
      <div className="space-y-2 mt-4">
        {months.map(month => (
          <div key={month} className="flex items-center gap-2">
            <span className="w-20">{month}</span>
            
            {/* NGN Properties */}
            <div className="bg-blue-500 h-6" style={{width: ngnIncome[month]}} />
            
            {/* USD Properties */}
            <div className="bg-green-500 h-6" style={{width: usdIncome[month]}} />
            
            {/* Total in base currency */}
            <span className="ml-2">{totalIncome[month]}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500" />
          <span>NGN Properties</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500" />
          <span>USD Properties</span>
        </div>
      </div>
    </Card>
  );
}
```

---

## ✅ Best Practices

### 1. **Always Store Original Currency**
```typescript
// ✅ Good: Store original amount and currency
await prisma.leases.create({
  data: {
    monthlyRent: 500000,
    currency: 'NGN',
    // ... other fields
  }
});

// ❌ Bad: Don't convert before storing
await prisma.leases.create({
  data: {
    monthlyRent: 610, // Converted to USD - loses precision!
    currency: 'USD',
  }
});
```

### 2. **Convert on Display, Not on Storage**
```typescript
// ✅ Good: Convert when displaying
const lease = await prisma.leases.findUnique({ where: { id } });
const converted = convertCurrency(lease.monthlyRent, lease.currency, baseCurrency);
return { ...lease, convertedAmount: converted.convertedAmount };

// ❌ Bad: Don't update database with converted values
await prisma.leases.update({
  where: { id },
  data: { monthlyRent: convertedAmount } // Don't do this!
});
```

### 3. **Show Both Currencies When Different**
```tsx
// ✅ Good: Show original + converted
<div>
  <div className="text-2xl">$610 USD</div>
  <div className="text-sm text-gray-500">₦500,000 NGN</div>
</div>

// ❌ Bad: Only show converted amount
<div className="text-2xl">$610</div>
```

### 4. **Update Exchange Rates Regularly**
```typescript
// Set up a cron job or manual update
// Daily or weekly depending on volatility
```

---

## 🎯 Summary

**The System You Have Now:**

1. ✅ **Property-level currency**: Each property has its own currency
2. ✅ **Original amounts preserved**: All financial data stored in original currency
3. ✅ **Base currency for reports**: Owner sets preferred currency for dashboard
4. ✅ **Automatic conversion**: Dashboard converts and displays in base currency
5. ✅ **Dual display**: Shows both original and converted amounts
6. ✅ **Accurate tracking**: Historical exchange rates for precise reporting

**Benefits:**

- ✅ Owner can manage properties in different countries/currencies
- ✅ All original data is preserved (no precision loss)
- ✅ Easy consolidated reporting in owner's preferred currency
- ✅ Transparent display of exchange rates
- ✅ Flexible for future currency additions

---

## 🚀 Next Steps

1. **Test Locally**: Add properties with different currencies
2. **Set base currency**: Update user settings to set base currency
3. **View dashboard**: See consolidated finances in base currency
4. **Update rates**: Periodically update exchange rates
5. **Deploy**: When ready, push to production

**Your multi-currency system is ready!** 🎉

