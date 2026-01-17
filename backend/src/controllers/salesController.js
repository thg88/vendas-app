import db from '../database.js';

export const getAllSales = (req, res) => {
  const query = `
    SELECT v.*, c.nome as cliente_nome
    FROM vendas v
    JOIN clientes c ON v.cliente_id = c.id
    ORDER BY v.data_venda DESC
  `;

  db.all(query, (err, vendas) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar vendas' });
    }

    // Buscar itens para cada venda
    let processedCount = 0;
    const vendasComItens = vendas.map(venda => ({ ...venda, itens: [] }));

    if (vendas.length === 0) {
      return res.json(vendasComItens);
    }

    vendas.forEach((venda, index) => {
      const itensQuery = `
        SELECT iv.*, p.nome as produto_nome, p.tipo as produto_tipo, l.status as lote_status
        FROM itens_venda iv
        JOIN produtos p ON iv.produto_id = p.id
        LEFT JOIN lotes l ON p.lote_id = l.id
        WHERE iv.venda_id = ?
      `;

      db.all(itensQuery, [venda.id], (err, itens) => {
        if (!err && itens) {
          vendasComItens[index].itens = itens;
          // Atribuir tipo e lote_status do primeiro item à venda
          if (itens.length > 0) {
            vendasComItens[index].tipo = itens[0].produto_tipo;
            vendasComItens[index].lote_status = itens[0].lote_status;
          }
        }
        processedCount++;

        if (processedCount === vendas.length) {
          res.json(vendasComItens);
        }
      });
    });
  });
};

export const getSaleById = (req, res) => {
  const { id } = req.params;

  const vendaQuery = `
    SELECT v.*, c.nome as cliente_nome
    FROM vendas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE v.id = ?
  `;

  db.get(vendaQuery, [id], (err, venda) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar venda' });
    }
    if (!venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    const itensQuery = `
      SELECT iv.*, p.nome as produto_nome, p.tipo as produto_tipo
      FROM itens_venda iv
      JOIN produtos p ON iv.produto_id = p.id
      WHERE iv.venda_id = ?
    `;

    db.all(itensQuery, [id], (err, itens) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao buscar itens da venda' });
      }
      res.json({ ...venda, itens });
    });
  });
};

export const createSale = (req, res) => {
  const { cliente_id, itens, valor_total, forma_pagamento, data_venda } = req.body;

  if (!cliente_id || !itens || !itens.length || !forma_pagamento) {
    return res.status(400).json({ message: 'Dados incompletos para criar venda' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao iniciar transação' });
    }

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

    db.run(
      'INSERT INTO vendas (cliente_id, valor_total, forma_pagamento, status, resumo_original, data_venda) VALUES (?, ?, ?, ?, ?, ?)',
      [cliente_id, valor_total, forma_pagamento, status, JSON.stringify(resumoOriginal), data_venda],
      function (err) {
        if (err) {
          return db.run('ROLLBACK', () => {
            res.status(500).json({ message: 'Erro ao criar venda' });
          });
        }

        const vendaId = this.lastID;
        let itemsProcessed = 0;

        itens.forEach((item, index) => {
          db.run(
            'INSERT INTO itens_venda (venda_id, produto_id, quantidade, quantidade_original, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
            [vendaId, item.produto_id, item.quantidade, item.quantidade, item.preco_unitario, item.subtotal],
            (err) => {
              if (err) {
                return db.run('ROLLBACK', () => {
                  res.status(500).json({ message: 'Erro ao inserir item da venda' });
                });
              }

              // Atualizar estoque do produto
              db.run(
                'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
                [item.quantidade, item.produto_id],
                (err) => {
                  if (err) {
                    return db.run('ROLLBACK', () => {
                      res.status(500).json({ message: 'Erro ao atualizar estoque' });
                    });
                  }

                  itemsProcessed++;

                  if (itemsProcessed === itens.length) {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        return res.status(500).json({ message: 'Erro ao confirmar transação' });
                      }
                      res.status(201).json({
                        id: vendaId,
                        cliente_id,
                        valor_total,
                        forma_pagamento,
                        message: 'Venda criada com sucesso'
                      });
                    });
                  }
                }
              );
            }
          );
        });
      }
    );
  });
};

