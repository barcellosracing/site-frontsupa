import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
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
  CartesianGrid,
} from "recharts";

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
function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/* Page */
export default function Relatorios() {
  const [mes, setMes] = useState(currentMonthKey());
  const [mesesDisponiveis, setMesesDisponiveis] = useState([currentMonthKey()]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch data once, then derive
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

        // months available from created_at fields (orcamentos + investments)
        const monthsSet = new Set();
        [...orc, ...inv].forEach((r) => {
          if (r?.created_at) monthsSet.add(r.created_at.slice(0, 7));
        });
        const monthsArr = Array.from(monthsSet).sort().reverse();
        if (!monthsArr.includes(currentMonthKey())) monthsArr.unshift(currentMonthKey());
        setMesesDisponiveis(monthsArr);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Derived data for selected month
  const orcamentosDoMes = useMemo(
    () => orcamentos.filter((o) => (o.created_at || "").slice(0, 7) === mes),
    [orcamentos, mes]
  );
  const investmentsDoMes = useMemo(
    () => investments.filter((i) => (i.created_at || "").slice(0, 7) === mes),
    [investments, mes]
  );

  // closed budgets (status === 'fechado' case-insensitive)
  const closedBudgets = useMemo(
    () => orcamentosDoMes.filter((o) => String(o.status || "").toLowerCase() === "fechado"),
    [orcamentosDoMes]
  );
  const closedBudgetsCount = closedBudgets.length;
  const closedBudgetsTotal = closedBudgets.reduce((s, o) => s + (Number(o.total || o.valor_total) || 0), 0);

  // totals by category for investments (category expected to be 'investimento' or 'despesa')
  const totalsByCategory = useMemo(() => {
    const t = { investimento: 0, despesa: 0 };
    investmentsDoMes.forEach((it) => {
      const cat = String(it.category || "").toLowerCase();
      const key = cat === "despesa" ? "despesa" : "investimento";
      t[key] += Number(it.amount || it.valor || 0) || 0;
    });
    return t;
  }, [investmentsDoMes]);

  const totalInvestimentos = totalsByCategory.investimento || 0;
  const totalDespesas = totalsByCategory.despesa || 0;
  const saldo = closedBudgetsTotal - totalDespesas;

  // pie data includes receita (closed budgets total)
  const pieData = [
    { name: "Investimentos", value: totalInvestimentos },
    { name: "Despesas", value: totalDespesas },
    { name: "Receita (Orç. fechados)", value: closedBudgetsTotal },
  ];
  const COLORS = ["#facc15", "#ef4444", "#10B981"];

  // bar chart data: totals per month based on mesesDisponiveis (show up to last 6)
  const barMonths = useMemo(() => mesesDisponiveis.slice(0, 6).slice().reverse(), [mesesDisponiveis]);
  const barData = useMemo(() => {
    return barMonths.map((mkey) => {
      const invs = investments.filter((i) => (i.created_at || "").slice(0, 7) === mkey) || [];
      const investimento = invs.reduce((s, it) => s + (Number(it.amount || it.valor) || 0), 0);
      const despesa = invs.reduce(
        (s, it) => s + ((String(it.category || "").toLowerCase() === "despesa") ? (Number(it.amount || it.valor) || 0) : 0),
        0
      );
      const receita = (orcamentos || []).filter((o) => (o.created_at || "").slice(0, 7) === mkey && String(o.status || "").toLowerCase() === "fechado")
        .reduce((s, o) => s + (Number(o.total || o.valor_total) || 0), 0);
      return { month: monthLabel(mkey), investimento, despesa, receita };
    });
  }, [barMonths, investments, orcamentos]);

  // Top clients by number of closed budgets in selected month
  const topClients = useMemo(() => {
    const counts = {};
    closedBudgets.forEach((o) => {
      const cid = o.cliente_id;
      counts[cid] = (counts[cid] || 0) + 1;
    });
    const arr = Object.entries(counts).map(([cid, count]) => {
      const cli = clientes.find((c) => c.id === cid);
      return { clienteId: cid, nome: cli ? cli.nome : "(Cliente removido)", count };
    });
    return arr.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [closedBudgets, clientes]);

  // Recent investments/despesas (most recent 8)
  const recentItems = useMemo(
    () => investmentsDoMes.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
    [investmentsDoMes]
  );

  // delete investment helper (only admin)
  async function deleteInvestment(id) {
    if (!confirm("Excluir item?")) return;
    await supabase.from("investments").delete().eq("id", id);
    // refresh local data (simple refetch)
    const { data } = await supabase.from("investments").select("*").order("created_at", { ascending: false });
    setInvestments(data || []);
  }

  return (
    <div className="max-w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-yellow-500">Relatórios</h1>
            <p className="text-sm text-gray-300">Visão do mês: <span className="font-medium text-white">{monthLabel(mes)}</span></p>
          </div>

          {/* Month filter only */}
          <div className="flex items-center gap-2">
            <select
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            >
              {mesesDisponiveis.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Summary cards */}
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Orçamentos fechados (quantidade)</div>
            <div className="mt-2 text-2xl font-semibold text-white">{closedBudgetsCount}</div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Total R$ - Orçamentos fechados</div>
            <div className="mt-2 text-2xl font-semibold text-white"> {formatCurrency(closedBudgetsTotal)} </div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Total Investimentos</div>
            <div className="mt-2 text-2xl font-semibold text-white"> {formatCurrency(totalInvestimentos)} </div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Total Despesas</div>
            <div className="mt-2 text-2xl font-semibold text-white"> {formatCurrency(totalDespesas)} </div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Saldo (Lucro líquido)</div>
            <div className={`mt-2 text-2xl font-semibold ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}> {formatCurrency(saldo)} </div>
            <div className="text-xs text-gray-400 mt-1">Orç. fechados − Despesas</div>
          </motion.div>
        </motion.div>

        {/* Charts */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-4 mb-6">
          {/* Pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-white">Distribuição (mês)</div>
              <div className="text-sm text-gray-400">Investimentos / Despesas / Receita</div>
            </div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bar: totals per month */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-white">Totais por mês</div>
              <div className="text-sm text-gray-400">Comparativo últimos meses</div>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF" }} />
                  <YAxis tick={{ fill: "#9CA3AF" }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="receita" stackId="a" fill="#10B981" name="Receita" />
                  <Bar dataKey="investimento" stackId="a" fill="#facc15" name="Investimentos" />
                  <Bar dataKey="despesa" stackId="a" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom: Top Clients and Recent Items side-by-side on desktop, stacked mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          {/* Top Clients */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Top Clientes (ord. fechados)</div>
              <div className="text-sm text-gray-400">Mês</div>
            </div>
            {topClients.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhum orçamento fechado neste mês.</div>
            ) : (
              topClients.map((t) => (
                <div key={t.clienteId} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0">
                  <div>
                    <div className="text-sm text-yellow-400 font-medium">{t.nome}</div>
                    <div className="text-xs text-gray-400">Orçamentos fechados</div>
                  </div>
                  <div className="text-sm font-semibold text-white">{t.count}</div>
                </div>
              ))
            )}
          </motion.div>

          {/* Recent investments/despesas */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Últimos lançamentos</div>
              <div className="text-sm text-gray-400">Investimentos & Despesas</div>
            </div>

            {recentItems.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhum lançamento neste mês.</div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((it) => (
                  <div key={it.id} className="flex items-start justify-between border border-gray-700 rounded-lg p-3 bg-gray-900">
                    <div className="max-w-[65%]">
                      <div className="text-sm text-white font-medium">{it.title || it.description || "(sem descrição)"}</div>
                      <div className="text-xs text-gray-400">{it.category || "investimento"}</div>
                      <div className="text-xs text-gray-500">{it.created_at ? new Date(it.created_at).toLocaleString() : ""}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${String(it.category || "").toLowerCase() === "despesa" ? "text-red-400" : "text-green-400"}`}>
                        {formatCurrency(it.amount || it.valor || 0)}
                      </div>
                      {/* delete only if admin */}
                      {typeof window !== "undefined" && window.localStorage && window.localStorage.getItem("br_admin") && (
                        <button className="text-xs mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded" onClick={() => deleteInvestment(it.id)}>
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {loading && <div className="text-center text-gray-400">Carregando dados...</div>}
      </div>
    </div>
  );
}
