import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiUpload, FiClock, FiBox, FiX } from "react-icons/fi";

export default function Estoque() {
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco_custo: "",
    quantidade: "",
    foto: null,
    preview: null,
  });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tabela, setTabela] = useState("produtos"); // produtos | historico
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [imagemAmpliada, setImagemAmpliada] = useState(null);

  // 🔹 Carregar dados
  useEffect(() => {
    carregarProdutos();
    carregarHistorico();
  }, []);

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("estoque_produtos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProdutos(data || []);
  }

  async function carregarHistorico() {
    const { data, error } = await supabase
      .from("estoque_historico")
      .select("*")
      .order("data_entrada", { ascending: false });
    if (!error) setHistorico(data || []);
  }

  // 🔹 Upload de imagem
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

  // 🔹 Cadastro
  async function processarProduto(e) {
    e.preventDefault();
    setLoading(true);

    const fotoUrl = form.foto ? await uploadImagem(form.foto) : null;
    const produtoExistente = produtos.find((p) => p.nome === form.nome);

    if (produtoExistente) {
      const novaQuantidade =
        parseInt(produtoExistente.quantidade) + parseInt(form.quantidade);
      const novoPreco = Math.max(
        parseFloat(produtoExistente.preco_custo),
        parseFloat(form.preco_custo)
      );

      await supabase
        .from("estoque_produtos")
        .update({
          quantidade: novaQuantidade,
          preco_custo: novoPreco,
        })
        .eq("id", produtoExistente.id);

      await supabase.from("estoque_historico").insert([
        {
          produto_id: produtoExistente.id,
          nome: produtoExistente.nome,
          descricao: produtoExistente.descricao,
          preco_custo: form.preco_custo,
          quantidade: form.quantidade,
        },
      ]);
    } else {
      const { data, error } = await supabase
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

      if (!error && data) {
        await supabase.from("estoque_historico").insert([
          {
            produto_id: data.id,
            nome: data.nome,
            descricao: data.descricao,
            preco_custo: data.preco_custo,
            quantidade: data.quantidade,
          },
        ]);
      }
    }

    await carregarProdutos();
    await carregarHistorico();
    setForm({
      nome: "",
      descricao: "",
      preco_custo: "",
      quantidade: "",
      foto: null,
      preview: null,
    });
    setMostrarForm(false);
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-yellow-500">
          Controle de Estoque
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTabela("produtos")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
              tabela === "produtos"
                ? "bg-yellow-500 text-black"
                : "bg-gray-800 text-yellow-400"
            }`}
          >
            <FiBox /> Produtos
          </button>
          <button
            onClick={() => setTabela("historico")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
              tabela === "historico"
                ? "bg-yellow-500 text-black"
                : "bg-gray-800 text-yellow-400"
            }`}
          >
            <FiClock /> Histórico
          </button>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 shadow-lg"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form
          onSubmit={processarProduto}
          className="bg-gray-900 border border-yellow-600 rounded-2xl p-5 mb-6 shadow-lg"
        >
          <div className="grid gap-3">
            <label className="text-gray-300 text-sm">Produto</label>
            <select
              value={form.nome}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor === "novo") {
                  setForm({
                    nome: "",
                    descricao: "",
                    preco_custo: "",
                    quantidade: "",
                    foto: null,
                    preview: null,
                  });
                } else if (valor) {
                  const produto = produtos.find((p) => p.nome === valor);
                  setForm({
                    ...form,
                    nome: produto.nome,
                    descricao: produto.descricao,
                  });
                } else {
                  setForm({ ...form, nome: "", descricao: "" });
                }
              }}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
            >
              <option value="">Selecione um produto</option>
              <option value="novo">+ Novo Produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>

            {/* Campos para novo produto */}
            {form.nome === "" && (
              <>
                <input
                  type="text"
                  placeholder="Nome do novo produto"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
                  required
                />
                <textarea
                  placeholder="Descrição"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
                  required
                />
              </>
            )}

            {/* Campos comuns */}
            <input
              type="number"
              placeholder="Preço de Custo"
              value={form.preco_custo}
              onChange={(e) => setForm({ ...form, preco_custo: e.target.value })}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
              required
            />
            <input
              type="number"
              placeholder="Quantidade"
              value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
              required
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
              {loading ? "Processando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      )}

      {/* Modal de imagem ampliada */}
      {imagemAmpliada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={() => setImagemAmpliada(null)}
        >
          <img
            src={imagemAmpliada}
            alt="Imagem ampliada"
            className="max-w-[90%] max-h-[90%] rounded-lg border border-yellow-500"
          />
          <button
            onClick={() => setImagemAmpliada(null)}
            className="absolute top-4 right-4 text-white text-3xl"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Tabela Produtos */}
      {tabela === "produtos" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700 text-sm sm:text-base">
            <thead className="bg-gray-800 text-yellow-400">
              <tr>
                <th className="p-2 text-left">Imagem</th>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-left">Preço Custo</th>
                <th className="p-2 text-left">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-t border-gray-700">
                  <td className="p-2">
                    {p.foto_url ? (
                      <img
                        src={p.foto_url}
                        alt={p.nome}
                        onClick={() => setImagemAmpliada(p.foto_url)}
                        className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-gray-500">Sem foto</span>
                    )}
                  </td>
                  <td className="p-2">{p.nome}</td>
                  <td className="p-2 max-w-[200px] truncate">{p.descricao}</td>
                  <td className="p-2">R$ {p.preco_custo}</td>
                  <td className="p-2">{p.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela Histórico */}
      {tabela === "historico" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700 text-sm sm:text-base">
            <thead className="bg-gray-800 text-yellow-400">
              <tr>
                <th className="p-2 text-left">Produto</th>
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-left">Preço Custo</th>
                <th className="p-2 text-left">Qtd</th>
                <th className="p-2 text-left">Data Entrada</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id} className="border-t border-gray-700">
                  <td className="p-2">{h.nome}</td>
                  <td className="p-2">{h.descricao}</td>
                  <td className="p-2">R$ {h.preco_custo}</td>
                  <td className="p-2">{h.quantidade}</td>
                  <td className="p-2">
                    {new Date(h.data_entrada).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
