package handler

import (
	"channer/internal/model"
	"channer/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ChannelHandler 渠道处理器
type ChannelHandler struct {
	channelService service.ChannelService
}

// NewChannelHandler 创建渠道处理器
func NewChannelHandler(channelService service.ChannelService) *ChannelHandler {
	return &ChannelHandler{channelService: channelService}
}

// CreateChannelRequest 创建渠道请求
type CreateChannelRequest struct {
	Name     string `json:"name" binding:"required"`
	Type     string `json:"type" binding:"required,oneof=openai anthropic gemini"`
	BaseURL  string `json:"base_url" binding:"required,url"`
	APIKey   string `json:"api_key" binding:"required"`
	Priority int    `json:"priority"`
	IsActive bool   `json:"is_active"`
}

// Create 创建渠道
func (h *ChannelHandler) Create(c *gin.Context) {
	var req CreateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	channel := &model.Channel{
		Name:     req.Name,
		Type:     req.Type,
		BaseURL:  req.BaseURL,
		APIKey:   req.APIKey,
		Priority: req.Priority,
		IsActive: req.IsActive,
	}

	if err := h.channelService.Create(channel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, channel)
}

// Get 获取渠道
func (h *ChannelHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	channel, err := h.channelService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "channel not found"})
		return
	}

	c.JSON(http.StatusOK, channel)
}

// List 列出渠道
func (h *ChannelHandler) List(c *gin.Context) {
	channels, err := h.channelService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": channels})
}

// UpdateChannelRequest 更新渠道请求
type UpdateChannelRequest struct {
	Name     string `json:"name"`
	Type     string `json:"type" binding:"omitempty,oneof=openai anthropic gemini"`
	BaseURL  string `json:"base_url" binding:"omitempty,url"`
	APIKey   string `json:"api_key"`
	Priority int    `json:"priority"`
	IsActive bool   `json:"is_active"`
}

// Update 更新渠道
func (h *ChannelHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req UpdateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	channel, err := h.channelService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "channel not found"})
		return
	}

	if req.Name != "" {
		channel.Name = req.Name
	}
	if req.Type != "" {
		channel.Type = req.Type
	}
	if req.BaseURL != "" {
		channel.BaseURL = req.BaseURL
	}
	if req.APIKey != "" {
		channel.APIKey = req.APIKey
	}
	channel.Priority = req.Priority
	channel.IsActive = req.IsActive

	if err := h.channelService.Update(channel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, channel)
}

// Delete 删除渠道
func (h *ChannelHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.channelService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
