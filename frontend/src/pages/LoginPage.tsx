import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import type { LoginRequest } from '../types';
import { profileConfig } from '../config/profile';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 调用登录 API
      const response = await authAPI.login(formData);
      
      // 添加调试信息，输出响应数据
      console.log('登录响应数据:', response);
      
      // 修复：使用正确的字段名 access_token 而不是 token
      localStorage.setItem('access_token', response.access_token);
      
      // 添加调试信息，确认 token 已保存
      console.log('Token 保存状态:', '已保存');
      console.log('localStorage 中的 access_token:', localStorage.getItem('access_token'));
      
      // 触发认证状态更新事件
      window.dispatchEvent(new Event('auth-changed'));
      
      // 确保先保存 Token 再跳转
      setTimeout(() => {
        navigate('/navigation');
      }, 100);
    } catch (err: any) {
      console.error('登录失败:', err);
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container} className="login-container">
      <div style={styles.leftSection} className="login-left-section">
        <div style={styles.avatarContainer} className="login-avatar-container">
          <img 
            src="/avatar.jpg" 
            alt="Avatar" 
            style={styles.avatar}
            onError={(e) => {
              // 如果图片加载失败，使用占位符
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
      
      <div style={styles.divider}></div>
      
      <div style={styles.rightSection} className="login-right-section">
        <div style={styles.rightContent} className="right-content">
          {/* 登录表单区域 */}
          <div style={styles.loginFormSection} className="login-form-section">
            <h1 style={styles.title}>登录</h1>
            
            {error && <div style={styles.errorMessage}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor='username' style={styles.label}>用户名</label>
                <input
                  type='text'
                  id='username'
                  name='username'
                  value={formData.username}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={isLoading}
                  placeholder='请输入用户名'
                />
              </div>
              
              <div style={styles.formGroup}>
                <label htmlFor='password' style={styles.label}>密码</label>
                <input
                  type='password'
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={isLoading}
                  placeholder='请输入密码'
                />
              </div>
              
              <button 
                type='submit' 
                style={styles.button}
                disabled={isLoading}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
              
              <div style={styles.linkContainer}>
                还没有账号？
                <Link to='/register' style={styles.link}>
                  去注册
                </Link>
              </div>
            </form>
          </div>
          
          {/* 个性签名区域 */}
          <div style={styles.signatureSection} className="signature-section">
            <div style={styles.signatureContent}>
              {profileConfig.signature.map((line, index) => (
                <p key={index} style={styles.signatureLine}>{line}</p>
              ))}
              
              {profileConfig.quotes.map((quote, index) => (
                <div key={index} style={styles.quoteBlock}>
                  <p style={styles.quoteText}>{quote.text}</p>
                  {quote.author && (
                    <p style={styles.quoteAuthor}>{quote.author}</p>
                  )}
                </div>
              ))}
              
              {profileConfig.siteInfo.uptime && (
                <p style={styles.siteInfo}>{profileConfig.siteInfo.uptime}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    gap: '40px',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: '0 0 200px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    paddingTop: '0px',
    paddingRight: '20px',
  },
  avatarContainer: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  divider: {
    width: '1px',
    backgroundColor: '#e5e7eb',
    margin: '0 20px',
    alignSelf: 'stretch',
  },
  rightSection: {
    flex: 1,
    minWidth: 0,
    paddingLeft: '20px',
  },
  rightContent: {
    display: 'flex',
    gap: '40px',
    width: '100%',
  },
  loginFormSection: {
    flex: '0 0 400px',
    minWidth: 0,
  },
  signatureSection: {
    flex: 1,
    minWidth: 0,
    paddingLeft: '20px',
    borderLeft: '1px solid #e5e7eb',
  },
  signatureContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  signatureLine: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
  quoteBlock: {
    marginTop: '16px',
    padding: '12px 0',
    borderTop: '1px solid #e5e7eb',
  },
  quoteText: {
    margin: 0,
    fontSize: '14px',
    color: '#374151',
    fontStyle: 'italic' as const,
    lineHeight: '1.6',
  },
  quoteAuthor: {
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'right' as const,
  },
  siteInfo: {
    margin: '16px 0 0 0',
    fontSize: '12px',
    color: '#9ca3af',
  },
  title: {
    textAlign: 'left' as const,
    marginBottom: '32px',
    color: '#1f2937',
    fontSize: '32px',
    fontWeight: 'bold' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontWeight: 'bold' as const,
    fontSize: '14px',
    color: '#555555',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '16px',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px',
    width: '100%',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  linkContainer: {
    marginTop: '16px',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#666666',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    marginLeft: '5px',
    fontWeight: 'bold' as const,
  },
};

export default LoginPage;