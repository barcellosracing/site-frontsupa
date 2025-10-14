import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Layout({children}) {
  const [theme, setTheme] = useState('light')
  useEffect(()=> {
    const t = localStorage.getItem('theme') || 'light'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t==='dark' ? 'dark' : 'light')
  },[])
  function toggle(){
    const nt = theme==='dark' ? 'light' : 'dark'
    setTheme(nt)
    localStorage.setItem('theme', nt)
    document.documentElement.setAttribute('data-theme', nt==='dark' ? 'dark' : 'light')
  }
  return (
    <div className='min-h-screen flex flex-col'>
      <header className='bg-gradient-to-r from-ind-800 to-ind-700 text-white p-4'>
        <div className='container flex justify-between items-center'>
          <div className='header-brand'>
            <div className='logo-circle'>OM</div>
            <div>
              <div className='font-bold text-lg'>Oficina Moto</div>
              <div className='text-sm text-gray-300'>Gestão & Orçamentos</div>
            </div>
          </div>

          <nav className='flex items-center gap-3'>
            <Link href='/'><a className='hidden sm:inline'>Dashboard</a></Link>
            <Link href='/clients'><a className='hidden sm:inline'>Clientes</a></Link>
            <Link href='/products'><a className='hidden sm:inline'>Produtos</a></Link>
            <Link href='/services'><a className='hidden sm:inline'>Serviços</a></Link>
            <Link href='/quotes'><a className='hidden sm:inline'>Orçamentos</a></Link>
            <Link href='/reports'><a className='hidden sm:inline'>Relatórios</a></Link>
            <button onClick={toggle} className='ml-3 p-2 rounded bg-accent text-black text-sm'>Tema</button>
            <Link href='/login'><a className='ml-2 p-2 rounded border border-white/20 text-sm'>Entrar</a></Link>
          </nav>
        </div>
      </header>

      <main className='container p-4 flex-1'>
        {children}
      </main>

      <footer className='text-center p-4 text-sm text-gray-500'>
        © {new Date().getFullYear()} Oficina Moto — Design industrial • Feito pra celular
      </footer>
    </div>
  )
}
