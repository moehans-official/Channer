package service

import (
	"channer/internal/model"
	"channer/internal/repository"
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// BillingService 计费服务接口
type BillingService interface {
	PreDeduct(key *model.APIKey) error
	FinalizeBilling(key *model.APIKey, inputTokens, outputTokens int64, m *model.Model) error
	Refund(key *model.APIKey) error
	CalculateCost(inputTokens, outputTokens int64, m *model.Model) float64
}

// billingService 计费服务实现
type billingService struct {
	keyRepo     repository.APIKeyRepository
	redisClient *redis.Client
}

// NewBillingService 创建计费服务
func NewBillingService(keyRepo repository.APIKeyRepository, redisClient *redis.Client) BillingService {
	return &billingService{
		keyRepo:     keyRepo,
		redisClient: redisClient,
	}
}

const (
	preDeductAmount = 0.1 // 预扣金额
)

func (s *billingService) PreDeduct(key *model.APIKey) error {
	ctx := context.Background()

	// 使用Redis分布式锁防止并发问题
	lockKey := fmt.Sprintf("billing:lock:%d", key.ID)
	locked, err := s.redisClient.SetNX(ctx, lockKey, "1", 10*time.Second).Result()
	if err != nil || !locked {
		return fmt.Errorf("failed to acquire lock")
	}
	defer s.redisClient.Del(ctx, lockKey)

	// 检查余额
	if key.Balance < preDeductAmount {
		return fmt.Errorf("insufficient balance")
	}

	// 扣除预付款
	if err := s.keyRepo.DeductBalance(key.ID, preDeductAmount); err != nil {
		return err
	}

	// 记录预扣信息到Redis
	preDeductKey := fmt.Sprintf("billing:prededuct:%d", key.ID)
	s.redisClient.Set(ctx, preDeductKey, preDeductAmount, 5*time.Minute)

	return nil
}

func (s *billingService) FinalizeBilling(key *model.APIKey, inputTokens, outputTokens int64, m *model.Model) error {
	ctx := context.Background()

	// 使用Redis分布式锁
	lockKey := fmt.Sprintf("billing:lock:%d", key.ID)
	locked, err := s.redisClient.SetNX(ctx, lockKey, "1", 10*time.Second).Result()
	if err != nil || !locked {
		return fmt.Errorf("failed to acquire lock")
	}
	defer s.redisClient.Del(ctx, lockKey)

	// 计算实际费用
	actualCost := s.CalculateCost(inputTokens, outputTokens, m)

	// 获取预扣金额
	preDeductKey := fmt.Sprintf("billing:prededuct:%d", key.ID)
	preDeducted, _ := s.redisClient.Get(ctx, preDeductKey).Float64()
	if preDeducted == 0 {
		preDeducted = preDeductAmount
	}

	// 清除预扣记录
	s.redisClient.Del(ctx, preDeductKey)

	// 计算差额
	diff := preDeducted - actualCost

	// 多退少补
	if diff > 0 {
		// 退款
		s.keyRepo.Recharge(key.ID, diff)
	} else if diff < 0 {
		// 补扣
		s.keyRepo.DeductBalance(key.ID, -diff)
	}

	return nil
}

func (s *billingService) Refund(key *model.APIKey) error {
	ctx := context.Background()

	// 获取预扣金额
	preDeductKey := fmt.Sprintf("billing:prededuct:%d", key.ID)
	preDeducted, _ := s.redisClient.Get(ctx, preDeductKey).Float64()

	if preDeducted > 0 {
		// 清除预扣记录
		s.redisClient.Del(ctx, preDeductKey)
		// 退款
		return s.keyRepo.Recharge(key.ID, preDeducted)
	}

	return nil
}

func (s *billingService) CalculateCost(inputTokens, outputTokens int64, m *model.Model) float64 {
	if m == nil {
		return 0
	}

	inputCost := float64(inputTokens) * m.InputPrice / 1000
	outputCost := float64(outputTokens) * m.OutputPrice / 1000

	return inputCost + outputCost
}
