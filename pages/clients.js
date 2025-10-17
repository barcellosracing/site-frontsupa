import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [nome, setNome] = useState('')
  const [fone, setFone] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { buscarClientes() }, [])

  async function buscarClientes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar clientes:', error)
        setClientes([])
      } else {
        setClientes(data || [])
      }
    } catch (e) {
      console.error(e)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  async function adicionarCliente(e) {
    e.preventDefault()
    if (!isAdmin()) { alert('Apenas administradores podem adicionar clientes.'); return }

    if (!nome.trim() || !fone.trim()) {
      alert('Preencha pelo menos o nome e o telefone do cliente.')
      return
    }

    try {
      await supabase.from('clientes').insert([{
        nome,
        fone,
        descricao,
        created_at: new Date().toISOString()
      }])

      setNome('')
      setFone('')
      setDescricao('')
      buscarClientes()
    } catch (e) {
      console.error('Erro ao adicionar cliente:', e)
    }
  }

  async function removerCliente(id) {
    if (!isAdmin()) { alert('Apenas administradores podem excluir.'); return }
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await supabase.from('clientes').delete().eq('id', id)
      buscarClientes()
    } catch (e) {
      console.error('Erro ao remover cliente:', e)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Clientes</h2>
      </div>

      {isAdmin() && (
        <form onSubmit={adicionarCliente} className="mb-4 card">
          <div className="mb-2">
            <label className="block text-sm mb-1">Nome</label>
            <input
              className="w-full p-2 border rounded"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Digite o nome do cliente"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm mb-1">Telefone</label>
            <input
              className="w-full p-2 border rounded"
              value={fone}
              onChange={e => setFone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm mb-1">Descrição / Observações</label>
            <input
              className="w-full p-2 border rounded"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Informações adicionais sobre o cliente"
            />
          </div>

          <div>
            <button className="tab-btn" type="submit">Adicionar Cliente</button>
          </div>
        </form>
      )}

      {loading && <div>Carregando...</div>}

      <div className="grid gap-2">
        {clientes.map(c => (
          <div key={c.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{c.nome}</div>
              <div className="text-sm small-muted">
                📞 {c.fone}{c.descricao ? ` • ${c.descricao}` : ''}
              </div>
            </div>
            {isAdmin() && (
              <button className="text-sm text-red-500" onClick={() => removerCliente(c.id)}>
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
