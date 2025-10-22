import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isAdmin } from "../lib/admin";
import { FiUserPlus, FiTrash2 } from "react-icons/fi";

/**
 * Clientes - atualizações:
 * - editar card in-place (modo admin)
 * - formatar telefone (exibição: (XX) XXXXX-XXXX)
 */

function formatPhoneDisplay(value) {
  if (!value) return "";
  // keep only digits
  const d = value.replace(/\D/g, "");
  // format
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  // 11+ digits (common BR mobile)
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function normalizePhoneForSave(value) {
  if (!value) return "";
  const d = value.replace(/\D/g, "");
  // return formatted as (XX) XXXXX-XXXX for storage (or you can store raw digits if preferred)
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [fone, setFone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  // edição in-place
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editFone, setEditFone] = useState("");
  const [editDescricao, setEditDescricao] = useState("");

  useEffect(() => {
    buscarClientes();
  }, []);

  async function buscarClientes() {
    setLoading(true);
    const { data, error } = await supabase.from("clientes").select().order("created_at", {
      ascending: false,
    });
    if (error) {
      console.error(error);
    } else {
      setClientes(data || []);
    }
    setLoading(false);
  }

  async function adicionarCliente(e) {
    e?.preventDefault();
    if (!nome) return alert("Nome é obrigatório.");
    setLoading(true);
    try {
      await supabase.from("clientes").insert([
        {
          nome,
          fone: normalizePhoneForSave(fone),
          descricao,
        },
      ]);
      setNome("");
      setFone("");
      setDescricao("");
      setMostrarForm(false);
      buscarClientes();
    } catch (e) {
      console.error("Erro ao adicionar cliente:", e);
    } finally {
      setLoading(false);
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

  function startEditCliente(c) {
    setEditingId(c.id);
    setEditNome(c.nome || "");
    setEditFone(c.fone || "");
    setEditDescricao(c.descricao || "");
  }

  async function salvarEdicaoCliente(e) {
    e?.preventDefault();
    if (!isAdmin()) {
      alert("Apenas administradores podem editar.");
      return;
    }
    if (!editNome) return alert("Nome é obrigatório.");

    try {
      await supabase
        .from("clientes")
        .update({
          nome: editNome,
          fone: normalizePhoneForSave(editFone),
          descricao: editDescricao,
        })
        .eq("id", editingId);
      setEditingId(null);
      buscarClientes();
    } catch (err) {
      console.error("erro ao salvar edição", err);
    }
  }

  function cancelarEdicao() {
    setEditingId(null);
    setEditNome("");
    setEditFone("");
    setEditDescricao("");
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Título e botão de novo cliente */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Clientes</h2>

        {isAdmin() && (
          <button
            onClick={() => {
              setMostrarForm(!mostrarForm);
              // sair de edição em cards ao abrir novo formulário
              cancelarEdicao();
            }}
            className="flex items-center gap-2 bg-yellow-500 text-black px-3 py-2 rounded-md hover:bg-yellow-400"
          >
            <FiUserPlus />
            Novo Cliente
          </button>
        )}
      </div>

      {/* Formulário de adicionar cliente */}
      {mostrarForm && (
        <form onSubmit={adicionarCliente} className="mb-6 bg-gray-900 p-4 rounded-md border border-gray-800">
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Nome</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do cliente"
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
            <label className="block text-sm text-gray-300 mb-1">Descrição / Observações</label>
            <input
              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informações adicionais sobre o cliente"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400"
            >
              {loading ? "Salvando..." : "Salvar Cliente"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false);
                setNome("");
                setFone("");
                setDescricao("");
              }}
              className="bg-gray-700 text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
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
              className="bg-gray-900 border border-gray-800 rounded-md p-4 flex justify-between items-start hover:border-yellow-600 transition-all"
            >
              {/* Se está editando este card, mostra o formulário de edição no lugar */}
              {editingId === c.id ? (
                <form className="w-full" onSubmit={salvarEdicaoCliente}>
                  <div className="mb-2">
                    <input
                      className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      placeholder="Nome"
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                      value={editFone}
                      onChange={(e) => setEditFone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      placeholder="Descrição / observações"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="bg-yellow-500 text-black px-3 py-1 rounded">
                      Salvar
                    </button>
                    <button type="button" onClick={cancelarEdicao} className="bg-gray-700 text-white px-3 py-1 rounded">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div className="font-semibold text-yellow-400 text-lg">{c.nome}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      📞 {formatPhoneDisplay(c.fone)}
                      {c.descricao ? <span> • {c.descricao}</span> : ""}
                    </div>
                  </div>

                  {isAdmin() && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditCliente(c)}
                        className="text-yellow-400 hover:text-yellow-300 transition px-2 py-1 border border-transparent hover:border-yellow-500 rounded"
                        title="Editar cliente"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => removerCliente(c.id)}
                        className="text-red-500 hover:text-red-400 transition"
                        title="Excluir cliente"
                      >
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
