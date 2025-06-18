# Project Rules and Conventions

This document outlines the development standards and conventions for the EssayElevate project. Adhering to these rules is essential for maintaining a modular, scalable, and easy-to-understand codebase that is optimized for AI-first development.

---

## 1. Guiding Principles

- **Modularity:** Code should be organized into small, reusable, and single-purpose modules (components, functions, etc.).
- **Scalability:** The architecture and conventions must support future growth in features and user load.
- **Readability:** Code should be self-documenting where possible, with clear names and a logical structure. It should be easy for any developer (or AI assistant) to understand.
- **AI-First:** The codebase is designed to be easily parsed and understood by modern AI tools. This means clear documentation, strict typing, and adherence to file size limits.

---

## 2. Directory Structure

We are using the `src` directory to keep our application code separate from root-level configuration files.

```
essayelevate/
├── public/                  # Static assets (images, fonts, icons)
├── src/
│   ├── app/                 # Next.js App Router: Routes and core layouts
│   │   ├── (auth)/          # Auth-related routes (login, sign-up)
│   │   ├── (dashboard)/     # Protected routes for authenticated users
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/             # API routes (not our primary method, prefer Edge Functions)
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   │
│   ├── components/
│   │   ├── ui/              # Unstyled components from Shadcn/ui (owned by us)
│   │   └── shared/          # Custom, shared application components
│   │
│   ├── lib/
│   │   ├── db.ts            # Database client and query helpers
│   │   ├── supabase.ts      # Supabase client instances (client, server)
│   │   ├── utils.ts         # General utility functions
│   │   └── types.ts         # Core TypeScript types and interfaces
│   │
│   ├── styles/
│   │   └── globals.css      # Global styles, font imports
│   │
│   └── middleware.ts        # Next.js middleware (for auth handling)
│
└── supabase/
    ├── functions/           # Supabase Edge Functions
    │   └── openai-proxy/
    │       └── index.ts
    └── migrations/          # SQL database migration files
```

---

## 3. File Naming Conventions

- **Components:** `PascalCase`. (e.g., `UserAvatar.tsx`, `DocumentCard.tsx`)
- **Pages & Layouts:** `kebab-case`. Next.js requires `page.tsx`, `layout.tsx`, `loading.tsx`, etc.
- **All Other Files:** `kebab-case`. (e.g., `db.ts`, `auth-helpers.ts`)

---

## 4. Code Style and Documentation

- **File Header:** Every file must begin with a block comment explaining its purpose and contents.
  ```typescript
  /**
   * @file This file contains utility functions for handling user authentication
   * with the Supabase client.
   */
  ```

- **Function Documentation:** All functions must be decorated with a TSDoc block comment.
  - **Purpose:** Describe what the function does.
  - **Parameters:** Describe each parameter using `@param`.
  - **Return Value:** Describe the return value using `@returns`.
  ```typescript
  /**
   * Fetches a user's profile from the database.
   * @param userId - The unique identifier of the user.
   * @returns The user's profile object, or null if not found.
   */
  function getUserProfile(userId: string): Promise<UserProfile | null> {
    // ... function logic
  }
  ```

- **File Length:** No file should exceed 500 lines. This forces modularity and improves readability for both humans and AI tools. If a file grows too large, it must be refactored into smaller, more focused modules.

- **Type Safety:** Use TypeScript strict mode. Avoid `any` whenever possible. Define clear types and interfaces in `src/lib/types.ts` and import them where needed.

---

## 5. Commit Message Conventions

We will use the **Conventional Commits** specification. This creates a clean, informative Git history and prepares us for automated versioning and changelog generation.

- **Format:** `<type>[optional scope]: <description>`
- **Common Types:**
  - `feat`: A new feature for the user.
  - `fix`: A bug fix for the user.
  - `docs`: Changes to documentation only.
  - `style`: Code style changes (formatting, etc.).
  - `refactor`: A code change that neither fixes a bug nor adds a feature.
  - `perf`: A code change that improves performance.
  - `chore`: Changes to the build process or auxiliary tools.

- **Examples:**
  - `feat: add user login via email and password`
  - `fix: prevent form submission on enter key press`
  - `docs: update project-rules with commit conventions`
  - `refactor(auth): simplify user session handling in middleware` 