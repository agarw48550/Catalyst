# Project Catalyst - Setup Guide

## 📋 Pre-Flight Checklist

This guide will help you set up and configure Project Catalyst (RozgarSathi) for local development or production deployment.

---

## ✅ Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm, yarn, or pnpm package manager
- [ ] Git installed
- [ ] A Supabase account (free tier works)
- [ ] A Google Gemini API key
- [ ] (Optional) Email service API keys
- [ ] (Optional) Job API keys

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone and Install

```bash
git clone https://github.com/agarw48550/Catalyst.git
cd Catalyst
npm install
```

### 2. Minimum Environment Setup

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add these **required** variables:

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Required - Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Optional - Enable debug dashboard
NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD=true
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `/config/db.sql`
4. Paste and run in the SQL editor

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔧 Full Configuration

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to initialize (~2 minutes)

2. **Get API Keys**
   - Go to Settings → API
   - Copy `URL`, `anon/public key`, and `service_role key`
   - Add to `.env.local`

3. **Run Database Schema**
   - Go to SQL Editor
   - Run the SQL from `/config/db.sql`
   - This creates tables, policies, and triggers

4. **Enable pgvector** (Optional for semantic search)
   - Go to Database → Extensions
   - Search for "vector"
   - Enable the extension

### Gemini API Setup

1. **Get API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key
   - Add to `.env.local` as `GEMINI_API_KEY`

2. **Add Fallback Keys** (Optional but recommended)
   - Create additional API keys for redundancy
   - Add as `GEMINI_API_KEY_SECONDARY` and `GEMINI_API_KEY_TERTIARY`

### Email Services (Optional)

**Option 1: Mailgun**
```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

**Option 2: Resend**
```env
RESEND_API_KEY=re_your-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

The system will automatically use whichever is configured, with Mailgun as primary.

### Job APIs (Optional)

**NCS (National Career Service India)**
```env
NCS_API_KEY=your-ncs-key
NCS_API_URL=https://api.ncs.gov.in
```

**Jooble**
```env
JOOBLE_API_KEY=your-jooble-key
JOOBLE_API_URL=https://jooble.org/api
```

**Adzuna**
```env
ADZUNA_APP_ID=your-app-id
ADZUNA_API_KEY=your-api-key
ADZUNA_API_URL=https://api.adzuna.com/v1/api
```

The system tries each API in order (NCS → Jooble → Adzuna) until one succeeds.

---

## 🧪 Testing Your Setup

### 1. Build Test

```bash
npm run build
```

Should complete without errors.

### 2. Start Development Server

```bash
npm run dev
```

Should start on port 3000.

### 3. Test Pages

- [ ] Landing page: [http://localhost:3000](http://localhost:3000)
- [ ] Login: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
- [ ] Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- [ ] Debug: [http://localhost:3000/debug](http://localhost:3000/debug) (if enabled)

### 4. Test API Health

Visit the debug dashboard ([http://localhost:3000/debug](http://localhost:3000/debug)) to:
- Check Gemini API connectivity
- View API logs
- Monitor fallback usage

---

## 📦 Production Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Add environment variables from `.env.local`

3. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Set `NODE_ENV=production`
   - Set `NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD=false` (for security)

4. **Deploy**
   - Vercel will automatically build and deploy

### Other Platforms

The project works on:
- Railway
- Render
- Netlify
- Any platform supporting Next.js 15+

---

## 🛠️ Troubleshooting

### Build Fails

**Error: "supabaseUrl is required"**
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- For production, set in deployment platform's environment variables

**Error: "Cannot find module"**
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`

### Supabase Errors

**Error: "Invalid API key"**
- Double-check your API keys
- Make sure you're using the correct project

**Error: "RLS policy violation"**
- Run the SQL schema from `/config/db.sql`
- Make sure RLS policies are created

### Gemini API Errors

**Error: "API key not found"**
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Check that the API key is valid

**Error: "Quota exceeded"**
- Add fallback API keys
- Check your quota in Google AI Studio

---

## 📊 Feature Flags

Control features with environment variables:

```env
# Enable debug dashboard (development only)
NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD=true

# Enable voice interview feature
NEXT_PUBLIC_ENABLE_VOICE_INTERVIEW=true

# Enable AI coach
NEXT_PUBLIC_ENABLE_AI_COACH=true

# Enable API logging
ENABLE_API_LOGGING=true

# Set log level (debug, info, warn, error)
LOG_LEVEL=info
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Remove all test/demo API keys
- [ ] Set `NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD=false`
- [ ] Use strong `JWT_SECRET`
- [ ] Enable HTTPS only
- [ ] Review Supabase RLS policies
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Review all public environment variables

---

## 📚 Next Steps

After setup:

1. **Customize Branding**
   - Update logo in `/public`
   - Modify colors in `tailwind.config.js`
   - Update metadata in `app/layout.tsx`

2. **Add Content**
   - Customize landing page copy
   - Add resume templates
   - Configure interview question banks

3. **Integrate Services**
   - Set up email templates
   - Configure job search preferences
   - Add analytics tracking

4. **Test Features**
   - Create test user account
   - Test resume builder
   - Try interview practice
   - Search for jobs

---

## 🆘 Getting Help

If you encounter issues:

1. Check the debug dashboard for errors
2. Review API logs in Supabase
3. Check browser console for client-side errors
4. Verify all environment variables are set
5. Ensure database schema is up to date

---

## 📞 Support

For additional support:
- Check the main README.md
- Review code comments in `/lib` and `/config`
- Check Supabase documentation
- Review Gemini API documentation

---

**Happy Building! 🚀**
