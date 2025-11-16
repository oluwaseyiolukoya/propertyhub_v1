# Public Layout System

## Overview

We've implemented a reusable layout system for all public-facing pages following React best practices. This ensures consistency, reduces code duplication, and makes maintenance easier.

## Components

### 1. **PublicHeader** (`src/components/PublicHeader.tsx`)
- Sticky header with backdrop blur effect
- Logo with click-to-home functionality
- Navigation menu with active state highlighting
- "Sign In" and "Get Started" CTA buttons
- Responsive design (mobile-friendly)

**Features:**
- Active page highlighting (blue background for current page)
- Smooth hover effects
- Consistent branding across all pages

### 2. **PublicFooter** (`src/components/PublicFooter.tsx`)
- Comprehensive footer with 4 columns:
  - Company Info
  - Product Links
  - Company Links
  - Support Links
- Bottom bar with copyright and legal links
- All links are functional (navigation callbacks)

**Features:**
- Hover effects on all links
- Responsive grid layout
- Consistent styling

### 3. **PublicLayout** (`src/components/PublicLayout.tsx`)
- Wrapper component that combines Header + Content + Footer
- Handles all navigation prop drilling
- Provides consistent page structure
- Sets min-height for proper footer positioning

**Features:**
- Flexbox layout ensures footer stays at bottom
- Gradient background applied consistently
- Single source of truth for layout

## Usage

### Basic Implementation

```tsx
import { PublicLayout } from './PublicLayout';

export function YourPage({ 
  onBackToHome,
  onNavigateToLogin,
  onNavigateToGetStarted,
  // ... other navigation props
}: YourPageProps) {
  return (
    <PublicLayout
      currentPage="your-page"
      onNavigateToHome={onBackToHome}
      onNavigateToLogin={onNavigateToLogin}
      onNavigateToGetStarted={onNavigateToGetStarted}
      onNavigateToAbout={onNavigateToAbout}
      onNavigateToCareers={onNavigateToCareers}
      onNavigateToBlog={onNavigateToBlog}
      onNavigateToContact={onNavigateToContact}
      onNavigateToScheduleDemo={onNavigateToScheduleDemo}
      onNavigateToAPIDocumentation={onNavigateToAPIDocumentation}
      onNavigateToIntegrations={onNavigateToIntegrations}
    >
      {/* Your page content here */}
      <section className="py-20 px-4">
        <h1>Your Page Content</h1>
      </section>
    </PublicLayout>
  );
}
```

### Current Page Prop

The `currentPage` prop highlights the active navigation item:

```tsx
currentPage="home" | "about" | "careers" | "blog" | "contact" | "schedule-demo" | "api-docs" | "integrations"
```

## Pages Updated

✅ **CareersPage** - First page migrated to new layout system

## Benefits

1. **DRY (Don't Repeat Yourself)**
   - Header and footer code written once
   - Consistent across all pages
   - Easy to update globally

2. **Maintainability**
   - Single source of truth for layout
   - Changes propagate automatically
   - Easier to debug

3. **Consistency**
   - Same header/footer on every page
   - Consistent navigation behavior
   - Unified user experience

4. **Performance**
   - Reduced bundle size (no duplicate code)
   - Better code splitting potential
   - Easier to optimize

5. **Accessibility**
   - Consistent navigation structure
   - Proper semantic HTML
   - Better screen reader support

## Migration Checklist

To migrate a page to the new layout system:

1. ✅ Import `PublicLayout` component
2. ✅ Add all navigation props to page interface
3. ✅ Remove old header code (header tag)
4. ✅ Remove old footer code (footer tag)
5. ✅ Remove outer div with background classes
6. ✅ Wrap content in `<PublicLayout>` tags
7. ✅ Pass all navigation props to `PublicLayout`
8. ✅ Set appropriate `currentPage` value
9. ✅ Update App.tsx to pass navigation props
10. ✅ Test navigation functionality

## Next Steps

**Remaining Pages to Migrate:**
- [ ] LandingPage
- [ ] AboutPage
- [ ] BlogPage
- [ ] ContactPage
- [ ] ScheduleDemoPage
- [ ] APIDocumentation
- [ ] IntegrationsPage
- [ ] GetStartedPage
- [ ] AccountUnderReviewPage

## Best Practices

1. **Always pass all navigation props** - Even if a page doesn't use them all, pass them for consistency
2. **Set currentPage correctly** - This ensures proper active state highlighting
3. **Keep content semantic** - Use proper HTML5 semantic tags in page content
4. **Maintain responsive design** - Test on mobile, tablet, and desktop
5. **Follow naming conventions** - Use `onNavigateTo[Page]` for navigation props

## Code Structure

```
src/components/
├── PublicHeader.tsx      # Reusable header component
├── PublicFooter.tsx      # Reusable footer component
├── PublicLayout.tsx      # Layout wrapper
└── [PageName].tsx        # Individual pages using layout
```

## Props Interface

```typescript
interface PublicLayoutProps {
  children: React.ReactNode;
  currentPage?: 'home' | 'about' | 'careers' | 'blog' | 'contact' | 'schedule-demo' | 'api-docs' | 'integrations';
  onNavigateToHome?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToScheduleDemo?: () => void;
  onNavigateToAPIDocumentation?: () => void;
  onNavigateToIntegrations?: () => void;
}
```

## Testing

After migration, test:
- ✅ Header navigation links work
- ✅ Footer navigation links work
- ✅ Active page highlighting
- ✅ Logo click returns to home
- ✅ CTA buttons work (Sign In, Get Started)
- ✅ Responsive behavior on mobile
- ✅ Footer stays at bottom on short pages

## Notes

- The layout uses Tailwind CSS for styling
- Header is sticky (stays at top on scroll)
- Footer has backdrop blur for modern effect
- All navigation is handled via callbacks (no hard links)
- Supports both light and dark themes (footer is dark)

