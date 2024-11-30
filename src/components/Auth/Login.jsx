import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import CatAnimation from '../Common/CatAnimation';
import ThemeSettings from '../Settings/ThemeSettings';
import { useTheme } from '../../context/ThemeContext';
import SocialLinks from '../Common/SocialLinks';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      setError('登录失败: ' + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
      navigate('/chat');
    } catch (err) {
      setError('Google登录失败: ' + err.message);
    }
  };

  return (
    <div className={`login-container theme-${theme}`}>
      <CatAnimation theme={theme} />
      <SocialLinks />
      <button 
        className="theme-btn"
        onClick={() => setShowSettings(true)}
        title="更换主题"
      >
        <span className="theme-icon">🎨</span>
        <span className="theme-tooltip">更换主题</span>
      </button>
      <h2>登录</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>邮箱:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>密码:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">登录</button>
      </form>
      <div className="auth-links">
        <p>还没有账号？ <Link to="/register">立即注册</Link></p>
      </div>
      <div className="social-login">
        <button onClick={handleGoogleLogin} className="google-btn">
          使用Google登录
        </button>
      </div>
      {showSettings && (
        <ThemeSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
} 