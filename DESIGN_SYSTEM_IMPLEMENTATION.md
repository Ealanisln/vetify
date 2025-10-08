# Design System Implementation Guide

## ✅ Completed Work

### 1. Core Design System Setup

#### Tailwind Configuration (`tailwind.config.ts`)
- ✅ Added CSS variable-based color system for light and dark mode
- ✅ Integrated with existing Vetify color palette
- ✅ Supports seamless theme switching

#### Global Styles (`src/app/globals.css`)
- ✅ Created comprehensive CSS variable definitions
- ✅ Defined light mode colors (`:root`)
- ✅ Defined dark mode colors (`.dark`)
- ✅ Updated all component classes to use design tokens
- ✅ Updated button classes (`btn-primary`, `btn-secondary`, `btn-ghost`, `btn-destructive`)
- ✅ Updated card classes (`.card`, `.card-header`, `.card-content`, `.card-hover`)
- ✅ Updated form classes (`.form-input`, `.form-label`, `.form-select`, `.form-error`)
- ✅ Updated navigation classes (`.nav-link`, `.nav-link-active`)
- ✅ Updated scrollbar styles to use design tokens

### 2. Shared Components

#### Created New Components
- ✅ `PageHeader` (`src/components/ui/PageHeader.tsx`) - Standardized page headers with title, description, and actions
- ✅ `EmptyState` (`src/components/ui/EmptyState.tsx`) - Consistent empty state displays
- ✅ `DataCard` (`src/components/ui/DataCard.tsx`) - Reusable content cards with optional headers and actions

#### Updated Existing Components
- ✅ `StatsCard` (`src/components/dashboard/StatsCard.tsx`) - Updated to use design tokens instead of theme-colors utility

### 3. Dashboard Pages Updated
- ✅ **Main Dashboard** (`src/app/dashboard/page.tsx`) - Fully updated with design tokens
- ✅ **Pets New Form** (`src/components/pets/AddPetForm.tsx`) - Dark mode colors fixed
- ✅ **Appointments** (`src/app/dashboard/appointments/*`) - Dark mode colors fixed
  - AppointmentsPageClient.tsx
  - TodayAppointments.tsx
  - AppointmentForm.tsx
  - AppointmentModal.tsx

### 4. Documentation
- ✅ Created `DESIGN_SYSTEM.md` - Comprehensive design system reference
- ✅ Created `DESIGN_SYSTEM_IMPLEMENTATION.md` - This implementation guide

## 🔄 Remaining Work

### Pages That Need Update

The following dashboard routes still need to be systematically updated to use the design system:

1. **Customers (Clientes)** - `/dashboard/customers`
   - Main list page
   - New customer page
   - Customer detail pages

2. **Pets (Mascotas)** - `/dashboard/pets`
   - Main list page (already has new form updated)
   - Pet detail pages

3. **Staff (Personal)** - `/dashboard/staff`
   - Main list page
   - Staff management pages

4. **Sales (Punto de Venta)** - `/dashboard/sales`
   - POS interface
   - Sales forms

5. **Cash Register (Caja)** - `/dashboard/caja`
   - Cash register interface

6. **Inventory (Inventario)** - `/dashboard/inventory`
   - Product list
   - Product forms

7. **Medical History (Historia Clínica)** - `/dashboard/medical-history`
   - Medical records interface
   - New record forms

8. **Reports (Reportes)** - `/dashboard/reports`
   - All report pages

9. **Settings (Configuración)** - `/dashboard/settings`
   - All settings pages

## 📋 Step-by-Step Update Process

For each page that needs updating, follow these steps:

### Step 1: Read the Current Page

```bash
# Example for customers page
Read the file at: src/app/dashboard/customers/page.tsx
```

### Step 2: Apply Color Token Replacements

Use this find-and-replace guide:

#### Background Colors
- `bg-white dark:bg-gray-800` → `bg-card`
- `bg-white dark:bg-gray-900` → `bg-background`
- `bg-gray-50 dark:bg-gray-800` → `bg-muted`
- `bg-gray-100 dark:bg-gray-700` → `bg-secondary`

