import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api/auth';

type SignInParams = {
  redirectPath?: string;
  productId?: string;
  autoAdd?: string;
  selectedWeight?: string;
  quantity?: string;
};

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<SignInParams>();
  const { signIn } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  const redirectPath = Array.isArray(params.redirectPath) ? params.redirectPath[0] : params.redirectPath;

  const buildRedirectParams = () => {
    const redirectParams: Record<string, string> = {};

    const map: Array<[keyof SignInParams, string]> = [
      ['productId', 'productId'],
      ['autoAdd', 'autoAdd'],
      ['selectedWeight', 'selectedWeight'],
      ['quantity', 'quantity'],
    ];

    map.forEach(([key, paramKey]) => {
      const value = params[key];
      if (value) {
        redirectParams[paramKey] = Array.isArray(value) ? value[0] : value;
      }
    });

    return redirectParams;
  };

  const handlePostAuthNavigation = () => {
    if (redirectPath) {
      router.replace({
        pathname: redirectPath,
        params: buildRedirectParams(),
      });
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const handleSignIn = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter both mobile number and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(phone, password);
      Alert.alert('Welcome back!', 'You have signed in successfully.', [
        {
          text: 'Continue',
          onPress: handlePostAuthNavigation,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      Alert.alert('Sign In Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSignup = () => {
    router.push({
      pathname: '/signup',
      params,
    });
  };

  // Generate random 6-digit OTP (for testing - backend will send real OTP)
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send password reset OTP
  const handleSendResetOTP = async () => {
    if (!resetPhone.trim() || resetPhone.trim().length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid mobile number.');
      return;
    }

    try {
      const response = await authApi.sendPasswordResetOTP(resetPhone);
      setOtpSent(true);
      setOtpVerified(false);
      setResetOtp('');
      setResendTimer(30); // 30 seconds countdown

      // Show OTP in development (backend returns it in dev mode)
      const otpMessage = response.otp 
        ? `OTP has been sent to ${resetPhone} via WhatsApp.\n\nFor testing: Your OTP is ${response.otp}`
        : `OTP has been sent to ${resetPhone} via WhatsApp.`;

      Alert.alert('OTP Sent', otpMessage, [{ text: 'OK' }]);
    } catch (error: any) {
      const message = error?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', message);
    }
  };

  // Verify OTP for password reset
  const handleVerifyResetOTP = async () => {
    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setIsResetting(true);
    try {
      await authApi.verifyPasswordResetOTP(resetPhone, resetOtp);
      setOtpVerified(true);
      Alert.alert('OTP Verified', 'You can now set your new password.');
    } catch (error: any) {
      const message = error?.message || 'Failed to verify OTP. Please try again.';
      Alert.alert('Error', message);
      setResetOtp('');
    } finally {
      setIsResetting(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!otpVerified) {
      Alert.alert('OTP Required', 'Please verify OTP first.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
      return;
    }

    setIsResetting(true);
    try {
      await authApi.resetPassword(resetPhone, newPassword);
      Alert.alert('Success', 'Password has been reset successfully. You can now sign in.', [
        {
          text: 'OK',
          onPress: () => {
            setShowForgotPassword(false);
            // Reset all forgot password fields
            setResetPhone('');
            setResetOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setOtpSent(false);
            setOtpVerified(false);
            setResendTimer(0);
          },
        },
      ]);
    } catch (error: any) {
      const message = error?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsResetting(false);
    }
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.container}>
        {/* Back button - positioned independently */}
        <TouchableOpacity 
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#DC2626" />
        </TouchableOpacity>

        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Sign In</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Welcome back! Please enter your details to continue.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!isSubmitting}
              maxLength={15}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting}
            />
            <TouchableOpacity 
              style={styles.forgotPasswordLink}
              onPress={() => setShowForgotPassword(true)}
              disabled={isSubmitting}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleGoToSignup}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowForgotPassword(false);
                  setResetPhone('');
                  setResetOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setOtpSent(false);
                  setOtpVerified(false);
                  setResendTimer(0);
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalSubtitle}>
                Enter your mobile number to receive an OTP for password reset.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={resetPhone}
                  onChangeText={(text) => {
                    setResetPhone(text);
                    if (otpSent) {
                      setOtpSent(false);
                      setOtpVerified(false);
                      setResetOtp('');
                      setResendTimer(0);
                    }
                  }}
                  editable={!isResetting && !otpSent && !otpVerified}
                  maxLength={15}
                />
                {!otpSent && (
                  <TouchableOpacity
                    style={styles.sendOtpButton}
                    onPress={handleSendResetOTP}
                    disabled={!resetPhone.trim() || resetPhone.trim().length < 10 || resendTimer > 0}
                  >
                    <Text style={styles.sendOtpButtonText}>
                      {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Send OTP'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {otpSent && !otpVerified && (
                <View style={styles.field}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={resetOtp}
                    onChangeText={setResetOtp}
                    editable={!isResetting}
                    maxLength={6}
                  />
                  {resendTimer > 0 && (
                    <Text style={styles.resendTimerText}>
                      Resend OTP in {resendTimer}s
                    </Text>
                  )}
                  {resendTimer === 0 && otpSent && (
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleSendResetOTP}
                      disabled={isResetting}
                    >
                      <Text style={styles.resendButtonText}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.verifyOtpButton, (!resetOtp.trim() || resetOtp.trim().length !== 6) && styles.verifyOtpButtonDisabled]}
                    onPress={handleVerifyResetOTP}
                    disabled={isResetting || !resetOtp.trim() || resetOtp.trim().length !== 6}
                  >
                    <Text style={styles.verifyOtpButtonText}>
                      {isResetting ? 'Verifying...' : 'Verify OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {otpVerified && (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password (min 6 characters)"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                      editable={!isResetting}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!isResetting}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, (!newPassword.trim() || newPassword.length < 6 || newPassword !== confirmPassword) && styles.primaryButtonDisabled]}
                    onPress={handleResetPassword}
                    disabled={isResetting || !newPassword.trim() || newPassword.length < 6 || newPassword !== confirmPassword}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isResetting ? 'Resetting Password...' : 'Reset Password'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 50,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerCard: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  field: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  sendOtpButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  sendOtpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resendTimerText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  resendButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resendButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  verifyOtpButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyOtpButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  verifyOtpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
});

