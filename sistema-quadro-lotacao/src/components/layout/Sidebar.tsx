import React from 'react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'

interface SidebarProps {
  isOpen?: boolean
  isMobile?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = false, 
  isMobile = false, 
  onClose 
}) => {
  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊'
    },
    {
      path: '/quadro',
      label: 'Quadro de Lotação',
      icon: '👥'
    },
    {
      path: '/normalizacao',
      label: 'Normalização',
      icon: '🔄'
    },
    {
      path: '/propostas',
      label: 'Propostas',
      icon: '📝'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: '📈'
    }
  ]

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (isMobile && onClose) {
      onClose()
    }
  }

  const sidebarClasses = [
    'sidebar',
    isMobile && isOpen ? 'sidebar--open' : '',
    isMobile ? 'sidebar--mobile' : ''
  ].filter(Boolean).join(' ')

  return (
    <aside className={sidebarClasses}>
      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar__menu-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__menu-link touch-friendly ${isActive ? 'sidebar__menu-link--active' : ''}`
                }
                onClick={handleLinkClick}
              >
                <span className="sidebar__menu-icon">{item.icon}</span>
                <span className="sidebar__menu-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}