import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

function last12Months(){ const res=[]; const now=new Date(); for(let i=11;i>=0;i--){ const d=new Date(now.getFullYear(), now.getMonth()-i,1); res.push({key:d.toISOString().slice(0,7), label:d.toLocaleString('default',{month:'short', year:'numeric'})}) } return res }

export default function Orcamentos(){
  const [budgets,setBudgets]=useState([])
  const [clients,setClients]=useState([])
  const [products,setProducts]=useState([])
  const [services,setServices]=useState([])

  const [clientId,setClientId]=useState('')
  const [items,setItems]=useState([])
  const [currentType,setCurrentType]=useState('product')
  const [selectedId,setSelectedId]=useState('')
  const [quantity,setQuantity]=useState(1)
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7))
  const [showForm,setShowForm]=useState(false)

  useEffect(()=>{ fetchAll() },[])

  async function fetchAll(){
    const [{data:budg}, {data:clients}, {data:products}, {data:services}] = await Promise.all([
      supabase.from('budgets').select('*').order('created_at',{ascending:false}),
      supabase.from('clients').select('*'),
      supabase.from('products').select('*'),
      supabase.from('services').select('*')
    ])
    setBudgets(budg||[]); setClients(clients||[]); setProducts(products||[]); setServices(services||[])
  }

  function addCurrentItem(){ if(!selectedId){ alert('Escolha um item.'); return } const src = (currentType==='product' ? products : services).find(p=>p.id===selectedId); if(!src){ alert('Item inválido'); return } const it = { type: currentType, id: selectedId, name: src.name, price: parseFloat(src.price||0), qty: parseInt(quantity||1,10) }; setItems(prev=>[...prev, it]); setSelectedId(''); setQuantity(1) }
  function removeItem(idx){ setItems(prev=> prev.filter((_,i)=> i!==idx)) }

  async function saveBudget(e){ e.preventDefault(); if(!isAdmin()){ alert('Apenas admin pode criar orçamentos'); return } if(!clientId){ alert('Selecione cliente'); return } if(items.length===0){ alert('Adicione pelo menos 1 item'); return } const total = items.reduce((s,it)=> s + (it.price * it.qty), 0); const created_at = new Date().toISOString(); const { data:budget, error } = await supabase.from('budgets').insert([{ client_id: clientId, total, status: 'pending', created_at }]).select().single(); if(error){ alert(error.message); return } const bi = items.map(it=>({ budget_id: budget.id, item_type: it.type==='product' ? 'product' : 'service', item_id: it.id, quantity: it.qty, price: it.price, created_at })); const { error: err2 } = await supabase.from('budget_items').insert(bi); if(err2){ alert(err2.message); return } setItems([]); setClientId(''); fetchAll(); setShowForm(false); alert('Orçamento salvo') }

  async function toggleStatus(b){ if(!isAdmin()){ alert('Apenas admin'); return } const newStatus = b.status === 'closed' ? 'pending' : 'closed'; const { error } = await supabase.from('budgets').update({ status: newStatus }).eq('id', b.id); if(error){ alert(error.message); return } fetchAll() }

  const filtered = budgets.filter(q=>{ const matchesClient = clientId ? q.client_id === clientId : true; const qMonth = q.created_at ? q.created_at.slice(0,7) : ''; const matchesMonth = month ? qMonth === month : true; return matchesClient && matchesMonth })
  const months = last12Months()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Orçamentos</h2>
        <div>
          {isAdmin() && (<button className="tab-btn" onClick={()=>setShowForm(s=>!s)}>{showForm ? 'Fechar formulário' : 'Novo Orçamento'}</button>)}
        </div>
      </div>

      {showForm && (
      <form onSubmit={saveBudget} className="mb-4 card">
        <div className="mb-2"><label className="block text-sm mb-1">Cliente</label><select className="w-full p-2 border rounded" value={clientId} onChange={e=>setClientId(e.target.value)}><option value=''>Selecione cliente</option>{clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="mb-2"><label className="block text-sm mb-1">Adicionar item</label><div className="flex gap-2 mb-2"><button type="button" className={"tab-btn " + (currentType==='product' ? 'bg-opacity-40' : '')} onClick={()=>setCurrentType('product')}>Produto</button><button type="button" className={"tab-btn " + (currentType==='service' ? 'bg-opacity-40' : '')} onClick={()=>setCurrentType('service')}>Serviço</button></div>
        <div className="flex gap-2"><select className="flex-1 p-2 border rounded" value={selectedId} onChange={e=>setSelectedId(e.target.value)}><option value=''>Escolha {currentType}</option>{(currentType==='product' ? products : services).map(it=> <option key={it.id} value={it.id}>{it.name} — R$ {it.price}</option>)}</select><input type="number" min="1" className="w-24 p-2 border rounded" value={quantity} onChange={e=>setQuantity(e.target.value)} /><button type="button" className="tab-btn" onClick={addCurrentItem}>Adicionar</button></div></div>

        <div className="mt-4"><div className="text-sm mb-2">Itens do orçamento</div><div className="grid gap-2">{items.map((it,idx)=>(<div key={idx} className="card flex justify-between items-center"><div><div className="font-medium">{it.name} <span className="small-muted">({it.type})</span></div><div className="text-sm small-muted">Qtd: {it.qty} • R$ {it.price}</div></div><div><button className="text-sm" onClick={()=>removeItem(idx)}>Remover</button></div></div>))}</div><div className="mt-3 text-right small-muted">Total parcial: R$ {items.reduce((s,it)=>s + (it.price*it.qty),0).toFixed(2)}</div></div>

        <div className="mt-4 flex justify-end"><button className="tab-btn" type="submit">Salvar Orçamento</button></div>
      </form>
      )}

      <div className="mb-4 flex gap-2 items-center"><select value={clientId} onChange={e=>setClientId(e.target.value)} className="p-2 border rounded"><option value=''>Todos clientes</option>{clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={month} onChange={e=>setMonth(e.target.value)} className="p-2 border rounded">{months.map(m=> <option key={m.key} value={m.key}>{m.label}</option>)}</select></div>

      <div className="grid gap-3">{filtered.map(q=>(<div key={q.id} className="card"><div className="flex justify-between items-center"><div><div className="font-medium">Orçamento: {q.id}</div><div className="text-sm small-muted">Total: R$ {q.total}</div><div className="text-xs small-muted">Adicionado: {q.created_at ? new Date(q.created_at).toLocaleString() : ''}</div></div><div><div className="text-sm small-muted">Status: {q.status}</div>{isAdmin() ? <button className="tab-btn mt-2" onClick={()=>toggleStatus(q)}>{q.status==='closed' ? 'Marcar pendente' : 'Fechar'}</button> : null}</div></div></div>))}</div>
    </div>
  )
}
