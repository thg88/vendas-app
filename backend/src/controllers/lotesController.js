import { query } from '../database.js';

// Obter todos os lotes
export const getAllLotes = async (req, res) => {
  try {
    const result = await query('SELECT * FROM lotes ORDER BY data_abertura DESC');
    const rows = result.rows || result;
    
    // Buscar valor total e valor vendido para cada lote
    const lotesComDados = [];

    if (rows.length === 0) {
      return res.json(lotesComDados);
    }

    for (let i = 0; i < rows.length; i++) {
      const lote = rows[i];
      
      // Buscar valor total dos produtos no lote (baseado no estoque original)
      const totalResult = await query(
        'SELECT SUM(preco * estoque_original) as valor_total, SUM(estoque_original) as qtde_produtos FROM produtos WHERE lote_id = $1',
        [lote.id]
      );
      const totalData = totalResult.rows ? totalResult.rows[0] : totalResult[0];

      // Buscar valor vendido
      const vendidoResult = await query(
        `SELECT SUM(iv.subtotal) as valor_vendido, SUM(iv.quantidade) as qtde_vendida FROM itens_venda iv
         JOIN produtos p ON iv.produto_id = p.id
         WHERE p.lote_id = $1`,
        [lote.id]
      );
      const vendidoData = vendidoResult.rows ? vendidoResult.rows[0] : vendidoResult[0];

      lotesComDados.push({
        ...lote,
        valor_total: totalData?.valor_total || 0,
        qtde_produtos: totalData?.qtde_produtos || 0,
        valor_vendido: vendidoData?.valor_vendido || 0,
        qtde_vendida: vendidoData?.qtde_vendida || 0
      });
    }

    res.json(lotesComDados);
  } catch (err) {
    console.error('Erro ao buscar lotes:', err);
    return res.status(500).json({ message: 'Erro ao buscar lotes' });
  }
};

// Obter lote por ID com produtos
export const getLoteById = async (req, res) => {
  const { id } = req.params;
  console.log('Buscando lote com ID:', id);

  try {
    const loteResult = await query('SELECT * FROM lotes WHERE id = $1', [id]);
    const lote = loteResult.rows ? loteResult.rows[0] : loteResult[0];
    
    if (!lote) {
      console.log('Lote não encontrado:', id);
      return res.status(404).json({ message: 'Lote não encontrado' });
    }

    console.log('Lote encontrado:', lote.numero_lote);

    // Buscar produtos do lote
    const prodResult = await query('SELECT * FROM produtos WHERE lote_id = $1 ORDER BY id DESC', [id]);
    const produtos = prodResult.rows || prodResult;

    console.log('Produtos encontrados:', produtos.length);

    // Buscar quantidades vendidas por produto
    const vendas_produtos = [];

    if (produtos.length === 0) {
      console.log('Lote sem produtos, retornando');
      return res.json({ ...lote, produtos, vendas_produtos: [] });
    }

    for (let i = 0; i < produtos.length; i++) {
      const produto = produtos[i];
      const vendidoResult = await query(
        `SELECT SUM(quantidade) as total_vendido FROM itens_venda 
         WHERE produto_id = $1`,
        [produto.id]
      );
      
      const vendidoData = vendidoResult.rows ? vendidoResult.rows[0] : vendidoResult[0];
      const totalVendido = vendidoData?.total_vendido ? vendidoData.total_vendido : 0;
      
      vendas_produtos.push({
        produto_id: produto.id,
        total_vendido: totalVendido
      });
    }

    console.log('Retornando lote com dados:', { lote: lote.numero_lote, produtos: produtos.length, vendas: vendas_produtos.length });
    res.json({ ...lote, produtos, vendas_produtos });
  } catch (err) {
    console.error('Erro ao buscar lote:', err);
    return res.status(500).json({ message: 'Erro ao buscar lote' });
  }
};

// Obter lote aberto atual
export const getLoteAberto = async (req, res) => {
  try {
    const loteResult = await query("SELECT * FROM lotes WHERE status = 'aberto' ORDER BY data_abertura DESC LIMIT 1");
    const lote = loteResult.rows ? loteResult.rows[0] : loteResult[0];
    
    if (!lote) {
      return res.json(null);
    }

    // Buscar produtos do lote
    const prodResult = await query('SELECT * FROM produtos WHERE lote_id = $1 ORDER BY id DESC', [lote.id]);
    const produtos = prodResult.rows || prodResult;
    
    res.json({ ...lote, produtos });
  } catch (err) {
    console.error('Erro ao buscar lote aberto:', err);
    return res.status(500).json({ message: 'Erro ao buscar lote aberto' });
  }
};

