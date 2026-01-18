import { query } from '../database.js';

export const getAllSales = async (req, res) => {
  try {
    const queryStr = `
      SELECT v.*, c.nome as cliente_nome
      FROM vendas v
      JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.data_venda DESC
    `;

    const result = await query(queryStr);
    const vendas = result.rows || result;

    // Buscar itens para cada venda
    const vendasComItens = vendas.map(venda => ({ ...venda, itens: [] }));

    if (vendas.length === 0) {
      return res.json(vendasComItens);
    }

    for (let i = 0; i < vendas.length; i++) {
      const venda = vendas[i];
      const itensQuery = `
        SELECT iv.*, p.nome as produto_nome, p.tipo as produto_tipo, l.status as lote_status
        FROM itens_venda iv
        JOIN produtos p ON iv.produto_id = p.id
        LEFT JOIN lotes l ON p.lote_id = l.id
        WHERE iv.venda_id = $1
      `;

      const itensResult = await query(itensQuery, [venda.id]);
      const itens = itensResult.rows || itensResult;
      
      if (itens && itens.length > 0) {
        vendasComItens[i].itens = itens;
        vendasComItens[i].tipo = itens[0].produto_tipo;
        vendasComItens[i].lote_status = itens[0].lote_status;
      }
    }

    res.json(vendasComItens);
  } catch (err) {
    console.error('Erro ao buscar vendas:', err);
    return res.status(500).json({ message: 'Erro ao buscar vendas' });
  }
};

export const getSaleById = async (req, res) => {
  const { id } = req.params;

  try {
    const vendaQuery = `
      SELECT v.*, c.nome as cliente_nome
      FROM vendas v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = $1
    `;

    const vendaResult = await query(vendaQuery, [id]);
    const venda = vendaResult.rows ? vendaResult.rows[0] : vendaResult[0];
    
    if (!venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    const itensQuery = `
      SELECT iv.*, p.nome as produto_nome, p.tipo as produto_tipo
      FROM itens_venda iv
      JOIN produtos p ON iv.produto_id = p.id
      WHERE iv.venda_id = $1
    `;

    const itensResult = await query(itensQuery, [id]);
    const itens = itensResult.rows || itensResult;
    
    res.json({ ...venda, itens });
  } catch (err) {
    console.error('Erro ao buscar venda:', err);
    return res.status(500).json({ message: 'Erro ao buscar venda' });
  }
};

export const createSale = async (req, res) => {
  const { cliente_id, itens, valor_total, forma_pagamento, data_venda } = req.body;

  if (!cliente_id || !itens || !itens.length || !forma_pagamento) {
    return res.status(400).json({ message: 'Dados incompletos para criar venda' });
  }

  try {
    // Criar resumo dos itens originais
    const resumoOriginal = itens.map(item => ({
      produto_id: item.produto_id,
      produto_nome: item.produto_nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal
    }));

    // Define status baseado na forma de pagamento
    // à vista = finalizada, prazo/consignado = ativa
    const status = forma_pagamento === 'vista' ? 'finalizada' : 'ativa';

    // Inserir venda
    const vendaResult = await query(
      'INSERT INTO vendas (cliente_id, valor_total, forma_pagamento, status, resumo_original, data_venda) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [cliente_id, valor_total, forma_pagamento, status, JSON.stringify(resumoOriginal), data_venda]
    );
    
    const vendaId = vendaResult.rows ? vendaResult.rows[0].id : vendaResult[0].id;

    // Inserir itens da venda e atualizar estoque
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      
      await query(
        'INSERT INTO itens_venda (venda_id, produto_id, quantidade, quantidade_original, preco_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
        [vendaId, item.produto_id, item.quantidade, item.quantidade, item.preco_unitario, item.subtotal]
      );

      // Atualizar estoque do produto
      await query(
        'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
        [item.quantidade, item.produto_id]
      );
    }

    res.status(201).json({
      id: vendaId,
      cliente_id,
      valor_total,
      forma_pagamento,
      message: 'Venda criada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao criar venda:', err);
    return res.status(500).json({ message: 'Erro ao criar venda' });
  }
};

export const getSalesByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
  }

  try {
    const queryStr = `
      SELECT v.*, c.nome as cliente_nome
      FROM vendas v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE DATE(v.data_venda) BETWEEN $1 AND $2
      ORDER BY v.data_venda DESC
    `;

    const result = await query(queryStr, [startDate, endDate]);
    const rows = result.rows || result;
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar vendas por período:', err);
    return res.status(500).json({ message: 'Erro ao buscar vendas' });
  }
};

