import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Clients(){
  const [clients, setClients] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ fetchClients() }, [])

  async function fetchClients(){
    try{
      setLoading(true)
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (error) {
        console.error('supabase clients error', error)
        setClients([])
      } else {
        setClients(data || [])
      }
    }catch(e){
      console.error(e)
      setClients([])
    }finally{
      setLoading(false)
    }
  }

  async function add(e){
    e.preventDefault()
    if (!isAdmin()){ alert('Apenas admin'); return }
    try{
      await supabase.from('clients').insert([{ name, phone, description, created_at: new Date().toISOString() }])
      setName(''); setPhone(''); setDescription('')
      fetchClients()
    }catch(e){ console.error(e) }
  }

  async function remove(id){
    if (!isAdmin()){ alert('Apenas admin'); return }
    try{
      await supabase.from('clients').delete().eq('id', id)
      fetchClients()
    }catch(e){ console.error(e) }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Clientes</h2>
        {isAdmin() && <button className="tab-btn" onClick={()=>{ /* open form toggle maybe */ }}>Novo Cliente</button>}
      </div>

      <form onSubmit={add} className="mb-4 card">
        <div className="mb-2"><label className="block text-sm mb-1">Nome</label><input className="w-full p-2 border rounded" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div className="mb-2"><label className="block text-sm mb-1">Telefone</label><input className="w-full p-2 border rounded" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
        <div className="mb-2"><label className="block text-sm mb-1">Descrição</label><input className="w-full p-2 border rounded" value={description} onChange={e=>setDescription(e.target.value)} /></div>
        <div><button className="tab-btn" type="submit">Adicionar</button></div>
      </form>

      {loading ? <div>Carregando...</div> : null}

      <div className="grid gap-2">
        {clients.map(c=>(
          <div key={c.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm small-muted">{c.phone} • {c.description}</div>
            </div>
            <div>{isAdmin() ? <button className="text-sm" onClick={()=>remove(c.id)}>Excluir</button> : null}</div>
          </div>
        ))}
      </div>
    </div>
  )
}