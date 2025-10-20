import { useState } from "react";
import { useRouter } from "next/router";
import { FiLock } from "react-icons/fi"; // ícone de cadeado

export default function Login() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handle(e) {
    e.preventDefault();
    if (code.trim() === "br.admin") {
      const data = { admin: true, expires: Date.now() + 60 * 60 * 1000 };
      if (typeof window !== "undefined")
        localStorage.setItem("br_admin", JSON.stringify(data));
      alert("Acesso admin por 1 hora");
      router.push("/");
    } else {
      alert("Código inválido");
      if (typeof window !== "undefined") localStorage.removeItem("br_admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 p-10 rounded-3xl shadow-2xl w-full max-w-sm transform transition-transform hover:scale-[1.02]">
        <h2 className="text-3xl font-bold text-yellow-500 text-center mb-8">
          Acesso Administrativo
        </h2>
        <form onSubmit={handle} className="flex flex-col">
          <label className="text-sm text-gray-300 mb-2 flex items-center">
            Código <FiLock className="ml-2 text-yellow-500" />
          </label>
          <div className="relative mb-6">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código"
              className="w-full p-3 pl-10 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
            />
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform transition-shadow"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
