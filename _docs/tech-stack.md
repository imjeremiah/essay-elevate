# Technical Stack Guide: EssayElevate

This document serves as the definitive guide for our project's technical stack. It outlines best practices, limitations, conventions, and common pitfalls for each technology to ensure we build a robust, scalable, and maintainable application.

---

## 1. Frontend Framework: Next.js (with App Router)

- **Description:** A production-grade React framework that enables a hybrid of server-side rendering and static generation. The App Router provides a modern, scalable foundation using Server and Client Components.

- **Best Practices:**
    - **Server Components by Default:** Build all components as Server Components unless they require user interactivity (e.g., `onClick`, `useState`). Use the `"use client"` directive only when necessary to keep the client-side bundle small and improve performance.
    - **Data Fetching:** Fetch data directly within Server Components using async/await. This simplifies data fetching logic and avoids the need for client-side fetching hooks like `useEffect`.
    - **Route Organization:** Use folder-based routing for clarity. Leverage route groups `(folder-name)` to organize related routes or segment layouts without affecting the URL structure.
    - **UI Handling:** Implement `loading.tsx` for automatic loading UI and `error.tsx` for graceful error handling within nested routes.

- **Limitations & Common Pitfalls:**
    - **Server vs. Client Logic:** A common pitfall is attempting to use client-side hooks (e.g., `useState`, `useEffect`) or browser-only APIs (e.g., `window`) in a Server Component. This will result in an error.
    - **Passing Props:** You cannot pass non-serializable props, such as functions, from a Server Component to a Client Component. Pass data, and let the Client Component define its own event handlers.

- **Conventions:**
    - `src/app`: All application routes.
    - `src/components`: Shared React components.
    - `src/lib` or `src/utils`: Utility functions, helper scripts, and configuration.
    - `NEXT_PUBLIC_`: Only prefix environment variables with `NEXT_PUBLIC_` if they must be accessible in the browser. All other variables will be server-only by default.

---

## 2. Styling: Tailwind CSS

- **Description:** A utility-first CSS framework for rapid, responsive UI development directly within the markup.

- **Best Practices:**
    - **Embrace Utility-First:** Apply styles directly in JSX/HTML. Avoid using `@apply` excessively in separate CSS files, as it can negate the benefits of co-location and create maintenance overhead.
    - **Extend the Theme:** Customize and extend the default theme via `tailwind.config.js` for project-specific design tokens (colors, spacing, fonts). This is key to maintaining a consistent design system.
    - **Sort Classes:** Use the official Prettier plugin for Tailwind CSS (`prettier-plugin-tailwindcss`) to automatically sort class names in a consistent order, improving readability.

- **Limitations & Common Pitfalls:**
    - **Verbose Markup:** Long strings of utility classes can make JSX less readable. Mitigate this by creating small, reusable components with the styles encapsulated.
    - **Arbitrary Values:** Overusing arbitrary values (e.g., `w-[123px]`) undermines the design system. Stick to the predefined theme values whenever possible.

- **Conventions:**
    - Define semantic color names in `tailwind.config.js` (e.g., `primary`, `secondary`, `destructive`) instead of using raw hex codes in the code.

---

## 3. Component Library: Shadcn/ui

- **Description:** Not a traditional component library, but a collection of beautifully designed, accessible components that you copy directly into your project, giving you full ownership of the code.

- **Best Practices:**
    - **Own Your Components:** Once a component is added, treat it as your own. Feel free to modify it to fit the application's specific needs.
    - **Build Composites:** Create higher-order, domain-specific components by combining several base components from Shadcn (e.g., a `<UserCard>` made from `<Card>`, `<Avatar>`, and `<Button>`).

- **Limitations & Common Pitfalls:**
    - **No Automatic Updates:** Since components are copied, they are not updated via `npm`. To get an updated version of a component, you must re-run the `add` command, which can overwrite your customizations. Be intentional about when and why you update a component.

- **Conventions:**
    - By default, components are installed into `src/components/ui`. Maintain this convention to distinguish them from your custom application components.

---

## 4. Backend-as-a-Service: Supabase

- **Description:** An open-source Firebase alternative providing a PostgreSQL database, authentication, storage, and real-time capabilities.

