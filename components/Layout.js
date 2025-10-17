import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Layout({children}){
  const [theme,setTheme]=useState('dark')
  const [menuOpen,setMenuOpen]=useState(false)

  useEffect(()=>{
    if (typeof window !== 'undefined'){
      const t = localStorage.getItem('theme') || 'dark'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t==='dark' ? 'dark' : 'light')
    }
  },[])

  function toggleTheme(){
    const nt = theme==='dark' ? 'light' : 'dark'
    setTheme(nt)
    if (typeof window !== 'undefined') localStorage.setItem('theme', nt)
    document.documentElement.setAttribute('data-theme', nt==='dark' ? 'dark' : 'light')
  }

  function openMenu(){ setMenuOpen(true) }
  function closeMenu(){ setMenuOpen(false) }
  function navAndClose(){ if(menuOpen) setMenuOpen(false) }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div className="logo-circle mobile-trigger" style={{cursor:'pointer'}} onClick={openMenu}>BR</div>
              <div className="brand-name">Barcellos Racing</div>
            </div>
          </div>

          <nav className="mobile-hide flex items-center gap-3">
            <Link href="/"><a className="tab-btn">Dashboard</a></Link>
            <Link href="/clients"><a className="tab-btn">Clientes</a></Link>
            <Link href="/products"><a className="tab-btn">Produtos</a></Link>
            <Link href="/services"><a className="tab-btn">Serviços</a></Link>
            <Link href="/orcamentos"><a className="tab-btn">Orçamentos</a></Link>
            <Link href="/relatorios"><a className="tab-btn">Relatórios</a></Link>
            <Link href="/investments"><a className="tab-btn">Investimentos / Despesas</a></Link>
            <button className="header-btn" onClick={toggleTheme}>Tema escuro</button>
            <Link href="/login"><a className="header-btn">Entrar</a></Link>
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
              <div className="small-muted">Gestão • Oficina</div>
            </div>
          </div>
          <button onClick={closeMenu} className="p-2">Fechar</button>
        </div>

        <nav className="flex flex-col gap-2">
          <Link href="/"><a className="menu-item" onClick={navAndClose}>Dashboard</a></Link>
          <Link href="/clients"><a className="menu-item" onClick={navAndClose}>Clientes</a></Link>
          <Link href="/products"><a className="menu-item" onClick={navAndClose}>Produtos</a></Link>
          <Link href="/services"><a className="menu-item" onClick={navAndClose}>Serviços</a></Link>
          <Link href="/orcamentos"><a className="menu-item" onClick={navAndClose}>Orçamentos</a></Link>
          <Link href="/relatorios"><a className="menu-item" onClick={navAndClose}>Relatórios</a></Link>
          <Link href="/investments"><a className="menu-item" onClick={navAndClose}>Investimentos / Despesas</a></Link>
          <div style={{marginTop:12, display:'flex', gap:8}}>
            <button className="header-btn" onClick={()=>{ toggleTheme(); closeMenu(); }}>Tema escuro</button>
            <Link href="/login"><a className="header-btn" onClick={navAndClose}>Entrar</a></Link>
          </div>
        </nav>
      </div>

      <main className="container p-4 flex-1">{children}</main>

      <footer className="text-center p-4 text-sm small-muted">© {new Date().getFullYear()} Barcellos Racing — Visual industrial • Feito para celular</footer>
    </div>
  )
}
