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

interface CareerPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  remote: string;
  experience: string;
  status: string;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
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
            onClick={() => {
              toast.info("Create posting feature coming soon");
            }}
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
                    <TableCell>{getStatusBadge(posting.status)}</TableCell>
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
                          onClick={() => {
                            toast.info("Edit feature coming soon");
                          }}
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
