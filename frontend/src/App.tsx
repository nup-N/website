import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UsersPage from './pages/UsersPage';

/**
 * 应用程序主组件
 * 
 * 配置路由系统，定义应用的页面导航结构
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 根路径重定向到登录页 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 认证相关路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 用户管理路由 */}
        <Route path="/users" element={<UsersPage />} />
        
        {/* 未匹配路由重定向到登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;