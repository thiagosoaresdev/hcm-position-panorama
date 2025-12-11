import React from 'react'
import './Header.css'

interface HeaderProps {
  onMenuToggle?: () => void
  isMobile?: boolean
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMobile }) => {
  return (
    <header className="header">
      <div className="header__content">
        <div className="header__left">
          {isMobile && (
            <button 
              className="header__menu-toggle touch-target"
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
            >
              <span className="header__menu-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          )}
          <div className="header__logo">
            <h1 className="header__title">Sistema Quadro de Lotação</h1>
          </div>
        </div>
        
        <div className="header__center">
          {/* Global filters will be added here */}
        </div>
        
        <div className="header__right">
          <div className="header__user-menu">
            <button className="header__user-button touch-target">
              <span className="header__user-avatar">U</span>
              <span className="header__user-name">Usuário</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}