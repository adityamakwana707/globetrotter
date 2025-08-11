"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calculator, PiggyBank } from "lucide-react"

interface ItineraryDay {
  id: string
  dayNumber: number
  title: string
  budget: {
    estimated: number
    actual?: number
    breakdown: Array<{
      category: string
      amount: number
      description?: string
    }>
  }
}

interface BudgetCalculatorProps {
  itineraryDays: ItineraryDay[]
  totalBudget: number
  currency: string
  onBudgetUpdate: (total: number) => void
}

interface CategoryBudget {
  category: string
  amount: number
  color: string
}

const CATEGORY_COLORS = {
  'Transportation': '#3B82F6',
  'Accommodation': '#EF4444', 
  'Food & Dining': '#10B981',
  'Activities': '#F59E0B',
  'Shopping': '#8B5CF6',
  'Tickets': '#EC4899',
  'Other': '#6B7280'
}

export default function BudgetCalculator({
  itineraryDays,
  totalBudget,
  currency,
  onBudgetUpdate
}: BudgetCalculatorProps) {
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBudget[]>([])
  const [dailyBudgets, setDailyBudgets] = useState<Array<{day: string, budget: number}>>([])
  const [averageDailyBudget, setAverageDailyBudget] = useState(0)

  useEffect(() => {
    calculateBudgetBreakdown()
  }, [itineraryDays])

  const calculateBudgetBreakdown = () => {
    // Calculate category breakdown
    const categoryTotals: { [key: string]: number } = {}
    
    itineraryDays.forEach(day => {
      day.budget.breakdown.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount
      })
    })

    const breakdown: CategoryBudget[] = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other
    }))

    setCategoryBreakdown(breakdown)

    // Calculate daily budgets
    const daily = itineraryDays.map(day => ({
      day: `Day ${day.dayNumber}`,
      budget: day.budget.estimated
    }))

    setDailyBudgets(daily)

    // Calculate average daily budget
    const totalDays = itineraryDays.length
    const avgDaily = totalDays > 0 ? totalBudget / totalDays : 0
    setAverageDailyBudget(avgDaily)
  }

  const getBudgetStatus = () => {
    if (totalBudget === 0) return { status: 'neutral', message: 'Set your budget to get insights' }
    
    const avgDaily = averageDailyBudget
    if (avgDaily > 200) return { status: 'high', message: 'High-budget trip - luxury experience' }
    if (avgDaily > 100) return { status: 'medium', message: 'Moderate budget - comfortable trip' }
    return { status: 'low', message: 'Budget-friendly trip - great value' }
  }

  const budgetStatus = getBudgetStatus()

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
          <p className="text-white font-medium">{label}</p>
          <p className="text-blue-400">
            {`${currency} ${payload[0].value.toLocaleString()}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Budget Display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {currency} {totalBudget.toLocaleString()}
            </div>
            <Badge 
              variant="secondary" 
              className={
                budgetStatus.status === 'high' ? 'bg-red-600 text-white' :
                budgetStatus.status === 'medium' ? 'bg-yellow-600 text-white' :
                'bg-green-600 text-white'
              }
            >
              {budgetStatus.message}
            </Badge>
          </div>

          <Separator className="bg-gray-700" />

          {/* Budget Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {itineraryDays.length}
              </div>
              <div className="text-gray-400 text-sm">Days</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {currency} {Math.round(averageDailyBudget).toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Per Day</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {categoryBreakdown.length}
              </div>
              <div className="text-gray-400 text-sm">Categories</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {Math.round((totalBudget / (itineraryDays.length || 1)) * 0.3).toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Emergency Fund</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Budget by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-400">Add budget items to see breakdown</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Budget Bar Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Daily Budget Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyBudgets.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyBudgets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="budget" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-400">Add daily budgets to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown List */}
      {categoryBreakdown.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Detailed Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryBreakdown.map((category, index) => {
              const percentage = (category.amount / totalBudget) * 100
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-white font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {currency} {category.amount.toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{ 
                      backgroundColor: '#374151',
                    }}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Budget Tips */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Budget Tips & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-1">Emergency Fund</h4>
              <p className="text-gray-300 text-sm">
                Keep 20-30% of your budget as emergency fund ({currency} {Math.round(totalBudget * 0.25).toLocaleString()})
              </p>
            </div>
            
            <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
              <h4 className="text-green-400 font-medium mb-1">Daily Spending</h4>
              <p className="text-gray-300 text-sm">
                Try to stay within {currency} {Math.round(averageDailyBudget).toLocaleString()} per day on average
              </p>
            </div>
            
            <div className="p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-1">Track Expenses</h4>
              <p className="text-gray-300 text-sm">
                Keep receipts and update actual costs to stay on budget
              </p>
            </div>
            
            <div className="p-3 bg-orange-900/30 border border-orange-700 rounded-lg">
              <h4 className="text-orange-400 font-medium mb-1">Flexible Categories</h4>
              <p className="text-gray-300 text-sm">
                Allow flexibility between shopping and dining budgets
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
