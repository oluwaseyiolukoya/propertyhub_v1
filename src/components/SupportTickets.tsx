import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { NewTicketPage } from "./NewTicketPage";
import {
  MessageSquare,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  FileText,
  Send,
  Reply,
  Forward,
  Archive,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  Star,
  StarOff,
  Paperclip,
  Flag,
  XCircle,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Headphones,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Shield,
  Settings,
  Bell,
  BellOff,
  Smartphone,
  Globe,
  Building2,
  CreditCard,
  Home,
  Wrench,
  Key,
  Database,
  Server,
  Network,
  Activity,
} from "lucide-react";

export function SupportTickets() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [showNewTicketPage, setShowNewTicketPage] = useState(false);

  // Mock support ticket data
  const supportMetrics = {
    totalTickets: 342,
    openTickets: 45,
    inProgressTickets: 23,
    resolvedToday: 28,
    avgResponseTime: 2.4,
    avgResolutionTime: 18.6,
    customerSatisfaction: 4.6,
    slaCompliance: 94.2,
    escalatedTickets: 8,
    overdueTickets: 3,
  };

  const tickets = [
    {
      id: "TK-2024-001",
      title: "Payment processing error for recurring charges",
      customer: "Urban Living Properties",
      customerEmail: "sarah@urbanliving.com",
      status: "open",
      priority: "high",
      category: "billing",
      assignedTo: "Alex Thompson",
      created: "2024-03-21T10:30:00Z",
      lastUpdate: "2024-03-21T14:20:00Z",
      description:
        "Customer experiencing issues with automatic rent collection. Payment gateway returning error code 502.",
      tags: ["payment-gateway", "recurring-billing", "urgent"],
      slaStatus: "within",
      timeToResolve: "4h 30m remaining",
      attachments: 2,
      communications: 5,
    },
    {
      id: "TK-2024-002",
      title: "Unable to add new tenant to property",
      customer: "Metro Properties LLC",
      customerEmail: "michael@metroproperties.com",
      status: "in-progress",
      priority: "medium",
      category: "tenant-management",
      assignedTo: "Sarah Kim",
      created: "2024-03-21T08:15:00Z",
      lastUpdate: "2024-03-21T15:45:00Z",
      description:
        "Property manager cannot add new tenant. Form validation is showing unknown error.",
      tags: ["tenant-form", "validation-error"],
      slaStatus: "within",
      timeToResolve: "2h 15m remaining",
      attachments: 1,
      communications: 8,
    },
    {
      id: "TK-2024-003",
      title: "Mobile app crashes when viewing maintenance requests",
      customer: "Sunset Apartments",
      customerEmail: "jessica@sunsetapts.com",
      status: "escalated",
      priority: "high",
      category: "mobile-app",
      assignedTo: "Mike Rodriguez",
      created: "2024-03-20T16:20:00Z",
      lastUpdate: "2024-03-21T09:10:00Z",
      description:
        "Tenant mobile app consistently crashes when trying to view or submit maintenance requests.",
      tags: ["mobile-crash", "maintenance-module", "ios"],
      slaStatus: "approaching",
      timeToResolve: "1h 20m remaining",
      attachments: 3,
      communications: 12,
    },
    {
      id: "TK-2024-004",
      title: "Feature request: Bulk tenant communication",
      customer: "Riverside Management",
      customerEmail: "admin@riverside.com",
      status: "open",
      priority: "low",
      category: "feature-request",
      assignedTo: "Emma Wilson",
      created: "2024-03-21T12:00:00Z",
      lastUpdate: "2024-03-21T12:00:00Z",
      description:
        "Request for ability to send bulk messages to all tenants in a property or across multiple properties.",
      tags: ["feature-request", "communication", "enhancement"],
      slaStatus: "within",
      timeToResolve: "72h remaining",
      attachments: 0,
      communications: 1,
    },
    {
      id: "TK-2024-005",
      title: "Access control integration not syncing",
      customer: "Downtown Developments",
      customerEmail: "it@downtown.com",
      status: "resolved",
      priority: "medium",
      category: "integrations",
      assignedTo: "David Chen",
      created: "2024-03-19T14:30:00Z",
      lastUpdate: "2024-03-21T11:30:00Z",
      description:
        "Kisi access control system not receiving tenant access updates from Contrezz.",
      tags: ["kisi-integration", "access-control", "sync-issue"],
      slaStatus: "resolved",
      timeToResolve: "Resolved",
      attachments: 2,
      communications: 15,
    },
  ];

  const knowledgeBase = [
    {
      id: 1,
      title: "How to set up payment processing",
      category: "billing",
      views: 1247,
      helpful: 156,
      lastUpdated: "2024-03-15",
      content: "Step-by-step guide to configure Stripe payment processing...",
    },
    {
      id: 2,
      title: "Tenant onboarding best practices",
      category: "tenant-management",
      views: 892,
      helpful: 203,
      lastUpdated: "2024-03-18",
      content: "Complete guide to efficiently onboard new tenants...",
    },
    {
      id: 3,
      title: "Mobile app troubleshooting guide",
      category: "mobile-app",
      views: 634,
      helpful: 89,
      lastUpdated: "2024-03-20",
      content: "Common mobile app issues and their solutions...",
    },
    {
      id: 4,
      title: "Access control system integration",
      category: "integrations",
      views: 423,
      helpful: 67,
      lastUpdated: "2024-03-12",
      content:
        "How to integrate with Kisi, Brivo, and other access control systems...",
    },
  ];

  const supportTeam = [
    {
      id: 1,
      name: "Alex Thompson",
      role: "Senior Support Engineer",
      avatar: "AT",
      activeTickets: 8,
      resolvedToday: 5,
      avgResponseTime: 1.8,
      status: "online",
      specialties: ["billing", "integrations"],
    },
    {
      id: 2,
      name: "Sarah Kim",
      role: "Support Specialist",
      avatar: "SK",
      activeTickets: 6,
      resolvedToday: 7,
      avgResponseTime: 2.1,
      status: "online",
      specialties: ["tenant-management", "property-management"],
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      role: "Technical Support Lead",
      avatar: "MR",
      activeTickets: 4,
      resolvedToday: 3,
      avgResponseTime: 3.2,
      status: "busy",
      specialties: ["mobile-app", "technical-issues"],
    },
    {
      id: 4,
      name: "Emma Wilson",
      role: "Customer Success Manager",
      avatar: "EW",
      activeTickets: 12,
      resolvedToday: 4,
      avgResponseTime: 2.8,
      status: "online",
      specialties: ["feature-requests", "customer-success"],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "in-progress":
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case "escalated":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-yellow-600";
      case "in-progress":
        return "text-blue-600";
      case "escalated":
        return "text-red-600";
      case "resolved":
        return "text-green-600";
      case "closed":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return "secondary";
      case "in-progress":
        return "default";
      case "escalated":
        return "destructive";
      case "resolved":
        return "default";
      case "closed":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSlaStatusColor = (slaStatus: string) => {
    switch (slaStatus) {
      case "within":
        return "text-green-600";
      case "approaching":
        return "text-yellow-600";
      case "breached":
        return "text-red-600";
      case "resolved":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "billing":
        return <CreditCard className="h-4 w-4" />;
      case "tenant-management":
        return <Users className="h-4 w-4" />;
      case "property-management":
        return <Building2 className="h-4 w-4" />;
      case "mobile-app":
        return <Smartphone className="h-4 w-4" />;
      case "integrations":
        return <Network className="h-4 w-4" />;
      case "feature-request":
        return <Star className="h-4 w-4" />;
      case "technical-issues":
        return <Wrench className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesCategory =
      categoryFilter === "all" || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleTicketAction = (action: string, ticketId: string) => {
    switch (action) {
      case "assign":
        toast.success(`Ticket ${ticketId} assigned successfully`);
        break;
      case "escalate":
        toast.success(`Ticket ${ticketId} escalated to senior support`);
        break;
      case "resolve":
        toast.success(`Ticket ${ticketId} marked as resolved`);
        break;
      case "close":
        toast.success(`Ticket ${ticketId} closed`);
        break;
      default:
        break;
    }
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      toast.success("Reply sent successfully");
      setReplyText("");
    }
  };

  const handleNewTicketSuccess = (ticketId: string) => {
    setShowNewTicketPage(false);
    setActiveTab("tickets");
    toast.success(`Ticket ${ticketId} created successfully!`);
  };

  // Show New Ticket Page
  if (showNewTicketPage) {
    return (
      <NewTicketPage
        onBack={() => setShowNewTicketPage(false)}
        onSuccess={handleNewTicketSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Animated Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Headphones className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <MessageSquare className="h-16 w-16 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Headphones className="h-8 w-8" />
                Support Tickets
              </h2>
              <p className="text-purple-100 text-lg">
                Manage customer support and service requests
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowNewTicketPage(true)}
                className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 rounded-t-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 h-auto bg-transparent p-2 gap-2">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Active Tickets</span>
            </TabsTrigger>
            <TabsTrigger
              value="management"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Team</span>
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Knowledge Base</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0 p-6">
            {/* Support Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Open Tickets
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {supportMetrics.openTickets}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {supportMetrics.escalatedTickets} escalated
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Avg Response Time
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {supportMetrics.avgResponseTime}h
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      -15% from last month
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Customer Satisfaction
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      {supportMetrics.customerSatisfaction}/5
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      +0.2 from last month
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      SLA Compliance
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {supportMetrics.slaCompliance}%
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {supportMetrics.overdueTickets} overdue tickets
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Ticket Status Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Ticket Status Distribution
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Current ticket status breakdown
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span>Open</span>
                      </div>
                      <span className="font-medium">
                        {supportMetrics.openTickets}
                      </span>
                    </div>
                    <Progress
                      value={
                        (supportMetrics.openTickets /
                          supportMetrics.totalTickets) *
                        100
                      }
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="h-4 w-4 text-blue-600" />
                        <span>In Progress</span>
                      </div>
                      <span className="font-medium">
                        {supportMetrics.inProgressTickets}
                      </span>
                    </div>
                    <Progress
                      value={
                        (supportMetrics.inProgressTickets /
                          supportMetrics.totalTickets) *
                        100
                      }
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span>Escalated</span>
                      </div>
                      <span className="font-medium">
                        {supportMetrics.escalatedTickets}
                      </span>
                    </div>
                    <Progress
                      value={
                        (supportMetrics.escalatedTickets /
                          supportMetrics.totalTickets) *
                        100
                      }
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Resolved Today</span>
                      </div>
                      <span className="font-medium">
                        {supportMetrics.resolvedToday}
                      </span>
                    </div>
                    <Progress
                      value={(supportMetrics.resolvedToday / 50) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Recent Activity
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Latest support ticket updates
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent>
                  <div className="space-y-4">
                    {tickets.slice(0, 5).map((ticket, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 border rounded-lg"
                      >
                        {getStatusIcon(ticket.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">
                              {ticket.title}
                            </h4>
                            <Badge
                              variant={getStatusBadge(ticket.status)}
                              className="text-xs"
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {ticket.customer}
                          </p>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                            <span>{ticket.id}</span>
                            <span>•</span>
                            <span>
                              {new Date(ticket.lastUpdate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Support Performance Metrics
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Key performance indicators for support team
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {supportMetrics.totalTickets}
                    </div>
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="text-xs text-green-600 mt-1">
                      +12% this month
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {supportMetrics.avgResolutionTime}h
                    </div>
                    <p className="text-sm text-gray-600">Avg Resolution Time</p>
                    <p className="text-xs text-green-600 mt-1">
                      -8% improvement
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {supportMetrics.slaCompliance}%
                    </div>
                    <p className="text-sm text-gray-600">SLA Compliance</p>
                    <p className="text-xs text-green-600 mt-1">
                      +3% this month
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {supportMetrics.customerSatisfaction}
                    </div>
                    <p className="text-sm text-gray-600">Customer Rating</p>
                    <p className="text-xs text-green-600 mt-1">
                      +0.3 this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6 mt-0 p-6">
            {/* Filters and Search */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                      <Filter className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Ticket Filters</CardTitle>
                      <CardDescription className="mt-1">
                        Filter and search support tickets
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="tenant-management">
                        Tenant Management
                      </SelectItem>
                      <SelectItem value="mobile-app">Mobile App</SelectItem>
                      <SelectItem value="integrations">Integrations</SelectItem>
                      <SelectItem value="feature-request">
                        Feature Request
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                      setCategoryFilter("all");
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Support Tickets</CardTitle>
                      <CardDescription className="mt-1">
                        Manage and track customer support requests (
                        {filteredTickets.length} tickets)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
                        <TableHead className="font-semibold text-gray-900">
                          Ticket ID
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Title
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Customer
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Priority
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Category
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Assigned To
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          SLA
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-blue-50/50 transition-colors duration-200"
                        >
                          <TableCell className="font-medium">
                            {ticket.id}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="font-medium text-sm truncate">
                                {ticket.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {ticket.attachments > 0 && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{ticket.attachments}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{ticket.communications}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {ticket.customer}
                              </p>
                              <p className="text-xs text-gray-600">
                                {ticket.customerEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(ticket.status)}
                              <Badge variant={getStatusBadge(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadge(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(ticket.category)}
                              <span className="text-sm">{ticket.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>{ticket.assignedTo}</TableCell>
                          <TableCell>
                            <div
                              className={`text-sm ${getSlaStatusColor(
                                ticket.slaStatus
                              )}`}
                            >
                              {ticket.timeToResolve}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-blue-50"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => setSelectedTicket(ticket)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Ticket
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTicketAction("assign", ticket.id)
                                  }
                                  className="cursor-pointer"
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  Reassign
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTicketAction("escalate", ticket.id)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Flag className="mr-2 h-4 w-4" />
                                  Escalate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTicketAction("resolve", ticket.id)
                                  }
                                  className="cursor-pointer"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            {/* Ticket Detail View */}
            {selectedTicket ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedTicket.title}</CardTitle>
                          <CardDescription>
                            Ticket {selectedTicket.id}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={getStatusBadge(selectedTicket.status)}
                          >
                            {selectedTicket.status}
                          </Badge>
                          <Badge
                            variant={getPriorityBadge(selectedTicket.priority)}
                          >
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-700">
                          {selectedTicket.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Created:{" "}
                              {new Date(
                                selectedTicket.created
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              Updated:{" "}
                              {new Date(
                                selectedTicket.lastUpdate
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {selectedTicket.tags.map(
                            (tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Communication History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication History</CardTitle>
                      <CardDescription>
                        All interactions for this ticket
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Mock communication entries */}
                        <div className="border-l-2 border-blue-200 pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Initial Request</h4>
                            <span className="text-sm text-gray-500">
                              2 hours ago
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Customer reported payment processing issues with
                            recurring charges.
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">Customer</Badge>
                            <span className="text-xs text-gray-500">
                              {selectedTicket.customerEmail}
                            </span>
                          </div>
                        </div>

                        <div className="border-l-2 border-green-200 pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Support Response</h4>
                            <span className="text-sm text-gray-500">
                              1 hour ago
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Thank you for contacting us. I'm investigating the
                            payment gateway issue you've reported.
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">Support</Badge>
                            <span className="text-xs text-gray-500">
                              {selectedTicket.assignedTo}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reply Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Reply to Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Type your response here..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={6}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Paperclip className="h-4 w-4 mr-2" />
                              Attach File
                            </Button>
                            <Button variant="outline" size="sm">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Use Template
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" onClick={handleSendReply}>
                              <Reply className="h-4 w-4 mr-2" />
                              Reply
                            </Button>
                            <Button onClick={handleSendReply}>
                              <Send className="h-4 w-4 mr-2" />
                              Send & Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ticket Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Select defaultValue={selectedTicket.status}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Priority</Label>
                        <Select defaultValue={selectedTicket.priority}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Assigned To
                        </Label>
                        <Select defaultValue={selectedTicket.assignedTo}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {supportTeam.map((member) => (
                              <SelectItem key={member.id} value={member.name}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <Select defaultValue={selectedTicket.category}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="tenant-management">
                              Tenant Management
                            </SelectItem>
                            <SelectItem value="mobile-app">
                              Mobile App
                            </SelectItem>
                            <SelectItem value="integrations">
                              Integrations
                            </SelectItem>
                            <SelectItem value="feature-request">
                              Feature Request
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() =>
                          toast.success("Ticket updated successfully")
                        }
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Update Ticket
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {selectedTicket.customer}
                          </p>
                          <p className="text-sm text-gray-600">Customer</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {selectedTicket.customerEmail}
                          </p>
                          <p className="text-sm text-gray-600">Email</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {selectedTicket.timeToResolve}
                          </p>
                          <p className="text-sm text-gray-600">SLA Status</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        View Customer Profile
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  Select a Ticket
                </h3>
                <p className="text-gray-600">
                  Choose a ticket from the Active Tickets tab to view details
                  and manage it here.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-6 mt-0 p-6">
            {/* Support Team Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Team Members
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {supportTeam.length}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Active support agents
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Active Tickets
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {supportTeam.reduce(
                        (sum, member) => sum + member.activeTickets,
                        0
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Total assigned tickets
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Resolved Today
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {supportTeam.reduce(
                        (sum, member) => sum + member.resolvedToday,
                        0
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Tickets resolved today
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Avg Response Time
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {(
                        supportTeam.reduce(
                          (sum, member) => sum + member.avgResponseTime,
                          0
                        ) / supportTeam.length
                      ).toFixed(1)}
                      h
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Team average</p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Team Members */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Support Team Members
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Manage support team workload and performance
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {supportTeam.map((member) => (
                    <div
                      key={member.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-medium text-lg">
                              {member.avatar}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {member.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {member.role}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  member.status === "online"
                                    ? "bg-green-500"
                                    : member.status === "busy"
                                    ? "bg-yellow-500"
                                    : "bg-gray-500"
                                }`}
                              />
                              <span className="text-xs text-gray-600 capitalize">
                                {member.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="font-bold text-lg text-blue-600">
                              {member.activeTickets}
                            </div>
                            <div className="text-xs text-gray-600">
                              Active Tickets
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="font-bold text-lg text-green-600">
                              {member.resolvedToday}
                            </div>
                            <div className="text-xs text-gray-600">
                              Resolved Today
                            </div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="font-bold text-lg text-purple-600">
                              {member.avgResponseTime}h
                            </div>
                            <div className="text-xs text-gray-600">
                              Avg Response
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Performance
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Assign Ticket
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Specialties:
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.specialties.map((specialty, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs border-blue-200 text-blue-700 bg-blue-50"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Performance */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Team Workload Distribution
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Current ticket assignment across team members
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  {supportTeam.map((member) => (
                    <div key={member.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {member.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {member.activeTickets} tickets
                        </span>
                      </div>
                      <Progress
                        value={(member.activeTickets / 15) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Team Settings</CardTitle>
                        <CardDescription className="mt-1">
                          Configure support team settings and preferences
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                    <Label htmlFor="auto-assign" className="text-gray-700">
                      Auto-assign new tickets
                    </Label>
                    <Switch id="auto-assign" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                    <Label htmlFor="escalation" className="text-gray-700">
                      Enable auto-escalation
                    </Label>
                    <Switch id="escalation" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                    <Label htmlFor="notifications" className="text-gray-700">
                      Team notifications
                    </Label>
                    <Switch id="notifications" defaultChecked />
                  </div>

                  <div>
                    <Label
                      htmlFor="escalation-time"
                      className="text-gray-700 font-medium"
                    >
                      Escalation timeout (hours)
                    </Label>
                    <Select defaultValue="24">
                      <SelectTrigger className="mt-2 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                    onClick={() =>
                      toast.success("Team settings saved successfully")
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Save Team Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6 mt-0 p-6">
            {/* Knowledge Base Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Total Articles
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {knowledgeBase.length}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Knowledge base articles
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Total Views
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {knowledgeBase.reduce(
                        (sum, article) => sum + article.views,
                        0
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Article views this month
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Helpful Votes
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      {knowledgeBase.reduce(
                        (sum, article) => sum + article.helpful,
                        0
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Positive feedback
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Avg Rating
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      4.7/5
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Article helpfulness
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Knowledge Base Articles */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Knowledge Base Articles
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Manage help documentation and FAQs
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search articles..."
                        className="max-w-sm pl-10 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      New Article
                    </Button>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
                          <TableHead className="font-semibold text-gray-900">
                            Title
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Category
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Views
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Helpful Votes
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Last Updated
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {knowledgeBase.map((article) => (
                          <TableRow
                            key={article.id}
                            className="hover:bg-blue-50/50 transition-colors duration-200"
                          >
                            <TableCell>
                              <div className="font-medium text-gray-900">
                                {article.title}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(article.category)}
                                <span className="capitalize text-gray-700">
                                  {article.category}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {article.views.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-gray-700">
                                  {article.helpful}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {article.lastUpdated}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions and Templates */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Quick Response Templates
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Pre-defined responses for common issues
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <h4 className="font-medium text-gray-900">
                      Payment Issue Response
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Standard response for payment processing issues
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Use Template
                    </Button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <h4 className="font-medium text-gray-900">
                      Account Access Help
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Template for login and access related issues
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Use Template
                    </Button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <h4 className="font-medium text-gray-900">
                      Feature Request Acknowledgment
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Response for new feature requests
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Use Template
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Common Issues</CardTitle>
                        <CardDescription className="mt-1">
                          Most frequently reported issues
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        Payment processing errors
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 border-orange-200"
                    >
                      23 tickets
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        Tenant management issues
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 border-orange-200"
                    >
                      18 tickets
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                        <Smartphone className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        Mobile app problems
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 border-orange-200"
                    >
                      15 tickets
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                        <Network className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        Integration sync issues
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 border-orange-200"
                    >
                      12 tickets
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 mt-0 p-6">
            {/* Report Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Resolution Rate
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      92.3%
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      +5.2% from last month
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      First Response Time
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      1.8h
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      -0.3h improvement
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Escalation Rate
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      8.5%
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      -2.1% from last month
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Reopened Tickets
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <RefreshCw className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      3.2%
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      -0.8% improvement
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Support Analytics */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <LineChart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Ticket Volume Trends
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Monthly ticket creation and resolution patterns
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          342
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Total Tickets
                        </div>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                        <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          315
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Resolved
                        </div>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:shadow-md transition-all duration-200 bg-white">
                        <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                          27
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Pending
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Category Breakdown
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Support requests by category
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Billing
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-3/5 h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          34%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Tenant Management
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-1/2 h-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          26%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                          <Smartphone className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Mobile App
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-2/5 h-2 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          22%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                          <Network className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Integrations
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div className="w-1/5 h-2 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          18%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Support Reports</CardTitle>
                      <CardDescription className="mt-1">
                        Generate and export detailed support analytics
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg w-fit mx-auto mb-3">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">
                      Performance Report
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Team and individual performance metrics
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg w-fit mx-auto mb-3">
                      <PieChart className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">
                      Category Analysis
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Ticket distribution by category and priority
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg w-fit mx-auto mb-3">
                      <LineChart className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">
                      Trend Analysis
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Historical trends and forecasting
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SLA Performance */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">SLA Performance</CardTitle>
                      <CardDescription className="mt-1">
                        Service level agreement compliance tracking
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        94.2%
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Overall Compliance
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        +2.3% this month
                      </p>
                    </div>

                    <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        2.4h
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Avg Response Time
                      </p>
                      <p className="text-xs text-green-600 mt-1">Target: 4h</p>
                    </div>

                    <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                        18.6h
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Avg Resolution Time
                      </p>
                      <p className="text-xs text-green-600 mt-1">Target: 24h</p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <span className="text-sm font-medium text-gray-900">
                        High Priority Response
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={96} className="w-24 h-2" />
                        <span className="text-sm font-medium text-gray-700">
                          96%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <span className="text-sm font-medium text-gray-900">
                        Medium Priority Response
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={94} className="w-24 h-2" />
                        <span className="text-sm font-medium text-gray-700">
                          94%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <span className="text-sm font-medium text-gray-900">
                        Low Priority Response
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={92} className="w-24 h-2" />
                        <span className="text-sm font-medium text-gray-700">
                          92%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
