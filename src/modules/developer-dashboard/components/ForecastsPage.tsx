import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Slider } from "../../../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Activity,
  RefreshCw,
  TrendingDown
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ForecastsPageProps {
  projectId: string;
}

interface ForecastDataPoint {
  month: string;
  actual: number | null;
  predicted: number;
}

interface CostDriver {
  category: string;
  current: number;
  trend: number;
  impact: "High" | "Medium" | "Low";
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [materialCostAdjustment, setMaterialCostAdjustment] = useState([0]);
  const [laborCostAdjustment, setLaborCostAdjustment] = useState([0]);

  // Mock data - replace with API calls
  const baselineForecastData: ForecastDataPoint[] = [
    { month: "Jan", actual: 420000, predicted: 420000 },
    { month: "Feb", actual: 495000, predicted: 495000 },
    { month: "Mar", actual: 510000, predicted: 510000 },
    { month: "Apr", actual: 570000, predicted: 570000 },
    { month: "May", actual: 600000, predicted: 600000 },
    { month: "Jun", actual: 640000, predicted: 640000 },
    { month: "Jul", actual: null, predicted: 680000 },
    { month: "Aug", actual: null, predicted: 720000 },
    { month: "Sep", actual: null, predicted: 650000 },
    { month: "Oct", actual: null, predicted: 580000 },
    { month: "Nov", actual: null, predicted: 520000 },
    { month: "Dec", actual: null, predicted: 480000 },
  ];

  const costDriversData: CostDriver[] = [
    { category: "Labor", current: 1200000, trend: 8.5, impact: "High" },
    { category: "Materials", current: 950000, trend: 12.3, impact: "High" },
    { category: "Equipment", current: 450000, trend: -2.1, impact: "Medium" },
    { category: "Permits", current: 85000, trend: 0, impact: "Low" },
    { category: "Overhead", current: 320000, trend: 3.2, impact: "Medium" },
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [projectId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleRefreshForecast = () => {
    console.log(`Refreshing forecast for project ${projectId}`);
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleViewRecommendations = () => {
    console.log('Viewing AI recommendations');
  };

  const handleAdjustForecast = () => {
    console.log('Adjusting forecast parameters');
  };

  const handleApplyScenario = () => {
    console.log('Applying scenario with adjustments:', {
      material: materialCostAdjustment[0],
      labor: laborCostAdjustment[0]
    });
  };

  const calculateImpact = () => {
    return (materialCostAdjustment[0] * 9500) + (laborCostAdjustment[0] * 12000);
  };

  const calculateNewCost = () => {
    return 3620000 + calculateImpact();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading forecasts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forecasting & Insights</h1>
          <p className="text-gray-600">AI-powered predictions and scenario planning</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleRefreshForecast}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Forecast
        </Button>
      </div>

      {/* AI Insight Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-blue-900">AI Forecast Insight</h3>
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white">High Confidence</Badge>
              </div>
              <p className="text-blue-800 mb-3">
                Based on current spending trends and market conditions, the project is forecasted to exceed
                budget by <span className="font-semibold">+12% ($420,000)</span> by completion in June 2026.
                Primary cost drivers are MEP systems and material price increases.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleViewRecommendations}
                >
                  View Recommendations
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAdjustForecast}
                >
                  Adjust Forecast
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actual vs Predicted Spend</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Activity className="w-3 h-3" />
                Baseline Scenario
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={baselineForecastData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorActual)"
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Actual"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#14b8a6"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorPredicted)"
                dot={{ fill: '#14b8a6', r: 4 }}
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Scenario Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Planning</CardTitle>
          <p className="text-sm text-gray-600">Adjust cost variables to see impact on forecast</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="variables" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="variables">Cost Variables</TabsTrigger>
              <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="variables" className="space-y-6 pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Material Cost Change</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {materialCostAdjustment[0] > 0 ? '+' : ''}{materialCostAdjustment[0]}%
                    </span>
                  </div>
                  <Slider
                    value={materialCostAdjustment}
                    onValueChange={setMaterialCostAdjustment}
                    min={-20}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-20%</span>
                    <span>0%</span>
                    <span>+20%</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Labor Cost Change</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {laborCostAdjustment[0] > 0 ? '+' : ''}{laborCostAdjustment[0]}%
                    </span>
                  </div>
                  <Slider
                    value={laborCostAdjustment}
                    onValueChange={setLaborCostAdjustment}
                    min={-20}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-20%</span>
                    <span>0%</span>
                    <span>+20%</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Forecasted Impact</span>
                    <span className="text-lg font-bold text-gray-900">
                      {calculateImpact() > 0 ? '+' : ''}
                      {formatCurrency(Math.abs(calculateImpact()))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    New projected completion cost: {formatCurrency(calculateNewCost())}
                  </p>
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleApplyScenario}
                >
                  Apply Scenario
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="impact" className="pt-6">
              <div className="space-y-3">
                {costDriversData.map((driver) => (
                  <div key={driver.category} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{driver.category}</span>
                        <Badge
                          variant={driver.impact === "High" ? "destructive" : "outline"}
                          className={
                            driver.impact === "High" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                            driver.impact === "Medium" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                            "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {driver.impact} Impact
                        </Badge>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(driver.current)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.trend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-600" />
                      ) : driver.trend < 0 ? (
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        driver.trend > 0 ? 'text-red-600' :
                        driver.trend < 0 ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {driver.trend > 0 ? '+' : ''}{driver.trend}% trend
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confidence Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Forecast Confidence</p>
                <p className="text-lg font-bold text-gray-900">High (87%)</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Based on 6 months of historical data and market trends
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className="text-lg font-bold text-gray-900">Medium</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Material price volatility and labor availability concerns
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Review</p>
                <p className="text-lg font-bold text-gray-900">Nov 18, 2025</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Forecast updates monthly based on actual spend
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

