import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Typography, Drawer, Avatar, Dropdown, Space, Switch } from 'antd';
import {
  DashboardOutlined,
  ApiOutlined,
  ClusterOutlined,
  KeyOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../contexts/ThemeContext';

const { Header, Sider, Content } = AntLayout;
const { Title, Text } = Typography;

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/dashboard', icon: <DashboardOutlined />, label: '仪表板' },
  { path: '/channels', icon: <ApiOutlined />, label: '渠道管理' },
  { path: '/models', icon: <ClusterOutlined />, label: '模型管理' },
  { path: '/keys', icon: <KeyOutlined />, label: 'API Keys' },
  { path: '/logs', icon: <FileTextOutlined />, label: '日志查询' },
  { path: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setDrawerVisible(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedKey = menuItems.find(item => item.path === location.pathname)?.path || '/dashboard';

  const handleMenuClick = () => {
    setDrawerVisible(false);
  };

  const siderWidth = 220;

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const bgColor = theme === 'dark' ? '#000' : '#f0f2f5';
  const cardBg = theme === 'dark' ? '#141414' : '#fff';
  const headerBg = theme === 'dark' ? '#141414' : '#fff';
  const textColor = theme === 'dark' ? '#e8e8e8' : '#1a1a1a';
  const secondaryText = theme === 'dark' ? '#666' : '#666';
  const siderBg = theme === 'dark' ? '#141414' : '#fff';
  const borderColor = theme === 'dark' ? '#303030' : '#f0f0f0';
  const menuBg = theme === 'dark' ? '#141414' : '#fff';

  return (
    <AntLayout style={{ minHeight: '100vh', background: bgColor }}>
      {!isMobile && (
        <Sider
          width={siderWidth}
          style={{
            background: siderBg,
            boxShadow: theme === 'dark' ? 'none' : '2px 0 8px rgba(0,0,0,0.06)',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            overflow: 'auto',
            borderRight: `1px solid ${borderColor}`,
          }}
        >
          <div style={{ 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderBottom: `1px solid ${borderColor}`,
            background: siderBg,
          }}>
            <Title level={4} style={{ margin: 0, color: '#1890ff', fontWeight: 700, letterSpacing: 1 }}>
              Channer
            </Title>
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            theme={theme === 'dark' ? 'dark' : 'light'}
            items={menuItems.map(item => ({
              key: item.path,
              icon: item.icon,
              label: <Link to={item.path}>{item.label}</Link>,
            }))}
            style={{ 
              borderRight: 0, 
              marginTop: 8,
              background: 'transparent',
            }}
          />

          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            width: '100%', 
            padding: '16px',
            borderTop: `1px solid ${borderColor}`,
          }}>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={logout}
              style={{ width: '100%', textAlign: 'left', color: '#ff4d4f' }}
            >
              退出登录
            </Button>
          </div>
        </Sider>
      )}

      <div style={{ 
        marginLeft: isMobile ? 0 : siderWidth,
        transition: 'margin-left 0.2s',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header style={{ 
          background: headerBg, 
          padding: '0 24px',
          boxShadow: theme === 'dark' ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 18 }} />}
                onClick={() => setDrawerVisible(true)}
              />
            )}
            <Title level={4} style={{ margin: 0, color: textColor }}>
              {menuItems.find(item => item.path === selectedKey)?.label}
            </Title>
          </div>

          <Space size={16}>
            {isMobile && (
              <Switch 
                checked={theme === 'dark'} 
                onChange={toggleTheme}
                size="small"
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            )}
            <Button type="text" icon={<BellOutlined style={{ fontSize: 18, color: secondaryText }} />} />
            <Dropdown menu={{ items: userMenuItems, onClick: ({ key }) => key === 'logout' && logout() }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={36} style={{ background: '#1890ff' }}>
                  <UserOutlined />
                </Avatar>
                {!isMobile && <Text strong style={{ color: textColor }}>Admin</Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ flex: 1, padding: isMobile ? 12 : 24 }}>
          <div style={{ 
            padding: isMobile ? 16 : 24, 
            background: cardBg, 
            minHeight: 'calc(100vh - 88px)', 
            borderRadius: 8,
            boxShadow: theme === 'dark' ? 'none' : '0 2px 12px rgba(0,0,0,0.03)',
            border: `1px solid ${borderColor}`,
          }}>
            {children}
          </div>
        </Content>
      </div>

      <Drawer
        title={
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>Channer</Title>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={siderWidth}
        styles={{ 
          body: { padding: 0, display: 'flex', flexDirection: 'column', background: menuBg },
          header: { background: menuBg, borderBottom: `1px solid ${borderColor}` },
        }}
        footer={
          <div style={{ padding: 16, borderTop: `1px solid ${borderColor}` }}>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={logout}
              style={{ width: '100%', textAlign: 'left', color: '#ff4d4f' }}
            >
              退出登录
            </Button>
          </div>
        }
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          theme={theme === 'dark' ? 'dark' : 'light'}
          items={menuItems.map(item => ({
            key: item.path,
            icon: item.icon,
            label: <Link to={item.path} onClick={handleMenuClick}>{item.label}</Link>,
          }))}
          style={{ borderRight: 0, flex: 1, background: 'transparent' }}
        />
      </Drawer>
    </AntLayout>
  );
}
