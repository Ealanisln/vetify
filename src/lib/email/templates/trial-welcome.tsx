/**
 * Trial Welcome Email Template
 *
 * Sent on day 0, right after the clinic is created. Its only job is to get
 * the owner to register the first pet.
 */

import { Section, Text, Button, Link } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface TrialWelcomeEmailProps {
  clinicName: string;
  ownerName: string;
  trialEndsDate: string;
  createPetUrl: string;
  dashboardUrl: string;
}

export function TrialWelcomeEmail({
  clinicName,
  ownerName,
  trialEndsDate,
  createPetUrl,
  dashboardUrl,
}: TrialWelcomeEmailProps) {
  return (
    <BaseLayout
      preview={`${clinicName} ya está lista en Vetify`}
      headerTitle="🐾 Tu clínica ya está lista"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong>{clinicName}</strong> ya tiene su espacio en Vetify. Tu prueba
        gratuita est&aacute; activa hasta el <strong>{trialEndsDate}</strong> y
        durante ese tiempo puedes usar todo sin l&iacute;mites.
      </Text>

      <Section style={highlightBox}>
        <Text style={highlightTitle}>El mejor primer paso</Text>
        <Text style={highlightText}>
          Registra a tu primera mascota. Toma menos de un minuto (nombre,
          especie y due&ntilde;o) y a partir de ah&iacute; las citas, el
          historial y los recordatorios empiezan a tener sentido.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={ctaButton} href={createPetUrl}>
          Registrar mi primera mascota
        </Button>
      </Section>

      <Text style={secondaryLinkText}>
        O si prefieres explorar primero,{' '}
        <Link href={dashboardUrl} style={secondaryLink}>
          entra a tu panel
        </Link>
        .
      </Text>

      <Text style={footerNote}>
        &iquest;Tienes dudas? Responde a este correo y te contestamos.
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

const highlightBox = {
  backgroundColor: '#f0f7f5',
  borderLeft: `4px solid ${BRAND_COLOR}`,
  padding: '20px',
  borderRadius: '4px',
  marginBottom: '30px',
};

const highlightTitle = {
  margin: '0 0 8px 0',
  color: '#333333',
  fontSize: '16px',
  fontWeight: '600',
};

const highlightText = {
  margin: '0',
  color: '#666666',
  fontSize: '15px',
  lineHeight: '1.6',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '20px',
};

const ctaButton = {
  backgroundColor: BRAND_COLOR,
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
};

const secondaryLinkText = {
  margin: '0 0 30px 0',
  color: '#666666',
  fontSize: '14px',
  textAlign: 'center' as const,
};

const secondaryLink = {
  color: BRAND_COLOR,
  textDecoration: 'underline',
};

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default TrialWelcomeEmail;
