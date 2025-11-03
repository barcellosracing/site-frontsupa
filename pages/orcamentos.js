import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { FiPlus, FiX, FiTrash2, FiSearch } from 'react-icons/fi'

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [servicos, setServicos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [clienteBusca, setClienteBusca] = useState('')
  const [itens, setItens] = useState([])
  const [tipoAtual, setTipoAtual] = useState('produto')
  const [itemSelecionado, setItemSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [mesFiltro, setMesFiltro] = useState('')
  const [anoFiltro, setAnoFiltro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    buscarTudo()
  }, [])

  async function buscarTudo() {
    const [{ data: orc }, { data: cli }, { data: prod }, { data: serv }] = await Promise.all([
      supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('*'),
      supabase.from('estoque').select('*'),
      supabase.from('servicos').select('*')
    ])
    setOrcamentos(orc || [])
    setClientes(cli || [])
    setServicos(serv || [])
    setProdutos((prod || []).filter(p => p.quantidade > 0))
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

    const qtdSolicitada = parseInt(quantidade || 1, 10)

    // 🚫 Verifica estoque
    if (tipoAtual === 'produto' && qtdSolicitada > origem.quantidade) {
      alert(`Quantidade indisponível. Estoque atual: ${origem.quantidade}`)
      return
    }

    const novoItem = {
      tipo: tipoAtual,
      id: itemSelecionado,
      nome: origem.nome || origem.titulo,
      valor: parseFloat(origem.valor || origem.preco_custo || 0),
      qtd: qtdSolicitada
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
    const data = new Date(o.created_at)
    const mesOk = mesFiltro ? data.getMonth() + 1 === parseInt(mesFiltro) : true
    const anoOk = anoFiltro ? data.getFullYear() === parseInt(anoFiltro) : true
    const cliente = clientes.find(c => c.id === o.cliente_id)
    const nomeOk = clienteBusca
      ? cliente?.nome?.toLowerCase().includes(clienteBusca.toLowerCase())
      : true
    return mesOk && anoOk && nomeOk
  })

  function nomeCliente(id) {
    const cli = clientes.find(c => c.id === id)
    return cli ? cli.nome : '(Cliente removido)'
  }

  return (
    <div className="relative max-w-full overflow-hidden px-3 py-2">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-white">Orçamentos</h2>
        {isAdmin() && (
          <button
            onClick={() => setMostrarForm(s => !s)}
            className="p-2 text-yellow-400 hover:text-yellow-500 transition"
          >
            {mostrarForm ? <FiX size={22} /> : <FiPlus size={22} />}
          </button>
        )}
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form
          onSubmit={salvarOrcamento}
          className="mb-4 border border-gray-700 rounded-xl shadow-md bg-gray-950 p-4 w-full"
        >
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Novo Orçamento</h3>

          {/* Selecionar cliente */}
          <div className="flex flex-col mb-3">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={clienteBusca}
              onChange={e => setClienteBusca(e.target.value)}
              className="p-2 mb-2 rounded bg-gray-800 border border-gray-600 text-white"
            />
            <select
              className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
            >
              <option value="">Selecione cliente</option>
              {clientes
                .filter(c =>
                  c.nome.toLowerCase().includes(clienteBusca.toLowerCase())
                )
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </div>

          {/* Tipo de item */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              className={`flex-1 py-2 rounded ${
                tipoAtual === 'produto' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'
              }`}
              onClick={() => setTipoAtual('produto')}
            >
              Produto
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded ${
                tipoAtual === 'serviço' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'
              }`}
              onClick={() => setTipoAtual('serviço')}
            >
              Serviço
            </button>
          </div>

          {/* Escolher item */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <select
              className="flex-1 p-2 border border-gray-600 rounded bg-gray-800 text-white"
              value={itemSelecionado}
              onChange={e => setItemSelecionado(e.target.value)}
            >
              <option value="">Escolha {tipoAtual}</option>
              {(tipoAtual === 'produto' ? produtos : servicos).map(it => (
                <option key={it.id} value={it.id}>
                  {it.nome || it.titulo} — R$ {it.valor}{' '}
                  {tipoAtual === 'produto' ? `(Estoque: ${it.quantidade})` : ''}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              className="w-full sm:w-20 p-2 border border-gray-600 rounded bg-gray-800 text-white"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
            />

            <button
              type="button"
              onClick={adicionarItemAtual}
              className="px-3 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition"
            >
              Adicionar
            </button>
          </div>

          {/* Lista de itens */}
          {itens.length > 0 && (
            <div className="mt-2">
              {itens.map((it, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-gray-900 border border-gray-700 rounded p-2 mb-1"
                >
                  <div>
                    <div className="font-medium text-white">{it.nome}</div>
                    <div className="text-sm text-gray-400">
                      Qtd: {it.qtd} • R$ {it.valor.toFixed(2)}
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
          )}

          <button
            type="submit"
            className="mt-3 w-full py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400"
          >
            Salvar Orçamento
          </button>
        </form>
      )}

      {/* 🔍 Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex items-center bg-gray-800 rounded px-2">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            className="flex-1 p-2 bg-transparent text-white text-sm focus:outline-none"
            value={clienteBusca}
            onChange={e => setClienteBusca(e.target.value)}
          />
        </div>
        <input
          type="number"
          placeholder="Mês"
          className="w-full sm:w-1/3 p-2 border border-gray-600 rounded bg-gray-800 text-white text-center"
          value={mesFiltro}
          onChange={e => setMesFiltro(e.target.value)}
        />
        <input
          type="number"
          placeholder="Ano"
          className="w-full sm:w-1/3 p-2 border border-gray-600 rounded bg-gray-800 text-white text-center"
          value={anoFiltro}
          onChange={e => setAnoFiltro(e.target.value)}
        />
      </div>

      {/* 📋 Lista */}
      <div className="grid gap-3">
        {filtrados.map(o => (
          <div
            key={o.id}
            className="p-3 border border-gray-700 rounded-xl bg-gray-950 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-white text-base">
                  {nomeCliente(o.cliente_id)}
                </div>
                <div className="text-sm text-gray-400">
                  Total: R$ {o.total.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    o.status === 'fechado'
                      ? 'bg-green-600 text-white'
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  {o.status.toUpperCase()}
                </span>
                {isAdmin() && (
                  <button
                    className="text-xs mt-1 text-gray-300 border border-gray-600 px-2 py-1 rounded hover:bg-gray-800"
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
