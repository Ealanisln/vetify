import { render, screen } from '@testing-library/react'
import { FeatureDetailCard } from '../FeatureDetailCard'

const mockProps = {
  iconName: 'calendar' as const,
  title: 'Gestión de Citas',
  problem: 'Citas perdidas y dobles reservas.',
  solutions: [
    'Agenda visual con vista por día',
    'Estados de citas claros',
    'Historial de citas por mascota',
  ],
  benefit: 'Menos cancelaciones y más control.',
}

describe('FeatureDetailCard', () => {
  it('renders the feature title', () => {
    render(<FeatureDetailCard {...mockProps} />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Gestión de Citas')
  })

  it('renders the problem section', () => {
    render(<FeatureDetailCard {...mockProps} />)

    expect(screen.getByText('Problema común')).toBeInTheDocument()
    expect(screen.getByText('Citas perdidas y dobles reservas.')).toBeInTheDocument()
  })

  it('renders all solutions', () => {
    render(<FeatureDetailCard {...mockProps} />)

    expect(screen.getByText('Cómo te ayuda Vetify:')).toBeInTheDocument()
    expect(screen.getByText('Agenda visual con vista por día')).toBeInTheDocument()
    expect(screen.getByText('Estados de citas claros')).toBeInTheDocument()
    expect(screen.getByText('Historial de citas por mascota')).toBeInTheDocument()
  })

  it('renders the benefit section', () => {
    render(<FeatureDetailCard {...mockProps} />)

    expect(screen.getByText('Beneficio clave')).toBeInTheDocument()
    expect(screen.getByText('Menos cancelaciones y más control.')).toBeInTheDocument()
  })

  it('renders image when provided', () => {
    const propsWithImage = {
      ...mockProps,
      image: '/images/marketing/test.png',
      imageAlt: 'Test image alt',
    }
    render(<FeatureDetailCard {...propsWithImage} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('alt', 'Test image alt')
  })

  it('renders placeholder when no image is provided', () => {
    render(<FeatureDetailCard {...mockProps} />)

    // Should not have an img element when no image is provided
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('applies reversed layout when reversed prop is true', () => {
    const { container } = render(<FeatureDetailCard {...mockProps} reversed />)

    // Check that the grid has the reversed flow class
    const grid = container.querySelector('.lg\\:grid-flow-dense')
    expect(grid).toBeInTheDocument()
  })

  it('does not apply reversed layout by default', () => {
    const { container } = render(<FeatureDetailCard {...mockProps} />)

    // Grid should not have reversed flow class
    const grid = container.querySelector('.lg\\:grid-flow-dense')
    expect(grid).not.toBeInTheDocument()
  })
})
