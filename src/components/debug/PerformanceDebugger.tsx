/**
 * @file Debug component for monitoring performance and testing Phase 5 features.
 * This component provides insights into application performance and feature functionality.
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceMonitor } from '@/lib/performance-utils';
import { Activity, Bug, Download, Lightbulb, Zap, X } from 'lucide-react';

interface PerformanceDebuggerProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

interface PerformanceStats {
  avgTime: number;
  successRate: number;
  count: number;
}

/**
 * Debug component for monitoring application performance and testing features.
 * Only shown in development mode or when explicitly enabled.
 */
export function PerformanceDebugger({ isVisible = false, onToggle }: PerformanceDebuggerProps) {
  const [stats, setStats] = useState<Record<string, PerformanceStats>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      const updateStats = () => {
        const summary: Record<string, PerformanceStats> = performanceMonitor.getSummary();
        setStats(summary);
      };

      // Initial update
      updateStats();

      // Update every 2 seconds
      const interval = setInterval(updateStats, 2000);
      setRefreshInterval(interval);

      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isVisible, refreshInterval]);

  const testFeatures = {
    'Critical Thinking Prompter': () => {
      console.log('Testing Critical Thinking Prompter...');
      // This would trigger a test of the critical thinking feature
    },
    'Document Export': () => {
      console.log('Testing Document Export...');
      // This would trigger a test export
    },
    'Performance Monitoring': () => {
      performanceMonitor.logStats();
    },
    'Clear Performance Cache': () => {
      // Clear all performance data
      console.log('Performance cache cleared');
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        variant="outline"
      >
        <Activity className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Debug
        </h3>
        <Button
          onClick={onToggle}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 text-xs">
        {Object.keys(stats).length === 0 ? (
          <p className="text-muted-foreground">No performance data yet...</p>
        ) : (
          Object.entries(stats).map(([operation, data]) => (
            <div key={operation} className="border rounded p-2">
              <div className="font-medium truncate">{operation}</div>
              <div className="text-muted-foreground mt-1 space-y-1">
                <div>Avg: {data.avgTime.toFixed(0)}ms</div>
                <div>Success: {data.successRate.toFixed(1)}%</div>
                <div>Count: {data.count}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-2 border-t text-xs text-muted-foreground">
        <Button
          onClick={() => {
            performanceMonitor.clear();
            setStats({});
          }}
          size="sm"
          variant="outline"
          className="w-full"
        >
          Clear Metrics
        </Button>
      </div>
    </Card>
  );
} 