export const deleteItemFromSale = async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    return res.status(400).json({ message: 'itemId é obrigatório' });
  }

  try {
    // Primeiro, buscar as informações do item para atualizar o estoque
    const itemResult = await query(
      'SELECT venda_id, produto_id, quantidade FROM itens_venda WHERE id = $1',
      [itemId]
    );
    const item = itemResult.rows ? itemResult.rows[0] : itemResult[0];

    if (!item) {
      return res.status(404).json({ message: 'Item da venda não encontrado' });
    }

    // Deletar o item da venda
    await query(
      'DELETE FROM itens_venda WHERE id = $1',
      [itemId]
    );

    // Retornar o estoque ao produto
    await query(
      'UPDATE produtos SET estoque = estoque + $1 WHERE id = $2',
      [item.quantidade, item.produto_id]
    );

    // Verificar se a venda ainda tem itens
    const countResult = await query(
      'SELECT COUNT(*) as count FROM itens_venda WHERE venda_id = $1',
      [item.venda_id]
    );
    const countData = countResult.rows ? countResult.rows[0] : countResult[0];

    // Se não tem mais itens, marcar como cancelada e zerar o valor
    if (countData.count === 0) {
      await query(
        'UPDATE vendas SET status = $1, valor_total = 0 WHERE id = $2',
        ['cancelada', item.venda_id]
      );
      return res.json({ message: 'Item removido, venda cancelada (sem itens) e estoque restaurado com sucesso' });
    }

    // Calcular o novo valor total da venda baseado nos itens restantes
    const totalResult = await query(
      'SELECT SUM(subtotal) as novo_total FROM itens_venda WHERE venda_id = $1',
      [item.venda_id]
    );
    const totalData = totalResult.rows ? totalResult.rows[0] : totalResult[0];
    const novoTotal = totalData?.novo_total || 0;

    await query(
      'UPDATE vendas SET valor_total = $1 WHERE id = $2',
      [novoTotal, item.venda_id]
    );

    res.json({ message: 'Item removido da venda e estoque restaurado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar item da venda:', err);
    return res.status(500).json({ message: 'Erro ao deletar item da venda' });
  }
};

export const updateItemQuantity = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!itemId || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'itemId e quantity válida são obrigatórios' });
  }

  try {
    // Buscar o item atual com quantidade_original
    const itemResult = await query(
      'SELECT venda_id, produto_id, quantidade, quantidade_original FROM itens_venda WHERE id = $1',
      [itemId]
    );
    const item = itemResult.rows ? itemResult.rows[0] : itemResult[0];

    if (!item) {
      return res.status(404).json({ message: 'Item da venda não encontrado' });
    }

    // Validar se a nova quantidade não excede a quantidade original
    if (quantity > item.quantidade_original) {
      return res.status(400).json({ 
        message: `Quantidade não pode ser maior que ${item.quantidade_original} (quantidade original consignada)` 
      });
    }

    // Calcular a diferença de quantidade
    const quantityDifference = item.quantidade - quantity;

    // Atualizar a quantidade do item
    await query(
      'UPDATE itens_venda SET quantidade = $1, subtotal = (SELECT preco_unitario FROM itens_venda WHERE id = $2) * $3 WHERE id = $4',
      [quantity, itemId, quantity, itemId]
    );

    // Atualizar o estoque do produto (se quantidade aumentar, diminui estoque; se diminuir, aumenta estoque)
    await query(
      'UPDATE produtos SET estoque = estoque + $1 WHERE id = $2',
      [quantityDifference, item.produto_id]
    );

    // Recalcular o valor total da venda
    const totalResult = await query(
      'SELECT SUM(subtotal) as novo_total FROM itens_venda WHERE venda_id = $1',
      [item.venda_id]
    );
    const totalData = totalResult.rows ? totalResult.rows[0] : totalResult[0];
    const novoTotal = totalData?.novo_total || 0;

    await query(
      'UPDATE vendas SET valor_total = $1 WHERE id = $2',
      [novoTotal, item.venda_id]
    );

    res.json({ message: 'Quantidade do item atualizada com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar quantidade do item:', err);
    return res.status(500).json({ message: 'Erro ao atualizar quantidade do item' });
  }
};

export const updatePaymentMethod = async (req, res) => {
  const { vendaId } = req.params;
  const { forma_pagamento } = req.body;

  if (!vendaId || !forma_pagamento) {
    return res.status(400).json({ message: 'vendaId e forma_pagamento são obrigatórios' });
  }

  const validMethods = ['vista', 'prazo', 'consignado'];
  if (!validMethods.includes(forma_pagamento)) {
    return res.status(400).json({ message: 'Forma de pagamento inválida' });
  }

  try {
    // Buscar a venda para verificar se está totalmente quitada
    const vendaResult = await query('SELECT valor_total FROM vendas WHERE id = $1', [vendaId]);
    const venda = vendaResult.rows ? vendaResult.rows[0] : vendaResult[0];
    
    if (!venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    // Buscar o total pago para verificar se está quitada
    const paymentResult = await query(
      'SELECT SUM(valor_pago) as total_pago FROM pagamentos_venda WHERE venda_id = $1',
      [vendaId]
    );
    const paymentData = paymentResult.rows ? paymentResult.rows[0] : paymentResult[0];
    const totalPago = paymentData?.total_pago || 0;
    const estaQuitada = totalPago >= venda.valor_total;

    // Define o status:
    // - Se à vista, sempre finalizada
    // - Se prazo/consignado e totalmente quitada, finalizada
    // - Se prazo/consignado e não totalmente quitada, ativa
    let novoStatus = 'ativa';
    if (forma_pagamento === 'vista' || estaQuitada) {
      novoStatus = 'finalizada';
    }

    await query(
      'UPDATE vendas SET forma_pagamento = $1, status = $2 WHERE id = $3',
      [forma_pagamento, novoStatus, vendaId]
    );

    res.json({ message: 'Forma de pagamento atualizada com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar forma de pagamento:', err);
    return res.status(500).json({ message: 'Erro ao atualizar forma de pagamento' });
  }
};
