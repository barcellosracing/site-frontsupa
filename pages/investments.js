import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { FiPlus, FiX, FiTrash2 } from 'react-icons/fi'

export default function Investments() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)
  const [monthsList, setMonthsList] = useState([new Date().toISOString().slice(0, 7)])

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
    if (!isAdmin()) return

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
    if (!isAdmin()) return
    if (!confirm('Excluir despesa?')) return
    await supabase.from('investments').delete().eq('id', id)
    fetchData()
  }

  // Atualiza lista de meses: se passar o tempo, adiciona novos meses
  useEffect(() => {
    const today = new Date()
    setMonthsList(prev => {
      const key = today.toISOString().slice(0, 7)
      if (!prev.includes(key)) return [...prev, key]
      return prev
    })
  }, [])

  return (
    <div className="relative">
      {/* Cabeçalho com botão + */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Investimentos / Despesas</h2>
        {isAdmin() && (
          <button
            onClick={() => setShowForm(f => !f)}
            className="text-yellow-500 hover:text-yellow-400 transition p-2 rounded"
            title={showForm ? 'Fechar formulário' : 'Adicionar investimento'}
          >
            <FiPlus size={24} />
          </button>
        )}
      </div>

      {/* Filtro de mês */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-200 font-medium">Filtrar mês:</label>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="p-2 border rounded bg-gray-950 text-white"
        >
          {monthsList.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {/* Formulário */}
      {showForm && isAdmin() && (
        <form
          onSubmit={add}
          className="mb-6 card p-4 border border-gray-200 rounded-xl shadow-md"
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

      {/* Lista de investimentos */}
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
                <div className="text-sm text-gray-400">
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
                  title="Excluir"
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