export const getSalesByDateRange = (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
  }

  const query = `
    SELECT v.*, c.nome as cliente_nome
    FROM vendas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE DATE(v.data_venda) BETWEEN ? AND ?
    ORDER BY v.data_venda DESC
  `;

  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar vendas' });
    }
    res.json(rows);
  });
};

export const deleteItemFromSale = (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    return res.status(400).json({ message: 'itemId é obrigatório' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao iniciar transação' });
    }

    // Primeiro, buscar as informações do item para atualizar o estoque
    db.get(
      'SELECT venda_id, produto_id, quantidade FROM itens_venda WHERE id = ?',
      [itemId],
      (err, item) => {
        if (err) {
          return db.run('ROLLBACK', () => {
            res.status(500).json({ message: 'Erro ao buscar item da venda' });
          });
        }

        if (!item) {
          return db.run('ROLLBACK', () => {
            res.status(404).json({ message: 'Item da venda não encontrado' });
          });
        }

        // Deletar o item da venda
        db.run(
          'DELETE FROM itens_venda WHERE id = ?',
          [itemId],
          (err) => {
            if (err) {
              return db.run('ROLLBACK', () => {
                res.status(500).json({ message: 'Erro ao deletar item da venda' });
              });
            }

            // Retornar o estoque ao produto
            db.run(
              'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
              [item.quantidade, item.produto_id],
              (err) => {
                if (err) {
                  return db.run('ROLLBACK', () => {
                    res.status(500).json({ message: 'Erro ao atualizar estoque' });
                  });
                }

                // Verificar se a venda ainda tem itens
                db.get(
                  'SELECT COUNT(*) as count FROM itens_venda WHERE venda_id = ?',
                  [item.venda_id],
                  (err, result) => {
                    if (err) {
                      return db.run('ROLLBACK', () => {
                        res.status(500).json({ message: 'Erro ao verificar itens da venda' });
                      });
                    }

                    // Se não tem mais itens, marcar como cancelada e zerar o valor
                    if (result.count === 0) {
                      db.run(
                        'UPDATE vendas SET status = ?, valor_total = 0 WHERE id = ?',
                        ['cancelada', item.venda_id],
                        (err) => {
                          if (err) {
                            return db.run('ROLLBACK', () => {
                              res.status(500).json({ message: 'Erro ao cancelar venda' });
                            });
                          }

                          db.run('COMMIT', (err) => {
                            if (err) {
                              return res.status(500).json({ message: 'Erro ao confirmar transação' });
                            }
                            res.json({ message: 'Item removido, venda cancelada (sem itens) e estoque restaurado com sucesso' });
                          });
                        }
                      );
                    } else {
                      // Calcular o novo valor total da venda baseado nos itens restantes
                      db.get(
                        'SELECT SUM(subtotal) as novo_total FROM itens_venda WHERE venda_id = ?',
                        [item.venda_id],
                        (err, totalResult) => {
                          if (err) {
                            return db.run('ROLLBACK', () => {
                              res.status(500).json({ message: 'Erro ao calcular novo total' });
                            });
                          }

                          const novoTotal = totalResult.novo_total || 0;

                          db.run(
                            'UPDATE vendas SET valor_total = ? WHERE id = ?',
                            [novoTotal, item.venda_id],
                            (err) => {
                              if (err) {
                                return db.run('ROLLBACK', () => {
                                  res.status(500).json({ message: 'Erro ao atualizar valor da venda' });
                                });
                              }

                              db.run('COMMIT', (err) => {
                                if (err) {
                                  return res.status(500).json({ message: 'Erro ao confirmar transação' });
                                }
                                res.json({ message: 'Item removido da venda e estoque restaurado com sucesso' });
                              });
                            }
                          );
                        }
                      );
                    }
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};

export const updateItemQuantity = (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!itemId || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'itemId e quantity válida são obrigatórios' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao iniciar transação' });
    }

    // Buscar o item atual com quantidade_original
    db.get(
      'SELECT venda_id, produto_id, quantidade, quantidade_original FROM itens_venda WHERE id = ?',
      [itemId],
      (err, item) => {
        if (err) {
          return db.run('ROLLBACK', () => {
            res.status(500).json({ message: 'Erro ao buscar item da venda' });
          });
        }

        if (!item) {
          return db.run('ROLLBACK', () => {
            res.status(404).json({ message: 'Item da venda não encontrado' });
          });
        }

        // Validar se a nova quantidade não excede a quantidade original
        if (quantity > item.quantidade_original) {
          return db.run('ROLLBACK', () => {
            res.status(400).json({ 
              message: `Quantidade não pode ser maior que ${item.quantidade_original} (quantidade original consignada)` 
            });
          });
        }

        // Calcular a diferença de quantidade
        const quantityDifference = item.quantidade - quantity;

        // Atualizar a quantidade do item
        db.run(
          'UPDATE itens_venda SET quantidade = ?, subtotal = (SELECT preco_unitario FROM itens_venda WHERE id = ?) * ? WHERE id = ?',
          [quantity, itemId, quantity, itemId],
          (err) => {
            if (err) {
              return db.run('ROLLBACK', () => {
                res.status(500).json({ message: 'Erro ao atualizar quantidade do item' });
              });
            }

            // Atualizar o estoque do produto (se quantidade aumentar, diminui estoque; se diminuir, aumenta estoque)
            db.run(
              'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
              [quantityDifference, item.produto_id],
              (err) => {
                if (err) {
                  return db.run('ROLLBACK', () => {
                    res.status(500).json({ message: 'Erro ao atualizar estoque' });
                  });
                }

                // Recalcular o valor total da venda
                db.get(
                  'SELECT SUM(subtotal) as novo_total FROM itens_venda WHERE venda_id = ?',
                  [item.venda_id],
                  (err, totalResult) => {
                    if (err) {
                      return db.run('ROLLBACK', () => {
                        res.status(500).json({ message: 'Erro ao calcular novo total' });
                      });
                    }

                    const novoTotal = totalResult.novo_total || 0;

                    db.run(
                      'UPDATE vendas SET valor_total = ? WHERE id = ?',
                      [novoTotal, item.venda_id],
                      (err) => {
                        if (err) {
                          return db.run('ROLLBACK', () => {
                            res.status(500).json({ message: 'Erro ao atualizar valor da venda' });
                          });
                        }

                        db.run('COMMIT', (err) => {
                          if (err) {
                            return res.status(500).json({ message: 'Erro ao confirmar transação' });
                          }
                          res.json({ message: 'Quantidade do item atualizada com sucesso' });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};

export const updatePaymentMethod = (req, res) => {
  const { vendaId } = req.params;
  const { forma_pagamento } = req.body;

  if (!vendaId || !forma_pagamento) {
    return res.status(400).json({ message: 'vendaId e forma_pagamento são obrigatórios' });
  }

  const validMethods = ['vista', 'prazo', 'consignado'];
  if (!validMethods.includes(forma_pagamento)) {
    return res.status(400).json({ message: 'Forma de pagamento inválida' });
  }

  // Buscar a venda para verificar se está totalmente quitada
  db.get('SELECT valor_total FROM vendas WHERE id = ?', [vendaId], (err, venda) => {
    if (err || !venda) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    // Buscar o total pago para verificar se está quitada
    db.get(
      'SELECT SUM(valor_pago) as total_pago FROM pagamentos_venda WHERE venda_id = ?',
      [vendaId],
      (err, payment) => {
        if (err) {
          return res.status(500).json({ message: 'Erro ao buscar pagamentos' });
        }

        const totalPago = payment?.total_pago || 0;
        const estaQuitada = totalPago >= venda.valor_total;

        // Define o status:
        // - Se à vista, sempre finalizada
        // - Se prazo/consignado e totalmente quitada, finalizada
        // - Se prazo/consignado e não totalmente quitada, ativa
        let novoStatus = 'ativa';
        if (forma_pagamento === 'vista' || estaQuitada) {
          novoStatus = 'finalizada';
        }

        db.run(
          'UPDATE vendas SET forma_pagamento = ?, status = ? WHERE id = ?',
          [forma_pagamento, novoStatus, vendaId],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Erro ao atualizar forma de pagamento' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: 'Venda não encontrada' });
            }

            res.json({ message: 'Forma de pagamento atualizada com sucesso' });
            }
        );
      }
    );
  });
};
