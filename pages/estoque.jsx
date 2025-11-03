import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiUpload, FiX, FiEye } from "react-icons/fi";

export default function Estoque() {
  // form guarda apenas campos do produto que serão enviados
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco_custo: "",
    quantidade: "",
    foto: null,
    preview: null,
  });

  // produtoSelecionado: "novo" | "" | produto.id
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tabela, setTabela] = useState("produtos"); // 'produtos' | 'historico'
  const [loading, setLoading] = useState(false);

  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [imagemAmpliada, setImagemAmpliada] = useState(null);

  // carregar dados ao montar componente
  useEffect(() => {
    carregarProdutos();
    carregarHistorico();
  }, []);

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("estoque_produtos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Erro ao carregar produtos:", error);
    else setProdutos(data || []);
  }

  async function carregarHistorico() {
    const { data, error } = await supabase
      .from("estoque_historico")
      .select("*")
      .order("data_entrada", { ascending: false });
    if (error) console.error("Erro ao carregar histórico:", error);
    else setHistorico(data || []);
  }

  // upload de imagem para bucket "produtos"
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
      console.error("Erro upload:", err);
      alert("Erro ao enviar imagem: " + (err.message || err));
      return null;
    }
  }

  // processar cadastro / entrada
  async function processarProduto(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let fotoUrl = null;
      if (form.foto) fotoUrl = await uploadImagem(form.foto);

      if (produtoSelecionado === "novo") {
        // validações mínimas
        if (!form.nome || !form.preco_custo || !form.quantidade) {
          alert("Preencha nome, preço e quantidade para novo produto.");
          setLoading(false);
          return;
        }

        // inserir novo produto
        const { data, error } = await supabase
          .from("estoque_produtos")
          .insert([
            {
              nome: form.nome,
              descricao: form.descricao,
              preco_custo: parseFloat(form.preco_custo),
              quantidade: parseInt(form.quantidade, 10),
              foto_url: fotoUrl,
              margem_lucro: 0,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // inserir histórico
        await supabase.from("estoque_historico").insert([
          {
            produto_id: data.id,
            nome: data.nome,
            descricao: data.descricao,
            preco_custo: data.preco_custo,
            quantidade: data.quantidade,
            data_entrada: new Date(),
          },
        ]);
      } else if (produtoSelecionado) {
        // produto existente - adiciona quantidade e ajusta preço se necessário
        const produto = produtos.find((p) => p.id === produtoSelecionado);
        if (!produto) {
          alert("Produto selecionado inválido.");
          setLoading(false);
          return;
        }

        if (!form.preco_custo || !form.quantidade) {
          alert("Preencha preço de custo e quantidade.");
          setLoading(false);
          return;
        }

        const novaQtd =
          parseInt(produto.quantidade || 0, 10) + parseInt(form.quantidade, 10);
        const novoPreco = Math.max(
          parseFloat(produto.preco_custo || 0),
          parseFloat(form.preco_custo)
        );

        await supabase
          .from("estoque_produtos")
          .update({ quantidade: novaQtd, preco_custo: novoPreco, foto_url: produto.foto_url || fotoUrl })
          .eq("id", produto.id);

        await supabase.from("estoque_historico").insert([
          {
            produto_id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao,
            preco_custo: parseFloat(form.preco_custo),
            quantidade: parseInt(form.quantidade, 10),
            data_entrada: new Date(),
          },
        ]);
      } else {
        alert("Selecione 'Novo Produto' ou escolha um produto existente.");
        setLoading(false);
        return;
      }

      // recarregar dados
      await carregarProdutos();
      await carregarHistorico();

      // reset
      setProdutoSelecionado("");
      setForm({
        nome: "",
        descricao: "",
        preco_custo: "",
        quantidade: "",
        foto: null,
        preview: null,
      });
      setMostrarForm(false);
    } catch (err) {
      console.error("Erro processar produto:", err);
      alert("Erro ao processar produto: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  // alternar tabelas (single button)
  function alternarTabela() {
    setTabela((t) => (t === "produtos" ? "historico" : "produtos"));
  }

  // atualiza margem no banco
  async function atualizarMargem(produtoId, valor) {
    const margem = parseFloat(valor || 0);
    await supabase.from("estoque_produtos").update({ margem_lucro: margem }).eq("id", produtoId);
    carregarProdutos();
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 text-white">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-yellow-500">Controle de Estoque</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={alternarTabela}
            className="flex items-center gap-2 bg-yellow-500 text-black px-3 py-1 rounded-lg shadow-sm"
            title="Alternar Produtos / Histórico"
          >
            <FiEye /> {tabela === "produtos" ? "Ver Histórico" : "Ver Produtos"}
          </button>

          <button
            onClick={() => {
              // abrir formulário com "novo" selecionado por padrão
              setMostrarForm((m) => !m);
              setProdutoSelecionado("novo");
              setForm({
                nome: "",
                descricao: "",
                preco_custo: "",
                quantidade: "",
                foto: null,
                preview: null,
              });
            }}
            className="p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 shadow-lg"
            title="Adicionar entrada"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form onSubmit={processarProduto} className="bg-gray-900 border border-yellow-600 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="grid gap-3">
            <label className="text-gray-300 text-sm">Produto</label>
            <select
              value={produtoSelecionado}
              onChange={(e) => {
                const val = e.target.value;
                setProdutoSelecionado(val);
                if (val === "novo") {
                  setForm((f) => ({
                    ...f,
                    nome: "",
                    descricao: "",
                    preco_custo: "",
                    quantidade: "",
                    foto: null,
                    preview: null,
                  }));
                } else if (val) {
                  // produto existente selecionado (val é id)
                  const p = produtos.find((x) => x.id === val);
                  if (p) {
                    setForm((f) => ({
                      ...f,
                      nome: p.nome,
                      descricao: p.descricao,
                      preco_custo: "",
                      quantidade: "",
                      foto: null,
                      preview: null,
                    }));
                  }
                } else {
                  // vazio
                  setForm((f) => ({ ...f, nome: "", descricao: "" }));
                }
              }}
              className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
              required
            >
              <option value="">-- selecione --</option>
              <option value="novo">+ Novo Produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>

            {/* Se for novo produto, mostrar nome e descrição */}
            {produtoSelecionado === "novo" && (
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
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
                  required
                />
              </>
            )}

            {/* Campos comuns (preço e quantidade sempre necessários para entrada) */}
            <input
              type="number"
              step="0.01"
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

            {/* upload imagem (opcional) */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Foto do produto (opcional)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setForm((f) => ({ ...f, foto: file, preview: URL.createObjectURL(file) }));
                    }
                  }}
                  className="text-gray-300 text-sm"
                />
                <FiUpload className="text-yellow-500" />
              </div>
              {form.preview && (
                <img src={form.preview} alt="Preview" className="mt-2 w-28 h-28 object-cover rounded-lg border border-gray-700" />
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-yellow-500 text-black py-2 px-4 rounded-lg hover:bg-yellow-400">
                {loading ? "Processando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false);
                  setProdutoSelecionado("");
                }}
                className="bg-gray-800 border border-gray-700 py-2 px-4 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modal imagem ampliada */}
      {imagemAmpliada && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center" onClick={() => setImagemAmpliada(null)}>
          <img src={imagemAmpliada} alt="ampliada" className="max-w-[95%] max-h-[95%] rounded-lg" />
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setImagemAmpliada(null)}>
            <FiX />
          </button>
        </div>
      )}

      {/* Tabela Produtos */}
      {tabela === "produtos" && (
        <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-lg p-2">
          <table className="w-full text-sm sm:text-base">
            <thead className="text-yellow-400">
              <tr className="text-left">
                <th className="p-2">Img</th>
                <th className="p-2">Nome</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Preço Custo</th>
                <th className="p-2">Quantidade</th>
                <th className="p-2">Margem (%)</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-t border-gray-700">
                  <td className="p-2 align-middle">
                    {p.foto_url ? (
                      <img
                        src={p.foto_url}
                        alt={p.nome}
                        className="w-14 h-14 object-cover rounded-lg cursor-pointer"
                        onClick={() => setImagemAmpliada(p.foto_url)}
                      />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center text-gray-500">—</div>
                    )}
                  </td>
                  <td className="p-2 align-middle">{p.nome}</td>
                  <td className="p-2 align-middle max-w-[220px] truncate">{p.descricao}</td>
                  <td className="p-2 align-middle">R$ {Number(p.preco_custo).toFixed(2)}</td>
                  <td className="p-2 align-middle">{p.quantidade}</td>
                  <td className="p-2 align-middle">
                    <input
                      type="number"
                      step="0.01"
                      className="bg-gray-800 border border-gray-700 p-1 rounded-md w-24 text-white text-sm"
                      defaultValue={p.margem_lucro ?? 0}
                      onBlur={(e) => {
                        // salva ao perder foco
                        atualizarMargem(p.id, e.target.value);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela Histórico */}
      {tabela === "historico" && (
        <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-lg p-2">
          <table className="w-full text-sm sm:text-base">
            <thead className="text-yellow-400">
              <tr className="text-left">
                <th className="p-2">Produto</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Preço Custo</th>
                <th className="p-2">Qtd</th>
                <th className="p-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id} className="border-t border-gray-700">
                  <td className="p-2">{h.nome}</td>
                  <td className="p-2 max-w-[240px] truncate">{h.descricao}</td>
                  <td className="p-2">R$ {Number(h.preco_custo).toFixed(2)}</td>
                  <td className="p-2">{h.quantidade}</td>
                  <td className="p-2">{new Date(h.data_entrada).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
