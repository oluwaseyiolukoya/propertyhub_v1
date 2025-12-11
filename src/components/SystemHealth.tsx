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
import {
  Server,
  Activity,
  Shield,
  Database,
  Cloud,
  Wifi,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Bell,
  BellOff,
  Play,
  Pause,
  Square,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Globe,
  Lock,
  Unlock,
  Monitor,
  Terminal,
  FileText,
  Calendar,
  Users,
  MapPin,
  Smartphone,
  Laptop,
  Router,
  Target,
  Filter,
  Search,
  BarChart3,
  LineChart,
  PieChart,
  Radio,
  Disc,
  Power,
  ThermometerSun,
  Signal,
  CircuitBoard,
  KeyRound,
  Bug,
  Siren,
  AlertCircle,
  Info,
  XCircle,
  X,
  Plus,
} from "lucide-react";

export function SystemHealth() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("24h");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  // Mock system health data
  const systemOverview = {
    overallStatus: "healthy",
    uptime: 99.97,
    totalServers: 24,
    activeServers: 24,
    criticalAlerts: 0,
    warningAlerts: 3,
    totalRequests: 2847563,
    avgResponseTime: 127,
    errorRate: 0.03,
    lastIncident: "12 days ago",
  };

  const infrastructureMetrics = {
    servers: [
      {
        id: "prod-web-01",
        location: "US-East",
        status: "healthy",
        cpu: 45,
        memory: 68,
        disk: 52,
        uptime: "23d 14h",
        load: 2.3,
        network: "normal",
      },
      {
        id: "prod-web-02",
        location: "US-East",
        status: "healthy",
        cpu: 38,
        memory: 72,
        disk: 48,
        uptime: "23d 14h",
        load: 1.8,
        network: "normal",
      },
      {
        id: "prod-db-01",
        location: "US-East",
        status: "warning",
        cpu: 82,
        memory: 89,
        disk: 76,
        uptime: "15d 8h",
        load: 4.2,
        network: "high",
      },
      {
        id: "prod-api-01",
        location: "EU-West",
        status: "healthy",
        cpu: 34,
        memory: 56,
        disk: 41,
        uptime: "30d 2h",
        load: 1.5,
        network: "normal",
      },
      {
        id: "prod-cache-01",
        location: "US-West",
        status: "healthy",
        cpu: 28,
        memory: 43,
        disk: 22,
        uptime: "45d 12h",
        load: 0.8,
        network: "low",
      },
    ],
    regions: [
      {
        name: "US-East",
        servers: 12,
        status: "healthy",
        load: 65,
        latency: 23,
      },
      { name: "EU-West", servers: 8, status: "healthy", load: 42, latency: 18 },
      { name: "US-West", servers: 4, status: "healthy", load: 38, latency: 28 },
    ],
  };

  const apiHealth = {
    endpoints: [
      {
        name: "Authentication API",
        url: "/api/auth",
        status: "healthy",
        responseTime: 89,
        uptime: 99.99,
        requests24h: 45672,
        errors24h: 12,
      },
      {
        name: "Properties API",
        url: "/api/properties",
        status: "healthy",
        responseTime: 156,
        uptime: 99.95,
        requests24h: 123456,
        errors24h: 28,
      },
      {
        name: "Payments API",
        url: "/api/payments",
        status: "warning",
        responseTime: 324,
        uptime: 99.87,
        requests24h: 89234,
        errors24h: 156,
      },
      {
        name: "Notifications API",
        url: "/api/notifications",
        status: "healthy",
        responseTime: 67,
        uptime: 99.98,
        requests24h: 67890,
        errors24h: 8,
      },
      {
        name: "Reports API",
        url: "/api/reports",
        status: "healthy",
        responseTime: 234,
        uptime: 99.92,
        requests24h: 23456,
        errors24h: 45,
      },
    ],
    metrics: {
      totalRequests: 2847563,
      avgResponseTime: 127,
      p95ResponseTime: 456,
      p99ResponseTime: 892,
      errorRate: 0.03,
      successRate: 99.97,
    },
  };

  const securityMetrics = {
    threats: {
      blocked: 1247,
      detected: 23,
      mitigated: 18,
      investigating: 5,
    },
    vulnerabilities: [
      {
        id: "CVE-2024-001",
        severity: "medium",
        component: "nginx",
        status: "patched",
        discovered: "2024-03-15",
        description: "Buffer overflow in HTTP header parsing",
      },
      {
        id: "CVE-2024-002",
        severity: "low",
        component: "nodejs",
        status: "investigating",
        discovered: "2024-03-18",
        description: "Potential memory leak in specific conditions",
      },
      {
        id: "CVE-2024-003",
        severity: "high",
        component: "openssl",
        status: "scheduled",
        discovered: "2024-03-20",
        description: "Certificate validation bypass",
      },
    ],
    compliance: {
      soc2: {
        status: "compliant",
        lastAudit: "2024-01-15",
        nextAudit: "2024-07-15",
      },
      gdpr: {
        status: "compliant",
        lastReview: "2024-02-01",
        nextReview: "2024-08-01",
      },
      hipaa: {
        status: "compliant",
        lastAssessment: "2024-01-30",
        nextAssessment: "2024-07-30",
      },
    },
    accessLogs: [
      {
        time: "2024-03-21 14:30:15",
        user: "admin@system.com",
        action: "Login",
        ip: "192.168.1.100",
        status: "success",
      },
      {
        time: "2024-03-21 14:25:42",
        user: "monitor@system.com",
        action: "API Access",
        ip: "10.0.0.15",
        status: "success",
      },
      {
        time: "2024-03-21 14:20:33",
        user: "unknown",
        action: "Failed Login",
        ip: "203.45.67.89",
        status: "blocked",
      },
      {
        time: "2024-03-21 14:15:21",
        user: "deploy@system.com",
        action: "Configuration Change",
        ip: "192.168.1.200",
        status: "success",
      },
    ],
  };

  const monitoringData = {
    activeAlerts: [
      {
        id: 1,
        severity: "warning",
        title: "High Database CPU Usage",
        description: "prod-db-01 CPU usage above 80%",
        timestamp: "2024-03-21T14:25:00Z",
        duration: "15m",
        acknowledged: false,
      },
      {
        id: 2,
        severity: "info",
        title: "Scheduled Maintenance Window",
        description: "EU-West region maintenance in 2 hours",
        timestamp: "2024-03-21T14:00:00Z",
        duration: "2h",
        acknowledged: true,
      },
      {
        id: 3,
        severity: "warning",
        title: "API Response Time Elevated",
        description: "Payments API response time above threshold",
        timestamp: "2024-03-21T13:45:00Z",
        duration: "45m",
        acknowledged: false,
      },
    ],
    recentIncidents: [
      {
        id: "INC-2024-012",
        title: "Database Connection Pool Exhausted",
        severity: "high",
        status: "resolved",
        startTime: "2024-03-09T08:15:00Z",
        endTime: "2024-03-09T09:45:00Z",
        duration: "1h 30m",
        affectedServices: ["Properties API", "Payments API"],
      },
      {
        id: "INC-2024-011",
        title: "CDN Performance Degradation",
        severity: "medium",
        status: "resolved",
        startTime: "2024-03-05T14:20:00Z",
        endTime: "2024-03-05T15:30:00Z",
        duration: "1h 10m",
        affectedServices: ["Static Assets", "Image Delivery"],
      },
    ],
    logs: [
      {
        timestamp: "14:30:15",
        level: "INFO",
        service: "auth-api",
        message: "User authentication successful",
      },
      {
        timestamp: "14:29:58",
        level: "WARN",
        service: "db-cluster",
        message: "Connection pool 85% utilized",
      },
      {
        timestamp: "14:29:42",
        level: "ERROR",
        service: "payment-processor",
        message: "Payment gateway timeout",
      },
      {
        timestamp: "14:29:30",
        level: "INFO",
        service: "notification-service",
        message: "Email batch processed: 1,234 messages",
      },
      {
        timestamp: "14:29:15",
        level: "DEBUG",
        service: "cache-layer",
        message: "Cache hit ratio: 94.2%",
      },
    ],
  };

  const maintenanceSchedule = [
    {
      id: 1,
      title: "Database Index Optimization",
      type: "maintenance",
      scheduledDate: "2024-03-25T02:00:00Z",
      duration: "3 hours",
      impact: "low",
      services: ["Properties API", "Search"],
      status: "scheduled",
      description: "Optimize database indexes for improved query performance",
    },
    {
      id: 2,
      title: "Security Patch Deployment",
      type: "security",
      scheduledDate: "2024-03-23T01:00:00Z",
      duration: "2 hours",
      impact: "medium",
      services: ["All APIs", "Web Application"],
      status: "scheduled",
      description: "Deploy critical security patches for OpenSSL vulnerability",
    },
    {
      id: 3,
      title: "Load Balancer Configuration Update",
      type: "update",
      scheduledDate: "2024-03-28T03:00:00Z",
      duration: "1 hour",
      impact: "minimal",
      services: ["API Gateway"],
      status: "scheduled",
      description:
        "Update load balancer rules for improved traffic distribution",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "success":
      case "compliant":
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
      case "investigating":
      case "scheduled":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
      case "error":
      case "blocked":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "success":
      case "compliant":
      case "resolved":
        return "text-green-600";
      case "warning":
      case "investigating":
      case "scheduled":
        return "text-yellow-600";
      case "critical":
      case "error":
      case "blocked":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "success":
      case "compliant":
      case "resolved":
        return "default";
      case "warning":
      case "investigating":
      case "scheduled":
        return "secondary";
      case "critical":
      case "error":
      case "blocked":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Animated Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Activity className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Server className="h-16 w-16 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Activity className="h-8 w-8" />
                System Health
              </h2>
              <p className="text-purple-100 text-lg">
                Monitor platform infrastructure and system performance
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <Label
                  htmlFor="time-range"
                  className="text-sm font-medium text-white"
                >
                  Time Range:
                </Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger
                    className="w-32 bg-white/90 border-white/20 text-gray-900 focus:border-purple-300 focus:ring-purple-200"
                    id="time-range"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last hour</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg">
                <Download className="h-4 w-4 mr-2" />
                Export Report
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
              value="infrastructure"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Infrastructure</span>
            </TabsTrigger>
            <TabsTrigger
              value="api"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">API Health</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="monitoring"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Monitoring</span>
            </TabsTrigger>
            <TabsTrigger
              value="maintenance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Maintenance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0 p-6">
            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      System Status
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Healthy
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      All systems operational
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Uptime
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {systemOverview.uptime}%
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Active Servers
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <Server className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {systemOverview.activeServers}/
                      {systemOverview.totalServers}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      100% availability
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Response Time
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {systemOverview.avgResponseTime}ms
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Average response time
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Key Metrics */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Performance Metrics
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Real-time system performance indicators
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span>CPU Usage</span>
                    </div>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MemoryStick className="h-4 w-4 text-green-600" />
                      <span>Memory Usage</span>
                    </div>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-yellow-600" />
                      <span>Disk Usage</span>
                    </div>
                    <span className="font-medium">52%</span>
                  </div>
                  <Progress value={52} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Network className="h-4 w-4 text-purple-600" />
                      <span>Network Throughput</span>
                    </div>
                    <span className="font-medium">2.3 GB/s</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                        <Server className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Service Status
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Status of critical platform services
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Web Application",
                        status: "healthy",
                        uptime: "99.9%",
                      },
                      {
                        name: "API Gateway",
                        status: "healthy",
                        uptime: "99.8%",
                      },
                      {
                        name: "Database Cluster",
                        status: "warning",
                        uptime: "99.7%",
                      },
                      {
                        name: "Message Queue",
                        status: "healthy",
                        uptime: "100%",
                      },
                      {
                        name: "File Storage",
                        status: "healthy",
                        uptime: "99.9%",
                      },
                      {
                        name: "Cache Layer",
                        status: "healthy",
                        uptime: "99.9%",
                      },
                    ].map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadge(service.status)}>
                            {service.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {service.uptime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Alerts */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Active Alerts</CardTitle>
                      <CardDescription className="mt-1">
                        Current system alerts and notifications
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent>
                {monitoringData.activeAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {monitoringData.activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 border rounded-lg ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(alert.severity)}
                              <h4 className="font-medium">{alert.title}</h4>
                              <Badge variant={getStatusBadge(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{alert.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                              <span>Duration: {alert.duration}</span>
                              <span>
                                Started:{" "}
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!alert.acknowledged && (
                              <Button size="sm" variant="outline">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Acknowledge
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">
                      No Active Alerts
                    </h3>
                    <p className="text-gray-600">
                      All systems are operating normally
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-6 mt-0 p-6">
            {/* Regional Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              {infrastructureMetrics.regions.map((region, index) => {
                const gradientColors = [
                  "from-blue-50 to-indigo-50",
                  "from-purple-50 to-violet-50",
                  "from-green-50 to-emerald-50",
                ];
                const iconGradients = [
                  "from-blue-500 to-indigo-500",
                  "from-purple-500 to-violet-500",
                  "from-green-500 to-emerald-500",
                ];
                const orbColors = [
                  "bg-blue-200",
                  "bg-purple-200",
                  "bg-green-200",
                ];
                const textGradients = [
                  "from-blue-600 to-indigo-600",
                  "from-purple-600 to-violet-600",
                  "from-green-600 to-emerald-600",
                ];
                const colorIndex = index % 3;

                return (
                  <Card
                    key={index}
                    className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                  >
                    <div
                      className={`relative bg-gradient-to-br ${gradientColors[colorIndex]} p-6`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-32 h-32 ${orbColors[colorIndex]} rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse`}
                      ></div>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-700">
                          {region.name}
                        </CardTitle>
                        <div
                          className={`p-2 bg-gradient-to-br ${iconGradients[colorIndex]} rounded-lg shadow-lg`}
                        >
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Status
                            </span>
                            <Badge variant={getStatusBadge(region.status)}>
                              {region.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Servers
                            </span>
                            <span
                              className={`font-bold bg-gradient-to-r ${textGradients[colorIndex]} bg-clip-text text-transparent`}
                            >
                              {region.servers}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Load</span>
                            <span
                              className={`font-bold bg-gradient-to-r ${textGradients[colorIndex]} bg-clip-text text-transparent`}
                            >
                              {region.load}%
                            </span>
                          </div>
                          <Progress value={region.load} className="h-2" />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Latency
                            </span>
                            <span
                              className={`font-bold bg-gradient-to-r ${textGradients[colorIndex]} bg-clip-text text-transparent`}
                            >
                              {region.latency}ms
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Server Details */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                      <Server className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Server Infrastructure
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Detailed server health and performance metrics
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor="region-filter"
                        className="text-sm font-medium"
                      >
                        Region:
                      </Label>
                      <Select
                        value={selectedRegion}
                        onValueChange={setSelectedRegion}
                      >
                        <SelectTrigger
                          className="w-32 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          id="region-filter"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Regions</SelectItem>
                          <SelectItem value="US-East">US-East</SelectItem>
                          <SelectItem value="EU-West">EU-West</SelectItem>
                          <SelectItem value="US-West">US-West</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search servers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50">
                          <TableHead className="font-semibold text-gray-900">
                            Server ID
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Location
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            CPU
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Memory
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Disk
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Uptime
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {infrastructureMetrics.servers
                          .filter(
                            (server) =>
                              (selectedRegion === "all" ||
                                server.location === selectedRegion) &&
                              server.id
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                          )
                          .map((server, index) => (
                            <TableRow
                              key={index}
                              className="hover:bg-purple-50/50 transition-colors duration-200"
                            >
                              <TableCell className="font-medium">
                                {server.id}
                              </TableCell>
                              <TableCell>{server.location}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(server.status)}
                                  <Badge
                                    variant={getStatusBadge(server.status)}
                                  >
                                    {server.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <span
                                    className={`text-sm ${
                                      server.cpu > 80
                                        ? "text-red-600"
                                        : server.cpu > 60
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {server.cpu}%
                                  </span>
                                  <Progress
                                    value={server.cpu}
                                    className="h-1 w-16"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <span
                                    className={`text-sm ${
                                      server.memory > 80
                                        ? "text-red-600"
                                        : server.memory > 60
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {server.memory}%
                                  </span>
                                  <Progress
                                    value={server.memory}
                                    className="h-1 w-16"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <span
                                    className={`text-sm ${
                                      server.disk > 80
                                        ? "text-red-600"
                                        : server.disk > 60
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {server.disk}%
                                  </span>
                                  <Progress
                                    value={server.disk}
                                    className="h-1 w-16"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {server.uptime}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                  >
                                    <Settings className="h-4 w-4" />
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

            {/* Resource Usage Trends */}
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
                          Resource Usage Trends
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Historical resource utilization patterns
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4 text-blue-600" />
                        <span>Average CPU Usage</span>
                      </div>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MemoryStick className="h-4 w-4 text-green-600" />
                        <span>Average Memory Usage</span>
                      </div>
                      <span className="font-medium">62%</span>
                    </div>
                    <Progress value={62} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4 text-yellow-600" />
                        <span>Average Disk Usage</span>
                      </div>
                      <span className="font-medium">48%</span>
                    </div>
                    <Progress value={48} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Network className="h-4 w-4 text-purple-600" />
                        <span>Network Throughput</span>
                      </div>
                      <span className="font-medium">1.8 GB/s</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Infrastructure Health Score
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Overall infrastructure performance rating
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      96%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Overall Health Score
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Performance</span>
                      <span className="font-medium text-green-600">
                        Excellent
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Availability</span>
                      <span className="font-medium text-green-600">99.97%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reliability</span>
                      <span className="font-medium text-green-600">
                        Excellent
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Scalability</span>
                      <span className="font-medium text-blue-600">Good</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6 mt-0 p-6">
            {/* API Metrics Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Total Requests
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {apiHealth.metrics.totalRequests.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Last 24 hours</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Avg Response Time
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {apiHealth.metrics.avgResponseTime}ms
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      P95: {apiHealth.metrics.p95ResponseTime}ms
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Success Rate
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {apiHealth.metrics.successRate}%
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Error rate: {apiHealth.metrics.errorRate}%
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      P99 Response Time
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {apiHealth.metrics.p99ResponseTime}ms
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      99th percentile
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* API Endpoints Health */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                      <Network className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        API Endpoints Health
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Status and performance of individual API endpoints
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50">
                        <TableHead className="font-semibold text-gray-900">
                          Endpoint
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Response Time
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Uptime
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Requests (24h)
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Errors (24h)
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiHealth.endpoints.map((endpoint, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-purple-50/50 transition-colors duration-200"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{endpoint.name}</div>
                              <div className="text-sm text-gray-600">
                                {endpoint.url}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(endpoint.status)}
                              <Badge variant={getStatusBadge(endpoint.status)}>
                                {endpoint.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                endpoint.responseTime > 300
                                  ? "text-red-600"
                                  : endpoint.responseTime > 200
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {endpoint.responseTime}ms
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                endpoint.uptime < 99.5
                                  ? "text-red-600"
                                  : endpoint.uptime < 99.9
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {endpoint.uptime}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {endpoint.requests24h.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                endpoint.errors24h > 100
                                  ? "text-red-600"
                                  : endpoint.errors24h > 50
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {endpoint.errors24h}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                <BarChart3 className="h-4 w-4" />
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

            {/* API Performance Trends */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Response Time Distribution
                        </CardTitle>
                        <CardDescription className="mt-1">
                          API response time percentiles
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        P50 (Median)
                      </span>
                      <span className="font-medium text-gray-900">89ms</span>
                    </div>
                    <Progress value={20} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">P90</span>
                      <span className="font-medium">234ms</span>
                    </div>
                    <Progress value={50} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">P95</span>
                      <span className="font-medium">
                        {apiHealth.metrics.p95ResponseTime}ms
                      </span>
                    </div>
                    <Progress value={75} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">P99</span>
                      <span className="font-medium">
                        {apiHealth.metrics.p99ResponseTime}ms
                      </span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                        <LineChart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          API Traffic Patterns
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Request volume and error rate trends
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        2.8M
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Total Requests
                      </p>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        99.97%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Success Rate</p>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                        249
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Total Errors</p>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                        127ms
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-0 p-6">
            {/* Security Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-red-50 to-rose-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Threats Blocked
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                      {securityMetrics.threats.blocked.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Last 24 hours</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Active Investigations
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {securityMetrics.threats.investigating}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Security incidents
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Vulnerabilities
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                      <Bug className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      {securityMetrics.vulnerabilities.length}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Identified vulnerabilities
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Compliance Score
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      98%
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Security compliance
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Vulnerabilities */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b border-red-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Security Vulnerabilities
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Identified vulnerabilities and remediation status
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50">
                        <TableHead className="font-semibold text-gray-900">
                          CVE ID
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Severity
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Component
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Discovered
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Description
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityMetrics.vulnerabilities.map((vuln, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-red-50/50 transition-colors duration-200"
                        >
                          <TableCell className="font-medium">
                            {vuln.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                vuln.severity === "high"
                                  ? "destructive"
                                  : vuln.severity === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {vuln.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{vuln.component}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(vuln.status)}
                              <Badge variant={getStatusBadge(vuln.status)}>
                                {vuln.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{vuln.discovered}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {vuln.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Settings className="h-4 w-4" />
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

            {/* Compliance Status */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Compliance Status
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Regulatory compliance and audit status
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            SOC 2 Type II
                          </p>
                          <p className="text-sm text-gray-600">
                            Last audit:{" "}
                            {securityMetrics.compliance.soc2.lastAudit}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-green-600 text-white"
                      >
                        Compliant
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">GDPR</p>
                          <p className="text-sm text-gray-600">
                            Last review:{" "}
                            {securityMetrics.compliance.gdpr.lastReview}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-green-600 text-white"
                      >
                        Compliant
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">HIPAA</p>
                          <p className="text-sm text-gray-600">
                            Last assessment:{" "}
                            {securityMetrics.compliance.hipaa.lastAssessment}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-green-600 text-white"
                      >
                        Compliant
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Recent Security Events
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Security access logs and events
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {securityMetrics.accessLogs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                            {getStatusIcon(log.status)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.action}
                            </p>
                            <p className="text-xs text-gray-600">
                              {log.user} • {log.ip}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">{log.time}</p>
                          <Badge
                            variant={getStatusBadge(log.status)}
                            className="text-xs mt-1"
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Threat Analysis */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Threat Analysis</CardTitle>
                      <CardDescription className="mt-1">
                        Security threat detection and mitigation summary
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                      {securityMetrics.threats.blocked}
                    </div>
                    <p className="text-sm text-gray-600">Threats Blocked</p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {securityMetrics.threats.detected}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Threats Detected
                    </p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {securityMetrics.threats.mitigated}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Threats Mitigated
                    </p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {securityMetrics.threats.investigating}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Under Investigation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6 mt-0 p-6">
            {/* Monitoring Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Active Alerts
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {monitoringData.activeAlerts.length}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Require attention
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Log Events
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      45,672
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Last hour</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-red-50 to-rose-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Incidents
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                      {monitoringData.recentIncidents.length}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      MTTR
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      1.2h
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Mean time to recovery
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Active Alerts */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Active Alerts</CardTitle>
                      <CardDescription className="mt-1">
                        Current system alerts requiring attention
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                {monitoringData.activeAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {monitoringData.activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                                {getStatusIcon(alert.severity)}
                              </div>
                              <h4 className="font-medium text-gray-900">
                                {alert.title}
                              </h4>
                              <Badge variant={getStatusBadge(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mt-2 text-gray-700">
                              {alert.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600">
                              <span>Duration: {alert.duration}</span>
                              <span>
                                Started:{" "}
                                {new Date(alert.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!alert.acknowledged && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Acknowledge
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 text-lg">
                      No Active Alerts
                    </h3>
                    <p className="text-gray-600">
                      All monitoring checks are passing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b border-red-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Recent Incidents
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Historical incident tracking and resolution
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50">
                        <TableHead className="font-semibold text-gray-900">
                          Incident ID
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Title
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Severity
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Duration
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Affected Services
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monitoringData.recentIncidents.map((incident, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-red-50/50 transition-colors duration-200"
                        >
                          <TableCell className="font-medium">
                            {incident.id}
                          </TableCell>
                          <TableCell>{incident.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                incident.severity === "high"
                                  ? "destructive"
                                  : incident.severity === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {incident.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(incident.status)}
                              <Badge variant={getStatusBadge(incident.status)}>
                                {incident.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{incident.duration}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {incident.affectedServices.map((service, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <FileText className="h-4 w-4" />
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

            {/* System Logs */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Terminal className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">System Logs</CardTitle>
                      <CardDescription className="mt-1">
                        Real-time system log monitoring
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Filter logs..."
                          className="w-64 pl-10 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="error">ERROR</SelectItem>
                          <SelectItem value="warn">WARN</SelectItem>
                          <SelectItem value="info">INFO</SelectItem>
                          <SelectItem value="debug">DEBUG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-refresh" />
                      <Label
                        htmlFor="auto-refresh"
                        className="text-sm text-gray-700"
                      >
                        Auto-refresh
                      </Label>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-gray-900 to-black text-green-400 p-4">
                      <div className="flex items-center space-x-2">
                        <Terminal className="h-5 w-5" />
                        <span className="text-sm font-medium">System Logs</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 font-mono text-sm space-y-2 max-h-64 overflow-y-auto">
                      {monitoringData.logs.map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 hover:bg-gray-100 p-2 rounded transition-colors duration-200"
                        >
                          <span className="text-gray-500 flex-shrink-0">
                            {log.timestamp}
                          </span>
                          <span
                            className={`font-medium flex-shrink-0 ${
                              log.level === "ERROR"
                                ? "text-red-600"
                                : log.level === "WARN"
                                ? "text-yellow-600"
                                : log.level === "INFO"
                                ? "text-blue-600"
                                : "text-gray-600"
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-purple-600 flex-shrink-0">
                            [{log.service}]
                          </span>
                          <span className="text-gray-800">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6 mt-0 p-6">
            {/* Maintenance Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Scheduled Maintenance
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {maintenanceSchedule.length}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Next 30 days</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      System Health
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Optimal
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      All systems operational
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Last Update
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <RefreshCw className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      3 days
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Database optimization
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Scheduled Maintenance */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Scheduled Maintenance
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Upcoming maintenance windows and system updates
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {maintenanceSchedule.map((maintenance) => (
                    <div
                      key={maintenance.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="font-medium text-gray-900">
                              {maintenance.title}
                            </h4>
                            <Badge
                              variant={
                                maintenance.type === "security"
                                  ? "destructive"
                                  : maintenance.type === "maintenance"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {maintenance.type}
                            </Badge>
                            <Badge
                              variant={
                                maintenance.impact === "high"
                                  ? "destructive"
                                  : maintenance.impact === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {maintenance.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mt-2">
                            {maintenance.description}
                          </p>
                          <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span>
                                Scheduled:{" "}
                                {new Date(
                                  maintenance.scheduledDate
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Activity className="h-4 w-4 text-blue-600" />
                              <span>Duration: {maintenance.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-sm text-gray-600">
                              Affected services:
                            </span>
                            {maintenance.services.map((service, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs border-blue-200 text-blue-700 bg-blue-50"
                              >
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Updates */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200/50 px-6 py-4">
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                        <Download className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Available Updates
                        </CardTitle>
                        <CardDescription className="mt-1">
                          System components requiring updates
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Security Patch
                          </p>
                          <p className="text-sm text-gray-600">
                            OpenSSL 3.0.8 → 3.0.9
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <Badge variant="destructive">Critical</Badge>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                        >
                          Install
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                          <Server className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            System Update
                          </p>
                          <p className="text-sm text-gray-600">
                            Node.js 18.16.0 → 18.17.0
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <Badge variant="secondary">Optional</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Install
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                          <Database className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Database Update
                          </p>
                          <p className="text-sm text-gray-600">
                            PostgreSQL 15.2 → 15.3
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <Badge
                          variant="default"
                          className="bg-green-600 text-white"
                        >
                          Recommended
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
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
                        <CardTitle className="text-lg">
                          Maintenance Configuration
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Configure maintenance window preferences
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="maintenance-window"
                        className="text-gray-700 font-medium"
                      >
                        Preferred Maintenance Window
                      </Label>
                      <Select defaultValue="weekend">
                        <SelectTrigger className="mt-2 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekend">
                            Weekend (Sat 2:00 AM - 6:00 AM UTC)
                          </SelectItem>
                          <SelectItem value="weeknight">
                            Weeknight (Tue-Thu 2:00 AM - 4:00 AM UTC)
                          </SelectItem>
                          <SelectItem value="custom">
                            Custom Schedule
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-white">
                      <Switch id="auto-updates" defaultChecked />
                      <Label htmlFor="auto-updates" className="text-gray-700">
                        Enable automatic security updates
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-white">
                      <Switch id="notifications" defaultChecked />
                      <Label htmlFor="notifications" className="text-gray-700">
                        Send maintenance notifications
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-white">
                      <Switch id="rollback" defaultChecked />
                      <Label htmlFor="rollback" className="text-gray-700">
                        Enable automatic rollback on failure
                      </Label>
                    </div>

                    <div>
                      <Label
                        htmlFor="notification-advance"
                        className="text-gray-700 font-medium"
                      >
                        Notification Advance Time
                      </Label>
                      <Select defaultValue="24h">
                        <SelectTrigger className="mt-2 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hour before</SelectItem>
                          <SelectItem value="6h">6 hours before</SelectItem>
                          <SelectItem value="24h">24 hours before</SelectItem>
                          <SelectItem value="48h">48 hours before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
