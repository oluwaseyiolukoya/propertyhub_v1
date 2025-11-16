import React, { useState } from "react";
import { Plus, ArrowLeft, Download, Filter } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ExpensesList } from "./ExpensesList";
import { AddExpenseModal } from "./AddExpenseModal";
import { EditExpenseModal } from "./EditExpenseModal";

interface ExpenseManagementPageProps {
  projectId: string;
  projectName: string;
  projectCurrency?: string;
  onBack: () => void;
}

export function ExpenseManagementPage({
  projectId,
  projectName,
  projectCurrency = "NGN",
  onBack,
}: ExpenseManagementPageProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Project Dashboard
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
            <p className="text-gray-600 mt-2">
              Manage all expenses for {projectName}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => setShowAddExpense(true)}
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
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
        onSuccess={handleSuccess}
      />
    </div>
  );
}




