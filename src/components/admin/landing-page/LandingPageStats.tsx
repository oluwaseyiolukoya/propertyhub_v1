import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { getSubmissionStats } from '../../../lib/api/landing-forms';
import {
  MessageSquare,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function LandingPageStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getSubmissionStats();
      if (response.data) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to load statistics');
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formTypeIcons: Record<string, any> = {
    contact_us: MessageSquare,
    schedule_demo: Calendar,
    blog_inquiry: BookOpen,
    community_request: Users,
    partnership: UserPlus,
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    spam: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.new || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.in_progress || 0}</div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.resolved || 0}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* By Form Type */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions by Type</CardTitle>
          <CardDescription>Breakdown of form submissions by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats?.byType || {}).map(([type, count]) => {
              const Icon = formTypeIcons[type] || MessageSquare;
              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">submissions</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{count as number}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      statusColors[status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
            <CardDescription>Average time to resolve submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Clock className="h-12 w-12 text-blue-600" />
              <div>
                <div className="text-3xl font-bold">{stats?.avgResponseTimeHours || 0}h</div>
                <p className="text-sm text-gray-500">Average resolution time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

