import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useStatsStore } from '../stores/statsStore';
import { Table, Tag, Button, Card, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

export function LogsPage() {
  const { logs, fetchLogs, loading } = useStatsStore();
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchLogs({ limit, offset: (page - 1) * limit });
  }, [page]);

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Tag color="success">{statusCode}</Tag>;
    } else if (statusCode >= 400) {
      return <Tag color="error">{statusCode}</Tag>;
    }
    return <Tag>{statusCode}</Tag>;
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
    {
      title: 'Key ID',
      dataIndex: 'api_key_id',
      key: 'api_key_id',
      width: 80,
    },
    {
      title: '请求类型',
      dataIndex: 'request_type',
      key: 'request_type',
      width: 120,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Token数',
      key: 'tokens',
      width: 150,
      render: (_: any, record: any) => (
        <div style={{ fontSize: 12 }}>
          <div>输入: {record.input_tokens.toLocaleString()}</div>
          <div>输出: {record.output_tokens.toLocaleString()}</div>
        </div>
      ),
    },
    {
      title: '费用',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost: number) => <span style={{ color: '#faad14' }}>${cost.toFixed(4)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status_code',
      key: 'status_code',
      width: 80,
      render: getStatusBadge,
    },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>日志查询</h2>
        <span style={{ color: '#999' }}>查看API请求日志和使用记录</span>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={<FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                description="暂无日志记录"
              />
            ),
          }}
        />
      </Card>

      {logs.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ marginRight: 8 }}
          >
            上一页
          </Button>
          <span style={{ margin: '0 16px' }}>第 {page} 页</span>
          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < limit}
          >
            下一页
          </Button>
        </div>
      )}
    </Layout>
  );
}
