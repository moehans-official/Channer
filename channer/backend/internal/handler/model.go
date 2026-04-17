package handler

import (
	"channer/internal/model"
	"channer/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ModelHandler 模型处理器
type ModelHandler struct {
	modelService service.ModelService
}

// NewModelHandler 创建模型处理器
func NewModelHandler(modelService service.ModelService) *ModelHandler {
	return &ModelHandler{modelService: modelService}
}

// CreateModelRequest 创建模型请求
type CreateModelRequest struct {
	ChannelID   uint    `json:"channel_id" binding:"required"`
	ModelID     string  `json:"model_id" binding:"required"`
	Name        string  `json:"name"`
	InputPrice  float64 `json:"input_price"`
	OutputPrice float64 `json:"output_price"`
	IsActive    bool    `json:"is_active"`
}

// Create 创建模型
func (h *ModelHandler) Create(c *gin.Context) {
	var req CreateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m := &model.Model{
		ChannelID:   req.ChannelID,
		ModelID:     req.ModelID,
		Name:        req.Name,
		InputPrice:  req.InputPrice,
		OutputPrice: req.OutputPrice,
		IsActive:    req.IsActive,
	}

	if err := h.modelService.Create(m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, m)
}

// Get 获取模型
func (h *ModelHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	m, err := h.modelService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "model not found"})
		return
	}

	c.JSON(http.StatusOK, m)
}

// List 列出模型
func (h *ModelHandler) List(c *gin.Context) {
	models, err := h.modelService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": models})
}

// UpdateModelRequest 更新模型请求
type UpdateModelRequest struct {
	Name        string  `json:"name"`
	InputPrice  float64 `json:"input_price"`
	OutputPrice float64 `json:"output_price"`
	IsActive    bool    `json:"is_active"`
}

// Update 更新模型
func (h *ModelHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req UpdateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m, err := h.modelService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "model not found"})
		return
	}

	if req.Name != "" {
		m.Name = req.Name
	}
	m.InputPrice = req.InputPrice
	m.OutputPrice = req.OutputPrice
	m.IsActive = req.IsActive

	if err := h.modelService.Update(m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, m)
}

// Delete 删除模型
func (h *ModelHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.modelService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
