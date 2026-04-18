import { Layout } from '../components/Layout';
import { Card, Typography, Divider, List, Tag } from 'antd';
import { InfoCircleOutlined, ApiOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export function SettingsPage() {
  return (
    <Layout>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>系统设置</h2>
        <span style={{ color: '#999' }}>配置系统参数和查看信息</span>
      </div>

      <Card
        title={
          <span>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            系统信息
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <Text>系统名称</Text>
          <Text strong>Channer AI Gateway</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <Text>版本</Text>
          <Text strong>v1.0.0</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <Text>技术栈</Text>
          <Text strong>Go + React + PostgreSQL + Redis</Text>
        </div>
      </Card>

      <Card
        title={
          <span>
            <ApiOutlined style={{ marginRight: 8 }} />
            API端点
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <List
          itemLayout="horizontal"
          dataSource={[
            { title: 'OpenAI兼容API', endpoint: 'POST /v1/chat/completions' },
            { title: 'OpenAI Responses API', endpoint: 'POST /v1/responses' },
            { title: 'Anthropic Messages API', endpoint: 'POST /v1/messages' },
            { title: 'Gemini API', endpoint: 'POST /v1beta/models/{model}:generateContent' },
          ]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={<code style={{ color: '#1677ff' }}>{item.endpoint}</code>}
              />
            </List.Item>
          )}
        />
      </Card>

      <Card
        title={
          <span>
            <QuestionCircleOutlined style={{ marginRight: 8 }} />
            使用说明
          </span>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Title level={5} style={{ marginBottom: 8 }}>1. 配置渠道</Title>
            <Text type="secondary">
              在"渠道管理"页面添加AI提供商的API配置，支持OpenAI、Anthropic和Gemini。
            </Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Title level={5} style={{ marginBottom: 8 }}>2. 添加模型</Title>
            <Text type="secondary">
              在"模型管理"页面配置支持的AI模型及其定价。
            </Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Title level={5} style={{ marginBottom: 8 }}>3. 创建API Key</Title>
            <Text type="secondary">
              在"API Keys"页面创建访问密钥并充值余额。
            </Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Title level={5} style={{ marginBottom: 8 }}>4. 使用API</Title>
            <Text type="secondary">
              使用创建的API Key调用相应的API端点，系统会自动进行负载均衡和计费。
            </Text>
          </div>
        </div>
      </Card>
    </Layout>
  );
}
