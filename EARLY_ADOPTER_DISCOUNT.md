# Early Adopter Discount Program

## Overview
25% discount for the first 6 months on all plans to reward early adopters during launch.

## Stripe Coupons (Test Mode)

### Individual Plan Coupons
- **Early Adopter - Plan Profesional**: `LYbqDfX9`
  - 25% off for 6 months
  - Applies to: Plan Profesional ($599/mo → $449/mo)

- **Early Adopter - Plan Clínica**: `xmV66JdQ`
  - 25% off for 6 months
  - Applies to: Plan Clínica ($999/mo → $749/mo)

- **Early Adopter - Plan Empresa**: `y0HdrUMH`
  - 25% off for 6 months
  - Applies to: Plan Empresa ($1,799/mo → $1,349/mo)

### Master Promo Code
- **Code**: `FUNDADOR25` (suggested - map to coupon: `EeQ7Uvl4`)
- **Description**: "Early Adopter Special - 25% Off"
- 25% off for 6 months
- Applies to: All plans

## Checkout Configuration

The checkout flow already has `allow_promotion_codes: true` enabled in:
- `src/lib/payments/stripe.ts:188`
- `src/lib/payments/stripe.ts:273`

Users can enter the promo code at checkout.

## UI Updates

### Components Updated
1. **Hero Section** (`src/components/hero-section.tsx`)
   - Added EarlyAdopterBanner at top of section

2. **Pricing Section** (`src/components/pricing-section.tsx`)
   - Shows discounted pricing with strikethrough original price
   - Displays "25% OFF" badge
   - Shows savings amount per month
   - Includes banner with promo code `FUNDADOR25`

3. **New Component** (`src/components/marketing/EarlyAdopterBanner.tsx`)
   - Reusable banner component
   - Two variants: "hero" and "pricing"

## Marketing Copy

### Messaging
- "🎉 Oferta de Lanzamiento: 25% de descuento los primeros 6 meses"
- "Oferta Exclusiva para Fundadores"
- "Por 6 meses • Luego [precio normal]/mes"

### Promo Code Display
- Shown in pricing section footer
- Format: `FUNDADOR25` in monospace font with highlight

## Next Steps

### To Activate in Production:
1. Create the same coupons in Stripe Production mode
2. Create promotion code "FUNDADOR25" in Stripe Production
3. Update coupon IDs in documentation if needed
4. Set redemption limits if desired (e.g., first 100 customers)
5. Set expiration date for the promotion if desired

### Optional Enhancements:
- Add countdown timer for urgency
- Track conversions by coupon
- Create landing page specifically for early adopters
- Email campaign announcing the promotion
- Social media graphics with promo code

## Stripe Dashboard

To view/manage coupons:
- Test Mode: https://dashboard.stripe.com/test/coupons
- Production: https://dashboard.stripe.com/coupons

To create promotion codes (user-friendly codes):
- Test Mode: https://dashboard.stripe.com/test/promotion_codes
- Production: https://dashboard.stripe.com/promotion_codes

## Removal Plan

When promotion ends:
1. Deactivate promotion codes in Stripe
2. Archive/deactivate coupons
3. Update UI to remove discount messaging
4. Existing subscribers keep their discount until 6-month period ends (Stripe handles automatically)
