package repository

import (
	"channer/internal/model"
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"gorm.io/gorm"
)

// APIKeyRepository API Key仓库接口
type APIKeyRepository interface {
	Create(key *model.APIKey) error
	GetByID(id uint) (*model.APIKey, error)
	GetByKey(key string) (*model.APIKey, error)
	List() ([]model.APIKey, error)
	Update(key *model.APIKey) error
	Delete(id uint) error
	Recharge(id uint, amount float64) error
	DeductBalance(id uint, amount float64) error
}

// apiKeyRepository API Key仓库实现
type apiKeyRepository struct {
	db *gorm.DB
}

// NewAPIKeyRepository 创建API Key仓库
func NewAPIKeyRepository(db *gorm.DB) APIKeyRepository {
	return &apiKeyRepository{db: db}
}

func (r *apiKeyRepository) Create(key *model.APIKey) error {
	// 生成随机的API Key
	if key.Key == "" {
		key.Key = generateAPIKey()
	}
	return r.db.Create(key).Error
}

func (r *apiKeyRepository) GetByID(id uint) (*model.APIKey, error) {
	var key model.APIKey
	if err := r.db.First(&key, id).Error; err != nil {
		return nil, err
	}
	return &key, nil
}

func (r *apiKeyRepository) GetByKey(key string) (*model.APIKey, error) {
	var apiKey model.APIKey
	if err := r.db.Where("key = ?", key).First(&apiKey).Error; err != nil {
		return nil, err
	}
	return &apiKey, nil
}

func (r *apiKeyRepository) List() ([]model.APIKey, error) {
	var keys []model.APIKey
	if err := r.db.Find(&keys).Error; err != nil {
		return nil, err
	}
	return keys, nil
}

func (r *apiKeyRepository) Update(key *model.APIKey) error {
	return r.db.Save(key).Error
}

func (r *apiKeyRepository) Delete(id uint) error {
	return r.db.Delete(&model.APIKey{}, id).Error
}

func (r *apiKeyRepository) Recharge(id uint, amount float64) error {
	return r.db.Model(&model.APIKey{}).Where("id = ?", id).
		Update("balance", gorm.Expr("balance + ?", amount)).Error
}

func (r *apiKeyRepository) DeductBalance(id uint, amount float64) error {
	result := r.db.Model(&model.APIKey{}).Where("id = ? AND balance >= ?", id, amount).
		Update("balance", gorm.Expr("balance - ?", amount))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("insufficient balance")
	}
	return nil
}

// generateAPIKey 生成随机API Key
func generateAPIKey() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return "sk-channer-" + hex.EncodeToString(bytes)
}
