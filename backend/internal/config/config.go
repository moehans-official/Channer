package config

import (
	"os"
	"strconv"
	"time"
)

// Config 应用配置
type Config struct {
	Environment string
	Server      ServerConfig
	Database    DatabaseConfig
	Redis       RedisConfig
	JWT         JWTConfig
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Address string
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Type     string // sqlite, postgres
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
	Path     string // for sqlite
}

// RedisConfig Redis配置
type RedisConfig struct {
	Enabled  bool
	Host     string
	Port     int
	Password string
	DB       int
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret        string
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
}

// Load 加载配置
func Load() *Config {
	dbType := getEnv("DB_TYPE", "postgres")

	config := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Server: ServerConfig{
			Address: getEnv("SERVER_ADDRESS", ":8080"),
		},
		Database: DatabaseConfig{
			Type:     dbType,
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "channer"),
			Password: getEnv("DB_PASSWORD", "channer"),
			DBName:   getEnv("DB_NAME", "channer"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			Path:     getEnv("DB_PATH", "./channer.db"),
		},
		Redis: RedisConfig{
			Enabled:  getEnv("REDIS_ENABLED", "true") == "true",
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:        getEnv("JWT_SECRET", "channer-secret-key-change-in-production"),
			AccessExpiry:  getEnvAsDuration("JWT_ACCESS_EXPIRY", 24*time.Hour),
			RefreshExpiry: getEnvAsDuration("JWT_REFRESH_EXPIRY", 7*24*time.Hour),
		},
	}

	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
