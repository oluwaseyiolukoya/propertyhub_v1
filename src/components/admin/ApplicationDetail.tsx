import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";
import {
  getOnboardingApplicationById,
  approveApplication,
  rejectApplication,
  activateApplication,
  requestApplicationInfo,
  updateApplicationReview,
  OnboardingApplication,
} from "../../lib/api/admin-onboarding";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  User,
  Briefcase,
  Clock,
  Copy,
  ExternalLink,
  Users,
  TrendingUp,
  Home,
  UserCog,
} from "lucide-react";

interface ApplicationDetailProps {
  applicationId: string;
  onBack: () => void;
  onUpdate: () => void;
  onViewCustomer?: (customerId: string) => void;
}

export function ApplicationDetail({
  applicationId,
  onBack,
  onUpdate,
  onViewCustomer,
}: ApplicationDetailProps) {
  const [application, setApplication] = useState<OnboardingApplication | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approve form state
  const [approveData, setApproveData] = useState({
    planId: "",
    billingCycle: "monthly" as "monthly" | "annual",
    trialDays: 14,
    notes: "",
  });

  // Reject form state
  const [rejectData, setRejectData] = useState({
    reason: "",
    message: "",
  });

  // Request info form state
  const [requestInfoData, setRequestInfoData] = useState({
    requestedInfo: [] as string[],
    message: "",
  });

  // Review notes state
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    setIsLoading(true);
    try {
      const data = await getOnboardingApplicationById(applicationId);
      setApplication(data);
      setReviewNotes(data.reviewNotes || "");
    } catch (error: any) {
      toast.error(error.message || "Failed to load application");
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!application) return;

    try {
      await updateApplicationReview(application.id, {
        reviewStatus: "in_progress",
        reviewNotes,
      });
      toast.success("Review notes updated");
      fetchApplication();
    } catch (error: any) {
      toast.error(error.message || "Failed to update review");
    }
  };

  const handleApprove = async () => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      await approveApplication(application.id, approveData);
      toast.success("Application approved successfully!");
      setShowApproveDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    if (!rejectData.reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectApplication(application.id, rejectData);
      toast.success("Application rejected");
      setShowRejectDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async () => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      const result = await activateApplication(application.id);
      toast.success("Account activated successfully!");

      // Show temporary password
      navigator.clipboard.writeText(result.temporaryPassword);
      toast.success(`Temporary password copied: ${result.temporaryPassword}`, {
        duration: 10000,
      });

      setShowActivateDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!application) return;
    if (requestInfoData.requestedInfo.length === 0) {
      toast.error("Please select at least one item to request");
      return;
    }
    if (!requestInfoData.message.trim()) {
      toast.error("Please provide a message");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestApplicationInfo(application.id, requestInfoData);
      toast.success("Information request sent");
      setShowRequestInfoDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to request information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; icon: any; label: string }
    > = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
        label: "Pending",
      },
      under_review: {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: AlertCircle,
        label: "Under Review",
      },
      info_requested: {
        color: "bg-orange-100 text-orange-800 border-orange-300",
        icon: AlertCircle,
        label: "Info Requested",
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
        label: "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        label: "Rejected",
      },
      activated: {
        color: "bg-purple-100 text-purple-800 border-purple-300",
        icon: CheckCircle2,
        label: "Activated",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border px-4 py-2 text-base`}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading || !application) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600 font-medium">
          Loading application details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-purple-500/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-violet-600/5 to-purple-600/5"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl -ml-48 -mb-48"></div>

        {/* Content */}
        <div className="relative p-8 rounded-3xl border border-purple-200/50 bg-white/90 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="outline"
                onClick={onBack}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                      {application.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-600 text-lg">
                        {application.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(application.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <CardTitle className="text-white text-xl font-bold">
              Actions
            </CardTitle>
          </div>
          <CardDescription className="text-purple-100">
            Manage this application
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex flex-wrap gap-3">
            {application.status === "pending" && (
              <>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Application
                </Button>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  variant="destructive"
                  className="shadow-lg hover:shadow-xl transition-all"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
                <Button
                  onClick={() => setShowRequestInfoDialog(true)}
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 shadow-sm"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Information
                </Button>
              </>
            )}
            {application.status === "approved" && (
              <Button
                onClick={() => setShowActivateDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Activate Account
              </Button>
            )}
            {application.customerId && (
              <Button
                variant="outline"
                onClick={() => onViewCustomer?.(application.customerId!)}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Customer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Personal Information */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-gray-900">
                  Personal Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Full Name
                  </Label>
                  <p className="font-bold text-gray-900 text-lg">
                    {application.name}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Email
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">
                      {application.email}
                    </p>
                  </div>
                </div>
                {application.phone && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Phone
                    </Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {application.phone}
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Application Type
                  </Label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-500" />
                    <p className="font-medium text-gray-900 capitalize">
                      {application.applicationType.replace("-", " ")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Role-Specific Information */}
          {application.applicationType === "property-owner" && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900">
                    Property Owner Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {application.companyName && (
                    <div>
                      <Label className="text-gray-600">Company Name</Label>
                      <p className="font-medium">{application.companyName}</p>
                    </div>
                  )}
                  {application.businessType && (
                    <div>
                      <Label className="text-gray-600">Business Type</Label>
                      <p className="font-medium capitalize">
                        {application.businessType}
                      </p>
                    </div>
                  )}
                  {application.numberOfProperties && (
                    <div>
                      <Label className="text-gray-600">
                        Number of Properties
                      </Label>
                      <p className="font-medium">
                        {application.numberOfProperties}
                      </p>
                    </div>
                  )}
                  {application.totalUnits && (
                    <div>
                      <Label className="text-gray-600">Total Units</Label>
                      <p className="font-medium">{application.totalUnits}</p>
                    </div>
                  )}
                  {application.taxId && (
                    <div>
                      <Label className="text-gray-600">Tax ID</Label>
                      <p className="font-medium">{application.taxId}</p>
                    </div>
                  )}
                  {application.website && (
                    <div className="col-span-2">
                      <Label className="text-gray-600">Website</Label>
                      <p className="font-medium">
                        <a
                          href={application.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {application.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {application.applicationType === "property-manager" && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-gray-900">
                    Property Manager Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {application.managementCompany && (
                    <div>
                      <Label className="text-gray-600">
                        Management Company
                      </Label>
                      <p className="font-medium">
                        {application.managementCompany}
                      </p>
                    </div>
                  )}
                  {application.yearsOfExperience !== null && (
                    <div>
                      <Label className="text-gray-600">
                        Years of Experience
                      </Label>
                      <p className="font-medium">
                        {application.yearsOfExperience}
                      </p>
                    </div>
                  )}
                  {application.propertiesManaged && (
                    <div>
                      <Label className="text-gray-600">
                        Properties Managed
                      </Label>
                      <p className="font-medium">
                        {application.propertiesManaged}
                      </p>
                    </div>
                  )}
                  {application.licenseNumber && (
                    <div>
                      <Label className="text-gray-600">License Number</Label>
                      <p className="font-medium">{application.licenseNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {application.applicationType === "tenant" && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-gray-900">
                    Tenant Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {application.currentlyRenting && (
                    <div>
                      <Label className="text-gray-600">Currently Renting</Label>
                      <p className="font-medium capitalize">
                        {application.currentlyRenting}
                      </p>
                    </div>
                  )}
                  {application.moveInDate && (
                    <div>
                      <Label className="text-gray-600">Move-in Date</Label>
                      <p className="font-medium">
                        {new Date(application.moveInDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {application.employmentStatus && (
                    <div>
                      <Label className="text-gray-600">Employment Status</Label>
                      <p className="font-medium capitalize">
                        {application.employmentStatus}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(application.applicationType === "property-developer" ||
            application.applicationType === "developer") && (
            <>
              {/* Enhanced Company Information */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-gray-900">
                      Development Company Information
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {application.companyName && (
                      <div>
                        <Label className="text-gray-600">Company Name</Label>
                        <p className="font-medium">{application.companyName}</p>
                      </div>
                    )}
                    {application.businessType && (
                      <div>
                        <Label className="text-gray-600">Business Type</Label>
                        <p className="font-medium capitalize">
                          {application.businessType}
                        </p>
                      </div>
                    )}
                    {application.metadata?.companyRegistration && (
                      <div>
                        <Label className="text-gray-600">
                          Company Registration
                        </Label>
                        <p className="font-medium">
                          {application.metadata.companyRegistration}
                        </p>
                      </div>
                    )}
                    {application.metadata?.yearsInDevelopment && (
                      <div>
                        <Label className="text-gray-600">
                          Years in Development
                        </Label>
                        <p className="font-medium">
                          {application.metadata.yearsInDevelopment}
                        </p>
                      </div>
                    )}
                    {application.metadata?.developmentType && (
                      <div>
                        <Label className="text-gray-600">
                          Primary Development Type
                        </Label>
                        <p className="font-medium capitalize">
                          {application.metadata.developmentType}
                        </p>
                      </div>
                    )}
                    {application.metadata?.specialization && (
                      <div>
                        <Label className="text-gray-600">Specialization</Label>
                        <p className="font-medium capitalize">
                          {application.metadata.specialization}
                        </p>
                      </div>
                    )}
                    {application.metadata?.primaryMarket && (
                      <div className="col-span-2">
                        <Label className="text-gray-600">
                          Primary Market/City
                        </Label>
                        <p className="font-medium">
                          {application.metadata.primaryMarket}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Project Portfolio */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-gray-900">
                      Project Portfolio
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {application.metadata?.activeProjects !== undefined && (
                      <div>
                        <Label className="text-gray-600">Active Projects</Label>
                        <p className="font-medium text-2xl text-blue-600">
                          {application.metadata.activeProjects}
                        </p>
                      </div>
                    )}
                    {application.metadata?.completedProjects !== undefined && (
                      <div>
                        <Label className="text-gray-600">
                          Completed Projects
                        </Label>
                        <p className="font-medium text-2xl text-green-600">
                          {application.metadata.completedProjects}
                        </p>
                      </div>
                    )}
                    {application.metadata?.projectsInPlanning !== undefined && (
                      <div>
                        <Label className="text-gray-600">In Planning</Label>
                        <p className="font-medium text-2xl text-orange-600">
                          {application.metadata.projectsInPlanning}
                        </p>
                      </div>
                    )}
                  </div>
                  {application.metadata?.totalProjectValue && (
                    <div>
                      <Label className="text-gray-600">
                        Total Project Value
                      </Label>
                      <p className="font-medium">
                        {application.metadata.totalProjectValue}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Licensing & Compliance */}
              {(application.metadata?.developmentLicense ||
                application.metadata?.licenseNumber) && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-gray-900">
                        Licensing & Compliance
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {application.metadata?.developmentLicense && (
                        <div>
                          <Label className="text-gray-600">
                            License Status
                          </Label>
                          <p className="font-medium capitalize">
                            {application.metadata.developmentLicense}
                          </p>
                        </div>
                      )}
                      {application.metadata?.licenseNumber && (
                        <div>
                          <Label className="text-gray-600">
                            License Number
                          </Label>
                          <p className="font-medium">
                            {application.metadata.licenseNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Team & Resources */}
              {(application.metadata?.teamSize ||
                application.metadata?.inHouseArchitect !== undefined ||
                application.metadata?.inHouseEngineer !== undefined) && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-gray-900">
                        Team & Resources
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {application.metadata?.teamSize && (
                        <div>
                          <Label className="text-gray-600">Team Size</Label>
                          <p className="font-medium">
                            {application.metadata.teamSize}
                          </p>
                        </div>
                      )}
                      {application.metadata?.inHouseArchitect !== undefined && (
                        <div>
                          <Label className="text-gray-600">
                            In-House Architect
                          </Label>
                          <p className="font-medium">
                            {application.metadata.inHouseArchitect
                              ? "Yes"
                              : "No"}
                          </p>
                        </div>
                      )}
                      {application.metadata?.inHouseEngineer !== undefined && (
                        <div>
                          <Label className="text-gray-600">
                            In-House Engineer
                          </Label>
                          <p className="font-medium">
                            {application.metadata.inHouseEngineer
                              ? "Yes"
                              : "No"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Funding & Finance */}
              {(application.metadata?.fundingSources ||
                application.metadata?.primaryFundingMethod) && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-gray-900">
                        Funding & Finance
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {application.metadata?.fundingSources && (
                        <div className="col-span-2">
                          <Label className="text-gray-600">
                            Funding Sources
                          </Label>
                          <p className="font-medium">
                            {application.metadata.fundingSources}
                          </p>
                        </div>
                      )}
                      {application.metadata?.primaryFundingMethod && (
                        <div className="col-span-2">
                          <Label className="text-gray-600">
                            Primary Funding Method
                          </Label>
                          <p className="font-medium capitalize">
                            {application.metadata.primaryFundingMethod}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Technology & Pain Points */}
              {(application.metadata?.softwareUsed ||
                application.metadata?.painPoints) && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-indigo-600" />
                      <CardTitle className="text-gray-900">
                        Technology & Challenges
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {application.metadata?.softwareUsed && (
                      <div>
                        <Label className="text-gray-600">
                          Current Software Used
                        </Label>
                        <p className="font-medium">
                          {application.metadata.softwareUsed}
                        </p>
                      </div>
                    )}
                    {application.metadata?.painPoints && (
                      <div>
                        <Label className="text-gray-600">
                          Current Pain Points
                        </Label>
                        <p className="font-medium text-gray-700">
                          {application.metadata.painPoints}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Enhanced Address */}
          {(application.street || application.city || application.state) && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-gray-900">Address</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {application.street && (
                    <p className="font-medium text-gray-900">
                      {application.street}
                    </p>
                  )}
                  <p className="text-gray-700">
                    {[
                      application.city,
                      application.state,
                      application.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-gray-600">{application.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Review Notes */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-gray-900">Review Notes</CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Internal notes for this application
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review notes here..."
                rows={4}
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
              <Button
                onClick={handleUpdateReview}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-md"
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Enhanced Timeline */}
          {application.timeline && application.timeline.length > 0 && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white p-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <CardTitle className="text-white text-xl font-bold">
                    Timeline
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="space-y-4">
                  {application.timeline.map((event, index) => (
                    <div key={index} className="flex space-x-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full border-2 border-white shadow-md group-hover:scale-125 transition-transform"></div>
                        {index < application.timeline!.length - 1 && (
                          <div className="w-0.5 h-full bg-gradient-to-b from-purple-200 to-violet-200 my-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-bold text-sm text-gray-900">
                          {event.action}
                        </p>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">
                          {event.actor}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.details && (
                          <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                            {event.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Metadata */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <CardTitle className="text-white text-xl font-bold">
                  Metadata
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white space-y-4">
              <div className="space-y-1 p-3 rounded-lg bg-white border border-gray-100">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Submitted
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {new Date(application.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-white border border-gray-100">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Last Updated
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {new Date(application.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {application.ipAddress && (
                <div className="space-y-1 p-3 rounded-lg bg-white border border-gray-100">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    IP Address
                  </Label>
                  <p className="font-mono text-sm text-gray-900 mt-1">
                    {application.ipAddress}
                  </p>
                </div>
              )}
              {application.referralSource && (
                <div className="space-y-1 p-3 rounded-lg bg-white border border-gray-100">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Referral Source
                  </Label>
                  <p className="font-medium text-gray-900 mt-1">
                    {application.referralSource}
                  </p>
                </div>
              )}
              {application.metadata &&
                typeof application.metadata === "object" && (
                  <div className="pt-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                      Additional Details
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(
                        application.metadata as Record<string, any>
                      )
                        .filter(
                          ([_, v]) => v !== null && v !== undefined && v !== ""
                        )
                        .map(([k, v]) => (
                          <div
                            key={k}
                            className="flex items-start justify-between border-2 border-gray-100 rounded-lg p-3 bg-white hover:border-purple-200 transition-colors"
                          >
                            <span className="text-gray-600 font-medium mr-4 capitalize">
                              {k.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className="font-semibold text-gray-900 break-words text-right">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              This will create a customer account for {application.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Trial Period (days)</Label>
              <Input
                type="number"
                value={approveData.trialDays}
                onChange={(e) =>
                  setApproveData({
                    ...approveData,
                    trialDays: parseInt(e.target.value),
                  })
                }
                min={0}
                max={90}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={approveData.notes}
                onChange={(e) =>
                  setApproveData({ ...approveData, notes: e.target.value })
                }
                placeholder="Add any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Approving..." : "Approve Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectData.reason}
                onChange={(e) =>
                  setRejectData({ ...rejectData, reason: e.target.value })
                }
                placeholder="Explain why this application is being rejected..."
                required
              />
            </div>
            <div>
              <Label>Message to Applicant (optional)</Label>
              <Textarea
                value={rejectData.message}
                onChange={(e) =>
                  setRejectData({ ...rejectData, message: e.target.value })
                }
                placeholder="Optional message that will be sent to the applicant..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Account</DialogTitle>
            <DialogDescription>
              This will create a user account and generate a temporary password
              for {application.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> A temporary password will be generated
                and copied to your clipboard. Make sure to send it to the
                customer via email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActivateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivate}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Activating..." : "Activate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog
        open={showRequestInfoDialog}
        onOpenChange={setShowRequestInfoDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Select what information you need from the applicant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message *</Label>
              <Textarea
                value={requestInfoData.message}
                onChange={(e) =>
                  setRequestInfoData({
                    ...requestInfoData,
                    message: e.target.value,
                  })
                }
                placeholder="Explain what additional information is needed..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestInfoDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestInfo} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
