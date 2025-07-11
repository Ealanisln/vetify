## 🔍 Problemas Identificados

1. **La página de precios no detecta el plan actual del usuario loggeado**
2. **No hay lógica para mostrar opciones de upgrade/downgrade**
3. **Error "Failed to create checkout session"** - necesita debugging
4. **Falta integración entre useSubscription y PricingPageEnhanced**

## 📋 Plan de Implementación

### 1. **Crear API para detectar plan actual** ⭐️
```typescript
// src/app/api/subscription/current/route.ts
export async function GET() {
  // Obtener usuario loggeado con Kinde
  // Buscar tenant del usuario
  // Retornar plan actual + opciones de upgrade
  return { currentPlan, availableUpgrades, canUpgrade }
}
```

### 2. **Mejorar hook useSubscription** ⭐️
```typescript
// Agregar funciones a src/hooks/useSubscription.ts
export function useSubscription(tenant: Tenant | null) {
  // ... código existente ...
  
  // NUEVAS funciones:
  const getUpgradeOptions = () => { /* lógica */ };
  const canUpgradeTo = (planName: string) => { /* lógica */ };
  const getPlanDisplayStatus = () => { /* "Actual", "Upgrade", "Downgrade" */ };
  
  return {
    // ... returns existentes ...
    getUpgradeOptions,
    canUpgradeTo, 
    getPlanDisplayStatus
  };
}
```

### 3. **Crear componente PlanDetector** ⭐️
```typescript
// src/components/subscription/PlanDetector.tsx
interface PlanDetectorProps {
  onPlanDetected: (data: {
    currentPlan: string | null;
    upgradeOptions: string[];
    canUpgrade: boolean;
  }) => void;
}

export const PlanDetector: React.FC<PlanDetectorProps> = ({ onPlanDetected }) => {
  // Hook que detecta plan actual cuando hay usuario loggeado
  // Llama onPlanDetected con la información
}
```

### 4. **Actualizar PricingPageEnhanced** ⭐️
```typescript
// Modificar src/components/pricing/PricingPageEnhanced.tsx
export function PricingPageEnhanced({ tenant }: PricingPageEnhancedProps) {
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<string[]>([]);
  
  // Integrar PlanDetector
  const handlePlanDetected = (planData) => {
    setUserPlan(planData.currentPlan);
    setUpgradeOptions(planData.upgradeOptions);
  };

  return (
    <div>
      <PlanDetector onPlanDetected={handlePlanDetected} />
      {/* Pasar userPlan a cada PricingCard */}
      {mockProducts.map(product => (
        <PricingCard 
          key={product.id}
          product={product}
          price={billingInterval === 'yearly' ? mockPrices[product.id].yearly : mockPrices[product.id].monthly}
          isCurrentPlan={userPlan === product.id}
          isUpgrade={upgradeOptions.includes(product.id)}
        />
      ))}
    </div>
  );
}
```

### 5. **Mejorar PricingCard** ⭐️
```typescript
// Actualizar src/components/pricing/PricingCard.tsx
interface PricingCardProps {
  // ... props existentes ...
  isCurrentPlan?: boolean;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
}

export function PricingCard({ 
  product, 
  price, 
  isCurrentPlan = false,
  isUpgrade = false,
  isDowngrade = false
}: PricingCardProps) {
  // Lógica condicional para el botón:
  const getButtonText = () => {
    if (isCurrentPlan) return 'Plan Actual';
    if (isUpgrade) return 'Hacer Upgrade';
    if (isDowngrade) return 'Cambiar Plan';
    return 'Suscribirse Ahora';
  };

  const getButtonStyle = () => {
    if (isCurrentPlan) return 'bg-muted text-muted-foreground cursor-not-allowed';
    if (isUpgrade) return 'bg-green-600 hover:bg-green-700 text-white';
    return 'bg-primary hover:bg-primary/90';
  };
}
```

### 6. **Debugging del error actual** 🔧

Agregar logs detallados en el checkout:

```typescript
// Modificar src/app/api/checkout/route.ts
export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();
    
    // AGREGAR LOGS DETALLADOS:
    console.log('=== CHECKOUT DEBUG START ===');
    console.log('1. PriceId recibido:', priceId);
    console.log('2. STRIPE_SECRET_KEY configurado:', !!process.env.STRIPE_SECRET_KEY);
    console.log('3. NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    
    // ... resto del código con más logs ...
    
  } catch (error) {
    console.log('=== CHECKOUT ERROR ===');
    console.log('Error completo:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    // Si es error de Stripe, más detalles
    if (error.type) {
      console.log('Stripe error type:', error.type);
      console.log('Stripe error code:', error.code);
      console.log('Stripe error message:', error.message);
    }
  }
}
```

### 7. **Verificar variables de entorno** 🔧

```bash
# Ejecutar en terminal para verificar configuración
cd /Users/ealanis/Development/current-projects/vetify
echo "Verificando variables de entorno..."
grep -E "STRIPE|NEXT_PUBLIC" .env.local
```

## 🚀 Implementación por Fases

### **Fase 1: Debugging del error actual** (30 min)
1. Agregar logs detallados al checkout
2. Verificar variables de entorno
3. Probar una suscripción manual

### **Fase 2: Detección de plan** (1 hora)
1. Crear API `/api/subscription/current`
2. Crear componente `PlanDetector`  
3. Integrar en `PricingPageEnhanced`

### **Fase 3: Lógica de upgrades** (1 hora)
1. Mejorar hook `useSubscription`
2. Actualizar `PricingCard` con estados condicionales
3. Agregar lógica de upgrade vs new subscription

### **Fase 4: UX mejorada** (30 min)
1. Badges de "Plan Actual", "Upgrade Recomendado"
2. Deshabilitar plan actual
3. Estilos diferenciados por estado

## 🎯 Resultado Final

Cuando un usuario esté loggeado:
- ✅ **Detecta automáticamente** su plan actual
- ✅ **Muestra "Plan Actual"** en la tarjeta correspondiente
- ✅ **Resalta opciones de upgrade** en verde  
- ✅ **Deshabilita downgrades** o los marca claramente
- ✅ **Maneja upgrades** vs nuevas suscripciones correctamente

¿Quieres que implemente alguna fase específica primero? Te recomiendo empezar con **Fase 1** para solucionar el error actual.