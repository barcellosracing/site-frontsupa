import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiUpload } from "react-icons/fi";

export default function Estoque() {
  const [form, setForm] = useState({
    produtoSelecionado: "novo",
    nome: "",
    descricao: "",
    preco_custo: "",
    margem_lucro: "",
    quantidade: "",
    foto: null,
    preview: null,
  });

  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Buscar produtos e histórico ao carregar
  useEffect(() => {
    buscarProdutos();
    buscarHistorico();
  }, []);

  async function buscarProdutos() {
    const { data, error } = await supabase
      .from("estoque_produtos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProdutos(data);
  }

  async function buscarHistorico() {
    const { data, error } = await supabase
      .from("estoque_historico")
      .select("*")
      .order("data_entrada", { ascending: false });
    if (!error) setHistorico(data);
  }

  // Upload de imagem
  async function uploadImagem(arquivo) {
    if (!arquivo) return null;
    try {
      const nomeArquivo = `${Date.now()}_${arquivo.name.replace(/\s/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(nomeArquivo, arquivo);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("produtos")
        .getPublicUrl(nomeArquivo);
      return urlData.publicUrl;
    } catch (err) {
      alert("Erro ao enviar imagem: " + err.message);
      return null;
    }
  }

  // Cadastro / Atualização de produto
  async function processarProduto(e) {
    e.preventDefault();
    setLoading(true);

    let fotoUrl = null;
    if (form.foto) fotoUrl = await uploadImagem(form.foto);

    try {
      if (form.produtoSelecionado === "novo") {
        // Produto novo
        const { data: novoProduto, error: erroProduto } = await supabase
          .from("estoque_produtos")
          .insert([
            {
              nome: form.nome,
              descricao: form.descricao,
              preco_custo: parseFloat(form.preco_custo),
              margem_lucro: parseFloat(form.margem_lucro || 0),
              quantidade: parseInt(form.quantidade || 0),
              foto_url: fotoUrl,
            },
          ])
          .select()
          .single();

        if (erroProduto) throw erroProduto;

        // Registrar histórico
        await supabase.from("estoque_historico").insert([
          {
            produto_id: novoProduto.id,
            nome: novoProduto.nome,
            descricao: novoProduto.descricao,
            preco_custo: novoProduto.preco_custo,
            quantidade: novoProduto.quantidade,
            data_entrada: new Date(),
          },
        ]);
      } else {
        // Produto existente
        const produto = produtos.find(
          (p) => p.id === form.produtoSelecionado
        );
        const novaQtd =
          parseInt(produto.quantidade || 0) + parseInt(form.quantidade || 0);
        const novoCusto = Math.max(
          parseFloat(produto.preco_custo),
          parseFloat(form.preco_custo)
        );

        await supabase
          .from("estoque_produtos")
          .update({
            quantidade: novaQtd,
            preco_custo: novoCusto,
          })
          .eq("id", produto.id);

        // Adiciona ao histórico
        await supabase.from("estoque_historico").insert([
          {
            produto_id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao,
            preco_custo: parseFloat(form.preco_custo),
            quantidade: parseInt(form.quantidade),
            data_entrada: new Date(),
          },
        ]);
      }

      alert("✅ Produto processado com sucesso!");
      buscarProdutos();
      buscarHistorico();
      setMostrarForm(false);
      setForm({
        produtoSelecionado: "novo",
        nome: "",
        descricao: "",
        preco_custo: "",
        margem_lucro: "",
        quantidade: "",
        foto: null,
        preview: null,
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao processar produto: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 text-white">
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
          className="bg-gray-900 border border-yellow-600 rounded-2xl p-5 mb-6 shadow-lg grid gap-3"
        >
          {/* Seleção de produto */}
          <select
            value={form.produtoSelecionado}
            onChange={(e) =>
              setForm({ ...form, produtoSelecionado: e.target.value })
            }
            className="bg-gray-800 border border-gray-700 p-2 rounded-md"
          >
            <option value="novo">Novo Produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          {form.produtoSelecionado === "novo" && (
            <>
              <input
                type="text"
                placeholder="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="bg-gray-800 border border-gray-700 p-2 rounded-md"
                required
              />
              <textarea
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                className="bg-gray-800 border border-gray-700 p-2 rounded-md"
              />
            </>
          )}

          <input
            type="number"
            placeholder="Preço de Custo"
            value={form.preco_custo}
            onChange={(e) =>
              setForm({ ...form, preco_custo: e.target.value })
            }
            className="bg-gray-800 border border-gray-700 p-2 rounded-md"
            required
          />

          <input
            type="number"
            placeholder="Margem de Lucro (%)"
            value={form.margem_lucro}
            onChange={(e) =>
              setForm({ ...form, margem_lucro: e.target.value })
            }
            className="bg-gray-800 border border-gray-700 p-2 rounded-md"
          />

          <input
            type="number"
            placeholder="Quantidade"
            value={form.quantidade}
            onChange={(e) =>
              setForm({ ...form, quantidade: e.target.value })
            }
            className="bg-gray-800 border border-gray-700 p-2 rounded-md"
            required
          />

          {/* Upload */}
          {form.produtoSelecionado === "novo" && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Foto do produto
              </label>
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
              {form.preview && (
                <img
                  src={form.preview}
                  alt="Preview"
                  className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-700"
                />
              )}
            </div>
          )}

          <button
            type="submit"
            className="bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-400"
            disabled={loading}
          >
            {loading ? "Processando..." : "Salvar Produto"}
          </button>
        </form>
      )}

      {/* Histórico */}
      <h3 className="text-xl font-semibold text-yellow-400 mt-6 mb-2">
        🕓 Histórico de Adições
      </h3>
      <div className="bg-gray-900 border border-yellow-700 rounded-xl p-3 max-h-80 overflow-y-auto text-sm">
        {historico.map((h) => (
          <div
            key={h.id}
            className="border-b border-gray-700 py-2 flex justify-between"
          >
            <span>
              {h.nome} — {h.quantidade} un — R$ {h.preco_custo}
            </span>
            <span className="text-gray-400">
              {new Date(h.data_entrada).toLocaleString("pt-BR")}
            </span>
          </div>
        ))}
      </div>

      {/* Lista de produtos */}
      <h3 className="text-xl font-semibold text-yellow-400 mt-6 mb-2">
        📦 Produtos em Estoque
      </h3>
      <div className="bg-gray-900 border border-yellow-700 rounded-xl p-3 text-sm">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="border-b border-gray-700 py-2 flex justify-between items-center"
          >
            <div>
              <strong>{p.nome}</strong> — {p.quantidade} un
              <br />
              <span className="text-gray-400">
                Custo: R$ {p.preco_custo} | Lucro:{" "}
                <input
                  type="number"
                  value={p.margem_lucro || ""}
                  onChange={async (e) => {
                    const novaMargem = parseFloat(e.target.value || 0);
                    await supabase
                      .from("estoque_produtos")
                      .update({ margem_lucro: novaMargem })
                      .eq("id", p.id);
                    buscarProdutos();
                  }}
                  className="bg-gray-800 border border-gray-700 p-1 w-16 ml-1 text-center rounded"
                />{" "}
                %
              </span>
            </div>
            {p.foto_url && (
              <img
                src={p.foto_url}
                alt={p.nome}
                className="w-12 h-12 object-cover rounded-lg border border-gray-700"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
