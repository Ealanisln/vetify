/**
 * Payment Failed Alert Email Template
 *
 * Admin notification for failed payments and critical subscription issues
 */

import { Section, Text, Row, Column, Link } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface PaymentFailedAlertEmailProps {
  tenantName: string;
  tenantSlug: string;
  userName?: string;
  userEmail?: string;
  failureReason: string;
  invoiceId?: string;
  formattedAmount?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  failureDate: string;
}

export function PaymentFailedAlertEmail({
  tenantName,
  tenantSlug,
  userName,
  userEmail,
  failureReason,
  invoiceId,
  formattedAmount,
  stripeCustomerId,
  stripeSubscriptionId,
  failureDate,
}: PaymentFailedAlertEmailProps) {
  return (
    <BaseLayout
      preview={`Pago fallido: ${tenantName}`}
      headerTitle="&#x26A0;&#xFE0F; Pago Fallido"
      headerColor="#dc3545"
    >
      <Text style={paragraph}>
        Se ha detectado un problema con un pago en Vetify. Requiere atenci&oacute;n.
      </Text>

      {/* Alert Card */}
      <Section style={alertCard}>
        <Text style={alertLabel}>Motivo del Fallo</Text>
        <Text style={alertReason}>{failureReason}</Text>
        {formattedAmount && (
          <Text style={alertAmount}>Monto: {formattedAmount}</Text>
        )}
      </Section>

      {/* Details Card */}
      <Section style={detailsCard}>
        <Row style={detailRow}>
          <Column style={detailLabel}>&#x1F3E5; Cl&iacute;nica:</Column>
          <Column style={detailValue}>{tenantName}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>&#x1F517; Slug:</Column>
          <Column style={detailValue}>{tenantSlug}</Column>
        </Row>
        {userName && (
          <Row style={detailRow}>
            <Column style={detailLabel}>&#x1F464; Usuario:</Column>
            <Column style={detailValue}>{userName}</Column>
          </Row>
        )}
        {userEmail && (
          <Row style={detailRow}>
            <Column style={detailLabel}>&#x1F4E7; Email:</Column>
            <Column style={detailValue}>{userEmail}</Column>
          </Row>
        )}
        <Row style={detailRow}>
          <Column style={detailLabel}>&#x1F4C5; Fecha:</Column>
          <Column style={detailValue}>{failureDate}</Column>
        </Row>
        {invoiceId && (
          <Row style={detailRow}>
            <Column style={detailLabel}>&#x1F9FE; Invoice:</Column>
            <Column style={detailValue}>
              <Link
                href={`https://dashboard.stripe.com/invoices/${invoiceId}`}
                style={linkStyle}
              >
                {invoiceId}
              </Link>
            </Column>
          </Row>
        )}
        {stripeCustomerId && (
          <Row style={detailRow}>
            <Column style={detailLabel}>&#x1F4B3; Customer:</Column>
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
            <Column style={detailLabel}>&#x1F504; Subscription:</Column>
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
        <Text style={sectionTitle}>&#x1F517; Acciones Sugeridas</Text>
        {stripeCustomerId && (
          <Text style={linkItem}>
            <Link
              href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
              style={linkStyle}
            >
              &#x1F4B3; Ver cliente en Stripe Dashboard
            </Link>
          </Text>
        )}
        {userEmail && (
          <Text style={linkItem}>
            <Link href={`mailto:${userEmail}`} style={linkStyle}>
              &#x1F4E7; Contactar al usuario
            </Link>
          </Text>
        )}
        <Text style={linkItem}>
          <Link
            href={`https://app.vetify.pro/${tenantSlug}`}
            style={linkStyle}
          >
            &#x1F4CA; Ver Dashboard del Tenant
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

const alertCard = {
  backgroundColor: '#f8d7da',
  borderRadius: '6px',
  border: '2px solid #dc3545',
  padding: '20px',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const alertLabel = {
  margin: '0 0 10px 0',
  color: '#721c24',
  fontSize: '14px',
  fontWeight: '600',
};

const alertReason = {
  margin: '0',
  color: '#721c24',
  fontSize: '18px',
  fontWeight: 'bold',
};

const alertAmount = {
  margin: '10px 0 0 0',
  color: '#721c24',
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

export default PaymentFailedAlertEmail;
