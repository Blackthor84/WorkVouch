# AI-Powered Job Matching Engine - Setup Guide

## ✅ Implementation Complete

The AI-powered job matching engine has been fully implemented using OpenAI embeddings for semantic similarity matching.

## 🚀 Features

1. **Semantic Matching**: Uses OpenAI embeddings to understand job descriptions and candidate profiles
2. **Multi-Factor Scoring**: Combines semantic similarity, trust score, experience, location, and industry
3. **Match Reasons**: Provides human-readable explanations for why candidates match
4. **Ranked Results**: Candidates are automatically sorted by match quality
5. **Fallback Support**: Falls back to traditional filtering if AI fails

## 📋 Setup Instructions

### 1. Install Dependencies

The `openai` package has been installed. No additional setup needed.

### 2. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 3. Add Environment Variable

Add to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. Usage

#### For Employers:

1. Go to `/employer/candidates`
2. Toggle "Enable AI-Powered Matching"
3. Enter:
   - Job Title (required)
   - Job Description (required for AI)
   - Requirements (optional)
   - Other filters (industry, location, etc.)
4. Click "AI Match Candidates"
5. Results are ranked by AI match score (0-100%)

#### API Endpoint:

```typescript
POST /api/ai/match
{
  "jobId": "uuid",
  "jobTitle": "Security Guard",
  "description": "Full job description...",
  "requirements": "Optional requirements...",
  "industry": "security",
  "location": "New York, NY",
  "candidateId": "uuid" // Optional: calculate match for specific candidate
}
```

## 🧠 How It Works

### 1. Embedding Generation

- **Job Embedding**: Combines title, description, requirements, industry, location
- **Candidate Embedding**: Combines job history, skills, industry, location

### 2. Similarity Calculation

Uses cosine similarity to measure how well candidate profile matches job description:
- Score range: 0-1 (0 = no match, 1 = perfect match)
- Higher scores = better semantic alignment

### 3. Multi-Factor Scoring

Final match score (0-100%) combines:
- **40%** Semantic similarity (AI)
- **25%** Trust score
- **20%** Experience match
- **10%** Location match
- **5%** Industry match

### 4. Match Reasons

Automatically generates reasons like:
- "Strong profile-job description match"
- "High trust score with verified work history"
- "Strong relevant experience"
- "Location match"
- "3 peer references"

## 📊 Example Match Scores

| Score Range | Quality | Description |
|-------------|---------|-------------|
| 80-100% | Excellent | Strong match across all factors |
| 60-79% | Good | Solid match with minor gaps |
| 40-59% | Fair | Some alignment, may need review |
| 0-39% | Poor | Weak match, likely not suitable |

## 🔧 Configuration

### Model Used

Currently using `text-embedding-3-small`:
- Cost-effective ($0.02 per 1M tokens)
- Good quality for semantic search
- Fast response times

To change model, edit `lib/ai/embeddings.ts`:

```typescript
model: 'text-embedding-3-large' // Higher quality, more expensive
```

### Scoring Weights

Adjust weights in `lib/ai/matching.ts`:

```typescript
const finalScore =
  semanticScore * 40 +      // AI similarity
  (trustScore / 100) * 25 +  // Trust score
  (experienceScore / 100) * 20 + // Experience
  (locationScore / 100) * 10 +   // Location
  (industryMatch ? 5 : 0)        // Industry
```

## 💰 Cost Estimation

- **Embedding Generation**: ~$0.00002 per job + candidate pair
- **100 searches/day**: ~$0.002/day (~$0.06/month)
- **1,000 searches/day**: ~$0.02/day (~$0.60/month)

Very cost-effective for production use!

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY is not configured"

- Check `.env.local` has `OPENAI_API_KEY=sk-...`
- Restart dev server after adding env variable
- Verify key is valid in OpenAI dashboard

### Error: "Failed to generate embedding"

- Check API key is valid and has credits
- Check OpenAI API status
- Verify network connectivity

### Slow Performance

- Embedding generation takes ~1-2 seconds per candidate
- For large candidate pools, consider caching embeddings
- Use batch processing for better performance

## 🚀 Next Steps (Optional Enhancements)

1. **Caching**: Cache embeddings in database to avoid regenerating
2. **Batch Processing**: Process multiple candidates in parallel
3. **Vector Database**: Use pgvector (Supabase) for faster similarity search
4. **Fine-tuning**: Train custom model on job matching data
5. **A/B Testing**: Compare AI vs traditional search performance

## 📝 Files Created

- `lib/ai/embeddings.ts` - Embedding generation utilities
- `lib/ai/matching.ts` - Matching algorithm and scoring
- `app/api/ai/match/route.ts` - API endpoint
- Updated `lib/actions/employer/candidate-search.ts` - Integrated AI matching
- Updated `components/employer/candidate-search.tsx` - UI for AI matching

## ✅ Status

**FULLY IMPLEMENTED AND READY TO USE**

Just add your OpenAI API key and start matching! 🎉
