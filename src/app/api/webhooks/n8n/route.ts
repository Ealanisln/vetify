import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 N8N webhook received:', body);
    
    // Log the automation result
    if (body.workflowType && body.status) {
      // This would update AutomationLog if we had the execution ID
      console.log(`✅ Workflow ${body.workflowType} completed with status: ${body.status}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 