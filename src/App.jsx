import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';
import ChatLayout from './components/Chat/ChatLayout.jsx';
import PrivateRoute from './components/Auth/PrivateRoute.jsx';
import NotificationContainer from './components/Common/NotificationContainer';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationContainer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/chat/*" 
              element={
                <PrivateRoute>
                  <ChatLayout />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/chat" />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 