# Contributing Guide

Thank you for contributing to the Property Management System! This guide will help you understand our development workflow and best practices.

## 🚀 Getting Started

1. **Setup Development Environment**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd property-management-system
   
   # Install dependencies
   npm install
   cd backend && npm install
   
   # Setup database
   cp backend/.env.example backend/.env
   # Edit .env with your configuration
   npx prisma migrate dev
   npx prisma db seed
   ```

2. **Read Documentation**
   - [Quick Start Guide](docs/setup/QUICK_START_CHECKLIST.md)
   - [Development Workflow](docs/guides/DEVELOPMENT_WORKFLOW.md)
   - [Directory Structure](DIRECTORY_STRUCTURE.md)

## 📋 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

### 2. Make Your Changes

Follow our coding standards (see below) and ensure:
- Code is properly typed (TypeScript)
- No console.log statements in production code
- Error handling is implemented
- Comments explain complex logic

### 3. Test Your Changes

```bash
# Frontend
npm run dev

# Backend
cd backend && npm run dev

# Type checking
npm run type-check
cd backend && npm run type-check
```

### 4. Document Your Changes

- Update relevant documentation in `docs/`
- Add feature documentation to `docs/features/`
- Update API guides if endpoints changed
- Add inline code comments for complex logic

### 5. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add payment method selection for tenants"
git commit -m "fix: resolve 500 error on property update"
git commit -m "docs: update payment integration guide"
git commit -m "refactor: extract payment service layer"
```

Commit message format:
```
<type>: <short description>

<optional detailed description>

<optional footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feat/your-feature-name
```

Then create a pull request with:
- Clear title and description
- Link to related issues
- Screenshots (for UI changes)
- Testing instructions

## 💻 Coding Standards

### TypeScript

```typescript
// ✅ Good: Explicit types
interface PaymentData {
  amount: number;
  currency: string;
  method: 'paystack' | 'bank_transfer' | 'cash';
}

async function processPayment(data: PaymentData): Promise<Payment> {
  // Implementation
}

// ❌ Bad: Implicit any
async function processPayment(data) {
  // Implementation
}
```

### React Components

```typescript
// ✅ Good: Functional component with types
interface TenantCardProps {
  tenant: Tenant;
  onEdit: (id: string) => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({ tenant, onEdit }) => {
  return (
    <Card>
      <CardHeader>{tenant.name}</CardHeader>
      <Button onClick={() => onEdit(tenant.id)}>Edit</Button>
    </Card>
  );
};

// ❌ Bad: No types, inline styles
export const TenantCard = ({ tenant, onEdit }) => {
  return (
    <div style={{ padding: '10px' }}>
      <h3>{tenant.name}</h3>
      <button onClick={() => onEdit(tenant.id)}>Edit</button>
    </div>
  );
};
```

### API Routes (Backend)

```typescript
// ✅ Good: Proper error handling, types
router.get('/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.payments.findUnique({
      where: { id },
      include: { lease: true, invoice: true }
    });
    
    if (!payment) {
      return res.status(404).json({ 
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }
    
    res.json({ data: payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ❌ Bad: No error handling, unclear responses
router.get('/payments/:id', async (req, res) => {
  const payment = await prisma.payments.findUnique({
    where: { id: req.params.id }
  });
  res.json(payment);
});
```

### Error Handling

```typescript
// ✅ Good: Specific error codes and messages
try {
  const result = await paystackService.initializePayment(data);
  return result;
} catch (error) {
  if (error.code === 'INVALID_AMOUNT') {
    throw new ValidationError('Amount must be greater than 0');
  }
  if (error.code === 'GATEWAY_ERROR') {
    throw new PaymentGatewayError('Paystack is unavailable');
  }
  throw new InternalError('Payment initialization failed');
}

// ❌ Bad: Generic error handling
try {
  const result = await paystackService.initializePayment(data);
  return result;
} catch (error) {
  throw new Error('Something went wrong');
}
```

## 🏗️ Architecture Guidelines

### Backend Layered Architecture

When refactoring or adding new features, follow this pattern:

```
Routes → Controllers → Services → Repositories → Database
```

**Example: Adding a new feature**

