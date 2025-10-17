import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { buscarProdutos() }, [])

  async function buscarProdutos() {
    try {
      setLoading(true)
      // 🔹 Tabela: produtos
      // 🔹 Colunas: id, titulo, valor, descricao, created_at
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar produtos:', error)
        setProdutos([])
      } else {
        setProdutos(data || [])
      }
    } catch (e) {
      console.error(e)
      setProdutos([])
    } finally {
      setLoading(false)
    }
  }

  async function adicionarProduto(e) {
    e.preventDefault()
    if (!isAdmin()) { alert('Apenas administradores podem adicionar produtos.'); return }

    try {
      const { error } = await supabase
        .from('produtos')
        .insert([
          { titulo, valor, descricao, created_at: new Date().toISOString() }
        ])

      if (error) {
        console.error('Erro ao adicionar produto:', error)
      } else {
        setTitulo('')
        setValor('')
        setDescricao('')
        buscarProdutos()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function removerProduto(id) {
    if (!isAdmin()) { alert('Apenas administradores podem remover produtos.'); return }

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)

      if (error) console.error('Erro ao remover produto:', error)
      buscarProdutos()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Produtos</h2>
        {isAdmin() && <button className="tab-btn">Novo Produto</button>}
      </div>

      {isAdmin() && (
        <form onSubmit={adicionarProduto} className="mb-4 card">
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
        {produtos.map(p => (
          <div key={p.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{p.titulo}</div>
              <div className="text-sm small-muted">
                R$ {p.valor} • {p.descricao}
              </div>
            </div>
            {isAdmin() && (
              <button className="text-sm" onClick={() => removerProduto(p.id)}>
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
