/**
 * @file Shared Components Index
 * Barrel exports for all shared components to simplify imports
 * and improve code organization.
 */

// Main components
export { UnifiedSidebar } from './unified-sidebar';
export { ReviewSuggestionsTab } from './review-suggestions-tab';
export { ThesisAnalysisTab } from './thesis-analysis-tab';

// UI Components
export { SidebarTabs } from './sidebar-tabs';
export { SuggestionCard } from './suggestion-card';
export { FilterPills } from './filter-pills';

// Legacy components (maintained for backward compatibility)
export { WritingSuggestionsSidebar } from './writing-suggestions-sidebar';
export { ThesisAnalysisSidebar } from './thesis-analysis-sidebar';

// Types
export type { 
  WritingSuggestion, 
  SuggestionSeverity 
} from './suggestion-card';

export type { 
  FilterType 
} from './filter-pills';

export type {
  ThesisAnalysisData
} from './thesis-analysis-tab';

// Re-export types for backward compatibility
export type {
  WritingSuggestionsSidebarProps
} from './writing-suggestions-sidebar';

export type {
  ThesisAnalysisSidebarProps  
} from './thesis-analysis-sidebar'; 