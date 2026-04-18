import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useKeyStore } from '../stores/keyStore';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, message, Popconfirm, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, DollarOutlined } from '@ant-design/icons';

export function KeysPage() {
  const { keys, loading, fetchKeys, createKey, updateKey, deleteKey, rechargeKey } = useKeyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [form] = Form.useForm();
  const [rechargeForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchKeys();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (editingKey) {
        await updateKey(editingKey.id, values);
        messageApi.success('更新成功');
      } else {
        await createKey(values);
        messageApi.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingKey(null);
      form.resetFields();
    } catch (error) {
      messageApi.error('操作失败');
    }
  };

  const handleRecharge = async (values: { amount: number }) => {
    if (!editingKey) return;
    try {
      await rechargeKey(editingKey.id, values.amount);
      messageApi.success('充值成功');
      setIsRechargeModalOpen(false);
      rechargeForm.resetFields();
      setEditingKey(null);
    } catch (error) {
      messageApi.error('充值失败');
    }
  };

  const handleEdit = (record: any) => {
    setEditingKey(record);
    form.setFieldsValue({
      name: record.name,
      balance: record.balance,
      rpm_limit: record.rpm_limit,
      tpm_limit: record.tpm_limit,
      rpd_limit: record.rpd_limit,
      tpd_limit: record.tpd_limit,
      is_active: record.is_active,
    });
    setIsModalOpen(true);
  };

  const handleRechargeClick = (record: any) => {
    setEditingKey(record);
    setIsRechargeModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteKey(id);
    messageApi.success('删除成功');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success('已复制到剪贴板');
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({
      balance: 0,
      rpm_limit: 60,
      tpm_limit: 100000,
      rpd_limit: 10000,
      tpd_limit: 1000000,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'API Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{ fontSize: 11 }}>{key.slice(0, 20)}...</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(key)}
          />
        </div>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => (
        <span style={{ color: balance < 1 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          ${balance.toFixed(2)}
        </span>
      ),
    },
    {
      title: '配额',
      key: 'limits',
      render: (_: any, record: any) => (
        <div style={{ fontSize: 12, color: '#666' }}>
          <div>RPM: {record.rpm_limit}</div>
          <div>TPM: {record.tpm_limit.toLocaleString()}</div>
        </div>
      ),
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
      width: 180,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handleRechargeClick(record)}
            style={{ color: '#52c41a' }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除这个API Key吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const KeyCard = ({ record }: { record: any }) => (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      actions={[
        <DollarOutlined key="recharge" onClick={() => handleRechargeClick(record)} style={{ color: '#52c41a' }} />,
        <EditOutlined key="edit" onClick={() => handleEdit(record)} />,
        <DeleteOutlined key="delete" onClick={() => handleDelete(record.id)} />,
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>{record.name}</span>
        <Tag color={record.is_active ? 'success' : 'error'}>
          {record.is_active ? '启用' : '禁用'}
        </Tag>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        <div>Key: <code>{record.key.slice(0, 16)}...</code></div>
        <div>余额: <span style={{ color: record.balance < 1 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>${record.balance.toFixed(2)}</span></div>
      </div>
      <div style={{ fontSize: 11, color: '#999' }}>
        RPM: {record.rpm_limit} | TPM: {record.tpm_limit.toLocaleString()}
      </div>
    </Card>
  );

  return (
    <Layout>
      {contextHolder}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>API Keys</h2>
          <span style={{ color: '#999' }}>管理租户API访问密钥</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建Key
        </Button>
      </div>

      {isMobile ? (
        keys.map(record => <KeyCard key={record.id} record={record} />)
      ) : (
        <Table
          columns={columns}
          dataSource={keys}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 800 }}
        />
      )}

      <Modal
        title={editingKey ? '编辑API Key' : '创建API Key'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={isMobile ? '100%' : 520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如: Test Key" />
          </Form.Item>

          {!editingKey && (
            <Form.Item name="balance" label="初始余额">
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="rpm_limit" label="RPM限制">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tpm_limit" label="TPM限制">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="rpd_limit" label="RPD限制">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tpd_limit" label="TPD限制">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingKey ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="充值"
        open={isRechargeModalOpen}
        onCancel={() => {
          setIsRechargeModalOpen(false);
          rechargeForm.resetFields();
        }}
        footer={null}
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          为 <strong>{editingKey?.name}</strong> 充值
          <br />
          当前余额: <span style={{ color: '#52c41a', fontWeight: 600 }}>${editingKey?.balance?.toFixed(2)}</span>
        </div>
        <Form form={rechargeForm} layout="vertical" onFinish={handleRecharge}>
          <Form.Item name="amount" label="充值金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} placeholder="请输入金额" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsRechargeModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认充值</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
