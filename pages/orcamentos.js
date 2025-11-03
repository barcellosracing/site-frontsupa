// pages/orcamentos.js  (ou Orçamentos.jsx)
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { FiPlus, FiX, FiTrash2, FiSearch } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);

  const [mostrarForm, setMostrarForm] = useState(false);

  // filtros principais (fora do formulário)
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [mesFiltro, setMesFiltro] = useState("");
  const [anoFiltro, setAnoFiltro] = useState("");

  // formulário novo orçamento
  const [clienteId, setClienteId] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [sugestoesCliente, setSugestoesCliente] = useState([]);

  const [tipoAtual, setTipoAtual] = useState("produto");
  const [buscaItem, setBuscaItem] = useState("");
  const [sugestoesItens, setSugestoesItens] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);

  const [itens, setItens] = useState([]);

  // carregar dados
  useEffect(() => {
    buscarTudo();
  }, []);

  async function buscarTudo() {
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
      setProdutos((prod || []).filter((p) => p.quantidade > 0));
    } catch (err) {
      console.error("Erro buscarTudo:", err);
      toast.error("Erro ao carregar dados.");
    }
  }

  // ---------- AUTOCOMPLETE (cliente) ----------
  useEffect(() => {
    if (!buscaCliente || buscaCliente.trim().length === 0) {
      setSugestoesCliente([]);
      return;
    }
    const q = buscaCliente.toLowerCase();
    setSugestoesCliente(clientes.filter((c) => c.nome?.toLowerCase().includes(q)));
  }, [buscaCliente, clientes]);

  // ---------- AUTOCOMPLETE (itens) ----------
  useEffect(() => {
    if (!buscaItem || buscaItem.trim().length === 0) {
      setSugestoesItens([]);
      return;
    }
    const q = buscaItem.toLowerCase();
    if (tipoAtual === "produto") {
      setSugestoesItens(produtos.filter((p) => p.nome?.toLowerCase().includes(q)));
    } else {
      setSugestoesItens(servicos.filter((s) => s.titulo?.toLowerCase().includes(q)));
    }
  }, [buscaItem, tipoAtual, produtos, servicos]);

  // adicionar item ao orçamento (valida estoque)
  function adicionarItemAtual() {
    if (!itemSelecionado) {
      toast.error("Selecione um item válido.");
      return;
    }
    const qtd = parseInt(quantidade || 1, 10);
    if (qtd <= 0) {
      toast.error("Quantidade deve ser maior que 0.");
      return;
    }

    if (tipoAtual === "produto") {
      const p = produtos.find((x) => x.id === itemSelecionado);
      if (!p) {
        toast.error("Produto não encontrado.");
        return;
      }
      if (qtd > p.quantidade) {
        toast.error(`Estoque insuficiente. Disponível: ${p.quantidade}`);
        return;
      }
      setItens((prev) => [
        ...prev,
        {
          tipo: "produto",
          id: p.id,
          nome: p.nome,
          valor: parseFloat(p.valor ?? p.preco_custo ?? 0),
          qtd,
        },
      ]);
    } else {
      const s = servicos.find((x) => x.id === itemSelecionado);
      if (!s) {
        toast.error("Serviço não encontrado.");
        return;
      }
      setItens((prev) => [
        ...prev,
        {
          tipo: "serviço",
          id: s.id,
          nome: s.titulo,
          valor: parseFloat(s.valor ?? 0),
          qtd,
        },
      ]);
    }

    // limpar campos e fechar sugestões
    setBuscaItem("");
    setSugestoesItens([]);
    setItemSelecionado(null);
    setQuantidade(1);
  }

  function removerItem(idx) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  // salvar orçamento: inserir orcamentos, orcamento_itens e reduzir estoque
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

    try {
      const total = itens.reduce((s, it) => s + it.valor * it.qtd, 0);
      const created_at = new Date().toISOString();

      // inserir orçamento
      const { data: orcamento, error: errOrc } = await supabase
        .from("orcamentos")
        .insert([{ cliente_id: clienteId, total, status: "pendente", created_at }])
        .select()
        .single();
      if (errOrc) throw errOrc;

      // inserir items
      const itensFormatados = itens.map((it) => ({
        orcamento_id: orcamento.id,
        item_tipo: it.tipo === "produto" ? "product" : "service",
        item_id: it.id,
        quantidade: it.qtd,
        valor: it.valor,
        created_at,
      }));
      const { error: errItens } = await supabase.from("orcamento_itens").insert(itensFormatados);
      if (errItens) throw errItens;

      // reduzir estoque (por produto) lendo a quantidade atual diretamente do banco
      for (const it of itens.filter((x) => x.tipo === "produto")) {
        // pegar quantidade atual do produto no banco
        const { data: produtoAtual, error: pErr } = await supabase
          .from("estoque_produtos")
          .select("quantidade")
          .eq("id", it.id)
          .single();
        if (pErr) {
          console.warn("Erro buscando produto antes de atualizar estoque:", pErr);
          continue; // tentar os próximos
        }
        const novaQtd = Math.max((produtoAtual.quantidade || 0) - it.qtd, 0);
        await supabase.from("estoque_produtos").update({ quantidade: novaQtd }).eq("id", it.id);
      }

      toast.success("Orçamento salvo com sucesso!");
      setItens([]);
      setClienteId("");
      setBuscaCliente("");
      setMostrarForm(false);
      buscarTudo();
    } catch (err) {
      console.error("Erro salvarOrcamento:", err);
      toast.error("Erro ao salvar orçamento.");
    }
  }

  // excluir orçamento: repor estoque, apagar itens e apagar o orçamento
  async function excluirOrcamento(o) {
    if (!isAdmin()) {
      toast.error("Apenas administradores podem excluir.");
      return;
    }
    const confirm = window.confirm("Deseja realmente excluir este orçamento?");
    if (!confirm) return;

    try {
      // buscar itens vinculados
      const { data: itensDoOrc, error: e } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", o.id);
      if (e) throw e;

      // repor estoque para cada item do tipo product (lendo e atualizando quantidade atual)
      for (const it of itensDoOrc || []) {
        if (it.item_tipo === "product") {
          // pegar quant atual
          const { data: prodAtual, error: pErr } = await supabase
            .from("estoque_produtos")
            .select("quantidade")
            .eq("id", it.item_id)
            .single();
          if (pErr) {
            console.warn("Erro ao buscar produto para repor:", pErr);
            continue;
          }
          const novaQtd = (prodAtual.quantidade || 0) + (it.quantidade || 0);
          await supabase.from("estoque_produtos").update({ quantidade: novaQtd }).eq("id", it.item_id);
        }
      }

      // deletar itens do orçamento e depois o próprio orçamento
      await supabase.from("orcamento_itens").delete().eq("orcamento_id", o.id);
      await supabase.from("orcamentos").delete().eq("id", o.id);

      toast.success("Orçamento excluído e estoque atualizado.");
      buscarTudo();
    } catch (err) {
      console.error("Erro excluirOrcamento:", err);
      toast.error("Erro ao excluir orçamento.");
    }
  }

  // alternar status
  async function alternarStatus(o) {
    if (!isAdmin()) {
      toast.error("Apenas administradores podem alterar status.");
      return;
    }
    const novoStatus = o.status === "fechado" ? "pendente" : "fechado";
    try {
      const { error } = await supabase.from("orcamentos").update({ status: novoStatus }).eq("id", o.id);
      if (error) throw error;
      buscarTudo();
      toast.success("Status atualizado.");
    } catch (err) {
      console.error("Erro alternarStatus:", err);
      toast.error("Erro ao atualizar status.");
    }
  }

  // filtros aplicados (cliente / mês / ano) - clienteFiltro é texto (nome parcial)
  const filtrados = orcamentos.filter((o) => {
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

  // ----- JSX -----
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
            aria-label="Nova entrada"
          >
            {mostrarForm ? <FiX size={22} /> : <FiPlus size={22} />}
          </button>
        )}
      </div>

      {/* filtros (cliente + mês + ano) lado a lado */}
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

      {/* formulário novo orçamento */}
      {mostrarForm && (
        <form onSubmit={salvarOrcamento} className="mb-4 border border-gray-700 rounded-xl shadow-md bg-gray-950 p-4 w-full">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Novo Orçamento</h3>

          <div className="flex flex-col gap-3">
            {/* cliente autocomplete */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value);
                }}
                onFocus={() => {
                  /* mantém sugestões via buscaCliente state */
                }}
              />
              {sugestoesCliente.length > 0 && (
                <div className="absolute z-20 bg-gray-900 border border-gray-700 rounded w-full mt-1 max-h-40 overflow-auto">
                  {sugestoesCliente.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-gray-800 cursor-pointer text-white"
                      onClick={() => {
                        setClienteId(c.id);
                        setBuscaCliente(c.nome);
                        setSugestoesCliente([]);
                      }}
                    >
                      {c.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* tipo de item (espaçamento aumentado) */}
            <div className="flex gap-3">
              <button
                type="button"
                className={`flex-1 py-2 rounded ${tipoAtual === "produto" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"}`}
                onClick={() => setTipoAtual("produto")}
              >
                Produto
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded ${tipoAtual === "serviço" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"}`}
                onClick={() => setTipoAtual("serviço")}
              >
                Serviço
              </button>
            </div>

            {/* busca item (autocomplete, lista só aparece ao digitar) */}
            <div className="relative">
              <input
                type="text"
                placeholder={tipoAtual === "produto" ? "Buscar produto..." : "Buscar serviço..."}
                className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                value={buscaItem}
                onChange={(e) => {
                  setBuscaItem(e.target.value);
                }}
                onFocus={() => {
                  /* sugestões controladas pelo efeito */
                }}
              />
              {sugestoesItens.length > 0 && (
                <div className="absolute z-20 bg-gray-900 border border-gray-700 rounded w-full mt-1 max-h-40 overflow-auto">
                  {sugestoesItens.map((it) => (
                    <div
                      key={it.id}
                      className="p-2 hover:bg-gray-800 cursor-pointer text-white"
                      onClick={() => {
                        setItemSelecionado(it.id);
                        setBuscaItem(tipoAtual === "produto" ? it.nome : it.titulo);
                        setSugestoesItens([]);
                      }}
                    >
                      {tipoAtual === "produto" ? `${it.nome} — R$ ${it.valor ?? it.preco_custo} (Estoque: ${it.quantidade})` : `${it.titulo} — R$ ${it.valor}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* quantidade + adicionar (com gap aumentado) */}
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

            {/* lista de itens adicionados */}
            {itens.length > 0 && (
              <div className="mt-2">
                {itens.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-900 border border-gray-700 rounded p-2 mb-1">
                    <div>
                      <div className="font-medium text-white">{it.nome}</div>
                      <div className="text-sm text-gray-400">Qtd: {it.qtd} • R$ {it.valor.toFixed(2)}</div>
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
        {filtrados.map((o) => (
          <div key={o.id} className="p-3 border border-gray-700 rounded-xl bg-gray-950 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-white text-base">{nomeCliente(o.cliente_id)}</div>
                <div className="text-sm text-gray-400">Total: R$ {o.total.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 text-xs rounded-full font-semibold ${o.status === "fechado" ? "bg-green-600 text-white" : "bg-yellow-500 text-black"}`}>
                  {o.status.toUpperCase()}
                </span>

                <div className="flex gap-2">
                  {isAdmin() && (
                    <>
                      <button className="text-xs text-gray-300 border border-gray-600 px-2 py-1 rounded hover:bg-gray-800" onClick={() => alternarStatus(o)}>
                        {o.status === "fechado" ? "Reabrir" : "Fechar"}
                      </button>
                      <button className="text-xs text-red-400 border border-red-500 px-2 py-1 rounded hover:bg-red-600/20" onClick={() => excluirOrcamento(o)}>
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
