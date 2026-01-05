import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft, Download, Filter, Receipt } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ExpensesList } from "./ExpensesList";
import { AddExpenseModal } from "./AddExpenseModal";
import { EditExpenseModal } from "./EditExpenseModal";
import { getProjectById } from "../services/developerDashboard.api";

interface ExpenseManagementPageProps {
  projectId: string;
  projectName: string;
  projectCurrency?: string;
  onBack: () => void;
}

export function ExpenseManagementPage({
  projectId,
  projectName,
  projectCurrency: propProjectCurrency = "NGN",
  onBack,
}: ExpenseManagementPageProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [projectCurrency, setProjectCurrency] = useState<string>(propProjectCurrency);

  // Fetch project currency
  useEffect(() => {
    const fetchProjectCurrency = async () => {
      try {
        const response = await getProjectById(projectId);
        if (response.success && response.data) {
          setProjectCurrency(response.data.currency || propProjectCurrency);
        }
      } catch (error) {
        console.error('Failed to fetch project currency:', error);
        // Keep prop currency if fetch fails
      }
    };

    if (projectId) {
      fetchProjectCurrency();
    }
  }, [projectId, propProjectCurrency]);

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setShowEditExpense(true);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSuccess = () => {
    handleRefresh();
  };

  return (
    <div className="space-y-5 md:space-y-6 p-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] rounded-xl p-8 text-white overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative space-y-4">
          <Button
            variant="ghost"
            className="gap-2 text-white hover:bg-white/20 -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
                <Receipt className="h-8 w-8 text-white" />
                <span>Expense Management</span>
              </h1>
              <p className="text-purple-100">
                Manage all expenses for {projectName}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                onClick={handleRefresh}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="default"
                className="gap-2 bg-white text-[#7C3AED] hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => setShowAddExpense(true)}
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <ExpensesList
        key={refreshKey}
        projectId={projectId}
        projectCurrency={projectCurrency}
        onEdit={handleEditExpense}
        onRefresh={handleRefresh}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        projectId={projectId}
        projectCurrency={projectCurrency}
        onSuccess={handleSuccess}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        open={showEditExpense}
        onClose={() => {
          setShowEditExpense(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        projectId={projectId}
        projectCurrency={projectCurrency}
        onSuccess={handleSuccess}
      />
    </div>
  );
}












