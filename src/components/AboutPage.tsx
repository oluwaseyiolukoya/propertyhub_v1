import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Building,
  ArrowLeft,
  Target,
  Heart,
  Users,
  Zap,
  Globe,
  TrendingUp,
  Shield,
  Award,
  Lightbulb,
  CheckCircle,
  Mail,
  Linkedin,
  Twitter,
  Github,
  MapPin,
  Phone,
  Calendar
} from 'lucide-react';

interface AboutPageProps {
  onBackToHome: () => void;
  onNavigateToContact?: () => void;
  onNavigateToScheduleDemo?: () => void;
  onNavigateToCareers?: () => void;
}

export function AboutPage({ onBackToHome, onNavigateToContact, onNavigateToScheduleDemo, onNavigateToCareers }: AboutPageProps) {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const stats = [
    { value: '2024', label: 'Founded', icon: Calendar },
    { value: '500+', label: 'Properties Managed', icon: Building },
    { value: '10k+', label: 'Happy Tenants', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: TrendingUp }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do, ensuring their success is our success.',
      color: 'red'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We continuously innovate to provide cutting-edge solutions that simplify property management.',
      color: 'yellow'
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'We maintain the highest standards of security and data protection to earn and keep your trust.',
      color: 'blue'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'We believe in the power of teamwork and building strong relationships with our community.',
      color: 'purple'
    },
    {
      icon: TrendingUp,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our platform, from design to customer support.',
      color: 'green'
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'We make property management accessible to everyone, regardless of portfolio size or location.',
      color: 'indigo'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Co-Founder',
      bio: '15+ years in PropTech and real estate management',
      image: 'SJ',
      color: 'blue'
    },
    {
      name: 'Michael Chen',
      role: 'CTO & Co-Founder',
      bio: 'Former tech lead at major SaaS companies',
      image: 'MC',
      color: 'purple'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      bio: 'Product strategist with passion for user experience',
      image: 'ER',
      color: 'green'
    },
    {
      name: 'David Okonkwo',
      role: 'Head of Engineering',
      bio: 'Full-stack architect and cloud infrastructure expert',
      image: 'DO',
      color: 'orange'
    }
  ];

  const milestones = [
    {
      year: '2024',
      title: 'Company Founded',
      description: 'Contrezz was born from a vision to revolutionize property management'
    },
    {
      year: '2024 Q2',
      title: 'Beta Launch',
      description: 'Launched beta program with 50 early adopters'
    },
    {
      year: '2024 Q3',
      title: 'Official Launch',
      description: 'Public launch with core features and Paystack integration'
    },
    {
      year: '2024 Q4',
      title: 'Rapid Growth',
      description: 'Reached 500+ properties and 10,000+ tenants on the platform'
    },
    {
      year: '2025',
      title: 'Expansion',
      description: 'Expanding to new markets and launching advanced features'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      yellow: 'from-yellow-500 to-yellow-600',
      indigo: 'from-indigo-500 to-indigo-600'
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
              <Badge variant="secondary" className="ml-2">About Us</Badge>
            </button>

            <Button variant="ghost" onClick={onBackToHome}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 animate-bounce">
            <Building className="h-3 w-3 mr-1" /> Our Story
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transforming Property Management
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> for Everyone</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            We're on a mission to make property management simple, efficient, and accessible.
            Contrezz empowers property owners, managers, and tenants with modern tools that streamline operations and enhance experiences.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                <Target className="h-3 w-3 mr-1" /> Our Mission
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Simplifying Property Management Through Technology
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                At Contrezz, we believe property management shouldn't be complicated. Our platform brings together
                everything you need in one place - from tenant management and rent collection to maintenance tracking
                and financial reporting.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                We're building more than just software; we're creating a community of property professionals who
                can focus on what matters most - providing excellent service and growing their business.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Automate repetitive tasks and save time</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Improve communication between all stakeholders</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Make data-driven decisions with powerful analytics</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl transform rotate-3"></div>
              <Card className="relative border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Fast & Efficient</h3>
                        <p className="text-sm text-gray-600">Streamlined workflows</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Secure & Reliable</h3>
                        <p className="text-sm text-gray-600">Enterprise-grade security</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">User-Friendly</h3>
                        <p className="text-sm text-gray-600">Intuitive interface</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Heart className="h-3 w-3 mr-1" /> Our Values
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What We Stand For
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our values guide everything we do, from product development to customer support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="group border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2"
                >
                  <CardHeader>
                    <div className={`h-14 w-14 bg-gradient-to-br ${getColorClasses(value.color)} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Calendar className="h-3 w-3 mr-1" /> Our Journey
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Milestones & Achievements
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-purple-600"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative pl-20">
                  <div className="absolute left-0 top-0 h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">{milestone.year}</span>
                  </div>
                  <Card className="border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl">{milestone.title}</CardTitle>
                      <CardDescription className="text-base">{milestone.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Users className="h-3 w-3 mr-1" /> Our Team
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Meet the People Behind Contrezz
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A passionate team dedicated to revolutionizing property management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2">
                <CardContent className="pt-8">
                  <div className="flex justify-center mb-4">
                    <div className={`h-24 w-24 bg-gradient-to-br ${getColorClasses(member.color)} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                      {member.image}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Want to Learn More?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get in touch with our team to discuss how Contrezz can help transform your property management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
              onClick={onNavigateToContact}
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-white/10 text-white border-2 border-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200"
              onClick={onNavigateToScheduleDemo}
            >
              <Building className="mr-2 h-5 w-5" />
              Schedule Demo
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-6 text-white/90">
            <a href="#" className="hover:text-white transition-colors">
              <Linkedin className="h-6 w-6" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Github className="h-6 w-6" />
            </a>
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
                <span className="font-bold">Contrezz</span>
              </div>
              <p className="text-gray-400 mb-4">
                Transforming property management for everyone.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  San Francisco, CA
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  hello@contrezz.com
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  +1 (555) 123-4567
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li>
                  <button
                    onClick={onNavigateToCareers}
                    className="hover:text-white transition-colors text-left"
                  >
                    Careers
                  </button>
                </li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
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

