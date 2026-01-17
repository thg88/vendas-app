import { useState, useEffect } from 'react';
import { clientService } from '../services/api';
import { AlertCircle, CheckCircle, Edit2, Trash2, Plus, X, Users } from 'lucide-react';

export default function ClientsManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientService.getAll();
      setClients(response.data);
    } catch (err) {
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar se telefone já existe (apenas ao criar novo cliente)
      if (!editingId && formData.telefone) {
        const telefoneLimpo = formData.telefone.replace(/\D/g, '');
        const telefoneExists = clients.some(c => c.telefone.replace(/\D/g, '') === telefoneLimpo);
        
        if (telefoneExists) {
          setError('Já existe um cliente cadastrado com este número de telefone');
          setLoading(false);
          return;
        }
      }

      if (editingId) {
        await clientService.update(editingId, formData);
        setSuccess('Cliente atualizado com sucesso');
        setClients(clients.map(c => c.id === editingId ? { ...c, ...formData } : c));
      } else {
        const response = await clientService.create(formData);
        setSuccess('Cliente criado com sucesso');
        setClients([...clients, response.data]);
      }
      setFormData({ nome: '', telefone: '' });
      setEditingId(null);
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client) => {
    setFormData(client);
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este cliente?')) return;

    setLoading(true);
    try {
      await clientService.delete(id);
      setSuccess('Cliente deletado com sucesso');
      setClients(clients.filter(c => c.id !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao deletar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nome: '', telefone: '' });
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

  const formatClientName = (value) => {
    // Limita a 30 caracteres
    const limited = value.slice(0, 30);
    
    // Formata cada palavra com primeira letra maiúscula
    return limited
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-light p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-8 mb-2">
            <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
              <Users size={28} /> Cadastro de Clientes
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition shadow-md hover:shadow-xl border border-white/20 transform hover:scale-105 bg-gradient-to-br from-primary/80 to-secondary/80 text-white hover:from-primary hover:to-secondary"
              style={{ display: showForm ? 'none' : 'flex' }}
            >
              <Plus size={20} /> Novo Cliente
            </button>
          </div>
          <p className="text-gray-500">Gerencie seus clientes</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-semibold text-dark mb-2">
                    Nome *
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: formatClientName(e.target.value) })}
                    maxLength={30}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.nome.length}/30 caracteres</p>
                </div>
                <div>
                  <label htmlFor="telefone" className="block text-sm font-semibold text-dark mb-2">
                    Telefone
                  </label>
                  <input
                    id="telefone"
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhoneNumber(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading && !showForm ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum cliente cadastrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-dark whitespace-nowrap">Telefone</th>
                    <th className="px-2 py-3 text-left text-sm font-semibold text-dark">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-dark">{client.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{client.telefone || '-'}</td>
                      <td className="px-2 py-3 text-sm space-x-1 flex">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
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
      </div>
    </div>
  );
}
