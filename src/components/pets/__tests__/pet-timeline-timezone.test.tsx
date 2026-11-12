/**
 * The pet timeline renders on the server (UTC). Dates must come out in the
 * clinic timezone, staff must show, notes keep their line breaks and the
 * vaccine stage uses Spanish labels.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { MedicalHistoryCard } from '../MedicalHistoryCard';
import { TreatmentTimelineCard } from '../TreatmentTimelineCard';

const BOGOTA = 'America/Bogota';

describe('MedicalHistoryCard in the clinic timezone', () => {
  const history = {
    id: 'h-1',
    tenantId: 't-1',
    petId: 'p-1',
    // 02:30 UTC on Nov 13 is 21:30 on Nov 12 in Bogotá
    visitDate: new Date('2026-11-13T02:30:00Z'),
    reasonForVisit: 'Control rutinario',
    diagnosis: 'Sano',
    treatment: null,
    notes: 'SÍNTOMAS: Tos\n\nReposo',
    medicalOrderId: null,
    staffId: 's-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    staff: { id: 's-1', name: 'Dra. Ruiz' },
  };

  it('formats the visit date and time in the clinic timezone and shows who attended', () => {
    render(<MedicalHistoryCard pet={{ id: 'p-1', name: 'Firulais', medicalHistories: [history as any] }} timeZone={BOGOTA} />);

    expect(screen.getByText('12 nov 2026')).toBeInTheDocument();
    expect(screen.getByText('21:30')).toBeInTheDocument();
    expect(screen.getByText('Dra. Ruiz')).toBeInTheDocument();
  });

  it('keeps line breaks in the notes', () => {
    render(<MedicalHistoryCard pet={{ id: 'p-1', name: 'Firulais', medicalHistories: [history as any] }} timeZone={BOGOTA} />);

    expect(screen.getByText(/SÍNTOMAS: Tos/)).toHaveClass('whitespace-pre-line');
  });

  it('does not show the legacy "N/A" diagnosis of vital signs entries', () => {
    const vitals = { ...history, reasonForVisit: 'Registro de Signos Vitales', diagnosis: 'N/A', treatment: 'N/A' };
    render(<MedicalHistoryCard pet={{ id: 'p-1', name: 'Firulais', medicalHistories: [vitals as any] }} timeZone={BOGOTA} />);

    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
  });
});

describe('TreatmentTimelineCard in the clinic timezone', () => {
  const treatment = {
    id: 'tr-1',
    tenantId: 't-1',
    petId: 'p-1',
    treatmentType: 'VACCINATION',
    productName: 'Nobivac Rabia',
    // Saved at clinic noon by the new flow
    administrationDate: new Date('2026-11-12T17:00:00Z'),
    batchNumber: null,
    manufacturer: null,
    staffId: 's-1',
    notes: 'Dosis: 1 ml\nFrecuencia: única',
    createdAt: new Date(),
    updatedAt: new Date(),
    vaccineStage: 'PUPPY_KITTEN',
    dewormingType: null,
    staff: { id: 's-1', name: 'Dr. Pérez' },
  };

  it('shows the Spanish vaccine stage, the staff and the date', () => {
    render(<TreatmentTimelineCard pet={{ id: 'p-1', treatmentRecords: [treatment as any] }} timeZone={BOGOTA} />);

    expect(screen.getByText(/Cachorro\/Gatito/)).toBeInTheDocument();
    expect(screen.queryByText(/PUPPY_KITTEN/)).not.toBeInTheDocument();
    expect(screen.getByText('Dr. Pérez')).toBeInTheDocument();
    expect(screen.getByText('12 nov 2026')).toBeInTheDocument();
  });

  it('keeps the calendar day of legacy rows saved as UTC midnight', () => {
    const legacy = { ...treatment, administrationDate: new Date('2026-11-12T00:00:00Z') };
    render(<TreatmentTimelineCard pet={{ id: 'p-1', treatmentRecords: [legacy as any] }} timeZone={BOGOTA} />);

    expect(screen.getByText('12 nov 2026')).toBeInTheDocument();
  });

  it('shows the deworming type in Spanish and keeps note line breaks', () => {
    const deworming = { ...treatment, treatmentType: 'DEWORMING', vaccineStage: null, dewormingType: 'INTERNAL' };
    render(<TreatmentTimelineCard pet={{ id: 'p-1', treatmentRecords: [deworming as any] }} timeZone={BOGOTA} />);

    expect(screen.getByText(/Interna/)).toBeInTheDocument();
    expect(screen.getByText(/Dosis: 1 ml/)).toHaveClass('whitespace-pre-line');
  });
});
