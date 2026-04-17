import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Key, 
  Settings, 
  LogOut,
  Server,
  BrainCircuit,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表板' },
  { path: '/channels', icon: Server, label: '渠道管理' },
  { path: '/models', icon: BrainCircuit, label: '模型管理' },
  { path: '/keys', icon: Key, label: 'API Keys' },
  { path: '/logs', icon: FileText, label: '日志查询' },
  { path: '/settings', icon: Settings, label: '系统设置' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary-600">Channer</h1>
          <p className="text-sm text-gray-500 mt-1">AI Gateway</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
