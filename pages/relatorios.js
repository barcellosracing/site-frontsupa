import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ChartCard from '../components/ChartCard';

export default function Relatorios() {
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [lucro, setLucro] = useState([]);

  useEffect(() => fetchDados(), []);

  async function fetchDados() {
    const { data: r } = await supabase.from('orcamentos').select('*').eq('status', 'fechado');
    const { data: d } = await supabase.from('investimentos').select('*');

    // Agrupar por mês/ano
    const mapReceitas = {}, mapDespesas = {}, mapLucro = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      mapReceitas[key] = 0;
      mapDespesas[key] = 0;
      mapLucro[key] = 0;
    }

    r.forEach(o => {
      const date = new Date(o.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      let total = 0;
      o.itens.forEach(item => total += parseFloat(item.preco || 0));
      if (mapReceitas[key] !== undefined) mapReceitas[key] += total;
    });

    d.forEach(i => {
      const date = new Date(i.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      if (mapDespesas[key] !== undefined) mapDespesas[key] += parseFloat(i.valor || 0);
    });

    Object.keys(mapReceitas).forEach(k => {
      mapLucro[k] = mapReceitas[k] - (mapDespesas[k] || 0);
    });

    setReceitas({
      labels: Object.keys(mapReceitas
