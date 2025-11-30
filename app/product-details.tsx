import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getImageSource,
  getPricePerKgDisplay,
  calculatePriceByWeight,
  getProductPricingDetails,
  WEIGHT_OPTIONS,
  DEFAULT_WEIGHT,
  DEFAULT_QUANTITY,
  type Product,
} from '../data/dummyData';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productsApi } from '../lib/api/products';
import { ActivityIndicator } from 'react-native';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { productId, autoAdd, selectedWeight: selectedWeightParam, quantity: quantityParam } =
    useLocalSearchParams<{
      productId: string;
      autoAdd?: string;
      selectedWeight?: string;
      quantity?: string;
    }>();
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [selectedWeight, setSelectedWeight] = useState(DEFAULT_WEIGHT); // Weight in kg
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const productData = await productsApi.getById(productId);
        if (productData) {
          setProduct(productData);
          setSelectedWeight(productData.weightInKg); // Default weight
        } else {
          Alert.alert('Error', 'Product not found', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        Alert.alert('Error', 'Failed to load product', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  useEffect(() => {
    if (selectedWeightParam) {
      const parsedWeight = Number(selectedWeightParam);
      if (!Number.isNaN(parsedWeight) && parsedWeight > 0) {
        setSelectedWeight(parsedWeight);
      }
    }
  }, [selectedWeightParam]);

  useEffect(() => {
    if (quantityParam) {
      const parsedQuantity = parseInt(quantityParam, 10);
      if (!Number.isNaN(parsedQuantity) && parsedQuantity > 0) {
        setQuantity(parsedQuantity);
      }
    }
  }, [quantityParam]);

  const performAddToCart = () => {
    if (!product) {
      return;
    }

    const priceForWeight = calculatePriceByWeight(product, selectedWeight);

    const cartProduct = {
      ...product,
      price: priceForWeight,
      weightInKg: selectedWeight,
      weight: `${selectedWeight}kg`,
    };

    addToCart(cartProduct, quantity);

    Alert.alert(
      'Added to Cart',
      `${quantity}x ${selectedWeight}kg ${product.name}\nTotal: ₹${(priceForWeight * quantity).toFixed(2)}`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => router.push('/(tabs)/cart'),
        },
      ]
    );
  };

  useEffect(() => {
    if (autoAdd === '1' && product && isAuthenticated) {
      performAddToCart();
      router.setParams({
        autoAdd: undefined,
        selectedWeight: undefined,
        quantity: undefined,
      });
    }
  }, [autoAdd, product, isAuthenticated, selectedWeight, quantity]);

  if (isLoading || !product) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login or sign up to add items to your cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => {
              router.push({
                pathname: '/signin',
                params: {
                  redirectPath: '/product-details',
                  productId,
                  autoAdd: '1',
                  selectedWeight: String(selectedWeight),
                  quantity: String(quantity),
                },
              });
            },
          },
          {
            text: 'Sign Up',
            onPress: () => {
              router.push({
                pathname: '/signup',
                params: {
                  redirectPath: '/product-details',
                  productId,
                  autoAdd: '1',
                  selectedWeight: String(selectedWeight),
                  quantity: String(quantity),
                },
              });
            },
          },
        ]
      );
      return;
    }

    performAddToCart();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { top: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={getImageSource(product.image)} style={styles.productImage} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <Text style={styles.productWeight}>
              {product.weight?.trim()
                ? product.weight
                : product.weightInKg >= 1
                  ? `${product.weightInKg} kg`
                  : `${Math.round(product.weightInKg * 1000)} g`}
            </Text>
          </View>

          <View style={styles.priceSection}>
            {(() => {
              const { currentPrice, originalPrice, discountPercentage } = getProductPricingDetails(product);

              return (
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>₹{Math.round(currentPrice)}</Text>
                  <Text style={styles.originalPrice}>₹{Math.round(originalPrice)}</Text>
                  <Text style={styles.discountBadge}>{discountPercentage}% off</Text>
                </View>
              );
            })()}
            <Text style={styles.totalPriceLabel}>Total for {selectedWeight}kg</Text>
            <Text style={styles.totalPrice}>
              ₹{calculatePriceByWeight(product, selectedWeight).toFixed(2)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Weight (kg)</Text>
            <View style={styles.weightSelector}>
              {WEIGHT_OPTIONS.map((weight) => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.weightButton,
                    selectedWeight === weight && styles.weightButtonActive,
                  ]}
                  onPress={() => setSelectedWeight(weight)}
                >
                  <Text
                    style={[
                      styles.weightButtonText,
                      selectedWeight === weight && styles.weightButtonTextActive,
                    ]}
                  >
                    {weight}kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description || 'No description available.'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
              >
                <Minus size={20} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
              >
                <Plus size={20} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: insets.bottom + 160 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>
            Add Now ₹{(calculatePriceByWeight(product, selectedWeight) * quantity).toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 320,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  productWeight: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
  },
  priceSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  totalPriceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  weightSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  weightButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  weightButtonActive: {
    backgroundColor: '#FCD34D',
    borderColor: '#FCD34D',
  },
  weightButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  weightButtonTextActive: {
    color: '#1F2937',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 320,
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginHorizontal: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  addToCartButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
