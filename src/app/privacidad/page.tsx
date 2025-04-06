'use client';

import React from 'react';
import { Shield, Lock, UserCheck, FileText } from 'lucide-react';
import Image from 'next/image';

const PrivacyPolicyPage = () => {
  return (
    <main className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vetify-accent-50 to-white dark:from-gray-800 dark:to-gray-900 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Políticas de <span className="text-vetify-accent-500 dark:text-vetify-accent-300">Privacidad</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              En Vetify, nos comprometemos a proteger tu información personal al registrarte en nuestra lista de espera.
            </p>
          </div>

          <div className="relative mt-12 max-w-4xl mx-auto">
            <div className="">
              <div className="absolute inset-0 bg-gradient-to-br from-vetify-accent-500/30 to-transparent dark:from-vetify-accent-500/10 z-0 opacity-30"></div>
              <div className="relative z-10">
                <Image
                  src="/policy/privacy-policy.png"
                  alt="Privacidad y seguridad en Vetify"
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
              Nuestros <span className="text-vetify-accent-500 dark:text-vetify-accent-300">Principios</span> de Privacidad
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Tu confianza es nuestra prioridad. Nos basamos en estos principios para proteger tus datos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <PrivacyCard
              icon={<Shield className="h-6 w-6 text-blue-600" />}
              title="Protección Integral"
              description="Salvaguardamos tus datos con los más altos estándares de seguridad."
              accent="bg-blue-50 dark:bg-blue-900/20"
            />
            <PrivacyCard
              icon={<Lock className="h-6 w-6 text-emerald-600" />}
              title="Encriptación Avanzada"
              description="Utilizamos tecnología de encriptación de punta para proteger toda la información sensible."
              accent="bg-emerald-50 dark:bg-emerald-900/20"
            />
            <PrivacyCard
              icon={<UserCheck className="h-6 w-6 text-amber-600" />}
              title="Control de Acceso"
              description="Implementamos estrictas medidas de control de acceso a tus datos personales."
              accent="bg-amber-50 dark:bg-amber-900/20"
            />
            <PrivacyCard
              icon={<FileText className="h-6 w-6 text-purple-600" />}
              title="Transparencia Total"
              description="Te informamos claramente sobre cómo usamos los datos y nunca los compartimos sin tu consentimiento."
              accent="bg-purple-50 dark:bg-purple-900/20"
            />
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <PolicySection
            title="1. INTRODUCCIÓN"
            content={`
              <p><strong>Vetify</strong> ("nosotros", "nuestro", "la Compañía") se compromete a proteger la privacidad de los usuarios que se registran en nuestra lista de espera. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos su información personal cuando se registra en nuestra lista de espera a través de nuestro sitio web.</p>
              <p>Al proporcionarnos sus datos personales y aceptar esta Política de Privacidad, usted nos da su consentimiento para procesar sus datos de acuerdo con los términos descritos en este documento.</p>
            `}
          />

          <PolicySection
            title="2. INFORMACIÓN QUE RECOPILAMOS"
            content={`
              <p>Cuando se registra en nuestra lista de espera, recopilamos la siguiente información:</p>
              <ul>
                <li>Dirección de correo electrónico</li>
              </ul>
            `}
          />

          <PolicySection
            title="3. CÓMO UTILIZAMOS SU INFORMACIÓN"
            content={`
              <p>Utilizamos la información que recopilamos para:</p>
              <ul>
                <li>Gestionar su registro en nuestra lista de espera</li>
                <li>Comunicarnos con usted sobre actualizaciones, noticias y lanzamientos de nuestra plataforma</li>
                <li>Enviar información promocional cuando nuestro servicio sea lanzado a producción</li>
                <li>Cumplir con nuestras obligaciones legales</li>
              </ul>
            `}
          />

          <PolicySection
            title="4. BASE LEGAL PARA EL PROCESAMIENTO"
            content={`
              <p>Procesamos sus datos personales basándonos en las siguientes bases legales:</p>
              <ul>
                <li><strong>Consentimiento:</strong> Usted ha dado su consentimiento para el procesamiento de sus datos personales.</li>
                <li><strong>Interés legítimo:</strong> El procesamiento es necesario para nuestros intereses legítimos, como informarle sobre el lanzamiento de nuestra plataforma.</li>
                <li><strong>Obligación legal:</strong> El procesamiento es necesario para cumplir con una obligación legal.</li>
              </ul>
            `}
          />

          <PolicySection
            title="5. ALMACENAMIENTO Y SEGURIDAD DE DATOS"
            content={`
              <p>Sus datos personales se almacenan en servidores seguros proporcionados por Pocketbase con SSL. Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos contra acceso no autorizado, pérdida o alteración.</p>
              <p>Conservaremos sus datos personales por un período de 180 días, o según lo requiera la ley aplicable de México.</p>
            `}
          />

          <PolicySection
            title="6. COMPARTIR SUS DATOS PERSONALES"
            content={`
              <p>No vendemos, alquilamos ni compartimos su información personal con terceros, excepto en las siguientes circunstancias:</p>
              <ul>
                <li>Con proveedores de servicios que nos ayudan a operar nuestro negocio (como proveedores de hosting, servicios de email marketing)</li>
                <li>Si estamos obligados por ley a hacerlo</li>
              </ul>
            `}
          />

          <PolicySection
            title="7. SUS DERECHOS"
            content={`
              <p>De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México, usted tiene los siguientes derechos con respecto a sus datos personales (Derechos ARCO):</p>
              <ul>
                <li><strong>Derecho de Acceso:</strong> conocer qué datos personales tenemos de usted</li>
                <li><strong>Derecho de Rectificación:</strong> solicitar la corrección de sus datos personales</li>
                <li><strong>Derecho de Cancelación:</strong> solicitar la eliminación de sus datos de nuestros registros</li>
                <li><strong>Derecho de Oposición:</strong> oponerse al uso de sus datos personales para fines específicos</li>
              </ul>
              <p>Para ejercer cualquiera de estos derechos, por favor contáctenos a través de info@vetify.pro.</p>
            `}
          />

          <PolicySection
            title="8. COOKIES Y TECNOLOGÍAS SIMILARES"
            content={`
              <p>Nuestro sitio web utiliza cookies y tecnologías similares para mejorar su experiencia. Puede administrar sus preferencias de cookies a través de la configuración de su navegador.</p>
            `}
          />

          <PolicySection
            title="9. CAMBIOS A ESTA POLÍTICA"
            content={`
              <p>Podemos actualizar esta Política de Privacidad ocasionalmente. Publicaremos cualquier cambio en esta página y, si los cambios son significativos, proporcionaremos un aviso más prominente.</p>
            `}
          />

          <PolicySection
            title="10. CONTACTO"
            content={`
              <p>Si tiene preguntas o inquietudes sobre esta Política de Privacidad o sobre cómo manejamos sus datos personales, por favor contáctenos a:</p>
              <ul>
                <li>Email: info@vetify.pro</li>
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
              ¿Tienes preguntas sobre nuestra política de privacidad?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Nuestro equipo está disponible para responder cualquier duda que tengas sobre cómo protegemos tu información.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:info@vetify.pro"
                className="inline-flex items-center justify-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all"
              >
                Contactar al equipo de privacidad
              </a>
              {/* <a
                href="/registro"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl text-gray-800 dark:text-white font-medium transition-all"
              >
                Comenzar prueba gratuita
              </a> */}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

interface PrivacyCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const PrivacyCard: React.FC<PrivacyCardProps> = ({ icon, title, description, accent }) => {
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

interface PolicySectionProps {
  title: string;
  content: string;
}

const PolicySection: React.FC<PolicySectionProps> = ({ title, content }) => {
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

export default PrivacyPolicyPage;
