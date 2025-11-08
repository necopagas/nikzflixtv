// src/utils/capacitor.js
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

/**
 * Initialize Capacitor features for mobile
 */
export const initCapacitor = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Running in browser mode');
    return;
  }

  try {
    // Hide splash screen after app loads
    await SplashScreen.hide();

    // Initialize push notifications
    await initPushNotifications();

    // Handle app state changes
    CapApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    // Handle back button on Android
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    console.log('✅ Capacitor initialized');
  } catch (error) {
    console.error('Capacitor initialization error:', error);
  }
};

/**
 * Initialize push notifications
 */
const initPushNotifications = async () => {
  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions();

    if (permission.receive === 'granted') {
      // Register with APNs / FCM
      await PushNotifications.register();

      // Listen for registration
      PushNotifications.addListener('registration', token => {
        console.log('Push registration success:', token.value);
        // Send token to your backend
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', error => {
        console.error('Push registration error:', error);
      });

      // Listen for push notifications
      PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push received:', notification);
        // Show local notification
      });

      // Listen for notification taps
      PushNotifications.addListener('pushNotificationActionPerformed', action => {
        console.log('Push action performed:', action);
        // Navigate to specific screen
      });

      console.log('✅ Push notifications initialized');
    }
  } catch (error) {
    console.error('Push notification setup error:', error);
  }
};

/**
 * Show splash screen
 */
export const showSplash = async () => {
  if (Capacitor.isNativePlatform()) {
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });
  }
};

/**
 * Get app info
 */
export const getAppInfo = async () => {
  if (!Capacitor.isNativePlatform()) {
    return {
      name: 'NikzFlix TV',
      version: '2.0.0',
      build: '1',
      platform: 'web',
    };
  }

  const info = await CapApp.getInfo();
  return {
    name: info.name,
    version: info.version,
    build: info.build,
    platform: Capacitor.getPlatform(),
  };
};

/**
 * Check if running on native platform
 */
export const isNative = () => Capacitor.isNativePlatform();

/**
 * Get platform name
 */
export const getPlatform = () => Capacitor.getPlatform();
