import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './components/AuthScreen';
import { useEffect, useState } from 'react';

import App from './App.tsx';


function Need() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        if (token) setIsAuthenticated(true);
    }, []);

    return (
        <Router>
            <Routes>
                {/* If not authenticated, show AuthScreen, else show Home */}
                <Route path="/" element={isAuthenticated ? <App /> : <Navigate to="/auth" />} />
                <Route path="/auth" element={<AuthScreen />} />
            </Routes>
        </Router>
    );
}

export default Need;
