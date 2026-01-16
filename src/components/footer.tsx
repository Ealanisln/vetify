import Link from "next/link"
import packageJson from "../../package.json"

export function Footer() {
  const version = packageJson.version;
  return (
    <footer className="border-t border-border bg-secondary/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">Vetify</span>
            </div>
            <p className="text-sm text-muted-foreground">El software completo para gestionar tu clínica veterinaria.</p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Producto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/funcionalidades" className="text-muted-foreground transition-colors hover:text-foreground">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="/precios" className="text-muted-foreground transition-colors hover:text-foreground">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/actualizaciones" className="text-muted-foreground transition-colors hover:text-foreground">
                  Actualizaciones
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/acerca" className="text-muted-foreground transition-colors hover:text-foreground">
                  Acerca de Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacidad" className="text-muted-foreground transition-colors hover:text-foreground">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <a href="mailto:contacto@vetify.pro" className="text-muted-foreground transition-colors hover:text-foreground">
                  contacto@vetify.pro
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Vetify. Todos los derechos reservados.</p>
          <p className="mt-2 text-xs">v{version}</p>
        </div>
      </div>
    </footer>
  )
}
