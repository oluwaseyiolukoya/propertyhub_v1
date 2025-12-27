import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Briefcase, Eye, Users, Globe } from "lucide-react";
import { publicAdminApi } from "../../lib/api/publicAdminApi";
import { canEditContent } from "../../lib/utils/adminPermissions";

interface PublicAdminDashboardProps {
  onNavigate?: (page: string, subPage?: string) => void;
}

export function PublicAdminDashboard({ onNavigate }: PublicAdminDashboardProps) {
  const [stats, setStats] = useState({
    landingPages: { total: 0, published: 0 },
    careers: { total: 0, active: 0, totalViews: 0 },
    forms: { total: 0 },
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        // Load landing pages
        const pagesResponse = await publicAdminApi.landingPages.list();
        const pages = pagesResponse.pages || [];

        // Load career statistics
        const careersStatsResponse = await publicAdminApi.careers.getStats();
        const careersStats = careersStatsResponse.data || careersStatsResponse;

        // Load form statistics
        let formsTotal = 0;
        try {
          const formsStatsResponse = await publicAdminApi.forms.getStats();
          const formsStats = formsStatsResponse.data || formsStatsResponse;
          // Sum up all form submissions
          if (formsStats.overall) {
            formsTotal = formsStats.overall.total || 0;
          } else if (Array.isArray(formsStats)) {
            formsTotal = formsStats.reduce(
              (sum: number, form: any) => sum + (form.total || 0),
              0
            );
          }
        } catch (error: any) {
          // Handle rate limiting gracefully - don't show error
          if (
            error.error === "Too many requests" ||
            error.message === "Too many requests"
          ) {
            console.warn("Rate limited while loading form stats");
          } else {
            console.warn("Failed to load form stats:", error);
          }
          // Continue without form stats
        }

        if (isMounted) {
          setStats({
            landingPages: {
              total: pages.length,
              published: pages.filter((p: any) => p.published).length,
            },
            careers: {
              total: careersStats.total || 0,
              active: careersStats.active || 0,
              totalViews: careersStats.totalViews || 0,
            },
            forms: {
              total: formsTotal,
            },
            loading: false,
          });
        }
      } catch (error: any) {
        // Handle rate limiting gracefully
        if (
          error.error === "Too many requests" ||
          error.message === "Too many requests"
        ) {
          console.warn("Rate limited while loading dashboard stats");
        } else {
          console.error("Failed to load dashboard stats:", error);
        }
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const statCards = [
    {
      title: "Landing Pages",
      value: stats.landingPages.total,
      subtitle: `${stats.landingPages.published} published`,
      icon: FileText,
      color: "from-purple-600 to-violet-600",
    },
    {
      title: "Career Postings",
      value: stats.careers.total,
      subtitle: `${stats.careers.active} active`,
      icon: Briefcase,
      color: "from-blue-600 to-cyan-600",
    },
    {
      title: "Total Views",
      value: formatNumber(stats.careers.totalViews),
      subtitle: "All career postings",
      icon: Eye,
      color: "from-green-600 to-emerald-600",
    },
    {
      title: "Form Submissions",
      value: stats.forms.total,
      subtitle: "All forms",
      icon: Users,
      color: "from-orange-600 to-red-600",
    },
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of your public content</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div
                    className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {canEditContent() ? (
              <button
                onClick={() => onNavigate?.("landing-pages")}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors text-left cursor-pointer"
              >
                <FileText className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Create Landing Page</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new landing page
                </p>
              </button>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-left opacity-60">
                <FileText className="h-6 w-6 text-gray-400 mb-2" />
                <p className="font-medium text-gray-500">Create Landing Page</p>
                <p className="text-sm text-gray-400 mt-1">
                  View only - no edit access
                </p>
              </div>
            )}
            {canEditContent() ? (
              <button
                onClick={() => onNavigate?.("careers")}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left cursor-pointer"
              >
                <Briefcase className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Post Job Opening</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create a new career posting
                </p>
              </button>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-left opacity-60">
                <Briefcase className="h-6 w-6 text-gray-400 mb-2" />
                <p className="font-medium text-gray-500">Post Job Opening</p>
                <p className="text-sm text-gray-400 mt-1">
                  View only - no edit access
                </p>
              </div>
            )}
            <button
              onClick={() => onNavigate?.("analytics")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-colors text-left cursor-pointer"
            >
              <Globe className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-500 mt-1">
                See content performance
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
