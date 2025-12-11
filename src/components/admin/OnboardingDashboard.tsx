import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import {
  getOnboardingApplications,
  getOnboardingStats,
  deleteOnboardingApplication,
  OnboardingApplication,
  ApplicationStats,
  ApplicationFilters,
} from "../../lib/api/admin-onboarding";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Building2,
  UserCog,
  Home,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  FileText,
} from "lucide-react";

interface OnboardingDashboardProps {
  onViewApplication: (application: OnboardingApplication) => void;
}

export function OnboardingDashboard({
  onViewApplication,
}: OnboardingDashboardProps) {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [applications, setApplications] = useState<OnboardingApplication[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ApplicationFilters>({
    page: 1,
    limit: 5,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch stats and applications
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, applicationsData] = await Promise.all([
        getOnboardingStats(),
        getOnboardingApplications(filters),
      ]);

      setStats(statsData);
      setApplications(applicationsData.applications);
      setPagination(applicationsData.pagination);
    } catch (error: any) {
      console.error("[OnboardingDashboard] Fetch error:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery, page: 1 });
  };

  const handleFilterChange = (key: string, value: string) => {
    // Special handling for "all" - remove the filter instead of setting it to "all"
    if (key === "applicationType" && value === "all") {
      const { applicationType, ...restFilters } = filters;
      setFilters({ ...restFilters, page: 1 });
    } else {
      setFilters({ ...filters, [key]: value, page: 1 });
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleDeleteApplication = async (
    e: React.MouseEvent,
    application: OnboardingApplication
  ) => {
    e.stopPropagation(); // Prevent triggering the view action

    if (
      !confirm(
        `Are you sure you want to delete the application from ${application.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteOnboardingApplication(application.id);
      toast.success("Application deleted successfully");
      fetchData(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to delete application");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
      },
      under_review: {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: Search,
      },
      info_requested: {
        color: "bg-orange-100 text-orange-800 border-orange-300",
        icon: AlertCircle,
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
      },
      activated: {
        color: "bg-purple-100 text-purple-800 border-purple-300",
        icon: CheckCircle2,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      "property-owner": Building2,
      "property-manager": UserCog,
      tenant: Home,
    };
    return icons[type] || Users;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Animated Gradient - Matching Customer Management */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <FileText className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Users className="h-16 w-16 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Onboarding Applications
                </h2>
                <p className="text-purple-100 text-lg">
                  Review and manage new customer applications •{" "}
                  {stats ? `${stats.total} total applications` : "Loading..."}
                </p>
              </div>
            </div>
            <Button
              onClick={fetchData}
              className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-yellow-50/30">
            {/* Animated gradient orb */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Pending Review
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-yellow-900 bg-clip-text text-transparent">
                  {stats.pending}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Awaiting initial review
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-blue-50/30">
            {/* Animated gradient orb */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Under Review
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Search className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                  {stats.under_review}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Currently being reviewed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-green-50/30">
            {/* Animated gradient orb */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Approved
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-900 bg-clip-text text-transparent">
                  {stats.approved}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Ready for activation
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-purple-50/30">
            {/* Animated gradient orb */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-violet-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-violet-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Total Applications
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                  {stats.total}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  All time applications
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Search and Filter Section - Matching Customer Management */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[180px] border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="info_requested">Info Requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="activated">Activated</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.applicationType || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "applicationType",
                  value === "all" ? "" : value
                )
              }
            >
              <SelectTrigger className="w-[180px] border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="property-owner">Property Owner</SelectItem>
                <SelectItem value="property-manager">
                  Property Manager
                </SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleSearch}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-md"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Applications List - Matching Customer Management Table Style */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Recent Applications
              </CardTitle>
              <CardDescription className="mt-1">
                Showing {applications.length} of {pagination.total} applications
              </CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-16">
                <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-600 font-medium">
                  Loading applications...
                </p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-gray-100">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 font-medium">
                    No applications found
                  </div>
                  <div className="text-sm text-gray-400">
                    {searchQuery || filters.status || filters.applicationType
                      ? "Try adjusting your search or filters"
                      : "Get started by reviewing new applications"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-6">
                {applications.map((application) => {
                  const TypeIcon = getTypeIcon(application.applicationType);
                  return (
                    <div
                      key={application.id}
                      className="group flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-purple-50/30 hover:border-purple-300 transition-all duration-150 cursor-pointer"
                      onClick={() => onViewApplication(application)}
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md flex-shrink-0">
                          <TypeIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-base truncate">
                              {application.name}
                            </h3>
                            {getStatusBadge(application.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                            <span className="truncate">
                              {application.email}
                            </span>
                            {application.companyName && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="truncate flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-gray-400" />
                                  {application.companyName}
                                </span>
                              </>
                            )}
                            <span className="text-gray-300">•</span>
                            <span className="capitalize whitespace-nowrap">
                              {application.applicationType.replace("-", " ")}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 whitespace-nowrap">
                              {new Date(
                                application.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          onClick={(e) =>
                            handleDeleteApplication(e, application)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <Eye className="h-3 w-3" />
                          <span className="text-xs font-medium">View</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enhanced Pagination - Matching Customer Management */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                <div className="text-sm font-medium text-gray-700">
                  Page{" "}
                  <span className="text-purple-600 font-bold">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="text-purple-600 font-bold">
                    {pagination.totalPages}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 hover:bg-purple-50"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 hover:bg-purple-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




