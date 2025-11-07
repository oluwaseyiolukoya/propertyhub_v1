import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { 
  Building, 
  Users, 
  Smartphone, 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Building2,
  Key,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PasswordSetup } from './PasswordSetup';
import { Footer } from './Footer';
import { login, setupPassword } from '../lib/api';

interface LoginPageProps {
  onLogin: (userType: string, userData: any) => void;
  onBackToHome: () => void;
}

export function LoginPage({ onLogin, onBackToHome }: LoginPageProps) {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    userType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [error, setError] = useState<string>('');

  // Check for invitation parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationToken = urlParams.get('invitation');
    const email = urlParams.get('email');
    
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
      // Map frontend user types to backend user types
      const userTypeMapping: Record<string, string> = {
        'property-owner': 'owner',
        'property-manager': 'manager',
        'tenant': 'tenant',
        'super-admin': 'admin',
      };

      const backendUserType = userTypeMapping[loginForm.userType] || loginForm.userType;

      const response = await login({
        email: loginForm.email,
        password: loginForm.password,
        userType: backendUserType,
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
        // Use userType returned by backend (derived from role/customerId)
        const resolvedUserType = response.data.user.userType || backendUserType;
        
        console.log('📡 LoginPage - Backend Response:');
        console.log('   - backendUserType:', backendUserType);
        console.log('   - response.data.user.userType:', response.data.user.userType);
        console.log('   - resolvedUserType:', resolvedUserType);
        console.log('   - user.role:', response.data.user.role);
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
        password: '',
        userType: 'property-owner',
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

  const userTypes = [
    { 
      value: 'property-owner', 
      label: 'Property Owner', 
      icon: Building, 
      description: 'Manage your property portfolio',
      color: 'bg-blue-500',
      features: ['Property Management', 'Financial Reports', 'Tenant Overview']
    },
    { 
      value: 'property-manager', 
      label: 'Property Manager', 
      icon: Users, 
      description: 'Oversee day-to-day operations',
      color: 'bg-green-500',
      features: ['Daily Operations', 'Maintenance', 'Tenant Support']
    },
    { 
      value: 'tenant', 
      label: 'Tenant', 
      icon: Smartphone, 
      description: 'Access your rental dashboard',
      color: 'bg-purple-500',
      features: ['Pay Rent', 'Request Maintenance', 'Access Keys']
    },
    { 
      value: 'super-admin', 
      label: 'Super Admin', 
      icon: Shield, 
      description: 'Platform administration',
      color: 'bg-red-500',
      features: ['User Management', 'System Analytics', 'Full Access']
    }
  ];

  const selectedUserType = userTypes.find(type => type.value === loginForm.userType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Contrezz</h1>
              <Badge variant="secondary" className="ml-2">SaaS</Badge>
            </div>
            
            <Button variant="ghost" onClick={onBackToHome} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Information */}
            <div className="hidden lg:block">
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome Back to
                    <span className="text-blue-600"> Contrezz</span>
                  </h1>
                  <p className="text-xl text-gray-600">
                    Sign in to access your personalized dashboard and manage your properties efficiently.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Comprehensive Management</h3>
                      <p className="text-gray-600">Track all your properties and units in one centralized platform</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Automated Payments</h3>
                      <p className="text-gray-600">Streamlined rent collection with Stripe integration</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Key className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Smart Access Control</h3>
                      <p className="text-gray-600">Keycard management with payment automation</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8 pt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">500+</div>
                    <div className="text-gray-600">Properties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">10k+</div>
                    <div className="text-gray-600">Tenants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">99.9%</div>
                    <div className="text-gray-600">Uptime</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Login Form */}
            <div>
              <Card className="shadow-2xl border-0">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Sign In to Your Dashboard</CardTitle>
                  <CardDescription>
                    Select your role and enter your credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="role-info">Role Information</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-6">
                        {/* User Type Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="userType">Select Your Role</Label>
                          <Select 
                            value={loginForm.userType} 
                            onValueChange={(value) => setLoginForm(prev => ({ ...prev, userType: value }))}
                          >
                            <SelectTrigger id="userType" className="h-12">
                              <SelectValue placeholder="Choose your role..." />
                            </SelectTrigger>
                            <SelectContent>
                              {userTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center space-x-3 py-1">
                                    <div className={`h-8 w-8 ${type.color} rounded-lg flex items-center justify-center`}>
                                      <type.icon className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-xs text-gray-500">{type.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Show selected role details */}
                        {selectedUserType && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex items-start space-x-3">
                              <div className={`h-10 w-10 ${selectedUserType.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <selectedUserType.icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{selectedUserType.label}</h4>
                                <p className="text-sm text-gray-600 mb-2">{selectedUserType.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedUserType.features.map((feature, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <Separator />

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
                          disabled={isLoading || !loginForm.userType || !loginForm.email || !loginForm.password}
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

                        {/* Demo Credentials Info */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p>• Email: demo@example.com</p>
                            <p>• Password: demo123</p>
                            <p className="text-gray-500 mt-2">Select a role above and use these credentials to explore the platform.</p>
                          </div>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="role-info">
                      <div className="space-y-4">
                        {userTypes.map((type) => (
                          <div key={type.value} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                            <div className="flex items-start space-x-3">
                              <div className={`h-10 w-10 ${type.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <type.icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{type.label}</h4>
                                <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {type.features.map((feature, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <p className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={onBackToHome}>
                  Contact sales
                </Button>
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

