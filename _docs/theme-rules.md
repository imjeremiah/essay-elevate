# Theme Rules: Academic Modern

This document defines the specific visual styles for the EssayElevate application. Following these rules will create a consistent, sophisticated, and professional "Academic Modern" theme.

---

## 1. Color Palette

Our palette is designed to be scholarly and calm, reducing eye strain and creating a trustworthy feel. Colors will be defined in `tailwind.config.js` for easy access.

- **Background:**
  - `background`: A soft, off-white for the main writing surface to reduce glare. (`#FDFCFB`)
  - `card` / `popover`: A slightly darker, complementary shade for UI surfaces like cards and popovers. (`#F7F5F2`)

- **Text:**
  - `foreground`: A dark, warm gray for body text. Avoids the harshness of pure black. (`#1C1917`)
  - `foreground-muted`: A lighter gray for secondary text or placeholders. (`#78716C`)

- **Primary / Accent:**
  - `primary`: A deep, academic navy blue. Used for primary buttons, active states, and key highlights. (`#1E40AF`)
  - `primary-foreground`: A high-contrast color for text on primary elements. (`#FFFFFF`)

- **Suggestion Indicators (for underlines):**
  - `suggestion-grammar`: A calm blue to indicate grammatical suggestions. (`#2563EB`)
  - `suggestion-style`: A cautionary amber for stylistic or voice suggestions. (`#F59E0B`)
  - `suggestion-spelling`: A clear red for spelling errors. (`#DC2626`)

- **Feedback / Destructive:**
  - `destructive`: A muted red for destructive actions like "Delete." (`#B91C1C`)
  - `destructive-foreground`: Text color for destructive elements. (`#FFFFFF`)

---

## 2. Typography

We will use a combination of a classic serif for headings and a clean sans-serif for body and UI text. This pairing creates a clear hierarchy and enhances readability.

- **Font Families:**
  - **Headings (`font-serif`):** "Lora" (via Google Fonts). Conveys academic authority.
  - **Body & UI (`font-sans`):** "Inter" (via Google Fonts). A highly legible and modern sans-serif.

- **Typographic Scale:**
  - `h1`: 36px, Bold (700)
  - `h2`: 30px, Bold (700)
  - `h3`: 24px, Semi-Bold (600)
  - `p` (Body): 16px, Regular (400)
  - `small`: 14px, Regular (400)

- **Line Height:** Maintain a comfortable line height for readability.
  - Headings: `1.2`
  - Body: `1.6`

---

## 3. Spacing and Layout

We will use an 8-point grid system. All padding, margins, and layout spacing should be a multiple of 8px (e.g., 8, 16, 24, 32). This ensures vertical and horizontal rhythm.

---

## 4. Border Radius

Consistent corner rounding creates a cohesive look.

- `sm`: 4px (for small elements like input fields)
- `md`: 8px (for buttons and cards)
- `lg`: 12px (for larger containers or modals)

---

## 5. Accent Style: Subtle Glassmorphism

This effect is to be used sparingly to create a sense of depth and visually separate primary content from secondary analysis panels.

- **Usage:** Apply this style **only** to the on-demand analysis sidebars (e.g., "Thesis Evolution Engine," "Argument Sophistication Coach").
- **Properties:**
  - **`background`:** Semi-transparent white (`rgba(255, 255, 255, 0.6)`)
  - **`backdrop-blur`:** A significant blur effect (`16px` or `24px`)
  - **`border`:** A subtle 1px solid border with a light color (`rgba(255, 255, 255, 0.8)`) to create a defined edge.
- **Implementation:** This will be achieved in Tailwind CSS using `bg-white/60`, `backdrop-blur-lg`, and `border`.
- **Constraint:** This style must **not** be used on the main editor window, popovers, or buttons. Its purpose is strictly for layered, non-interactive (or read-only) analysis surfaces. 