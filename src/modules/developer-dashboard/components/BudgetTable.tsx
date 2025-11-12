import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import type { BudgetLineItem, BudgetStatus } from '../types';

interface BudgetTableProps {
  items: BudgetLineItem[];
  currency?: string;
  editable?: boolean;
  onEdit?: (item: BudgetLineItem) => void;
  onDelete?: (itemId: string) => void;
  onUpdate?: (itemId: string, updates: Partial<BudgetLineItem>) => void;
  loading?: boolean;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  items,
  currency = 'NGN',
  editable = false,
  onEdit,
  onDelete,
  onUpdate,
  loading = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BudgetLineItem>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: BudgetStatus) => {
    const variants: Record<BudgetStatus, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      'in-progress': { variant: 'default', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      overrun: { variant: 'destructive', label: 'Overrun' },
    };

    const config = variants[status] || variants.pending;
    const className = config.variant === 'success'
      ? 'bg-green-100 text-green-800 hover:bg-green-100'
      : '';

    return (
      <Badge variant={config.variant} className={className}>
        {config.label}
      </Badge>
    );
  };

  const getVarianceColor = (variancePercent: number) => {
    if (variancePercent > 10) return 'text-red-600 font-semibold';
    if (variancePercent > 0) return 'text-yellow-600';
    if (variancePercent < -5) return 'text-green-600';
    return 'text-gray-600';
  };

  const handleStartEdit = (item: BudgetLineItem) => {
    setEditingId(item.id);
    setEditValues({
      actualAmount: item.actualAmount,
      status: item.status,
    });
  };

  const handleSaveEdit = () => {
    if (editingId && onUpdate) {
      onUpdate(editingId, editValues);
    }
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No budget line items found</p>
        <p className="text-sm mt-2">Add your first budget item to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Planned</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">Variance %</TableHead>
            <TableHead>Status</TableHead>
            {editable && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="capitalize">{item.category.replace('-', ' ')}</span>
                    {item.subcategory && (
                      <span className="text-xs text-gray-500">{item.subcategory}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={item.description}>
                    {item.description}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.plannedAmount)}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editValues.actualAmount || 0}
                      onChange={(e) =>
                        setEditValues({ ...editValues, actualAmount: parseFloat(e.target.value) })
                      }
                      className="w-32 text-right"
                    />
                  ) : (
                    <span className="font-medium">{formatCurrency(item.actualAmount)}</span>
                  )}
                </TableCell>
                <TableCell className={`text-right ${getVarianceColor(item.variancePercent)}`}>
                  {item.variance >= 0 ? '+' : ''}
                  {formatCurrency(item.variance)}
                </TableCell>
                <TableCell className={`text-right ${getVarianceColor(item.variancePercent)}`}>
                  {item.variancePercent >= 0 ? '+' : ''}
                  {item.variancePercent.toFixed(1)}%
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                {editable && (
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete?.(item.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Summary Row */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex justify-end gap-8 text-sm font-semibold">
          <div>
            <span className="text-gray-600">Total Planned: </span>
            <span>{formatCurrency(items.reduce((sum, item) => sum + item.plannedAmount, 0))}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Actual: </span>
            <span>{formatCurrency(items.reduce((sum, item) => sum + item.actualAmount, 0))}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Variance: </span>
            <span
              className={getVarianceColor(
                items.reduce((sum, item) => sum + item.variance, 0) /
                  items.reduce((sum, item) => sum + item.plannedAmount, 0) *
                  100
              )}
            >
              {formatCurrency(items.reduce((sum, item) => sum + item.variance, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTable;

