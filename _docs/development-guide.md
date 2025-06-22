# Development Guide: EssayElevate

This document provides comprehensive guidelines for developing, maintaining, and deploying the EssayElevate application.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Coding Standards](#coding-standards)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [AI Integration Patterns](#ai-integration-patterns)
6. [Testing Guidelines](#testing-guidelines)
7. [Deployment Process](#deployment-process)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance Procedures](#maintenance-procedures)

---

## Development Setup

### Prerequisites
- **Node.js**: Version 18+ (recommended: 20.x)
- **npm**: Version 9+ (comes with Node.js)
- **Supabase CLI**: Latest version
- **Git**: Version 2.30+
- **VSCode**: Recommended editor with extensions

### Required VSCode Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Initial Setup Steps

#### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/essayelevate.git
cd essayelevate

# Install dependencies
npm install

# Verify installation
npm run dev
```

#### 2. Environment Configuration
Create `.env.local` file in the root directory:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for Edge Functions)
OPENAI_API_KEY=your_openai_api_key

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Performance Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

#### 3. Supabase Local Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase project
supabase init

# Start local Supabase (Docker required)
supabase start

# Run migrations
supabase db reset

# Deploy edge functions locally
supabase functions serve
```

#### 4. Database Setup
```bash
# Run all migrations
supabase db reset

# Seed with test data (optional)
npm run db:seed

# Check database status
supabase status
```

---

## Coding Standards

### File Naming Conventions
```
components/
├── ui/           # Lowercase kebab-case
│   ├── button.tsx
│   └── input.tsx
├── feature/      # Lowercase kebab-case
│   ├── argument-sidebar.tsx
│   └── critical-thinking-prompt.tsx
└── onboarding/   # Lowercase kebab-case
    └── dashboard-tour-modal.tsx

hooks/
├── use-ai-features.ts        # Lowercase kebab-case
└── use-suggestion-engine.ts

utils/
├── export-utils.ts           # Lowercase kebab-case
└── performance-utils.ts

types/
├── index.ts                  # Central type exports
└── api.ts                    # API-specific types
```

### Component Structure Standards
```typescript
/**
 * Component description explaining purpose and usage
 * @param props - Description of props interface
 * @returns JSX.Element
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from '@/lib/types';

interface ComponentNameProps {
  // Prop definitions with JSDoc comments
  /** Description of the prop */
  title: string;
  /** Optional prop with default value */
  variant?: 'primary' | 'secondary';
  /** Event handler prop */
  onAction?: (data: string) => void;
}

/**
 * ComponentName handles specific functionality
 * 
 * Features:
 * - Feature 1 description
 * - Feature 2 description
 * 
 * @param props - ComponentNameProps
 */
export function ComponentName({ 
  title, 
  variant = 'primary', 
  onAction 
}: ComponentNameProps) {
  // State declarations
  const [isLoading, setIsLoading] = useState(false);
  
  // Event handlers with useCallback
  const handleAction = useCallback((value: string) => {
    setIsLoading(true);
    // Logic here
    onAction?.(value);
    setIsLoading(false);
  }, [onAction]);
  
  // Early returns for loading/error states
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="component-container">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button 
        variant={variant}
        onClick={() => handleAction('example')}
      >
        Action Button
      </Button>
    </div>
  );
}
```

### Hook Patterns
```typescript
/**
 * Custom hook for managing AI feature state
 * 
 * @param documentId - Document ID for suggestions
 * @returns Hook state and methods
 */
export function useAIFeature(documentId: string) {
  // State management
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Memoized functions
  const checkGrammar = useCallback(async (text: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/grammar-check', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) throw new Error('Failed to check grammar');
      
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup logic
    };
  }, []);
  
  return {
    suggestions,
    isLoading,
    error,
    checkGrammar
  };
}
```

### TypeScript Standards
```typescript
// Use explicit types for all public APIs
interface APIResponse<T = unknown> {
  data: T;
  error?: string;
  timestamp: string;
}

// Use strict typing for function parameters
function processDocument(
  content: string,
  options: {
    checkGrammar: boolean;
    checkStyle: boolean;
    maxSuggestions?: number;
  }
): Promise<APIResponse<Suggestion[]>> {
  // Implementation
}

// Use discriminated unions for variants
type SuggestionType = 
  | { type: 'grammar'; grammarRule: string }
  | { type: 'style'; styleCategory: string }
  | { type: 'spelling'; correction: string };

// Use utility types appropriately
type PartialUserProfile = Partial<Pick<User, 'name' | 'email' | 'preferences'>>;
```

---

## Component Architecture

### Directory Structure Philosophy
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Route groups for organization
│   ├── dashboard/         # Feature-based routing
│   └── editor/            # Feature-based routing
├── components/
│   ├── ui/                # Reusable UI primitives (Shadcn/ui)
│   ├── feature/           # Feature-specific components
│   ├── onboarding/        # Onboarding-related components
│   └── debug/             # Development/debugging components
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── supabase/          # Supabase client configuration
│   ├── editor/            # Editor-specific utilities
│   └── utils.ts           # General utilities
└── styles/
    └── globals.css        # Global styles and Tailwind
```

### Component Composition Patterns

#### 1. Compound Components
```typescript
// Main component with sub-components
export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="sidebar-container">
      {children}
    </aside>
  );
}

// Sub-components
Sidebar.Header = function SidebarHeader({ 
  title, 
  onClose 
}: { 
  title: string; 
  onClose: () => void; 
}) {
  return (
    <div className="sidebar-header">
      <h3>{title}</h3>
      <Button onClick={onClose}>Close</Button>
    </div>
  );
};

Sidebar.Content = function SidebarContent({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <div className="sidebar-content">{children}</div>;
};

// Usage
<Sidebar>
  <Sidebar.Header title="AI Analysis" onClose={handleClose} />
  <Sidebar.Content>
    <SuggestionList suggestions={suggestions} />
  </Sidebar.Content>
</Sidebar>
```

#### 2. Render Props Pattern
```typescript
interface DataFetcherProps<T> {
  fetchData: () => Promise<T>;
  children: (state: {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

function DataFetcher<T>({ fetchData, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return <>{children({ data, loading, error, refetch })}</>;
}

// Usage
<DataFetcher fetchData={() => fetchSuggestions(documentId)}>
  {({ data, loading, error, refetch }) => (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {data && <SuggestionList suggestions={data} />}
    </div>
  )}
</DataFetcher>
```

---

## State Management

### Local State Guidelines
```typescript
// Use useState for simple component state
const [isOpen, setIsOpen] = useState(false);

// Use useReducer for complex state logic
interface EditorState {
  content: string;
  suggestions: Suggestion[];
  isAnalyzing: boolean;
  selectedSuggestion: string | null;
}

type EditorAction = 
  | { type: 'UPDATE_CONTENT'; payload: string }
  | { type: 'ADD_SUGGESTIONS'; payload: Suggestion[] }
  | { type: 'SELECT_SUGGESTION'; payload: string }
  | { type: 'CLEAR_SUGGESTIONS' };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'UPDATE_CONTENT':
      return { ...state, content: action.payload };
    case 'ADD_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'SELECT_SUGGESTION':
      return { ...state, selectedSuggestion: action.payload };
    case 'CLEAR_SUGGESTIONS':
      return { ...state, suggestions: [], selectedSuggestion: null };
    default:
      return state;
  }
}

// In component
const [state, dispatch] = useReducer(editorReducer, initialState);
```

### Global State with Context
```typescript
// Context for user preferences
interface UserPreferencesContext {
  preferences: UserPreferences;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContext | null>(null);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);
  
  const value = useMemo(() => ({
    preferences,
    updatePreferences
  }), [preferences, updatePreferences]);
  
  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

// Custom hook to use the context
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
```

---

## AI Integration Patterns

### API Call Abstraction
```typescript
// Base API client
class APIClient {
  private baseURL: string;
  private headers: Record<string, string>;
  
  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Specific AI service
class GrammarService {
  constructor(private client: APIClient) {}
  
  async checkGrammar(text: string, options?: GrammarCheckOptions): Promise<GrammarSuggestion[]> {
    const response = await this.client.post<GrammarCheckResponse>(
      '/grammar-check',
      { text, ...options }
    );
    return response.suggestions;
  }
}

// Usage in hooks
export function useGrammarCheck() {
  const client = useAPIClient();
  const grammarService = useMemo(() => new GrammarService(client), [client]);
  
  return useCallback((text: string) => grammarService.checkGrammar(text), [grammarService]);
}
```

### Caching Strategy
```typescript
// LRU Cache for AI responses
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;
  
  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }
  
  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }
}

// Hash function for cache keys
function createCacheKey(text: string, options?: Record<string, unknown>): string {
  const content = JSON.stringify({ text, options });
  return btoa(content).slice(0, 32); // Simple hash
}

// Cached API service
export function useCachedGrammarCheck() {
  const cache = useRef(new LRUCache<GrammarSuggestion[]>());
  const grammarCheck = useGrammarCheck();
  
  return useCallback(async (text: string, options?: GrammarCheckOptions) => {
    const cacheKey = createCacheKey(text, options);
    const cached = cache.current.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await grammarCheck(text, options);
    cache.current.set(cacheKey, result);
    return result;
  }, [grammarCheck]);
}
```

---

## Testing Guidelines

### Unit Testing with Jest
```typescript
// Component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GrammarCheckButton } from '../grammar-check-button';

describe('GrammarCheckButton', () => {
  const mockOnCheck = jest.fn();
  
  beforeEach(() => {
    mockOnCheck.mockClear();
  });
  
  it('should render with correct text', () => {
    render(<GrammarCheckButton onCheck={mockOnCheck} />);
    expect(screen.getByText('Check Grammar')).toBeInTheDocument();
  });
  
  it('should call onCheck when clicked', async () => {
    render(<GrammarCheckButton onCheck={mockOnCheck} />);
    
    fireEvent.click(screen.getByText('Check Grammar'));
    
    await waitFor(() => {
      expect(mockOnCheck).toHaveBeenCalledTimes(1);
    });
  });
  
  it('should show loading state', async () => {
    const slowCheck = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<GrammarCheckButton onCheck={slowCheck} />);
    
    fireEvent.click(screen.getByText('Check Grammar'));
    
    expect(screen.getByText('Checking...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Check Grammar')).toBeInTheDocument();
    });
  });
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useGrammarCheck } from '../use-grammar-check';

