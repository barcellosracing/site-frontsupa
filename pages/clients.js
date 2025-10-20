import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { FiUserPlus, FiTrash2 } from "react-icons/fi";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [fone, setFone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    buscarClientes();
  }, []);

  async function buscarClientes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        setClientes([]);
      } else {
        setClientes(data || []);
      }
    } catch (e) {
      console.error(e);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarCliente(e) {
    e.preventDefault();
    if (!isAdmin()) {
      alert("Apenas administradores podem adicionar clientes.");
      return;
    }

    if (!nome.trim() || !fone.trim()) {
      alert("Preencha pelo menos o nome e o telefone do cliente.");
      return;
    }

    try {
      await supabase.from("clientes").insert([
        {
          nome,
          fone,
          descricao,
          created_at: new Date().toISOString(),
        },
      ]);

      setNome("");
      setFone("");
      setDescricao("");
      setMostrarForm(false);
      buscarClientes();
    } catch (e) {
      console.error("Erro ao adicionar cliente:", e);
    }
  }

  async function removerCliente(id) {
    if (!isAdmin()) {
      alert("Apenas administradores podem excluir.");
      return;
    }
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      await supabase.from("clientes").delete().eq("id", id);
      buscarClientes();
    } catch (e) {
      console.error("Erro ao remover cliente:", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Título e botão de novo cliente */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Clientes</h2>

        {isAdmin() && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-2 bg-yellow-500 text-black font-medium px-4 py-2 rounded-lg shadow hover:bg-yellow-400 transition-all"
          >
            <FiUserPlus />
            {mostrarForm ? "Cancelar" : "Cadastrar Cliente"}
          </button>
        )}
      </div>

      {/* Formulário de cadastro */}
      {isAdmin() && mostrarForm && (
        <form
          onSubmit={adicionarCliente}
          className="bg-gray-900 border border-yellow-600 rounded-2xl p-5 mb-6 shadow-lg transition-all"
        >
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Nome</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do cliente"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Telefone</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={fone}
              onChange={(e) => setFone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">
              Descrição / Observações
            </label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informações adicionais sobre o cliente"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-500 text-black font-semibold py-2 rounded-lg hover:bg-yellow-400 transition-all"
          >
            Salvar Cliente
          </button>
        </form>
      )}

      {/* Lista de clientes */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : clientes.length === 0 ? (
        <div className="text-gray-500 italic">Nenhum cliente cadastrado ainda.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex justify-between items-start hover:border-yellow-600 hover:shadow-gold transition-all"
            >
              <div>
                <div className="font-semibold text-yellow-400 text-lg">{c.nome}</div>
                <div className="text-sm text-gray-400 mt-1">
                  📞 {c.fone}
                  {c.descricao ? <span> • {c.descricao}</span> : ""}
                </div>
              </div>

              {isAdmin() && (
                <button
                  onClick={() => removerCliente(c.id)}
                  className="text-red-500 hover:text-red-400 transition"
                  title="Excluir cliente"
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
