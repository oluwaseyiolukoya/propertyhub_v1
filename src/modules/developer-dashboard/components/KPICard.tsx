import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, LucideIcon, Info } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  status?: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning';
  };
  loading?: boolean;
  className?: string;
  tooltip?: string;
  reverseLayout?: boolean; // Show subtitle above value
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status,
  loading = false,
  className = '',
  tooltip,
  reverseLayout = false,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';

    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
    }
  };

  const getStatusVariantClass = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return '';
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                {subtitle && <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />}
              </div>
            ) : reverseLayout ? (
              <>
                {/* Reversed layout: subtitle above value */}
                {subtitle && (
                  <p className="text-sm text-gray-500 mb-1">{subtitle}</p>
                )}

                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-red-600">{value}</p>
                  {status && (
                    <Badge
                      variant={status.variant as any}
                      className={getStatusVariantClass(status.variant)}
                    >
                      {status.label}
                    </Badge>
                  )}
                </div>

                {trend && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                      {getTrendIcon()}
                      <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                    </div>
                    {trend.label && (
                      <p className="text-sm text-gray-500">{trend.label}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Standard layout: value above subtitle */}
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  {status && (
                    <Badge
                      variant={status.variant as any}
                      className={getStatusVariantClass(status.variant)}
                    >
                      {status.label}
                    </Badge>
                  )}
                </div>

                {(subtitle || trend) && (
                  <div className="flex items-center gap-2 mt-2">
                    {trend && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                      </div>
                    )}
                    {subtitle && (
                      <p className="text-sm text-gray-500">{subtitle}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;

