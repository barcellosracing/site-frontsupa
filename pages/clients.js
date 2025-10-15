import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Clients(){
  const [clients, setClients] = useState([])
  const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [description,setDescription]=useState('')

  useEffect(()=>{ fetchClients() }, [])

  async function fetchClients(){
    const { data } = await supabase.from('clients').select('*').order('created_at',{ascending:false})
    setClients(data||[])
  }

  async function add(e){
    e.preventDefault()
    if(!isAdmin()){ alert('Apenas admin pode adicionar.'); return }
    const created_at = new Date().toISOString()
    await supabase.from('clients').insert([{ name, phone, description, created_at }])
    setName(''); setPhone(''); setDescription(''); fetchClients()
  }

  async function remove(id){
    if(!isAdmin()){ alert('Apenas admin pode excluir.'); return }
    if(!confirm('Excluir cliente?')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Clientes</h2>
      {isAdmin() && (
      <form onSubmit={add} className="mb-4 grid gap-2 sm:grid-cols-4">
        <input className="p-2 border rounded" placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
        <input className="p-2 border rounded" placeholder="Telefone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <textarea className="p-2 border rounded" placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
        <button className="p-2 rounded btn">Adicionar</button>
      </form>
      )}

      <div className="grid gap-3">
        {clients.map(c=>(
          <div key={c.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm small-muted">{c.phone}</div>
              <div className="text-sm">{c.description}</div>
              <div className="text-xs small-muted">Adicionado: {c.created_at ? new Date(c.created_at).toLocaleString() : ''}</div>
            </div>
            <div>{isAdmin() ? <button className="text-sm" onClick={()=>remove(c.id)}>Excluir</button> : null}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
