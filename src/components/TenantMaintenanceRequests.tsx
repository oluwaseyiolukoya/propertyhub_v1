import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Wrench, 
  Plus, 
  Clock,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

const TenantMaintenanceRequests: React.FC = () => {
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newRequest, setNewRequest] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
    images: [] as string[]
  });

  // Mock data
  const maintenanceRequests = [
    {
      id: 1,
      title: "Kitchen Faucet Leak",
      category: "Plumbing",
      priority: "high",
      status: "in-progress",
      dateSubmitted: "Oct 10, 2024",
      dateScheduled: "Oct 18, 2024",
      description: "The kitchen faucet has been dripping constantly for the past 3 days. Water is collecting under the sink.",
      assignedTo: "Mike Wilson - ProPlumb Services",
      estimatedTime: "2-3 hours",
      updates: [
        { date: "Oct 15, 2024", message: "Technician assigned. Will arrive on Oct 18 between 9-11 AM.", by: "System" },
        { date: "Oct 10, 2024", message: "Request received and under review.", by: "Property Manager" }
      ]
    },
    {
      id: 2,
      title: "AC Not Cooling Properly",
      category: "HVAC",
      priority: "high",
      status: "scheduled",
      dateSubmitted: "Oct 8, 2024",
      dateScheduled: "Oct 19, 2024",
      description: "The air conditioning unit is running but not cooling the apartment effectively. Temperature stays around 78°F even when set to 68°F.",
      assignedTo: "CoolTech HVAC",
      estimatedTime: "1-2 hours",
      updates: [
        { date: "Oct 12, 2024", message: "HVAC technician scheduled for Oct 19 between 1-3 PM.", by: "Property Manager" },
        { date: "Oct 8, 2024", message: "Request received. Scheduling technician.", by: "System" }
      ]
    },
    {
      id: 3,
      title: "Bedroom Light Fixture",
      category: "Electrical",
      priority: "medium",
      status: "completed",
      dateSubmitted: "Sep 28, 2024",
      dateCompleted: "Oct 2, 2024",
      description: "The light fixture in the master bedroom is flickering and sometimes doesn't turn on.",
      assignedTo: "John's Electric",
      completionNotes: "Replaced faulty light fixture. All working properly now.",
      updates: [
        { date: "Oct 2, 2024", message: "Work completed. Fixture replaced.", by: "John's Electric" },
        { date: "Sep 30, 2024", message: "Electrician will arrive Oct 2 at 10 AM.", by: "Property Manager" },
        { date: "Sep 28, 2024", message: "Request received.", by: "System" }
      ]
    },
    {
      id: 4,
      title: "Dishwasher Not Draining",
      category: "Appliances",
      priority: "medium",
      status: "pending",
      dateSubmitted: "Oct 16, 2024",
      description: "Dishwasher fills with water but doesn't drain properly. Water stays in the bottom after cycle completes.",
      updates: [
        { date: "Oct 16, 2024", message: "Request received. Reviewing with maintenance team.", by: "System" }
      ]
    },
    {
      id: 5,
      title: "Broken Window Lock",
      category: "Security",
      priority: "high",
      status: "pending",
      dateSubmitted: "Oct 15, 2024",
      description: "The lock on the living room window is broken and the window won't stay closed securely.",
      updates: [
        { date: "Oct 15, 2024", message: "Request received. This is a priority item.", by: "Property Manager" }
      ]
    }
  ];

  const categories = [
    "Plumbing",
    "Electrical",
    "HVAC",
    "Appliances",
    "Flooring",
    "Windows/Doors",
    "Pest Control",
    "Security",
    "Other"
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitRequest = () => {
    setShowNewRequestDialog(false);
    setNewRequest({
      title: '',
      category: '',
      priority: 'medium',
      description: '',
      images: []
    });
    toast.success('Maintenance request submitted successfully!');
  };

  const activeRequests = maintenanceRequests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  const completedRequests = maintenanceRequests.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Maintenance Requests</h1>
          <p className="text-muted-foreground">Submit and track maintenance requests</p>
        </div>
        <Button onClick={() => setShowNewRequestDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Pending or in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceRequests.filter(r => r.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Appointments set
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceRequests.filter(r => r.status === 'in-progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {activeRequests.map((request) => (
              <Card key={request.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setSelectedRequest(request)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <CardDescription>{request.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{request.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-sm font-medium">{request.dateSubmitted}</p>
                    </div>
                    {request.dateScheduled && (
                      <div>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                        <p className="text-sm font-medium">{request.dateScheduled}</p>
                      </div>
                    )}
                    {request.assignedTo && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Assigned To</p>
                        <p className="text-sm font-medium">{request.assignedTo}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {completedRequests.map((request) => (
              <Card key={request.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setSelectedRequest(request)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <CardDescription>{request.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{request.description}</p>
                  {request.completionNotes && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-900"><span className="font-medium">Completion Notes:</span> {request.completionNotes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-sm font-medium">{request.dateSubmitted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-sm font-medium">{request.dateCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {maintenanceRequests.map((request) => (
              <Card key={request.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setSelectedRequest(request)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <CardDescription>{request.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{request.description}</p>
                  <div className="flex items-center space-x-4 pt-3 border-t text-sm text-muted-foreground">
                    <span>Submitted: {request.dateSubmitted}</span>
                    {request.assignedTo && <span>• {request.assignedTo}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
            <DialogDescription>
              Describe the issue and we'll get it taken care of
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={newRequest.category} onValueChange={(value) => setNewRequest({ ...newRequest, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newRequest.priority} onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the maintenance issue..."
                rows={4}
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Photos (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Upload photos of the issue</p>
                <Button variant="outline" size="sm">Choose Files</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRequest}
              disabled={!newRequest.title || !newRequest.category || !newRequest.description}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={selectedRequest !== null} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-xl mb-2">{selectedRequest.title}</DialogTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getStatusColor(selectedRequest.status)}>
                        {selectedRequest.status}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(selectedRequest.priority)}>
                        {selectedRequest.priority}
                      </Badge>
                      <Badge variant="outline">{selectedRequest.category}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date Submitted</p>
                    <p className="text-sm font-medium">{selectedRequest.dateSubmitted}</p>
                  </div>
                  {selectedRequest.dateScheduled && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Scheduled Date</p>
                      <p className="text-sm font-medium">{selectedRequest.dateScheduled}</p>
                    </div>
                  )}
                  {selectedRequest.dateCompleted && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Completed Date</p>
                      <p className="text-sm font-medium">{selectedRequest.dateCompleted}</p>
                    </div>
                  )}
                  {selectedRequest.assignedTo && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                      <p className="text-sm font-medium">{selectedRequest.assignedTo}</p>
                    </div>
                  )}
                  {selectedRequest.estimatedTime && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                      <p className="text-sm font-medium">{selectedRequest.estimatedTime}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.completionNotes && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Completion Notes</h4>
                    <p className="text-sm text-green-800">{selectedRequest.completionNotes}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Updates & Activity</h4>
                  <div className="space-y-3">
                    {selectedRequest.updates.map((update: any, index: number) => (
                      <div key={index} className="flex space-x-3 pb-3 border-b last:border-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{update.by}</p>
                            <p className="text-xs text-muted-foreground">{update.date}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantMaintenanceRequests;


