import { useState, useEffect } from 'react';
import { lotesService, productService } from '../services/api';
import { AlertCircle, CheckCircle, Plus, X, Lock, Unlock, Trash2, Package, Edit2, Archive } from 'lucide-react';

export default function LotesManagement() {
  const [lotes, setLotes] = useState([]);
  const [loteAberto, setLoteAberto] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [showNewProductInput, setShowNewProductInput] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [formData, setFormData] = useState({
    data_recebimento: '',
    tipo: '',
    observacoes: '',
    numero_lote_display: '',
    modalidade: 'consignado',
    custo_lote: ''
  });
  const [productData, setProductData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    tipo: ''
  });
  const [showLoteInfo, setShowLoteInfo] = useState(false);
  const [loteInfoData, setLoteInfoData] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    loadLotes();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productService.getAll();
      setAllProducts(response.data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const loadLotes = async () => {
    setLoading(true);
    try {
      const [lotesResponse, loteAbertoResponse] = await Promise.all([
        lotesService.getAll(),
        lotesService.getLoteAberto()
      ]);
      setLotes(lotesResponse.data);
      setLoteAberto(loteAbertoResponse.data);
    } catch (err) {
      setError('Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLote = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await lotesService.create({
        data_recebimento: formData.data_recebimento,
        tipo: formData.tipo,
        observacoes: formData.observacoes,
        modalidade: formData.modalidade,
        custo_lote: formData.modalidade === 'custo' ? parseFloat(formData.custo_lote.replace(/\./g, '').replace(',', '.')) : null
      });
      setSuccess('Lote criado com sucesso');
      setLotes([response.data, ...lotes]);
      setLoteAberto(response.data);
      setFormData({ data_recebimento: '', tipo: '', observacoes: '', numero_lote_display: '', modalidade: 'consignado', custo_lote: '' });
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar lote');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingProductId) {
        // Modo edição: atualizar produto existente
        const dataToUpdate = {
          ...productData,
          lote_id: loteAberto.id,
          tipo: loteAberto.tipo,
          preco: parseFloat(productData.preco),
          estoque: parseInt(productData.estoque)
        };

        await productService.update(editingProductId, dataToUpdate);
        setSuccess('Produto alterado com sucesso');
        
        // Atualizar lote aberto com produto modificado
        setLoteAberto({
          ...loteAberto,
          produtos: loteAberto.produtos.map(p => 
            p.id === editingProductId ? { ...p, ...dataToUpdate } : p
          )
        });
      } else {
        // Modo adição: criar novo produto
        const dataToSend = {
          ...productData,
          lote_id: loteAberto.id,
          tipo: loteAberto.tipo,
          preco: parseFloat(productData.preco),
          estoque: parseInt(productData.estoque)
        };

        const response = await productService.create(dataToSend);
        setSuccess('Produto adicionado ao lote com sucesso');
        
        // Atualizar lote aberto com novo produto
        setLoteAberto({
          ...loteAberto,
          produtos: [response.data, ...(loteAberto.produtos || [])]
        });
      }

      setProductData({
        nome: '',
        descricao: '',
        preco: '',
        estoque: '',
        tipo: ''
      });
      setSelectedProduct('');
      setEditingProductId(null);
      setShowNewProductInput(false);
      setShowProductForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseLote = async (id) => {
    if (!window.confirm('Tem certeza que deseja fechar este lote?')) return;

    setLoading(true);
    try {
      await lotesService.closeLote(id);
      setSuccess('Lote fechado com sucesso');
      setLotes(lotes.map(l => l.id === id ? { ...l, status: 'fechado' } : l));
      setLoteAberto(null);
      setSelectedLote(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fechar lote');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmptyLote = async (id) => {
    if (!window.confirm('Tem certeza? O lote será deletado permanentemente.')) return;

    setLoading(true);
    try {
      await lotesService.deleteEmpty(id);
      setSuccess('Lote excluído com sucesso');
      setLoteAberto(null);
      loadLotes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao excluir lote');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLoteInfo = async (id) => {
    try {
      const response = await lotesService.getById(id);
      setLoteInfoData(response.data);
      setShowLoteInfo(true);
    } catch (err) {
      console.error('Erro ao carregar informações do lote:', err);
      setError(err.response?.data?.message || 'Erro ao carregar informações do lote');
    }
  };

  const handleDeleteLote = async (id) => {
    if (!window.confirm('Tem certeza? Esta ação vai zerar o estoque dos produtos desse lote e manter o histórico para futuras consultas.')) return;

    setLoading(true);
    try {
      await lotesService.delete(id);
      setSuccess('Lote finalizado com sucesso (estoque zerado)');
      setLotes(lotes.map(l => l.id === id ? { ...l, data_finalizacao: new Date().toISOString() } : l));
      setSelectedLote(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao finalizar lote');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductInLote = (product) => {
    setProductData({
      nome: product.nome,
      descricao: product.descricao || '',
      preco: product.preco,
      estoque: product.estoque,
      tipo: product.tipo
    });
    setSelectedProduct(product.id);
    setEditingProductId(product.id);
    setShowNewProductInput(false);
    setShowProductForm(true);
  };

  const handleDeleteProductFromLote = async (productId) => {
    if (!window.confirm('Tem certeza que deseja remover este produto do lote?')) return;

    setLoading(true);
    try {
      await productService.delete(productId);
      setSuccess('Produto removido do lote com sucesso');
      setLoteAberto({
        ...loteAberto,
        produtos: loteAberto.produtos.filter(p => p.id !== productId)
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao remover produto do lote');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setProductData({ ...productData, preco: '' });
    } else {
      const numericValue = parseInt(value) / 100;
      setProductData({ ...productData, preco: numericValue });
    }
  };

  const formatProductName = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-light p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-8 mb-2">
            <h2 className="text-3xl font-bold text-dark flex items-center gap-2">
              <Package size={32} /> Controle de Lotes
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={loteAberto !== null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition shadow-md hover:shadow-xl border border-white/20 transform hover:scale-105 ${
                showForm
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : loteAberto !== null
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-br from-primary/80 to-secondary/80 text-white hover:from-primary hover:to-secondary'
              }`}
              title={loteAberto ? 'Feche o lote aberto antes de criar um novo' : ''}
            >
              {showForm ? (
                <>
                  <X size={24} /> Cancelar
                </>
              ) : (
                <>
                  <Plus size={24} /> Novo Lote
                </>
              )}
            </button>
          </div>
          <p className="text-gray-500">Gerencie os lotes de entrada de produtos</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Create Lote Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-dark mb-4">Abrir Novo Lote</h3>
            <form onSubmit={handleCreateLote} className="space-y-4">
              <div>
                <label htmlFor="numero_lote_display" className="block text-sm font-semibold text-dark mb-2">
                  Número do Lote *
                </label>
                <input
                  id="numero_lote_display"
                  type="text"
                  value={formData.numero_lote_display || `${String(lotes.length + 1).padStart(3, '0')}`}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="data_recebimento" className="block text-sm font-semibold text-dark mb-2">
                  Data para Pagamento <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  id="data_recebimento"
                  type="date"
                  value={formData.data_recebimento}
                  onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="tipo" className="block text-sm font-semibold text-dark mb-2">
                  Tipo do Lote *
                </label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Selecionar Tipo --</option>
                  <option value="Roupas">Roupas</option>
                  <option value="Semi-joias">Semi-joias</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Modalidade do Lote *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, modalidade: 'consignado', custo_lote: '' })}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold text-sm transition text-left ${
                      formData.modalidade === 'consignado'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-bold">Consignado</p>
                    <p className="text-xs font-normal mt-0.5 opacity-80">Comissão sobre as vendas</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, modalidade: 'custo' })}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold text-sm transition text-left ${
                      formData.modalidade === 'custo'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-bold">Custo</p>
                    <p className="text-xs font-normal mt-0.5 opacity-80">Produtos comprados</p>
                  </button>
                </div>
              </div>
              {formData.modalidade === 'custo' && (
                <div>
                  <label htmlFor="custo_lote" className="block text-sm font-semibold text-dark mb-2">
                    Custo do Lote *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">R$</span>
                    <input
                      id="custo_lote"
                      type="text"
                      inputMode="numeric"
                      value={formData.custo_lote}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        if (digits === '') {
                          setFormData({ ...formData, custo_lote: '' });
                          return;
                        }
                        const cents = parseInt(digits, 10);
                        const formatted = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        setFormData({ ...formData, custo_lote: formatted });
                      }}
                      required
                      placeholder="0,00"
                      className="w-full pl-10 pr-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="observacoes" className="block text-sm font-semibold text-dark mb-2">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Adicione observações sobre este lote..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-br from-primary/80 to-secondary/80 text-white font-semibold rounded-lg hover:from-primary hover:to-secondary shadow-md hover:shadow-xl border border-white/20 disabled:opacity-50 transition"
                >
                  {loading ? 'Criando...' : 'Criar Lote'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-dark font-semibold rounded-lg hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lote Aberto */}
          {loteAberto && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-3">
                      <Lock size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-dark">{loteAberto.numero_lote}</h3>
                      <p className="text-green-700 text-sm mb-2">Lote Aberto</p>
                      <div>
                        <p className="text-xs text-gray-600">Abertura</p>
                        <p className="text-sm font-semibold">{formatDate(loteAberto.data_abertura)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    {loteAberto.tipo && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${loteAberto.tipo === 'Roupas' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {loteAberto.tipo === 'Semi-joias' ? 'Joias' : loteAberto.tipo}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          loteAberto.modalidade === 'custo'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {loteAberto.modalidade === 'custo' ? 'Custo' : 'Consignado'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Pagamento</p>
                      <p className="font-semibold text-blue-600">{loteAberto.data_recebimento ? formatDate(loteAberto.data_recebimento) : 'Não definido'}</p>
                    </div>
                    {loteAberto.modalidade === 'custo' && loteAberto.custo_lote && (
                      <div>
                        <p className="text-xs text-orange-700 font-semibold">Investimento: {parseFloat(loteAberto.custo_lote).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    )}
                  </div>
                </div>

                {loteAberto.observacoes && (
                  <p className="text-sm text-gray-700 italic mt-2">{loteAberto.observacoes}</p>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  {!showProductForm && (
                    <>
                      <button
                        onClick={() => setShowProductForm(!showProductForm)}
                        className={`flex items-center gap-1 px-4 py-1 text-sm rounded-lg font-semibold transition ${
                          showProductForm
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-primary text-white hover:bg-opacity-90'
                        }`}
                      >
                        {showProductForm ? (
                          <>
                            <X size={14} /> Cancelar
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Adicionar Produto
                          </>
                        )}
                      </button>
                      {loteAberto.produtos && loteAberto.produtos.length === 0 ? (
                        <button
                          onClick={() => handleDeleteEmptyLote(loteAberto.id)}
                          disabled={loading}
                          className="px-4 py-1 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 transition flex items-center gap-1"
                          title="Deletar este lote vazio"
                        >
                          <Trash2 size={14} /> Excluir Lote
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCloseLote(loteAberto.id)}
                          disabled={loading}
                          className="px-4 py-1 text-sm bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition flex items-center gap-1"
                          title="Fechar este lote e arquivá-lo"
                        >
                          <Lock size={14} /> Fechar Lote
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Add Product Form */}
                {showProductForm && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div>
                        <label htmlFor="prod_nome" className="block text-sm font-semibold text-dark mb-2">
                          Nome do Produto *
                        </label>
                        {editingProductId ? (
                          <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-dark font-semibold">
                            {productData.nome}
                          </div>
                        ) : (
                          <div className="flex gap-2 items-end">
                            <select
                              id="prod_nome"
                              value={selectedProduct}
                              onChange={(e) => {
                                const productId = e.target.value;
                                setSelectedProduct(productId);
                                if (productId) {
                                  const product = allProducts.find(p => p.id == productId);
                                  if (product) {
                                    setProductData({
                                      nome: product.nome,
                                      preco: product.preco,
                                      estoque: '',
                                      tipo: loteAberto.tipo,
                                      descricao: product.descricao || ''
                                    });
                                  }
                                } else {
                                  setProductData({
                                    nome: '',
                                    preco: '',
                                    estoque: '',
                                    tipo: loteAberto.tipo,
                                    descricao: ''
                                  });
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            >
                              <option value="">-- Selecionar Produto --</option>
                              {allProducts
                                .filter(product => product.tipo === loteAberto.tipo)
                                .filter((product, index, self) =>
                                  index === self.findIndex((p) => p.nome === product.nome)
                                )
                                .map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.nome}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewProductInput(!showNewProductInput);
                                if (showNewProductInput) {
                                  setProductData({
                                    nome: '',
                                    preco: '',
                                    estoque: '',
                                    tipo: loteAberto.tipo,
                                    descricao: ''
                                  });
                                }
                                setSelectedProduct('');
                              }}
                              className="px-2 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition flex items-center gap-1 flex-shrink-0"
                              title="Criar novo produto"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {showNewProductInput && (
                        <div>
                          <label htmlFor="new_prod_nome" className="block text-sm font-semibold text-dark mb-2">
                            Nome do Novo Produto *
                          </label>
                          <input
                            id="new_prod_nome"
                            type="text"
                            value={productData.nome}
                            onChange={(e) => setProductData({ ...productData, nome: formatProductName(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label htmlFor="prod_preco" className="block text-sm font-semibold text-dark mb-2">
                            Preço *
                          </label>
                          <input
                            id="prod_preco"
                            type="text"
                            value={productData.preco ? formatCurrency(productData.preco) : ''}
                            onChange={handlePriceChange}
                            placeholder="R$ 0,00"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label htmlFor="prod_estoque" className="block text-sm font-semibold text-dark mb-2">
                            Qtde. *
                          </label>
                          <input
                            id="prod_estoque"
                            type="number"
                            min="1"
                            max="999"
                            value={productData.estoque}
                            onChange={(e) => {
                              const valor = e.target.value;
                              if (valor === '' || (parseInt(valor) >= 1 && parseInt(valor) <= 999)) {
                                setProductData({ ...productData, estoque: valor });
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={
                            loading || 
                            (!selectedProduct && !showNewProductInput) || 
                            (showNewProductInput && !productData.nome) ||
                            !productData.preco ||
                            !productData.estoque ||
                            parseInt(productData.estoque) < 1 ||
                            parseInt(productData.estoque) > 999
                          }
                          className="flex-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                        >
                          {loading ? (editingProductId ? 'Alterando...' : 'Adicionando...') : (editingProductId ? 'Alterar Produto' : 'Adicionar Produto')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProductId(null);
                            setProductData({
                              nome: '',
                              descricao: '',
                              preco: '',
                              estoque: '',
                              tipo: ''
                            });
                            setSelectedProduct('');
                            setShowNewProductInput(false);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-300 text-dark font-semibold rounded-lg hover:bg-gray-400 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Produtos List */}
                {loteAberto.produtos && loteAberto.produtos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-dark">Nome</th>
                          <th className="px-4 py-3 text-right font-semibold text-dark">Qtde.</th>
                          <th className="px-4 py-3 text-right font-semibold text-dark">Preço</th>
                          <th className="px-4 py-3 text-right font-semibold text-dark">Subtotal</th>
                          <th className="px-4 py-3 text-center font-semibold text-dark">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {loteAberto.produtos.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{p.nome}</td>
                            <td className="px-4 py-3 text-right">{p.estoque}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.preco)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-primary">
                              {formatCurrency(p.preco * p.estoque)}
                            </td>
                            <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                              <button
                                onClick={() => handleEditProductInLote(p)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                title="Editar produto"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProductFromLote(p.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                title="Remover produto do lote"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total do Lote</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(
                              loteAberto.produtos.reduce((sum, p) => sum + (p.preco * parseInt(p.estoque, 10)), 0)
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Qtde Produtos</p>
                          <p className="text-2xl font-bold text-primary">
                            {loteAberto.produtos.reduce((sum, p) => sum + parseInt(p.estoque, 10), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum produto adicionado a este lote ainda
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lotes Histórico */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-dark">Histórico de Lotes</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {lotes.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Nenhum lote criado</div>
                ) : (
                  lotes.map(lote => (
                    <div key={lote.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-dark">{lote.numero_lote}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            lote.tipo === 'Roupas'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {lote.tipo === 'Semi-joias' ? 'Joias' : lote.tipo}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          lote.status === 'aberto'
                            ? 'bg-green-100 text-green-800'
                            : lote.data_finalizacao
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {lote.status === 'aberto' ? 'Aberto' : lote.data_finalizacao ? 'Finalizado' : 'Em consumo'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Investimento: <span className={`font-semibold ${lote.modalidade === 'custo' && lote.custo_lote ? 'text-orange-600' : 'text-dark'}`}>{lote.modalidade === 'custo' && lote.custo_lote ? parseFloat(lote.custo_lote).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Consignado'}</span></p>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Abertura: {formatDate(lote.data_abertura)}</p>
                          <p className="text-xs text-blue-600">Receber até: {lote.data_recebimento ? formatDate(lote.data_recebimento) : 'Não definido'}</p>
                          <p className="text-xs text-gray-600">Qtde Produtos: <span className="font-semibold text-dark">{parseInt(lote.qtde_produtos || 0, 10)}</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs text-gray-600">Total: <span className="font-semibold text-dark">{formatCurrency(lote.valor_total || 0)}</span></p>
                          <p className="text-xs text-gray-600">Vendido: <span className="font-semibold text-green-600">{formatCurrency(lote.valor_vendido || 0)}</span></p>
                          <p className="text-xs text-gray-600">Qtde Vendida: <span className="font-semibold text-green-600">{parseInt(lote.qtde_vendida || 0, 10)}</span></p>
                        </div>
                      </div>
                      {lote.status === 'fechado' && !lote.data_finalizacao && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleViewLoteInfo(lote.id)}
                            disabled={loading}
                            className="flex-1 p-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded hover:bg-blue-200 transition disabled:opacity-50 flex items-center justify-center gap-1"
                            title="Ver informações do lote"
                          >
                            <Unlock size={14} /> Informações
                          </button>
                          <button
                            onClick={() => handleDeleteLote(lote.id)}
                            disabled={loading}
                            className="flex-1 p-1 bg-amber-100 text-amber-600 text-xs font-semibold rounded hover:bg-amber-200 transition disabled:opacity-50 flex items-center justify-center gap-1"
                            title="Finalizar lote"
                          >
                            <Archive size={14} /> Finalizar Lote
                          </button>
                        </div>
                      )}
                      {lote.data_finalizacao && (
                        <div className="flex justify-center mt-3">
                          <button
                            onClick={() => handleViewLoteInfo(lote.id)}
                            disabled={loading}
                            className="flex-1 p-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded hover:bg-blue-200 transition disabled:opacity-50 flex items-center justify-center gap-1"
                            title="Ver informações do lote"
                          >
                            <Unlock size={14} /> Informações
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Informações do Lote */}
        {showLoteInfo && loteInfoData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-96 overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200 sticky top-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark">Detalhes do Lote {loteInfoData.numero_lote}</h3>
                  <button
                    onClick={() => setShowLoteInfo(false)}
                    className="p-1 hover:bg-gray-200 rounded-lg transition"
                  >
                    <X size={20} className="text-dark" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {loteInfoData.produtos && loteInfoData.produtos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-2 py-2 text-left font-semibold text-dark">Produto</th>
                          <th className="px-2 py-2 text-right font-semibold text-dark">Qtd. Total</th>
                          <th className="px-2 py-2 text-right font-semibold text-dark">Vendido</th>
                          <th className="px-2 py-2 text-right font-semibold text-dark">Restante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[...loteInfoData.produtos].sort((a, b) => a.nome.localeCompare(b.nome)).map(produto => {
                          const vendido = loteInfoData.vendas_produtos
                            ? (loteInfoData.vendas_produtos.find(v => v.produto_id === produto.id)?.total_vendido || 0)
                            : 0;
                          const totalRecebido = produto.estoque_original || (produto.estoque + vendido);
                          const restante = totalRecebido - vendido;

                          return (
                            <tr key={produto.id} className="hover:bg-gray-50">
                              <td className="px-2 py-2">
                                <p className="font-semibold text-dark">{produto.nome}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(produto.preco)}</p>
                              </td>
                              <td className="px-2 py-2 text-right font-semibold">{totalRecebido}</td>
                              <td className="px-2 py-2 text-right font-semibold text-green-600">{vendido}</td>
                              <td className="px-2 py-2 text-right font-semibold text-orange-600">{restante}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum produto neste lote
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
