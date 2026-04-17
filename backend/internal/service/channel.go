package service

import (
	"channer/internal/model"
	"channer/internal/repository"
	"errors"
)

// ChannelService 渠道服务接口
type ChannelService interface {
	Create(channel *model.Channel) error
	GetByID(id uint) (*model.Channel, error)
	List() ([]model.Channel, error)
	ListActive() ([]model.Channel, error)
	Update(channel *model.Channel) error
	Delete(id uint) error
}

// channelService 渠道服务实现
type channelService struct {
	channelRepo repository.ChannelRepository
}

// NewChannelService 创建渠道服务
func NewChannelService(channelRepo repository.ChannelRepository) ChannelService {
	return &channelService{channelRepo: channelRepo}
}

func (s *channelService) Create(channel *model.Channel) error {
	// 验证渠道类型
	if !isValidChannelType(channel.Type) {
		return errors.New("invalid channel type")
	}

	// 检查名称是否已存在
	if _, err := s.channelRepo.GetByName(channel.Name); err == nil {
		return errors.New("channel name already exists")
	}

	return s.channelRepo.Create(channel)
}

func (s *channelService) GetByID(id uint) (*model.Channel, error) {
	return s.channelRepo.GetByID(id)
}

func (s *channelService) List() ([]model.Channel, error) {
	return s.channelRepo.List()
}

func (s *channelService) ListActive() ([]model.Channel, error) {
	return s.channelRepo.ListActive()
}

func (s *channelService) Update(channel *model.Channel) error {
	if !isValidChannelType(channel.Type) {
		return errors.New("invalid channel type")
	}
	return s.channelRepo.Update(channel)
}

func (s *channelService) Delete(id uint) error {
	return s.channelRepo.Delete(id)
}

func isValidChannelType(channelType string) bool {
	validTypes := []string{"openai", "anthropic", "gemini"}
	for _, t := range validTypes {
		if t == channelType {
			return true
		}
	}
	return false
}
