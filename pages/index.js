import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home(){
  const [summary, setSummary] = useState({clients:0, products:0, services:0, quotes:0, investments:0})
  const [investTotal, setInvestTotal] = useState(0)
  useEffect(()=>{ load() }, [])
  async function load(){
    const [{data:clients},{data:products},{data:services},{data:budgets},{data:investments}] = await Promise.all([
      supabase.from('clients').select('id'),
      supabase.from('products').select('id'),
      supabase.from('services').select('id'),
      supabase.from('budgets').select('id'),
      supabase.from('investments').select('amount'),
    ])
    setSummary({ clients: clients?.length || 0, products: products?.length || 0, services: services?.length || 0, quotes: budgets?.length || 0, investments: investments?.length || 0 })
    const total = (investments || []).reduce((s,i)=> s + parseFloat(i.amount||0), 0)
    setInvestTotal(total)
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-4"><div className="logo-circle">BR</div><div><div className="brand-name">Barcellos Racing</div><div className="small-muted">Oficina • Gestão de motos</div></div></div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><div className="text-sm">Clientes</div><div className="text-2xl font-bold">{summary.clients}</div><Link href="/clients"><a className="text-sm">Ver clientes →</a></Link></div>
        <div className="card"><div className="text-sm">Produtos</div><div className="text-2xl font-bold">{summary.products}</div><Link href="/products"><a className="text-sm">Ver produtos →</a></Link></div>
        <div className="card"><div className="text-sm">Serviços</div><div className="text-2xl font-bold">{summary.services}</div><Link href="/services"><a className="text-sm">Ver serviços →</a></Link></div>
        <div className="card"><div className="text-sm">Orçamentos</div><div className="text-2xl font-bold">{summary.quotes}</div><Link href="/orcamentos"><a className="text-sm">Ver orçamentos →</a></Link></div>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="card"><div className="text-sm">Investimentos / Despesas (mês atual)</div><div className="text-2xl font-bold">R$ {investTotal.toFixed(2)}</div><Link href="/investments"><a className="text-sm">Gerenciar investimentos →</a></Link></div></div>
    </div>
  )
}
