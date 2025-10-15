import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const [theme, setTheme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Fecha o menu ao navegar
  useEffect(() => {
    const handleRouteChange = () => setMenuOpen(false);
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router.events]);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.body.classList.add('dark');
    } else {
      setTheme('light');
      document.body.classList.remove('dark');
    }
  };

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-primary text-secondary shadow-md">
        <div className="flex items-center space-x-2">
          <button onClick={openMenu} className="font-bold text-lg">BR</button>
          <span className="text-xl font-bold">Barcellos Racing</span>
        </div>
        <button
          onClick={toggleTheme}
          className="bg-secondary text-primary px-4 py-2 rounded-md shadow hover:opacity-80"
        >
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </button>
      </header>

      {/* Menu lateral */}
      <aside className={`fixed top-0 right-0 h-full w-64 bg-primary text-secondary transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 z-50 shadow-lg`}>
        <nav className="flex flex-col p-4 space-y-2">
          <button className="sidebar-button bg-secondary text-primary" onClick={() => router.push('/')}>Início</button>
          <button className="sidebar-button bg-secondary text-primary" onClick={() => router.push('/clientes')}>Clientes</button>
          <button className="sidebar-button bg-secondary text-primary" onClick={() => router.push('/produtos')}>Produtos</button>
          <button className="sidebar-button bg-secondary text-primary" onClick={() => router.push('/servicos')}>Serviços</button>
          <button className="sidebar-button bg-secondary text-primary" onClick={() => router.push('/orcamentos')}>Orçamentos</button>
          <button className="sidebar-button bg-secondary text-primary" onClick={() => router.push('/investimentos')}>Investimentos / Despesas</button>
          <button className="sidebar-button bg-secondary text-primary" onClick={() => router.push('/relatorios')}>Relatórios</button>
        </nav>
        <button className="absolute top-4 right-4 text-xl" onClick={closeMenu}>×</button>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}
