import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
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
  Network
} from 'lucide-react';

export function SupportTickets() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
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
    overdueTickets: 3
  };

  const tickets = [
    {
      id: 'TK-2024-001',
      title: 'Payment processing error for recurring charges',
      customer: 'Urban Living Properties',
      customerEmail: 'sarah@urbanliving.com',
      status: 'open',
      priority: 'high',
      category: 'billing',
      assignedTo: 'Alex Thompson',
      created: '2024-03-21T10:30:00Z',
      lastUpdate: '2024-03-21T14:20:00Z',
      description: 'Customer experiencing issues with automatic rent collection. Payment gateway returning error code 502.',
      tags: ['payment-gateway', 'recurring-billing', 'urgent'],
      slaStatus: 'within',
      timeToResolve: '4h 30m remaining',
      attachments: 2,
      communications: 5
    },
    {
      id: 'TK-2024-002',
      title: 'Unable to add new tenant to property',
      customer: 'Metro Properties LLC',
      customerEmail: 'michael@metroproperties.com',
      status: 'in-progress',
      priority: 'medium',
      category: 'tenant-management',
      assignedTo: 'Sarah Kim',
      created: '2024-03-21T08:15:00Z',
      lastUpdate: '2024-03-21T15:45:00Z',
      description: 'Property manager cannot add new tenant. Form validation is showing unknown error.',
      tags: ['tenant-form', 'validation-error'],
      slaStatus: 'within',
      timeToResolve: '2h 15m remaining',
      attachments: 1,
      communications: 8
    },
    {
      id: 'TK-2024-003',
      title: 'Mobile app crashes when viewing maintenance requests',
      customer: 'Sunset Apartments',
      customerEmail: 'jessica@sunsetapts.com',
      status: 'escalated',
      priority: 'high',
      category: 'mobile-app',
      assignedTo: 'Mike Rodriguez',
      created: '2024-03-20T16:20:00Z',
      lastUpdate: '2024-03-21T09:10:00Z',
      description: 'Tenant mobile app consistently crashes when trying to view or submit maintenance requests.',
      tags: ['mobile-crash', 'maintenance-module', 'ios'],
      slaStatus: 'approaching',
      timeToResolve: '1h 20m remaining',
      attachments: 3,
      communications: 12
    },
    {
      id: 'TK-2024-004',
      title: 'Feature request: Bulk tenant communication',
      customer: 'Riverside Management',
      customerEmail: 'admin@riverside.com',
      status: 'open',
      priority: 'low',
      category: 'feature-request',
      assignedTo: 'Emma Wilson',
      created: '2024-03-21T12:00:00Z',
      lastUpdate: '2024-03-21T12:00:00Z',
      description: 'Request for ability to send bulk messages to all tenants in a property or across multiple properties.',
      tags: ['feature-request', 'communication', 'enhancement'],
      slaStatus: 'within',
      timeToResolve: '72h remaining',
      attachments: 0,
      communications: 1
    },
    {
      id: 'TK-2024-005',
      title: 'Access control integration not syncing',
      customer: 'Downtown Developments',
      customerEmail: 'it@downtown.com',
      status: 'resolved',
      priority: 'medium',
      category: 'integrations',
      assignedTo: 'David Chen',
      created: '2024-03-19T14:30:00Z',
      lastUpdate: '2024-03-21T11:30:00Z',
      description: 'Kisi access control system not receiving tenant access updates from PropertyHub.',
      tags: ['kisi-integration', 'access-control', 'sync-issue'],
      slaStatus: 'resolved',
      timeToResolve: 'Resolved',
      attachments: 2,
      communications: 15
    }
  ];

  const knowledgeBase = [
    {
      id: 1,
      title: 'How to set up payment processing',
      category: 'billing',
      views: 1247,
      helpful: 156,
      lastUpdated: '2024-03-15',
      content: 'Step-by-step guide to configure Stripe payment processing...'
    },
    {
      id: 2,
      title: 'Tenant onboarding best practices',
      category: 'tenant-management',
      views: 892,
      helpful: 203,
      lastUpdated: '2024-03-18',
      content: 'Complete guide to efficiently onboard new tenants...'
    },
    {
      id: 3,
      title: 'Mobile app troubleshooting guide',
      category: 'mobile-app',
      views: 634,
      helpful: 89,
      lastUpdated: '2024-03-20',
      content: 'Common mobile app issues and their solutions...'
    },
    {
      id: 4,
      title: 'Access control system integration',
      category: 'integrations',
      views: 423,
      helpful: 67,
      lastUpdated: '2024-03-12',
      content: 'How to integrate with Kisi, Brivo, and other access control systems...'
    }
  ];

  const supportTeam = [
    {
      id: 1,
      name: 'Alex Thompson',
      role: 'Senior Support Engineer',
      avatar: 'AT',
      activeTickets: 8,
      resolvedToday: 5,
      avgResponseTime: 1.8,
      status: 'online',
      specialties: ['billing', 'integrations']
    },
    {
      id: 2,
      name: 'Sarah Kim',
      role: 'Support Specialist',
      avatar: 'SK',
      activeTickets: 6,
      resolvedToday: 7,
      avgResponseTime: 2.1,
      status: 'online',
      specialties: ['tenant-management', 'property-management']
    },
    {
      id: 3,
      name: 'Mike Rodriguez',
      role: 'Technical Support Lead',
      avatar: 'MR',
      activeTickets: 4,
      resolvedToday: 3,
      avgResponseTime: 3.2,
      status: 'busy',
      specialties: ['mobile-app', 'technical-issues']
    },
    {
      id: 4,
      name: 'Emma Wilson',
      role: 'Customer Success Manager',
      avatar: 'EW',
      activeTickets: 12,
      resolvedToday: 4,
      avgResponseTime: 2.8,
      status: 'online',
      specialties: ['feature-requests', 'customer-success']
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'in-progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-yellow-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'escalated':
        return 'text-red-600';
      case 'resolved':
        return 'text-green-600';
      case 'closed':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'secondary';
      case 'in-progress':
        return 'default';
      case 'escalated':
        return 'destructive';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSlaStatusColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'within':
        return 'text-green-600';
      case 'approaching':
        return 'text-yellow-600';
      case 'breached':
        return 'text-red-600';
      case 'resolved':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'billing':
        return <CreditCard className="h-4 w-4" />;
      case 'tenant-management':
        return <Users className="h-4 w-4" />;
      case 'property-management':
        return <Building2 className="h-4 w-4" />;
      case 'mobile-app':
        return <Smartphone className="h-4 w-4" />;
      case 'integrations':
        return <Network className="h-4 w-4" />;
      case 'feature-request':
        return <Star className="h-4 w-4" />;
      case 'technical-issues':
        return <Wrench className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleTicketAction = (action: string, ticketId: string) => {
    switch (action) {
      case 'assign':
        toast.success(`Ticket ${ticketId} assigned successfully`);
        break;
      case 'escalate':
        toast.success(`Ticket ${ticketId} escalated to senior support`);
        break;
      case 'resolve':
        toast.success(`Ticket ${ticketId} marked as resolved`);
        break;
      case 'close':
        toast.success(`Ticket ${ticketId} closed`);
        break;
      default:
        break;
    }
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      toast.success('Reply sent successfully');
      setReplyText('');
    }
  };

  const handleNewTicketSuccess = (ticketId: string) => {
    setShowNewTicketPage(false);
    setActiveTab('tickets');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600">Manage customer support and service requests</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewTicketPage(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Active Tickets</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Support Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportMetrics.openTickets}</div>
                <p className="text-xs text-muted-foreground">
                  {supportMetrics.escalatedTickets} escalated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportMetrics.avgResponseTime}h</div>
                <p className="text-xs text-muted-foreground">
                  -15% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportMetrics.customerSatisfaction}/5</div>
                <p className="text-xs text-muted-foreground">
                  +0.2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportMetrics.slaCompliance}%</div>
                <p className="text-xs text-muted-foreground">
                  {supportMetrics.overdueTickets} overdue tickets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Status Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Status Distribution</CardTitle>
                <CardDescription>Current ticket status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span>Open</span>
                    </div>
                    <span className="font-medium">{supportMetrics.openTickets}</span>
                  </div>
                  <Progress value={(supportMetrics.openTickets / supportMetrics.totalTickets) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                      <span>In Progress</span>
                    </div>
                    <span className="font-medium">{supportMetrics.inProgressTickets}</span>
                  </div>
                  <Progress value={(supportMetrics.inProgressTickets / supportMetrics.totalTickets) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Escalated</span>
                    </div>
                    <span className="font-medium">{supportMetrics.escalatedTickets}</span>
                  </div>
                  <Progress value={(supportMetrics.escalatedTickets / supportMetrics.totalTickets) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Resolved Today</span>
                    </div>
                    <span className="font-medium">{supportMetrics.resolvedToday}</span>
                  </div>
                  <Progress value={(supportMetrics.resolvedToday / 50) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest support ticket updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.slice(0, 5).map((ticket, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {getStatusIcon(ticket.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{ticket.title}</h4>
                          <Badge variant={getStatusBadge(ticket.status)} className="text-xs">
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{ticket.customer}</p>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                          <span>{ticket.id}</span>
                          <span>•</span>
                          <span>{new Date(ticket.lastUpdate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Support Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators for support team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{supportMetrics.totalTickets}</div>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-xs text-green-600 mt-1">+12% this month</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{supportMetrics.avgResolutionTime}h</div>
                  <p className="text-sm text-gray-600">Avg Resolution Time</p>
                  <p className="text-xs text-green-600 mt-1">-8% improvement</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{supportMetrics.slaCompliance}%</div>
                  <p className="text-sm text-gray-600">SLA Compliance</p>
                  <p className="text-xs text-green-600 mt-1">+3% this month</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{supportMetrics.customerSatisfaction}</div>
                  <p className="text-sm text-gray-600">Customer Rating</p>
                  <p className="text-xs text-green-600 mt-1">+0.3 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Filters</CardTitle>
              <CardDescription>Filter and search support tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
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
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="tenant-management">Tenant Management</SelectItem>
                    <SelectItem value="mobile-app">Mobile App</SelectItem>
                    <SelectItem value="integrations">Integrations</SelectItem>
                    <SelectItem value="feature-request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="w-full" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Manage and track customer support requests ({filteredTickets.length} tickets)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-sm truncate">{ticket.title}</p>
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
                          <p className="font-medium text-sm">{ticket.customer}</p>
                          <p className="text-xs text-gray-600">{ticket.customerEmail}</p>
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
                        <div className={`text-sm ${getSlaStatusColor(ticket.slaStatus)}`}>
                          {ticket.timeToResolve}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedTicket(ticket)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Ticket
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTicketAction('assign', ticket.id)}>
                              <User className="mr-2 h-4 w-4" />
                              Reassign
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTicketAction('escalate', ticket.id)}>
                              <Flag className="mr-2 h-4 w-4" />
                              Escalate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTicketAction('resolve', ticket.id)}>
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
                        <CardDescription>Ticket {selectedTicket.id}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadge(selectedTicket.status)}>
                          {selectedTicket.status}
                        </Badge>
                        <Badge variant={getPriorityBadge(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-700">{selectedTicket.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {new Date(selectedTicket.created).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Updated: {new Date(selectedTicket.lastUpdate).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {selectedTicket.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Communication History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Communication History</CardTitle>
                    <CardDescription>All interactions for this ticket</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mock communication entries */}
                      <div className="border-l-2 border-blue-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Initial Request</h4>
                          <span className="text-sm text-gray-500">2 hours ago</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Customer reported payment processing issues with recurring charges.</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline">Customer</Badge>
                          <span className="text-xs text-gray-500">{selectedTicket.customerEmail}</span>
                        </div>
                      </div>
                      
                      <div className="border-l-2 border-green-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Support Response</h4>
                          <span className="text-sm text-gray-500">1 hour ago</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Thank you for contacting us. I'm investigating the payment gateway issue you've reported.</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline">Support</Badge>
                          <span className="text-xs text-gray-500">{selectedTicket.assignedTo}</span>
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
                          <SelectItem value="in-progress">In Progress</SelectItem>
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
                      <Label className="text-sm font-medium">Assigned To</Label>
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
                          <SelectItem value="tenant-management">Tenant Management</SelectItem>
                          <SelectItem value="mobile-app">Mobile App</SelectItem>
                          <SelectItem value="integrations">Integrations</SelectItem>
                          <SelectItem value="feature-request">Feature Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button className="w-full" onClick={() => toast.success('Ticket updated successfully')}>
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
                        <p className="font-medium">{selectedTicket.customer}</p>
                        <p className="text-sm text-gray-600">Customer</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">{selectedTicket.customerEmail}</p>
                        <p className="text-sm text-gray-600">Email</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">{selectedTicket.timeToResolve}</p>
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
              <h3 className="font-medium text-gray-900 mb-2">Select a Ticket</h3>
              <p className="text-gray-600">Choose a ticket from the Active Tickets tab to view details and manage it here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Support Team Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportTeam.length}</div>
                <p className="text-xs text-muted-foreground">Active support agents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportTeam.reduce((sum, member) => sum + member.activeTickets, 0)}</div>
                <p className="text-xs text-muted-foreground">Total assigned tickets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supportTeam.reduce((sum, member) => sum + member.resolvedToday, 0)}</div>
                <p className="text-xs text-muted-foreground">Tickets resolved today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(supportTeam.reduce((sum, member) => sum + member.avgResponseTime, 0) / supportTeam.length).toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">Team average</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Support Team Members</CardTitle>
              <CardDescription>Manage support team workload and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportTeam.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white font-medium">{member.avatar}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`h-2 w-2 rounded-full ${
                              member.status === 'online' ? 'bg-green-500' :
                              member.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`} />
                            <span className="text-xs text-gray-600 capitalize">{member.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="font-medium">{member.activeTickets}</div>
                          <div className="text-xs text-gray-600">Active Tickets</div>
                        </div>
                        <div>
                          <div className="font-medium">{member.resolvedToday}</div>
                          <div className="text-xs text-gray-600">Resolved Today</div>
                        </div>
                        <div>
                          <div className="font-medium">{member.avgResponseTime}h</div>
                          <div className="text-xs text-gray-600">Avg Response</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Performance
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Assign Ticket
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm text-gray-600 mb-2">Specialties:</div>
                      <div className="flex items-center space-x-2">
                        {member.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
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
            <Card>
              <CardHeader>
                <CardTitle>Team Workload Distribution</CardTitle>
                <CardDescription>Current ticket assignment across team members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supportTeam.map((member) => (
                  <div key={member.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{member.name}</span>
                      <span className="text-sm text-gray-600">{member.activeTickets} tickets</span>
                    </div>
                    <Progress value={(member.activeTickets / 15) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
                <CardDescription>Configure support team settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-assign">Auto-assign new tickets</Label>
                  <Switch id="auto-assign" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="escalation">Enable auto-escalation</Label>
                  <Switch id="escalation" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Team notifications</Label>
                  <Switch id="notifications" defaultChecked />
                </div>
                
                <div>
                  <Label htmlFor="escalation-time">Escalation timeout (hours)</Label>
                  <Select defaultValue="24">
                    <SelectTrigger className="mt-1">
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
                
                <Button className="w-full" onClick={() => toast.success('Team settings saved successfully')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Team Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          {/* Knowledge Base Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{knowledgeBase.length}</div>
                <p className="text-xs text-muted-foreground">Knowledge base articles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{knowledgeBase.reduce((sum, article) => sum + article.views, 0)}</div>
                <p className="text-xs text-muted-foreground">Article views this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Helpful Votes</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{knowledgeBase.reduce((sum, article) => sum + article.helpful, 0)}</div>
                <p className="text-xs text-muted-foreground">Positive feedback</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7/5</div>
                <p className="text-xs text-muted-foreground">Article helpfulness</p>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Base Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Articles</CardTitle>
              <CardDescription>Manage help documentation and FAQs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Search articles..."
                    className="max-w-sm"
                  />
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Article
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Helpful Votes</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {knowledgeBase.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <div className="font-medium">{article.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(article.category)}
                            <span className="capitalize">{article.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>{article.views.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{article.helpful}</span>
                          </div>
                        </TableCell>
                        <TableCell>{article.lastUpdated}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions and Templates */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Response Templates</CardTitle>
                <CardDescription>Pre-defined responses for common issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Payment Issue Response</h4>
                  <p className="text-sm text-gray-600 mt-1">Standard response for payment processing issues</p>
                  <Button variant="outline" size="sm" className="mt-2">Use Template</Button>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Account Access Help</h4>
                  <p className="text-sm text-gray-600 mt-1">Template for login and access related issues</p>
                  <Button variant="outline" size="sm" className="mt-2">Use Template</Button>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Feature Request Acknowledgment</h4>
                  <p className="text-sm text-gray-600 mt-1">Response for new feature requests</p>
                  <Button variant="outline" size="sm" className="mt-2">Use Template</Button>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
                <CardDescription>Most frequently reported issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Payment processing errors</span>
                  </div>
                  <Badge variant="secondary">23 tickets</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tenant management issues</span>
                  </div>
                  <Badge variant="secondary">18 tickets</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Mobile app problems</span>
                  </div>
                  <Badge variant="secondary">15 tickets</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Network className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Integration sync issues</span>
                  </div>
                  <Badge variant="secondary">12 tickets</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Report Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.3%</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.8h</div>
                <p className="text-xs text-muted-foreground">-0.3h improvement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.5%</div>
                <p className="text-xs text-muted-foreground">-2.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reopened Tickets</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">-0.8% improvement</p>
              </CardContent>
            </Card>
          </div>

          {/* Support Analytics */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Volume Trends</CardTitle>
                <CardDescription>Monthly ticket creation and resolution patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-blue-600">342</div>
                      <div className="text-xs text-gray-600">Total Tickets</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-green-600">315</div>
                      <div className="text-xs text-gray-600">Resolved</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">27</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Support requests by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Billing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-3/5 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <span className="text-sm">34%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Tenant Management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-1/2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <span className="text-sm">26%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Mobile App</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-2/5 h-2 bg-purple-600 rounded-full"></div>
                      </div>
                      <span className="text-sm">22%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Network className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Integrations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-1/5 h-2 bg-orange-600 rounded-full"></div>
                      </div>
                      <span className="text-sm">18%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Support Reports</CardTitle>
              <CardDescription>Generate and export detailed support analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg text-center">
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Performance Report</h4>
                  <p className="text-sm text-gray-600 mt-1">Team and individual performance metrics</p>
                  <Button variant="outline" className="mt-3 w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <PieChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Category Analysis</h4>
                  <p className="text-sm text-gray-600 mt-1">Ticket distribution by category and priority</p>
                  <Button variant="outline" className="mt-3 w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <LineChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">Trend Analysis</h4>
                  <p className="text-sm text-gray-600 mt-1">Historical trends and forecasting</p>
                  <Button variant="outline" className="mt-3 w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SLA Performance */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Performance</CardTitle>
              <CardDescription>Service level agreement compliance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">94.2%</div>
                    <p className="text-sm text-gray-600">Overall Compliance</p>
                    <p className="text-xs text-green-600 mt-1">+2.3% this month</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2.4h</div>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                    <p className="text-xs text-green-600 mt-1">Target: 4h</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">18.6h</div>
                    <p className="text-sm text-gray-600">Avg Resolution Time</p>
                    <p className="text-xs text-green-600 mt-1">Target: 24h</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Priority Response</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={96} className="w-24 h-2" />
                      <span className="text-sm">96%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medium Priority Response</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={94} className="w-24 h-2" />
                      <span className="text-sm">94%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low Priority Response</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={92} className="w-24 h-2" />
                      <span className="text-sm">92%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
