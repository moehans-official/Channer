import { Layout } from '../components/Layout';
import { Settings, Info } from 'lucide-react';

export function SettingsPage() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">系统设置</h1>
        <p className="text-gray-500 mt-2">配置系统参数和查看信息</p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center mb-4">
            <Info className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold">系统信息</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">系统名称</span>
              <span className="font-medium">Channer AI Gateway</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">版本</span>
              <span className="font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">技术栈</span>
              <span className="font-medium">Go 1.25 + React + PostgreSQL + Redis</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold">API端点</h2>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">OpenAI兼容API</p>
              <code className="text-sm text-gray-600">POST /v1/chat/completions</code>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">OpenAI Responses API</p>
              <code className="text-sm text-gray-600">POST /v1/responses</code>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">Anthropic Messages API</p>
              <code className="text-sm text-gray-600">POST /v1/messages</code>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">Gemini API</p>
              <code className="text-sm text-gray-600">POST /v1beta/models/{'{model}'}:generateContent</code>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">使用说明</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-800 mb-1">1. 配置渠道</p>
              <p>在"渠道管理"页面添加AI提供商的API配置，支持OpenAI、Anthropic和Gemini。</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-800 mb-1">2. 添加模型</p>
              <p>在"模型管理"页面配置支持的AI模型及其定价。</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-800 mb-1">3. 创建API Key</p>
              <p>在"API Keys"页面创建访问密钥并充值余额。</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-800 mb-1">4. 使用API</p>
              <p>使用创建的API Key调用相应的API端点，系统会自动进行负载均衡和计费。</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
