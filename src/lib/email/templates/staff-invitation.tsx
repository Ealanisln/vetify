/**
 * Staff Invitation Email Template
 *
 * Sent when a tenant admin invites a staff member to join the platform.
 */

import {
  Button,
  Heading,
  Hr,
  Link,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout, BRAND_COLOR } from './base-layout';

interface StaffInvitationEmailProps {
  staffName: string;
  clinicName: string;
  position: string;
  inviteUrl: string;
  expirationDays?: number;
}

export function StaffInvitationEmail({
  staffName,
  clinicName,
  position,
  inviteUrl,
  expirationDays = 7,
}: StaffInvitationEmailProps) {
  const positionLabels: Record<string, string> = {
    MANAGER: 'Administrador',
    VETERINARIAN: 'Veterinario',
    VETERINARY_TECHNICIAN: 'Técnico Veterinario',
    ASSISTANT: 'Asistente',
    RECEPTIONIST: 'Recepcionista',
    GROOMER: 'Groomer',
    OTHER: 'Personal',
  };

  const positionLabel = positionLabels[position] || position;

  return (
    <BaseLayout
      preview={`${clinicName} te ha invitado a unirte como ${positionLabel}`}
      headerTitle="Invitación al Equipo"
      footerClinicName={clinicName}
    >
      <Heading style={heading}>
        ¡Hola, {staffName}!
      </Heading>

      <Text style={paragraph}>
        Has sido invitado/a a unirte al equipo de <strong>{clinicName}</strong> como{' '}
        <strong>{positionLabel}</strong>.
      </Text>

      <Text style={paragraph}>
        Con tu cuenta podrás acceder al sistema de gestión veterinaria y
        colaborar con el equipo según los permisos asignados a tu rol.
      </Text>

      <Button style={button} href={inviteUrl}>
        Aceptar Invitación
      </Button>

      <Text style={smallText}>
        O copia y pega este enlace en tu navegador:
      </Text>
      <Link href={inviteUrl} style={link}>
        {inviteUrl}
      </Link>

      <Hr style={hr} />

      <Text style={infoText}>
        <strong>Importante:</strong>
      </Text>
      <Text style={listItem}>
        • Esta invitación expira en {expirationDays} días
      </Text>
      <Text style={listItem}>
        • Deberás crear una cuenta o iniciar sesión con el email:{' '}
        <strong>{staffName}</strong>
      </Text>
      <Text style={listItem}>
        • Una vez aceptada, tendrás acceso inmediato al sistema
      </Text>

      <Hr style={hr} />

      <Text style={footerNote}>
        Si no esperabas esta invitación, puedes ignorar este correo de forma segura.
      </Text>
    </BaseLayout>
  );
}

// Styles
const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 20px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 20px 0',
};

const button = {
  backgroundColor: BRAND_COLOR,
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const smallText = {
  fontSize: '12px',
  color: '#666666',
  margin: '16px 0 8px 0',
};

const link = {
  fontSize: '12px',
  color: BRAND_COLOR,
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
};

const infoText = {
  fontSize: '14px',
  color: '#333333',
  margin: '0 0 12px 0',
};

const listItem = {
  fontSize: '14px',
  color: '#666666',
  margin: '4px 0',
  paddingLeft: '8px',
};

const footerNote = {
  fontSize: '12px',
  color: '#999999',
  fontStyle: 'italic',
  margin: '0',
};

export default StaffInvitationEmail;
