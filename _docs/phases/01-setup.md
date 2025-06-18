# Phase 1: Project Setup & Integration

- **Phase:** 1 of 5
- **Status:** Not Started
- **Goal:** To initialize the project, configure the core technologies, and establish a functional, deployable "hello world" application. This phase creates the foundation upon which all features will be built.

---

## Scope and Deliverables

### Scope
- Initialize Next.js project with TypeScript.
- Set up and configure Supabase for database, auth, and edge functions.
- Integrate Tailwind CSS and Shadcn/ui for styling and components.
- Create a basic application layout and connect the frontend to the Supabase backend.
- Configure Vercel for continuous deployment.

### Deliverables
- A public GitHub repository initialized with the project structure.
- A running Next.js application that can be developed locally.
- A provisioned Supabase project with local development support configured.
- A live, deployed application on Vercel.
- A `src/app/page.tsx` that successfully fetches and displays a test message from the Supabase database, proving the end-to-end connection.

---

## Actionable Steps

### 1. Initialize Next.js Project
1.  Run `npx create-next-app@latest` with the standard project setup options (`src` directory, Tailwind CSS, App Router).
2.  Initialize a Git repository and push the initial project to GitHub.
3.  Set up Prettier with the Tailwind CSS plugin and configure base ESLint rules.
4.  Create the initial directory structure as defined in `project-rules.md`.

### 2. Set Up Supabase
1.  Create a new project on the Supabase dashboard.
2.  Initialize the Supabase CLI and link it to the remote project (`supabase init`, `supabase login`, `supabase link`).
3.  Create a test table (e.g., `messages`) with a simple schema using a SQL migration file in `/supabase/migrations`.
4.  Add the Supabase project URL and anon key to a local `.env.local` file.

### 3. Configure Frontend Stack
1.  Initialize Shadcn/ui in the project (`npx shadcn-ui@latest init`).
2.  Configure `tailwind.config.js` and `src/styles/globals.css` with the fonts and base styles from `theme-rules.md`.
3.  Create the Supabase client helper file (`src/lib/supabase.ts`) for browser and server clients.

### 4. End-to-End Test
1.  Create a Server Component for the landing page (`src/app/page.tsx`).
2.  In this component, use the Supabase server client to fetch data from the test `messages` table.
3.  Display the fetched message on the page.

### 5. Set Up Deployment
1.  Create a new project on Vercel and link it to the GitHub repository.
2.  Configure the Vercel project's environment variables to use the production Supabase keys.
3.  Trigger a deployment and verify that the live URL shows the message fetched from Supabase. 