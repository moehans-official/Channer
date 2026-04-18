import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../contexts/ThemeContext';

const { Title, Text } = Typography;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const [messageApi, contextHolder] = message.useMessage();
  const { theme } = useTheme();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      window.location.href = '/dashboard';
    } catch (err: any) {
      messageApi.error(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const bgColor = theme === 'dark' ? '#000' : '#f0f2f5';
  const cardBg = theme === 'dark' ? '#141414' : '#fff';
  const textColor = theme === 'dark' ? '#e8e8e8' : '#1a1a1a';

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: bgColor,
    }}>
      {contextHolder}
      
      <Card
        style={{ 
          width: 400, 
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          background: cardBg,
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <SafetyOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: textColor }}>
            Channer
          </Title>
          <Text type="secondary" style={{ fontSize: 15, marginTop: 8, display: 'block' }}>
            AI Gateway 智能路由系统
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              placeholder="用户名"
              style={{ borderRadius: 8, height: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="密码"
              style={{ borderRadius: 8, height: 48 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32, marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ 
                height: 48, 
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          textAlign: 'center', 
          padding: '16px 0 0',
          borderTop: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          marginTop: 8
        }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            没有账号？ <Link to="/register" style={{ color: '#1890ff', fontWeight: 600 }}>立即注册</Link>
          </Text>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: 16,
          padding: '12px',
          background: theme === 'dark' ? '#1a1a1a' : '#fafafa',
          borderRadius: 8,
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            测试账号: admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  );
}
