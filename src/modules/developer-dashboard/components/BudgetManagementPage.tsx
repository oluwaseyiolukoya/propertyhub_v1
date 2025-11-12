import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  Trash2,
  Wallet,
  Edit,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';

interface BudgetLine {
  id: number;
  category: string;
  planned: number;
  actual: number;
  variance: number;
  status: string;
  phase: string;
}

interface BudgetManagementPageProps {
  projectId: string;
}

// Mock project data - will be replaced with API call
const mockProject = {
  id: 'proj-1',
  name: 'Lekki Heights Residential',
  stage: 'Construction Phase',
  region: 'Lagos, Nigeria',
  status: 'Active',
  budget: 3500000000,
};

// Initial budget data
const initialBudgetData: BudgetLine[] = [
  {
    id: 1,
    category: 'Foundation & Structure',
    planned: 950000000,
    actual: 920000000,
    variance: -3.2,
    status: 'On Track',
    phase: 'Construction',
  },
  {
    id: 2,
    category: 'MEP Systems',
    planned: 620000000,
    actual: 714000000,
    variance: 15.2,
    status: 'Over Budget',
    phase: 'Construction',
  },
  {
    id: 3,
    category: 'Interior Finishing',
    planned: 480000000,
    actual: 518400000,
    variance: 8.0,
    status: 'Warning',
    phase: 'Construction',
  },
  {
    id: 4,
    category: 'Exterior & Sitework',
    planned: 320000000,
    actual: 304000000,
    variance: -5.0,
    status: 'Under Budget',
    phase: 'Construction',
  },
  {
    id: 5,
    category: 'Equipment & Fixtures',
    planned: 280000000,
    actual: 294000000,
    variance: 5.0,
    status: 'Warning',
    phase: 'Completion',
  },
  {
    id: 6,
    category: 'Landscaping',
    planned: 150000000,
    actual: 0,
    variance: 0,
    status: 'Not Started',
    phase: 'Planning',
  },
  {
    id: 7,
    category: 'Permits & Fees',
    planned: 85000000,
    actual: 82500000,
    variance: -2.9,
    status: 'On Track',
    phase: 'Planning',
  },
  {
    id: 8,
    category: 'Contingency',
    planned: 350000000,
    actual: 120000000,
    variance: -65.7,
    status: 'Reserve',
    phase: 'All Phases',
  },
];

