import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { FiPlus } from 'react-icons/fi'

// 🔹 Retorna o mês atual no formato YYYY-MM
function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
}

// 🔹 Formata data para MM/AAAA
function formatMonthLabel(value) {
  const [y, m] = value.split('-')
  return `${m}/${y}`
}

export default function Investments() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('investimento')
  const [month, setMonth] = useState(currentMonth())
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('todos')

  // Carrega investimentos filtrados
  useEffect(() => {
    fetchInvestments()
  }, [month, filterCategory])

  async function fetchInvestments() {
    const { data } = await supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false })

    let filtered = (data || []).filter(i => (i.created_at || '').slice(0, 7) === month)
    if (filterCategory !== 'todos') {
      filtered = filtered.filter(i => i.category === filterCategory)
    }
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
    setCategory('investimento')
    fetchInvestments()
  }

  async function remove(id) {
    if (!isAdmin()) {
      alert('Apenas admin')
      return
    }
    if (!confirm('Excluir este item?')) return
    await supabase.from('investments').delete().eq('id', id)
    fetchInvestments()
  }

  return (
    <div className="relative">
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
          <h3 className="text-lg font-semibold mb-3">Adicionar Item</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-400"
              placeholder="Descrição"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <input
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-400"
              placeholder="Valor"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <select
              className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="investimento">Investimento</option>
              <option value="despesa">Despesa</option>
            </select>
            <button
              type="submit"
              className="bg-yellow-500 text-black font-bold py-2 rounded-lg hover:bg-yellow-400 transition"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div>
          <label className="small-muted mr-2">Mês:</label>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
          >
            <option value={currentMonth()}>{formatMonthLabel(currentMonth())}</option>
          </select>
        </div>

        <div>
          <label className="small-muted mr-2">Categoria:</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos</option>
            <option value="investimento">Investimentos</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="grid gap-3">
        {items.map(i => (
          <div
            key={i.id}
            className={`card flex justify-between items-center p-3 border rounded-xl shadow-sm transition 
              ${i.category === 'investimento' ? 'border-green-600 bg-green-950/40' : 'border-red-600 bg-red-950/40'}`}
          >
            <div>
              <div className="font-medium text-white">{i.title}</div>
              <div className="text-sm text-gray-300">
                R$ {i.amount.toFixed(2)} • {i.category === 'investimento' ? '💹 Investimento' : '💸 Despesa'}
              </div>
              <div className="text-xs text-gray-500">
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
