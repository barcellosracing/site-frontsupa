import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Services(){
  const [services, setServices] = useState([])
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ fetchServices() }, [])

  async function fetchServices(){
    try{
      setLoading(true)
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false })
      if (error) { console.error('supabase services', error); setServices([]) } else setServices(data||[])
    }catch(e){ console.error(e); setServices([]) }finally{ setLoading(false) }
  }

  async function add(e){
    e.preventDefault()
    if (!isAdmin()){ alert('Apenas admin'); return }
    try{
      await supabase.from('services').insert([{ title, value, description, created_at: new Date().toISOString() }])
      setTitle(''); setValue(''); setDescription('')
      fetchServices()
    }catch(e){ console.error(e) }
  }

  async function remove(id){
    if (!isAdmin()){ alert('Apenas admin'); return }
    try{ await supabase.from('services').delete().eq('id', id); fetchServices() }catch(e){ console.error(e) }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Serviços</h2>
        {isAdmin() && <button className="tab-btn">Novo Serviço</button>}
      </div>

      <form onSubmit={add} className="mb-4 card">
        <div className="mb-2"><label className="block text-sm mb-1">Título</label><input className="w-full p-2 border rounded" value={title} onChange={e=>setTitle(e.target.value)} /></div>
        <div className="mb-2"><label className="block text-sm mb-1">Valor</label><input className="w-full p-2 border rounded" value={value} onChange={e=>setValue(e.target.value)} /></div>
        <div className="mb-2"><label className="block text-sm mb-1">Descrição</label><input className="w-full p-2 border rounded" value={description} onChange={e=>setDescription(e.target.value)} /></div>
        <div><button className="tab-btn" type="submit">Adicionar</button></div>
      </form>

      {loading ? <div>Carregando...</div> : null}

      <div className="grid gap-2">
        {services.map(s=>(
          <div key={s.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{s.title}</div>
              <div className="text-sm small-muted">R$ {s.value} • {s.description}</div>
            </div>
            <div>{isAdmin() ? <button className="text-sm" onClick={()=>remove(s.id)}>Excluir</button> : null}</div>
          </div>
        ))}
      </div>
    </div>
  )
}