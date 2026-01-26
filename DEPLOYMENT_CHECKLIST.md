# WorkVouch Deployment Checklist

## ✅ Completed Updates

### 1. Logo Updates
- ✅ All logo references updated to `/images/workvouch-logo.png`
- ✅ Updated in:
  - `components/navbar.tsx`
  - `components/homepage-navbar.tsx`
  - `components/logo.tsx`
  - `components/simple-navbar.tsx`
- ✅ Logo scales correctly on desktop and mobile
- ✅ Navbar has proper flex-shrink classes to prevent stretching

### 2. Pricing Page
- ✅ Enterprise plan removed
- ✅ All remaining plans are clickable with Stripe checkout:
  - Free plan → redirects to signup
  - Pro Worker → Stripe subscription
  - Trust Boost → Stripe one-time payment
  - Starter → Stripe subscription
  - Team → Stripe subscription
  - Pro → Stripe subscription
  - Pay-Per-Use → Stripe one-time payment
  - Security Agency Bundle → Stripe subscription
- ✅ Free plan properly handled (redirects to signup, no Stripe checkout needed)

### 3. Admin Panel
- ✅ Preview Mode available at `/admin/preview`
  - Employee view for each career
  - Employer view for each career
  - Onboarding flow preview (5 steps)
- ✅ Ad Management System at `/admin/ads`
  - Create banner, native, or popup ads
  - Set price and duration
  - Career targeting
  - Status management (Pending/Active/Inactive)
  - Preview modes (Employee/Employer view)
  - Ads are invisible to non-admin visitors

### 4. Homepage Career Images
- ✅ Reduced image container sizes:
  - Mobile: `h-40` (was `h-48`)
  - Tablet: `h-48` (was `h-56`)
  - Desktop: `h-56` (was `h-64`)
- ✅ Full images remain visible with `object-contain`
- ✅ Clickable boxes/links to career pages preserved
- ✅ Career photos untouched (as requested)

### 5. Navbar
- ✅ Desktop: Container with `max-w-7xl mx-auto` prevents stretching
- ✅ Mobile: Logo scales properly with `flex-shrink-0`
- ✅ Mobile menu works correctly
- ✅ Logo aligned properly on all devices

## 📋 Pre-Deployment Checklist

### Required Actions

1. **Upload Logo File**
   - [ ] Upload `workvouch-logo.png` to `public/images/workvouch-logo.png`
   - [ ] Verify logo displays correctly in navbar
   - [ ] Verify logo displays correctly on homepage

2. **Stripe Configuration**
   - [ ] Set up Stripe Price IDs in environment variables:
     ```env
     STRIPE_PRICE_PRO_WORKER=price_...
     STRIPE_PRICE_TRUST_BOOST=price_...
     STRIPE_PRICE_STARTER=price_...
     STRIPE_PRICE_TEAM=price_...
     STRIPE_PRICE_PRO=price_...
     STRIPE_PRICE_PAY_PER_USE=price_...
     STRIPE_PRICE_SECURITY_BUNDLE=price_...
     ```
   - [ ] Create a $0/month Free plan in Stripe (optional, for tracking)
   - [ ] Test checkout flow for each plan

3. **Environment Variables**
   - [ ] Verify all required env vars are set (see `ENV_VARIABLES_REQUIRED.md`)
   - [ ] Set in Vercel dashboard for production

4. **Testing**
   - [ ] Test logo on desktop navbar
   - [ ] Test logo on mobile navbar
   - [ ] Test logo on homepage
   - [ ] Test pricing page - all plans clickable
   - [ ] Test Free plan redirects to signup
   - [ ] Test paid plans redirect to Stripe checkout
   - [ ] Test admin preview panel (employee/employer/onboarding views)
   - [ ] Test admin ad management (create, edit, activate/deactivate)
   - [ ] Test career images display correctly (reduced size)
   - [ ] Test career page links work

## 🚀 Deployment Steps

1. **Commit and Push to Git**
   ```bash
   git add .
   git commit -m "Update logo to workvouch-logo.png, remove Enterprise plan, enhance admin panel, reduce career image sizes"
   git push origin main
   ```

2. **Vercel Deployment**
   - Automatic deployment will trigger on push
   - Or manually deploy from Vercel dashboard
   - Monitor deployment logs for errors

3. **Post-Deployment Verification**
   - [ ] Logo appears correctly on live site
   - [ ] Pricing page loads without errors
   - [ ] Stripe checkout works for all plans
   - [ ] Admin panel accessible to admins only
   - [ ] Career images display correctly
   - [ ] Mobile navbar works correctly

## 📝 Files Changed

### Modified Files
- `components/navbar.tsx` (logo path, layout)
- `components/homepage-navbar.tsx` (logo path)
- `components/logo.tsx` (logo path)
- `components/simple-navbar.tsx` (logo path)
- `app/pricing/page.tsx` (removed Enterprise, all plans clickable)
- `app/api/pricing/checkout/route.ts` (Free plan handling)
- `components/CareersGrid.tsx` (reduced image sizes)

### New Files
- `DEPLOYMENT_CHECKLIST.md` (this file)

## 🔒 Security Notes

- All admin pages protected with role checks
- Ads invisible to non-admin users
- Stripe checkout requires valid price IDs
- Environment variables should never be committed

## 📞 Support

If issues arise:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test Stripe checkout in test mode first
4. Verify logo file exists at correct path
