import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Building,
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  Shield,
  Zap,
  Users,
  BookOpen,
  Tag
} from 'lucide-react';

interface BlogPageProps {
  onBackToHome: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToHelpCenter?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToStatus?: () => void;
  onNavigateToSecurity?: () => void;
}

export function BlogPage({ onBackToHome, onNavigateToCareers, onNavigateToHelpCenter, onNavigateToCommunity, onNavigateToStatus, onNavigateToSecurity }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Mock blog posts - will be replaced with backend data
  const blogPosts = [
    {
      id: 1,
      title: 'The Future of Property Management: AI and Automation',
      excerpt: 'Discover how artificial intelligence and automation are transforming the property management industry and what it means for your business.',
      author: 'Sarah Johnson',
      authorRole: 'CEO & Co-Founder',
      date: '2025-01-15',
      readTime: '8 min read',
      category: 'Technology',
      image: '🤖',
      featured: true,
      tags: ['AI', 'Automation', 'Future Trends']
    },
    {
      id: 2,
      title: '10 Ways to Improve Tenant Satisfaction',
      excerpt: 'Learn proven strategies to keep your tenants happy, reduce turnover, and build a strong reputation in the rental market.',
      author: 'Michael Chen',
      authorRole: 'CTO & Co-Founder',
      date: '2025-01-12',
      readTime: '6 min read',
      category: 'Best Practices',
      image: '😊',
      featured: true,
      tags: ['Tenant Relations', 'Customer Service', 'Retention']
    },
    {
      id: 3,
      title: 'Smart Access Control: A Complete Guide',
      excerpt: 'Everything you need to know about implementing smart access control systems in your properties for enhanced security and convenience.',
      author: 'Emily Rodriguez',
      authorRole: 'Head of Product',
      date: '2025-01-10',
      readTime: '10 min read',
      category: 'Technology',
      image: '🔐',
      featured: true,
      tags: ['Access Control', 'Security', 'Smart Home']
    },
    {
      id: 4,
      title: 'Maximizing ROI: Financial Tips for Property Owners',
      excerpt: 'Expert advice on optimizing your property portfolio for maximum returns while minimizing costs and risks.',
      author: 'David Okonkwo',
      authorRole: 'Head of Engineering',
      date: '2025-01-08',
      readTime: '7 min read',
      category: 'Finance',
      image: '💰',
      featured: false,
      tags: ['ROI', 'Finance', 'Investment']
    },
    {
      id: 5,
      title: 'The Ultimate Property Maintenance Checklist',
      excerpt: 'Stay on top of property maintenance with our comprehensive checklist covering seasonal tasks, preventive care, and emergency protocols.',
      author: 'Sarah Johnson',
      authorRole: 'CEO & Co-Founder',
      date: '2025-01-05',
      readTime: '5 min read',
      category: 'Best Practices',
      image: '🔧',
      featured: false,
      tags: ['Maintenance', 'Checklist', 'Property Care']
    },
    {
      id: 6,
      title: 'Legal Compliance: What Every Property Manager Should Know',
      excerpt: 'Navigate the complex landscape of property management regulations, fair housing laws, and tenant rights with confidence.',
      author: 'Michael Chen',
      authorRole: 'CTO & Co-Founder',
      date: '2025-01-03',
      readTime: '9 min read',
      category: 'Legal',
      image: '⚖️',
      featured: false,
      tags: ['Legal', 'Compliance', 'Regulations']
    },
    {
      id: 7,
      title: 'Building a Sustainable Property Portfolio',
      excerpt: 'Learn how to incorporate eco-friendly practices and green technologies into your properties for long-term sustainability.',
      author: 'Emily Rodriguez',
      authorRole: 'Head of Product',
      date: '2024-12-28',
      readTime: '6 min read',
      category: 'Sustainability',
      image: '🌱',
      featured: false,
      tags: ['Sustainability', 'Green Tech', 'Environment']
    },
    {
      id: 8,
      title: 'Effective Marketing Strategies for Rental Properties',
      excerpt: 'Attract quality tenants faster with these proven marketing techniques and digital strategies for the modern rental market.',
      author: 'David Okonkwo',
      authorRole: 'Head of Engineering',
      date: '2024-12-25',
      readTime: '7 min read',
      category: 'Marketing',
      image: '📢',
      featured: false,
      tags: ['Marketing', 'Advertising', 'Tenant Acquisition']
    },
    {
      id: 9,
      title: 'Remote Property Management: Tools and Best Practices',
      excerpt: 'Manage your properties from anywhere with the right tools, processes, and communication strategies for remote success.',
      author: 'Sarah Johnson',
      authorRole: 'CEO & Co-Founder',
      date: '2024-12-22',
      readTime: '8 min read',
      category: 'Technology',
      image: '🌐',
      featured: false,
      tags: ['Remote Work', 'Tools', 'Digital']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Posts', icon: BookOpen, count: blogPosts.length },
    { id: 'Technology', name: 'Technology', icon: Zap, count: blogPosts.filter(p => p.category === 'Technology').length },
    { id: 'Best Practices', name: 'Best Practices', icon: Lightbulb, count: blogPosts.filter(p => p.category === 'Best Practices').length },
    { id: 'Finance', name: 'Finance', icon: TrendingUp, count: blogPosts.filter(p => p.category === 'Finance').length },
    { id: 'Legal', name: 'Legal', icon: Shield, count: blogPosts.filter(p => p.category === 'Legal').length },
    { id: 'Sustainability', name: 'Sustainability', icon: Users, count: blogPosts.filter(p => p.category === 'Sustainability').length },
    { id: 'Marketing', name: 'Marketing', icon: TrendingUp, count: blogPosts.filter(p => p.category === 'Marketing').length }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-700 border-blue-200',
      'Best Practices': 'bg-green-100 text-green-700 border-green-200',
      'Finance': 'bg-purple-100 text-purple-700 border-purple-200',
      'Legal': 'bg-orange-100 text-orange-700 border-orange-200',
      'Sustainability': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Marketing': 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
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
              <Badge variant="secondary" className="ml-2">Blog</Badge>
            </button>

            <Button variant="ghost" onClick={onBackToHome}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 animate-bounce">
            <BookOpen className="h-3 w-3 mr-1" /> Insights & Resources
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Property Management
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Insights</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            Expert advice, industry trends, and practical tips to help you succeed in property management.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles, topics, or tags..."
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

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                Editor's Pick
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="group border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 cursor-pointer overflow-hidden"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl">
                    {post.image}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${getCategoryColor(post.category)} border`}>
                        {post.category}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-base">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{post.author}</p>
                          <p className="text-xs text-gray-500">{post.authorRole}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full mt-4 group-hover:bg-blue-50 transition-colors"
                    >
                      Read More <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      {regularPosts.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <Card
                  key={post.id}
                  className="group border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${getCategoryColor(post.category)} border`}>
                        {post.category}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{post.author}</p>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full mt-4 group-hover:bg-blue-50 transition-colors"
                    >
                      Read Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Results */}
      {filteredPosts.length === 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
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
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Stay Updated with Our Newsletter
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get the latest property management insights, tips, and updates delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-white/90 border-0 text-lg py-6"
            />
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              Subscribe
            </Button>
          </div>
          <p className="text-sm text-blue-100 mt-4">
            Join 5,000+ property professionals. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-6 w-6" />
                <span className="font-bold">Contrezz</span>
              </div>
              <p className="text-gray-400">
                The complete property management SaaS platform for modern property professionals.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li>
                  <button
                    onClick={onBackToHome}
                    className="hover:text-white transition-colors text-left"
                  >
                    Blog
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToCareers}
                    className="hover:text-white transition-colors text-left"
                  >
                    Careers
                  </button>
                </li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button onClick={onNavigateToHelpCenter} className="hover:text-white transition-colors text-left">
                    Help Center
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateToCommunity} className="hover:text-white transition-colors text-left">
                    Community
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateToStatus} className="hover:text-white transition-colors text-left">
                    Status
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateToSecurity} className="hover:text-white transition-colors text-left">
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

