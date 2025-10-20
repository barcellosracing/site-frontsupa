import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [investimentos, setInvestimentos] = useState(0); // Exemplo, pode carregar do Supabase
  const [relatorios, setRelatorios] = useState(0); // Exemplo, pode carregar do Supabase
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
      // Exemplo: valores fixos para os novos cards, você pode alterar conforme necessidade
      setInvestimentos(15);
      setRelatorios(8);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-2 gap-6">
        {/* Coluna 1 */}
        <Link href="/clients" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Clientes</div>
            <div className="text-4xl font-bold text-white">{clientes.length}</div>
          </div>
        </Link>

        <Link href="/products" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Produtos</div>
            <div className="text-4xl font-bold text-white">{produtos.length}</div>
          </div>
        </Link>

        <Link href="/services" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Serviços</div>
            <div className="text-4xl font-bold text-white">{servicos.length}</div>
          </div>
        </Link>

        <Link href="/orcamentos" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Orçamentos</div>
            <div className="text-4xl font-bold text-white">{orcamentos.length}</div>
          </div>
        </Link>

        <Link href="/investments" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-1">Investimentos</div>
            <div className="text-xl mb-2">💰</div>
            <div className="text-3xl font-bold text-white">{investimentos}</div>
          </div>
        </Link>

        <Link href="/relatorios" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-1">Relatórios</div>
            <div className="text-xl mb-2">📊</div>
            <div className="text-3xl font-bold text-white">{relatorios}</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
