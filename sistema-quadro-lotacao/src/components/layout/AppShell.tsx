import React, { ReactNode, useState, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import './AppShell.css'

interface AppShellProps {
  children: ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-close sidebar on mobile when resizing to mobile
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }

    // Initial check
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [isSidebarOpen])

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Handle backdrop click on mobile
  const handleBackdropClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="app-shell">
      <Header 
        onMenuToggle={toggleSidebar}
        isMobile={isMobile}
      />
      <div className="app-shell__body">
        <Sidebar 
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onClose={() => setIsSidebarOpen(false)}
        />
        {isMobile && isSidebarOpen && (
          <div 
            className="app-shell__backdrop"
            onClick={handleBackdropClick}
          />
        )}
        <main className="app-shell__main">
          <div className="app-shell__content">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}