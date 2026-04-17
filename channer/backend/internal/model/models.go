package model

import (
	"time"

	"gorm.io/gorm"
)

// User 管理员用户
type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"`
	Email        string         `gorm:"size:100" json:"email"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// Channel AI提供商渠道
type Channel struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"uniqueIndex;size:100;not null" json:"name"`
	Type      string         `gorm:"size:20;not null" json:"type"` // openai, anthropic, gemini
	BaseURL   string         `gorm:"size:255;not null" json:"base_url"`
	APIKey    string         `gorm:"size:500;not null" json:"-"` // 加密存储
	Priority  int            `gorm:"default:0" json:"priority"`  // 数值越小优先级越高
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	Models    []Model        `json:"models,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Model AI模型
type Model struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	ChannelID   uint           `gorm:"index;not null" json:"channel_id"`
	ModelID     string         `gorm:"index;size:100;not null" json:"model_id"` // 如 gpt-4o
	Name        string         `gorm:"size:100" json:"name"`                    // 显示名称
	InputPrice  float64        `gorm:"default:0" json:"input_price"`            // 每1K Token价格
	OutputPrice float64        `gorm:"default:0" json:"output_price"`           // 每1K Token价格
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Channel     Channel        `json:"channel,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// APIKey 租户API Key
type APIKey struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Key       string         `gorm:"uniqueIndex;size:64;not null" json:"key"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Balance   float64        `gorm:"default:0" json:"balance"`
	RPMLimit  int            `gorm:"default:60" json:"rpm_limit"`      // Requests Per Minute
	TPMLimit  int            `gorm:"default:100000" json:"tpm_limit"`  // Tokens Per Minute
	RPDLimit  int            `gorm:"default:10000" json:"rpd_limit"`   // Requests Per Day
	TPDLimit  int            `gorm:"default:1000000" json:"tpd_limit"` // Tokens Per Day
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// UsageLog 使用日志
type UsageLog struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	APIKeyID     uint      `gorm:"index;not null" json:"api_key_id"`
	ModelID      *uint     `gorm:"index" json:"model_id,omitempty"`
	ChannelID    *uint     `gorm:"index" json:"channel_id,omitempty"`
	RequestType  string    `gorm:"size:50" json:"request_type"` // chat.completions, responses, etc.
	InputTokens  int64     `json:"input_tokens"`
	OutputTokens int64     `json:"output_tokens"`
	Cost         float64   `json:"cost"`
	StatusCode   int       `json:"status_code"`
	ErrorMessage string    `gorm:"size:500" json:"error_message,omitempty"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

// KeyInfo API Key信息（返回给租户）
type KeyInfo struct {
	Key       string    `json:"key"`
	Name      string    `json:"name"`
	Balance   float64   `json:"balance"`
	RPMLimit  int       `json:"rpm_limit"`
	TPMLimit  int       `json:"tpm_limit"`
	RPDLimit  int       `json:"rpd_limit"`
	TPDLimit  int       `json:"tpd_limit"`
	Models    []string  `json:"models"`
	CreatedAt time.Time `json:"created_at"`
}

// QuotaUsage 配额使用情况
type QuotaUsage struct {
	RPMUsed  int `json:"rpm_used"`
	RPMTotal int `json:"rpm_total"`
	TPMUsed  int `json:"tpm_used"`
	TPMTotal int `json:"tpm_total"`
	RPDUsed  int `json:"rpd_used"`
	RPDTotal int `json:"rpd_total"`
	TPDUsed  int `json:"tpd_used"`
	TPDTotal int `json:"tpd_total"`
}

// DashboardStats 仪表板统计
type DashboardStats struct {
	TotalRequests  int64   `json:"total_requests"`
	TotalTokens    int64   `json:"total_tokens"`
	TotalCost      float64 `json:"total_cost"`
	ActiveKeys     int64   `json:"active_keys"`
	ActiveChannels int64   `json:"active_channels"`
	TodayRequests  int64   `json:"today_requests"`
	TodayCost      float64 `json:"today_cost"`
}
