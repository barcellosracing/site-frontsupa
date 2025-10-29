// /pages/estoque.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Pencil } from 'lucide-react'

export default function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [historico, setHistorico] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco_custo: '',
    quantidade: '',
    produto_existente: ''
  })

  // 🔄 Carrega dados do Supabase
  useEffect(() => {
    carregarProdutos()
    carregarHistorico()
  }, [])

  const carregarProdutos = async () => {
    const { data, error } = await supabase.from('estoque_produtos').select('*').order('nome', { ascending: true })
    if (!error) setProdutos(data || [])
  }

  const carregarHistorico = async () => {
    const { data, error } = await supabase.from('estoque_historico').select('*').order('data_entrada', { ascending: false })
    if (!error) setHistorico(data || [])
  }

  // 🧾 Adicionar entrada
  const adicionarEntrada = async (e) => {
    e.preventDefault()

    const preco = parseFloat(formData.preco_custo.replace(',', '.'))
    const qtd = parseInt(formData.quantidade)

    let produtoId = formData.produto_existente

    if (produtoId) {
      // Atualiza produto existente
      const produtoExistente = produtos.find((p) => p.id === produtoId)
      const novoTotal = produtoExistente.quantidade + qtd
      const novoCustoMedio = ((produtoExistente.preco_custo * produtoExistente.quantidade) + (preco * qtd)) / novoTotal

      await supabase
        .from('estoque_produtos')
        .update({ quantidade: novoTotal, preco_custo: novoCustoMedio })
        .eq('id', produtoId)
    } else {
      // Cria novo produto
      const { data, error } = await supabase
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

      if (!error && data?.length) produtoId = data[0].id
    }

    // Adiciona histórico
    await supabase.from('estoque_historico').insert([
      {
        produto_id: produtoId,
        nome: formData.nome,
        descricao: formData.descricao,
        preco_custo: preco,
        quantidade: qtd
      }
    ])

    setFormData({ nome: '', descricao: '', preco_custo: '', quantidade: '', produto_existente: '' })
    setShowForm(false)
    carregarProdutos()
    carregarHistorico()
  }

  // ✏️ Editar histórico
  const editarHistorico = async (id, campo, valor) => {
    await supabase.from('estoque_historico').update({ [campo]: valor }).eq('id', id)
    carregarHistorico()
  }

  // 🗑️ Excluir histórico
  const excluirHistorico = async (id) => {
    await supabase.from('estoque_historico').delete().eq('id', id)
    carregarHistorico()
  }

  // 💰 Atualizar margem de lucro
  const atualizarMargem = async (id, valor) => {
    await supabase.from('estoque_produtos').update({ margem_lucro: parseFloat(valor) }).eq('id', id)
    carregarProdutos()
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Estoque</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Formulário flutuante */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Nova Entrada</h2>
          <form onSubmit={adicionarEntrada} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.produto_existente}
              onChange={(e) => setFormData({ ...formData, produto_existente: e.target.value })}
              className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value="">Novo produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              required={!formData.produto_existente}
            />

            <input
              type="text"
              placeholder="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />

            <input
              type="text"
              placeholder="Preço de custo (ex: 10,50)"
              value={formData.preco_custo}
              onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
              className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              required
            />

            <input
              type="number"
              placeholder="Quantidade"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
              className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              required
            />

            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-md mt-2 transition">
              Adicionar
            </button>
          </form>
        </div>
      )}

      {/* Tabela de produtos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-10 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Produtos no Estoque</h2>
        <table className="w-full text-left text-gray-700 dark:text-gray-200">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-700">
              <th className="py-2">Nome</th>
              <th>Descrição</th>
              <th>Preço Custo Médio</th>
              <th>Quantidade</th>
              <th>Margem Lucro (%)</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2">{p.nome}</td>
                <td>{p.descricao}</td>
                <td>R$ {p.preco_custo.toFixed(2).replace('.', ',')}</td>
                <td>{p.quantidade}</td>
                <td>
                  <input
                    type="number"
                    value={p.margem_lucro || ''}
                    onChange={(e) => atualizarMargem(p.id, e.target.value)}
                    className="w-20 p-1 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Histórico */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Histórico de Entradas</h2>
        <table className="w-full text-left text-gray-700 dark:text-gray-200">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-700">
              <th className="py-2">Nome</th>
              <th>Descrição</th>
              <th>Preço Custo</th>
              <th>Quantidade</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((h) => (
              <tr key={h.id} className="border-b border-gray-100 dark:border-gray-700">
                <td>{h.nome}</td>
                <td>{h.descricao}</td>
                <td>R$ {h.preco_custo.toFixed(2).replace('.', ',')}</td>
                <td>{h.quantidade}</td>
                <td>{new Date(h.data_entrada).toLocaleDateString('pt-BR')}</td>
                <td className="flex gap-2">
                  <button
                    onClick={() => editarHistorico(h.id, 'descricao', prompt('Nova descrição:', h.descricao))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => excluirHistorico(h.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
