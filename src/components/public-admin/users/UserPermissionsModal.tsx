import React, { useState, useEffect } from "react";
import { publicAdminApi, PublicAdmin } from "../../../lib/api/publicAdminApi";
import { Button } from "../../ui/button";
import { X, Shield, Check } from "lucide-react";
import { toast } from "sonner";

interface UserPermissionsModalProps {
  admin: PublicAdmin;
  onClose: () => void;
  onSuccess: () => void;
}

const VALID_PAGES = [
  { id: "dashboard", label: "Dashboard", description: "View dashboard overview" },
  {
    id: "landing-pages",
    label: "Landing Pages",
    description: "Manage landing pages",
  },
  { id: "careers", label: "Careers", description: "Manage career postings" },
  { id: "blog", label: "Blog", description: "Manage blog posts" },
  { id: "forms", label: "Forms", description: "View form submissions" },
  { id: "analytics", label: "Analytics", description: "View analytics" },
  { id: "users", label: "Users", description: "Manage users (admin only)" },
  {
    id: "settings",
    label: "Settings",
    description: "Platform settings (admin only)",
  },
];

export function UserPermissionsModal({
  admin,
  onClose,
  onSuccess,
}: UserPermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [pagePermissions, setPagePermissions] = useState<string[]>([]);
  const [validPages, setValidPages] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadPermissions = async () => {
      // Prevent multiple simultaneous requests
      if (loadingPermissions) return;

      setLoadingPermissions(true);
      try {
        const response = await publicAdminApi.users.getPermissions(admin.id);
        if (isMounted) {
          setPagePermissions(response.pagePermissions || []);
          setValidPages(response.validPages || VALID_PAGES.map((p) => p.id));
        }
      } catch (error: any) {
        // Handle rate limiting gracefully - don't show error toast
        if (error.error === "Too many requests" || error.message === "Too many requests") {
          console.warn("Rate limited while loading permissions, using cached data");
        } else {
          toast.error(error.error || "Failed to load permissions");
        }
        // Fallback to admin's current permissions
        if (isMounted) {
          setPagePermissions(admin.pagePermissions || []);
          setValidPages(VALID_PAGES.map((p) => p.id));
        }
      } finally {
        if (isMounted) {
          setLoadingPermissions(false);
        }
      }
    };

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [admin.id]); // Only depend on admin.id, not the whole admin object

  const handleTogglePermission = (pageId: string) => {
    setPagePermissions((prev) => {
      if (prev.includes(pageId)) {
        return prev.filter((id) => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleSelectAll = () => {
    setPagePermissions([...validPages]);
  };

  const handleDeselectAll = () => {
    setPagePermissions([]);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      await publicAdminApi.users.updatePermissions(admin.id, pagePermissions);
      toast.success("Permissions updated successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.error || "Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  const hasAllPermissions = pagePermissions.length === validPages.length;
  const hasNoPermissions = pagePermissions.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Manage Permissions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {admin.name} ({admin.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select which pages this user can access. If no pages are selected,
              the user will have access to all pages (default behavior).
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={hasAllPermissions}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={hasNoPermissions}
              >
                Deselect All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {VALID_PAGES.map((page) => {
              const isSelected = pagePermissions.includes(page.id);
              const isDisabled =
                (page.id === "users" || page.id === "settings") &&
                admin.role !== "admin";

              return (
                <div
                  key={page.id}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isDisabled && handleTogglePermission(page.id)}
                >
                  <div className="flex items-center h-5">
                    <div
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {page.label}
                      </h3>
                      {isDisabled && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (Admin only)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {page.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {pagePermissions.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No pages selected. User will have access to all pages by default.
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

