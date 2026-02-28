import { useState, useEffect, useRef } from 'react';
import { salesService, clientService, paymentService, lotesService } from '../services/api';
import { ChevronDown, AlertCircle, X, Trash2, Edit2, Info } from 'lucide-react';

export default function SalesQuery() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
  const [paymentType, setPaymentType] = useState('total');
  const [partialAmount, setPartialAmount] = useState('');
  const [salePayments, setSalePayments] = useState(null);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSaleForInfo, setSelectedSaleForInfo] = useState(null);
  const [expandFilters, setExpandFilters] = useState(false);
  const [lotes, setLotes] = useState([]);
  const [selectedLotes, setSelectedLotes] = useState([]);
  const [showLoteDropdown, setShowLoteDropdown] = useState(false);
  const loteDropdownRef = useRef(null);

  useEffect(() => {
    loadSales();
    loadClients();
    loadLotes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (loteDropdownRef.current && !loteDropdownRef.current.contains(e.target)) {
        setShowLoteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadLotes = async () => {
    try {
      const response = await lotesService.getAll();
      setLotes(response.data);
    } catch (err) {
      console.error('Erro ao carregar lotes', err);
    }
  };

  useEffect(() => {
    // Quando as vendas são carregadas, calcular os totais automaticamente
    if (sales.length > 0) {
      const total = sales.reduce((sum, sale) => sum + (parseFloat(sale.valor_total) || 0), 0);
      setTotalSalesAmount(total);
      
      // Calcular total recebido (vendas à vista + parcelas pagas das vendas à prazo)
      const totalRecebidoCalc = sales.reduce((sum, sale) => {
        if (sale.forma_pagamento === 'vista') {
          return sum + (parseFloat(sale.valor_total) || 0);
        } else if (sale.forma_pagamento === 'prazo' && sale.paymentInfo) {
          return sum + (parseFloat(sale.paymentInfo.total_pago) || 0);
        }
        return sum;
      }, 0);
      setTotalRecebido(totalRecebidoCalc);
    }
  }, [sales]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const response = await salesService.getAll();
      // For sales with 'prazo' or 'consignado', fetch payment summary and attach when there's a partial payment
      const salesWithPayments = await Promise.all(response.data.map(async (sale) => {
        if (sale.forma_pagamento === 'prazo' || sale.forma_pagamento === 'consignado') {
          try {
            const payResp = await paymentService.getByVenda(sale.id);
            const payInfo = payResp.data;
            // attach paymentInfo when available (covers partial and fully paid sales)
            if (payInfo) {
              sale.paymentInfo = payInfo;
            }
          } catch (err) {
            // ignore payment fetch errors for now
          }
        }
        return sale;
      }));

      setSales(salesWithPayments);
      setFilteredSales(salesWithPayments);
    } catch (err) {
      setError('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientService.getAll();
      setClients(response.data);
    } catch (err) {
      console.error('Erro ao carregar clientes', err);
    }
  };

  const handleFilter = () => {
    let filtered = sales.map(sale => ({ ...sale })); // Clonar vendas para não modificar as originais

    if (startDate || endDate) {
      filtered = filtered.filter(sale => {
        // Extrair apenas a data (YYYY-MM-DD) da venda
        // Lidar com formatos: "2026-01-12T02:28:46.189Z" e "2026-01-12 00:18:07"
        const saleDateString = sale.data_venda.includes('T') 
          ? sale.data_venda.split('T')[0] 
          : sale.data_venda.split(' ')[0];
        
        if (startDate && saleDateString < startDate) return false;
        if (endDate && saleDateString > endDate) return false;
        return true;
      });
    }

    if (selectedClientId) {
      filtered = filtered.filter(sale => sale.cliente_id == selectedClientId);
    }

    if (selectedPaymentMethod) {
      filtered = filtered.filter(sale => sale.forma_pagamento === selectedPaymentMethod);
    }

    if (selectedLotes.length > 0) {
      filtered = filtered.filter(sale => selectedLotes.includes(String(sale.lote_id)));
    }

    if (selectedProductType) {
      // Normalizar o tipo selecionado para comparação (lowercase, sem espaços/hífens)
      const normalizedSelectedType = selectedProductType.toLowerCase().replace(/[\s-]/g, '');
      
      // Filtrar vendas que têm itens do tipo selecionado
      filtered = filtered.filter(sale => {
        return sale.itens && sale.itens.some(item => {
          const normalizedItemType = (item.produto_tipo || '').toLowerCase().replace(/[\s-]/g, '');
          return normalizedItemType === normalizedSelectedType;
        });
      });
      
      // Filtrar também os itens dentro de cada venda para mostrar apenas do tipo selecionado
      filtered = filtered.map(sale => ({
        ...sale,
        itens: sale.itens.filter(item => {
          const normalizedItemType = (item.produto_tipo || '').toLowerCase().replace(/[\s-]/g, '');
          return normalizedItemType === normalizedSelectedType;
        }),
        valor_total: sale.itens
          .filter(item => {
            const normalizedItemType = (item.produto_tipo || '').toLowerCase().replace(/[\s-]/g, '');
            return normalizedItemType === normalizedSelectedType;
          })
          .reduce((sum, item) => sum + item.subtotal, 0)
      }));
    }

    // Ordenar por data mais recente primeiro
    filtered.sort((a, b) => {
      const dateA = new Date(a.data_venda);
      const dateB = new Date(b.data_venda);
      return dateB - dateA;
    });

    setFilteredSales(filtered);
    
    // Calcular total de vendas filtradas
    const total = filtered.reduce((sum, sale) => sum + (parseFloat(sale.valor_total) || 0), 0);
    setTotalSalesAmount(total);
    
    // Calcular total recebido (vendas à vista + parcelas pagas das vendas à prazo)
    const totalRecebidoCalc = filtered.reduce((sum, sale) => {
      if (sale.forma_pagamento === 'vista') {
        return sum + (parseFloat(sale.valor_total) || 0);
      } else if (sale.forma_pagamento === 'prazo' && sale.paymentInfo) {
        return sum + (parseFloat(sale.paymentInfo.total_pago) || 0);
      }
      return sum;
    }, 0);
    setTotalRecebido(totalRecebidoCalc);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedClientId('');
    setSelectedPaymentMethod('');
    setSelectedProductType('');
    setSelectedLotes([]);
    setShowLoteDropdown(false);
    setFilteredSales(sales);
    
    // Calcular total de todas as vendas
    const total = sales.reduce((sum, sale) => sum + (parseFloat(sale.valor_total) || 0), 0);
    setTotalSalesAmount(total);
    
    // Calcular total recebido (vendas à vista + parcelas pagas das vendas à prazo)
    const totalRecebidoCalc = sales.reduce((sum, sale) => {
      if (sale.forma_pagamento === 'vista') {
        return sum + (parseFloat(sale.valor_total) || 0);
      } else if (sale.forma_pagamento === 'prazo' && sale.paymentInfo) {
        return sum + (parseFloat(sale.paymentInfo.total_pago) || 0);
      }
      return sum;
    }, 0);
    setTotalRecebido(totalRecebidoCalc);
  };

  const toggleDetails = async (saleId) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  const handleDeleteItem = async (itemId, saleId) => {
    if (!window.confirm('Tem certeza que deseja remover este item? O estoque será restaurado.')) {
      return;
    }

    try {
      await salesService.deleteItem(itemId);
      setSuccess('Item removido com sucesso e estoque restaurado');
      loadSales(); // Recarregar vendas
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao remover item: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditItem = (item) => {
    setSelectedItemForEdit(item);
    setEditQuantity(item.quantidade.toString());
    setShowEditModal(true);
  };

  const handleSaveEditQuantity = async () => {
    const newQuantity = parseInt(editQuantity);

    if (!newQuantity || newQuantity < 1) {
      setError('Digite uma quantidade válida (maior que 0)');
      return;
    }

    try {
      await salesService.updateItemQuantity(selectedItemForEdit.id, newQuantity);
      setSuccess('Quantidade atualizada com sucesso e estoque ajustado');
      setShowEditModal(false);
      loadSales(); // Recarregar vendas
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar quantidade: ' + (err.response?.data?.message || err.message));
    }
  };

  const openPaymentModal = async (sale) => {
    setSelectedSaleForPayment(sale);
    setPaymentType('total');
    setPartialAmount('');
    setError(''); // Limpar erros anteriores
    setLoading(true);
    
    try {
      const response = await paymentService.getByVenda(sale.id);
      setSalePayments(response.data);
    } catch (err) {
      console.error('Erro ao buscar pagamentos', err);
      setSalePayments(null);
    } finally {
      setLoading(false);
    }
    
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSaleForPayment(null);
    setPaymentType('total');
    setPartialAmount('');
    setSalePayments(null);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Para 'Gerar a Prazo', não precisa registrar pagamento, apenas atualizar forma_pagamento
      if (paymentType === 'generatePrazo') {
        await salesService.updatePaymentMethod(selectedSaleForPayment.id, 'prazo');
        setSuccess('Venda convertida para prazo com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
        loadSales();
        closePaymentModal();
        return;
      }

      let valor;
      if (paymentType === 'total') {
        // saldo_pendente do backend já vem como número; usar parseFloat como garantia
        const saldoNum = salePayments && salePayments.saldo_pendente != null
          ? parseFloat(salePayments.saldo_pendente)
          : parseFloat(selectedSaleForPayment.valor_total);
        valor = isNaN(saldoNum) ? parseFloat(selectedSaleForPayment.valor_total) : saldoNum;
      } else if (paymentType === 'partial') {
        valor = parseFloat(partialAmount);
      }

      if (!valor || isNaN(valor) || valor <= 0) {
        setError('Insira um valor válido');
        setLoading(false);
        return;
      }

      // client-side check for partial payments exceeding pending balance
      if (paymentType === 'partial' && salePayments && valor > parseFloat(salePayments.saldo_pendente) + 0.001) {
        setError('Valor de pagamento excede o saldo pendente');
        setLoading(false);
        return;
      }

      // Registrar pagamento
      try {
        await paymentService.register({
          venda_id: selectedSaleForPayment.id,
          valor_pago: valor,
          tipo_pagamento: paymentType === 'total' ? 'Total' : 'Parcial'
        });
      } catch (err) {
        const msg = err.response?.data?.message || 'Erro ao registrar pagamento';
        const detail = err.response?.data?.detail ? ` [${err.response.data.detail}]` : '';
        setError(msg + detail);
        setLoading(false);
        return;
      }

      // Atualizar forma_pagamento dependendo do tipo
      // Para vendas prazo com pagamento total, mantém como 'prazo' (só muda a cor do valor)
      // Para outros casos, converte normalmente
      let novaFormaPagamento = selectedSaleForPayment.forma_pagamento;
      if (paymentType === 'partial') {
        novaFormaPagamento = 'prazo';
      }
      // Se for pagamento total de uma venda consignado, converte para vista
      if (paymentType === 'total' && selectedSaleForPayment.forma_pagamento === 'consignado') {
        novaFormaPagamento = 'vista';
      }
      // Para pagamento total de uma venda prazo, mantém como prazo
      if (paymentType === 'total' && selectedSaleForPayment.forma_pagamento === 'prazo') {
        novaFormaPagamento = 'prazo';
      }
      // Sempre chamar updatePaymentMethod para atualizar status quando o pagamento é total
      if (novaFormaPagamento !== selectedSaleForPayment.forma_pagamento || paymentType === 'total') {
        try {
          await salesService.updatePaymentMethod(selectedSaleForPayment.id, novaFormaPagamento);
        } catch (err) {
          // Pagamento já foi registrado; falha no updatePaymentMethod não impede sucesso
          console.warn('Aviso: falha ao atualizar forma de pagamento:', err.response?.data?.message || err.message);
        }
      }

      setSuccess('Pagamento registrado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      loadSales();
      closePaymentModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isWithin7Days = (dateString) => {
    const saleDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - saleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const canEditDeleteItems = (sale) => {
    if (sale.forma_pagamento === 'consignado') {
      return true;
    }
    if (sale.forma_pagamento === 'prazo' || sale.forma_pagamento === 'vista') {
      return isWithin7Days(sale.data_venda);
    }
    return false;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePartialAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setPartialAmount('');
    } else {
      const numericValue = parseInt(value) / 100;
      setPartialAmount(numericValue);
    }
  };

  return (
    <div className="min-h-screen bg-light p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-dark mb-2">Consulta de Vendas</h2>
        <p className="text-gray-500 mb-6">Busque e visualize suas vendas com filtros</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <button
            onClick={() => setExpandFilters(!expandFilters)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-bold text-dark">Filtros</h3>
            <ChevronDown
              size={24}
              className={`text-dark transition-transform ${expandFilters ? 'transform rotate-180' : ''}`}
            />
          </button>
          
          {expandFilters && (
            <div className="px-6 pb-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-dark mb-2">
                Data Inicial
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-semibold text-dark mb-2">
                Data Final
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="clientSelect" className="block text-sm font-semibold text-dark mb-2">
                Cliente
              </label>
              <select
                id="clientSelect"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Todos os clientes --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-semibold text-dark mb-2">
                Forma de Pagamento
              </label>
              <select
                id="paymentMethod"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Todas as formas --</option>
                <option value="vista">À vista</option>
                <option value="prazo">A Prazo</option>
                <option value="consignado">Consignado</option>
              </select>
            </div>

            <div>
              <label htmlFor="productType" className="block text-sm font-semibold text-dark mb-2">
                Tipo de Produto
              </label>
              <select
                id="productType"
                value={selectedProductType}
                onChange={(e) => setSelectedProductType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Todos os tipos --</option>
                <option value="Roupas">Roupas</option>
                <option value="Semi joias">Semi joias</option>
              </select>
            </div>

            <div className="relative" ref={loteDropdownRef}>
              <label className="block text-sm font-semibold text-dark mb-2">
                Lotes {selectedLotes.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">{selectedLotes.length}</span>}
              </label>
              <button
                type="button"
                onClick={() => setShowLoteDropdown(!showLoteDropdown)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white flex justify-between items-center"
              >
                <span className="text-gray-600 truncate">
                  {selectedLotes.length === 0
                    ? '-- Todos os lotes --'
                    : selectedLotes.length === 1
                    ? lotes.find(l => String(l.id) === selectedLotes[0])?.numero_lote || '1 lote'
                    : `${selectedLotes.length} lotes selecionados`}
                </span>
                <ChevronDown size={16} className={`ml-2 flex-shrink-0 transition-transform ${showLoteDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showLoteDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {lotes.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">Nenhum lote encontrado</p>
                  ) : (
                    lotes.map(lote => (
                      <label key={lote.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLotes.includes(String(lote.id))}
                          onChange={(e) => {
                            const id = String(lote.id);
                            setSelectedLotes(prev =>
                              e.target.checked ? [...prev, id] : prev.filter(x => x !== id)
                            );
                          }}
                          className="accent-primary"
                        />
                        <span className="text-sm text-dark">
                          {lote.numero_lote} &mdash; {lote.tipo === 'Semi-joias' ? 'Joias' : lote.tipo}
                          <span className={`ml-1 text-xs ${lote.status === 'aberto' ? 'text-green-600' : lote.status === 'finalizado' ? 'text-gray-500' : 'text-blue-600'}`}>
                            ({lote.status === 'fechado' ? 'Em consumo' : lote.status})
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFilter}
              className="flex-1 px-4 py-2 bg-gradient-to-br from-primary/80 to-secondary/80 text-white font-semibold rounded-lg hover:from-primary hover:to-secondary shadow-md hover:shadow-xl border border-white/20 transition"
            >
              Filtrar
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 px-4 py-2 bg-gray-300 text-dark font-semibold rounded-lg hover:bg-gray-400 transition"
            >
              Limpar
            </button>
          </div>
            </div>
          )}
        </div>

        {/* Card de Total de Vendas */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-dark mb-4">Total de Vendas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 font-semibold block mb-1">Realizadas</span>
              <span className="text-2xl font-bold text-secondary">{formatCurrency(totalSalesAmount)}</span>
            </div>
            <div>
              <span className="text-gray-600 font-semibold block mb-1">Recebido</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(totalRecebido)}</span>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-dark mb-4">
            Resultados ({filteredSales.length} vendas)
          </h3>

          {loading ? (
            <p className="text-center text-gray-500 py-8">Carregando...</p>
          ) : filteredSales.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma venda encontrada</p>
          ) : (
            <div className="space-y-3">
              {filteredSales.map(sale => (
                <div key={sale.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Sale Header */}
                  <button
                    onClick={() => toggleDetails(sale.id)}
                    className="w-full px-3 py-3 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-dark truncate">{sale.cliente_nome}</p>
                      <p className="text-xs text-gray-600">{formatDate(sale.data_venda)}</p>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                      {(() => {
                        // partial pending only when there was at least some payment and still has pending balance
                        const isPartialPending = sale.paymentInfo && typeof sale.paymentInfo.total_pago === 'number' && sale.paymentInfo.total_pago > 0 && sale.paymentInfo.saldo_pendente > 0;
                        const isFullyPaid = sale.forma_pagamento === 'vista' || (
                          sale.paymentInfo && typeof sale.paymentInfo.saldo_pendente === 'number' && sale.paymentInfo.saldo_pendente === 0 && sale.paymentInfo.total_pago > 0
                        );
                        const isCancelledConsignado = sale.status === 'cancelada' && sale.forma_pagamento === 'consignado';
                        const colorClass = isPartialPending ? 'text-red-600' : (isFullyPaid ? 'text-green-600' : (isCancelledConsignado ? 'text-gray-500' : 'text-primary'));
                        const displayValue = isPartialPending ? formatCurrency(sale.paymentInfo.saldo_pendente) : formatCurrency(sale.valor_total);
                        return (
                          <span className={`font-bold text-sm sm:text-lg ${colorClass}`}>
                            {displayValue}
                          </span>
                        );
                      })()}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                          sale.status === 'cancelada'
                            ? 'bg-gray-100 text-gray-800'
                            : sale.forma_pagamento === 'vista'
                            ? 'bg-green-100 text-green-800'
                            : sale.forma_pagamento === 'prazo'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {sale.status === 'cancelada' ? 'Cancelada' : (sale.forma_pagamento === 'vista' ? 'À vista' : sale.forma_pagamento === 'prazo' ? 'Prazo' : 'Consig.')}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-600 transition-transform flex-shrink-0 ${
                          expandedSaleId === sale.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Sale Details */}
                  {expandedSaleId === sale.id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-dark">Produto</th>
                              <th className="px-4 py-2 text-center font-semibold text-dark">Qtd</th>
                              <th className="px-4 py-2 text-right font-semibold text-dark">Preço Unit.</th>
                              <th className="px-4 py-2 text-right font-semibold text-dark">Subtotal</th>
                              {canEditDeleteItems(sale) && (
                                <th className="px-4 py-2 text-center font-semibold text-dark">Ações</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-300">
                            {sale.itens && sale.itens.map(item => (
                              <tr key={item.id}>
                                <td className="px-4 py-2 text-gray-800">
                                  {item.produto_nome || 'Produto desconhecido'}
                                </td>
                                <td className="px-4 py-2 text-center text-gray-800">
                                  {item.quantidade}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-800">
                                  {formatCurrency(item.preco_unitario)}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-primary">
                                  {formatCurrency(item.subtotal)}
                                </td>
                                {canEditDeleteItems(sale) && (
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex gap-1 justify-center">
                                      <button
                                        onClick={() => handleEditItem(item)}
                                        className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                                        title={sale.forma_pagamento === 'consignado' ? 'Editar quantidade' : 'Editar quantidade (7 dias)'}
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item.id, sale.id)}
                                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                                        title={sale.forma_pagamento === 'consignado' ? 'Remover item e restaurar estoque' : 'Remover item e restaurar estoque (7 dias)'}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Botão Quitar ou Informações */}
                      {((sale.forma_pagamento === 'prazo' || sale.forma_pagamento === 'consignado') || sale.status === 'cancelada') && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                          {sale.status === 'cancelada' ? (
                            <button
                              onClick={() => {
                                setSelectedSaleForInfo(sale);
                                setShowInfoModal(true);
                              }}
                              className="w-full px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition flex items-center justify-center gap-2"
                            >
                              <Info size={18} />
                              Informações
                            </button>
                          ) : (
                            <>
                              {!(sale.paymentInfo && typeof sale.paymentInfo.saldo_pendente === 'number' && sale.paymentInfo.saldo_pendente === 0 && sale.paymentInfo.total_pago > 0) && (
                                <button
                                  onClick={() => openPaymentModal(sale)}
                                  className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
                                >
                                  Quitar Venda
                                </button>
                              )}
                              {sale.forma_pagamento === 'prazo' && sale.paymentInfo && sale.paymentInfo.pagamentos.length > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedSaleForInfo(sale);
                                    setShowInfoModal(true);
                                  }}
                                  className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
                                >
                                  <Info size={18} />
                                  Histórico
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Pagamento */}
        {showPaymentModal && selectedSaleForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">Quitar Venda</h3>
                <button
                  onClick={closePaymentModal}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Informações da Venda */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold text-dark">{selectedSaleForPayment.cliente_nome}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Valor Total</p>
                      <p className="font-bold text-primary">{formatCurrency(selectedSaleForPayment.valor_total)}</p>
                    </div>
                    {salePayments && (
                      <>
                        <div>
                          <p className="text-gray-600">Já Pago</p>
                          <p className="font-bold text-green-600">{formatCurrency(salePayments.total_pago)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Saldo Pendente</p>
                          <p className="font-bold text-red-600">{formatCurrency(salePayments.saldo_pendente)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Histórico de Pagamentos */}
                {salePayments && salePayments.pagamentos.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-dark mb-2">Histórico de Pagamentos</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {salePayments.pagamentos.map(pag => (
                        <div key={pag.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{new Date(pag.data_pagamento).toLocaleDateString('pt-BR')}</span>
                          <span className="font-semibold text-green-600">{formatCurrency(pag.valor_pago)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulário */}
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        value="total"
                        checked={paymentType === 'total'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-dark">
                        Quitar Total {salePayments && `(${formatCurrency(salePayments.saldo_pendente)})`}
                      </span>
                    </label>
                    <p className="ml-7 text-xs text-gray-500">
                      {selectedSaleForPayment.forma_pagamento === 'prazo' ? "Mantém 'A prazo' com valor em verde" : "Converte para 'À vista'"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        value="partial"
                        checked={paymentType === 'partial'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-dark">Quitar Parcial</span>
                    </label>
                    <p className="ml-7 text-xs text-gray-500">Converte para 'A prazo' com parcelas pagas</p>

                    {paymentType === 'partial' && (
                      <div className="ml-7">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Valor a Pagar
                        </label>
                        <input
                          type="text"
                          value={partialAmount ? formatCurrency(partialAmount) : ''}
                          onChange={handlePartialAmountChange}
                          placeholder={`Máximo: ${salePayments ? formatCurrency(salePayments.saldo_pendente) : '0,00'}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>

                  {selectedSaleForPayment.forma_pagamento === 'consignado' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          value="generatePrazo"
                          checked={paymentType === 'generatePrazo'}
                          onChange={(e) => setPaymentType(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-semibold text-dark">Gerar a Prazo</span>
                      </label>
                      <p className="ml-7 text-xs text-gray-500">Converte para 'A prazo' sem parcelas pagas</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                  >
                    {loading ? 'Processando...' : 'Confirmar'}
                  </button>
                </form>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Editar Quantidade */}
        {showEditModal && selectedItemForEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full">
              <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">Editar Quantidade</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Produto</p>
                  <p className="font-semibold text-dark">{selectedItemForEdit.produto_nome}</p>
                  <p className="text-xs text-gray-500 mt-2">Quantidade Atual: {selectedItemForEdit.quantidade}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">
                    Nova Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-dark font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEditQuantity}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Informações de Venda Cancelada ou Histórico de Pagamentos */}
        {showInfoModal && selectedSaleForInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className={`bg-gradient-to-r p-4 flex items-center justify-between ${
                selectedSaleForInfo.status === 'cancelada' ? 'from-gray-400 to-gray-500' : selectedSaleForInfo.forma_pagamento === 'prazo' ? 'from-blue-400 to-blue-500' : 'from-gray-400 to-gray-500'
              }`}>
                <h3 className="font-bold text-white text-lg">
                  {selectedSaleForInfo.status === 'cancelada' ? 'Informações da Venda Cancelada' : selectedSaleForInfo.forma_pagamento === 'prazo' ? 'Histórico de Pagamentos' : 'Informações da Venda'}
                </h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Cliente</p>
                  <p className="font-semibold text-dark">{selectedSaleForInfo.cliente_nome}</p>
                </div>

                {selectedSaleForInfo.status === 'cancelada' ? (
                  <>
                    {/* Informações para venda cancelada (prazo ou consignado) */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">Status: CANCELADA</p>
                      <p className="text-xs text-yellow-800">Esta venda foi cancelada por ter todos os itens removidos.</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-dark mb-3">{selectedSaleForInfo.forma_pagamento === 'consignado' ? 'Itens que foram consignados:' : 'Itens que constavam na venda:'}</p>
                      {selectedSaleForInfo.resumo_original ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {(() => {
                            try {
                              const itens = JSON.parse(selectedSaleForInfo.resumo_original);
                              return itens.map((item, idx) => (
                                <div key={idx} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 rounded-r">
                                  <p className="text-sm font-semibold text-gray-800 mb-2">
                                    {item.produto_nome || 'Produto desconhecido'}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Quantidade:</span> {item.quantidade}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Preço Unit.:</span> {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(item.preco_unitario)}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Subtotal:</span> {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(item.subtotal)}
                                  </p>
                                </div>
                              ));
                            } catch (e) {
                              return <p className="text-sm text-gray-600">Sem informações de itens</p>;
                            }
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Sem informações de itens originais</p>
                      )}
                    </div>
                  </>
                ) : selectedSaleForInfo.forma_pagamento === 'prazo' ? (
                  <>
                    {/* Histórico de Pagamentos para venda a prazo */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Informações da Venda</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Valor Total:</span>
                          <span className="font-semibold text-blue-900">{formatCurrency(selectedSaleForInfo.valor_total)}</span>
                        </div>
                        {selectedSaleForInfo.paymentInfo && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Total Pago:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(selectedSaleForInfo.paymentInfo.total_pago)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Saldo Pendente:</span>
                              <span className={`font-semibold ${selectedSaleForInfo.paymentInfo.saldo_pendente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(selectedSaleForInfo.paymentInfo.saldo_pendente)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {selectedSaleForInfo.paymentInfo && selectedSaleForInfo.paymentInfo.pagamentos && selectedSaleForInfo.paymentInfo.pagamentos.length > 0 ? (
                      <div>
                        <p className="text-sm font-semibold text-dark mb-3">
                          Histórico de Pagamentos ({selectedSaleForInfo.paymentInfo.pagamentos.length} {selectedSaleForInfo.paymentInfo.pagamentos.length === 1 ? 'parcela' : 'parcelas'})
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedSaleForInfo.paymentInfo.pagamentos.map((pag, idx) => (
                            <div key={pag.id} className="border-l-4 border-green-300 pl-3 py-2 bg-green-50 rounded-r">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-semibold text-gray-600">Parcela {idx + 1}</p>
                                  <p className="text-sm text-gray-700">{new Date(pag.data_pagamento).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</p>
                                </div>
                                <span className="font-semibold text-green-600">{formatCurrency(pag.valor_pago)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Sem pagamentos registrados</p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Informações para venda consignada cancelada ou histórico */}
                    {selectedSaleForInfo.status === 'cancelada' && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-sm font-semibold text-yellow-900 mb-2">Status: CANCELADA</p>
                        <p className="text-xs text-yellow-800">Esta venda foi cancelada por ter todos os itens removidos.</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-dark mb-3">{selectedSaleForInfo.status === 'cancelada' && selectedSaleForInfo.forma_pagamento !== 'consignado' ? 'Itens que constavam na venda:' : 'Itens que foram consignados:'}</p>
                      {selectedSaleForInfo.resumo_original ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {(() => {
                            try {
                              const itens = JSON.parse(selectedSaleForInfo.resumo_original);
                              return itens.map((item, idx) => (
                                <div key={idx} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 rounded-r">
                                  <p className="text-sm font-semibold text-gray-800 mb-2">
                                    {item.produto_nome || 'Produto desconhecido'}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Quantidade:</span> {item.quantidade}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Preço Unit.:</span> {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(item.preco_unitario)}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Subtotal:</span> {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(item.subtotal)}
                                  </p>
                                </div>
                              ));
                            } catch (e) {
                              return <p className="text-sm text-gray-600">Sem informações de itens</p>;
                            }
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Sem informações de itens originais</p>
                      )}
                    </div>
                  </>
                )}

                <button
                  onClick={() => setShowInfoModal(false)}
                  className={`w-full px-4 py-2 text-white font-semibold rounded-lg transition ${
                    selectedSaleForInfo.forma_pagamento === 'prazo' 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
