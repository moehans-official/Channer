package service

import (
	"channer/internal/config"
	"channer/internal/model"
	"channer/internal/repository"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

// AuthService 认证服务接口
type AuthService interface {
	Login(username, password string) (string, string, error)
	RefreshToken(refreshToken string) (string, string, error)
	ValidateToken(token string) (*model.User, error)
	CreateDefaultAdmin() error
}

// authService 认证服务实现
type authService struct {
	userRepo    repository.UserRepository
	redisClient *redis.Client
	jwtConfig   config.JWTConfig
}

// NewAuthService 创建认证服务
func NewAuthService(userRepo repository.UserRepository, redisClient *redis.Client, jwtConfig config.JWTConfig) AuthService {
	return &authService{
		userRepo:    userRepo,
		redisClient: redisClient,
		jwtConfig:   jwtConfig,
	}
}

// Claims JWT Claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Type     string `json:"type"` // access or refresh
	jwt.RegisteredClaims
}

func (s *authService) Login(username, password string) (string, string, error) {
	user, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return "", "", errors.New("invalid credentials")
	}

	if !user.IsActive {
		return "", "", errors.New("user is disabled")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", errors.New("invalid credentials")
	}

	accessToken, err := s.generateToken(user, "access", s.jwtConfig.AccessExpiry)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := s.generateToken(user, "refresh", s.jwtConfig.RefreshExpiry)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *authService) RefreshToken(refreshToken string) (string, string, error) {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return "", "", err
	}

	if claims.Type != "refresh" {
		return "", "", errors.New("invalid token type")
	}

	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return "", "", err
	}

	if !user.IsActive {
		return "", "", errors.New("user is disabled")
	}

	newAccessToken, err := s.generateToken(user, "access", s.jwtConfig.AccessExpiry)
	if err != nil {
		return "", "", err
	}

	newRefreshToken, err := s.generateToken(user, "refresh", s.jwtConfig.RefreshExpiry)
	if err != nil {
		return "", "", err
	}

	return newAccessToken, newRefreshToken, nil
}

func (s *authService) ValidateToken(tokenString string) (*model.User, error) {
	claims, err := s.parseToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.Type != "access" {
		return nil, errors.New("invalid token type")
	}

	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, err
	}

	if !user.IsActive {
		return nil, errors.New("user is disabled")
	}

	return user, nil
}

func (s *authService) CreateDefaultAdmin() error {
	// 检查是否已存在管理员
	_, err := s.userRepo.GetByUsername("admin")
	if err == nil {
		return nil // 已存在，不创建
	}

	// 创建默认管理员
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := &model.User{
		Username:     "admin",
		PasswordHash: string(hash),
		Email:        "admin@channer.local",
		IsActive:     true,
	}

	return s.userRepo.Create(admin)
}

func (s *authService) generateToken(user *model.User, tokenType string, expiry time.Duration) (string, error) {
	claims := Claims{
		UserID:   user.ID,
		Username: user.Username,
		Type:     tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtConfig.Secret))
}

func (s *authService) parseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtConfig.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
