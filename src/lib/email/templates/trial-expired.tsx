/**
 * Trial Expired Email Template
 *
 * Notification sent when a tenant's trial period has expired
 */

import { Section, Text, Row, Column, Button } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface TrialExpiredEmailProps {
  clinicName: string;
  ownerName: string;
  expiredDate: string;
  upgradeUrl: string;
}

const DANGER_COLOR = '#e74c3c';

export function TrialExpiredEmail({
  clinicName,
  ownerName,
  expiredDate,
  upgradeUrl,
}: TrialExpiredEmailProps) {
  return (
    <BaseLayout
      preview={`Tu prueba gratuita de Vetify ha expirado`}
      headerTitle="🔒 Tu Prueba Ha Expirado"
      headerColor={DANGER_COLOR}
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Tu per&iacute;odo de prueba gratuita de <strong>Vetify</strong> para{' '}
        <strong>{clinicName}</strong> expir&oacute; el {expiredDate}.
      </Text>

      {/* Expired Alert */}
      <Section style={alertBox}>
        <Text style={alertText}>
          <strong>🔒 Acceso restringido</strong>
        </Text>
        <Text style={alertSubtext}>
          Las funcionalidades principales est&aacute;n bloqueadas
        </Text>
      </Section>

      {/* Blocked features */}
      <Section style={detailsCard}>
        <Text style={sectionTitle}>
          Funcionalidades bloqueadas:
        </Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>❌ Registrar nuevas mascotas</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>❌ Agendar citas</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>❌ Control de inventario</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>❌ Reportes y estad&iacute;sticas</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>❌ Automatizaciones</Column>
        </Row>
      </Section>

      {/* What you keep */}
      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>💡 Tus datos est&aacute;n seguros.</strong> Toda la informaci&oacute;n de tu
          cl&iacute;nica se conserva. Al activar un plan, recuperar&aacute;s el acceso
          completo de inmediato.
        </Text>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Button style={ctaButton} href={upgradeUrl}>
          Reactivar mi cuenta
        </Button>
      </Section>

      <Text style={footerNote}>
        Si necesitas ayuda para elegir el plan adecuado para tu cl&iacute;nica,
        escr&iacute;benos y te asesoramos sin compromiso.
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
  backgroundColor: '#f8d7da',
  borderLeft: `4px solid ${DANGER_COLOR}`,
  padding: '20px',
  borderRadius: '4px',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const alertText = {
  margin: '0',
  color: '#721c24',
  fontSize: '18px',
};

const alertSubtext = {
  margin: '8px 0 0 0',
  color: '#721c24',
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

const infoBox = {
  backgroundColor: '#d1ecf1',
  borderLeft: '4px solid #0dcaf0',
  padding: '15px',
  borderRadius: '4px',
  marginBottom: '30px',
};

const infoText = {
  margin: '0',
  color: '#055160',
  fontSize: '14px',
  lineHeight: '1.6',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '30px',
};

const ctaButton = {
  backgroundColor: DANGER_COLOR,
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

export default TrialExpiredEmail;
