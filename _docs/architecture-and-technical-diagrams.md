# Architecture & Technical Diagrams: EssayElevate

This document provides comprehensive technical architecture diagrams and system documentation for the EssayElevate application.

---

## 1. System Architecture Overview

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL HOSTING                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              NEXT.JS APPLICATION                    │   │
│  │                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   PAGES     │  │ COMPONENTS  │  │    HOOKS    │  │   │
│  │  │             │  │             │  │             │  │   │
│  │  │ • Landing   │  │ • UI (SHC)  │  │ • AI Engine │  │   │
│  │  │ • Auth      │  │ • Features  │  │ • Debounce  │  │   │
│  │  │ • Dashboard │  │ • Onboard   │  │ • Critical  │  │   │
│  │  │ • Editor    │  │ • Debug     │  │ • Suggest   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                        │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   POSTGRESQL    │  │  EDGE FUNCTIONS │  │    AUTH     │ │
│  │                 │  │                 │  │             │ │
│  │ • Users         │  │ • grammar-check │  │ • Sessions  │ │
│  │ • Documents     │  │ • academic-voice│  │ • Security  │ │
│  │ • Suggestions   │  │ • thesis-analyzer│ │ • RLS       │ │
│  │                 │  │ • argument-coach│  │             │ │
│  │ [RLS Policies]  │  │ • evidence-mentor│ │             │ │
│  │                 │  │ • critical-think│  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    OPENAI SERVICES                         │
│                                                             │
│  ┌─────────────────┐              ┌─────────────────┐      │
│  │    GPT-4O       │              │   GPT-4O-MINI   │      │
│  │                 │              │                 │      │
│  │ • Thesis        │              │ • Grammar       │      │
│  │ • Arguments     │              │ • Real-time     │      │
│  │ • Evidence      │              │ • Fast checks   │      │
│  │ • Academic Voice│              │                 │      │
│  │ • Critical Think│              │                 │      │
│  └─────────────────┘              └─────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Architecture

### AI Suggestion Processing Flow
```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    USER     │    │     EDITOR      │    │   AI ENGINE     │
│   TYPES     │───▶│   DEBOUNCED     │───▶│    HOOKS        │
│   TEXT      │    │   INPUT (500ms) │    │                 │
└─────────────┘    └─────────────────┘    └─────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────┐
│               CACHE CHECK & REQUEST FLOW                    │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   CACHE     │    │   SUPABASE  │    │   OPENAI    │    │
│  │   CHECK     │───▶│   EDGE      │───▶│     API     │    │
│  │             │    │  FUNCTION   │    │             │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                   │                             │
│         ▼                   ▼                             │
│  ┌─────────────┐    ┌─────────────┐                      │
│  │  CACHE HIT  │    │ STRUCTURED  │                      │
│  │   RETURN    │    │ RESPONSE    │                      │
│  └─────────────┘    └─────────────┘                      │
│                              │                             │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  UI RENDERING FLOW                          │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │ SUGGESTION  │    │   EDITOR    │    │    USER     │    │
│  │   MARKS     │───▶│   UPDATE    │───▶│ INTERACTION │    │
│  │  APPLIED    │    │  DISPLAY    │    │             │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Database Query Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CLIENT    │    │ SUPABASE    │    │ POSTGRESQL  │
│   REQUEST   │───▶│    RLS      │───▶│   QUERY     │
│             │    │   CHECK     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   POLICY    │    │   RESULT    │
                   │ EVALUATION  │◀───│    SET      │
                   └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │  FILTERED   │
                   │   RESPONSE  │
                   └─────────────┘
```

---

## 3. Component Hierarchy Diagram

### Frontend Component Structure
```
App Layout (RootLayout)
│
├── Landing Page
│   ├── Header
│   ├── Hero Section
│   ├── Feature Preview
│   └── Footer
│
├── Authentication
│   ├── Login Page
│   │   ├── Login Form
│   │   └── Auth Actions
│   └── Signup Page
│       ├── Signup Form
│       └── Auth Actions
│
├── Dashboard
│   ├── Dashboard Header
│   ├── Document Grid
│   │   ├── Document Card
│   │   └── Document Actions
│   ├── Create Document Button
│   └── Dashboard Client (State)
│
└── Editor
    ├── Editor Header
    │   ├── Document Title
    │   ├── Save Status
    │   └── Export Menu
    ├── Editor Client (Main)
    │   ├── TipTap Editor
    │   ├── Suggestion Extension
    │   └── Auto-save Logic
    ├── AI Sidebar
    │   ├── Grammar Check
    │   ├── Quick Actions
    │   └── Suggestion List
    ├── Feature Components
    │   ├── Argument Sidebar
    │   ├── Critical Thinking Prompt
    │   └── Margin Comments
    ├── Onboarding
    │   ├── Editor Tour Modal
    │   └── Tour Data
    └── Debug
        └── Performance Debugger
```

