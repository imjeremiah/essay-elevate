/**
 * @file Filter Pills Component
 * This component provides category filters for suggestions in pill format,
 * styled to match Grammarly's clean design.
 */
'use client';

import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'grammar' | 'academic_voice';

interface FilterPillsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    total: number;
    grammar: number;
    academic_voice: number;
  };
}

/**
 * Filter pills for categorizing suggestions
 */
export function FilterPills({ activeFilter, onFilterChange, counts }: FilterPillsProps) {
  const filters = [
    {
      id: 'all' as FilterType,
      label: 'All',
      count: counts.total,
    },
    {
      id: 'grammar' as FilterType,
      label: 'Grammar & Spelling',
      count: counts.grammar,
    },
    {
      id: 'academic_voice' as FilterType,
      label: 'Formal Writing',
      count: counts.academic_voice,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
            activeFilter === filter.id
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
          )}
        >
          {filter.label}
          {filter.count > 0 && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 text-xs rounded-full",
              activeFilter === filter.id
                ? "bg-blue-200 text-blue-800"
                : "bg-slate-200 text-slate-700"
            )}>
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
} 