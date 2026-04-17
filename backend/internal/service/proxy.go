package service

import (
	"bufio"
	"bytes"
	"channer/internal/model"
	"channer/internal/repository"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// ProxyService 代理服务接口
type ProxyService interface {
	ProxyChatCompletions(req *ChatCompletionRequest, key *model.APIKey) (*ChatCompletionResponse, error)
	StreamChatCompletions(req *ChatCompletionRequest, key *model.APIKey, w http.ResponseWriter)
	ProxyResponses(req *ResponseRequest, key *model.APIKey) (*ResponseResponse, error)
	ProxyAnthropicMessages(req *AnthropicRequest, key *model.APIKey) (*AnthropicResponse, error)
	ProxyGeminiGenerate(req *GeminiRequest, key *model.APIKey) (*GeminiResponse, error)
}

// proxyService 代理服务实现
type proxyService struct {
	channelRepo    repository.ChannelRepository
	modelRepo      repository.ModelRepository
	billingService BillingService
	logRepo        repository.UsageLogRepository
	httpClient     *http.Client
}

// NewProxyService 创建代理服务
func NewProxyService(
	channelRepo repository.ChannelRepository,
	modelRepo repository.ModelRepository,
	billingService BillingService,
	logRepo repository.UsageLogRepository,
) ProxyService {
	return &proxyService{
		channelRepo:    channelRepo,
		modelRepo:      modelRepo,
		billingService: billingService,
		logRepo:        logRepo,
		httpClient:     &http.Client{Timeout: 120 * time.Second},
	}
}

// ChatCompletionRequest OpenAI Chat Completion请求
type ChatCompletionRequest struct {
	Model    string                  `json:"model"`
	Messages []ChatCompletionMessage `json:"messages"`
	Stream   bool                    `json:"stream,omitempty"`
}

type ChatCompletionMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatCompletionResponse OpenAI Chat Completion响应
type ChatCompletionResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// ResponseRequest OpenAI Responses请求
type ResponseRequest struct {
	Model string `json:"model"`
	Input string `json:"input"`
}

// ResponseResponse OpenAI Responses响应
type ResponseResponse struct {
	ID        string `json:"id"`
	Object    string `json:"object"`
	CreatedAt int64  `json:"created_at"`
	Status    string `json:"status"`
	Error     *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
	Output []interface{} `json:"output"`
	Usage  struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
		TotalTokens  int `json:"total_tokens"`
	} `json:"usage"`
}

// AnthropicRequest Anthropic请求
type AnthropicRequest struct {
	Model     string             `json:"model"`
	Messages  []AnthropicMessage `json:"messages"`
	MaxTokens int                `json:"max_tokens"`
	Stream    bool               `json:"stream,omitempty"`
}

type AnthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// AnthropicResponse Anthropic响应
type AnthropicResponse struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Role    string `json:"role"`
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Model      string `json:"model"`
	StopReason string `json:"stop_reason"`
	Usage      struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
}

// GeminiRequest Gemini请求
type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

// GeminiResponse Gemini响应
type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	UsageMetadata struct {
		PromptTokenCount     int `json:"promptTokenCount"`
		CandidatesTokenCount int `json:"candidatesTokenCount"`
		TotalTokenCount      int `json:"totalTokenCount"`
	} `json:"usageMetadata"`
}

func (s *proxyService) ProxyChatCompletions(req *ChatCompletionRequest, key *model.APIKey) (*ChatCompletionResponse, error) {
	// 获取模型信息
	aiModel, err := s.modelRepo.GetByModelID(req.Model)
	if err != nil {
		return nil, fmt.Errorf("model not found: %s", req.Model)
	}

	// 获取可用渠道
	channels, err := s.channelRepo.GetAvailableByModel(req.Model)
	if err != nil || len(channels) == 0 {
		return nil, fmt.Errorf("no available channel for model: %s", req.Model)
	}

	// 选择优先级最高的渠道
	channel := channels[0]

	// 构建请求
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequest("POST", channel.BaseURL+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+channel.APIKey)

	// 发送请求
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		s.logRepo.Create(&model.UsageLog{
			APIKeyID:     key.ID,
			ModelID:      &aiModel.ID,
			ChannelID:    &channel.ID,
			RequestType:  "chat.completions",
			StatusCode:   0,
			ErrorMessage: err.Error(),
		})
		return nil, err
	}
	defer resp.Body.Close()

	// 解析响应
	var result ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// 记录日志
	s.logRepo.Create(&model.UsageLog{
		APIKeyID:     key.ID,
		ModelID:      &aiModel.ID,
		ChannelID:    &channel.ID,
		RequestType:  "chat.completions",
		InputTokens:  int64(result.Usage.PromptTokens),
		OutputTokens: int64(result.Usage.CompletionTokens),
		Cost:         s.billingService.CalculateCost(int64(result.Usage.PromptTokens), int64(result.Usage.CompletionTokens), aiModel),
		StatusCode:   resp.StatusCode,
	})

	return &result, nil
}

