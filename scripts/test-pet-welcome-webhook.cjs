#!/usr/bin/env node

/**
 * Test script for the pet welcome webhook endpoint
 * Usage: node scripts/test-pet-welcome-webhook.js [url]
 */

const https = require('https');
const http = require('http');

// Default to localhost if no URL provided
const webhookUrl = process.argv[2] || 'http://localhost:3000/api/webhooks/n8n/webhook/pet-welcome';

// Test payload that mimics what n8n would send
const testPayload = {
  trigger: 'pet-registration',
  data: {
    petId: 'pet_123456',
    petName: 'Luna',
    ownerName: 'María García',
    ownerPhone: '+34612345678',
    clinicId: 'clinic_001',
    automationType: 'pet-welcome'
  },
  workflowId: 'workflow_pet_welcome_001',
  executionId: 'exec_' + Date.now(),
  timestamp: new Date().toISOString()
};

console.log('🧪 Testing pet welcome webhook...');
console.log('📍 URL:', webhookUrl);
console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

// Parse URL
const url = new URL(webhookUrl);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

// Prepare request options
const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'n8n-webhook-test/1.0'
  }
};

// Make the request
const req = client.request(options, (res) => {
  console.log('\n📊 Response Status:', res.statusCode);
  console.log('📋 Response Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response Body:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
      
      if (res.statusCode === 200 && jsonResponse.success) {
        console.log('\n✅ Test PASSED - Webhook is working correctly!');
      } else {
        console.log('\n❌ Test FAILED - Check the response above');
        process.exit(1);
      }
    } catch (error) {
      console.log('Raw response:', data);
      console.log('\n❌ Test FAILED - Invalid JSON response');
      process.exit(1);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
  
  if (error.code === 'ECONNREFUSED') {
    console.log('\n💡 Make sure your Next.js server is running:');
    console.log('   npm run dev');
    console.log('   # or');
    console.log('   yarn dev');
  }
  
  process.exit(1);
});

// Send the request
req.write(JSON.stringify(testPayload));
req.end();

console.log('\n⏳ Sending request...'); 