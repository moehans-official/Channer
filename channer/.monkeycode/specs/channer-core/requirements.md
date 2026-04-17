# Channer AI Gateway 需求文档

## 引言

Channer是一个轻量级个人AI Gateway项目，旨在为个人和小团队提供统一的AI API接入和管理能力。

## 术语表

- **管理员**: 系统的超级管理员，拥有所有管理权限
- **租户**: 使用API Key访问系统的用户，无独立账户系统
- **API Key**: 租户访问AI服务的凭证
- **渠道**: 指向特定AI提供商的配置，包含API地址和认证信息
- **模型**: AI提供商支持的模型，如gpt-4o、claude-3-opus等
- **配额**: API Key的使用限制，包括RPM、TPM、RPD、TPD
- **余额**: API Key的预付费额度
- **Token**: AI模型处理文本的基本单位

## 需求

### 需求1: 管理员认证

**用户故事:** AS 管理员，I want 通过安全的认证机制登录系统，so that 管理租户和配置

#### 验收标准

1. WHEN 管理员访问管理后台，系统 SHALL 显示登录页面
2. WHEN 管理员输入正确的用户名和密码，系统 SHALL 生成JWT令牌并重定向到管理首页
3. IF 管理员输入错误的凭据，系统 SHALL 返回401错误并提示认证失败
4. WHILE 管理员持有有效的JWT令牌，系统 SHALL 允许访问受保护的管理接口
5. IF JWT令牌过期，系统 SHALL 重定向到登录页面

### 需求2: 渠道管理

**用户故事:** AS 管理员，I want 配置多个AI提供商渠道，so that 系统可以转发请求到不同的AI服务

#### 验收标准

1. WHEN 管理员创建新渠道，系统 SHALL 验证渠道名称、类型、API地址和密钥的唯一性和有效性
2. WHEN 管理员启用渠道，系统 SHALL 将该渠道加入可用渠道池
3. WHEN 管理员禁用渠道，系统 SHALL 将该渠道从可用渠道池移除
4. WHEN 管理员设置渠道优先级，系统 SHALL 在负载均衡时优先使用高优先级渠道
5. WHEN 管理员删除渠道，系统 SHALL 检查该渠道是否有关联的API Key，IF 有关联则阻止删除

### 需求3: 模型管理

**用户故事:** AS 管理员，I want 配置支持的AI模型及其定价，so that 系统可以正确计费

#### 验收标准

1. WHEN 管理员添加模型，系统 SHALL 验证模型ID在对应渠道中唯一
2. WHEN 管理员设置模型定价，系统 SHALL 记录输入Token和输出Token的单价（每1K Token）
3. WHEN 管理员启用模型，系统 SHALL 允许API Key使用该模型
4. WHEN 管理员禁用模型，系统 SHALL 拒绝该模型的API请求并返回400错误
5. WHEN 管理员更新模型定价，系统 SHALL 从更新时间起使用新定价计费

### 需求4: API Key管理

**用户故事:** AS 管理员，I want 创建和管理API Key，so that 租户可以使用AI服务

#### 验收标准

1. WHEN 管理员创建API Key，系统 SHALL 生成唯一的Key字符串和名称
2. WHEN 管理员设置API Key配额，系统 SHALL 配置RPM、TPM、RPD、TPD限制
3. WHEN 管理员给API Key充值，系统 SHALL 增加Key的余额
4. WHEN 管理员禁用API Key，系统 SHALL 拒绝该Key的所有请求并返回403错误
5. WHEN 管理员删除API Key，系统 SHALL 软删除并保留历史记录
6. WHEN 管理员查看API Key详情，系统 SHALL 显示余额、配额使用情况和可用模型

### 需求5: API Key信息查询

**用户故事:** AS 租户，I want 查询API Key的信息，so that 了解余额、可用模型和配额限制

#### 验收标准

1. WHEN 租户使用有效的API Key调用/info接口，系统 SHALL 返回该Key的余额
2. WHEN 租户查询API Key信息，系统 SHALL 返回该Key可访问的模型列表
3. WHEN 租户查询API Key信息，系统 SHALL 返回该Key的配额限制（RPM、TPM、RPD、TPD）
4. WHEN 租户使用无效的API Key，系统 SHALL 返回401错误
5. WHEN 租户使用已禁用的API Key，系统 SHALL 返回403错误

### 需求6: AI API代理转发

**用户故事:** AS 租户，I want 通过统一的API端点访问各AI提供商的服务，so that 无需直接对接多个提供商

#### 验收标准

