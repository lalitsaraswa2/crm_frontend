

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './componts/Home';
import Login from './componts/Login';
import Signup from './componts/Signup';
import Layout from './componts/app/Layout'
import  Dashboard from './componts/app/Dashborad';
import Coustmer from './componts/app/Coustmer';
import Log from './componts/app/Log';
import { ToastContainer,} from 'react-toastify';

function AppRouter() {
  return (
    <Router>
    <Routes>
      {/* Public Routes */}

      <Route path="/" element={<Home />} />
            
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Nested Routes under /app */}
      <Route path="/app" element={<Layout />}>
  <Route path="dashborad" element={<Dashboard />} />
  <Route path="customer" element={<Coustmer />} />
  <Route path="log" element={<Log />} />
</Route>

    </Routes>
    <ToastContainer/>
  </Router>
  );
}

export default AppRouter
