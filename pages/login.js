import { useState } from 'react'
import { useRouter } from 'next/router'
export default function Login(){ const [code,setCode]=useState(''); const router=useRouter()
function handle(e){ e.preventDefault(); if(code.trim()==='br.admin'){ const data={admin:true,expires:Date.now()+60*60*1000}; localStorage.setItem('br_admin',JSON.stringify(data)); alert('Acesso de admin ativado por 1 hora.'); router.push('/') } else { alert('Código inválido.'); localStorage.removeItem('br_admin') } }
return (<div className="max-w-md mx-auto card"><h2 className="text-xl font-semibold mb-4">Acesso</h2><form onSubmit={handle}><label className="block text-sm mb-2">Código de acesso</label><input className="w-full p-2 border rounded mb-4" value={code} onChange={e=>setCode(e.target.value)} /><button className="w-full p-2 rounded btn">Entrar</button></form></div>) }
