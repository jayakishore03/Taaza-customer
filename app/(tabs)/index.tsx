import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  getImageSource,
  getProductPricingDetails,
  type Product,
  type Shop,
  CATEGORIES,
} from '../../data/dummyData';
import { useCart } from '../../contexts/CartContext';
import { productsApi, shopsApi } from '../../lib/api';
import { getAuthToken } from '../../lib/auth/helper';
import { useAuth } from '../../contexts/AuthContext';

const categories = [...CATEGORIES];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Chicken');
  const [location, setLocation] = useState<string>('Fetching location...');
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const { addToCart, selectedShop, setSelectedShop } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Set API token when user is authenticated
  useEffect(() => {
    if (user) {
      getAuthToken();
    }
  }, [user]);

  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Add timeout to prevent hanging (3 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Geocoding timeout')), 3000);
      });

      const geocodePromise = Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const addresses = await Promise.race([geocodePromise, timeoutPromise]);

      if (addresses && Array.isArray(addresses) && addresses.length > 0) {
        const address = addresses[0];
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.streetNumber) parts.push(address.streetNumber);
        if (address.district) {
          parts.push(address.district);
        }
        if (address.city || address.region) {
          parts.push(address.city || address.region);
        }
        
        return parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      // Silently fail and return coordinates - don't log timeout errors
      if (error instanceof Error && !error.message.includes('timeout')) {
        console.error('Reverse geocoding error:', error);
      }
      // Return coordinates as fallback
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation('Location unavailable');
        setIsLoadingLocation(false);
        // Don't show alert - location is optional for the app
        return;
      }

      // Get current position with timeout
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<Location.LocationObject>((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), 10000);
      });

      const locationData = await Promise.race([locationPromise, timeoutPromise]);

      const { latitude, longitude } = locationData.coords;
      
      // Store coordinates for distance calculation
      setUserCoordinates({ latitude, longitude });
      
      // Set coordinates first as immediate fallback
      const coordinatesString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setLocation(coordinatesString);
      
      // Try to reverse geocode in background (non-blocking)
      // This won't block the UI if geocoding fails or times out
      reverseGeocode(latitude, longitude)
        .then((address) => {
          // Only update if we got a better address than coordinates
          if (address && address !== coordinatesString) {
            setLocation(address);
          }
        })
        .catch(() => {
          // Silently fail - coordinates are already displayed
          // No need to log or show error
        });
    } catch (error) {
      // Handle errors gracefully without logging or showing alerts
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for common location errors that should be handled silently
      const isLocationUnavailable = 
        errorMessage.includes('unavailable') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Location timeout') ||
        errorMessage.includes('location services') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('denied');
      
      if (isLocationUnavailable) {
        setLocation('Location unavailable');
        // Don't log or show alerts for expected location errors
      } else {
        // Only log unexpected errors in development
        if (__DEV__) {
          console.warn('Location error:', errorMessage);
        }
        setLocation('Location unavailable');
        // Don't show alert - location is optional for the app
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Load shops from backend on mount (without coordinates)
  useEffect(() => {
    const fetchShopsInitial = async () => {
      try {
        setIsLoadingShops(true);
        // Fetch shops without coordinates first
        const shopsData = await shopsApi.getAll();
        if (__DEV__) {
          console.log('✅ Shops loaded (initial):', shopsData.length);
          console.log('📦 Shops data:', JSON.stringify(shopsData, null, 2));
        }
        // Ensure shopsData is an array
        if (Array.isArray(shopsData)) {
          setShops(shopsData);
        } else {
          console.warn('⚠️ Shops data is not an array:', typeof shopsData);
          setShops([]);
        }
      } catch (error) {
        // Log error in development mode for debugging
        if (__DEV__) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ Failed to load shops:', errorMessage);
        }
        // Set empty shops array on error
        setShops([]);
      } finally {
        setIsLoadingShops(false);
      }
    };
    // Fetch shops immediately on mount
    fetchShopsInitial();
  }, []); // Only run on mount

  // Re-fetch shops when coordinates become available to update distances
  useEffect(() => {
    if (!userCoordinates) return; // Skip if no coordinates yet
    
    const fetchShopsWithLocation = async () => {
      try {
        // Re-fetch with coordinates to get accurate distances
        const shopsData = await shopsApi.getAll(userCoordinates.latitude, userCoordinates.longitude);
        if (__DEV__) {
          console.log('✅ Shops updated with location:', shopsData.length);
          console.log('📦 Updated shops data:', JSON.stringify(shopsData, null, 2));
        }
        // Ensure shopsData is an array
        if (Array.isArray(shopsData)) {
          setShops(shopsData);
        } else {
          console.warn('⚠️ Updated shops data is not an array:', typeof shopsData);
        }
      } catch (error) {
        // Silently fail - we already have shops from initial load
        if (__DEV__) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn('⚠️ Failed to update shops with location:', errorMessage);
        }
      }
    };
    fetchShopsWithLocation();
  }, [userCoordinates]);

  // Debug: Log shops state changes
  useEffect(() => {
    if (__DEV__) {
      console.log('🔍 Shops state changed:', {
        count: shops.length,
        isLoading: isLoadingShops,
        shops: shops.map(s => ({ id: s.id, name: s.name }))
      });
    }
  }, [shops, isLoadingShops]);

  // Load products when category or shop changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedShop) {
        setProducts([]);
        return;
      }
      
      try {
        setIsLoadingProducts(true);
        const productsData = await productsApi.getByCategory(selectedCategory);
        setProducts(productsData);
      } catch (error) {
        // Handle errors gracefully without showing alerts
        if (__DEV__) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
          console.warn('Products not available:', errorMessage.includes('timeout') || errorMessage.includes('connect') 
            ? 'Backend connection issue' 
            : errorMessage);
        }
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    fetchProducts();
  }, [selectedCategory, selectedShop]);

  // Get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleLocationPress = () => {
    getCurrentLocation();
  };

  const handleOrderNow = () => {
    router.push('/product-details');
  };


  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart!`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
    ]);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
  };

  const handleChangeShop = () => {
    setSelectedShop(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.locationBar}
            onPress={handleLocationPress}
            activeOpacity={0.8}
          >
            <MapPin size={20} color="#FFFFFF" strokeWidth={2} />
            <View style={styles.locationText}>
              <View style={styles.locationLabelRow}>
                <Text style={styles.deliveryLabel}>Deliver to</Text>
                {isLoadingLocation && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingIndicator} />
                )}
                {!isLoadingLocation && (
                  <RefreshCw size={14} color="#FEE2E2" strokeWidth={2} style={styles.refreshIcon} />
                )}
              </View>
              <Text style={styles.address} numberOfLines={1}>
                {location}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerSubtitle}>Combo Offer</Text>
            <Text style={styles.bannerTitle}>Delicious Delight</Text>
            <Text style={styles.bannerDescription}>Flat 15% off on combo orders</Text>
            <TouchableOpacity style={styles.orderButton} onPress={handleOrderNow}>
              <Text style={styles.orderButtonText}>Order now</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1070968/pexels-photo-1070968.jpeg?auto=compress&cs=tinysrgb&w=400' }}
            style={styles.bannerImage}
          />
        </View>

        {!selectedShop ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Shops</Text>
              <View style={styles.sectionSubtitleContainer}>
                <MapPin size={16} color="#DC2626" strokeWidth={2} />
                <Text style={styles.sectionSubtitle}>Choose a shop to explore items</Text>
              </View>
            </View>

            <View style={styles.shopsList}>
              {isLoadingShops && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#DC2626" />
                  <Text style={styles.loadingText}>Loading shops...</Text>
                </View>
              )}
              {!isLoadingShops && shops.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No shops available at the moment</Text>
                  <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>
                    Please check your connection or try again later
                  </Text>
                  {__DEV__ && (
                    <Text style={[styles.emptyText, { fontSize: 10, marginTop: 4, color: '#DC2626' }]}>
                      Debug: shops.length = {shops.length}, isLoadingShops = {String(isLoadingShops)}
                    </Text>
                  )}
                </View>
              )}
              {!isLoadingShops && shops.length > 0 && shops.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  style={styles.shopCard}
                  onPress={() => handleShopSelect(shop)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: shop.image }} style={styles.shopImage} />
                  <View style={styles.shopInfo}>
                    <View style={styles.shopHeader}>
                      <Text style={styles.shopName}>{shop.name}</Text>
                    </View>
                    <Text style={styles.shopAddress}>{shop.address}</Text>
                    <Text style={styles.shopDistance}>{shop.distance} • Open now</Text>
                    <Text style={styles.shopAction}>View items</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.selectedShopCard}>
                <Image source={{ uri: selectedShop.image }} style={styles.selectedShopImage} />
                <View style={styles.selectedShopInfo}>
                  <Text style={styles.selectedShopLabel}>Selected Shop</Text>
                  <Text style={styles.selectedShopName}>{selectedShop.name}</Text>
                  <Text style={styles.selectedShopDetails}>{selectedShop.address} • {selectedShop.distance}</Text>
                </View>
                <TouchableOpacity style={styles.changeShopButton} onPress={handleChangeShop}>
                  <Text style={styles.changeShopText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
              bounces={false}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => handleCategoryChange(category)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Best Recommended</Text>
              </View>

              {isLoadingProducts ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="small" color="#DC2626" />
                  <Text style={styles.emptyText}>Loading products...</Text>
                </View>
              ) : products.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyText,
                      selectedCategory === 'Seafood' && styles.comingSoonText,
                    ]}
                  >
                    {selectedCategory === 'Seafood' ? 'Coming soon' : 'No products found in this category'}
                  </Text>
                </View>
              ) : (
                <View style={styles.productsGrid}>
                  {products.map((product) => {
                    const { currentPrice, originalPrice, discountPercentage } = getProductPricingDetails(product);
                    const displayWeight = product.weight?.trim()
                      ? product.weight
                      : product.weightInKg >= 1
                        ? `${product.weightInKg} kg`
                        : `${Math.round(product.weightInKg * 1000)} g`;

                    return (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productCard}
                        onPress={() => router.push({
                          pathname: '/product-details',
                          params: { productId: product.id }
                        })}
                      >
                        <Image source={getImageSource(product.image)} style={styles.productImage} />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{product.name || ''}</Text>
                          <Text style={styles.productWeight}>{displayWeight}</Text>
                          <View style={styles.productPricingWrapper}>
                            <Text style={styles.productCurrentPrice}>
                              ₹{Math.round(currentPrice)}
                            </Text>
                            <Text style={styles.productOriginalPrice}>
                              ₹{Math.round(originalPrice)}
                            </Text>
                            <Text style={styles.productDiscount}>
                              {discountPercentage}% off
                            </Text>
                          </View>
                          <View style={styles.productFooter}>
                            <Text style={styles.productPricePerKg}>
                              ₹{product.pricePerKg.toFixed(2)}/kg
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.addButton}
                            onPress={() => handleAddToCart(product)}
                          >
                            <Text style={styles.addButtonText}>+ ADD</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
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
    paddingTop: 10,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLabel: {
    color: '#FEE2E2',
    fontSize: 12,
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  refreshIcon: {
    marginLeft: 4,
  },
  address: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    flexShrink: 1,
  },
  banner: {
    backgroundColor: '#FCD34D',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerContent: {
    flex: 1,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  bannerDescription: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 4,
  },
  orderButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
  },
  categoryScroll: {
    marginTop: 20,
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 12,
    gap: 10,
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipActive: {
    backgroundColor: '#FCD34D',
  },
  categoryText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    flexDirection: 'column',
  },
  productImage: {
    width: '100%',
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  productInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
    minHeight: 140,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minHeight: 36,
    marginBottom: 4,
  },
  productWeight: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  productPricingWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  productCurrentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  productOriginalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  productDiscount: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  productPricePerKg: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shopsList: {
    gap: 16,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shopImage: {
    width: 100,
    height: '100%',
  },
  shopInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  shopAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  shopDistance: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '600',
  },
  shopAction: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedShopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedShopImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  selectedShopInfo: {
    flex: 1,
  },
  selectedShopLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  selectedShopDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  changeShopButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  changeShopText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  comingSoonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
