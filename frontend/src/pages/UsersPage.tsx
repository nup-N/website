import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usersAPI } from '../services/api';
import type { User } from '../types';

const ROLES = [
  { value: 'guest', label: '访客', color: '#607d8b' },
  { value: 'user', label: '用户', color: '#2196f3' },
  { value: 'premium', label: '高级用户', color: '#9c27b0' },
  { value: 'admin', label: '管理员', color: '#ff9800' },
  { value: 'super_admin', label: '超级管理员', color: '#f44336' },
];

const UsersPage: React.FC = () => {
  // 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  
  const navigate = useNavigate();

  // 检查登录状态并获取用户数据
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    // 如果没有 token，跳转到登录页面
    if (!token) {
      navigate('/login');
      return;
    }
    
    // 检查是否是超级管理员
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        if (user.role !== 'super_admin') {
          alert('权限不足：只有超级管理员可以访问此页面');
          navigate('/navigation');
          return;
        }
      } catch (error) {
        console.error('解析用户信息失败:', error);
        navigate('/navigation');
        return;
      }
    }
    
    // 获取用户列表
    const fetchUsers = async () => {
      try {
        const data = await usersAPI.getAll();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取用户列表失败');
        
        // 如果是认证错误，可能是 token 过期，跳转到登录页
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [navigate]);

  // 处理角色修改
  const handleRoleChange = async (userId: number, newRole: string) => {
    // 不能修改自己的角色
    if (currentUser && userId === currentUser.id) {
      alert('不能修改自己的角色');
      return;
    }

    if (!window.confirm(`确定要将该用户的角色修改为"${ROLES.find(r => r.value === newRole)?.label}"吗？`)) {
      return;
    }

    setUpdatingUserId(userId);
    setError(null);

    try {
      const updatedUser = await usersAPI.update(userId, { role: newRole });
      
      // 更新本地用户列表
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      
      alert('角色修改成功！');
    } catch (err) {
      console.error('修改角色失败:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('认证失败，请重新登录');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (err.response?.status === 403) {
          setError('权限不足，无法修改用户角色');
        } else {
          setError(err.response?.data?.message || '修改角色失败，请重试');
        }
      } else {
        setError('修改角色失败，请重试');
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 返回导航页
  const handleBackToNavigation = () => {
    navigate('/navigation');
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 根据角色获取颜色
  const getRoleColor = (role: string): string => {
    return ROLES.find(r => r.value === role)?.color || '#2196f3';
  };

  // 根据角色获取标签
  const getRoleLabel = (role: string): string => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>用户管理</h1>
          {currentUser && (
            <p style={styles.subtitle}>
              当前登录：<strong>{currentUser.username}</strong> 
              <span style={{
                ...styles.roleTag,
                backgroundColor: getRoleColor(currentUser.role),
                marginLeft: '8px',
              }}>
                {getRoleLabel(currentUser.role)}
              </span>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleBackToNavigation} style={styles.backButton}>
            返回导航
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            退出登录
          </button>
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {isLoading ? (
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>加载中...</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          {users.length === 0 ? (
            <p style={styles.noDataText}>暂无用户数据</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>用户名</th>
                  <th style={styles.th}>邮箱</th>
                  <th style={styles.th}>角色</th>
                  <th style={styles.th}>创建时间</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = currentUser && user.id === currentUser.id;
                  const isUpdating = updatingUserId === user.id;
                  
                  return (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>{user.id}</td>
                      <td style={styles.td}>
                        {user.username}
                        {isCurrentUser && (
                          <span style={styles.currentUserBadge}>（当前用户）</span>
                        )}
                      </td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.roleTag,
                          backgroundColor: getRoleColor(user.role)
                        }}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(user.createdAt)}</td>
                      <td style={styles.td}>
                        {isCurrentUser ? (
                          <span style={styles.disabledText}>不可修改</span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={isUpdating}
                            style={{
                              ...styles.roleSelect,
                              opacity: isUpdating ? 0.6 : 1,
                              cursor: isUpdating ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      <div style={styles.footer}>
        <p style={styles.footerText}>
          共 {users.length} 个用户 | 只有超级管理员可以修改用户角色
        </p>
      </div>
    </div>
  );
};

// 内联样式
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    color: '#333333',
    fontSize: '24px',
  },
  subtitle: {
    margin: 0,
    color: '#666666',
    fontSize: '14px',
  },
  backButton: {
    backgroundColor: '#2196f3',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '16px',
    backgroundColor: '#fafafa',
    color: '#333333',
    fontWeight: 'bold' as const,
    borderBottom: '2px solid #e0e0e0',
    fontSize: '14px',
  },
  tr: {
    borderBottom: '1px solid #eeeeee',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px',
    color: '#555555',
    fontSize: '14px',
  },
  roleTag: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  roleSelect: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  currentUserBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontSize: '12px',
    fontWeight: 'normal' as const,
  },
  disabledText: {
    color: '#999999',
    fontSize: '14px',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #ef9a9a',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  loadingText: {
    fontSize: '18px',
    color: '#666666',
  },
  noDataText: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#666666',
    fontSize: '16px',
  },
  footer: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
  },
  footerText: {
    margin: 0,
    color: '#666666',
    fontSize: '14px',
  },
};

export default UsersPage;
