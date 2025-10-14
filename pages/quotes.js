import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Quotes(){
  const [quotes,setQuotes]=useState([])
  const [clients,setClients]=useState([])
  const [products,setProducts]=useState([])
  const [services,setServices]=useState([])

  const [clientId,setClientId]=useState('')
  const [items,setItems]=useState([]) // {type, id, name, price, qty}
  const [currentType,setCurrentType]=useState('product')
  const [selectedId,setSelectedId]=useState('')
  const [quantity,setQuantity]=useState(1)

  useEffect(()=>{ fetchAll() },[])

  async function fetchAll(){
    const [{data:quotes}, {data:clients}, {data:products}, {data:services}] = await Promise.all([
      supabase.from('quotes').select('*').order('created_at',{ascending:false}),
      supabase.from('clients').select('*'),
      supabase.from('products').select('*'),
      supabase.from('services').select('*'),
    ])
    setQuotes(quotes||[]); setClients(clients||[]); setProducts(products||[]); setServices(services||[])
  }

  function addCurrentItem(){
    if(!selectedId){ alert('Escolha um item.'); return }
    const src = (currentType === 'product' ? products : services).find(p=>p.id===selectedId)
    if(!src){ alert('Item inválido'); return }
    const it = { type: currentType, id: selectedId, name: src.name, price: parseFloat(src.price||0), qty: parseInt(quantity||1,10) }
    setItems(prev=>[...prev, it])
    setSelectedId(''); setQuantity(1)
  }

  function removeItem(idx){
    setItems(prev=> prev.filter((_,i)=> i!==idx))
  }

  async function saveBudget(e){
    e.preventDefault()
    if(!isAdmin()){ alert('Apenas admin pode criar orçamentos'); return }
    if(!clientId){ alert('Selecione cliente'); return }
    if(items.length===0){ alert('Adicione pelo menos 1 item'); return }
    const total = items.reduce((s,it)=> s + (it.price * it.qty), 0)
    const created_at = new Date().toISOString()
    const { data:budget, error } = await supabase.from('budgets').insert([{ client_id: clientId, total, created_at }]).select().single()
    if(error){ alert(error.message); return }
    const bi = items.map(it => ({
      budget_id: budget.id,
      item_type: it.type === 'product' ? 'product' : 'service',
      item_id: it.id,
      quantity: it.qty,
      price: it.price,
      created_at
    }))
    const { error: err2 } = await supabase.from('budget_items').insert(bi)
    if(err2){ alert(err2.message); return }
    setItems([]); setClientId(''); fetchAll(); alert('Orçamento salvado')
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Orçamentos</h2>

      {isAdmin() && (
        <form onSubmit={saveBudget} className="mb-4 card">
          <div className="mb-2">
            <label className="block text-sm mb-1">Cliente</label>
            <select className="w-full p-2 border rounded" value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value=''>Selecione cliente</option>
              {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="mb-2">
            <label className="block text-sm mb-1">Adicionar item</label>
            <div className="flex gap-2 mb-2">
              <button type="button" className={"p-2 rounded " + (currentType==='product' ? 'bg-gray-200' : '')} onClick={()=>setCurrentType('product')}>Produto</button>
              <button type="button" className={"p-2 rounded " + (currentType==='service' ? 'bg-gray-200' : '')} onClick={()=>setCurrentType('service')}>Serviço</button>
            </div>
            <div className="flex gap-2">
              <select className="flex-1 p-2 border rounded" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
                <option value=''>Escolha {currentType}</option>
                {(currentType==='product' ? products : services).map(it=> <option key={it.id} value={it.id}>{it.name} — R$ {it.price}</option>)}
              </select>
              <input type="number" min="1" className="w-24 p-2 border rounded" value={quantity} onChange={e=>setQuantity(e.target.value)} />
              <button type="button" className="btn" onClick={addCurrentItem}>Adicionar</button>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm mb-2">Itens do orçamento</div>
            <div className="grid gap-2">
              {items.map((it,idx)=>(
                <div key={idx} className="card flex justify-between items-center">
                  <div>
                    <div className="font-medium">{it.name} <span className="small-muted">({it.type})</span></div>
                    <div className="text-sm small-muted">Qtd: {it.qty} • R$ {it.price}</div>
                  </div>
                  <div><button className="text-sm" onClick={()=>removeItem(idx)}>Remover</button></div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right small-muted">Total parcial: R$ {items.reduce((s,it)=>s + (it.price*it.qty),0).toFixed(2)}</div>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="btn" type="submit">Salvar Orçamento</button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {quotes.map(q=>(
          <div key={q.id} className="card">
            <div className="font-medium">Orçamento: {q.id}</div>
            <div className="text-sm small-muted">Total: R$ {q.total}</div>
            <div className="text-xs small-muted">Adicionado: {q.created_at ? new Date(q.created_at).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
