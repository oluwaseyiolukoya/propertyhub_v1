import React, { useState } from "react";
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Pause,
  RotateCcw,
  ArrowUpRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../../lib/api-client";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import KPICard from "./KPICard";
import ProjectCard from "./ProjectCard";
import {
  usePortfolioOverview,
  useProjects,
  useDebounce,
} from "../hooks/useDeveloperDashboardData";
import type { ProjectFilters, ProjectSortOptions } from "../types";
import { getCurrencySymbol } from "../../../lib/currency";

interface PortfolioOverviewProps {
  onViewProject: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onMarkAsCompleted?: (projectId: string) => void;
  onReactivateProject?: (projectId: string) => void;
  onCreateProject: () => void;
  canManageProjects?: boolean; // Permission to create/edit/delete projects
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  onViewProject,
  onEditProject,
  onDeleteProject,
  onMarkAsCompleted,
  onReactivateProject,
  onCreateProject,
  canManageProjects = true, // Default true for backward compatibility
}) => {
  const { data: overview, loading: overviewLoading } = usePortfolioOverview();

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<ProjectSortOptions>({
    field: "createdAt",
    order: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filters: ProjectFilters = {
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? [statusFilter as any] : undefined,
    stage: stageFilter !== "all" ? [stageFilter as any] : undefined,
  };

  const {
    data: projects,
    pagination,
    loading: projectsLoading,
  } = useProjects(filters, sortBy, currentPage, 12);

  const formatCurrency = (amount: number, currencyCode?: string) => {
    const currency = currencyCode || overview?.currency || "NGN";
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbol(currency);
    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  const getHealthBadge = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance > 10) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (absVariance > 5) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          Warning
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          Healthy
        </Badge>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "planning":
        return (
          <Badge variant="secondary" className="gap-1">
            Planning
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Enhanced Header with Purple Gradient */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  Portfolio Overview
                </h1>
              </div>
              <p className="text-purple-100 text-lg">
                Manage all your development projects in one place
              </p>

              {/* Quick Stats Pills */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <span className="text-white font-semibold">
                    {overview?.totalProjects || 0} Projects
                  </span>
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <span className="text-white font-semibold">
                    {overview?.activeProjects || 0} Active
                  </span>
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <span className="text-white font-semibold">
                    {overview ? formatCurrency(overview.totalBudget) : "₦0"}{" "}
                    Budget
                  </span>
                </div>
              </div>
            </div>
            {canManageProjects && (
              <Button
                onClick={onCreateProject}
                className="gap-2 bg-white text-purple-600 hover:bg-purple-50 shadow-lg"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Add New Project
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Unified Summary Cards - All with Gradient Backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group">
          <div className="bg-gradient-to-br from-purple-600 to-violet-700 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {overview?.activeProjects || 0} Active
              </Badge>
            </div>
            <p className="text-sm font-medium text-purple-100 mb-1">
              Total Projects
            </p>
            <p className="text-4xl font-bold">
              {overview?.totalProjects?.toString() || "0"}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-purple-100">
                All development projects
              </p>
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-sm font-medium text-green-100 mb-1">
              Portfolio Budget
            </p>
            <p className="text-4xl font-bold">
              {overview ? formatCurrency(overview.totalBudget) : "₦0"}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-green-100">Across all projects</p>
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                Actual
              </Badge>
            </div>
            <p className="text-sm font-medium text-blue-100 mb-1">
              Total Spend
            </p>
            <p className="text-4xl font-bold">
              {overview ? formatCurrency(overview.totalActualSpend) : "₦0"}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-blue-100">Actual expenditure</p>
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group">
          <div
            className={`bg-gradient-to-br p-6 text-white ${
              overview && overview.variancePercent > 0
                ? "from-red-500 to-rose-600"
                : "from-green-500 to-emerald-600"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              {overview && overview.variancePercent > 0 ? (
                <ArrowUpRight className="h-5 w-5 text-white/80" />
              ) : (
                <TrendingDown className="h-5 w-5 text-white/80" />
              )}
            </div>
            <p
              className={`text-sm font-medium mb-1 ${
                overview && overview.variancePercent > 0
                  ? "text-red-100"
                  : "text-green-100"
              }`}
            >
              Overall Variance
            </p>
            <p className="text-4xl font-bold">
              {overview
                ? `${
                    overview.variancePercent >= 0 ? "+" : ""
                  }${overview.variancePercent.toFixed(1)}%`
                : "0%"}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p
                className={`text-xs ${
                  overview && overview.variancePercent > 0
                    ? "text-red-100"
                    : "text-green-100"
                }`}
              >
                {overview && overview.totalVariance > 0
                  ? "Over budget"
                  : "Under budget"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Project Status Filter Cards - Consistent Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group"
          onClick={() => setStatusFilter("active")}
        >
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                Filter
              </Badge>
            </div>
            <p className="text-sm font-medium text-green-100 mb-1">
              Active Projects
            </p>
            <p className="text-4xl font-bold">
              {projects.filter((p) => p.status === "active").length}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-green-100">Click to filter</p>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group"
          onClick={() => setStatusFilter("on-hold")}
        >
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Pause className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                Filter
              </Badge>
            </div>
            <p className="text-sm font-medium text-amber-100 mb-1">On Hold</p>
            <p className="text-4xl font-bold">
              {projects.filter((p) => p.status === "on-hold").length}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-amber-100">Click to filter</p>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group"
          onClick={() => setStatusFilter("completed")}
        >
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                Filter
              </Badge>
            </div>
            <p className="text-sm font-medium text-blue-100 mb-1">Completed</p>
            <p className="text-4xl font-bold">
              {projects.filter((p) => p.status === "completed").length}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-blue-100">Click to filter</p>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden group"
          onClick={() => setStatusFilter("cancelled")}
        >
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                Filter
              </Badge>
            </div>
            <p className="text-sm font-medium text-red-100 mb-1">Cancelled</p>
            <p className="text-4xl font-bold">
              {projects.filter((p) => p.status === "cancelled").length}
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-red-100">Click to filter</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Filters and View Toggle with Purple Theme */}
      <Card className="border-0 shadow-lg">
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 px-6 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Filter & Search</h3>
          </div>
          <p className="text-sm text-gray-600">
            Find projects quickly with advanced filters
          </p>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <Input
                placeholder="Search projects or developers..."
                className="pl-11 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48 border-purple-200 hover:border-purple-400 focus:border-purple-500 focus:ring-purple-500">
                <Filter className="w-4 h-4 mr-2 text-purple-600" />
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="pre-construction">
                  Pre-Construction
                </SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 border-purple-200 hover:border-purple-400 focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1 border-2 border-purple-200 rounded-lg p-1 bg-purple-50/50">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={
                  viewMode === "table"
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                    : "hover:bg-purple-100 hover:text-purple-700"
                }
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                    : "hover:bg-purple-100 hover:text-purple-700"
                }
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all" || stageFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-purple-100">
              <span className="text-sm font-medium text-gray-600">
                Active Filters:
              </span>
              {searchTerm && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1">
                  Search: {searchTerm}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                  Status: {statusFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              {stageFilter !== "all" && (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                  Stage: {stageFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setStageFilter("all")}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setStageFilter("all");
                }}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Display */}
      {projectsLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gradient-to-r from-purple-100 to-violet-100 animate-pulse rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== "all" || stageFilter !== "all"
                ? "No projects match your current filters. Try adjusting your search criteria."
                : canManageProjects
                ? "Get started by creating your first project and begin tracking your development portfolio."
                : "No projects available yet. Check back later."}
            </p>
            {!searchTerm &&
              statusFilter === "all" &&
              stageFilter === "all" &&
              canManageProjects && (
                <Button
                  onClick={onCreateProject}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  All Projects
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {projects.length} project{projects.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1">
                {projects.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Developer
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stage
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Location
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Budget
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actual
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Variance
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Health
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const variance =
                    project.totalBudget > 0
                      ? ((project.actualSpend - project.totalBudget) /
                          project.totalBudget) *
                        100
                      : 0;

                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-purple-50/50 transition-colors border-b border-gray-100"
                      onClick={() => onViewProject(project.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {project.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Updated{" "}
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {project.city || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {project.stage}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {project.location || project.city || "N/A"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(project.totalBudget, project.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(project.actualSpend, project.currency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          variance > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {variance > 0 ? "+" : ""}
                        {variance.toFixed(1)}%
                      </TableCell>
                      <TableCell>{getHealthBadge(variance)}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewProject(project.id);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {onEditProject && canManageProjects && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditProject(project.id);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onMarkAsCompleted &&
                              canManageProjects &&
                              project.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsCompleted(project.id);
                                  }}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                            {onReactivateProject &&
                              canManageProjects &&
                              project.status === "completed" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReactivateProject(project.id);
                                  }}
                                  className="text-blue-600 focus:text-blue-600"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reactivate Project
                                </DropdownMenuItem>
                              )}
                            {onDeleteProject && canManageProjects && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProject(project.id);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currency={project.currency}
              onView={() => onViewProject(project.id)}
            />
          ))}
        </div>
      )}

      {/* Enhanced Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  Page {currentPage} of {pagination.totalPages}
                </Badge>
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                  {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
                  of {pagination.total} projects
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasMore}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioOverview;
