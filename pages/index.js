import { useEffect, useState } from "react";
import Link from "next/link";
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

  if (loading) {
    return <div className="text-center text-gray-400 p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {/* Card Clientes */}
        <Link href="/clients" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Clientes</div>
            <div className="text-4xl font-bold text-white">{clientes.length}</div>
          </div>
        </Link>

        {/* Card Produtos */}
        <Link href="/products" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Produtos</div>
            <div className="text-4xl font-bold text-white">{produtos.length}</div>
          </div>
        </Link>

        {/* Card Serviços */}
        <Link href="/services" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Serviços</div>
            <div className="text-4xl font-bold text-white">{servicos.length}</div>
          </div>
        </Link>

        {/* Card Orçamentos */}
        <Link href="/orcamentos" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 mb-2">Orçamentos</div>
            <div className="text-4xl font-bold text-white">{orcamentos.length}</div>
          </div>
        </Link>

        {/* Card Investimentos */}
        <Link href="/investments" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 font-semibold mb-2 text-center">Investimentos</div>
            <div className="text-xl">💰</div>
          </div>
        </Link>

        {/* Card Relatórios */}
        <Link href="/relatorios" className="group">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center transition transform hover:scale-105 hover:shadow-gold cursor-pointer">
            <div className="text-sm text-yellow-500 font-semibold mb-2 text-center">Relatórios</div>
            <div className="text-xl">📊</div>
          </div>
        </Link>

        {/* 🟡 Card Estoque (novo) */}
        <Link href="/estoque" className="group">
          <div className="bg-gray-800 border border-yellow-600 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center transition transform hover:scale-105 hover:shadow-yellow-500 cursor-pointer">
            <div className="text-sm text-yellow-400 font-semibold mb-2 text-center">Estoque</div>
            <div className="text-2xl">📦</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
