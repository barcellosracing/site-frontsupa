import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

export default function Orcamentos() {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);

  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [itens, setItens] = useState([]);
  const [status, setStatus] = useState('pendente');
  const [mesFiltro, setMesFiltro] = useState('');
  const [anoFiltro, setAnoFiltro] = useState('');

  useEffect(() => {
    fetchDados();
    fetchOrcamentos();
  }, []);

  async function fetchDados() {
    const { data: c } = await supabase.from('clientes').select('*');
    const { data: p } = await supabase.from('produtos').select('*');
    const { data: s } = await supabase.from('servicos').select('*');
    setClientes(c || []);
    setProdutos(p || []);
    setServicos(s || []);
  }

  async function fetchOrcamentos() {
    let query = supabase.from('orcamentos').select('*').order('created_at', { ascending: false });
    if (clienteSelecionado) query = query.eq('cliente_id', clienteSelecionado);
    if (mesFiltro && anoFiltro) {
      query = query.gte('created_at', `${anoFiltro}-${mesFiltro}-01`).lt('created_at', `${anoFiltro}-${mesFiltro}-31`);
    }
    const { data } = await query;
    setOrcamentos(data || []);
  }

  function addItem(tipo, id) {
    setItens([...itens, { tipo, id }]);
  }

  async function addOrcamento() {
    if (!clienteSelecionado || itens.length === 0) return;
    await supabase.from('orcamentos').insert([{
      cliente_id: clienteSelecionado,
      itens,
      status,
      created_at: new Date()
    }]);
    setItens([]);
    fetchOrcamentos();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orçamentos</h1>

      <div className="space-y-2">
        <select value={clienteSelecionado} onChange={e => setClienteSelecionado(e.target.value)} className="w-full">
          <option value="">Selecione o Cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>

        <div className="flex flex-col space-y-1">
          {itens.map((item, idx) => (
            <span key={idx}>
              {item.tipo}: {item.id}
            </span>
          ))}
        </div>

        <div className="flex space-x-2">
          <select onChange={e => addItem('produto', e.target.value)} className="flex-1">
            <option value="">Adicionar Produto</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select onChange={e => addItem('servico', e.target.value)} className="flex-1">
            <option value="">Adicionar Serviço</option>
            {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full">
          <option value="pendente">Pendente</option>
          <option value="fechado">Fechado</option>
        </select>

        <button onClick={addOrcamento} className="bg-primary text-secondary px-4 py-2 rounded">Adicionar Orçamento</button>
      </div>

      <div>
        <h2 className="text-xl font-bold">Orçamentos do mês</h2>
        <ul className="space-y-2">
          {orcamentos.map(o => (
            <li key={o.id} className="bg-secondary p-2 rounded shadow">
              Cliente: {o.cliente_id} | Status: {o.status} <br />
              Itens: {JSON.stringify(o.itens)} <br />
              Criado em: {formatDate(o.created_at)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
