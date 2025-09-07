"use client";

import React from 'react';
import { EmotionData, emotionDetectionService } from '@/services/emotion/emotion-detection.service';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmotionTimelineProps {
  emotions: EmotionData[];
  duration?: number; // Total call duration in seconds
  className?: string;
}

interface EmotionVisualizationProps {
  emotionAnalysis: {
    emotions: EmotionData[];
    dominantEmotion: string;
    emotionalTrend: 'improving' | 'declining' | 'stable';
    summary: {
      averageConfidence: number;
      mostFrequentEmotion: string;
      emotionalStability: number;
      stressIndicators: string[];
    };
  };
  className?: string;
}

export function EmotionTimeline({ emotions, duration = 300, className }: EmotionTimelineProps) {
  if (emotions.length === 0) {
    return (
      <div className={cn("bg-gray-800 rounded-lg p-4", className)}>
        <p className="text-gray-400 text-center">No emotion data available</p>
      </div>
    );
  }

  const maxTime = duration;
  const timeSegments = 10; // Divide timeline into 10 segments
  const segmentDuration = maxTime / timeSegments;

  // Group emotions by time segments
  const emotionsBySegment = Array.from({ length: timeSegments }, (_, i) => {
    const segmentStart = i * segmentDuration;
    const segmentEnd = (i + 1) * segmentDuration;
    
    return emotions.filter(emotion => {
      const emotionTime = emotion.secondsFromStart;
      return emotionTime >= segmentStart && emotionTime < segmentEnd;
    });
  });

  // Calculate dominant emotion for each segment
  const segmentEmotions = emotionsBySegment.map(segmentEmotions => {
    if (segmentEmotions.length === 0) return null;
    
    // Find most frequent emotion in segment
    const emotionCounts = segmentEmotions.reduce((acc, emotion) => {
      acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    const avgConfidence = segmentEmotions.reduce((sum, e) => sum + e.confidence, 0) / segmentEmotions.length;
    const avgStress = segmentEmotions.reduce((sum, e) => sum + (e.additionalMetrics?.stress_level || 0), 0) / segmentEmotions.length;
    
    return {
      emotion: dominantEmotion,
      confidence: avgConfidence,
      stressLevel: avgStress,
      count: segmentEmotions.length
    };
  });

  return (
    <div className={cn("bg-gray-800 rounded-lg p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Emotion Timeline</h3>
      </div>
      
      {/* Timeline visualization */}
      <div className="space-y-4">
        {/* Time markers */}
        <div className="flex justify-between text-xs text-gray-400 px-2">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i}>
              {Math.round((i * maxTime) / 5)}s
            </span>
          ))}
        </div>
        
        {/* Emotion bars */}
        <div className="grid grid-cols-10 gap-1 h-20">
          {segmentEmotions.map((segment, index) => {
            if (!segment) {
              return (
                <div
                  key={index}
                  className="bg-gray-700 rounded-sm opacity-30"
                  title="No data"
                />
              );
            }
            
            const color = emotionDetectionService.getEmotionColor(segment.emotion as any);
            const height = Math.max(20, segment.confidence * 80); // 20% to 80% height based on confidence
            
            return (
              <div
                key={index}
                className="relative flex flex-col justify-end group cursor-pointer"
                title={`${segment.emotion} (${Math.round(segment.confidence * 100)}% confidence)`}
              >
                <div
                  className="rounded-sm transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: color,
                    height: `${height}%`,
                    opacity: 0.8
                  }}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    <div className="font-medium capitalize">{segment.emotion}</div>
                    <div>Confidence: {Math.round(segment.confidence * 100)}%</div>
                    <div>Stress: {Math.round(segment.stressLevel * 100)}%</div>
                  </div>
                </div>
                
                {/* Emotion label */}
                <div className="text-xs text-center mt-1 text-gray-300 capitalize">
                  {segment.emotion}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Array.from(new Set(emotions.map(e => e.emotion))).map(emotion => (
            <div key={emotion} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: emotionDetectionService.getEmotionColor(emotion) }}
              />
              <span className="text-gray-300 capitalize">{emotion}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmotionVisualization({ emotionAnalysis, className }: EmotionVisualizationProps) {
  const { emotions, dominantEmotion, emotionalTrend, summary } = emotionAnalysis;
  
  const getTrendIcon = () => {
    switch (emotionalTrend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (emotionalTrend) {
      case 'improving':
        return 'text-green-400';
      case 'declining':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={cn("bg-gray-800 rounded-lg p-6 space-y-6", className)}>
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Emotion Analysis</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dominant Emotion */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{backgroundColor: emotionDetectionService.getEmotionColor(dominantEmotion as any)}}
            ></div>
            <div>
              <p className="text-sm text-gray-400">Dominant Emotion</p>
              <p className="text-white font-medium capitalize">{dominantEmotion}</p>
            </div>
          </div>
        </div>

        {/* Emotional Trend */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {getTrendIcon()}
            <div>
              <p className="text-sm text-gray-400">Trend</p>
              <p className={cn("font-medium capitalize", getTrendColor())}>
                {emotionalTrend}
              </p>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Avg Confidence</p>
          <p className="text-white font-medium">
            {Math.round(summary.averageConfidence * 100)}%
          </p>
          <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${summary.averageConfidence * 100}%` }}
            />
          </div>
        </div>

        {/* Stability */}
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Emotional Stability</p>
          <p className="text-white font-medium">
            {Math.round(summary.emotionalStability * 100)}%
          </p>
          <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                summary.emotionalStability > 0.7 ? "bg-green-400" :
                summary.emotionalStability > 0.4 ? "bg-yellow-400" : "bg-red-400"
              )}
              style={{ width: `${summary.emotionalStability * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Emotion Distribution */}
      <div className="space-y-4">
        <h4 className="text-white font-medium">Emotion Distribution</h4>
        <div className="space-y-2">
          {Object.entries(
            emotions.reduce((acc, emotion) => {
              acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          )
            .sort(([,a], [,b]) => b - a)
            .map(([emotion, count]) => {
              const percentage = (count / emotions.length) * 100;
              return (
                <div key={emotion} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{backgroundColor: emotionDetectionService.getEmotionColor(emotion as any)}}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300 capitalize">{emotion}</span>
                      <span className="text-xs text-gray-400">
                        {count} times ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: emotionDetectionService.getEmotionColor(emotion as any),
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Stress Indicators */}
      {summary.stressIndicators.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-medium">Stress Indicators</h4>
          <div className="space-y-1">
            {summary.stressIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-orange-300">
                <div className="w-1 h-1 bg-orange-400 rounded-full" />
                {indicator}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <EmotionTimeline emotions={emotions} />
    </div>
  );
}

export default EmotionVisualization;
