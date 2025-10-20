import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { FiPlus, FiX, FiTrash2 } from 'react-icons/fi'

function monthOptions() {
  const res = []
  const now = new Date()
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
    for (let m = 1; m <= 12; m++) {
      const mm = m.toString().padStart(2, '0')
      res.push({ key: `${y}-${mm}`, label: `${mm}/${y}` })
    }
  }
  return res
}

export default function Investments() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [month])

  async function fetchData() {
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
      alert('Apenas administradores podem adicionar.')
      return
    }

    const created_at = new Date().toISOString()
    await supabase
      .from('investments')
      .insert([{ title, amount: parseFloat(amount || 0), category, created_at }])

    setTitle('')
    setAmount('')
    setCategory('')
    fetchData()
  }

  async function remove(id) {
    if (!isAdmin()) {
      alert('Apenas administradores podem excluir.')
      return
    }
    if (!confirm('Excluir despesa?')) return
    await supabase.from('investments').delete().eq('id', id)
    fetchData()
  }

  const months = monthOptions()

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Investimentos / Despesas</h2>
      </div>

      {/* Botão flutuante de adicionar */}
      {isAdmin() && (
        <button
          onClick={() => setShowForm(f => !f)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-all"
        >
          {showForm ? <FiX size={22} /> : <FiPlus size={22} />}
        </button>
      )}

      {/* Filtro de mês */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-600">Filtrar mês:</label>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="p-2 border rounded"
        >
          {months.map(m => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Formulário */}
      {showForm && isAdmin() && (
        <form
          onSubmit={add}
          className="mb-6 card p-4 border border-gray-200 rounded-xl shadow-md animate-fade-in"
        >
          <h3 className="text-lg font-semibold mb-3">Adicionar Investimento</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="p-2 border rounded"
              placeholder="Descrição"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <input
              className="p-2 border rounded"
              placeholder="Valor"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <input
              className="p-2 border rounded"
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

      {/* Lista */}
      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">Nenhum item encontrado.</div>
        ) : (
          items.map(i => (
            <div
              key={i.id}
              className="card flex justify-between items-center border rounded-xl shadow-sm p-4 hover:shadow-md transition"
            >
              <div>
                <div className="font-medium text-lg">{i.title}</div>
                <div className="text-sm text-gray-600">
                  R$ {i.amount} • {i.category || 'Sem categoria'}
                </div>
                <div className="text-xs text-gray-500">
                  {i.created_at ? new Date(i.created_at).toLocaleString() : ''}
                </div>
              </div>
              {isAdmin() && (
                <button
                  onClick={() => remove(i.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FiTrash2 size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