func (s *proxyService) StreamChatCompletions(req *ChatCompletionRequest, key *model.APIKey, w http.ResponseWriter) {
	// 获取模型信息
	aiModel, err := s.modelRepo.GetByModelID(req.Model)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "model not found: %s"}`, req.Model), http.StatusBadRequest)
		return
	}

	// 获取可用渠道
	channels, err := s.channelRepo.GetAvailableByModel(req.Model)
	if err != nil || len(channels) == 0 {
		http.Error(w, fmt.Sprintf(`{"error": "no available channel for model: %s"}`, req.Model), http.StatusServiceUnavailable)
		return
	}

	channel := channels[0]

	// 构建请求
	req.Stream = true
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequest("POST", channel.BaseURL+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		http.Error(w, `{"error": "failed to create request"}`, http.StatusInternalServerError)
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+channel.APIKey)
	httpReq.Header.Set("Accept", "text/event-stream")

	// 发送请求
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		s.logRepo.Create(&model.UsageLog{
			APIKeyID:     key.ID,
			ModelID:      &aiModel.ID,
			ChannelID:    &channel.ID,
			RequestType:  "chat.completions.stream",
			StatusCode:   0,
			ErrorMessage: err.Error(),
		})
		http.Error(w, `{"error": "failed to connect to upstream"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 设置响应头
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(resp.StatusCode)

	// 流式转发
	var inputTokens, outputTokens int64
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				fmt.Fprintf(w, "data: [DONE]\n\n")
				w.(http.Flusher).Flush()
				break
			}

			var chunk map[string]interface{}
			if err := json.Unmarshal([]byte(data), &chunk); err == nil {
				// 解析token使用情况
				if usage, ok := chunk["usage"].(map[string]interface{}); ok {
					if prompt, ok := usage["prompt_tokens"].(float64); ok {
						inputTokens = int64(prompt)
					}
					if completion, ok := usage["completion_tokens"].(float64); ok {
						outputTokens = int64(completion)
					}
				}
			}

			fmt.Fprintf(w, "%s\n", line)
			w.(http.Flusher).Flush()
		}
	}

	// 记录日志
	s.logRepo.Create(&model.UsageLog{
		APIKeyID:     key.ID,
		ModelID:      &aiModel.ID,
		ChannelID:    &channel.ID,
		RequestType:  "chat.completions.stream",
		InputTokens:  inputTokens,
		OutputTokens: outputTokens,
		Cost:         s.billingService.CalculateCost(inputTokens, outputTokens, aiModel),
		StatusCode:   resp.StatusCode,
	})
}

