import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modoCriar, setModoCriar] = useState(false);
  const [novo, setNovo] = useState({
    cliente: "",
    descricao: "",
    total: 0,
  });

  const { user, isAdmin } = supabase.auth.user() || {};

  async function carregar() {
    const { data, error } = await supabase
      .from("orcamentos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrcamentos(data);
    setCarregando(false);
  }

  async function adicionarOrcamento() {
    setCarregando(true);
    const { error } = await supabase.from("orcamentos").insert([novo]);
    if (error) console.error("Erro ao adicionar orçamento:", error);
    setModoCriar(false);
    setNovo({ cliente: "", descricao: "", total: 0 });
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <Layout>
      <div className="p-4 bg-gray-50 min-h-screen">
        <h1 className="text-xl font-semibold mb-4 text-center">Orçamentos</h1>

        {carregando && <p className="text-center text-gray-500">Carregando...</p>}

        {!carregando && orcamentos.length === 0 && (
          <p className="text-center text-gray-500">
            Nenhum orçamento cadastrado.
          </p>
        )}

        <div className="space-y-3">
          {orcamentos.map((o) => (
            <div
              key={o.id}
              className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-lg">{o.cliente}</h2>
              <p className="text-gray-700 text-sm mb-1">{o.descricao}</p>
              <p className="text-green-600 font-bold">Total: R$ {o.total}</p>
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
                Novo Orçamento
              </button>
            ) : (
              <div className="bg-white p-4 rounded-2xl shadow-md mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  className="w-full border rounded-xl p-2"
                  value={novo.cliente}
                  onChange={(e) =>
                    setNovo({ ...novo, cliente: e.target.value })
                  }
                />
                <textarea
                  placeholder="Descrição"
                  className="w-full border rounded-xl p-2"
                  value={novo.descricao}
                  onChange={(e) =>
                    setNovo({ ...novo, descricao: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Total"
                  className="w-full border rounded-xl p-2"
                  value={novo.total}
                  onChange={(e) => setNovo({ ...novo, total: e.target.value })}
                />
                <button
                  onClick={adicionarOrcamento}
                  className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
                >
                  Salvar Orçamento
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
