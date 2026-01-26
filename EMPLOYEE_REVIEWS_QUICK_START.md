# Employee Reviews System - Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### Step 1: Run SQL Migration

1. Open Supabase SQL Editor
2. Copy and paste the entire contents of `supabase/create_employee_reviews_table.sql`
3. **IMPORTANT**: Before running, choose the correct foreign key option:
   - If you have `employer_accounts` table → Uncomment Option 1
   - If you have `employers` table → Uncomment Option 2  
   - If employers are just profiles → Uncomment Option 3
4. Click "Run"

### Step 2: Use Components

```tsx
// Example: Add reviews to any employer page
import { ReviewForm, ReviewList } from "@/components/reviews";

export default function EmployerPage({ employerId }: { employerId: string }) {
  return (
    <div>
      <ReviewForm employerId={employerId} />
      <ReviewList employerId={employerId} showStatistics={true} />
    </div>
  );
}
```

### Step 3: Test

1. Visit `/employer/[some-employer-id]/reviews` (example page included)
2. Submit a review
3. Verify it appears in the list

## ✅ That's it! The system is ready to use.

For full documentation, see `EMPLOYEE_REVIEWS_SYSTEM.md`
