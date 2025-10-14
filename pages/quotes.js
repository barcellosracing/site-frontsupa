import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Quotes(){
  const [quotes,setQuotes]=useState([])
  const [clients,setClients]=useState([])
  const [clientId,setClientId]=useState(''); const [items,setItems]=useState(''); const [total,setTotal]=useState('')
  const printRef = useRef()

  useEffect(()=>{ fetch() }, [])

  async function fetch(){
    const { data } = await supabase.from('quotes').select('*,clients(*)').order('id',{ascending:false})
    setQuotes(data||[])
    const { data:clients } = await supabase.from('clients').select('*')
    setClients(clients||[])
  }

  async function add(e){
    e.preventDefault()
    await supabase.from('quotes').insert([{ client_id: parseInt(clientId), items, total: parseFloat(total) }])
    setClientId(''); setItems(''); setTotal(''); fetch()
  }

  async function exportPDF(quote){
    // render quote element to canvas then to PDF
    const el = document.createElement('div')
    el.style.width = '800px'
    el.innerHTML = `<div style="padding:20px;font-family:Arial"><h2>Orçamento</h2><div>Cliente: ${quote.clients?.name}</div><div>Itens: ${quote.items}</div><div>Total: R$ ${quote.total}</div></div>`
    document.body.appendChild(el)
    const canvas = await html2canvas(el)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p','pt','a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`orcamento_${quote.id}.pdf`)
    document.body.removeChild(el)
  }

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Orçamentos</h2>
      <form onSubmit={add} className='mb-4 grid gap-2 sm:grid-cols-4'>
        <select className='p-2 border rounded' value={clientId} onChange={e=>setClientId(e.target.value)}>
          <option value=''>Selecione cliente</option>
          {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className='p-2 border rounded' placeholder='Itens (descrição)' value={items} onChange={e=>setItems(e.target.value)} />
        <input className='p-2 border rounded' placeholder='Total' value={total} onChange={e=>setTotal(e.target.value)} />
        <button className='p-2 rounded bg-accent text-black'>Salvar</button>
      </form>

      <div className='grid gap-3'>
        {quotes.map(q=>(
          <div key={q.id} className='card'>
            <div className='font-medium text-gray-800'>Cliente: {q.clients?.name}</div>
            <div className='text-sm text-gray-500'>Itens: {q.items}</div>
            <div className='text-sm text-gray-500'>Total: R$ {q.total}</div>
            <div className='mt-2'>
              <button className='mr-2 text-sm' onClick={()=>exportPDF(q)}>Gerar PDF</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
