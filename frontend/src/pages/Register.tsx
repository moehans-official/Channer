import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, UserOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const { Title, Text, Paragraph } = Typography;

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string; email: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/register', values);
      messageApi.success('注册成功！请登录');
      navigate('/login');
    } catch (err: any) {
      messageApi.error(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f0f2f5',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, #f6ffed 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {contextHolder}
      
      <Card
        style={{ 
          width: 420, 
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f0f0f0',
          background: '#fff',
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(82, 196, 26, 0.3)',
          }}>
            <SafetyOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1a1a1a' }}>
            注册账号
          </Title>
          <Text type="secondary" style={{ fontSize: 15, marginTop: 8, display: 'block' }}>
            加入 Channer AI Gateway
          </Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              placeholder="用户名"
              style={{ borderRadius: 8, height: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#52c41a' }} />}
              placeholder="邮箱"
              style={{ borderRadius: 8, height: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#52c41a' }} />}
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
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(82, 196, 26, 0.35)',
              }}
            >
              注 册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          textAlign: 'center', 
          padding: '16px 0 0',
          borderTop: '1px solid #f0f0f0',
          marginTop: 8
        }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            已有账号？ <Link to="/login" style={{ color: '#52c41a', fontWeight: 600 }}>立即登录</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
