/**
 * Trial Check-in Email Template
 *
 * Sent on day 7 of the trial. Plain, short and human: asks what the clinic
 * is missing and invites a reply.
 */

import { Text, Link } from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface TrialCheckinEmailProps {
  clinicName: string;
  ownerName: string;
  dashboardUrl: string;
}

export function TrialCheckinEmail({
  clinicName,
  ownerName,
  dashboardUrl,
}: TrialCheckinEmailProps) {
  return (
    <BaseLayout
      preview="¿Cómo va tu prueba de Vetify?"
      headerTitle="¿Cómo te va con Vetify?"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Ya llevas una semana con <strong>{clinicName}</strong> en Vetify y
        queremos preguntarte directamente:
      </Text>

      <Text style={question}>
        &iquest;Qu&eacute; te est&aacute; faltando?
      </Text>

      <Text style={paragraph}>
        &iquest;Hay algo que esperabas encontrar y no est&aacute;? &iquest;Algo
        que te cuesta usar o que no te queda claro?
      </Text>

      <Text style={paragraph}>
        Responde a este correo con lo que sea, corto o largo. Lo leemos
        nosotros mismos y te contestamos, no un bot.
      </Text>

      <Text style={footerNote}>
        Y si solo quieres seguir explorando,{' '}
        <Link href={dashboardUrl} style={link}>
          aqu&iacute; est&aacute; tu panel
        </Link>
        .
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

const question = {
  margin: '0 0 20px 0',
  color: '#333333',
  fontSize: '20px',
  fontWeight: '600',
};

const link = {
  color: BRAND_COLOR,
  textDecoration: 'underline',
};

const footerNote = {
  margin: '10px 0 0 0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default TrialCheckinEmail;
