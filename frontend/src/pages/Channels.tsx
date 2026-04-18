import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useChannelStore } from '../stores/channelStore';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, Space, Tag, message, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export function ChannelsPage() {
  const { channels, loading, fetchChannels, createChannel, updateChannel, deleteChannel } = useChannelStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchChannels();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (editingChannel) {
        await updateChannel(editingChannel.id, values);
        messageApi.success('更新成功');
      } else {
        await createChannel(values);
        messageApi.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingChannel(null);
      form.resetFields();
    } catch (error) {
      messageApi.error('操作失败');
    }
  };

  const handleEdit = (record: any) => {
    setEditingChannel(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      base_url: record.base_url,
      api_key: '',
      priority: record.priority,
      is_active: record.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteChannel(id);
    messageApi.success('删除成功');
  };

  const handleAdd = () => {
    setEditingChannel(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'openai',
      priority: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = { openai: 'blue', anthropic: 'orange', gemini: 'green' };
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    { title: 'API地址', dataIndex: 'base_url', key: 'base_url', ellipsis: true },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>{isActive ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  const ChannelCard = ({ record }: { record: any }) => {
    const colors: Record<string, string> = { openai: 'blue', anthropic: 'orange', gemini: 'green' };
    return (
      <Card size="small" style={{ marginBottom: 12 }} actions={[
        <EditOutlined key="edit" onClick={() => handleEdit(record)} />,
        <DeleteOutlined key="delete" onClick={() => handleDelete(record.id)} />,
      ]}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>{record.name}</span>
          <Tag color={colors[record.type] || 'default'}>{record.type.toUpperCase()}</Tag>
        </div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
          <div style={{ wordBreak: 'break-all' }}>{record.base_url}</div>
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>
          优先级: {record.priority} | <Tag color={record.is_active ? 'success' : 'error'} style={{ margin: 0 }}>{record.is_active ? '启用' : '禁用'}</Tag>
        </div>
      </Card>
    );
  };

  return (
    <Layout>
      {contextHolder}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>渠道管理</h2>
          <span style={{ color: '#999' }}>管理AI提供商渠道配置</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加渠道
        </Button>
      </div>

      {isMobile ? (
        channels.map(record => <ChannelCard key={record.id} record={record} />)
      ) : (
        <Table columns={columns} dataSource={channels} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      )}

      <Modal title={editingChannel ? '编辑渠道' : '添加渠道'} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={isMobile ? '100%' : 520}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入渠道名称' }]}>
            <Input placeholder="如: OpenAI Primary" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select>
              <Select.Option value="openai">OpenAI</Select.Option>
              <Select.Option value="anthropic">Anthropic</Select.Option>
              <Select.Option value="gemini">Gemini</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="base_url" label="API地址" rules={[{ required: true, message: '请输入API地址' }]}>
            <Input placeholder="https://api.openai.com" />
          </Form.Item>
          <Form.Item name="api_key" label="API Key" extra={editingChannel ? '留空表示不修改' : ''}>
            <Input.Password placeholder={editingChannel ? '留空表示不修改' : 'sk-...'} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" extra="数值越小优先级越高">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">{editingChannel ? '保存' : '创建'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
