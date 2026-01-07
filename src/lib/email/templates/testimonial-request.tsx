/**
 * Testimonial Request Email Template
 *
 * Sent after an appointment is completed to request a review
 */

import { Section, Text, Button, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface TestimonialRequestEmailProps {
  ownerName: string;
  petName: string;
  serviceName: string;
  appointmentDate: string;
  clinicName: string;
  clinicSlug: string;
  baseUrl: string;
}

export function TestimonialRequestEmail({
  ownerName,
  petName,
  serviceName,
  appointmentDate,
  clinicName,
  clinicSlug,
  baseUrl,
}: TestimonialRequestEmailProps) {
  const testimonialUrl = `${baseUrl}/${clinicSlug}/testimonios/nuevo`;

  return (
    <BaseLayout
      preview={`Cuentanos como fue tu experiencia con ${petName} en ${clinicName}`}
      headerTitle="Tu Opinion Nos Importa"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Esperamos que <strong>{petName}</strong> se encuentre muy bien despues de
        su visita. Fue un placer atenderles.
      </Text>

      {/* Visit Details */}
      <Section style={detailsCard}>
        <Row style={detailRow}>
          <Column style={detailLabel}>🐾 Mascota:</Column>
          <Column style={detailValue}>{petName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>💉 Servicio:</Column>
          <Column style={detailValue}>{serviceName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📅 Fecha:</Column>
          <Column style={detailValue}>{appointmentDate}</Column>
        </Row>
      </Section>

      <Text style={paragraph}>
        Tu experiencia es muy importante para nosotros. Nos encantaria que nos
        compartieras como fue tu visita, ya que tus comentarios nos ayudan a
        mejorar y a que otras personas conozcan nuestros servicios.
      </Text>

      {/* CTA Button */}
      <Section style={ctaSection}>
        <Button style={ctaButton} href={testimonialUrl}>
          Dejar mi Testimonio
        </Button>
      </Section>

      <Text style={smallText}>
        Solo te tomara un minuto compartir tu experiencia.
      </Text>

      <Section style={divider} />

      <Text style={footerNote}>
        Si tienes alguna pregunta o inquietud sobre la salud de {petName}, no
        dudes en contactarnos. Estamos aqui para ayudarte.
      </Text>

      <Text style={footerThank}>
        Gracias por confiar en nosotros,
        <br />
        <strong>El equipo de {clinicName}</strong>
      </Text>
    </BaseLayout>
  );
}

// Styles
const greeting = {
  margin: '0 0 20px 0',
  color: '#333333',
  fontSize: '16px',
};

const paragraph = {
  margin: '0 0 24px 0',
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.6',
};

const detailsCard = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '24px',
};

const detailRow = {
  marginBottom: '8px',
};

const detailLabel = {
  color: '#666666',
  fontSize: '14px',
  width: '50%',
};

const detailValue = {
  color: '#333333',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'right' as const,
  width: '50%',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '20px',
};

const ctaButton = {
  backgroundColor: BRAND_COLOR,
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  fontWeight: '600',
  fontSize: '16px',
  textDecoration: 'none',
  display: 'inline-block',
};

const smallText = {
  margin: '0 0 30px 0',
  color: '#999999',
  fontSize: '14px',
  textAlign: 'center' as const,
};

const divider = {
  borderTop: '1px solid #e9ecef',
  margin: '30px 0',
};

const footerNote = {
  margin: '0 0 20px 0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

const footerThank = {
  margin: '0',
  color: '#333333',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default TestimonialRequestEmail;
