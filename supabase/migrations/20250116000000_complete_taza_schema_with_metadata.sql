/*
  # Complete Taza Backend Database Schema with Full Metadata
  
  This migration creates all necessary tables, indexes, RLS policies, functions, 
  triggers, and sample data for the Taza meat delivery app.
  
  Tables included:
  - user_profiles (extends auth.users)
  - addresses
  - shops (with latitude/longitude for distance calculation)
  - products
  - addons
  - coupons
  - payment_methods
  - orders
  - order_items
  - order_timeline
  - favorites
  - user_activity_logs
  - login_sessions
*/

-- ============================================
-- USER PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text NOT NULL UNIQUE,
  gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  profile_picture text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE user_profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON COLUMN user_profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN user_profiles.phone IS 'Unique phone number for user identification';
COMMENT ON COLUMN user_profiles.gender IS 'User gender: Male, Female, or Other';

-- ============================================
-- ADDRESSES
-- ============================================
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  landmark text,
  label text DEFAULT 'Home' CHECK (label IN ('Home', 'Office', 'Other')),
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE addresses IS 'User delivery addresses';
COMMENT ON COLUMN addresses.label IS 'Address label: Home, Office, or Other';
COMMENT ON COLUMN addresses.is_default IS 'Indicates if this is the default address for the user';

-- ============================================
-- SHOPS (with latitude/longitude for distance calculation)
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  distance text, -- e.g., "0.5 km" - calculated dynamically
  image_url text NOT NULL,
  contact_phone text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE shops IS 'Meat shops/butchers available on the platform';
COMMENT ON COLUMN shops.id IS 'Shop identifier (e.g., shop-1, shop-2)';
COMMENT ON COLUMN shops.latitude IS 'Shop latitude for distance calculation';
COMMENT ON COLUMN shops.longitude IS 'Shop longitude for distance calculation';
COMMENT ON COLUMN shops.distance IS 'Calculated distance from user location (updated dynamically)';

-- ============================================
-- PRODUCTS (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Chicken', 'Mutton', 'Pork', 'Seafood', 'Fish')),
  weight text, -- Display weight description (e.g., "2 Packs | Serves 2-3")
  weight_in_kg decimal(10, 3) NOT NULL DEFAULT 1.0,
  price decimal(10, 2) NOT NULL, -- Price for the weight specified
  price_per_kg decimal(10, 2) NOT NULL, -- Price per kilogram
  original_price decimal(10, 2), -- Original price before discount
  discount_percentage integer DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  image_url text NOT NULL,
  description text DEFAULT '',
  rating decimal(3, 2) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  is_available boolean DEFAULT true NOT NULL,
  shop_id text REFERENCES shops(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE products IS 'Meat products available for purchase';
COMMENT ON COLUMN products.category IS 'Product category: Chicken, Mutton, Pork, Seafood, or Fish';
COMMENT ON COLUMN products.weight_in_kg IS 'Weight in kilograms for price calculation';
COMMENT ON COLUMN products.price IS 'Price for the specified weight';
COMMENT ON COLUMN products.price_per_kg IS 'Price per kilogram (used for calculations)';
COMMENT ON COLUMN products.discount_percentage IS 'Discount percentage (0-100)';

-- ============================================
-- ADDONS
-- ============================================
CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10, 2) NOT NULL CHECK (price >= 0),
  description text,
  is_available boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE addons IS 'Additional items that can be added to orders (spices, marination, etc.)';

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value decimal(10, 2) NOT NULL CHECK (discount_value >= 0),
  min_order_amount decimal(10, 2) DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount decimal(10, 2) CHECK (max_discount >= 0), -- Maximum discount cap for percentage
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  usage_limit integer CHECK (usage_limit > 0),
  used_count integer DEFAULT 0 CHECK (used_count >= 0),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE coupons IS 'Discount coupons for orders';
COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: fixed amount or percentage';
COMMENT ON COLUMN coupons.discount_value IS 'Discount amount or percentage value';
COMMENT ON COLUMN coupons.max_discount IS 'Maximum discount cap for percentage-based coupons';

-- ============================================
-- PAYMENT METHODS
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('UPI', 'Card', 'Cash', 'Wallet', 'Net Banking')),
  provider text, -- 'PhonePe', 'Google Pay', 'HDFC Bank', etc.
  name text, -- Display name for the payment method
  details jsonb, -- Store card details, UPI ID, etc. (encrypted in production)
  card_number text, -- Last 4 digits only (for display)
  card_expiry text,
  card_cvv text, -- Should be encrypted
  cardholder_name text,
  account_number text, -- For bank transfers
  ifsc_code text,
  account_holder_name text,
  bank_name text,
  is_default boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE payment_methods IS 'User payment methods (cards, UPI, etc.)';
