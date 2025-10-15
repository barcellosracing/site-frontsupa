import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');

  useEffect(() => {
    fetchServicos();
  }, []);

  async function fetchServicos() {
    let { data } = await supabase.from('servicos').select('*').order('created_at', { ascending: false });
    setServicos(data || []);
  }

  async function addServico() {
    if (!nome) return;
    await supabase.from('servicos').insert([{ nome, descricao, preco }]);
    setNome('');
    setDescricao('');
    setPreco('');
    fetchServicos();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Serviços</h1>
      <div className="space-y-2">
        <input type="text" placeholder="Nome do Serviço" value={nome} onChange={e => setNome(e.target.value)} className="w-full" />
        <textarea placeholder="Descrição do Serviço" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full"></textarea>
        <input type="number" placeholder="Preço" value={preco} onChange={e => setPreco(e.target.value)} className="w-full" />
        <button onClick={addServico} className="bg-primary text-secondary px-4 py-2 rounded">Adicionar</button>
      </div>

      <ul className="mt-4 space-y-2">
        {servicos.map(s => (
          <li key={s.id} className="bg-secondary p-2 rounded shadow">
            <strong>{s.nome}</strong> - R$ {s.preco} <br />
            {s.descricao}
          </li>
        ))}
      </ul>
    </div>
  );
}
