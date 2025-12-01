import Link from 'next/link';
import { Mail, Shield, Lock, Eye, FileText, Users, Server, RefreshCw } from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="text-muted-foreground space-y-4 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function Privacidad() {
  const lastUpdated = '1 de diciembre de 2025';

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-6">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6">
            Política de <span className="text-primary">Privacidad</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Última actualización: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-xl shadow-lg p-8 md:p-10 border border-border">

            {/* Introducción */}
            <div className="mb-12 pb-8 border-b border-border">
              <p className="text-muted-foreground leading-relaxed">
                En <strong className="text-foreground">Vetify</strong>, nos comprometemos a proteger tu privacidad
                y tus datos personales. Este Aviso de Privacidad describe cómo recopilamos, utilizamos,
                almacenamos y protegemos tu información de conformidad con la Ley Federal de Protección
                de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
              </p>
            </div>

            <Section icon={<Users className="h-5 w-5" />} title="1. Responsable del Tratamiento">
              <p>
                <strong className="text-foreground">Vetify</strong> es responsable del tratamiento de tus datos personales,
                con domicilio en México y correo electrónico de contacto:{' '}
                <a href="mailto:contacto@vetify.pro" className="text-primary hover:underline">
                  contacto@vetify.pro
                </a>
              </p>
            </Section>

            <Section icon={<FileText className="h-5 w-5" />} title="2. Datos Personales Recopilados">
              <p>Para brindarte nuestros servicios, podemos recopilar los siguientes datos personales:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong className="text-foreground">Datos de identificación:</strong> nombre completo, correo electrónico, número telefónico</li>
                <li><strong className="text-foreground">Datos de la clínica:</strong> nombre del establecimiento, dirección, RFC (opcional)</li>
                <li><strong className="text-foreground">Datos de acceso:</strong> credenciales de inicio de sesión, historial de actividad en la plataforma</li>
                <li><strong className="text-foreground">Datos de facturación:</strong> información de pago procesada de forma segura a través de Stripe</li>
                <li><strong className="text-foreground">Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, cookies</li>
              </ul>
              <p className="mt-4">
                <strong className="text-foreground">No recopilamos datos sensibles</strong> como origen étnico, estado de salud,
                creencias religiosas o preferencias sexuales.
              </p>
            </Section>

            <Section icon={<Eye className="h-5 w-5" />} title="3. Finalidades del Tratamiento">
              <p>Utilizamos tus datos personales para las siguientes finalidades:</p>

              <p className="mt-4"><strong className="text-foreground">Finalidades primarias (necesarias):</strong></p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Crear y administrar tu cuenta de usuario</li>
                <li>Proporcionar los servicios de gestión veterinaria contratados</li>
                <li>Procesar pagos y facturación</li>
                <li>Brindar soporte técnico y atención al cliente</li>
                <li>Cumplir con obligaciones legales y fiscales</li>
              </ul>

              <p className="mt-4"><strong className="text-foreground">Finalidades secundarias (opcionales):</strong></p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Enviar comunicaciones sobre actualizaciones del servicio</li>
                <li>Realizar encuestas de satisfacción</li>
                <li>Mejorar nuestros productos y servicios</li>
              </ul>
              <p className="mt-4">
                Puedes oponerte al tratamiento de tus datos para finalidades secundarias
                contactándonos a <a href="mailto:contacto@vetify.pro" className="text-primary hover:underline">contacto@vetify.pro</a>.
              </p>
            </Section>

            <Section icon={<Lock className="h-5 w-5" />} title="4. Cookies y Tecnologías de Rastreo">
              <p>
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia en nuestra plataforma:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong className="text-foreground">Cookies esenciales:</strong> necesarias para el funcionamiento del sitio y la autenticación</li>
                <li><strong className="text-foreground">Cookies de rendimiento:</strong> nos ayudan a entender cómo utilizas la plataforma</li>
                <li><strong className="text-foreground">Cookies de funcionalidad:</strong> recuerdan tus preferencias (tema, idioma)</li>
              </ul>
              <p className="mt-4">
                Puedes gestionar las cookies desde la configuración de tu navegador. Ten en cuenta que
                desactivar ciertas cookies puede afectar la funcionalidad de la plataforma.
              </p>
            </Section>

            <Section icon={<Users className="h-5 w-5" />} title="5. Transferencia de Datos">
              <p>
                Podemos compartir tus datos personales con los siguientes terceros para cumplir
                con las finalidades descritas:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong className="text-foreground">Stripe:</strong> procesamiento seguro de pagos</li>
                <li><strong className="text-foreground">Kinde:</strong> servicios de autenticación</li>
                <li><strong className="text-foreground">Supabase:</strong> almacenamiento de datos</li>
                <li><strong className="text-foreground">Vercel:</strong> hospedaje de la aplicación</li>
              </ul>
              <p className="mt-4">
                Estos proveedores cumplen con estándares de seguridad y protección de datos.
                No vendemos ni compartimos tu información con terceros para fines publicitarios.
              </p>
            </Section>

            <Section icon={<Shield className="h-5 w-5" />} title="6. Derechos ARCO">
              <p>
                De acuerdo con la LFPDPPP, tienes derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong className="text-foreground">Acceso:</strong> conocer qué datos personales tenemos sobre ti</li>
                <li><strong className="text-foreground">Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos</li>
                <li><strong className="text-foreground">Cancelación:</strong> solicitar la eliminación de tus datos personales</li>
                <li><strong className="text-foreground">Oposición:</strong> oponerte al tratamiento de tus datos para ciertas finalidades</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, envía una solicitud a{' '}
                <a href="mailto:contacto@vetify.pro" className="text-primary hover:underline">contacto@vetify.pro</a>{' '}
                incluyendo:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Tu nombre completo y correo electrónico registrado</li>
                <li>Descripción clara del derecho que deseas ejercer</li>
                <li>Cualquier documento que facilite la localización de tus datos</li>
              </ul>
              <p className="mt-4">
                Responderemos tu solicitud en un plazo máximo de 20 días hábiles.
              </p>
            </Section>

            <Section icon={<Server className="h-5 w-5" />} title="7. Seguridad de Datos">
              <p>
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger
                tus datos personales contra acceso no autorizado, pérdida o alteración:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Encriptación SSL/TLS para todas las comunicaciones</li>
                <li>Encriptación de datos sensibles en reposo</li>
                <li>Control de acceso basado en roles</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Copias de seguridad automáticas</li>
                <li>Auditorías de seguridad periódicas</li>
              </ul>
            </Section>

            <Section icon={<RefreshCw className="h-5 w-5" />} title="8. Cambios a esta Política">
              <p>
                Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier momento.
                Cualquier cambio será publicado en esta página con la fecha de última actualización.
              </p>
              <p className="mt-4">
                Te recomendamos revisar periódicamente esta política para estar informado sobre
                cómo protegemos tu información.
              </p>
            </Section>

            <Section icon={<Mail className="h-5 w-5" />} title="9. Contacto">
              <p>
                Si tienes preguntas sobre este Aviso de Privacidad o sobre el tratamiento de tus
                datos personales, puedes contactarnos:
              </p>
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p><strong className="text-foreground">Correo electrónico:</strong>{' '}
                  <a href="mailto:contacto@vetify.pro" className="text-primary hover:underline">
                    contacto@vetify.pro
                  </a>
                </p>
                <p className="mt-2"><strong className="text-foreground">Sitio web:</strong>{' '}
                  <a href="https://vetify.pro" className="text-primary hover:underline">
                    vetify.pro
                  </a>
                </p>
              </div>
            </Section>

          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              ¿Tienes dudas sobre nuestra política de privacidad?
            </p>
            <Link
              href="/contacto"
              className="inline-flex items-center text-primary font-medium hover:underline text-lg"
            >
              <Mail className="h-5 w-5 mr-2" />
              Contáctanos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
