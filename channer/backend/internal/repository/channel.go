package repository

import (
	"channer/internal/model"

	"gorm.io/gorm"
)

// ChannelRepository 渠道仓库接口
type ChannelRepository interface {
	Create(channel *model.Channel) error
	GetByID(id uint) (*model.Channel, error)
	GetByName(name string) (*model.Channel, error)
	List() ([]model.Channel, error)
	ListActive() ([]model.Channel, error)
	GetAvailableByModel(modelID string) ([]model.Channel, error)
	Update(channel *model.Channel) error
	Delete(id uint) error
}

// channelRepository 渠道仓库实现
type channelRepository struct {
	db *gorm.DB
}

// NewChannelRepository 创建渠道仓库
func NewChannelRepository(db *gorm.DB) ChannelRepository {
	return &channelRepository{db: db}
}

func (r *channelRepository) Create(channel *model.Channel) error {
	return r.db.Create(channel).Error
}

func (r *channelRepository) GetByID(id uint) (*model.Channel, error) {
	var channel model.Channel
	if err := r.db.Preload("Models").First(&channel, id).Error; err != nil {
		return nil, err
	}
	return &channel, nil
}

func (r *channelRepository) GetByName(name string) (*model.Channel, error) {
	var channel model.Channel
	if err := r.db.Where("name = ?", name).First(&channel).Error; err != nil {
		return nil, err
	}
	return &channel, nil
}

func (r *channelRepository) List() ([]model.Channel, error) {
	var channels []model.Channel
	if err := r.db.Find(&channels).Error; err != nil {
		return nil, err
	}
	return channels, nil
}

func (r *channelRepository) ListActive() ([]model.Channel, error) {
	var channels []model.Channel
	if err := r.db.Where("is_active = ?", true).Find(&channels).Error; err != nil {
		return nil, err
	}
	return channels, nil
}

func (r *channelRepository) GetAvailableByModel(modelID string) ([]model.Channel, error) {
	var channels []model.Channel
	if err := r.db.Distinct("channels.*").
		Joins("JOIN models ON models.channel_id = channels.id").
		Where("channels.is_active = ? AND models.is_active = ? AND models.model_id = ?", true, true, modelID).
		Order("channels.priority ASC").
		Find(&channels).Error; err != nil {
		return nil, err
	}
	return channels, nil
}

func (r *channelRepository) Update(channel *model.Channel) error {
	return r.db.Save(channel).Error
}

func (r *channelRepository) Delete(id uint) error {
	return r.db.Delete(&model.Channel{}, id).Error
}
