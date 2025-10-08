'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Sentry verification page
 * This page provides different ways to test Sentry error reporting
 * Updated to fix HMR issues
 */
export default function SentryExamplePage() {
  const [errorCount, setErrorCount] = useState(0);

  // Helper function to check if Sentry is properly initialized
  const isSentryInitialized = () => {
    return Sentry.getClient() !== undefined;
  };

  // Helper function to safely execute Sentry operations
  const safeSentryOperation = (operation: () => void, fallbackMessage: string) => {
    if (!isSentryInitialized()) {
      console.warn('Sentry not initialized. ' + fallbackMessage);
      alert('Sentry is not properly configured. Check the console for setup instructions.');
      return;
    }
    try {
      operation();
    } catch (error) {
      console.error('Sentry operation failed:', error);
    }
  };

  // Test function that throws an error (as suggested by Sentry)
  const triggerUndefinedFunctionError = () => {
    safeSentryOperation(() => {
      setErrorCount(prev => prev + 1);
      
      console.log('🔥 Triggering test error...');
      
      // Test 1: Simple message capture
      console.log('📤 Sending simple message to Sentry...');
      Sentry.captureMessage('Simple test message from Vetify', 'error');
      
      // Test 2: Manual exception capture
      console.log('📤 Sending manual exception to Sentry...');
      Sentry.captureException(new Error('Manual Sentry test error from Vetify'), {
        tags: {
          errorType: 'manual_test',
          testPage: 'sentry-example',
          app: 'vetify',
        },
        extra: {
          errorCount: errorCount + 1,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      });
      
      // Test 3: Force flush to ensure events are sent
      console.log('💫 Flushing Sentry...');
      Sentry.flush(5000).then(() => {
        console.log('✅ Sentry flush completed - check your Sentry dashboard!');
        alert('✅ Events sent successfully! Check your Sentry dashboard for the captured errors.');
      }).catch((error) => {
        console.error('❌ Sentry flush failed:', error);
        alert('❌ Failed to send events to Sentry. Check console for details.');
      });
      
      // Test 4: Throw the actual error without try-catch
      console.log('💥 Throwing undefined function error...');
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).myUndefinedFunction();
      }, 100);
    }, 'Cannot test undefined function error.');
  };

  // Test different types of errors
  const triggerTypeError = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = null;
      obj.someProperty.access(); // This will throw a TypeError
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          errorType: 'type_error',
          testPage: 'sentry-example',
        },
      });
      setErrorCount(prev => prev + 1);
      throw error;
    }
  };

  const triggerCustomError = () => {
    const customError = new Error('This is a custom test error for Sentry verification');
    customError.name = 'SentryTestError';
    
    Sentry.captureException(customError, {
      tags: {
        errorType: 'custom_error',
        testPage: 'sentry-example',
        severity: 'high',
      },
      extra: {
        customData: {
          testId: 'sentry-verification',
          platform: 'veterinary',
          feature: 'error-tracking',
        },
      },
    });
    setErrorCount(prev => prev + 1);
    throw customError;
  };

  const triggerAsyncError = async () => {
    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async operation failed - Sentry test'));
        }, 100);
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          errorType: 'async_error',
          testPage: 'sentry-example',
        },
      });
      setErrorCount(prev => prev + 1);
      throw error;
    }
  };

  // Send a manual message to Sentry
  const sendManualMessage = () => {
    safeSentryOperation(() => {
      Sentry.captureMessage('Manual test message from Sentry example page', {
        level: 'info',
        tags: {
          testType: 'manual_message',
          testPage: 'sentry-example',
        },
        extra: {
          timestamp: new Date().toISOString(),
          messageCount: errorCount + 1,
        },
      });
      setErrorCount(prev => prev + 1);
    }, 'Cannot send manual message.');
  };

  // Debug Sentry configuration
  const debugSentryConfig = () => {
    console.log('=== SENTRY DEBUG INFO ===');
    console.log('🌍 Window object:', typeof window);
    console.log('🔑 NEXT_PUBLIC_SENTRY_DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN ? 'SET ✅' : 'NOT SET ❌');
    console.log('🏗️ Environment:', process.env.NODE_ENV);
    
    const client = Sentry.getClient();
    console.log('🎯 Sentry Client:', client ? 'INITIALIZED ✅' : 'NOT INITIALIZED ❌');
    
    if (client) {
      const options = client.getOptions();
      console.log('📡 DSN from client:', options.dsn ? `SET ✅ (${options.dsn.substring(0, 30)}...)` : 'NOT SET ❌');
      console.log('🐛 Debug mode:', options.debug ? 'ON ✅' : 'OFF');
      console.log('🌍 Environment:', options.environment);
      console.log('📊 Sample rate:', options.tracesSampleRate);
      // console.log('📈 Profiles sample rate:', options.profilesSampleRate);
      
      // Test immediate capture with detailed logging
      console.log('📤 Testing immediate capture...');
      try {
        const eventId = Sentry.captureMessage('Debug test message from Vetify', 'info');
        console.log('📨 Captured message with event ID:', eventId);
        
        // Force flush and wait for result
        Sentry.flush(5000).then(() => {
          console.log('✅ Debug message flush completed successfully');
        }).catch((error) => {
          console.error('❌ Debug message flush failed:', error);
        });
      } catch (error) {
        console.error('❌ Failed to capture debug message:', error);
      }
    } else {
      console.error('❌ No Sentry client found! This means Sentry is not initialized.');
      console.log('🛠️  To fix this issue:');
      console.log('1. Create a .env.local file in your project root');
      console.log('2. Add: NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o000000.ingest.sentry.io/0000000');
      console.log('3. Replace the URL with your actual Sentry DSN from your project settings');
      console.log('4. Restart your Next.js development server');
      return;
    }
    
    // Try to get current scope info (updated API)
    const scope = Sentry.getCurrentScope();
    console.log('🎯 Sentry Scope:', scope ? 'AVAILABLE ✅' : 'NOT AVAILABLE ❌');
    
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      console.log('🌐 Running in browser ✅');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log('🔧 Sentry available on window:', typeof (window as any).__SENTRY__ !== 'undefined' ? 'YES ✅' : 'NO ❌');
    }
    
    console.log('=== END SENTRY DEBUG ===');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sentry Error Tracking Verification
            </h1>
            <p className="text-gray-600 mb-8">
              Click the buttons below to test different types of errors and verify that Sentry is properly capturing them.
              Check your Sentry dashboard after triggering errors.
            </p>

            {/* Sentry Status Indicator */}
            <div className={`border rounded-md p-4 mb-6 ${isSentryInitialized() ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {isSentryInitialized() ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isSentryInitialized() ? 'text-green-800' : 'text-red-800'}`}>
                    Sentry Status: {isSentryInitialized() ? 'Initialized ✅' : 'Not Initialized ❌'}
                  </h3>
                  <div className={`mt-2 text-sm ${isSentryInitialized() ? 'text-green-700' : 'text-red-700'}`}>
                    {isSentryInitialized() ? (
                      <p>Sentry is properly configured and ready to capture errors and messages.</p>
                    ) : (
                      <div>
                        <p className="font-medium">Sentry is not configured. To enable error tracking:</p>
                        <ol className="mt-1 list-decimal list-inside space-y-1 text-xs">
                          <li>Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in your project root</li>
                          <li>Add: <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SENTRY_DSN=your-actual-dsn</code></li>
                          <li>Get your DSN from your Sentry project settings</li>
                          <li>Restart the development server</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Errors triggered: {errorCount}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Each button will trigger a different type of error. Open your browser&apos;s console to see detailed logs and check your Sentry dashboard.</p>
                    <p className="mt-1 font-medium">🔍 DEBUGGING TIP: Open Network tab in DevTools to see if requests are being sent to sentry.io</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Undefined Function Error - As recommended by Sentry */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Undefined Function Error
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Triggers the exact error type suggested by Sentry documentation.
                </p>
                <button
                  onClick={triggerUndefinedFunctionError}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Trigger myUndefinedFunction() Error
                </button>
              </div>

              {/* Type Error */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Type Error
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Attempts to access a property on null, causing a TypeError.
                </p>
                <button
                  onClick={triggerTypeError}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Trigger Type Error
                </button>
              </div>

              {/* Custom Error */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Custom Error
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Throws a custom error with additional metadata for testing.
                </p>
                <button
                  onClick={triggerCustomError}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                >
                  Trigger Custom Error
                </button>
              </div>

              {/* Async Error */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Async Error
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Triggers an error in an async operation to test async error handling.
                </p>
                <button
                  onClick={triggerAsyncError}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  Trigger Async Error
                </button>
              </div>
            </div>

            {/* Manual Message */}
            <div className="mt-6 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Manual Message
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Sends a manual message to Sentry without throwing an error.
              </p>
              <button
                onClick={sendManualMessage}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Send Manual Message to Sentry
              </button>
            </div>

            {/* Debug Sentry Configuration */}
            <div className="mt-6 border border-yellow-200 rounded-lg p-6 bg-yellow-50">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                🔧 Debug Sentry Configuration
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Check if Sentry is properly configured and initialized. Open your browser console to see debug information.
              </p>
              <div className="space-y-2">
                <button
                  onClick={debugSentryConfig}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                >
                  Debug Sentry Configuration
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  🔄 Force Page Reload (Fix HMR Issues)
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Verification Steps
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Click any of the error buttons above</li>
                <li>Check your browser console to see the error locally</li>
                <li>Go to your Sentry dashboard</li>
                <li>Navigate to Issues to see the captured errors</li>
                <li>Verify that the error appears with the correct tags and metadata</li>
              </ol>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Note
                    </h4>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>These errors are intentional for testing purposes. In development mode, you&apos;ll see detailed error information in the console.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
