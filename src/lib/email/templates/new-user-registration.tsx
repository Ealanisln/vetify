/**
 * New User Registration Email Template
 *
 * Admin notification for new user signups
 */

import { Section, Text, Row, Column, Link } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface NewUserRegistrationEmailProps {
  userName: string;
  userEmail: string;
  tenantName: string;
  tenantSlug: string;
  registrationDate: string;
  planType: 'TRIAL' | 'PAID';
  trialEndsAt?: string;
}

export function NewUserRegistrationEmail({
  userName,
  userEmail,
  tenantName,
  tenantSlug,
  registrationDate,
  planType,
  trialEndsAt,
}: NewUserRegistrationEmailProps) {
  return (
    <BaseLayout
      preview={`Nuevo usuario registrado: ${userName}`}
      headerTitle="🎉 Nuevo Usuario Registrado"
    >
      <Text style={paragraph}>
        &iexcl;Hola Emmanuel! Un nuevo usuario se ha registrado en Vetify.
      </Text>

      {/* User Info Card */}
      <Section style={detailsCard}>
        <Row style={detailRow}>
          <Column style={detailLabel}>👤 Usuario:</Column>
          <Column style={detailValue}>{userName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📧 Email:</Column>
          <Column style={detailValue}>{userEmail}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>🏥 Cl&iacute;nica:</Column>
          <Column style={detailValue}>{tenantName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>🔗 Slug:</Column>
          <Column style={detailValue}>{tenantSlug}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📅 Fecha:</Column>
          <Column style={detailValue}>{registrationDate}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📋 Tipo:</Column>
          <Column
            style={{
              ...detailValue,
              color: planType === 'TRIAL' ? '#ffc107' : '#28a745',
            }}
          >
            {planType === 'TRIAL'
              ? '🎁 Per\u00edodo de Prueba'
              : '💳 Suscripci\u00f3n Pagada'}
          </Column>
        </Row>
        {trialEndsAt && (
          <Row style={detailRow}>
            <Column style={detailLabel}>⏰ Prueba termina:</Column>
            <Column style={detailValue}>{trialEndsAt}</Column>
          </Row>
        )}
      </Section>

      {/* Quick Actions */}
      <Section style={sectionBlock}>
        <Text style={sectionTitle}>🔗 Enlaces R&aacute;pidos</Text>
        <Text style={linkItem}>
          <Link
            href={`https://app.vetify.pro/${tenantSlug}`}
            style={linkStyle}
          >
            📊 Ver Dashboard del Tenant
          </Link>
        </Text>
        <Text style={linkItem}>
          <Link href={`mailto:${userEmail}`} style={linkStyle}>
            📧 Contactar Usuario
          </Link>
        </Text>
      </Section>
    </BaseLayout>
  );
}

// Styles
const paragraph = {
  margin: '0 0 30px 0',
  color: '#333333',
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

const linkItem = {
  margin: '0 0 8px 0',
};

const linkStyle = {
  color: BRAND_COLOR,
  textDecoration: 'none',
  fontSize: '14px',
};

export default NewUserRegistrationEmail;
