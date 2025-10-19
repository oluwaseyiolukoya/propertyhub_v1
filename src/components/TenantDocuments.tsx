import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  FileText, 
  Download,
  Eye,
  Search,
  File,
  FileCheck,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

const TenantDocuments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const documents = [
    {
      id: 1,
      name: "Lease Agreement 2024",
      type: "lease",
      category: "Lease Documents",
      dateAdded: "Jan 1, 2024",
      size: "2.4 MB",
      format: "PDF",
      description: "Annual lease agreement for Unit 204",
      uploadedBy: "Property Manager"
    },
    {
      id: 2,
      name: "Move-In Inspection Report",
      type: "inspection",
      category: "Inspections",
      dateAdded: "Jan 1, 2024",
      size: "1.8 MB",
      format: "PDF",
      description: "Initial condition report with photos",
      uploadedBy: "Property Manager"
    },
    {
      id: 3,
      name: "October 2024 Rent Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Oct 1, 2024",
      size: "156 KB",
      format: "PDF",
      description: "Payment confirmation for October rent",
      uploadedBy: "System"
    },
    {
      id: 4,
      name: "September 2024 Rent Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Sep 1, 2024",
      size: "158 KB",
      format: "PDF",
      description: "Payment confirmation for September rent",
      uploadedBy: "System"
    },
    {
      id: 5,
      name: "August 2024 Rent Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Aug 1, 2024",
      size: "157 KB",
      format: "PDF",
      description: "Payment confirmation for August rent",
      uploadedBy: "System"
    },
    {
      id: 6,
      name: "Property Rules & Regulations",
      type: "policy",
      category: "Property Policies",
      dateAdded: "Jan 1, 2024",
      size: "890 KB",
      format: "PDF",
      description: "Community rules and tenant guidelines",
      uploadedBy: "Property Manager"
    },
    {
      id: 7,
      name: "Parking Policy",
      type: "policy",
      category: "Property Policies",
      dateAdded: "Jan 1, 2024",
      size: "345 KB",
      format: "PDF",
      description: "Parking rules and assigned spaces",
      uploadedBy: "Property Manager"
    },
    {
      id: 8,
      name: "Security Deposit Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Jan 1, 2024",
      size: "234 KB",
      format: "PDF",
      description: "Security deposit payment confirmation",
      uploadedBy: "Property Manager"
    },
    {
      id: 9,
      name: "Renters Insurance Policy",
      type: "insurance",
      category: "Insurance",
      dateAdded: "Jan 5, 2024",
      size: "1.2 MB",
      format: "PDF",
      description: "Active renters insurance policy",
      uploadedBy: "Sarah Johnson"
    },
    {
      id: 10,
      name: "Pool Maintenance Notice",
      type: "notice",
      category: "Notices",
      dateAdded: "Oct 15, 2024",
      size: "189 KB",
      format: "PDF",
      description: "Scheduled maintenance notification",
      uploadedBy: "Property Manager"
    }
  ];

  const getDocumentIcon = (type: string) => {
    switch(type) {
      case 'lease': return <FileCheck className="h-5 w-5 text-blue-600" />;
      case 'receipt': return <FileText className="h-5 w-5 text-green-600" />;
      case 'policy': return <File className="h-5 w-5 text-purple-600" />;
      case 'insurance': return <FileCheck className="h-5 w-5 text-orange-600" />;
      case 'notice': return <FileText className="h-5 w-5 text-yellow-600" />;
      case 'inspection': return <FileCheck className="h-5 w-5 text-indigo-600" />;
      default: return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leaseDocuments = documents.filter(doc => doc.type === 'lease' || doc.type === 'inspection');
  const receipts = documents.filter(doc => doc.type === 'receipt');
  const policies = documents.filter(doc => doc.type === 'policy' || doc.type === 'notice');
  const insurance = documents.filter(doc => doc.type === 'insurance');

  const handleDownload = (documentName: string) => {
    toast.success(`Downloading ${documentName}...`);
  };

  const handleView = (documentName: string) => {
    toast.info(`Opening ${documentName}...`);
  };

  const DocumentCard = ({ doc }: { doc: any }) => (
    <Card className="hover:border-blue-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            {getDocumentIcon(doc.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium truncate">{doc.name}</h4>
                <p className="text-sm text-muted-foreground">{doc.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{doc.format} • {doc.size}</span>
                <span>•</span>
                <span>{doc.dateAdded}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleView(doc.name)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.name)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Documents</h1>
        <p className="text-muted-foreground">Access your lease, receipts, and important documents</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              All files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lease Documents</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaseDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active lease
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
            <p className="text-xs text-muted-foreground">
              Payment records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="lease">Lease & Inspections</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="policies">Policies & Notices</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lease" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lease & Inspection Documents</CardTitle>
              <CardDescription>Your lease agreement and property inspection reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaseDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc.name)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Receipts</CardTitle>
                  <CardDescription>All your payment confirmations and receipts</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {receipts.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc.name)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Policies & Notices</CardTitle>
              <CardDescription>Rules, regulations, and property notices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {policies.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc.name)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Documents</CardTitle>
              <CardDescription>Your renters insurance policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insurance.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc.name)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantDocuments;


