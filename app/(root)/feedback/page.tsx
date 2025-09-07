"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import PageLayout from "@/components/PageLayout";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import { User } from "@/types";

// Force dynamic rendering for this page since it uses authentication
export const dynamic = 'force-dynamic';

interface CallData {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  cost?: number;
  messageCount?: number;
  hasArtifact?: boolean;
}

function FeedbackPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [callData, setCallData] = useState<CallData[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  
  // Get callId from URL parameters if provided
  const urlCallId = searchParams.get('callId');

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check user authentication
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Fetch recent call data
        const response = await fetch('/api/vapi/call-data?limit=10');
        if (response.ok) {
          const calls = await response.json();
          setCallData(calls);

          // If a specific callId is provided in URL, select that call
          if (urlCallId) {
            const targetCall = calls.find((call: CallData) => call.id === urlCallId);
            if (targetCall) {
              setSelectedCall(targetCall);
            }
          } else if (calls.length > 0) {
            // Default to the most recent call
            setSelectedCall(calls[0]);
          }
        }
      } catch (error) {
        console.error("Error initializing feedback page:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [urlCallId]);

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen p-6 pt-32">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-dark-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="min-h-screen p-6 pt-32">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400">You must be logged in to view feedback.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (callData.length === 0) {
    return (
      <PageLayout>
        <div className="min-h-screen p-6 pt-32">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">No Interview Data</h1>
            <p className="text-gray-400">Complete an interview session to see detailed feedback.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen p-6 pt-32">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Interview Feedback</h1>
            <p className="text-gray-400">AI-powered analysis from your interview sessions</p>
          </div>

          {/* Call Selection */}
          {callData.length > 1 && (
            <div className="bg-dark-200 p-4 rounded-lg border border-gray-600">
              <h3 className="text-white font-semibold mb-3">Select Interview Session:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {callData.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedCall?.id === call.id
                        ? 'border-primary-500 bg-primary-900/20'
                        : 'border-gray-600 bg-dark-100 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-white font-medium">
                      {new Date(call.startedAt).toLocaleDateString()}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(call.startedAt).toLocaleTimeString()} • {call.status}
                    </div>
                    {call.messageCount && (
                      <div className="text-gray-500 text-xs">
                        {call.messageCount} messages
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Display */}
          {selectedCall ? (
            <FeedbackDisplay 
              callId={selectedCall.id}
              userId={user.id}
              callData={selectedCall}
            />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-white text-lg mb-2">Select an Interview Session</h3>
              <p className="text-gray-400">Choose a session above to view detailed feedback</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// Loading component for Suspense fallback
function FeedbackPageLoading() {
  return (
    <PageLayout>
      <div className="min-h-screen p-6 pt-32">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-dark-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<FeedbackPageLoading />}>
      <FeedbackPageContent />
    </Suspense>
  );
}
