# Responsive Layout System

This document describes the responsive layout system implemented for the Sistema de Gestão de Quadro de Lotação, following Senior Design System (SDS) guidelines.

## Overview

The responsive layout system provides a comprehensive solution for creating layouts that adapt seamlessly across different screen sizes and devices. It follows the mobile-first approach and implements the breakpoints defined in the steering rules.

## Breakpoints

The system uses three main breakpoints:

- **Mobile**: `< 768px` - 1 column layout
- **Tablet**: `768px - 1279px` - 2 columns maximum
- **Desktop**: `≥ 1280px` - Full 4 columns support

## Components

### AppShell

The main layout wrapper that provides the application structure with header, sidebar, and main content area.

```tsx
import { AppShell } from './components/layout'

<AppShell>
  <YourPageContent />
</AppShell>
```

**Features:**
- Responsive sidebar that collapses on mobile
- Touch-friendly mobile navigation with hamburger menu
- Backdrop overlay on mobile when sidebar is open
- Automatic sidebar state management based on screen size

### Header

The application header with logo, global filters, and user menu.

**Features:**
- Responsive title sizing
- Mobile hamburger menu toggle
- Touch-friendly user menu (44px minimum touch target)
- Adaptive content hiding on smaller screens

### Sidebar

The navigation sidebar with responsive behavior.

**Features:**
- Always visible on desktop and tablet
- Drawer behavior on mobile (slides in from left)
- Touch-friendly navigation links (56px minimum height on mobile)
- Automatic closure when navigation occurs on mobile

### ResponsiveGrid

A flexible grid system that adapts to different screen sizes.

```tsx
import { ResponsiveGrid, GridItem } from './components/layout'

<ResponsiveGrid columns={4} gap="md">
  <GridItem>Content 1</GridItem>
  <GridItem span={2}>Content 2 (spans 2 columns)</GridItem>
  <GridItem>Content 3</GridItem>
</ResponsiveGrid>
```

**Props:**
- `columns`: `1 | 2 | 3 | 4 | 'auto'` - Number of columns (adapts responsively)
- `gap`: `'sm' | 'md' | 'lg'` - Gap size between items
- `className`: Additional CSS classes

### GridItem

Individual grid items with spanning capabilities.

**Props:**
- `span`: `1 | 2 | 3 | 4 | 'full'` - Number of columns to span
- `className`: Additional CSS classes

**Responsive Behavior:**
- Mobile: All spans collapse to 1 column
- Tablet: Spans > 2 become 2 columns
- Desktop: Full span support

### ResponsiveCard

A card component with responsive padding and hover effects.

```tsx
import { ResponsiveCard } from './components/layout'

<ResponsiveCard hover={true}>
  <h3>Card Title</h3>
  <p>Card content...</p>
</ResponsiveCard>
```

**Props:**
- `hover`: `boolean` - Enable hover effects (default: true)
- `className`: Additional CSS classes

## Usage Examples

### Dashboard Layout

```tsx
import { ResponsiveGrid, GridItem, ResponsiveCard } from './components/layout'

// KPI Cards - 4 columns on desktop, 2 on tablet, 1 on mobile
<ResponsiveGrid columns={4} gap="md">
  {kpis.map(kpi => (
    <GridItem key={kpi.id}>
      <ResponsiveCard>
        <KPICard kpi={kpi} />
      </ResponsiveCard>
    </GridItem>
  ))}
</ResponsiveGrid>

// Two-column layout for alerts and activities
<ResponsiveGrid columns={2} gap="lg">
  <GridItem>
    <ResponsiveCard>
      <AlertsSection />
    </ResponsiveCard>
  </GridItem>
  <GridItem>
    <ResponsiveCard>
      <ActivitiesSection />
    </ResponsiveCard>
  </GridItem>
</ResponsiveGrid>
```

### Form Layout

