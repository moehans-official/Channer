package handler

import (
	"channer/internal/repository"
	"channer/internal/service"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// StatsHandler 统计处理器
type StatsHandler struct {
	statsService service.StatsService
}

// NewStatsHandler 创建统计处理器
func NewStatsHandler(statsService service.StatsService) *StatsHandler {
	return &StatsHandler{statsService: statsService}
}

// Dashboard 仪表板统计
func (h *StatsHandler) Dashboard(c *gin.Context) {
	stats, err := h.statsService.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Usage 用量统计
func (h *StatsHandler) Usage(c *gin.Context) {
	var start, end time.Time

	if startStr := c.Query("start"); startStr != "" {
		start, _ = time.Parse(time.RFC3339, startStr)
	} else {
		start = time.Now().Add(-7 * 24 * time.Hour) // 默认7天
	}

	if endStr := c.Query("end"); endStr != "" {
		end, _ = time.Parse(time.RFC3339, endStr)
	} else {
		end = time.Now()
	}

	var stats interface{}
	var err error

	if keyIDStr := c.Query("key_id"); keyIDStr != "" {
		keyID, _ := strconv.ParseUint(keyIDStr, 10, 32)
		keyIDUint := uint(keyID)
		stats, err = h.statsService.GetKeyStats(keyIDUint, start, end)
	} else if channelIDStr := c.Query("channel_id"); channelIDStr != "" {
		channelID, _ := strconv.ParseUint(channelIDStr, 10, 32)
		channelIDUint := uint(channelID)
		stats, err = h.statsService.GetChannelStats(channelIDUint, start, end)
	} else {
		stats, err = h.statsService.GetKeyStats(0, start, end)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Logs 日志查询
func (h *StatsHandler) Logs(c *gin.Context) {
	filter := repository.LogFilter{
		Limit:  100,
		Offset: 0,
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		filter.Limit, _ = strconv.Atoi(limitStr)
	}
	if offsetStr := c.Query("offset"); offsetStr != "" {
		filter.Offset, _ = strconv.Atoi(offsetStr)
	}

	if keyIDStr := c.Query("key_id"); keyIDStr != "" {
		keyID, _ := strconv.ParseUint(keyIDStr, 10, 32)
		keyIDUint := uint(keyID)
		filter.APIKeyID = &keyIDUint
	}
	if modelIDStr := c.Query("model_id"); modelIDStr != "" {
		modelID, _ := strconv.ParseUint(modelIDStr, 10, 32)
		modelIDUint := uint(modelID)
		filter.ModelID = &modelIDUint
	}
	if channelIDStr := c.Query("channel_id"); channelIDStr != "" {
		channelID, _ := strconv.ParseUint(channelIDStr, 10, 32)
		channelIDUint := uint(channelID)
		filter.ChannelID = &channelIDUint
	}

	if startStr := c.Query("start"); startStr != "" {
		start, _ := time.Parse(time.RFC3339, startStr)
		filter.StartTime = &start
	}
	if endStr := c.Query("end"); endStr != "" {
		end, _ := time.Parse(time.RFC3339, endStr)
		filter.EndTime = &end
	}

	logs, err := h.statsService.GetLogs(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}
