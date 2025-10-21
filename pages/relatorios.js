import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { FiCalendar, FiActivity } from "react-icons/fi";

/**
 * Relatórios (page)
 *
 * - Exibe dados do mês selecionado (por padrão: mês atual).
 * - Cards resumo (orcamentos fechados, total investimentos, total despesas).
 * - Gráficos: pizza (investimentos x despesas), barra (totais por dia do mês).
 * - Top clientes por valor de orçamentos.
 * - Design consistente com o restante do projeto (dark + yellow).
 *
 * Observação: precisa de `recharts` instalado (já presente no package.json informado).
 */

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
}

function monthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

function startOfMonthISO(ym) {
  // ym = "YYYY-MM"
  return `${ym}-01T00:00:00.000Z`;
}
function endOfMonthISO(ym) {
  const [y, m] = ym.split("-");
  const ms = new Date(Number(y), Number(m), 0); // last day of month
  ms.setHours(23, 59, 59, 999);
  return ms.toISOString();
}

function currency(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Relatorios() {
  const [mes, setMes] = useState(currentMonthKey());
  const [mesesDisponiveis, setMesesDisponiveis] = useState([currentMonthKey()]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [orcamentoItens, setOrcamentoItens] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filterCategory, setFilterCategory] = useState("todos"); // todos | investimento | despesa
  const [loading, setLoading] = useState(true);

  // fetch all relevant data (we'll filter/aggregate on client side)
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

        // compute months available from orcamentos & investments (created_at)
        const monthsSet = new Set();
        [...orc, ...inv].forEach((r) => {
          if (!r || !r.created_at) return;
          monthsSet.add((r.created_at || "").slice(0, 7));
        });
        const monthsArr = Array.from(monthsSet).sort().reverse();
        if (!monthsArr.includes(currentMonthKey())) monthsArr.unshift(currentMonthKey());
        setMesesDisponiveis(monthsArr);
      } catch (e) {
        console.error("Erro ao carregar relatórios:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // --- Derived datasets for the selected month ---
  const orcamentosDoMes = useMemo(() => {
    return orcamentos.filter((o) => (o.created_at || "").slice(0, 7) === mes);
  }, [orcamentos, mes]);

  const investmentsDoMes = useMemo(() => {
    return investments.filter((i) => (i.created_at || "").slice(0, 7) === mes);
  }, [investments, mes]);

  // budgets closed count (status === 'fechado')
  const closedBudgetsCount = useMemo(
    () => orcamentosDoMes.filter((o) => (o.status || "").toLowerCase() === "fechado").length,
    [orcamentosDoMes]
  );

  // investments total and expenses total by category (investment.category field expected: 'investimento'|'despesa' or similar)
  const totalsByCategory = useMemo(() => {
    const totals = { investimento: 0, despesa: 0 };
    investmentsDoMes.forEach((it) => {
      const cat = (it.category || "").toLowerCase() === "despesa" || (it.category || "").toLowerCase() === "despesa"
        ? "despesa"
        : (it.category || "").toLowerCase() === "investimento" ? "investimento" : (it.category || "investimento").toLowerCase();
      const val = Number(it.amount) || 0;
      totals[cat] = (totals[cat] || 0) + val;
    });
    return totals;
  }, [investmentsDoMes]);

  // totals per day of month (for bar chart) - for both investments and expenses combined or split
  const totalsPerDay = useMemo(() => {
    // initialize days for the selected month
    const [y, m] = mes.split("-");
    const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ day: String(d), investimento: 0, despesa: 0, total: 0 });
    }
    investmentsDoMes.forEach((it) => {
      const day = new Date(it.created_at).getDate();
      const val = Number(it.amount) || 0;
      const key = (it.category || "").toLowerCase() === "despesa" ? "despesa" : "investimento";
      const idx = day - 1;
      if (arr[idx]) {
        arr[idx][key] = (arr[idx][key] || 0) + val;
        arr[idx].total = (arr[idx].total || 0) + val;
      }
    });
    return arr;
  }, [investmentsDoMes, mes]);

  // top 5 clients by sum of orcamentos (in selected month)
  const topClients = useMemo(() => {
    const map = new Map();
    orcamentosDoMes.forEach((o) => {
      const cid = o.cliente_id;
      const val = Number(o.total) || 0;
      map.set(cid, (map.get(cid) || 0) + val);
    });
    const arr = Array.from(map.entries()).map(([cid, total]) => {
      const cli = clientes.find((c) => c.id === cid);
      return { clienteId: cid, nome: cli ? cli.nome : "(Cliente removido)", total };
    });
    return arr.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orcamentosDoMes, clientes]);

  // if filterCategory set, filter items list accordingly
  const displayedItems = useMemo(() => {
    let arr = investmentsDoMes.slice();
    if (filterCategory === "investimento") arr = arr.filter((i) => (i.category || "").toLowerCase() !== "despesa");
    if (filterCategory === "despesa") arr = arr.filter((i) => (i.category || "").toLowerCase() === "despesa");
    return arr;
  }, [investmentsDoMes, filterCategory]);

  // pie data for investments vs expenses
  const pieData = useMemo(() => {
    return [
      { name: "Investimentos", value: totalsByCategory.investimento || 0 },
      { name: "Despesas", value: totalsByCategory.despesa || 0 },
    ];
  }, [totalsByCategory]);

  const COLORS = ["#facc15", "#ef4444"]; // yellow, red

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-yellow-500">Relatórios</h1>
          <p className="text-sm text-gray-300">Visão do mês: <span className="font-medium text-white">{monthLabel(mes)}</span></p>
        </div>

        {/* filtros */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-300" />
            <select
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            >
              {/* mesesDisponiveis gerado no fetch */}
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

      {/* resumo cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
          <div className="text-sm text-gray-300">Orçamentos fechados</div>
          <div className="mt-2 text-2xl font-semibold text-white">{closedBudgetsCount}</div>
          <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
        </div>

        <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
          <div className="text-sm text-gray-300">Total Investimentos</div>
          <div className="mt-2 text-2xl font-semibold text-white">R$ {currency(totalsByCategory.investimento)}</div>
          <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
        </div>

        <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
          <div className="text-sm text-gray-300">Total Despesas</div>
          <div className="mt-2 text-2xl font-semibold text-white">R$ {currency(totalsByCategory.despesa)}</div>
          <div className="text-xs text-gray-400 mt-1">No mês selecionado</div>
        </div>
      </div>

      {/* main layout: left charts, right top clients & list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* left: charts (use 2 rows) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pie chart */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Investimentos x Despesas</div>
              <div className="text-sm text-gray-400">Distribuição</div>
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
                  <Legend />
                  <Tooltip formatter={(v) => `R$ ${currency(v)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart totals per day (stacked by investimento/despesa) */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Totais por dia ({monthLabel(mes)})</div>
              <div className="text-sm text-gray-400">Detalhe diário</div>
            </div>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={totalsPerDay}>
                  <XAxis dataKey="day" tick={{ fill: "#9CA3AF" }} />
                  <YAxis tickFormatter={(v) => v.toLocaleString()} tick={{ fill: "#9CA3AF" }} />
                  <Tooltip formatter={(v) => `R$ ${currency(v)}`} />
                  <Legend />
                  <Bar dataKey="investimento" stackId="a" fill="#10B981" name="Investimento" />
                  <Bar dataKey="despesa" stackId="a" fill="#EF4444" name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* right: top clients and recent items */}
        <div className="space-y-4">
          {/* Top clients */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Top clientes</div>
              <div className="text-sm text-gray-400">Por valor (mês)</div>
            </div>
            {topClients.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhum orçamento no mês.</div>
            ) : (
              topClients.map((t) => (
                <div key={t.clienteId} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0">
                  <div>
                    <div className="text-sm text-yellow-400 font-medium">{t.nome}</div>
                    <div className="text-xs text-gray-400">Orçamentos total</div>
                  </div>
                  <div className="text-sm font-semibold text-white">R$ {currency(t.total)}</div>
                </div>
              ))
            )}
          </div>

          {/* Recent investments list (filtered by filterCategory) */}
          <div className="p-4 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">Itens ({filterCategory})</div>
              <div className="text-sm text-gray-400">Últimos lançamentos</div>
            </div>

            {displayedItems.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhum item encontrado.</div>
            ) : (
              <div className="space-y-2">
                {displayedItems.slice(0, 8).map((it) => (
                  <div key={it.id} className="flex items-start justify-between border border-gray-700 rounded-lg p-3 bg-gray-900">
                    <div className="max-w-[70%]">
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
                          onClick={() => {
                            if (!confirm("Excluir item?")) return;
                            supabase.from("investments").delete().eq("id", it.id).then(() => fetchInvestments());
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
      </div>

      {/* carregando */}
      {loading && <div className="mt-4 text-center text-gray-400">Carregando dados...</div>}
    </div>
  );
}
