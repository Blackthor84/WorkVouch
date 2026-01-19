# Resume Upload Feature - Setup Instructions

## ✅ Complete Implementation

The WorkVouch Resume Upload feature with AI-powered parsing is now fully implemented!

## 📋 Setup Steps

### 1. Install Dependencies

Run this command to install the required packages:

```bash
npm install pdf-parse mammoth openai
npm install --save-dev @types/pdf-parse
```

### 2. Database Setup

Run these SQL files in your Supabase SQL Editor (in order):

1. **`supabase/schema_resume_upload.sql`**
   - Creates `education`, `skills`, and `resume_files` tables
   - Adds `responsibilities` column to `jobs` table
   - Sets up RLS policies

2. **`supabase/setup_resume_storage.sql`**
   - Creates the `resumes` storage bucket
   - Sets up storage policies for authenticated users

### 3. Environment Variables

Add to your `.env.local` file (optional for AI parsing):

```env
# Optional: For AI-powered resume parsing (OpenAI)
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** If `OPENAI_API_KEY` is not set, the system will use regex-based parsing as a fallback.

### 4. Access the Feature

Navigate to: **`/upload-resume`**

## 🎯 Features

### ✅ Front-End (`/upload-resume`)
- Drag & drop file upload
- File validation (PDF/DOCX, 5MB limit)
- Upload progress bar
- Preview of parsed data
- Edit jobs and education before saving
- Remove items from parsed data
- Clean, modern UI with Tailwind CSS

### ✅ Back-End API Routes

1. **`/api/resume-upload`**
   - Accepts PDF and DOCX files
   - Validates file type and size
   - Extracts text from files
   - Parses resume using AI (OpenAI) or regex fallback
   - Uploads file to Supabase Storage
   - Returns structured JSON data

2. **`/api/save-parsed-profile`**
   - Saves parsed jobs to `jobs` table
   - Saves education to `education` table
   - Saves skills to `skills` table
   - Saves certifications as skills with category
   - Updates profile with contact info and summary

### ✅ Database Tables

- **`education`**: School, degree, field of study, years, GPA
- **`skills`**: Skill name, category, proficiency level
- **`resume_files`**: Tracks uploaded resume files
- **`jobs`**: Enhanced with `responsibilities` column

### ✅ Security

- Authentication required for all operations
- File size limit: 5MB
- File type validation: PDF and DOCX only
- RLS policies on all tables
- Storage bucket policies for user isolation

## 🔧 AI Parsing

The system uses **OpenAI GPT-4** for intelligent resume parsing when `OPENAI_API_KEY` is configured. It extracts:

- **Jobs**: Title, company, dates, location, responsibilities
- **Education**: School, degree, field, years, GPA
- **Skills**: Technical and soft skills
- **Certifications**: Professional certifications
- **Contact Info**: Email, phone
- **Summary**: Professional summary

**Fallback**: If OpenAI is not configured, the system uses regex-based parsing (less accurate but functional).

## 📝 Usage

1. User navigates to `/upload-resume`
2. User drags & drops or selects a PDF/DOCX file
3. User clicks "Upload & Parse Resume"
4. System parses the resume and shows preview
5. User reviews and edits the parsed data
6. User clicks "Save to Profile" to save to database
7. User is redirected to dashboard

## 🎨 UI Components

- Modern drag & drop interface
- Progress bar during upload
- Editable preview cards for jobs and education
- Skill and certification badges
- Error handling with clear messages
- Success confirmation

## 🚀 Next Steps

1. Run the SQL migrations
2. Install npm packages
3. (Optional) Add OpenAI API key for better parsing
4. Test the upload feature
5. Customize parsing logic if needed

---

**The feature is ready to use!** 🎉
