/**
 * Appointment Confirmation Email Template
 *
 * Sent when an appointment is created/confirmed
 */

import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface AppointmentConfirmationEmailProps {
  ownerName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  veterinarianName?: string;
  notes?: string;
}

export function AppointmentConfirmationEmail({
  ownerName,
  petName,
  appointmentDate,
  appointmentTime,
  serviceName,
  clinicName,
  clinicAddress,
  clinicPhone,
  veterinarianName,
  notes,
}: AppointmentConfirmationEmailProps) {
  return (
    <BaseLayout
      preview={`Tu cita para ${petName} ha sido confirmada`}
      headerTitle="Cita Confirmada ✅"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Tu cita para <strong>{petName}</strong> ha sido confirmada exitosamente.
      </Text>

      {/* Appointment Details Card */}
      <Section style={detailsCard}>
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

      {/* Notes */}
      {notes && (
        <Section style={notesBox}>
          <Text style={notesText}>
            <strong>Nota:</strong> {notes}
          </Text>
        </Section>
      )}

      <Text style={footerNote}>
        Recibir&aacute;s un recordatorio 24 horas antes de tu cita. Si necesitas
        cancelar o reprogramar, por favor cont&aacute;ctanos lo antes posible.
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
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '30px',
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

const sectionTitle = {
  margin: '0 0 15px 0',
  color: '#333333',
  fontSize: '18px',
  fontWeight: '600',
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

const notesBox = {
  backgroundColor: '#fff9e6',
  borderLeft: `4px solid #ffc107`,
  padding: '15px',
  borderRadius: '4px',
  marginBottom: '30px',
};

const notesText = {
  margin: '0',
  color: '#856404',
  fontSize: '14px',
};

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default AppointmentConfirmationEmail;
