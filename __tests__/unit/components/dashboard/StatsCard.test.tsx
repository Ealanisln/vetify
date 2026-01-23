/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/StatsCard';

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Total Mascotas',
    value: 42,
    icon: '🐕',
  };

  describe('Basic Rendering', () => {
    it('should render title correctly', () => {
      render(<StatsCard {...defaultProps} />);

      expect(screen.getByText('Total Mascotas')).toBeInTheDocument();
    });

    it('should render numeric value with locale formatting', () => {
      render(<StatsCard {...defaultProps} value={1234} />);

      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should render string value as-is', () => {
      render(<StatsCard {...defaultProps} value="N/A" />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should render icon', () => {
      render(<StatsCard {...defaultProps} />);

      expect(screen.getByText('🐕')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatsCard {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Limit Display', () => {
    it('should display limit when provided with numeric value', () => {
      render(<StatsCard {...defaultProps} value={42} limit={100} />);

      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });

    it('should NOT display limit when value is a string', () => {
      render(<StatsCard {...defaultProps} value="Active" limit={100} />);

      expect(screen.queryByText('/ 100')).not.toBeInTheDocument();
    });

    it('should display progress bar when limit is provided', () => {
      const { container } = render(
        <StatsCard {...defaultProps} value={42} limit={100} />
      );

      const progressBar = container.querySelector('.h-2.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display percentage text', () => {
      render(<StatsCard {...defaultProps} value={42} limit={100} />);

      expect(screen.getByText('42%')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate percentage correctly', () => {
      render(<StatsCard {...defaultProps} value={50} limit={100} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should cap percentage at 100% in progress bar width', () => {
      const { container } = render(
        <StatsCard {...defaultProps} value={150} limit={100} />
      );

      const innerProgressBar = container.querySelector('[style*="width"]');
      expect(innerProgressBar).toHaveStyle({ width: '100%' });
    });

    it('should display actual percentage text even when over 100%', () => {
      render(<StatsCard {...defaultProps} value={150} limit={100} />);

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should handle zero limit without errors', () => {
      render(<StatsCard {...defaultProps} value={0} limit={0} />);

      // Should render without crashing
      expect(screen.getByText('Total Mascotas')).toBeInTheDocument();
    });
  });

  describe('Near Limit Warning', () => {
    it('should show warning when usage is above 80%', () => {
      render(<StatsCard {...defaultProps} value={85} limit={100} />);

      expect(screen.getByText('Cerca del límite')).toBeInTheDocument();
    });

    it('should NOT show warning when usage is at 80%', () => {
      render(<StatsCard {...defaultProps} value={80} limit={100} />);

      expect(screen.queryByText('Cerca del límite')).not.toBeInTheDocument();
    });

    it('should NOT show warning when usage is below 80%', () => {
      render(<StatsCard {...defaultProps} value={50} limit={100} />);

      expect(screen.queryByText('Cerca del límite')).not.toBeInTheDocument();
    });

    it('should use yellow styling when near limit', () => {
      const { container } = render(
        <StatsCard {...defaultProps} value={85} limit={100} />
      );

      const progressBarInner = container.querySelector('.bg-yellow-500');
      expect(progressBarInner).toBeInTheDocument();
    });

    it('should use blue styling when NOT near limit', () => {
      const { container } = render(
        <StatsCard {...defaultProps} value={50} limit={100} />
      );

      const progressBarInner = container.querySelector('.bg-blue-600');
      expect(progressBarInner).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('should display positive trend with arrow up', () => {
      render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 10, isPositive: true }}
        />
      );

      expect(screen.getByText('↗')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('should display negative trend with arrow down', () => {
      render(
        <StatsCard
          {...defaultProps}
          trend={{ value: -5, isPositive: false }}
        />
      );

      expect(screen.getByText('↘')).toBeInTheDocument();
      expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('should use green color for positive trend', () => {
      const { container } = render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 10, isPositive: true }}
        />
      );

      const trendElement = container.querySelector('.text-green-600');
      expect(trendElement).toBeInTheDocument();
    });

    it('should use red color for negative trend', () => {
      const { container } = render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 5, isPositive: false }}
        />
      );

      const trendElement = container.querySelector('.text-red-600');
      expect(trendElement).toBeInTheDocument();
    });

    it('should NOT display trend when not provided', () => {
      render(<StatsCard {...defaultProps} />);

      expect(screen.queryByText('↗')).not.toBeInTheDocument();
      expect(screen.queryByText('↘')).not.toBeInTheDocument();
    });

    it('should display absolute value of trend percentage', () => {
      render(
        <StatsCard
          {...defaultProps}
          trend={{ value: -15, isPositive: false }}
        />
      );

      // Should show 15%, not -15%
      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Styling', () => {
    it('should have dark mode classes', () => {
      const { container } = render(<StatsCard {...defaultProps} />);

      expect(container.firstChild).toHaveClass('dark:bg-gray-800');
      expect(container.firstChild).toHaveClass('dark:border-gray-700');
    });
  });

  describe('Edge Cases', () => {
    it('should handle value of 0', () => {
      render(<StatsCard {...defaultProps} value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      render(<StatsCard {...defaultProps} value={1000000} />);

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('should handle decimal percentage', () => {
      render(<StatsCard {...defaultProps} value={33} limit={100} />);

      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should round percentage to whole number', () => {
      render(<StatsCard {...defaultProps} value={1} limit={3} />);

      // 33.333...% should be displayed as 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should handle empty className', () => {
      const { container } = render(
        <StatsCard {...defaultProps} className="" />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
