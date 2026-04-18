import { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useStatsStore } from '../stores/statsStore';
import { Card, Row, Col, Spin, Typography, Progress } from 'antd';
import {
  RiseOutlined,
  DollarOutlined,
  KeyOutlined,
  ApiOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

const { Title, Text } = Typography;

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  trend,
}: { 
  title: string; 
  value: any; 
  icon: React.ReactNode; 
  color: string;
  trend?: number;
}) => {
  const { theme } = useTheme();
  
  return (
    <Card 
      style={{ 
        borderRadius: 8,
        marginBottom: 16,
        border: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
      }} 
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}>
          <div style={{ color, fontSize: 20 }}>{icon}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>{title}</Text>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: theme === 'dark' ? '#e8e8e8' : '#1a1a1a' }}>{value}</span>
            {trend !== undefined && (
              <span style={{ 
                fontSize: 12, 
                color: trend >= 0 ? '#52c41a' : '#ff4d4f',
                display: 'flex',
                alignItems: 'center',
              }}>
                {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export function DashboardPage() {
  const { dashboardStats, fetchDashboardStats, loading } = useStatsStore();
  const { theme } = useTheme();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statsCards = [
    {
      title: '总请求数',
      value: dashboardStats?.total_requests?.toLocaleString() || '0',
      icon: <FileTextOutlined />,
      color: '#1890ff',
      trend: 12,
    },
    {
      title: '总Token数',
      value: dashboardStats?.total_tokens?.toLocaleString() || '0',
      icon: <RiseOutlined />,
      color: '#52c41a',
      trend: 8,
    },
    {
      title: '总费用',
      value: `$${(dashboardStats?.total_cost || 0).toFixed(2)}`,
      icon: <DollarOutlined />,
      color: '#faad14',
    },
    {
      title: '活跃API Keys',
      value: dashboardStats?.active_keys || 0,
      icon: <KeyOutlined />,
      color: '#722ed1',
    },
    {
      title: '活跃渠道',
      value: dashboardStats?.active_channels || 0,
      icon: <ApiOutlined />,
      color: '#fa8c16',
    },
    {
      title: '今日费用',
      value: `$${(dashboardStats?.today_cost || 0).toFixed(2)}`,
      icon: <DollarCircleOutlined />,
      color: '#eb2f96',
    },
  ];

  const usagePercent = dashboardStats?.today_cost && dashboardStats?.today_cost > 0 
    ? Math.min((dashboardStats.today_cost / 100) * 100, 100) 
    : 0;

  const textColor = theme === 'dark' ? '#e8e8e8' : '#1a1a1a';
  const secondaryText = theme === 'dark' ? '#888' : '#666';

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 600, color: textColor }}>仪表板</Title>
        <Text type="secondary">欢迎回来，以下是系统概览</Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: secondaryText }}>加载中...</div>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {statsCards.map((card, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <StatCard {...card} />
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} lg={12}>
              <Card 
                title={<span style={{ color: textColor }}>今日使用进度</span>}
                extra={<Text type="secondary">目标: $100</Text>}
                style={{ borderRadius: 8 }}
              >
                <Progress 
                  percent={usagePercent} 
                  strokeColor="#1890ff"
                  trailColor={theme === 'dark' ? '#333' : '#f0f0f0'}
                  style={{ marginTop: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text type="secondary">已使用: ${(dashboardStats?.today_cost || 0).toFixed(2)}</Text>
                  <Text type="secondary">剩余: ${Math.max(100 - (dashboardStats?.today_cost || 0), 0).toFixed(2)}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={<span style={{ color: textColor }}>系统状态</span>}
                style={{ borderRadius: 8 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>数据库</Text>
                    <Text style={{ color: '#52c41a' }}>● 正常</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>API 服务</Text>
                    <Text style={{ color: '#52c41a' }}>● 正常</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Redis 缓存</Text>
                    <Text style={{ color: '#fa8c16' }}>● 未启用</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Layout>
  );
}
