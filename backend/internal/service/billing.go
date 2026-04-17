package service

import (
	"channer/internal/model"
	"channer/internal/repository"
	"context"
	"fmt"
	"sync"
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
	// 内存锁，用于Redis不可用时
	memoryLocks map[uint]*sync.Mutex
	locksMutex  sync.RWMutex
}

// NewBillingService 创建计费服务
func NewBillingService(keyRepo repository.APIKeyRepository, redisClient *redis.Client) BillingService {
	return &billingService{
		keyRepo:     keyRepo,
		redisClient: redisClient,
		memoryLocks: make(map[uint]*sync.Mutex),
	}
}

const (
	preDeductAmount = 0.1 // 预扣金额
)

func (s *billingService) PreDeduct(key *model.APIKey) error {
	// 获取锁
	unlock := s.acquireLock(key.ID)
	defer unlock()

	// 检查余额
	if key.Balance < preDeductAmount {
		return fmt.Errorf("insufficient balance")
	}

	// 扣除预付款
	if err := s.keyRepo.DeductBalance(key.ID, preDeductAmount); err != nil {
		return err
	}

	return nil
}

func (s *billingService) FinalizeBilling(key *model.APIKey, inputTokens, outputTokens int64, m *model.Model) error {
	// 获取锁
	unlock := s.acquireLock(key.ID)
	defer unlock()

	// 计算实际费用
	actualCost := s.CalculateCost(inputTokens, outputTokens, m)

	// 计算差额
	diff := preDeductAmount - actualCost

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
	// 获取锁
	unlock := s.acquireLock(key.ID)
	defer unlock()

	// 退款
	return s.keyRepo.Recharge(key.ID, preDeductAmount)
}

func (s *billingService) CalculateCost(inputTokens, outputTokens int64, m *model.Model) float64 {
	if m == nil {
		return 0
	}

	inputCost := float64(inputTokens) * m.InputPrice / 1000
	outputCost := float64(outputTokens) * m.OutputPrice / 1000

	return inputCost + outputCost
}

// acquireLock 获取分布式锁（优先Redis，否则使用内存锁）
func (s *billingService) acquireLock(keyID uint) func() {
	if s.redisClient != nil {
		// 使用Redis分布式锁
		lockKey := fmt.Sprintf("billing:lock:%d", keyID)
		for {
			locked, _ := s.redisClient.SetNX(ctx, lockKey, "1", 10*time.Second).Result()
			if locked {
				return func() {
					s.redisClient.Del(ctx, lockKey)
				}
			}
			time.Sleep(10 * time.Millisecond)
		}
	}

	// 使用内存锁
	s.locksMutex.Lock()
	lock, exists := s.memoryLocks[keyID]
	if !exists {
		lock = &sync.Mutex{}
		s.memoryLocks[keyID] = lock
	}
	s.locksMutex.Unlock()

	lock.Lock()
	return func() {
		lock.Unlock()
	}
}

var ctx = context.Background()
