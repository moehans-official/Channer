package main

import (
	"channer/internal/config"
	"channer/internal/handler"
	"channer/internal/middleware"
	"channer/internal/model"
	"channer/internal/repository"
	"channer/internal/service"
	"embed"
	"io"
	"io/fs"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

//go:embed dist
var staticFiles embed.FS

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	db, err := model.InitDB(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 初始化Redis（可选）
	var redisClient *redis.Client
	if cfg.Redis.Enabled {
		redisClient, err = model.InitRedis(cfg.Redis)
		if err != nil {
			log.Printf("Warning: Failed to initialize Redis: %v", err)
		}
	}

	// 初始化仓库
	userRepo := repository.NewUserRepository(db)
	channelRepo := repository.NewChannelRepository(db)
	modelRepo := repository.NewModelRepository(db)
	keyRepo := repository.NewAPIKeyRepository(db)
	logRepo := repository.NewUsageLogRepository(db)

	// 初始化服务
	authService := service.NewAuthService(userRepo, redisClient, cfg.JWT)
	channelService := service.NewChannelService(channelRepo)
	modelService := service.NewModelService(modelRepo)
	keyService := service.NewAPIKeyService(keyRepo)
	rateLimitService := service.NewRateLimitService(redisClient)
	billingService := service.NewBillingService(keyRepo, redisClient)
	proxyService := service.NewProxyService(channelRepo, modelRepo, billingService, logRepo)
	statsService := service.NewStatsService(logRepo)

	// 初始化处理器
	authHandler := handler.NewAuthHandler(authService)
	channelHandler := handler.NewChannelHandler(channelService)
	modelHandler := handler.NewModelHandler(modelService)
	keyHandler := handler.NewAPIKeyHandler(keyService)
	proxyHandler := handler.NewProxyHandler(proxyService, keyService, rateLimitService, billingService)
	statsHandler := handler.NewStatsHandler(statsService)

	// 创建默认管理员账户
	if err := authService.CreateDefaultAdmin(); err != nil {
		log.Printf("Failed to create default admin: %v", err)
	}

	// 设置Gin模式
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 静态文件服务 (前端)
	efs, _ := fs.Sub(staticFiles, "dist")
	r.Use(func(c *gin.Context) {
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api") || strings.HasPrefix(path, "/v1") {
			c.Next()
			return
		}
		file, err := efs.Open(path)
		if err != nil {
			indexData, _ := staticFiles.ReadFile("dist/index.html")
			c.Data(200, "text/html; charset=utf-8", indexData)
			c.Abort()
			return
		}
		defer file.Close()
		fi, err := file.Stat()
		if err != nil || fi.IsDir() {
			indexData, _ := staticFiles.ReadFile("dist/index.html")
			c.Data(200, "text/html; charset=utf-8", indexData)
			c.Abort()
			return
		}
		content, err := io.ReadAll(file)
		if err != nil {
			c.Next()
			return
		}
		c.Data(200, "application/octet-stream", content)
		c.Abort()
	})

	// API路由组
	api := r.Group("/api/v1")
	{
		// 认证相关（公开）
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		// 管理后台（需要认证）
		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(authService))
		{
			// 渠道管理
			admin.GET("/channels", channelHandler.List)
			admin.POST("/channels", channelHandler.Create)
			admin.GET("/channels/:id", channelHandler.Get)
			admin.PUT("/channels/:id", channelHandler.Update)
			admin.DELETE("/channels/:id", channelHandler.Delete)

			// 模型管理
			admin.GET("/models", modelHandler.List)
			admin.POST("/models", modelHandler.Create)
			admin.GET("/models/:id", modelHandler.Get)
			admin.PUT("/models/:id", modelHandler.Update)
			admin.DELETE("/models/:id", modelHandler.Delete)

			// API Key管理
			admin.GET("/keys", keyHandler.List)
			admin.POST("/keys", keyHandler.Create)
			admin.GET("/keys/:id", keyHandler.Get)
			admin.PUT("/keys/:id", keyHandler.Update)
			admin.DELETE("/keys/:id", keyHandler.Delete)
			admin.POST("/keys/:id/recharge", keyHandler.Recharge)

			// 统计
			admin.GET("/stats/dashboard", statsHandler.Dashboard)
			admin.GET("/stats/usage", statsHandler.Usage)
			admin.GET("/stats/logs", statsHandler.Logs)
		}

		// 租户API（需要API Key）
		tenant := api.Group("/")
		tenant.Use(middleware.APIKeyAuth(keyService))
		tenant.Use(middleware.RateLimit(rateLimitService))
		{
			// API Key信息查询
			tenant.GET("/info", keyHandler.Info)

			// OpenAI兼容API
			tenant.POST("/v1/chat/completions", proxyHandler.ChatCompletions)
			tenant.POST("/v1/responses", proxyHandler.Responses)

			// Anthropic API
			tenant.POST("/v1/messages", proxyHandler.AnthropicMessages)

			// Gemini API
			tenant.POST("/v1beta/models/:model/generateContent", proxyHandler.GeminiGenerate)
			tenant.POST("/v1beta/models/:model/streamGenerateContent", proxyHandler.GeminiStream)
		}
	}

	// 启动服务器
	log.Printf("Server starting on %s", cfg.Server.Address)
	if err := r.Run(cfg.Server.Address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
