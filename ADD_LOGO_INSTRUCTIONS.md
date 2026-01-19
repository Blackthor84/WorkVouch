# Add PeerCV Logo to App

## ✅ What I Did

I've added the PeerCV logo to your app:

1. **Created Logo Component** (`components/logo.tsx`)
   - Displays your logo image
   - Has a fallback SVG version if image not found
   - Supports different sizes (sm, md, lg)
   - Works in both light and dark modes

2. **Added to Navbar** (`components/navbar.tsx`)
   - Logo appears in the top-left of every page
   - Clickable link to home page
   - Medium size, with text

3. **Added to Landing Page** (`app/page.tsx`)
   - Large logo displayed prominently in the hero section
   - Styled with a subtle background for visibility

## 📁 Add Your Logo Image

1. **Save your logo image** as `logo.png` in the `public/` folder
2. The logo should be:
   - PNG format (or SVG)
   - Transparent background
   - High resolution (at least 512x512px recommended)
   - Named exactly `logo.png`

## 🎨 Logo Features

- **Automatic fallback**: If the image isn't found, a beautiful SVG version will display
- **Responsive**: Adapts to different screen sizes
- **Dark mode support**: Works perfectly in both light and dark themes
- **Gradient text**: The "PeerCV" text uses a blue-to-green gradient matching your brand

## 📍 Where Logo Appears

- ✅ **Navbar** (top of every page) - Medium size with text
- ✅ **Landing page** (hero section) - Large size with text
- 🔄 **Future**: Can be added to other pages easily using `<Logo />` component

## 🎯 Customization

You can use the Logo component anywhere:

```tsx
import { Logo } from '@/components/logo'

// Small logo without text
<Logo size="sm" showText={false} />

// Large logo with text
<Logo size="lg" showText={true} />
```

---

**Just add your `logo.png` file to the `public/` folder and it will automatically appear!**
