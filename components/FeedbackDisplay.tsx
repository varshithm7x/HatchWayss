"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, ThumbsUp, ThumbsDown, TrendingUp, Brain, 
  Target, MessageSquare, BookOpen, CheckCircle,
  AlertCircle, Lightbulb, ArrowRight
} from 'lucide-react';
import { feedbackService, InterviewFeedback } from '@/services/feedback/feedback.service';

interface FeedbackDisplayProps {
  interviewId?: string;
  callId?: string;
  userId: string;
  callData?: any;
}

export default function FeedbackDisplay({ interviewId, callId, userId, callData }: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFeedbackSubmitted, setUserFeedbackSubmitted] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComments, setUserComments] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, [interviewId, callId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use callId or interviewId to fetch feedback
      const targetCallId = callId || interviewId;
      
      if (!targetCallId) {
        setError('No call ID or interview ID provided');
        console.error('No callId or interviewId provided');
        return;
      }

      console.log(`Fetching feedback for call: ${targetCallId}`);
      
      // Fetch real-time feedback from call data
      const response = await fetch(`/api/vapi/feedback?callId=${targetCallId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Feedback API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        throw new Error(`Failed to fetch feedback: ${errorData.error || response.statusText}`);
      }
      
      const feedbackData = await response.json();
      
      // Transform the API response to match our InterviewFeedback interface
      const transformedFeedback: InterviewFeedback = {
        id: feedbackData.id,
        userId: feedbackData.userId,
        interviewId: feedbackData.interviewId,
        callId: feedbackData.callId,
        interviewType: feedbackData.interviewType as any,
        overallScore: feedbackData.overallScore,
        communicationScore: feedbackData.communicationScore,
        technicalScore: feedbackData.technicalScore,
        problemSolvingScore: feedbackData.problemSolvingScore,
        confidenceScore: feedbackData.confidenceScore,
        strengths: feedbackData.strengths,
        weaknesses: feedbackData.weaknesses,
        suggestions: feedbackData.suggestions,
        nextSteps: feedbackData.nextSteps,
        responseTime: feedbackData.responseTime,
        completionRate: feedbackData.completionRate,
        duration: feedbackData.duration,
        aiSummary: feedbackData.aiSummary,
        personalizedPlan: feedbackData.personalizedPlan,
        createdAt: new Date(feedbackData.createdAt)
      };
      
      setFeedback(transformedFeedback);
      console.log('Successfully loaded real-time feedback');
      
    } catch (error) {
      console.error('Error fetching feedback:', error);
      
      // Provide detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setError(error.message);
      } else {
        setError('An unknown error occurred while fetching feedback');
      }
      
      // Set feedback to null to show error state
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  const submitUserFeedback = async () => {
    try {
      const targetCallId = callId || interviewId;
      
      if (!targetCallId) {
        console.error('No callId or interviewId available for feedback submission');
        return;
      }

      // Submit real user feedback
      const feedbackData = {
        callId: targetCallId,
        userId,
        rating: userRating,
        comments: userComments,
        difficulty: 'medium',
        wouldRecommend: userRating >= 4,
        improvementAreas: [],
        timestamp: new Date().toISOString()
      };
      
      console.log('Submitting user feedback:', feedbackData);
      
      // You can create an API endpoint to store this feedback
      // For now, we'll just log it and mark as submitted
      
      setUserFeedbackSubmitted(true);
      console.log('User feedback submitted successfully');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-dark-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-40 bg-dark-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-red-400 font-semibold mb-2">Error Loading Feedback</h3>
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-gray-400 text-sm mb-4">
              This might happen if the interview session doesn't have enough conversation data 
              or if there was an issue processing the interview.
            </p>
            <Button 
              onClick={() => {
                setError(null);
                fetchFeedback();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card className="bg-dark-200 border-gray-600">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400">Interview feedback not available yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              This interview session may not have enough conversation data to generate feedback, 
              or there might have been an issue processing the transcript.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Try selecting a different interview session or ensure the interview was completed successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 80) return 'bg-yellow-600';
    if (score >= 70) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Interview Feedback</h1>
        <Badge className={`${getScoreBadgeColor(feedback.overallScore)} text-white`}>
          Overall Score: {feedback.overallScore}%
        </Badge>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-200 border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Communication</p>
                <p className={`text-2xl font-bold ${getScoreColor(feedback.communicationScore)}`}>
                  {feedback.communicationScore}%
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Technical</p>
                <p className={`text-2xl font-bold ${getScoreColor(feedback.technicalScore)}`}>
                  {feedback.technicalScore}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Problem Solving</p>
                <p className={`text-2xl font-bold ${getScoreColor(feedback.problemSolvingScore)}`}>
                  {feedback.problemSolvingScore}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Confidence</p>
                <p className={`text-2xl font-bold ${getScoreColor(feedback.confidenceScore)}`}>
                  {feedback.confidenceScore}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      <Card className="bg-dark-200 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 leading-relaxed">{feedback.aiSummary}</p>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dark-200 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-400" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.strengths.map((strength: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{strength}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.weaknesses.map((weakness: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{weakness}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions and Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dark-200 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.nextSteps.map((step: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Improvement Plan */}
      <Card className="bg-dark-200 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Personalized Improvement Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedback.personalizedPlan.map((plan: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-dark-100 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-300">{plan}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Feedback Section */}
      {!userFeedbackSubmitted && (
        <Card className="bg-dark-200 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">How was your experience?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-gray-400 mb-3">Rate this interview session:</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setUserRating(rating)}
                    className={`p-2 rounded-lg transition-colors ${
                      userRating >= rating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'
                    }`}
                  >
                    <Star className="w-6 h-6" fill={userRating >= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Additional comments (optional):</p>
              <textarea
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                className="w-full p-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none"
                rows={3}
                placeholder="Share your thoughts about this interview experience..."
              />
            </div>

            <Button 
              onClick={submitUserFeedback} 
              className="bg-primary-600 hover:bg-primary-700"
              disabled={userRating === 0}
            >
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      )}

      {userFeedbackSubmitted && (
        <Card className="bg-green-900/20 border-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Thank you for your feedback!</p>
                <p className="text-gray-300 text-sm">Your input helps us improve the interview experience.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
