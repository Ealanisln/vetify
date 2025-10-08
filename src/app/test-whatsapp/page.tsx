"use client";

import { useState } from 'react';
import { Send, MessageCircle, Phone, CheckCircle, XCircle, Loader2, Zap, Calendar, Heart } from 'lucide-react';
import { useThemeAware, getThemeClass } from '../../hooks/useThemeAware';

interface TestResult {
  success: boolean;
  message: string;
  executionId?: string;
  timestamp: string;
  phoneNumber?: string;
  workflowType?: string;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  payload: Record<string, unknown>;
  color: string;
}

const WhatsAppTestPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testPhone, setTestPhone] = useState('5214777314130');
  const [useProxy, setUseProxy] = useState(true);
  const { mounted, theme } = useThemeAware();

  const testScenarios: TestScenario[] = [
    {
      id: 'pet-welcome',
      name: 'Bienvenida de Mascota',
      description: 'Mensaje automático cuando se registra una nueva mascota',
      icon: <Heart className="h-5 w-5" />,
      endpoint: '/webhook/pet-welcome',
      payload: {
        petName: 'Firulais Test',
        petSpecies: 'Perro',
        ownerName: 'Juan Pérez',
        ownerPhone: testPhone,
        clinicName: 'Clínica Veterinaria Test',
        timestamp: new Date().toISOString(),
        source: 'vetify-test-page'
      },
      color: 'bg-vetify-success'
    },
    {
      id: 'vaccination-reminder',
      name: 'Recordatorio de Vacuna',
      description: 'Recordatorio automático de vacunación próxima',
      icon: <Calendar className="h-5 w-5" />,
      endpoint: '/webhook/vaccination-reminder',
      payload: {
        petName: 'Firulais Test',
        ownerName: 'Juan Pérez',
        ownerPhone: testPhone,
        vaccinationType: 'Rabia',
        dueDate: '2024-02-15',
        clinicName: 'Clínica Veterinaria Test',
        clinicPhone: '55-1234-5678',
        timestamp: new Date().toISOString(),
        source: 'vetify-test-page'
      },
      color: 'bg-vetify-accent-500'
    },
    {
      id: 'appointment-confirmation',
      name: 'Confirmación de Cita',
      description: 'Confirmación automática de cita agendada',
      icon: <CheckCircle className="h-5 w-5" />,
      endpoint: '/webhook/appointment-confirmation',
      payload: {
        petName: 'Firulais Test',
        ownerName: 'Juan Pérez',
        ownerPhone: testPhone,
        appointmentDate: '2024-02-10',
        appointmentTime: '10:00 AM',
        veterinarian: 'Dr. García',
        clinicName: 'Clínica Veterinaria Test',
        clinicAddress: 'Av. Reforma 123, CDMX',
        timestamp: new Date().toISOString(),
        source: 'vetify-test-page'
      },
      color: 'bg-vetify-primary-500'
    },
    {
      id: 'emergency-alert',
      name: 'Alerta de Emergencia',
      description: 'Notificación de emergencia veterinaria',
      icon: <Zap className="h-5 w-5" />,
      endpoint: '/webhook/emergency-alert',
      payload: {
        petName: 'Firulais Test',
        ownerName: 'Juan Pérez',
        ownerPhone: testPhone,
        emergencyType: 'Urgencia Médica',
        veterinarian: 'Dr. García',
        clinicName: 'Clínica Veterinaria Test',
        clinicPhone: '55-1234-5678',
        instructions: 'Traer inmediatamente a la clínica',
        timestamp: new Date().toISOString(),
        source: 'vetify-test-page'
      },
      color: 'bg-red-500'
    }
  ];

  const runTest = async (scenario: TestScenario) => {
    setIsLoading(scenario.id);
    
    try {
      // Update payload with current phone number
      const updatedPayload = {
        ...scenario.payload,
        ownerPhone: testPhone,
        timestamp: new Date().toISOString()
      };

      let response;
      
      if (useProxy) {
        // Use local proxy endpoint
        response = await fetch('/api/test/n8n-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: scenario.endpoint,
            payload: updatedPayload
          })
        });
      } else {
        // Direct connection to n8n (original method)
        const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.alanis.dev';
        response = await fetch(`${n8nUrl}${scenario.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedPayload)
        });
      }

      const data = await response.json();

      const result: TestResult = {
        success: response.ok,
        message: response.ok 
          ? `✅ ${scenario.name} enviado exitosamente${useProxy ? ' (vía proxy)' : ''}` 
          : `❌ Error: ${data.message || data.error || 'Error desconocido'}`,
        executionId: data.executionId || data.data?.executionId,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: testPhone,
        workflowType: scenario.id
      };

      setResults(prev => [result, ...prev]);

      // Log detailed response for debugging
      console.log('🔍 Test Response:', {
        scenario: scenario.id,
        success: response.ok,
        status: response.status,
        data: data,
        useProxy: useProxy
      });

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}${useProxy ? ' (vía proxy)' : ''}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: testPhone,
        workflowType: scenario.id
      };

      setResults(prev => [result, ...prev]);
      
      console.error('🔍 Test Error:', {
        scenario: scenario.id,
        error: error,
        useProxy: useProxy
      });
    } finally {
      setIsLoading(null);
    }
  };

  const testDirectWhatsApp = async () => {
    setIsLoading('direct-whatsapp');
    
    try {
      const response = await fetch('/api/test/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: testPhone,
          message: `🧪 Mensaje de prueba directo desde Vetify\n\n📱 Teléfono: ${testPhone}\n⏰ Hora: ${new Date().toLocaleString('es-MX')}\n\n¡La integración de WhatsApp funciona perfectamente! 🎉`
        })
      });

      const data = await response.json();

      const result: TestResult = {
        success: response.ok,
        message: response.ok 
          ? '✅ WhatsApp directo enviado exitosamente' 
          : `❌ Error: ${data.message || 'Error desconocido'}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: testPhone,
        workflowType: 'direct-whatsapp'
      };

      setResults(prev => [result, ...prev]);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: testPhone,
        workflowType: 'direct-whatsapp'
      };

      setResults(prev => [result, ...prev]);
    } finally {
      setIsLoading(null);
    }
  };

  const checkTokenStatus = async () => {
    setIsLoading('token-check');
    
    try {
      const response = await fetch('/api/whatsapp/token-status');
      const data = await response.json();

      const result: TestResult = {
        success: data.valid,
        message: data.valid 
          ? `✅ Token válido${data.tokenInfo?.expires_in_days ? ` (expira en ${data.tokenInfo.expires_in_days} días)` : ''}` 
          : `❌ Token inválido: ${data.error}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: 'N/A',
        workflowType: 'token-check'
      };

      setResults(prev => [result, ...prev]);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `❌ Error verificando token: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: 'N/A',
        workflowType: 'token-check'
      };

      setResults(prev => [result, ...prev]);
    } finally {
      setIsLoading(null);
    }
  };

  const autoRefreshToken = async () => {
    setIsLoading('token-refresh');
    
    try {
      const response = await fetch('/api/whatsapp/token-status', {
        method: 'POST'
      });
      const data = await response.json();

      const result: TestResult = {
        success: data.valid,
        message: data.autoRefresh?.successful 
          ? '✅ Token renovado automáticamente' 
          : data.valid 
            ? '✅ Token válido, no necesita renovación'
            : `❌ Error en auto-renovación: ${data.error}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: 'N/A',
        workflowType: 'token-refresh'
      };

      setResults(prev => [result, ...prev]);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `❌ Error en auto-renovación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: 'N/A',
        workflowType: 'token-refresh'
      };

      setResults(prev => [result, ...prev]);
    } finally {
      setIsLoading(null);
    }
  };

  const generateLongLivedToken = async () => {
    setIsLoading('generate-token');
    
    try {
      const response = await fetch('/api/whatsapp/generate-token', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        const result: TestResult = {
          success: true,
          message: `✅ Token permanente generado (${data.tokenInfo?.expires_in_days || 'N/A'} días de duración)`,
          timestamp: new Date().toLocaleString('es-MX'),
          phoneNumber: 'N/A',
          workflowType: 'generate-token'
        };

        setResults(prev => [result, ...prev]);

        // Show the new token in a separate result
        const tokenResult: TestResult = {
          success: true,
          message: `🔑 Nuevo token: ${data.tokenInfo?.access_token?.substring(0, 20)}... (copia completo de la consola)`,
          timestamp: new Date().toLocaleString('es-MX'),
          phoneNumber: 'N/A',
          workflowType: 'new-token'
        };

        setResults(prev => [tokenResult, ...prev]);

        // Log full token to console for easy copying
        console.log('🔑 NEW LONG-LIVED TOKEN:');
        console.log(data.tokenInfo?.access_token);
        console.log('📋 Copy this token and update your .env.local file');
        
      } else {
        const result: TestResult = {
          success: false,
          message: `❌ Error generando token: ${data.message}`,
          timestamp: new Date().toLocaleString('es-MX'),
          phoneNumber: 'N/A',
          workflowType: 'generate-token'
        };

        setResults(prev => [result, ...prev]);
      }

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `❌ Error generando token: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: 'N/A',
        workflowType: 'generate-token'
      };

      setResults(prev => [result, ...prev]);
    } finally {
      setIsLoading(null);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  // Theme-aware class helpers
  const backgroundClass = getThemeClass(
    "bg-gradient-to-b from-vetify-primary-50 to-white",
    "bg-gradient-to-b from-vetify-primary-900/20 to-vetify-slate-900",
    mounted,
    theme
  );

  const cardClass = getThemeClass(
    "bg-white border border-gray-100",
    "bg-gray-800/50 backdrop-blur-sm border border-gray-700",
    mounted,
    theme
  );

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${backgroundClass}`}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧪 Centro de Pruebas WhatsApp
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Prueba todos los workflows de automatización de WhatsApp de Vetify. 
            Configura tu número y ejecuta diferentes escenarios para verificar que todo funcione correctamente.
          </p>
        </div>

        {/* Configuration */}
        <div className={`rounded-2xl p-6 mb-8 ${cardClass} shadow-card`}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            ⚙️ Configuración
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de WhatsApp (formato: 52XXXXXXXXXX)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="5214777314130"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-vetify-accent-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Formato mexicano: 52 + código de área + número (10 dígitos)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de conexión
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useProxy}
                    onChange={() => setUseProxy(true)}
                    className="h-4 w-4 text-vetify-accent-500 focus:ring-vetify-accent-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Proxy Local (Recomendado)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!useProxy}
                    onChange={() => setUseProxy(false)}
                    className="h-4 w-4 text-vetify-accent-500 focus:ring-vetify-accent-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Directo a N8N</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El proxy local proporciona mejor debugging y manejo de errores
              </p>
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            🚀 Escenarios de Prueba
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            Selecciona un escenario para probar los workflows automáticos de WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {testScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${cardClass} shadow-card hover:shadow-card-hover`}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg ${scenario.color} text-white mr-3`}>
                  {scenario.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {scenario.name}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                {scenario.description}
              </p>

              <button
                onClick={() => runTest(scenario)}
                disabled={isLoading === scenario.id}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${scenario.color} hover:opacity-90 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
              >
                {isLoading === scenario.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Probar {scenario.name}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Direct WhatsApp Test */}
        <div className={`rounded-2xl p-6 mb-12 ${cardClass} shadow-card`}>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Gestión de Tokens WhatsApp
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Verifica, renueva y genera tokens de larga duración para WhatsApp
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={checkTokenStatus}
                disabled={isLoading === 'token-check'}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading === 'token-check' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verificar Token
                  </>
                )}
              </button>

              <button
                onClick={autoRefreshToken}
                disabled={isLoading === 'token-refresh'}
                className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading === 'token-refresh' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Renovando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Renovar Token
                  </>
                )}
              </button>

              <button
                onClick={generateLongLivedToken}
                disabled={isLoading === 'generate-token'}
                className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading === 'generate-token' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Generar Token Permanente
                  </>
                )}
              </button>

              <button
                onClick={testDirectWhatsApp}
                disabled={isLoading === 'direct-whatsapp'}
                className="px-4 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading === 'direct-whatsapp' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Prueba Directa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className={`rounded-2xl p-6 ${cardClass} shadow-card`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Resultados de Pruebas
              </h3>
              <button
                onClick={clearResults}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${
                        result.success 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {result.message}
                      </p>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <p>📅 {result.timestamp}</p>
                        {result.phoneNumber && <p>📱 {result.phoneNumber}</p>}
                        {result.workflowType && <p>🔄 {result.workflowType}</p>}
                        {result.executionId && <p>🆔 {result.executionId}</p>}
                      </div>
                    </div>
                    <div className={`ml-4 ${
                      result.success ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`mt-12 rounded-2xl p-6 ${cardClass} shadow-card`}>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📋 Instrucciones de Uso
          </h3>
          <div className="space-y-3 text-gray-600 dark:text-gray-300">
            <p>1. <strong>Configura tu número:</strong> Ingresa tu número de WhatsApp en formato mexicano (52 + 10 dígitos)</p>
            <p>2. <strong>Activa el proxy:</strong> Mantén activado el proxy local para mejor debugging</p>
            <p>3. <strong>Verifica el token:</strong> Haz clic en Verificar Token para asegurar que tu access token esté válido</p>
            <p>4. <strong>Selecciona un escenario:</strong> Cada botón prueba un workflow diferente de N8N</p>
            <p>5. <strong>Revisa tu WhatsApp:</strong> Los mensajes deberían llegar en unos segundos</p>
            <p>6. <strong>Monitorea los resultados:</strong> Cada prueba se registra con timestamp y estado</p>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>🔧 Proxy Local:</strong> Ahora puedes usar el proxy local para mejor debugging
            </p>
            <ul className="text-xs text-green-700 dark:text-green-300 mt-2 ml-4 space-y-1">
              <li>• Evita problemas de CORS</li>
              <li>• Proporciona logs detallados en la consola del servidor</li>
              <li>• Permite debugging más fácil de requests a n8n</li>
              <li>• Maneja errores de manera más robusta</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTestPage; 