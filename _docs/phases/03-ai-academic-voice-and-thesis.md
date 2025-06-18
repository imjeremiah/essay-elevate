# Phase 3: AI Enhancement - Academic Voice & Thesis

- **Phase:** 3 of 5
- **Status:** Not Started
- **Goal:** To enhance the MVP by integrating the first two core AI features that differentiate the product from a standard grammar checker: the "Academic Voice Elevator" and the "Thesis Evolution Engine."

---

## Scope and Deliverables

### Scope
- A new real-time suggestion system to identify and elevate casual language.
- A new on-demand feature to analyze and provide feedback on thesis statements.
- Database schema for storing different suggestion types and user feedback on them.
- UI elements to support these new features (e.g., a dedicated sidebar for on-demand analysis).

### Deliverables
- Users receive real-time suggestions to transform informal phrases into academic language.
- A user can highlight their thesis statement and trigger an AI analysis, which is then displayed in a sidebar.
- The UI clearly distinguishes between grammar/spelling suggestions and these more advanced AI features.
- A `suggestions` table is created in the database to log suggestions and user interactions (accept, reject), which is crucial for future improvements.

---

## Actionable Steps

### 1. Database Schema for Suggestions
1.  Create a `suggestions` table in the database.
2.  The schema should include columns for `document_id`, `type` (e.g., 'grammar', 'style', 'thesis'), `original_text`, `suggested_text`, `position`, and `status` ('pending', 'accepted', 'rejected').
3.  Implement RLS policies to ensure users can only access suggestions related to their own documents.

### 2. Implement Academic Voice Elevator (Real-Time)
1.  Create a new Edge Function (`/supabase/functions/academic-voice`) that takes text as input.
2.  Engineer a prompt for the OpenAI API that specifically identifies casual language and offers more sophisticated, academic alternatives.
3.  Modify the editor to call this function alongside the grammar check function.
4.  In the UI, use the "cautionary amber" underline color to distinguish these suggestions.
5.  Log the generated suggestion in the `suggestions` table and update its status when the user interacts with it.

### 3. Implement Thesis Evolution Engine (On-Demand)
1.  Design a sidebar UI for displaying on-demand analysis, following the glassmorphism style from `theme-rules.md`.
2.  Add a button or context menu item in the editor to "Analyze Thesis."
3.  Create a new Edge Function (`/supabase/functions/thesis-analyzer`) that takes the selected text (the thesis) as input.
4.  Engineer a prompt that guides the AI to analyze the thesis for clarity and strength, and to provide several improved alternatives.
5.  When the user triggers the feature, call the function and display the structured feedback in the sidebar. 