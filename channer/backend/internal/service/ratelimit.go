package service

import (
	"channer/internal/model"
	"context"
	"fmt"
	"strconv"
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
}

// NewRateLimitService 创建速率限制服务
func NewRateLimitService(redisClient *redis.Client) RateLimitService {
	return &rateLimitService{redisClient: redisClient}
}

func (s *rateLimitService) CheckRateLimit(key *model.APIKey) error {
	ctx := context.Background()
	now := time.Now()

	// 检查RPM (每分钟请求数)
	minuteKey := fmt.Sprintf("ratelimit:rpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	minuteCount, _ := s.redisClient.Get(ctx, minuteKey).Int()
	if minuteCount >= key.RPMLimit {
		return fmt.Errorf("rate limit exceeded: RPM")
	}

	// 检查TPM (每分钟Token数)
	tpmKey := fmt.Sprintf("ratelimit:tpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	tpmCount, _ := s.redisClient.Get(ctx, tpmKey).Int()
	if tpmCount >= key.TPMLimit {
		return fmt.Errorf("rate limit exceeded: TPM")
	}

	// 检查RPD (每天请求数)
	dayKey := fmt.Sprintf("ratelimit:rpd:%d:%s", key.ID, now.Format("2006-01-02"))
	rpdCount, _ := s.redisClient.Get(ctx, dayKey).Int()
	if rpdCount >= key.RPDLimit {
		return fmt.Errorf("rate limit exceeded: RPD")
	}

	// 检查TPD (每天Token数)
	tpdKey := fmt.Sprintf("ratelimit:tpd:%d:%s", key.ID, now.Format("2006-01-02"))
	tpdCount, _ := s.redisClient.Get(ctx, tpdKey).Int()
	if tpdCount >= key.TPDLimit {
		return fmt.Errorf("rate limit exceeded: TPD")
	}

	return nil
}

func (s *rateLimitService) IncrementCounter(key *model.APIKey, tokens int64) error {
	ctx := context.Background()
	now := time.Now()

	pipe := s.redisClient.Pipeline()

	// 增加RPM计数器
	minuteKey := fmt.Sprintf("ratelimit:rpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	pipe.Incr(ctx, minuteKey)
	pipe.Expire(ctx, minuteKey, 2*time.Minute)

	// 增加TPM计数器
	tpmKey := fmt.Sprintf("ratelimit:tpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	pipe.IncrBy(ctx, tpmKey, tokens)
	pipe.Expire(ctx, tpmKey, 2*time.Minute)

	// 增加RPD计数器
	dayKey := fmt.Sprintf("ratelimit:rpd:%d:%s", key.ID, now.Format("2006-01-02"))
	pipe.Incr(ctx, dayKey)
	pipe.Expire(ctx, dayKey, 25*time.Hour)

	// 增加TPD计数器
	tpdKey := fmt.Sprintf("ratelimit:tpd:%d:%s", key.ID, now.Format("2006-01-02"))
	pipe.IncrBy(ctx, tpdKey, tokens)
	pipe.Expire(ctx, tpdKey, 25*time.Hour)

	_, err := pipe.Exec(ctx)
	return err
}

func (s *rateLimitService) GetQuotaUsage(key *model.APIKey) (*model.QuotaUsage, error) {
	ctx := context.Background()
	now := time.Now()

	minuteKey := fmt.Sprintf("ratelimit:rpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	tpmKey := fmt.Sprintf("ratelimit:tpm:%d:%s", key.ID, now.Format("2006-01-02-15-04"))
	dayKey := fmt.Sprintf("ratelimit:rpd:%d:%s", key.ID, now.Format("2006-01-02"))
	tpdKey := fmt.Sprintf("ratelimit:tpd:%d:%s", key.ID, now.Format("2006-01-02"))

	pipe := s.redisClient.Pipeline()
	rpmCmd := pipe.Get(ctx, minuteKey)
	tpmCmd := pipe.Get(ctx, tpmKey)
	rpdCmd := pipe.Get(ctx, dayKey)
	tpdCmd := pipe.Get(ctx, tpdKey)

	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return nil, err
	}

	rpmUsed, _ := strconv.Atoi(rpmCmd.Val())
	tpmUsed, _ := strconv.Atoi(tpmCmd.Val())
	rpdUsed, _ := strconv.Atoi(rpdCmd.Val())
	tpdUsed, _ := strconv.Atoi(tpdCmd.Val())

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
