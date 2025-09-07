"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, CheckCircle, Clock, Star, BookOpen, 
  Play, Award, TrendingUp, ArrowRight, RefreshCw,
  Calendar, User, Lightbulb
} from 'lucide-react';
import { improvementPlanService, ImprovementPlan } from '@/services/improvement/improvement-plan.service';
import { useI18n } from '@/components/I18nProvider';

interface ImprovementPlanDisplayProps {
  userId: string;
}

export default function ImprovementPlanDisplay({ userId }: ImprovementPlanDisplayProps) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<ImprovementPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [userId]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      let userPlan = await improvementPlanService.getUserPlan(userId);
      
      if (!userPlan) {
        // Generate initial plan
        userPlan = await improvementPlanService.generatePersonalizedPlan(userId);
      }
      
      setPlan(userPlan);
    } catch (error) {
      console.error('Error fetching improvement plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!plan?.id) return;
    
    try {
      await improvementPlanService.updateTaskProgress(plan.id, taskId, completed);
      await fetchPlan(); // Refresh plan
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleRegeneratePlan = async () => {
    try {
      setRegenerating(true);
      const newPlan = await improvementPlanService.regeneratePlan(userId);
      setPlan(newPlan);
    } catch (error) {
      console.error('Error regenerating plan:', error);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-dark-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-dark-200 rounded-lg"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <Card className="bg-dark-200 border-gray-600">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400">Unable to load improvement plan.</p>
            <Button onClick={fetchPlan} className="mt-4 bg-primary-600 hover:bg-primary-700">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPhase = plan.phases[plan.currentPhase];
  const completedPhases = plan.phases.slice(0, plan.currentPhase);
  const upcomingPhases = plan.phases.slice(plan.currentPhase + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{plan.title}</h1>
          <p className="text-gray-400 mt-1">{plan.description}</p>
        </div>
        <Button 
          onClick={handleRegeneratePlan} 
          variant="outline" 
          className="border-gray-600 text-gray-300"
          disabled={regenerating}
        >
          {regenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Regenerate Plan
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-dark-200 border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Overall Progress</p>
                <p className="text-2xl font-bold text-white">{plan.progressPercentage}%</p>
                <p className="text-xs text-gray-500">
                  {plan.completedTasks.length} of {plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)} tasks
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-400" />
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${plan.progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Current Phase</p>
                <p className="text-2xl font-bold text-white">{plan.currentPhase + 1}</p>
                <p className="text-xs text-gray-500">
                  of {plan.phases.length} phases
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
                <p className="text-sm font-medium text-gray-400">Est. Duration</p>
                <p className="text-2xl font-bold text-white">{plan.estimatedDuration}</p>
                <p className="text-xs text-gray-500">weeks</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Level */}
      <Card className="bg-dark-200 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Current Skill Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(plan.currentLevel).map(([skill, level]) => (
              <div key={skill} className="text-center">
                <p className="text-sm text-gray-400 mb-2 capitalize">{skill}</p>
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-primary-600 to-primary-400 rounded-full transition-all duration-500"
                    style={{ 
                      clipPath: `polygon(0 ${100 - level}%, 100% ${100 - level}%, 100% 100%, 0% 100%)` 
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{level}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Phase Details */}
      {currentPhase && (
        <Card className="bg-dark-200 border-gray-600 border-primary-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-primary-400" />
                Current Phase: {currentPhase.title}
              </CardTitle>
              <Badge className="bg-primary-600 text-white">
                Active
              </Badge>
            </div>
            <p className="text-gray-400">{currentPhase.description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{currentPhase.duration} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    {currentPhase.tasks.filter(task => task.completed).length}/{currentPhase.tasks.length} tasks
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Tasks</h4>
                <div className="space-y-3">
                  {currentPhase.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`p-4 rounded-lg border transition-all ${
                        task.completed 
                          ? 'bg-green-900/20 border-green-600' 
                          : 'bg-dark-100 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleTaskToggle(task.id, !task.completed)}
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                task.completed
                                  ? 'bg-green-600 border-green-600'
                                  : 'border-gray-500 hover:border-primary-400'
                              }`}
                            >
                              {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                            </button>
                            <div className="flex-1">
                              <h5 className={`font-medium ${task.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                                {task.title}
                              </h5>
                              <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                              
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {task.difficulty}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {task.estimatedTime} min
                                </span>
                              </div>

                              {task.resources.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-400 mb-2">Resources:</p>
                                  <div className="space-y-1">
                                    {task.resources.map((resource, index) => (
                                      <div key={index} className="flex items-center gap-2 text-xs">
                                        <BookOpen className="w-3 h-3 text-primary-400" />
                                        <span className="text-gray-300">{resource.title}</span>
                                        {resource.free && (
                                          <Badge className="bg-green-600 text-white text-xs">Free</Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {task.score && (
                          <div className="flex items-center gap-1 ml-4">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-medium">{task.score}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      <Card className="bg-dark-200 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Target Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Primary Goals</h4>
              <div className="space-y-2">
                {plan.targetGoals.primary.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary-400" />
                    <span className="text-gray-300">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Secondary Goals</h4>
              <div className="space-y-2">
                {plan.targetGoals.secondary.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card className="bg-dark-200 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plan.milestones.map((milestone) => (
              <div 
                key={milestone.id} 
                className={`p-4 rounded-lg border ${
                  milestone.completed 
                    ? 'bg-green-900/20 border-green-600' 
                    : 'bg-dark-100 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {milestone.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Target className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h5 className={`font-medium ${milestone.completed ? 'text-green-400' : 'text-white'}`}>
                        {milestone.title}
                      </h5>
                      <p className="text-gray-400 text-sm">{milestone.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      Target: {new Date(milestone.targetDate).toLocaleDateString()}
                    </p>
                    {milestone.reward && (
                      <Badge className="mt-1 bg-yellow-600 text-white">
                        +{milestone.reward.value} {milestone.reward.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
