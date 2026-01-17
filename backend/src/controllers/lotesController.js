import db from '../database.js';

// Obter todos os lotes
export const getAllLotes = (req, res) => {
  db.all('SELECT * FROM lotes ORDER BY data_abertura DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar lotes' });
    }
    
    // Buscar valor total e valor vendido para cada lote
    let processedCount = 0;
    const lotesComDados = rows.map(lote => ({ ...lote, valor_total: 0, valor_vendido: 0 }));

    if (rows.length === 0) {
      return res.json(lotesComDados);
    }

    rows.forEach((lote, index) => {
      // Buscar valor total dos produtos no lote (baseado no estoque original)
      db.get(
        'SELECT SUM(preco * estoque_original) as valor_total FROM produtos WHERE lote_id = ?',
        [lote.id],
        (err, result) => {
          if (!err && result) {
            lotesComDados[index].valor_total = result.valor_total || 0;
          }

          // Buscar valor vendido
          db.get(
            `SELECT SUM(iv.subtotal) as valor_vendido FROM itens_venda iv
             JOIN produtos p ON iv.produto_id = p.id
             WHERE p.lote_id = ?`,
            [lote.id],
            (err, result) => {
              if (!err && result) {
                lotesComDados[index].valor_vendido = result.valor_vendido || 0;
              }
              
              processedCount++;
              if (processedCount === rows.length) {
                res.json(lotesComDados);
              }
            }
          );
        }
      );
    });
  });
};

// Obter lote por ID com produtos
export const getLoteById = (req, res) => {
  const { id } = req.params;
  console.log('Buscando lote com ID:', id);

  db.get('SELECT * FROM lotes WHERE id = ?', [id], (err, lote) => {
    if (err) {
      console.error('Erro ao buscar lote:', err);
      return res.status(500).json({ message: 'Erro ao buscar lote' });
    }
    if (!lote) {
      console.log('Lote não encontrado:', id);
      return res.status(404).json({ message: 'Lote não encontrado' });
    }

    console.log('Lote encontrado:', lote.numero_lote);

    // Buscar produtos do lote
    db.all('SELECT * FROM produtos WHERE lote_id = ? ORDER BY id DESC', [id], (err, produtos) => {
      if (err) {
        console.error('Erro ao buscar produtos:', err);
        return res.status(500).json({ message: 'Erro ao buscar produtos do lote' });
      }

      console.log('Produtos encontrados:', produtos.length);

      // Buscar quantidades vendidas por produto
      const vendas_produtos = [];
      let processedCount = 0;

      if (produtos.length === 0) {
        console.log('Lote sem produtos, retornando');
        return res.json({ ...lote, produtos, vendas_produtos: [] });
      }

      produtos.forEach((produto, index) => {
        db.get(
          `SELECT SUM(quantidade) as total_vendido FROM itens_venda 
           WHERE produto_id = ?`,
          [produto.id],
          (err, result) => {
            if (err) {
              console.error('Erro ao buscar vendas do produto:', err);
            }
            
            const totalVendido = (result && result.total_vendido) ? result.total_vendido : 0;
            vendas_produtos.push({
              produto_id: produto.id,
              total_vendido: totalVendido
            });
            
            processedCount++;
            if (processedCount === produtos.length) {
              console.log('Retornando lote com dados:', { lote: lote.numero_lote, produtos: produtos.length, vendas: vendas_produtos.length });
              res.json({ ...lote, produtos, vendas_produtos });
            }
          }
        );
      });
    });
  });
};

// Obter lote aberto atual
export const getLoteAberto = (req, res) => {
  db.get("SELECT * FROM lotes WHERE status = 'aberto' ORDER BY data_abertura DESC LIMIT 1", (err, lote) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar lote aberto' });
    }
    if (!lote) {
      return res.json(null);
    }

    // Buscar produtos do lote
    db.all('SELECT * FROM produtos WHERE lote_id = ? ORDER BY id DESC', [lote.id], (err, produtos) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao buscar produtos do lote' });
      }
      res.json({ ...lote, produtos });
    });
  });
};

