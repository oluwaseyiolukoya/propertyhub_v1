import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Home,
  MessageSquare,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  BarChart3,
} from 'lucide-react';
import { HomepageSettings } from './landing-page/HomepageSettings';
import { ContactFormSubmissions } from './landing-page/ContactFormSubmissions';
import { ScheduleDemoSubmissions } from './landing-page/ScheduleDemoSubmissions';
import { BlogInquiries } from './landing-page/BlogInquiries';
import { CommunityRequests } from './landing-page/CommunityRequests';
import { PartnershipInquiries } from './landing-page/PartnershipInquiries';
import { LandingPageStats } from './landing-page/LandingPageStats';

export function LandingPageManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Landing Page Management</h1>
          <p className="text-gray-600 mt-1">
            Manage homepage content and all landing page form submissions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="homepage" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Homepage</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="demo" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Demo</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Blog</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Community</span>
              </TabsTrigger>
              <TabsTrigger value="partnership" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Partners</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <LandingPageStats />
            </TabsContent>

            {/* Homepage Settings Tab */}
            <TabsContent value="homepage" className="mt-6">
              <HomepageSettings />
            </TabsContent>

            {/* Contact Form Submissions Tab */}
            <TabsContent value="contact" className="mt-6">
              <ContactFormSubmissions />
            </TabsContent>

            {/* Schedule Demo Tab */}
            <TabsContent value="demo" className="mt-6">
              <ScheduleDemoSubmissions />
            </TabsContent>

            {/* Blog Inquiries Tab */}
            <TabsContent value="blog" className="mt-6">
              <BlogInquiries />
            </TabsContent>

            {/* Community Requests Tab */}
            <TabsContent value="community" className="mt-6">
              <CommunityRequests />
            </TabsContent>

            {/* Partnership Inquiries Tab */}
            <TabsContent value="partnership" className="mt-6">
              <PartnershipInquiries />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

