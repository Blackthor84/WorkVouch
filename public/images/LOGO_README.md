# WorkVouch Logo (canonical paths)

## Homepage (app/page.tsx)

**File name:** `logo.png`  
**Location:** `public/logo.png`  
**URL:** `http://localhost:3000/logo.png`

Put your real WorkVouch logo here (rename to **`logo.png`**). Must live under **`public`** (not `app/`).

## Optional / other screens

**File name:** `workvouch-logo.png`  
**Location:** `public/images/workvouch-logo.png`  
**URL:** `http://localhost:3000/images/workvouch-logo.png`

Use if other components still reference this path; otherwise prefer `public/logo.png` for simplicity.

## Placeholder in repo

A **minimal valid PNG** may be committed so the URL returns **200** in dev/CI. **Replace it** with your real logo (recommended ~200×50px or proportional).

## Quick test

1. Open `/images/workvouch-logo.png` in the browser → should show an image (not 404).
2. If 404: wrong folder, wrong filename, or file not saved.

## Legacy note

Some older references used `workvouch.png` or `workvouch-logo.png.png` — consolidate on **`workvouch-logo.png`** when updating components.
