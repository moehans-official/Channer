import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useChannelStore } from '../stores/channelStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { modelApi, AIModel } from '../api/model';

export function ModelsPage() {
  const { channels, fetchChannels } = useChannelStore();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState({
    channel_id: 0,
    model_id: '',
    name: '',
    input_price: 0,
    output_price: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchChannels();
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await modelApi.list();
      setModels(response.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        await modelApi.update(editingModel.id, formData);
      } else {
        await modelApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingModel(null);
      resetForm();
      fetchModels();
    } catch (error) {
      alert('操作失败');
    }
  };

  const resetForm = () => {
    setFormData({
      channel_id: 0,
      model_id: '',
      name: '',
      input_price: 0,
      output_price: 0,
      is_active: true,
    });
  };

  const handleEdit = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      channel_id: model.channel_id,
      model_id: model.model_id,
      name: model.name,
      input_price: model.input_price,
      output_price: model.output_price,
      is_active: model.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个模型吗？')) {
      await modelApi.delete(id);
      fetchModels();
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">模型管理</h1>
          <p className="text-gray-500 mt-2">配置支持的AI模型和定价</p>
        </div>
        <button
          onClick={() => {
            setEditingModel(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加模型
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>模型ID</th>
                <th>显示名称</th>
                <th>所属渠道</th>
                <th>输入价格</th>
                <th>输出价格</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td className="font-mono text-sm">{model.model_id}</td>
                  <td>{model.name || '-'}</td>
                  <td>{model.channel?.name || '-'}</td>
                  <td>${model.input_price}/1K tokens</td>
                  <td>${model.output_price}/1K tokens</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        model.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {model.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(model)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
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
        title={editingModel ? '编辑模型' : '添加模型'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属渠道
            </label>
            <select
              value={formData.channel_id}
              onChange={(e) => setFormData({ ...formData, channel_id: parseInt(e.target.value) })}
              className="input"
              required
            >
              <option value={0}>请选择渠道</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name} ({channel.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型ID
            </label>
            <input
              type="text"
              value={formData.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              className="input"
              placeholder="如: gpt-4o, claude-3-opus-20240229"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              显示名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="如: GPT-4o"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                输入价格 ($/1K tokens)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.input_price}
                onChange={(e) => setFormData({ ...formData, input_price: parseFloat(e.target.value) })}
                className="input"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                输出价格 ($/1K tokens)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.output_price}
                onChange={(e) => setFormData({ ...formData, output_price: parseFloat(e.target.value) })}
                className="input"
                min="0"
                required
              />
            </div>
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
              {editingModel ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
