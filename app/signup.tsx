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
  ActivityIndicator,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { View as RNView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api/auth';

type SignUpParams = {
  redirectPath?: string;
  productId?: string;
  autoAdd?: string;
  selectedWeight?: string;
  quantity?: string;
};

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<SignUpParams>();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [selectedProfileIcon, setSelectedProfileIcon] = useState<string>('');
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle');
  const [phoneCheckMessage, setPhoneCheckMessage] = useState('');
  const [checkPhoneTimeout, setCheckPhoneTimeout] = useState<NodeJS.Timeout | null>(null);

  const redirectPath = Array.isArray(params.redirectPath) ? params.redirectPath[0] : params.redirectPath;

  const buildRedirectParams = () => {
    const redirectParams: Record<string, string> = {};

    const map: Array<[keyof SignUpParams, string]> = [
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

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !street.trim() || !city.trim() || !stateValue.trim() || !postalCode.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please fill in all required fields marked with *.');
      return;
    }

    if (!gender) {
      Alert.alert('Gender Required', 'Please select your gender.');
      return;
    }

    if (!selectedProfileIcon) {
      Alert.alert('Profile Icon Required', 'Please select a profile icon.');
      return;
    }

    if (!otpVerified) {
      Alert.alert('OTP Verification Required', 'Please verify your WhatsApp number by entering the OTP sent to you.');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Terms & Conditions Required', 'Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        email,
        phone,
        password,
        gender: gender as 'male' | 'female',
        profilePicture: selectedProfileIcon,
        address: {
          contactName: name,
          phone,
          street,
          city,
          state: stateValue,
          postalCode,
          landmark,
        },
      };

      await signUp(payload);

      Alert.alert('Account Created', 'You have signed up successfully.', [
        {
          text: 'Continue',
          onPress: handlePostAuthNavigation,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign up. Please try again.';
      Alert.alert('Sign Up Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSignin = () => {
    router.push({
      pathname: '/signin',
      params,
    });
  };

  // Generate random 6-digit OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP via WhatsApp (simulated)
  const handleSendOTP = () => {
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid WhatsApp mobile number.');
      return;
    }

    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setOtpVerified(false);
    setOtp('');
    setResendTimer(30); // 30 seconds countdown

    // Simulate sending OTP via WhatsApp
    // In production, this would call a backend API to send WhatsApp message
    Alert.alert(
      'OTP Sent via WhatsApp',
      `OTP has been sent to ${phone} via WhatsApp.\n\nFor testing: Your OTP is ${newOtp}`,
      [{ text: 'OK' }]
    );
  };

  // Verify OTP
  const handleVerifyOTP = () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    if (otp === generatedOtp) {
      setOtpVerified(true);
      Alert.alert('OTP Verified', 'Your phone number has been verified successfully!');
    } else {
      Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
      setOtp('');
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

  // Check if phone number exists (with debounce)
  const checkPhoneAvailability = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneCheckStatus('idle');
      setPhoneCheckMessage('');
      return;
    }

    setPhoneCheckStatus('checking');
    setPhoneCheckMessage('');

    try {
      const result = await authApi.checkPhoneExists(phoneNumber);
      if (result.exists) {
        setPhoneCheckStatus('exists');
        setPhoneCheckMessage('⚠️ This number is already registered. Please sign in instead.');
      } else {
        setPhoneCheckStatus('available');
        setPhoneCheckMessage('✓ This number is available');
      }
    } catch (error) {
      console.error('Error checking phone:', error);
      setPhoneCheckStatus('idle');
      setPhoneCheckMessage('');
    }
  };

  // Debounced phone check
  useEffect(() => {
    // Clear previous timeout
    if (checkPhoneTimeout) {
      clearTimeout(checkPhoneTimeout);
    }

    // Reset status when phone changes
    if (phone.length >= 10 && phoneCheckStatus !== 'checking') {
      setPhoneCheckStatus('checking');
    }

    // Set new timeout for checking
    const timeout = setTimeout(() => {
      if (phone.length >= 10) {
        checkPhoneAvailability(phone);
      } else {
        setPhoneCheckStatus('idle');
        setPhoneCheckMessage('');
      }
    }, 800); // Wait 800ms after user stops typing

    setCheckPhoneTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [phone]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 40 : 0}
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
            <Text style={styles.headerTitle}>Create Account</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 160 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Please provide the following details to create your account.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              editable={!isSubmitting}
            />
          </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mobile Number*</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="Enter mobile number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (otpSent) {
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp('');
                  setResendTimer(0);
                }
              }}
              editable={!isSubmitting && !otpVerified}
              maxLength={15}
            />
            <TouchableOpacity
              style={[styles.sendOtpButton, otpVerified && styles.sendOtpButtonVerified]}
              onPress={handleSendOTP}
              disabled={isSubmitting || !phone.trim() || phone.trim().length < 10 || resendTimer > 0 || otpVerified || phoneCheckStatus === 'exists'}
            >
              <Text style={styles.sendOtpButtonText}>
                {otpVerified ? '✓ Verified' : resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Send OTP'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noteText}>Give only WhatsApp mobile number</Text>
          
          {/* Phone Check Status */}
          {phoneCheckStatus === 'checking' && (
            <View style={styles.phoneCheckContainer}>
              <ActivityIndicator size="small" color="#DC2626" />
              <Text style={styles.phoneCheckTextChecking}>Checking availability...</Text>
            </View>
          )}
          {phoneCheckStatus === 'exists' && (
            <View style={styles.phoneCheckContainer}>
              <Text style={styles.phoneCheckTextExists}>{phoneCheckMessage}</Text>
            </View>
          )}
          {phoneCheckStatus === 'available' && !otpVerified && (
            <Text style={styles.phoneCheckTextAvailable}>{phoneCheckMessage}</Text>
          )}

          {otpSent && !otpVerified && phoneCheckStatus !== 'exists' && (
            <View style={styles.otpContainer}>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                editable={!isSubmitting}
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.verifyOtpButton, !otp.trim() || otp.trim().length !== 6 ? styles.verifyOtpButtonDisabled : null]}
                onPress={handleVerifyOTP}
                disabled={isSubmitting || !otp.trim() || otp.trim().length !== 6}
              >
                <Text style={styles.verifyOtpButtonText}>Verify OTP</Text>
              </TouchableOpacity>
            </View>
          )}
          {otpVerified && (
            <Text style={styles.otpVerifiedText}>✓ Phone number verified via WhatsApp</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Street & House No.*</Text>
          <TextInput
            style={styles.input}
            placeholder="House number, street name"
            placeholderTextColor="#9CA3AF"
            value={street}
            onChangeText={setStreet}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>City*</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
              value={city}
              onChangeText={setCity}
              editable={!isSubmitting}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>State*</Text>
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#9CA3AF"
              value={stateValue}
              onChangeText={setStateValue}
              editable={!isSubmitting}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Postal Code*</Text>
          <TextInput
            style={styles.input}
            placeholder="PIN / ZIP code"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={postalCode}
            onChangeText={setPostalCode}
            editable={!isSubmitting}
            maxLength={10}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Landmark (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nearby landmark"
            placeholderTextColor="#9CA3AF"
            value={landmark}
            onChangeText={setLandmark}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gender*</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderOption, gender === 'male' && styles.genderOptionSelected]}
              onPress={() => setGender('male')}
              disabled={isSubmitting}
            >
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderOption, gender === 'female' && styles.genderOptionSelected]}
              onPress={() => setGender('female')}
              disabled={isSubmitting}
            >
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Profile Picture Icon*</Text>
          <Text style={styles.subLabel}>Choose an avatar for your profile</Text>
          <View style={styles.profileIconGrid}>
            {[
              { id: 'male1', emoji: '👨', label: 'Male 1' },
              { id: 'male2', emoji: '👨‍💼', label: 'Male 2' },
              { id: 'male3', emoji: '🧔', label: 'Male 3' },
              { id: 'male4', emoji: '👨‍🦱', label: 'Male 4' },
              { id: 'male5', emoji: '👨‍🦰', label: 'Male 5' },
              { id: 'male6', emoji: '👨‍🦳', label: 'Male 6' },
              { id: 'female1', emoji: '👩', label: 'Female 1' },
              { id: 'female2', emoji: '👩‍💼', label: 'Female 2' },
              { id: 'female3', emoji: '👩‍🦱', label: 'Female 3' },
              { id: 'female4', emoji: '👩‍🦰', label: 'Female 4' },
              { id: 'female5', emoji: '👩‍🦳', label: 'Female 5' },
              { id: 'female6', emoji: '👱‍♀️', label: 'Female 6' },
            ].map(({ id, emoji, label }) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.profileIconOption,
                  selectedProfileIcon === id && styles.profileIconOptionSelected,
                ]}
                onPress={() => setSelectedProfileIcon(id)}
                disabled={isSubmitting}
                accessibilityLabel={label}
              >
                <Text style={styles.profileIconEmoji}>{emoji}</Text>
                {selectedProfileIcon === id && (
                  <View style={styles.profileIconCheck}>
                    <Check size={16} color="#DC2626" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsTitle}>By continuing, you agree to the following:</Text>
          <View style={styles.termsList}>
            <Text style={styles.termsItem}>1. This app is a marketplace connecting you with independent meat shops.</Text>
            <Text style={styles.termsItem}>2. We do not produce or sell meat. All products are provided by vendors.</Text>
            <Text style={styles.termsItem}>3. Prices, availability, quality, and packaging are the vendor's responsibility.</Text>
            <Text style={styles.termsItem}>4. Orders may be accepted, modified, or cancelled by the vendor.</Text>
            <Text style={styles.termsItem}>5. Delivery times may vary due to traffic, weather, or shop delays.</Text>
            <Text style={styles.termsItem}>6. Because meat is perishable, refunds are only possible for:</Text>
            <Text style={styles.termsSubItem}>   • Wrong item delivered</Text>
            <Text style={styles.termsSubItem}>   • Spoiled product at delivery</Text>
            <Text style={styles.termsSubItem}>   • Vendor cancelled order</Text>
            <Text style={styles.termsItem}>7. Photo/video proof must be provided within 1 hour of delivery for any issue.</Text>
            <Text style={styles.termsItem}>8. Abusive behaviour, fake orders, or misuse may lead to account suspension.</Text>
            <Text style={styles.termsItem}>9. By continuing, you allow us to send SMS/WhatsApp for verification & order updates.</Text>
            <Text style={styles.termsItem}>10. Full Terms & Privacy Policy are available inside the app.</Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
            disabled={isSubmitting}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
            </View>
            <Text style={styles.checkboxLabel}>
              By logging in, I agree to the Terms & Conditions & Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleGoToSignin}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
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
  noteText: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 4,
    fontStyle: 'italic',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  phoneInput: {
    flex: 1,
  },
  sendOtpButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 110,
  },
  sendOtpButtonVerified: {
    backgroundColor: '#059669',
  },
  sendOtpButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpContainer: {
    marginTop: 12,
    gap: 8,
  },
  otpInput: {
    marginBottom: 0,
  },
  verifyOtpButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
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
  otpVerifiedText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
    fontWeight: '600',
  },
  termsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  termsList: {
    gap: 8,
    marginBottom: 16,
  },
  termsItem: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  termsSubItem: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginLeft: 16,
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 20,
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  genderOptionSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  subLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 4,
  },
  profileIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  profileIconOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  profileIconOptionSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  profileIconEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  profileIconCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  phoneCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  phoneCheckTextChecking: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  phoneCheckTextExists: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  phoneCheckTextAvailable: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  phoneCheckLinkText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

