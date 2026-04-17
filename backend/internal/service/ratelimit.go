package service

import (
	"channer/internal/model"
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimitService 速率限制服务接口
type RateLimitService interface {
	CheckRateLimit(key *model.APIKey) error
	IncrementCounter(key *model.APIKey, tokens int64) error
	GetQuotaUsage(key *model.APIKey) (*model.QuotaUsage, error)
}

// rateLimitService 速率限制服务实现
type rateLimitService struct {
	redisClient *redis.Client
	// 内存存储，用于Redis不可用时
	memoryStore map[string]int
	memoryMutex sync.RWMutex
}

// NewRateLimitService 创建速率限制服务
func NewRateLimitService(redisClient *redis.Client) RateLimitService {
	return &rateLimitService{
		redisClient: redisClient,
		memoryStore: make(map[string]int),
	}
}

func (s *rateLimitService) CheckRateLimit(key *model.APIKey) error {
	now := time.Now()

	// 检查RPM (每分钟请求数)
	minuteKey := fmt.Sprintf("ratelimit:rpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	minuteCount := s.getCount(minuteKey)
	if minuteCount >= key.RPMLimit {
		return fmt.Errorf("rate limit exceeded: RPM")
	}

	// 检查TPM (每分钟Token数)
	tpmKey := fmt.Sprintf("ratelimit:tpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	tpmCount := s.getCount(tpmKey)
	if tpmCount >= key.TPMLimit {
		return fmt.Errorf("rate limit exceeded: TPM")
	}

	// 检查RPD (每天请求数)
	dayKey := fmt.Sprintf("ratelimit:rpd:%d:%s", key.ID, now.Format("2006-01-02"))
	rpdCount := s.getCount(dayKey)
	if rpdCount >= key.RPDLimit {
		return fmt.Errorf("rate limit exceeded: RPD")
	}

	// 检查TPD (每天Token数)
	tpdKey := fmt.Sprintf("ratelimit:tpd:%d:%s", key.ID, now.Format("2006-01-02"))
	tpdCount := s.getCount(tpdKey)
	if tpdCount >= key.TPDLimit {
		return fmt.Errorf("rate limit exceeded: TPD")
	}

	return nil
}

func (s *rateLimitService) IncrementCounter(key *model.APIKey, tokens int64) error {
	now := time.Now()

	// 增加RPM计数器
	minuteKey := fmt.Sprintf("ratelimit:rpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	s.increment(minuteKey, 1, 2*time.Minute)

	// 增加TPM计数器
	tpmKey := fmt.Sprintf("ratelimit:tpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	s.increment(tpmKey, int(tokens), 2*time.Minute)

	// 增加RPD计数器
	dayKey := fmt.Sprintf("ratelimit:rpd:%d:%s", key.ID, now.Format("2006-01-02"))
	s.increment(dayKey, 1, 25*time.Hour)

	// 增加TPD计数器
	tpdKey := fmt.Sprintf("ratelimit:tpd:%d:%s", key.ID, now.Format("2006-01-02"))
	s.increment(tpdKey, int(tokens), 25*time.Hour)

	return nil
}

func (s *rateLimitService) GetQuotaUsage(key *model.APIKey) (*model.QuotaUsage, error) {
	now := time.Now()

	minuteKey := fmt.Sprintf("ratelimit:rpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	tpmKey := fmt.Sprintf("ratelimit:tpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	dayKey := fmt.Sprintf("ratelimit:rpd:%d:%s", key.ID, now.Format("2006-01-02"))
	tpdKey := fmt.Sprintf("ratelimit:tpd:%d:%s", key.ID, now.Format("2006-01-02"))

	rpmUsed := s.getCount(minuteKey)
	tpmUsed := s.getCount(tpmKey)
	rpdUsed := s.getCount(dayKey)
	tpdUsed := s.getCount(tpdKey)

	return &model.QuotaUsage{
		RPMUsed:  rpmUsed,
		RPMTotal: key.RPMLimit,
		TPMUsed:  tpmUsed,
		TPMTotal: key.TPMLimit,
		RPDUsed:  rpdUsed,
		RPDTotal: key.RPDLimit,
		TPDUsed:  tpdUsed,
		TPDTotal: key.TPDLimit,
	}, nil
}

// getCount 获取计数（优先从Redis，否则从内存）
func (s *rateLimitService) getCount(key string) int {
	if s.redisClient != nil {
		ctx := context.Background()
		count, err := s.redisClient.Get(ctx, key).Int()
		if err == nil {
			return count
		}
	}

	// 从内存获取
	s.memoryMutex.RLock()
	defer s.memoryMutex.RUnlock()
	return s.memoryStore[key]
}

// increment 增加计数
func (s *rateLimitService) increment(key string, value int, expiry time.Duration) {
	if s.redisClient != nil {
		ctx := context.Background()
		pipe := s.redisClient.Pipeline()
		pipe.IncrBy(ctx, key, int64(value))
		pipe.Expire(ctx, key, expiry)
		pipe.Exec(ctx)
	} else {
		// 使用内存存储
		s.memoryMutex.Lock()
		defer s.memoryMutex.Unlock()
		s.memoryStore[key] += value
	}
}
