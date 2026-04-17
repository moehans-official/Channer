package middleware

import (
	"channer/internal/service"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// APIKeyAuth API Key认证中间件
func APIKeyAuth(keyService service.APIKeyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{
				"code":    "invalid_api_key",
				"message": "Missing API Key",
				"type":    "authentication_error",
			}})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{
				"code":    "invalid_api_key",
				"message": "Invalid API Key format",
				"type":    "authentication_error",
			}})
			c.Abort()
			return
		}

		key, err := keyService.GetByKey(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{
				"code":    "invalid_api_key",
				"message": "Invalid API Key",
				"type":    "authentication_error",
			}})
			c.Abort()
			return
		}

		if !key.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{
				"code":    "api_key_disabled",
				"message": "API Key已被禁用",
				"type":    "authentication_error",
			}})
			c.Abort()
			return
		}

		c.Set("api_key", key)
		c.Next()
	}
}
