import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useChannelStore } from '../stores/channelStore';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { modelApi, AIModel } from '../api/model';

export function ModelsPage() {
  const { channels, fetchChannels } = useChannelStore();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

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

  const handleSubmit = async (values: any) => {
    try {
      if (editingModel) {
        await modelApi.update(editingModel.id, values);
        messageApi.success('更新成功');
      } else {
        await modelApi.create(values);
        messageApi.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingModel(null);
      form.resetFields();
      fetchModels();
    } catch (error) {
      messageApi.error('操作失败');
    }
  };

  const handleEdit = (record: AIModel) => {
    setEditingModel(record);
    form.setFieldsValue({
      channel_id: record.channel_id,
      model_id: record.model_id,
      name: record.name,
      input_price: record.input_price,
      output_price: record.output_price,
      is_active: record.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模型吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await modelApi.delete(id);
        messageApi.success('删除成功');
        fetchModels();
      },
    });
  };

  const handleAdd = () => {
    setEditingModel(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: '模型ID',
      dataIndex: 'model_id',
      key: 'model_id',
      render: (id: string) => <code style={{ fontSize: 12 }}>{id}</code>,
    },
    {
      title: '显示名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '所属渠道',
      dataIndex: 'channel_id',
      key: 'channel_id',
      render: (channelId: number) => {
        const channel = channels.find(c => c.id === channelId);
        return channel ? <Tag>{channel.name}</Tag> : '-';
      },
    },
    {
      title: '输入价格',
      dataIndex: 'input_price',
      key: 'input_price',
      render: (price: number) => `$${price}/1K tokens`,
    },
    {
      title: '输出价格',
      dataIndex: 'output_price',
      key: 'output_price',
      render: (price: number) => `$${price}/1K tokens`,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: AIModel) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      {contextHolder}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>模型管理</h2>
          <span style={{ color: '#999' }}>配置支持的AI模型和定价</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加模型
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={models}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingModel ? '编辑模型' : '添加模型'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="channel_id"
            label="所属渠道"
            rules={[{ required: true, message: '请选择渠道' }]}
          >
            <Select placeholder="请选择渠道">
              {channels.map(channel => (
                <Select.Option key={channel.id} value={channel.id}>
                  {channel.name} ({channel.type})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="model_id"
            label="模型ID"
            rules={[{ required: true, message: '请输入模型ID' }]}
          >
            <Input placeholder="如: gpt-4o, claude-3-opus-20240229" />
          </Form.Item>

          <Form.Item
            name="name"
            label="显示名称"
          >
            <Input placeholder="如: GPT-4o" />
          </Form.Item>

          <Form.Item
            name="input_price"
            label="输入价格 ($/1K tokens)"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="output_price"
            label="输出价格 ($/1K tokens)"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingModel ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
