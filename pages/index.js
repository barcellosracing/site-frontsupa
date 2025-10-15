import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ChartCard from '../components/ChartCard';

export default function Home() {
  const [investimentos, setInvestimentos] = useState([]);

  useEffect(() => {
    async function fetchInvestimentos() {
      let { data } = await supabase.from('investimentos').select('*').order('data', { ascending: false }).limit(3);
      setInvestimentos(data || []);
    }
    fetchInvestimentos();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-2">Bem-vindo à Barcellos Racing</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary p-4 rounded shadow">
          <h2 className="font-bold mb-2">Produtos</h2>
          <p>Gerencie os produtos da oficina.</p>
        </div>
        <div className="bg-secondary p-4 rounded shadow">
          <h2 className="font-bold mb-2">Serviços</h2>
          <p>Gerencie os serviços oferecidos.</p>
        </div>
        <div className="bg-secondary p-4 rounded shadow">
          <h2 className="font-bold mb-2">Investimentos / Despesas</h2>
          {investimentos.length === 0 ? (
            <p>Nenhum registro recente</p>
          ) : (
            <ul className="list-disc pl-5">
              {investimentos.map(i => (
                <li key={i.id}>{i.descricao} - R$ {i.valor}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
