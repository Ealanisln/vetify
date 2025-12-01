/**
 * Low Stock Alert Email Template
 *
 * Sent to clinic staff when inventory items are below minimum stock
 */

import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface LowStockItem {
  productName: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  category?: string;
}

interface LowStockAlertEmailProps {
  clinicName: string;
  items: LowStockItem[];
  alertDate: string;
  totalLowStockItems: number;
}

export function LowStockAlertEmail({
  clinicName,
  items,
  alertDate,
  totalLowStockItems,
}: LowStockAlertEmailProps) {
  return (
    <BaseLayout
      preview={`Alerta: ${totalLowStockItems} productos con stock bajo`}
      headerTitle="⚠️ Alerta de Inventario Bajo"
      headerColor="#dc3545"
      footerClinicName={clinicName}
    >
      <Text style={greeting}>Hola,</Text>

      <Text style={paragraph}>
        Se han detectado <strong>{totalLowStockItems} productos</strong> con
        stock bajo en tu inventario de <strong>{clinicName}</strong>.
      </Text>

      {/* Alert Info */}
      <Section style={alertBox}>
        <Text style={alertText}>
          <strong>Fecha de alerta:</strong> {alertDate}
        </Text>
      </Section>

      {/* Products Table */}
      <Section style={sectionBlock}>
        <Text style={sectionTitle}>Productos con Stock Bajo:</Text>

        <Section style={tableContainer}>
          {/* Table Header */}
          <Row style={tableHeader}>
            <Column style={tableHeaderCell}>Producto</Column>
            <Column style={tableHeaderCellCenter}>Stock Actual</Column>
            <Column style={tableHeaderCellCenter}>Stock M&iacute;nimo</Column>
          </Row>

          {/* Table Body */}
          {items.map((item, index) => (
            <Row
              key={index}
              style={{
                ...tableRow,
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
              }}
            >
              <Column style={tableCell}>
                <Text style={productName}>{item.productName}</Text>
                {item.category && (
                  <Text style={productCategory}>{item.category}</Text>
                )}
              </Column>
              <Column style={tableCellCenterDanger}>
                {item.currentStock} {item.unit}
              </Column>
              <Column style={tableCellCenter}>
                {item.minimumStock} {item.unit}
              </Column>
            </Row>
          ))}
        </Section>
      </Section>

      <Text style={footerNote}>
        Por favor, revisa tu inventario y realiza los pedidos necesarios para
        mantener el stock adecuado.
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
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ffc107',
  padding: '15px',
  borderRadius: '4px',
  marginBottom: '30px',
};

const alertText = {
  margin: '0',
  color: '#856404',
  fontSize: '14px',
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

const tableContainer = {
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  overflow: 'hidden' as const,
};

const tableHeader = {
  backgroundColor: '#f8f9fa',
  borderBottom: '2px solid #e9ecef',
};

const tableHeaderCell = {
  padding: '12px',
  color: '#333333',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'left' as const,
};

const tableHeaderCellCenter = {
  padding: '12px',
  color: '#333333',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'center' as const,
};

const tableRow = {
  borderBottom: '1px solid #e9ecef',
};

const tableCell = {
  padding: '12px',
};

const tableCellCenter = {
  padding: '12px',
  color: '#666666',
  fontSize: '14px',
  textAlign: 'center' as const,
};

const tableCellCenterDanger = {
  padding: '12px',
  color: '#dc3545',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'center' as const,
};

const productName = {
  margin: '0',
  color: '#333333',
  fontSize: '14px',
  fontWeight: '600',
};

const productCategory = {
  margin: '4px 0 0 0',
  color: '#999999',
  fontSize: '12px',
};

const footerNote = {
  margin: '0',
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
};

export default LowStockAlertEmail;
