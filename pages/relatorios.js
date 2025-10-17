import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function gerarUltimos12Meses() {
  const res = []
  const agora = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    res.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
    })
  }
  return res
}

export default function Relatorios() {
  const [orcamentos, setOrcamentos] = useState([])
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(false)

  const meses = gerarUltimos12Meses()
  const mesAtual = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const [{ data: o }, { data: oi }] = await Promise.all([
        supabase.from('orcamentos').select('*').eq('status', 'fechado'),
        supabase.from('orcamento_itens').select('*'),
      ])
      setOrcamentos(o || [])
      setItens(oi || [])
    } catch (e) {
      console.error('Erro ao buscar dados:', e)
    } finally {
      setLoading(false)
    }
  }

  // 🧮 Totais do mês atual (apenas orçamentos "fechados")
  const orcamentosMes = orcamentos.filter(o => o.created_at?.slice(0, 7) === mesAtual)
  const totalOrcamentosMes = orcamentosMes.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0)

  const itensMes = itens.filter(i => i.created_at?.slice(0, 7) === mesAtual)
  const totalProdutosMes = itensMes
    .filter(i => i.item_tipo === 'product')
    .reduce((acc, i) => acc + (parseFloat(i.valor) || 0) * (parseInt(i.quantidade) || 1), 0)
  const totalServicosMes = itensMes
    .filter(i => i.item_tipo === 'service')
    .reduce((acc, i) => acc + (parseFloat(i.valor) || 0) * (parseInt(i.quantidade) || 1), 0)

  // 📊 Dados do gráfico (apenas orçamentos "fechados")
  const dadosGrafico = meses.map(m => {
    const mesItens = itens.filter(i => i.created_at?.slice(0, 7) === m.key)
    const totalP = mesItens
      .filter(i => i.item_tipo === 'product')
      .reduce((acc, i) => acc + (parseFloat(i.valor) || 0) * (parseInt(i.quantidade) || 1), 0)
    const totalS = mesItens
      .filter(i => i.item_tipo === 'service')
      .reduce((acc, i) => acc + (parseFloat(i.valor) || 0) * (parseInt(i.quantidade) || 1), 0)
    const totalO = orcamentos
      .filter(o => o.created_at?.slice(0, 7) === m.key)
      .reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0)
    return {
      mes: m.label,
      produtos: totalP,
      servicos: totalS,
      orcamentos: totalO,
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Relatórios</h2>
        {isAdmin() && <span className="text-sm text-gray-500">Modo Administrador</span>}
      </div>

      {loading ? (
        <div>Carregando dados...</div>
      ) : (
        <>
          {/* 🧾 Cards de totais do mês */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="card p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Produtos (mês atual)</div>
              <div className="text-xl font-semibold text-green-600">
                R$ {totalProdutosMes.toFixed(2)}
              </div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Serviços (mês atual)</div>
              <div className="text-xl font-semibold text-blue-600">
                R$ {totalServicosMes.toFixed(2)}
              </div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Orçamentos Fechados (mês atual)</div>
              <div className="text-xl font-semibold text-purple-600">
                R$ {totalOrcamentosMes.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 📈 Gráfico */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">
              Desempenho (apenas orçamentos fechados)
            </h3>
            <div className="w-full h-72">
              <ResponsiveContainer>
                <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="produtos" fill="#16a34a" name="Produtos" />
                  <Bar dataKey="servicos" fill="#2563eb" name="Serviços" />
                  <Bar dataKey="orcamentos" fill="#9333ea" name="Orçamentos Fechados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
