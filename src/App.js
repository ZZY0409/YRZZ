import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatRoom from './components/Chat/ChatRoom';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/chat" 
            element={
              <PrivateRoute>
                <ChatRoom />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/chat" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App; 