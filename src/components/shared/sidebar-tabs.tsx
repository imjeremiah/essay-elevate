/**
 * @file Sidebar Tabs Component
 * This component provides clean tab navigation between Review Suggestions and Thesis Analysis,
 * styled with Grammarly-inspired design principles.
 */
'use client';

import { cn } from '@/lib/utils';

export type SidebarTab = 'review' | 'thesis';

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  reviewSuggestionsCount?: number;
}

/**
 * Clean tab navigation for the sidebar
 */
export function SidebarTabs({ 
  activeTab, 
  onTabChange, 
  reviewSuggestionsCount = 0 
}: SidebarTabsProps) {
  return (
    <div className="flex border-b border-slate-200/60 mb-6">
      <button
        onClick={() => onTabChange('review')}
        className={cn(
          "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
          activeTab === 'review'
            ? "border-blue-600 text-blue-600 bg-blue-50/50"
            : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <span>Review Suggestions</span>
          {reviewSuggestionsCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
              {reviewSuggestionsCount}
            </span>
          )}
        </div>
      </button>
      
      <button
        onClick={() => onTabChange('thesis')}
        className={cn(
          "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
          activeTab === 'thesis'
            ? "border-blue-600 text-blue-600 bg-blue-50/50"
            : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
        )}
      >
        Thesis Analysis
      </button>
    </div>
  );
} 