import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { FiPlus } from 'react-icons/fi'

// Função que retorna o mês atual como "YYYY-MM"
function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
}

export default function Investments() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [month, setMonth] = useState(currentMonth())
  const [showForm, setShowForm] = useState(false)

  // Carrega os investimentos filtrados pelo mês
  useEffect(() => {
    fetchInvestments()
  }, [month])

  async function fetchInvestments() {
    const { data } = await supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false })

    const filtered = (data || []).filter(i => (i.created_at || '').slice(0, 7) === month)
    setItems(filtered)
  }

  async function add(e) {
    e.preventDefault()
    if (!isAdmin()) {
      alert('Apenas admin pode adicionar.')
      return
    }
    const created_at = new Date().toISOString()
    await supabase.from('investments').insert([{
      title,
      amount: parseFloat(amount || 0),
      category,
      created_at
    }])
    setTitle('')
    setAmount('')
    setCategory('')
    fetchInvestments()
  }

  async function remove(id) {
    if (!isAdmin()) {
      alert('Apenas admin')
      return
    }
    if (!confirm('Excluir despesa?')) return
    await supabase.from('investments').delete().eq('id', id)
    fetchInvestments()
  }

  return (
    <div>
      {/* Cabeçalho e botão + */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Investimentos / Despesas</h2>
        {isAdmin() && (
          <button
            className="p-2 text-yellow-400 hover:text-yellow-500 rounded transition"
            onClick={() => setShowForm(s => !s)}
          >
            <FiPlus size={24} />
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && isAdmin() && (
        <form
          onSubmit={add}
          className="mb-6 card p-4 border border-gray-700 rounded-xl shadow-md bg-gray-950"
        >
          <h3 className="text-lg font-semibold mb-3">Adicionar Investimento</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-400"
              placeholder="Descrição"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <input
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-400"
              placeholder="Valor"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <input
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-400"
              placeholder="Categoria (opcional)"
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button className="tab-btn" type="submit">
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* Filtro de mês */}
      <div className="mb-4">
        <label className="small-muted mr-2">Filtrar mês:</label>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-400"
        >
          <option value={currentMonth()}>{currentMonth()}</option>
        </select>
      </div>

      {/* Lista de investimentos */}
      <div className="grid gap-3">
        {items.map(i => (
          <div
            key={i.id}
            className="card flex justify-between items-center p-3 border border-gray-700 rounded-xl shadow-sm bg-gray-950"
          >
            <div>
              <div className="font-medium">{i.title}</div>
              <div className="text-sm small-muted">R$ {i.amount} • {i.category}</div>
              <div className="text-xs small-muted">
                Adicionado: {i.created_at ? new Date(i.created_at).toLocaleString() : ''}
              </div>
            </div>
            {isAdmin() && (
              <button
                className="text-sm text-red-500 hover:text-red-600"
                onClick={() => remove(i.id)}
              >
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
