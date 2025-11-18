# 🎯 Dual Pricing Plan Implementation

Complete implementation of dual pricing plans for Property Owners/Managers and Property Developers.

---

## 📋 **Overview**

The pricing system supports two distinct user types with tailored plans:

1. **Property Owners/Managers** - For landlords, property managers, and facility management companies
2. **Property Developers** - For construction management, project tracking & budgeting

---

## 🏗️ **Architecture**

### **File Structure**

```
src/
├── types/
│   └── pricing.ts                    # Pricing data types and constants
├── components/
│   ├── PricingPage.tsx               # Standalone pricing page
│   ├── PricingComparison.tsx         # Feature comparison table
│   └── LandingPage.tsx               # Integrated pricing section
```

---

## 💰 **Pricing Plans**

### **Property Owners/Managers**

| Plan | Price | Units | Users | Storage |
|------|-------|-------|-------|---------|
| **Starter** | ₦9,900/mo | 20 | 2 | 5GB |
| **Professional** | ₦29,900/mo | 200 | 5 | 25GB |
| **Business** | ₦69,900/mo | 500 | 10 | 50GB |

### **Property Developers**

| Plan | Price | Projects | Users | Storage |
|------|-------|----------|-------|---------|
| **Project Lite** | ₦14,900/mo | 1 | 5 | 10GB |
| **Project Pro** | ₦39,900/mo | 3 | 15 | 50GB |
| **Project Enterprise** | ₦99,900/mo | 10 | Unlimited | Unlimited |

---

## 🧩 **Add-Ons**

| Add-On | Price | Applies To |
|--------|-------|------------|
| **Additional User** | ₦1,500/user/month | Both |
| **Extra Unit** | ₦60/unit/month | Property Owners |
| **Extra Project** | ₦14,900/project/month | Developers |
| **Extra Storage** | ₦1,000/GB/month | Both |
| **Basic Onboarding** | ₦25,000 one-time | Both |
| **Premium Onboarding** | ₦75,000 one-time | Both |

---

## 🎨 **Features**

### **1. Tab-Based Navigation**

Users can switch between Property Owner and Property Developer plans using a tab interface:

```tsx
<Tabs value={selectedUserType} onValueChange={setSelectedUserType}>
  <TabsList>
    <TabsTrigger value="property-owner">
      <Building2 /> Property Owners
    </TabsTrigger>
    <TabsTrigger value="property-developer">
      <Hammer /> Property Developers
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### **2. Dynamic Plan Cards**

Plans are rendered dynamically from data:

```tsx
{PROPERTY_OWNER_PLANS.map((plan) => (
  <PricingCard key={plan.id} plan={plan} />
))}
```

### **3. Popular Plan Highlighting**

The most popular plan is highlighted with:
- Orange border
- "Most Popular" badge
- Slight scale increase
- Orange CTA button

### **4. Contextual Add-Ons**

Add-ons are filtered based on selected user type:

```tsx
{ADD_ONS.filter((addon) =>
  addon.userTypes.includes(selectedUserType)
).map((addon) => (
  <AddOnCard key={addon.id} addon={addon} />
))}
```

### **5. Currency Formatting**

All prices are formatted in Nigerian Naira:

```tsx
formatCurrency(9900) // Returns "₦9,900"
```

---

## 📊 **Data Structure**

### **PricingPlan Interface**

```typescript
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  userType: UserType;
  popular?: boolean;
  features: PricingFeature[];
  limits: {
    units?: number;
    projects?: number;
    users: number;
    storage: string;
  };
  cta: {
    text: string;
    action: string;
  };
}
```

### **AddOn Interface**

```typescript
interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  userTypes: UserType[];
}
```

---

## 🎯 **Usage**

### **Standalone Pricing Page**

```tsx
import { PricingPage } from './components/PricingPage';

<PricingPage
  onSelectPlan={(planId, userType) => {
    console.log(`Selected: ${planId} for ${userType}`);
  }}
  onContactSales={() => {
    // Navigate to contact page
  }}
/>
```

### **Integrated in Landing Page**

The pricing section is now integrated directly into the landing page with:
- Tab navigation for user type selection
- Dynamic plan rendering
- Contextual add-ons display
- FAQ section

---

## 🎨 **Design System**

### **Colors**

| Element | Color |
|---------|-------|
| Popular Plan Border | Orange-500 (#f97316) |
| Popular Badge | Orange-500 background |
| Default CTA | Gray-900 (#111827) |
| Popular CTA | Orange-500 (#f97316) |
| Feature Checkmark | Green-500 (#22c55e) |

### **Typography**

| Element | Size | Weight |
|---------|------|--------|
| Plan Name | 2xl (24px) | Bold |
| Price | 4xl (36px) | Bold |
| Description | Base (16px) | Normal |
| Features | sm (14px) | Normal |

### **Spacing**

- Card padding: 24px (p-6)
- Feature spacing: 12px (space-y-3)
- Section spacing: 96px (mt-24)
- Grid gap: 32px (gap-8)

---

## 📱 **Responsive Design**

### **Breakpoints**

```tsx
// Mobile: Single column
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">

