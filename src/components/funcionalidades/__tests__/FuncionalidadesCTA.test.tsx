import { render, screen } from '@testing-library/react'
import { FuncionalidadesCTA } from '../FuncionalidadesCTA'

describe('FuncionalidadesCTA', () => {
  it('renders the main headline', () => {
    render(<FuncionalidadesCTA />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Empieza sin riesgo')
  })

  it('renders all benefit items', () => {
    render(<FuncionalidadesCTA />)

    expect(screen.getByText('30 días gratis')).toBeInTheDocument()
    expect(screen.getByText('No necesitas tarjeta')).toBeInTheDocument()
    expect(screen.getByText('Cancela cuando quieras')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<FuncionalidadesCTA />)

    expect(screen.getByText(/Vetify está diseñado para crecer contigo/i)).toBeInTheDocument()
    expect(screen.getByText(/hacer tu día a día más simple/i)).toBeInTheDocument()
  })

  it('renders the CTA button with correct text', () => {
    render(<FuncionalidadesCTA />)

    const ctaButton = screen.getByRole('link', { name: /Comenzar prueba gratis/i })
    expect(ctaButton).toBeInTheDocument()
  })

  it('has correct link to registration', () => {
    render(<FuncionalidadesCTA />)

    const ctaLink = screen.getByRole('link', { name: /Comenzar prueba gratis/i })
    expect(ctaLink).toHaveAttribute('href', '/api/auth/register')
  })
})
