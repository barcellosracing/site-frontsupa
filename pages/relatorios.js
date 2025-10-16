import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function last12MonthsArray(){
  const res = []
  const now = new Date()
  for (let i = 11; i >= 0; i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleString(undefined, { month: 'short', year: 'numeric' })
    res.push({ key, label })
  }
  return res
}

export default function Relatorios(){
  const [revenueData,setRevenueData]=useState({labels:[], datasets:[]})
  const [expensesData,setExpensesData]=useState({labels:[], datasets:[]})
  const [profitData,setProfitData]=useState({labels:[], datasets:[]})
  const [summary,setSummary]=useState({revenue:0, expenses:0, profit:0})
  const [loading,setLoading]=useState(false)
  const months = last12MonthsArray()

  useEffect(()=>{ load() }, [])

  async function load(){
    try{
      setLoading(true)
      // fetch closed budgets (orcamentos) and investments
      const { data: budgets, error: bError } = await supabase
        .from('orcamentos')
        .select('id,valor,status,created_at')
        .eq('status', 'fechado') // adjust if your status uses different casing
      if (bError) console.error('supabase budgets error', bError)

      const { data: investments, error: iError } = await supabase
        .from('investments')
        .select('id,amount,category,created_at')
      if (iError) console.error('supabase investments error', iError)

      // prepare mapping month->value
      const revenueMap = {}
      const expenseMap = {}
      months.forEach(m => { revenueMap[m.key]=0; expenseMap[m.key]=0 })

      if (Array.isArray(budgets)){
        budgets.forEach(b=>{
          let dateKey = ''
          if (b.created_at) dateKey = b.created_at.slice(0,7)
          // try other fields if needed
          if (!dateKey && b.created_at) {
            const d = new Date(b.created_at)
            dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
          }
          const val = Number(b.valor ?? b.value ?? 0)
          if (dateKey in revenueMap) revenueMap[dateKey] += isNaN(val) ? 0 : val
        })
      }

      if (Array.isArray(investments)){
        investments.forEach(inv=>{
          let dateKey = ''
          if (inv.created_at) dateKey = inv.created_at.slice(0,7)
          if (!dateKey && inv.created_at) {
            const d = new Date(inv.created_at)
            dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
          }
          const val = Number(inv.amount ?? inv.value ?? inv.valor ?? 0)
          if (dateKey in expenseMap) expenseMap[dateKey] += isNaN(val) ? 0 : val
        })
      }

      const labels = months.map(m=>m.label)
      const revenueArr = months.map(m=>Number((revenueMap[m.key]||0).toFixed(2)))
      const expenseArr = months.map(m=>Number((expenseMap[m.key]||0).toFixed(2)))
      const profitArr = revenueArr.map((r,idx)=>Number((r - expenseArr[idx]).toFixed(2)))

      setRevenueData({
        labels,
        datasets: [{ label: 'Receita (R$)', data: revenueArr }]
      })
      setExpensesData({
        labels,
        datasets: [{ label: 'Despesa (R$)', data: expenseArr }]
      })
      setProfitData({
        labels,
        datasets: [{ label: 'Lucro (R$)', data: profitArr }]
      })

      const totalRevenue = revenueArr.reduce((a,b)=>a+b,0)
      const totalExpenses = expenseArr.reduce((a,b)=>a+b,0)
      setSummary({ revenue: totalRevenue, expenses: totalExpenses, profit: totalRevenue - totalExpenses })
    }catch(e){
      console.error('Relatorios.load error', e)
    }finally{
      setLoading(false)
    }
  }

  const options = { responsive:true, plugins:{ legend:{ display:true }, tooltip:{ enabled:true } }, scales:{ y:{ beginAtZero:true } } }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Relatórios</h2>
      <div className="card mb-4">
        <div className="text-sm">
          Mês atual: {months[months.length-1].label} • Receita: R$ {summary.revenue.toFixed(2)} • Despesa: R$ {summary.expenses.toFixed(2)} • Lucro: R$ {summary.profit.toFixed(2)}
        </div>
      </div>
      <div className="grid gap-4">
        <div className="card"><div className="text-sm mb-2">Receitas (últimos 12 meses)</div><div className="chart-wrap"><Bar data={revenueData} options={options} /></div></div>
        <div className="card"><div className="text-sm mb-2">Despesas (últimos 12 meses)</div><div className="chart-wrap"><Bar data={expensesData} options={options} /></div></div>
        <div className="card"><div className="text-sm mb-2">Lucro (últimos 12 meses)</div><div className="chart-wrap"><Bar data={profitData} options={options} /></div></div>
      </div>
      {loading ? <div className="mt-4 text-sm">Carregando...</div> : null}
    </div>
  )
}