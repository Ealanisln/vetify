"use client";

import { useState } from "react";
import { Mail, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ContactMethodProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
}

interface FAQItemProps {
  question: string;
  answer: string;
}

const ContactMethod: React.FC<ContactMethodProps> = ({ icon, title, description, link }) => {
  return (
    <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-sm hover:shadow-md border border-border transition-all max-w-md w-full text-center">
      <div className="p-4 rounded-full mb-5 inline-flex bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {link && (
        <a
          href={link}
          className="text-primary font-medium hover:underline mt-auto text-lg"
        >
          {link.includes('mailto:') ? link.replace('mailto:', '') :
           link.includes('tel:') ? link.replace('tel:', '') : link}
        </a>
      )}
    </div>
  );
};

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border py-5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left focus:outline-none"
      >
        <h3 className="text-lg font-medium text-foreground">{question}</h3>
        <ChevronDown className={`h-5 w-5 text-primary transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-3 text-muted-foreground">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const contactMethods = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email",
    description: "Responderemos a tu mensaje en menos de 24 horas.",
    link: "mailto:contacto@vetify.pro",
  },
];

const faqs = [
  {
    question: "¿Necesito instalar algún software para usar Vetify?",
    answer: "No, Vetify es una plataforma 100% basada en la nube. Solo necesitas un navegador web y conexión a internet para acceder desde cualquier dispositivo, en cualquier momento y lugar."
  },
  {
    question: "¿Puedo importar mis datos de otro sistema?",
    answer: "Sí, ofrecemos asistencia para migrar tus datos desde otros sistemas. Nuestro equipo te guiará en el proceso de importación de clientes, pacientes e historial clínico."
  },
  {
    question: "¿Qué sucede cuando termina mi periodo de prueba?",
    answer: "Al finalizar tu periodo de prueba de 30 días, puedes elegir uno de nuestros planes para continuar utilizando Vetify. Si decides no continuar, tus datos se mantendrán seguros por 30 días adicionales en caso de que cambies de opinión."
  },
  {
    question: "¿Ofrecen capacitación para mi equipo?",
    answer: "Sí, todos nuestros planes incluyen capacitación inicial para tu personal. Además, contamos con una biblioteca de videos tutoriales y documentación detallada para facilitar el aprendizaje."
  },
  {
    question: "¿Mi información está segura en Vetify?",
    answer: "Absolutamente. Utilizamos encriptación de nivel bancario y seguimos estrictos protocolos de seguridad para proteger tus datos. Realizamos copias de seguridad diarias y cumplimos con regulaciones de protección de datos."
  },
];

export default function Contacto() {
  const [formState, setFormState] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      // Handle rate limiting (429)
      if (response.status === 429) {
        toast.error('Has excedido el límite de mensajes. Por favor espera unos minutos e intenta nuevamente.', {
          duration: 5000,
        });
        return;
      }

      // Handle CSRF errors (403)
      if (response.status === 403) {
        toast.error('Error de seguridad. Por favor recarga la página e intenta nuevamente.', {
          duration: 5000,
        });
        return;
      }

      // Handle success
      if (response.ok && data.success) {
        setSubmitted(true);
        toast.success('¡Mensaje enviado exitosamente! Te responderemos en menos de 24 horas.', {
          duration: 5000,
        });

        // Resetear el formulario después de 5 segundos
        setTimeout(() => {
          setSubmitted(false);
          setFormState({
            nombre: '',
            email: '',
            telefono: '',
            asunto: '',
            mensaje: '',
          });
        }, 5000);
      } else {
        // Handle validation or other errors
        const errorMessage = data.error || 'Error al enviar el mensaje';
        toast.error(errorMessage, {
          description: 'Si el problema persiste, contacta directamente a contacto@vetify.pro',
          duration: 5000,
        });
        console.error('Error al enviar mensaje:', data.error);
      }
    } catch (error) {
      // Handle network errors
      toast.error('Error de conexión. Por favor verifica tu internet e intenta nuevamente.', {
        description: 'O contacta directamente a contacto@vetify.pro',
        duration: 5000,
      });
      console.error('Error al enviar mensaje:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
        {/* Header */}
        <section className="relative py-20 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl opacity-20"></div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-8">
              Contacta con <span className="text-primary">Vetify</span>
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Contacta con nuestro equipo y descubre cómo podemos transformar tu clínica veterinaria.
            </p>
          </div>
        </section>

        {/* Métodos de contacto */}
        <section className="py-8 lg:py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <ContactMethod
                icon={contactMethods[0].icon}
                title={contactMethods[0].title}
                description={contactMethods[0].description}
                link={contactMethods[0].link}
              />
            </div>
          </div>
        </section>

        {/* Formulario de contacto */}
        <section className="py-12 lg:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-xl shadow-lg p-8 md:p-10 border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Envíanos un mensaje</h2>

              {submitted ? (
                <div className="bg-primary/10 p-6 rounded-lg text-center border border-primary/30">
                  <div className="flex items-center justify-center mb-3">
                    <svg className="h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-foreground font-medium text-lg mb-2">
                    ¡Mensaje enviado exitosamente!
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Te responderemos en menos de 24 horas.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-foreground mb-2">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        id="nombre"
                        required
                        value={formState.nombre}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 rounded-lg border border-border shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formState.email}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 rounded-lg border border-border shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-foreground mb-2">
                        Teléfono (opcional)
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        id="telefono"
                        value={formState.telefono}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 rounded-lg border border-border shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="asunto" className="block text-sm font-medium text-foreground mb-2">
                        Asunto
                      </label>
                      <select
                        name="asunto"
                        id="asunto"
                        required
                        value={formState.asunto}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 rounded-lg border border-border shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="informacion">Solicitar información</option>
                        <option value="demo">Agendar una demo</option>
                        <option value="soporte">Soporte técnico</option>
                        <option value="facturacion">Facturación</option>
                        <option value="downgrade">Cambiar a plan inferior</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mensaje" className="block text-sm font-medium text-foreground mb-2">
                      Mensaje
                    </label>
                    <textarea
                      name="mensaje"
                      id="mensaje"
                      rows={5}
                      required
                      value={formState.mensaje}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 rounded-lg border border-border shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    ></textarea>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      required
                      className="h-5 w-5 text-primary focus:ring-primary border-border rounded"
                    />
                    <label htmlFor="privacy" className="ml-3 block text-sm text-muted-foreground">
                      Acepto la <Link href="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 px-6 border border-transparent rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex justify-center items-center font-medium text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </span>
                      ) : (
                        'Enviar mensaje'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5">
                Preguntas frecuentes
              </h2>
              <p className="text-lg text-muted-foreground">
                Respuestas a las dudas más comunes sobre Vetify
              </p>
            </div>

            <div className="bg-card rounded-xl shadow-lg p-8 md:p-10 border border-border">
              <div className="divide-y divide-border">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                ¿No encuentras respuesta a tu pregunta?
              </p>
              <a
                href="mailto:soporte@vetify.pro"
                className="inline-flex items-center text-primary font-medium hover:underline text-lg"
              >
                <Mail className="h-5 w-5 mr-2" />
                Contacta a nuestro equipo de soporte
              </a>
            </div>
          </div>
        </section>
    </main>
  );
} 