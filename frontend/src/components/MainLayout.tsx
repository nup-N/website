import React from 'react';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <div className="background-overlay"></div>
      <div className="content-card">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;

