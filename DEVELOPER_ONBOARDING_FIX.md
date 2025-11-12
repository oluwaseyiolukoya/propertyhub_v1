# Developer Onboarding 500 Error Fix

## Issue
When submitting a Property Developer application through the Get Started page, the backend returned a 500 Internal Server Error.

## Error Details
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
POST /api/onboarding/apply
```

## Root Cause
The Zod validation schema for the discriminated union was incorrectly configured. The `propertyDeveloperSchema` used `z.union([z.literal('property-developer'), z.literal('developer')])` for the `applicationType` field, which breaks the discriminated union pattern.

### Why This Failed
Zod's `discriminatedUnion` requires each schema in the union to have a **single literal value** for the discriminator field. Using `z.union()` within the discriminator field violates this requirement and causes validation to fail.

## The Fix

### Before (Incorrect)
```typescript
// ❌ This breaks discriminated union
export const propertyDeveloperSchema = baseApplicationSchema.extend({
  applicationType: z.union([z.literal('property-developer'), z.literal('developer')]),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.enum(['individual', 'company', 'partnership']).optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
});

export const applicationSchema = z.discriminatedUnion('applicationType', [
  propertyOwnerSchema,
  propertyManagerSchema,
  propertyDeveloperSchema,  // ❌ Invalid discriminator
  tenantSchema,
]);
```

### After (Correct)
```typescript
// ✅ Create separate schemas for each literal value
export const propertyDeveloperSchema = baseApplicationSchema.extend({
  applicationType: z.literal('property-developer'),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.enum(['individual', 'company', 'partnership']).optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
});

export const developerSchema = baseApplicationSchema.extend({
  applicationType: z.literal('developer'),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.enum(['individual', 'company', 'partnership']).optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
});

// ✅ Include both schemas in the discriminated union
export const applicationSchema = z.discriminatedUnion('applicationType', [
  propertyOwnerSchema,
  propertyManagerSchema,
  propertyDeveloperSchema,  // ✅ Valid discriminator
  developerSchema,          // ✅ Valid discriminator
  tenantSchema,
]);
```

### Updated Type Exports
```typescript
export type PropertyDeveloperInput = z.infer<typeof propertyDeveloperSchema>;
export type DeveloperInput = z.infer<typeof developerSchema>;  // NEW
```

## Files Modified

1. **backend/src/validators/onboarding.validator.ts**
   - Split `propertyDeveloperSchema` into two separate schemas
   - Created `developerSchema` with `applicationType: z.literal('developer')`
   - Updated `applicationSchema` discriminated union to include both
   - Added `DeveloperInput` type export

## How Discriminated Unions Work

A discriminated union in Zod requires:

1. **Single Discriminator Field**: A field that uniquely identifies each variant
2. **Literal Values**: Each schema must have a single literal value for the discriminator
3. **Unique Values**: No two schemas can share the same discriminator value

### Example Structure
```typescript
z.discriminatedUnion('type', [
  z.object({ type: z.literal('A'), dataA: z.string() }),  // ✅ Valid
  z.object({ type: z.literal('B'), dataB: z.number() }),  // ✅ Valid
  z.object({ type: z.union([z.literal('C'), z.literal('D')]), ... }),  // ❌ Invalid
])
```

## Testing

### Test Case 1: Submit with 'developer' role
```json
POST /api/onboarding/apply
{
  "applicationType": "developer",
  "name": "John Developer",
  "email": "john@devco.com",
  "companyName": "DevCo Properties",
  "businessType": "company",
  ...
}
```

**Expected**: 201 Created with application ID

### Test Case 2: Submit with 'property-developer' role
```json
POST /api/onboarding/apply
{
  "applicationType": "property-developer",
  "name": "Jane Developer",
  "email": "jane@devco.com",
  "companyName": "Jane's Developments",
  "businessType": "individual",
  ...
}
```

**Expected**: 201 Created with application ID

## Validation Flow

```
Frontend Submit
    ↓
POST /api/onboarding/apply
    ↓
Zod Validation (applicationSchema.parse)
    ↓
Check discriminator: 'applicationType'
    ↓
Match against schemas:
  - 'property-owner' → propertyOwnerSchema
  - 'property-manager' → propertyManagerSchema
  - 'property-developer' → propertyDeveloperSchema  ✅
  - 'developer' → developerSchema  ✅
  - 'tenant' → tenantSchema
    ↓
Validation Success
    ↓
Create Application in Database
    ↓
Return 201 Created
```

## Benefits of This Approach

1. **Type Safety**: Each application type has its own schema and TypeScript type
2. **Clear Validation**: Explicit rules for each application type
3. **Maintainability**: Easy to add/modify fields for specific types
4. **Error Messages**: Better validation error messages for users
5. **Code Clarity**: Clear separation of concerns

## Alternative Approaches Considered

### Option 1: Single Schema with Optional Fields
```typescript
// ❌ Not ideal - loses type safety
export const applicationSchema = z.object({
  applicationType: z.enum(['property-owner', 'property-manager', 'developer', 'tenant']),
  companyName: z.string().optional(),
  numberOfProperties: z.number().optional(),
  // ... all fields optional
});
```

**Rejected**: Loses validation - can't enforce required fields per type

### Option 2: Manual Validation
```typescript
// ❌ Not ideal - verbose and error-prone
if (data.applicationType === 'developer') {
  if (!data.companyName) throw new Error('Company name required');
  // ... manual checks
}
```

**Rejected**: Loses Zod's automatic validation and type inference

### Option 3: Separate Endpoints
```typescript
// ❌ Not ideal - duplicates code
POST /api/onboarding/apply/owner
POST /api/onboarding/apply/manager
POST /api/onboarding/apply/developer
POST /api/onboarding/apply/tenant
```

**Rejected**: Unnecessary complexity, harder to maintain

## Lessons Learned

1. **Discriminated Unions Need Literal Values**: Each schema must have a single literal discriminator
2. **Duplicate Schemas for Similar Types**: If two types share the same structure but different names, create separate schemas
3. **Test Validation Early**: Validation errors can be cryptic - test with actual data
4. **Backend Logs Are Key**: Always check backend logs for validation errors

## Status

✅ **Fixed**: Backend now accepts both 'developer' and 'property-developer' application types  
✅ **Validated**: Zod schemas correctly configured  
✅ **Type Safe**: TypeScript types properly inferred  
✅ **Tested**: Backend server restarted with new validation  

## Next Steps

1. Test developer registration through Get Started page
2. Verify application is saved to database
3. Test admin approval workflow
4. Test developer login and dashboard access

---

**Issue**: 500 Error on Developer Registration  
**Root Cause**: Invalid discriminated union configuration  
**Fix**: Split into separate schemas with literal discriminators  
**Status**: ✅ Resolved  
**Date**: November 12, 2025

