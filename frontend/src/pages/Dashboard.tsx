import { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useStatsStore } from '../stores/statsStore';
import { 
  Activity, 
  CreditCard, 
  Key, 
  Server,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export function DashboardPage() {
  const { dashboardStats, fetchDashboardStats, loading } = useStatsStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statsCards = [
    {
      title: '总请求数',
      value: dashboardStats?.total_requests || 0,
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      title: '总Token数',
      value: dashboardStats?.total_tokens?.toLocaleString() || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: '总费用',
      value: `$${(dashboardStats?.total_cost || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      title: '活跃API Keys',
      value: dashboardStats?.active_keys || 0,
      icon: Key,
      color: 'bg-purple-500',
    },
    {
      title: '活跃渠道',
      value: dashboardStats?.active_channels || 0,
      icon: Server,
      color: 'bg-orange-500',
    },
    {
      title: '今日费用',
      value: `$${(dashboardStats?.today_cost || 0).toFixed(2)}`,
      icon: CreditCard,
      color: 'bg-pink-500',
    },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">仪表板</h1>
        <p className="text-gray-500 mt-2">系统概览和关键指标</p>
      </div>

      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="card">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${card.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
