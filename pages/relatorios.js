import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FiCalendar } from "react-icons/fi";

/* Helpers */
function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
}
function monthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}
function currency(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Relatorios() {
  const [mes, setMes] = useState(currentMonthKey());
  const [mesesDisponiveis, setMesesDisponiveis] = useState([currentMonthKey()]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filterCategory, setFilterCategory] = useState("todos");
  const [loading, setLoading] = useState(true);

  /* Carrega dados do Supabase */
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [orcRes, invRes, cliRes] = await Promise.all([
          supabase.from("orcamentos").select("*").order("created_at", { ascending: false }),
          supabase.from("investments").select("*").order("created_at", { ascending: false }),
          supabase.from("clientes").select("*"),
        ]);

        const orc = orcRes.data || [];
        const inv = invRes.data || [];
        const cli = cliRes.data || [];

        setOrcamentos(orc);
        setInvestments(inv);
        setClientes(cli);

        const monthsSet = new Set();
        [...orc, ...inv].forEach((r) => {
          if (r?.created_at) monthsSet.add(r.created_at.slice(0, 7));
        });
        const monthsArr = Array.from(monthsSet).sort().reverse();
        if (!monthsArr.includes(currentMonthKey())) monthsArr.unshift(currentMonthKey());
        setMesesDisponiveis(monthsArr);
      } catch (err) {
        console.error("Erro:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  /* --- Cálculos --- */
  const investmentsDoMes = useMemo(
    () => investments.filter((i) => (i.created_at || "").slice(0, 7) === mes),
    [investments, mes]
  );
  const orcamentosDoMes = useMemo(
    () => orcamentos.filter((o) => (o.created_at || "").slice(0, 7) === mes),
    [orcamentos, mes]
  );

  const closedBudgets = useMemo(
    () => orcamentosDoMes.filter((o) => (o.status || "").toLowerCase() === "fechado"),
    [orcamentosDoMes]
  );
  const closedBudgetsCount = closedBudgets.length;
  const closedBudgetsTotal = closedBudgets.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const totalsByCategory = useMemo(() => {
    const totals = { investimento: 0, despesa: 0 };
    investmentsDoMes.forEach((it) => {
      const cat = (it.category || "").toLowerCase() === "despesa" ? "despesa" : "investimento";
      totals[cat] += Number(it.amount) || 0;
    });
    return totals;
  }, [investmentsDoMes]);

  const totalInvestimentos = totalsByCategory.investimento || 0;
  const totalDespesas = totalsByCategory.despesa || 0;
  const saldo = closedBudgetsTotal - totalDespesas;

  const COLORS = ["#facc15", "#ef4444", "#10B981"];

  const pieData = [
    { name: "Investimentos", value: totalInvestimentos },
    { name: "Despesas", value: totalDespesas },
    { name: "Receita (Orç. fechados)", value: closedBudgetsTotal },
  ];

  const barData = useMemo(() => {
    return mesesDisponiveis.slice(0, 6).reverse().map((mkey) => {
      const invs = investments.filter((i) => (i.created_at || "").slice(0, 7) === mkey);
      const investimento = invs.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const despesa = invs
        .filter((it) => (it.category || "").toLowerCase() === "despesa")
        .reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const receita = orcamentos
        .filter((o) => (o.created_at || "").slice(0, 7) === mkey && (o.status || "").toLowerCase() === "fechado")
        .reduce((s, o) => s + (Number(o.total) || 0), 0);
      return { month: monthLabel(mkey), investimento, despesa, receita };
    });
  }, [mesesDisponiveis, investments, orcamentos]);

  const displayedItems = useMemo(() => {
    let arr = investmentsDoMes;
    if (filterCategory === "investimento")
      arr = arr.filter((i) => (i.category || "").toLowerCase() !== "despesa");
    if (filterCategory === "despesa")
      arr = arr.filter((i) => (i.category || "").toLowerCase() === "despesa");
    return arr;
  }, [investmentsDoMes, filterCategory]);

  /* --- UI --- */
  return (
    <div className="max-w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
        >
          <div>
            <h1 className="text-2xl font-semibold text-yellow-500">Relatórios</h1>
            <p className="text-sm text-gray-300">
              Visão do mês: <span className="font-medium text-white">{monthLabel(mes)}</span>
            </p>
          </div>

          {/* filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-300" />
              <select
                className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              >
                {mesesDisponiveis.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="investimento">Investimentos</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
        >
          {[
            { label: "Orçamentos fechados", value: closedBudgetsCount },
            { label: "Total R$ - Orçamentos fechados", value: `R$ ${currency(closedBudgetsTotal)}` },
            { label: "Total Investimentos", value: `R$ ${currency(totalInvestimentos)}` },
            { label: "Total Despesas", value: `R$ ${currency(totalDespesas)}` },
            {
              label: "Saldo (Lucro líquido)",
              value: `R$ ${currency(saldo)}`,
              color: saldo >= 0 ? "text-green-400" : "text-red-400",
            },
          ].map((c, idx) => (
            <motion.div
              key={idx}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm"
            >
              <div className="text-sm text-gray-300">{c.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${c.color || "text-white"}`}>
                {c.value}
              </div>
              <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm"
          >
            <div className="flex justify-between mb-2">
              <div className="font-semibold text-white">
                Distribuição: Investimentos / Despesas / Receita
              </div>
            </div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `R$ ${currency(v)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm"
          >
            <div className="font-semibold text-white mb-2">Totais por mês</div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF" }} />
                  <YAxis tick={{ fill: "#9CA3AF" }} />
                  <Tooltip formatter={(v) => `R$ ${currency(v)}`} />
                  <Legend />
                  <Bar dataKey="receita" fill="#10B981" name="Receita" />
                  <Bar dataKey="investimento" fill="#facc15" name="Investimentos" />
                  <Bar dataKey="despesa" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
