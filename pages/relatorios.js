import { useEffect, useMemo, useState } from "react";
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

/* Main */
export default function Relatorios() {
  const [mes, setMes] = useState(currentMonthKey());
  const [mesesDisponiveis, setMesesDisponiveis] = useState([currentMonthKey()]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [orcamentoItens, setOrcamentoItens] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filterCategory, setFilterCategory] = useState("todos"); // todos|investimento|despesa
  const [loading, setLoading] = useState(true);

  /* Fetch all data once, then derive views client-side */
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [orcRes, itensRes, invRes, cliRes] = await Promise.all([
          supabase.from("orcamentos").select("*").order("created_at", { ascending: false }),
          supabase.from("orcamento_itens").select("*"),
          supabase.from("investments").select("*").order("created_at", { ascending: false }),
          supabase.from("clientes").select("*"),
        ]);

        const orc = orcRes.data || [];
        const itens = itensRes.data || [];
        const inv = invRes.data || [];
        const cli = cliRes.data || [];

        setOrcamentos(orc);
        setOrcamentoItens(itens);
        setInvestments(inv);
        setClientes(cli);

        // Meses disponíveis (a partir de created_at de orcamentos ou investments) - incluir mês atual
        const monthsSet = new Set();
        [...orc, ...inv].forEach((r) => {
          if (!r || !r.created_at) return;
          monthsSet.add((r.created_at || "").slice(0, 7));
        });
        const monthsArr = Array.from(monthsSet).sort().reverse();
        if (!monthsArr.includes(currentMonthKey())) monthsArr.unshift(currentMonthKey());
        setMesesDisponiveis(monthsArr);
      } catch (err) {
        console.error("Erro ao carregar relatórios:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  /* --- Derived data for selected month and for chart series --- */

  // Investments / expenses for selected month (raw)
  const investmentsDoMes = useMemo(() => {
    return investments.filter((i) => (i.created_at || "").slice(0, 7) === mes);
  }, [investments, mes]);

  // Orçamentos for selected month (raw)
  const orcamentosDoMes = useMemo(() => {
    return orcamentos.filter((o) => (o.created_at || "").slice(0, 7) === mes);
  }, [orcamentos, mes]);

  // closed budgets count
  const closedBudgetsCount = useMemo(() => {
    return orcamentosDoMes.filter((o) => (o.status || "").toLowerCase() === "fechado").length;
  }, [orcamentosDoMes]);

  // total R$ of closed budgets (revenue) in selected month
  const closedBudgetsTotal = useMemo(() => {
    return orcamentosDoMes
      .filter((o) => (o.status || "").toLowerCase() === "fechado")
      .reduce((s, o) => s + (Number(o.total) || 0), 0);
  }, [orcamentosDoMes]);

  // totals by category (investimento / despesa) for selected month
  const totalsByCategory = useMemo(() => {
    const totals = { investimento: 0, despesa: 0 };
    investmentsDoMes.forEach((it) => {
      const cat = (it.category || "").toLowerCase() === "despesa" ? "despesa" : "investimento";
      const val = Number(it.amount) || 0;
      totals[cat] = (totals[cat] || 0) + val;
    });
    return totals;
  }, [investmentsDoMes]);

  // Bar chart data: totals per month (we'll show last N months based on mesesDisponiveis)
  const barMonths = useMemo(() => {
    // take up to last 6 months from mesesDisponiveis (most recent first)
    const arr = mesesDisponiveis.slice(0, 6).slice().reverse(); // show oldest->newest
    return arr;
  }, [mesesDisponiveis]);

  const barData = useMemo(() => {
    // for each month in barMonths compute totals: investimento, despesa, receita (closed budgets)
    return barMonths.map((mkey) => {
      // investments in that month
      const invs = investments.filter((i) => (i.created_at || "").slice(0, 7) === mkey);
      const investimento = invs.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const despesa = invs.reduce(
        (s, it) => s + ((String(it.category || "").toLowerCase() === "despesa") ? (Number(it.amount) || 0) : 0),
        0
      );
      // revenue from closed orcamentos in that month
      const rev = orcamentos
        .filter((o) => (o.created_at || "").slice(0, 7) === mkey && (o.status || "").toLowerCase() === "fechado")
        .reduce((s, o) => s + (Number(o.total) || 0), 0);

      return {
        month: monthLabel(mkey),
        investimento,
        despesa,
        receita: rev,
      };
    });
  }, [barMonths, investments, orcamentos]);

  // Pie data
  const pieData = useMemo(() => {
    return [
      { name: "Investimentos", value: totalsByCategory.investimento || 0 },
      { name: "Despesas", value: totalsByCategory.despesa || 0 },
      { name: "Receita (Orç. fechados)", value: closedBudgetsTotal || 0 },
    ];
  }, [totalsByCategory, closedBudgetsTotal]);

  const COLORS = ["#facc15", "#ef4444", "#10B981"]; // yellow, red, green (revenue green)

  // items displayed list filtered by category
  const displayedItems = useMemo(() => {
    let arr = investmentsDoMes.slice();
    if (filterCategory === "investimento") arr = arr.filter((i) => (i.category || "").toLowerCase() !== "despesa");
    if (filterCategory === "despesa") arr = arr.filter((i) => (i.category || "").toLowerCase() === "despesa");
    return arr;
  }, [investmentsDoMes, filterCategory]);

  /* Helpers: total investments and total expenses numbers for cards */
  const totalInvestimentos = totalsByCategory.investimento || 0;
  const totalDespesas = totalsByCategory.despesa || 0;

  return (
    <div className="max-w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
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

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Categoria</label>
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
          </div>
        </div>

        {/* Resumo cards (grid responsivo mobile-first) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Orçamentos fechados (quantidade)</div>
            <div className="mt-2 text-2xl font-semibold text-white">{closedBudgetsCount}</div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </div>

          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Total R$ - Orçamentos fechados</div>
            <div className="mt-2 text-2xl font-semibold text-white">R$ {currency(closedBudgetsTotal)}</div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </div>

          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Total Investimentos</div>
            <div className="mt-2 text-2xl font-semibold text-white">R$ {currency(totalInvestimentos)}</div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </div>

          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="text-sm text-gray-300">Total Despesas</div>
            <div className="mt-2 text-2xl font-semibold text-white">R$ {currency(totalDespesas)}</div>
            <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
          </div>
        </div>

        {/* Charts area */}
        <div className="space-y-4 mb-6">
          {/* Pie chart */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Distribuição: Investimentos / Despesas / Receita</div>
              <div className="text-sm text-gray-400">Mês selecionado</div>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `R$ ${currency(v)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart: totals per month (investimento, despesa, receita) */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Totais por mês</div>
              <div className="text-sm text-gray-400">Comparativo últimos meses</div>
            </div>

            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF" }} />
                  <YAxis tickFormatter={(v) => Number(v).toLocaleString()} tick={{ fill: "#9CA3AF" }} />
                  <Tooltip formatter={(v) => `R$ ${currency(v)}`} />
                  <Legend />
                  <Bar dataKey="receita" stackId="a" fill="#10B981" name="Receita (Orç. fechados)" />
                  <Bar dataKey="investimento" stackId="a" fill="#facc15" name="Investimento" />
                  <Bar dataKey="despesa" stackId="a" fill="#ef4444" name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right-side lists: Top clients and recent items (mobile-first they stack below) */}
        <div className="space-y-4 mb-8">
          {/* Top clients */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Top clientes (mês)</div>
              <div className="text-sm text-gray-400">Por valor</div>
            </div>

            {(() => {
              // compute top clients here (simple inline to avoid extra hooks)
              const map = new Map();
              orcamentosDoMes.forEach((o) => {
                const cid = o.cliente_id;
                const val = Number(o.total) || 0;
                map.set(cid, (map.get(cid) || 0) + val);
              });
              const arr = Array.from(map.entries())
                .map(([cid, total]) => {
                  const cli = clientes.find((c) => c.id === cid);
                  return { clienteId: cid, nome: cli ? cli.nome : "(Cliente removido)", total };
                })
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

              if (arr.length === 0) {
                return <div className="text-gray-400 text-sm">Nenhum orçamento no mês.</div>;
              }

              return arr.map((t) => (
                <div key={t.clienteId} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0">
                  <div>
                    <div className="text-sm text-yellow-400 font-medium">{t.nome}</div>
                    <div className="text-xs text-gray-400">Total orçamentos</div>
                  </div>
                  <div className="text-sm font-semibold text-white">R$ {currency(t.total)}</div>
                </div>
              ));
            })()}
          </div>

          {/* Recent investments list (filtered by category) */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Últimos lançamentos</div>
              <div className="text-sm text-gray-400">Investimentos & Despesas</div>
            </div>

            {displayedItems.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhum item encontrado.</div>
            ) : (
              <div className="space-y-2">
                {displayedItems.slice(0, 8).map((it) => (
                  <div key={it.id} className="flex items-start justify-between border border-gray-700 rounded-lg p-3 bg-gray-900">
                    <div className="max-w-[65%]">
                      <div className="text-sm text-white font-medium">{it.title}</div>
                      <div className="text-xs text-gray-400">{it.category || "investimento"}</div>
                      <div className="text-xs text-gray-500">{it.created_at ? new Date(it.created_at).toLocaleString() : ""}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${it.category === "despesa" ? "text-red-400" : "text-green-400"}`}>
                        R$ {currency(it.amount)}
                      </div>
                      {isAdmin() && (
                        <button
                          className="text-xs mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                          onClick={async () => {
                            if (!confirm("Excluir item?")) return;
                            await supabase.from("investments").delete().eq("id", it.id);
                            // refresh local data
                            const { data } = await supabase.from("investments").select("*").order("created_at", { ascending: false });
                            setInvestments(data || []);
                          }}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* loading */}
        {loading && <div className="mt-4 text-center text-gray-400">Carregando dados...</div>}
      </div>
    </div>
  );
}