1. WHEN 租户发送Chat Completions请求到/v1/chat/completions，系统 SHALL 根据模型路由到对应渠道
2. WHEN 租户发送Responses请求到/v1/responses，系统 SHALL 转发到OpenAI渠道
3. WHEN 租户发送Gemini格式请求，系统 SHALL 转换格式并转发到Gemini渠道
4. WHEN 租户发送Claude格式请求，系统 SHALL 转换格式并转发到Anthropic渠道
5. WHEN 渠道返回错误，系统 SHALL 将错误信息原样返回给租户
6. WHEN 渠道超时，系统 SHALL 返回504错误并记录失败日志

### 需求7: 负载均衡

**用户故事:** AS 系统，I want 根据优先级分配请求到不同渠道，so that 实现高可用和成本控制

#### 验收标准

1. WHEN 有多个渠道支持同一模型，系统 SHALL 优先选择优先级数值小的渠道
2. WHEN 高优先级渠道不可用，系统 SHALL 自动降级到次高优先级渠道
3. WHEN 所有渠道都不可用，系统 SHALL 返回503错误
4. WHEN 渠道连续失败3次，系统 SHALL 标记该渠道为不可用并触发告警
5. WHEN 渠道恢复可用，系统 SHALL 自动将其重新加入负载均衡池

### 需求8: 预付费计费

**用户故事:** AS 系统，I want 在请求时预扣额度并在完成后修正，so that 实现准确的预付费计费

#### 验收标准

1. WHEN 租户发起API请求，系统 SHALL 预扣0.1额度
2. IF API Key余额不足0.1，系统 SHALL 返回402错误
3. WHEN 请求完成，系统 SHALL 根据实际使用的输入Token和输出Token计算费用
4. WHEN 计算实际费用，系统 SHALL 使用模型定价乘以Token数量（除以1000）
5. WHEN 实际费用与预扣费用不同，系统 SHALL 修正余额（多退少补）
6. WHEN 请求失败，系统 SHALL 退回预扣的0.1额度
7. WHEN 流式请求，系统 SHALL 在流结束时根据实际Token修正计费

### 需求9: 配额限制

**用户故事:** AS 系统，I want 限制API Key的请求频率和Token用量，so that 防止滥用

#### 验收标准

1. WHEN 租户的RPM（每分钟请求数）超过限制，系统 SHALL 返回429错误
2. WHEN 租户的TPM（每分钟Token数）超过限制，系统 SHALL 返回429错误
3. WHEN 租户的RPD（每天请求数）超过限制，系统 SHALL 返回429错误
4. WHEN 租户的TPD（每天Token数）超过限制，系统 SHALL 返回429错误
5. WHEN 配额重置周期到达，系统 SHALL 自动重置计数器
6. WHEN 租户查询配额使用情况，系统 SHALL 返回当前周期内的已用量和剩余量

### 需求10: 用量统计

**用户故事:** AS 管理员，I want 查看系统用量统计，so that 了解整体使用情况

#### 验收标准

1. WHEN 管理员查看用量仪表板，系统 SHALL 显示总请求数、总Token数和总收入
2. WHEN 管理员按API Key筛选，系统 SHALL 显示该Key的用量详情
3. WHEN 管理员按时间范围筛选，系统 SHALL 显示该时间段内的用量趋势
4. WHEN 管理员查看渠道统计，系统 SHALL 显示各渠道的成功率和延迟分布
5. WHEN 管理员导出用量报告，系统 SHALL 生成CSV格式的详细数据

### 需求11: 日志记录

**用户故事:** AS 管理员，I want 查看详细的请求日志，so that 排查问题和审计

#### 验收标准

1. WHEN 系统处理API请求，系统 SHALL 记录请求时间、API Key、模型、输入Token数、输出Token数、费用
2. WHEN 请求失败，系统 SHALL 记录错误原因和堆栈信息
3. WHEN 管理员查看日志，系统 SHALL 支持按时间、API Key、模型、状态码筛选
4. WHEN 管理员查看日志详情，系统 SHALL 显示完整的请求和响应内容（脱敏后）
5. WHEN 日志数据超过保留期限，系统 SHALL 自动归档或删除

### 需求12: 系统配置

**用户故事:** AS 管理员，I want 配置系统参数，so that 调整系统行为

#### 验收标准

1. WHEN 管理员设置日志保留天数，系统 SHALL 按配置自动清理过期日志
2. WHEN 管理员设置请求超时时间，系统 SHALL 在超时后终止请求
3. WHEN 管理员设置最大重试次数，系统 SHALL 在渠道失败时重试指定次数
4. WHEN 管理员设置告警阈值，系统 SHALL 在达到阈值时发送通知
5. WHEN 管理员导出配置，系统 SHALL 生成JSON格式的配置文件
6. WHEN 管理员导入配置，系统 SHALL 验证并应用配置
