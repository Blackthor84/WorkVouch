# WorkVouch Logo Setup Instructions

## ✅ Logo Component Updated

The logo component (`components/logo.tsx`) has been updated to use the new WorkVouch logo image.

## 📁 Add Your Logo File

1. **Copy your logo file** to the `public` folder:
   - File name: `logo.png`
   - Location: `public/logo.png`
   - Format: PNG with transparency

2. **Recommended logo specifications:**
   - Size: At least 512x512px (for high DPI displays)
   - Format: PNG with transparent background
   - Aspect ratio: Square (1:1) works best

## 🎨 Logo Display

The logo component will:
- Display with transparency (background adapts to light/dark mode)
- Scale appropriately based on size prop (`sm`, `md`, `lg`)
- Show "WorkVouch" text next to the logo (can be hidden with `showText={false}`)

## 📱 Usage Examples

```tsx
// Small logo with text (navbar)
<Logo size="sm" />

// Large logo with text (landing page)
<Logo size="lg" />

// Logo without text
<Logo showText={false} size="md" />
```

## 🔄 Favicon Update

To update the favicon:

1. **Create favicon files:**
   - `public/favicon.ico` (16x16, 32x32, 48x48)
   - `public/favicon-16x16.png`
   - `public/favicon-32x32.png`
   - `public/apple-touch-icon.png` (180x180)

2. **Update `app/layout.tsx`** to include favicon metadata:
   ```tsx
   export const metadata: Metadata = {
     title: 'WorkVouch - Trust-Based Professional Profiles',
     description: '...',
     icons: {
       icon: '/favicon.ico',
       apple: '/apple-touch-icon.png',
     },
   }
   ```

## ✅ Current Status

- ✅ Logo component updated to use `/logo.png`
- ✅ All "PeerCV" text replaced with "WorkVouch"
- ✅ Logo component supports transparency
- ⏳ **Action Required:** Add your logo file to `public/logo.png`
- ⏳ **Optional:** Add favicon files to `public/` folder

---

**Next Step:** Copy your WorkVouch logo file to `public/logo.png` and restart your dev server!
