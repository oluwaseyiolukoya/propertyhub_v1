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
  Plus
} from 'lucide-react';

export function SystemHealth() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Mock system health data
  const systemOverview = {
    overallStatus: 'healthy',
    uptime: 99.97,
    totalServers: 24,
    activeServers: 24,
    criticalAlerts: 0,
    warningAlerts: 3,
    totalRequests: 2847563,
    avgResponseTime: 127,
    errorRate: 0.03,
    lastIncident: '12 days ago'
  };

  const infrastructureMetrics = {
    servers: [
      { 
        id: 'prod-web-01', 
        location: 'US-East', 
        status: 'healthy', 
        cpu: 45, 
        memory: 68, 
        disk: 52, 
        uptime: '23d 14h',
        load: 2.3,
        network: 'normal'
      },
      { 
        id: 'prod-web-02', 
        location: 'US-East', 
        status: 'healthy', 
        cpu: 38, 
        memory: 72, 
        disk: 48, 
        uptime: '23d 14h',
        load: 1.8,
        network: 'normal'
      },
      { 
        id: 'prod-db-01', 
        location: 'US-East', 
        status: 'warning', 
        cpu: 82, 
        memory: 89, 
        disk: 76, 
        uptime: '15d 8h',
        load: 4.2,
        network: 'high'
      },
      { 
        id: 'prod-api-01', 
        location: 'EU-West', 
        status: 'healthy', 
        cpu: 34, 
        memory: 56, 
        disk: 41, 
        uptime: '30d 2h',
        load: 1.5,
        network: 'normal'
      },
      { 
        id: 'prod-cache-01', 
        location: 'US-West', 
        status: 'healthy', 
        cpu: 28, 
        memory: 43, 
        disk: 22, 
        uptime: '45d 12h',
        load: 0.8,
        network: 'low'
      }
    ],
    regions: [
      { name: 'US-East', servers: 12, status: 'healthy', load: 65, latency: 23 },
      { name: 'EU-West', servers: 8, status: 'healthy', load: 42, latency: 18 },
      { name: 'US-West', servers: 4, status: 'healthy', load: 38, latency: 28 }
    ]
  };

  const apiHealth = {
    endpoints: [
      { 
        name: 'Authentication API', 
        url: '/api/auth', 
        status: 'healthy', 
        responseTime: 89, 
        uptime: 99.99,
        requests24h: 45672,
        errors24h: 12
      },
      { 
        name: 'Properties API', 
        url: '/api/properties', 
        status: 'healthy', 
        responseTime: 156, 
        uptime: 99.95,
        requests24h: 123456,
        errors24h: 28
      },
      { 
        name: 'Payments API', 
        url: '/api/payments', 
        status: 'warning', 
        responseTime: 324, 
        uptime: 99.87,
        requests24h: 89234,
        errors24h: 156
      },
      { 
        name: 'Notifications API', 
        url: '/api/notifications', 
        status: 'healthy', 
        responseTime: 67, 
        uptime: 99.98,
        requests24h: 67890,
        errors24h: 8
      },
      { 
        name: 'Reports API', 
        url: '/api/reports', 
        status: 'healthy', 
        responseTime: 234, 
        uptime: 99.92,
        requests24h: 23456,
        errors24h: 45
      }
    ],
    metrics: {
      totalRequests: 2847563,
      avgResponseTime: 127,
      p95ResponseTime: 456,
      p99ResponseTime: 892,
      errorRate: 0.03,
      successRate: 99.97
    }
  };

  const securityMetrics = {
    threats: {
      blocked: 1247,
      detected: 23,
      mitigated: 18,
      investigating: 5
    },
    vulnerabilities: [
      { 
        id: 'CVE-2024-001', 
        severity: 'medium', 
        component: 'nginx', 
        status: 'patched',
        discovered: '2024-03-15',
        description: 'Buffer overflow in HTTP header parsing'
      },
      { 
        id: 'CVE-2024-002', 
        severity: 'low', 
        component: 'nodejs', 
        status: 'investigating',
        discovered: '2024-03-18',
        description: 'Potential memory leak in specific conditions'
      },
      { 
        id: 'CVE-2024-003', 
        severity: 'high', 
        component: 'openssl', 
        status: 'scheduled',
        discovered: '2024-03-20',
        description: 'Certificate validation bypass'
      }
    ],
    compliance: {
      soc2: { status: 'compliant', lastAudit: '2024-01-15', nextAudit: '2024-07-15' },
      gdpr: { status: 'compliant', lastReview: '2024-02-01', nextReview: '2024-08-01' },
      hipaa: { status: 'compliant', lastAssessment: '2024-01-30', nextAssessment: '2024-07-30' }
    },
    accessLogs: [
      { time: '2024-03-21 14:30:15', user: 'admin@system.com', action: 'Login', ip: '192.168.1.100', status: 'success' },
      { time: '2024-03-21 14:25:42', user: 'monitor@system.com', action: 'API Access', ip: '10.0.0.15', status: 'success' },
      { time: '2024-03-21 14:20:33', user: 'unknown', action: 'Failed Login', ip: '203.45.67.89', status: 'blocked' },
      { time: '2024-03-21 14:15:21', user: 'deploy@system.com', action: 'Configuration Change', ip: '192.168.1.200', status: 'success' }
    ]
  };

  const monitoringData = {
    activeAlerts: [
      { 
        id: 1, 
        severity: 'warning', 
        title: 'High Database CPU Usage', 
        description: 'prod-db-01 CPU usage above 80%',
        timestamp: '2024-03-21T14:25:00Z',
        duration: '15m',
        acknowledged: false
      },
      { 
        id: 2, 
        severity: 'info', 
        title: 'Scheduled Maintenance Window', 
        description: 'EU-West region maintenance in 2 hours',
        timestamp: '2024-03-21T14:00:00Z',
        duration: '2h',
        acknowledged: true
      },
      { 
        id: 3, 
        severity: 'warning', 
        title: 'API Response Time Elevated', 
        description: 'Payments API response time above threshold',
        timestamp: '2024-03-21T13:45:00Z',
        duration: '45m',
        acknowledged: false
      }
    ],
    recentIncidents: [
      {
        id: 'INC-2024-012',
        title: 'Database Connection Pool Exhausted',
        severity: 'high',
        status: 'resolved',
        startTime: '2024-03-09T08:15:00Z',
        endTime: '2024-03-09T09:45:00Z',
        duration: '1h 30m',
        affectedServices: ['Properties API', 'Payments API']
      },
      {
        id: 'INC-2024-011',
        title: 'CDN Performance Degradation',
        severity: 'medium',
        status: 'resolved',
        startTime: '2024-03-05T14:20:00Z',
        endTime: '2024-03-05T15:30:00Z',
        duration: '1h 10m',
        affectedServices: ['Static Assets', 'Image Delivery']
      }
    ],
    logs: [
      { timestamp: '14:30:15', level: 'INFO', service: 'auth-api', message: 'User authentication successful' },
      { timestamp: '14:29:58', level: 'WARN', service: 'db-cluster', message: 'Connection pool 85% utilized' },
      { timestamp: '14:29:42', level: 'ERROR', service: 'payment-processor', message: 'Payment gateway timeout' },
      { timestamp: '14:29:30', level: 'INFO', service: 'notification-service', message: 'Email batch processed: 1,234 messages' },
      { timestamp: '14:29:15', level: 'DEBUG', service: 'cache-layer', message: 'Cache hit ratio: 94.2%' }
    ]
  };

  const maintenanceSchedule = [
    {
      id: 1,
      title: 'Database Index Optimization',
      type: 'maintenance',
      scheduledDate: '2024-03-25T02:00:00Z',
      duration: '3 hours',
      impact: 'low',
      services: ['Properties API', 'Search'],
      status: 'scheduled',
      description: 'Optimize database indexes for improved query performance'
    },
    {
      id: 2,
      title: 'Security Patch Deployment',
      type: 'security',
      scheduledDate: '2024-03-23T01:00:00Z',
      duration: '2 hours',
      impact: 'medium',
      services: ['All APIs', 'Web Application'],
      status: 'scheduled',
      description: 'Deploy critical security patches for OpenSSL vulnerability'
    },
    {
      id: 3,
      title: 'Load Balancer Configuration Update',
      type: 'update',
      scheduledDate: '2024-03-28T03:00:00Z',
      duration: '1 hour',
      impact: 'minimal',
      services: ['API Gateway'],
      status: 'scheduled',
      description: 'Update load balancer rules for improved traffic distribution'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
      case 'compliant':
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'investigating':
      case 'scheduled':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
      case 'error':
      case 'blocked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
      case 'compliant':
      case 'resolved':
        return 'text-green-600';
      case 'warning':
      case 'investigating':
      case 'scheduled':
        return 'text-yellow-600';
      case 'critical':
      case 'error':
      case 'blocked':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
      case 'compliant':
      case 'resolved':
        return 'default';
      case 'warning':
      case 'investigating':
      case 'scheduled':
        return 'secondary';
      case 'critical':
      case 'error':
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
          <p className="text-gray-600">Monitor platform infrastructure and system performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="time-range" className="text-sm font-medium">Time Range:</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32" id="time-range">
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
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="api">API Health</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemOverview.uptime}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Servers</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemOverview.activeServers}/{systemOverview.totalServers}</div>
                <p className="text-xs text-muted-foreground">100% availability</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemOverview.avgResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
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

            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>Status of critical platform services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Web Application', status: 'healthy', uptime: '99.9%' },
                    { name: 'API Gateway', status: 'healthy', uptime: '99.8%' },
                    { name: 'Database Cluster', status: 'warning', uptime: '99.7%' },
                    { name: 'Message Queue', status: 'healthy', uptime: '100%' },
                    { name: 'File Storage', status: 'healthy', uptime: '99.9%' },
                    { name: 'Cache Layer', status: 'healthy', uptime: '99.9%' }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(service.status)}
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusBadge(service.status)}>
                          {service.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">{service.uptime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Current system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {monitoringData.activeAlerts.length > 0 ? (
                <div className="space-y-3">
                  {monitoringData.activeAlerts.map((alert) => (
                    <div key={alert.id} className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(alert.severity)}
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={getStatusBadge(alert.severity)}>{alert.severity}</Badge>
                          </div>
                          <p className="text-sm mt-1">{alert.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                            <span>Duration: {alert.duration}</span>
                            <span>Started: {new Date(alert.timestamp).toLocaleTimeString()}</span>
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
                  <h3 className="font-medium text-gray-900 mb-2">No Active Alerts</h3>
                  <p className="text-gray-600">All systems are operating normally</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          {/* Regional Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            {infrastructureMetrics.regions.map((region, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{region.name}</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant={getStatusBadge(region.status)}>{region.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Servers</span>
                      <span className="font-medium">{region.servers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Load</span>
                      <span className="font-medium">{region.load}%</span>
                    </div>
                    <Progress value={region.load} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latency</span>
                      <span className="font-medium">{region.latency}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Server Details */}
          <Card>
            <CardHeader>
              <CardTitle>Server Infrastructure</CardTitle>
              <CardDescription>Detailed server health and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="region-filter">Region:</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="w-32">
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
                    <Input
                      placeholder="Search servers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>CPU</TableHead>
                      <TableHead>Memory</TableHead>
                      <TableHead>Disk</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {infrastructureMetrics.servers
                      .filter(server => 
                        (selectedRegion === 'all' || server.location === selectedRegion) &&
                        server.id.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((server, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{server.id}</TableCell>
                        <TableCell>{server.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(server.status)}
                            <Badge variant={getStatusBadge(server.status)}>
                              {server.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={`text-sm ${
                              server.cpu > 80 ? 'text-red-600' : 
                              server.cpu > 60 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {server.cpu}%
                            </span>
                            <Progress value={server.cpu} className="h-1 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={`text-sm ${
                              server.memory > 80 ? 'text-red-600' : 
                              server.memory > 60 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {server.memory}%
                            </span>
                            <Progress value={server.memory} className="h-1 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={`text-sm ${
                              server.disk > 80 ? 'text-red-600' : 
                              server.disk > 60 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {server.disk}%
                            </span>
                            <Progress value={server.disk} className="h-1 w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{server.uptime}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
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

          {/* Resource Usage Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage Trends</CardTitle>
                <CardDescription>Historical resource utilization patterns</CardDescription>
              </CardHeader>
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

            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Health Score</CardTitle>
                <CardDescription>Overall infrastructure performance rating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">96%</div>
                  <p className="text-sm text-gray-600">Overall Health Score</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance</span>
                    <span className="font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Availability</span>
                    <span className="font-medium text-green-600">99.97%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reliability</span>
                    <span className="font-medium text-green-600">Excellent</span>
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

        <TabsContent value="api" className="space-y-6">
          {/* API Metrics Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiHealth.metrics.totalRequests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiHealth.metrics.avgResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">P95: {apiHealth.metrics.p95ResponseTime}ms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiHealth.metrics.successRate}%</div>
                <p className="text-xs text-muted-foreground">Error rate: {apiHealth.metrics.errorRate}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P99 Response Time</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiHealth.metrics.p99ResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">99th percentile</p>
              </CardContent>
            </Card>
          </div>

          {/* API Endpoints Health */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Health</CardTitle>
              <CardDescription>Status and performance of individual API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Requests (24h)</TableHead>
                    <TableHead>Errors (24h)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiHealth.endpoints.map((endpoint, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{endpoint.name}</div>
                          <div className="text-sm text-gray-600">{endpoint.url}</div>
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
                        <span className={`font-medium ${
                          endpoint.responseTime > 300 ? 'text-red-600' : 
                          endpoint.responseTime > 200 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {endpoint.responseTime}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          endpoint.uptime < 99.5 ? 'text-red-600' : 
                          endpoint.uptime < 99.9 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {endpoint.uptime}%
                        </span>
                      </TableCell>
                      <TableCell>{endpoint.requests24h.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          endpoint.errors24h > 100 ? 'text-red-600' : 
                          endpoint.errors24h > 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {endpoint.errors24h}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* API Performance Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>API response time percentiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">P50 (Median)</span>
                    <span className="font-medium">89ms</span>
                  </div>
                  <Progress value={20} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">P90</span>
                    <span className="font-medium">234ms</span>
                  </div>
                  <Progress value={50} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">P95</span>
                    <span className="font-medium">{apiHealth.metrics.p95ResponseTime}ms</span>
                  </div>
                  <Progress value={75} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">P99</span>
                    <span className="font-medium">{apiHealth.metrics.p99ResponseTime}ms</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Traffic Patterns</CardTitle>
                <CardDescription>Request volume and error rate trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2.8M</div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.97%</div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">249</div>
                    <p className="text-sm text-gray-600">Total Errors</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">127ms</div>
                    <p className="text-sm text-gray-600">Avg Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.threats.blocked.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investigations</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.threats.investigating}</div>
                <p className="text-xs text-muted-foreground">Security incidents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.vulnerabilities.length}</div>
                <p className="text-xs text-muted-foreground">Identified vulnerabilities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">Security compliance</p>
              </CardContent>
            </Card>
          </div>

          {/* Vulnerabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Security Vulnerabilities</CardTitle>
              <CardDescription>Identified vulnerabilities and remediation status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CVE ID</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Discovered</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityMetrics.vulnerabilities.map((vuln, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{vuln.id}</TableCell>
                      <TableCell>
                        <Badge variant={
                          vuln.severity === 'high' ? 'destructive' :
                          vuln.severity === 'medium' ? 'secondary' : 'outline'
                        }>
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
                      <TableCell className="max-w-xs truncate">{vuln.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Regulatory compliance and audit status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">SOC 2 Type II</p>
                        <p className="text-sm text-gray-600">Last audit: {securityMetrics.compliance.soc2.lastAudit}</p>
                      </div>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">GDPR</p>
                        <p className="text-sm text-gray-600">Last review: {securityMetrics.compliance.gdpr.lastReview}</p>
                      </div>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">HIPAA</p>
                        <p className="text-sm text-gray-600">Last assessment: {securityMetrics.compliance.hipaa.lastAssessment}</p>
                      </div>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Security access logs and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityMetrics.accessLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-gray-600">{log.user} • {log.ip}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{log.time}</p>
                        <Badge variant={getStatusBadge(log.status)} className="text-xs">
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
          <Card>
            <CardHeader>
              <CardTitle>Threat Analysis</CardTitle>
              <CardDescription>Security threat detection and mitigation summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{securityMetrics.threats.blocked}</div>
                  <p className="text-sm text-gray-600">Threats Blocked</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{securityMetrics.threats.detected}</div>
                  <p className="text-sm text-gray-600">Threats Detected</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{securityMetrics.threats.mitigated}</div>
                  <p className="text-sm text-gray-600">Threats Mitigated</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{securityMetrics.threats.investigating}</div>
                  <p className="text-sm text-gray-600">Under Investigation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Monitoring Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monitoringData.activeAlerts.length}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Log Events</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,672</div>
                <p className="text-xs text-muted-foreground">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monitoringData.recentIncidents.length}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MTTR</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2h</div>
                <p className="text-xs text-muted-foreground">Mean time to recovery</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Current system alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {monitoringData.activeAlerts.length > 0 ? (
                <div className="space-y-3">
                  {monitoringData.activeAlerts.map((alert) => (
                    <div key={alert.id} className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(alert.severity)}
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={getStatusBadge(alert.severity)}>{alert.severity}</Badge>
                            {alert.acknowledged && (
                              <Badge variant="outline">Acknowledged</Badge>
                            )}
                          </div>
                          <p className="text-sm mt-2">{alert.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600">
                            <span>Duration: {alert.duration}</span>
                            <span>Started: {new Date(alert.timestamp).toLocaleString()}</span>
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
                          <Button size="sm" variant="outline">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No Active Alerts</h3>
                  <p className="text-gray-600">All monitoring checks are passing</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Incidents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>Historical incident tracking and resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Affected Services</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitoringData.recentIncidents.map((incident, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{incident.id}</TableCell>
                      <TableCell>{incident.title}</TableCell>
                      <TableCell>
                        <Badge variant={
                          incident.severity === 'high' ? 'destructive' :
                          incident.severity === 'medium' ? 'secondary' : 'outline'
                        }>
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
                            <Badge key={idx} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* System Logs */}
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Real-time system log monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Filter logs..."
                      className="w-64"
                    />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
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
                    <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <div className="bg-black text-green-400 p-3 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4" />
                      <span className="text-sm font-medium">System Logs</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 font-mono text-sm space-y-1 max-h-64 overflow-y-auto">
                    {monitoringData.logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-gray-500">{log.timestamp}</span>
                        <span className={`font-medium ${
                          log.level === 'ERROR' ? 'text-red-600' :
                          log.level === 'WARN' ? 'text-yellow-600' :
                          log.level === 'INFO' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {log.level}
                        </span>
                        <span className="text-purple-600">[{log.service}]</span>
                        <span className="text-gray-800">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Maintenance Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Maintenance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maintenanceSchedule.length}</div>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Optimal</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3 days</div>
                <p className="text-xs text-muted-foreground">Database optimization</p>
              </CardContent>
            </Card>
          </div>

          {/* Scheduled Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Maintenance</CardTitle>
              <CardDescription>Upcoming maintenance windows and system updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceSchedule.map((maintenance) => (
                  <div key={maintenance.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium">{maintenance.title}</h4>
                          <Badge variant={
                            maintenance.type === 'security' ? 'destructive' :
                            maintenance.type === 'maintenance' ? 'secondary' : 'default'
                          }>
                            {maintenance.type}
                          </Badge>
                          <Badge variant={
                            maintenance.impact === 'high' ? 'destructive' :
                            maintenance.impact === 'medium' ? 'secondary' : 'outline'
                          }>
                            {maintenance.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{maintenance.description}</p>
                        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Scheduled: {new Date(maintenance.scheduledDate).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Activity className="h-4 w-4" />
                            <span>Duration: {maintenance.duration}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm text-gray-600">Affected services:</span>
                          {maintenance.services.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button size="sm" variant="outline">
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
            <Card>
              <CardHeader>
                <CardTitle>Available Updates</CardTitle>
                <CardDescription>System components requiring updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium">Security Patch</p>
                        <p className="text-sm text-gray-600">OpenSSL 3.0.8 → 3.0.9</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">Critical</Badge>
                      <Button size="sm" className="ml-2">Install</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Server className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">System Update</p>
                        <p className="text-sm text-gray-600">Node.js 18.16.0 → 18.17.0</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Optional</Badge>
                      <Button size="sm" variant="outline" className="ml-2">Install</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Database Update</p>
                        <p className="text-sm text-gray-600">PostgreSQL 15.2 → 15.3</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">Recommended</Badge>
                      <Button size="sm" variant="outline" className="ml-2">Schedule</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Configuration</CardTitle>
                <CardDescription>Configure maintenance window preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="maintenance-window">Preferred Maintenance Window</Label>
                    <Select defaultValue="weekend">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekend">Weekend (Sat 2:00 AM - 6:00 AM UTC)</SelectItem>
                        <SelectItem value="weeknight">Weeknight (Tue-Thu 2:00 AM - 4:00 AM UTC)</SelectItem>
                        <SelectItem value="custom">Custom Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="auto-updates" defaultChecked />
                    <Label htmlFor="auto-updates">Enable automatic security updates</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" defaultChecked />
                    <Label htmlFor="notifications">Send maintenance notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="rollback" defaultChecked />
                    <Label htmlFor="rollback">Enable automatic rollback on failure</Label>
                  </div>

                  <div>
                    <Label htmlFor="notification-advance">Notification Advance Time</Label>
                    <Select defaultValue="24h">
                      <SelectTrigger>
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

                  <Button className="w-full">
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
  );
}
