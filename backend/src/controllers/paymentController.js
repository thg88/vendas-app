import db from '../database.js';

export const registerPayment = (req, res) => {
  const { venda_id, valor_pago, tipo_pagamento } = req.body;

  if (!venda_id || !valor_pago || !tipo_pagamento) {
    return res.status(400).json({ message: 'Dados incompletos para registrar pagamento' });
  }

  // Buscar a venda para validar
  db.get('SELECT * FROM vendas WHERE id = ?', [venda_id], (err, venda) => {
    if (err || !venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    // Buscar pagamentos anteriores
    db.all(
      'SELECT SUM(valor_pago) as total_pago FROM pagamentos_venda WHERE venda_id = ?',
      [venda_id],
      (err, result) => {
        const totalPago = result[0]?.total_pago || 0;
        const saldoPendente = venda.valor_total - totalPago;

        if (valor_pago > saldoPendente) {
          return res.status(400).json({
            message: `Valor de pagamento excede o saldo pendente. Saldo: R$ ${saldoPendente.toFixed(2)}`
          });
        }

        // Registrar o pagamento
        db.run(
          'INSERT INTO pagamentos_venda (venda_id, valor_pago, tipo_pagamento) VALUES (?, ?, ?)',
          [venda_id, valor_pago, tipo_pagamento],
          function (err) {
            if (err) {
              return res.status(500).json({ message: 'Erro ao registrar pagamento' });
            }

            const novoSaldo = saldoPendente - valor_pago;
            const quitada = novoSaldo === 0 ? 1 : 0;

            res.status(201).json({
              id: this.lastID,
              venda_id,
              valor_pago,
              tipo_pagamento,
              saldo_pendente: novoSaldo,
              quitada,
              message: 'Pagamento registrado com sucesso'
            });
          }
        );
      }
    );
  });
};

export const getPaymentsByVenda = (req, res) => {
  const { venda_id } = req.params;

  db.all(
    'SELECT * FROM pagamentos_venda WHERE venda_id = ? ORDER BY data_pagamento DESC',
    [venda_id],
    (err, pagamentos) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao buscar pagamentos' });
      }

      // Buscar info da venda
      db.get(
        'SELECT valor_total FROM vendas WHERE id = ?',
        [venda_id],
        (err, venda) => {
          if (err || !venda) {
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
        }
      );
    }
  );
};
