import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [novoProduto, setNovoProduto] = useState({ nome: "", quantidade: "" });
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const produtosSalvos = JSON.parse(localStorage.getItem("produtos")) || [];
    const historicoSalvo = JSON.parse(localStorage.getItem("historico")) || [];
    setProdutos(produtosSalvos);
    setHistorico(historicoSalvo);
  }, []);

  useEffect(() => {
    localStorage.setItem("produtos", JSON.stringify(produtos));
    localStorage.setItem("historico", JSON.stringify(historico));
  }, [produtos, historico]);

  const adicionarProduto = () => {
    if (novoProduto.nome.trim() === "" || novoProduto.quantidade === "") return;
    const produtoExistente = produtos.find(
      (p) => p.nome.toLowerCase() === novoProduto.nome.toLowerCase()
    );
    if (produtoExistente) {
      alert("Este produto já existe no estoque.");
      return;
    }

    const novo = {
      ...novoProduto,
      id: Date.now(),
      quantidade: Number(novoProduto.quantidade),
    };
    setProdutos([...produtos, novo]);
    registrarHistorico("Adicionado", novo);
    setNovoProduto({ nome: "", quantidade: "" });
  };

  const registrarHistorico = (acao, produto) => {
    const novoRegistro = {
      id: Date.now(),
      acao,
      produto: produto.nome,
      quantidade: produto.quantidade,
      data: new Date().toLocaleString(),
    };
    setHistorico([novoRegistro, ...historico]);
  };

  const editarProduto = (id) => {
    const novoNome = prompt("Novo nome do produto:");
    const novaQtd = prompt("Nova quantidade:");
    if (novoNome && novaQtd) {
      const atualizado = produtos.map((p) =>
        p.id === id
          ? { ...p, nome: novoNome, quantidade: Number(novaQtd) }
          : p
      );
      setProdutos(atualizado);
      registrarHistorico("Editado", { nome: novoNome, quantidade: novaQtd });
    }
  };

  const excluirProduto = (id) => {
    const produto = produtos.find((p) => p.id === id);
    setProdutos(produtos.filter((p) => p.id !== id));
    registrarHistorico("Excluído", produto);
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 px-4 py-6">
      {/* Cabeçalho */}
      <h1 className="text-2xl font-bold text-center text-yellow-400 mb-6">
        Controle de Estoque
      </h1>

      {/* Formulário de Adição */}
      <div className="bg-neutral-800 rounded-2xl p-4 shadow-md max-w-md mx-auto mb-6">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome do produto"
            className="w-full p-2 rounded-lg bg-neutral-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={novoProduto.nome}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, nome: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Quantidade"
            className="w-full p-2 rounded-lg bg-neutral-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={novoProduto.quantidade}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, quantidade: e.target.value })
            }
          />
          <button
            onClick={adicionarProduto}
            className="bg-yellow-500 hover:bg-yellow-600 text-neutral-900 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <FiPlus size={18} /> Adicionar
          </button>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <FiSearch className="text-yellow-400" />
        <input
          type="text"
          placeholder="Buscar produto..."
          className="p-2 rounded-lg bg-neutral-800 text-gray-100 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {produtosFiltrados.length === 0 ? (
          <p className="text-center text-gray-400 col-span-full">
            Nenhum produto encontrado.
          </p>
        ) : (
          produtosFiltrados.map((produto) => (
            <div
              key={produto.id}
              className="bg-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-all w-full max-w-[95%] mx-auto h-44"
            >
              <div>
                <h2 className="text-lg font-bold text-yellow-400 truncate">
                  {produto.nome}
                </h2>
                <p className="text-sm text-gray-300 mt-1">
                  Quantidade:{" "}
                  <span className="text-yellow-300 font-semibold">
                    {produto.quantidade}
                  </span>
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-3">
                <button
                  onClick={() => editarProduto(produto.id)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-neutral-900 p-2 rounded-lg text-sm transition"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  onClick={() => excluirProduto(produto.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm transition"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Histórico */}
      <div className="mt-10 bg-neutral-800 rounded-2xl p-4 shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-yellow-400 mb-4 text-center">
          Histórico de Ações
        </h2>
        {historico.length === 0 ? (
          <p className="text-center text-gray-400">Nenhuma ação registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="bg-neutral-700 text-gray-100">
                <tr>
                  <th className="p-2 text-left">Ação</th>
                  <th className="p-2 text-left">Produto</th>
                  <th className="p-2 text-left">Quantidade</th>
                  <th className="p-2 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-700 hover:bg-neutral-700/50 transition"
                  >
                    <td className="p-2">{item.acao}</td>
                    <td className="p-2">{item.produto}</td>
                    <td className="p-2">{item.quantidade}</td>
                    <td className="p-2 text-xs text-gray-400">{item.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
