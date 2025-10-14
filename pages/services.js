import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Services(){
  const [services,setServices]=useState([])
  const [title,setTitle]=useState(''); const [value,setValue]=useState('')

  useEffect(()=>{ fetch() }, [])

  async function fetch(){
    const { data } = await supabase.from('services').select('*').order('id',{ascending:false})
    setServices(data||[])
  }

  async function add(e){
    e.preventDefault()
    await supabase.from('services').insert([{ title, value: parseFloat(value) }])
    setTitle(''); setValue(''); fetch()
  }

  async function remove(id){
    if(!confirm('Excluir serviço?')) return
    await supabase.from('services').delete().eq('id', id)
    fetch()
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Serviços</h2>
      <form onSubmit={add} className='mb-4 grid gap-2 sm:grid-cols-3'>
        <input className='p-2 border rounded' placeholder='Serviço' value={title} onChange={e=>setTitle(e.target.value)} />
        <input className='p-2 border rounded' placeholder='Valor' value={value} onChange={e=>setValue(e.target.value)} />
        <button className='p-2 rounded bg-accent text-black'>Adicionar</button>
      </form>

      <div className='grid gap-3'>
        {services.map(s=>(
          <div key={s.id} className='card flex justify-between items-center'>
            <div>
              <div className='font-medium text-gray-800'>{s.title}</div>
              <div className='text-sm text-gray-500'>R$ {s.value}</div>
            </div>
            <div>
              <button className='text-sm' onClick={()=>remove(s.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
