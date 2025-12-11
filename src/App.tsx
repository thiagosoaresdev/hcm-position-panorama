import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/modules/dashboard/Dashboard'
import './App.css'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Additional routes will be added as modules are implemented */}
      </Routes>
    </AppShell>
  )
}

export default App