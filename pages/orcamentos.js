import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

function last12Months() {
  const res = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    res.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' })
    })
  }
  return res
}

export default function Orcamentos() {
  const [budgets, setBudgets] = useState([])
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])

  const [clientId, setClientId] = useState('')
  const [items, setItems] = useState([])
  const [currentType, setCurrentType] = useState('product')
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: budg }, { data: clients }, { data: products }, { data: services }] = await Promise.all([
      supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
      supabase.from('products').select('*'),
      supabase.from('services').select('*')
    ])
    setBudgets(budg || [])
    setClients(clients || [])
    setProducts(products || [])
    setServices(services || [])
  }

  function addCurrentItem() {
    if (!selectedId) { alert('Escolha um item.'); return }
    const src = (currentType === 'product' ? products : services).find(p => p.id === selectedId)
    if (!src) { alert('Item inválido'); return }
    const it = {
      type: currentType,
      id: selectedId,
      name: src.name,
      price: parseFloat(src.price || 0),
      qty: parseInt(quantity || 1, 10)
    }
    setItems(prev => [...prev, it])
    setSelectedId('')
    setQuantity(1)
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveBudget(e) {
    e.preventDefault()
    if (!isAdmin()) {
      alert('Acesso negado.')
      return
    }

    if (!clientId || items.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um item.')
      return
    }

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)

    const { error } = await supabase.from('orcamentos').insert({
      client_id: clientId,
      itens: items,
      valor: total,
      status: 'aberto', // padrão em português
      created_at: new Date()
    })

    if (error) {
      console.error(error)
      alert('Erro ao salvar orçamento.')
    } else {
      alert('Orçamento salvo com sucesso!')
      fetchAll()
      setShowForm(false)
      setItems([])
      setClientId('')
    }
  }

  async function fecharOrcamento(id) {
    const { error } = await supabase
      .from('orcamentos')
      .update({ status: 'fechado' })
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('Erro ao fechar orçamento.')
    } else {
      alert('Orçamento fechado com sucesso!')
      fetchAll()
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orçamentos</h1>

      <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
        {showForm ? 'Cancelar' : 'Novo Orçamento'}
      </button>

      {showForm && (
        <form onSubmit={saveBudget} className="bg-gray-100 p-4 rounded-lg mb-6">
          <label>Cliente:</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="border p-2 w-full mb-2">
            <option value="">Selecione</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex gap-2 mb-2">
            <select value={currentType} onChange={e => setCurrentType(e.target.value)} className="border p-2">
              <option value="product">Produto</option>
              <option value="service">Serviço</option>
            </select>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="border p-2 flex-1">
              <option value="">Selecione</option>
              {(currentType === 'product' ? products : services).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="border p-2 w-20" />
            <button type="button" onClick={addCurrentItem} className="bg-green-600 text-white px-4 py-2 rounded">
              Adicionar
            </button>
          </div>

          {items.length > 0 && (
            <ul className="mb-4">
              {items.map((it, idx) => (
                <li key={idx} className="flex justify-between bg-white p-2 rounded mb-1">
                  {it.name} — {it.qty} x R${it.price.toFixed(2)}
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remover</button>
                </li>
              ))}
            </ul>
          )}

          <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded">
            Salvar Orçamento
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map(b => (
          <div key={b.id} className="border p-4 rounded-lg shadow bg-white">
            <h2 className="text-lg font-semibold mb-2">Cliente: {clients.find(c => c.id === b.client_id)?.name || 'N/A'}</h2>
            <p>Status: {b.status === 'fechado' ? 'Fechado' : 'Aberto'}</p>
            <p>Valor total: R${b.valor?.toFixed(2)}</p>
            <p>Data: {new Date(b.created_at).toLocaleDateString()}</p>

            {b.status === 'aberto' && (
              <button
                onClick={() => fecharOrcamento(b.id)}
                className="bg-green-600 text-white px-3 py-1 rounded mt-2"
              >
                Fechar Orçamento
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
