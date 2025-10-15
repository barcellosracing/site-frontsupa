import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [codigo, setCodigo] = useState('');
  const [logado, setLogado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const valido = localStorage.getItem('adminValid');
    if (valido && new Date() < new Date(valido)) {
      setLogado(true);
    }
  }, []);

  const entrar = () => {
    if (codigo === 'br.admin') {
      const expira = new Date();
      expira.setHours(expira.getHours() + 1); // expira em 1h
      localStorage.setItem('adminValid', expira.toISOString());
      setLogado(true);
      router.push('/');
    } else {
      alert('Código inválido');
    }
  };

  const sair = () => {
    localStorage.removeItem('adminValid');
    setLogado(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {!logado ? (
        <div className="space-y-2 w-full max-w-sm">
          <input
            type="text"
            placeholder="Digite o código de admin"
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button onClick={entrar} className="bg-primary text-secondary w-full py-2 rounded">Entrar</button>
        </div>
      ) : (
        <div className="space-y-2 w-full max-w-sm text-center">
          <p>Você está logado como admin!</p>
          <button onClick={sair} className="bg-primary text-secondary w-full py-2 rounded">Sair</button>
        </div>
      )}
    </div>
  );
}
