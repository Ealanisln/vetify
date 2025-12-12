/**
 * Appointment Staff Notification Email Template
 *
 * Sent to staff/veterinarian when a new appointment is assigned to them
 */

import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface AppointmentStaffNotificationEmailProps {
  staffName: string;
  petName: string;
  petSpecies: string;
  petBreed?: string;
  ownerName: string;
  ownerPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  clinicName: string;
  notes?: string;
}

export function AppointmentStaffNotificationEmail({
  staffName,
  petName,
  petSpecies,
  petBreed,
  ownerName,
  ownerPhone,
  appointmentDate,
  appointmentTime,
  serviceName,
  clinicName,
  notes,
}: AppointmentStaffNotificationEmailProps) {
  const petDescription = petBreed ? `${petSpecies} - ${petBreed}` : petSpecies;

  return (
    <BaseLayout
      preview={`Nueva cita asignada: ${petName} - ${appointmentDate}`}
      headerTitle="Nueva Cita Asignada 📋"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{staffName}</strong>,
      </Text>

      <Text style={paragraph}>
        Se te ha asignado una nueva cita. A continuaci&oacute;n los detalles:
      </Text>

      {/* Appointment Details Card */}
      <Section style={detailsCard}>
        <Text style={sectionTitle}>📅 Detalles de la Cita</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Fecha:</Column>
          <Column style={detailValue}>{appointmentDate}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Hora:</Column>
          <Column style={detailValue}>{appointmentTime}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Servicio:</Column>
          <Column style={detailValue}>{serviceName}</Column>
        </Row>
      </Section>

      {/* Pet Information */}
      <Section style={petCard}>
        <Text style={sectionTitle}>🐾 Informaci&oacute;n de la Mascota</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Nombre:</Column>
          <Column style={detailValue}>{petName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Especie/Raza:</Column>
          <Column style={detailValue}>{petDescription}</Column>
        </Row>
      </Section>

      {/* Owner Information */}
      <Section style={ownerCard}>
        <Text style={sectionTitle}>👤 Informaci&oacute;n del Due&ntilde;o</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Nombre:</Column>
          <Column style={detailValue}>{ownerName}</Column>
        </Row>
        {ownerPhone && (
          <Row style={detailRow}>
            <Column style={detailLabel}>Tel&eacute;fono:</Column>
            <Column style={detailValue}>{ownerPhone}</Column>
          </Row>
        )}
      </Section>

      {/* Notes */}
      {notes && (
        <Section style={notesBox}>
          <Text style={notesTitle}>📝 Notas:</Text>
          <Text style={notesText}>{notes}</Text>
        </Section>
      )}

      <Text style={footerNote}>
        Por favor aseg&uacute;rate de revisar el historial m&eacute;dico del
        paciente antes de la cita.
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
  backgroundColor: '#e3f2fd',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '20px',
  borderLeft: `4px solid ${BRAND_COLOR}`,
};

const petCard = {
  backgroundColor: '#fff3e0',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '20px',
};

const ownerCard = {
  backgroundColor: '#f3e5f5',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '20px',
};

const sectionTitle = {
  margin: '0 0 15px 0',
  color: '#333333',
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
  width: '40%',
};

const detailValue = {
  color: '#333333',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'right' as const,
  width: '60%',
};

const notesBox = {
  backgroundColor: '#fff9e6',
  borderLeft: '4px solid #ffc107',
  padding: '15px',
  borderRadius: '4px',
  marginBottom: '30px',
};

const notesTitle = {
  margin: '0 0 8px 0',
  color: '#856404',
  fontSize: '14px',
  fontWeight: '600',
};

const notesText = {
  margin: '0',
  color: '#856404',
  fontSize: '14px',
  lineHeight: '1.5',
};

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default AppointmentStaffNotificationEmail;
