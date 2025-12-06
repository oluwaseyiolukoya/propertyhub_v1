/**
 * Scheduled Reports List Component
 *
 * Displays and manages scheduled reports with test email functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Calendar,
  Clock,
  Mail,
  Send,
  Pause,
  Play,
  Trash2,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteReportSchedule,
  updateReportSchedule,
  sendScheduledReport,
  type ReportSchedule,
} from '../../services/reportSchedules.api';

interface ScheduledReportsListProps {
  schedules: ReportSchedule[];
  onScheduleUpdated: () => void;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  financial: 'Financial',
  occupancy: 'Occupancy',
  maintenance: 'Maintenance',
  tenant: 'Tenant',
  all: 'Portfolio',
};

export function ScheduledReportsList({ schedules, onScheduleUpdated }: ScheduledReportsListProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (id: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: loading }));
  };

  const handleToggleStatus = async (schedule: ReportSchedule) => {
    const newStatus = schedule.status === 'active' ? 'paused' : 'active';
    setLoading(schedule.id, true);

    try {
      const response = await updateReportSchedule(schedule.id, { status: newStatus });

      if (response.success) {
        toast.success(`Schedule ${newStatus === 'active' ? 'activated' : 'paused'}`);
        onScheduleUpdated();
      } else {
        toast.error(response.error || 'Failed to update schedule');
      }
    } catch (error: any) {
      console.error('Failed to toggle schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setLoading(schedule.id, false);
    }
  };

  const handleDelete = async (schedule: ReportSchedule) => {
    if (!confirm(`Delete schedule "${schedule.name}"?`)) return;

    setLoading(schedule.id, true);

    try {
      const response = await deleteReportSchedule(schedule.id);

      if (response.success) {
        toast.success('Schedule deleted successfully');
        onScheduleUpdated();
      } else {
        toast.error(response.error || 'Failed to delete schedule');
      }
    } catch (error: any) {
      console.error('Failed to delete schedule:', error);
      toast.error('Failed to delete schedule');
    } finally {
      setLoading(schedule.id, false);
    }
  };

  const handleTestEmail = async (schedule: ReportSchedule) => {
    setLoading(schedule.id, true);

    try {
      toast.info('Sending test email...');
      const response = await sendScheduledReport(schedule.id);

      if (response.success && response.data?.emailSent) {
        toast.success(`Test email sent to ${schedule.email}! Check your inbox.`);
      } else {
        toast.error(response.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setLoading(schedule.id, false);
    }
  };

  const formatNextRun = (nextRun: string) => {
    try {
      const date = new Date(nextRun);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return nextRun;
    }
  };

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Scheduled Reports
            </h3>
            <p className="text-sm text-gray-600">
              Generate a report and schedule it to receive automatic updates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Scheduled Reports
        </CardTitle>
        <CardDescription>
          Manage your automated report deliveries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const isLoading = loadingStates[schedule.id];
            const reportLabel = REPORT_TYPE_LABELS[schedule.reportType] || 'Report';

            return (
              <div
                key={schedule.id}
                className="border rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <h4 className="font-semibold text-gray-900 truncate">
                        {schedule.name}
                      </h4>
                      <Badge
                        variant={schedule.status === 'active' ? 'default' : 'secondary'}
                        className={
                          schedule.status === 'active'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{reportLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{schedule.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {schedule.frequency === 'weekly'
                            ? `Weekly on ${schedule.dayOfWeek}`
                            : `Monthly on day ${schedule.dayOfMonth}`}{' '}
                          at {schedule.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Next: {formatNextRun(schedule.nextRun)}</span>
                      </div>
                    </div>

                    {schedule.lastRun && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last sent: {new Date(schedule.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestEmail(schedule)}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Test Email
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(schedule)}
                      disabled={isLoading}
                    >
                      {schedule.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

