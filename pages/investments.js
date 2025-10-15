import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

export default function Investimentos() {
  const [investimentos, setInvestimentos] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const [anoFiltro, setAnoFiltro] = useState('');

  useEffect(() => fetchInvestimentos(), []);

  async function fetchInvestimentos() {
    let query = supabase.from('investimentos').select('*').order('created_at', { ascending: false });
    if (mesFiltro && anoFiltro) {
      query = query.gte('created_at', `${anoFiltro}-${mesFiltro}-01`).lt('created_at', `${anoFiltro}-${mesFiltro}-31`);
    }
    const { data } = await query;
    setInvestimentos(data || []);
  }

  async function addInvestimento() {
    if (!descricao || !valor) return;
    await supabase.from('investimentos').insert([{ descricao, valor, created_at: new Date() }]);
    setDescricao('');
    setValor('');
    fetchInvestimentos();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Investimentos / Despesas</h1>

      <div className="space-y-2">
        <input type="text" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full" />
        <input type="number" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} className="w-full" />
        <button onClick={addInvestimento} className="bg-primary text-secondary px-4 py-2 rounded">Adicionar</button>
      </div>

      <div className="space-y-2">
        <input type="month" value={`${anoFiltro}-${mesFiltro}`} onChange={e => {
          const [ano, mes] = e.target.value.split('-');
          setAnoFiltro(ano);
          setMesFiltro(mes);
          fetchInvestimentos();
        }} className="w-full" />

        <ul className="space-y-2">
          {investimentos.map(i => (
            <li key={i.id} className="bg-secondary p-2 rounded shadow">
              {i.descricao} - R$ {i.valor} <br />
              {formatDate(i.created_at)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
