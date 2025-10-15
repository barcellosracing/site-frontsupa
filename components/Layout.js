import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Layout({children}){
  const [theme,setTheme]=useState('light')
  const [menuOpen,setMenuOpen]=useState(false)
  const [isAdmin,setIsAdmin]=useState(false)

  useEffect(()=>{
    const t = localStorage.getItem('theme') || 'light'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t==='dark' ? 'dark' : 'light')
    const a = localStorage.getItem('br_admin')
    if(a){ try{ const obj = JSON.parse(a); if(obj && obj.expires && Date.now() < obj.expires) setIsAdmin(true) }catch(e){} }
  },[])

  function toggleTheme(){
    const nt = theme==='dark' ? 'light' : 'dark'
    setTheme(nt)
    localStorage.setItem('theme', nt)
    document.documentElement.setAttribute('data-theme', nt==='dark' ? 'dark' : 'light')
  }

  function openMenu(){ setMenuOpen(true) }
  function closeMenu(){ setMenuOpen(false) }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-900 to-gray-800 text-white p-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="logo-circle mobile-trigger" style={{cursor:'pointer'}} onClick={openMenu}>BR</div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg">Barcellos Racing</div>
            </div>
          </div>

          <nav className="mobile-hide flex items-center gap-3">
            <Link href="/"><a>Dashboard</a></Link>
            <Link href="/clients"><a>Clientes</a></Link>
            <Link href="/products"><a>Produtos</a></Link>
            <Link href="/services"><a>Serviços</a></Link>
            <Link href="/quotes"><a>Orçamentos</a></Link>
            <Link href="/reports"><a>Relatórios</a></Link>
            <Link href="/investments"><a>Investimentos</a></Link>
            <button className="header-btn" onClick={toggleTheme}>Tema escuro</button>
            <Link href="/login"><a className="header-btn" style={{border:'1px solid rgba(255,255,255,0.12)', background:'transparent'}}>Entrar</a></Link>
          </nav>
        </div>
      </header>

      {menuOpen && <div className="overlay show" onClick={closeMenu}></div>}
      <div className={"drawer " + (menuOpen ? "open" : "")}>
        <div className="flex items-center justify-between mb-4">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div className="logo-circle">BR</div>
            <div>
              <div className="font-bold">Barcellos Racing</div>
            </div>
          </div>
          <button onClick={closeMenu} className="p-2">Fechar</button>
        </div>

        <nav className="flex flex-col gap-2">
          <Link href="/"><a onClick={closeMenu}>Dashboard</a></Link>
          <Link href="/clients"><a onClick={closeMenu}>Clientes</a></Link>
          <Link href="/products"><a onClick={closeMenu}>Produtos</a></Link>
          <Link href="/services"><a onClick={closeMenu}>Serviços</a></Link>
          <Link href="/quotes"><a onClick={closeMenu}>Orçamentos</a></Link>
          <Link href="/reports"><a onClick={closeMenu}>Relatórios</a></Link>
          <Link href="/investments"><a onClick={closeMenu}>Investimentos</a></Link>
          <button className="header-btn mt-4" onClick={()=>{ toggleTheme(); }}>Tema escuro</button>
          <Link href="/login"><a className="mt-2 header-btn" onClick={closeMenu} style={{border:'1px solid rgba(0,0,0,0.06)', background:'transparent'}}>Entrar</a></Link>
        </nav>
      </div>

      <main className="container p-4 flex-1">{children}</main>

      <footer className="text-center p-4 text-sm text-gray-500">
        © {new Date().getFullYear()} Barcellos Racing — Design industrial • Feito pra celular
      </footer>
    </div>
  )
}
