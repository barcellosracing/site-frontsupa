import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function isAdmin() {
  try {
    const v = localStorage.getItem('br_admin')
    if(!v) return false
    const obj = JSON.parse(v)
    return obj && obj.expires && Date.now() < obj.expires
  } catch(e){ return false }
}

export default function Quotes(){
  const [quotes,setQuotes]=useState([])
  const [clients,setClients]=useState([])
  const [clientId,setClientId]=useState(''); const [items,setItems]=useState(''); const [total,setTotal]=useState('')

  useEffect(()=>{ fetch() }, [])

  async function fetch(){
    const { data } = await supabase.from('quotes').select('*,clients(*)').order('id',{ascending:false})
    setQuotes(data||[])
    const { data:clients } = await supabase.from('clients').select('*')
    setClients(clients||[])
  }

  async function add(e){
    e.preventDefault()
    if(!isAdmin()){ alert('Apenas admin pode adicionar.'); return }
    const created_at = new Date().toISOString()
    await supabase.from('quotes').insert([{ client_id: parseInt(clientId), items, total: parseFloat(total), created_at }])
    setClientId(''); setItems(''); setTotal(''); fetch()
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Orçamentos</h2>
      {isAdmin() && (
      <form onSubmit={add} className='mb-4 grid gap-2 sm:grid-cols-4'>
        <select className='p-2 border rounded' value={clientId} onChange={e=>setClientId(e.target.value)}>
          <option value=''>Selecione cliente</option>
          {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className='p-2 border rounded' placeholder='Itens (descrição)' value={items} onChange={e=>setItems(e.target.value)} />
        <input className='p-2 border rounded' placeholder='Total' value={total} onChange={e=>setTotal(e.target.value)} />
        <button className='p-2 rounded bg-accent text-black'>Salvar</button>
      </form>
      )}

      <div className='grid gap-3'>
        {quotes.map(q=>(
          <div key={q.id} className='card'>
            <div className='font-medium text-gray-800'>Cliente: {q.clients?.name}</div>
            <div className='text-sm text-gray-500'>Itens: {q.items}</div>
            <div className='text-sm text-gray-500'>Total: R$ {q.total}</div>
            <div className='text-xs small-muted'>Adicionado: {q.created_at ? new Date(q.created_at).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
