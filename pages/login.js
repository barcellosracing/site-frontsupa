import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login(){
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handle(e){
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if(error) alert(error.message)
    else alert('Verifique seu e-mail para login (link mágico).')
    setLoading(false)
  }

  return (
    <div className='max-w-md mx-auto card'>
      <h2 className='text-xl font-semibold mb-4 text-gray-800'>Login / Cadastro</h2>
      <form onSubmit={handle}>
        <label className='block text-sm mb-2'>E-mail</label>
        <input className='w-full p-2 border rounded mb-4 text-black' value={email} onChange={e=>setEmail(e.target.value)} />
        <button className='w-full p-2 rounded bg-accent text-black'>{loading ? 'Enviando...' : 'Enviar link mágico'}</button>
      </form>
    </div>
  )
}
