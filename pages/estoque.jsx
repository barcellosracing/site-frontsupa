'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'
import { PlusCircle, Trash2, Edit } from 'lucide-react';

export default function EstoquePage() {
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    id: '',
    nome: '',
    descricao: '',
    preco_custo: '',
    quantidade: '',
    margem_lucro: '',
  });
  const [modoEdicao, setModoEdicao] = useState(false);

  // Carrega dados do estoque e histórico
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setIsLoading(true);
    const { data: produtosData } = await supabase
      .from('estoque_produtos')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: historicoData } = await supabase
      .from('estoque_historico')
      .select('*')
      .order('created_at', { ascending: false });

    setProdutos(produtosData || []);
    setHistorico(historicoData || []);
    setIsLoading(false);
  }

  // Formatação numérica brasileira
  function parseValor(valor) {
    if (!valor) return 0;
    return parseFloat(valor.replace(',', '.'));
  }

  function formatValor(valor) {
    if (valor == null) return '';
    return parseFloat(valor).toFixed(2).replace('.', ',');
  }

  async function salvarProduto(e) {
    e.preventDefault();
    const preco_custo = parseValor(form.preco_custo);
    const quantidade = parseInt(form.quantidade);
    const margem = parseValor(form.margem_lucro);

    if (!form.nome || !quantidade || isNaN(preco_custo)) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    if (modoEdicao) {
      await supabase
        .from('estoque_produtos')
        .update({
          nome: form.nome,
          descricao: form.descricao,
          preco_custo_medio: preco_custo,
          quantidade,
          margem_lucro: margem,
        })
        .eq('id', form.id);
    } else {
      const produtoExistente = produtos.find(
        (p) => p.nome.toLowerCase() === form.nome.toLowerCase()
      );

      if (produtoExistente) {
        // Atualiza custo médio e quantidade
        const novoTotal = produtoExistente.quantidade + quantidade;
        const novoCustoMedio =
          (produtoExistente.preco_custo_medio * produtoExistente.quantidade +
            preco_custo * quantidade) /
          novoTotal;

        await supabase
          .from('estoque_produtos')
          .update({
            preco_custo_medio: novoCustoMedio,
            quantidade: novoTotal,
          })
          .eq('id', produtoExistente.id);

        await supabase.from('estoque_historico').insert([
          {
            produto_id: produtoExistente.id,
            nome: form.nome,
            descricao: form.descricao,
            preco_custo,
            quantidade,
          },
        ]);
      } else {
        const { data: novoProduto } = await supabase
          .from('estoque_produtos')
          .insert([
            {
              nome: form.nome,
              descricao: form.descricao,
              preco_custo_medio: preco_custo,
              quantidade,
              margem_lucro: margem,
            },
          ])
          .select()
          .single();

        await supabase.from('estoque_historico').insert([
          {
            produto_id: novoProduto.id,
            nome: form.nome,
            descricao: form.descricao,
            preco_custo,
            quantidade,
          },
        ]);
      }
    }

    setForm({
      id: '',
      nome: '',
      descricao: '',
      preco_custo: '',
      quantidade: '',
      margem_lucro: '',
    });
    setModoEdicao(false);
    await carregarDados();
  }

  async function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await supabase.from('estoque_produtos').delete().eq('id', id);
      await carregarDados();
    }
  }

  function editarProduto(produto) {
    setModoEdicao(true);
    setForm({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco_custo: formatValor(produto.preco_custo_medio),
      quantidade: produto.quantidade,
      margem_lucro: formatValor(produto.margem_lucro),
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Controle de Estoque</h1>

      {/* Formulário */}
      <form
        onSubmit={salvarProduto}
        className="bg-white shadow-md rounded-2xl p-4 mb-6 max-w-xl"
      >
        <h2 className="text-lg font-semibold mb-3">
          {modoEdicao ? 'Editar Produto' : 'Adicionar Produto'}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Nome do produto"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <textarea
            className="border p-2 rounded"
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            placeholder="Preço de custo (ex: 10,50)"
            value={form.preco_custo}
            onChange={(e) => setForm({ ...form, preco_custo: e.target.value })}
          />
          <input
            type="number"
            className="border p-2 rounded"
            placeholder="Quantidade"
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            placeholder="Margem de lucro (%)"
            value={form.margem_lucro}
            onChange={(e) => setForm({ ...form, margem_lucro: e.target.value })}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2 flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            {modoEdicao ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
          </button>
        </div>
      </form>

      {/* Lista de produtos */}
      <h2 className="text-xl font-semibold mb-2">Produtos no Estoque</h2>
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="border rounded-2xl p-4 shadow-sm bg-white flex justify-between items-start"
            >
              <div>
                <h3 className="font-bold">{p.nome}</h3>
                <p className="text-sm text-gray-600">{p.descricao}</p>
                <p>
                  Custo médio: <b>R$ {formatValor(p.preco_custo_medio)}</b>
                </p>
                <p>
                  Quantidade: <b>{p.quantidade}</b>
                </p>
                <p>
                  Margem: <b>{p.margem_lucro}%</b>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editarProduto(p)}>
                  <Edit size={20} className="text-blue-600" />
                </button>
                <button onClick={() => excluirProduto(p)}>
                  <Trash2 size={20} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Histórico */}
      <h2 className="text-xl font-semibold mt-8 mb-2">
        Histórico de Entradas
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-2xl shadow-md">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Nome</th>
              <th className="p-2">Descrição</th>
              <th className="p-2">Preço de custo</th>
              <th className="p-2">Quantidade</th>
              <th className="p-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="p-2">{h.nome}</td>
                <td className="p-2">{h.descricao}</td>
                <td className="p-2">R$ {formatValor(h.preco_custo)}</td>
                <td className="p-2">{h.quantidade}</td>
                <td className="p-2">
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
