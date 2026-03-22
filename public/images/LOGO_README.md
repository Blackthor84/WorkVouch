# WorkVouch Logo (canonical paths)

## Primary (homepage + most UI)

**File name:** `workvouch-logo.png`  
**Location:** `public/images/workvouch-logo.png`  
**URL:** `http://localhost:3000/images/workvouch-logo.png`

Must live under **`public`** (not `app/`). Name must match **exactly** (case-sensitive on Linux).

## Nuclear / fallback path

**File name:** `logo.png`  
**Location:** `public/logo.png`  
**URL:** `http://localhost:3000/logo.png`

Use this if you want zero folder nesting while debugging path issues.

## Placeholder in repo

A **minimal valid PNG** may be committed so the URL returns **200** in dev/CI. **Replace it** with your real logo (recommended ~200×50px or proportional).

## Quick test

1. Open `/images/workvouch-logo.png` in the browser → should show an image (not 404).
2. If 404: wrong folder, wrong filename, or file not saved.

## Legacy note

Some older references used `workvouch.png` or `workvouch-logo.png.png` — consolidate on **`workvouch-logo.png`** when updating components.
