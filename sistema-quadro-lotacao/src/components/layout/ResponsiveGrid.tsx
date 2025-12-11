import React, { ReactNode } from 'react'
import './ResponsiveGrid.css'

interface ResponsiveGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4 | 'auto'
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

interface GridItemProps {
  children: ReactNode
  span?: 1 | 2 | 3 | 4 | 'full'
  className?: string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = 4,
  gap = 'md',
  className = ''
}) => {
  const gridClasses = [
    'responsive-grid',
    `responsive-grid--${columns}-cols`,
    `responsive-grid--gap-${gap}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span = 1,
  className = ''
}) => {
  const itemClasses = [
    'grid-item',
    span !== 1 ? `grid-item--span-${span}` : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={itemClasses}>
      {children}
    </div>
  )
}

// Card wrapper component for consistent styling
interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  hover = true
}) => {
  const cardClasses = [
    'responsive-card',
    hover ? 'responsive-card--hover' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses}>
      {children}
    </div>
  )
}