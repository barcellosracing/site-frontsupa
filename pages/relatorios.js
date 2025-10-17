import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Gera os últimos 12 meses
function ultimos12Meses() {
  const res = []
  const agora = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
    res.push({ key, label })
  }
  return res
}

export default function Relatorios() {
  const [dadosReceita, setDadosReceita] = useState({ labels: [], datasets: [] })
  const [dadosDespesa, setDadosDespesa] = useState({ labels: [], datasets: [] })
  const [dadosLucro, setDadosLucro] = useState({ labels: [], datasets: [] })
  const [resumo, setResumo] = useState({ receita: 0, despesa: 0, lucro: 0 })
  const [carregando, setCarregando] = useState(false)

  const meses = ultimos12Meses()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      setCarregando(true)

      // Busca os orçamentos fechados (receitas)
      const { data: orcamentos, error: erroOrc } = await supabase
        .from('orcamentos')
        .select('id, valor, status, created_at')
        .eq('status', 'fechado') // padronizado em português

      if (erroOrc) console.error('Erro ao buscar orçamentos:', erroOrc)

      // Busca os investimentos (despesas)
      const { data: investimentos, error: erroInv } = await supabase
        .from('investments')
        .select('id, amount, category, created_at')

      if (erroInv) console.error('Erro ao buscar investimentos:', erroInv)

      // Mapeia os meses
      const receitaMes = {}
      const despesaMes = {}
      meses.forEach(m => { receitaMes[m.key] = 0; despesaMes[m.key] = 0 })

      // Soma receitas por mês
      if (Array.isArray(orcamentos)) {
        orcamentos.forEach(o => {
          const data = new Date(o.created_at)
          const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
          if (receitaMes[key] !== undefined) {
            receitaMes[key] += o.valor || 0
          }
        })
      }

      // Soma despesas por mês
      if (Array.isArray(investimentos)) {
        investimentos.forEach(inv => {
          const data = new Date(inv.created_at)
          const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
          if (despesaMes[key] !== undefined) {
            despesaMes[key] += inv.amount || 0
          }
        })
      }

      // Gera dados para os gráficos
      const receitas = meses.map(m => receitaMes[m.key])
      const despesas = meses.map(m => despesaMes[m.key])
      const lucros = meses.map((_, i) => receitas[i] - despesas[i])

      const totalReceita = receitas.reduce((a, b) => a + b, 0)
      const totalDespesa = despesas.reduce((a, b) => a + b, 0)
      const totalLucro = totalReceita - totalDespesa

      setResumo({
        receita: totalReceita,
        despesa: totalDespesa,
        lucro: totalLucro
      })

      setDadosReceita({
        labels: meses.map(m => m.label),
        datasets: [
          {
            label: 'Receita (Orçamentos Fechados)',
            data: receitas,
            backgroundColor: 'rgba(34, 197, 94, 0.6)'
          }
        ]
      })

      setDadosDespesa({
        labels: meses.map(m => m.label),
        datasets: [
          {
            label: 'Despesas (Investimentos)',
            data: despesas,
            backgroundColor: 'rgba(239, 68, 68, 0.6)'
          }
        ]
      })

      setDadosLucro({
        labels: meses.map(m => m.label),
        datasets: [
          {
            label: 'Lucro',
            data: lucros,
            backgroundColor: 'rgba(59, 130, 246, 0.6)'
          }
        ]
      })

    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Relatórios Financeiros</h1>

      {carregando ? (
        <p>Carregando dados...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-100 p-4 rounded-lg shadow text-center">
              <h2 className="text-lg font-semibold text-green-700">Receita Total</h2>
              <p className="text-2xl font-bold text-green-800">
                R${resumo.receita.toFixed(2)}
              </p>
            </div>

            <div className="bg-red-100 p-4 rounded-lg shadow text-center">
              <h2 className="text-lg font-semibold text-red-700">Despesas Totais</h2>
              <p className="text-2xl font-bold text-red-800">
                R${resumo.despesa.toFixed(2)}
              </p>
            </div>

            <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
              <h2 className="text-lg font-semibold text-blue-700">Lucro Total</h2>
              <p className="text-2xl font-bold text-blue-800">
                R${resumo.lucro.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <Bar data={dadosReceita} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <Bar data={dadosDespesa} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <Bar data={dadosLucro} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
