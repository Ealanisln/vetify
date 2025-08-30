import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getFullReportsData } from '../../../lib/reports';

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'all';
    
    // Get comprehensive reports data
    const reportsData = await getFullReportsData(tenant.id as string);
    
    // Filter based on report type if specified
    if (reportType !== 'all') {
      const filteredData = { [reportType]: reportsData[reportType as keyof typeof reportsData] };
      return NextResponse.json(filteredData);
    }
    
    return NextResponse.json(reportsData);
  } catch (error) {
    console.error('Error fetching reports:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 