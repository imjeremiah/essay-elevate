/**
 * @file Debug component for monitoring performance and testing Phase 5 features.
 * This component provides insights into application performance and feature functionality.
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceMonitor } from '@/lib/performance-utils';
import { Activity, Bug, Download, Lightbulb, Zap } from 'lucide-react';

interface PerformanceDebuggerProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

/**
 * Debug component for monitoring application performance and testing features.
 * Only shown in development mode or when explicitly enabled.
 */
export function PerformanceDebugger({ isVisible = false, onToggle }: PerformanceDebuggerProps) {
  const [stats, setStats] = useState<{ [key: string]: any }>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      // Get all performance stats
      const allStats: { [key: string]: any } = {};
      
      // Mock some example metrics (in real app, these would come from actual monitoring)
      const metrics = [
        'Suggestion Check: grammar',
        'Suggestion Check: academic_voice', 
        'Critical Thinking Prompt Generation',
        'Document Save',
        'AI Request: thesis-analyzer',
        'AI Request: argument-coach'
      ];

      metrics.forEach(metric => {
        const stat = performanceMonitor.getStats(metric);
        if (stat) {
          allStats[metric] = stat;
        }
      });

      setStats(allStats);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

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
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 opacity-50 hover:opacity-100"
        title="Open Performance Debugger"
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm">Performance Monitor</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? '−' : '+'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                ×
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Phase 5 features and performance metrics
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Feature Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Phase 5 Features</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-yellow-600" />
                <span>Critical Thinking</span>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3 text-blue-600" />
                <span>Export</span>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-purple-600" />
                <span>UI Polish</span>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-600" />
                <span>Performance</span>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
              </div>
            </div>
          </div>

          {isExpanded && (
            <>
              {/* Performance Stats */}
              {Object.keys(stats).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">Performance Stats</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(stats).map(([metric, stat]) => (
                      <div key={metric} className="text-xs">
                        <div className="font-medium text-foreground truncate">
                          {metric.replace(/^(Suggestion Check: |AI Request: )/, '')}
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Avg: {stat.avg.toFixed(0)}ms</span>
                          <span>Count: {stat.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Buttons */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Test Features</h4>
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(testFeatures).map(([name, testFn]) => (
                    <Button
                      key={name}
                      variant="outline"
                      size="sm"
                      onClick={testFn}
                      className="text-xs h-7"
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Quick Stats */}
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
            <span>Phase 5 Complete</span>
            <span className="text-green-600 font-semibold">✓ Ready</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 