import { render, screen } from '@testing-library/react'
import { FuncionalidadesHero } from '../FuncionalidadesHero'

describe('FuncionalidadesHero', () => {
  it('renders the main headline', () => {
    render(<FuncionalidadesHero />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Funcionalidades de Vetify')
  })

  it('renders the subheadline about small veterinary clinics', () => {
    render(<FuncionalidadesHero />)

    expect(screen.getByText(/Pensado para veterinarias pequeñas/i)).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<FuncionalidadesHero />)

    expect(screen.getByText(/Vetify reúne en un solo lugar/i)).toBeInTheDocument()
    expect(screen.getByText(/sin Excel, libretas ni sistemas complicados/i)).toBeInTheDocument()
  })
})
