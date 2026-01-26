# WorkVouch Logo Setup

## Required Logo File

**IMPORTANT:** You must add your logo file to this location:

```
/public/workvouch-logo.png
```

## Logo Specifications

- **File name:** `workvouch-logo.png` (exact name, case-sensitive)
- **Location:** `/public/workvouch-logo.png` (root of public folder)
- **Format:** PNG with transparent background recommended
- **Recommended size:** 200x50px or similar aspect ratio

## Usage in Components

All components use the absolute public path:

```tsx
import Image from "next/image";

<Image
  src="/workvouch-logo.png"
  alt="WorkVouch Logo"
  width={200}
  height={50}
  priority
/>
```

## Components Using Logo

The following components reference `/workvouch-logo.png`:

- `components/logo.tsx`
- `components/navbar.tsx`
- `components/homepage-navbar.tsx`
- `components/simple-navbar.tsx`

## Next Steps

1. Add your `workvouch-logo.png` file to the `/public` folder
2. Restart your development server
3. The logo will automatically appear in all components