func (s *proxyService) ProxyResponses(req *ResponseRequest, key *model.APIKey) (*ResponseResponse, error) {
	// 获取模型信息
	aiModel, err := s.modelRepo.GetByModelID(req.Model)
	if err != nil {
		return nil, fmt.Errorf("model not found: %s", req.Model)
	}

	// 获取OpenAI渠道
	channels, err := s.channelRepo.GetAvailableByModel(req.Model)
	if err != nil || len(channels) == 0 {
		return nil, fmt.Errorf("no available channel for model: %s", req.Model)
	}

	channel := channels[0]

	// 构建请求
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequest("POST", channel.BaseURL+"/v1/responses", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+channel.APIKey)

	// 发送请求
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		s.logRepo.Create(&model.UsageLog{
			APIKeyID:     key.ID,
			ModelID:      &aiModel.ID,
			ChannelID:    &channel.ID,
			RequestType:  "responses",
			StatusCode:   0,
			ErrorMessage: err.Error(),
		})
		return nil, err
	}
	defer resp.Body.Close()

	// 解析响应
	var result ResponseResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// 记录日志
	s.logRepo.Create(&model.UsageLog{
		APIKeyID:     key.ID,
		ModelID:      &aiModel.ID,
		ChannelID:    &channel.ID,
		RequestType:  "responses",
		InputTokens:  int64(result.Usage.InputTokens),
		OutputTokens: int64(result.Usage.OutputTokens),
		Cost:         s.billingService.CalculateCost(int64(result.Usage.InputTokens), int64(result.Usage.OutputTokens), aiModel),
		StatusCode:   resp.StatusCode,
	})

	return &result, nil
}

func (s *proxyService) ProxyAnthropicMessages(req *AnthropicRequest, key *model.APIKey) (*AnthropicResponse, error) {
	// 获取模型信息
	aiModel, err := s.modelRepo.GetByModelID(req.Model)
	if err != nil {
		return nil, fmt.Errorf("model not found: %s", req.Model)
	}

	// 获取Anthropic渠道
	channels, err := s.channelRepo.GetAvailableByModel(req.Model)
	if err != nil || len(channels) == 0 {
		return nil, fmt.Errorf("no available channel for model: %s", req.Model)
	}

	channel := channels[0]

	// 构建请求
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequest("POST", channel.BaseURL+"/v1/messages", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", channel.APIKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	// 发送请求
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		s.logRepo.Create(&model.UsageLog{
			APIKeyID:     key.ID,
			ModelID:      &aiModel.ID,
			ChannelID:    &channel.ID,
			RequestType:  "anthropic.messages",
			StatusCode:   0,
			ErrorMessage: err.Error(),
		})
		return nil, err
	}
	defer resp.Body.Close()

	// 解析响应
	var result AnthropicResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// 记录日志
	s.logRepo.Create(&model.UsageLog{
		APIKeyID:     key.ID,
		ModelID:      &aiModel.ID,
		ChannelID:    &channel.ID,
		RequestType:  "anthropic.messages",
		InputTokens:  int64(result.Usage.InputTokens),
		OutputTokens: int64(result.Usage.OutputTokens),
		Cost:         s.billingService.CalculateCost(int64(result.Usage.InputTokens), int64(result.Usage.OutputTokens), aiModel),
		StatusCode:   resp.StatusCode,
	})

	return &result, nil
}

func (s *proxyService) ProxyGeminiGenerate(req *GeminiRequest, key *model.APIKey) (*GeminiResponse, error) {
	// 获取Gemini渠道
	channels, err := s.channelRepo.ListActive()
	if err != nil {
		return nil, err
	}

	var channel *model.Channel
	for i := range channels {
		if channels[i].Type == "gemini" {
			channel = &channels[i]
			break
		}
	}

	if channel == nil {
		return nil, fmt.Errorf("no available Gemini channel")
	}

	// 构建请求URL
	// Gemini API格式: /v1beta/models/{model}:generateContent
	modelID := "gemini-pro" // 默认模型
	url := fmt.Sprintf("%s/v1beta/models/%s:generateContent?key=%s", channel.BaseURL, modelID, channel.APIKey)

	// 构建请求
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// 发送请求
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		s.logRepo.Create(&model.UsageLog{
			APIKeyID:     key.ID,
			ChannelID:    &channel.ID,
			RequestType:  "gemini.generate",
			StatusCode:   0,
			ErrorMessage: err.Error(),
		})
		return nil, err
	}
	defer resp.Body.Close()

	// 解析响应
	var result GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// 记录日志
	s.logRepo.Create(&model.UsageLog{
		APIKeyID:     key.ID,
		ChannelID:    &channel.ID,
		RequestType:  "gemini.generate",
		InputTokens:  int64(result.UsageMetadata.PromptTokenCount),
		OutputTokens: int64(result.UsageMetadata.CandidatesTokenCount),
		StatusCode:   resp.StatusCode,
	})

	return &result, nil
}
