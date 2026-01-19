# How to Run the Warehousing Industry Migration

## The Error You're Seeing

If you see: `ERROR: 42601: syntax error at or near "supabase"`

This means you're trying to run the **file path** instead of the **SQL content**. 

## ✅ Correct Way to Run the Migration

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy the SQL Content

1. Open the file: `supabase/schema_add_warehousing_industry_SAFE.sql`
2. **Copy ALL the SQL content** (not the file path!)
3. The content should start with `-- ============================================================================`
4. And end with `$$ LANGUAGE plpgsql SECURITY DEFINER;`

### Step 3: Paste and Run

1. **Paste** the copied SQL into the Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
3. You should see "Success. No rows returned"

## ⚠️ Important Notes

- **DO NOT** paste the file path like `supabase/schema_add_warehousing_industry.sql`
- **DO** paste the actual SQL code from inside the file
- The SQL file contains SQL commands, not a file path

## Alternative: Use the Safe Version

I've created a safer version: `schema_add_warehousing_industry_SAFE.sql`

This version:
- ✅ Checks if the enum exists before adding to it
- ✅ Handles all edge cases
- ✅ Won't fail if run multiple times

## Quick Copy-Paste Version

If you want to copy directly, here's the SQL (from the SAFE file):

```sql
-- Copy everything from the SAFE file starting here --
-- (See supabase/schema_add_warehousing_industry_SAFE.sql)
```

Just open that file and copy all its contents into Supabase SQL Editor.

## Verification

After running, verify it worked:

```sql
-- Check if 'warehousing' was added to enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'industry_type');

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'warehouse%';
```

You should see:
- `warehousing` in the enum list
- `warehouse_type`, `equipment_operated`, `warehouse_responsibilities`, `warehouse_certifications` columns