- **Best Practices:**
    - **Row-Level Security (RLS):** This is non-negotiable for security. RLS must be enabled on all tables containing sensitive or user-specific data. Policies should be restrictive by default.
    - **Database Functions:** For complex queries or business logic, write SQL functions (`pl/pgsql`). This keeps logic close to the data, is highly performant, and can be called securely from your application.
    - **Connection Management:** Use the official `@supabase/ssr` library to handle authentication and session management seamlessly between Server and Client Components in Next.js.

- **Limitations & Common Pitfalls:**
    - **RLS Debugging:** Incorrect RLS policies are a frequent source of bugs, silently causing data to not appear. Test policies thoroughly. A common error is forgetting to write policies for a new table.
    - **Resource Limits:** The free tier has resource limits that can pause your project. Monitor database and API usage as you scale.

- **Conventions:**
    - **Migrations:** All database schema changes (tables, RLS policies, functions) must be managed as SQL migration files within the `/supabase/migrations` directory and checked into version control.

---

## 5. Serverless Functions: Supabase Edge Functions

- **Description:** Deno-based TypeScript functions deployed globally at the edge for low-latency backend logic.

- **Best Practices:**
    - **Single Responsibility:** Keep functions small and focused on a single task (e.g., a function dedicated to calling the OpenAI API).
    - **Secure Secrets:** Manage all API keys and secrets as environment variables via the Supabase dashboard or CLI. Never hardcode them.
    - **Robust Logging:** Implement detailed logging and error handling within every function to facilitate debugging across distributed services.

- **Limitations & Common Pitfalls:**
    - **Deno vs. Node.js:** The most significant consideration. All server-side dependencies used in a function *must* be Deno-compatible. Always verify package compatibility before use.
    - **Cold Starts:** While fast, edge functions can have cold starts. Design the UI to handle this potential latency gracefully with loading indicators.

- **Conventions:**
    - Organize functions into folders within `/supabase/functions`. Each function should have a main `index.ts` entry point.

---

## 6. Hosting: Vercel

- **Description:** The premier hosting platform for Next.js applications, offering seamless Git integration, automatic deployments, and a global CDN.

- **Best Practices:**
    - **Git Integration:** Connect the project's GitHub repository for automatic preview deployments on pull requests and production deployments on merges to the main branch.
    - **Environment Variables:** Manage all environment variables through the Vercel project dashboard, setting different values for production, preview, and development environments.

- **Limitations & Common Pitfalls:**
    - **Debugging:** Debugging server-side issues requires inspecting the Vercel function logs through the dashboard, which is less immediate than local debugging. Well-placed logs are essential.

- **Conventions:**
    - Rely on the Vercel dashboard for configuration. Only use a `vercel.json` file for advanced overrides that cannot be set through the UI.

---

## 7. AI Services: OpenAI GPT-4o API

- **Description:** OpenAI's flagship multimodal model, optimized for speed, cost-effectiveness, and high-level reasoning.

- **Best Practices:**
    - **Backend-Only Calls:** **Never** call the OpenAI API directly from the client. All calls must be proxied through a secure backend route (a Supabase Edge Function in our case) to protect your API key.
    - **Prompt Engineering:** Invest time in crafting specific, context-rich prompts. Use few-shot examples (providing a few examples of desired output in the prompt) to guide the model's response.
    - **Cache Everything:** Implement aggressive caching. Before calling the API, check if an identical request has been made recently. If so, return the cached response from our Postgres database. This is critical for managing costs and performance.

- **Limitations & Common Pitfalls:**
    - **Cost Management:** API usage can become expensive quickly. Caching and careful monitoring are essential to prevent budget overruns.
    - **Latency:** LLM responses are not instantaneous. The UI must be fully asynchronous, informing the user that analysis is in progress.
    - **Prompt Injection:** Be aware of the security risk where a user's input could be crafted to manipulate the LLM. Sanitize inputs and structure prompts to separate user data from your instructions.

- **Conventions:**
    - Store the OpenAI API key securely as a secret in the Supabase project.
    - Create a dedicated library or set of functions for building and managing prompts to keep them organized and maintainable. 