# Vertical Spacing Pattern - Site-Wide Implementation

## Overview
All pages now use consistent vertical spacing using the pattern: `space-y-12 md:space-y-16 lg:space-y-20`

## Pattern Applied

### Main Container Structure
```tsx
<main className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16">
  <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
    {/* All page content sections */}
  </div>
</main>
```

### For Employer Pages (with sidebar)
```tsx
<main className="flex-1 flex flex-col px-6 py-8 md:py-12 lg:py-16">
  <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
    {/* Page content */}
  </div>
</main>
```

## Pages Updated ✅

1. ✅ `/app/page.tsx` - Homepage
2. ✅ `/app/dashboard/page.tsx` - User Dashboard
3. ✅ `/app/pricing/page.tsx` - Pricing Page
4. ✅ `/app/profile/page.tsx` - Profile Page
5. ✅ `/app/messages/page.tsx` - Messages Page
6. ✅ `/app/jobs/page.tsx` - Jobs Listing Page
7. ✅ `/app/settings/page.tsx` - Settings Page
8. ✅ `/app/about/page.tsx` - About Page
9. ✅ `/app/auth/signin/page.tsx` - Sign In Page
10. ✅ `/app/employer/dashboard/page.tsx` - Employer Dashboard
11. ✅ `/app/employer/candidates/page.tsx` - Employer Candidates

## Spacing Values

- **Mobile**: `space-y-12` (48px between sections)
- **Tablet**: `space-y-16` (64px between sections)
- **Desktop**: `space-y-20` (80px between sections)

## To Apply to Remaining Pages

1. Replace `main` className with:
   ```tsx
   className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16"
   ```

2. Wrap all content in:
   ```tsx
   <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
     {/* existing content */}
   </div>
   ```

3. Remove individual `mb-*`, `mt-*`, `space-y-*` classes from sections (except for internal card spacing)

4. For employer pages with sidebar, use:
   ```tsx
   className="flex-1 flex flex-col px-6 py-8 md:py-12 lg:py-16"
   ```

## Component Created

- `/components/page-container.tsx` - Reusable wrapper component (optional, for future use)
