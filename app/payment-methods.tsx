import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, Building2, Trash2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { paymentMethodsApi, type PaymentMethod } from '@/lib/api/paymentMethods';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<'card' | 'bank' | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  
  // Bank form state
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');

  // Load payment methods on mount
  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const methods = await paymentMethodsApi.getAll();
      // Ensure methods is always an array
      setPaymentMethods(Array.isArray(methods) ? methods : []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      // Set empty array on error to prevent undefined errors
      setPaymentMethods([]);
      Alert.alert('Error', 'Failed to load payment methods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = () => {
    setCardNumber('');
    setCardExpiry('');
    setCardCVV('');
    setCardholderName('');
    setSelectedOption('card');
  };

  const handleAddBankAccount = () => {
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setBankName('');
    setSelectedOption('bank');
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleSaveCard = async () => {
    if (!cardNumber.trim() || !cardExpiry.trim() || !cardCVV.trim() || !cardholderName.trim()) {
      Alert.alert('Incomplete Details', 'Please fill in all card details');
      return;
    }

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return;
    }

    if (cardCVV.length < 3 || cardCVV.length > 4) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV (3-4 digits)');
      return;
    }

    try {
      setIsSaving(true);
      const last4 = cleanedCardNumber.slice(-4);
      const newMethod = await paymentMethodsApi.create({
        type: 'card',
        name: cardholderName.trim(),
        details: `**** **** **** ${last4}`,
        cardNumber: cleanedCardNumber,
        cardExpiry: cardExpiry.trim(),
        cardCVV: cardCVV.trim(),
        cardholderName: cardholderName.trim(),
        isDefault: paymentMethods.length === 0,
      });

      await loadPaymentMethods();
      setSelectedOption(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
      setCardholderName('');
      Alert.alert('Success', 'Card added successfully!');
    } catch (error: any) {
      console.error('Error saving card:', error);
      const errorMessage = error?.message || 'Failed to save card';
      Alert.alert(
        'Unable to Save Card', 
        `${errorMessage}\n\nNote: You can still make payments without saving cards. Razorpay will handle your payment securely.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBank = async () => {
    if (!accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim() || !bankName.trim()) {
      Alert.alert('Incomplete Details', 'Please fill in all bank account details');
      return;
    }

    if (ifscCode.length !== 11) {
      Alert.alert('Invalid IFSC', 'IFSC code must be 11 characters');
      return;
    }

    try {
      setIsSaving(true);
      const maskedAccount = accountNumber.slice(-4).padStart(accountNumber.length, '*');
      const newMethod = await paymentMethodsApi.create({
        type: 'bank',
        name: accountHolderName.trim(),
        details: `${bankName.trim()} - ${maskedAccount}`,
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        isDefault: paymentMethods.length === 0,
      });

      await loadPaymentMethods();
      setSelectedOption(null);
      setAccountNumber('');
      setIfscCode('');
      setAccountHolderName('');
      setBankName('');
      Alert.alert('Success', 'Bank account added successfully!');
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      const errorMessage = error?.message || 'Failed to save bank account';
      Alert.alert(
        'Unable to Save Bank Account', 
        `${errorMessage}\n\nNote: You can still make payments without saving bank details. Use direct payment methods in checkout.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedOption(null);
    setCardNumber('');
    setCardExpiry('');
    setCardCVV('');
    setCardholderName('');
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setBankName('');
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentMethodsApi.delete(id);
              await loadPaymentMethods();
              Alert.alert('Success', 'Payment method deleted successfully!');
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>Loading payment methods...</Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 <Text style={styles.infoBold}>Optional Feature:</Text> Save payment methods for faster checkout. You can also enter payment details directly when placing orders.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Payment Method</Text>
              <Text style={styles.sectionSubtitle}>Choose a payment method to add</Text>

              <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionCard} onPress={handleAddCard}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
                <CreditCard size={28} color="#3B82F6" strokeWidth={2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Credit/Debit Card</Text>
                <Text style={styles.optionDescription}>Add a credit or debit card</Text>
              </View>
              <ChevronLeft size={20} color="#9CA3AF" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={handleAddBankAccount}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#10B981' + '20' }]}>
                <Building2 size={28} color="#10B981" strokeWidth={2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Bank Account</Text>
                <Text style={styles.optionDescription}>Link your bank account</Text>
              </View>
              <ChevronLeft size={20} color="#9CA3AF" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
              </View>
            </View>

            {paymentMethods && paymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
            <View style={styles.methodsList}>
              {paymentMethods.map((method) => (
                <View key={method.id} style={styles.methodCard}>
                  <View style={styles.methodLeft}>
                    <View style={[styles.methodIconContainer, { backgroundColor: method.type === 'card' ? '#3B82F6' + '20' : '#10B981' + '20' }]}>
                      {method.type === 'card' ? (
                        <CreditCard size={20} color={method.type === 'card' ? '#3B82F6' : '#10B981'} strokeWidth={2} />
                      ) : (
                        <Building2 size={20} color="#10B981" strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodDetails}>{method.details}</Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(method.id)}
                  >
                    <Trash2 size={18} color="#DC2626" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {(!paymentMethods || paymentMethods.length === 0) && !selectedOption && (
          <View style={styles.emptySection}>
            <CreditCard size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Payment Methods</Text>
            <Text style={styles.emptyText}>Add a payment method to get started</Text>
          </View>
        )}
          </>
        )}
      </ScrollView>

      {/* Card Form Modal */}
      <Modal
        visible={selectedOption === 'card'}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Card</Text>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Card Number*</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  maxLength={19}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalfField}>
                  <Text style={styles.formLabel}>Expiry Date*</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="MM/YY"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={cardExpiry}
                    onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                    maxLength={5}
                  />
                </View>
                <View style={styles.formHalfField}>
                  <Text style={styles.formLabel}>CVV*</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="123"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    secureTextEntry
                    value={cardCVV}
                    onChangeText={(text) => setCardCVV(text.replace(/\D/g, '').substring(0, 4))}
                    maxLength={4}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Cardholder Name*</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  autoCapitalize="words"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancel}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isSaving && styles.modalButtonDisabled]}
                onPress={handleSaveCard}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonSaveText}>Save Card</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bank Account Form Modal */}
      <Modal
        visible={selectedOption === 'bank'}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bank Account</Text>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Account Holder Name*</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Bank Name*</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="State Bank of India"
                  placeholderTextColor="#9CA3AF"
                  value={bankName}
                  onChangeText={setBankName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Account Number*</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="1234567890"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={accountNumber}
                  onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>IFSC Code*</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="SBIN0001234"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  value={ifscCode}
                  onChangeText={(text) => setIfscCode(text.toUpperCase().substring(0, 11))}
                  maxLength={11}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancel}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isSaving && styles.modalButtonDisabled]}
                onPress={handleSaveBank}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonSaveText}>Save Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    paddingHorizontal: 20,
  },
  headerCard: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  methodsList: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  methodDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
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
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formHalfField: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonSave: {
    backgroundColor: '#DC2626',
  },
  modalButtonCancelText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
  },
});

