# WorkVouch WV monogram icons (PWA, Android, iOS, favicon)

All icons use the same design: white background, bold geometric “WV” monogram (W: #2563EB, V: #10B981). No gradients, shadows, or distortion. Content fills ~75% of canvas for Android adaptive icon safe zone (no edge touching).

| File | Size | Use |
|------|------|-----|
| icon-1024.png | 1024×1024 | High-DPI / App Store |
| icon-512.png | 512×512 | PWA splash, maskable |
| icon-192.png | 192×192 | PWA, Android home screen |
| apple-touch-icon.png | 180×180 | iOS Add to Home Screen |
| favicon-32.png | 32×32 | Browser tab (primary favicon) |
| favicon-16.png | 16×16 | Browser tab (small) |

**References:** `public/manifest.json` (192, 512); `app/layout.tsx` (favicon-32, apple-touch-icon). Next.js injects `<link rel="manifest" href="/manifest.json" />` from metadata.

**After changing icons:** Clear service worker cache and force PWA refresh (e.g. unregister SW, hard reload, or reinstall PWA) so Android install preview and iOS Add to Home Screen show the WV icon correctly.
