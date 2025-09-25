import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Login from '../src/components/pages/login';
import Signup from '../src/components/pages/sign-up';
import Dashboard from '../src/components/pages/dashboard';
import ProtectedRoute from './utils/ProtectedRoutes';

const App = () => {
    return (

        <BrowserRouter>
            <Routes>
                {/* Pages accessibles sans être connecté */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/sign-up" element={<Signup />} />

                {/* Routes protégées */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;