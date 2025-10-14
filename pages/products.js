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

export default function Products(){
  const [items,setItems]=useState([])
  const [name,setName]=useState(''); const [price,setPrice]=useState(''); const [file,setFile]=useState(null)
  const [description,setDescription]=useState('')

  useEffect(()=>{ fetch() }, [])

  async function fetch(){
    const { data } = await supabase.from('products').select('*').order('id',{ascending:false})
    setItems(data||[])
  }

  async function uploadImage(file){
    const fileName = `${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('uploads').upload(fileName, file)
    if(error){ alert(error.message); return null }
    const { publicURL } = supabase.storage.from('uploads').getPublicUrl(fileName)
    return publicURL
  }

  async function add(e){
    e.preventDefault()
    if(!isAdmin()){ alert('Apenas admin pode adicionar.'); return }
    let image_url = null
    if(file) image_url = await uploadImage(file)
    const created_at = new Date().toISOString()
    await supabase.from('products').insert([{ name, price: parseFloat(price), image_url, description, created_at }])
    setName(''); setPrice(''); setFile(null); setDescription(''); fetch()
  }

  async function remove(id){
    if(!isAdmin()){ alert('Apenas admin pode excluir.'); return }
    if(!confirm('Excluir produto?')) return
    await supabase.from('products').delete().eq('id', id)
    fetch()
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Produtos</h2>
      {isAdmin() && (
      <form onSubmit={add} className='mb-4 grid gap-2'>
        <input className='p-2 border rounded' placeholder='Nome' value={name} onChange={e=>setName(e.target.value)} />
        <input className='p-2 border rounded' placeholder='Preço' value={price} onChange={e=>setPrice(e.target.value)} />
        <textarea className='p-2 border rounded' placeholder='Descrição' value={description} onChange={e=>setDescription(e.target.value)} />
        <input type='file' className='p-2' onChange={e=>setFile(e.target.files[0])} />
        <button className='p-2 rounded bg-accent text-black'>Adicionar</button>
      </form>
      )}

      <div className='grid gap-3'>
        {items.map(i=>(
          <div key={i.id} className='card flex justify-between items-center'>
            <div className='flex items-center gap-3'>
              {i.image_url && <img src={i.image_url} alt='' className='w-16 h-16 object-cover rounded' />}
              <div>
                <div className='font-medium text-gray-800'>{i.name}</div>
                <div className='text-sm text-gray-500'>R$ {i.price}</div>
                <div className='text-sm text-gray-600'>{i.description}</div>
                <div className='text-xs small-muted'>Adicionado: {i.created_at ? new Date(i.created_at).toLocaleString() : ''}</div>
              </div>
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
