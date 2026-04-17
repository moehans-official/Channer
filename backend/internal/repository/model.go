package repository

import (
	"channer/internal/model"

	"gorm.io/gorm"
)

// ModelRepository 模型仓库接口
type ModelRepository interface {
	Create(m *model.Model) error
	GetByID(id uint) (*model.Model, error)
	GetByModelID(modelID string) (*model.Model, error)
	List() ([]model.Model, error)
	ListActive() ([]model.Model, error)
	ListByChannel(channelID uint) ([]model.Model, error)
	Update(m *model.Model) error
	Delete(id uint) error
}

// modelRepository 模型仓库实现
type modelRepository struct {
	db *gorm.DB
}

// NewModelRepository 创建模型仓库
func NewModelRepository(db *gorm.DB) ModelRepository {
	return &modelRepository{db: db}
}

func (r *modelRepository) Create(m *model.Model) error {
	return r.db.Create(m).Error
}

func (r *modelRepository) GetByID(id uint) (*model.Model, error) {
	var m model.Model
	if err := r.db.Preload("Channel").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *modelRepository) GetByModelID(modelID string) (*model.Model, error) {
	var m model.Model
	if err := r.db.Preload("Channel").Where("model_id = ?", modelID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *modelRepository) List() ([]model.Model, error) {
	var models []model.Model
	if err := r.db.Preload("Channel").Find(&models).Error; err != nil {
		return nil, err
	}
	return models, nil
}

func (r *modelRepository) ListActive() ([]model.Model, error) {
	var models []model.Model
	if err := r.db.Preload("Channel").Where("is_active = ?", true).Find(&models).Error; err != nil {
		return nil, err
	}
	return models, nil
}

func (r *modelRepository) ListByChannel(channelID uint) ([]model.Model, error) {
	var models []model.Model
	if err := r.db.Where("channel_id = ?", channelID).Find(&models).Error; err != nil {
		return nil, err
	}
	return models, nil
}

func (r *modelRepository) Update(m *model.Model) error {
	return r.db.Save(m).Error
}

func (r *modelRepository) Delete(id uint) error {
	return r.db.Delete(&model.Model{}, id).Error
}
