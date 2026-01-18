import { useState, useEffect } from 'react';
import { salesService, clientService, productService } from '../services/api';
import { AlertCircle, CheckCircle, Plus, X } from 'lucide-react';

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Product Selector Component
function ProductSelector({ products, onAddProduct, selectedProducts = [] }) {
  const [selected, setSelected] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState('');

  const selectedProduct = selected ? products.find(p => p.id == selected) : null;
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Calcular estoque restante descontando produtos já adicionados
  const getAvailableStock = (product) => {
    if (!product) return 0;
    const alreadyAdded = selectedProducts.find(p => p.id === product.id);
    const quantityAdded = alreadyAdded ? alreadyAdded.quantity : 0;
    return (product.estoque || 0) - quantityAdded;
  };

  const handleAdd = () => {
    if (selected && selectedProduct) {
      // Validar se quantidade foi preenchida
      if (!quantity || quantity < 1) {
        setStockError('Insira uma quantidade válida');
        return;
      }

      // Validar estoque (usando estoque restante)
      const availableStock = getAvailableStock(selectedProduct);
      if (!availableStock || availableStock <= 0) {
        setStockError('Este produto não possui estoque disponível');
        return;
      }
      if (quantity > availableStock) {
        setStockError(`Estoque insuficiente. Disponível: ${availableStock}`);
        return;
      }

      onAddProduct({ ...selectedProduct, quantity: parseInt(quantity) });
      setSelected('');
      setQuantity(1);
      setStockError('');
    }
  };

  const handleQuantityChange = (value) => {
    // Permitir campo vazio enquanto o usuário está digitando
    if (value === '') {
      setQuantity('');
      setStockError('');
      return;
    }

    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 1) {
      setQuantity(1);
      return;
    }

    setQuantity(newQuantity);
    
    // Validar estoque em tempo real (usando estoque restante)
    const availableStock = getAvailableStock(selectedProduct);
    if (selectedProduct && newQuantity > availableStock) {
      setStockError(`Estoque insuficiente. Disponível: ${availableStock}`);
    } else {
      setStockError('');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">Produto</label>
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setStockError('');
            setQuantity(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">-- Selecionar Produto --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.nome} - {formatCurrency(p.preco)}
            </option>
          ))}
        </select>
      </div>
      
      {selectedProduct && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Estoque disponível:</span> <span className={getAvailableStock(selectedProduct) <= 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{getAvailableStock(selectedProduct)} unidades</span>
          </p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">Quantidade</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {stockError && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700 font-semibold">{stockError}</p>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selected || stockError !== ''}
        className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Adicionar Produto
      </button>
    </div>
  );
}