```typescript
// 1. Repository (data access)
// backend/src/repositories/payments.repository.ts
export const findPaymentsByTenant = async (tenantId: string) => {
  return prisma.payments.findMany({
    where: { lease: { tenantId } },
    include: { invoice: true, lease: true }
  });
};

// 2. Service (business logic)
// backend/src/services/payments.service.ts
export const getTenantPayments = async (tenantId: string) => {
  const payments = await paymentsRepository.findPaymentsByTenant(tenantId);
  
  // Business logic: calculate totals, format data, etc.
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  
  return { payments, total };
};

// 3. Controller (HTTP handling)
// backend/src/controllers/payments.controller.ts
export const listTenantPayments = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const result = await paymentsService.getTenantPayments(tenantId);
    res.json({ data: result });
  } catch (error) {
    handleError(error, res);
  }
};

// 4. Route (endpoint definition)
// backend/src/routes/payments.ts
router.get('/tenants/:tenantId/payments', authenticateToken, paymentsController.listTenantPayments);
```

### Frontend Feature Organization

When adding new features, organize by domain:

```
src/features/payments/
├── components/
│   ├── PaymentList.tsx
│   ├── PaymentForm.tsx
│   └── PaymentCard.tsx
├── hooks/
│   ├── usePayments.ts
│   └── usePaymentStats.ts
├── api/
│   └── payments.api.ts
├── utils/
│   └── payment-helpers.ts
├── types.ts
└── index.ts (barrel export)
```

## 📝 Documentation Requirements

### Code Documentation

```typescript
/**
 * Initializes a payment transaction with Paystack
 * 
 * @param tenantId - The ID of the tenant making the payment
 * @param invoiceId - The invoice being paid
 * @param amount - Payment amount in kobo (NGN)
 * @returns Payment initialization data including authorization URL
 * @throws {PaymentGatewayError} If Paystack is not configured
 * @throws {ValidationError} If amount is invalid
 */
export async function initializePayment(
  tenantId: string,
  invoiceId: string,
  amount: number
): Promise<PaymentInitializationResponse> {
  // Implementation
}
```

### Feature Documentation

When implementing a new feature, create documentation in `docs/features/`:

```markdown
# Feature Name

## Overview
Brief description of the feature

## User Stories
- As a [role], I want to [action] so that [benefit]

## Implementation Details
- Backend changes
- Frontend changes
- Database changes

## API Endpoints
- `POST /api/endpoint` - Description

## Testing
How to test the feature

## Screenshots
(if applicable)
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before submitting a PR:
- [ ] Test happy path
- [ ] Test error scenarios
- [ ] Test with different user roles
- [ ] Test on different screen sizes (for UI)
- [ ] Test with empty/null data
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests

### Test Credentials

Use credentials from [docs/LOGIN_CREDENTIALS.md](docs/LOGIN_CREDENTIALS.md)

## 🔍 Code Review Process

### As a Reviewer

- Check for security issues
- Verify error handling
- Ensure code follows standards
- Test the changes locally
- Provide constructive feedback

### As an Author

- Respond to all comments
- Make requested changes
- Re-request review after updates
- Be open to feedback

## 🚫 Common Pitfalls

### Backend

❌ **Don't**: Mix business logic in routes
```typescript
router.post('/payments', async (req, res) => {
  const payment = await prisma.payments.create({ data: req.body });
  const invoice = await prisma.invoices.update({ ... });
  const tenant = await prisma.tenants.findUnique({ ... });
  // ... more logic
});
```

✅ **Do**: Extract to service layer
```typescript
router.post('/payments', paymentsController.create);
// Logic in paymentsService.createPayment()
```

### Frontend

❌ **Don't**: Inline API calls in components
```typescript
const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  
  useEffect(() => {
    fetch('/api/tenants').then(r => r.json()).then(setTenants);
  }, []);
};
```

✅ **Do**: Use API client and custom hooks
```typescript
const TenantList = () => {
  const { tenants, loading, error } = useTenants();
};
```

### Database

❌ **Don't**: Make schema changes without migrations
```bash
# Editing schema.prisma and running db push in production
npx prisma db push
```

✅ **Do**: Create proper migrations
```bash
npx prisma migrate dev --name add_payment_method
npx prisma migrate deploy  # in production
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Getting Help

- Check [docs/](docs/) for guides
- Review [docs/archive/](docs/archive/) for historical fixes
- Ask in team chat
- Create an issue for bugs

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing! 🎉

