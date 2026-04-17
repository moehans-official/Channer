package repository

import (
	"channer/internal/model"
	"time"

	"gorm.io/gorm"
)

// UsageLogRepository 使用日志仓库接口
type UsageLogRepository interface {
	Create(log *model.UsageLog) error
	GetByID(id uint) (*model.UsageLog, error)
	List(filter LogFilter) ([]model.UsageLog, error)
	GetStats(filter LogFilter) (*UsageStats, error)
	GetDashboardStats() (*model.DashboardStats, error)
}

// LogFilter 日志查询过滤器
type LogFilter struct {
	APIKeyID  *uint
	ModelID   *uint
	ChannelID *uint
	StartTime *time.Time
	EndTime   *time.Time
	Limit     int
	Offset    int
}

// UsageStats 使用统计
type UsageStats struct {
	TotalRequests     int64
	TotalInputTokens  int64
	TotalOutputTokens int64
	TotalCost         float64
}

// usageLogRepository 使用日志仓库实现
type usageLogRepository struct {
	db *gorm.DB
}

// NewUsageLogRepository 创建使用日志仓库
func NewUsageLogRepository(db *gorm.DB) UsageLogRepository {
	return &usageLogRepository{db: db}
}

func (r *usageLogRepository) Create(log *model.UsageLog) error {
	return r.db.Create(log).Error
}

func (r *usageLogRepository) GetByID(id uint) (*model.UsageLog, error) {
	var log model.UsageLog
	if err := r.db.First(&log, id).Error; err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *usageLogRepository) List(filter LogFilter) ([]model.UsageLog, error) {
	query := r.db.Model(&model.UsageLog{})

	if filter.APIKeyID != nil {
		query = query.Where("api_key_id = ?", *filter.APIKeyID)
	}
	if filter.ModelID != nil {
		query = query.Where("model_id = ?", *filter.ModelID)
	}
	if filter.ChannelID != nil {
		query = query.Where("channel_id = ?", *filter.ChannelID)
	}
	if filter.StartTime != nil {
		query = query.Where("created_at >= ?", *filter.StartTime)
	}
	if filter.EndTime != nil {
		query = query.Where("created_at <= ?", *filter.EndTime)
	}

	if filter.Limit > 0 {
		query = query.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	var logs []model.UsageLog
	if err := query.Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (r *usageLogRepository) GetStats(filter LogFilter) (*UsageStats, error) {
	query := r.db.Model(&model.UsageLog{})

	if filter.APIKeyID != nil {
		query = query.Where("api_key_id = ?", *filter.APIKeyID)
	}
	if filter.StartTime != nil {
		query = query.Where("created_at >= ?", *filter.StartTime)
	}
	if filter.EndTime != nil {
		query = query.Where("created_at <= ?", *filter.EndTime)
	}

	var stats UsageStats
	if err := query.Select(
		"COUNT(*) as total_requests",
		"COALESCE(SUM(input_tokens), 0) as total_input_tokens",
		"COALESCE(SUM(output_tokens), 0) as total_output_tokens",
		"COALESCE(SUM(cost), 0) as total_cost",
	).Scan(&stats).Error; err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *usageLogRepository) GetDashboardStats() (*model.DashboardStats, error) {
	var stats model.DashboardStats

	// 总请求数
	r.db.Model(&model.UsageLog{}).Select("COUNT(*)").Scan(&stats.TotalRequests)

	// 总Token数
	r.db.Model(&model.UsageLog{}).Select("COALESCE(SUM(input_tokens + output_tokens), 0)").Scan(&stats.TotalTokens)

	// 总费用
	r.db.Model(&model.UsageLog{}).Select("COALESCE(SUM(cost), 0)").Scan(&stats.TotalCost)

	// 活跃API Key数
	r.db.Model(&model.APIKey{}).Where("is_active = ?", true).Select("COUNT(*)").Scan(&stats.ActiveKeys)

	// 活跃渠道数
	r.db.Model(&model.Channel{}).Where("is_active = ?", true).Select("COUNT(*)").Scan(&stats.ActiveChannels)

	// 今日请求数
	today := time.Now().Truncate(24 * time.Hour)
	r.db.Model(&model.UsageLog{}).Where("created_at >= ?", today).Select("COUNT(*)").Scan(&stats.TodayRequests)

	// 今日费用
	r.db.Model(&model.UsageLog{}).Where("created_at >= ?", today).Select("COALESCE(SUM(cost), 0)").Scan(&stats.TodayCost)

	return &stats, nil
}
