import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Home,
  MessageSquare,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  BarChart3,
  Sparkles,
  Globe,
  Briefcase,
} from "lucide-react";
import { HomepageSettings } from "./landing-page/HomepageSettings";
import { ContactFormSubmissions } from "./landing-page/ContactFormSubmissions";
import { ScheduleDemoSubmissions } from "./landing-page/ScheduleDemoSubmissions";
import { BlogInquiries } from "./landing-page/BlogInquiries";
import { CommunityRequests } from "./landing-page/CommunityRequests";
import { PartnershipInquiries } from "./landing-page/PartnershipInquiries";
import { LandingPageStats } from "./landing-page/LandingPageStats";
import { CareerManagement } from "./landing-page/CareerManagement";

export function LandingPageManagement() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Animated Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Globe className="h-16 w-16 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Landing Page Management
              </h1>
              <p className="text-purple-100 text-lg">
                Manage homepage content and all landing page form submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Enhanced Tabs List */}
            <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50">
              <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8 h-auto bg-transparent p-2 gap-2">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="homepage"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Homepage</span>
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Contact</span>
                </TabsTrigger>
                <TabsTrigger
                  value="demo"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Demo</span>
                </TabsTrigger>
                <TabsTrigger
                  value="blog"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Blog</span>
                </TabsTrigger>
                <TabsTrigger
                  value="community"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">
                    Community
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="partnership"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Partners</span>
                </TabsTrigger>
                <TabsTrigger
                  value="careers"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Careers</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents with Enhanced Padding */}
            <div className="p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <LandingPageStats />
              </TabsContent>

              {/* Homepage Settings Tab */}
              <TabsContent value="homepage" className="mt-0">
                <HomepageSettings />
              </TabsContent>

              {/* Contact Form Submissions Tab */}
              <TabsContent value="contact" className="mt-0">
                <ContactFormSubmissions />
              </TabsContent>

              {/* Schedule Demo Tab */}
              <TabsContent value="demo" className="mt-0">
                <ScheduleDemoSubmissions />
              </TabsContent>

              {/* Blog Inquiries Tab */}
              <TabsContent value="blog" className="mt-0">
                <BlogInquiries />
              </TabsContent>

              {/* Community Requests Tab */}
              <TabsContent value="community" className="mt-0">
                <CommunityRequests />
              </TabsContent>

              {/* Partnership Inquiries Tab */}
              <TabsContent value="partnership" className="mt-0">
                <PartnershipInquiries />
              </TabsContent>

              {/* Careers Management Tab */}
              <TabsContent value="careers" className="mt-0">
                <CareerManagement />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
