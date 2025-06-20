# EssayElevate

EssayElevate is an AI-powered writing assistant designed to help high school students elevate their academic writing. Going beyond simple grammar and spelling corrections, it provides specialized feedback on thesis strength, argument structure, evidence integration, and academic tone, acting as a personal writing coach.

For a complete breakdown of the project's vision, features, and user flows, please see the documents in the `_docs` directory.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** (free tier works)
- **OpenAI API key** (paid API key required)
- **Vercel account** (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd essayelevate
npm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your actual values
```

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Database Setup

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Start local Supabase (includes database, auth, edge functions)
supabase start

# Apply database migrations
supabase db reset
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 🛠️ Tech Stack

Our stack is built to be modern, scalable, and performant, enabling a rich, real-time user experience.

-   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Component Library:** [Shadcn/ui](https://ui.shadcn.com/)
-   **Backend & DB:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions)
-   **AI Services:** [OpenAI GPT-4o](https://openai.com/index/hello-gpt-4o/)
-   **Hosting:** [Vercel](https://vercel.com/)

For a detailed guide on best practices and conventions for each technology, see `_docs/tech-stack.md`.

---

## 📚 Project Documentation

This project follows a strict set of rules to ensure the codebase remains clean, scalable, and easy to understand for both human and AI developers.

-   **Directory Structure:** A `src` based layout is used. See `_docs/project-rules.md` for the full structure.
-   **File Naming:** Components are `PascalCase`, while all other files are `kebab-case`.
-   **Documentation:** All files must have a file-header comment, and all functions must have a full TSDoc block.
-   **Commit Messages:** We adhere to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

For the complete set of rules, please refer to `_docs/project-rules.md`.

---

## 🚀 Production Deployment

### Step 1: Production Supabase Setup

1. **Create Production Project:**
   ```bash
   # Create a new project at https://supabase.com/dashboard
   # Note your project URL and anon key
   ```

2. **Deploy Database Schema:**
   ```bash
   # Link to your production project
   supabase link --project-ref your-project-ref
   
   # Push database schema to production
   supabase db push
   ```

3. **Deploy Edge Functions:**
   ```bash
   # Deploy all AI functions to production
   supabase functions deploy grammar-check
   supabase functions deploy academic-voice  
   supabase functions deploy thesis-analyzer
   supabase functions deploy evidence-mentor
   supabase functions deploy argument-coach
   supabase functions deploy critical-thinking-prompter
   ```

4. **Configure Secrets:**
   ```bash
   # Set OpenAI API key for edge functions
   supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
   ```

### Step 2: Vercel Deployment

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables:**
   ```bash
   # Add these in Vercel Dashboard → Settings → Environment Variables
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   ```

3. **Deploy:**
   - Vercel will automatically deploy on push to main branch
   - First deployment may take 2-3 minutes

### Step 3: Production Verification

1. **Test Core Features:**
   - [ ] User registration/login
   - [ ] Document creation/editing
   - [ ] All 6 AI features working
   - [ ] Document export functionality

2. **Monitor Performance:**
   - Check Vercel Functions tab for any errors
   - Monitor Supabase edge function logs
   - Verify AI response times < 3 seconds

---

## 🎯 Core Features

### 6 AI-Powered Writing Features

1. **Grammar & Spelling Check** - Real-time error detection and correction
2. **Academic Voice Elevator** - Transform casual language into sophisticated academic tone  
3. **Thesis Evolution Engine** - Improve basic thesis statements into college-level arguments
4. **Evidence Integration Mentor** - Guide students beyond quote-dropping to analytical connections
5. **Argument Sophistication Coach** - Identify logical gaps and reasoning weaknesses
6. **Critical Thinking Prompter** - Generate thought-provoking questions to encourage deeper analysis

### Additional Features

- Real-time collaborative editing
- Document export (TXT, HTML, PDF)
- Performance monitoring and optimization
- Mobile-responsive design
- Comprehensive error handling

---

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   └── feature/        # Feature-specific components
├── lib/                # Utilities and configurations
│   ├── hooks/          # Custom React hooks
│   └── supabase/       # Supabase client configurations
└── styles/             # Global styles

supabase/
├── functions/          # Edge Functions (AI services)
└── migrations/         # Database schema migrations
```

### Contributing

1. Create a feature branch from `main`
2. Make your changes following the project conventions
3. Test thoroughly including all AI features
4. Submit a pull request with clear description

---

## 📊 Performance & Monitoring

- **AI Response Times:** < 2 seconds (grammar), < 4 seconds (complex analysis)
- **Editor Load Time:** < 1 second
- **Real-time Features:** No typing interruption
- **Export Functionality:** All formats working
- **Mobile Responsive:** Optimized for tablets and phones

---

## 🆘 Troubleshooting

### Common Issues

**AI Features Not Working:**
- Verify `OPENAI_API_KEY` is set in Supabase edge functions
- Check edge function logs in Supabase dashboard

**Authentication Issues:**
- Ensure Supabase URLs are correct in environment variables
- Check if Supabase project is active (not paused)

**Local Development:**
- Run `supabase status` to ensure all services are running
- Check `supabase logs` for any errors

### Getting Help

- Check the `_docs/` directory for detailed documentation
- Review Supabase logs for edge function errors
- Verify environment variables match `.env.example`

---

## 📝 License

This project is built for educational purposes as part of an AI-powered application development learning experience. 