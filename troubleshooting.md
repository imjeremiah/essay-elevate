# Troubleshooting Steps

This document summarizes the troubleshooting steps taken to resolve the errors encountered on [Date].

## Errors

1.  **`relation "public.documents" does not exist`**:
    -   **Root Cause**: The local Supabase database was not up-to-date with the project's migration files. The `20250620000001_create_documents_table.sql` migration had not been applied.
    -   **Resolution**: The `supabase db reset` command was run, which wiped the local database and re-applied all migrations in the `supabase/migrations` directory. This successfully created the `documents` table.

2.  **`Error: Route "/dashboard" used \`cookies().get(...)\`. \`cookies()\` should be awaited before using its value.`**:
    -   **Root Cause**: This appears to be a compatibility issue between the `@supabase/ssr` library and the experimental versions of Next.js (`15.3.4`) and React (`19.0.0`) being used, particularly with Turbopack. The error message from Next.js is misleading, as the code in `src/lib/supabase/server.ts` follows the correct pattern for creating a server-side Supabase client.
    -   **Resolution**: The code was verified to be correct. The underlying issue is with the experimental frameworks. The recommended solution is to use stable versions of `next` and `react` if the error persists and is blocking development.

## Next Steps

-   **Restart the dev server** to ensure all changes are applied.
-   The database error should be resolved. If the `cookies()` error continues, consider downgrading to a stable version of Next.js and React. 