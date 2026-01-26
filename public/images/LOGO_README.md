# WorkVouch Logo

## Required File

**File Name:** `workvouch.png`  
**Location:** `public/images/workvouch.png`  
**Format:** PNG (recommended) or SVG  
**Recommended Size:** 200x50px (or proportional)

## Usage

All components reference the logo using:

```tsx
<Image
  src="/images/workvouch.png"
  alt="WorkVouch Logo"
  width={200}
  height={50}
  priority
/>
```

## Adding Your Logo

1. Save your WorkVouch logo as `workvouch.png`
2. Place it in the `public/images/` directory
3. The logo will automatically appear across all pages

## Components Using Logo

- `components/navbar.tsx`
- `components/homepage-navbar.tsx`
- `components/simple-navbar.tsx`
- `components/logo.tsx`

All references have been updated to use `/images/workvouch.png`.
