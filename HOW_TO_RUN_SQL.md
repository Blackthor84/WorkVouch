# How to Run SQL Files in Supabase

## ❌ Common Mistake
**Don't paste the file path!** You need to copy the **SQL content** from the file.

## ✅ Correct Steps

### Step 1: Open the SQL File
1. Open `supabase/schema_healthcare_onboarding.sql` in your code editor
2. **Select ALL** the content (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)

### Step 2: Open Supabase SQL Editor
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** (or use an existing query tab)

### Step 3: Paste and Run
1. **Paste** the SQL content you copied (Ctrl+V or Cmd+V)
2. Click **Run** button (or press Ctrl+Enter / Cmd+Enter)

## 📋 Files to Run (in order)

1. **First**: `supabase/schema_healthcare_onboarding.sql`
   - Copy ALL content from this file
   - Paste into Supabase SQL Editor
   - Click Run

2. **Second**: `supabase/fix_signup_trigger_WITH_ROLES.sql`
   - Copy ALL content from this file
   - Paste into Supabase SQL Editor
   - Click Run

## ⚠️ What NOT to Do

❌ **Don't paste**: `supabase/schema_healthcare_onboarding.sql`
❌ **Don't paste**: The file path
❌ **Don't paste**: Just the filename

✅ **Do paste**: The actual SQL code from inside the file

## 🔍 Example

**Wrong:**
```sql
supabase/schema_healthcare_onboarding.sql
```

**Right:**
```sql
-- ============================================================================
-- HEALTHCARE ONBOARDING SCHEMA
-- ============================================================================
-- Adds healthcare-specific tables and fields for the onboarding system
-- ============================================================================

-- Add healthcare to industry_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'industry_type'
  ) THEN
    CREATE TYPE industry_type AS ENUM (
      'law_enforcement',
      'security',
      'hospitality',
      'retail',
      'warehousing',
      'healthcare'
    );
  ELSE
    -- Add healthcare if enum exists but healthcare is not in it
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'healthcare' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'industry_type')
    ) THEN
      ALTER TYPE industry_type ADD VALUE 'healthcare';
    END IF;
  END IF;
END $$;
-- ... (rest of the SQL)
```

## ✅ Success Indicators

After running, you should see:
- ✅ "Success. No rows returned" or similar success message
- ✅ No error messages
- ✅ Tables appear in the Table Editor

If you see errors, check:
- Did you copy the entire file content?
- Are there any syntax errors in the SQL?
- Do the tables already exist? (Some errors are OK if tables exist)
