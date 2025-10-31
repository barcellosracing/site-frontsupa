import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiUpload } from "react-icons/fi";

export default function Estoque() {
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco_medio: "",
    margem_lucro: "",
    foto: null,
    preview: null,
  });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Função de upload para o bucket "produtos"
  async function uploadImagem(arquivo) {
    if (!arquivo) return null;

    try {
      const nomeArquivo = `${Date.now()}_${arquivo.name.replace(/\s/g, "_")}`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(nomeArquivo, arquivo, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Erro ao enviar imagem:", uploadError);
        alert("Erro ao enviar imagem: " + uploadError.message);
        return null;
      }

      // Obter URL pública
      const { data: urlData, error: urlError } = supabase.storage
        .from("produtos")
        .getPublicUrl(nomeArquivo);

      if (urlError) {
        console.error("Erro ao obter URL da imagem:", urlError);
        alert("Erro ao obter URL da imagem: " + urlError.message);
        return null;
      }

      return urlData.publicUrl;
    } catch (err) {
      console.error("Erro inesperado no upload:", err);
      alert("Erro inesperado no upload da imagem");
      return null;
    }
  }

  // Função para "salvar" apenas o upload da imagem
  async function salvarProduto(e) {
    e.preventDefault();
    setLoading(true);

    let fotoUrl = null;
    if (form.foto) {
      fotoUrl = await uploadImagem(form.foto);
    }

    alert("Produto processado! URL da imagem: " + (fotoUrl || "Nenhuma"));

    // Reset do formulário
    setForm({
      nome: "",
      descricao: "",
      preco_medio: "",
      margem_lucro: "",
      foto: null,
      preview: null,
    });
    setMostrarForm(false);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">
          Controle de Estoque
        </h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 shadow-lg"
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form
          onSubmit={salvarProduto}
          className="bg-gray-900 border border-yellow-600 rounded-2xl p-5 mb-6 shadow-lg"
        >
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
              required
            />
            <textarea
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
            />
            <input
              type="number"
              placeholder="Preço Médio"
              value={form.preco_medio}
              onChange={(e) => setForm({ ...form, preco_medio: e.target.value })}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
              required
            />
            <input
              type="number"
              placeholder="Margem de Lucro (%)"
              value={form.margem_lucro}
              onChange={(e) => setForm({ ...form, margem_lucro: e.target.value })}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
            />

            {/* Upload de imagem */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Foto do produto
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setForm({
                        ...form,
                        foto: file,
                        preview: URL.createObjectURL(file),
                      });
                    }
                  }}
                  className="text-gray-300 text-sm"
                />
                <FiUpload className="text-yellow-500" />
              </div>
              {form.preview && (
                <img
                  src={form.preview}
                  alt="Preview"
                  className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-700"
                />
              )}
            </div>

            <button
              type="submit"
              className="bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-400"
              disabled={loading}
            >
              {loading ? "Processando..." : "Processar Produto"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
