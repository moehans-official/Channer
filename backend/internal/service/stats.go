package service

import (
	"channer/internal/model"
	"channer/internal/repository"
	"time"
)

// StatsService 统计服务接口
type StatsService interface {
	GetDashboardStats() (*model.DashboardStats, error)
	GetKeyStats(keyID uint, start, end time.Time) (*repository.UsageStats, error)
	GetChannelStats(channelID uint, start, end time.Time) (*repository.UsageStats, error)
	GetLogs(filter repository.LogFilter) ([]model.UsageLog, error)
}

// statsService 统计服务实现
type statsService struct {
	logRepo repository.UsageLogRepository
}

// NewStatsService 创建统计服务
func NewStatsService(logRepo repository.UsageLogRepository) StatsService {
	return &statsService{logRepo: logRepo}
}

func (s *statsService) GetDashboardStats() (*model.DashboardStats, error) {
	return s.logRepo.GetDashboardStats()
}

func (s *statsService) GetKeyStats(keyID uint, start, end time.Time) (*repository.UsageStats, error) {
	filter := repository.LogFilter{
		APIKeyID:  &keyID,
		StartTime: &start,
		EndTime:   &end,
	}
	return s.logRepo.GetStats(filter)
}

func (s *statsService) GetChannelStats(channelID uint, start, end time.Time) (*repository.UsageStats, error) {
	filter := repository.LogFilter{
		ChannelID: &channelID,
		StartTime: &start,
		EndTime:   &end,
	}
	return s.logRepo.GetStats(filter)
}

func (s *statsService) GetLogs(filter repository.LogFilter) ([]model.UsageLog, error) {
	return s.logRepo.List(filter)
}
