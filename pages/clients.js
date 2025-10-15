import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  async function fetchClientes() {
    let { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
    setClientes(data || []);
  }

  async function addCliente() {
    if (!nome) return;
    await supabase.from('clientes').insert([{ nome, descricao }]);
    setNome('');
    setDescricao('');
    fetchClientes();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <div className="space-y-2">
        <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="w-full" />
        <textarea placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full"></textarea>
        <button onClick={addCliente} className="bg-primary text-secondary px-4 py-2 rounded">Adicionar</button>
      </div>

      <ul className="mt-4 space-y-2">
        {clientes.map(c => (
          <li key={c.id} className="bg-secondary p-2 rounded shadow">
            <strong>{c.nome}</strong> - {c.descricao} <br />
            <small>{formatDate(c.created_at)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
