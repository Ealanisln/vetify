/**
 * New Subscription Payment Email Template
 *
 * Admin notification for new subscription payments
 */

import { Section, Text, Row, Column, Link } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface NewSubscriptionPaymentEmailProps {
  userName: string;
  userEmail: string;
  tenantName: string;
  tenantSlug: string;
  planName: string;
  formattedAmount: string;
  billingInterval: 'month' | 'year';
  paymentDate: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export function NewSubscriptionPaymentEmail({
  userName,
  userEmail,
  tenantName,
  tenantSlug,
  planName,
  formattedAmount,
  billingInterval,
  paymentDate,
  stripeCustomerId,
  stripeSubscriptionId,
}: NewSubscriptionPaymentEmailProps) {
  return (
    <BaseLayout
      preview={`Nueva suscripción pagada: ${formattedAmount}`}
      headerTitle="💰 Nueva Suscripci\u00f3n Pagada"
      headerColor="#28a745"
    >
      <Text style={paragraph}>
        &iexcl;Excelente! Un usuario ha pagado una suscripci&oacute;n en Vetify.
      </Text>

      {/* Payment Amount Card */}
      <Section style={paymentCard}>
        <Text style={paymentLabel}>Monto Pagado</Text>
        <Text style={paymentAmount}>{formattedAmount}</Text>
        <Text style={paymentInterval}>
          {billingInterval === 'month' ? 'Mensual' : 'Anual'}
        </Text>
      </Section>

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
          <Column style={detailLabel}>📋 Plan:</Column>
          <Column style={{ ...detailValue, color: '#28a745' }}>{planName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>📅 Fecha de pago:</Column>
          <Column style={detailValue}>{paymentDate}</Column>
        </Row>
        {stripeCustomerId && (
          <Row style={detailRow}>
            <Column style={detailLabel}>💳 Stripe Customer:</Column>
            <Column style={detailValue}>
              <Link
                href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
                style={linkStyle}
              >
                {stripeCustomerId}
              </Link>
            </Column>
          </Row>
        )}
        {stripeSubscriptionId && (
          <Row style={detailRow}>
            <Column style={detailLabel}>🔄 Stripe Subscription:</Column>
            <Column style={detailValue}>
              <Link
                href={`https://dashboard.stripe.com/subscriptions/${stripeSubscriptionId}`}
                style={linkStyle}
              >
                {stripeSubscriptionId}
              </Link>
            </Column>
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
        {stripeCustomerId && (
          <Text style={linkItem}>
            <Link
              href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
              style={linkStyle}
            >
              💳 Ver en Stripe Dashboard
            </Link>
          </Text>
        )}
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

const paymentCard = {
  backgroundColor: '#d4edda',
  borderRadius: '6px',
  border: '2px solid #28a745',
  padding: '20px',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const paymentLabel = {
  margin: '0 0 10px 0',
  color: '#155724',
  fontSize: '14px',
  fontWeight: '600',
};

const paymentAmount = {
  margin: '0',
  color: '#155724',
  fontSize: '32px',
  fontWeight: 'bold',
};

const paymentInterval = {
  margin: '10px 0 0 0',
  color: '#155724',
  fontSize: '14px',
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

export default NewSubscriptionPaymentEmail;
