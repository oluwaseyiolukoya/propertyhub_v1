import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  BookOpen,
  Palette,
  Code,
  FileText,
  Search,
  ExternalLink,
  Book,
  Layers,
  Settings,
  Shield
} from 'lucide-react';
import { BrandGuidelines } from './BrandGuidelines';

export const Documentation = () => {
  const [selectedDoc, setSelectedDoc] = useState<string>('brand-guidelines');
  const [searchQuery, setSearchQuery] = useState('');

  const documentationSections = [
    {
      id: 'brand-guidelines',
      title: 'Brand Guidelines',
      description: 'Logo, colors, typography, and brand identity',
      icon: Palette,
      category: 'Design',
      badge: 'v1.0.0',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      id: 'api-docs',
      title: 'API Documentation',
      description: 'REST API endpoints and integration guides',
      icon: Code,
      category: 'Development',
      badge: 'Coming Soon',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'user-guides',
      title: 'User Guides',
      description: 'Step-by-step guides for owners, managers, and tenants',
      icon: Book,
      category: 'Support',
      badge: 'Coming Soon',
      badgeColor: 'bg-green-100 text-green-700 border-green-200'
    },
    {
      id: 'admin-manual',
      title: 'Admin Manual',
      description: 'Platform administration and configuration guides',
      icon: Shield,
      category: 'Admin',
      badge: 'Coming Soon',
      badgeColor: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    {
      id: 'deployment',
      title: 'Deployment Guide',
      description: 'Infrastructure setup and deployment procedures',
      icon: Settings,
      category: 'DevOps',
      badge: 'Coming Soon',
      badgeColor: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      description: 'Technical architecture and design patterns',
      icon: Layers,
      category: 'Development',
      badge: 'Coming Soon',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
  ];

  const filteredDocs = documentationSections.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDocContent = () => {
    switch (selectedDoc) {
      case 'brand-guidelines':
        return <BrandGuidelines />;
      case 'api-docs':
        return (
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                API documentation will be available here soon. It will include REST API endpoints,
                authentication guides, and integration examples.
              </p>
            </CardContent>
          </Card>
        );
      case 'user-guides':
        return (
          <Card>
            <CardHeader>
              <CardTitle>User Guides</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comprehensive user guides for property owners, managers, and tenants will be available here.
              </p>
            </CardContent>
          </Card>
        );
      case 'admin-manual':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Admin Manual</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Platform administration guides including user management, billing, and system configuration.
              </p>
            </CardContent>
          </Card>
        );
      case 'deployment':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Deployment Guide</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Infrastructure setup, deployment procedures, and environment configuration guides.
              </p>
            </CardContent>
          </Card>
        );
      case 'architecture':
        return (
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Technical architecture documentation, design patterns, and system overview.
              </p>
            </CardContent>
          </Card>
        );
      default:
        return <BrandGuidelines />;
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive guides, brand assets, and technical documentation for the Contrezz platform.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Documentation List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {filteredDocs.map((doc) => {
                    const Icon = doc.icon;
                    const isActive = selectedDoc === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-2 ${
                          isActive
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-medium text-sm ${isActive ? 'text-purple-900' : 'text-gray-900'}`}>
                                {doc.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {doc.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={`text-xs ${doc.badgeColor}`}>
                                {doc.badge}
                              </Badge>
                              <span className="text-xs text-gray-400">{doc.category}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <a href="https://www.figma.com/make/Lojl0yoSABvelIXfxKKPHd/Brand-Guideline-Design" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Figma Design Files
                  </a>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <a href="https://github.com/oluwaseyiolukoya/propertyhub_v1" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    GitHub Repository
                  </a>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Release Notes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderDocContent()}
          </div>
        </div>
      </div>
    </div>
  );
};