### Hook Dependencies
```
Editor Client
│
├── useSuggestionEngine
│   ├── useCallback (checkText)
│   ├── useCallback (checkEvidence)
│   ├── useCallback (analyzeArgument)
│   └── useState (isChecking, error)
│
├── useDebounce
│   └── useEffect (delayed execution)
│
├── useCriticalThinking
│   ├── useState (prompts)
│   ├── useRef (timeouts)
│   └── useCallback (analysis)
│
└── useAIFeatures
    ├── useRef (cache)
    ├── useState (suggestions)
    └── useEffect (cleanup)
```

---

## 4. Database Schema Diagram

### Entity Relationship Diagram
```
┌─────────────────┐         ┌─────────────────┐
│     auth.users  │         │  public.users   │
│                 │         │                 │
│ • id (PK)       │◀────────│ • id (PK/FK)    │
│ • email         │         │ • profile_data  │
│ • created_at    │         │ • preferences   │
│ • auth_data     │         │ • created_at    │
└─────────────────┘         └─────────────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌─────────────────┐
                            │   documents     │
                            │                 │
                            │ • id (PK)       │
                            │ • user_id (FK)  │
                            │ • title         │
                            │ • content (JSON)│
                            │ • created_at    │
                            │ • updated_at    │
                            └─────────────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌─────────────────┐
                            │   suggestions   │
                            │                 │
                            │ • id (PK)       │
                            │ • document_id(FK)│
                            │ • user_id (FK)  │
                            │ • type          │
                            │ • original_text │
                            │ • suggested_text│
                            │ • explanation   │
                            │ • position_start│
                            │ • position_end  │
                            │ • status        │
                            │ • created_at    │
                            │ • updated_at    │
                            └─────────────────┘
```

### Row Level Security (RLS) Policies
```
Table: documents
Policy: "Users can manage their own documents"
Rule: auth.uid() = user_id
Actions: ALL (SELECT, INSERT, UPDATE, DELETE)

Table: suggestions  
Policy: "Users can manage their own suggestions"
Rule: auth.uid() = user_id
Actions: ALL (SELECT, INSERT, UPDATE, DELETE)

Table: users
Policy: "Users can view and edit their own profile"
Rule: auth.uid() = id
Actions: ALL (SELECT, INSERT, UPDATE, DELETE)
```

---

## 5. AI Processing Pipeline

### Edge Function Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                  EDGE FUNCTION STRUCTURE                    │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   CORS      │    │   INPUT     │    │    RATE     │    │
│  │  HANDLER    │───▶│ VALIDATION  │───▶│  LIMITING   │    │
│  │             │    │             │    │             │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                 │           │
│                                                 ▼           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   ERROR     │    │  RESPONSE   │    │   OPENAI    │    │
│  │  HANDLING   │◀───│ PROCESSING  │◀───│  API CALL   │    │
│  │             │    │             │    │             │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### AI Feature Processing Flow
```
Grammar Check (Fast)
├── Input: Text chunk (< 500 chars)
├── Model: GPT-4o-mini
├── Cache: 5-minute aggressive
├── Output: Grammar suggestions
└── Response: < 1.5 seconds

Academic Voice (Real-time)
├── Input: Paragraph text
├── Model: GPT-4o-mini
├── Cache: Content-based hash
├── Output: Style improvements
└── Response: < 2 seconds

Thesis Analysis (On-demand)
├── Input: Selected thesis text
├── Model: GPT-4o
├── Cache: 10-minute duration
├── Output: Structured alternatives
└── Response: < 3 seconds

Argument Coach (Comprehensive)
├── Input: Full document content
├── Model: GPT-4o
├── Cache: Document hash
├── Output: Categorized suggestions
└── Response: < 4 seconds

Evidence Mentor (Contextual)
├── Input: Quote + surrounding text
├── Model: GPT-4o
├── Cache: Context-based
├── Output: Integration guidance
└── Response: < 2 seconds

Critical Thinking (Background)
├── Input: Paragraph content
├── Model: GPT-4o-mini
├── Cache: Paragraph hash
├── Output: Thought-provoking questions
└── Response: < 1.5 seconds
```

