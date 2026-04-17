package middleware

import (
	"channer/internal/model"
	"channer/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RateLimit 速率限制中间件
func RateLimit(rateLimitService service.RateLimitService) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.MustGet("api_key").(*model.APIKey)

		if err := rateLimitService.CheckRateLimit(apiKey); err != nil {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": gin.H{
				"code":    "rate_limit_exceeded",
				"message": "请求频率超限，请稍后重试",
				"type":    "rate_limit_error",
			}})
			c.Abort()
			return
		}

		c.Next()
	}
}
