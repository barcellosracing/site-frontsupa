import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novo, setNovo] = useState({ titulo: "", valor: "", descricao: "" });
  const [modoCriar, setModoCriar] = useState(false);

  const { user, isAdmin } = supabase.auth.user() || {};

  async function carregar() {
    const { data, error } = await supabase
      .from("produtos")
      .select("id, titulo, valor, descricao, created_at")
      .order("created_at", { ascending: false });
    if (!error) setProdutos(data);
    setCarregando(false);
  }

  async function adicionarProduto() {
    setCarregando(true);
    const { error } = await supabase.from("produtos").insert([novo]);
    if (error) console.error("Erro ao adicionar produto:", error);
    setNovo({ titulo: "", valor: "", descricao: "" });
    setModoCriar(false);
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <Layout>
      <div className="p-4 bg-gray-50 min-h-screen">
        <h1 className="text-xl font-semibold mb-4 text-center">Produtos</h1>

        {carregando && <p className="text-center text-gray-500">Carregando...</p>}

        {!carregando && produtos.length === 0 && (
          <p className="text-center text-gray-500">Nenhum produto cadastrado.</p>
        )}

        <div className="space-y-3">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-lg">{p.titulo}</h2>
              <p className="text-gray-700 text-sm mb-1">{p.descricao}</p>
              <p className="text-blue-600 font-bold">R$ {p.valor}</p>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-6">
            {!modoCriar ? (
              <button
                onClick={() => setModoCriar(true)}
                className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
              >
                Novo Produto
              </button>
            ) : (
              <div className="bg-white p-4 rounded-2xl shadow-md mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Título"
                  className="w-full border rounded-xl p-2"
                  value={novo.titulo}
                  onChange={(e) => setNovo({ ...novo, titulo: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Valor"
                  className="w-full border rounded-xl p-2"
                  value={novo.valor}
                  onChange={(e) => setNovo({ ...novo, valor: e.target.value })}
                />
                <textarea
                  placeholder="Descrição"
                  className="w-full border rounded-xl p-2"
                  value={novo.descricao}
                  onChange={(e) =>
                    setNovo({ ...novo, descricao: e.target.value })
                  }
                />
                <button
                  onClick={adicionarProduto}
                  className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
                >
                  Salvar Produto
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
