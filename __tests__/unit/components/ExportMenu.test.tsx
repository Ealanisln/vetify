import { render, screen, fireEvent } from '@testing-library/react';
import ExportMenu from '@/components/reports/ExportMenu';

describe('ExportMenu', () => {
  let mockExportCSV: jest.Mock;
  let mockExportExcel: jest.Mock;
  let mockExportPDF: jest.Mock;

  beforeEach(() => {
    mockExportCSV = jest.fn();
    mockExportExcel = jest.fn();
    mockExportPDF = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the export button', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('should not show dropdown menu initially', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should show dropdown menu when button is clicked', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    fireEvent.click(screen.getByText('Exportar'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should toggle dropdown on repeated clicks', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    const button = screen.getByText('Exportar');

    // Open
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Close
    fireEvent.click(button);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should call onExportCSV and close menu when CSV is clicked', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    fireEvent.click(screen.getByText('Exportar'));
    fireEvent.click(screen.getByText('CSV'));

    expect(mockExportCSV).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should call onExportExcel and close menu when Excel is clicked', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    fireEvent.click(screen.getByText('Exportar'));
    fireEvent.click(screen.getByText('Excel (.xlsx)'));

    expect(mockExportExcel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should call onExportPDF and close menu when PDF is clicked', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    fireEvent.click(screen.getByText('Exportar'));
    fireEvent.click(screen.getByText('PDF'));

    expect(mockExportPDF).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should disable button when disabled prop is true', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
        disabled
      />
    );

    const button = screen.getByText('Exportar').closest('button');
    expect(button).toBeDisabled();
  });

  it('should not open menu when disabled', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
        disabled
      />
    );

    fireEvent.click(screen.getByText('Exportar'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should have proper menu item roles', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
      />
    );

    fireEvent.click(screen.getByText('Exportar'));

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(3);
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ExportMenu
          onExportCSV={mockExportCSV}
          onExportExcel={mockExportExcel}
          onExportPDF={mockExportPDF}
        />
      </div>
    );

    // Open menu
    fireEvent.click(screen.getByText('Exportar'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <ExportMenu
        onExportCSV={mockExportCSV}
        onExportExcel={mockExportExcel}
        onExportPDF={mockExportPDF}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('export-menu')).toHaveClass('custom-class');
  });
});
