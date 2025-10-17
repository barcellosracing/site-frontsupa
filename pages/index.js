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
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Painel de Controle</h2>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center shadow-md">
            <div className="text-sm text-gray-500">Clientes</div>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </div>
          <div className="card p-4 text-center shadow-md">
            <div className="text-sm text-gray-500">Produtos</div>
            <div className="text-2xl font-bold">{produtos.length}</div>
          </div>
          <div className="card p-4 text-center shadow-md">
            <div className="text-sm text-gray-500">Serviços</div>
            <div className="text-2xl font-bold">{servicos.length}</div>
          </div>
          <div className="card p-4 text-center shadow-md">
            <div className="text-sm text-gray-500">Orçamentos</div>
            <div className="text-2xl font-bold">{orcamentos.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
