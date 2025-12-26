import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Briefcase,
  Loader2,
  RefreshCw,
  X,
  Users,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Linkedin,
  Globe,
  Calendar,
  User,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { publicAdminApi } from "../../../lib/api/publicAdminApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";

interface CareerPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  remote: string;
  experience: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  salary?: string;
  benefits?: string[];
  status: string;
  expiresAt?: string;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CareerPostingFormData {
  title: string;
  department: string;
  location: string;
  type: string;
  remote: string;
  experience: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salary: string;
  benefits: string;
  status: string;
  expiresAt: string;
}

export function CareerManagement() {
  const [postings, setPostings] = useState<CareerPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postingToDelete, setPostingToDelete] = useState<CareerPosting | null>(
    null
  );
  const [pagination, setPagination] = useState<any>(null);
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<CareerPosting | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationsDialogOpen, setApplicationsDialogOpen] = useState(false);
  const [selectedPostingForApplications, setSelectedPostingForApplications] =
    useState<CareerPosting | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(
    null
  );
  const [applicationDetailOpen, setApplicationDetailOpen] = useState(false);
  const [formData, setFormData] = useState<CareerPostingFormData>({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    remote: "On-site",
    experience: "Mid-level",
    description: "",
    requirements: "",
    responsibilities: "",
    salary: "",
    benefits: "",
    status: "draft",
    expiresAt: "",
  });

  const loadPostings = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: 1,
        limit: 20,
      };
      if (search) filters.search = search;
      if (statusFilter !== "all") filters.status = statusFilter;

      const response = await publicAdminApi.careers.list(filters);
      setPostings(response.postings || []);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.error || "Failed to load career postings");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await publicAdminApi.careers.getStats();
      setStats(response.data || response);
    } catch (error: any) {
      console.error("Failed to load statistics:", error);
    }
  };

  useEffect(() => {
    loadPostings();
    loadStats();
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!postingToDelete) return;

    try {
      await publicAdminApi.careers.delete(postingToDelete.id);
      toast.success("Career posting deleted successfully");
      setDeleteDialogOpen(false);
      setPostingToDelete(null);
      loadPostings();
      loadStats();
    } catch (error: any) {
      toast.error(error.error || "Failed to delete career posting");
    }
  };

  const handleCreateClick = () => {
    setEditingPosting(null);
    setFormData({
      title: "",
      department: "",
      location: "",
      type: "Full-time",
      remote: "On-site",
      experience: "Mid-level",
      description: "",
      requirements: "",
      responsibilities: "",
      salary: "",
      benefits: "",
      status: "draft",
      expiresAt: "",
    });
    setCreateEditDialogOpen(true);
  };

  const handleEditClick = (posting: CareerPosting) => {
    setEditingPosting(posting);
    setFormData({
      title: posting.title || "",
      department: posting.department || "",
      location: posting.location || "",
      type: posting.type || "Full-time",
      remote: posting.remote || "On-site",
      experience: posting.experience || "Mid-level",
      description: posting.description || "",
      requirements: (posting.requirements || []).join("\n"),
      responsibilities: (posting.responsibilities || []).join("\n"),
      salary: posting.salary || "",
      benefits: (posting.benefits || []).join("\n"),
      status: posting.status || "draft",
      expiresAt: posting.expiresAt
        ? new Date(posting.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setCreateEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.department || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.description || formData.description.length < 50) {
      toast.error("Description must be at least 50 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        remote: formData.remote,
        experience: formData.experience,
        description: formData.description,
        requirements: formData.requirements
          .split("\n")
          .filter((r) => r.trim().length > 0),
        responsibilities: formData.responsibilities
          .split("\n")
          .filter((r) => r.trim().length > 0),
        status: formData.status,
      };

      if (formData.salary) payload.salary = formData.salary;
      if (formData.benefits) {
        payload.benefits = formData.benefits
          .split("\n")
          .filter((b) => b.trim().length > 0);
      }
      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt);
      }

      if (editingPosting) {
        await publicAdminApi.careers.update(editingPosting.id, payload);
        toast.success("Career posting updated successfully");
      } else {
        await publicAdminApi.careers.create(payload);
        toast.success("Career posting created successfully");
      }

      setCreateEditDialogOpen(false);
      setEditingPosting(null);
      loadPostings();
      loadStats();
    } catch (error: any) {
      toast.error(
        error.error || error.message || "Failed to save career posting"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewApplications = async (posting: CareerPosting) => {
    setSelectedPostingForApplications(posting);
    setApplicationsDialogOpen(true);
    await loadApplications(posting.id);
  };

  const loadApplications = async (postingId: string) => {
    setApplicationsLoading(true);
    try {
      const response = await publicAdminApi.careers.getApplications(postingId);
      setApplications(response.applications || []);
    } catch (error: any) {
      toast.error(error.error || "Failed to load applications");
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: string
  ) => {
    try {
      await publicAdminApi.careers.updateApplication(applicationId, { status });
      toast.success("Application status updated");
      if (selectedPostingForApplications) {
        await loadApplications(selectedPostingForApplications.id);
      }
      loadPostings(); // Refresh to update application count
    } catch (error: any) {
      toast.error(error.error || "Failed to update application status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      closed: "bg-gray-100 text-gray-800",
      archived: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getApplicationStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewing: "bg-blue-100 text-blue-800",
      shortlisted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      hired: "bg-emerald-100 text-emerald-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Career Postings</h2>
          <p className="text-gray-500 mt-1">Manage job postings</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadPostings();
              loadStats();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            onClick={handleCreateClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Posting
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Draft</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.draft || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Views</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalViews || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search postings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "draft" ? "default" : "outline"}
                onClick={() => setStatusFilter("draft")}
              >
                Drafts
              </Button>
              <Button
                variant={statusFilter === "closed" ? "default" : "outline"}
                onClick={() => setStatusFilter("closed")}
              >
                Closed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Postings Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Postings ({postings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : postings.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No career postings found</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first job posting to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postings.map((posting) => (
                  <TableRow key={posting.id}>
                    <TableCell className="font-medium">
                      {posting.title}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {posting.department}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {posting.location}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {posting.type}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={posting.status}
                        onValueChange={async (newStatus) => {
                          if (newStatus === posting.status) return;
                          try {
                            await publicAdminApi.careers.update(posting.id, {
                              status: newStatus,
                            });
                            toast.success(
                              `Status updated to ${newStatus.toUpperCase()}`
                            );
                            // Refresh postings
                            loadPostings();
                          } catch (error: any) {
                            toast.error(
                              error.error || "Failed to update status"
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent hover:bg-gray-50 p-0">
                          <SelectValue>
                            {getStatusBadge(posting.status)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Active (Shown on public page)
                            </span>
                          </SelectItem>
                          <SelectItem value="draft">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              Draft (Hidden from public)
                            </span>
                          </SelectItem>
                          <SelectItem value="closed">
                            <span className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              Closed (Hidden from public)
                            </span>
                          </SelectItem>
                          <SelectItem value="archived">
                            <span className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-gray-600" />
                              Archived (Hidden from public)
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {posting.viewCount}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {posting.applicationCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewApplications(posting)}
                          title="View Applications"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(posting)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPostingToDelete(posting);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createEditDialogOpen}
        onOpenChange={setCreateEditDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosting ? "Edit Career Posting" : "Create Career Posting"}
            </DialogTitle>
            <DialogDescription>
              {editingPosting
                ? "Update the career posting details"
                : "Fill in the details to create a new career posting"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="department">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="e.g., Engineering"
                />
              </div>
              <div>
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div>
                <Label htmlFor="type">Job Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="remote">Remote Type</Label>
                <Select
                  value={formData.remote}
                  onValueChange={(value) =>
                    setFormData({ ...formData, remote: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="On-site">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experience">Experience Level</Label>
                <Select
                  value={formData.experience}
                  onValueChange={(value) =>
                    setFormData({ ...formData, experience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry-level">Entry-level</SelectItem>
                    <SelectItem value="Mid-level">Mid-level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="salary">Salary (Optional)</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="e.g., $100,000 - $150,000"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the role, company culture, and what makes this position unique..."
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 50 characters
              </p>
            </div>

            {/* Responsibilities */}
            <div>
              <Label htmlFor="responsibilities">
                Responsibilities (one per line)
              </Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) =>
                  setFormData({ ...formData, responsibilities: e.target.value })
                }
                placeholder="Develop and maintain web applications&#10;Collaborate with cross-functional teams&#10;Write clean, maintainable code"
                rows={4}
              />
            </div>

            {/* Requirements */}
            <div>
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience&#10;Proficiency in React and TypeScript"
                rows={4}
              />
            </div>

            {/* Benefits */}
            <div>
              <Label htmlFor="benefits">
                Benefits (one per line, optional)
              </Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) =>
                  setFormData({ ...formData, benefits: e.target.value })
                }
                placeholder="Health insurance&#10;401(k) matching&#10;Flexible work hours"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateEditDialogOpen(false);
                setEditingPosting(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingPosting ? (
                "Update Posting"
              ) : (
                "Create Posting"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog
        open={applicationsDialogOpen}
        onOpenChange={setApplicationsDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Applications for {selectedPostingForApplications?.title}
            </DialogTitle>
            <DialogDescription>
              View and manage job applications for this position
            </DialogDescription>
          </DialogHeader>
          {applicationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => (
                <Card
                  key={application.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedApplication(application);
                    setApplicationDetailOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {application.firstName.charAt(0)}
                            {application.lastName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">
                              {application.firstName} {application.lastName}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {application.email}
                            </p>
                          </div>
                          {getApplicationStatusBadge(application.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {application.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{application.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {new Date(
                                application.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {application.resumeUrl && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">Resume</span>
                            </div>
                          )}
                          {(application.coverLetter ||
                            application.coverLetterUrl) && (
                            <div className="flex items-center gap-2 text-purple-600">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">
                                Cover Letter
                                {application.coverLetterUrl && " (File)"}
                                {application.coverLetter &&
                                  !application.coverLetterUrl &&
                                  " (Text)"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplication(application);
                            setApplicationDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Select
                          value={application.status}
                          onValueChange={(value) => {
                            handleUpdateApplicationStatus(
                              application.id,
                              value
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="shortlisted">
                              Shortlisted
                            </SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApplicationsDialogOpen(false);
                setSelectedPostingForApplications(null);
                setApplications([]);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Detail Dialog */}
      <Dialog
        open={applicationDetailOpen}
        onOpenChange={setApplicationDetailOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                      {selectedApplication.firstName.charAt(0)}
                      {selectedApplication.lastName.charAt(0)}
                    </div>
                    <div>
                      <DialogTitle className="text-2xl">
                        {selectedApplication.firstName}{" "}
                        {selectedApplication.lastName}
                      </DialogTitle>
                      <DialogDescription className="text-base mt-1">
                        Application for {selectedPostingForApplications?.title}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getApplicationStatusBadge(selectedApplication.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setApplicationDetailOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium">
                            {selectedApplication.email}
                          </p>
                        </div>
                      </div>
                      {selectedApplication.phone && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="font-medium">
                              {selectedApplication.phone}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedApplication.linkedInUrl && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Linkedin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">LinkedIn</p>
                            <a
                              href={selectedApplication.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              View Profile
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedApplication.portfolioUrl && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Portfolio</p>
                            <a
                              href={selectedApplication.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Visit Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Applied On</p>
                          <p className="font-medium">
                            {new Date(
                              selectedApplication.createdAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Attached Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedApplication.resumeUrl ? (
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                              <FileText className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                Resume
                              </p>
                              <p className="text-sm text-gray-600">
                                {selectedApplication.resumeUrl.includes("/")
                                  ? selectedApplication.resumeUrl
                                      .split("/")
                                      .pop()
                                  : selectedApplication.resumeUrl}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                Stored in DigitalOcean Spaces
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  // Get signed URL for viewing
                                  const response =
                                    await publicAdminApi.careers.getResumeUrl(
                                      selectedApplication.id
                                    );
                                  if (response.url) {
                                    window.open(response.url, "_blank");
                                  }
                                } catch (error: any) {
                                  toast.error(
                                    error.error || "Failed to load resume"
                                  );
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  // Get signed URL for download
                                  const response =
                                    await publicAdminApi.careers.getResumeUrl(
                                      selectedApplication.id
                                    );
                                  if (response.url) {
                                    const link = document.createElement("a");
                                    link.href = response.url;
                                    link.download =
                                      selectedApplication.resumeUrl
                                        .split("/")
                                        .pop() || "resume.pdf";
                                    link.target = "_blank";
                                    link.click();
                                  }
                                } catch (error: any) {
                                  toast.error(
                                    error.error || "Failed to download resume"
                                  );
                                }
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No resume attached
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Cover Letter */}
                {(selectedApplication.coverLetter ||
                  selectedApplication.coverLetterUrl) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Cover Letter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Cover Letter File */}
                        {selectedApplication.coverLetterUrl ? (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                <FileText className="h-7 w-7 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Cover Letter File
                                </p>
                                <p className="text-sm text-gray-600">
                                  {selectedApplication.coverLetterUrl.includes(
                                    "/"
                                  )
                                    ? selectedApplication.coverLetterUrl
                                        .split("/")
                                        .pop()
                                    : selectedApplication.coverLetterUrl}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  Stored in DigitalOcean Spaces
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Get signed URL for viewing
                                    const response =
                                      await publicAdminApi.careers.getCoverLetterUrl(
                                        selectedApplication.id
                                      );
                                    if (response.url) {
                                      window.open(response.url, "_blank");
                                    }
                                  } catch (error: any) {
                                    toast.error(
                                      error.error ||
                                        "Failed to load cover letter"
                                    );
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Get signed URL for download
                                    const response =
                                      await publicAdminApi.careers.getCoverLetterUrl(
                                        selectedApplication.id
                                      );
                                    if (response.url) {
                                      const link = document.createElement("a");
                                      link.href = response.url;
                                      link.download =
                                        selectedApplication.coverLetterUrl
                                          .split("/")
                                          .pop() || "cover-letter.pdf";
                                      link.target = "_blank";
                                      link.click();
                                    }
                                  } catch (error: any) {
                                    toast.error(
                                      error.error ||
                                        "Failed to download cover letter"
                                    );
                                  }
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {/* Text Cover Letter */}
                        {selectedApplication.coverLetter && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Text Cover Letter:
                            </p>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {selectedApplication.coverLetter}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Application Status Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Status Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Application Status</Label>
                        <Select
                          value={selectedApplication.status}
                          onValueChange={(value) => {
                            handleUpdateApplicationStatus(
                              selectedApplication.id,
                              value
                            );
                            setSelectedApplication({
                              ...selectedApplication,
                              status: value,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                Pending
                              </div>
                            </SelectItem>
                            <SelectItem value="reviewing">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-blue-600" />
                                Reviewing
                              </div>
                            </SelectItem>
                            <SelectItem value="shortlisted">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Shortlisted
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Rejected
                              </div>
                            </SelectItem>
                            <SelectItem value="hired">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Hired
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedApplication.notes && (
                        <div>
                          <Label>Admin Notes</Label>
                          <div className="mt-2 p-3 bg-yellow-50 rounded-lg text-sm">
                            {selectedApplication.notes}
                          </div>
                        </div>
                      )}
                      {selectedApplication.reviewedAt && (
                        <div className="text-xs text-gray-500">
                          Reviewed on:{" "}
                          {new Date(
                            selectedApplication.reviewedAt
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setApplicationDetailOpen(false);
                    setSelectedApplication(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPostingForApplications) {
                      loadApplications(selectedPostingForApplications.id);
                    }
                    setApplicationDetailOpen(false);
                    setSelectedApplication(null);
                  }}
                >
                  Refresh List
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Career Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{postingToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPostingToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
