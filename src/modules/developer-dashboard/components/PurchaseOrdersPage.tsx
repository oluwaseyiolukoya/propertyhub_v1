import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Search,
  Filter,
  FileText,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Paperclip,
  Upload,
  Plus,
  MoreVertical,
  Calendar,
  DollarSign
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { KPICard } from "./KPICard";

interface PurchaseOrder {
  id: string;
  vendor: string;
  amount: number;
  status: "Approved" | "Pending" | "Matched" | "Rejected";
  date: string;
  items: number;
  description?: string;
  budgetLine?: string;
}

interface Invoice {
  id: string;
  poRef: string;
  vendor: string;
  amount: number;
  status: "Approved" | "Pending" | "Matched" | "Rejected";
  date: string;
  budgetLine: string;
  attachments: number;
  description?: string;
  approvalSteps?: {
    step: string;
    status: "completed" | "pending" | "not-started";
    completedBy?: string;
  }[];
}

export const PurchaseOrdersPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API calls
  useEffect(() => {
    const mockPOs: PurchaseOrder[] = [
      {
        id: "PO-2025-001",
        vendor: "ABC Construction",
        amount: 125000,
        status: "Approved",
        date: "2025-11-01",
        items: 3,
        description: "Foundation and structural materials",
        budgetLine: "Foundation & Structure"
      },
      {
        id: "PO-2025-002",
        vendor: "XYZ Electrical",
        amount: 78500,
        status: "Pending",
        date: "2025-11-03",
        items: 5,
        description: "Electrical wiring and fixtures",
        budgetLine: "MEP Systems"
      },
      {
        id: "PO-2025-003",
        vendor: "BuildRight Materials",
        amount: 245000,
        status: "Approved",
        date: "2025-11-05",
        items: 12,
        description: "Bulk construction materials",
        budgetLine: "Foundation & Structure"
      },
      {
        id: "PO-2025-004",
        vendor: "ProPlumbing Inc",
        amount: 92000,
        status: "Matched",
        date: "2025-11-06",
        items: 4,
        description: "Plumbing systems and fixtures",
        budgetLine: "MEP Systems"
      },
      {
        id: "PO-2025-005",
        vendor: "Elite Finishing",
        amount: 168000,
        status: "Pending",
        date: "2025-11-08",
        items: 7,
        description: "Interior finishing materials",
        budgetLine: "Finishes & Fixtures"
      },
    ];

    const mockInvoices: Invoice[] = [
      {
        id: "INV-1234",
        poRef: "PO-2025-001",
        vendor: "ABC Construction",
        amount: 45000,
        status: "Approved",
        date: "2025-11-08",
        budgetLine: "Foundation & Structure",
        attachments: 2,
        description: "First phase foundation work",
        approvalSteps: [
          { step: "Budget Verification", status: "completed", completedBy: "John Davis" },
          { step: "Manager Review", status: "completed", completedBy: "Sarah Johnson" },
          { step: "Final Approval", status: "completed", completedBy: "Michael Chen" }
        ]
      },
      {
        id: "INV-1235",
        poRef: "PO-2025-002",
        vendor: "XYZ Electrical",
        amount: 32500,
        status: "Pending",
        date: "2025-11-09",
        budgetLine: "MEP Systems",
        attachments: 1,
        description: "Initial electrical installation",
        approvalSteps: [
          { step: "Budget Verification", status: "completed", completedBy: "John Davis" },
          { step: "Manager Review", status: "pending" },
          { step: "Final Approval", status: "not-started" }
        ]
      },
      {
        id: "INV-1236",
        poRef: "PO-2025-003",
        vendor: "BuildRight Materials",
        amount: 58900,
        status: "Matched",
        date: "2025-11-09",
        budgetLine: "Foundation & Structure",
        attachments: 3,
        description: "Material delivery - Phase 1",
        approvalSteps: [
          { step: "Budget Verification", status: "completed", completedBy: "John Davis" },
          { step: "Manager Review", status: "completed", completedBy: "Sarah Johnson" },
          { step: "Final Approval", status: "pending" }
        ]
      },
      {
        id: "INV-1237",
        poRef: "PO-2025-004",
        vendor: "ProPlumbing Inc",
        amount: 28000,
        status: "Matched",
        date: "2025-11-10",
        budgetLine: "MEP Systems",
        attachments: 2,
        description: "Plumbing rough-in",
        approvalSteps: [
          { step: "Budget Verification", status: "completed", completedBy: "John Davis" },
          { step: "Manager Review", status: "completed", completedBy: "Sarah Johnson" },
          { step: "Final Approval", status: "completed", completedBy: "Michael Chen" }
        ]
      },
    ];

    setPurchaseOrders(mockPOs);
    setInvoices(mockInvoices);
    setSelectedPO(mockPOs[0]);
    setLoading(false);
  }, [projectId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "Matched":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
            <CheckCircle className="w-3 h-3" />
            Matched
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const relatedInvoices = selectedPO
    ? invoices.filter(inv => inv.poRef === selectedPO.id)
    : [];

  // Calculate KPIs
  const totalPOValue = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
  const approvedPOs = purchaseOrders.filter(po => po.status === "Approved").length;
  const pendingPOs = purchaseOrders.filter(po => po.status === "Pending").length;
  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  const handleApprovePO = (poId: string) => {
    setPurchaseOrders(prev => prev.map(po =>
      po.id === poId ? { ...po, status: "Approved" as const } : po
    ));
  };

  const handleApproveInvoice = (invId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invId ? { ...inv, status: "Approved" as const } : inv
    ));
  };

  const handleMatchInvoice = (invId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invId ? { ...inv, status: "Matched" as const } : inv
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading purchase orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Orders & Invoices</h1>
          <p className="text-gray-600">Manage purchase orders and track invoice approvals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreatePOOpen(true)} className="gap-2 bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4" />
            New PO
          </Button>
          <Button onClick={() => setIsCreateInvoiceOpen(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total PO Value"
          value={formatCurrency(totalPOValue)}
          icon={DollarSign}
        />
        <KPICard
          title="Approved POs"
          value={approvedPOs.toString()}
          subtitle={`of ${purchaseOrders.length} total`}
          icon={CheckCircle}
        />
        <KPICard
          title="Pending Approval"
          value={pendingPOs.toString()}
          subtitle="requires action"
          icon={Clock}
        />
        <KPICard
          title="Total Invoiced"
          value={formatCurrency(totalInvoiceValue)}
          subtitle={`${invoices.length} invoices`}
          icon={FileText}
        />
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane - PO List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
            <div className="pt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search POs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 px-6 pb-6">
                {filteredPOs.map((po) => (
                  <div
                    key={po.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPO?.id === po.id ? 'bg-orange-50 border-orange-300 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPO(po)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-gray-900">{po.id}</span>
                      {getStatusBadge(po.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">{po.vendor}</p>
                    {po.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{po.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{formatCurrency(po.amount)}</span>
                      <span className="text-sm text-gray-500">{po.items} items</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(po.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {filteredPOs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No purchase orders found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Pane - Invoice Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Related Invoices</CardTitle>
                {selectedPO && (
                  <p className="text-sm text-gray-500 mt-1">
                    For {selectedPO.id} - {selectedPO.vendor}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {relatedInvoices.map((invoice) => (
                  <Card
                    key={invoice.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedInvoice?.id === invoice.id ? 'ring-2 ring-orange-500' : ''
                    }`}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold text-gray-900">{invoice.id}</span>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-gray-600 font-medium">{invoice.vendor}</p>
                          {invoice.description && (
                            <p className="text-sm text-gray-500 mt-1">{invoice.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900 mb-1">{formatCurrency(invoice.amount)}</p>
                          <p className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">PO Reference</p>
                          <p className="text-sm font-medium text-gray-900">{invoice.poRef}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Budget Line</p>
                          <p className="text-sm font-medium text-gray-900">{invoice.budgetLine}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-900">
                            Attachments ({invoice.attachments})
                          </p>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Upload className="w-3 h-3" />
                            Upload
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {Array.from({ length: invoice.attachments }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <span className="text-sm flex-1">
                                {idx === 0 ? `invoice_${invoice.id}.pdf` : `supporting_docs_${idx}.pdf`}
                              </span>
                              <Button variant="ghost" size="sm">View</Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-3">Approval Workflow</p>
                        <div className="space-y-3">
                          {invoice.approvalSteps?.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              {step.status === "completed" && (
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                              )}
                              {step.status === "pending" && (
                                <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                              )}
                              {step.status === "not-started" && (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5"></div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{step.step}</p>
                                <p className="text-xs text-gray-500">
                                  {step.status === "completed" && step.completedBy
                                    ? `Completed by ${step.completedBy}`
                                    : step.status === "pending"
                                    ? "Pending approval"
                                    : "Not started"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        {invoice.status === "Pending" && (
                          <>
                            <Button
                              className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveInvoice(invoice.id);
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInvoices(prev => prev.map(inv =>
                                  inv.id === invoice.id ? { ...inv, status: "Rejected" as const } : inv
                                ));
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {invoice.status !== "Matched" && invoice.status !== "Rejected" && (
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMatchInvoice(invoice.id);
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Match to Budget
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {relatedInvoices.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2">No invoices found for this purchase order</p>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsCreateInvoiceOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Create Invoice
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create PO Dialog */}
      <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="po-vendor">Vendor</Label>
                <Input id="po-vendor" placeholder="Select or enter vendor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-amount">Amount</Label>
                <Input id="po-amount" type="number" placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-budget-line">Budget Line</Label>
              <Select>
                <SelectTrigger id="po-budget-line">
                  <SelectValue placeholder="Select budget line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundation">Foundation & Structure</SelectItem>
                  <SelectItem value="mep">MEP Systems</SelectItem>
                  <SelectItem value="finishes">Finishes & Fixtures</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-description">Description</Label>
              <Textarea
                id="po-description"
                placeholder="Enter purchase order description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-items">Number of Items</Label>
              <Input id="po-items" type="number" placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePOOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsCreatePOOpen(false)}>
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice linked to a purchase order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inv-po">Purchase Order</Label>
              <Select>
                <SelectTrigger id="inv-po">
                  <SelectValue placeholder="Select purchase order" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map(po => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.id} - {po.vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-amount">Amount</Label>
                <Input id="inv-amount" type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-date">Invoice Date</Label>
                <Input id="inv-date" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-description">Description</Label>
              <Textarea
                id="inv-description"
                placeholder="Enter invoice description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-attachments">Attachments</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" size="sm">
                  Choose Files
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsCreateInvoiceOpen(false)}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

