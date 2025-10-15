import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');

  useEffect(() => {
    fetchProdutos();
  }, []);

  async function fetchProdutos() {
    let { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
    setProdutos(data || []);
  }

  async function addProduto() {
    if (!nome) return;
    await supabase.from('produtos').insert([{ nome, descricao, preco }]);
    setNome('');
    setDescricao('');
    setPreco('');
    fetchProdutos();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Produtos</h1>
      <div className="space-y-2">
        <input type="text" placeholder="Nome do Produto" value={nome} onChange={e => setNome(e.target.value)} className="w-full" />
        <textarea placeholder="Descrição do Produto" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full"></textarea>
        <input type="number" placeholder="Preço" value={preco} onChange={e => setPreco(e.target.value)} className="w-full" />
        <button onClick={addProduto} className="bg-primary text-secondary px-4 py-2 rounded">Adicionar</button>
      </div>

      <ul className="mt-4 space-y-2">
        {produtos.map(p => (
          <li key={p.id} className="bg-secondary p-2 rounded shadow">
            <strong>{p.nome}</strong> - R$ {p.preco} <br />
            {p.descricao}
          </li>
        ))}
      </ul>
    </div>
  );
}
