import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PublicLayout } from "./PublicLayout";
import {
  Users,
  MessageSquare,
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
  Heart,
  Zap,
  Star,
  ThumbsUp,
  Eye,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  Lightbulb
} from 'lucide-react';

interface CommunityPageProps {
  onBackToHome: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToScheduleDemo?: () => void;
  onNavigateToAPIDocumentation?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToHelpCenter?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToStatus?: () => void;
  onNavigateToSecurity?: () => void;
  onNavigateToNewDiscussion?: () => void;
}

export function CommunityPage({
  onBackToHome,
  onNavigateToLogin,
  onNavigateToGetStarted,
  onNavigateToAbout,
  onNavigateToBlog,
  onNavigateToContact,
  onNavigateToScheduleDemo,
  onNavigateToAPIDocumentation,
  onNavigateToIntegrations,
  onNavigateToCareers,
  onNavigateToHelpCenter,
  onNavigateToCommunity,
  onNavigateToStatus,
  onNavigateToSecurity,
  onNavigateToNewDiscussion
}: CommunityPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Discussions', icon: MessageSquare, color: 'blue' },
    { id: 'general', name: 'General', icon: MessageCircle, color: 'green' },
    { id: 'feature-requests', name: 'Feature Requests', icon: Lightbulb, color: 'purple' },
    { id: 'best-practices', name: 'Best Practices', icon: Award, color: 'orange' },
    { id: 'support', name: 'Support', icon: Heart, color: 'red' }
  ];

  const discussions = [
    {
      id: 1,
      title: 'Best practices for managing multiple properties',
      author: 'Sarah Johnson',
      avatar: 'SJ',
      category: 'best-practices',
      replies: 24,
      views: 342,
      likes: 18,
      timestamp: '2 hours ago',
      excerpt: 'I manage 15 properties across 3 cities. Here are some tips that have helped me streamline operations...',
      tags: ['property-management', 'tips', 'workflow']
    },
    {
      id: 2,
      title: 'Feature Request: Bulk tenant invitation',
      author: 'Michael Chen',
      avatar: 'MC',
      category: 'feature-requests',
      replies: 12,
      views: 156,
      likes: 45,
      timestamp: '5 hours ago',
      excerpt: 'It would be great to have the ability to invite multiple tenants at once instead of one by one...',
      tags: ['feature-request', 'tenants', 'efficiency']
    },
    {
      id: 3,
      title: 'How to handle late rent payments?',
      author: 'Emily Rodriguez',
      avatar: 'ER',
      category: 'general',
      replies: 31,
      views: 489,
      likes: 22,
      timestamp: '1 day ago',
      excerpt: 'What\'s your process for handling tenants who consistently pay rent late? Looking for advice...',
      tags: ['payments', 'tenants', 'advice']
    },
    {
      id: 4,
      title: 'Maintenance request workflow optimization',
      author: 'David Kim',
      avatar: 'DK',
      category: 'best-practices',
      replies: 18,
      views: 267,
      likes: 31,
      timestamp: '2 days ago',
      excerpt: 'After managing 200+ maintenance requests, here\'s what I\'ve learned about optimizing the workflow...',
      tags: ['maintenance', 'workflow', 'optimization']
    },
    {
      id: 5,
      title: 'Integration with accounting software',
      author: 'Lisa Anderson',
      avatar: 'LA',
      category: 'support',
      replies: 8,
      views: 124,
      likes: 6,
      timestamp: '3 days ago',
      excerpt: 'Has anyone successfully integrated Contrezz with QuickBooks? Need help with the setup...',
      tags: ['integration', 'accounting', 'quickbooks']
    },
    {
      id: 6,
      title: 'Mobile app feature suggestions',
      author: 'James Wilson',
      avatar: 'JW',
      category: 'feature-requests',
      replies: 42,
      views: 612,
      likes: 67,
      timestamp: '4 days ago',
      excerpt: 'The mobile app is great, but here are some features that would make it even better...',
      tags: ['mobile', 'feature-request', 'ux']
    }
  ];

  const events = [
    {
      id: 1,
      title: 'Monthly Property Managers Meetup',
      date: 'Feb 15, 2025',
      time: '6:00 PM EST',
      type: 'Virtual',
      attendees: 47
    },
    {
      id: 2,
      title: 'Webinar: Advanced Reporting Features',
      date: 'Feb 20, 2025',
      time: '2:00 PM EST',
      type: 'Webinar',
      attendees: 124
    },
    {
      id: 3,
      title: 'Q&A with Product Team',
      date: 'Feb 25, 2025',
      time: '4:00 PM EST',
      type: 'Live Q&A',
      attendees: 89
    }
  ];

  const topContributors = [
    { name: 'Sarah Johnson', posts: 156, helpful: 342, avatar: 'SJ' },
    { name: 'Michael Chen', posts: 134, helpful: 298, avatar: 'MC' },
    { name: 'Emily Rodriguez', posts: 98, helpful: 245, avatar: 'ER' },
    { name: 'David Kim', posts: 87, helpful: 201, avatar: 'DK' }
  ];

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         discussion.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || discussion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PublicLayout
      currentPage="community"
      onNavigateToHome={onBackToHome}
      onNavigateToLogin={onNavigateToLogin}
      onNavigateToGetStarted={onNavigateToGetStarted}
      onNavigateToAbout={onNavigateToAbout}
      onNavigateToCareers={onNavigateToCareers}
      onNavigateToBlog={onNavigateToBlog}
      onNavigateToContact={onNavigateToContact}
      onNavigateToScheduleDemo={onNavigateToScheduleDemo}
      onNavigateToAPIDocumentation={onNavigateToAPIDocumentation}
      onNavigateToIntegrations={onNavigateToIntegrations}
      onNavigateToHelpCenter={onNavigateToHelpCenter}
      onNavigateToCommunity={onNavigateToCommunity}
      onNavigateToStatus={onNavigateToStatus}
      onNavigateToSecurity={onNavigateToSecurity}
    >
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 animate-bounce">
            <Users className="h-3 w-3 mr-1" /> Community
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Join the
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Contrezz Community</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            Connect with property managers, share insights, and learn from the best in the industry
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search discussions, topics, members..."
                className="pl-12 pr-4 py-6 text-lg border-2 focus:border-blue-500 shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
            <div>
              <div className="text-3xl font-bold text-blue-600">2.5k+</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">850+</div>
              <div className="text-sm text-gray-600">Discussions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={selectedCategory === category.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Discussions */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Recent Discussions ({filteredDiscussions.length})
                </h2>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={onNavigateToNewDiscussion}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </div>

              <div className="space-y-4">
                {filteredDiscussions.map((discussion) => (
                  <Card key={discussion.id} className="border-2 hover:border-blue-300 transition-all duration-200 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {discussion.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1 hover:text-blue-600 transition-colors">
                              {discussion.title}
                            </CardTitle>
                            <div className="flex items-center space-x-3 text-sm text-gray-500 mb-2">
                              <span>{discussion.author}</span>
                              <span>•</span>
                              <span>{discussion.timestamp}</span>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {discussion.excerpt}
                            </CardDescription>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {discussion.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {discussion.replies} replies
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {discussion.views} views
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {discussion.likes} likes
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredDiscussions.length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No discussions found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {event.date} at {event.time}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {event.attendees} attending
                        </div>
                        <Badge variant="secondary" className="text-xs mt-2">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Events
                  </Button>
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-purple-600" />
                    Top Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topContributors.map((contributor, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {contributor.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{contributor.name}</div>
                        <div className="text-xs text-gray-600">
                          {contributor.posts} posts • {contributor.helpful} helpful
                        </div>
                      </div>
                      <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Community Guidelines */}
              <Card className="border-2 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Community Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-800 space-y-2">
                  <p>• Be respectful and professional</p>
                  <p>• Share knowledge and help others</p>
                  <p>• Stay on topic</p>
                  <p>• No spam or self-promotion</p>
                  <Button variant="outline" className="w-full mt-4 border-blue-300">
                    Read Full Guidelines
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Join the Conversation?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Sign up today and connect with thousands of property management professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100"
              onClick={onNavigateToGetStarted}
            >
              Join Community
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-2 border-white text-white hover:bg-white hover:text-blue-600 active:bg-gray-100 active:text-blue-700"
              onClick={onNavigateToLogin}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
