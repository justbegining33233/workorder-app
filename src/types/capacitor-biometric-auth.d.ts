declare module '@capacitor/biometric-auth' {
  export const BiometricAuth: {
    checkBiometry(): Promise<{
      isAvailable: boolean;
      biometryType: 'none' | 'touchId' | 'faceId' | 'fingerprint' | 'faceAuthentication' | 'irisAuthentication';
      reason?: string;
    }>;
    authenticate(options: {
      reason?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      negativeButtonText?: string;
      cancelTitle?: string;
      allowDeviceCredential?: boolean;
      maxAttempts?: number;
    }): Promise<{ isAuthenticated: boolean }>;
  };
}
