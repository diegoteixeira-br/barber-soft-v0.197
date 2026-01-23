import { useState, useMemo } from "react";
import { Plus, TrendingDown, Calendar, Receipt, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExpenses, EXPENSE_CATEGORIES } from "@/hooks/useExpenses";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { ExpensesTable } from "./ExpensesTable";
import { DateRangePicker } from "./DateRangePicker";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type PeriodFilter = "today" | "week" | "month" | "custom";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
];

function getDateRanges() {
  const now = new Date();
  return {
    today: { start: startOfDay(now), end: endOfDay(now) },
    week: { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) },
    month: { start: startOfMonth(now), end: endOfMonth(now) },
  };
}

export function ExpensesTab() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [customDateRange, setCustomDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const dateRanges = getDateRanges();

  const { expenses: todayExpenses } = useExpenses(dateRanges.today);
  const { expenses: weekExpenses } = useExpenses(dateRanges.week);
  const { expenses: monthExpenses } = useExpenses(dateRanges.month);
  const { expenses: customExpenses, isLoading, deleteExpense } = useExpenses(
    periodFilter === "custom" ? customDateRange : undefined
  );

  const todayTotal = useMemo(
    () => todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [todayExpenses]
  );

  const weekTotal = useMemo(
    () => weekExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [weekExpenses]
  );

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [monthExpenses]
  );

  const recurringTotal = useMemo(
    () => monthExpenses.filter(e => e.is_recurring).reduce((sum, e) => sum + Number(e.amount), 0),
    [monthExpenses]
  );

  const filteredExpenses = useMemo(() => {
    switch (periodFilter) {
      case "today":
        return todayExpenses;
      case "week":
        return weekExpenses;
      case "custom":
        return customExpenses;
      case "month":
      default:
        return monthExpenses;
    }
  }, [periodFilter, todayExpenses, weekExpenses, monthExpenses, customExpenses]);

  // Data for pie chart
  const categoryData = useMemo(() => {
    const grouped = filteredExpenses.reduce((acc, expense) => {
      const cat = expense.category || "Outros";
      acc[cat] = (acc[cat] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteExpense.mutate(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Controle de Despesas</h3>
          <p className="text-sm text-muted-foreground">Gerencie os gastos do seu estabelecimento</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas Hoje</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(todayTotal)}</div>
            <p className="text-xs text-muted-foreground">{todayExpenses.length} lançamento(s)</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas da Semana</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(weekTotal)}</div>
            <p className="text-xs text-muted-foreground">{weekExpenses.length} lançamento(s)</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do Mês</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(monthTotal)}</div>
            <p className="text-xs text-muted-foreground">{monthExpenses.length} lançamento(s)</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas Recorrentes</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(recurringTotal)}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhuma despesa no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h4 className="font-semibold text-foreground">Lançamentos</h4>
            <div className="flex flex-wrap items-center gap-4">
              <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <TabsList className="bg-muted">
                  <TabsTrigger value="today">Hoje</TabsTrigger>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mês</TabsTrigger>
                  <TabsTrigger value="custom">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
              {periodFilter === "custom" && (
                <DateRangePicker
                  dateRange={customDateRange}
                  onDateRangeChange={setCustomDateRange}
                />
              )}
            </div>
          </div>
          <ExpensesTable
            expenses={filteredExpenses}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <ExpenseFormModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        expense={editingExpense}
      />
    </div>
  );
}
