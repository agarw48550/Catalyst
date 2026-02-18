# Project Catalyst (RozgarSathi) 🚀

**AI-Powered Career Platform for India**

Catalyst (RozgarSathi) is a comprehensive career acceleration platform that leverages Google Gemini AI, job aggregation APIs, and intelligent fallback systems to help job seekers in India build better resumes, practice interviews, find jobs, and research career opportunities.

---

## 🌟 Features

### 🤖 AI-Powered Tools
- **Resume Builder**: Create ATS-optimized resumes with Gemini AI suggestions
- **Interview Coach**: Practice with voice-enabled AI interviewer (Gemini 2.5 Flash Native Audio Dialog)
- **Career Research**: Get AI-powered insights on industries, trends, and opportunities
- **Job Matching**: AI-driven job recommendations based on your profile

### 💼 Job Aggregation
- **Multi-Source Search**: Search jobs from NCS, Jooble, and Adzuna
- **Smart Failover**: Automatic fallback when APIs fail
- **Job Tracking**: Save and manage job applications

### 🔒 Robust Architecture
- **Multi-Key Fallback**: Gemini API with primary/secondary/tertiary key support
- **Email Fallback**: Mailgun → Resend automatic failover
- **Job API Failover**: NCS → Jooble → Adzuna smart routing
- **Comprehensive Logging**: Track all API calls, errors, and fallback events

### 🛠️ Debug Dashboard
- **API Logs**: Detailed logs of all API calls and errors
- **Fallback Tracker**: Monitor fallback usage and success rates
- **Health Monitoring**: Check API connectivity and quota status
- **Test Harness**: Test all integrations in one place

---

## 📁 Project Structure

```
/app                    # Next.js 15 App Router pages
  /auth                 # Authentication (login, signup)
  /dashboard            # Main dashboard
  /resume               # Resume builder
  /interview            # Interview practice
  /jobs                 # Job search
  /research             # Career research
  /settings             # User settings

/api                    # Server actions and API routes (to be added)

/components             # React components
  /ui                   # shadcn/ui components
  /forms                # Form components
  /dashboard            # Dashboard components
  /resume               # Resume components
  /interview            # Interview components
  /jobs                 # Job listing components
  /researcher           # Research components
  /chat                 # Chat components
  /settings             # Settings components
  /modals               # Modal dialogs
  /layout               # Layout components

/lib                    # Core libraries
  /ai                   # Gemini AI integration
    - gemini.ts         # Multi-key fallback client
    - index.ts          # Task-based AI wrapper
  /jobs                 # Job API wrappers
    - index.ts          # NCS/Jooble/Adzuna with failover
  /mailers              # Email services
    - index.ts          # Mailgun/Resend with fallback
  /logger               # Logging utilities
    - index.ts          # API logging and error tracking
  /db                   # Database utilities
  /utils                # General utilities

/hooks                  # Custom React hooks
  - use-toast.ts        # Toast notifications

/config                 # Configuration
  - index.ts            # Environment config
  - supabase.ts         # Supabase client
  - db.sql              # Database schema

/debug                  # Debug dashboard
  - page.tsx            # Main debug dashboard

/public                 # Static assets
  /images               # Images
  /icons                # Icons
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- Google Gemini API key
- (Optional) Job API keys (NCS, Jooble, Adzuna)
- (Optional) Email service keys (Mailgun or Resend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/agarw48550/Catalyst.git
   cd Catalyst
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and fill in your API keys:
   - Supabase URL and keys
   - Gemini API key(s)
   - Email service keys (Mailgun or Resend)
   - Job API keys (NCS, Jooble, or Adzuna)

4. **Set up Supabase database**
   
   Run the SQL schema in `/config/db.sql` in your Supabase SQL editor:
   ```bash
   # Copy the contents of config/db.sql and run in Supabase
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

All required environment variables are documented in `.env.local.example`. Key variables:

### Required
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side)
- `GEMINI_API_KEY`: Primary Gemini API key

### Optional (Fallback)
- `GEMINI_API_KEY_SECONDARY`: Secondary Gemini API key
- `GEMINI_API_KEY_TERTIARY`: Tertiary Gemini API key

