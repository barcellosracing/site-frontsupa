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

  // 🔹 Carregar dados ao abrir a página
  useEffect(() => {
    carregarProdutos()
    carregarHistorico()
  }, [])

  // 🔹 Buscar produtos
  const carregarProdutos = async () => {
    const { data, error } = await supabase
      .from('estoque_produtos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) console.error('Erro ao buscar produtos:', error)
    setProdutos(data || [])
  }

  // 🔹 Buscar histórico
  const carregarHistorico = async () => {
    const { data, error } = await supabase
      .from('estoque_historico')
      .select('*')
      .order('data_entrada', { ascending: false })

    if (error) console.error('Erro ao buscar histórico:', error)
    setHistorico(data || [])
  }

  // 🔹 Adicionar nova entrada
  const adicionarEntrada = async (e) => {
    e.preventDefault()

    const preco = parseFloat(formData.preco_custo.replace(',', '.')) || 0
    const qtd = parseInt(formData.quantidade) || 0
    let produtoId = formData.produto_existente

    try {
      // Se o produto já existir → atualiza
      if (produtoId) {
        const produtoExistente = produtos.find((p) => p.id === produtoId)
        const novoTotal = (produtoExistente?.quantidade || 0) + qtd
        const novoCustoMedio =
          ((produtoExistente?.preco_custo || 0) * (produtoExistente?.quantidade || 0) + preco * qtd) /
          novoTotal

        await supabase
          .from('estoque_produtos')
          .update({ quantidade: novoTotal, preco_custo: novoCustoMedio })
          .eq('id', produtoId)
      } else {
        // Se for novo produto → insere
        const { data: novoProduto, error: insertError } = await supabase
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

        if (insertError) throw insertError
        produtoId = novoProduto?.[0]?.id
      }

      // Sempre registra no histórico
      const { error: histError } = await supabase
        .from('estoque_historico')
        .insert([
          {
            produto_id: produtoId,
            nome: formData.nome,
            descricao: formData.descricao,
            preco_custo: preco,
            quantidade: qtd
          }
        ])
      if (histError) throw histError

      // Resetar formulário
      setFormData({
        nome: '',
        descricao: '',
        preco_custo: '',
        quantidade: '',
        produto_existente: ''
      })
      setShowForm(false)
      carregarProdutos()
      carregarHistorico()
    } catch (err) {
      console.error('Erro ao adicionar entrada:', err)
    }
  }

  // 🔹 Excluir histórico
  const excluirHistorico = async (id) => {
    await supabase.from('estoque_historico').delete().eq('id', id)
    carregarHistorico()
  }

  // 🔹 Atualizar margem de lucro
  const atualizarMargem = async (id, valor) => {
    const num = parseFloat(valor)
    if (isNaN(num)) return
    await supabase.from('estoque_produtos').update({ margem_lucro: num }).eq('id', id)
    carregarProdutos()
  }

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen text-gray-100">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Estoque</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Nova Entrada</h2>
          <form onSubmit={adicionarEntrada} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.produto_existente}
              onChange={(e) => setFormData({ ...formData, produto_existente: e.target.value })}
              className="p-2 rounded-md bg-gray-900 border border-gray-700"
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
              className="p-2 rounded-md bg-gray-900 border border-gray-700"
              required={!formData.produto_existente}
            />

            <input
              type="text"
              placeholder="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="p-2 rounded-md bg-gray-900 border border-gray-700"
            />

            <input
              type="text"
              placeholder="Preço de custo (ex: 10,50)"
              value={formData.preco_custo}
              onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
              className="p-2 rounded-md bg-gray-900 border border-gray-700"
              required
            />

            <input
              type="number"
              placeholder="Quantidade"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
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
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-6 mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Produtos no Estoque</h2>
        {produtos.length === 0 ? (
          <p className="text-gray-400">Nenhum produto cadastrado ainda.</p>
        ) : (
          <table className="min-w-full text-left text-sm md:text-base">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="py-2 px-2">Nome</th>
                <th className="px-2">Descrição</th>
                <th className="px-2">Custo Médio</th>
                <th className="px-2">Qtd</th>
                <th className="px-2">Margem Lucro (%)</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-700 transition">
                  <td className="py-2 px-2">{p.nome}</td>
                  <td className="px-2">{p.descricao || '-'}</td>
                  <td className="px-2">R$ {Number(p.preco_custo || 0).toFixed(2).replace('.', ',')}</td>
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
        )}
      </div>

      {/* Histórico */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Histórico de Entradas</h2>
        {historico.length === 0 ? (
          <p className="text-gray-400">Nenhuma entrada registrada.</p>
        ) : (
          <table className="min-w-full text-left text-sm md:text-base">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="py-2 px-2">Nome</th>
                <th className="px-2">Descrição</th>
                <th className="px-2">Custo</th>
                <th className="px-2">Qtd</th>
                <th className="px-2">Data</th>
                <th className="px-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id} className="border-b border-gray-800 hover:bg-gray-700 transition">
                  <td className="py-2 px-2">{h.nome}</td>
                  <td className="px-2">{h.descricao || '-'}</td>
                  <td className="px-2">R$ {Number(h.preco_custo).toFixed(2).replace('.', ',')}</td>
                  <td className="px-2">{h.quantidade}</td>
                  <td className="px-2">{new Date(h.data_entrada).toLocaleDateString('pt-BR')}</td>
                  <td className="px-2 flex gap-2">
                    <button
                      onClick={async () => {
                        const novaDesc = prompt('Nova descrição:', h.descricao || '')
                        if (novaDesc !== null) {
                          await supabase
                            .from('estoque_historico')
                            .update({ descricao: novaDesc })
                            .eq('id', h.id)
                          carregarHistorico()
                        }
                      }}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => excluirHistorico(h.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
