package service

import (
	"channer/internal/model"
	"channer/internal/repository"
)

// ModelService 模型服务接口
type ModelService interface {
	Create(m *model.Model) error
	GetByID(id uint) (*model.Model, error)
	GetByModelID(modelID string) (*model.Model, error)
	List() ([]model.Model, error)
	ListActive() ([]model.Model, error)
	Update(m *model.Model) error
	Delete(id uint) error
}

// modelService 模型服务实现
type modelService struct {
	modelRepo repository.ModelRepository
}

// NewModelService 创建模型服务
func NewModelService(modelRepo repository.ModelRepository) ModelService {
	return &modelService{modelRepo: modelRepo}
}

func (s *modelService) Create(m *model.Model) error {
	return s.modelRepo.Create(m)
}

func (s *modelService) GetByID(id uint) (*model.Model, error) {
	return s.modelRepo.GetByID(id)
}

func (s *modelService) GetByModelID(modelID string) (*model.Model, error) {
	return s.modelRepo.GetByModelID(modelID)
}

func (s *modelService) List() ([]model.Model, error) {
	return s.modelRepo.List()
}

func (s *modelService) ListActive() ([]model.Model, error) {
	return s.modelRepo.ListActive()
}

func (s *modelService) Update(m *model.Model) error {
	return s.modelRepo.Update(m)
}

func (s *modelService) Delete(id uint) error {
	return s.modelRepo.Delete(id)
}
