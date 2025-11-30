import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { useState } from 'react';
import { User, MapPin, CreditCard, LogIn, LogOut, ChevronRight, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getImageSource } from '../../data/dummyData';

// Profile picture icon mapping
const PROFILE_ICON_MAP: Record<string, string> = {
  'male1': '👨',
  'male2': '👨‍💼',
  'male3': '🧔',
  'male4': '👨‍🦱',
  'male5': '👨‍🦰',
  'male6': '👨‍🦳',
  'female1': '👩',
  'female2': '👩‍💼',
  'female3': '👩‍🦱',
  'female4': '👩‍🦰',
  'female5': '👩‍🦳',
  'female6': '👱‍♀️',
};

// Helper function to get profile icon emoji
const getProfileIconEmoji = (profilePictureId: string | number | undefined): string | null => {
  if (!profilePictureId || typeof profilePictureId !== 'string') {
    return null;
  }
  return PROFILE_ICON_MAP[profilePictureId] || null;
};

const menuItems = [
  { icon: User, label: 'Edit Profile', color: '#3B82F6', route: '/edit-profile' },
  { icon: MapPin, label: 'Delivery Address', color: '#10B981', route: '/delivery-addresses' },
  { icon: CreditCard, label: 'Payment Methods', color: '#8B5CF6', route: '/payment-methods' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [showImageModal, setShowImageModal] = useState(false);

  const handleMenuPress = (label: string, route: string | null) => {
    if (route) {
      router.push(route as any);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/signin');
        },
      },
    ]);
  };

  const handleLoginNavigate = () => {
    router.push('/signin');
  };

  const handleSignupNavigate = () => {
    router.push('/signup');
  };

  const handleProfilePicturePress = () => {
    if (isAuthenticated && user?.profilePicture) {
      setShowImageModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.profileCard}>
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={handleProfilePicturePress}
              disabled={!isAuthenticated || !user?.profilePicture}
              activeOpacity={isAuthenticated && user?.profilePicture ? 0.7 : 1}
            >
              {isAuthenticated && user?.profilePicture ? (
                (() => {
                  const emojiIcon = getProfileIconEmoji(user.profilePicture);
                  if (emojiIcon) {
                    return <Text style={styles.avatarEmoji}>{emojiIcon}</Text>;
                  }
                  if (typeof user.profilePicture === 'string' && (user.profilePicture.startsWith('http') || user.profilePicture.startsWith('file://') || user.profilePicture.startsWith('content://'))) {
                    return <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />;
                  }
                  return <Image source={getImageSource(user.profilePicture)} style={styles.avatarImage} />;
                })()
              ) : (
                <User size={40} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
            <Text style={styles.userName}>{isAuthenticated ? user?.name : 'Guest User'}</Text>
            <Text style={styles.userEmail}>{isAuthenticated ? user?.email : 'guest@example.com'}</Text>
            {isAuthenticated && (
              <>
                <Text style={styles.userPhone}>{user?.phone}</Text>
                <Text style={styles.userAddress}>
                  {user?.address
                    ? `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.postalCode}`
                    : 'No address on file'}
                </Text>
              </>
            )}
            {!isAuthenticated && (
              <View style={styles.authButtons}>
                <TouchableOpacity style={styles.loginButton} onPress={handleLoginNavigate}>
                  <LogIn size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.signupButton} onPress={handleSignupNavigate}>
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleMenuPress(item.label, item.route)}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <item.icon size={20} color={item.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>

          {isAuthenticated && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#DC2626" strokeWidth={2} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Full Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={() => setShowImageModal(false)}
            activeOpacity={0.7}
          >
            <X size={28} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          
          {user?.profilePicture && (
            <View style={styles.fullImageContainer}>
              {(() => {
                const emojiIcon = getProfileIconEmoji(user.profilePicture);
                if (emojiIcon) {
                  return <Text style={styles.fullImageEmoji}>{emojiIcon}</Text>;
                }
                if (typeof user.profilePicture === 'string' && (user.profilePicture.startsWith('http') || user.profilePicture.startsWith('file://') || user.profilePicture.startsWith('content://'))) {
                  return (
                    <Image 
                      source={{ uri: user.profilePicture }} 
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  );
                }
                return (
                  <Image 
                    source={getImageSource(user.profilePicture)} 
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                );
              })()}
            </View>
          )}
        </View>
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
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
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
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarEmoji: {
    fontSize: 50,
    textAlign: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  userAddress: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  authButtons: {
    marginTop: 16,
    width: '100%',
    gap: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fullImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  fullImageEmoji: {
    fontSize: 200,
    textAlign: 'center',
  },
});