// Tablet: 2 columns for add-ons
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### **Tab Labels**

```tsx
// Hide "Property" text on mobile
<span className="hidden sm:inline">Property</span> Owners
```

---

## ✅ **Features Checklist**

### **Property Owner Plans**
- ✅ Starter (₦9,900/mo)
- ✅ Professional (₦29,900/mo) - Popular
- ✅ Business (₦69,900/mo)

### **Property Developer Plans**
- ✅ Project Lite (₦14,900/mo)
- ✅ Project Pro (₦39,900/mo) - Popular
- ✅ Project Enterprise (₦99,900/mo)

### **Add-Ons**
- ✅ Additional User
- ✅ Extra Unit (Property Owners only)
- ✅ Extra Project (Developers only)
- ✅ Extra Storage
- ✅ Basic Onboarding
- ✅ Premium Onboarding

### **UI Features**
- ✅ Tab-based user type selection
- ✅ Dynamic plan rendering
- ✅ Popular plan highlighting
- ✅ Contextual add-ons filtering
- ✅ Currency formatting (NGN)
- ✅ Responsive design
- ✅ FAQ section
- ✅ CTA buttons
- ✅ Feature lists with checkmarks

---

## 🚀 **Integration Points**

### **Navigation**

```tsx
// From landing page pricing section
onClick={onNavigateToGetStarted || onNavigateToLogin}

// For enterprise/contact plans
onClick={onNavigateToContact}
```

### **Plan Selection**

```tsx
onSelectPlan={(planId, userType) => {
  // Handle plan selection
  // Could navigate to signup with pre-selected plan
  // Or store in state for checkout
}}
```

---

## 📝 **Customization**

### **Adding a New Plan**

1. Add to `PROPERTY_OWNER_PLANS` or `PROPERTY_DEVELOPER_PLANS` in `src/types/pricing.ts`
2. Define features, limits, and pricing
3. Set `popular: true` if it should be highlighted

```typescript
{
  id: 'new-plan',
  name: 'New Plan',
  description: 'Description here',
  price: 19900,
  currency: 'NGN',
  billingPeriod: 'month',
  userType: 'property-owner',
  popular: false,
  limits: {
    units: 50,
    users: 3,
    storage: '15GB',
  },
  features: [
    { text: 'Feature 1', included: true },
    { text: 'Feature 2', included: false },
  ],
  cta: {
    text: 'Start Free Trial',
    action: 'signup',
  },
}
```

### **Adding a New Add-On**

```typescript
{
  id: 'new-addon',
  name: 'New Add-On',
  description: 'Description here',
  price: 5000,
  unit: 'per month',
  userTypes: ['property-owner', 'property-developer'], // or just one
}
```

### **Changing Popular Plan**

Set `popular: true` on the desired plan and `popular: false` (or remove) from others.

---

## 🎯 **Best Practices**

1. **Keep Features Concise** - Limit to 6-8 features per plan for readability
2. **Consistent Pricing** - Use whole numbers (9900 instead of 9899)
3. **Clear Descriptions** - Make plan descriptions specific to target audience
4. **Logical Progression** - Ensure features build logically from tier to tier
5. **CTA Clarity** - Use "Start Free Trial" for self-service, "Contact Sales" for enterprise

---

## 🧪 **Testing**

### **Manual Testing Checklist**

- [ ] Switch between Property Owner and Developer tabs
- [ ] Verify correct plans display for each user type
- [ ] Check "Most Popular" badge appears on correct plan
- [ ] Verify add-ons filter based on user type
- [ ] Test CTA buttons navigate correctly
- [ ] Check currency formatting (₦ symbol)
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Test feature checkmarks display correctly

### **Visual Regression**

- [ ] Popular plan has orange border and badge
- [ ] Cards align properly in grid
- [ ] Spacing is consistent
- [ ] Typography is readable
- [ ] Colors match design system

---

## 📚 **Related Files**

- `src/types/pricing.ts` - Pricing data and types
- `src/components/PricingPage.tsx` - Standalone pricing page
- `src/components/PricingComparison.tsx` - Feature comparison table
- `src/components/LandingPage.tsx` - Integrated pricing section
- `src/components/ui/tabs.tsx` - Tab component
- `src/components/ui/card.tsx` - Card component
- `src/components/ui/badge.tsx` - Badge component

---

## 🎊 **Summary**

The dual pricing system provides:

✅ **Clear Segmentation** - Separate plans for owners and developers  
✅ **Flexible Options** - 3 tiers per user type  
✅ **Customization** - 6 add-ons for extended functionality  
✅ **Modern UI** - Tab-based navigation with popular plan highlighting  
✅ **Responsive Design** - Works on all devices  
✅ **Easy Maintenance** - Data-driven approach for easy updates  

The implementation is production-ready and fully integrated into the landing page!

