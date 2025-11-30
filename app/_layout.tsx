import { useState, useCallback, useEffect } from 'react';
import { Platform, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SplashVideo } from '@/components/SplashVideo';

export default function RootLayout() {
  useFrameworkReady();
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const handleSplashFinish = useCallback(() => {
    setIsSplashFinished(true);
  }, []);

  // Suppress keep-awake errors (non-critical, expo-video tries to use it but it's optional)
  useEffect(() => {
    // For React Native - use LogBox to ignore these errors
    if (Platform.OS !== 'web') {
      LogBox.ignoreLogs([
        'Unable to activate keep awake',
        'keep awake',
        'expo-keep-awake',
        'Error: Unable to activate keep awake',
        '[Error: Uncaught (in promise, id: 0) Error: Unable to activate keep awake]',
      ]);
      
      // Also suppress via ErrorUtils for React Native (global, not imported)
      if (typeof ErrorUtils !== 'undefined' && ErrorUtils.getGlobalHandler) {
        const originalErrorHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          const errorMessage = error?.message || error?.toString() || '';
          if (
            errorMessage.includes('keep awake') || 
            errorMessage.includes('Unable to activate keep awake') ||
            errorMessage.includes('expo-keep-awake')
          ) {
            // Silently ignore keep-awake errors
            return;
          }
          // Call original handler for other errors
          if (originalErrorHandler) {
            originalErrorHandler(error, isFatal);
          }
        });
      }
    }

    // Global error handler for unhandled promise rejections (all platforms)
    const handleUnhandledRejection = (event: PromiseRejectionEvent | ErrorEvent) => {
      const errorMessage = 
        (event as PromiseRejectionEvent).reason?.message || 
        (event as PromiseRejectionEvent).reason?.toString() || 
        (event as ErrorEvent).message || 
        '';
      
      if (
        errorMessage.includes('keep awake') || 
        errorMessage.includes('Unable to activate keep awake') ||
        errorMessage.includes('expo-keep-awake')
      ) {
        // Prevent the error from being logged - it's non-critical
        if ((event as PromiseRejectionEvent).preventDefault) {
          (event as PromiseRejectionEvent).preventDefault();
        }
        // Silently ignore - expo-video tries to use keep-awake but it's optional
        return;
      }
    };

    // For web - handle unhandled promise rejections
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection as EventListener);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection as EventListener);
      };
    }

    // Note: Keep-awake errors are non-critical and can be safely ignored
    // They occur because expo-video tries to use keep-awake functionality
    // but it's optional and doesn't affect video playback
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          {isSplashFinished ? (
            <>
              <Stack screenOptions={{ headerShown: false }} />
              <StatusBar style="auto" />
            </>
          ) : (
            <SplashVideo onFinish={handleSplashFinish} />
          )}
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
