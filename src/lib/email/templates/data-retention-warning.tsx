import { Section, Text, Button } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface DataRetentionWarningEmailProps {
  clinicName: string;
  ownerName: string;
  daysRemaining: number;
  deletionDate: string;
  reactivateUrl: string;
}

const WARNING_COLOR = '#c0392b';

export function DataRetentionWarningEmail({
  clinicName,
  ownerName,
  daysRemaining,
  deletionDate,
  reactivateUrl,
}: DataRetentionWarningEmailProps) {
  return (
    <BaseLayout
      preview={`Importante: la información de ${clinicName} se eliminará en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`}
      headerTitle="⚠️ Información por Eliminarse"
      headerColor={WARNING_COLOR}
      footerClinicName={clinicName}
    >
      <Text style={greeting}>
        Hola <strong>{ownerName}</strong>,
      </Text>

      <Text style={paragraph}>
        Tu suscripci&oacute;n de <strong>Vetify</strong> para{' '}
        <strong>{clinicName}</strong> fue cancelada hace casi 90 d&iacute;as.
        Cumpliendo con nuestra pol&iacute;tica de retenci&oacute;n de datos,
        la informaci&oacute;n de tu cl&iacute;nica est&aacute; programada para
        ser eliminada permanentemente.
      </Text>

      <Section style={alertBox}>
        <Text style={alertText}>
          <strong>
            ⏰ Tu informaci&oacute;n se eliminar&aacute; el {deletionDate}
          </strong>
        </Text>
        <Text style={alertSubtext}>
          Quedan {daysRemaining} d&iacute;a{daysRemaining !== 1 ? 's' : ''}{' '}
          para evitar la eliminaci&oacute;n.
        </Text>
      </Section>

      <Section style={detailsCard}>
        <Text style={sectionTitle}>Qu&eacute; se eliminar&aacute;:</Text>
        <Text style={bullet}>• Historiales cl&iacute;nicos de pacientes</Text>
        <Text style={bullet}>• Registro de mascotas y propietarios</Text>
        <Text style={bullet}>• Historial de citas y consultas</Text>
        <Text style={bullet}>• Inventario y registros de ventas</Text>
        <Text style={bullet}>• Configuraci&oacute;n de tu cl&iacute;nica</Text>
        <Text style={paragraph}>
          Esta acci&oacute;n es <strong>permanente e irreversible</strong>.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={ctaButton} href={reactivateUrl}>
          Reactivar mi suscripci&oacute;n
        </Button>
      </Section>

      <Text style={footerNote}>
        Si reactivas tu suscripci&oacute;n antes de la fecha de eliminaci&oacute;n,
        toda tu informaci&oacute;n permanecer&aacute; intacta. Si necesitas
        ayuda o quieres exportar tus datos antes de la eliminaci&oacute;n,
        responde a este correo y te asistiremos lo antes posible.
      </Text>
    </BaseLayout>
  );
}

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

const alertBox = {
  backgroundColor: '#fdecea',
  borderLeft: `4px solid ${WARNING_COLOR}`,
  padding: '20px',
  borderRadius: '4px',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const alertText = {
  margin: '0',
  color: WARNING_COLOR,
  fontSize: '18px',
};

const alertSubtext = {
  margin: '8px 0 0 0',
  color: WARNING_COLOR,
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

const bullet = {
  margin: '0 0 8px 0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
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

export default DataRetentionWarningEmail;