---

## 6. Performance & Caching Architecture

### Caching Strategy Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                           │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   BROWSER       │    │   NEXT.JS       │               │
│  │   CACHE         │    │   CACHE         │               │
│  │                 │    │                 │               │
│  │ • Static Assets │    │ • Page Cache    │               │
│  │ • API Responses │    │ • Component     │               │
│  │ • Images/Fonts  │    │ • Build Cache   │               │
│  └─────────────────┘    └─────────────────┘               │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   APPLICATION   │    │   DATABASE      │               │
│  │   CACHE         │    │   CACHE         │               │
│  │                 │    │                 │               │
│  │ • AI Responses  │    │ • Query Results │               │
│  │ • LRU Cache     │    │ • Connection    │               │
│  │ • 5min Duration │    │ • Pool Cache    │               │
│  └─────────────────┘    └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cache Hit/Miss Flow
```
User Request
     │
     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   HASH      │ Yes  │  CACHE HIT  │      │   RETURN    │
│  CONTENT    │─────▶│   CHECK     │─────▶│  CACHED     │
│             │      │             │      │  RESULT     │
└─────────────┘      └─────────────┘      └─────────────┘
     │                       │
     │ No                    │ No
     ▼                       ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  API CALL   │      │   CACHE     │      │   RETURN    │
│  TO OPENAI  │─────▶│   STORE     │─────▶│  RESULT     │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## 7. Security Architecture

### Authentication & Authorization Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CLIENT    │    │  SUPABASE   │    │  DATABASE   │
│   LOGIN     │───▶│    AUTH     │───▶│  USER       │
│             │    │             │    │  LOOKUP     │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  JWT TOKEN  │    │    RLS      │
                   │  GENERATION │    │  POLICIES   │
                   └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  SESSION    │    │  DATA       │
                   │  STORAGE    │    │  FILTERING  │
                   └─────────────┘    └─────────────┘
```

### API Security Layers
```
Edge Function Request
        │
        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    CORS     │    │   AUTH      │    │    RATE     │
│ VALIDATION  │───▶│  VALIDATION │───▶│  LIMITING   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   ERROR     │    │   INPUT     │    │  OPENAI     │
│  RESPONSE   │◀───│ SANITIZATION│───▶│  API CALL   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 8. Deployment Architecture

### Vercel Deployment Flow
```
┌─────────────────────────────────────────────────────────────┐
│                     GITHUB REPOSITORY                      │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │    MAIN     │    │  FEATURE    │    │   DEVELOP   │    │
│  │   BRANCH    │    │  BRANCHES   │    │   BRANCH    │    │
│  │             │    │             │    │             │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                   │                   │          │
└─────────────────────────────────────────────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ PRODUCTION  │    │  PREVIEW    │    │ DEVELOPMENT │
│ DEPLOYMENT  │    │ DEPLOYMENT  │    │ DEPLOYMENT  │
│             │    │             │    │             │
│ • Auto SSL  │    │ • PR Preview│    │ • Live Dev  │
│ • CDN Edge  │    │ • Testing   │    │ • Hot Reload│
│ • Analytics │    │ • Feedback  │    │ • Debug     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Environment Configuration
```
Development Environment
├── Local Database (Supabase CLI)
├── Local Edge Functions
├── Development OpenAI Keys
└── Debug Logging Enabled

Staging Environment
├── Supabase Staging Project
├── Deployed Edge Functions
├── Testing OpenAI Keys
└── Performance Monitoring

Production Environment
├── Supabase Production Project
├── Optimized Edge Functions
├── Production OpenAI Keys
├── Error Tracking (Sentry)
└── Analytics (Vercel Analytics)
```

---

This comprehensive architecture documentation provides the technical foundation for understanding, maintaining, and scaling the EssayElevate application. 