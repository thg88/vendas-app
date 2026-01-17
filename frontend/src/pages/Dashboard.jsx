import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, FileText, Users, Package, Home, Boxes, Heart } from 'lucide-react';
import { salesService, paymentService } from '../services/api';
import SaleForm from '../components/SaleForm';
import SalesQuery from '../components/SalesQuery';
import ClientsManagement from '../components/ClientsManagement';
import ProductsManagement from '../components/ProductsManagement';
import LotesManagement from '../components/LotesManagement';
import WishlistManagement from '../components/WishlistManagement';

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [user, setUser] = useState(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrollando para baixo
        setShowHeader(false);
      } else {
        // Scrollando para cima
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { id: 'lotes', label: 'Controle de Lotes', icon: Boxes },
    { id: 'sale', label: 'Lançar Venda', icon: ShoppingCart },
    { id: 'query', label: 'Consulta Vendas', icon: FileText },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'wishlist', label: 'Lista de Desejos', icon: Heart },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'home':
        return <HomeContent menuItems={menuItems} setActiveMenu={setActiveMenu} />;
      case 'lotes':
        return <LotesManagement />;
      case 'sale':
        return <SaleForm />;
      case 'query':
        return <SalesQuery />;
      case 'clients':
        return <ClientsManagement />;
      case 'products':
        return <ProductsManagement />;
      case 'wishlist':
        return <WishlistManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className={`bg-gradient-to-r from-primary to-secondary shadow-sm sticky top-0 z-40 transform transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-md mx-auto px-4 py-1 flex justify-center items-center relative">
          <button
            onClick={() => setActiveMenu('home')}
            className="cursor-pointer hover:opacity-80 transition"
            title="Voltar ao menu inicial"
          >
            <img src="/logo.png" alt="Logo Loja da Beth" className="h-14" />
          </button>
          <button
            onClick={handleLogout}
            className="absolute right-4 flex items-center gap-2 px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            title="Sair"
          >
            <LogOut size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {activeMenu === 'home' ? (
          <HomeContent menuItems={menuItems} setActiveMenu={setActiveMenu} user={user} />
        ) : (
          <div>
            <button
              onClick={() => setActiveMenu('home')}
              className="flex items-center gap-2 mb-6 text-secondary hover:text-primary transition"
            >
              <Home size={20} />
              <span>Voltar ao Menu</span>
            </button>
            {renderContent()}
          </div>
        )}
      </main>
    </div>
  );
}

function HomeContent({ menuItems, setActiveMenu, user }) {
  const [receivableSales, setReceivableSales] = useState([]);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [salesTodayCount, setSalesTodayCount] = useState(0);
  const [salesTodayValue, setSalesTodayValue] = useState(0);
  const [totalMonthValue, setTotalMonthValue] = useState(0);
  const [salesJoiasValue, setSalesJoiasValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReceivableSales();
    loadSalesStats();
  }, []);

  const loadSalesStats = async () => {
    try {
      const response = await salesService.getAll();
      const allSales = response.data;

      // Pégar mês e ano atual
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Filtrar vendas de lotes fechados tipo Roupas (independente de data)
      const salesToday = allSales.filter(sale => {
        return sale.lote_status === 'fechado' && sale.tipo === 'Roupas';
      });

      // Filtrar vendas de lotes fechados tipo Semi-Joias (independente de data)
      const salesJoias = allSales.filter(sale => {
        return sale.lote_status === 'fechado' && sale.tipo === 'Semi-joias';
      });

      // Filtrar vendas do mês atual
      const salesMonth = allSales.filter(sale => {
        const saleDate = new Date(sale.data_venda);
        return saleDate.getMonth() + 1 === currentMonth && 
               saleDate.getFullYear() === currentYear;
      });

      // Calcular totais
      const todayTotal = salesToday.reduce((sum, sale) => sum + sale.valor_total, 0);
      const joiasTotal = salesJoias.reduce((sum, sale) => sum + sale.valor_total, 0);
      const monthTotal = salesMonth.reduce((sum, sale) => sum + sale.valor_total, 0);

      setSalesTodayCount(salesToday.length);
      setSalesTodayValue(todayTotal);
      setSalesJoiasValue(joiasTotal);
      setTotalMonthValue(monthTotal);
    } catch (err) {
      console.error('Erro ao carregar estatísticas de vendas', err);
    }
  };

  const loadReceivableSales = async () => {
    setLoading(true);
    try {
      const response = await salesService.getAll();
      // Filtrar vendas a prazo ou consignado
      const prazoSales = response.data.filter(sale => sale.forma_pagamento === 'prazo' || sale.forma_pagamento === 'consignado');
      // Para cada venda a prazo/consignado, buscar resumo de pagamentos e usar o saldo_pendente
      const salesWithPending = await Promise.all(prazoSales.map(async (sale) => {
        try {
          const payResp = await paymentService.getByVenda(sale.id);
          const payInfo = payResp.data;
          const pending = (payInfo && typeof payInfo.saldo_pendente === 'number') ? payInfo.saldo_pendente : sale.valor_total;
          return { ...sale, pending };
        } catch (err) {
          // se falhar ao buscar pagamentos, considerar o valor inteiro como pendente
          return { ...sale, pending: sale.valor_total };
        }
      }));

      // Filtrar somente vendas com saldo pendente > 0 (exclui vendas já quitadas)
      const pendingOnly = salesWithPending.filter(s => s.pending > 0);

      // Agrupar por cliente e somar os pendentes
      const groupedBySales = {};
      let total = 0;

      pendingOnly.forEach(sale => {
        if (!groupedBySales[sale.cliente_id]) {
          groupedBySales[sale.cliente_id] = {
            cliente_id: sale.cliente_id,
            cliente_nome: sale.cliente_nome,
            count: 0,
            valor: 0
          };
        }
        groupedBySales[sale.cliente_id].count += 1;
        groupedBySales[sale.cliente_id].valor += sale.pending;
        total += sale.pending;
      });

      setReceivableSales(Object.values(groupedBySales));
      setTotalReceivable(total);
    } catch (err) {
      console.error('Erro ao carregar vendas a receber', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateCommission = (totalVendas) => {
    if (totalVendas <= 699.99) {
      return totalVendas * 0.30; // 30%
    } else if (totalVendas >= 700 && totalVendas <= 1199.99) {
      return totalVendas * 0.35; // 35%
    } else if (totalVendas >= 1200) {
      return totalVendas * 0.40; // 40%
    }
    return 0;
  };

  const calculateCommissionJoias = (totalVendas) => {
    if (totalVendas <= 1199.99) {
      return totalVendas * 0.30; // 30%
    } else if (totalVendas >= 1200) {
      return totalVendas * 0.35; // 35%
    }
    return 0;
  };
  return (
    <div className="space-y-3">
      {/* Welcome Section */}
      <div className="flex items-center justify-between gap-8 py-0 mb-7">
        <div className="text-left flex-shrink-0">
          <h2 className="text-xl font-bold text-dark">
            Olá, {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase() : 'Elisabeth'}!
          </h2>
          <p className="text-gray-500 text-sm">Bem-vinda de volta</p>
        </div>
        <div className="text-right">
          <p className="text-primary font-bold italic text-sm leading-tight max-w-xs">
            "Tudo posso naquele que me fortalece"
          </p>
          <p className="text-secondary text-xs mt-0.5">— Filipenses 4:13</p>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className="bg-gradient-to-br from-primary/80 to-secondary/80 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 hover:shadow-xl shadow-md transition transform hover:scale-105 border border-white/20"
            >
              <Icon size={28} className="text-white" />
              <span className="text-xs font-semibold text-white text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vendas a Receber */}
      <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
        <h3 className="text-base font-bold text-dark">Vendas a Receber</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-xs text-gray-600">Total de Vendas</span>
            <span className="text-xl font-bold text-primary">{receivableSales.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Valor Total</span>
            <span className="text-xl font-bold text-secondary">{formatCurrency(totalReceivable)}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-primary">{formatCurrency(salesTodayValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Vendas Roupas</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-primary">{formatCurrency(calculateCommission(salesTodayValue))}</p>
          <p className="text-xs text-gray-500 mt-1">Comissão Vendas</p>
        </div>
      </div>

      {/* Semi-Joias Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-primary">{formatCurrency(salesJoiasValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Vendas Semi-Joias</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-primary">{formatCurrency(calculateCommissionJoias(salesJoiasValue))}</p>
          <p className="text-xs text-gray-500 mt-1">Comissão Semi-Joias</p>
        </div>
      </div>
    </div>
  );
}
