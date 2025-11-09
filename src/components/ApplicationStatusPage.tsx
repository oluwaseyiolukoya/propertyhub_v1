import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from 'sonner';
import { checkApplicationStatus } from '../lib/api/onboarding';
import {
  Building,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Mail,
  Calendar,
  Info
} from 'lucide-react';

interface ApplicationStatusPageProps {
  onBackToHome: () => void;
}

export function ApplicationStatusPage({ onBackToHome }: ApplicationStatusPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatusData(null);

    try {
      const response = await checkApplicationStatus(email);
      setStatusData(response.data);
      toast.success('Status retrieved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to check status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        label: 'Pending Review'
      },
      under_review: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Search,
        label: 'Under Review'
      },
      info_requested: {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: AlertCircle,
        label: 'Information Requested'
      },
      approved: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
        label: 'Approved'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        label: 'Not Approved'
      },
      activated: {
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: CheckCircle2,
        label: 'Active'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border px-4 py-2 text-base`}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </Badge>
    );
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
              <Badge variant="secondary" className="ml-2">SaaS</Badge>
            </button>

            <Button variant="ghost" onClick={onBackToHome} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <Search className="h-3 w-3 mr-1" /> Application Status
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Check Your Application Status
          </h1>
          <p className="text-xl text-gray-600">
            Enter your email address to check the status of your application
          </p>
        </div>

        {/* Status Check Form */}
        <Card className="shadow-2xl border-2">
          <CardHeader>
            <CardTitle>Application Status Lookup</CardTitle>
            <CardDescription>
              We'll show you the current status of your application and estimated review time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckStatus} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Enter the email address you used when submitting your application
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Checking Status...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            </form>

            {/* Status Result */}
            {statusData && (
              <div className="mt-8 space-y-6 animate-in fade-in duration-500">
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Application Status</h3>
                    {getStatusBadge(statusData.status)}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Status Message</p>
                        <p className="text-sm text-blue-700 mt-1">{statusData.message}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          <p className="text-sm font-medium text-gray-700">Submitted</p>
                        </div>
                        <p className="text-sm text-gray-900">
                          {new Date(statusData.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      {statusData.estimatedReviewTime && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <p className="text-sm font-medium text-gray-700">Review Time</p>
                          </div>
                          <p className="text-sm text-gray-900">{statusData.estimatedReviewTime}</p>
                        </div>
                      )}
                    </div>

                    {/* Next Steps */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
                      {statusData.status === 'pending' && (
                        <p className="text-sm text-gray-700">
                          Our team is reviewing your application. You'll receive an email within 24-48 hours with an update.
                        </p>
                      )}
                      {statusData.status === 'under_review' && (
                        <p className="text-sm text-gray-700">
                          Your application is currently being reviewed by our team. We'll contact you soon with a decision.
                        </p>
                      )}
                      {statusData.status === 'info_requested' && (
                        <p className="text-sm text-gray-700">
                          We need additional information from you. Please check your email for details on what we need.
                        </p>
                      )}
                      {statusData.status === 'approved' && (
                        <p className="text-sm text-gray-700">
                          Congratulations! Your application has been approved. Check your email for instructions on how to activate your account.
                        </p>
                      )}
                      {statusData.status === 'activated' && (
                        <p className="text-sm text-gray-700">
                          Your account is active! You can now log in to your dashboard using the credentials sent to your email.
                        </p>
                      )}
                      {statusData.status === 'rejected' && (
                        <p className="text-sm text-gray-700">
                          Unfortunately, we couldn't approve your application at this time. You can reapply after 30 days.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Have questions about your application?
          </p>
          <Button variant="outline" className="border-2">
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
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

