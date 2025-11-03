import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [imagemExpandida, setImagemExpandida] = useState(null);
  const [categoriasAbertas, setCategoriasAbertas] = useState({});

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data: produtosData, error: produtosError } = await supabase
      .from("estoque_produtos")
      .select("*");

    const { data: historicoData, error: historicoError } = await supabase
      .from("estoque_historico")
      .select("*");

    if (produtosError || historicoError) {
      console.error(produtosError || historicoError);
      return;
    }

    // Monta produtos com preço e quantidade calculados
    const combinados = produtosData.map((p) => {
      const historicoDoProduto = historicoData.filter((h) => h.produto_id === p.id);
      const maiorPreco = Math.max(...historicoDoProduto.map((h) => h.preco_custo || 0), 0);
      const quantidadeTotal = historicoDoProduto.reduce(
        (acc, h) => acc + (h.quantidade || 0),
        0
      );
      const precoFinal = maiorPreco * (1 + (p.margem_lucro || 0) / 100);

      return {
        ...p,
        precoFinal,
        quantidade: quantidadeTotal,
      };
    });

    setProdutos(combinados);
  }

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Agrupar por categoria
  const categorias = {};
  produtosFiltrados.forEach((p) => {
    const cat = p.categoria || "Outros";
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(p);
  });

  const toggleCategoria = (categoria) => {
    setCategoriasAbertas((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  return (
    <div className="max-w-md mx-auto p-4 text-white">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
        📦 Produtos
      </h2>

      {/* Campo de busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
        />
      </div>

      {/* Categorias */}
      {Object.keys(categorias).length === 0 && (
        <div className="text-center text-gray-500 mt-10">Nenhum produto encontrado</div>
      )}

      {Object.entries(categorias).map(([categoria, lista]) => (
        <div key={categoria} className="mb-3 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleCategoria(categoria)}
            className="w-full flex justify-between items-center bg-gray-800 px-4 py-3 font-semibold text-yellow-400 text-left"
          >
            <span>{categoria}</span>
            {categoriasAbertas[categoria] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>

          {categoriasAbertas[categoria] && (
            <div className="p-3 bg-gray-900 grid gap-3">
              {lista.map((p) => {
                const disponivel = p.quantidade > 0;
                const flagCor = disponivel ? "bg-green-600" : "bg-red-600";
                const flagTexto = disponivel ? "DISPONÍVEL" : "SEM ESTOQUE";

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 border border-gray-800 rounded-xl p-3 bg-gray-950 shadow-sm hover:border-yellow-600 transition"
                  >
                    {p.imagem_url && (
                      <img
                        src={p.imagem_url}
                        alt={p.nome}
                        className="w-16 h-16 rounded-md object-cover cursor-pointer hover:opacity-80"
                        onClick={() => setImagemExpandida(p.imagem_url)}
                      />
                    )}

                    <div className="flex-1">
                      <div className="font-semibold text-yellow-400 text-base leading-tight">
                        {p.nome}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{p.descricao}</div>
                      <div className="text-sm text-gray-200 mt-1 font-medium">
                        💰 R$ {p.precoFinal.toFixed(2)}
                      </div>
                      <div
                        className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${flagCor}`}
                      >
                        {flagTexto}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Modal da imagem ampliada */}
      {imagemExpandida && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setImagemExpandida(null)}
        >
          <img
            src={imagemExpandida}
            alt="Imagem ampliada"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
