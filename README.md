# PropertyHub - Dashboard Login Page

A beautiful, modern login page for the PropertyHub SaaS platform, built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- 🎨 **Modern UI Design** - Beautiful gradient backgrounds with glassmorphism effects
- 🔐 **Multi-Role Authentication** - Support for Property Owners, Property Managers, Tenants, and Super Admins
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- ✨ **Interactive Components** - Tabs, dropdowns, and animated transitions
- 🔒 **Password Security** - Secure password setup with strength indicators
- 📧 **Invitation System** - Email-based invitation flow for new customers
- 🎯 **Role-based Features** - Display relevant features for each user role

## User Roles

### Property Owner
- Manage property portfolio
- View financial reports
- Oversee tenants

### Property Manager
- Handle daily operations
- Manage maintenance requests
- Support tenants

### Tenant
- Pay rent online
- Request maintenance
- Access digital keys

### Super Admin
- Manage all users
- View system analytics
- Full platform access

## Demo Credentials

You can use these credentials to test the login page:

- **Email:** demo@example.com
- **Password:** demo123
- Select any role from the dropdown

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **class-variance-authority** - Component variants

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (buttons, inputs, cards, etc.)
│   ├── LoginPage.tsx # Main login page component
│   └── PasswordSetup.tsx # Password setup flow
├── App.tsx           # Root component
├── main.tsx          # Application entry point
└── index.css         # Global styles
```

## Component Library

The project uses shadcn/ui components which are built on top of Radix UI primitives. Key components include:

- Button
- Input
- Card
- Label
- Select
- Tabs
- Separator
- Badge
- Toast (Sonner)

## Customization

### Colors

Edit the CSS variables in `src/index.css` to customize the color scheme:

```css
:root {
  --primary: #030213;
  --secondary: oklch(0.95 0.0058 264.53);
  --accent: #e9ebef;
  /* ... more variables */
}
```

### User Roles

Modify the `userTypes` array in `LoginPage.tsx` to add or customize user roles:

```typescript
const userTypes = [
  {
    value: 'custom-role',
    label: 'Custom Role',
    icon: IconComponent,
    description: 'Role description',
    color: 'bg-custom-500',
    features: ['Feature 1', 'Feature 2']
  },
  // ... more roles
];
```

## Future Enhancements

- [ ] Implement actual authentication backend
- [ ] Add forgot password functionality
- [ ] Integrate with real API endpoints
- [ ] Add OAuth providers (Google, Microsoft)
- [ ] Implement 2FA authentication
- [ ] Add remember me functionality
- [ ] Session management

## License

This project is part of the PropertyHub SaaS platform.

## Support

For support, email support@propertyhub.com or visit our documentation.


