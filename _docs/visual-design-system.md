# Visual Design System Guide: EssayElevate

This document provides visual specifications and examples for the EssayElevate "Academic Modern" design system. Use this guide to ensure consistent visual implementation across all components.

---

## 1. Color Palette

### Primary Colors
```
Background Colors:
- Primary Background: #FDFCFB (HSL: 30, 20%, 98%)
  └── Usage: Main writing surface, reduces eye strain
- Card/Popover: #F7F5F2 (HSL: 30, 14%, 95%)
  └── Usage: UI surfaces, cards, popovers, sidebars

Text Colors:
- Primary Text: #1C1917 (HSL: 24, 10%, 10%)
  └── Usage: Body text, headings, primary content
- Secondary Text: #78716C (HSL: 28, 6%, 45%)
  └── Usage: Placeholders, secondary information, timestamps

Interactive Colors:
- Primary Action: #1E40AF (HSL: 221, 83%, 42%)
  └── Usage: Primary buttons, active states, key highlights
- Primary Action Text: #FFFFFF
  └── Usage: Text on primary buttons and active elements
```

### Suggestion Indicator Colors
```
AI Suggestion Types:
- Grammar Suggestions: #2563EB (Calm Blue)
  └── Usage: Underlines for grammatical errors
- Style/Voice Suggestions: #F59E0B (Cautionary Amber)
  └── Usage: Underlines for academic voice improvements
- Spelling Errors: #DC2626 (Clear Red)
  └── Usage: Underlines for spelling mistakes

Feedback Colors:
- Destructive Actions: #B91C1C (Muted Red)
  └── Usage: Delete buttons, error states
- Destructive Text: #FFFFFF
  └── Usage: Text on destructive elements
```

### Visual Color Examples
```
[Background Swatch: #FDFCFB] Main writing area
[Card Swatch: #F7F5F2] Sidebar and card backgrounds
[Primary Text: #1C1917] This is primary body text
[Secondary Text: #78716C] This is secondary/muted text
[Primary Action: #1E40AF] Primary button background
[Grammar: #2563EB] Grammar suggestion underline
[Style: #F59E0B] Style suggestion underline  
[Spelling: #DC2626] Spelling error underline
```

---

## 2. Typography System

### Font Families
- **Headings (Serif):** Lora, serif
- **Body & UI (Sans-serif):** Inter, sans-serif

### Type Scale & Hierarchy
```
h1 - Display Large
  Font: Lora, Bold (700)
  Size: 36px (2.25rem)
  Line Height: 1.2
  Usage: Main page titles, hero headings

h2 - Display Medium  
  Font: Lora, Bold (700)
  Size: 30px (1.875rem)
  Line Height: 1.2
  Usage: Section headings, modal titles

h3 - Display Small
  Font: Lora, Semi-Bold (600)
  Size: 24px (1.5rem)
  Line Height: 1.2
  Usage: Component headings, card titles

Body Text
  Font: Inter, Regular (400)
  Size: 16px (1rem)
  Line Height: 1.6
  Usage: Paragraph text, UI labels, content

Small Text
  Font: Inter, Regular (400)
  Size: 14px (0.875rem)
  Line Height: 1.4
  Usage: Captions, timestamps, secondary info
```

### Typography Examples
```
# This is an h1 heading in Lora Bold
## This is an h2 heading in Lora Bold  
### This is an h3 heading in Lora Semi-Bold

This is body text in Inter Regular. It maintains excellent readability with a comfortable line height of 1.6 for extended reading sessions.

This is small text in Inter Regular for secondary information.
```

---

## 3. Spacing & Layout System

### 8-Point Grid System
All spacing uses multiples of 8px for consistent vertical and horizontal rhythm:

```
Spacing Scale:
- xs: 4px   (0.25rem)
- sm: 8px   (0.5rem)  
- md: 16px  (1rem)
- lg: 24px  (1.5rem)
- xl: 32px  (2rem)
- 2xl: 48px (3rem)
- 3xl: 64px (4rem)
```

### Component Spacing Examples
```
Card Padding: 24px (lg)
Button Padding: 12px 24px (sm lg)
Input Padding: 12px 16px (sm md)
Section Margin: 32px (xl)
Paragraph Margin: 16px (md)
```

---

## 4. Border Radius System

### Consistent Corner Rounding
```
Border Radius Scale:
- sm: 4px  - Input fields, small elements
- md: 8px  - Buttons, cards, standard components  
- lg: 12px - Large containers, modals, sidebars
```

