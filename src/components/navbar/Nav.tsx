"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800 shadow-smooth">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={160}
                  height={60}
                  className="h-12 w-auto hidden dark:block"
                />
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={160}
                  height={60}
                  className="h-12 w-auto block dark:hidden"
                />
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-12 sm:flex sm:items-center sm:space-x-2">
              <Link
                href="/funcionalidades"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Funcionalidades
              </Link>
              <Link
                href="/planes"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Precios
              </Link>
              <Link
                href="/blog"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Blog
              </Link>
              <Link
                href="/contacto"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Contacto
              </Link>
            </div>
          </div>
          
          {/* Right side buttons - Desktop */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <Link
              href="/sign-in"
              className="text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] px-6 py-3 rounded-lg text-lg font-medium border-2 border-[#d5e3df] dark:border-gray-700 hover:border-[#75a99c] dark:hover:border-[#5b9788] transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              className="bg-[#75a99c] hover:bg-[#5b9788] text-white px-6 py-3 rounded-lg text-lg font-bold shadow-card hover:shadow-card-hover transform hover:translate-y-[-1px] transition-all duration-200 border-2 border-[#65998c]"
            >
              Prueba gratuita
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-3 rounded-md text-[#5b9788] hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:text-[#75a99c] dark:hover:text-[#8cbcb0] dark:hover:bg-[#2a3630]/30 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Menu className="h-8 w-8" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800 pb-4 shadow-card">
          <div className="px-4 pt-4 pb-4 space-y-3">
            <Link
              href="/funcionalidades"
              className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            >
              Funcionalidades
            </Link>
            <Link
              href="/planes"
              className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            >
              Precios
            </Link>
            <Link
              href="/blog"
              className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            >
              Blog
            </Link>
            <Link
              href="/contacto"
              className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            >
              Contacto
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-[#d5e3df] dark:border-gray-800">
            <div className="px-4 space-y-3">
              <Link
                href="/sign-in"
                className="block w-full px-5 py-3 text-center text-base font-medium text-gray-800 dark:text-gray-200 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg border-2 border-[#d5e3df] dark:border-gray-700"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/sign-up"
                className="block w-full px-5 py-3 text-center text-base font-bold text-white bg-[#75a99c] hover:bg-[#5b9788] rounded-lg shadow-card border-2 border-[#65998c]"
              >
                Prueba gratuita
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 