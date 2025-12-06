/**
 * Reports Tab Content - Complete Implementation
 *
 * Drop-in replacement for the reports TabsContent in PropertiesPage.tsx
 * This is a self-contained component with all functionality
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  FileText,
  DollarSign,
  PieChart,
  Wrench,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Clock,
  Mail,
  Loader2,
  Building2,
  Zap,
  CheckCircle,
  Info,
  X,
  BarChart3,
  Download,
  Send,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { ScheduledReportsList } from "./ScheduledReportsList";
import { useReportSchedules } from "../../hooks/useReportSchedules";
import { createReportSchedule } from "../../services/reportSchedules.api";

interface ReportsTabContentProps {
  user?: any;
  properties?: any[];
  reportPreview?: any;
  reportType: string;
  setReportType: (type: string) => void;
  reportPropertyFilter: string;
  setReportPropertyFilter: (filter: string) => void;
  reportStartDate: string;
  setReportStartDate: (date: string) => void;
  reportEndDate: string;
  setReportEndDate: (date: string) => void;
  reportGenerating: boolean;
  onGenerateReport: () => void;
  onResetFilters: () => void;
  onDownloadReport?: () => void;
  onEmailReport?: () => void;
  reportPreviewRef?: React.RefObject<HTMLDivElement>;
  renderReportPreview?: () => React.ReactNode;
  reportPreviewPropertyLabel?: string;
  reportPreviewDateRange?: string;
  scheduleEmail?: string;
  setScheduleEmail: (email: string) => void;
  scheduleFrequency: "weekly" | "monthly";
  setScheduleFrequency: (freq: "weekly" | "monthly") => void;
  scheduleDayOfWeek?: string;
  setScheduleDayOfWeek: (day: string) => void;
  scheduleDayOfMonth?: number;
  setScheduleDayOfMonth: (day: number) => void;
  scheduleTime: string;
  setScheduleTime: (time: string) => void;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  financial: "Financial",
  occupancy: "Occupancy",
  maintenance: "Maintenance",
  tenant: "Tenant",
  all: "Portfolio",
};

export function ReportsTabContent({
  user,
  properties = [],
  reportPreview,
  reportType,
  setReportType,
  reportPropertyFilter,
  setReportPropertyFilter,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  reportGenerating,
  onGenerateReport,
  onResetFilters,
  onDownloadReport,
  onEmailReport,
  reportPreviewRef,
  renderReportPreview,
  reportPreviewPropertyLabel,
  reportPreviewDateRange,
  scheduleEmail,
  setScheduleEmail,
  scheduleFrequency,
  setScheduleFrequency,
  scheduleDayOfWeek,
  setScheduleDayOfWeek,
  scheduleDayOfMonth,
  setScheduleDayOfMonth,
  scheduleTime,
  setScheduleTime,
}: ReportsTabContentProps) {
  const { schedules, loading, refresh } = useReportSchedules();
  const [isScheduling, setIsScheduling] = useState(false);

  // Set default email from user
  useEffect(() => {
    if (user?.email && !scheduleEmail) {
      setScheduleEmail(user.email);
    }
  }, [user, scheduleEmail, setScheduleEmail]);

  const getReportPropertyLabel = (propertyId?: string) => {
    if (!propertyId || propertyId === "all") return "All Properties";
    return "Selected Property";
  };

  const handleScheduleReport = async () => {
    if (!reportPreview) {
      toast.error("Generate a report first");
      return;
    }

    if (!scheduleEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsScheduling(true);

    try {
      const propertyLabel = getReportPropertyLabel(
        reportPreview.filters?.propertyId
      );
      const label = REPORT_TYPE_LABELS[reportPreview.type] || "Report";
      const name = `${label} - ${propertyLabel}`;

      const response = await createReportSchedule({
        name,
        reportType: reportPreview.type,
        propertyId:
          reportPreview.filters?.propertyId === "all"
            ? undefined
            : reportPreview.filters?.propertyId,
        frequency: scheduleFrequency,
        dayOfWeek:
          scheduleFrequency === "weekly" ? scheduleDayOfWeek : undefined,
        dayOfMonth:
          scheduleFrequency === "monthly" ? scheduleDayOfMonth : undefined,
        time: scheduleTime,
        email: scheduleEmail,
        filters: reportPreview.filters,
      });

      if (response.success && response.data) {
        toast.success(
          `Report scheduled! Will be sent to ${response.data.email}`
        );
        refresh(); // Refresh the schedules list
      } else {
        toast.error(response.error || "Failed to create schedule");
      }
    } catch (error: any) {
      console.error("Failed to schedule report:", error);
      toast.error("Failed to schedule report. Please try again.");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Analytics Header Card */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#7C3AED] via-purple-600 to-[#5B21B6] px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Reports & Analytics
                </h2>
                <p className="text-purple-100 text-sm mt-0.5">
                  Generate insights and schedule automated reports
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-purple-100 text-xs">Scheduled</p>
                <p className="text-white font-bold text-lg">
                  {schedules.filter((s) => s.status === "active").length} Active
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-purple-100 text-xs">Total</p>
                <p className="text-white font-bold text-lg">
                  {schedules.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Category Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Financial Reports Card */}
        <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-green-100 text-xs font-medium">
                Financial Reports
              </p>
              <p className="text-3xl font-bold text-white mt-1">12</p>
              <p className="text-green-100 text-xs mt-2">
                P&L, Revenue, Expenses
              </p>
            </div>
          </div>
        </Card>

        {/* Occupancy Reports Card */}
        <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="bg-gradient-to-br from-[#7C3AED] to-purple-700 p-5">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <Activity className="h-3 w-3 mr-1" />
                Weekly
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-purple-100 text-xs font-medium">
                Occupancy Reports
              </p>
              <p className="text-3xl font-bold text-white mt-1">8</p>
              <p className="text-purple-100 text-xs mt-2">
                Vacancy, Turnover rates
              </p>
            </div>
          </div>
        </Card>

        {/* Maintenance Reports Card */}
        <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-5">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <TrendingDown className="h-3 w-3 mr-1" />
                -8%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-orange-100 text-xs font-medium">
                Maintenance Reports
              </p>
              <p className="text-3xl font-bold text-white mt-1">15</p>
              <p className="text-orange-100 text-xs mt-2">
                Work orders, Repairs
              </p>
            </div>
          </div>
        </Card>

        {/* Tenant Reports Card */}
        <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-blue-100 text-xs font-medium">
                Tenant Reports
              </p>
              <p className="text-3xl font-bold text-white mt-1">12</p>
              <p className="text-blue-100 text-xs mt-2">
                Lease, Payment history
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive Report Generation */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-purple-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Generate Reports
                </h3>
                <p className="text-xs text-gray-500">
                  Use live portfolio data with filters to view detailed reports
                </p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-[#7C3AED] border-purple-200">
              <Activity className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label
                htmlFor="report-type"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Report Type
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger
                  id="report-type"
                  className="bg-white border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED] rounded-xl h-11"
                >
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All report types</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="occupancy">Occupancy</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="report-property"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <Building2 className="h-4 w-4 text-gray-400" />
                Property
              </Label>
              <Select
                value={reportPropertyFilter}
                onValueChange={setReportPropertyFilter}
              >
                <SelectTrigger
                  id="report-property"
                  className="bg-white border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED] rounded-xl h-11"
                >
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All properties</SelectItem>
                  {properties.map((property: any) => (
                    <SelectItem key={property.id} value={String(property.id)}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="report-start"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 text-gray-400" />
                Start Date
              </Label>
              <Input
                id="report-start"
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="bg-white border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED] rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="report-end"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 text-gray-400" />
                End Date
              </Label>
              <Input
                id="report-end"
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="bg-white border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED] rounded-xl h-11"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info className="h-4 w-4" />
              <span>Reports generated from live dashboard data</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onResetFilters}
                disabled={reportGenerating && !reportPreview}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-10"
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={onGenerateReport}
                disabled={reportGenerating}
                className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25 rounded-xl h-10 px-6"
              >
                {reportGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportPreview && (
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#7C3AED] via-purple-600 to-[#5B21B6] px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">
                      {REPORT_TYPE_LABELS[reportPreview.type]} Report
                    </h3>
                    <Badge className="bg-green-400/20 text-green-100 border-green-400/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Live Preview
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-purple-100 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(reportPreview.generatedAt).toLocaleString()}
                    </span>
                    {reportPreviewPropertyLabel && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {reportPreviewPropertyLabel}
                        </span>
                      </>
                    )}
                    {reportPreviewDateRange && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {reportPreviewDateRange}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onDownloadReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownloadReport}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
                {onEmailReport && (
                  <Button
                    size="sm"
                    onClick={onEmailReport}
                    className="bg-white text-[#7C3AED] hover:bg-white/90 shadow-lg rounded-lg"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send to Email
                  </Button>
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-6 bg-gray-50/50">
            <div ref={reportPreviewRef}>
              {renderReportPreview ? (
                renderReportPreview()
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Report preview will appear here
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Report Form */}
      {reportPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Schedule This Report
            </CardTitle>
            <CardDescription>
              Set up automatic delivery for the current report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Address
                  </Label>
                  <Input
                    id="schedule-email"
                    type="email"
                    placeholder="your@email.com"
                    value={scheduleEmail}
                    onChange={(e) => setScheduleEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-frequency">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Frequency
                  </Label>
                  <Select
                    value={scheduleFrequency}
                    onValueChange={(value: "weekly" | "monthly") =>
                      setScheduleFrequency(value)
                    }
                  >
                    <SelectTrigger id="schedule-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {scheduleFrequency === "weekly" ? (
                  <div className="space-y-2">
                    <Label htmlFor="schedule-day-week">Day of Week</Label>
                    <Select
                      value={scheduleDayOfWeek}
                      onValueChange={setScheduleDayOfWeek}
                    >
                      <SelectTrigger id="schedule-day-week">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="schedule-day-month">Day of Month</Label>
                    <Select
                      value={scheduleDayOfMonth?.toString()}
                      onValueChange={(v) => setScheduleDayOfMonth(parseInt(v))}
                    >
                      <SelectTrigger id="schedule-day-month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(
                          (day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleScheduleReport}
                disabled={isScheduling || !scheduleEmail}
                className="w-full md:w-auto"
              >
                {isScheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports List */}
      <ScheduledReportsList schedules={schedules} onScheduleUpdated={refresh} />

      {/* Recent Reports */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Archive className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Recent Reports
                </h3>
                <p className="text-xs text-gray-500">
                  Previously generated reports and downloads
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <FileText className="h-3 w-3 mr-1" />
                {reportPreview ? "1 Report" : "0 Reports"}
              </Badge>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {reportPreview ? (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Report Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Generated
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-white hover:bg-purple-50/50 transition-colors border-b border-gray-100">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-semibold text-gray-900">
                          {REPORT_TYPE_LABELS[reportPreview.type]} Report
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        {REPORT_TYPE_LABELS[reportPreview.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {new Date(reportPreview.generatedAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onDownloadReport && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownloadReport}
                            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg h-8"
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        )}
                        {onEmailReport && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onEmailReport}
                            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg h-8"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Email
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Archive className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No recent reports</p>
              <p className="text-xs mt-1">Generate a report to see it here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
