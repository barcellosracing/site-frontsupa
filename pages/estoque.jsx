import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Trash2, Pencil, X } from 'lucide-react'

function Toast({ message, type, onClose }) {
  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white animate-fade-in
      ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [historico, setHistorico] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showToast, setShowToast] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco_custo: '',
    quantidade: '',
    produto_existente: ''
  })
  const [editando, setEditando] = useState(null)
  const [editData, setEditData] = useState({})

  const mostrarToast = (msg, tipo = 'success') => {
    setShowToast({ message: msg, type: tipo })
    setTimeout(() => setShowToast(null), 2500)
  }

  useEffect(() => {
    carregarProdutos()
    carregarHistorico()
  }, [])

  const carregarProdutos = async () => {
    const { data, error } = await supabase
      .from('estoque_produtos')
      .select('*')
      .order('nome', { ascending: true })
    if (!error) setProdutos(data || [])
  }

  const carregarHistorico = async () => {
    const { data, error } = await supabase
      .from('estoque_historico')
      .select('*')
      .order('data_entrada', { ascending: false })
    if (!error) setHistorico(data || [])
  }

  const adicionarEntrada = async (e) => {
    e.preventDefault()
    const preco = parseFloat(formData.preco_custo.replace(',', '.')) || 0
    const qtd = parseInt(formData.quantidade) || 0
    let produtoId = formData.produto_existente

    try {
      if (produtoId) {
        const produto = produtos.find((p) => p.id === produtoId)
        const novoTotal = produto.quantidade + qtd
        const novoCusto =
          (produto.preco_custo * produto.quantidade + preco * qtd) / novoTotal

        await supabase
          .from('estoque_produtos')
          .update({ quantidade: novoTotal, preco_custo: novoCusto })
          .eq('id', produtoId)
      } else {
        const { data: novoProduto } = await supabase
          .from('estoque_produtos')
          .insert([
            {
              nome: formData.nome,
              descricao: formData.descricao,
              preco_custo: preco,
              quantidade: qtd,
              margem_lucro: 0
            }
          ])
          .select()
        produtoId = novoProduto?.[0]?.id
      }

      await supabase.from('estoque_historico').insert([
        {
          produto_id: produtoId,
          nome: formData.nome || produtos.find((p) => p.id === produtoId)?.nome,
          descricao:
            formData.descricao || produtos.find((p) => p.id === produtoId)?.descricao,
          preco_custo: preco,
          quantidade: qtd
        }
      ])

      setFormData({
        nome: '',
        descricao: '',
        preco_custo: '',
        quantidade: '',
        produto_existente: ''
      })
      setShowForm(false)
      mostrarToast('Entrada adicionada!')
      await carregarProdutos()
      await carregarHistorico()
    } catch (err) {
      mostrarToast('Erro ao adicionar.', 'error')
      console.error(err)
    }
  }

  const recalcularProduto = async (produtoId) => {
    const { data: entradas } = await supabase
      .from('estoque_historico')
      .select('quantidade, preco_custo')
      .eq('produto_id', produtoId)

    if (!entradas || entradas.length === 0) {
      await supabase
        .from('estoque_produtos')
        .delete()
        .eq('id', produtoId)
      return
    }

    const totalQtd = entradas.reduce((acc, e) => acc + e.quantidade, 0)
    const totalCusto = entradas.reduce(
      (acc, e) => acc + e.preco_custo * e.quantidade,
      0
    )
    const custoMedio = totalCusto / totalQtd

    await supabase
      .from('estoque_produtos')
      .update({ quantidade: totalQtd, preco_custo: custoMedio })
      .eq('id', produtoId)
  }

  const excluirHistorico = async (id, produtoId) => {
    await supabase.from('estoque_historico').delete().eq('id', id)
    await recalcularProduto(produtoId)
    mostrarToast('Entrada excluída!')
    await carregarHistorico()
    await carregarProdutos()
  }

  const salvarEdicao = async (id) => {
    const { nome, descricao, preco_custo, quantidade, data_entrada, produto_id } =
      editData
    await supabase
      .from('estoque_historico')
      .update({
        nome,
        descricao,
        preco_custo: parseFloat(preco_custo),
        quantidade: parseInt(quantidade),
        data_entrada
      })
      .eq('id', id)

    await recalcularProduto(produto_id)
    mostrarToast('Registro atualizado!')
    setEditando(null)
    await carregarHistorico()
    await carregarProdutos()
  }

  const atualizarMargem = async (id, valor) => {
    const num = parseFloat(valor)
    if (isNaN(num)) return
    await supabase.from('estoque_produtos').update({ margem_lucro: num }).eq('id', id)
    mostrarToast('Margem atualizada!')
    carregarProdutos()
  }

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Estoque</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-full shadow-lg transition"
        >
          <Plus size={22} />
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Nova Entrada</h2>
          <form onSubmit={adicionarEntrada} className="flex flex-col gap-3">
            <select
              value={formData.produto_existente}
              onChange={(e) =>
                setFormData({ ...formData, produto_existente: e.target.value })
              }
              className="p-2 rounded-md bg-gray-900 border border-gray-700"
            >
              <option value="">Novo produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>

            {!formData.produto_existente && (
              <>
                <input
                  type="text"
                  placeholder="Nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="p-2 rounded-md bg-gray-900 border border-gray-700"
                  required
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="p-2 rounded-md bg-gray-900 border border-gray-700"
                />
              </>
            )}

            <input
              type="text"
              placeholder="Preço de custo (ex: 10,50)"
              value={formData.preco_custo}
              onChange={(e) =>
                setFormData({ ...formData, preco_custo: e.target.value })
              }
              className="p-2 rounded-md bg-gray-900 border border-gray-700"
              required
            />
            <input
              type="number"
              placeholder="Quantidade"
              value={formData.quantidade}
              onChange={(e) =>
                setFormData({ ...formData, quantidade: e.target.value })
              }
              className="p-2 rounded-md bg-gray-900 border border-gray-700"
              required
            />

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-md mt-2 transition"
            >
              Adicionar
            </button>
          </form>
        </div>
      )}

      {/* Produtos */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-4 md:p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Produtos no Estoque</h2>
        {produtos.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum produto cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {produtos.map((p) => (
              <div key={p.id} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="font-semibold">{p.nome}</p>
                <p className="text-gray-400 text-sm">{p.descricao}</p>
                <p className="text-sm mt-1">
                  Custo médio: R$ {p.preco_custo.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm">Qtd: {p.quantidade}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm mr-2">Margem:</span>
                  <input
                    type="number"
                    value={p.margem_lucro ?? ''}
                    onChange={(e) => atualizarMargem(p.id, e.target.value)}
                    className="w-20 p-1 rounded-md bg-gray-800 border border-gray-700"
                  />
                  <span className="ml-1 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="py-2 px-2">Nome</th>
                <th className="px-2">Descrição</th>
                <th className="px-2">Custo Médio</th>
                <th className="px-2">Qtd</th>
                <th className="px-2">Margem (%)</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-800 hover:bg-gray-700 transition"
                >
                  <td className="py-2 px-2">{p.nome}</td>
                  <td className="px-2">{p.descricao}</td>
                  <td className="px-2">
                    R$ {p.preco_custo.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-2">{p.quantidade}</td>
                  <td className="px-2">
                    <input
                      type="number"
                      value={p.margem_lucro ?? ''}
                      onChange={(e) => atualizarMargem(p.id, e.target.value)}
                      className="w-20 p-1 rounded-md bg-gray-900 border border-gray-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Entradas</h2>
        {historico.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhuma entrada registrada.</p>
        ) : (
          <div className="space-y-3">
            {historico.map((h) => (
              <div
                key={h.id}
                className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                {editando === h.id ? (
                  <div className="flex flex-col md:flex-row gap-2 w-full">
                    <input
                      className="bg-gray-800 border border-gray-700 p-1 rounded-md w-full"
                      value={editData.nome}
                      onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                    />
                    <input
                      className="bg-gray-800 border border-gray-700 p-1 rounded-md w-full"
                      value={editData.descricao}
                      onChange={(e) =>
                        setEditData({ ...editData, descricao: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      className="bg-gray-800 border border-gray-700 p-1 rounded-md w-24"
                      value={editData.preco_custo}
                      onChange={(e) =>
                        setEditData({ ...editData, preco_custo: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      className="bg-gray-800 border border-gray-700 p-1 rounded-md w-20"
                      value={editData.quantidade}
                      onChange={(e) =>
                        setEditData({ ...editData, quantidade: e.target.value })
                      }
                    />
                    <input
                      type="date"
                      className="bg-gray-800 border border-gray-700 p-1 rounded-md w-32"
                      value={editData.data_entrada?.split('T')[0]}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          data_entrada: e.target.value
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => salvarEdicao(h.id)}
                        className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md text-sm"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded-md text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col text-sm">
                      <span className="font-semibold">{h.nome}</span>
                      <span className="text-gray-400">{h.descricao}</span>
                      <span>
                        R$ {h.preco_custo.toFixed(2).replace('.', ',')} — Qtd:{' '}
                        {h.quantidade}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(h.data_entrada).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setEditando(h.id)
                          setEditData(h)
                        }}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => excluirHistorico(h.id, h.produto_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  )
}
