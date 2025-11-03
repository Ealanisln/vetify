import { NextResponse } from 'next/server';
import { getStripePrices, getStripeProducts } from '../../../lib/payments/stripe';

export async function GET() {
  try {
    // Fetch actual products and prices from Stripe
    const [products, prices] = await Promise.all([
      getStripeProducts(),
      getStripePrices()
    ]);

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

    // Filter only the correct Vetify products (basico, profesional)
    // Corporativo se maneja por separado en el frontend como cotización
    const VALID_PRODUCT_IDS = [
      'prod_TGDXKD2ksDenYm', // Plan Básico
      'prod_TGDXLJxNFGsF9X'  // Plan Profesional
    ];

    const activePlans = pricingData
      .filter(plan => {
        // Only include our 2 valid Vetify subscription products (Corporativo is custom quote)
        return VALID_PRODUCT_IDS.includes(plan.id);
      })
      .sort((a, b) => {
        const aPrice = a.prices.monthly?.unitAmount || 0;
        const bPrice = b.prices.monthly?.unitAmount || 0;
        return aPrice - bPrice;
      });

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