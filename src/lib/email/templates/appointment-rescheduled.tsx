/**
 * Appointment Rescheduled Email Template
 *
 * Sent when an appointment date/time is changed
 */

import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface AppointmentRescheduledEmailProps {
  ownerName: string;
  petName: string;
  previousDate: string;
  previousTime: string;
  newDate: string;
  newTime: string;
  serviceName: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  veterinarianName?: string;
}

export function AppointmentRescheduledEmail({
  ownerName,
  petName,
  previousDate,
  previousTime,
  newDate,
  newTime,
  serviceName,
  clinicName,
  clinicAddress,
  clinicPhone,
  veterinarianName,
}: AppointmentRescheduledEmailProps) {
  return (
    <BaseLayout
      preview={`Tu cita para ${petName} ha sido reprogramada`}
      headerTitle="Cita Reprogramada 📅"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Tu cita para <strong>{petName}</strong> ha sido reprogramada. Por favor
        revisa los nuevos detalles a continuaci&oacute;n.
      </Text>

      {/* Date Comparison */}
      <Section style={comparisonContainer}>
        {/* Previous Date */}
        <Section style={previousCard}>
          <Text style={cardLabel}>FECHA ANTERIOR</Text>
          <Text style={previousDateText}>{previousDate}</Text>
          <Text style={previousTimeText}>{previousTime}</Text>
        </Section>

        {/* Arrow */}
        <Text style={arrowText}>→</Text>

        {/* New Date */}
        <Section style={newCard}>
          <Text style={cardLabel}>NUEVA FECHA</Text>
          <Text style={newDateText}>{newDate}</Text>
          <Text style={newTimeText}>{newTime}</Text>
        </Section>
      </Section>

      {/* Appointment Details */}
      <Section style={detailsCard}>
        <Text style={sectionTitle}>Detalles de la cita:</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>🐾 Mascota:</Column>
          <Column style={detailValue}>{petName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>💉 Servicio:</Column>
          <Column style={detailValue}>{serviceName}</Column>
        </Row>
        {veterinarianName && (
          <Row style={detailRow}>
            <Column style={detailLabel}>👨‍⚕️ Veterinario:</Column>
            <Column style={detailValue}>{veterinarianName}</Column>
          </Row>
        )}
      </Section>

      {/* Clinic Information */}
      <Section style={sectionBlock}>
        <Text style={sectionTitle}>📍 Informaci&oacute;n de la Cl&iacute;nica</Text>
        <Text style={clinicNameText}>{clinicName}</Text>
        {clinicAddress && <Text style={clinicInfoText}>{clinicAddress}</Text>}
        {clinicPhone && <Text style={clinicInfoText}>📞 {clinicPhone}</Text>}
      </Section>

      <Text style={footerNote}>
        Si la nueva fecha no te funciona, por favor cont&aacute;ctanos lo antes
        posible para reprogramar. Recibir&aacute;s un recordatorio 24 horas
        antes de tu cita.
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

const comparisonContainer = {
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const previousCard = {
  display: 'inline-block',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '15px 20px',
  marginRight: '10px',
  textDecoration: 'line-through',
  opacity: '0.7',
};

const newCard = {
  display: 'inline-block',
  backgroundColor: '#e8f5e9',
  borderRadius: '6px',
  padding: '15px 20px',
  marginLeft: '10px',
  border: '2px solid #4caf50',
};

const cardLabel = {
  margin: '0 0 8px 0',
  color: '#666666',
  fontSize: '10px',
  fontWeight: '600',
  letterSpacing: '1px',
};

const previousDateText = {
  margin: '0',
  color: '#999999',
  fontSize: '16px',
  fontWeight: '600',
};

const previousTimeText = {
  margin: '0',
  color: '#999999',
  fontSize: '14px',
};

const newDateText = {
  margin: '0',
  color: '#2e7d32',
  fontSize: '16px',
  fontWeight: '700',
};

const newTimeText = {
  margin: '0',
  color: '#2e7d32',
  fontSize: '14px',
  fontWeight: '600',
};

const arrowText = {
  display: 'inline-block',
  fontSize: '24px',
  color: '#666666',
  verticalAlign: 'middle',
  margin: '0 10px',
};

const detailsCard = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '30px',
};

const sectionTitle = {
  margin: '0 0 15px 0',
  color: '#333333',
  fontSize: '16px',
  fontWeight: '600',
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

const sectionBlock = {
  marginBottom: '30px',
};

const clinicNameText = {
  margin: '0 0 8px 0',
  color: '#666666',
  fontSize: '14px',
  fontWeight: '600',
};

const clinicInfoText = {
  margin: '0 0 8px 0',
  color: '#666666',
  fontSize: '14px',
};

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default AppointmentRescheduledEmail;
