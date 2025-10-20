import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { FiTool, FiTrash2 } from "react-icons/fi";

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    buscarServicos();
  }, []);

  async function buscarServicos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar serviços:", error);
        setServicos([]);
      } else {
        setServicos(data || []);
      }
    } catch (e) {
      console.error(e);
      setServicos([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarServico(e) {
    e.preventDefault();
    if (!isAdmin()) {
      alert("Apenas administradores podem adicionar serviços.");
      return;
    }

    if (!titulo.trim() || !valor.trim()) {
      alert("Preencha pelo menos o título e o valor do serviço.");
      return;
    }

    try {
      await supabase.from("servicos").insert([
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
      buscarServicos();
    } catch (e) {
      console.error("Erro ao adicionar serviço:", e);
    }
  }

  async function removerServico(id) {
    if (!isAdmin()) {
      alert("Apenas administradores podem remover serviços.");
      return;
    }
    if (!window.confirm("Tem certeza que deseja excluir este serviço?")) return;

    try {
      await supabase.from("servicos").delete().eq("id", id);
      buscarServicos();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Serviços</h2>

        {isAdmin() && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="p-2 rounded-full bg-yellow-500 text-black hover:bg-yellow-400 transition-all shadow-lg border border-yellow-600"
            title={mostrarForm ? "Cancelar" : "Cadastrar Serviço"}
          >
            <FiTool className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Formulário de cadastro */}
      {isAdmin() && mostrarForm && (
        <form
          onSubmit={adicionarServico}
          className="bg-gray-900 border border-yellow-600 rounded-2xl p-5 mb-6 shadow-lg transition-all"
        >
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Título</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do serviço"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Valor</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 150.00"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Descrição</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes adicionais do serviço"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-500 text-black font-semibold py-2 rounded-lg hover:bg-yellow-400 transition-all"
          >
            Salvar Serviço
          </button>
        </form>
      )}

      {/* Lista de serviços */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : servicos.length === 0 ? (
        <div className="text-gray-500 italic">Nenhum serviço cadastrado ainda.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {servicos.map((s) => (
            <div
              key={s.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex justify-between items-start hover:border-yellow-600 hover:shadow-gold transition-all"
            >
              <div>
                <div className="font-semibold text-yellow-400 text-lg">
                  {s.titulo}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  💰 R$ {s.valor}
                  {s.descricao ? <span> • {s.descricao}</span> : ""}
                </div>
              </div>

              {isAdmin() && (
                <button
                  onClick={() => removerServico(s.id)}
                  className="text-red-500 hover:text-red-400 transition"
                  title="Excluir serviço"
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
