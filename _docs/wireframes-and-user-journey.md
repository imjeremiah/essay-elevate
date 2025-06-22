# Wireframes & User Journey: EssayElevate

This document provides detailed wireframes and user journey maps for the EssayElevate application, showing key screens and interaction flows.

---

## 1. User Journey Overview

### Primary User Flow
```
Landing Page → Sign Up → Dashboard → New Document → Editor → AI Features → Export
     ↓
Authentication Flow
     ↓
Document Management
     ↓
Writing & AI Assistance
     ↓
Final Document
```

---

## 2. Landing Page Wireframe

### Desktop Layout (1200px+)
```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                                │
│  [EssayElevate Logo]              [Login] [Sign Up]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        HERO SECTION                         │
│                    EssayElevate                            │
│                                                             │
│              Your AI-powered writing assistant              │
│                                                             │
│              [Get Started Free]  [Watch Demo]              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     FEATURES PREVIEW                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Grammar     │  │ Academic    │  │ Thesis      │      │
│  │ Check       │  │ Voice       │  │ Analysis    │      │
│  │ [Icon]      │  │ [Icon]      │  │ [Icon]      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Evidence    │  │ Argument    │  │ Critical    │      │
│  │ Integration │  │ Analysis    │  │ Thinking    │      │
│  │ [Icon]      │  │ [Icon]      │  │ [Icon]      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                        FOOTER                               │
│    © 2024 EssayElevate. All rights reserved.              │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌─────────────────────────┐
│      HEADER             │
│  [☰] EssayElevate      │
├─────────────────────────┤
│                         │
│        HERO             │
│    EssayElevate        │
│                         │
│  AI-powered writing     │
│     assistant          │
│                         │
│   [Get Started Free]    │
│                         │
├─────────────────────────┤
│      FEATURES           │
│                         │
│   ┌─────────────────┐   │
│   │   Grammar       │   │
│   │   Check         │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │  Academic       │   │
│   │   Voice         │   │
│   └─────────────────┘   │
│                         │
│   [View All Features]   │
├─────────────────────────┤
│       FOOTER            │
└─────────────────────────┘
```

---

## 3. Authentication Wireframes

### Sign Up Page
```
┌─────────────────────────────────────────────────────────────┐
│                    [← Back to Home]                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     SIGN UP FORM                           │
│                                                             │
│              ┌─────────────────────────┐                   │
│              │     Create Account      │                   │
│              │                         │                   │
│              │  Email: [____________]  │                   │
│              │                         │                   │
│              │  Password: [__________] │                   │
│              │                         │                   │
│              │  Confirm: [___________] │                   │
│              │                         │                   │
│              │    [Create Account]     │                   │
│              │                         │                   │
│              │  Already have account?  │                   │
│              │       [Sign In]         │                   │
│              │                         │                   │
│              └─────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Login Page
```
┌─────────────────────────────────────────────────────────────┐
│                    [← Back to Home]                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      LOGIN FORM                            │
│                                                             │
│              ┌─────────────────────────┐                   │
│              │        Sign In          │                   │
│              │                         │                   │
│              │  Email: [____________]  │                   │
│              │                         │                   │
│              │  Password: [__________] │                   │
│              │                         │                   │
│              │      [Sign In]          │                   │
│              │                         │                   │
│              │  Don't have account?    │                   │
│              │       [Sign Up]         │                   │
│              │                         │                   │
│              └─────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Dashboard Wireframe

### Desktop Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [EssayElevate]    Dashboard        [Profile ⌄] [Logout]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, Student!                 [+ New Document]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 RECENT DOCUMENTS                    │   │
│  │                                                     │   │
│  │  Today                                              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │Essay on     │ │Research     │ │Argument     │  │   │
│  │  │Social Media │ │Paper Draft  │ │Essay Draft  │  │   │
│  │  │             │ │             │ │             │  │   │
│  │  │📄 250 words │ │📄 450 words │ │📄 180 words │  │   │
│  │  │⏰ 2 hrs ago │ │⏰ 4 hrs ago │ │⏰ 6 hrs ago │  │   │
│  │  │[Edit] [⋮]   │ │[Edit] [⋮]   │ │[Edit] [⋮]   │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  │                                                     │   │
│  │  Yesterday                                          │   │
│  │  ┌─────────────┐ ┌─────────────┐                  │   │
│  │  │History      │ │Science      │                  │   │
│  │  │Report       │ │Lab Report   │                  │   │
│  │  │             │ │             │                  │   │
│  │  │📄 820 words │ │📄 390 words │                  │   │
│  │  │⏰ 1 day ago │ │⏰ 1 day ago │                  │   │
│  │  │[Edit] [⋮]   │ │[Edit] [⋮]   │                  │   │
│  │  └─────────────┘ └─────────────┘                  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Dashboard Layout
```
┌─────────────────────────┐
│ [☰] Dashboard    [👤]  │
├─────────────────────────┤
│                         │
│  Welcome back!          │
│                         │
│    [+ New Document]     │
│                         │
├─────────────────────────┤
│    RECENT DOCUMENTS     │
│                         │
│  Today                  │
│                         │
│  ┌─────────────────┐   │
│  │ Essay on Social │   │
│  │ Media           │   │
│  │ 📄 250 words    │   │
│  │ ⏰ 2 hours ago   │   │
│  │ [Edit]    [⋮]   │   │
│  └─────────────────┘   │
│                         │
│  ┌─────────────────┐   │
│  │ Research Paper  │   │
│  │ Draft           │   │
│  │ 📄 450 words    │   │
│  │ ⏰ 4 hours ago   │   │
│  │ [Edit]    [⋮]   │   │
│  └─────────────────┘   │
│                         │
│  [Load More...]         │
│                         │
└─────────────────────────┘
```