// Criar novo lote
export const createLote = async (req, res) => {
  const { data_recebimento, tipo, observacoes } = req.body;

  if (!data_recebimento) {
    return res.status(400).json({ message: 'Data de recebimento é obrigatória' });
  }

  if (!tipo) {
    return res.status(400).json({ message: 'Tipo de lote é obrigatório' });
  }

  try {
    // Verificar se já existe um lote aberto
    const existingResult = await query("SELECT id FROM lotes WHERE status = 'aberto'");
    const existingLote = existingResult.rows ? existingResult.rows[0] : existingResult[0];
    
    if (existingLote) {
      return res.status(400).json({ message: 'Já existe um lote aberto. Feche-o antes de criar um novo.' });
    }

    // Buscar o próximo número de lote
    const maxResult = await query("SELECT MAX(CAST(numero_lote AS INTEGER)) as max_numero FROM lotes");
    const maxData = maxResult.rows ? maxResult.rows[0] : maxResult[0];
    const proximoNumero = String((parseInt(maxData?.max_numero || 0, 10) + 1)).padStart(3, '0');

    // Criar novo lote
    const insertResult = await query(
      'INSERT INTO lotes (numero_lote, status, tipo, data_recebimento, observacoes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [proximoNumero, 'aberto', tipo, data_recebimento, observacoes || null]
    );
    
    const lote = insertResult.rows ? insertResult.rows[0] : insertResult[0];
    res.status(201).json({
      ...lote,
      produtos: []
    });
  } catch (err) {
    console.error('Erro ao criar lote:', err);
    return res.status(500).json({ message: 'Erro ao criar lote' });
  }
};

// Fechar lote
export const closeLote = async (req, res) => {
  const { id } = req.params;

  try {
    const loteResult = await query('SELECT * FROM lotes WHERE id = $1', [id]);
    const lote = loteResult.rows ? loteResult.rows[0] : loteResult[0];
    
    if (!lote) {
      return res.status(404).json({ message: 'Lote não encontrado' });
    }
    if (lote.status === 'fechado') {
      return res.status(400).json({ message: 'Este lote já está fechado' });
    }

    await query(
      "UPDATE lotes SET status = 'fechado', data_fechamento = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
    
    res.json({ message: 'Lote fechado com sucesso' });
  } catch (err) {
    console.error('Erro ao fechar lote:', err);
    return res.status(500).json({ message: 'Erro ao fechar lote' });
  }
};

// Reabrir lote (se necessário)
export const reopenLote = async (req, res) => {
  const { id } = req.params;

  try {
    const loteResult = await query('SELECT * FROM lotes WHERE id = $1', [id]);
    const lote = loteResult.rows ? loteResult.rows[0] : loteResult[0];
    
    if (!lote) {
      return res.status(404).json({ message: 'Lote não encontrado' });
    }
    if (lote.status === 'aberto') {
      return res.status(400).json({ message: 'Este lote já está aberto' });
    }

    await query(
      "UPDATE lotes SET status = 'aberto', data_fechamento = NULL WHERE id = $1",
      [id]
    );
    
    res.json({ message: 'Lote reaberto com sucesso' });
  } catch (err) {
    console.error('Erro ao reabrir lote:', err);
    return res.status(500).json({ message: 'Erro ao reabrir lote' });
  }
};

// Deletar lote aberto vazio (sem produtos)
export const deleteEmptyLote = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se o lote tem produtos
    const countResult = await query('SELECT COUNT(*) as count FROM produtos WHERE lote_id = $1', [id]);
    const countData = countResult.rows ? countResult.rows[0] : countResult[0];
    
    if (countData.count > 0) {
      return res.status(400).json({ message: 'Não é possível deletar um lote com produtos. Use a opção Fechar Lote' });
    }

    // Deletar lote vazio completamente
    await query('DELETE FROM lotes WHERE id = $1', [id]);
    res.json({ message: 'Lote deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar lote:', err);
    return res.status(500).json({ message: 'Erro ao deletar lote' });
  }
};

// Arquivar lote (zerar estoque dos produtos sem deletar)
export const deleteLote = async (req, res) => {
  const { id } = req.params;

  try {
    // Zerar estoque dos produtos do lote que ainda possuem estoque > 0
    await query('UPDATE produtos SET estoque = 0 WHERE lote_id = $1 AND estoque > 0', [id]);
    
    // Marcar lote como finalizado
    await query("UPDATE lotes SET status = 'finalizado', data_finalizacao = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    
    res.json({ message: 'Lote finalizado com sucesso (estoque zerado)' });
  } catch (err) {
    console.error('Erro ao arquivar lote:', err);
    return res.status(500).json({ message: 'Erro ao arquivar lote' });
  }
};

// Obter estatísticas do lote
export const getLoteStats = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      'SELECT COUNT(*) as total_produtos, SUM(estoque) as total_estoque, SUM(preco * estoque) as valor_total FROM produtos WHERE lote_id = $1',
      [id]
    );
    const data = result.rows ? result.rows[0] : result[0];
    res.json(data || { total_produtos: 0, total_estoque: 0, valor_total: 0 });
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};
