import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'

export default function Layout({children}){
  const [theme,setTheme]=useState('light')
  const [isAdmin,setIsAdmin]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const menuRef = useRef()
  useEffect(()=>{
    const t = localStorage.getItem('theme')||'light'; setTheme(t); document.documentElement.setAttribute('data-theme', t==='dark'?'dark':'light')
    const a = localStorage.getItem('br_admin'); if(a){ try{ const obj = JSON.parse(a); if(obj && obj.expires && Date.now() < obj.expires) setIsAdmin(true) }catch(e){} }
    const onDoc=(e)=>{ if(menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('click', onDoc); return ()=> document.removeEventListener('click', onDoc)
  },[])
  function toggleTheme(){ const nt = theme==='dark'?'light':'dark'; setTheme(nt); localStorage.setItem('theme', nt); document.documentElement.setAttribute('data-theme', nt==='dark'?'dark':'light') }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-900 to-gray-800 text-white p-4 relative">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="logo-circle mobile-trigger" style={{cursor:'pointer'}} onClick={()=>setMenuOpen(!menuOpen)}>BR</div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg">Barcellos Racing</div>
              <div className="text-sm text-gray-300">Gestão & Orçamentos</div>
            </div>
          </div>
          <nav className="flex items-center gap-3 desktop-nav">
            <Link href="/"><a>Dashboard</a></Link>
            <Link href="/clients"><a>Clientes</a></Link>
            <Link href="/products"><a>Produtos</a></Link>
            <Link href="/services"><a>Serviços</a></Link>
            <Link href="/quotes"><a>Orçamentos</a></Link>
            <Link href="/reports"><a>Relatórios</a></Link>
            <Link href="/investments"><a>Investimentos</a></Link>
            <button className="btn ml-2" onClick={toggleTheme}>Tema</button>
            <Link href="/login"><a className="ml-2 p-2 border rounded text-sm">Entrar</a></Link>
          </nav>
        </div>
        {menuOpen && (
          <div className="mobile-menu" ref={menuRef}>
            <Link href="/"><a>Dashboard</a></Link>
            <Link href="/clients"><a>Clientes</a></Link>
            <Link href="/products"><a>Produtos</a></Link>
            <Link href="/services"><a>Serviços</a></Link>
            <Link href="/quotes"><a>Orçamentos</a></Link>
            <Link href="/reports"><a>Relatórios</a></Link>
            <Link href="/investments"><a>Investimentos</a></Link>
            <Link href="/login"><a>Entrar</a></Link>
          </div>
        )}
      </header>
      <main className="container p-4 flex-1">{children}</main>
      <footer className="text-center p-4 text-sm text-gray-500">© {new Date().getFullYear()} Barcellos Racing</footer>
    </div>
  )
}
