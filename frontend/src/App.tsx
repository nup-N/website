import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NavigationPage from './pages/NavigationPage';
import UsersPage from './pages/UsersPage';

/**
 * 应用程序主组件
 * 
 * 配置路由系统，定义应用的页面导航结构
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // 检查登录状态
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
      setIsChecking(false);
    };
    
    checkAuth();
    
    // 监听storage变化（用于跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（用于同标签页内更新）
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  // 受保护的路由组件
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isChecking) {
      return <div>加载中...</div>;
    }
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  // 公共路由组件（已登录时重定向）
  const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isChecking) {
      return <div>加载中...</div>;
    }
    if (isAuthenticated) {
      return <Navigate to="/navigation" replace />;
    }
    return <>{children}</>;
  };

  // 超级管理员路由组件
  const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isChecking) {
      return <div>加载中...</div>;
    }
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    
    // 检查用户角色
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return <Navigate to="/navigation" replace />;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'super_admin') {
        alert('权限不足：只有超级管理员可以访问用户管理页面');
        return <Navigate to="/navigation" replace />;
      }
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return <Navigate to="/navigation" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 根路径：根据登录状态显示登录页或导航页 */}
        <Route 
          path="/" 
          element={
            isChecking ? (
              <MainLayout><div>加载中...</div></MainLayout>
            ) : isAuthenticated ? (
              <MainLayout><NavigationPage /></MainLayout>
            ) : (
              <MainLayout><LoginPage /></MainLayout>
            )
          } 
        />
        
        {/* 登录页 */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <MainLayout>
                <LoginPage />
              </MainLayout>
            </PublicRoute>
          } 
        />
        
        {/* 注册页 */}
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <MainLayout>
                <RegisterPage />
              </MainLayout>
            </PublicRoute>
          } 
        />
        
        {/* 导航系统页 */}
        <Route 
          path="/navigation" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <NavigationPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* 用户管理路由（仅超级管理员可访问） */}
        <Route 
          path="/users" 
          element={
            <SuperAdminRoute>
              <UsersPage />
            </SuperAdminRoute>
          } 
        />
        
        {/* 未匹配路由重定向到根路径 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;