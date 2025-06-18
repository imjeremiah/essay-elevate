# Phase 4: AI Enhancement - Evidence & Argument

- **Phase:** 4 of 5
- **Status:** Not Started
- **Goal:** To deepen the application's analytical capabilities by adding AI features that coach students on how to properly integrate evidence and structure strong arguments.

---

## Scope and Deliverables

### Scope
- A real-time feature to detect "quote-dropping" and prompt for analysis.
- An on-demand, full-document analysis feature to identify logical gaps and weak reasoning.
- New UI patterns for delivering feedback (e.g., inline prompts, margin comments).

### Deliverables
- As a user inserts a quote, the app provides a gentle prompt if it's not properly introduced or explained.
- A user can trigger a full "Argument Review" that places comments in the margin next to weak or unsupported claims.
- The application feels less like an editor and more like an interactive writing coach.

---

## Actionable Steps

### 1. Implement Evidence Integration Mentor (Real-Time)
1.  In the editor, add logic to detect when a user pastes or types a string in quotation marks.
2.  Create a new Edge Function (`/supabase/functions/evidence-mentor`) that takes the quote and its surrounding sentences as input.
3.  Engineer a prompt that checks if the quote is properly introduced and followed by analysis.
4.  If the function detects "quote-dropping," display a non-intrusive UI prompt (e.g., a small lightbulb icon) near the quote, offering guidance when clicked.
5.  Log this interaction in the `suggestions` table with a new type, e.g., `evidence`.

### 2. Implement Argument Sophistication Coach (On-Demand)
1.  Add a new "Analyze Argument" button to the main editor toolbar.
2.  Create a new Edge Function (`/supabase/functions/argument-coach`) that takes the entire document content as input.
3.  Engineer a complex prompt that instructs the AI to act as a writing tutor, read the entire essay, and identify specific sentences that contain logical fallacies, unsupported claims, or weak reasoning. The AI should return a list of these sentences and a short explanation for each.
4.  When the analysis is complete, display the feedback as comments in the document's margin, visually linked to the corresponding sentence.
5.  Clicking a comment should highlight the relevant sentence in the text. 