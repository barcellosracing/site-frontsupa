import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Services(){
  const [services,setServices]=useState([])
  const [title,setTitle]=useState(''); const [value,setValue]=useState(''); const [description,setDescription]=useState('')

  useEffect(()=>{ fetch() }, [])

  async function fetch(){
    const { data } = await supabase.from('services').select('*').order('created_at',{ascending:false})
    setServices(data||[])
  }

  async function add(e){
    e.preventDefault()
    if(!isAdmin()){ alert('Apenas admin pode adicionar.'); return }
    const created_at = new Date().toISOString()
    await supabase.from('services').insert([{ name: title, price: parseFloat(value||0), description, created_at }])
    setTitle(''); setValue(''); setDescription(''); fetch()
  }

  async function remove(id){
    if(!isAdmin()){ alert('Apenas admin pode excluir.'); return }
    if(!confirm('Excluir serviço?')) return
    await supabase.from('services').delete().eq('id', id)
    fetch()
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Serviços</h2>
      {isAdmin() && (
      <form onSubmit={add} className="mb-4 grid gap-2 sm:grid-cols-3">
        <input className="p-2 border rounded" placeholder="Serviço" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="p-2 border rounded" placeholder="Valor" value={value} onChange={e=>setValue(e.target.value)} />
        <textarea className="p-2 border rounded" placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
        <button className="p-2 rounded btn">Adicionar</button>
      </form>
      )}

      <div className="grid gap-3">
        {services.map(s=>(
          <div key={s.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm small-muted">R$ {s.price}</div>
              <div className="text-sm">{s.description}</div>
              <div className="text-xs small-muted">Adicionado: {s.created_at ? new Date(s.created_at).toLocaleString() : ''}</div>
            </div>
            <div>{isAdmin() ? <button className="text-sm" onClick={()=>remove(s.id)}>Excluir</button> : null}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
