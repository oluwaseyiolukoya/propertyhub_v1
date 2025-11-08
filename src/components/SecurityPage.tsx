import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { PublicLayout } from "./PublicLayout";
import {
  Shield,
  Lock,
  Key,
  Eye,
  Server,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Users,
  Database,
  Cloud,
  Zap,
  Award,
  ExternalLink,
  Download
} from 'lucide-react';

interface SecurityPageProps {
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

export function SecurityPage({
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
}: SecurityPageProps) {

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption',
      color: 'blue'
    },
    {
      icon: Key,
      title: 'Two-Factor Authentication',
      description: 'Optional 2FA using TOTP authenticator apps for enhanced account security',
      color: 'purple'
    },
    {
      icon: Eye,
      title: 'Role-Based Access Control',
      description: 'Granular permissions system ensuring users only access what they need',
      color: 'green'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Hosted on AWS with automatic security patches and DDoS protection',
      color: 'orange'
    },
    {
      icon: Database,
      title: 'Data Backup & Recovery',
      description: 'Automated daily backups with 30-day retention and point-in-time recovery',
      color: 'red'
    },
    {
      icon: Users,
      title: 'Audit Logging',
      description: 'Comprehensive activity logs for compliance and security monitoring',
      color: 'indigo'
    }
  ];

  const certifications = [
    {
      name: 'SOC 2 Type II',
      status: 'In Progress',
      description: 'Security, availability, and confidentiality controls',
      icon: Award
    },
    {
      name: 'GDPR Compliant',
      status: 'Certified',
      description: 'European data protection regulation compliance',
      icon: CheckCircle2
    },
    {
      name: 'ISO 27001',
      status: 'Planned',
      description: 'Information security management system',
      icon: Shield
    },
    {
      name: 'PCI DSS',
      status: 'Certified',
      description: 'Payment card industry data security standard',
      icon: Lock
    }
  ];

  const securityPractices = [
    {
      title: 'Regular Security Audits',
      description: 'Third-party penetration testing and vulnerability assessments conducted quarterly'
    },
    {
      title: 'Secure Development Lifecycle',
      description: 'Security reviews integrated into every stage of development, from design to deployment'
    },
    {
      title: 'Employee Training',
      description: 'Mandatory security awareness training for all team members annually'
    },
    {
      title: 'Incident Response Plan',
      description: '24/7 security monitoring with documented incident response procedures'
    },
    {
      title: 'Data Minimization',
      description: 'We only collect and retain data necessary for service operation'
    },
    {
      title: 'Vendor Security Assessment',
      description: 'All third-party vendors undergo security review before integration'
    }
  ];

  const dataProtection = [
    {
      title: 'Data Encryption',
      items: [
        'TLS 1.3 for data in transit',
        'AES-256 encryption for data at rest',
        'Encrypted database backups',
        'Secure key management with AWS KMS'
      ]
    },
    {
      title: 'Access Controls',
      items: [
        'Multi-factor authentication',
        'IP whitelisting for admin access',
        'Session timeout after inactivity',
        'Password complexity requirements'
      ]
    },
    {
      title: 'Data Privacy',
      items: [
        'GDPR and CCPA compliance',
        'Data processing agreements available',
        'Right to data portability',
        'Right to be forgotten'
      ]
    },
    {
      title: 'Infrastructure Security',
      items: [
        'AWS cloud infrastructure',
        'DDoS protection',
        'Web application firewall',
        'Intrusion detection systems'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <PublicLayout
      currentPage="security"
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 animate-bounce">
            <Shield className="h-3 w-3 mr-1" /> Enterprise-Grade Security
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your Data is
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Safe with Us</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            We employ industry-leading security practices to protect your property data and ensure compliance with global standards
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge variant="outline" className="text-base px-4 py-2 border-2">
              <Lock className="h-4 w-4 mr-2" /> 256-bit Encryption
            </Badge>
            <Badge variant="outline" className="text-base px-4 py-2 border-2">
              <Shield className="h-4 w-4 mr-2" /> SOC 2 Compliant
            </Badge>
            <Badge variant="outline" className="text-base px-4 py-2 border-2">
              <CheckCircle2 className="h-4 w-4 mr-2" /> GDPR Ready
            </Badge>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Security Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Multiple layers of security to protect your data at every level
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <div className={`h-14 w-14 bg-gradient-to-br ${getColorClasses(feature.color)} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meeting the highest industry standards for security and compliance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => {
              const Icon = cert.icon;
              const statusColor = cert.status === 'Certified' ? 'green' : cert.status === 'In Progress' ? 'blue' : 'gray';
              return (
                <Card key={index} className="border-2 text-center hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-lg mb-2">{cert.name}</CardTitle>
                    <Badge className={`bg-${statusColor}-500 text-white`}>
                      {cert.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{cert.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Data Protection
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive measures to keep your property data secure
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {dataProtection.map((section, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Security Practices
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our commitment to maintaining the highest security standards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityPractices.map((practice, index) => (
              <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    {practice.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{practice.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-orange-900 mb-2">
                    Responsible Disclosure Program
                  </CardTitle>
                  <CardDescription className="text-orange-700 text-base">
                    Found a security vulnerability? We appreciate responsible disclosure and will work with you to resolve any issues quickly.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-2">How to Report</h4>
                  <p className="text-gray-700 mb-3">
                    Email security@contrezz.com with details of the vulnerability. Please include:
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600 ml-4">
                    <li>• Description of the vulnerability</li>
                    <li>• Steps to reproduce</li>
                    <li>• Potential impact</li>
                    <li>• Your contact information</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Report Vulnerability
                  </Button>
                  <Button variant="outline" className="border-2">
                    <FileText className="h-4 w-4 mr-2" />
                    Security Policy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Security Resources
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Documentation and resources to help you secure your account
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle>Security Whitepaper</CardTitle>
                <CardDescription>Detailed overview of our security architecture</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Key className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle>Security Best Practices</CardTitle>
                <CardDescription>Guide to securing your Contrezz account</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle>Compliance Documents</CardTitle>
                <CardDescription>Certifications and audit reports</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Documents
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] animate-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Questions About Security?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Our security team is here to answer any questions about how we protect your data
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100"
            onClick={onNavigateToContact}
          >
            Contact Security Team
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
