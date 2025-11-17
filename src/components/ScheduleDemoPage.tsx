import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Calendar, Clock, Building2, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { submitLandingForm } from '../lib/api/landing-forms';
import { toast } from 'sonner';

interface ScheduleDemoPageProps {
  onBackToHome: () => void;
}

export const ScheduleDemoPage: React.FC<ScheduleDemoPageProps> = ({ onBackToHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    preferredDate: '',
    preferredTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.message.length < 10) {
      toast.error('Message must be at least 10 characters long');
      return;
    }

    if (!formData.preferredDate) {
      toast.error('Please select your preferred demo date');
      return;
    }

    if (!formData.preferredTime) {
      toast.error('Please select your preferred demo time');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare submission data
      const submissionData: any = {
        formType: 'schedule_demo',
        name: formData.name,
        email: formData.email,
        message: formData.message,
        preferredDate: new Date(formData.preferredDate).toISOString(),
        preferredTime: formData.preferredTime,
        timezone: formData.timezone,
      };

      // Only include optional fields if they have values
      if (formData.phone) submissionData.phone = formData.phone;
      if (formData.company) submissionData.company = formData.company;
      if (formData.jobTitle) submissionData.jobTitle = formData.jobTitle;

      console.log('📥 Submitting demo request:', submissionData);

      const response = await submitLandingForm(submissionData);

      console.log('📦 API Response:', response);

      // Check if response has error
      if (response.error) {
        throw new Error(response.error.message || response.error.error || 'Submission failed');
      }

      // Success - response.data contains the backend response
      toast.success(
        <div>
          <p className="font-semibold">Demo Scheduled Successfully!</p>
          <p className="text-sm mt-1">We'll contact you shortly to confirm your demo session.</p>
        </div>,
        { duration: 5000 }
      );

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        preferredDate: '',
        preferredTime: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        message: '',
      });
    } catch (error: any) {
      console.error('❌ Submission failed:', error);

      // Show detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule demo. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time slots (9 AM to 5 PM)
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM'
  ];

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contrezz</h1>
                <p className="text-sm text-gray-600">Property Management Platform</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onBackToHome}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Schedule a Demo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See Contrezz in action! Book a personalized demo with our team to discover how we can transform your property management.
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Book Your Demo Session</CardTitle>
            <CardDescription className="text-purple-100">
              Fill out the form below and we'll get back to you within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      type="text"
                      placeholder="Property Manager, CEO, etc."
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Preferences */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Schedule Preferences
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      min={today}
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferredTime">Preferred Time *</Label>
                    <Select
                      value={formData.preferredTime}
                      onValueChange={(value) => handleInputChange('preferredTime', value)}
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      type="text"
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="mt-1"
                      placeholder="Auto-detected"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Timezone automatically detected from your browser
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                  Tell Us About Your Needs
                </h3>

                <div>
                  <Label htmlFor="message">What would you like to see in the demo? * (minimum 10 characters)</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your property management needs, specific features you're interested in, or any questions you have..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length} / 10 minimum characters
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Scheduling Demo...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 mr-2" />
                      Schedule My Demo
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm text-gray-600 text-center">
                By scheduling a demo, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Need immediate assistance?{' '}
            <a href="tel:+2349168407781" className="text-purple-600 hover:text-purple-700 font-medium">
              Call us at +234 916 840 7781
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};
