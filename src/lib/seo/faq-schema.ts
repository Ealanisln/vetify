/**
 * FAQ Page structured data types
 */
export interface FAQPage {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: FAQQuestion[];
}

export interface FAQQuestion {
  '@type': 'Question';
  name: string;
  acceptedAnswer: FAQAnswer;
}

export interface FAQAnswer {
  '@type': 'Answer';
  text: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

/**
 * Generate FAQPage structured data
 * Helps display FAQ content directly in search results with rich snippets
 *
 * @param faqs - Array of question/answer pairs
 * @returns FAQPage JSON-LD schema
 *
 * @example
 * ```ts
 * const faqSchema = generateFAQPageSchema([
 *   {
 *     question: '¿Necesito instalar algún software?',
 *     answer: 'No, Vetify es 100% basado en la nube.'
 *   },
 *   {
 *     question: '¿Ofrecen periodo de prueba?',
 *     answer: 'Sí, ofrecemos 30 días de prueba gratuita.'
 *   }
 * ]);
 * ```
 */
export function generateFAQPageSchema(faqs: FAQ[]): FAQPage {
  const mainEntity: FAQQuestion[] = faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}

/**
 * Common FAQs in Spanish for pricing/features pages
 * Pre-defined FAQs that can be reused across pages
 */
export const COMMON_FAQS_ES = {
  pricing: [
    {
      question: '¿Ofrecen periodo de prueba gratuito?',
      answer: 'Sí, todos nuestros planes incluyen 30 días de prueba gratuita sin necesidad de tarjeta de crédito. Podrás explorar todas las funcionalidades antes de comprometerte con un plan de pago.',
    },
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes actualizar tu plan en cualquier momento desde el panel de configuración. Los cambios se aplicarán de inmediato y solo pagarás la diferencia prorrateada por el tiempo restante del periodo de facturación.',
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de Stripe, nuestra plataforma de pagos segura. También ofrecemos facturación anual con descuento.',
    },
    {
      question: '¿Qué sucede si excedo los límites de mi plan?',
      answer: 'Te notificaremos cuando estés cerca del límite de tu plan. Podrás actualizar a un plan superior en cualquier momento para continuar sin interrupciones. No bloqueamos el acceso, pero te recomendaremos el cambio de plan.',
    },
    {
      question: '¿Puedo cancelar mi suscripción en cualquier momento?',
      answer: 'Sí, puedes cancelar tu suscripción en cualquier momento sin penalización. Mantendrás acceso al servicio hasta el final de tu periodo de facturación actual, y tus datos se conservarán de forma segura por 30 días adicionales.',
    },
  ],
  features: [
    {
      question: '¿Necesito instalar algún software para usar Vetify?',
      answer: 'No, Vetify es una plataforma 100% basada en la nube. Solo necesitas un navegador web moderno y conexión a internet para acceder desde cualquier dispositivo (computadora, tablet o smartphone).',
    },
    {
      question: '¿Puedo acceder a Vetify desde mi celular?',
      answer: 'Sí, Vetify está optimizado para funcionar en dispositivos móviles. Puedes gestionar tu clínica desde cualquier lugar usando tu smartphone o tablet con iOS o Android.',
    },
    {
      question: '¿Mis datos están seguros?',
      answer: 'Absolutamente. Utilizamos encriptación de nivel bancario (SSL/TLS 256-bit), realizamos copias de seguridad diarias automáticas, y cumplimos con estrictos protocolos de seguridad. Tus datos están almacenados en servidores seguros con redundancia geográfica.',
    },
    {
      question: '¿Puedo importar mis datos de otro sistema?',
      answer: 'Sí, ofrecemos asistencia para migrar tus datos desde otros sistemas veterinarios. Nuestro equipo te guiará en el proceso de importación de clientes, mascotas, historial clínico e inventario.',
    },
    {
      question: '¿Ofrecen capacitación para mi equipo?',
      answer: 'Sí, todos nuestros planes incluyen sesiones de capacitación inicial para tu personal. Además, contamos con una biblioteca completa de videos tutoriales, documentación detallada y soporte técnico para facilitar el aprendizaje.',
    },
  ],
  contact: [
    {
      question: '¿Cuánto tiempo tardan en responder?',
      answer: 'Nos comprometemos a responder todos los mensajes en menos de 24 horas durante días hábiles. Para casos urgentes de soporte técnico, nuestros clientes de planes Profesional y Corporativo tienen acceso a soporte prioritario.',
    },
    {
      question: '¿Ofrecen demostraciones del producto?',
      answer: 'Sí, con gusto podemos agendar una demostración personalizada de Vetify. Durante la demo te mostraremos las funcionalidades clave y responderemos todas tus preguntas en tiempo real.',
    },
    {
      question: '¿Tienen oficinas físicas?',
      answer: 'Operamos de forma 100% digital para poder ofrecer mejor soporte y precios accesibles. Todo nuestro soporte se realiza a través de email, videollamada o chat en vivo.',
    },
  ],
} as const;

/**
 * Get common FAQs for a specific section
 */
export function getCommonFAQs(section: 'pricing' | 'features' | 'contact'): FAQ[] {
  return COMMON_FAQS_ES[section];
}
