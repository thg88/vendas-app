import { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { AlertCircle, CheckCircle, Plus, X } from 'lucide-react';

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tipoFilter, setTipoFilter] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    estoque: '',
    tipo: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (err) {
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await productService.update(editingId, formData);
        setSuccess('Produto atualizado com sucesso');
        setProducts(products.map(p => p.id === editingId ? { ...p, ...formData } : p));
      } else {
        const response = await productService.create(formData);
        setSuccess('Produto criado com sucesso');
        setProducts([...products, response.data]);
      }
      setFormData({ nome: '', preco: '', estoque: '', tipo: '' });
      setEditingId(null);
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) return;

    setLoading(true);
    try {
      await productService.delete(id);
      setSuccess('Produto deletado com sucesso');
      setProducts(products.filter(p => p.id !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao deletar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nome: '', preco: '', estoque: '', tipo: '' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePriceChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setFormData({ ...formData, preco: '' });
    } else {
      const numericValue = parseInt(value) / 100;
      setFormData({ ...formData, preco: numericValue });
    }
  };

  const getFilteredProducts = () => {
    // Filtrar apenas produtos de lotes fechados
    let filtered = products.filter(p => p.lote_status === 'fechado');
    
    // Se houver filtro por tipo, aplicar filtro adicional
    if (tipoFilter) {
      filtered = filtered.filter(p => p.tipo === tipoFilter);
    }
    
    return filtered;
  };

  const calculateTotalStockValue = () => {
    return getFilteredProducts().reduce((total, product) => {
      return total + (product.preco * product.estoque);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-light p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h2 className="text-3xl font-bold text-dark">Estoque de Produtos</h2>
            <p className="text-gray-500 mt-1">Visualize os produtos do seu estoque</p>
          </div>
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum produto cadastrado</div>
          ) : (
            <>
              {/* Stock Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valor Total em Estoque</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(calculateTotalStockValue())}</p>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="tipoFilterSelect" className="block text-sm font-semibold text-dark mb-2">
                      Filtrar por Tipo
                    </label>
                    <select
                      id="tipoFilterSelect"
                      value={tipoFilter}
                      onChange={(e) => setTipoFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Todos os Tipos --</option>
                      {[...new Set(products.filter(p => p.lote_status === 'fechado').map(p => p.tipo))].sort().map(tipo => (
                        <option key={tipo} value={tipo}>{tipo === 'Semi-joias' ? 'Joias' : tipo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Nome</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Preço</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Estoque</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Lote</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getFilteredProducts().length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          Nenhum produto encontrado para este tipo
                        </td>
                      </tr>
                    ) : (
                      getFilteredProducts().map(product => (
                        <tr key={product.id} className={`${product.lote_id ? 'bg-amber-50' : ''} hover:bg-gray-50 transition`}>
                          <td className="px-4 py-3 text-sm font-medium text-dark">{product.nome}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-primary">{formatCurrency(product.preco)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.estoque <= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {product.estoque} un.
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {product.lote_id && product.numero_lote ? (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 inline-block">
                                {product.numero_lote}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.tipo === 'Roupas' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {product.tipo === 'Semi-joias' ? 'Joias' : product.tipo}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
