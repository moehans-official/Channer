package handler

import (
	"bytes"
	"channer/internal/model"
	"channer/internal/service"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ProxyHandler 代理处理器
type ProxyHandler struct {
	proxyService     service.ProxyService
	keyService       service.APIKeyService
	rateLimitService service.RateLimitService
	billingService   service.BillingService
}

// NewProxyHandler 创建代理处理器
func NewProxyHandler(
	proxyService service.ProxyService,
	keyService service.APIKeyService,
	rateLimitService service.RateLimitService,
	billingService service.BillingService,
) *ProxyHandler {
	return &ProxyHandler{
		proxyService:     proxyService,
		keyService:       keyService,
		rateLimitService: rateLimitService,
		billingService:   billingService,
	}
}

// ChatCompletions 处理Chat Completions请求
func (h *ProxyHandler) ChatCompletions(c *gin.Context) {
	apiKey := c.MustGet("api_key").(*model.APIKey)

	// 预扣费
	if err := h.billingService.PreDeduct(apiKey); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": gin.H{
			"code":    "insufficient_quota",
			"message": "API Key余额不足，请充值",
			"type":    "billing_error",
		}})
		return
	}

	// 解析请求
	var req service.ChatCompletionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 流式请求
	if req.Stream {
		h.proxyService.StreamChatCompletions(&req, apiKey, c.Writer)
		return
	}

	// 非流式请求
	resp, err := h.proxyService.ProxyChatCompletions(&req, apiKey)
	if err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	// 修正计费
	if len(resp.Choices) > 0 {
		model, _ := h.getModel(req.Model)
		h.billingService.FinalizeBilling(apiKey, int64(resp.Usage.PromptTokens), int64(resp.Usage.CompletionTokens), model)
		h.rateLimitService.IncrementCounter(apiKey, int64(resp.Usage.TotalTokens))
	}

	c.JSON(http.StatusOK, resp)
}

// Responses 处理Responses请求
func (h *ProxyHandler) Responses(c *gin.Context) {
	apiKey := c.MustGet("api_key").(*model.APIKey)

	// 预扣费
	if err := h.billingService.PreDeduct(apiKey); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": gin.H{
			"code":    "insufficient_quota",
			"message": "API Key余额不足，请充值",
			"type":    "billing_error",
		}})
		return
	}

	// 解析请求
	var req service.ResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 转发请求
	resp, err := h.proxyService.ProxyResponses(&req, apiKey)
	if err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	// 修正计费
	model, _ := h.getModel(req.Model)
	h.billingService.FinalizeBilling(apiKey, int64(resp.Usage.InputTokens), int64(resp.Usage.OutputTokens), model)
	h.rateLimitService.IncrementCounter(apiKey, int64(resp.Usage.TotalTokens))

	c.JSON(http.StatusOK, resp)
}

// AnthropicMessages 处理Anthropic Messages请求
func (h *ProxyHandler) AnthropicMessages(c *gin.Context) {
	apiKey := c.MustGet("api_key").(*model.APIKey)

	// 预扣费
	if err := h.billingService.PreDeduct(apiKey); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": gin.H{
			"code":    "insufficient_quota",
			"message": "API Key余额不足，请充值",
			"type":    "billing_error",
		}})
		return
	}

	// 解析请求
	var req service.AnthropicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 流式请求处理
	if req.Stream {
		h.proxyStreamAnthropic(c, &req, apiKey)
		return
	}

	// 转发请求
	resp, err := h.proxyService.ProxyAnthropicMessages(&req, apiKey)
	if err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	// 修正计费
	model, _ := h.getModel(req.Model)
	h.billingService.FinalizeBilling(apiKey, int64(resp.Usage.InputTokens), int64(resp.Usage.OutputTokens), model)
	h.rateLimitService.IncrementCounter(apiKey, int64(resp.Usage.InputTokens+resp.Usage.OutputTokens))

	c.JSON(http.StatusOK, resp)
}

// proxyStreamAnthropic 流式Anthropic请求处理
func (h *ProxyHandler) proxyStreamAnthropic(c *gin.Context, req *service.AnthropicRequest, apiKey *model.APIKey) {
	// 简化处理：读取完整响应后返回
	// 实际生产环境应该实现真正的流式转发
	c.JSON(http.StatusNotImplemented, gin.H{"error": "streaming not fully implemented"})
}

// GeminiGenerate 处理Gemini Generate请求
func (h *ProxyHandler) GeminiGenerate(c *gin.Context) {
	apiKey := c.MustGet("api_key").(*model.APIKey)

	// 预扣费
	if err := h.billingService.PreDeduct(apiKey); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": gin.H{
			"code":    "insufficient_quota",
			"message": "API Key余额不足，请充值",
			"type":    "billing_error",
		}})
		return
	}

	// 解析请求
	var req service.GeminiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 转发请求
	resp, err := h.proxyService.ProxyGeminiGenerate(&req, apiKey)
	if err != nil {
		h.billingService.Refund(apiKey)
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	// 修正计费
	h.billingService.FinalizeBilling(apiKey, int64(resp.UsageMetadata.PromptTokenCount), int64(resp.UsageMetadata.CandidatesTokenCount), nil)
	h.rateLimitService.IncrementCounter(apiKey, int64(resp.UsageMetadata.TotalTokenCount))

	c.JSON(http.StatusOK, resp)
}

// GeminiStream 处理Gemini Stream请求
func (h *ProxyHandler) GeminiStream(c *gin.Context) {
	// 简化处理
	c.JSON(http.StatusNotImplemented, gin.H{"error": "streaming not fully implemented"})
}

// getModel 获取模型信息
func (h *ProxyHandler) getModel(modelID string) (*model.Model, error) {
	// 这里需要通过service获取model
	// 简化处理，返回nil
	return nil, nil
}

// copyRequestBody 复制请求体
func copyRequestBody(c *gin.Context) ([]byte, error) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return nil, err
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(body))
	return body, nil
}
