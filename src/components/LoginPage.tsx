import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PasswordSetup } from './PasswordSetup';
import { Footer } from './Footer';
import { PlatformLogo } from './PlatformLogo';
import { login, setupPassword } from '../lib/api';

interface LoginPageProps {
  onLogin: (userType: string, userData: any) => void;
  onBackToHome: () => void;
  onNavigateToScheduleDemo?: () => void;
}

export function LoginPage({ onLogin, onBackToHome, onNavigateToScheduleDemo }: LoginPageProps) {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCustomLogo, setHasCustomLogo] = useState(false);

  // Check for invitation parameters and messages on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationToken = urlParams.get('invitation');
    const email = urlParams.get('email');
    const message = urlParams.get('message');

    // Handle account cancellation message
    if (message === 'account_cancelled') {
      toast.error('Your subscription has been cancelled and your account has been deactivated.', {
        duration: 5000,
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (invitationToken && email) {
      // Mock customer data lookup based on invitation token
      const mockCustomerData = {
        name: 'John Smith',
        email: decodeURIComponent(email),
        company: 'Metro Properties LLC',
        plan: 'Professional',
        token: invitationToken
      };

      setInvitationData(mockCustomerData);
      setShowPasswordSetup(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // No need to send userType - backend will automatically detect from database
      const response = await login({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (response.error) {
        const code = response.error.statusCode;
        let message = response.error.error || 'Login failed';
        if (code === 401) {
          message = 'Invalid email or password.';
        } else if (code === 403) {
          message = 'Your account has been deactivated. Please contact your administrator.';
        } else if (code === 400) {
          message = 'Please select your role and fill all fields.';
        } else if (code && code >= 500) {
          message = 'Server error. Please try again shortly.';
        }
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      if (response.data) {
        toast.success('Login successful!');
        // Backend auto-detects userType from database - no need for frontend mapping
        const resolvedUserType = response.data.user.userType || 'owner';

        console.log('📡 LoginPage - Backend Response (Auto-detected):');
        console.log('   - Auto-detected userType:', response.data.user.userType);
        console.log('   - User role from DB:', response.data.user.role);
        console.log('   - Resolved userType:', resolvedUserType);
        console.log('   - Calling onLogin with:', { type: resolvedUserType, user: response.data.user });

        onLogin(resolvedUserType, response.data.user);
      }
    } catch (err: any) {
      const errorMessage = err?.message === 'Failed to connect to the server'
        ? 'Network error. Please check your connection and try again.'
        : (err?.message || 'An unexpected error occurred');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (newPassword: string) => {
    try {
      const response = await setupPassword({
        email: invitationData?.email,
        password: newPassword,
        token: invitationData?.token,
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to setup password');
        return;
      }

      toast.success('Password setup successful! Please login.');

      // Clear invitation from URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Reset to login form
      setShowPasswordSetup(false);
      setInvitationData(null);
      setLoginForm({
        email: invitationData?.email || '',
        password: ''
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to setup password');
    }
  };

  // Show password setup if invitation is detected
  if (showPasswordSetup && invitationData) {
    return (
      <PasswordSetup
        customerData={invitationData}
        onPasswordSet={handlePasswordSetup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={onBackToHome}
              className="hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center space-x-2">
                <PlatformLogo
                  iconClassName={hasCustomLogo ? "h-10 w-auto max-w-[200px] object-contain" : "h-8 w-8 text-blue-600"}
                  textClassName="text-xl font-bold text-gray-900"
                  showText={!hasCustomLogo}
                  onLogoLoad={(hasLogo) => setHasCustomLogo(hasLogo)}
                />
                <Badge variant="secondary">SaaS</Badge>
              </div>
            </button>

            <Button variant="ghost" onClick={onBackToHome} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Centered Login Form */}
          <div>
              <Card className="shadow-2xl border-0">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Sign In to Your Dashboard</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleLogin} className="space-y-6">

                        {/* Error Message */}
                        {error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">Login Failed</p>
                              <p className="text-sm text-red-600">{error}</p>
                            </div>
                          </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={loginForm.email}
                              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                              className="pl-10 h-12"
                              required
                            />
                          </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Button
                              type="button"
                              variant="link"
                              className="p-0 h-auto text-sm"
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={loginForm.password}
                              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                              className="pl-10 pr-10 h-12"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          className="w-full h-12"
                          disabled={isLoading || !loginForm.email || !loginForm.password}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Signing in...
                            </>
                          ) : (
                            'Sign In'
                          )}
                        </Button>

                        {/* Demo credentials removed per request */}
                  </form>
                </CardContent>
              </Card>

            {/* Additional Info */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Don't have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={onNavigateToScheduleDemo || onBackToHome}>
                Contact sales
              </Button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

