/**
 * Appointment Reminder Email Template
 *
 * Sent 24 hours before an appointment
 */

import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface AppointmentReminderEmailProps {
  ownerName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  veterinarianName?: string;
  hoursUntilAppointment: number;
}

export function AppointmentReminderEmail({
  ownerName,
  petName,
  appointmentDate,
  appointmentTime,
  serviceName,
  clinicName,
  clinicAddress,
  clinicPhone,
  veterinarianName,
  hoursUntilAppointment,
}: AppointmentReminderEmailProps) {
  return (
    <BaseLayout
      preview={`Recordatorio: cita para ${petName} mañana`}
      headerTitle="Recordatorio de Cita ⏰"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Te recordamos que tienes una cita para <strong>{petName}</strong> en
        aproximadamente <strong>{hoursUntilAppointment} horas</strong>.
      </Text>

      {/* Reminder Alert Box */}
      <Section style={alertBox}>
        <Text style={alertText}>
          <strong>⏰ Tu cita es ma&ntilde;ana</strong>
        </Text>
      </Section>

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

      <Text style={footerNote}>
        Si necesitas cancelar o reprogramar, por favor cont&aacute;ctanos lo antes
        posible. &iexcl;Te esperamos!
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

const alertBox = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ffc107',
  padding: '20px',
  borderRadius: '4px',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const alertText = {
  margin: '0',
  color: '#856404',
  fontSize: '16px',
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

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default AppointmentReminderEmail;
