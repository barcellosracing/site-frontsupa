import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarProdutos();
  }, []);

  async function buscarProdutos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("id, nome, descricao, preco_custo, margem_lucro, quantidade")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calcular valor de venda e status
      const produtosComValor = (data || []).map((p) => {
        const precoCusto = Number(p.preco_custo || 0);
        const margemLucro = Number(p.margem_lucro || 0);
        const valorVenda = precoCusto + precoCusto * (margemLucro / 100);

        return {
          ...p,
          valor_venda: valorVenda.toFixed(2),
          status: p.quantidade > 0 ? "Disponível" : "Sem estoque",
        };
      });

      setProdutos(produtosComValor);
    } catch (e) {
      console.error("Erro ao buscar produtos:", e);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Produtos</h2>
      </div>

      {loading ? (
        <div className="text-gray-400">Carregando produtos...</div>
      ) : produtos.length === 0 ? (
        <div className="text-gray-500 italic">Nenhum produto cadastrado ainda.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg hover:border-yellow-600 transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">{p.nome}</h3>
                <p className="text-sm text-gray-400 mb-3">
                  {p.descricao || "Sem descrição."}
                </p>
                <p className="text-gray-300">
                  💰 <span className="text-yellow-400">R$ {p.valor_venda}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    p.status === "Disponível"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {p.status}
                </span>
                <span className="text-xs text-gray-500">
                  Quantidade: {p.quantidade}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
