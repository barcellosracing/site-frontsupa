import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [{ data: cli }, { data: prod }, { data: serv }, { data: orc }] = await Promise.all([
        supabase.from("clientes").select("*"),
        supabase.from("produtos").select("*"),
        supabase.from("servicos").select("*"),
        supabase.from("orcamentos").select("*"),
      ]);
      setClientes(cli || []);
      setProdutos(prod || []);
      setServicos(serv || []);
      setOrcamentos(orc || []);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {loading ? (
        <div className="text-center text-gray-400">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card Clientes */}
          <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-center transition transform hover:scale-105 hover:shadow-gold">
            <div className="text-sm text-gray-400 mb-2">Clientes</div>
            <div className="text-3xl font-bold text-yellow-500">{clientes.length}</div>
          </div>

          {/* Card Produtos */}
          <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-center transition transform hover:scale-105 hover:shadow-gold">
            <div className="text-sm text-gray-400 mb-2">Produtos</div>
            <div className="text-3xl font-bold text-yellow-500">{produtos.length}</div>
          </div>

          {/* Card Serviços */}
          <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-center transition transform hover:scale-105 hover:shadow-gold">
            <div className="text-sm text-gray-400 mb-2">Serviços</div>
            <div className="text-3xl font-bold text-yellow-500">{servicos.length}</div>
          </div>

          {/* Card Orçamentos */}
          <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-center transition transform hover:scale-105 hover:shadow-gold">
            <div className="text-sm text-gray-400 mb-2">Orçamentos</div>
            <div className="text-3xl font-bold text-yellow-500">{orcamentos.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
