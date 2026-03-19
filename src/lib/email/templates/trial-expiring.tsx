/**
 * Trial Expiring Email Template
 *
 * Warning email sent when a tenant's trial period is about to expire
 */

import { Section, Text, Row, Column, Button } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface TrialExpiringEmailProps {
  clinicName: string;
  ownerName: string;
  daysRemaining: number;
  trialEndsDate: string;
  upgradeUrl: string;
}

const WARNING_COLOR = '#e67e22';

export function TrialExpiringEmail({
  clinicName,
  ownerName,
  daysRemaining,
  trialEndsDate,
  upgradeUrl,
}: TrialExpiringEmailProps) {
  return (
    <BaseLayout
      preview={`Tu prueba gratuita de Vetify termina en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`}
      headerTitle="⚠️ Tu Prueba Está por Terminar"
      headerColor={WARNING_COLOR}
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Tu per&iacute;odo de prueba gratuita de <strong>Vetify</strong> para{' '}
        <strong>{clinicName}</strong> est&aacute; por terminar.
      </Text>

      {/* Days Remaining Alert */}
      <Section style={alertBox}>
        <Text style={alertText}>
          <strong>
            ⏰ {daysRemaining === 0
              ? '¡Hoy es el último día!'
              : `Quedan ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`}
          </strong>
        </Text>
        <Text style={alertSubtext}>
          Tu prueba termina el {trialEndsDate}
        </Text>
      </Section>

      {/* Features at risk */}
      <Section style={detailsCard}>
        <Text style={sectionTitle}>
          Funcionalidades que perder&aacute;s:
        </Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>🐾 Gestión de mascotas</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📅 Agenda de citas</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📦 Control de inventario</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📊 Reportes y estad&iacute;sticas</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>⚡ Automatizaciones</Column>
        </Row>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Button style={ctaButton} href={upgradeUrl}>
          Activar mi plan
        </Button>
      </Section>

      <Text style={footerNote}>
        Si tienes alguna duda sobre los planes disponibles, no dudes en
        contactarnos. Estamos aqu&iacute; para ayudarte a elegir la mejor
        opci&oacute;n para tu cl&iacute;nica.
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
  borderLeft: `4px solid ${WARNING_COLOR}`,
  padding: '20px',
  borderRadius: '4px',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const alertText = {
  margin: '0',
  color: '#856404',
  fontSize: '18px',
};

const alertSubtext = {
  margin: '8px 0 0 0',
  color: '#856404',
  fontSize: '14px',
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
  paddingLeft: '8px',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '30px',
};

const ctaButton = {
  backgroundColor: WARNING_COLOR,
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
};

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default TrialExpiringEmail;
