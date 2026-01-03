import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PublicLayout } from "./PublicLayout";
import {
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquare,
  Mail,
  Phone,
  Video,
  FileText,
  Settings,
  CreditCard,
  Users,
  Home,
  Wrench,
  Shield,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

interface HelpCenterPageProps {
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

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export function HelpCenterPage({
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
}: HelpCenterPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen, color: 'blue' },
    { id: 'getting-started', name: 'Getting Started', icon: Zap, color: 'green' },
    { id: 'account', name: 'Account & Billing', icon: CreditCard, color: 'purple' },
    { id: 'properties', name: 'Property Management', icon: Home, color: 'orange' },
    { id: 'tenants', name: 'Tenant Management', icon: Users, color: 'pink' },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench, color: 'yellow' },
    { id: 'security', name: 'Security & Privacy', icon: Shield, color: 'red' }
  ];

  const faqs: FAQItem[] = [
    // Getting Started
    {
      id: 1,
      question: 'How do I create a Contrezz account?',
      answer: 'Click the "Get Started" button on our homepage, select your role (Property Owner, Property Manager, or Tenant), and fill out the registration form. For Property Owners and Managers, our team will review your application within 24-48 hours. Tenants can sign in using credentials provided by their property manager.',
      category: 'getting-started'
    },
    {
      id: 2,
      question: 'What are the different user roles in Contrezz?',
      answer: 'Contrezz has four main roles: 1) Property Owners - manage their property portfolio and assign managers, 2) Property Managers - handle day-to-day operations, tenant relations, and maintenance, 3) Tenants - pay rent, submit maintenance requests, and access documents, 4) Admin - system administrators with full access.',
      category: 'getting-started'
    },
    {
      id: 3,
      question: 'How long does it take to set up my properties?',
      answer: 'Initial setup typically takes 15-30 minutes per property. You\'ll need to enter property details, add units, upload documents, and invite tenants. Our onboarding team can assist you with bulk imports if you have multiple properties.',
      category: 'getting-started'
    },
    {
      id: 4,
      question: 'Can I import data from my current property management software?',
      answer: 'Yes! We support data imports from most major property management platforms including Buildium, AppFolio, and Yardi. Contact our support team to schedule a data migration consultation.',
      category: 'getting-started'
    },

    // Account & Billing
    {
      id: 5,
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and bank transfers via Paystack. All payments are processed securely with industry-standard encryption.',
      category: 'account'
    },
    {
      id: 6,
      question: 'How does your pricing work?',
      answer: 'We offer three pricing tiers: Starter ($299/month for up to 3 properties and 75 units), Professional ($799/month for up to 15 properties and 500 units), and Enterprise (custom pricing for larger portfolios). All plans include a 14-day free trial with no credit card required.',
      category: 'account'
    },
    {
      id: 7,
      question: 'Can I cancel my subscription at any time?',
      answer: 'Yes, you can cancel your subscription at any time with no penalties. Your account will remain active until the end of your current billing period. All your data will be available for export for 30 days after cancellation.',
      category: 'account'
    },
    {
      id: 8,
      question: 'How do I update my billing information?',
      answer: 'Go to Settings > Billing & Subscription, click "Update Payment Method," and enter your new payment details. Changes take effect immediately for future payments.',
      category: 'account'
    },
    {
      id: 9,
      question: 'Do you offer discounts for annual subscriptions?',
      answer: 'Yes! Save 17% by paying annually instead of monthly. For example, the Starter plan is $2,990/year (instead of $3,588), saving you $598 annually.',
      category: 'account'
    },

    // Property Management
    {
      id: 10,
      question: 'How do I add a new property?',
      answer: 'Navigate to Properties > Add Property, fill in the property details (address, type, purchase price, etc.), add units with their specifications, and upload any relevant documents. You can also assign property managers at this stage.',
      category: 'properties'
    },
    {
      id: 11,
      question: 'Can I assign multiple managers to one property?',
      answer: 'Yes! You can assign multiple property managers to a single property. Each manager will have access to manage tenants, maintenance requests, and documents for that property.',
      category: 'properties'
    },
    {
      id: 12,
      question: 'How do I track property expenses?',
      answer: 'Go to Properties > [Select Property] > Expenses. Click "Add Expense," categorize it (maintenance, utilities, insurance, etc.), attach receipts, and save. All expenses are automatically included in your financial reports.',
      category: 'properties'
    },
    {
      id: 13,
      question: 'Can I generate financial reports for my properties?',
      answer: 'Yes! Navigate to Reports > Financial Reports to generate income statements, cash flow reports, expense summaries, and tax documents. You can filter by property, date range, and export to PDF or Excel.',
      category: 'properties'
    },

    // Tenant Management
    {
      id: 14,
      question: 'How do I add new tenants?',
      answer: 'Go to Tenants > Add Tenant, enter their details (name, email, phone), assign them to a unit, set lease terms (start/end dates, rent amount), and click "Send Invitation." They\'ll receive an email with login credentials.',
      category: 'tenants'
    },
    {
      id: 15,
      question: 'How do tenants pay rent through Contrezz?',
      answer: 'Tenants can pay rent online through their dashboard using credit/debit cards or bank transfers via Paystack. Payments are processed securely and property owners receive instant notifications.',
      category: 'tenants'
    },
    {
      id: 16,
      question: 'Can I set up automatic rent reminders?',
      answer: 'Yes! Go to Settings > Notifications and enable "Rent Reminders." Tenants will receive automated reminders 7 days before, 3 days before, and on the due date. You can customize the timing and message.',
      category: 'tenants'
    },
    {
      id: 17,
      question: 'How do I handle lease renewals?',
      answer: 'The system automatically flags leases expiring within 60 days. Navigate to Tenants > [Select Tenant] > Lease, click "Renew Lease," update terms if needed, and send the renewal agreement for e-signature.',
      category: 'tenants'
    },
    {
      id: 18,
      question: 'Can tenants access their lease documents?',
      answer: 'Yes! Tenants can view and download their lease agreements, payment receipts, and other documents from their dashboard under Documents > My Lease.',
      category: 'tenants'
    },

    // Maintenance
    {
      id: 19,
      question: 'How do maintenance requests work?',
      answer: 'Tenants submit requests through their dashboard with descriptions and photos. Property managers receive instant notifications, can assign requests to vendors, track progress, and communicate with tenants through the platform.',
      category: 'maintenance'
    },
    {
      id: 20,
      question: 'Can I assign maintenance tasks to external vendors?',
      answer: 'Yes! Add vendors to your network (Maintenance > Vendors > Add Vendor), then assign maintenance requests to them. Vendors receive email notifications and can update task status.',
      category: 'maintenance'
    },
    {
      id: 21,
      question: 'How do I track maintenance costs?',
      answer: 'Each maintenance request allows you to log costs and attach invoices. All maintenance expenses are automatically tracked and included in your property expense reports.',
      category: 'maintenance'
    },
    {
      id: 22,
      question: 'Can tenants upload photos with maintenance requests?',
      answer: 'Yes! Tenants can upload up to 5 photos per maintenance request to help property managers assess the issue quickly and accurately.',
      category: 'maintenance'
    },

    // Security & Privacy
    {
      id: 23,
      question: 'Is my data secure on Contrezz?',
      answer: 'Yes! We use bank-level 256-bit SSL encryption for all data transmission and storage. Our servers are hosted on AWS with automatic backups, DDoS protection, and 99.9% uptime guarantee.',
      category: 'security'
    },
    {
      id: 24,
      question: 'Who can access my property data?',
      answer: 'Only users you explicitly grant access to can view your property data. Property owners control who can access what through role-based permissions. We never share your data with third parties without your consent.',
      category: 'security'
    },
    {
      id: 25,
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Settings > Security, click "Enable Two-Factor Authentication," scan the QR code with your authenticator app (Google Authenticator, Authy, etc.), and enter the verification code. 2FA is highly recommended for all accounts.',
      category: 'security'
    },
    {
      id: 26,
      question: 'What happens to my data if I cancel my subscription?',
      answer: 'Your data remains accessible for 30 days after cancellation. You can export all your data (properties, tenants, documents, financial records) during this period. After 30 days, data is permanently deleted per our privacy policy.',
      category: 'security'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      yellow: 'from-yellow-500 to-yellow-600',
      red: 'from-red-500 to-red-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <PublicLayout
      currentPage="help-center"
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
            <HelpCircle className="h-3 w-3 mr-1" /> Help Center
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            How Can We
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Help You?</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            Search our knowledge base or browse categories to find answers to your questions
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for help articles, FAQs, guides..."
                className="pl-12 pr-4 py-6 text-lg border-2 focus:border-blue-500 shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
            <div>
              <div className="text-3xl font-bold text-blue-600">{faqs.length}+</div>
              <div className="text-sm text-gray-600">Help Articles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-gray-600">Support Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">&lt;2h</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Browse by Category</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.filter(cat => cat.id !== 'all').map((category) => {
              const Icon = category.icon;
              const count = faqs.filter(faq => faq.category === category.id).length;

              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 border-2 ${
                    selectedCategory === category.id ? 'border-blue-500 shadow-lg' : 'hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`h-16 w-16 bg-gradient-to-br ${getColorClasses(category.color)} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="mt-2">
                      <Badge variant="secondary">{count} articles</Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {selectedCategory !== 'all' && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory('all')}
                className="border-2"
              >
                View All Categories
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              {selectedCategory === 'all' ? 'Frequently Asked Questions' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
            </Badge>
          </div>

          {filteredFAQs.length > 0 ? (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <Card
                  key={faq.id}
                  className="border-2 hover:border-blue-300 transition-all duration-200 cursor-pointer"
                  onClick={() => toggleFAQ(faq.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-start">
                          <HelpCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                          {faq.question}
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-4">
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {expandedFAQ === faq.id && (
                    <CardContent>
                      <div className="pl-7 text-gray-700 leading-relaxed">
                        {faq.answer}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or browse our categories above
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <MessageSquare className="h-3 w-3 mr-1" /> Need More Help?
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our support team is here to help you 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Live Chat */}
            <Card className="border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>Chat with our support team in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Start Chat
                </Button>
                <div className="flex items-center justify-center mt-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Avg response: 2 min
                </div>
              </CardContent>
            </Card>

            {/* Email Support */}
            <Card className="border-2 hover:border-purple-300 transition-all duration-300 hover:shadow-xl text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle>Email Support</CardTitle>
                <CardDescription>Send us a detailed message</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-2"
                  onClick={onNavigateToContact}
                >
                  Send Email
                </Button>
                <div className="flex items-center justify-center mt-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Avg response: 2 hours
                </div>
              </CardContent>
            </Card>

            {/* Schedule Demo */}
            <Card className="border-2 hover:border-green-300 transition-all duration-300 hover:shadow-xl text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle>Schedule Demo</CardTitle>
                <CardDescription>Get a personalized walkthrough</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-2"
                  onClick={onNavigateToScheduleDemo}
                >
                  Book Demo
                </Button>
                <div className="flex items-center justify-center mt-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  30-minute session
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Additional Resources</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl cursor-pointer">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Documentation</CardTitle>
                <CardDescription>Detailed guides and tutorials</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="ghost" className="text-blue-600">
                  View Docs <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-300 transition-all duration-300 hover:shadow-xl cursor-pointer">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Video className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Video Tutorials</CardTitle>
                <CardDescription>Step-by-step video guides</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="ghost" className="text-purple-600">
                  Watch Videos <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card
              className="border-2 hover:border-orange-300 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={onNavigateToAPIDocumentation}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">API Documentation</CardTitle>
                <CardDescription>Developer resources</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="ghost" className="text-orange-600">
                  API Docs <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card
              className="border-2 hover:border-green-300 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={onNavigateToBlog}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Blog & Updates</CardTitle>
                <CardDescription>Latest news and tips</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="ghost" className="text-green-600">
                  Read Blog <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