COMMENT ON COLUMN payment_methods.details IS 'JSON object storing payment method details (encrypted in production)';
COMMENT ON COLUMN payment_methods.card_number IS 'Last 4 digits of card for display purposes only';

-- ============================================
-- ORDERS (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL UNIQUE, -- e.g., '#TAZ1034'
  parent_order text, -- For grouped orders
  shop_id text REFERENCES shops(id) ON DELETE SET NULL,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  subtotal decimal(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_charge decimal(10, 2) DEFAULT 0.0 CHECK (delivery_charge >= 0),
  discount decimal(10, 2) DEFAULT 0.0 CHECK (discount >= 0),
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  total decimal(10, 2) NOT NULL CHECK (total >= 0),
  status text DEFAULT 'Preparing' NOT NULL CHECK (status IN ('Preparing', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled')),
  status_note text,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_method_text text DEFAULT 'Cash on Delivery', -- Store payment method as text for display
  otp text, -- 6-digit OTP for delivery verification
  delivery_eta timestamptz, -- Estimated delivery time
  delivered_at timestamptz,
  delivery_agent_name text,
  delivery_agent_mobile text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON COLUMN orders.order_number IS 'Unique order number (e.g., #TAZ1034)';
COMMENT ON COLUMN orders.status IS 'Order status: Preparing, Order Ready, Picked Up, Out for Delivery, Delivered, or Cancelled';
COMMENT ON COLUMN orders.delivery_charge IS 'Delivery charge calculated based on distance (₹10 per km)';
COMMENT ON COLUMN orders.otp IS '6-digit OTP for delivery verification';

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id text REFERENCES products(id) ON DELETE SET NULL,
  addon_id uuid REFERENCES addons(id) ON DELETE SET NULL, -- For addon items
  name text NOT NULL, -- Store product/addon name at time of order
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  weight text, -- Weight description at time of order
  weight_in_kg decimal(10, 3), -- Weight in kg at time of order
  price decimal(10, 2) NOT NULL CHECK (price >= 0), -- Price at time of order
  price_per_kg decimal(10, 2), -- Price per kg at time of order
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE order_items IS 'Items in each order';
COMMENT ON COLUMN order_items.name IS 'Product/addon name at time of order (snapshot)';
COMMENT ON COLUMN order_items.price IS 'Price at time of order (snapshot)';

-- ============================================
-- ORDER TIMELINE
-- ============================================
CREATE TABLE IF NOT EXISTS order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  stage text NOT NULL CHECK (stage IN ('Order Placed', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Order Cancelled')),
  description text NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE order_timeline IS 'Order status timeline/events';
COMMENT ON COLUMN order_timeline.stage IS 'Order stage in the delivery process';
COMMENT ON COLUMN order_timeline.is_completed IS 'Whether this timeline event is completed';

-- ============================================
-- FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

COMMENT ON TABLE favorites IS 'User favorite products';

-- ============================================
-- USER ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  activity_description text,
  entity_type text, -- 'order', 'product', 'address', etc.
  entity_id text, -- ID of the related entity
  metadata jsonb, -- Additional metadata about the activity
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE user_activity_logs IS 'Logs of user activities for analytics and debugging';

-- ============================================
-- LOGIN SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  ip_address text,
  user_agent text,
  login_at timestamptz DEFAULT now() NOT NULL,
  last_activity_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  logout_at timestamptz
);

COMMENT ON TABLE login_sessions IS 'User login sessions for token management';

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON shops(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_timestamp ON order_timeline(timestamp);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_is_active ON login_sessions(is_active) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Shops (Public read, Admin write - add admin policies later)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shops"
  ON shops FOR SELECT
  TO public
  USING (is_active = true);

-- Products (Public read, Admin write)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  TO public
  USING (is_available = true);

-- Addons (Public read)
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available addons"
  ON addons FOR SELECT
  TO public
  USING (is_available = true);

-- Coupons (Public read)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  TO public
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Payment Methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Order Timeline
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order timeline"
  ON order_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_timeline.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Activity Logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON user_activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Login Sessions
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON login_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_count integer;
  order_num text;
BEGIN
  -- Get total count of orders
  SELECT COUNT(*) INTO order_count
  FROM orders;
  
  -- Generate order number: #TAZ + (count + 1000)
  order_num := '#TAZ' || (order_count + 1000)::text;
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_number() IS 'Generates a unique sequential order number (e.g., #TAZ1001)';

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_otp() IS 'Generates a 6-digit OTP for delivery verification';

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id_param uuid)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = coupon_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_coupon_usage(uuid) IS 'Increments the usage count of a coupon';

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row update';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at
  BEFORE UPDATE ON addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE addresses
    SET is_default = false,
        updated_at = now()
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ensure_single_default_address() IS 'Ensures only one address can be marked as default per user';

CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Trigger to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE payment_methods
    SET is_default = false,
        updated_at = now()
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ensure_single_default_payment_method() IS 'Ensures only one payment method can be marked as default per user';

CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- ============================================
-- SAMPLE DATA (Optional - for development)
-- ============================================

-- Insert sample shops with coordinates
INSERT INTO shops (id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at) VALUES
  ('shop-1', 'Fresh Farm Meats', 'Benz Circle, Vijayawada, Andhra Pradesh', '0.5 km', 'https://images.pexels.com/photos/3659865/pexels-photo-3659865.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 98765 43210', 16.4997252, 80.6560636, true, now(), now()),
  ('shop-2', 'City Chicken Center', 'Patamata, Vijayawada, Andhra Pradesh - 520010', '1.2 km', 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 91234 56780', 16.494444, 80.663056, true, now(), now()),
  ('shop-3', 'Mutton & More', 'Kanaka Durga Varadhi, National Highway 65, Krishna Lanka, Vijayawada, Andhra Pradesh - 520013', '2.0 km', 'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 99887 66554', 16.492778, 80.619167, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  image_url = EXCLUDED.image_url,
  contact_phone = EXCLUDED.contact_phone,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = now();

-- Insert sample addons
INSERT INTO addons (id, name, price, description, is_available, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Extra Spice Mix', 40.00, 'Special spice blend for enhanced flavor', true, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'Marination Pack', 80.00, 'Ready-to-use marination mix', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert sample coupons
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, valid_until, is_active, created_at, updated_at) VALUES
  ('SAVE10', 'fixed', 40.00, 200.00, NULL, true, now(), now()),
  ('DISCOUNT15', 'fixed', 60.00, 400.00, NULL, true, now(), now()),
  ('WELCOME20', 'percentage', 20.00, 500.00, NULL, true, now(), now())
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  updated_at = now();

COMMENT ON TABLE shops IS 'Meat shops/butchers with location coordinates for distance-based delivery charges';
COMMENT ON TABLE products IS 'Meat products with pricing, weight, and availability information';
COMMENT ON TABLE orders IS 'Customer orders with delivery tracking and payment information';
COMMENT ON TABLE order_items IS 'Individual items in each order (snapshot of product details at time of order)';
COMMENT ON TABLE order_timeline IS 'Order status timeline for tracking delivery progress';

