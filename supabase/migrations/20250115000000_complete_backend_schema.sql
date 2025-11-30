/*
  # Complete Taza Backend Database Schema
  
  This migration creates all necessary tables for the Taza meat delivery app.
  Includes: users, addresses, shops, products, orders, order_items, order_timeline,
  addons, coupons, payment_methods, and favorites.
*/

-- ============================================
-- USER PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text NOT NULL UNIQUE,
  profile_picture text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  label text DEFAULT 'Home', -- 'Home', 'Office', 'Other'
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- SHOPS
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  distance text, -- e.g., "0.5 km"
  image_url text NOT NULL,
  contact_phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- PRODUCTS (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL, -- 'Chicken', 'Mutton', 'Seafood', 'Fish'
  weight text, -- Display weight description
  weight_in_kg decimal(10, 3) NOT NULL DEFAULT 1.0,
  price decimal(10, 2) NOT NULL, -- Price for the weight specified
  price_per_kg decimal(10, 2) NOT NULL, -- Price per kilogram
  original_price decimal(10, 2), -- Original price before discount
  discount_percentage integer DEFAULT 0,
  image_url text NOT NULL,
  description text DEFAULT '',
  rating decimal(3, 2) DEFAULT 0.0,
  is_available boolean DEFAULT true,
  shop_id uuid REFERENCES shops(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ADDONS
-- ============================================
CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10, 2) NOT NULL,
  description text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_amount decimal(10, 2) NOT NULL,
  discount_percentage integer, -- If percentage-based
  min_order_amount decimal(10, 2) DEFAULT 0,
  max_discount decimal(10, 2), -- Maximum discount cap
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  usage_limit integer, -- Total usage limit
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- PAYMENT METHODS
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'UPI', 'Card', 'Cash', 'Wallet'
  provider text, -- 'PhonePe', 'Google Pay', 'HDFC Bank', etc.
  details jsonb, -- Store card details, UPI ID, etc. (encrypted in production)
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ORDERS (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL UNIQUE, -- e.g., '#TAZ1034'
  parent_order text, -- For grouped orders
  shop_id uuid REFERENCES shops(id) ON DELETE SET NULL,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  subtotal decimal(10, 2) NOT NULL,
  delivery_charge decimal(10, 2) DEFAULT 0.0,
  discount decimal(10, 2) DEFAULT 0.0,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  total decimal(10, 2) NOT NULL,
  status text DEFAULT 'Preparing', -- 'Preparing', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'
  status_note text,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_method_text text, -- Store payment method as text for display
  otp text, -- 6-digit OTP for delivery verification
  delivery_eta timestamptz, -- Estimated delivery time
  delivered_at timestamptz,
  delivery_agent_name text,
  delivery_agent_mobile text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  addon_id uuid REFERENCES addons(id) ON DELETE SET NULL, -- For addon items
  name text NOT NULL, -- Store product/addon name at time of order
  quantity integer NOT NULL DEFAULT 1,
  weight text, -- Weight description at time of order
  weight_in_kg decimal(10, 3), -- Weight in kg at time of order
  price decimal(10, 2) NOT NULL, -- Price at time of order
  price_per_kg decimal(10, 2), -- Price per kg at time of order
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ORDER TIMELINE
-- ============================================
CREATE TABLE IF NOT EXISTS order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  stage text NOT NULL, -- 'Order Placed', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Order Cancelled'
  description text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

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
  -- Get count of orders today
  SELECT COUNT(*) INTO order_count
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate order number: #TAZ + (count + 1) with leading zeros
  order_num := '#TAZ' || LPAD((order_count + 1)::text, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- ============================================
-- SAMPLE DATA (Optional - for development)
-- ============================================

-- Insert sample shops
INSERT INTO shops (id, name, address, distance, image_url, contact_phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Fresh Farm Meats', '123 Market Street', '0.5 km', 'https://images.pexels.com/photos/3659865/pexels-photo-3659865.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 98765 43210'),
  ('00000000-0000-0000-0000-000000000002', 'City Chicken Center', '56 Downtown Avenue', '1.2 km', 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 91234 56780'),
  ('00000000-0000-0000-0000-000000000003', 'Mutton & More', '88 Food Lane', '2.0 km', 'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 99887 66554')
ON CONFLICT DO NOTHING;

-- Insert sample addons
INSERT INTO addons (id, name, price, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Extra Spice Mix', 40.00, 'Special spice blend for enhanced flavor'),
  ('00000000-0000-0000-0000-000000000002', 'Marination Pack', 80.00, 'Ready-to-use marination mix')
ON CONFLICT DO NOTHING;

-- Insert sample coupons
INSERT INTO coupons (code, discount_amount, min_order_amount, valid_until) VALUES
  ('SAVE10', 40.00, 200.00, NULL),
  ('DISCOUNT15', 60.00, 400.00, NULL)
ON CONFLICT (code) DO NOTHING;

