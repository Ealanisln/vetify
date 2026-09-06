/**
 * Trial Activation Nudge Email Template
 *
 * Sent from day 2 to trial clinics that still have zero pets registered.
 */

import { Section, Text, Button } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface TrialActivationNudgeEmailProps {
  clinicName: string;
  ownerName: string;
  createPetUrl: string;
}

export function TrialActivationNudgeEmail({
  clinicName,
  ownerName,
  createPetUrl,
}: TrialActivationNudgeEmailProps) {
  return (
    <BaseLayout
      preview="Registra a tu primera mascota en Vetify"
      headerTitle="🐶 Tu primera mascota te espera"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Vimos que <strong>{clinicName}</strong> todav&iacute;a no tiene
        mascotas registradas. Sin eso, Vetify no puede mostrarte lo que hace
        de verdad.
      </Text>

      <Text style={paragraph}>
        Registrar la primera toma menos de un minuto: nombre, especie y
        due&ntilde;o. Con eso ya puedes agendar su primera cita y llevar su
        historial cl&iacute;nico.
      </Text>

      <Section style={ctaSection}>
        <Button style={ctaButton} href={createPetUrl}>
          Registrar una mascota
        </Button>
      </Section>

      <Text style={footerNote}>
        &iquest;Te atoraste con algo? Responde a este correo y te ayudamos a
        dejar tu cl&iacute;nica lista.
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
  margin: '0 0 20px 0',
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.6',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '10px 0 30px 0',
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

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default TrialActivationNudgeEmail;