### Email Services (at least one required)
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`: For Mailgun
- `RESEND_API_KEY`: For Resend

### Job APIs (at least one recommended)
- `NCS_API_KEY`: National Career Service India
- `JOOBLE_API_KEY`: Jooble API
- `ADZUNA_APP_ID`, `ADZUNA_API_KEY`: Adzuna API

### Feature Flags
- `NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD`: Enable debug dashboard (true/false)
- `NEXT_PUBLIC_ENABLE_VOICE_INTERVIEW`: Enable voice interview (true/false)
- `NEXT_PUBLIC_ENABLE_AI_COACH`: Enable AI coach (true/false)

---

## 🤖 AI Integration

### Gemini API
The platform uses Google Gemini AI with intelligent model selection:

- **gemini-2.0-flash-exp**: Fast responses for chat, questions, job matching
- **gemini-1.5-pro**: High-quality analysis for resumes, feedback, research
- **text-embedding-004**: Generate embeddings for semantic search

### Fallback Logic
When the primary Gemini API key fails, the system automatically tries:
1. Primary key
2. Secondary key (if configured)
3. Tertiary key (if configured)

All fallback events are logged to the database and visible in the debug dashboard.

---

## 💼 Job API Integration

### Supported Sources
1. **NCS (National Career Service India)**: Government job portal
2. **Jooble**: International job aggregator
3. **Adzuna**: Job search engine

### Failover Strategy
When searching for jobs, the system tries each API in order until one succeeds:
```
NCS → Jooble → Adzuna
```

You can customize the fallback order in `/config/index.ts`.

---

## 📧 Email Integration

### Supported Services
1. **Mailgun**: Transactional email service
2. **Resend**: Modern email API

### Use Cases
- Welcome emails
- Interview reports (PDF/transcript)
- Job alerts
- Password reset

The system automatically falls back from Mailgun to Resend if the primary service fails.

---

## 🗄️ Database Schema

The platform uses Supabase (PostgreSQL) with the following tables:

- `profiles`: User profiles
- `resumes`: Resume data with vector embeddings
- `interview_sessions`: Interview transcripts and feedback
- `saved_jobs`: Bookmarked jobs
- `api_logs`: API call logs for debugging

See `/config/db.sql` for the complete schema.

---

## 🐛 Debug Dashboard

Access the debug dashboard at `/debug` (must be enabled in environment variables).

### Features
- **API Logs**: View all API calls, errors, and response times
- **Fallback Tracker**: Monitor which fallback keys/services are being used
- **Database Health**: Check Supabase connectivity
- **API Health**: Test all integrations (Gemini, jobs, email)
- **Test Harness**: Test AI models and API endpoints
- **User Impersonation**: Debug issues as specific users

---

## 🔒 Security Best Practices

1. **Never commit API keys**: All keys are in `.env.local` (gitignored)
2. **Use Row Level Security**: Supabase RLS policies protect user data
3. **Server-side validation**: All API calls validated server-side
4. **Rate limiting**: Quotas prevent API abuse
5. **Secure authentication**: Supabase Auth with email/OAuth

---

## 📝 Logging and Monitoring

### API Logging
All API calls are logged to the `api_logs` table with:
- Service name (gemini, mailgun, ncs, etc.)
- Endpoint and method
- Status code
- Response time
- Error messages
- Fallback usage

### Access Logs
View logs in the debug dashboard or query directly:
```typescript
import { getApiLogs } from '@/lib/logger'

const logs = await getApiLogs({ service: 'gemini', limit: 100 })
```

---

## 🛠️ Development

### Build for Production
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Docker support (coming soon)
- Railway, Render, Netlify compatible

---

## 📚 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, shadcn/ui, Tailwind CSS
- **AI**: Google Gemini API
- **Database**: Supabase (PostgreSQL + pgvector)
- **Authentication**: Supabase Auth
- **Email**: Mailgun / Resend
- **Job APIs**: NCS, Jooble, Adzuna
- **TypeScript**: Full type safety

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is private and proprietary.

---

## 🆘 Support

For issues and questions:
- Check the debug dashboard for API errors
- Review logs in `/debug/api-logs`
- Check Supabase logs for database issues
- Verify environment variables are set correctly

---

## 🎯 Roadmap

- [ ] Complete resume builder UI
- [ ] Implement voice interview with Gemini 2.5 Flash
- [ ] Add job application tracking
- [ ] Build career research chat interface
- [ ] Add analytics and insights
- [ ] Mobile app (React Native)
- [ ] LinkedIn integration
- [ ] Resume parsing from PDF
- [ ] Interview scheduling

---

## 💡 Notes

- All API keys support fallback for high availability
- Debug dashboard is only available in development by default
- Vector embeddings enable semantic resume/job search
- Job API caching reduces redundant requests
- Email reports include interview transcripts and AI feedback

---

**Built with ❤️ for Indian job seekers**
