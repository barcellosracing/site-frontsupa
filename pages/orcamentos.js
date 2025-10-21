import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { FiPlus, FiX, FiTrash2 } from 'react-icons/fi'

// Gera lista de últimos 12 meses
function ultimos12Meses() {
  const res = []
  const agora = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    res.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' })
    })
  }
  return res
}

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [servicos, setServicos] = useState([])

  const [clienteId, setClienteId] = useState('')
  const [itens, setItens] = useState([])
  const [tipoAtual, setTipoAtual] = useState('produto')
  const [itemSelecionado, setItemSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    buscarTudo()
  }, [])

  async function buscarTudo() {
    const [{ data: orc }, { data: cli }, { data: prod }, { data: serv }] = await Promise.all([
      supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('*'),
      supabase.from('produtos').select('*'),
      supabase.from('servicos').select('*')
    ])
    setOrcamentos(orc || [])
    setClientes(cli || [])
    setProdutos(prod || [])
    setServicos(serv || [])
  }

  function adicionarItemAtual() {
    if (!itemSelecionado) {
      alert('Escolha um item.')
      return
    }
    const origem =
      tipoAtual === 'produto'
        ? produtos.find(p => p.id === itemSelecionado)
        : servicos.find(s => s.id === itemSelecionado)
    if (!origem) {
      alert('Item inválido.')
      return
    }

    const novoItem = {
      tipo: tipoAtual,
      id: itemSelecionado,
      nome: origem.titulo,
      valor: parseFloat(origem.valor || 0),
      qtd: parseInt(quantidade || 1, 10)
    }

    setItens(prev => [...prev, novoItem])
    setItemSelecionado('')
    setQuantidade(1)
  }

  function removerItem(idx) {
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  async function salvarOrcamento(e) {
    e.preventDefault()
    if (!isAdmin()) {
      alert('Apenas administradores podem criar orçamentos.')
      return
    }
    if (!clienteId) {
      alert('Selecione um cliente.')
      return
    }
    if (itens.length === 0) {
      alert('Adicione pelo menos um item.')
      return
    }

    const total = itens.reduce((s, it) => s + it.valor * it.qtd, 0)
    const created_at = new Date().toISOString()

    const { data: orcamento, error } = await supabase
      .from('orcamentos')
      .insert([{ cliente_id: clienteId, total, status: 'pendente', created_at }])
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    const itensFormatados = itens.map(it => ({
      orcamento_id: orcamento.id,
      item_tipo: it.tipo === 'produto' ? 'product' : 'service',
      item_id: it.id,
      quantidade: it.qtd,
      valor: it.valor,
      created_at
    }))

    const { error: erroItens } = await supabase.from('orcamento_itens').insert(itensFormatados)

    if (erroItens) {
      alert(erroItens.message)
      return
    }

    setItens([])
    setClienteId('')
    buscarTudo()
    setMostrarForm(false)
    alert('Orçamento salvo com sucesso!')
  }

  async function alternarStatus(o) {
    if (!isAdmin()) {
      alert('Apenas admin.')
      return
    }
    const novoStatus = o.status === 'fechado' ? 'pendente' : 'fechado'
    const { error } = await supabase.from('orcamentos').update({ status: novoStatus }).eq('id', o.id)
    if (error) {
      alert(error.message)
      return
    }
    buscarTudo()
  }

  const filtrados = orcamentos.filter(o => {
    const clienteOk = clienteId ? o.cliente_id === clienteId : true
    const mesOrc = o.created_at ? o.created_at.slice(0, 7) : ''
    const mesOk = mes ? mesOrc === mes : true
    return clienteOk && mesOk
  })

  const meses = ultimos12Meses()

  return (
    <div className="relative">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Orçamentos</h2>
        {isAdmin() && (
          <button
            onClick={() => setMostrarForm(s => !s)}
            className="p-2 text-yellow-400 hover:text-yellow-500 transition"
          >
            {mostrarForm ? <FiX size={24} /> : <FiPlus size={24} />}
          </button>
        )}
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form
          onSubmit={salvarOrcamento}
          className="mb-6 border border-gray-700 rounded-xl shadow-md bg-gray-950 p-4"
        >
          <h3 className="text-lg font-semibold mb-3">Novo Orçamento</h3>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-300">Cliente</label>
              <select
                className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
              >
                <option value="">Selecione cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-300">Adicionar item</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded border border-gray-600 ${
                    tipoAtual === 'produto' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'
                  }`}
                  onClick={() => setTipoAtual('produto')}
                >
                  Produto
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded border border-gray-600 ${
                    tipoAtual === 'serviço' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'
                  }`}
                  onClick={() => setTipoAtual('serviço')}
                >
                  Serviço
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  className="flex-1 p-2 border border-gray-600 rounded bg-gray-800 text-white"
                  value={itemSelecionado}
                  onChange={e => setItemSelecionado(e.target.value)}
                >
                  <option value="">Escolha {tipoAtual}</option>
                  {(tipoAtual === 'produto' ? produtos : servicos).map(it => (
                    <option key={it.id} value={it.id}>
                      {it.titulo} — R$ {it.valor}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="w-24 p-2 border border-gray-600 rounded bg-gray-800 text-white"
                  value={quantidade}
                  onChange={e => setQuantidade(e.target.value)}
                />

                <button
                  type="button"
                  className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition"
                  onClick={adicionarItemAtual}
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Lista de Itens */}
            {itens.length > 0 && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-1 text-gray-300">Itens adicionados</div>
                <div className="grid gap-2">
                  {itens.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-gray-900 border border-gray-700 rounded"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {it.nome}{' '}
                          <span className="text-gray-400 text-sm">({it.tipo})</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Qtd: {it.qtd} • R$ {it.valor}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removerItem(idx)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right text-sm text-gray-400">
                  Total parcial: R$ {itens.reduce((s, it) => s + it.valor * it.qtd, 0).toFixed(2)}
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <button className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition" type="submit">
                Salvar Orçamento
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <select
          value={clienteId}
          onChange={e => setClienteId(e.target.value)}
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
        >
          <option value="">Todos os clientes</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select value={mes} onChange={e => setMes(e.target.value)} className="p-2 border border-gray-600 rounded bg-gray-800 text-white">
          {meses.map(m => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Orçamentos */}
      <div className="grid gap-3">
        {filtrados.map(o => (
          <div key={o.id} className="p-4 border border-gray-700 rounded-xl shadow-sm bg-gray-950 hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-lg text-white">Orçamento #{o.id}</div>
                <div className="text-sm text-gray-400">Total: R$ {o.total}</div>
                <div className="text-xs text-gray-500">
                  {o.created_at ? new Date(o.created_at).toLocaleString() : ''}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    o.status === 'fechado'
                      ? 'bg-green-600 text-white'
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  {o.status.toUpperCase()}
                </span>

                {isAdmin() && (
                  <button
                    className="text-sm px-3 py-1 border border-gray-600 rounded hover:bg-gray-800 transition text-gray-300"
                    onClick={() => alternarStatus(o)}
                  >
                    {o.status === 'fechado' ? 'Reabrir' : 'Fechar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