// Mock the API
jest.mock('@/lib/api', () => ({
  grammarCheck: jest.fn()
}));

describe('useGrammarCheck', () => {
  it('should return suggestions on successful check', async () => {
    const mockSuggestions = [{ original: 'test', suggestion: 'Test' }];
    (grammarCheck as jest.Mock).mockResolvedValue(mockSuggestions);
    
    const { result } = renderHook(() => useGrammarCheck());
    
    await act(async () => {
      const suggestions = await result.current.checkGrammar('test text');
      expect(suggestions).toEqual(mockSuggestions);
    });
  });
  
  it('should handle errors gracefully', async () => {
    (grammarCheck as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useGrammarCheck());
    
    await act(async () => {
      await expect(result.current.checkGrammar('test')).rejects.toThrow('API Error');
    });
  });
});
```

### Integration Testing
```typescript
// Test full AI workflow
describe('AI Integration Workflow', () => {
  it('should process text through full pipeline', async () => {
    // Setup test environment
    const testText = 'This sentence have errors.';
    
    // Mock Supabase responses
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { suggestions: [{ original: 'have', suggestion: 'has' }] }
    });
    
    // Render component with providers
    render(
      <SupabaseProvider>
        <EditorComponent initialText={testText} />
      </SupabaseProvider>
    );
    
    // Trigger grammar check
    fireEvent.click(screen.getByText('Check Grammar'));
    
    // Verify suggestions appear
    await waitFor(() => {
      expect(screen.getByText('Change "have" to "has"')).toBeInTheDocument();
    });
    
    // Accept suggestion
    fireEvent.click(screen.getByText('Accept'));
    
    // Verify text is updated
    await waitFor(() => {
      expect(screen.getByDisplayValue('This sentence has errors.')).toBeInTheDocument();
    });
  });
});
```

---

## Deployment Process

### Environment Setup
```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_production_openai_key
NEXT_PUBLIC_SITE_URL=https://essayelevate.com
NODE_ENV=production
```

### Deployment Checklist
- [ ] Run full test suite: `npm run test`
- [ ] Type check: `npm run type-check`
- [ ] Lint check: `npm run lint`
- [ ] Build check: `npm run build`
- [ ] Database migrations: `supabase db push`
- [ ] Edge functions deployment: `supabase functions deploy`
- [ ] Environment variables configured
- [ ] Performance budget check
- [ ] Accessibility audit
- [ ] Security headers configured

### CI/CD Pipeline (GitHub Actions)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run analyze

# Performance budget check
npm run lighthouse
```

