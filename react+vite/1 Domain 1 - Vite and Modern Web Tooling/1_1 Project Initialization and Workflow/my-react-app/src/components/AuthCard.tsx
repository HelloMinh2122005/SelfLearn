import React, { useState } from 'react';

interface AuthCardProps {
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ currentTheme, onToggleTheme }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const handleQuickFill = () => {
    setEmail('developer@selflearn.io');
    setPassword('ViteReact@2026');
    setRememberMe(true);
    showNotification('Đã điền sẵn tài khoản mẫu thành công!', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'error');
      return;
    }

    if (!isLogin) {
      if (!name) {
        showNotification('Vui lòng nhập Họ và tên của bạn!', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showNotification('Mật khẩu xác nhận không trùng khớp!', 'error');
        return;
      }
    }

    setIsLoading(true);

    // Giả lập gửi request xác thực tới Backend
    setTimeout(() => {
      setIsLoading(false);
      if (isLogin) {
        showNotification(`Chào mừng ${email} đã đăng nhập thành công!`, 'success');
      } else {
        showNotification(`Đăng ký tài khoản ${name} thành công! Hãy đăng nhập ngay.`, 'success');
        setIsLogin(true);
      }
    }, 1200);
  };

  return (
    <div className="auth-container">
      {/* Floating Theme Switcher */}
      <button 
        type="button" 
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        title={`Chuyển sang giao diện ${currentTheme === 'dark' ? 'sáng' : 'tối'}`}
        aria-label="Toggle Theme"
      >
        {currentTheme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`toast-banner toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="toast-text">{toast.message}</span>
        </div>
      )}

      {/* Main Glassmorphic Auth Card */}
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="brand-badge">
            <div className="brand-logo-glow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1 className="auth-title">
            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Đăng nhập vào không gian học tập & phát triển React + Vite'
              : 'Khởi đầu hành trình làm chủ Frontend hiện đại cùng SelfLearn'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="tab-pill-group">
          <button 
            type="button" 
            className={`tab-pill-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Đăng nhập
          </button>
          <button 
            type="button" 
            className={`tab-pill-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Đăng ký
          </button>
        </div>

        {/* Form Elements */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="name-input">Họ và tên</label>
              <div className="input-field-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input 
                  id="name-input"
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-control"
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email-input">Địa chỉ Email</label>
            <div className="input-field-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input 
                id="email-input"
                type="email" 
                placeholder="tenban@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-control"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-with-action">
              <label htmlFor="password-input">Mật khẩu</label>
              {isLogin && (
                <button 
                  type="button" 
                  className="link-btn"
                  onClick={() => showNotification('Vui lòng kiểm tra email để nhận liên kết đặt lại mật khẩu!', 'info')}
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="input-field-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input 
                id="password-input"
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-control"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label htmlFor="confirm-password-input">Xác nhận mật khẩu</label>
              <div className="input-field-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <input 
                  id="confirm-password-input"
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-control"
                  required
                />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="form-remember-row">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">Ghi nhớ đăng nhập trong 30 ngày</span>
              </label>
            </div>
          )}

          {/* Primary Submit Button */}
          <button 
            type="submit" 
            className="btn-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading-state">
                <span className="spinner"></span>
                <span>Đang xử lý...</span>
              </span>
            ) : (
              <span>{isLogin ? 'Đăng Nhập Vào Hệ Thống' : 'Hoàn Tất Đăng Ký'}</span>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Helper */}
        <div className="demo-helper">
          <button 
            type="button" 
            onClick={handleQuickFill}
            className="btn-quick-fill"
          >
            ⚡ Điền nhanh tài khoản mẫu thử nghiệm
          </button>
        </div>

        {/* Social Authentication Divider */}
        <div className="auth-divider">
          <span>Hoặc tiếp tục với</span>
        </div>

        {/* Social Login Buttons */}
        <div className="social-grid">
          <button 
            type="button" 
            className="social-btn"
            onClick={() => showNotification('Đang chuyển hướng xác thực tài khoản Google...', 'info')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27a7.22 7.22 0 0 1 0-4.54V6.58H1.26a11.99 11.99 0 0 0 0 10.84l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Google</span>
          </button>

          <button 
            type="button" 
            className="social-btn"
            onClick={() => showNotification('Đang chuyển hướng xác thực tài khoản GitHub...', 'info')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="auth-footer">
          <p>
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <a href="#terms" onClick={(e) => { e.preventDefault(); showNotification('Điều khoản dịch vụ SelfLearn Portal', 'info'); }}>
              Điều khoản
            </a>{' '}
            và{' '}
            <a href="#privacy" onClick={(e) => { e.preventDefault(); showNotification('Chính sách bảo mật quyền riêng tư', 'info'); }}>
              Chính sách bảo mật
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};
