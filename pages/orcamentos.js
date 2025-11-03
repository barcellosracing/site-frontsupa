// pages/orcamentos.js  (ou Orçamentos.jsx)
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { FiPlus, FiX, FiTrash2, FiSearch } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);

  const [mostrarForm, setMostrarForm] = useState(false);

  // filtros externos (fora do form)
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [mesFiltro, setMesFiltro] = useState("");
  const [anoFiltro, setAnoFiltro] = useState("");

  // form - cliente autocomplete
  const [clienteId, setClienteId] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [sugestoesCliente, setSugestoesCliente] = useState([]);
  const clienteInputRef = useRef(null);

  // form - item autocomplete
  const [tipoAtual, setTipoAtual] = useState("produto"); // 'produto' | 'serviço'
  const [buscaItem, setBuscaItem] = useState("");
  const [sugestoesItens, setSugestoesItens] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const itemInputRef = useRef(null);

  // itens do orçamento em edição
  const [itens, setItens] = useState([]);

  // controle de cards expandidos e cache dos items de cada orçamento
  const [expandidoId, setExpandidoId] = useState(null);
  const [cacheItensOrcamento, setCacheItensOrcamento] = useState({}); // { orcamentoId: [itens...] }

  // loading simples
  const [loading, setLoading] = useState(false);

  // load inicial
  useEffect(() => {
    buscarTudo();
  }, []);

  async function buscarTudo() {
    setLoading(true);
    try {
      const [{ data: orc }, { data: cli }, { data: prod }, { data: serv }] =
        await Promise.all([
          supabase.from("orcamentos").select("*").order("created_at", { ascending: false }),
          supabase.from("clientes").select("*"),
          supabase.from("estoque_produtos").select("*"),
          supabase.from("servicos").select("*"),
        ]);

      setOrcamentos(orc || []);
      setClientes(cli || []);
      setServicos(serv || []);
      setProdutos((prod || []).filter((p) => (p.quantidade ?? 0) > 0));
    } catch (err) {
      console.error("buscarTudo erro:", err);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- AUTOCOMPLETE CLIENTE ----------
  useEffect(() => {
    const q = (buscaCliente || "").trim().toLowerCase();
    if (!q) {
      setSugestoesCliente([]);
      return;
    }
    setSugestoesCliente(clientes.filter((c) => (c.nome || "").toLowerCase().includes(q)));
  }, [buscaCliente, clientes]);

  // ---------- AUTOCOMPLETE ITENS ----------
  useEffect(() => {
    const q = (buscaItem || "").trim().toLowerCase();
    if (!q) {
      setSugestoesItens([]);
      return;
    }
    if (tipoAtual === "produto") {
      setSugestoesItens(produtos.filter((p) => (p.nome || "").toLowerCase().includes(q)));
    } else {
      setSugestoesItens(servicos.filter((s) => (s.titulo || "").toLowerCase().includes(q)));
    }
  }, [buscaItem, tipoAtual, produtos, servicos]);

  // adicionar item no orçamento (valida estoque)
  function adicionarItemAtual() {
    if (!itemSelecionado) {
      toast.error("Selecione um item válido.");
      return;
    }
    const qtd = parseInt(quantidade || 1, 10);
    if (isNaN(qtd) || qtd <= 0) {
      toast.error("Quantidade deve ser maior que 0.");
      return;
    }

    if (tipoAtual === "produto") {
      const p = produtos.find((x) => x.id === itemSelecionado);
      if (!p) return toast.error("Produto inválido.");
      if (qtd > (p.quantidade || 0)) return toast.error(`Estoque insuficiente. Disponível: ${p.quantidade}`);
      const valor = Number(p.valor ?? p.preco_custo ?? 0);
      setItens((prev) => [
        ...prev,
        {
          tipo: "produto",
          item_id: p.id,
          nome: p.nome,
          valor_unitario: valor,
          quantidade: qtd,
          subtotal: Number((valor * qtd).toFixed(2)),
        },
      ]);
    } else {
      const s = servicos.find((x) => x.id === itemSelecionado);
      if (!s) return toast.error("Serviço inválido.");
      const valor = Number(s.valor ?? 0);
      setItens((prev) => [
        ...prev,
        {
          tipo: "serviço",
          item_id: s.id,
          nome: s.titulo,
          valor_unitario: valor,
          quantidade: qtd,
          subtotal: Number((valor * qtd).toFixed(2)),
        },
      ]);
    }

    // limpa input e sugestões (fechar na primeira clicada garantido com onMouseDown + blur)
    setBuscaItem("");
    setSugestoesItens([]);
    setItemSelecionado(null);
    setQuantidade(1);
    // remove foco do input (se existir)
    itemInputRef.current?.blur();
  }

  function removerItem(idx) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  // salvar orcamento: insere orcamentos, orcamento_itens e reduz estoque
  async function salvarOrcamento(e) {
    e.preventDefault();
    if (!isAdmin()) {
      toast.error("Apenas administradores podem criar orçamentos.");
      return;
    }
    if (!clienteId) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }

    setLoading(true);
    try {
      const total = itens.reduce((s, it) => s + (Number(it.subtotal) || Number(it.valor_unitario) * Number(it.quantidade)), 0);
      const created_at = new Date().toISOString();

      // inserir orçamento
      const { data: orcamento, error: errOrc } = await supabase
        .from("orcamentos")
        .insert([{ cliente_id: clienteId, total, status: "pendente", created_at }])
        .select()
        .single();
      if (errOrc) throw errOrc;

      // formatar itens segundo estrutura confirmada (tipo, item_id, quantidade, valor_unitario, subtotal)
      const itensParaInserir = itens.map((it) => ({
        orcamento_id: orcamento.id,
        tipo: it.tipo === "produto" ? "produto" : "serviço",
        item_id: it.item_id,
        quantidade: it.quantidade,
        valor_unitario: it.valor_unitario,
        subtotal: it.subtotal,
        created_at,
      }));

      const { error: errItens } = await supabase.from("orcamento_itens").insert(itensParaInserir);
      if (errItens) throw errItens;

      // reduzir estoque — ler quantidade atual no banco antes de atualizar (mais seguro)
      for (const it of itens.filter((x) => x.tipo === "produto")) {
        const { data: prodAtual, error: errP } = await supabase
          .from("estoque_produtos")
          .select("quantidade")
          .eq("id", it.item_id)
          .single();
        if (errP) {
          console.warn("Não foi possível ler produto antes de reduzir estoque:", errP);
          continue;
        }
        const novaQtd = Math.max((prodAtual.quantidade || 0) - it.quantidade, 0);
        await supabase.from("estoque_produtos").update({ quantidade: novaQtd }).eq("id", it.item_id);
      }

      toast.success("Orçamento salvo com sucesso!");
      setItens([]);
      setClienteId("");
      setBuscaCliente("");
      setMostrarForm(false);
      buscarTudo();
    } catch (err) {
      console.error("salvarOrcamento erro:", err);
      toast.error("Erro ao salvar orçamento.");
    } finally {
      setLoading(false);
    }
  }

  // excluir orcamento: repor estoque, deletar itens e deletar orcamento
  async function excluirOrcamento(o) {
    if (!isAdmin()) {
      toast.error("Apenas administradores podem excluir.");
      return;
    }
    const confirmar = window.confirm("Deseja realmente excluir este orçamento?");
    if (!confirmar) return;

    setLoading(true);
    try {
      // obter itens do orçamento
      const { data: itensDoOrc, error: e } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", o.id);
      if (e) throw e;

      // repor estoque para itens do tipo 'produto'
      for (const it of itensDoOrc || []) {
        if (it.tipo === "produto") {
          // ler quantidade atual e somar
          const { data: prodAtual, error: pErr } = await supabase
            .from("estoque_produtos")
            .select("quantidade")
            .eq("id", it.item_id)
            .single();
          if (pErr) {
            console.warn("Erro ler produto ao repor:", pErr);
            continue;
          }
          const novaQtd = (prodAtual.quantidade || 0) + (Number(it.quantidade) || 0);
          await supabase.from("estoque_produtos").update({ quantidade: novaQtd }).eq("id", it.item_id);
        }
      }

      // deletar itens e orçamento
      await supabase.from("orcamento_itens").delete().eq("orcamento_id", o.id);
      await supabase.from("orcamentos").delete().eq("id", o.id);

      toast.success("Orçamento excluído e estoque atualizado.");
      // limpar cache de itens do orcamento
      setCacheItensOrcamento((prev) => {
        const copy = { ...prev };
        delete copy[o.id];
        return copy;
      });
      buscarTudo();
    } catch (err) {
      console.error("excluirOrcamento erro:", err);
      toast.error("Erro ao excluir orçamento.");
    } finally {
      setLoading(false);
    }
  }

  // alternar status pendente/fechado
  async function alternarStatus(o) {
    if (!isAdmin()) {
      toast.error("Apenas administradores.");
      return;
    }
    try {
      const novoStatus = o.status === "fechado" ? "pendente" : "fechado";
      const { error } = await supabase.from("orcamentos").update({ status: novoStatus }).eq("id", o.id);
      if (error) throw error;
      toast.success("Status atualizado.");
      buscarTudo();
    } catch (err) {
      console.error("alternarStatus erro:", err);
      toast.error("Erro ao atualizar status.");
    }
  }

  // quando clicar em card do orçamento: expandir e buscar itens (se necessário)
  async function toggleExpandir(orc) {
    if (expandidoId === orc.id) {
      // recolher
      setExpandidoId(null);
      return;
    }

    // se já temos em cache, só expandir
    if (cacheItensOrcamento[orc.id]) {
      setExpandidoId(orc.id);
      return;
    }

    // buscar itens do orcamento
    setLoading(true);
    try {
      const { data: itensDoOrc, error } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orc.id)
        .order("id", { ascending: true });
      if (error) throw error;

      // garantir tipos numéricos e obter nome do item para exibição resumida
      const itensComNome = await Promise.all(
        (itensDoOrc || []).map(async (it) => {
          // garantir números
          const quantidadeNum = Number(it.quantidade || 0);
          const valorUnit = Number(it.valor_unitario || it.valor || 0);
          const subtotalNum = Number(it.subtotal ?? (valorUnit * quantidadeNum));

          if (it.tipo === "produto") {
            const { data: p } = await supabase.from("estoque_produtos").select("nome").eq("id", it.item_id).single();
            return {
              ...it,
              nome: p?.nome ?? "(produto removido)",
              quantidade: quantidadeNum,
              valor_unitario: valorUnit,
              subtotal: subtotalNum,
            };
          } else {
            const { data: s } = await supabase.from("servicos").select("titulo").eq("id", it.item_id).single();
            return {
              ...it,
              nome: s?.titulo ?? "(serviço removido)",
              quantidade: quantidadeNum,
              valor_unitario: valorUnit,
              subtotal: subtotalNum,
            };
          }
        })
      );

      setCacheItensOrcamento((prev) => ({ ...prev, [orc.id]: itensComNome }));
      setExpandidoId(orc.id);
    } catch (err) {
      console.error("toggleExpandir erro:", err);
      toast.error("Erro ao carregar itens do orçamento.");
    } finally {
      setLoading(false);
    }
  }

  // filtros aplicados
  const orcFiltrados = orcamentos.filter((o) => {
    const data = new Date(o.created_at);
    const mesOk = mesFiltro ? data.getMonth() + 1 === parseInt(mesFiltro, 10) : true;
    const anoOk = anoFiltro ? data.getFullYear() === parseInt(anoFiltro, 10) : true;
    const nomeCli = nomeCliente(o.cliente_id).toLowerCase();
    const clienteOk = clienteFiltro ? nomeCli.includes(clienteFiltro.toLowerCase()) : true;
    return mesOk && anoOk && clienteOk;
  });

  function nomeCliente(id) {
    const c = clientes.find((x) => x.id === id);
    return c ? c.nome : "(Cliente removido)";
  }

  // ---------- RENDER ----------
  return (
    <div className="relative max-w-full overflow-hidden px-3 py-3">
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />

      {/* cabeçalho */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-white">Orçamentos</h2>
        {isAdmin() && (
          <button
            onClick={() => setMostrarForm((s) => !s)}
            className="p-2 text-yellow-400 hover:text-yellow-500 transition"
            aria-label="Novo orçamento"
          >
            {mostrarForm ? <FiX size={22} /> : <FiPlus size={22} />}
          </button>
        )}
      </div>

      {/* filtros lado a lado (cliente, mês, ano) */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="flex-1 p-2 border border-gray-600 rounded bg-gray-800 text-white"
          value={clienteFiltro}
          onChange={(e) => setClienteFiltro(e.target.value)}
        />

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mês"
            className="w-24 p-2 border border-gray-600 rounded bg-gray-800 text-white text-center"
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
          />
          <input
            type="number"
            placeholder="Ano"
            className="w-28 p-2 border border-gray-600 rounded bg-gray-800 text-white text-center"
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* FORMULÁRIO NOVO ORÇAMENTO */}
      {mostrarForm && (
        <form onSubmit={salvarOrcamento} className="mb-4 border border-gray-700 rounded-xl shadow-md bg-gray-950 p-4 w-full">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Novo Orçamento</h3>

          <div className="flex flex-col gap-3">
            {/* cliente autocomplete */}
            <div className="relative">
              <input
                ref={clienteInputRef}
                type="text"
                placeholder="Buscar cliente..."
                className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value);
                  setClienteId(""); // limpa seleção anterior
                }}
              />
              {sugestoesCliente.length > 0 && (
                <div className="absolute z-30 bg-gray-900 border border-gray-700 rounded w-full mt-1 max-h-40 overflow-auto">
                  {sugestoesCliente.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-gray-800 cursor-pointer text-white"
                       onClick={(e) => {
                        setClienteId(c.id);
                        setBuscaCliente(c.nome);
                        setSugestoesCliente([]);
                        // blur input para garantir fechamento imediato em mobile
                        clienteInputRef.current?.blur();
                      }}
                    >
                      {c.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* tipo produto/serviço (espaçamento aumentado) */}
            <div className="flex gap-3">
              <button
                type="button"
                className={`flex-1 py-2 rounded ${tipoAtual === "produto" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"}`}
                onClick={() => {
                  setTipoAtual("produto");
                  setBuscaItem("");
                  setSugestoesItens([]);
                  setItemSelecionado(null);
                }}
              >
                Produto
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded ${tipoAtual === "serviço" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"}`}
                onClick={() => {
                  setTipoAtual("serviço");
                  setBuscaItem("");
                  setSugestoesItens([]);
                  setItemSelecionado(null);
                }}
              >
                Serviço
              </button>
            </div>

            {/* autocomplete item */}
            <div className="relative">
              <input
                ref={itemInputRef}
                type="text"
                placeholder={tipoAtual === "produto" ? "Buscar produto..." : "Buscar serviço..."}
                className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                value={buscaItem}
                onChange={(e) => {
                  setBuscaItem(e.target.value);
                  setItemSelecionado(null);
                }}
              />
              {sugestoesItens.length > 0 && (
                <div className="absolute z-30 bg-gray-900 border border-gray-700 rounded w-full mt-1 max-h-40 overflow-auto">
                  {sugestoesItens.map((it) => (
                    <div
                      key={it.id}
                      className="p-2 hover:bg-gray-800 cursor-pointer text-white"
                       onClick={(e) => {
                        setItemSelecionado(it.id);
                        setBuscaItem(tipoAtual === "produto" ? it.nome : it.titulo);
                        setSugestoesItens([]);
                        // blur input para garantir fechamento imediato em mobile
                        itemInputRef.current?.blur();
                      }}
                    >
                      {tipoAtual === "produto"
                        ? `${it.nome} — R$ ${it.valor ?? it.preco_custo} (Estoque: ${it.quantidade})`
                        : `${it.titulo} — R$ ${it.valor}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* quantidade + adicionar (gap aumentado) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                min="1"
                className="w-full sm:w-24 p-2 border border-gray-600 rounded bg-gray-800 text-white text-center"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
              <button
                type="button"
                onClick={() => adicionarItemAtual()}
                className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition"
              >
                Adicionar
              </button>
            </div>

            {/* itens adicionados */}
            {itens.length > 0 && (
              <div className="mt-2 space-y-2">
                {itens.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-900 border border-gray-700 rounded p-2">
                    <div>
                      <div className="font-medium text-white">{it.nome}</div>
                      <div className="text-sm text-gray-400">Qtd: {it.quantidade} • R$ {Number(it.valor_unitario).toFixed(2)}</div>
                    </div>
                    <button type="button" className="text-red-500 hover:text-red-600" onClick={() => removerItem(idx)}>
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="mt-3 w-full py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400">
              Salvar Orçamento
            </button>
          </div>
        </form>
      )}

      {/* lista de orçamentos */}
      <div className="grid gap-3">
        {orcFiltrados.map((o) => {
          const itensDoCache = cacheItensOrcamento[o.id] || [];
          const isOpen = expandidoId === o.id;

          return (
            <motion.article
              key={o.id}
              layout
              initial={{ borderRadius: 12 }}
              className="p-3 border border-gray-700 rounded-xl bg-gray-950 shadow-sm"
            >
              <div className="flex justify-between items-center" onClick={() => toggleExpandir(o)}>
                <div>
                  <div className="font-medium text-white text-base">{nomeCliente(o.cliente_id)}</div>
                  <div className="text-sm text-gray-400">Total: R$ {Number(o.total).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs rounded-full font-semibold ${o.status === "fechado" ? "bg-green-600 text-white" : "bg-yellow-500 text-black"}`}>
                    {o.status?.toUpperCase()}
                  </span>

                  <div className="flex gap-2">
                    {isAdmin() && (
                      <>
                        <button
                          className="text-xs text-gray-300 border border-gray-600 px-2 py-1 rounded hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            alternarStatus(o);
                          }}
                        >
                          {o.status === "fechado" ? "Reabrir" : "Fechar"}
                        </button>

                        <button
                          className="text-xs text-red-400 border border-red-500 px-2 py-1 rounded hover:bg-red-600/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            excluirOrcamento(o);
                          }}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* animação e conteúdo expandido */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 border-t border-gray-800 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {loading && <div className="text-sm text-gray-400">Carregando...</div>}

                    {!loading && (!itensDoCache || itensDoCache.length === 0) && (
                      <div className="text-sm text-gray-400">Nenhum item encontrado.</div>
                    )}

                    {!loading && itensDoCache && itensDoCache.length > 0 && (
                      <div className="space-y-2">
                        {itensDoCache.map((it) => (
                          <div key={it.id} className="flex justify-between items-start bg-gray-900 border border-gray-700 rounded p-2">
                            <div className="max-w-[70%]">
                              <div className="font-medium text-white">{it.nome}</div>
                              <div className="text-xs text-gray-400">{it.tipo} • Qtd: {Number(it.quantidade)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-white">R$ {Number(it.valor_unitario || 0).toFixed(2)}</div>
                              <div className="text-xs text-gray-400">Subtotal: R$ {Number(it.subtotal || (it.valor_unitario * it.quantidade) || 0).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}

                        <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                          <div className="text-sm text-gray-400">Total</div>
                          <div className="font-medium text-white">R$ {Number(o.total).toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
