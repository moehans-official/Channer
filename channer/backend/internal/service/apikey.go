package service

import (
	"channer/internal/model"
	"channer/internal/repository"
)

// APIKeyService API Key服务接口
type APIKeyService interface {
	Create(key *model.APIKey) error
	GetByID(id uint) (*model.APIKey, error)
	GetByKey(key string) (*model.APIKey, error)
	List() ([]model.APIKey, error)
	Update(key *model.APIKey) error
	Delete(id uint) error
	Recharge(id uint, amount float64) error
	GetInfo(key string) (*model.KeyInfo, error)
}

// apiKeyService API Key服务实现
type apiKeyService struct {
	keyRepo repository.APIKeyRepository
}

// NewAPIKeyService 创建API Key服务
func NewAPIKeyService(keyRepo repository.APIKeyRepository) APIKeyService {
	return &apiKeyService{keyRepo: keyRepo}
}

func (s *apiKeyService) Create(key *model.APIKey) error {
	return s.keyRepo.Create(key)
}

func (s *apiKeyService) GetByID(id uint) (*model.APIKey, error) {
	return s.keyRepo.GetByID(id)
}

func (s *apiKeyService) GetByKey(key string) (*model.APIKey, error) {
	return s.keyRepo.GetByKey(key)
}

func (s *apiKeyService) List() ([]model.APIKey, error) {
	return s.keyRepo.List()
}

func (s *apiKeyService) Update(key *model.APIKey) error {
	return s.keyRepo.Update(key)
}

func (s *apiKeyService) Delete(id uint) error {
	return s.keyRepo.Delete(id)
}

func (s *apiKeyService) Recharge(id uint, amount float64) error {
	return s.keyRepo.Recharge(id, amount)
}

func (s *apiKeyService) GetInfo(key string) (*model.KeyInfo, error) {
	apiKey, err := s.keyRepo.GetByKey(key)
	if err != nil {
		return nil, err
	}

	return &model.KeyInfo{
		Key:       apiKey.Key,
		Name:      apiKey.Name,
		Balance:   apiKey.Balance,
		RPMLimit:  apiKey.RPMLimit,
		TPMLimit:  apiKey.TPMLimit,
		RPDLimit:  apiKey.RPDLimit,
		TPDLimit:  apiKey.TPDLimit,
		CreatedAt: apiKey.CreatedAt,
	}, nil
}
