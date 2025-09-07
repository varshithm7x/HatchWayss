"use client";

import React from "react";
import { useCallLogs } from "@/hooks/useCallLogs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, DollarSign, MessageCircle } from "lucide-react";

interface CallLogsProps {
  userId: string;
}

export function CallLogs({ userId }: CallLogsProps) {
  const { callLogs, loading, error } = useCallLogs(userId);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error loading call logs: {error}</p>
      </div>
    );
  }

  if (callLogs.length === 0) {
    return (
      <div className="text-center p-8">
        <Phone className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No call logs</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start a call to see your call history here.
        </p>
      </div>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Call History</h2>

      <div className="grid gap-4">
        {callLogs.map((callLog) => (
          <Card key={callLog.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {formatDate(callLog.startedAt)}
                  </span>
                  <Badge className={getStatusColor(callLog.status)}>
                    {callLog.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDuration(callLog.duration)}
                    </span>
                  </div>

                  {callLog.cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        ${callLog.cost.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {callLog.messageCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {callLog.messageCount} messages
                      </span>
                    </div>
                  )}

                  <div className="flex gap-1">
                    {callLog.hasRecording && (
                      <Badge variant="outline" className="text-xs">
                        Recording
                      </Badge>
                    )}
                    {callLog.hasTranscript && (
                      <Badge variant="outline" className="text-xs">
                        Transcript
                      </Badge>
                    )}
                  </div>
                </div>

                {callLog.summary && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {callLog.summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
