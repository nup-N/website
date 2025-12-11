import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usersAPI } from '../services/api';
import type { User } from '../types';

const UsersPage: React.FC = () => {
  // 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // 检查登录状态并获取用户数据
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    // 如果没有 token，跳转到登录页面
    if (!token) {
      navigate('/login');
      return;
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
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [navigate]);

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>用户列表</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          退出登录
        </button>
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
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>{user.id}</td>
                    <td style={styles.td}>{user.username}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleTag,
                        backgroundColor: getRoleColor(user.role)
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// 根据角色返回不同的颜色
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return '#ff9800';
    case 'super_admin':
      return '#f44336';
    case 'premium':
      return '#9c27b0';
    case 'guest':
      return '#607d8b';
    case 'user':
    default:
      return '#2196f3';
  }
};

// 内联样式
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    color: '#333333',
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
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '16px',
    backgroundColor: '#f5f5f5',
    color: '#333333',
    fontWeight: 'bold' as const,
    borderBottom: '1px solid #dddddd',
  },
  tr: {
    borderBottom: '1px solid #eeeeee',
  },
  td: {
    padding: '16px',
    color: '#555555',
  },
  roleTag: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  loadingText: {
    fontSize: '18px',
    color: '#666666',
  },
  noDataText: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666666',
    fontSize: '16px',
  },
};

export default UsersPage;