---

## 5. Editor Wireframe

### Main Editor Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [←] Essay Title                [💾] [⤴] [⋮]                │
├─────────────────────────────────────────────────────────────┤
│                           |                                 │
│                           |        AI SIDEBAR              │
│                           |                                 │
│     MAIN EDITOR          |  ┌─────────────────────────┐   │
│                           |  │    Grammar Check        │   │
│  [Document title here]    |  │                         │   │
│                           |  │  ⚠️ 3 grammar issues    │   │
│  Paragraph text with     |  │  📝 5 style suggestions  │   │
│  some errors and         |  │  ✨ Academic voice tips  │   │
│  suggestions marked      |  │                         │   │
│  with colored           |  │     [View All]          │   │
│  underlines.             |  │  └─────────────────────────┘   │
│                           |                                 │
│  Another paragraph       |  ┌─────────────────────────┐   │
│  with more content       |  │    Quick Actions        │   │
│  and AI suggestions.     |  │                         │   │
│                           |  │  🎯 [Analyze Thesis]    │   │
│  [Continue writing...]    |  │  🔍 [Check Arguments]   │   │
│                           |  │  💡 [Critical Thinking] │   │
│                           |  │  📊 [Evidence Review]   │   │
│                           |  │                         │   │
│                           |  └─────────────────────────┘   │
│                           |                                 │
│ [💡] <- Critical thinking |                                 │
│      prompt indicator    |                                 │
│                           |                                 │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Editor Layout
```
┌─────────────────────────┐
│ [←] Essay Title    [⋮] │
├─────────────────────────┤
│                         │
│     MAIN EDITOR         │
│                         │
│  [Document title]       │
│                         │
│  Paragraph text with    │
│  some errors and        │
│  suggestions marked     │
│  with colored          │
│  underlines.           │
│                         │
│  Another paragraph      │
│  with more content.     │
│                         │
│  [Continue writing...]  │
│                         │
├─────────────────────────┤
│    [🎯 AI Tools ⌄]     │
├─────────────────────────┤
│                         │
│  ⚠️ 3 grammar issues    │
│  📝 5 style suggestions │
│  ✨ Academic voice tips │
│                         │
│     [View Details]      │
│                         │
└─────────────────────────┘
```

---

## 6. AI Feature Interaction Wireframes

