import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Workspace from './pages/Workspace';
import Register from './pages/Register'; // Agregar el componente Register
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DndProvider backend={HTML5Backend}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} /> {/* Ruta para registro */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/proyecto/:idProyecto" element={<PrivateRoute><Workspace /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </DndProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
