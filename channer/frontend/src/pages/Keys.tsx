import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useKeyStore } from '../stores/keyStore';
import { Plus, Edit2, Trash2, Copy, CreditCard } from 'lucide-react';

export function KeysPage() {
  const { keys, loading, fetchKeys, createKey, updateKey, deleteKey, rechargeKey } = useKeyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    balance: 0,
    rpm_limit: 60,
    tpm_limit: 100000,
    rpd_limit: 10000,
    tpd_limit: 1000000,
    is_active: true,
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKey) {
        await updateKey(editingKey.id, formData);
      } else {
        await createKey(formData);
      }
      setIsModalOpen(false);
      setEditingKey(null);
      resetForm();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;
    
    try {
      await rechargeKey(editingKey.id, parseFloat(rechargeAmount));
      setIsRechargeModalOpen(false);
      setRechargeAmount('');
      setEditingKey(null);
    } catch (error) {
      alert('充值失败');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      balance: 0,
      rpm_limit: 60,
      tpm_limit: 100000,
      rpd_limit: 10000,
      tpd_limit: 1000000,
      is_active: true,
    });
  };

  const handleEdit = (key: any) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      balance: key.balance,
      rpm_limit: key.rpm_limit,
      tpm_limit: key.tpm_limit,
      rpd_limit: key.rpd_limit,
      tpd_limit: key.tpd_limit,
      is_active: key.is_active,
    });
    setIsModalOpen(true);
  };

  const handleRechargeClick = (key: any) => {
    setEditingKey(key);
    setRechargeAmount('');
    setIsRechargeModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个API Key吗？')) {
      await deleteKey(id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">API Keys</h1>
          <p className="text-gray-500 mt-2">管理租户API访问密钥</p>
        </div>
        <button
          onClick={() => {
            setEditingKey(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建Key
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
                <th>API Key</th>
                <th>余额</th>
                <th>配额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="font-medium">{key.name}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-gray-500">
                        {key.key.slice(0, 20)}...
                      </span>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td>${key.balance.toFixed(2)}</td>
                  <td className="text-sm text-gray-500">
                    RPM: {key.rpm_limit}
                    <br />
                    TPM: {key.tpm_limit.toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        key.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {key.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRechargeClick(key)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="充值"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(key)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingKey ? '编辑API Key' : '创建API Key'}
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

          {!editingKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初始余额
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
                className="input"
                min="0"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RPM限制
              </label>
              <input
                type="number"
                value={formData.rpm_limit}
                onChange={(e) => setFormData({ ...formData, rpm_limit: parseInt(e.target.value) })}
                className="input"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TPM限制
              </label>
              <input
                type="number"
                value={formData.tpm_limit}
                onChange={(e) => setFormData({ ...formData, tpm_limit: parseInt(e.target.value) })}
                className="input"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RPD限制
              </label>
              <input
                type="number"
                value={formData.rpd_limit}
                onChange={(e) => setFormData({ ...formData, rpd_limit: parseInt(e.target.value) })}
                className="input"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TPD限制
              </label>
              <input
                type="number"
                value={formData.tpd_limit}
                onChange={(e) => setFormData({ ...formData, tpd_limit: parseInt(e.target.value) })}
                className="input"
                min="1"
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
              {editingKey ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Recharge Modal */}
      <Modal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        title="充值"
      >
        <form onSubmit={handleRecharge} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              为 <strong>{editingKey?.name}</strong> 充值
              <br />
              当前余额: ${editingKey?.balance?.toFixed(2)}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              充值金额
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              className="input"
              placeholder="请输入金额"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsRechargeModalOpen(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              确认充值
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