### Grammar Suggestion Popup
```
┌─────────────────────────────────────────────────────────────┐
│  This sentence have some errors in it.                     │
│              ^^^^                                           │
│                                                             │
│  ┌─────────────────────────────────┐                       │
│  │ Grammar Suggestion              │                       │
│  │                                 │                       │
│  │ Change "have" to "has"          │                       │
│  │                                 │                       │
│  │ Explanation: The subject "This  │                       │
│  │ sentence" is singular, so use   │                       │
│  │ the singular verb "has."        │                       │
│  │                                 │                       │
│  │     [Accept]    [Ignore]        │                       │
│  └─────────────────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Academic Voice Suggestion
```
┌─────────────────────────────────────────────────────────────┐
│  This is a really big deal for students.                   │
│          ^^^^^^^^^^^^^^                                     │
│                                                             │
│  ┌─────────────────────────────────┐                       │
│  │ Academic Voice Improvement      │                       │
│  │                                 │                       │
│  │ Change "really big deal" to     │                       │
│  │ "particularly significant"      │                       │
│  │                                 │                       │
│  │ This creates a more formal,     │                       │
│  │ academic tone appropriate for   │                       │
│  │ scholarly writing.              │                       │
│  │                                 │                       │
│  │     [Accept]    [Ignore]        │                       │
│  └─────────────────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Thesis Analysis Sidebar
```
┌─────────────────────────────────────────────────────────────┐
│                           |  THESIS ANALYSIS SIDEBAR        │
│     MAIN EDITOR          |                                 │
│                           |  ┌─────────────────────────┐   │
│  Technology has changed   |  │   Thesis Feedback       │   │
│  society in many ways.   |  │                         │   │
│  ^^^^^^^^^^^^^^^^^^^     |  │ Your thesis is too      │   │
│                           |  │ broad and not arguable. │   │
│                           |  │                         │   │
│                           |  │ IMPROVEMENTS:           │   │
│                           |  │                         │   │
│                           |  │ 🎯 More Specific:       │   │
│                           |  │ "Social media has made  │   │
│                           |  │ teens more anxious..."  │   │
│                           |  │                         │   │
│                           |  │ 🎯 More Arguable:       │   │
│                           |  │ "While smartphones      │   │
│                           |  │ connect us globally..." │   │
│                           |  │                         │   │
│                           |  │ 🎯 Evidence-Based:      │   │
│                           |  │ "Video games should not │   │
│                           |  │ be banned because..."   │   │
│                           |  │                         │   │
│                           |  │  [Use Suggestion]       │   │
│                           |  │  [Close Analysis]       │   │
│                           |  └─────────────────────────┘   │
│                           |                                 │
└─────────────────────────────────────────────────────────────┘
```

### Critical Thinking Prompt
```
┌─────────────────────────────────────────────────────────────┐
│                           |                                 │
│     MAIN EDITOR          |                                 │
│                           |                                 │
│  Social media affects     |                                 │
│  teenagers negatively    |                                 │
│  because it causes       |                                 │
│  anxiety and depression. |                                 │
│                           |                                 │
│ [💡] <- Click here       |  ┌─────────────────────────┐   │
│                           |  │ Critical Thinking       │   │
│                           |  │                         │   │
│                           |  │ 🧠 Consider This:       │   │
│                           |  │                         │   │
│                           |  │ "What evidence supports │   │
│                           |  │ the claim that social   │   │
│                           |  │ media CAUSES anxiety?   │   │
│                           |  │ Could there be other    │   │
│                           |  │ explanations?"          │   │
│                           |  │                         │   │
│                           |  │ This helps you think    │   │
│                           |  │ about causation vs      │   │
│                           |  │ correlation.            │   │
│                           |  │                         │   │
│                           |  │    [Dismiss] [Got It]   │   │
│                           |  └─────────────────────────┘   │
│                           |                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. User Flow Diagrams

### New User Onboarding Flow
```
Landing Page
     ↓
[Sign Up] clicked
     ↓
Account Creation Form
     ↓
Email Verification (optional)
     ↓
Dashboard (Welcome State)
     ↓
[+ New Document] clicked
     ↓
Document Title Input
     ↓
Editor with Tutorial Tour
     ↓
First Writing Session
     ↓
AI Suggestions Appear
     ↓
User Accepts/Ignores Suggestions
     ↓
Document Saved Automatically
```

### Returning User Flow
```
Landing Page
     ↓
[Login] clicked
     ↓
Authentication
     ↓
Dashboard (with documents)
     ↓
[Edit] existing document OR [+ New Document]
     ↓
Editor with content
     ↓
Continuous AI assistance
     ↓
Auto-save & AI suggestions
     ↓
Export or continue writing
```

### AI Feature Usage Flow
```
User writing in editor
     ↓
Real-time suggestions appear (Grammar, Academic Voice)
     ↓
User clicks suggestion
     ↓
Popup with explanation
     ↓
[Accept] or [Ignore]
     ↓
Continue writing
     ↓
User triggers on-demand analysis
     ↓
Sidebar shows detailed feedback
     ↓
User implements changes
     ↓
Document improves iteratively
```

---

## 8. Responsive Design Breakpoints

### Mobile-First Considerations
- **Mobile (< 768px):** Single column, stacked UI, collapsible sidebar
- **Tablet (768px - 1024px):** Two-column layout, compact sidebar
- **Desktop (> 1024px):** Full three-column layout with persistent sidebar

### Key Responsive Changes
1. **Navigation:** Hamburger menu on mobile, full nav on desktop
2. **Editor:** Full-width on mobile, sidebar overlay on tablet, persistent sidebar on desktop
3. **Cards:** Single column on mobile, grid layout on larger screens
4. **Suggestions:** Modal popups on mobile, inline popovers on desktop

---

This wireframe documentation provides a comprehensive visual guide for implementing the EssayElevate user interface across all screen sizes and key user interactions. 