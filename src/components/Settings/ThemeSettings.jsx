import { useTheme } from '../../context/ThemeContext';

export default function ThemeSettings({ onClose }) {
  const { theme: currentTheme, changeTheme, themes } = useTheme();

  const handleThemeChange = (themeId) => {
    changeTheme(themeId);
  };

  return (
    <div className="theme-settings-modal">
      <div className="modal-content">
        <h2>主题设置</h2>
        <div className="theme-list">
          {Object.values(themes).map(theme => (
            <div 
              key={theme.id}
              className={`theme-item ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
            >
              <div 
                className="theme-color" 
                style={{ background: theme.color }}
              />
              <div className="theme-name">{theme.name}</div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
} 