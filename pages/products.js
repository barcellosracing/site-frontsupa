import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [imagemExpandida, setImagemExpandida] = useState(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data, error } = await supabase.from("products").select("*");
    if (error) console.error(error);
    else setProdutos(data || []);
  }

  const filtrados = produtos.filter((p) =>
    p.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-yellow-500 mb-4">Produtos</h2>

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full p-2 mb-6 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-1 focus:ring-yellow-500 outline-none"
      />

      {/* Lista */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtrados.map((p) => {
          const status = p.price > 0 ? "DISPONÍVEL" : "SEM ESTOQUE";
          const cor = status === "DISPONÍVEL" ? "text-green-400" : "text-red-400";

          const precoFinal = p.price + (p.price * (p.profit_margin || 0)) / 100;

          return (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex gap-3 hover:border-yellow-600"
            >
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-16 h-16 rounded-md object-cover cursor-pointer hover:opacity-80"
                  onClick={() => setImagemExpandida(p.image_url)}
                />
              )}

              <div>
                <div className="font-semibold text-yellow-400 text-lg">
                  {p.name}
                </div>
                <div className="text-sm text-gray-400 mt-1">{p.description}</div>
                <div className="text-sm text-gray-300 mt-1">
                  💰 R$ {precoFinal.toFixed(2)}
                </div>
                <div className={`text-xs font-semibold mt-1 ${cor}`}>
                  {status}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
