# Phase 2: MVP - Core Functionality

- **Phase:** 2 of 5
- **Status:** Not Started
- **Goal:** To build the core, usable features of the application. This phase focuses on delivering the primary value proposition: a functional writing assistant where users can sign up, manage documents, and receive basic real-time feedback.

---

## Scope and Deliverables

### Scope
- Full user authentication flow (sign-up, login, logout).
- A protected dashboard for authenticated users.
- Database schemas and policies for users and documents.
- Full CRUD (Create, Read, Update, Delete) functionality for documents.
- A core text editor interface.
- Real-time grammar and spelling corrections via an Edge Function proxy to the OpenAI API.

### Deliverables
- Users can create an account, log in, and be redirected to a dashboard.
- Users can view a list of their documents, create new ones, open existing ones, and delete them.
- A functional text editor that saves content to the database.
- Underlined suggestions for spelling and grammar appear as the user types.
- All database tables are protected with Row Level Security (RLS).

---

## Actionable Steps

### 1. Implement User Authentication
1.  Set up the Supabase `auth` schema.
2.  Use the `@supabase/ssr` library to create login, sign-up, and logout functionality.
3.  Create the route group `(auth)` with the necessary pages (`/login`, `/signup`).
4.  Implement the Next.js middleware (`src/middleware.ts`) to protect the dashboard routes and handle session redirection.
5.  Create a `users` table with public profiles linked to `auth.users`.

### 2. Build Document Management
1.  Create the `documents` table in Supabase with columns for `id`, `user_id`, `title`, and `content`.
2.  Implement strict RLS policies so users can only access their own documents.
3.  Build the dashboard UI (`/dashboard`) to fetch and display a list of the user's documents.
4.  Add UI elements (e.g., buttons, modals) to create, rename, and delete documents.

### 3. Develop the Core Editor
1.  Create a dynamic route for the editor page, e.g., `/editor/[documentId]`.
2.  Build the editor interface using a simple `textarea` or a basic rich-text editor library.
3.  Fetch the document content from Supabase when the page loads.
4.  Implement logic to auto-save document content to the database periodically as the user types.

### 4. Implement Real-Time Suggestions (Grammar/Spelling)
1.  Create a Supabase Edge Function (`/supabase/functions/grammar-check`) to act as a secure proxy.
2.  This function will take text as input, call the OpenAI API with a prompt to check for grammar/spelling errors, and return a structured list of suggestions.
3.  From the editor, debounce user input and send the current text to the Edge Function.
4.  Parse the suggestions and implement a UI to underline the text at the specified positions with the correct color.
5.  Create a simple popover component that displays the suggestion when an underlined word is clicked. 