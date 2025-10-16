import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

function monthOptions(){ const res=[]; const now=new Date(); for(let y=now.getFullYear(); y>=now.getFullYear()-3; y--){ for(let m=1;m<=12;m++){ const mm = m.toString().padStart(2,'0'); res.push({key:`${y}-${mm}`, label:`${mm}/${y}`}) } } return res }

export default function Investments(){
  const [items,setItems]=useState([])
  const [title,setTitle]=useState(''); const [amount,setAmount]=useState(''); const [category,setCategory]=useState('')
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7))

  useEffect(()=>{ fetch() }, [month])
  async function fetch(){ const { data } = await supabase.from('investments').select('*').order('created_at',{ascending:false}); const filtered = (data||[]).filter(i=> (i.created_at||'').slice(0,7) === month); setItems(filtered) }

  async function add(e){ e.preventDefault(); if(!isAdmin()){ alert('Apenas admin pode adicionar.'); return } const created_at = new Date().toISOString(); await supabase.from('investments').insert([{ title, amount: parseFloat(amount||0), category, created_at }]); setTitle(''); setAmount(''); setCategory(''); fetch() }
  async function remove(id){ if(!isAdmin()){ alert('Apenas admin'); return } if(!confirm('Excluir despesa?')) return; await supabase.from('investments').delete().eq('id', id); fetch() }

  const months = monthOptions()

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Investimentos / Despesas</h2>
      <div className="card mb-4">
        <div className="filter-line mb-2">
          <label className="small-muted">Filtrar mês:</label>
          <select value={month} onChange={e=>setMonth(e.target.value)} className="p-2 border rounded">
            {months.map(m=> <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        {isAdmin() && (
        <form onSubmit={add} className="mb-4 grid gap-2 sm:grid-cols-3">
          <input className="p-2 border rounded" placeholder="Descrição" value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Valor" value={amount} onChange={e=>setAmount(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Categoria (opcional)" value={category} onChange={e=>setCategory(e.target.value)} />
          <button className="p-2 rounded tab-btn">Adicionar</button>
        </form>) }

        <div className="grid gap-3">
          {items.map(i=>(
            <div key={i.id} className="card flex justify-between items-center">
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-sm small-muted">R$ {i.amount} • {i.category}</div>
                <div className="text-xs small-muted">Adicionado: {i.created_at ? new Date(i.created_at).toLocaleString() : ''}</div>
              </div>
              <div>{isAdmin() ? <button className="text-sm" onClick={()=>remove(i.id)}>Excluir</button> : null}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