// Criar novo lote
export const createLote = (req, res) => {
  const { data_recebimento, tipo, observacoes } = req.body;

  if (!data_recebimento) {
    return res.status(400).json({ message: 'Data de recebimento é obrigatória' });
  }

  if (!tipo) {
    return res.status(400).json({ message: 'Tipo de lote é obrigatório' });
  }

  // Verificar se já existe um lote aberto
  db.get("SELECT id FROM lotes WHERE status = 'aberto'", (err, existingLote) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar lotes abertos' });
    }

    if (existingLote) {
      return res.status(400).json({ message: 'Já existe um lote aberto. Feche-o antes de criar um novo.' });
    }

    // Buscar o próximo número de lote
    db.get("SELECT COUNT(*) as count FROM lotes", (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao gerar número do lote' });
      }

      const proximoNumero = String(result.count + 1).padStart(3, '0');

      // Criar novo lote
      db.run(
        'INSERT INTO lotes (numero_lote, status, tipo, data_recebimento, observacoes) VALUES (?, ?, ?, ?, ?)',
        [proximoNumero, 'aberto', tipo, data_recebimento, observacoes || null],
        function (err) {
          if (err) {
            return res.status(500).json({ message: 'Erro ao criar lote' });
          }
          res.status(201).json({
            id: this.lastID,
            numero_lote: proximoNumero,
            status: 'aberto',
            tipo,
            data_recebimento,
            observacoes: observacoes || null,
            produtos: []
          });
        }
      );
    });
  });
};

// Fechar lote
export const closeLote = (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM lotes WHERE id = ?', [id], (err, lote) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar lote' });
    }
    if (!lote) {
      return res.status(404).json({ message: 'Lote não encontrado' });
    }
    if (lote.status === 'fechado') {
      return res.status(400).json({ message: 'Este lote já está fechado' });
    }

    db.run(
      "UPDATE lotes SET status = 'fechado', data_fechamento = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'Erro ao fechar lote' });
        }
        res.json({ message: 'Lote fechado com sucesso' });
      }
    );
  });
};

// Reabrir lote (se necessário)
export const reopenLote = (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM lotes WHERE id = ?', [id], (err, lote) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar lote' });
    }
    if (!lote) {
      return res.status(404).json({ message: 'Lote não encontrado' });
    }
    if (lote.status === 'aberto') {
      return res.status(400).json({ message: 'Este lote já está aberto' });
    }

    db.run(
      "UPDATE lotes SET status = 'aberto', data_fechamento = NULL WHERE id = ?",
      [id],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'Erro ao reabrir lote' });
        }
        res.json({ message: 'Lote reaberto com sucesso' });
      }
    );
  });
};

// Deletar lote aberto vazio (sem produtos)
export const deleteEmptyLote = (req, res) => {
  const { id } = req.params;

  // Verificar se o lote tem produtos
  db.get('SELECT COUNT(*) as count FROM produtos WHERE lote_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar lote' });
    }

    if (result.count > 0) {
      return res.status(400).json({ message: 'Não é possível deletar um lote com produtos. Use a opção Fechar Lote' });
    }

    // Deletar lote vazio completamente
    db.run('DELETE FROM lotes WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao deletar lote' });
      }
      res.json({ message: 'Lote deletado com sucesso' });
    });
  });
};

// Arquivar lote (zerar estoque dos produtos sem deletar)
export const deleteLote = (req, res) => {
  const { id } = req.params;

  // Zerar estoque dos produtos do lote que ainda possuem estoque > 0
  db.run('UPDATE produtos SET estoque = 0 WHERE lote_id = ? AND estoque > 0', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao arquivar lote' });
    }
    
    // Marcar lote como finalizado
    db.run("UPDATE lotes SET status = 'finalizado', data_finalizacao = CURRENT_TIMESTAMP WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao finalizar lote' });
      }
      res.json({ message: 'Lote finalizado com sucesso (estoque zerado)' });
    });
  });
};

// Obter estatísticas do lote
export const getLoteStats = (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT COUNT(*) as total_produtos, SUM(estoque) as total_estoque, SUM(preco * estoque) as valor_total FROM produtos WHERE lote_id = ?',
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
      }
      res.json(rows[0] || { total_produtos: 0, total_estoque: 0, valor_total: 0 });
    }
  );
};
