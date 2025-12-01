/**
 * Base Email Layout Component
 *
 * Shared layout wrapper with Vetify branding for all transactional emails
 */

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseLayoutProps {
  preview: string;
  headerTitle: string;
  headerColor?: string;
  footerClinicName?: string;
  children: React.ReactNode;
}

export const BRAND_COLOR = '#75a99c';

export function BaseLayout({
  preview,
  headerTitle,
  headerColor = BRAND_COLOR,
  footerClinicName,
  children,
}: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: headerColor }}>
            <Text style={headerText}>{headerTitle}</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            {footerClinicName && (
              <Text style={footerClinicText}>{footerClinicName}</Text>
            )}
            <Text style={footerText}>
              Enviado por Vetify - Sistema de Gesti&oacute;n Veterinaria
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden' as const,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const header = {
  padding: '30px',
  textAlign: 'center' as const,
};

const headerText = {
  margin: '0',
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
};

const content = {
  padding: '40px 30px',
};

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '20px 30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e9ecef',
};

const footerClinicText = {
  margin: '0 0 8px 0',
  color: '#666666',
  fontSize: '12px',
};

const footerText = {
  margin: '0',
  color: '#999999',
  fontSize: '12px',
};

export default BaseLayout;
