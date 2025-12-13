/**
 * Appointment Cancellation Email Template
 *
 * Sent when an appointment is cancelled by client or clinic
 */

import { Section, Text, Row, Column, Button } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface AppointmentCancellationEmailProps {
  ownerName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  clinicName: string;
  clinicPhone?: string;
  cancelledBy: 'CLIENT' | 'CLINIC';
  cancellationReason?: string;
}

export function AppointmentCancellationEmail({
  ownerName,
  petName,
  appointmentDate,
  appointmentTime,
  serviceName,
  clinicName,
  clinicPhone,
  cancelledBy,
  cancellationReason,
}: AppointmentCancellationEmailProps) {
  const cancelledByText =
    cancelledBy === 'CLIENT' ? 'a solicitud tuya' : 'por la clínica';

  return (
    <BaseLayout
      preview={`Tu cita para ${petName} ha sido cancelada`}
      headerTitle="Cita Cancelada"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Te informamos que tu cita para <strong>{petName}</strong> ha sido
        cancelada {cancelledByText}.
      </Text>

      {/* Cancelled Appointment Details */}
      <Section style={detailsCard}>
        <Text style={cardTitle}>Detalles de la cita cancelada:</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>📅 Fecha:</Column>
          <Column style={detailValue}>{appointmentDate}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>🕐 Hora:</Column>
          <Column style={detailValue}>{appointmentTime}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>🐾 Mascota:</Column>
          <Column style={detailValue}>{petName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>💉 Servicio:</Column>
          <Column style={detailValue}>{serviceName}</Column>
        </Row>
      </Section>

      {/* Cancellation Reason */}
      {cancellationReason && (
        <Section style={reasonBox}>
          <Text style={reasonTitle}>Motivo de cancelaci&oacute;n:</Text>
          <Text style={reasonText}>{cancellationReason}</Text>
        </Section>
      )}

      {/* Call to Action */}
      <Section style={ctaSection}>
        <Text style={ctaText}>
          Si deseas reprogramar tu cita, no dudes en contactarnos.
        </Text>
        {clinicPhone && (
          <Button style={phoneButton} href={`tel:${clinicPhone}`}>
            📞 Llamar: {clinicPhone}
          </Button>
        )}
      </Section>

      <Text style={footerNote}>
        Lamentamos cualquier inconveniente que esto pueda causar. Esperamos
        verte pronto en {clinicName}.
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
  margin: '0 0 30px 0',
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.6',
};

const detailsCard = {
  backgroundColor: '#fff5f5',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '30px',
  borderLeft: '4px solid #dc3545',
};

const cardTitle = {
  margin: '0 0 15px 0',
  color: '#dc3545',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
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

const reasonBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '15px',
  marginBottom: '30px',
};

const reasonTitle = {
  margin: '0 0 8px 0',
  color: '#333333',
  fontSize: '14px',
  fontWeight: '600',
};

const reasonText = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '30px',
};

const ctaText = {
  margin: '0 0 15px 0',
  color: '#666666',
  fontSize: '16px',
};

const phoneButton = {
  backgroundColor: BRAND_COLOR,
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
};

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default AppointmentCancellationEmail;
