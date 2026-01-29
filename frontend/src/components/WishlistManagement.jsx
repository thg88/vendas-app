import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, Trash2, Plus, X, Heart } from 'lucide-react';
import { wishlistService, clientService } from '../services/api';

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

export default function WishlistManagement() {
  const [wishes, setWishes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newClient, setNewClient] = useState({ nome: '', telefone: '' });
  const [formData, setFormData] = useState({
    nome: '',
    item: '',
    data_pedido: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadWishes();
    loadClients();
  }, []);

  const loadWishes = async () => {
    setLoading(true);
    try {
      const response = await wishlistService.getAll();
      setWishes(response.data);
    } catch (err) {
      setError('Erro ao carregar lista de desejos');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientService.getAll();
      setClients(response.data);
    } catch (err) {
      setError('Erro ao carregar clientes');
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await clientService.create(newClient);
      setClients([...clients, response.data]);
      setFormData({ ...formData, nome: response.data.nome });
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

  const formatClientName = (value) => {
    // Limita a 30 caracteres
    const limited = value.slice(0, 30);
    
    // Formata cada palavra com primeira letra maiúscula
    return limited
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    
    if (limitedNumbers.length === 0) return '';
    if (limitedNumbers.length <= 2) return `(${limitedNumbers}`;
    if (limitedNumbers.length <= 7) return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nome.trim() || !formData.item.trim()) {
        setError('Preencha todos os campos');
        setLoading(false);
        return;
      }

      if (editingId) {
        await wishlistService.update(editingId, formData);
        setWishes(wishes.map(w =>
          w.id === editingId ? { ...w, ...formData } : w
        ));
        setSuccess('Desejo atualizado com sucesso');
      } else {
        const response = await wishlistService.create(formData);
        setWishes([response.data, ...wishes]);
        setSuccess('Desejo adicionado com sucesso');
      }

      setFormData({
        nome: '',
        item: '',
        data_pedido: new Date().toISOString().split('T')[0]
      });
      setEditingId(null);
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar desejo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (wish) => {
    setFormData(wish);
    setEditingId(wish.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este desejo?')) return;

    try {
      await wishlistService.delete(id);
      setWishes(wishes.filter(w => w.id !== id));
      setSuccess('Desejo deletado com sucesso');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao deletar desejo');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      nome: '',
      item: '',
      data_pedido: new Date().toISOString().split('T')[0]
    });
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    
    // Extrair apenas a parte da data (YYYY-MM-DD)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    if (!year || !month || !day) return 'Data inválida';
    
    // Criar data usando valores locais para evitar problemas de timezone
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-light p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-8 mb-2">
            <h2 className="text-3xl font-bold text-dark flex items-center gap-2">
              <Heart size={32} /> Lista de Desejos
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition shadow-md hover:shadow-xl border border-white/20 transform hover:scale-105 bg-gradient-to-br from-primary/80 to-secondary/80 text-white hover:from-primary hover:to-secondary"
              style={{ display: showForm ? 'none' : 'flex' }}
            >
              <Plus size={20} /> Novo Desejo
            </button>
          </div>
          <p className="text-gray-500">Organize seus desejos e pedidos</p>
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

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-dark mb-2">
                  Cliente *
                </label>
                <div className="flex gap-2">
                  <select
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Selecionar Cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="px-3 py-2 bg-gradient-to-br from-primary/80 to-secondary/80 text-white font-semibold rounded-lg hover:from-primary hover:to-secondary shadow-md hover:shadow-xl border border-white/20 transition"
                    title="Adicionar novo cliente"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="item" className="block text-sm font-semibold text-dark mb-2">
                  Item *
                </label>
                <input
                  id="item"
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="data_pedido" className="block text-sm font-semibold text-dark mb-2">
                  Data do Pedido *
                </label>
                <input
                  id="data_pedido"
                  type="date"
                  value={formData.data_pedido}
                  onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-br from-primary/80 to-secondary/80 text-white font-semibold rounded-lg hover:from-primary hover:to-secondary shadow-md hover:shadow-xl border border-white/20 disabled:opacity-50 transition"
                >
                  {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-300 text-dark font-semibold rounded-lg hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {wishes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Heart size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Nenhum desejo cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-dark whitespace-nowrap">Data do Pedido</th>
                    <th className="px-2 py-3 text-left text-sm font-semibold text-dark">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wishes.map(wish => (
                    <tr key={wish.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-dark">{wish.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{wish.item}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(wish.data_pedido)}</td>
                      <td className="px-2 py-3 text-sm space-x-1 flex">
                        <button
                          onClick={() => handleEdit(wish)}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(wish.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Novo Cliente */}
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
                onChange={(e) => setNewClient({ ...newClient, nome: formatClientName(e.target.value) })}
                maxLength={30}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">{newClient.nome.length}/30 caracteres</p>
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
              className="w-full px-4 py-2 bg-gradient-to-br from-primary/80 to-secondary/80 text-white font-semibold rounded-lg hover:from-primary hover:to-secondary shadow-md hover:shadow-xl border border-white/20 disabled:opacity-50 transition"
            >
              {loading ? 'Criando...' : 'Criar Cliente'}
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
