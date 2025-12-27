import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  MapPin,
  Clock,
  Briefcase,
  Globe,
  DollarSign,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Linkedin,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { type CareerPosting } from "../../lib/api/careers";
import { publicApi } from "../../lib/api/publicApi";

interface JobDetailDialogProps {
  job: CareerPosting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coverLetter: string; // Text cover letter (optional if file is provided)
  linkedInUrl: string;
  portfolioUrl: string;
  resumeFile: File | null;
  coverLetterFile: File | null;
}

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
}: JobDetailDialogProps) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    coverLetter: "",
    linkedInUrl: "",
    portfolioUrl: "",
    resumeFile: null,
    coverLetterFile: null,
  });

  const handleInputChange = (
    field: keyof ApplicationFormData,
    value: string | File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleInputChange("resumeFile", file);
  };

  const handleCoverLetterFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    handleInputChange("coverLetterFile", file);
  };

  const handleSubmitApplication = async () => {
    if (!job) return;

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate file size if provided
    if (formData.resumeFile && formData.resumeFile.size > 10 * 1024 * 1024) {
      toast.error("Resume file must be less than 10MB");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("email", formData.email);
      if (formData.phone) {
        formDataToSend.append("phone", formData.phone);
      }
      // Include text cover letter only if no file is provided
      if (formData.coverLetter && !formData.coverLetterFile) {
        formDataToSend.append("coverLetter", formData.coverLetter);
      }
      if (formData.linkedInUrl) {
        formDataToSend.append("linkedInUrl", formData.linkedInUrl);
      }
      if (formData.portfolioUrl) {
        formDataToSend.append("portfolioUrl", formData.portfolioUrl);
      }
      if (formData.resumeFile) {
        formDataToSend.append("resume", formData.resumeFile);
      }
      if (formData.coverLetterFile) {
        formDataToSend.append("coverLetter", formData.coverLetterFile);
      }

      // Submit application with file upload
      const PUBLIC_API_URL =
        import.meta.env.VITE_PUBLIC_API_URL ||
        (import.meta.env.DEV
          ? "http://localhost:5001/api"
          : "https://api.contrezz.com/api");

      const response = await fetch(
        `${PUBLIC_API_URL}/careers/${job.id}/apply`,
        {
          method: "POST",
          body: formDataToSend,
          // Don't set Content-Type header - browser will set it with boundary
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setApplicationSubmitted(true);
        toast.success("Application submitted successfully!");
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          coverLetter: "",
          linkedInUrl: "",
          portfolioUrl: "",
          resumeFile: null,
          coverLetterFile: null,
        });
      } else {
        toast.error(
          data.message || data.error || "Failed to submit application"
        );
      }
    } catch (error: any) {
      console.error("Application submission error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a delay to allow dialog to close
    setTimeout(() => {
      setShowApplicationForm(false);
      setApplicationSubmitted(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        coverLetter: "",
        linkedInUrl: "",
        portfolioUrl: "",
        resumeFile: null,
        coverLetterFile: null,
      });
    }, 300);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {!showApplicationForm && !applicationSubmitted ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-3xl mb-2">
                    {job.title}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {job.department} • {job.location}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Job Details */}
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {job.type}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {job.remote}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.experience}
                </Badge>
                {job.salary && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {job.salary}
                  </Badge>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                <div
                  className="text-gray-700 prose prose-sm max-w-none rich-text-content"
                  dangerouslySetInnerHTML={{ __html: job.description || "" }}
                />
              </div>

              {/* Responsibilities */}
              {job.responsibilities && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Key Responsibilities
                  </h3>
                  <div
                    className="text-gray-700 rich-text-content"
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                    dangerouslySetInnerHTML={{ __html: job.responsibilities }}
                  />
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                  <div
                    className="text-gray-700 rich-text-content"
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                </div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                  <div
                    className="text-gray-700 rich-text-content"
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                    dangerouslySetInnerHTML={{ __html: job.benefits }}
                  />
                </div>
              )}

              {/* Apply Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setShowApplicationForm(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  Apply for this Position
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : applicationSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Application Submitted!
              </DialogTitle>
              <DialogDescription>
                Thank you for your interest in this position.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                We've received your application for <strong>{job.title}</strong>
                . Our team will review your application and get back to you
                soon.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setApplicationSubmitted(false);
                    setShowApplicationForm(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Apply for Another Position
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply for {job.title}</DialogTitle>
              <DialogDescription>
                Fill out the form below to submit your application
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="resume">
                  Resume (PDF, DOC, DOCX) - Max 10MB
                </Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {formData.resumeFile && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.resumeFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(formData.resumeFile.size / 1024 / 1024).toFixed(
                              2
                            )}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      {formData.resumeFile.size > 10 * 1024 * 1024 && (
                        <Badge variant="destructive" className="text-xs">
                          File too large (max 10MB)
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="linkedInUrl">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedInUrl"
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={(e) =>
                    handleInputChange("linkedInUrl", e.target.value)
                  }
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <Label htmlFor="portfolioUrl">
                  Portfolio/Website (Optional)
                </Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) =>
                    handleInputChange("portfolioUrl", e.target.value)
                  }
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div>
                <Label htmlFor="coverLetter">
                  Cover Letter (Optional) - Text or File
                </Label>
                <Textarea
                  id="coverLetter"
                  value={formData.coverLetter}
                  onChange={(e) =>
                    handleInputChange("coverLetter", e.target.value)
                  }
                  placeholder="Tell us why you're interested in this position..."
                  rows={6}
                  disabled={!!formData.coverLetterFile}
                />
                {formData.coverLetterFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    File selected - text field disabled. Remove file to use
                    text.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="coverLetterFile">
                  Or Upload Cover Letter File (PDF, DOC, DOCX) - Max 10MB
                </Label>
                <Input
                  id="coverLetterFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCoverLetterFileChange}
                  className="cursor-pointer"
                />
                {formData.coverLetterFile && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.coverLetterFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(
                              formData.coverLetterFile.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      {formData.coverLetterFile.size > 10 * 1024 * 1024 && (
                        <Badge variant="destructive" className="text-xs">
                          File too large (max 10MB)
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back to Details
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
