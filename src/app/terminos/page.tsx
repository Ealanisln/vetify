import React from 'react';
import { Scale, Briefcase, FileCheck, BookOpen } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio | Vetify',
  description: 'Conozca nuestros términos de servicio y las condiciones de uso de nuestra plataforma.',
};

export default function TermsOfServicePage() {
  return (
    <main className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vetify-accent-50 to-white dark:from-gray-800 dark:to-gray-900 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Términos de <span className="text-vetify-accent-500 dark:text-vetify-accent-300">Servicio</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Conoce las condiciones bajo las cuales ofrecemos nuestros servicios en Vetify.
            </p>
          </div>

          <div className="relative mt-12 max-w-4xl mx-auto">
            <div className="">
              <div className="absolute inset-0 bg-gradient-to-br from-vetify-accent-500/30 to-transparent dark:from-vetify-accent-500/10 z-0 opacity-30"></div>
              <div className="relative z-10">
                <Image
                  src="/policy/terms-of-service.png"
                  alt="Términos de servicio en Vetify"
                  width={1200}
                  height={675}
                  className="rounded-lg w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 lg:w-32 lg:h-32 bg-vetify-accent-100 dark:bg-vetify-accent-900/30 rounded-full blur-2xl z-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Points Section */}
      <section className="py-12 lg:py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Nuestros <span className="text-vetify-accent-500 dark:text-vetify-accent-300">Principios</span> Fundamentales
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Estos principios guían nuestra relación con los usuarios y clientes de nuestra plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <TermsCard
              icon={<Scale className="h-6 w-6 text-indigo-600" />}
              title="Transparencia"
              description="Comunicamos de forma clara las condiciones de nuestros servicios."
              accent="bg-indigo-50 dark:bg-indigo-900/20"
            />
            <TermsCard
              icon={<Briefcase className="h-6 w-6 text-rose-600" />}
              title="Responsabilidad"
              description="Cumplimos con nuestras obligaciones y esperamos lo mismo de nuestros usuarios."
              accent="bg-rose-50 dark:bg-rose-900/20"
            />
            <TermsCard
              icon={<FileCheck className="h-6 w-6 text-teal-600" />}
              title="Cumplimiento Legal"
              description="Operamos en estricto apego a las leyes y regulaciones aplicables."
              accent="bg-teal-50 dark:bg-teal-900/20"
            />
            <TermsCard
              icon={<BookOpen className="h-6 w-6 text-orange-600" />}
              title="Claridad"
              description="Presentamos nuestros términos en un lenguaje comprensible y accesible."
              accent="bg-orange-50 dark:bg-orange-900/20"
            />
          </div>
        </div>
      </section>

      {/* Terms of Service Content */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <TermsSection
            title="1. INTRODUCCIÓN"
            content={`
              <p>Estos Términos y Condiciones del Servicio ("Términos") rigen su acceso y uso de la lista de espera y servicios futuros proporcionados por <strong>Vetify</strong> ("nosotros", "nuestro", "la Compañía"). Al registrarse en nuestra lista de espera o utilizar nuestros servicios, usted acepta estos Términos.</p>
              <p>Por favor, lea estos Términos cuidadosamente antes de registrarse en nuestra lista de espera. Si no está de acuerdo con estos Términos, no debe registrarse ni utilizar nuestros servicios.</p>
            `}
          />

          <TermsSection
            title="2. DESCRIPCIÓN DEL SERVICIO"
            content={`
              <p>Actualmente, Vetify ofrece un registro en lista de espera para usuarios interesados en nuestros futuros servicios. Al registrarse, usted proporciona su dirección de correo electrónico para recibir actualizaciones sobre el lanzamiento de nuestros servicios y otras comunicaciones relacionadas con Vetify.</p>
            `}
          />

          <TermsSection
            title="3. ELEGIBILIDAD"
            content={`
              <p>Para registrarse en nuestra lista de espera, usted debe:</p>
              <ul>
                <li>Tener al menos 18 años de edad o la mayoría de edad legal en su jurisdicción (lo que sea mayor)</li>
                <li>Proporcionar información precisa y completa</li>
                <li>Aceptar nuestra Política de Privacidad</li>
                <li>Cumplir con estos Términos y todas las leyes aplicables</li>
              </ul>
            `}
          />

          <TermsSection
            title="4. REGISTRO EN LA LISTA DE ESPERA"
            content={`
              <p>Al registrarse en nuestra lista de espera:</p>
              <ul>
                <li>Usted acepta recibir comunicaciones electrónicas de Vetify relacionadas con nuestros servicios</li>
                <li>Usted es responsable de mantener la confidencialidad de su información</li>
                <li>Usted se compromete a notificarnos de inmediato si hay algún uso no autorizado de su registro</li>
                <li>Vetify se reserva el derecho de eliminar su registro de la lista de espera si consideramos que ha violado estos Términos</li>
              </ul>
            `}
          />

          <TermsSection
            title="5. COMUNICACIONES"
            content={`
              <p>Al registrarse en nuestra lista de espera, usted acepta recibir comunicaciones electrónicas de Vetify, que pueden incluir:</p>
              <ul>
                <li>Actualizaciones sobre el desarrollo de nuestros servicios</li>
                <li>Notificaciones sobre el lanzamiento de nuestros servicios</li>
                <li>Información sobre ofertas, promociones o eventos relacionados con Vetify</li>
              </ul>
              <p>Puede optar por no recibir estas comunicaciones en cualquier momento siguiendo las instrucciones de cancelación de suscripción incluidas en cada comunicación.</p>
            `}
          />

          <TermsSection
            title="6. PROPIEDAD INTELECTUAL"
            content={`
              <p>Todo el contenido, diseño, gráficos, compilación, información, datos, código informático, productos, servicios y todos los demás elementos de nuestro sitio web y servicios están protegidos por las leyes de derechos de autor, marcas registradas y otros derechos de propiedad intelectual. Estos elementos son propiedad exclusiva de Vetify o de nuestros licenciantes.</p>
              <p>Usted no puede reproducir, distribuir, modificar, crear trabajos derivados, exhibir públicamente, realizar públicamente, republicar, descargar, almacenar o transmitir cualquier material de nuestro sitio web, excepto según lo permitido por estos Términos.</p>
            `}
          />

          <TermsSection
            title="7. LIMITACIÓN DE RESPONSABILIDAD"
            content={`
              <p>En la medida permitida por la ley aplicable, Vetify no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, o cualquier pérdida de beneficios o ingresos, ya sea incurrida directa o indirectamente, o cualquier pérdida de datos, uso, fondo de comercio u otras pérdidas intangibles, resultantes de:</p>
              <ul>
                <li>Su acceso o uso o incapacidad para acceder o usar nuestros servicios</li>
                <li>Cualquier conducta o contenido de terceros en nuestros servicios</li>
                <li>Acceso no autorizado, uso o alteración de su información</li>
              </ul>
            `}
          />

          <TermsSection
            title="8. MODIFICACIONES DE LOS TÉRMINOS"
            content={`
              <p>Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si realizamos cambios materiales a estos Términos, haremos esfuerzos razonables para notificarle, como enviar un correo electrónico a la dirección asociada con su registro o publicar un aviso en nuestro sitio web.</p>
              <p>Su uso continuado de nuestros servicios después de que los Términos modificados entren en vigor constituirá su aceptación de los nuevos Términos.</p>
            `}
          />

          <TermsSection
            title="9. TERMINACIÓN"
            content={`
              <p>Podemos terminar o suspender su acceso a nuestros servicios inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, sin limitación, si usted incumple estos Términos.</p>
              <p>Todas las disposiciones de estos Términos que, por su naturaleza, deberían sobrevivir a la terminación, sobrevivirán a la terminación, incluyendo, sin limitación, disposiciones de propiedad, renuncias de garantía y limitaciones de responsabilidad.</p>
            `}
          />

          <TermsSection
            title="10. LEY APLICABLE"
            content={`
              <p>Estos Términos se regirán e interpretarán de acuerdo con las leyes de México, sin dar efecto a ningún principio de conflicto de leyes.</p>
            `}
          />

          <TermsSection
            title="11. RESOLUCIÓN DE DISPUTAS"
            content={`
              <p>Cualquier disputa que surja de o en relación con estos Términos, incluyendo cualquier cuestión respecto a su existencia, validez o terminación, será sometida a los tribunales competentes en México.</p>
            `}
          />

          <TermsSection
            title="12. DIVISIBILIDAD"
            content={`
              <p>Si alguna disposición de estos Términos se considera inválida, ilegal o inaplicable por cualquier razón por un tribunal de jurisdicción competente, dicha disposición se eliminará o limitará al mínimo de manera que las disposiciones restantes de estos Términos continuarán en pleno vigor y efecto.</p>
            `}
          />

          <TermsSection
            title="13. CONTACTO"
            content={`
              <p>Si tiene alguna pregunta sobre estos Términos, por favor contáctenos a:</p>
              <ul>
                <li>Email: <a href="mailto:legal@vetify.pro">legal@vetify.pro</a></li>
              </ul>
              <p>Última actualización: 5 de abril de 2025</p>
            `}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              ¿Tienes preguntas sobre nuestros términos de servicio?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Nuestro equipo legal está disponible para aclarar cualquier duda que tengas sobre nuestros términos y condiciones.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:legal@vetify.pro"
                className="inline-flex items-center justify-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all"
              >
                Contactar al equipo legal
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

interface TermsCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const TermsCard: React.FC<TermsCardProps> = ({ icon, title, description, accent }) => {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`p-3 rounded-full mb-4 inline-flex ${accent}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
    </div>
  );
};

interface TermsSectionProps {
  title: string;
  content: string;
}

const TermsSection: React.FC<TermsSectionProps> = ({ title, content }) => {
  return (
    <div className="mb-12 last:mb-0">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div 
        className="prose prose-gray dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </div>
  );
}; 