export const BudgetManagementPage: React.FC<BudgetManagementPageProps> = ({ projectId }) => {
  const [budgetData, setBudgetData] = useState<BudgetLine[]>(initialBudgetData);
  const [selectedBudget, setSelectedBudget] = useState<BudgetLine | null>(null);
  const [filterPhase, setFilterPhase] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newBudgetLine, setNewBudgetLine] = useState({
    category: '',
    planned: '',
    actual: '',
    phase: '',
    notes: '',
  });
  const [editBudgetLine, setEditBudgetLine] = useState({
    category: '',
    planned: '',
    actual: '',
    phase: '',
    notes: '',
  });

  const project = mockProject;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'On Track':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">On Track</Badge>;
      case 'Over Budget':
        return <Badge variant="destructive">Over Budget</Badge>;
      case 'Warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Warning</Badge>;
      case 'Under Budget':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Under Budget</Badge>;
      case 'Not Started':
        return <Badge variant="outline">Not Started</Badge>;
      case 'Reserve':
        return <Badge variant="secondary">Reserve</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredData = budgetData.filter((item) => {
    const matchesPhase = filterPhase === 'all' || item.phase === filterPhase;
    const matchesSearch =
      !searchTerm ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPhase && matchesSearch;
  });

  const handleAddBudgetLine = () => {
    const planned = parseFloat(newBudgetLine.planned);
    const actual = parseFloat(newBudgetLine.actual) || 0;
    const variance = planned > 0 ? ((actual - planned) / planned) * 100 : 0;

    let status = 'Not Started';
    if (actual === 0) {
      status = 'Not Started';
    } else if (variance > 10) {
      status = 'Over Budget';
    } else if (variance > 5) {
      status = 'Warning';
    } else if (variance < -5) {
      status = 'Under Budget';
    } else {
      status = 'On Track';
    }

    const newLine: BudgetLine = {
      id: Math.max(...budgetData.map((b) => b.id), 0) + 1,
      category: newBudgetLine.category,
      planned,
      actual,
      variance,
      status,
      phase: newBudgetLine.phase,
    };

    setBudgetData([...budgetData, newLine]);
    setIsAddDialogOpen(false);
    setNewBudgetLine({
      category: '',
      planned: '',
      actual: '',
      phase: '',
      notes: '',
    });

    toast.success('Budget line added successfully', {
      description: `${newBudgetLine.category} has been added to ${project.name}.`,
    });
  };

  const handleEditBudgetLine = () => {
    if (!selectedBudget) return;

    const planned = parseFloat(editBudgetLine.planned);
    const actual = parseFloat(editBudgetLine.actual) || 0;
    const variance = planned > 0 ? ((actual - planned) / planned) * 100 : 0;

    let status = 'Not Started';
    if (actual === 0) {
      status = 'Not Started';
    } else if (variance > 10) {
      status = 'Over Budget';
    } else if (variance > 5) {
      status = 'Warning';
    } else if (variance < -5) {
      status = 'Under Budget';
    } else {
      status = 'On Track';
    }

    const updatedLine: BudgetLine = {
      id: selectedBudget.id,
      category: editBudgetLine.category,
      planned,
      actual,
      variance,
      status,
      phase: editBudgetLine.phase,
    };

    setBudgetData(budgetData.map((b) => (b.id === selectedBudget.id ? updatedLine : b)));
    setIsEditDialogOpen(false);
    setSelectedBudget(null);

    toast.success('Budget line updated successfully', {
      description: `${editBudgetLine.category} has been updated.`,
    });
  };

  const openEditDialog = () => {
    if (selectedBudget) {
      setEditBudgetLine({
        category: selectedBudget.category,
        planned: selectedBudget.planned.toString(),
        actual: selectedBudget.actual.toString(),
        phase: selectedBudget.phase,
        notes: '',
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteBudgetLine = () => {
    if (!selectedBudget) return;

    setBudgetData(budgetData.filter((b) => b.id !== selectedBudget.id));
    setIsDeleteDialogOpen(false);
    setSelectedBudget(null);

    toast.success('Budget line deleted successfully', {
      description: `${selectedBudget.category} has been removed from ${project.name}.`,
    });
  };

  const isFormValid = () => {
    return (
      newBudgetLine.category.trim() !== '' &&
      newBudgetLine.planned.trim() !== '' &&
      !isNaN(parseFloat(newBudgetLine.planned)) &&
      parseFloat(newBudgetLine.planned) > 0 &&
      newBudgetLine.phase !== ''
    );
  };

  const isEditFormValid = () => {
    return (
      editBudgetLine.category.trim() !== '' &&
      editBudgetLine.planned.trim() !== '' &&
      !isNaN(parseFloat(editBudgetLine.planned)) &&
      parseFloat(editBudgetLine.planned) > 0 &&
      editBudgetLine.phase !== ''
    );
  };

  // Calculate totals
  const totalPlanned = budgetData.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = budgetData.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalPlanned - totalActual;
  const budgetUtilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
          <p className="text-gray-600">Manage and track project budget allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Budget Line
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Project</p>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{project.stage}</span>
                <span>•</span>
                <span>{project.region}</span>
                <span>•</span>
                <Badge variant="outline">{project.status}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Project Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Planned</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPlanned)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Actual</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalActual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Variance</p>
            <p className={`text-xl font-bold ${totalVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(totalVariance))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Budget Utilization</p>
            <p className="text-xl font-bold text-gray-900">{budgetUtilization.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search budget categories..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterPhase} onValueChange={setFilterPhase}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Completion">Completion</SelectItem>
                <SelectItem value="All Phases">All Phases</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead className="text-right">Planned Amount</TableHead>
                <TableHead className="text-right">Actual Amount</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedBudget(item)}
                  >
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{item.phase}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.planned)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        item.variance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {item.variance > 0 ? '+' : ''}
                      {item.variance.toFixed(1)}%
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Wallet className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">No budget lines yet</p>
                        <p className="text-sm text-gray-500">
                          Click "Add Budget Line" to create your first budget item
                        </p>
                      </div>
                      <Button onClick={() => setIsAddDialogOpen(true)} className="mt-2 gap-2">
                        <Plus className="w-4 h-4" />
                        Add Budget Line
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Side Panel */}
      <Sheet open={!!selectedBudget} onOpenChange={() => setSelectedBudget(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Budget Line Details</SheetTitle>
            <SheetDescription>{selectedBudget?.category}</SheetDescription>
          </SheetHeader>
          {selectedBudget && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Planned Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(selectedBudget.planned)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Actual Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(selectedBudget.actual)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Variance</p>
                  <p
                    className={`font-semibold ${
                      selectedBudget.variance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {selectedBudget.variance > 0 ? '+' : ''}
                    {selectedBudget.variance.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  {getStatusBadge(selectedBudget.status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Phase</p>
                <Badge variant="outline">{selectedBudget.phase}</Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-sm text-gray-700">
                  This budget line includes all costs associated with {selectedBudget.category.toLowerCase()}.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={openEditDialog}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Budget Line
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Transactions
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Budget Line
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Budget Line Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Budget Line</DialogTitle>
            <DialogDescription>Create a new budget line item for your project.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category"
                placeholder="e.g., HVAC Installation"
                value={newBudgetLine.category}
                onChange={(e) => setNewBudgetLine({ ...newBudgetLine, category: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planned">
                  Planned Amount (₦) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="planned"
                  type="number"
                  placeholder="250000000"
                  value={newBudgetLine.planned}
                  onChange={(e) => setNewBudgetLine({ ...newBudgetLine, planned: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual">Actual Amount (₦)</Label>
                <Input
                  id="actual"
                  type="number"
                  placeholder="0"
                  value={newBudgetLine.actual}
                  onChange={(e) => setNewBudgetLine({ ...newBudgetLine, actual: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase">
                Phase <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newBudgetLine.phase}
                onValueChange={(value) => setNewBudgetLine({ ...newBudgetLine, phase: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Completion">Completion</SelectItem>
                  <SelectItem value="All Phases">All Phases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or details..."
                rows={3}
                value={newBudgetLine.notes}
                onChange={(e) => setNewBudgetLine({ ...newBudgetLine, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewBudgetLine({
                  category: '',
                  planned: '',
                  actual: '',
                  phase: '',
                  notes: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddBudgetLine} disabled={!isFormValid()}>
              Add Budget Line
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Line Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Budget Line</DialogTitle>
            <DialogDescription>Update the budget line item details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-category"
                placeholder="e.g., HVAC Installation"
                value={editBudgetLine.category}
                onChange={(e) => setEditBudgetLine({ ...editBudgetLine, category: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-planned">
                  Planned Amount (₦) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-planned"
                  type="number"
                  placeholder="250000000"
                  value={editBudgetLine.planned}
                  onChange={(e) => setEditBudgetLine({ ...editBudgetLine, planned: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-actual">Actual Amount (₦)</Label>
                <Input
                  id="edit-actual"
                  type="number"
                  placeholder="0"
                  value={editBudgetLine.actual}
                  onChange={(e) => setEditBudgetLine({ ...editBudgetLine, actual: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phase">
                Phase <span className="text-red-500">*</span>
              </Label>
              <Select
                value={editBudgetLine.phase}
                onValueChange={(value) => setEditBudgetLine({ ...editBudgetLine, phase: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Completion">Completion</SelectItem>
                  <SelectItem value="All Phases">All Phases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any additional notes or details..."
                rows={3}
                value={editBudgetLine.notes}
                onChange={(e) => setEditBudgetLine({ ...editBudgetLine, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditBudgetLine({
                  category: '',
                  planned: '',
                  actual: '',
                  phase: '',
                  notes: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditBudgetLine} disabled={!isEditFormValid()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the budget line "{selectedBudget?.category}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBudgetLine}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetManagementPage;

