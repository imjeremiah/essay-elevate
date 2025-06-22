/**
 * @file Simple dashboard tour modal that explains document creation and getting started.
 * This is a lightweight introduction before users dive into the editor.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Brain, Sparkles } from 'lucide-react';

interface DashboardTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDocument: () => void;
}

/**
 * Simple tour modal for the dashboard focused on getting started
 */
export function DashboardTourModal({ isOpen, onClose, onCreateDocument }: DashboardTourModalProps) {
  const handleCreateAndClose = () => {
    onCreateDocument();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 text-center">
            Welcome to EssayElevate!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hero Section */}
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Writing Assistant
            </h2>
            <p className="text-gray-600 text-sm">
              Transform your writing from casual to college-ready with 5 powerful AI features.
            </p>
          </div>

          {/* Features Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">What you&apos;ll discover:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Real-time grammar checking</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Academic voice transformation</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Thesis statement improvement</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Evidence integration coaching</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Argument strengthening</span>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              Ready to start writing? Create your first document to see these AI features in action!
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleCreateAndClose}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Document
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="text-gray-600"
              >
                Browse Later
              </Button>
            </div>
          </div>

          {/* Hint */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              💡 Look for the &quot;AI Features Tour&quot; button in the editor to see how everything works!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 