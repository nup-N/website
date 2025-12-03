import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import type { LoginRequest } from '../types';

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
      localStorage.setItem('token', response.access_token);
      
      // 添加调试信息，确认 token 已保存
      console.log('Token 保存状态:', '已保存');
      console.log('localStorage 中的 token:', localStorage.getItem('token'));
      
      // 确保先保存 Token 再跳转
      setTimeout(() => {
        navigate('/users');
      }, 100);
    } catch (err: any) {
      console.error('登录失败:', err);
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
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
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    padding: '30px',
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '24px',
    color: '#333333',
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
    borderRadius: '4px',
    border: '1px solid #dddddd',
    fontSize: '16px',
    transition: 'border-color 0.3s',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px',
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