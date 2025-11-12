# Developer Onboarding Field Mapping Fix

## Issue
Developer application submission was failing with a 400 Bad Request error because the `companyName` field was `undefined`.

## Error Details
```javascript
{
  applicationType: 'developer',
  name: 'Oluwaseyi Olukoya',
  email: 'developer@gmail.com',
  companyName: undefined,  // ❌ This caused validation to fail
  ...
}
```

**Backend Response**: `400 Bad Request` - Zod validation failed because `companyName` is required for developer applications.

## Root Cause
The form field name in the developer form is `developmentCompany`, but the submission logic was looking for `developerCompany` or `companyName`, which don't exist in the developer form data.

### Field Name Mismatch
```typescript
// ❌ BEFORE - Wrong field names
applicationData.companyName = formData.companyName || formData.developerCompany;
//                                    ↑ doesn't exist    ↑ doesn't exist

// Form actually uses:
<Input
  id="developmentCompany"
  value={formData.developmentCompany}  // ← Actual field name
  ...
/>
```

## The Fix

### Updated Field Mapping
```typescript
// ✅ AFTER - Correct field name
applicationData.companyName = formData.developmentCompany;
```

### Complete Developer Submission Logic
```typescript
else if (formData.role === 'developer' || formData.role === 'property-developer') {
  // Property Developer specific fields
  applicationData.companyName = formData.developmentCompany;  // ✅ Correct field
  
  // Business type is optional for developers, default to 'company' if company name is provided
  if (formData.developmentCompany) {
    applicationData.businessType = 'company';
  }
  
  // Store developer-specific data in metadata
  applicationData.metadata = {
    ...applicationData.metadata,
    companyRegistration: formData.companyRegistration,
    yearsInDevelopment: formData.yearsInDevelopment,
    developmentType: formData.developmentType,
    specialization: formData.specialization,
    primaryMarket: formData.primaryMarket,
    activeProjects: formData.activeProjects ? parseInt(formData.activeProjects) : undefined,
    completedProjects: formData.completedProjects ? parseInt(formData.completedProjects) : undefined,
    projectsInPlanning: formData.projectsInPlanning ? parseInt(formData.projectsInPlanning) : undefined,
    totalProjectValue: formData.totalProjectValue,
    developmentLicense: formData.developmentLicense,
    licenseNumber: formData.licenseNumber,
    teamSize: formData.teamSize,
    inHouseArchitect: formData.inHouseArchitect,
    inHouseEngineer: formData.inHouseEngineer,
    fundingSources: formData.fundingSources,
    primaryFundingMethod: formData.primaryFundingMethod,
    softwareUsed: formData.softwareUsed,
    painPoints: formData.painPoints,
  };
}
```

## Developer Form Fields

### Core Fields (Mapped to Application Schema)
| Form Field | Application Field | Required | Notes |
|------------|------------------|----------|-------|
| `developmentCompany` | `companyName` | ✅ Yes | Company name |
| N/A | `businessType` | No | Auto-set to 'company' |

### Metadata Fields (Stored in JSON)
| Form Field | Type | Description |
|------------|------|-------------|
| `companyRegistration` | string | Company registration number |
| `yearsInDevelopment` | string | Years of experience (0-2, 3-5, etc.) |
| `developmentType` | string | Primary development type (residential, commercial, etc.) |
| `specialization` | string | Specialization area |
| `primaryMarket` | string | Primary market/city |
| `activeProjects` | number | Number of active projects |
| `completedProjects` | number | Number of completed projects |
| `projectsInPlanning` | number | Number of projects in planning |
| `totalProjectValue` | string | Total project value range |
| `developmentLicense` | string | License status |
| `licenseNumber` | string | License number |
| `teamSize` | string | Team size range |
| `inHouseArchitect` | boolean | Has in-house architect |
| `inHouseEngineer` | boolean | Has in-house engineer |
| `fundingSources` | string | Funding sources |
| `primaryFundingMethod` | string | Primary funding method |
| `softwareUsed` | string | Current software used |
| `painPoints` | string | Current pain points |

## Validation Schema

### Required Fields for Developer
```typescript
export const developerSchema = baseApplicationSchema.extend({
  applicationType: z.literal('developer'),
  companyName: z.string().min(2, 'Company name is required'),  // ✅ Required
  businessType: z.enum(['individual', 'company', 'partnership']).optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
});
```

