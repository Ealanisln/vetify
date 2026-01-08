"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { getVersionString } from '@/lib/version';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-vetify-slate-800 border-t border-vetify-primary-100 dark:border-vetify-slate-700 shadow-smooth">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo/capybara-green.png"
                alt="Vetify"
                width={120}
                height={45}
                className="h-9 w-auto"
              />
              <span className="text-xl font-semibold text-vetify-primary-500 dark:text-vetify-surface-light">Vetify</span>
            </Link>
            <p className="text-sm text-vetify-primary-500 dark:text-vetify-surface-light mt-2">
              Solución completa para la gestión de tu clínica veterinaria.
            </p>
            
            {/* Redes sociales */}
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-vetify-primary-400 hover:text-vetify-accent-500 dark:text-vetify-surface-light dark:hover:text-vetify-accent-300">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-vetify-primary-400 hover:text-vetify-accent-500 dark:text-vetify-surface-light dark:hover:text-vetify-accent-300">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-vetify-primary-400 hover:text-vetify-accent-500 dark:text-vetify-surface-light dark:hover:text-vetify-accent-300">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Navegación */}
          <div>
            <h3 className="text-sm font-semibold text-vetify-primary-400 dark:text-vetify-surface-light tracking-wider uppercase">Producto</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/funcionalidades" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="/planes" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/actualizaciones" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Actualizaciones
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-vetify-primary-400 dark:text-vetify-surface-light tracking-wider uppercase">Soporte</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/ayuda" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link href="/documentacion" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Documentación
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/demos" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Solicitar demo
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-vetify-primary-400 dark:text-vetify-surface-light tracking-wider uppercase">Empresa</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/nosotros" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-base text-vetify-primary-700 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                  Términos de servicio
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Separador */}
        <div className="mt-8 pt-8 border-t border-vetify-primary-100 dark:border-vetify-slate-700">
          <div className="flex flex-col md:flex-row justify-between">
            <p className="text-xs text-vetify-primary-400 dark:text-vetify-surface-light">
              &copy; {currentYear} Vetify. Todos los derechos reservados.
              <span className="ml-2 text-vetify-primary-300 dark:text-vetify-slate-500">
                {getVersionString()}
              </span>
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link href="/privacidad" className="text-xs text-vetify-primary-400 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                Privacidad
              </Link>
              <Link href="/terminos" className="text-xs text-vetify-primary-400 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                Términos
              </Link>
              <Link href="/cookies" className="text-xs text-vetify-primary-400 dark:text-vetify-surface-light hover:text-vetify-accent-600 dark:hover:text-vetify-accent-300 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
