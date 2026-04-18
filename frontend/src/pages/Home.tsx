import { Button, Card, Typography, Row, Col } from 'antd';
import { RocketOutlined, SafetyOutlined, DollarOutlined, ApiOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const features = [
  {
    icon: <ApiOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    title: '多渠道支持',
    desc: '支持 OpenAI、Anthropic、Gemini 等多种 AI 提供商，统一管理',
  },
  {
    icon: <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: '安全可靠',
    desc: 'JWT 认证，API Key 隔离存储，余额保护',
  },
  {
    icon: <DollarOutlined style={{ fontSize: 32, color: '#faad14' }} />,
    title: '灵活计费',
    desc: '预付费模式，精确按量计费，支持多租户',
  },
  {
    icon: <RocketOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    title: '负载均衡',
    desc: '智能路由，自动 failover，保证服务高可用',
  },
];

export function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{
        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
        padding: '80px 24px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <Title level={1} style={{ color: '#fff', fontSize: 48, fontWeight: 800, marginBottom: 16 }}>
          Channer AI Gateway
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, maxWidth: 600, margin: '0 auto 32px' }}>
          轻量级多租户 AI 网关，为个人和小型团队提供统一的 AI API 管理体验
        </Paragraph>
        <Space size={16}>
          <Link to="/login">
            <Button size="large" style={{ background: '#fff', color: '#667eea', border: 'none', height: 48, padding: '0 32px', fontWeight: 600 }}>
              登录
            </Button>
          </Link>
          <Link to="/register">
            <Button size="large" ghost style={{ borderColor: '#fff', color: '#fff', height: 48, padding: '0 32px' }}>
              注册
            </Button>
          </Link>
        </Space>
      </div>

      <div style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
          核心功能
        </Title>
        <Row gutter={[24, 24]}>
          {features.map((f, i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card hoverable style={{ textAlign: 'center', height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: 16 }}>{f.icon}</div>
                <Title level={4} style={{ marginBottom: 8 }}>{f.title}</Title>
                <Text type="secondary">{f.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ background: '#f5f7fa', padding: '60px 24px', textAlign: 'center' }}>
        <Title level={3}>开始使用</Title>
        <Paragraph type="secondary" style={{ maxWidth: 500, margin: '16px auto 32px' }}>
          登录后即可管理 AI 渠道、配置模型、创建 API Key
        </Paragraph>
        <Link to="/login">
          <Button type="primary" size="large">立即体验</Button>
        </Link>
      </div>

      <div style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary">Channer AI Gateway</Text>
      </div>
    </div>
  );
}
