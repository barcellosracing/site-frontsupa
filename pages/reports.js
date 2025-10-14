import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function Reports(){
  const [data, setData] = useState({labels:[], datasets:[]})

  useEffect(()=>{ load() }, [])

  async function load(){
    // simple revenue per month aggregation via SQL
    const sql = `select to_char(created_at, 'YYYY-MM') as month, sum(total)::float as revenue from quotes group by month order by month`
    const { data: rows, error } = await supabase.rpc('sql', { q: sql })
    // supabase.rpc('sql') may not exist; fallback to select from quotes and aggregate client-side
    const { data: quotes } = await supabase.from('quotes').select('created_at,total')
    const map = {}
    (quotes||[]).forEach(q=>{
      const m = q.created_at ? q.created_at.slice(0,7) : 'unknown'
      map[m] = (map[m] || 0) + parseFloat(q.total || 0)
    })
    const labels = Object.keys(map).sort()
    const values = labels.map(l=>map[l])
    setData({
      labels,
      datasets: [{ label:'Receita', data: values }]
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
