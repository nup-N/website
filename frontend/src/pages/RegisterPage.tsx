import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authAPI } from '../services/api';
import type { RegisterRequest } from '../types';

const RegisterPage: React.FC = () => {
  // 状态管理
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const navigate = useNavigate();

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // 清除相应的验证错误
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    
    
    // 清除通用错误
    if (error) {
      setError(null);
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    let isValid = true;

    // 验证用户名
    if (!formData.username.trim()) {
      errors.username = '用户名不能为空';
      isValid = false;
    }

    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = '邮箱不能为空';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
      isValid = false;
    }

    // 验证密码
    if (!formData.password) {
      errors.password = '密码不能为空';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = '密码长度至少为6位';
      isValid = false;
    }

    // 验证确认密码
    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 表单验证
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 准备注册数据
      const registerData: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };
      
      // 调用注册 API
      await authAPI.register(registerData);
      
      // 注册成功后跳转到登录页面
      navigate('/login', { state: { message: '注册成功，请登录' } });
    } catch (err) {
      // 处理错误
      if (axios.isAxiosError(err) && err.response) {
        // 处理服务器返回的错误信息
        setError(
          err.response.data?.message || 
          '注册失败，请检查您的信息后重试'
        );
      } else {
        setError(
          err instanceof Error 
            ? err.message 
            : '注册失败，请稍后再试'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>注册账号</h1>
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 用户名输入框 */}
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>用户名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={validationErrors.username ? {...styles.input, ...styles.inputError} : styles.input}
              disabled={isLoading}
              placeholder="请输入用户名"
            />
            {validationErrors.username && (
              <div style={styles.fieldError}>{validationErrors.username}</div>
            )}
          </div>
          
          {/* 邮箱输入框 */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>邮箱</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={validationErrors.email ? {...styles.input, ...styles.inputError} : styles.input}
              disabled={isLoading}
              placeholder="请输入邮箱"
            />
            {validationErrors.email && (
              <div style={styles.fieldError}>{validationErrors.email}</div>
            )}
          </div>
          
          {/* 密码输入框 */}
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={validationErrors.password ? {...styles.input, ...styles.inputError} : styles.input}
              disabled={isLoading}
              placeholder="请输入密码（至少6位）"
            />
            {validationErrors.password && (
              <div style={styles.fieldError}>{validationErrors.password}</div>
            )}
          </div>
          
          {/* 确认密码输入框 */}
          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={validationErrors.confirmPassword ? {...styles.input, ...styles.inputError} : styles.input}
              disabled={isLoading}
              placeholder="请再次输入密码"
            />
            {validationErrors.confirmPassword && (
              <div style={styles.fieldError}>{validationErrors.confirmPassword}</div>
            )}
          </div>
          
          {/* 注册按钮 */}
          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
          
          {/* 登录链接 */}
          <div style={styles.linkContainer}>
            已有账号？
            <Link to="/login" style={styles.link}>
              去登录
            </Link>
          </div>
        </form>
    </div>
  );
};

// 内联样式
const styles = {
  container: {
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
  },
  title: {
    textAlign: 'center' as const,
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
  inputError: {
    borderColor: '#ff3b30',
  },
  button: {
    backgroundColor: '#10b981',
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
  fieldError: {
    color: '#ff3b30',
    fontSize: '12px',
    marginTop: '4px',
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

export default RegisterPage;