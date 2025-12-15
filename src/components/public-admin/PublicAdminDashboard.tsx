import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  FileText,
  Briefcase,
  Eye,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";
import { publicAdminApi } from "../../lib/api/publicAdminApi";

export function PublicAdminDashboard() {
  const [stats, setStats] = useState({
    landingPages: { total: 0, published: 0 },
    careers: { total: 0, active: 0 },
    loading: true,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load landing pages
        const pagesResponse = await publicAdminApi.landingPages.list();
        const pages = pagesResponse.pages || [];

        // Load careers (will be implemented later)
        // const careersResponse = await publicAdminApi.careers.list();
        // const careers = careersResponse.careers || [];

        setStats({
          landingPages: {
            total: pages.length,
            published: pages.filter((p: any) => p.published).length,
          },
          careers: {
            total: 0, // Will be updated when careers API is ready
            active: 0,
          },
          loading: false,
        });
      } catch (error: any) {
        console.error("Failed to load dashboard stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

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
      value: "0",
      subtitle: "Last 30 days",
      icon: Eye,
      color: "from-green-600 to-emerald-600",
    },
    {
      title: "Growth",
      value: "+12%",
      subtitle: "This month",
      icon: TrendingUp,
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
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors text-left">
              <FileText className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Create Landing Page</p>
              <p className="text-sm text-gray-500 mt-1">
                Add a new landing page
              </p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left">
              <Briefcase className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Post Job Opening</p>
              <p className="text-sm text-gray-500 mt-1">
                Create a new career posting
              </p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-colors text-left">
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
