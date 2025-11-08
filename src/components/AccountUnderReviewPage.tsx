import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Building,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Building2,
  UserCog,
  Home
} from 'lucide-react';

interface AccountUnderReviewPageProps {
  onBackToHome: () => void;
  userRole: 'property-owner' | 'property-manager' | 'tenant';
  userEmail: string;
  userName: string;
}

export function AccountUnderReviewPage({
  onBackToHome,
  userRole,
  userEmail,
  userName
}: AccountUnderReviewPageProps) {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const roleInfo = {
    'property-owner': {
      icon: Building2,
      title: 'Property Owner',
      reviewTime: '24-48 hours',
      benefits: [
        'Full access to portfolio management',
        'Financial analytics and reporting',
        'Property manager assignment',
        'Dedicated account manager'
      ]
    },
    'property-manager': {
      icon: UserCog,
      title: 'Property Manager',
      reviewTime: '24-48 hours',
      benefits: [
        'Multi-property management dashboard',
        'Tenant communication tools',
        'Maintenance coordination',
        'Assignment to properties'
      ]
    },
    'tenant': {
      icon: Home,
      title: 'Tenant',
      reviewTime: '12-24 hours',
      benefits: [
        'Online rent payments',
        'Maintenance request submission',
        'Document access',
        'Direct landlord communication'
      ]
    }
  };

  const info = roleInfo[userRole];
  const RoleIcon = info.icon;

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
              <Badge variant="secondary" className="ml-2">SaaS</Badge>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Success Icon */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative p-6 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h1>
            <p className="text-xl text-gray-600">
              Thank you for choosing Contrezz, {userName}
            </p>
          </div>

          {/* Main Status Card */}
          <Card className="border-2 border-blue-200 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
            <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-white shadow-md">
                  <RoleIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl lg:text-3xl">Account Under Review</CardTitle>
              <CardDescription className="text-base lg:text-lg">
                Your {info.title} application is being reviewed by our team
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Timeline */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-100">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Expected Review Time</h3>
                      <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {info.reviewTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        Our sales team will carefully review your application and reach out to you shortly
                      </p>
                    </div>
                  </div>
                </div>

                {/* What's Next */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    What Happens Next?
                  </h3>
                  <div className="space-y-3">
                    {[
                      { title: 'Application Review', desc: 'Our team will verify your information' },
                      { title: 'Sales Contact', desc: 'A team member will reach out via email or phone' },
                      { title: 'Account Activation', desc: "Once approved, you'll receive login credentials" },
                      { title: 'Onboarding', desc: 'Get personalized setup assistance and training' }
                    ].map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="mt-1 flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm text-white font-semibold shadow-md">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold text-gray-900">{step.title}:</span>
                            <span className="text-gray-600"> {step.desc}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">What You'll Get Access To</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {info.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm p-2 rounded-lg hover:bg-green-50 transition-colors">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Mail className="h-5 w-5 mr-2 text-blue-600" />
                  Confirmation Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  We've sent a confirmation email to:
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border-2 border-blue-100">
                  <p className="text-sm font-medium text-blue-900 break-all">{userEmail}</p>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Please check your spam folder if you don't see it in your inbox
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href="mailto:sales@contrezz.com" className="text-blue-600 hover:underline font-medium">
                      sales@contrezz.com
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href="tel:+15551234567" className="text-blue-600 hover:underline font-medium">
                      +1 (555) 123-4567
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Available Monday - Friday, 9 AM - 6 PM EST
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={onBackToHome}
              variant="outline"
              size="lg"
              className="border-2 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Additional Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Application Reference</h4>
                  <p className="text-xs text-gray-600">
                    Your application has been saved. If you need to reference it, please use the email address you provided: <span className="font-semibold text-blue-600">{userEmail}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Contrezz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