export default function SaleForm() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('vista');
  const paymentMethods = ['vista', 'prazo', 'consignado'];
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newClient, setNewClient] = useState({ nome: '', telefone: '' });
  const [newProduct, setNewProduct] = useState({ nome: '', preco: '', estoque: '', tipo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadClients();
    loadProducts();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientService.getAll();
      setClients(response.data);
    } catch (err) {
      setError('Erro ao carregar clientes');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAll();
      // Filtrar apenas produtos cujos lotes estejam fechados
      const filteredProducts = response.data.filter(p => p.lote_status === 'fechado');
      setProducts(filteredProducts);
    } catch (err) {
      setError('Erro ao carregar produtos');
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await clientService.create(newClient);
      setClients([...clients, response.data]);
      setSelectedClient(response.data.id.toString());
      setNewClient({ nome: '', telefone: '' });
      setShowClientModal(false);
      setSuccess('Cliente criado com sucesso');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await productService.create(newProduct);
      setProducts([...products, response.data]);
      handleAddProductToSale({ ...response.data, quantity: 1 });
      setNewProduct({ nome: '', preco: '', estoque: '', tipo: '' });
      setShowProductModal(false);
      setSuccess('Produto criado e adicionado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Formata no padrão (00) 00000-0000
    if (limitedNumbers.length === 0) return '';
    if (limitedNumbers.length <= 2) return `(${limitedNumbers}`;
    if (limitedNumbers.length <= 7) return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  };

  const handleAddProductToSale = (product) => {
    // Validar se tem estoque
    if (!product.estoque || product.estoque <= 0) {
      setError('Este produto não possui estoque disponível');
      return;
    }

    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      // Validar se a quantidade não excede o estoque
      if (existing.quantity + product.quantity > product.estoque) {
        setError(`Quantidade indisponível. Estoque: ${product.estoque}, Total solicitado: ${existing.quantity + product.quantity}`);
        return;
      }
      setSelectedProducts(selectedProducts.map(p =>
        p.id === product.id ? { ...p, quantity: p.quantity + product.quantity } : p
      ));
    } else {
      if (product.quantity > product.estoque) {
        setError(`Quantidade indisponível. Estoque: ${product.estoque}, Solicitado: ${product.quantity}`);
        return;
      }
      setSelectedProducts([...selectedProducts, product]);
    }
    setError('');
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!selectedClient || selectedProducts.length === 0) {
      setError('Selecione um cliente e ao menos um produto');
      return;
    }

    setLoading(true);
    try {
      const totalValue = selectedProducts.reduce((sum, p) => sum + (p.preco * p.quantity), 0);
      
      // Obter data/hora local no formato YYYY-MM-DD HH:mm:ss
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const data_venda = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      const saleData = {
        cliente_id: parseInt(selectedClient),
        forma_pagamento: paymentMethod,
        valor_total: totalValue,
        data_venda: data_venda,
        itens: selectedProducts.map(p => ({
          produto_id: p.id,
          produto_nome: p.nome,
          quantidade: p.quantity,
          preco_unitario: p.preco,
          subtotal: p.preco * p.quantity
        }))
      };

      await salesService.create(saleData);
      setSuccess('Venda registrada com sucesso!');
      setSelectedClient('');
      setSelectedProducts([]);
      setPaymentMethod('vista');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar venda');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = selectedProducts.reduce((sum, p) => sum + (p.preco * p.quantity), 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePriceChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setNewProduct({ ...newProduct, preco: '' });
    } else {
      const numericValue = parseInt(value) / 100;
      setNewProduct({ ...newProduct, preco: numericValue });
    }
  };

  return (
    <div className="min-h-screen bg-light p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-dark mb-2">Lançar Venda</h2>
        <p className="text-gray-500 mb-6">Registre uma nova venda com seus clientes</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSubmitSale} className="space-y-6">
              {/* Client Selection */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-dark mb-4">Cliente</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="clientSelect" className="block text-sm font-semibold text-dark mb-2">
                      Selecione um cliente *
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="clientSelect"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        required
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Selecionar Cliente --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-dark">Produtos</h3>
                </div>

                <ProductSelector
                  products={products}
                  onAddProduct={handleAddProductToSale}
                  selectedProducts={selectedProducts}
                />

                {selectedProducts.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-dark">Produtos Selecionados:</h4>
                    {selectedProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-dark">{product.nome}</p>
                          <p className="text-sm text-gray-600">
                            {product.quantity}x {formatCurrency(product.preco)} = {formatCurrency(product.preco * product.quantity)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(product.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-dark mb-4">Forma de Pagamento</h3>
                <div className="space-y-3">
                  {paymentMethods.map(method => (
                    <label key={method} className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 font-semibold text-dark">
                        {method === 'vista' ? 'À Vista' : method === 'prazo' ? 'A Prazo' : 'Consignado'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || selectedProducts.length === 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 transition"
              >
                {loading ? 'Registrando...' : 'Registrar Venda'}
              </button>
            </form>
          </div>

          {/* Summary Section */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold text-dark mb-4">Resumo</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produtos:</span>
                  <span className="font-semibold text-dark">{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total de Itens:</span>
                  <span className="font-semibold text-dark">
                    {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-dark">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalValue)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="text-xs text-gray-600">Pagamento: {paymentMethod === 'vista' ? 'À Vista' : paymentMethod === 'prazo' ? 'A Prazo' : 'Consignado'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal isOpen={showClientModal} onClose={() => setShowClientModal(false)} title="Novo Cliente">
          <form onSubmit={handleAddClient} className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-semibold text-dark mb-2">
                Nome *
              </label>
              <input
                id="clientName"
                type="text"
                value={newClient.nome}
                onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-semibold text-dark mb-2">
                Telefone
              </label>
              <input
                id="clientPhone"
                type="text"
                value={newClient.telefone}
                onChange={(e) => setNewClient({ ...newClient, telefone: formatPhoneNumber(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Criando...' : 'Criar Cliente'}
            </button>
          </form>
        </Modal>

        <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Novo Produto">
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label htmlFor="productName" className="block text-sm font-semibold text-dark mb-2">
                Nome *
              </label>
              <input
                id="productName"
                type="text"
                value={newProduct.nome}
                onChange={(e) => setNewProduct({ ...newProduct, nome: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="productPrice" className="block text-sm font-semibold text-dark mb-2">
                  Preço *
                </label>
                <input
                  id="productPrice"
                  type="text"
                  value={newProduct.preco ? formatCurrency(newProduct.preco) : ''}
                  onChange={handlePriceChange}
                  placeholder="R$ 0,00"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="productStock" className="block text-sm font-semibold text-dark mb-2">
                  Estoque *
                </label>
                <input
                  id="productStock"
                  type="number"
                  value={newProduct.estoque}
                  onChange={(e) => setNewProduct({ ...newProduct, estoque: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="productType" className="block text-sm font-semibold text-dark mb-2">
                Tipo *
              </label>
              <select
                id="productType"
                value={newProduct.tipo}
                onChange={(e) => setNewProduct({ ...newProduct, tipo: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Selecionar Tipo --</option>
                <option value="Roupas">Roupas</option>
                <option value="Semi-joias">Semi-joias</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Criando...' : 'Criar Produto'}
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
