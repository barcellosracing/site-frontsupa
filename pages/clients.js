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

export default function Clients(){
  const [clients, setClients] = useState([])
  const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [obs,setObs]=useState('')

  useEffect(()=>{ fetchClients() }, [])

  async function fetchClients(){
    const { data, error } = await supabase.from('clients').select('*').order('id',{ascending:false})
    if(error){ console.error(error); return }
    setClients(data||[])
  }

  async function add(e){
    e.preventDefault()
    if(!isAdmin()){ alert('Apenas admin pode adicionar.'); return }
    const created_at = new Date().toISOString()
    await supabase.from('clients').insert([{ name, phone, obs, created_at }])
    setName(''); setPhone(''); setObs(''); fetchClients()
  }

  async function remove(id){
    if(!isAdmin()){ alert('Apenas admin pode excluir.'); return }
    if(!confirm('Excluir cliente?')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Clientes</h2>
      {isAdmin() && (
        <form onSubmit={add} className='mb-4 grid gap-2 sm:grid-cols-4'>
          <input className='p-2 border rounded' placeholder='Nome' value={name} onChange={e=>setName(e.target.value)} />
          <input className='p-2 border rounded' placeholder='Telefone' value={phone} onChange={e=>setPhone(e.target.value)} />
          <input className='p-2 border rounded' placeholder='Observações' value={obs} onChange={e=>setObs(e.target.value)} />
          <button className='p-2 rounded bg-accent text-black'>Adicionar</button>
        </form>
      )}

      <div className='grid gap-3'>
        {clients.map(c=>(
          <div key={c.id} className='card flex justify-between items-center'>
            <div>
              <div className='font-medium text-gray-800'>{c.name}</div>
              <div className='text-sm text-gray-500'>{c.phone}</div>
            </div>
            <div>
              {isAdmin() ? <><button className='text-sm mr-2' onClick={()=>remove(c.id)}>Excluir</button></> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
