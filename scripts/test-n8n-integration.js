#!/usr/bin/env node

/**
 * Test script for N8N + WhatsApp integration
 * Run with: node scripts/test-n8n-integration.js
 */

import fetch from 'node-fetch';

// Configuration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.alanis.dev';
const TEST_PHONE = process.env.TEST_PHONE || '5215512345678'; // Replace with your test phone

async function testPetWelcomeWorkflow() {
  console.log('🚀 Testing Pet Welcome Workflow...');
  
  const payload = {
    petName: 'Firulais Test',
    petSpecies: 'Perro',
    ownerName: 'Juan Pérez',
    ownerPhone: TEST_PHONE,
    clinicName: 'Clínica Veterinaria Test',
    timestamp: new Date().toISOString(),
    source: 'vetify-crm-test'
  };

  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/webhook/pet-welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Pet Welcome workflow triggered successfully!');
      console.log('📱 Check your WhatsApp for the welcome message');
      console.log('📊 Response:', result);
    } else {
      console.error('❌ Pet Welcome workflow failed:', result);
    }
  } catch (error) {
    console.error('❌ Error testing Pet Welcome workflow:', error.message);
  }
}

async function testVaccinationReminderWorkflow() {
  console.log('\n💉 Testing Vaccination Reminder Workflow...');
  
  const payload = {
    petName: 'Firulais Test',
    ownerName: 'Juan Pérez',
    ownerPhone: TEST_PHONE,
    vaccinationType: 'Rabia',
    dueDate: '2024-02-15',
    clinicName: 'Clínica Veterinaria Test',
    clinicPhone: '55-1234-5678',
    timestamp: new Date().toISOString(),
    source: 'vetify-crm-test'
  };

  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/webhook/vaccination-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Vaccination Reminder workflow triggered successfully!');
      console.log('📱 Check your WhatsApp for the reminder message');
      console.log('📊 Response:', result);
    } else {
      console.error('❌ Vaccination Reminder workflow failed:', result);
    }
  } catch (error) {
    console.error('❌ Error testing Vaccination Reminder workflow:', error.message);
  }
}

async function testN8NConnectivity() {
  console.log('\n🔗 Testing N8N connectivity...');
  
  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/healthz`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ N8N server is reachable');
    } else {
      console.log('⚠️  N8N server responded but may have issues');
    }
  } catch (error) {
    console.error('❌ Cannot reach N8N server:', error.message);
    console.log('💡 Make sure N8N_WEBHOOK_URL is correct and N8N is running');
  }
}

async function main() {
  console.log('🎯 Vetify N8N + WhatsApp Integration Test');
  console.log('==========================================');
  
  if (!TEST_PHONE) {
    console.error('❌ Please set TEST_PHONE environment variable');
    console.log('Example: TEST_PHONE=5215512345678 node scripts/test-n8n-integration.js');
    process.exit(1);
  }
  
  console.log(`📞 Test phone: ${TEST_PHONE}`);
  console.log(`🔗 N8N URL: ${N8N_WEBHOOK_URL}`);
  
  await testN8NConnectivity();
  await testPetWelcomeWorkflow();
  await testVaccinationReminderWorkflow();
  
  console.log('\n🎉 Test completed!');
  console.log('📱 Check your WhatsApp messages');
  console.log('🔍 Check N8N execution logs for details');
}

// Run the tests
main().catch(console.error); 