### Usage Examples
```
Input Fields: border-radius: 4px
Buttons: border-radius: 8px
Cards: border-radius: 8px
Modal Containers: border-radius: 12px
Suggestion Popovers: border-radius: 8px
```

---

## 5. Glassmorphism Accent Style

### Sidebar Glassmorphism Effect
**Usage:** Applied ONLY to on-demand analysis sidebars (Thesis Evolution, Argument Coach)

```css
Glassmorphism Properties:
- Background: rgba(255, 255, 255, 0.6)
- Backdrop Filter: blur(16px)
- Border: 1px solid rgba(255, 255, 255, 0.8)
- Box Shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
```

**Tailwind Implementation:**
```html
<div class="bg-white/60 backdrop-blur-lg border border-white/80 shadow-2xl">
  <!-- Sidebar content -->
</div>
```

**Constraints:**
- ❌ NOT used on main editor
- ❌ NOT used on buttons or popovers
- ✅ ONLY used on layered analysis surfaces

---

## 6. Component Specifications

### Button Styles
```
Primary Button:
- Background: #1E40AF
- Text: #FFFFFF
- Padding: 12px 24px
- Border Radius: 8px
- Font: Inter Medium (500)
- Hover: Darken background by 10%

Secondary Button:
- Background: transparent
- Text: #1E40AF
- Border: 1px solid #1E40AF
- Padding: 12px 24px
- Border Radius: 8px
- Font: Inter Medium (500)
- Hover: Light blue background

Destructive Button:
- Background: #B91C1C
- Text: #FFFFFF
- Padding: 12px 24px
- Border Radius: 8px
- Font: Inter Medium (500)
- Hover: Darken background by 10%
```

### Card Styles
```
Standard Card:
- Background: #F7F5F2
- Border: 1px solid rgba(0, 0, 0, 0.1)
- Border Radius: 8px
- Padding: 24px
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)

Suggestion Card:
- Background: #FFFFFF
- Border: 1px solid [suggestion-color]
- Border Radius: 8px
- Padding: 16px
- Shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
```

### Input Field Styles
```
Text Input:
- Background: #FFFFFF
- Border: 1px solid #E5E7EB
- Border Radius: 4px
- Padding: 12px 16px
- Font: Inter Regular (400)
- Focus: Border color changes to #1E40AF

Textarea (Editor):
- Background: #FDFCFB
- Border: none
- Font: Inter Regular (400)
- Line Height: 1.6
- Focus: Subtle shadow, no border
```

---

## 7. Suggestion Underline Styles

### Visual Appearance
```css
Grammar Suggestions:
- Border Bottom: 2px wavy #2563EB
- Background: rgba(37, 99, 235, 0.1)
- Cursor: pointer

Style Suggestions:
- Border Bottom: 2px wavy #F59E0B  
- Background: rgba(245, 158, 11, 0.1)
- Cursor: pointer

Spelling Errors:
- Border Bottom: 2px wavy #DC2626
- Background: rgba(220, 38, 38, 0.1)
- Cursor: pointer
```

### Hover States
```css
All Suggestions on Hover:
- Background opacity: 0.2
- Border width: 3px
- Add subtle shadow
```

---

## 8. Dark Mode Considerations

While the current implementation focuses on light mode, dark mode variables are prepared:

```css
Dark Mode Colors (Future Implementation):
- Background: #0F172A
- Foreground: #F8FAFC
- Card: #1E293B
- Primary: #3B82F6
- Muted: #64748B
```

---

## 9. Responsive Breakpoints

```css
Breakpoint System:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+
- Large Desktop: 1440px+

Component Adaptations:
- Mobile: Single column, full-width cards
- Tablet: Two-column layout, compact sidebars
- Desktop: Three-column layout, full sidebars
- Large: Wider content area, larger typography
```

---

## 10. Animation & Transition Guidelines

### Micro-Interactions
```css
Standard Transitions:
- Duration: 200ms
- Easing: ease-out
- Properties: color, background-color, border-color, opacity

Hover Effects:
- Buttons: background-color transition
- Cards: shadow transition
- Links: color transition

Loading States:
- Spinner: smooth rotation
- Skeleton: gentle pulse
- Fade-in: opacity transition
```

### Usage Principles
- **Subtle:** Animations should enhance, not distract
- **Fast:** Keep durations under 300ms
- **Purposeful:** Every animation should serve a function
- **Accessible:** Respect `prefers-reduced-motion`

---

This visual design system ensures consistency across all EssayElevate components while maintaining the sophisticated, academic aesthetic that builds trust with users and educators. 