### Code Splitting Strategies
```typescript
// Dynamic imports for large components
const ArgumentSidebar = dynamic(
  () => import('@/components/feature/argument-sidebar').then(mod => ({ default: mod.ArgumentSidebar })),
  { 
    ssr: false,
    loading: () => <SidebarSkeleton />
  }
);

// Route-based code splitting (automatic with App Router)
// pages/editor/[documentId]/page.tsx is automatically split

// Feature-based splitting
const EditorFeatures = dynamic(() => import('./editor-features'), {
  ssr: false
});
```

### Performance Monitoring
```typescript
// Performance utilities
export function measurePerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = performance.now();
  
  return operation().finally(() => {
    const duration = performance.now() - start;
    console.debug(`${operationName} took ${duration.toFixed(2)}ms`);
    
    // Send to analytics if enabled
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('performance', { operation: operationName, duration });
    }
  });
}

// Usage
const suggestions = await measurePerformance(
  () => checkGrammar(text),
  'grammar-check'
);
```

---

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Issues
```typescript
// Debug connection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    debug: process.env.NODE_ENV === 'development'
  }
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
}
```

#### 2. OpenAI API Issues
```typescript
// Debug API calls
async function debugAPICall(endpoint: string, payload: unknown) {
  console.log(`🔍 Calling ${endpoint} with:`, payload);
  
  const start = Date.now();
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const duration = Date.now() - start;
    console.log(`⏱️ API call took ${duration}ms`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API call failed (${response.status}):`, error);
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API call successful:`, data);
    return data;
  } catch (error) {
    console.error(`💥 API call crashed:`, error);
    throw error;
  }
}
```

