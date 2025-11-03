// pages/estoque.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiUpload, FiX, FiEye, FiTrash2, FiEdit } from "react-icons/fi";

export default function Estoque() {
  // form guarda apenas campos do produto que serão enviados (entrada)
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

  // estados para edição inline
  const [produtoEditando, setProdutoEditando] = useState(null); // produto object or null
  const [historicoEditando, setHistoricoEditando] = useState(null); // historico object or null
  const [loadingOperacao, setLoadingOperacao] = useState(false);

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
      if (form.foto && produtoSelecionado === "novo") {
        fotoUrl = await uploadImagem(form.foto);
      }

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
        // manter lógica anterior: usar o maior preço entre o existente e o informado
        const novoPreco = Math.max(
          parseFloat(produto.preco_custo || 0),
          parseFloat(form.preco_custo)
        );

        await supabase
          .from("estoque_produtos")
          .update({
            quantidade: novaQtd,
            preco_custo: novoPreco,
            // Não sobrescrever foto de produto existente aqui (upload não necessário)
          })
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

  // ----- EDIÇÃO / EXCLUSÃO PRODUTOS -----
  function abrirEdicaoProduto(produto) {
    setProdutoEditando({
      ...produto,
      nova_foto: null,
      preview: produto.foto_url || null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fecharEdicaoProduto() {
    setProdutoEditando(null);
  }

  async function salvarEdicaoProduto(e) {
    e.preventDefault();
    if (!produtoEditando) return;
    setLoadingOperacao(true);

    try {
      let fotoUrl = produtoEditando.foto_url || null;
      if (produtoEditando.nova_foto) {
        // upload da nova imagem
        const uploaded = await uploadImagem(produtoEditando.nova_foto);
        if (uploaded) fotoUrl = uploaded;
      }

      const updates = {
        nome: produtoEditando.nome,
        descricao: produtoEditando.descricao,
        foto_url: fotoUrl,
      };

      await supabase.from("estoque_produtos").update(updates).eq("id", produtoEditando.id);

      // atualizar também registros do historico que tenham esse produto_id (opcional)
      // aqui vamos atualizar apenas o nome/descricao em historico para manter consistência
      await supabase
        .from("estoque_historico")
        .update({ nome: produtoEditando.nome, descricao: produtoEditando.descricao })
        .eq("produto_id", produtoEditando.id);

      await carregarProdutos();
      await carregarHistorico();
      fecharEdicaoProduto();
    } catch (err) {
      console.error("Erro salvar edição produto:", err);
      alert("Erro ao salvar edição do produto: " + (err.message || err));
    } finally {
      setLoadingOperacao(false);
    }
  }

  async function excluirProduto(produtoId) {
    const ok = confirm("Confirma exclusão deste produto? Essa ação excluirá o produto da tabela 'estoque_produtos'.");
    if (!ok) return;
    setLoadingOperacao(true);

    try {
      // excluir produto
      const { error } = await supabase.from("estoque_produtos").delete().eq("id", produtoId);
      if (error) throw error;

      // Observação: não estamos excluindo automaticamente histórico relacionado para preservar registros.
      // Se você quiser remover também histórico vinculado, descomente a próxima linha:
      // await supabase.from("estoque_historico").delete().eq("produto_id", produtoId);

      await carregarProdutos();
      await carregarHistorico();
    } catch (err) {
      console.error("Erro excluir produto:", err);
      alert("Erro ao excluir produto: " + (err.message || err));
    } finally {
      setLoadingOperacao(false);
    }
  }

  // ----- EDIÇÃO / EXCLUSÃO HISTÓRICO -----
  function abrirEdicaoHistorico(h) {
    setHistoricoEditando({
      ...h,
      preco_custo: String(h.preco_custo ?? ""),
      quantidade: String(h.quantidade ?? ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fecharEdicaoHistorico() {
    setHistoricoEditando(null);
  }

  // salvar edição do registro de histórico:
  // - atualiza o registro de histórico
  // - atualiza a quantidade no produto correspondente (ajusta pela diferença)
  // - atualiza preco_custo do produto para o novo preco (decisão: sobrescrever)
  async function salvarEdicaoHistorico(e) {
    e.preventDefault();
    if (!historicoEditando) return;
    setLoadingOperacao(true);

    try {
      const record = historicoEditando;
      const novoPreco = parseFloat(record.preco_custo || 0);
      const novaQtd = parseInt(record.quantidade || 0, 10);

      // buscar produto atual
      const { data: produto } = await supabase.from("estoque_produtos").select("*").eq("id", record.produto_id).single();

      if (!produto) {
        throw new Error("Produto vinculado não encontrado.");
      }

      const qtdAntiga = parseInt(record.__original_quantidade ?? record.quantidade, 10);
      // Note: we stored __original_quantidade? not yet — we'll get the original row from historico state
      // safer: buscar o historico original no array 'historico' (by id)
      const original = historico.find((x) => x.id === record.id);
      const qtdOriginal = original ? parseInt(original.quantidade || 0, 10) : qtdAntiga;

      const diferenca = novaQtd - qtdOriginal;
      let novaQtdProduto = parseInt(produto.quantidade || 0, 10) + diferenca;
      if (novaQtdProduto < 0) novaQtdProduto = 0;

      // atualizar historico
      await supabase
        .from("estoque_historico")
        .update({ preco_custo: novoPreco, quantidade: novaQtd })
        .eq("id", record.id);

      // atualizar produto: ajuste na quantidade e definir preco_custo para novoPreco
      await supabase
        .from("estoque_produtos")
        .update({ quantidade: novaQtdProduto, preco_custo: novoPreco })
        .eq("id", produto.id);

      await carregarProdutos();
      await carregarHistorico();
      fecharEdicaoHistorico();
    } catch (err) {
      console.error("Erro salvar edição historico:", err);
      alert("Erro ao salvar edição do histórico: " + (err.message || err));
    } finally {
      setLoadingOperacao(false);
    }
  }

  // excluir historico: subtrai quantidade do produto correspondente
  async function excluirHistorico(registro) {
    const ok = confirm("Confirma exclusão deste registro de histórico? A quantidade será subtraída do produto.");
    if (!ok) return;
    setLoadingOperacao(true);

    try {
      // buscar produto
      const { data: produto, error: pErr } = await supabase
        .from("estoque_produtos")
        .select("*")
        .eq("id", registro.produto_id)
        .single();
      if (pErr) throw pErr;

      // calcular nova quantidade
      const novaQtdProduto = Math.max((parseInt(produto.quantidade || 0, 10) - parseInt(registro.quantidade || 0, 10)), 0);

      // deletar historico
      const { error: delErr } = await supabase.from("estoque_historico").delete().eq("id", registro.id);
      if (delErr) throw delErr;

      // atualizar produto
      await supabase.from("estoque_produtos").update({ quantidade: novaQtdProduto }).eq("id", produto.id);

      await carregarProdutos();
      await carregarHistorico();
    } catch (err) {
      console.error("Erro excluir historico:", err);
      alert("Erro ao excluir registro do histórico: " + (err.message || err));
    } finally {
      setLoadingOperacao(false);
    }
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

      {/* Formulário de entrada (novo produto ou adicionar entrada em produto existente) */}
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

            {/* upload imagem (apenas para NOVO produto) */}
            {produtoSelecionado === "novo" && (
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
            )}

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

      {/* Card de edição de produto (inline) */}
      {produtoEditando && (
        <form onSubmit={salvarEdicaoProduto} className="bg-gray-900 border border-yellow-600 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 grid gap-2">
              <h3 className="text-yellow-400 font-semibold">Editar produto</h3>
              <input
                type="text"
                value={produtoEditando.nome}
                onChange={(e) => setProdutoEditando((p) => ({ ...p, nome: e.target.value }))}
                className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
                required
              />
              <textarea
                value={produtoEditando.descricao || ""}
                onChange={(e) => setProdutoEditando((p) => ({ ...p, descricao: e.target.value }))}
                className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
              />
              <label className="block text-sm text-gray-400">Alterar foto (opcional)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProdutoEditando((p) => ({ ...p, nova_foto: file, preview: URL.createObjectURL(file) }));
                    }
                  }}
                  className="text-gray-300 text-sm"
                />
                <FiUpload className="text-yellow-500" />
              </div>
              {produtoEditando.preview && (
                <img src={produtoEditando.preview} alt="Preview" className="mt-2 w-28 h-28 object-cover rounded-lg border border-gray-700" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button type="submit" disabled={loadingOperacao} className="bg-yellow-500 text-black py-2 px-4 rounded-lg hover:bg-yellow-400">
                {loadingOperacao ? "Salvando..." : "Salvar alterações"}
              </button>
              <button type="button" onClick={fecharEdicaoProduto} className="bg-gray-800 border border-gray-700 py-2 px-4 rounded-lg">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => excluirProduto(produtoEditando.id)}
                className="bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Excluir produto
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Card de edição de histórico (inline) */}
      {historicoEditando && (
        <form onSubmit={salvarEdicaoHistorico} className="bg-gray-900 border border-yellow-600 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="grid gap-2 sm:grid-cols-3 sm:items-end">
            <div>
              <label className="text-sm text-gray-400">Produto</label>
              <div className="text-white">{historicoEditando.nome}</div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Preço de Custo</label>
              <input
                type="number"
                step="0.01"
                value={historicoEditando.preco_custo}
                onChange={(e) => setHistoricoEditando((h) => ({ ...h, preco_custo: e.target.value }))}
                className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <div>
                <label className="text-sm text-gray-400">Quantidade</label>
                <input
                  type="number"
                  value={historicoEditando.quantidade}
                  onChange={(e) => setHistoricoEditando((h) => ({ ...h, quantidade: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 p-2 rounded-md text-white"
                  required
                />
              </div>
              <div className="self-end flex gap-2">
                <button type="submit" disabled={loadingOperacao} className="bg-yellow-500 text-black py-2 px-4 rounded-lg hover:bg-yellow-400">
                  {loadingOperacao ? "Salvando..." : "Salvar"}
                </button>
                <button type="button" onClick={fecharEdicaoHistorico} className="bg-gray-800 border border-gray-700 py-2 px-4 rounded-lg">
                  Cancelar
                </button>
                <button type="button" onClick={() => excluirHistorico(historicoEditando)} className="bg-red-700 text-white py-2 px-4 rounded-lg">
                  Excluir registro
                </button>
              </div>
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
                <th className="p-2">Ações</th>
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
                  <td className="p-2 align-middle">
                    <div className="flex gap-2">
                      <button
                        title="Editar"
                        onClick={() => abrirEdicaoProduto(p)}
                        className="p-2 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700"
                      >
                        <FiEdit />
                      </button>
                      <button
                        title="Excluir"
                        onClick={() => excluirProduto(p.id)}
                        className="p-2 bg-red-700 text-white rounded-md hover:bg-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
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
                <th className="p-2">Ações</th>
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
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        title="Editar registro"
                        onClick={() => abrirEdicaoHistorico(h)}
                        className="p-2 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700"
                      >
                        <FiEdit />
                      </button>
                      <button
                        title="Excluir registro"
                        onClick={() => excluirHistorico(h)}
                        className="p-2 bg-red-700 text-white rounded-md hover:bg-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
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
