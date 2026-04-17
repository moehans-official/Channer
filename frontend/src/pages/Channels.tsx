import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useChannelStore } from '../stores/channelStore';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export function ChannelsPage() {
  const { channels, loading, fetchChannels, createChannel, updateChannel, deleteChannel } = useChannelStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'openai',
    base_url: '',
    api_key: '',
    priority: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChannel) {
        await updateChannel(editingChannel.id, formData);
      } else {
        await createChannel(formData);
      }
      setIsModalOpen(false);
      setEditingChannel(null);
      setFormData({
        name: '',
        type: 'openai',
        base_url: '',
        api_key: '',
        priority: 0,
        is_active: true,
      });
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleEdit = (channel: any) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      type: channel.type,
      base_url: channel.base_url,
      api_key: '',
      priority: channel.priority,
      is_active: channel.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个渠道吗？')) {
      await deleteChannel(id);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Gemini',
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">渠道管理</h1>
          <p className="text-gray-500 mt-2">管理AI提供商渠道配置</p>
        </div>
        <button
          onClick={() => {
            setEditingChannel(null);
            setFormData({
              name: '',
              type: 'openai',
              base_url: '',
              api_key: '',
              priority: 0,
              is_active: true,
            });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加渠道
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>API地址</th>
                <th>优先级</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.id}>
                  <td className="font-medium">{channel.name}</td>
                  <td>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {getTypeLabel(channel.type)}
                    </span>
                  </td>
                  <td className="text-gray-500 truncate max-w-xs">{channel.base_url}</td>
                  <td>{channel.priority}</td>
                  <td>
                    {channel.is_active ? (
                      <span className="flex items-center text-green-600">
                        <Check className="w-4 h-4 mr-1" /> 启用
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <X className="w-4 h-4 mr-1" /> 禁用
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(channel)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(channel.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChannel ? '编辑渠道' : '添加渠道'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              类型
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
              required
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API地址
            </label>
            <input
              type="url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              className="input"
              placeholder="https://api.openai.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              className="input"
              placeholder={editingChannel ? '留空表示不修改' : ''}
              required={!editingChannel}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              优先级
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="input"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">数值越小优先级越高</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              启用
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingChannel ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