#### Text Colors
- `text-gray-900 dark:text-gray-100` → `text-foreground`
- `text-gray-900 dark:text-white` → `text-foreground`
- `text-gray-700 dark:text-gray-300` → `text-foreground`
- `text-gray-600 dark:text-gray-400` → `text-muted-foreground`
- `text-gray-500 dark:text-gray-400` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground`

#### Border Colors
- `border-gray-200 dark:border-gray-700` → `border-border`
- `border-gray-300 dark:border-gray-600` → `border-input`

#### Primary Color (Vetify teal)
- `bg-[#75a99c]` → `bg-primary`
- `text-[#75a99c]` → `text-primary`
- `border-[#75a99c]` → `border-primary`
- `hover:bg-[#5b9788]` → `hover:bg-primary/90`

#### Hover States
- `hover:bg-gray-50 dark:hover:bg-gray-700` → `hover:bg-accent`
- `hover:bg-gray-100 dark:hover:bg-gray-800` → `hover:bg-accent`

### Step 3: Update Component Usage

#### Replace Custom Cards with Standard Card Classes
```tsx
// Before
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
  <div className="px-4 py-5 sm:p-6">
    Content
  </div>
</div>

// After
<div className="card">
  <div className="card-content">
    Content
  </div>
</div>
```

#### Use PageHeader for Page Titles
```tsx
// Before
<div>
  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
    Page Title
  </h1>
  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
    Description
  </p>
</div>

// After
import { PageHeader } from '@/components/ui/PageHeader';

<PageHeader
  title="Page Title"
  description="Description"
/>
```

#### Use EmptyState for No Data
```tsx
// Before
<div className="text-center py-12">
  <span className="text-6xl">📦</span>
  <h3 className="mt-2 text-lg font-medium text-gray-900">
    No items
  </h3>
  <p className="mt-1 text-sm text-gray-500">
    Get started by adding an item
  </p>
</div>

// After
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon="📦"
  title="No items"
  description="Get started by adding an item"
  action={<button className="btn-primary">Add Item</button>}
/>
```

#### Use DataCard for Content Sections
```tsx
// Before
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
    <h3>Section Title</h3>
  </div>
  <div className="px-4 py-5 sm:p-6">
    Content
  </div>
</div>

// After
import { DataCard } from '@/components/ui/DataCard';

<DataCard title="Section Title">
  Content
</DataCard>
```

### Step 4: Update Buttons

```tsx
// Before
<button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#75a99c] hover:bg-[#5b9788]">
  Save
</button>

// After
<button className="btn-primary">
  Save
</button>
```

### Step 5: Update Forms

```tsx
// Before
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
  Name
</label>
<input
  type="text"
  className="block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
/>

// After
<label className="form-label">
  Name
</label>
<input
  type="text"
  className="form-input"
/>
```

### Step 6: Update Tables

```tsx
// Before
<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
  <thead className="bg-gray-50 dark:bg-gray-800">
    <tr>
      <th className="px-6 py-3 text-gray-500 dark:text-gray-400">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="bg-white dark:bg-gray-900">
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
        Data
      </td>
    </tr>
  </tbody>
</table>

// After
<table className="min-w-full divide-y divide-border">
  <thead className="bg-muted">
    <tr>
      <th className="px-6 py-3 text-muted-foreground">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="bg-card divide-y divide-border">
    <tr className="hover:bg-accent/50">
      <td className="px-6 py-4 text-foreground">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

## 🎯 Priority Order

Update pages in this order for maximum impact:

1. **High Priority** (Most visible pages)
   - ✅ Dashboard (completed)
   - Customers (Clientes) - Main list page
   - Pets (Mascotas) - Main list page
   - ✅ Appointments (Citas) - Completed

2. **Medium Priority** (Frequently used)
   - Sales (Punto de Venta)
   - Inventory (Inventario)
   - Medical History (Historia Clínica)

3. **Lower Priority**
   - Staff (Personal)
   - Cash Register (Caja)
   - Reports (Reportes)
   - Settings (Configuración)

## 🧪 Testing Checklist

After updating each page, verify:

- [ ] Light mode looks correct
- [ ] Dark mode looks correct
- [ ] All text is readable (proper contrast)
- [ ] Hover states work properly
- [ ] Focus states work (tab through with keyboard)
- [ ] Cards have consistent styling
- [ ] Buttons have consistent styling
- [ ] Forms have consistent styling
- [ ] No hardcoded colors remain (search for `#`, `gray-`, `white`, `black`)
- [ ] Responsive behavior works (mobile, tablet, desktop)
- [ ] Page loads without console errors

## 📝 Quick Reference Commands

### Find Hardcoded Colors in a File
```bash
# Search for potential hardcoded colors
grep -n "gray-[0-9]" src/app/dashboard/customers/page.tsx
grep -n "#[0-9a-fA-F]" src/app/dashboard/customers/page.tsx
grep -n "bg-white\|bg-black" src/app/dashboard/customers/page.tsx
```

### Batch Search Across Multiple Files
```bash
# Find all files with hardcoded colors in dashboard
grep -r "bg-gray-[0-9]" src/app/dashboard/ --include="*.tsx"
```

## 💡 Tips

1. **Work incrementally** - Update one page at a time and test thoroughly
2. **Use the design system docs** - Refer to `DESIGN_SYSTEM.md` for color usage
3. **Check existing updated pages** - Look at dashboard/page.tsx as reference
4. **Test in both modes** - Always check light AND dark mode
5. **Use component classes** - Prefer `.btn-primary` over custom button styling
6. **Maintain consistency** - Use the same patterns across all pages

## 🆘 Troubleshooting

### Colors Don't Change in Dark Mode
- Make sure you're using design tokens (`bg-card`) not hardcoded values (`bg-white dark:bg-gray-800`)
- Check that CSS variables are defined in `globals.css`

### Text is Unreadable
- Use `text-foreground` for primary text
- Use `text-muted-foreground` for secondary text
- Never use `text-gray-500` without `dark:` variant

### Buttons Look Wrong
- Use component classes: `btn-primary`, `btn-secondary`, `btn-ghost`
- Don't create custom button styles unless absolutely necessary

### Forms Don't Match
- Use `form-input`, `form-label`, `form-select` classes
- Don't add custom styling to form elements

## 📊 Progress Tracking

Create a checklist as you update each page:

```markdown
## Dashboard Pages Update Progress

- [x] Dashboard (home)
- [x] Appointments
- [x] Pets - New form
- [ ] Pets - List page
- [ ] Pets - Detail pages
- [ ] Customers - List page
- [ ] Customers - New page
- [ ] Customers - Detail pages
- [ ] Staff - All pages
- [ ] Sales - All pages
- [ ] Cash Register - All pages
- [ ] Inventory - All pages
- [ ] Medical History - All pages
- [ ] Reports - All pages
- [ ] Settings - All pages
```

## 🎉 Success Criteria

The design system implementation will be complete when:

1. All dashboard pages use design tokens (no hardcoded colors)
2. Light and dark modes are consistent across all pages
3. All shared components are used appropriately
4. All pages pass the testing checklist
5. The application has a cohesive, professional appearance
6. No console errors related to styling

## 📚 Additional Resources

- **Design System Reference**: `DESIGN_SYSTEM.md`
- **Tailwind Config**: `tailwind.config.ts`
- **Global Styles**: `src/app/globals.css`
- **Example Components**:
  - `src/components/ui/PageHeader.tsx`
  - `src/components/ui/EmptyState.tsx`
  - `src/components/ui/DataCard.tsx`
  - `src/components/dashboard/StatsCard.tsx`
- **Updated Page Examples**:
  - `src/app/dashboard/page.tsx`
  - `src/components/pets/AddPetForm.tsx`
  - `src/app/dashboard/appointments/AppointmentsPageClient.tsx`
