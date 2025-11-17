import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PublicLayout } from "./PublicLayout";
import { toast } from "sonner";
import { submitLandingForm } from '../lib/api/landing-forms';
import {
  Building,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Linkedin,
  Twitter,
  Github,
  CheckCircle2,
  Zap,
  HelpCircle
} from 'lucide-react';

interface ContactPageProps {
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

export function ContactPage({
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
}: ContactPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    inquiryType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message || !formData.inquiryType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Message must be at least 10 characters
    if (formData.message.length < 10) {
      toast.error('Message must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare submission data - only include optional fields if they have values
      const submissionData: any = {
        formType: 'contact_us',
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        message: formData.message,
        source: 'contact_page',
        customFields: {
          inquiryType: formData.inquiryType
        }
      };

      // Only add optional fields if they have values
      if (formData.phone && formData.phone.trim()) {
        submissionData.phone = formData.phone;
      }
      if (formData.company && formData.company.trim()) {
        submissionData.company = formData.company;
      }
      if (formData.subject && formData.subject.trim()) {
        submissionData.subject = formData.subject;
      } else {
        // Use inquiry type as subject if no subject provided
        submissionData.subject = formData.inquiryType;
      }

      console.log('📤 Submitting contact form:', submissionData);

      // Submit to landing forms API
      const response = await submitLandingForm(submissionData);

      console.log('📥 API Response:', response);

      if (response.data?.success) {
        // Simple thank you message
        toast.success(
          <div>
            <p className="font-semibold">Thank you for contacting us!</p>
            <p className="text-sm mt-1">We've received your message and will get back to you shortly.</p>
          </div>,
          { duration: 5000 }
        );

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          subject: '',
          message: '',
          inquiryType: ''
        });
      } else {
        console.error('❌ Submission failed:', response.error);
        const errorMessage = (response.error as any)?.message || response.error?.error || 'Failed to send message. Please try again.';
        toast.error(errorMessage);

        // Log validation details if available
        if ((response.error as any)?.details) {
          console.error('Validation details:', (response.error as any).details);
        }
      }
    } catch (error: any) {
      console.error('❌ Contact form error:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Our team is here to help',
      value: 'hello@contrezz.com',
      link: 'mailto:hello@contrezz.com',
      color: 'blue'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Mon-Fri from 9am to 6pm EST',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
      color: 'green'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'Come say hello at our office',
      value: '123 Market St, San Francisco, CA 94103',
      link: 'https://maps.google.com',
      color: 'purple'
    }
  ];

  const faqs = [
    {
      question: 'How quickly will I receive a response?',
      answer: 'We typically respond to all inquiries within 24 hours during business days.'
    },
    {
      question: 'Do you offer phone support?',
      answer: 'Yes! Our phone support is available Monday-Friday, 9am-6pm EST.'
    },
    {
      question: 'Can I schedule a demo?',
      answer: 'Absolutely! You can schedule a personalized demo through our Schedule Demo page.'
    },
    {
      question: 'What information should I include in my message?',
      answer: 'Please include as much detail as possible about your inquiry, including your property portfolio size and specific needs.'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <PublicLayout
      currentPage="contact"
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 animate-bounce">
            <MessageSquare className="h-3 w-3 mr-1" /> Get in Touch
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            We'd Love to
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Hear From You</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Have questions about Contrezz? Want to learn more about our platform?
            Our team is here to help you succeed.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card
                  key={index}
                  className="group border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 cursor-pointer"
                  onClick={() => window.open(method.link, '_blank')}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`h-16 w-16 bg-gradient-to-br ${getColorClasses(method.color)} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-900 font-semibold">{method.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-2 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you as soon as possible</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization</Label>
                    <Input
                      id="company"
                      placeholder="Your company name"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inquiryType">Inquiry Type *</Label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={(value) => handleInputChange('inquiryType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales Inquiry</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="demo">Request Demo</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief subject of your inquiry"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message * (minimum 10 characters)</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      {formData.message.length} / 10 minimum characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="space-y-6">
              {/* Office Hours */}
              <Card className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Office Hours</CardTitle>
                      <CardDescription>When we're available</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-semibold">9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-semibold">10:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 inline text-green-500 mr-1" />
                      Email support available 24/7
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <HelpCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Quick Answers</CardTitle>
                      <CardDescription>Frequently asked questions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="space-y-1">
                      <h4 className="font-semibold text-sm text-gray-900">{faq.question}</h4>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <CardTitle>Connect With Us</CardTitle>
                  <CardDescription>Follow us on social media</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
                    >
                      <Linkedin className="h-6 w-6 text-white" />
                    </a>
                    <a
                      href="#"
                      className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
                    >
                      <Twitter className="h-6 w-6 text-white" />
                    </a>
                    <a
                      href="#"
                      className="h-12 w-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
                    >
                      <Github className="h-6 w-6 text-white" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Schedule a personalized demo to see Contrezz in action
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            onClick={onNavigateToScheduleDemo}
          >
            Schedule a Demo
          </Button>
        </div>
      </section>

    </PublicLayout>
  );
}

