import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { publicAdminApi } from "../../../lib/api/publicAdminApi";
import { canEditContent } from "../../../lib/utils/adminPermissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function LandingPageList() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPublished, setFilterPublished] = useState<boolean | undefined>(
    undefined
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<LandingPage | null>(null);

  const loadPages = async () => {
    setLoading(true);
    try {
      const response = await publicAdminApi.landingPages.list({
        search: search || undefined,
        published: filterPublished,
      });
      setPages(response.pages || []);
    } catch (error: any) {
      toast.error(error.error || "Failed to load landing pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, [search, filterPublished]);

  const handleDelete = async () => {
    if (!pageToDelete) return;

    try {
      await publicAdminApi.landingPages.delete(pageToDelete.id);
      toast.success("Landing page deleted successfully");
      setDeleteDialogOpen(false);
      setPageToDelete(null);
      loadPages();
    } catch (error: any) {
      toast.error(error.error || "Failed to delete landing page");
    }
  };

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      if (publish) {
        await publicAdminApi.landingPages.publish(id);
        toast.success("Landing page published");
      } else {
        await publicAdminApi.landingPages.unpublish(id);
        toast.success("Landing page unpublished");
      }
      loadPages();
    } catch (error: any) {
      toast.error(error.error || "Failed to update landing page");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Landing Pages</h2>
          <p className="text-gray-500 mt-1">Manage your landing pages</p>
        </div>
        {canEditContent() && (
          <Button
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            onClick={() => {
              // Navigate to create page (will be implemented)
              toast.info("Create page feature coming soon");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterPublished === undefined ? "default" : "outline"}
                onClick={() => setFilterPublished(undefined)}
              >
                All
              </Button>
              <Button
                variant={filterPublished === true ? "default" : "outline"}
                onClick={() => setFilterPublished(true)}
              >
                Published
              </Button>
              <Button
                variant={filterPublished === false ? "default" : "outline"}
                onClick={() => setFilterPublished(false)}
              >
                Drafts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pages ({pages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No landing pages found</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first landing page to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="text-gray-500">{page.slug}</TableCell>
                    <TableCell>
                      <Badge
                        variant={page.published ? "default" : "secondary"}
                        className={
                          page.published
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {page.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(page.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditContent() ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handlePublish(page.id, !page.published)
                              }
                              title={page.published ? "Unpublish" : "Publish"}
                            >
                              {page.published ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
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
                                setPageToDelete(page);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">View only</span>
                        )}
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
            <DialogTitle>Delete Landing Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{pageToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPageToDelete(null);
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
