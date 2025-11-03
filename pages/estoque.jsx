import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiUpload } from "react-icons/fi";

export default function Estoque() {
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco_custo: "",
    margem_lucro: "",
    foto: null,
    preview: null,
  });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Upload da imagem para o bucket "produtos"
  async function uploadImagem(arquivo) {
    if (!arquivo) return null;

    try {
      const nomeArquivo = `${Date.now()}_${arquivo.name.replace(/\s/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(nomeArquivo, arquivo, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Erro ao enviar imagem:", uploadError);
        alert("Erro ao enviar imagem: " + uploadError.message);
        return null;
      }

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

  // Processar cadastro do produto
  async function processarProduto(e) {
    e.preventDefault();

    if (!form.nome || !form.preco_custo) {
      alert("Preencha os campos obrigatórios!");
      return;
    }

    if (!form.foto) {
      alert("Selecione uma imagem!");
      return;
    }

    setLoading(true);

    // 1. Faz upload da imagem
    const fotoUrl = await uploadImagem(form.foto);

    // 2. Salva no banco
    if (fotoUrl) {
      try {
        const { data, error } = await supabase
          .from("estoque_produtos")
          .insert([
            {
              nome: form.nome,
              descricao: form.descricao,
              preco_custo: parseFloat(form.preco_custo),
              margem_lucro: parseFloat(form.margem_lucro || 0),
              quantidade: 0, // padrão inicial
              foto_url: fotoUrl,
            },
          ]);

        if (error) {
          console.error("Erro ao salvar produto:", error);
          alert("Erro ao salvar produto: " + error.message);
        } else {
          alert("✅ Produto cadastrado com sucesso!");
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
        alert("Erro inesperado ao salvar produto.");
      }
    }

    // Reset do formulário
    setForm({
      nome: "",
      descricao: "",
      preco_custo: "",
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
          onSubmit={processarProduto}
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
              placeholder="Preço de Custo"
              value={form.preco_custo}
              onChange={(e) =>
                setForm({ ...form, preco_custo: e.target.value })
              }
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
              required
            />

            <input
              type="number"
              placeholder="Margem de Lucro (%)"
              value={form.margem_lucro}
              onChange={(e) =>
                setForm({ ...form, margem_lucro: e.target.value })
              }
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
            />

            {/* Upload da imagem */}
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
              {loading ? "Processando..." : "Cadastrar Produto"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
