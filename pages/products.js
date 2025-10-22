import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { FiPackage, FiTrash2 } from "react-icons/fi";

/**
 * Produtos - atualizações:
 * - editar card in-place (modo admin)
 * - aceita vírgula como separador decimal em entradas (converte ao salvar)
 * - exibe valores no padrão brasileiro (ex: 1.234,56)
 * - placeholder exemplo com vírgula "Ex: 99,90"
 */

function parseCurrencyInput(value) {
  if (value === null || value === undefined) return 0;
  // aceita "1.234,56" ou "1234,56" ou "1234.56" ou "1234"
  const asString = String(value).trim();
  if (asString === "") return 0;
  // remover espaços
  const s = asString.replace(/\s/g, "");
  // se tem vírgula, substituir vírgula por ponto após remover pontos de milhar
  if (s.indexOf(",") !== -1) {
    // remover pontos de milhar e trocar vírgula por ponto
    const noThousand = s.replace(/\./g, "");
    const normalized = noThousand.replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  } else {
    // sem vírgula, só parseFloat direto (também aceita ponto decimal)
    const n = parseFloat(s.replace(/\./g, ""));
    return Number.isFinite(n) ? n : 0;
  }
}

function formatCurrencyBR(value) {
  if (value === null || value === undefined || value === "") return "0,00";
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  // edição
  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editDescricao, setEditDescricao] = useState("");

  useEffect(() => {
    buscarProdutos();
  }, []);

  async function buscarProdutos() {
    setLoading(true);
    const { data, error } = await supabase.from("produtos").select().order("created_at", { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setProdutos(data || []);
    }
    setLoading(false);
  }

  async function adicionarProduto(e) {
    e?.preventDefault();
    if (!titulo) return alert("Título é obrigatório.");
    const num = parseCurrencyInput(valor);
    setLoading(true);
    try {
      await supabase.from("produtos").insert([{ titulo, valor: num, descricao }]);
      setTitulo("");
      setValor("");
      setDescricao("");
      setMostrarForm(false);
      buscarProdutos();
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
    } finally {
      setLoading(false);
    }
  }

  async function removerProduto(id) {
    if (!isAdmin()) {
      alert("Apenas administradores podem remover produtos.");
      return;
    }
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      await supabase.from("produtos").delete().eq("id", id);
      buscarProdutos();
    } catch (e) {
      console.error(e);
    }
  }

  function startEditProduto(p) {
    setEditingId(p.id);
    setEditTitulo(p.titulo || "");
    // Mostrar com vírgula
    setEditValor(p.valor !== undefined && p.valor !== null ? formatCurrencyBR(p.valor) : "");
    setEditDescricao(p.descricao || "");
    setMostrarForm(false;);
  }

  async function salvarEdicaoProduto(e) {
    e?.preventDefault();
    if (!isAdmin()) {
      alert("Apenas administradores podem editar.");
      return;
    }
    if (!editTitulo) return alert("Título é obrigatório.");
    const num = parseCurrencyInput(editValor);
    try {
      await supabase.from("produtos").update({ titulo: editTitulo, valor: num, descricao: editDescricao }).eq("id", editingId);
      setEditingId(null);
      buscarProdutos();
    } catch (err) {
      console.error("Erro ao salvar edição produto:", err);
    }
  }

  function cancelarEdicao() {
    setEditingId(null);
    setEditTitulo("");
    setEditValor("");
    setEditDescricao("");
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Produtos</h2>

        {isAdmin() && (
          <button onClick={() => { setMostrarForm(!mostrarForm); cancelarEdicao(); }} className="bg-yellow-500 text-black px-3 py-2 rounded-md">
            <FiPackage /> Novo Produto
          </button>
        )}
      </div>

      {/* Form de adicionar */}
      {mostrarForm && (
        <form onSubmit={adicionarProduto} className="mb-6 bg-gray-900 p-4 rounded-md border border-gray-800">
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 outline-none"
              placeholder="Nome do produto"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Valor</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 outline-none"
              placeholder="Ex: 99,90"
            />
            <div className="text-xs text-gray-400 mt-1">Use vírgula para decimais (ex: 99,90)</div>
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Descrição</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 outline-none"
              placeholder="Descrição"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-yellow-500 text-black px-3 py-2 rounded">Salvar</button>
            <button type="button" onClick={() => setMostrarForm(false)} className="bg-gray-700 text-white px-3 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className="text-gray-500 italic">Nenhum produto cadastrado ainda.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {produtos.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-md p-4 flex justify-between items-start">
              {editingId === p.id ? (
                <form className="w-full" onSubmit={salvarEdicaoProduto}>
                  <div className="mb-2">
                    <input className="w-full p-2 rounded-md bg-gray-800 border border-gray-700" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <input className="w-full p-2 rounded-md bg-gray-800 border border-gray-700" value={editValor} onChange={(e) => setEditValor(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <input className="w-full p-2 rounded-md bg-gray-800 border border-gray-700" value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-yellow-500 text-black px-3 py-1 rounded">Salvar</button>
                    <button type="button" onClick={cancelarEdicao} className="bg-gray-700 text-white px-3 py-1 rounded">Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div className="font-semibold text-yellow-400 text-lg">{p.titulo}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      💰 R$ {formatCurrencyBR(p.valor)}
                      {p.descricao ? <span> • {p.descricao}</span> : ""}
                    </div>
                  </div>

                  {isAdmin() && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEditProduto(p)} className="text-yellow-400 hover:text-yellow-300">Editar</button>
                      <button onClick={() => removerProduto(p.id)} className="text-red-500 hover:text-red-400">
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
