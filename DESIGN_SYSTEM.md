# Vetify Design System

This document describes the centralized design system for consistent styling across all dashboard routes.

## Color System

### CSS Variables (Light & Dark Mode)

The design system uses CSS variables defined in `src/app/globals.css`:

**Light Mode**
- `--background`: `0 0% 100%` (white)
- `--foreground`: `222 47% 11%` (dark text)
- `--card`: `0 0% 100%` (white cards)
- `--card-foreground`: `222 47% 11%`
- `--primary`: `166 30% 55%` (Vetify teal #75a99c)
- `--primary-foreground`: `0 0% 100%`
- `--secondary`: `210 40% 96%` (light gray)
- `--muted`: `210 40% 96%`
- `--muted-foreground`: `215 16% 47%`
- `--border`: `214 32% 91%`
- `--input`: `214 32% 91%`
- `--ring`: `166 30% 55%`

**Dark Mode**
- `--background`: `222 47% 11%` (dark background)
- `--foreground`: `210 40% 98%` (light text)
- `--card`: `222 47% 15%` (dark cards)
- `--card-foreground`: `210 40% 98%`
- `--primary`: `166 30% 55%` (Vetify teal - same)
- `--primary-foreground`: `222 47% 11%`
- `--secondary`: `217 33% 17%`
- `--muted`: `223 47% 17%`
- `--muted-foreground`: `215 20% 65%`
- `--border`: `217 33% 21%`
- `--input`: `217 33% 21%`
- `--ring`: `166 30% 55%`

### Using Colors in Tailwind

```tsx
// Background
className="bg-background"
className="bg-card"
className="bg-primary"

// Text
className="text-foreground"
className="text-card-foreground"
className="text-muted-foreground"
className="text-primary"

// Border
className="border-border"
className="border-input"

// Hover states
className="hover:bg-accent"
className="hover:bg-primary/90"
```

## Component Classes

### Buttons

```tsx
// Primary button
<button className="btn-primary">Save</button>

// Secondary button
<button className="btn-secondary">Cancel</button>

// Ghost button
<button className="btn-ghost">More</button>

// Destructive button
<button className="btn-destructive">Delete</button>
```

### Cards

```tsx
// Standard card
<div className="card">
  <div className="card-header">
    <h3>Card Title</h3>
  </div>
  <div className="card-content">
    Card content here
  </div>
</div>

// Hoverable card
<div className="card card-hover">
  Content
</div>
```

### Forms

```tsx
// Form label
<label className="form-label">Name</label>

// Form input
<input type="text" className="form-input" />

// Form select
<select className="form-select">
  <option>Choose</option>
</select>

// Form error
<p className="form-error">Error message</p>
```

## Shared Components

### PageHeader

Use for consistent page titles and actions:

```tsx
import { PageHeader } from '@/components/ui/PageHeader';

<PageHeader
  title="Mascotas"
  description="Gestiona las mascotas registradas"
  action={
    <button className="btn-primary">Nueva Mascota</button>
  }
/>
```

### StatsCard

Use for metric displays:

```tsx
import { StatsCard } from '@/components/dashboard/StatsCard';

<StatsCard
  title="Mascotas Registradas"
  value={42}
  limit={100}
  icon="🐕"
  trend={{ value: 12, isPositive: true }}
/>
```

### EmptyState

Use for "no data" states:

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon="📦"
  title="No hay productos"
  description="Comienza agregando tu primer producto"
  action={
    <button className="btn-primary">Agregar Producto</button>
  }
/>
```

### DataCard

Use for content cards with optional actions:

```tsx
import { DataCard } from '@/components/ui/DataCard';

<DataCard title="Recent Activity">
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</DataCard>
```

## Color Usage Guidelines

### DO ✅

```tsx
// Use design tokens
<div className="bg-card text-card-foreground border-border">

// Use opacity modifiers
<div className="bg-primary/90">

// Use hover states with tokens
<button className="hover:bg-accent hover:text-accent-foreground">
```

### DON'T ❌

```tsx
// Don't use hardcoded colors
<div className="bg-gray-800 text-gray-100">

// Don't use hex codes
<div style={{ backgroundColor: '#75a99c' }}>

// Don't mix old and new systems
<div className="bg-card text-gray-900">
```

## Component Patterns

### Page Structure

```tsx
export default function MyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Page Title"
        description="Page description"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard {...} />
        <StatsCard {...} />
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataCard title="Section 1">
          {/* Content */}
        </DataCard>
        <DataCard title="Section 2">
          {/* Content */}
        </DataCard>
      </div>
    </div>
  );
}
```

### Table Pattern

```tsx
<div className="card overflow-hidden">
  <table className="min-w-full divide-y divide-border">
    <thead className="bg-muted">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Name
        </th>
      </tr>
    </thead>
    <tbody className="bg-card divide-y divide-border">
      <tr className="hover:bg-accent/50">
        <td className="px-6 py-4 text-sm text-foreground">
          Data
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Form Pattern

```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="form-label">Name</label>
      <input type="text" className="form-input" />
    </div>
    <div>
      <label className="form-label">Email</label>
      <input type="email" className="form-input" />
      <p className="form-error">Invalid email</p>
    </div>
  </div>

  <div className="flex justify-end gap-4">
    <button type="button" className="btn-secondary">Cancel</button>
    <button type="submit" className="btn-primary">Save</button>
  </div>
</form>
```

## Accessibility

- All interactive elements must have proper focus states (automatically applied via `focus:ring-2 focus:ring-ring`)
- Text must have sufficient contrast (4.5:1 minimum for normal text)
- Use semantic HTML elements
- Provide aria-labels for icon-only buttons

## Migration Checklist

When updating a page to use the design system:

- [ ] Replace `bg-white dark:bg-gray-800` with `bg-card`
- [ ] Replace `text-gray-900 dark:text-gray-100` with `text-foreground`
- [ ] Replace `border-gray-200 dark:border-gray-700` with `border-border`
- [ ] Replace hardcoded `#75a99c` with `bg-primary` or `text-primary`
- [ ] Update buttons to use `btn-primary`, `btn-secondary`, etc.
- [ ] Update form inputs to use `form-input`, `form-label`, `form-select`
- [ ] Replace custom card classes with `.card`
- [ ] Use `hover:bg-accent` for hover states on list items
- [ ] Use `text-muted-foreground` for secondary text

## Testing

After updating a component:

1. Test in light mode
2. Test in dark mode
3. Test hover states
4. Test focus states (tab through with keyboard)
5. Verify responsive behavior (mobile, tablet, desktop)
6. Check contrast with a tool like axe DevTools
