// FinTrack - Aplicação de Controle Financeiro Pessoal com filtros, exportação e funcionalidades estendidas

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#fbbf24", "#a78bfa"];

export default function FinTrack() {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState(["Salário", "Alimentação", "Transporte", "Lazer"]);
  const [goals, setGoals] = useState({});
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("fintrack-data");
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed.transactions || []);
      setCategories(parsed.categories || []);
      setGoals(parsed.goals || {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fintrack-data", JSON.stringify({ transactions, categories, goals }));
  }, [transactions, categories, goals]);

  const addTransaction = () => {
    if (!description || !amount || !category) return;
    const newTransaction = {
      id: Date.now(),
      type,
      description,
      category,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
    };
    setTransactions([...transactions, newTransaction]);
    setDescription("");
    setAmount("");
    setCategory("");
  };

  const exportCSV = () => {
    const headers = "Tipo,Descrição,Valor,Categoria,Data\n";
    const rows = filteredTransactions.map(t => `${t.type},${t.description},${t.amount},${t.category},${new Date(t.date).toLocaleDateString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "fintrack_transacoes.csv";
    a.click();
  };

  const setGoal = (cat, value) => {
    setGoals({ ...goals, [cat]: parseFloat(value) });
  };

  const filterByMonth = (list) => {
    if (!filterMonth) return list;
    return list.filter(t => t.date.startsWith(filterMonth));
  };

  const filteredTransactions = filterByMonth(transactions);

  const income = filteredTransactions.filter(t => t.type === "income").reduce((acc, cur) => acc + cur.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === "expense").reduce((acc, cur) => acc + cur.amount, 0);
  const balance = income - expense;

  const expensesByCategory = categories.map(cat => {
    const spent = filteredTransactions.filter(t => t.type === "expense" && t.category === cat).reduce((acc, t) => acc + t.amount, 0);
    return {
      category: cat,
      spent,
      goal: goals[cat] || 0
    };
  });

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">FinTrack</h1>

      {/* Filtro por Mês */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <label className="text-sm">Filtrar por mês:</label>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          <Button variant="outline" onClick={() => setFilterMonth("")}>Limpar Filtro</Button>
          <Button className="ml-auto" onClick={exportCSV}>Exportar CSV</Button>
        </CardContent>
      </Card>

      {/* Adicionar Transações */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Tabs defaultValue="income" onValueChange={setType}>
            <TabsList>
              <TabsTrigger value="income">Receita</TabsTrigger>
              <TabsTrigger value="expense">Despesa</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
          <Input type="number" placeholder="Valor" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input placeholder="Categoria" list="category-list" value={category} onChange={e => setCategory(e.target.value)} />
          <datalist id="category-list">
            {categories.map((c, i) => <option key={i} value={c} />)}
          </datalist>
          <Button onClick={addTransaction}>Adicionar</Button>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xl font-semibold">Resumo</h2>
          <p><strong>Receitas:</strong> R$ {income.toFixed(2)}</p>
          <p><strong>Despesas:</strong> R$ {expense.toFixed(2)}</p>
          <p><strong>Saldo:</strong> R$ {balance.toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Metas */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Metas por Categoria</h2>
          {categories.map((cat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="w-32">{cat}</span>
              <Input type="number" placeholder="Meta" defaultValue={goals[cat] || ""} onBlur={e => setGoal(cat, e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Gastos por Categoria</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expensesByCategory} dataKey="spent" nameKey="category" outerRadius={80}>
                  {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Gastos vs. Metas</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={expensesByCategory}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="goal" fill="#60a5fa" name="Meta" />
                <Bar dataKey="spent" fill="#f87171" name="Gasto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xl font-semibold">Transações</h2>
          {filteredTransactions.map(t => (
            <div key={t.id} className="flex justify-between border-b py-1 text-sm">
              <span>{t.description} ({t.category})</span>
              <span className={t.type === "income" ? "text-green-600" : "text-red-600"}>R$ {t.amount.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
