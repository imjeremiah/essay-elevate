# UI Design Rules: EssayElevate

This document outlines the core design principles for the EssayElevate application. These rules ensure a consistent, user-centric, and effective user interface that supports the writing and learning process.

---

## 1. Clarity and Focus (The "Distraction-Free" Mandate)

- **Principle:** The user's written content is the most important element on the screen. The UI must be subordinate to the text, receding into the background and presenting itself only when necessary.
- **Implementation:**
    - **Ample White Space:** Use generous spacing and padding to avoid a cluttered layout and give content room to breathe.
    - **Minimalist Interface:** The primary writing view should be free of non-essential buttons, icons, and visual noise. Toolbars and menus should be clean and unobtrusive.
    - **Progressive Disclosure:** Reveal advanced tools and options only when the user requests them. Avoid presenting all features at once.

## 2. Responsive and Accessible Design

- **Principle:** All users should have a seamless, high-quality experience regardless of their device (desktop, tablet, or mobile) or abilities.
- **Implementation:**
    - **Mobile-First Approach:** Design for the smallest screen size first, then scale up to larger viewports. This ensures the core functionality is prioritized.
    - **Fluid Layouts:** Use a responsive grid and flexible containers (`flexbox`, `grid`) that adapt to different screen sizes. Avoid fixed-width elements for primary content areas.
    - **Accessibility (a11y):** Ensure all UI elements meet WCAG 2.1 AA standards. This includes sufficient color contrast, keyboard navigability, and proper ARIA attributes for interactive components.

## 3. Trust and Authority

- **Principle:** The application's design must convey credibility and intelligence. Users should trust the feedback they receive.
- **Implementation:**
    - **Consistent Visual Language:** Use the theme defined in `theme-rules.md` consistently across the entire application.
    - **Professional Typography:** Employ a clear typographic hierarchy to structure information logically.
    - **Polished Details:** Pay attention to small details like alignment, spacing, and animations. A polished interface feels more reliable.

## 4. Guidance without Intrusion

- **Principle:** The application must provide powerful, real-time feedback without overwhelming the user or interrupting their creative flow. The user must always feel in control.
- **Implementation:**
    - **Subtle Cues:** Use passive, subtle indicators for real-time suggestions (e.g., colored underlines). Avoid disruptive pop-ups or alerts for minor issues.
    - **User-Initiated Analysis:** For deep-dive features like the "Thesis Evolution Engine" or "Argument Sophistication Coach," require explicit user action to trigger the analysis.
    - **Clear Interaction States:** All interactive elements should have clear `hover`, `focus`, and `active` states to provide immediate visual feedback. Suggestion cards should be easy to accept or dismiss.

## 5. Educational Tone

- **Principle:** The design should support the goal of teaching, not just correcting. The UI should feel like a helpful tutor, not a cold, robotic editor.
- **Implementation:**
    - **Explanatory UI:** When presenting a suggestion, provide a clear, concise explanation of the underlying grammatical or stylistic rule.
    - **Encouraging Microcopy:** Use supportive and positive language in buttons, tooltips, and empty states.
    - **Readable Feedback:** Format feedback in sidebars or cards in a highly legible way, distinct from the user's main text. 