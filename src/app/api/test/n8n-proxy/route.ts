import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to test n8n webhook communication
 * This helps bypass CORS issues and provides better error handling
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    
    console.log('🔄 Proxying request to n8n:', body);
    
    // Use the correct n8n URL - hardcoded to ensure it works
    const n8nUrl = 'https://n8n.alanis.dev';
    const endpoint = body.endpoint || '/webhook/pet-welcome';
    
    // Make sure we're using the external n8n URL, not localhost
    const fullUrl = `${n8nUrl}${endpoint}`;
    
    console.log('📡 Sending to n8n:', fullUrl);
    
    // Forward the request to n8n
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vetify-Proxy/1.0'
      },
      body: JSON.stringify(body.payload || body)
    });
    
    console.log('📊 N8N Response Status:', response.status);
    console.log('📋 N8N Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response data with better error handling
    let responseData;
    const contentType = response.headers.get('content-type');
    const responseText = await response.text();
    
    console.log('📄 N8N Raw Response:', responseText);
    
    if (responseText.trim() === '') {
      // Empty response
      responseData = { 
        message: 'Empty response from n8n',
        success: response.ok 
      };
    } else if (contentType && contentType.includes('application/json')) {
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        responseData = { 
          message: 'Invalid JSON response from n8n',
          rawResponse: responseText,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        };
      }
    } else {
      responseData = { 
        message: responseText || 'Non-JSON response from n8n',
        contentType: contentType 
      };
    }
    
    console.log('📄 N8N Parsed Response Data:', responseData);
    
    // Return the response from n8n
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: responseData,
      url: fullUrl,
      timestamp: new Date().toISOString()
    }, { 
      status: response.ok ? 200 : response.status 
    });
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
}

/**
 * Handle GET requests for testing
 */
export async function GET() {
  return NextResponse.json({
    message: 'N8N Proxy endpoint is working',
    usage: 'Send POST requests with payload to proxy to n8n',
    n8nUrl: 'https://n8n.alanis.dev',
    example: {
      endpoint: '/webhook/pet-welcome',
      payload: {
        petName: 'Test Pet',
        ownerPhone: '5214777314130'
      }
    }
  });
} 