"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface CallData {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  cost?: number;
  messageCount?: number;
  hasArtifact?: boolean;
}

export default function RecentCallData() {
  const [callData, setCallData] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCallData = async () => {
      try {
        // Fetch a larger number of calls to calculate total count
        const response = await fetch('/api/vapi/call-data');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Only keep the 4 most recent interviews
          setCallData(data.slice(0, 4));
        } else {
          console.error("Expected array but got:", typeof data);
          setError("Invalid data format received");
        }
      } catch (err) {
        console.error('Error fetching call data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch call data');
      } finally {
        setLoading(false);
      }
    };

    fetchCallData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 mt-8">
        <h2 className="text-white">Recent Interviews</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Loading recent interviews...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 mt-8">
        <h2 className="text-white">Recent Interviews</h2>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-300 text-sm">Unable to load recent interviews</p>
        </div>
      </div>
    );
  }

  if (callData.length === 0) {
    return (
      <div className="flex flex-col gap-6 mt-8">
        <h2 className="text-white">Recent Interviews</h2>
        <div className="text-center py-8">
          <p className="text-gray-400">No interview data available yet</p>
          <Link href="/interview">
            <Button className="mt-4 btn-primary">Start Your First Interview</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-12">
      <div className="flex justify-between items-center">
        <h2 className="text-white">Recent Interviews</h2>
        <Link href="/call-data">
          <Button variant="ghost" className="text-primary-200 hover:text-primary-100">
            View All →
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {callData.map((call, index, array) => {
          // Calculate interview number from the end (most recent gets highest number)
          const interviewNumber = array.length - index;
          
          return (
            <Link
              key={call.id}
              href={`/call-data/${call.id}`}
              className="bg-dark-200 border border-gray-600 rounded-lg p-5 hover:border-primary-200 transition-colors cursor-pointer block"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold">Interview {interviewNumber}</h3>
                  <p className="text-gray-400 text-sm">
                    <span className={`capitalize ${call.status === 'ended' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {call.status}
                    </span>
                  </p>
                </div>
                {call.cost && (
                  <div className="text-right">
                    <p className="text-primary-200 font-semibold">${call.cost.toFixed(4)}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-1 mb-3 text-xs">
                <p className="text-gray-300">
                  {new Date(call.startedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-gray-400 text-xs">
                  {call.messageCount || 0} messages
                </div>
                <div className="text-primary-200 text-xs">
                  View Details →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex justify-center mt-4">
        <Link href="/call-data">
          <Button className="btn-secondary">View All Interviews</Button>
        </Link>
      </div>
    </div>
  );
}
