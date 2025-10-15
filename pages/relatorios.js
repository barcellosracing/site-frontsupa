import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function last12MonthsArray(){ const res=[]; const now=new Date(); for(let i=11;i>=0;i--){ const d=new Date(now.getFullYear(), now.getMonth()-i,1); const key = d.toISOString().slice(0,7); const label = d.toLocaleString('default',{month:'short', year:'numeric'}); res.push({key,label}) } return res }

export default function Relatorios(){
  const [revenueData,setRevenueData]=useState({labels:[], datasets:[]})
  const [expensesData,setExpensesData]=useState({labels:[], datasets:[]})
  const [profitData,setProfitData]=useState({labels:[], datasets:[]})
  const [summary,setSummary]=useState({revenue:0, expenses:0, profit:0})

  useEffect(()=>{ load() }, [])
  async function load(){
    const months = last12MonthsArray(); const keys = months.map(m=>m.key)
    const { data:budgets } = await supabase.from('budgets').select('created_at,total,status')
    const { data:investments } = await supabase.from('investments').select('created_at,amount')
    const mapRev = {}; const mapExp = {}
    keys.forEach(k=>{ mapRev[k]=0; mapExp[k]=0 })
    (budgets||[]).forEach(b=>{ if(b.status === 'closed'){ const m = b.created_at ? b.created_at.slice(0,7) : null; if(m && mapRev.hasOwnProperty(m)) mapRev[m] = mapRev[m] + parseFloat(b.total||0) } })
    (investments||[]).forEach(i=>{ const m = i.created_at ? i.created_at.slice(0,7) : null; if(m && mapExp.hasOwnProperty(m)) mapExp[m] = mapExp[m] + parseFloat(i.amount||0) })
    const revArr = keys.map(k=>mapRev[k]||0); const expArr = keys.map(k=>mapExp[k]||0); const profitArr = keys.map((k,idx)=> (revArr[idx] || 0) - (expArr[idx] || 0))

    setRevenueData({ labels: months.map(m=>m.label), datasets: [{ label: 'Receita', data: revArr, backgroundColor: 'rgba(34,197,94,0.95)' }] })
    setExpensesData({ labels: months.map(m=>m.label), datasets: [{ label: 'Despesas', data: expArr, backgroundColor: 'rgba(239,68,68,0.95)' }] })
    setProfitData({ labels: months.map(m=>m.label), datasets: [{ label: 'Lucro', data: profitArr, backgroundColor: 'rgba(59,130,246,0.95)' }] })

    const nowKey = new Date().toISOString().slice(0,7)
    const curRev = mapRev[nowKey] || 0
    const curExp = mapExp[nowKey] || 0
    setSummary({ revenue: curRev, expenses: curExp, profit: curRev - curExp })
  }

  const options = { responsive:true, plugins:{ legend:{ display:false }, tooltip:{ enabled:true } }, scales:{ y:{ beginAtZero:true } } }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Relatórios</h2>
      <div className="card mb-4"><div className="text-sm">Mês atual</div><div className="text-2xl font-bold">Receita: R$ {summary.revenue.toFixed(2)} • Despesas: R$ {summary.expenses.toFixed(2)} • Lucro: R$ {summary.profit.toFixed(2)}</div></div>
      <div className="grid gap-4">
        <div className="card"><div className="text-sm mb-2">Receita (últimos 12 meses)</div><div className="chart-wrap"><Bar data={revenueData} options={options} /></div></div>
        <div className="card"><div className="text-sm mb-2">Despesas (últimos 12 meses)</div><div className="chart-wrap"><Bar data={expensesData} options={options} /></div></div>
        <div className="card"><div className="text-sm mb-2">Lucro (últimos 12 meses)</div><div className="chart-wrap"><Bar data={profitData} options={options} /></div></div>
      </div>
    </div>
  )
}