#### 3. Performance Issues
```typescript
// React DevTools Profiler integration
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  if (actualDuration > 100) {
    console.warn(`⚠️ Slow render in ${id}:`, {
      phase,
      actualDuration,
      baseDuration
    });
  }
}

// Wrap components to profile
<Profiler id="EditorComponent" onRender={onRenderCallback}>
  <EditorComponent />
</Profiler>
```

### Debugging Tools
```typescript
// Debug component for development
export function DebugPanel({ data }: { data: unknown }) {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <details className="debug-panel">
      <summary>🐛 Debug Information</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

// Performance debug hook
export function usePerformanceDebug(componentName: string) {
  const renderCount = useRef(0);
  const lastRender = useRef(Date.now());
  
  renderCount.current++;
  const timeSinceLastRender = Date.now() - lastRender.current;
  lastRender.current = Date.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 ${componentName} render #${renderCount.current} (+${timeSinceLastRender}ms)`);
  }
}
```

---

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs and fix critical issues
- [ ] Update dependencies with security patches
- [ ] Monitor performance metrics
- [ ] Review user feedback and bug reports

#### Monthly
- [ ] Update all dependencies
- [ ] Performance audit and optimization
- [ ] Security audit
- [ ] Database cleanup and optimization
- [ ] Review and update documentation

#### Quarterly
- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Load testing
- [ ] Disaster recovery testing
- [ ] Team training on new features

### Dependency Management
```bash
# Check for outdated packages
npm outdated

# Update with audit
npm update
npm audit

# Update major versions carefully
npm install package@latest

# Check for vulnerabilities
npm audit --audit-level moderate
```

### Database Maintenance
```sql
-- Analyze database performance
ANALYZE;

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;

-- Monitor query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Monitoring Setup
```typescript
// Error tracking
function setupErrorTracking() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      // Send to error tracking service
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Send to error tracking service
    });
  }
}

// Performance monitoring
function setupPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    // Monitor Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
}
```

---

This development guide provides comprehensive guidelines for maintaining code quality, performance, and reliability in the EssayElevate application. Follow these standards to ensure consistent development practices across the team.