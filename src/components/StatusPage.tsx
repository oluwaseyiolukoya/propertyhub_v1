import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { PublicLayout } from "./PublicLayout";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Server,
  Database,
  Cloud,
  Globe,
  Zap,
  TrendingUp,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface StatusPageProps {
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
}

export function StatusPage({
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
  onNavigateToSecurity
}: StatusPageProps) {

  const services = [
    {
      name: 'Web Application',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '245ms',
      icon: Globe,
      description: 'Main web platform and dashboard'
    },
    {
      name: 'API Services',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '128ms',
      icon: Server,
      description: 'REST API and webhooks'
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: '100%',
      responseTime: '42ms',
      icon: Database,
      description: 'PostgreSQL database cluster'
    },
    {
      name: 'File Storage',
      status: 'operational',
      uptime: '99.97%',
      responseTime: '156ms',
      icon: Cloud,
      description: 'Document and image storage'
    },
    {
      name: 'Payment Processing',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '312ms',
      icon: Zap,
      description: 'Paystack integration'
    },
    {
      name: 'Email Delivery',
      status: 'operational',
      uptime: '99.92%',
      responseTime: '1.2s',
      icon: Activity,
      description: 'Transactional email service'
    }
  ];

  const incidents = [
    {
      id: 1,
      title: 'Scheduled Maintenance - Database Upgrade',
      status: 'scheduled',
      date: 'Feb 18, 2025',
      time: '2:00 AM - 4:00 AM EST',
      description: 'We will be upgrading our database infrastructure to improve performance. Expected downtime: 2 hours.',
      impact: 'All services will be temporarily unavailable'
    },
    {
      id: 2,
      title: 'Resolved: Slow API Response Times',
      status: 'resolved',
      date: 'Feb 10, 2025',
      time: '3:15 PM EST',
      description: 'Some users experienced slower than normal API response times. Issue was identified and resolved.',
      impact: 'Minor performance degradation',
      duration: '45 minutes'
    },
    {
      id: 3,
      title: 'Resolved: Email Delivery Delays',
      status: 'resolved',
      date: 'Feb 5, 2025',
      time: '10:30 AM EST',
      description: 'Email notifications were delayed due to a third-party service issue. All emails have been delivered.',
      impact: 'Delayed email notifications',
      duration: '2 hours'
    }
  ];

  const metrics = [
    {
      label: 'Overall Uptime',
      value: '99.98%',
      period: 'Last 30 days',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Avg Response Time',
      value: '184ms',
      period: 'Last 24 hours',
      trend: 'down',
      icon: Activity,
      color: 'blue'
    },
    {
      label: 'Active Incidents',
      value: '0',
      period: 'Current',
      trend: 'neutral',
      icon: AlertCircle,
      color: 'green'
    },
    {
      label: 'Days Since Incident',
      value: '8',
      period: 'Last major incident',
      trend: 'up',
      icon: Calendar,
      color: 'purple'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500 text-white"><AlertCircle className="h-3 w-3 mr-1" /> Degraded</Badge>;
      case 'outage':
        return <Badge className="bg-red-500 text-white"><AlertCircle className="h-3 w-3 mr-1" /> Outage</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" /> Scheduled</Badge>;
      case 'resolved':
        return <Badge className="bg-gray-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Resolved</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      green: 'from-green-500 to-green-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <PublicLayout
      currentPage="status"
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-green-50 to-blue-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-green-500 text-white border-0 animate-bounce">
            <CheckCircle2 className="h-3 w-3 mr-1" /> All Systems Operational
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Contrezz
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> System Status</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            Real-time status and performance metrics for all Contrezz services
          </p>

          {/* Current Status */}
          <div className="inline-flex items-center space-x-3 bg-white rounded-full px-6 py-3 shadow-lg">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-gray-900">All Systems Operational</span>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Performance Metrics</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`h-12 w-12 bg-gradient-to-br ${getColorClasses(metric.color)} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      {metric.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">{metric.label}</div>
                    <div className="text-xs text-gray-500">{metric.period}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Status */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Service Status</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="border-2 hover:border-green-300 transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-semibold text-green-600">{service.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Response Time:</span>
                        <span className="font-semibold text-blue-600">{service.responseTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Incidents & Maintenance */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Incidents & Maintenance</h2>

          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusBadge(incident.status)}
                        <span className="text-sm text-gray-600">
                          {incident.date} at {incident.time}
                        </span>
                      </div>
                      <CardTitle className="text-xl mb-2">{incident.title}</CardTitle>
                      <CardDescription className="text-base">{incident.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex items-start">
                      <span className="font-semibold text-gray-700 w-24">Impact:</span>
                      <span className="text-gray-600">{incident.impact}</span>
                    </div>
                    {incident.duration && (
                      <div className="flex items-start">
                        <span className="font-semibold text-gray-700 w-24">Duration:</span>
                        <span className="text-gray-600">{incident.duration}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-900">Stay Informed</CardTitle>
              <CardDescription className="text-blue-700">
                Subscribe to receive real-time notifications about service status and scheduled maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Subscribe to Updates
              </Button>
              <Button variant="outline" className="border-2">
                <ExternalLink className="h-4 w-4 mr-2" />
                RSS Feed
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Historical Uptime */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Historical Uptime</h2>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">Last 90 Days</span>
                    <span className="text-2xl font-bold text-green-600">99.97%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600" style={{ width: '99.97%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">99.99%</div>
                    <div className="text-sm text-gray-600">Last 7 days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">99.98%</div>
                    <div className="text-sm text-gray-600">Last 30 days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">99.97%</div>
                    <div className="text-sm text-gray-600">Last 90 days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">99.95%</div>
                    <div className="text-sm text-gray-600">Last 365 days</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
