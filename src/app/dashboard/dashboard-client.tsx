/**
 * @file Client-side component for dashboard interactions including the simple tour modal.
 * This handles state management for tour functionality in the dashboard.
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Sparkles, X } from 'lucide-react';
import { DashboardTourModal } from '@/components/onboarding/DashboardTourModal';
import { createDocument } from '@/app/dashboard/actions';

interface DashboardClientProps {
  hasDocuments: boolean;
}

/**
 * Client component that provides tour functionality and interactive elements for the dashboard
 */
export function DashboardClient({ hasDocuments }: DashboardClientProps) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isTourCardDismissed, setIsTourCardDismissed] = useState(false);

  // Show tour card for new users or users with few documents
  const shouldShowTourCard = !hasDocuments || !isTourCardDismissed;

  const openTour = () => setIsTourOpen(true);
  const closeTour = () => setIsTourOpen(false);
  const dismissTourCard = () => setIsTourCardDismissed(true);

  const handleCreateDocument = async () => {
    // Create document using server action
    await createDocument();
  };

  return (
    <>
      {/* Tour Trigger Card - only show if not dismissed */}
      {shouldShowTourCard && (
        <div className="mb-6">
          <div 
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 relative"
            onClick={(e) => {
              // Dismiss if clicking outside the content area
              if (e.target === e.currentTarget) {
                dismissTourCard();
              }
            }}
          >
            <button
              onClick={dismissTourCard}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  New to EssayElevate?
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover how AI can transform your writing from casual to college-ready. 
                  Get started with your first document!
                </p>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={openTour}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Quick Start Guide
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={dismissTourCard}
                    className="text-gray-600"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Always available tour button - only show if banner is dismissed */}
      {isTourCardDismissed && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={openTour}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Getting Started
            </Button>
          </div>
        </div>
      )}

      {/* Simple Dashboard Tour Modal */}
      <DashboardTourModal 
        isOpen={isTourOpen} 
        onClose={closeTour}
        onCreateDocument={handleCreateDocument}
      />
    </>
  );
} 