import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from 'sonner';
import {
  getOnboardingApplicationById,
  approveApplication,
  rejectApplication,
  activateApplication,
  requestApplicationInfo,
  updateApplicationReview,
  OnboardingApplication,
} from '../../lib/api/admin-onboarding';
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
} from 'lucide-react';

interface ApplicationDetailProps {
  applicationId: string;
  onBack: () => void;
  onUpdate: () => void;
  onViewCustomer?: (customerId: string) => void;
}

export function ApplicationDetail({ applicationId, onBack, onUpdate, onViewCustomer }: ApplicationDetailProps) {
  const [application, setApplication] = useState<OnboardingApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approve form state
  const [approveData, setApproveData] = useState({
    planId: '',
    billingCycle: 'monthly' as 'monthly' | 'annual',
    trialDays: 14,
    notes: '',
  });

  // Reject form state
  const [rejectData, setRejectData] = useState({
    reason: '',
    message: '',
  });

  // Request info form state
  const [requestInfoData, setRequestInfoData] = useState({
    requestedInfo: [] as string[],
    message: '',
  });

  // Review notes state
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    setIsLoading(true);
    try {
      const data = await getOnboardingApplicationById(applicationId);
      setApplication(data);
      setReviewNotes(data.reviewNotes || '');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load application');
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!application) return;

    try {
      await updateApplicationReview(application.id, {
        reviewStatus: 'in_progress',
        reviewNotes,
      });
      toast.success('Review notes updated');
      fetchApplication();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update review');
    }
  };

  const handleApprove = async () => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      await approveApplication(application.id, approveData);
      toast.success('Application approved successfully!');
      setShowApproveDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    if (!rejectData.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectApplication(application.id, rejectData);
      toast.success('Application rejected');
      setShowRejectDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async () => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      const result = await activateApplication(application.id);
      toast.success('Account activated successfully!');

      // Show temporary password
      navigator.clipboard.writeText(result.temporaryPassword);
      toast.success(`Temporary password copied: ${result.temporaryPassword}`, {
        duration: 10000,
      });

      setShowActivateDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!application) return;
    if (requestInfoData.requestedInfo.length === 0) {
      toast.error('Please select at least one item to request');
      return;
    }
    if (!requestInfoData.message.trim()) {
      toast.error('Please provide a message');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestApplicationInfo(application.id, requestInfoData);
      toast.success('Information request sent');
      setShowRequestInfoDialog(false);
      fetchApplication();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to request information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, label: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: AlertCircle, label: 'Under Review' },
      info_requested: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle, label: 'Info Requested' },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Rejected' },
      activated: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: CheckCircle2, label: 'Activated' },
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{application.name}</h1>
            <p className="text-gray-600 mt-1">{application.email}</p>
          </div>
        </div>
        {getStatusBadge(application.status)}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {application.status === 'pending' && (
              <>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Application
                </Button>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
                <Button
                  onClick={() => setShowRequestInfoDialog(true)}
                  variant="outline"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Information
                </Button>
              </>
            )}
            {application.status === 'approved' && (
              <Button
                onClick={() => setShowActivateDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Activate Account
              </Button>
            )}
            {application.customerId && (
              <Button 
                variant="outline"
                onClick={() => onViewCustomer?.(application.customerId!)}
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
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Full Name</Label>
                  <p className="font-medium">{application.name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{application.email}</p>
                </div>
                {application.phone && (
                  <div>
                    <Label className="text-gray-600">Phone</Label>
                    <p className="font-medium">{application.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-600">Application Type</Label>
                  <p className="font-medium capitalize">{application.applicationType.replace('-', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-Specific Information */}
          {application.applicationType === 'property-owner' && (
            <Card>
              <CardHeader>
                <CardTitle>Property Owner Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <p className="font-medium capitalize">{application.businessType}</p>
                    </div>
                  )}
                  {application.numberOfProperties && (
                    <div>
                      <Label className="text-gray-600">Number of Properties</Label>
                      <p className="font-medium">{application.numberOfProperties}</p>
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
                        <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {application.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {application.applicationType === 'property-manager' && (
            <Card>
              <CardHeader>
                <CardTitle>Property Manager Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {application.managementCompany && (
                    <div>
                      <Label className="text-gray-600">Management Company</Label>
                      <p className="font-medium">{application.managementCompany}</p>
                    </div>
                  )}
                  {application.yearsOfExperience !== null && (
                    <div>
                      <Label className="text-gray-600">Years of Experience</Label>
                      <p className="font-medium">{application.yearsOfExperience}</p>
                    </div>
                  )}
                  {application.propertiesManaged && (
                    <div>
                      <Label className="text-gray-600">Properties Managed</Label>
                      <p className="font-medium">{application.propertiesManaged}</p>
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

          {application.applicationType === 'tenant' && (
            <Card>
              <CardHeader>
                <CardTitle>Tenant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {application.currentlyRenting && (
                    <div>
                      <Label className="text-gray-600">Currently Renting</Label>
                      <p className="font-medium capitalize">{application.currentlyRenting}</p>
                    </div>
                  )}
                  {application.moveInDate && (
                    <div>
                      <Label className="text-gray-600">Move-in Date</Label>
                      <p className="font-medium">{new Date(application.moveInDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {application.employmentStatus && (
                    <div>
                      <Label className="text-gray-600">Employment Status</Label>
                      <p className="font-medium capitalize">{application.employmentStatus}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(application.applicationType === 'property-developer' || application.applicationType === 'developer') && (
            <>
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Development Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        <p className="font-medium capitalize">{application.businessType}</p>
                      </div>
                    )}
                    {application.metadata?.companyRegistration && (
                      <div>
                        <Label className="text-gray-600">Company Registration</Label>
                        <p className="font-medium">{application.metadata.companyRegistration}</p>
                      </div>
                    )}
                    {application.metadata?.yearsInDevelopment && (
                      <div>
                        <Label className="text-gray-600">Years in Development</Label>
                        <p className="font-medium">{application.metadata.yearsInDevelopment}</p>
                      </div>
                    )}
                    {application.metadata?.developmentType && (
                      <div>
                        <Label className="text-gray-600">Primary Development Type</Label>
                        <p className="font-medium capitalize">{application.metadata.developmentType}</p>
                      </div>
                    )}
                    {application.metadata?.specialization && (
                      <div>
                        <Label className="text-gray-600">Specialization</Label>
                        <p className="font-medium capitalize">{application.metadata.specialization}</p>
                      </div>
                    )}
                    {application.metadata?.primaryMarket && (
                      <div className="col-span-2">
                        <Label className="text-gray-600">Primary Market/City</Label>
                        <p className="font-medium">{application.metadata.primaryMarket}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Project Portfolio */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {application.metadata?.activeProjects !== undefined && (
                      <div>
                        <Label className="text-gray-600">Active Projects</Label>
                        <p className="font-medium text-2xl text-blue-600">{application.metadata.activeProjects}</p>
                      </div>
                    )}
                    {application.metadata?.completedProjects !== undefined && (
                      <div>
                        <Label className="text-gray-600">Completed Projects</Label>
                        <p className="font-medium text-2xl text-green-600">{application.metadata.completedProjects}</p>
                      </div>
                    )}
                    {application.metadata?.projectsInPlanning !== undefined && (
                      <div>
                        <Label className="text-gray-600">In Planning</Label>
                        <p className="font-medium text-2xl text-orange-600">{application.metadata.projectsInPlanning}</p>
                      </div>
                    )}
                  </div>
                  {application.metadata?.totalProjectValue && (
                    <div>
                      <Label className="text-gray-600">Total Project Value</Label>
                      <p className="font-medium">{application.metadata.totalProjectValue}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Licensing & Compliance */}
              {(application.metadata?.developmentLicense || application.metadata?.licenseNumber) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Licensing & Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {application.metadata?.developmentLicense && (
                        <div>
                          <Label className="text-gray-600">License Status</Label>
                          <p className="font-medium capitalize">{application.metadata.developmentLicense}</p>
                        </div>
                      )}
                      {application.metadata?.licenseNumber && (
                        <div>
                          <Label className="text-gray-600">License Number</Label>
                          <p className="font-medium">{application.metadata.licenseNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Team & Resources */}
              {(application.metadata?.teamSize || application.metadata?.inHouseArchitect !== undefined || application.metadata?.inHouseEngineer !== undefined) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Team & Resources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {application.metadata?.teamSize && (
                        <div>
                          <Label className="text-gray-600">Team Size</Label>
                          <p className="font-medium">{application.metadata.teamSize}</p>
                        </div>
                      )}
                      {application.metadata?.inHouseArchitect !== undefined && (
                        <div>
                          <Label className="text-gray-600">In-House Architect</Label>
                          <p className="font-medium">{application.metadata.inHouseArchitect ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                      {application.metadata?.inHouseEngineer !== undefined && (
                        <div>
                          <Label className="text-gray-600">In-House Engineer</Label>
                          <p className="font-medium">{application.metadata.inHouseEngineer ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Funding & Finance */}
              {(application.metadata?.fundingSources || application.metadata?.primaryFundingMethod) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Funding & Finance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {application.metadata?.fundingSources && (
                        <div className="col-span-2">
                          <Label className="text-gray-600">Funding Sources</Label>
                          <p className="font-medium">{application.metadata.fundingSources}</p>
                        </div>
                      )}
                      {application.metadata?.primaryFundingMethod && (
                        <div className="col-span-2">
                          <Label className="text-gray-600">Primary Funding Method</Label>
                          <p className="font-medium capitalize">{application.metadata.primaryFundingMethod}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Technology & Pain Points */}
              {(application.metadata?.softwareUsed || application.metadata?.painPoints) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Technology & Challenges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {application.metadata?.softwareUsed && (
                      <div>
                        <Label className="text-gray-600">Current Software Used</Label>
                        <p className="font-medium">{application.metadata.softwareUsed}</p>
                      </div>
                    )}
                    {application.metadata?.painPoints && (
                      <div>
                        <Label className="text-gray-600">Current Pain Points</Label>
                        <p className="font-medium text-gray-700">{application.metadata.painPoints}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Address */}
          {(application.street || application.city || application.state) && (
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {application.street && <p>{application.street}</p>}
                  <p>
                    {[application.city, application.state, application.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p>{application.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
              <CardDescription>Internal notes for this application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review notes here..."
                rows={4}
              />
              <Button onClick={handleUpdateReview}>
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          {application.timeline && application.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.timeline.map((event, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        {index < application.timeline!.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{event.action}</p>
                        <p className="text-xs text-gray-600">{event.actor}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.details && (
                          <p className="text-xs text-gray-600 mt-1">{event.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-gray-600">Submitted</Label>
                <p>{new Date(application.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-600">Last Updated</Label>
                <p>{new Date(application.updatedAt).toLocaleString()}</p>
              </div>
              {application.ipAddress && (
                <div>
                  <Label className="text-gray-600">IP Address</Label>
                  <p className="font-mono text-xs">{application.ipAddress}</p>
                </div>
              )}
              {application.referralSource && (
                <div>
                  <Label className="text-gray-600">Referral Source</Label>
                  <p>{application.referralSource}</p>
                </div>
              )}
              {application.metadata && typeof application.metadata === 'object' && (
                <div className="pt-2">
                  <Label className="text-gray-600">Additional Details</Label>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {Object.entries(application.metadata as Record<string, any>)
                      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
                      .map(([k, v]) => (
                        <div key={k} className="flex items-start justify-between border rounded p-2">
                          <span className="text-gray-600 mr-4">{k}</span>
                          <span className="font-medium break-words">{String(v)}</span>
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
                onChange={(e) => setApproveData({ ...approveData, trialDays: parseInt(e.target.value) })}
                min={0}
                max={90}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={approveData.notes}
                onChange={(e) => setApproveData({ ...approveData, notes: e.target.value })}
                placeholder="Add any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? 'Approving...' : 'Approve Application'}
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
                onChange={(e) => setRejectData({ ...rejectData, reason: e.target.value })}
                placeholder="Explain why this application is being rejected..."
                required
              />
            </div>
            <div>
              <Label>Message to Applicant (optional)</Label>
              <Textarea
                value={rejectData.message}
                onChange={(e) => setRejectData({ ...rejectData, message: e.target.value })}
                placeholder="Optional message that will be sent to the applicant..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={isSubmitting} variant="destructive">
              {isSubmitting ? 'Rejecting...' : 'Reject Application'}
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
              This will create a user account and generate a temporary password for {application.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> A temporary password will be generated and copied to your clipboard.
                Make sure to send it to the customer via email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
              {isSubmitting ? 'Activating...' : 'Activate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
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
                onChange={(e) => setRequestInfoData({ ...requestInfoData, message: e.target.value })}
                placeholder="Explain what additional information is needed..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestInfoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestInfo} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

