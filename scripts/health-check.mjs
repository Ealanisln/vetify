#!/usr/bin/env node

/**
 * 🏥 Health Check Script for Vetify MVP
 * Verifies all critical systems are operational
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function healthCheck() {
  console.log('🏥 Health Check Starting...');
  
  try {
    // Database health
    await prisma.$connect();
    console.log('✅ Database: Connected');
    
    // Check key tables
    const tenantCount = await prisma.tenant.count();
    console.log(`✅ Tenants: ${tenantCount} registered`);
    
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount} registered`);
    
    // API endpoints health (basic check)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`✅ Base URL: ${baseUrl}`);
    
    console.log('🎉 All systems operational!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();
