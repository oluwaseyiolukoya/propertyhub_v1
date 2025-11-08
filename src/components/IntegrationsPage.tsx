import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import {
  Building,
  ArrowLeft,
  Search,
  CreditCard,
  Mail,
  MessageSquare,
  Database,
  Cloud,
  Smartphone,
  Lock,
  BarChart3,
  Zap,
  Check,
  ExternalLink,
  Globe,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Shield,
  Webhook,
  Code,
  Settings
} from 'lucide-react';

interface IntegrationsPageProps {
  onBackToHome: () => void;
  onNavigateToHelpCenter?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToStatus?: () => void;
  onNavigateToSecurity?: () => void;
}

export function IntegrationsPage({ onBackToHome, onNavigateToHelpCenter, onNavigateToCommunity, onNavigateToStatus, onNavigateToSecurity }: IntegrationsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const integrations = [
    // Payment Integrations
    {
      id: 'paystack',
      name: 'Paystack',
      category: 'payments',
      description: 'Accept payments from tenants via cards, bank transfers, and mobile money',
      icon: CreditCard,
      status: 'active',
      features: ['Card payments', 'Bank transfers', 'Recurring billing', 'Payment verification'],
      setupTime: '5 minutes',
      color: 'blue',
      popular: true
    },
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'payments',
      description: 'Global payment processing with support for 135+ currencies',
      icon: CreditCard,
      status: 'coming-soon',
      features: ['International payments', 'Multi-currency', 'Subscription billing', 'Fraud detection'],
      setupTime: '10 minutes',
      color: 'purple'
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      category: 'payments',
      description: 'African payment gateway supporting multiple payment methods',
      icon: CreditCard,
      status: 'coming-soon',
      features: ['Mobile money', 'Bank transfers', 'Card payments', 'USSD'],
      setupTime: '5 minutes',
      color: 'orange'
    },

    // Communication
    {
      id: 'sendgrid',
      name: 'SendGrid',
      category: 'communication',
      description: 'Email delivery service for transactional and marketing emails',
      icon: Mail,
      status: 'active',
      features: ['Email templates', 'Delivery tracking', 'Analytics', 'API integration'],
      setupTime: '10 minutes',
      color: 'blue'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      category: 'communication',
      description: 'SMS notifications and voice calls for tenant communication',
      icon: MessageSquare,
      status: 'coming-soon',
      features: ['SMS alerts', 'Voice calls', 'WhatsApp integration', 'Two-factor auth'],
      setupTime: '15 minutes',
      color: 'red'
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'communication',
      description: 'Team collaboration and real-time notifications',
      icon: MessageSquare,
      status: 'coming-soon',
      features: ['Maintenance alerts', 'Payment notifications', 'Team chat', 'File sharing'],
      setupTime: '5 minutes',
      color: 'purple'
    },

    // Database & Storage
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      category: 'database',
      description: 'Primary database for reliable data storage and management',
      icon: Database,
      status: 'active',
      features: ['ACID compliance', 'JSON support', 'Full-text search', 'High performance'],
      setupTime: 'Pre-configured',
      color: 'blue',
      popular: true
    },
    {
      id: 'aws-s3',
      name: 'AWS S3',
      category: 'storage',
      description: 'Secure cloud storage for documents, images, and files',
      icon: Cloud,
      status: 'active',
      features: ['Document storage', 'Image uploads', 'Backup storage', 'CDN integration'],
      setupTime: 'Pre-configured',
      color: 'orange'
    },
    {
      id: 'cloudinary',
      name: 'Cloudinary',
      category: 'storage',
      description: 'Image and video management with automatic optimization',
      icon: Cloud,
      status: 'coming-soon',
      features: ['Image optimization', 'Video hosting', 'Transformations', 'CDN delivery'],
      setupTime: '10 minutes',
      color: 'blue'
    },

    // Access Control
    {
      id: 'smart-locks',
      name: 'Smart Lock Systems',
      category: 'access-control',
      description: 'Integrate with smart locks for automated property access',
      icon: Lock,
      status: 'active',
      features: ['Remote access', 'Keycard management', 'Access logs', 'Payment-based access'],
      setupTime: '30 minutes',
      color: 'green',
      popular: true
    },
    {
      id: 'august',
      name: 'August Smart Locks',
      category: 'access-control',
      description: 'Connect August smart locks for seamless property access',
      icon: Lock,
      status: 'coming-soon',
      features: ['Auto-unlock', 'Guest access', 'Activity logs', 'Mobile app control'],
      setupTime: '20 minutes',
      color: 'gray'
    },

    // Analytics & Reporting
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Track user behavior and platform usage analytics',
      icon: BarChart3,
      status: 'coming-soon',
      features: ['User tracking', 'Event analytics', 'Custom reports', 'Real-time data'],
      setupTime: '5 minutes',
      color: 'orange'
    },
    {
      id: 'datadog',
      name: 'Datadog',
      category: 'analytics',
      description: 'Infrastructure monitoring and application performance',
      icon: BarChart3,
      status: 'coming-soon',
      features: ['Performance monitoring', 'Log management', 'APM', 'Alerting'],
      setupTime: '15 minutes',
      color: 'purple'
    },

    // Automation
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'automation',
      description: 'Connect Contrezz with 5000+ apps for workflow automation',
      icon: Zap,
      status: 'coming-soon',
      features: ['No-code automation', 'Multi-step workflows', 'Custom triggers', 'Data sync'],
      setupTime: '10 minutes',
      color: 'orange'
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      category: 'automation',
      description: 'Real-time event notifications to your custom endpoints',
      icon: Webhook,
      status: 'active',
      features: ['Real-time events', 'Custom endpoints', 'Retry logic', 'Event filtering'],
      setupTime: '15 minutes',
      color: 'blue'
    },

    // Accounting
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      category: 'accounting',
      description: 'Sync financial data with QuickBooks for accounting',
      icon: DollarSign,
      status: 'coming-soon',
      features: ['Invoice sync', 'Expense tracking', 'Financial reports', 'Tax preparation'],
      setupTime: '20 minutes',
      color: 'green'
    },
    {
      id: 'xero',
      name: 'Xero',
      category: 'accounting',
      description: 'Cloud accounting software integration for financial management',
      icon: DollarSign,
      status: 'coming-soon',
      features: ['Bank reconciliation', 'Invoicing', 'Expense claims', 'Reporting'],
      setupTime: '20 minutes',
      color: 'blue'
    },

    // Calendar
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      category: 'calendar',
      description: 'Sync maintenance schedules and appointments',
      icon: Calendar,
      status: 'coming-soon',
      features: ['Event sync', 'Reminders', 'Shared calendars', 'Mobile notifications'],
      setupTime: '5 minutes',
      color: 'blue'
    },

    // Security
    {
      id: 'auth0',
      name: 'Auth0',
      category: 'security',
      description: 'Enterprise-grade authentication and authorization',
      icon: Shield,
      status: 'coming-soon',
      features: ['SSO', 'Multi-factor auth', 'Social login', 'User management'],
      setupTime: '30 minutes',
      color: 'orange'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Integrations', icon: Globe, count: integrations.length },
    { id: 'payments', name: 'Payments', icon: CreditCard, count: integrations.filter(i => i.category === 'payments').length },
    { id: 'communication', name: 'Communication', icon: MessageSquare, count: integrations.filter(i => i.category === 'communication').length },
    { id: 'database', name: 'Database', icon: Database, count: integrations.filter(i => i.category === 'database').length },
    { id: 'storage', name: 'Storage', icon: Cloud, count: integrations.filter(i => i.category === 'storage').length },
    { id: 'access-control', name: 'Access Control', icon: Lock, count: integrations.filter(i => i.category === 'access-control').length },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, count: integrations.filter(i => i.category === 'analytics').length },
    { id: 'automation', name: 'Automation', icon: Zap, count: integrations.filter(i => i.category === 'automation').length },
    { id: 'accounting', name: 'Accounting', icon: DollarSign, count: integrations.filter(i => i.category === 'accounting').length },
    { id: 'calendar', name: 'Calendar', icon: Calendar, count: integrations.filter(i => i.category === 'calendar').length },
    { id: 'security', name: 'Security', icon: Shield, count: integrations.filter(i => i.category === 'security').length }
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-600 text-white">Active</Badge>;
    }
    return <Badge variant="outline" className="border-orange-500 text-orange-700">Coming Soon</Badge>;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600',
      gray: 'from-gray-500 to-gray-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={onBackToHome}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Building className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Contrezz</h1>
              <Badge variant="secondary" className="ml-2">Integrations</Badge>
            </button>

            <Button variant="ghost" onClick={onBackToHome}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 animate-bounce">
            <Zap className="h-3 w-3 mr-1" /> 20+ Integrations
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Connect Your Favorite Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Seamlessly integrate Contrezz with the tools you already use. Automate workflows, sync data, and enhance your property management experience.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search integrations..."
                className="pl-12 pr-4 py-6 text-lg border-2 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                  <Badge variant="secondary" className="ml-1">{category.count}</Badge>
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No integrations found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card
                    key={integration.id}
                    className="group border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 relative overflow-hidden"
                  >
                    {integration.popular && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          Popular
                        </Badge>
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getColorClasses(integration.color)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                    <CardHeader className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-14 w-14 bg-gradient-to-br ${getColorClasses(integration.color)} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                        {integration.name}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {integration.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="relative space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">Key Features:</h4>
                        <ul className="space-y-1">
                          {integration.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {integration.setupTime}
                        </div>
                        <Button
                          size="sm"
                          variant={integration.status === 'active' ? 'default' : 'outline'}
                          className={integration.status === 'active' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}
                          disabled={integration.status !== 'active'}
                        >
                          {integration.status === 'active' ? (
                            <>
                              Connect <ExternalLink className="ml-2 h-4 w-4" />
                            </>
                          ) : (
                            'Coming Soon'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Custom Integration CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <Code className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Need a Custom Integration?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Our API makes it easy to build custom integrations. Contact our team to discuss your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              View API Docs <FileText className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-white/10 text-white border-2 border-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200"
            >
              Contact Sales <MessageSquare className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-6 w-6" />
                <span className="font-bold">Contrezz Integrations</span>
              </div>
              <p className="text-gray-400">
                Connect your property management platform with the tools you love.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Integration Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Developer Forum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={onNavigateToHelpCenter}
                    className="hover:text-white transition-colors text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToCommunity}
                    className="hover:text-white transition-colors text-left"
                  >
                    Community
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToStatus}
                    className="hover:text-white transition-colors text-left"
                  >
                    Status
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToSecurity}
                    className="hover:text-white transition-colors text-left"
                  >
                    Security
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Contrezz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add Clock icon import
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

