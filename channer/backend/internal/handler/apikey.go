package handler

import (
	"channer/internal/model"
	"channer/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// APIKeyHandler API Key处理器
type APIKeyHandler struct {
	keyService service.APIKeyService
}

// NewAPIKeyHandler 创建API Key处理器
func NewAPIKeyHandler(keyService service.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{keyService: keyService}
}

// CreateKeyRequest 创建API Key请求
type CreateKeyRequest struct {
	Name     string  `json:"name" binding:"required"`
	Balance  float64 `json:"balance"`
	RPMLimit int     `json:"rpm_limit"`
	TPMLimit int     `json:"tpm_limit"`
	RPDLimit int     `json:"rpd_limit"`
	TPDLimit int     `json:"tpd_limit"`
	IsActive bool    `json:"is_active"`
}

// Create 创建API Key
func (h *APIKeyHandler) Create(c *gin.Context) {
	var req CreateKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	key := &model.APIKey{
		Name:     req.Name,
		Balance:  req.Balance,
		RPMLimit: req.RPMLimit,
		TPMLimit: req.TPMLimit,
		RPDLimit: req.RPDLimit,
		TPDLimit: req.TPDLimit,
		IsActive: req.IsActive,
	}

	if key.RPMLimit == 0 {
		key.RPMLimit = 60
	}
	if key.TPMLimit == 0 {
		key.TPMLimit = 100000
	}
	if key.RPDLimit == 0 {
		key.RPDLimit = 10000
	}
	if key.TPDLimit == 0 {
		key.TPDLimit = 1000000
	}

	if err := h.keyService.Create(key); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, key)
}

// Get 获取API Key
func (h *APIKeyHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	key, err := h.keyService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "api key not found"})
		return
	}

	c.JSON(http.StatusOK, key)
}

// List 列出API Key
func (h *APIKeyHandler) List(c *gin.Context) {
	keys, err := h.keyService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": keys})
}

// UpdateKeyRequest 更新API Key请求
type UpdateKeyRequest struct {
	Name     string `json:"name"`
	RPMLimit int    `json:"rpm_limit"`
	TPMLimit int    `json:"tpm_limit"`
	RPDLimit int    `json:"rpd_limit"`
	TPDLimit int    `json:"tpd_limit"`
	IsActive bool   `json:"is_active"`
}

// Update 更新API Key
func (h *APIKeyHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req UpdateKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	key, err := h.keyService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "api key not found"})
		return
	}

	if req.Name != "" {
		key.Name = req.Name
	}
	if req.RPMLimit > 0 {
		key.RPMLimit = req.RPMLimit
	}
	if req.TPMLimit > 0 {
		key.TPMLimit = req.TPMLimit
	}
	if req.RPDLimit > 0 {
		key.RPDLimit = req.RPDLimit
	}
	if req.TPDLimit > 0 {
		key.TPDLimit = req.TPDLimit
	}
	key.IsActive = req.IsActive

	if err := h.keyService.Update(key); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, key)
}

// Delete 删除API Key
func (h *APIKeyHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.keyService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// RechargeRequest 充值请求
type RechargeRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// Recharge 充值
func (h *APIKeyHandler) Recharge(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req RechargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.keyService.Recharge(uint(id), req.Amount); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "recharge successful"})
}

// Info 获取API Key信息（租户接口）
func (h *APIKeyHandler) Info(c *gin.Context) {
	// 从上下文中获取API Key
	apiKey, exists := c.Get("api_key")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "api key not found in context"})
		return
	}

	key := apiKey.(*model.APIKey)
	info, err := h.keyService.GetInfo(key.Key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}
