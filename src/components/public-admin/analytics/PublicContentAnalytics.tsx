import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  FileText,
  Briefcase,
} from "lucide-react";
import { publicAdminApi } from "../../../lib/api/publicAdminApi";

export function PublicContentAnalytics() {
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

        // Load careers stats
        const careersStats = await publicAdminApi.careers.getStats();
        const careersData = careersStats.data || careersStats;

        setStats({
          landingPages: {
            total: pages.length,
            published: pages.filter((p: any) => p.published).length,
          },
          careers: {
            total: careersData.total || 0,
            active: careersData.active || 0,
          },
          loading: false,
        });
      } catch (error: any) {
        console.error("Failed to load analytics:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

  const analyticsCards = [
    {
      title: "Landing Pages",
      value: stats.landingPages.total,
      subtitle: `${stats.landingPages.published} published`,
      icon: FileText,
      color: "from-purple-600 to-violet-600",
      trend: "+5%",
    },
    {
      title: "Career Postings",
      value: stats.careers.total,
      subtitle: `${stats.careers.active} active`,
      icon: Briefcase,
      color: "from-blue-600 to-cyan-600",
      trend: "+12%",
    },
    {
      title: "Total Views",
      value: "1,234",
      subtitle: "Last 30 days",
      icon: Eye,
      color: "from-green-600 to-emerald-600",
      trend: "+8%",
    },
    {
      title: "Engagement",
      value: "89%",
      subtitle: "Average",
      icon: TrendingUp,
      color: "from-orange-600 to-red-600",
      trend: "+3%",
    },
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-500 mt-1">Content performance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((stat, index) => {
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
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500">{stat.subtitle}</p>
                      <span className="text-xs text-green-600 font-medium">
                        {stat.trend}
                      </span>
                    </div>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Content Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Chart visualization coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Trend visualization coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
