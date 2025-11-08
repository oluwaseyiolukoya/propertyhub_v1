import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Building,
  ArrowLeft,
  Code,
  Lock,
  Key,
  Users,
  Home,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  Wrench,
  Bell,
  Shield,
  Copy,
  Check
} from 'lucide-react';

interface APIDocumentationProps {
  onBackToHome: () => void;
  onNavigateToStatus?: () => void;
}

export function APIDocumentation({ onBackToHome, onNavigateToStatus }: APIDocumentationProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const apiEndpoints = {
    authentication: [
      {
        method: 'POST',
        endpoint: '/api/auth/login',
        description: 'Authenticate user and get JWT token',
        auth: false,
        body: {
          email: 'user@example.com',
          password: 'password123',
          userType: 'admin | owner | manager | tenant'
        },
        response: {
          token: 'jwt_token_here',
          user: {
            id: 'user_id',
            email: 'user@example.com',
            name: 'User Name',
            role: 'owner',
            userType: 'owner',
            customerId: 'customer_id'
          }
        }
      },
      {
        method: 'POST',
        endpoint: '/api/auth/setup-password',
        description: 'Set up password for new user with token',
        auth: false,
        body: {
          token: 'setup_token',
          password: 'newpassword123'
        }
      },
      {
        method: 'GET',
        endpoint: '/api/auth/verify',
        description: 'Verify JWT token validity',
        auth: true,
        response: {
          valid: true,
          user: { id: 'user_id', email: 'user@example.com' }
        }
      },
      {
        method: 'GET',
        endpoint: '/api/auth/validate-session',
        description: 'Validate current session and check account status',
        auth: true,
        response: {
          valid: true
        }
      },
      {
        method: 'GET',
        endpoint: '/api/auth/account',
        description: 'Get current user account information',
        auth: true
      }
    ],
    properties: [
      {
        method: 'GET',
        endpoint: '/api/properties',
        description: 'Get all properties for authenticated user',
        auth: true,
        query: { page: '1', limit: '10' }
      },
      {
        method: 'GET',
        endpoint: '/api/properties/:id',
        description: 'Get single property by ID',
        auth: true
      },
      {
        method: 'POST',
        endpoint: '/api/properties',
        description: 'Create new property',
        auth: true,
        body: {
          name: 'Property Name',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          type: 'Residential',
          totalUnits: 10
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/properties/:id',
        description: 'Update property',
        auth: true
      },
      {
        method: 'DELETE',
        endpoint: '/api/properties/:id',
        description: 'Delete property',
        auth: true
      }
    ],
    units: [
      {
        method: 'GET',
        endpoint: '/api/units',
        description: 'Get all units',
        auth: true,
        query: { propertyId: 'property_id' }
      },
      {
        method: 'POST',
        endpoint: '/api/units',
        description: 'Create new unit',
        auth: true,
        body: {
          propertyId: 'property_id',
          unitNumber: '101',
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 850,
          rent: 1500
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/units/:id',
        description: 'Update unit',
        auth: true
      },
      {
        method: 'DELETE',
        endpoint: '/api/units/:id',
        description: 'Delete unit',
        auth: true
      }
    ],
    tenants: [
      {
        method: 'GET',
        endpoint: '/api/tenant/profile',
        description: 'Get tenant profile',
        auth: true
      },
      {
        method: 'GET',
        endpoint: '/api/tenant/lease',
        description: 'Get tenant lease information',
        auth: true
      },
      {
        method: 'GET',
        endpoint: '/api/tenant/payments',
        description: 'Get tenant payment history',
        auth: true
      },
      {
        method: 'POST',
        endpoint: '/api/tenant/payments',
        description: 'Make rent payment',
        auth: true,
        body: {
          amount: 1500,
          paymentMethod: 'card',
          reference: 'payment_ref'
        }
      }
    ],
    payments: [
      {
        method: 'GET',
        endpoint: '/api/payments',
        description: 'Get all payments',
        auth: true,
        query: { status: 'completed', page: '1' }
      },
      {
        method: 'POST',
        endpoint: '/api/payments/initialize',
        description: 'Initialize payment transaction',
        auth: true,
        body: {
          amount: 1500,
          email: 'tenant@example.com',
          metadata: { leaseId: 'lease_id' }
        }
      },
      {
        method: 'GET',
        endpoint: '/api/payments/verify/:reference',
        description: 'Verify payment transaction',
        auth: true
      }
    ],
    maintenance: [
      {
        method: 'GET',
        endpoint: '/api/maintenance',
        description: 'Get all maintenance tickets',
        auth: true,
        query: { status: 'open', priority: 'high' }
      },
      {
        method: 'POST',
        endpoint: '/api/maintenance',
        description: 'Create maintenance ticket',
        auth: true,
        body: {
          title: 'Leaking faucet',
          description: 'Kitchen faucet is leaking',
          priority: 'medium',
          unitId: 'unit_id'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/maintenance/:id',
        description: 'Update maintenance ticket',
        auth: true
      },
      {
        method: 'POST',
        endpoint: '/api/maintenance/:id/reply',
        description: 'Reply to maintenance ticket',
        auth: true,
        body: {
          message: 'We will fix this tomorrow'
        }
      }
    ],
    analytics: [
      {
        method: 'GET',
        endpoint: '/api/analytics/overview',
        description: 'Get analytics overview',
        auth: true,
        query: { range: '30d' }
      },
      {
        method: 'GET',
        endpoint: '/api/analytics/system-health',
        description: 'Get system health metrics',
        auth: true
      },
      {
        method: 'GET',
        endpoint: '/api/analytics/customers',
        description: 'Get customer analytics (Admin only)',
        auth: true,
        query: { range: '30d' }
      }
    ],
    users: [
      {
        method: 'GET',
        endpoint: '/api/users',
        description: 'Get all users (Admin only)',
        auth: true
      },
      {
        method: 'POST',
        endpoint: '/api/users',
        description: 'Create new user (Admin only)',
        auth: true,
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          sendInvite: true
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/users/:id',
        description: 'Update user',
        auth: true
      },
      {
        method: 'DELETE',
        endpoint: '/api/users/:id',
        description: 'Delete user',
        auth: true
      }
    ]
  };

  const renderEndpoint = (endpoint: any) => (
    <Card key={endpoint.endpoint} className="mb-4 border-2 hover:border-blue-200 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                className={`${
                  endpoint.method === 'GET' ? 'bg-green-600' :
                  endpoint.method === 'POST' ? 'bg-blue-600' :
                  endpoint.method === 'PUT' ? 'bg-orange-600' :
                  'bg-red-600'
                } text-white`}
              >
                {endpoint.method}
              </Badge>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded">
                {endpoint.endpoint}
              </code>
              {endpoint.auth && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  <Lock className="h-3 w-3 mr-1" /> Auth Required
                </Badge>
              )}
            </div>
            <CardDescription className="text-base">{endpoint.description}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(endpoint.endpoint, endpoint.endpoint)}
          >
            {copiedEndpoint === endpoint.endpoint ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {(endpoint.body || endpoint.query || endpoint.response) && (
        <CardContent className="space-y-4">
          {endpoint.query && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Query Parameters</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(endpoint.query, null, 2)}
              </pre>
            </div>
          )}
          {endpoint.body && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Request Body</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(endpoint.body, null, 2)}
              </pre>
            </div>
          )}
          {endpoint.response && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Response</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(endpoint.response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

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
              <Badge variant="secondary" className="ml-2">API Docs</Badge>
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
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <Code className="h-3 w-3 mr-1" /> RESTful API
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Contrezz API Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Complete reference for integrating with the Contrezz Property Management Platform
          </p>
          <div className="flex items-center justify-center gap-4">
            <Card className="inline-block">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Base URL</div>
                <code className="text-blue-600 font-mono">https://api.contrezz.com</code>
              </CardContent>
            </Card>
            <Card className="inline-block">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Version</div>
                <code className="text-blue-600 font-mono">v1</code>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="mb-8 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Key className="h-6 w-6 mr-2 text-blue-600" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Authentication</h3>
                <p className="text-gray-600 mb-4">
                  All API requests require authentication using JWT tokens. Include the token in the Authorization header:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`Authorization: Bearer YOUR_JWT_TOKEN`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Rate Limiting</h3>
                <p className="text-gray-600">
                  API requests are limited to 1000 requests per hour per user. Rate limit information is included in response headers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Response Format</h3>
                <p className="text-gray-600 mb-4">
                  All responses are returned in JSON format. Successful responses include a 2xx status code, while errors return appropriate 4xx or 5xx codes.
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`// Success Response
{
  "data": { ... },
  "message": "Success"
}

// Error Response
{
  "error": "Error message",
  "code": "ERROR_CODE"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">API Endpoints</h2>

          <Tabs defaultValue="authentication" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-8">
              <TabsTrigger value="authentication" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Auth</span>
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Properties</span>
              </TabsTrigger>
              <TabsTrigger value="units" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Units</span>
              </TabsTrigger>
              <TabsTrigger value="tenants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Tenants</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Maintenance</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authentication">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h3>
                {apiEndpoints.authentication.map(renderEndpoint)}
              </div>
            </TabsContent>

            <TabsContent value="properties">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Properties</h3>
                {apiEndpoints.properties.map(renderEndpoint)}
              </div>
            </TabsContent>

            <TabsContent value="units">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Units</h3>
                {apiEndpoints.units.map(renderEndpoint)}
              </div>
            </TabsContent>

            <TabsContent value="tenants">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tenants</h3>
                {apiEndpoints.tenants.map(renderEndpoint)}
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Payments</h3>
                {apiEndpoints.payments.map(renderEndpoint)}
              </div>
            </TabsContent>

            <TabsContent value="maintenance">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Maintenance</h3>
                {apiEndpoints.maintenance.map(renderEndpoint)}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h3>
                {apiEndpoints.analytics.map(renderEndpoint)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* SDKs & Libraries */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">SDKs & Libraries</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <CardTitle>JavaScript/TypeScript</CardTitle>
                <CardDescription>Official SDK for Node.js and browser</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
{`npm install @contrezz/sdk`}
                </pre>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <CardTitle>Python</CardTitle>
                <CardDescription>Official Python SDK</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
{`pip install contrezz`}
                </pre>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <CardTitle>PHP</CardTitle>
                <CardDescription>Official PHP SDK</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
{`composer require contrezz/sdk`}
                </pre>
              </CardContent>
            </Card>
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
                <span className="font-bold">Contrezz API</span>
              </div>
              <p className="text-gray-400">
                Build powerful property management integrations with our RESTful API.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                <li>
                  <button
                    onClick={onNavigateToStatus}
                    className="hover:text-white transition-colors text-left"
                  >
                    Status
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Developer Forum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Issues</a></li>
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

