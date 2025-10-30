import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [form, setForm] = useState({
    produtoSelecionado: "",
    nome: "",
    descricao: "",
    preco_custo: "",
    quantidade: "",
    imagem: null,
  });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarProdutos();
    carregarHistorico();
  }, []);

  async function carregarProdutos() {
    const { data } = await supabase
      .from("estoque_produtos")
      .select("*")
      .order("created_at", { ascending: false });
    setProdutos(data || []);
  }

  async function carregarHistorico() {
    const { data } = await supabase
      .from("estoque_historico")
      .select("*, produto_id(id, nome)")
      .order("data_entrada", { ascending: false });
    setHistorico(data || []);
  }

  async function handleUploadImagem(file) {
    const nomeArquivo = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("produtos")
      .upload(`imagens/${nomeArquivo}`, file);
    if (error) {
      console.error("Erro ao enviar imagem:", error);
      alert("Erro ao enviar imagem.");
      return null;
    }
    const { data: urlData } = supabase.storage
      .from("produtos")
      .getPublicUrl(`imagens/${nomeArquivo}`);
    return urlData.publicUrl;
  }

  async function salvarProduto(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let fotoUrl = null;

      // Upload da imagem, se houver
      if (form.imagem) {
        fotoUrl = await handleUploadImagem(form.imagem);
      }

      let produtoId = form.produtoSelecionado;

      // Caso seja um novo produto
      if (!produtoId) {
        const { data: novoProduto, error: erroProd } = await supabase
          .from("estoque_produtos")
          .insert([
            {
              nome: form.nome,
              descricao: form.descricao,
              preco_custo: form.preco_custo,
              quantidade: form.quantidade,
              foto_url: fotoUrl,
            },
          ])
          .select()
          .single();

        if (erroProd) throw erroProd;
        produtoId = novoProduto.id;
      } else if (fotoUrl) {
        // Atualiza a foto se selecionou produto existente
        await supabase
          .from("estoque_produtos")
          .update({ foto_url: fotoUrl })
          .eq("id", produtoId);
      }

      // Cria o registro no histórico
      await supabase.from("estoque_historico").insert([
        {
          produto_id: produtoId,
          nome: form.nome,
          descricao: form.descricao,
          preco_custo: form.preco_custo,
          quantidade: form.quantidade,
          data_entrada: new Date().toISOString(),
        },
      ]);

      setForm({
        produtoSelecionado: "",
        nome: "",
        descricao: "",
        preco_custo: "",
        quantidade: "",
        imagem: null,
      });
      setMostrarForm(false);
      carregarProdutos();
      carregarHistorico();
    } catch (e) {
      console.error("Erro ao salvar produto:", e);
    } finally {
      setLoading(false);
    }
  }

  async function excluirHistorico(id) {
    if (!window.confirm("Deseja excluir esta entrada?")) return;
    await supabase.from("estoque_historico").delete().eq("id", id);
    carregarHistorico();
    carregarProdutos();
  }

  return (
    <div className="max-w-6xl mx-auto text-gray-200">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-yellow-500">Estoque</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="p-3 bg-yellow-500 text-black rounded-full shadow-lg hover:bg-yellow-400 transition"
        >
          <FiPlus className="w-6 h-6" />
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form
          onSubmit={salvarProduto}
          className="bg-gray-900 border border-yellow-600 rounded-2xl p-5 mb-6"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Produto existente</label>
              <select
                value={form.produtoSelecionado}
                onChange={(e) =>
                  setForm({ ...form, produtoSelecionado: e.target.value })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
              >
                <option value="">Novo produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {!form.produtoSelecionado && (
              <>
                <div>
                  <label className="block text-sm mb-1">Nome</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Descrição</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                    value={form.descricao}
                    onChange={(e) =>
                      setForm({ ...form, descricao: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm mb-1">Preço de custo</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                value={form.preco_custo}
                onChange={(e) =>
                  setForm({ ...form, preco_custo: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Quantidade</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                value={form.quantidade}
                onChange={(e) =>
                  setForm({ ...form, quantidade: e.target.value })
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Imagem do produto</label>
              <input
                type="file"
                accept="image/*"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                onChange={(e) =>
                  setForm({ ...form, imagem: e.target.files[0] })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-yellow-500 text-black font-semibold py-2 rounded-lg hover:bg-yellow-400 transition"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}

      {/* Produtos no Estoque */}
      <h3 className="text-xl font-semibold text-yellow-500 mb-3">
        Produtos no Estoque
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg hover:border-yellow-600 transition-all"
          >
            {p.foto_url ? (
              <img
                src={p.foto_url}
                alt={p.nome}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            ) : (
              <div className="w-full h-32 bg-gray-800 rounded-lg mb-3 flex items-center justify-center text-gray-500">
                sem imagem
              </div>
            )}
            <h4 className="text-yellow-400 font-semibold">{p.nome}</h4>
            <p className="text-gray-400 text-sm">{p.descricao}</p>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <h3 className="text-xl font-semibold text-yellow-500 mb-3">
        Histórico de Entradas
      </h3>
      <div className="space-y-3">
        {historico.map((h) => (
          <div
            key={h.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex justify-between items-center"
          >
            <div>
              <p className="text-yellow-400 font-medium">{h.nome}</p>
              <p className="text-gray-400 text-sm">
                +{h.quantidade} unidades • R$ {h.preco_custo}
              </p>
            </div>
            <button
              onClick={() => excluirHistorico(h.id)}
              className="text-red-500 hover:text-red-400"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
