"use client";

import { useState } from 'react';
import { Send, MessageCircle, Phone, CheckCircle, XCircle, Loader2, Zap, Calendar, Heart } from 'lucide-react';
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();

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
    setIsLoading('auto-refresh');
    
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
        workflowType: 'auto-refresh'
      };

      setResults(prev => [result, ...prev]);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `❌ Error en auto-renovación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date().toLocaleString('es-MX'),
        phoneNumber: 'N/A',
        workflowType: 'auto-refresh'
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

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div
        className={`absolute inset-0 transition-colors duration-500 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-b from-vetify-primary-900/20 to-vetify-slate-900"
            : "bg-gradient-to-b from-vetify-primary-50 to-white"
        }`}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-vetify-accent-50 dark:bg-vetify-accent-900/30 rounded-full mb-6">
            <MessageCircle className="h-4 w-4 text-vetify-accent-600 dark:text-vetify-accent-300 mr-2" />
            <span className="text-sm font-medium text-vetify-accent-600 dark:text-vetify-accent-300">Pruebas de WhatsApp API</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Test de <span className="text-vetify-accent-500 dark:text-vetify-accent-300">WhatsApp</span> API
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Prueba todos los workflows de WhatsApp de Vetify. Desde mensajes de bienvenida hasta alertas de emergencia.
          </p>

          {/* Phone Input */}
          <div className="max-w-md mx-auto mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de teléfono de prueba
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5214777314130"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-vetify-accent-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formato: 52 + 10 dígitos (ej: 5214777314130)
            </p>
          </div>

          {/* Proxy Toggle */}
          <div className="max-w-md mx-auto mb-8">
            <label className="flex items-center justify-center space-x-3">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="w-4 h-4 text-vetify-accent-600 bg-gray-100 border-gray-300 rounded focus:ring-vetify-accent-500 dark:focus:ring-vetify-accent-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Usar proxy local (recomendado para debugging)
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {useProxy ? 'Usando /api/test/n8n-proxy' : 'Conexión directa a n8n.alanis.dev'}
            </p>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {testScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
                resolvedTheme === "dark"
                  ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                  : "bg-white border border-gray-100"
              } shadow-card hover:shadow-card-hover`}
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
        <div className={`rounded-2xl p-6 mb-12 ${
          resolvedTheme === "dark"
            ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
            : "bg-white border border-gray-100"
        } shadow-card`}>
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
                disabled={isLoading === 'auto-refresh'}
                className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading === 'auto-refresh' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Renovando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-Renovar
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
                    Token Permanente
                  </>
                )}
              </button>
              
              <button
                onClick={testDirectWhatsApp}
                disabled={isLoading === 'direct-whatsapp'}
                className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading === 'direct-whatsapp' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <strong className="text-blue-700 dark:text-blue-300">Verificar Token:</strong> Revisa el estado actual y fecha de expiración
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <strong className="text-orange-700 dark:text-orange-300">Auto-Renovar:</strong> Intenta renovar automáticamente si está próximo a expirar
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <strong className="text-purple-700 dark:text-purple-300">Token Permanente:</strong> Genera un token de 60 días de duración
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <strong className="text-green-700 dark:text-green-300">Enviar WhatsApp:</strong> Prueba directa de envío de mensajes
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className={`rounded-2xl p-6 ${
            resolvedTheme === "dark"
              ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
              : "bg-white border border-gray-100"
          } shadow-card`}>
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
                  className={`p-4 rounded-lg border-l-4 ${
                    result.success 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      )}
                      <div>
                        <p className={`font-medium ${
                          result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                        }`}>
                          {result.message}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>📱 {result.phoneNumber}</span>
                          <span className="mx-2">•</span>
                          <span>⏰ {result.timestamp}</span>
                          {result.executionId && (
                            <>
                              <span className="mx-2">•</span>
                              <span>🔗 {result.executionId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`mt-12 rounded-2xl p-6 ${
          resolvedTheme === "dark"
            ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
            : "bg-white border border-gray-100"
        } shadow-card`}>
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
          
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>💡 Tip:</strong> Si las pruebas fallan, verifica que N8N esté corriendo y que los workflows estén activos en <code>https://n8n.alanis.dev</code>
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>🔄 Auto-Renovación:</strong> El sistema ahora detecta automáticamente tokens expirados y los renueva
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 ml-4 space-y-1">
              <li>• Los tokens se verifican antes de cada envío</li>
              <li>• Se renuevan automáticamente si están próximos a expirar (7 días)</li>
              <li>• En caso de error, se intenta una renovación de emergencia</li>
              <li>• Usa &quot;Auto-Renovar&quot; para forzar una verificación manual</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>🔑 Solución de Problemas:</strong> Si sigues viendo errores de token:
            </p>
            <ol className="text-xs text-red-700 dark:text-red-300 mt-2 ml-4 space-y-1">
              <li>1. Verifica que <code>FACEBOOK_APP_ID</code> y <code>FACEBOOK_APP_SECRET</code> estén configurados</li>
              <li>2. Usa &quot;Token Permanente&quot; para generar un nuevo token de larga duración</li>
              <li>3. Si falla, ve a <code>developers.facebook.com</code> y genera un token temporal nuevo</li>
              <li>4. Luego usa ese token temporal para generar uno permanente</li>
              <li>5. Reinicia el servidor después de actualizar las variables de entorno</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTestPage; 