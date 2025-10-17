import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'

// Função auxiliar: últimos 12 meses
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
      preco: parseFloat(origem.valor || 0),
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

    const total = itens.reduce((s, it) => s + it.preco * it.qtd, 0)
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
      item_tipo: it.tipo === 'produto' ? 'product' : 'service', // 👈 fix para constraint
      item_id: it.id,
      quantidade: it.qtd,
      preco: it.preco,
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Orçamentos</h2>
        <div>
          {isAdmin() && (
            <button className="tab-btn" onClick={() => setMostrarForm(s => !s)}>
              {mostrarForm ? 'Fechar formulário' : 'Novo Orçamento'}
            </button>
          )}
        </div>
      </div>

      {mostrarForm && (
        <form onSubmit={salvarOrcamento} className="mb-4 card">
          <div className="mb-2">
            <label className="block text-sm mb-1">Cliente</label>
            <select
              className="w-full p-2 border rounded"
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

          <div className="mb-2">
            <label className="block text-sm mb-1">Adicionar item</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className={`tab-btn ${tipoAtual === 'produto' ? 'bg-opacity-40' : ''}`}
                onClick={() => setTipoAtual('produto')}
              >
                Produto
              </button>
              <button
                type="button"
                className={`tab-btn ${tipoAtual === 'serviço' ? 'bg-opacity-40' : ''}`}
                onClick={() => setTipoAtual('serviço')}
              >
                Serviço
              </button>
            </div>

            <div className="flex gap-2">
              <select
                className="flex-1 p-2 border rounded"
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
                className="w-24 p-2 border rounded"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
              />

              <button type="button" className="tab-btn" onClick={adicionarItemAtual}>
                Adicionar
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm mb-2">Itens do orçamento</div>
            <div className="grid gap-2">
              {itens.map((it, idx) => (
                <div key={idx} className="card flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {it.nome}{' '}
                      <span className="small-muted">
                        ({it.tipo})
                      </span>
                    </div>
                    <div className="text-sm small-muted">
                      Qtd: {it.qtd} • R$ {it.preco}
                    </div>
                  </div>
                  <div>
                    <button className="text-sm" onClick={() => removerItem(idx)}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right small-muted">
              Total parcial: R$ {itens.reduce((s, it) => s + it.preco * it.qtd, 0).toFixed(2)}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="tab-btn" type="submit">
              Salvar Orçamento
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex gap-2 items-center">
        <select
          value={clienteId}
          onChange={e => setClienteId(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Todos os clientes</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select value={mes} onChange={e => setMes(e.target.value)} className="p-2 border rounded">
          {meses.map(m => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {filtrados.map(o => (
          <div key={o.id} className="card">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Orçamento: {o.id}</div>
                <div className="text-sm small-muted">Total: R$ {o.total}</div>
                <div className="text-xs small-muted">
                  Adicionado: {o.created_at ? new Date(o.created_at).toLocaleString() : ''}
                </div>
              </div>
              <div>
                <div className="text-sm small-muted">Status: {o.status}</div>
                {isAdmin() ? (
                  <button className="tab-btn mt-2" onClick={() => alternarStatus(o)}>
                    {o.status === 'fechado' ? 'Marcar pendente' : 'Fechar'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
