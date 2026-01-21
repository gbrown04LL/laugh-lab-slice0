# Laugh Lab MVP - Setup Guide

## ✅ Completed Setup

The following has been implemented and pushed to GitHub:

### 1. Database Layer (Neon + Drizzle)
- ✅ Drizzle ORM configuration
- ✅ Database schema with two tables:
  - `analyses`: Stores completed analysis results
  - `usage_tracking`: Tracks anonymous user usage (2 free analyses/month)
- ✅ Database migrations created and applied to Neon

### 2. Analysis Pipeline
- ✅ **Stage 1: Prompt A** - LLM joke extraction with complexity classification
- ✅ **Stage 2: Scoring Engine** - Deterministic TypeScript scoring (v2.0.0-canonical)
- ✅ **Stage 3: Prompt B** - LLM coaching feedback generation
- ✅ Pipeline orchestrator that coordinates all three stages

### 3. API Layer
- ✅ `/api/analyze` endpoint with:
  - Fingerprint-based rate limiting
  - Usage tracking (2 free analyses per month)
  - Full pipeline integration
  - Database persistence

### 4. Client-Side
- ✅ Browser fingerprinting for anonymous user tracking
- ✅ Client-side fingerprint utility

---

## 🚀 Vercel Deployment Setup

### Step 1: Add Environment Variables to Vercel

Go to your Vercel project settings and add these environment variables:

#### Required Variables:

```bash
# Neon Database (use the pooled connection string)
DATABASE_URL=postgresql://neondb_owner:npg_kX2mfQjwUA9J@ep-divine-grass-afy847v5-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-actual-api-key-here

# LLM Model (optional, defaults to gpt-4o)
LAUGHLAB_LLM_MODEL=gpt-4o

# Node Environment
NODE_ENV=production
```

### Step 2: Deploy to Vercel

The database tables are already created in Neon, so you can deploy directly:

```bash
# If using Vercel CLI
vercel --prod

# Or push to GitHub and Vercel will auto-deploy
git push origin main
```

### Step 3: Test the API

Once deployed, test the `/api/analyze` endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -H "X-Fingerprint: test-user-123" \
  -d '{
    "script": "Your comedy script here...",
    "format": "sitcom",
    "title": "Test Script"
  }'
```

---

## 📊 Database Schema

### `analyses` table
Stores completed analysis results:
- `id` (uuid, primary key)
- `fingerprint` (text) - User identifier
- `title` (text) - Script title
- `format` (text) - sitcom, feature, sketch, standup
- `script_hash` (text) - SHA256 hash of script
- `result` (jsonb) - Full analysis JSON
- `created_at` (timestamp)

### `usage_tracking` table
Tracks anonymous user usage:
- `id` (uuid, primary key)
- `identifier` (text, unique) - Fingerprint or IP
- `monthly_count` (integer) - Number of analyses this month
- `month_key` (text) - "YYYY-MM" format
- `updated_at` (timestamp)

---

## 🧪 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 📝 API Usage

### POST /api/analyze

**Request:**
```json
{
  "script": "string (100-150,000 chars)",
  "format": "sitcom" | "feature" | "sketch" | "standup" | "auto",
  "title": "string (optional)"
}
```

**Headers:**
```
Content-Type: application/json
X-Fingerprint: <browser-fingerprint> (optional, falls back to IP)
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "timestamp": "ISO-8601",
    "title": "string",
    "format": "string",
    "scriptStats": { ... },
    "jokes": [ ... ],
    "scores": {
      "overallScore": 0-100,
      "percentile": 0-100,
      "metrics": { ... },
      "distribution": { ... },
      "comparison": { ... },
      "gaps": [ ... ]
    },
    "feedback": {
      "summary": { ... },
      "strengths": { ... },
      "opportunities": { ... },
      "coachNote": "string",
      "punchUpSuggestions": [ ... ]
    },
    "timeline": [ ... ]
  },
  "remaining": 1,
  "limit": 2
}
```

**Response (Rate Limited):**
```json
{
  "success": false,
  "error": "You've used all 2 free analyses this month. Upgrade to continue.",
  "remaining": 0,
  "limit": 2
}
```

---

## 🔧 Architecture

### Three-Stage Pipeline

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  Stage 1: LLM   │ --> │  Stage 2: Scoring   │ --> │  Stage 3: LLM   │
│  Joke Extraction│     │  (Deterministic TS) │     │  Coaching       │
│  (Prompt A)     │     │  v2.0.0-canonical   │     │  (Prompt B)     │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
     GPT-4o                 TypeScript               GPT-4o
   Identifies jokes        Calculates metrics       Generates feedback
   & classifications       No randomness            Enthusiastic coach tone
```

### Key Principles
- **Stage 1** output is auditable (joke list with locations)
- **Stage 2** is reproducible (same input = same scores)
- **Stage 3** preserves artistic coaching while maintaining mathematical rigor

---

## 📚 Next Steps

### For MVP Launch:
1. ✅ Database setup complete
2. ✅ Analysis pipeline complete
3. ⏳ Frontend integration (connect UI to `/api/analyze`)
4. ⏳ Add loading states and progress indicators
5. ⏳ Create report visualization components
6. ⏳ Test with sample Seinfeld script

### Post-Launch (Phase 2):
- Add user authentication (Clerk or Lucia)
- Implement Stripe payment integration
- Add paid tier unlocks
- Enable analysis history persistence
- Add PDF export functionality

---

## 🐛 Troubleshooting

### Database Connection Issues
- Verify the `DATABASE_URL` in Vercel environment variables
- Ensure you're using the **pooled** connection string from Neon
- Check that `sslmode=require` is in the connection string

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly
- Check your OpenAI account has sufficient credits
- Ensure the model (`gpt-4o`) is available in your account

### Rate Limiting Not Working
- Check that fingerprints are being sent in the `X-Fingerprint` header
- Verify the `usage_tracking` table exists in Neon
- Check server logs for database errors

---

## 📖 Documentation References

- [Laugh Lab PRD](./LAUGH_LAB_PRD.md) - Full product requirements
- [Neon Documentation](https://neon.tech/docs) - Database docs
- [Drizzle ORM](https://orm.drizzle.team/) - ORM documentation
- [OpenAI API](https://platform.openai.com/docs) - LLM API docs

---

**Status**: ✅ Backend Complete - Ready for Frontend Integration
