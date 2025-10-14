import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login(){
  const [code, setCode] = useState('')
  const router = useRouter()

  function handle(e){
    e.preventDefault()
    if(code.trim() === 'br.admin'){
      const data = { admin: true, expires: Date.now() + 60*60*1000 }
      localStorage.setItem('br_admin', JSON.stringify(data))
      alert('Entrou no modo admin por 1 hora.')
      router.push('/')
    } else {
      alert('Código inválido. Você ficará em modo visualização.')
      localStorage.removeItem('br_admin')
    }
  }

  return (
    <div className='max-w-md mx-auto card'>
      <h2 className='text-xl font-semibold mb-4 text-gray-800'>Acesso</h2>
      <form onSubmit={handle}>
        <label className='block text-sm mb-2'>Informe o código de acesso</label>
        <input className='w-full p-2 border rounded mb-4' value={code} onChange={e=>setCode(e.target.value)} />
        <button className='w-full p-2 rounded bg-accent text-black'>Entrar</button>
      </form>
      <div className='small-muted mt-3'>Use <code>br.admin</code> para entrar no modo admin por 1 hora.</div>
    </div>
  )
}
