import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Home(){
  const [summary, setSummary] = useState({clients:0, products:0, services:0, quotes:0})

  useEffect(()=>{ load() }, [])

  async function load(){
    const [{data:clients},{data:products},{data:services},{data:quotes}] = await Promise.all([
      supabase.from('clients').select('id'),
      supabase.from('products').select('id'),
      supabase.from('services').select('id'),
      supabase.from('quotes').select('id'),
    ])
    setSummary({
      clients: clients?.length || 0,
      products: products?.length || 0,
      services: services?.length || 0,
      quotes: quotes?.length || 0,
    })
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Dashboard</h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='card'>
          <div className='text-sm text-gray-500'>Clientes</div>
          <div className='text-2xl font-bold'>{summary.clients}</div>
          <Link href='/clients'><a className='text-sm text-accent'>Ver clientes →</a></Link>
        </div>
        <div className='card'>
          <div className='text-sm text-gray-500'>Produtos</div>
          <div className='text-2xl font-bold'>{summary.products}</div>
          <Link href='/products'><a className='text-sm text-accent'>Ver produtos →</a></Link>
        </div>
        <div className='card'>
          <div className='text-sm text-gray-500'>Serviços</div>
          <div className='text-2xl font-bold'>{summary.services}</div>
          <Link href='/services'><a className='text-sm text-accent'>Ver serviços →</a></Link>
        </div>
        <div className='card'>
          <div className='text-sm text-gray-500'>Orçamentos</div>
          <div className='text-2xl font-bold'>{summary.quotes}</div>
          <Link href='/quotes'><a className='text-sm text-accent'>Ver orçamentos →</a></Link>
        </div>
      </div>
    </div>
  )
}