```tsx
// Form with responsive columns
<ResponsiveGrid columns={2} gap="md">
  <GridItem>
    <FormField label="Nome" />
  </GridItem>
  <GridItem>
    <FormField label="Email" />
  </GridItem>
  <GridItem span="full">
    <FormField label="Descrição" type="textarea" />
  </GridItem>
</ResponsiveGrid>
```

## CSS Classes

### Responsive Utilities

```css
/* Display utilities */
.mobile-only     /* Visible only on mobile */
.tablet-up       /* Visible on tablet and desktop */
.desktop-only    /* Visible only on desktop */

/* Touch-friendly utilities */
.touch-target    /* Minimum 44px touch target */
.touch-friendly  /* Touch-friendly padding and sizing */

/* Container utilities */
.container       /* Responsive container with max-width */
.spacing-responsive /* Responsive padding */
.text-responsive    /* Responsive font sizing */
```

### Grid Classes

```css
/* Grid containers */
.responsive-grid
.responsive-grid--1-cols
.responsive-grid--2-cols
.responsive-grid--3-cols
.responsive-grid--4-cols
.responsive-grid--auto-cols

/* Gap variations */
.responsive-grid--gap-sm
.responsive-grid--gap-md
.responsive-grid--gap-lg

/* Grid items */
.grid-item
.grid-item--span-2
.grid-item--span-3
.grid-item--span-4
.grid-item--span-full

/* Cards */
.responsive-card
.responsive-card--hover
```

## Accessibility Features

### Focus Management
- Proper focus indicators on all interactive elements
- Logical tab order maintained across screen sizes
- Skip links for keyboard navigation

### ARIA Labels
- Descriptive labels for mobile menu toggle
- Proper landmark roles (banner, navigation, main, complementary)
- Screen reader friendly navigation

### Touch Accessibility
- Minimum 44px touch targets on mobile
- Adequate spacing between interactive elements
- Touch-friendly hover states

## Performance Considerations

### CSS Optimizations
- Uses CSS Grid for efficient layouts
- Minimal JavaScript for responsive behavior
- CSS-only responsive breakpoints where possible

### Reduced Motion Support
- Respects `prefers-reduced-motion` setting
- Disables animations for users who prefer reduced motion

### High Contrast Support
- Enhanced borders and focus indicators in high contrast mode
- Maintains readability across all contrast settings

## Browser Support

- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

## Testing

The responsive layout system includes comprehensive tests covering:

- Responsive behavior across breakpoints
- Touch-friendly navigation
- Accessibility features
- Grid system functionality
- Card component behavior

Run tests with:
```bash
npm test ResponsiveLayout.test.tsx
```

## Migration Guide

### From Legacy Layout

If migrating from a legacy layout system:

1. Replace fixed grid systems with `ResponsiveGrid`
2. Update card components to use `ResponsiveCard`
3. Ensure touch targets meet 44px minimum on mobile
4. Test across all breakpoints
5. Verify accessibility with screen readers

### Best Practices

1. **Mobile First**: Design for mobile, then enhance for larger screens
2. **Touch Targets**: Ensure minimum 44px touch targets on mobile
3. **Content Priority**: Show most important content first on mobile
4. **Performance**: Use CSS for responsive behavior when possible
5. **Accessibility**: Test with keyboard navigation and screen readers

## Troubleshooting

### Common Issues

**Grid items not responsive:**
- Ensure you're using `ResponsiveGrid` instead of regular CSS grid
- Check that grid items are wrapped in `GridItem` components

**Touch targets too small:**
- Add `touch-target` class to interactive elements
- Use `touch-friendly` class for navigation links

**Sidebar not working on mobile:**
- Verify `AppShell` is properly implemented
- Check that backdrop click handler is working

**Content overflow:**
- Use `min-width: 0` on grid items to prevent overflow
- Ensure text content has proper word-wrapping

For additional support, refer to the component examples in `/src/examples/ResponsiveLayoutExample.tsx`.