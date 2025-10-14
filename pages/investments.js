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

export default function Investments(){
  const [items,setItems]=useState([])
  const [title,setTitle]=useState(''); const [amount,setAmount]=useState('')

  useEffect(()=>{ fetch() }, [])

  async function fetch(){
    const { data } = await supabase.from('investments').select('*').order('id',{ascending:false})
    setItems(data||[])
  }

  async function add(e){
    e.preventDefault()
    if(!isAdmin()){ alert('Apenas admin pode adicionar.'); return }
    const created_at = new Date().toISOString()
    await supabase.from('investments').insert([{ title, amount: parseFloat(amount), created_at }])
    setTitle(''); setAmount(''); fetch()
  }

  async function remove(id){
    if(!isAdmin()){ alert('Apenas admin pode excluir.'); return }
    if(!confirm('Excluir despesa?')) return
    await supabase.from('investments').delete().eq('id', id)
    fetch()
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Investimentos (despesas)</h2>
      {isAdmin() && (
      <form onSubmit={add} className='mb-4 grid gap-2 sm:grid-cols-3'>
        <input className='p-2 border rounded' placeholder='Descrição' value={title} onChange={e=>setTitle(e.target.value)} />
        <input className='p-2 border rounded' placeholder='Valor' value={amount} onChange={e=>setAmount(e.target.value)} />
        <button className='p-2 rounded bg-accent text-black'>Adicionar</button>
      </form>
      )}

      <div className='grid gap-3'>
        {items.map(i=>(
          <div key={i.id} className='card flex justify-between items-center'>
            <div>
              <div className='font-medium text-gray-800'>{i.title}</div>
              <div className='text-sm text-gray-500'>R$ {i.amount}</div>
              <div className='text-xs small-muted'>Adicionado: {i.created_at ? new Date(i.created_at).toLocaleString() : ''}</div>
            </div>
            <div>
              {isAdmin() ? <button className='text-sm' onClick={()=>remove(i.id)}>Excluir</button> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
