"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import CurrencyConverter from "./currency-converter"

interface Budget {
  id: string
  trip_id: string
  category: string
  planned_amount: number
  spent_amount: number
  currency: string
  created_at: string
  updated_at: string
}

interface Expense {
  id: string
  trip_id: string
  budget_id?: string
  amount: number
  currency: string
  category: string
  description: string
  expense_date: string
  receipt_image?: string
  created_at: string
}

interface BudgetManagerProps {
  tripId: string
}

const BUDGET_CATEGORIES = [
  'Accommodation',
  'Transportation',
  'Food & Dining',
  'Activities',
  'Shopping',
  'Entertainment',
  'Emergency',
  'Other'
]

const CATEGORY_COLORS = {
  'Accommodation': '#3B82F6',
  'Transportation': '#EF4444',
  'Food & Dining': '#10B981',
  'Activities': '#F59E0B',
  'Shopping': '#8B5CF6',
  'Entertainment': '#EC4899',
  'Emergency': '#EF4444',
  'Other': '#6B7280'
}

export default function BudgetManager({ tripId }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    planned_amount: '',
    currency: 'USD'
  })

  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    budget_id: ''
  })

  useEffect(() => {
    fetchBudgetData()
  }, [tripId])

  const fetchBudgetData = async () => {
    setIsLoading(true)
    try {
      const [budgetResponse, expenseResponse] = await Promise.all([
        fetch(`/api/trips/${tripId}/budget`),
        fetch(`/api/trips/${tripId}/expenses`)
      ])

      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json()
        setBudgets(budgetData)
      }

      if (expenseResponse.ok) {
        const expenseData = await expenseResponse.json()
        setExpenses(expenseData)
      }
    } catch (error) {
      console.error('Error fetching budget data:', error)
      toast({
        title: "Error",
        description: "Failed to load budget data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBudget = async () => {
    if (!budgetForm.category || !budgetForm.planned_amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: budgetForm.category,
          planned_amount: parseFloat(budgetForm.planned_amount),
          currency: budgetForm.currency
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create budget')
      }

      await fetchBudgetData()
      setShowAddBudget(false)
      setBudgetForm({ category: '', planned_amount: '', currency: 'USD' })
      
      toast({
        title: "Budget Created",
        description: "Budget category has been added successfully.",
      })
    } catch (error) {
      console.error('Error creating budget:', error)
      toast({
        title: "Error",
        description: "Failed to create budget.",
        variant: "destructive",
      })
    }
  }

  const handleAddExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          currency: expenseForm.currency,
          description: expenseForm.description,
          expense_date: expenseForm.expense_date,
          budget_id: expenseForm.budget_id || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create expense')
      }

      await fetchBudgetData()
      setShowAddExpense(false)
      setExpenseForm({
        category: '',
        amount: '',
        currency: 'USD',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        budget_id: ''
      })
      
      toast({
        title: "Expense Added",
        description: "Expense has been recorded successfully.",
      })
    } catch (error) {
      console.error('Error creating expense:', error)
      toast({
        title: "Error",
        description: "Failed to add expense.",
        variant: "destructive",
      })
    }
  }

  const calculateTotals = () => {
    const totalPlanned = budgets.reduce((sum, budget) => sum + budget.planned_amount, 0)
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const remaining = totalPlanned - totalSpent
    const percentageSpent = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0

    return { totalPlanned, totalSpent, remaining, percentageSpent }
  }

  const getBudgetData = () => {
    return budgets.map(budget => {
      const categoryExpenses = expenses.filter(expense => 
        expense.category === budget.category || expense.budget_id === budget.id
      )
      const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        ...budget,
        spent_amount: spent,
        remaining: budget.planned_amount - spent,
        percentage: budget.planned_amount > 0 ? (spent / budget.planned_amount) * 100 : 0
      }
    })
  }

  const getChartData = () => {
    const budgetData = getBudgetData()
    return budgetData.map(budget => ({
      name: budget.category,
      planned: budget.planned_amount,
      spent: budget.spent_amount,
      color: CATEGORY_COLORS[budget.category as keyof typeof CATEGORY_COLORS] || '#6B7280'
    }))
  }

  const getPieChartData = () => {
    const budgetData = getBudgetData()
    return budgetData.map(budget => ({
      name: budget.category,
      value: budget.spent_amount,
      color: CATEGORY_COLORS[budget.category as keyof typeof CATEGORY_COLORS] || '#6B7280'
    })).filter(item => item.value > 0)
  }

  const totals = calculateTotals()
  const budgetData = getBudgetData()
  const chartData = getChartData()
  const pieChartData = getPieChartData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card className="bg-white border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-slate-600 text-xs sm:text-sm mb-1">Total Planned</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">${totals.totalPlanned.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-slate-600 text-xs sm:text-sm mb-1">Total Spent</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">${totals.totalSpent.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-slate-600 text-xs sm:text-sm mb-1">Remaining</p>
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${totals.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${totals.remaining.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-slate-600 text-xs sm:text-sm mb-1">Spent %</p>
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${totals.percentageSpent <= 100 ? 'text-amber-600' : 'text-red-600'}`}>
                {totals.percentageSpent.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
              <span className="text-slate-600 text-sm font-medium">Overall Progress</span>
              <span className="text-slate-600 text-xs sm:text-sm">
                ${totals.totalSpent.toLocaleString()} / ${totals.totalPlanned.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={Math.min(totals.percentageSpent, 100)} 
              className="h-2 sm:h-3 bg-gray-200 border border-gray-300"
            />
            {totals.percentageSpent > 90 && (
              <div className="flex items-center gap-2 mt-3 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Approaching budget limit</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white border-gray-200 shadow-sm rounded-lg p-0 gap-0">
          <TabsTrigger value="categories" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
            Categories
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-slate-900 text-lg sm:text-xl">Budget Categories</CardTitle>
                <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Budget
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="bg-white border-gray-200"
                    aria-describedby="budget-dialog-description"
                  >
                    <DialogHeader>
                      <DialogTitle>Add Budget Item</DialogTitle>
                      <DialogDescription id="budget-dialog-description">
                        Add a new budget item to track your trip expenses.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-800">Category</Label>
                        <Select
                          value={budgetForm.category}
                          onValueChange={(value) => setBudgetForm({ ...budgetForm, category: value })}
                        >
                          <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300">
                            {BUDGET_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category} className="text-slate-900 hover:bg-gray-50">
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-800">Planned Amount</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={budgetForm.planned_amount}
                            onChange={(e) => setBudgetForm({ ...budgetForm, planned_amount: e.target.value })}
                            className="bg-white border-gray-300 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-800">Currency</Label>
                          <Select
                            value={budgetForm.currency}
                            onValueChange={(value) => setBudgetForm({ ...budgetForm, currency: value })}
                          >
                            <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                              <SelectItem value="USD" className="text-slate-900 hover:bg-gray-50">USD</SelectItem>
                              <SelectItem value="EUR" className="text-slate-900 hover:bg-gray-50">EUR</SelectItem>
                              <SelectItem value="GBP" className="text-slate-900 hover:bg-gray-50">GBP</SelectItem>
                              <SelectItem value="JPY" className="text-slate-900 hover:bg-gray-50">JPY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddBudget} className="bg-blue-600 hover:bg-blue-700">
                        Add Budget
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {budgetData.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calculator className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-400" />
                  <p className="text-slate-600 mb-2 sm:mb-4 text-sm sm:text-base">No budget categories yet</p>
                  <p className="text-xs sm:text-sm text-slate-500">Add budget categories to start tracking your expenses.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgetData.map((budget) => (
                    <div key={budget.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-slate-900 font-semibold">{budget.category}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`border-gray-600 ${budget.percentage > 100 ? 'text-red-400' : budget.percentage > 90 ? 'text-yellow-400' : 'text-green-400'}`}
                          >
                            {budget.percentage.toFixed(1)}%
                          </Badge>
                          <span className="text-slate-600 text-sm">
                            ${budget.spent_amount.toLocaleString()} / ${budget.planned_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(budget.percentage, 100)} 
                        className="h-2 mb-2"
                      />
                      <div className="flex justify-between items-center text-sm">
                        <span className={`${budget.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {budget.remaining >= 0 ? 'Remaining' : 'Over budget'}: ${Math.abs(budget.remaining).toLocaleString()}
                        </span>
                        <span className="text-slate-600">{budget.currency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Expense History</CardTitle>
                <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Receipt className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="bg-white border-gray-200"
                    aria-describedby="add-expense-description"
                  >
                    <DialogHeader>
                      <DialogTitle>Add Expense</DialogTitle>
                      <DialogDescription id="add-expense-description">
                        Record a new expense for this trip.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-800">Category</Label>
                        <Select
                          value={expenseForm.category}
                          onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                        >
                          <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300">
                            {BUDGET_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category} className="text-slate-900 hover:bg-gray-50">
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-800">Amount</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            className="bg-white border-gray-300 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-800">Currency</Label>
                          <Select
                            value={expenseForm.currency}
                            onValueChange={(value) => setExpenseForm({ ...expenseForm, currency: value })}
                          >
                            <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                              <SelectItem value="USD" className="text-slate-900 hover:bg-gray-50">USD</SelectItem>
                              <SelectItem value="EUR" className="text-slate-900 hover:bg-gray-50">EUR</SelectItem>
                              <SelectItem value="GBP" className="text-slate-900 hover:bg-gray-50">GBP</SelectItem>
                              <SelectItem value="JPY" className="text-slate-900 hover:bg-gray-50">JPY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-800">Description</Label>
                        <Textarea
                          placeholder="What was this expense for?"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          className="bg-white border-gray-300 text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-800">Date</Label>
                        <Input
                          type="date"
                          value={expenseForm.expense_date}
                          onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                          className="bg-white border-gray-300 text-slate-900"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddExpense} className="bg-green-600 hover:bg-green-700">
                        Add Expense
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 mb-4">No expenses recorded yet</p>
                  <p className="text-sm text-slate-500">Start recording your trip expenses to track your budget.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses
                    .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
                    .map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || '#6B7280' }}
                        />
                        <div>
                          <p className="text-slate-900 font-medium">{expense.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <span>{expense.category}</span>
                            <span>•</span>
                            <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-900 font-semibold">${expense.amount.toLocaleString()}</p>
                        <p className="text-slate-600 text-sm">{expense.currency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-900">Budget vs Spending</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6B7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#374151'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="planned" fill="#3B82F6" name="Planned" />
                      <Bar dataKey="spent" fill="#EF4444" name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No budget data to display
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-900">Spending Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#374151'
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No expense data to display
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-900">Budget Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-slate-800 font-semibold mb-2">Default Currency</h3>
                    <Select defaultValue="USD">
                      <SelectTrigger className="bg-white border-gray-300 text-slate-900 w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="USD" className="text-slate-900 hover:bg-gray-50">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR" className="text-slate-900 hover:bg-gray-50">EUR - Euro</SelectItem>
                        <SelectItem value="GBP" className="text-slate-900 hover:bg-gray-50">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY" className="text-slate-900 hover:bg-gray-50">JPY - Japanese Yen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="text-slate-800 font-semibold mb-2">Budget Alerts</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-slate-700">Alert when 80% of budget is spent</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-slate-700">Alert when budget is exceeded</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-slate-700">Daily spending summary</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CurrencyConverter 
              defaultFromCurrency="USD"
              defaultToCurrency="EUR"
              className="h-fit"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
