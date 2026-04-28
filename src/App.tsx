/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import AdminPortal from './components/AdminPortal';
import { LayoutDashboard, UserPlus } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Routes>
          <Route path="/" element={<RegistrationForm />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Floating Navigation for demo/dev */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 group">
          <Link 
            to="/admin" 
            className="w-12 h-12 bg-white text-[#002D62] rounded-full shadow-2xl flex items-center justify-center border border-slate-100 hover:bg-[#002D62] hover:text-white transition-all scale-0 group-hover:scale-100 mb-2"
            title="Admin Portal"
          >
            <LayoutDashboard className="w-5 h-5" />
          </Link>
          <Link 
            to="/" 
            className="w-14 h-14 bg-[#002D62] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-all"
            title="Registration Form"
          >
            <UserPlus className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </BrowserRouter>
  );
}
