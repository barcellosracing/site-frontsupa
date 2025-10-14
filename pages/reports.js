import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function Reports(){
  const [data, setData] = useState({labels:[], datasets:[]})

  useEffect(()=>{ load() }, [])

  async function load(){
    const { data: quotes } = await supabase.from('quotes').select('created_at,total')
    const { data: investments } = await supabase.from('investments').select('created_at,amount')

    const mapRevenue = {}
    (quotes||[]).forEach(q=>{
      const m = q.created_at ? q.created_at.slice(0,7) : 'unknown'
      mapRevenue[m] = (mapRevenue[m] || 0) + parseFloat(q.total || 0)
    })

    const mapInvest = {}
    (investments||[]).forEach(i=>{
      const m = i.created_at ? i.created_at.slice(0,7) : 'unknown'
      mapInvest[m] = (mapInvest[m] || 0) + parseFloat(i.amount || 0)
    })

    const months = Array.from(new Set([...Object.keys(mapRevenue), ...Object.keys(mapInvest)])).sort()
    const revenues = months.map(m=>mapRevenue[m] || 0)
    const invests = months.map(m=>mapInvest[m] || 0)
    const profits = months.map((m,idx)=> (revenues[idx] || 0) - (invests[idx] || 0))

    setData({
      labels: months,
      datasets: [
        { label: 'Receita', data: revenues },
        { label: 'Despesas', data: invests },
        { label: 'Lucro', data: profits }
      ]
    })
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Relatórios</h2>
      <div className='card'>
        <Bar data={data} />
      </div>
    </div>
  )
}
