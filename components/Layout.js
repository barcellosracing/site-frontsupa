import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Layout({ children }) {
  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("theme") || "dark";
      setTheme(t);
      document.documentElement.setAttribute(
        "data-theme",
        t === "dark" ? "dark" : "light"
      );
    }
  }, []);

  function toggleTheme() {
    const nt = theme === "dark" ? "light" : "dark";
    setTheme(nt);
    if (typeof window !== "undefined") localStorage.setItem("theme", nt);
    document.documentElement.setAttribute(
      "data-theme",
      nt === "dark" ? "dark" : "light"
    );
  }

  function openMenu() {
    setMenuOpen(true);
  }
  function closeMenu() {
    setMenuOpen(false);
  }
  function navAndClose() {
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      {/* HEADER */}
      <header className="bg-black border-b border-yellow-600 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {/* Botão Hamburguer à esquerda */}
          <button
            onClick={openMenu}
            className="p-2 rounded-md hover:bg-gray-800 transition"
          >
            <svg
              className="w-7 h-7 text-yellow-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo centralizada como botão para a página inicial */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/">
              <a className="flex items-center">
                <Image
                  src="/logo-barcellos.png"
                  alt="Barcellos Motos"
                  width={180}
                  height={50}
                  className="object-contain border-0 logo cursor-pointer"
                />
              </a>
            </Link>
          </div>

          {/* Espaço à direita para manter o botão centralizado */}
          <div className="w-9"></div>
        </div>
      </header>

      {/* MENU LATERAL */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex">
          <div className="bg-gray-900 w-64 p-6 flex flex-col justify-start space-y-5 shadow-xl rounded-r-xl">
            {/* Botão fechar */}
            <button
              onClick={closeMenu}
              className="self-end text-gray-400 hover:text-yellow-500 text-2xl font-bold"
            >
              ✕
            </button>

            {/* Links do menu */}
            <nav className="flex flex-col space-y-4 mt-2">
              <Link href="/" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Início
              </Link>
              <Link href="/clients" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Clientes
              </Link>
              <Link href="/services" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Serviços
              </Link>
              <Link href="/products" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Produtos
              </Link>
              <Link href="/orcamentos" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Orçamentos
              </Link>
              <Link href="/relatorios" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Relatórios
              </Link>
              <Link href="/investments" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Investimentos
              </Link>
              <Link href="/login" onClick={navAndClose} className="text-white hover:text-yellow-500 transition">
                Login
              </Link>
            </nav>
          </div>
          <div className="flex-1" onClick={closeMenu}></div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 max-w-7xl mx-auto">{children}</main>

      {/* RODAPÉ */}
      <footer className="bg-gray-900 border-t border-yellow-600 text-center text-gray-400 py-3 text-sm">
        © {new Date().getFullYear()} Barcellos Racing — Todos os direitos reservados
      </footer>
    </div>
  );
}
