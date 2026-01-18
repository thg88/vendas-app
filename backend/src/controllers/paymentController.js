import { query } from '../database.js';

export const registerPayment = async (req, res) => {
  const { venda_id, valor_pago, tipo_pagamento } = req.body;

  if (!venda_id || !valor_pago || !tipo_pagamento) {
    return res.status(400).json({ message: 'Dados incompletos para registrar pagamento' });
  }

  try {
    // Buscar a venda para validar
    const vendaResult = await query('SELECT * FROM vendas WHERE id = $1', [venda_id]);
    const venda = vendaResult.rows ? vendaResult.rows[0] : vendaResult[0];
    
    if (!venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    // Buscar pagamentos anteriores
    const paymentResult = await query(
      'SELECT SUM(valor_pago) as total_pago FROM pagamentos_venda WHERE venda_id = $1',
      [venda_id]
    );
    const paymentData = paymentResult.rows ? paymentResult.rows[0] : paymentResult[0];
    const totalPago = paymentData?.total_pago || 0;
    const saldoPendente = venda.valor_total - totalPago;

    if (valor_pago > saldoPendente) {
      return res.status(400).json({
        message: `Valor de pagamento excede o saldo pendente. Saldo: R$ ${saldoPendente.toFixed(2)}`
      });
    }

    // Registrar o pagamento
    const insertResult = await query(
      'INSERT INTO pagamentos_venda (venda_id, valor_pago, tipo_pagamento) VALUES ($1, $2, $3) RETURNING id',
      [venda_id, valor_pago, tipo_pagamento]
    );
    
    const insertedId = insertResult.rows ? insertResult.rows[0].id : insertResult[0].id;
    const novoSaldo = saldoPendente - valor_pago;
    const quitada = novoSaldo === 0 ? 1 : 0;

    res.status(201).json({
      id: insertedId,
      venda_id,
      valor_pago,
      tipo_pagamento,
      saldo_pendente: novoSaldo,
      quitada,
      message: 'Pagamento registrado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao registrar pagamento:', err);
    return res.status(500).json({ message: 'Erro ao registrar pagamento' });
  }
};

export const getPaymentsByVenda = async (req, res) => {
  const { venda_id } = req.params;

  try {
    // Buscar pagamentos
    const pagResult = await query(
      'SELECT * FROM pagamentos_venda WHERE venda_id = $1 ORDER BY data_pagamento DESC',
      [venda_id]
    );
    const pagamentos = pagResult.rows || pagResult;

    // Buscar info da venda
    const vendaResult = await query(
      'SELECT valor_total FROM vendas WHERE id = $1',
      [venda_id]
    );
    const venda = vendaResult.rows ? vendaResult.rows[0] : vendaResult[0];
    
    if (!venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    const totalPago = pagamentos.reduce((sum, p) => sum + p.valor_pago, 0);
    const saldoPendente = venda.valor_total - totalPago;

    res.json({
      venda_id,
      valor_total: venda.valor_total,
      total_pago: totalPago,
      saldo_pendente: saldoPendente,
      quitada: saldoPendente === 0,
      pagamentos
    });
  } catch (err) {
    console.error('Erro ao buscar pagamentos:', err);
    return res.status(500).json({ message: 'Erro ao buscar pagamentos' });
  }
};
