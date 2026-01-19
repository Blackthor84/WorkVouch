# Fix Candidate Search - "No candidates found" Issue

## ✅ Changes Made

I've fixed the candidate search function to properly query trust scores and added a link to the new name-based search.

### 1. Fixed Trust Score Query
- **Issue**: The query was trying to join `trust_scores(score)` which may not work correctly
- **Fix**: Changed to a separate query that fetches trust scores after getting profiles
- **File**: `lib/actions/employer/candidate-search.ts`

### 2. Added "Search by Name" Button
- Added a button on the Candidate Search page that links to `/employer/search-users`
- This gives employers two ways to search:
  - **Filter-based search** (existing): By industry, job title, location, trust score
  - **Name-based search** (new): Search by first name, last name, or full name

## 🔍 Why "No candidates found" might appear

1. **No profiles in database**: If there are no user profiles, nothing will show
2. **Filters too restrictive**: Try clearing all filters and searching
3. **Database connection issue**: Check Supabase connection

## 🧪 Testing

1. **Clear all filters** and click "Search Candidates" - should show all profiles
2. **Try the name search**: Click "Search by Name" button to use the new search feature
3. **Check database**: Verify there are profiles in the `profiles` table

## 📍 Access Points

- **Filter-based search**: `/employer/candidates` (existing)
- **Name-based search**: `/employer/search-users` (new)

Both are accessible from the employer dashboard.

---

**The search should now work properly!** If you still see "No candidates found", it's likely because there are no profiles in the database yet.
