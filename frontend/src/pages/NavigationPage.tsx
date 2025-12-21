import React from 'react';
import { useNavigate } from 'react-router-dom';
import { profileConfig } from '../config/profile';
import './NavigationPage.css';
import './LoginPage.css';

const NavigationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    // 触发认证状态更新事件
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const handleNavigationClick = (url: string) => {
    // 获取统一认证的token
    const token = localStorage.getItem('access_token');
    
    // 如果有token，将其作为URL参数传递
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      const urlWithToken = `${url}${separator}token=${encodeURIComponent(token)}`;
      window.open(urlWithToken, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  // 系统链接列表
  const systemLinks = [
    {
      name: 'Nnup の Nacigation',
      url: 'http://localhost:5174', // navigation系统的前端地址
    },
    // 后续可以在这里添加更多系统链接
  ];

  return (
    <div style={styles.container} className="navigation-container">
      <div style={styles.leftSection} className="navigation-left-section">
        <div style={styles.avatarContainer} className="navigation-avatar-container">
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
      
      <div style={styles.rightSection} className="navigation-right-section">
        <div style={styles.rightContent} className="right-content">
          {/* 系统链接区域 */}
          <div style={styles.linksSection} className="links-section">
            <div style={styles.header}>
              <h1 style={styles.title}>Nnup の Website</h1>
              <button onClick={handleLogout} style={styles.logoutButton}>
                退出登录
              </button>
            </div>
            
            <div style={styles.linksContainer}>
              {systemLinks.map((link, index) => (
                <div
                  key={index}
                  style={styles.linkItem}
                  className="link-item"
                  onClick={() => handleNavigationClick(link.url)}
                >
                  <span style={styles.linkText} className="link-text">{link.name}</span>
                  <span style={styles.linkArrow} className="link-arrow">→</span>
                </div>
              ))}
            </div>
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
  linksSection: {
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  title: {
    textAlign: 'left' as const,
    margin: 0,
    color: '#1f2937',
    fontSize: '32px',
    fontWeight: 'bold' as const,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  linksContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  linkItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  linkText: {
    fontSize: '18px',
    fontWeight: '500' as const,
    color: '#1f2937',
  },
  linkArrow: {
    fontSize: '20px',
    color: '#6b7280',
    transition: 'transform 0.2s',
  },
};

export default NavigationPage;
