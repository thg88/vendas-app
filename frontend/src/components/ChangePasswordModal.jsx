import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (!username || !currentPassword || !newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (newPassword.length < 6) {
      setError('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Nova senha não pode ser igual à atual');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(username, currentPassword, newPassword);
      setSuccess('Senha alterada com sucesso! Você pode fazer login novamente.');
      
      // Limpar formulário
      setTimeout(() => {
        setUsername('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 relative">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        {/* Título */}
        <div className="text-center pt-2">
          <h2 className="text-xl font-bold text-dark">Mudar Senha</h2>
          <p className="text-gray-500 text-xs mt-0.5">Digite suas credenciais para alterar a senha</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleChangePassword} className="space-y-3">
          {/* Usuário */}
          <div className="space-y-1">
            <label htmlFor="change-username" className="text-xs font-semibold text-dark">
              Usuário
            </label>
            <input
              id="change-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
              required
            />
          </div>

          {/* Senha Atual */}
          <div className="space-y-1">
            <label htmlFor="current-password" className="text-xs font-semibold text-dark">
              Senha Atual
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                title={showCurrentPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-xs font-semibold text-dark">
              Nova Senha
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                title={showNewPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-1">
            <label htmlFor="confirm-password" className="text-xs font-semibold text-dark">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                title={showConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mensagens de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Mensagem de Sucesso */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-xs">{success}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm bg-gradient-to-br from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Alterando...' : 'Alterar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
