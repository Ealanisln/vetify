'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, PlayCircle, ExternalLink } from 'lucide-react';

export interface TaskProgress {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  category: 'database' | 'api' | 'ui' | 'integration' | 'testing';
  estimatedHours?: number;
  completedHours?: number;
  assignee?: string;
  dueDate?: Date;
  dependencies?: string[];
  notes?: string;
  links?: { label: string; url: string }[];
}

interface ImplementationProgressProps {
  tasks: TaskProgress[];
  onTaskUpdate?: (taskId: string, updates: Partial<TaskProgress>) => void;
  showControls?: boolean;
  compact?: boolean;
}

export function ImplementationProgress({ 
  tasks, 
  onTaskUpdate, 
  showControls = false,
  compact = false 
}: ImplementationProgressProps) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'category'>('priority');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'database': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'api': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ui': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'integration': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'testing': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter || task.category === filter || task.priority === filter;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === 'status') {
      const statusOrder = { in_progress: 4, pending: 3, blocked: 2, completed: 1 };
      return statusOrder[b.status] - statusOrder[a.status];
    }
    return a.category.localeCompare(b.category);
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };

  const progressPercentage = (stats.completed / stats.total) * 100;

  const handleStatusChange = (taskId: string, newStatus: TaskProgress['status']) => {
    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status: newStatus });
    }
  };

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Implementation Progress
          </h3>
          <div className="text-right">
            <div className="text-xl font-bold text-[#75a99c]">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-xs text-gray-500">
              {stats.completed}/{stats.total} tasks
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#75a99c] h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{stats.inProgress} in progress</span>
          <span>{stats.pending} pending</span>
          <span>{stats.blocked} blocked</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Implementation Task Progress
          </h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#75a99c]">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-[#75a99c] h-3 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-400">{stats.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{stats.blocked}</div>
            <div className="text-xs text-gray-500">Blocked</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </Card>

      {/* Filters and Sort */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            {['all', 'pending', 'in_progress', 'completed', 'blocked', 'high', 'database', 'api', 'ui'].map((option) => (
              <Button
                key={option}
                variant={filter === option ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(option)}
                className="capitalize text-xs"
              >
                {option.replace('_', ' ')}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'priority' | 'status' | 'category')}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="mt-1">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                      
                      {task.dependencies && task.dependencies.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500 font-medium">Dependencies: </span>
                          <span className="text-xs text-gray-600">{task.dependencies.join(', ')}</span>
                        </div>
                      )}
                      
                      {task.notes && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500 font-medium">Notes: </span>
                          <span className="text-xs text-gray-600">{task.notes}</span>
                        </div>
                      )}

                      {task.links && task.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {task.links.map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2 ml-4">
                <div className="flex flex-wrap gap-1 justify-end">
                  <Badge className={getStatusColor(task.status)} variant="outline">
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)} variant="outline">
                    {task.priority}
                  </Badge>
                  <Badge className={getCategoryColor(task.category)} variant="outline">
                    {task.category}
                  </Badge>
                </div>

                {task.estimatedHours && (
                  <div className="text-xs text-gray-500">
                    {task.completedHours ? `${task.completedHours}/` : ''}{task.estimatedHours}h
                  </div>
                )}

                {task.assignee && (
                  <div className="text-xs text-gray-500">
                    @{task.assignee}
                  </div>
                )}

                {task.dueDate && (
                  <div className="text-xs text-gray-500">
                    Due: {task.dueDate.toLocaleDateString()}
                  </div>
                )}

                {showControls && onTaskUpdate && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                      disabled={task.status === 'in_progress'}
                      className="text-xs px-2 py-1"
                    >
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      disabled={task.status === 'completed'}
                      className="text-xs px-2 py-1"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sortedTasks.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            No tasks match the current filter criteria.
          </div>
        </Card>
      )}
    </div>
  );
}