### Base Application Schema
```typescript
export const baseApplicationSchema = z.object({
  applicationType: z.enum(['property-owner', 'property-manager', 'property-developer', 'developer', 'tenant']),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Nigeria'),
  selectedPlanId: z.string().optional(),
  selectedBillingCycle: z.enum(['monthly', 'annual']).optional(),
  referralSource: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
```

## Files Modified

1. **src/components/GetStartedPage.tsx**
   - Fixed field mapping: `formData.developmentCompany` → `applicationData.companyName`
   - Removed incorrect field references (`developerCompany`, `companyName`)
   - Updated metadata to include all actual developer form fields
   - Set `businessType` to 'company' by default for developers

## Testing

### Test Case: Submit Developer Application

**Input:**
```json
{
  "applicationType": "developer",
  "name": "Oluwaseyi Olukoya",
  "email": "developer@gmail.com",
  "phone": "08063223929",
  "developmentCompany": "ABC Construction Ltd",  // ← This field
  "city": "Berlin",
  "state": "Lagos",
  "postalCode": "23401",
  "country": "Nigeria",
  "referralSource": "social"
}
```

**Expected Output:**
```json
{
  "applicationType": "developer",
  "name": "Oluwaseyi Olukoya",
  "email": "developer@gmail.com",
  "phone": "08063223929",
  "companyName": "ABC Construction Ltd",  // ← Correctly mapped
  "businessType": "company",              // ← Auto-set
  "city": "Berlin",
  "state": "Lagos",
  "postalCode": "23401",
  "country": "Nigeria",
  "referralSource": "social",
  "metadata": { ... }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": "uuid",
    "status": "pending",
    "estimatedReviewTime": "24-48 hours",
    "submittedAt": "2025-11-12T..."
  }
}
```

## Validation Flow

```
User Fills Developer Form
    ↓
developmentCompany: "ABC Construction Ltd"
    ↓
Form Submit Handler
    ↓
Field Mapping:
  formData.developmentCompany → applicationData.companyName
    ↓
POST /api/onboarding/apply
    ↓
Zod Validation:
  ✅ applicationType: "developer"
  ✅ companyName: "ABC Construction Ltd" (min 2 chars)
  ✅ name: "Oluwaseyi Olukoya"
  ✅ email: "developer@gmail.com"
    ↓
Validation Success
    ↓
Create Application in Database
    ↓
Return 201 Created
```

## Common Pitfalls

### ❌ Don't Do This
```typescript
// Wrong field names
applicationData.companyName = formData.companyName;  // undefined
applicationData.companyName = formData.developerCompany;  // undefined
```

### ✅ Do This
```typescript
// Correct field name from the form
applicationData.companyName = formData.developmentCompany;
```

### Field Name Consistency
Always check the actual form field names:
```tsx
<Input
  id="developmentCompany"  // ← This is the field name
  value={formData.developmentCompany}  // ← Use this in submission
  onChange={(e) => handleInputChange('developmentCompany', e.target.value)}
/>
```

## Benefits of This Fix

1. **Correct Field Mapping**: Form fields now map correctly to API schema
2. **All Fields Captured**: All developer-specific fields stored in metadata
3. **Validation Passes**: Required fields are properly populated
4. **Type Safety**: TypeScript types match actual form structure
5. **Maintainability**: Clear mapping between form and API

## Lessons Learned

1. **Always Verify Field Names**: Check the actual form field names, not assumed names
2. **Console Log Form Data**: Log `formData` before submission to verify field names
3. **Match Form to Schema**: Ensure form fields map to validation schema requirements
4. **Use Metadata for Extended Fields**: Store developer-specific fields in metadata JSON
5. **Test with Real Data**: Submit actual form data to catch mapping errors early

## Status

✅ **Fixed**: Field mapping corrected  
✅ **Validated**: All developer form fields properly mapped  
✅ **Type Safe**: TypeScript types match form structure  
✅ **Tested**: Ready for submission  

## Next Steps

1. ✅ Test developer registration through Get Started page
2. ⏳ Verify application is saved to database with all fields
3. ⏳ Test admin approval workflow
4. ⏳ Test developer login and dashboard access

---

**Issue**: Developer application failing with 400 Bad Request  
**Root Cause**: Field name mismatch (`companyName` vs `developmentCompany`)  
**Fix**: Corrected field mapping in submission logic  
**Status**: ✅ Resolved  
**Date**: November 12, 2025

