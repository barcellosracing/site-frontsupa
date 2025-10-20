import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { FiPackage, FiTrash2 } from "react-icons/fi";

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    buscarProdutos();
  }, []);

  async function buscarProdutos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar produtos:", error);
        setProdutos([]);
      } else {
        setProdutos(data || []);
      }
    } catch (e) {
      console.error(e);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarProduto(e) {
    e.preventDefault();
    if (!isAdmin()) {
      alert("Apenas administradores podem adicionar produtos.");
      return;
    }

    if (!titulo.trim() || !valor.trim()) {
      alert("Preencha pelo menos o título e o valor do produto.");
      return;
    }

    try {
      await supabase.from("produtos").insert([
        {
          titulo,
          valor,
          descricao,
          created_at: new Date().toISOString(),
        },
      ]);

      setTitulo("");
      setValor("");
      setDescricao("");
      setMostrarForm(false);
      buscarProdutos();
    } catch (e) {
      console.error("Erro ao adicionar produto:", e);
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Produtos</h2>

        {isAdmin() && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="p-2 rounded-full bg-yellow-500 text-black hover:bg-yellow-400 transition-all shadow-lg border border-yellow-600"
            title={mostrarForm ? "Cancelar" : "Cadastrar Produto"}
          >
            <FiPackage className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Formulário de cadastro */}
      {isAdmin() && mostrarForm && (
        <form
          onSubmit={adicionarProduto}
          className="bg-gray-900 border border-yellow-600 rounded-2xl p-5 mb-6 shadow-lg transition-all"
        >
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Título</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do produto"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Valor</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 99.90"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Descrição</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes adicionais do produto"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-500 text-black font-semibold py-2 rounded-lg hover:bg-yellow-400 transition-all"
          >
            Salvar Produto
          </button>
        </form>
      )}

      {/* Lista de produtos */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className="text-gray-500 italic">
          Nenhum produto cadastrado ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex justify-between items-start hover:border-yellow-600 hover:shadow-gold transition-all"
            >
              <div>
                <div className="font-semibold text-yellow-400 text-lg">
                  {p.titulo}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  💰 R$ {p.valor}
                  {p.descricao ? <span> • {p.descricao}</span> : ""}
                </div>
              </div>

              {isAdmin() && (
                <button
                  onClick={() => removerProduto(p.id)}
                  className="text-red-500 hover:text-red-400 transition"
                  title="Excluir produto"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
