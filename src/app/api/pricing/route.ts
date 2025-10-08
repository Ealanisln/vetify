import { NextResponse } from 'next/server';
import { getStripePrices, getStripeProducts } from '../../../lib/payments/stripe';

export async function GET() {
  try {
    console.log('=== PRICING API: Fetching prices from Stripe ===');
    
    // Fetch actual products and prices from Stripe
    const [products, prices] = await Promise.all([
      getStripeProducts(),
      getStripePrices()
    ]);

    console.log('Stripe products:', products.length);
    console.log('Stripe prices:', prices.length);

    // Group prices by product
    const pricingData = products.map(product => {
      const productPrices = prices.filter(price => price.productId === product.id);
      
      // Separate monthly and yearly prices
      const monthlyPrice = productPrices.find(p => p.interval === 'month');
      const yearlyPrice = productPrices.find(p => p.interval === 'year');

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        features: product.features,
        metadata: 'metadata' in product ? (product as {metadata?: Record<string, string>}).metadata : undefined, // Agregamos metadata para filtros
        prices: {
          monthly: monthlyPrice ? {
            id: monthlyPrice.id,
            unitAmount: monthlyPrice.unitAmount,
            currency: monthlyPrice.currency,
            interval: monthlyPrice.interval,
            intervalCount: monthlyPrice.intervalCount
          } : null,
          yearly: yearlyPrice ? {
            id: yearlyPrice.id,
            unitAmount: yearlyPrice.unitAmount,
            currency: yearlyPrice.currency,
            interval: yearlyPrice.interval,
            intervalCount: yearlyPrice.intervalCount
          } : null
        }
      };
    });

    // Filter out free plans and sort by price
    const activePlans = pricingData
      .filter(plan => {
        // Solo productos con precios válidos
        // Aceptamos productos B2B específicos o productos con pricing válido
        const hasValidPricing = plan.prices.monthly && 
                               plan.prices.monthly.unitAmount != null &&
                               plan.prices.monthly.unitAmount > 0;
        
        // Si tiene metadata type b2b, incluir, sino incluir si tiene precios válidos
        const isB2BOrValid = plan.metadata?.type === 'b2b' || hasValidPricing;
        
        return hasValidPricing && isB2BOrValid;
      })
      .sort((a, b) => {
        const aPrice = a.prices.monthly?.unitAmount || 0;
        const bPrice = b.prices.monthly?.unitAmount || 0;
        return aPrice - bPrice;
      });

    console.log('Active plans:', activePlans.length);
    console.log('=== PRICING API: Success ===');

    return NextResponse.json({
      success: true,
      plans: activePlans,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pricing data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 