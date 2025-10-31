import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiTrash2, FiUpload } from "react-icons/fi";

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
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

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data, error } = await supabase.from("products").select("*");
    if (error) console.error("Erro ao carregar produtos:", error);
    else setProdutos(data || []);
  }

  async function uploadImagem(arquivo) {
    if (!arquivo) return null;

    const nomeArquivo = `${Date.now()}_${arquivo.name}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from("produtos")
      .upload(nomeArquivo, arquivo, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Erro ao enviar imagem:", uploadError);
      alert("Erro ao enviar imagem");
      return null;
    }

    // Obter URL pública
    const { data: urlData, error: urlError } = supabase.storage
      .from("produtos")
      .getPublicUrl(nomeArquivo);

    if (urlError) {
      console.error("Erro ao obter URL da imagem:", urlError);
      return null;
    }

    return urlData.publicUrl;
  }

  async function salvarProduto(e) {
    e.preventDefault();
    setLoading(true);

    let fotoUrl = null;
    if (form.foto) {
      fotoUrl = await uploadImagem(form.foto);
    }

    const { error } = await supabase.from("products").insert([
      {
        name: form.nome,
        description: form.descricao,
        price: parseFloat(form.preco_medio) || 0,
        profit_margin: parseFloat(form.margem_lucro) || 0,
        image_url: fotoUrl,
      },
    ]);

    if (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto");
    } else {
      setMostrarForm(false);
      setForm({ nome: "", descricao: "", preco_medio: "", margem_lucro: "", foto: null, preview: null });
      carregarProdutos();
    }

    setLoading(false);
  }

  async function removerProduto(id) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("Erro ao excluir produto");
    carregarProdutos();
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Controle de Estoque</h2>
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

            {/* Upload da imagem */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Foto do produto</label>
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
              {loading ? "Salvando..." : "Salvar Produto"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de produtos */}
      <div className="grid gap-4 sm:grid-cols-2">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex justify-between items-start hover:border-yellow-600"
          >
            <div>
              <div className="font-semibold text-yellow-400 text-lg">{p.name}</div>
              <div className="text-sm text-gray-400 mt-1">{p.description}</div>
              <div className="text-sm text-gray-300 mt-1">💰 R$ {p.price.toFixed(2)}</div>
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-700 cursor-pointer"
                  onClick={() => window.open(p.image_url, "_blank")}
                />
              )}
            </div>
            <button
              onClick={() => removerProduto(p.id)}
              className="text-red-500 hover:text-red-400 transition"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
