import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { ResponsiveGrid, GridItem, ResponsiveCard } from './ResponsiveGrid'

// Mock window.innerWidth for responsive tests
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

// Wrapper component for testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('Responsive Layout System', () => {
  beforeEach(() => {
    // Reset to desktop size
    mockInnerWidth(1280)
  })

  describe('AppShell', () => {
    it('renders with header, sidebar, and main content', () => {
      render(
        <TestWrapper>
          <AppShell>
            <div data-testid="main-content">Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('complementary')).toBeInTheDocument() // sidebar
      expect(screen.getByRole('main')).toBeInTheDocument() // main
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('shows menu toggle button on mobile', () => {
      mockInnerWidth(767)
      
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const menuToggle = screen.getByLabelText('Toggle navigation menu')
      expect(menuToggle).toBeInTheDocument()
    })

    it('toggles sidebar on mobile menu click', () => {
      mockInnerWidth(767)
      
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const menuToggle = screen.getByLabelText('Toggle navigation menu')
      const sidebar = screen.getByRole('complementary')

      // Initially closed
      expect(sidebar).not.toHaveClass('sidebar--open')

      // Click to open
      fireEvent.click(menuToggle)
      expect(sidebar).toHaveClass('sidebar--open')

      // Click to close
      fireEvent.click(menuToggle)
      expect(sidebar).not.toHaveClass('sidebar--open')
    })

    it('shows backdrop on mobile when sidebar is open', () => {
      mockInnerWidth(767)
      
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const menuToggle = screen.getByLabelText('Toggle navigation menu')
      
      // Open sidebar
      fireEvent.click(menuToggle)
      
      const backdrop = document.querySelector('.app-shell__backdrop')
      expect(backdrop).toBeInTheDocument()
    })

    it('closes sidebar when backdrop is clicked', () => {
      mockInnerWidth(767)
      
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const menuToggle = screen.getByLabelText('Toggle navigation menu')
      const sidebar = screen.getByRole('complementary')
      
      // Open sidebar
      fireEvent.click(menuToggle)
      expect(sidebar).toHaveClass('sidebar--open')
      
      // Click backdrop
      const backdrop = document.querySelector('.app-shell__backdrop')
      fireEvent.click(backdrop!)
      
      expect(sidebar).not.toHaveClass('sidebar--open')
    })
  })

  describe('ResponsiveGrid', () => {
    it('renders with correct grid classes', () => {
      render(
        <ResponsiveGrid columns={4} gap="md" data-testid="grid">
          <GridItem>Item 1</GridItem>
          <GridItem>Item 2</GridItem>
        </ResponsiveGrid>
      )

      const grid = screen.getByTestId('grid')
      expect(grid).toHaveClass('responsive-grid')
      expect(grid).toHaveClass('responsive-grid--4-cols')
      expect(grid).toHaveClass('responsive-grid--gap-md')
    })

    it('renders grid items with correct classes', () => {
      render(
        <ResponsiveGrid columns={2}>
          <GridItem span={2} data-testid="item-1">Item 1</GridItem>
          <GridItem data-testid="item-2">Item 2</GridItem>
        </ResponsiveGrid>
      )

      const item1 = screen.getByTestId('item-1')
      const item2 = screen.getByTestId('item-2')

      expect(item1).toHaveClass('grid-item')
      expect(item1).toHaveClass('grid-item--span-2')
      expect(item2).toHaveClass('grid-item')
      expect(item2).not.toHaveClass('grid-item--span-2')
    })

    it('applies custom className', () => {
      render(
        <ResponsiveGrid columns={3} className="custom-grid" data-testid="grid">
          <GridItem>Item</GridItem>
        </ResponsiveGrid>
      )

      const grid = screen.getByTestId('grid')
      expect(grid).toHaveClass('custom-grid')
    })
  })

  describe('ResponsiveCard', () => {
    it('renders with default classes', () => {
      render(
        <ResponsiveCard data-testid="card">
          Card Content
        </ResponsiveCard>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('responsive-card')
      expect(card).toHaveClass('responsive-card--hover')
    })

    it('renders without hover when disabled', () => {
      render(
        <ResponsiveCard hover={false} data-testid="card">
          Card Content
        </ResponsiveCard>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('responsive-card')
      expect(card).not.toHaveClass('responsive-card--hover')
    })

    it('applies custom className', () => {
      render(
        <ResponsiveCard className="custom-card" data-testid="card">
          Card Content
        </ResponsiveCard>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })
  })

  describe('Responsive Behavior', () => {
    it('adapts to mobile viewport', () => {
      mockInnerWidth(767)
      
      const { container } = render(
        <ResponsiveGrid columns={4} data-testid="grid">
          <GridItem span={2}>Item 1</GridItem>
          <GridItem>Item 2</GridItem>
        </ResponsiveGrid>
      )

      // Check CSS classes are applied correctly
      const grid = container.querySelector('.responsive-grid--4-cols')
      expect(grid).toBeInTheDocument()
      
      // Grid items should span correctly on mobile (handled by CSS)
      const spanItem = container.querySelector('.grid-item--span-2')
      expect(spanItem).toBeInTheDocument()
    })

    it('adapts to tablet viewport', () => {
      mockInnerWidth(1024)
      
      const { container } = render(
        <ResponsiveGrid columns={4} data-testid="grid">
          <GridItem span={3}>Item 1</GridItem>
          <GridItem>Item 2</GridItem>
        </ResponsiveGrid>
      )

      const grid = container.querySelector('.responsive-grid--4-cols')
      expect(grid).toBeInTheDocument()
      
      const spanItem = container.querySelector('.grid-item--span-3')
      expect(spanItem).toBeInTheDocument()
    })

    it('adapts to desktop viewport', () => {
      mockInnerWidth(1280)
      
      const { container } = render(
        <ResponsiveGrid columns={4} data-testid="grid">
          <GridItem span={4}>Item 1</GridItem>
          <GridItem>Item 2</GridItem>
        </ResponsiveGrid>
      )

      const grid = container.querySelector('.responsive-grid--4-cols')
      expect(grid).toBeInTheDocument()
      
      const spanItem = container.querySelector('.grid-item--span-4')
      expect(spanItem).toBeInTheDocument()
    })
  })

  describe('Touch-friendly Navigation', () => {
    it('applies touch-friendly classes on mobile', () => {
      mockInnerWidth(767)
      
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const menuToggle = screen.getByLabelText('Toggle navigation menu')
      expect(menuToggle).toHaveClass('touch-target')

      const userButton = screen.getByRole('button', { name: /usuário/i })
      expect(userButton).toHaveClass('touch-target')
    })

    it('navigation links have touch-friendly styling', () => {
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveClass('touch-friendly')
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      mockInnerWidth(767)
      
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const menuToggle = screen.getByLabelText('Toggle navigation menu')
      expect(menuToggle).toHaveAttribute('aria-label', 'Toggle navigation menu')
    })

    it('maintains focus management', () => {
      render(
        <TestWrapper>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </TestWrapper>
      )

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      dashboardLink.focus()
      expect(dashboardLink).toHaveFocus()
    })
  })
})