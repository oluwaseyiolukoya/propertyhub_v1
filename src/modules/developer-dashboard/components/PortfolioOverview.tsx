import React, { useState } from 'react';
import { Building2, DollarSign, TrendingUp, AlertCircle, Plus, Search, Filter, LayoutGrid, ArrowUpDown, Eye, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import KPICard from './KPICard';
import ProjectCard from './ProjectCard';
import { usePortfolioOverview, useProjects, useDebounce } from '../hooks/useDeveloperDashboardData';
import type { ProjectFilters, ProjectSortOptions } from '../types';

interface PortfolioOverviewProps {
  onViewProject: (projectId: string) => void;
  onCreateProject: () => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  onViewProject,
  onCreateProject,
}) => {
  const { data: overview, loading: overviewLoading } = usePortfolioOverview();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ProjectSortOptions>({
    field: 'createdAt',
    order: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filters: ProjectFilters = {
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? [statusFilter as any] : undefined,
    stage: stageFilter !== 'all' ? [stageFilter as any] : undefined,
  };

  const { data: projects, pagination, loading: projectsLoading } = useProjects(
    filters,
    sortBy,
    currentPage,
    12
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: overview?.currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthBadge = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance > 10) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (absVariance > 5) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Warning</Badge>;
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Healthy</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case 'planning':
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Overview</h1>
          <p className="text-gray-600 mt-1">Manage all your development projects in one place</p>
        </div>
        <Button onClick={onCreateProject} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Add New Project
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Projects"
          value={overview?.totalProjects?.toString() || '0'}
          subtitle={`${overview?.activeProjects || 0} active`}
          icon={Building2}
          loading={overviewLoading}
        />
        <KPICard
          title="Active Projects"
          value={`${overview?.activeProjects || 0} / ${overview?.completedProjects || 0}`}
          subtitle="Active vs Completed"
          icon={TrendingUp}
          loading={overviewLoading}
        />
        <KPICard
          title="Total Portfolio Budget"
          value={overview ? formatCurrency(overview.totalBudget) : '₦0'}
          subtitle="Across all projects"
          icon={DollarSign}
          loading={overviewLoading}
        />
        <KPICard
          title="Overall Variance"
          value={overview ? `${overview.variancePercent >= 0 ? '+' : ''}${overview.variancePercent.toFixed(1)}%` : '0%'}
          subtitle={overview && overview.totalVariance > 0 ? 'Over budget' : 'Under budget'}
          icon={AlertCircle}
          trend={overview && overview.variancePercent > 0 ? 'down' : 'up'}
          change={overview ? Math.abs(overview.variancePercent) : 0}
          loading={overviewLoading}
        />
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search projects or developers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="pre-construction">Pre-Construction</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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

            <div className="flex gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Display */}
      {projectsLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || stageFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first project'}
            </p>
            {!searchTerm && statusFilter === 'all' && stageFilter === 'all' && (
              <Button onClick={onCreateProject} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>All Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const variance = project.totalBudget > 0
                    ? ((project.actualSpend - project.totalBudget) / project.totalBudget) * 100
                    : 0;

                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onViewProject(project.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{project.city || 'N/A'}</TableCell>
                      <TableCell className="text-gray-700">{project.stage}</TableCell>
                      <TableCell className="text-gray-700">{project.location || project.city || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(project.totalBudget)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(project.actualSpend)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          variance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {variance > 0 ? '+' : ''}
                        {variance.toFixed(1)}%
                      </TableCell>
                      <TableCell>{getHealthBadge(variance)}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProject(project.id);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
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
              onView={() => onViewProject(project.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} projects
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasMore}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioOverview;
