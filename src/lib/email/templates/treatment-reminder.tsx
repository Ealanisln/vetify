/**
 * Treatment Reminder Email Template
 *
 * Vaccination and treatment reminders to pet owners
 */

import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

type TreatmentType = 'VACCINATION' | 'MEDICATION' | 'CHECKUP' | 'OTHER';

interface TreatmentReminderEmailProps {
  ownerName: string;
  petName: string;
  treatmentName: string;
  treatmentType: TreatmentType;
  dueDate: string;
  daysUntilDue: number;
  clinicName: string;
  clinicPhone?: string;
  veterinarianName?: string;
  notes?: string;
}

const treatmentTypeEmoji: Record<TreatmentType, string> = {
  VACCINATION: '💉',
  MEDICATION: '💊',
  CHECKUP: '🩺',
  OTHER: '📋',
};

export function TreatmentReminderEmail({
  ownerName,
  petName,
  treatmentName,
  treatmentType,
  dueDate,
  daysUntilDue,
  clinicName,
  clinicPhone,
  veterinarianName,
  notes,
}: TreatmentReminderEmailProps) {
  const emoji = treatmentTypeEmoji[treatmentType] || '📋';

  return (
    <BaseLayout
      preview={`Recordatorio de tratamiento para ${petName}`}
      headerTitle={`${emoji} Recordatorio de Tratamiento`}
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Te recordamos que <strong>{petName}</strong> tiene un tratamiento
        pr&oacute;ximo que requiere tu atenci&oacute;n.
      </Text>

      {/* Days Until Due Alert */}
      <Section style={alertBox}>
        <Text style={alertText}>
          <strong>📅 Faltan {daysUntilDue} d&iacute;as</strong>
        </Text>
      </Section>

      {/* Treatment Details Card */}
      <Section style={detailsCard}>
        <Row style={detailRow}>
          <Column style={detailLabel}>🐾 Mascota:</Column>
          <Column style={detailValue}>{petName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>{emoji} Tratamiento:</Column>
          <Column style={detailValue}>{treatmentName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📅 Fecha prevista:</Column>
          <Column style={detailValue}>{dueDate}</Column>
        </Row>
        {veterinarianName && (
          <Row style={detailRow}>
            <Column style={detailLabel}>👨‍⚕️ Veterinario:</Column>
            <Column style={detailValue}>{veterinarianName}</Column>
          </Row>
        )}
      </Section>

      {/* Notes */}
      {notes && (
        <Section style={notesBox}>
          <Text style={notesText}>
            <strong>Nota:</strong> {notes}
          </Text>
        </Section>
      )}

      {/* Clinic Information */}
      <Section style={sectionBlock}>
        <Text style={sectionTitle}>📍 Informaci&oacute;n de la Cl&iacute;nica</Text>
        <Text style={clinicNameText}>{clinicName}</Text>
        {clinicPhone && <Text style={clinicInfoText}>📞 {clinicPhone}</Text>}
      </Section>

      <Text style={footerNote}>
        Por favor, agenda una cita para este tratamiento. Si tienes alguna duda
        o necesitas reprogramar, no dudes en contactarnos.
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
  backgroundColor: '#d1ecf1',
  borderLeft: '4px solid #0dcaf0',
  padding: '20px',
  borderRadius: '4px',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const alertText = {
  margin: '0',
  color: '#055160',
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

const notesBox = {
  backgroundColor: '#e7f3ff',
  borderLeft: '4px solid #0d6efd',
  padding: '15px',
  borderRadius: '4px',
  marginBottom: '30px',
};

const notesText = {
  margin: '0',
  color: '#084298',
  fontSize: '14px',
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

export default TreatmentReminderEmail;
