import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Servicos() {
  const [servicos, setServicos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { buscarServicos() }, [])

  async function buscarServicos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar serviços:', error)
        setServicos([])
      } else {
        setServicos(data || [])
      }
    } catch (e) {
      console.error(e)
      setServicos([])
    } finally {
      setLoading(false)
    }
  }

  async function adicionarServico(e) {
    e.preventDefault()
    if (!isAdmin()) { alert('Apenas administradores podem adicionar serviços.'); return }

    try {
      const { error } = await supabase
        .from('servicos')
        .insert([{ titulo, valor, descricao, created_at: new Date().toISOString() }])

      if (error) {
        console.error('Erro ao adicionar serviço:', error)
      } else {
        setTitulo('')
        setValor('')
        setDescricao('')
        buscarServicos()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function removerServico(id) {
    if (!isAdmin()) { alert('Apenas administradores podem remover serviços.'); return }

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id)

      if (error) console.error('Erro ao remover serviço:', error)
      buscarServicos()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Serviços</h2>
        {isAdmin() && <button className="tab-btn">Novo Serviço</button>}
      </div>

      {isAdmin() && (
        <form onSubmit={adicionarServico} className="mb-4 card">
          <div className="mb-2">
            <label className="block text-sm mb-1">Título</label>
            <input
              className="w-full p-2 border rounded"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm mb-1">Valor</label>
            <input
              className="w-full p-2 border rounded"
              value={valor}
              onChange={e => setValor(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm mb-1">Descrição</label>
            <input
              className="w-full p-2 border rounded"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <button className="tab-btn" type="submit">Adicionar</button>
          </div>
        </form>
      )}

      {loading ? <div>Carregando...</div> : null}

      <div className="grid gap-2">
        {servicos.map(s => (
          <div key={s.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{s.titulo}</div>
              <div className="text-sm small-muted">
                R$ {s.valor} • {s.descricao}
              </div>
            </div>
            {isAdmin() && (
              <button className="text-sm" onClick={() => removerServico(s.id)}>
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
