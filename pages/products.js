import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Products(){
  const [products, setProducts] = useState([])
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ fetchProducts() }, [])

  async function fetchProducts(){
    try{
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (error) { console.error('supabase products', error); setProducts([]) } else setProducts(data||[])
    }catch(e){ console.error(e); setProducts([]) }finally{ setLoading(false) }
  }

  async function add(e){
    e.preventDefault()
    if (!isAdmin()){ alert('Apenas admin'); return }
    try{
      await supabase.from('products').insert([{ title, value, description, created_at: new Date().toISOString() }])
      setTitle(''); setValue(''); setDescription('')
      fetchProducts()
    }catch(e){ console.error(e) }
  }

  async function remove(id){
    if (!isAdmin()){ alert('Apenas admin'); return }
    try{ await supabase.from('products').delete().eq('id', id); fetchProducts() }catch(e){ console.error(e) }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Produtos</h2>
        {isAdmin() && <button className="tab-btn">Novo Produto</button>}
      </div>

      <form onSubmit={add} className="mb-4 card">
        <div className="mb-2"><label className="block text-sm mb-1">Título</label><input className="w-full p-2 border rounded" value={title} onChange={e=>setTitle(e.target.value)} /></div>
        <div className="mb-2"><label className="block text-sm mb-1">Valor</label><input className="w-full p-2 border rounded" value={value} onChange={e=>setValue(e.target.value)} /></div>
        <div className="mb-2"><label className="block text-sm mb-1">Descrição</label><input className="w-full p-2 border rounded" value={description} onChange={e=>setDescription(e.target.value)} /></div>
        <div><button className="tab-btn" type="submit">Adicionar</button></div>
      </form>

      {loading ? <div>Carregando...</div> : null}

      <div className="grid gap-2">
        {products.map(p=>(
          <div key={p.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm small-muted">R$ {p.value} • {p.description}</div>
            </div>
            <div>{isAdmin() ? <button className="text-sm" onClick={()=>remove(p.id)}>Excluir</button> : null}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
