"use client";

import React, { useState } from 'react';
import { InterviewEvaluation, AspectRating, EvaluationResponse } from '@/types';
import { Brain, TrendingUp, CheckCircle, XCircle, AlertCircle, Loader2, Star } from 'lucide-react';

interface InterviewEvaluationProps {
  callId: string;
  messages: any[];
  callDetails: any;
  className?: string;
}

export default function InterviewEvaluationComponent({ 
  callId, 
  messages, 
  callDetails, 
  className = "" 
}: InterviewEvaluationProps) {
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!messages || messages.length === 0) {
      setError('No conversation found to evaluate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vapi/call-data/${callId}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          callDetails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 503) {
          throw new Error('Interview evaluation service is not available. Please configure the Google AI API key.');
        }
        
        if (response.status === 429) {
          throw new Error('API quota exceeded. Please try again in a few minutes or upgrade your Google AI plan.');
        }
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Google AI API key configuration.');
        }
        
        throw new Error(errorData.details || errorData.error || 'Failed to evaluate interview');
      }

      const data: EvaluationResponse = await response.json();
      setEvaluation(data.evaluation);
    } catch (err) {
      console.error('Error evaluating interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate interview');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6.5) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6.5) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRecommendationColor = (recommendation: string): string => {
    switch (recommendation) {
      case 'Strong Hire': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'Hire': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      case 'No Hire': return 'text-orange-400 bg-orange-900/20 border-orange-500';
      case 'Strong No Hire': return 'text-red-400 bg-red-900/20 border-red-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  const renderAspectRating = (name: string, aspect: AspectRating) => (
    <div key={name} className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium capitalize">
          {name.replace(/([A-Z])/g, ' $1').trim()}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getScoreColor(aspect.score)}`}>
            {aspect.score.toFixed(1)}
          </span>
          <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreBgColor(aspect.score)} transition-all duration-300`}
              style={{ width: `${(aspect.score / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <p className="text-gray-300 text-sm mb-3">{aspect.feedback}</p>
      
      {aspect.evidence.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs mb-2">Evidence:</p>
          <ul className="space-y-1">
            {aspect.evidence.map((evidence, idx) => (
              <li key={idx} className="text-gray-400 text-xs flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                {evidence}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-dark-200 border border-gray-600 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-purple-400" />
        <h2 className="text-white text-xl font-semibold">AI Interview Evaluation</h2>
        {evaluation && (
          <div className="flex items-center gap-1 ml-auto">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Powered by Gemini AI</span>
          </div>
        )}
      </div>

      {!evaluation && !loading && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">
            Get AI-powered evaluation of this interview performance
          </p>
          <button
            onClick={handleEvaluate}
            disabled={loading || !messages || messages.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Evaluate Interview
          </button>
          {(!messages || messages.length === 0) && (
            <p className="text-red-400 text-sm mt-2">No conversation found to evaluate</p>
          )}
          <div className="mt-4 text-xs text-gray-500">
            <p>Powered by Google Gemini AI</p>
            <p>Requires GOOGLE_GENERATIVE_AI_API_KEY to be configured</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Analyzing interview performance...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">Error: {error}</p>
          </div>
          
          {/* Show specific help based on error type */}
          {error.includes('quota') && (
            <div className="mt-3 text-sm text-red-300">
              <p>💡 <strong>Solutions:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Wait a few minutes and try again</li>
                <li>Upgrade to a paid Google AI plan</li>
                <li>Check your usage at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
              </ul>
            </div>
          )}
          
          {error.includes('API key') && (
            <div className="mt-3 text-sm text-red-300">
              <p>💡 <strong>Solutions:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Check your API key in environment variables</li>
                <li>Get a new API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                <li>Restart your development server</li>
              </ul>
            </div>
          )}
          
          <button
            onClick={handleEvaluate}
            disabled={error.includes('quota')}
            className="mt-3 text-sm text-red-300 hover:text-red-200 underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {error.includes('quota') ? 'Wait before retrying...' : 'Try again'}
          </button>
        </div>
      )}

      {evaluation && (
        <div className="space-y-6">
          {/* Overall Rating & Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="text-gray-400 text-sm mb-2">Overall Rating</h3>
              <div className="relative">
                <div className="w-24 h-24 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={evaluation.overallRating >= 8 ? '#10B981' : evaluation.overallRating >= 6.5 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(evaluation.overallRating / 10) * 251.2} 251.2`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(evaluation.overallRating)}`}>
                      {evaluation.overallRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-gray-400 text-sm mb-2">Recommendation</h3>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getRecommendationColor(evaluation.recommendation)}`}>
                {evaluation.recommendation === 'Strong Hire' && <CheckCircle className="w-5 h-5" />}
                {evaluation.recommendation === 'Hire' && <CheckCircle className="w-5 h-5" />}
                {evaluation.recommendation === 'No Hire' && <XCircle className="w-5 h-5" />}
                {evaluation.recommendation === 'Strong No Hire' && <XCircle className="w-5 h-5" />}
                <span className="font-medium">{evaluation.recommendation}</span>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                Confidence: {evaluation.confidenceLevel}/10
              </p>
            </div>
          </div>

          {/* Aspect Ratings */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Detailed Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(evaluation.aspects).map(([name, aspect]) => 
                renderAspectRating(name, aspect)
              )}
            </div>
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-green-400 text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {evaluation.strengths.map((strength, idx) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-orange-400 text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {evaluation.areasForImprovement.map((area, idx) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-3">Detailed Feedback</h3>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed">{evaluation.detailedFeedback}</p>
            </div>
          </div>

          {/* Re-evaluate Button */}
          <div className="text-center pt-4 border-t border-gray-600">
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Re-evaluate Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
