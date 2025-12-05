-- ============================================================
-- COMPLETE TAZA APP MIGRATION - TABLES + DATA
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: CREATE TABLES
-- ============================================================

-- SHOPS
CREATE TABLE IF NOT EXISTS shops (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  distance text,
  image_url text NOT NULL,
  contact_phone text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  weight text,
  weight_in_kg decimal(10, 3) NOT NULL DEFAULT 1.0,
  price decimal(10, 2) NOT NULL,
  price_per_kg decimal(10, 2) NOT NULL,
  original_price decimal(10, 2),
  discount_percentage integer DEFAULT 0,
  image_url text NOT NULL,
  description text DEFAULT '',
  rating decimal(3, 2) DEFAULT 0.0,
  is_available boolean DEFAULT true NOT NULL,
  shop_id text REFERENCES shops(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ADDONS
CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10, 2) NOT NULL,
  description text,
  is_available boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- COUPONS
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'fixed',
  discount_value decimal(10, 2) NOT NULL,
  min_order_amount decimal(10, 2) DEFAULT 0,
  max_discount decimal(10, 2),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text NOT NULL UNIQUE,
  gender text,
  profile_picture text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ADDRESSES
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
  label text DEFAULT 'Home',
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- PAYMENT METHODS
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  provider text,
  name text,
  details jsonb,
  card_number text,
  card_expiry text,
  card_cvv text,
  cardholder_name text,
  account_number text,
  ifsc_code text,
  account_holder_name text,
  bank_name text,
  is_default boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL UNIQUE,
  parent_order text,
  shop_id text REFERENCES shops(id) ON DELETE SET NULL,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  subtotal decimal(10, 2) NOT NULL,
  delivery_charge decimal(10, 2) DEFAULT 0.0,
  discount decimal(10, 2) DEFAULT 0.0,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  total decimal(10, 2) NOT NULL,
  status text DEFAULT 'Preparing' NOT NULL,
  status_note text,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_method_text text DEFAULT 'Cash on Delivery',
  otp text,
  delivery_eta timestamptz,
  delivered_at timestamptz,
  delivery_agent_name text,
  delivery_agent_mobile text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id text REFERENCES products(id) ON DELETE SET NULL,
  addon_id uuid REFERENCES addons(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  weight text,
  weight_in_kg decimal(10, 3),
  price decimal(10, 2) NOT NULL,
  price_per_kg decimal(10, 2),
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ORDER TIMELINE
CREATE TABLE IF NOT EXISTS order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  stage text NOT NULL,
  description text NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- PART 2: CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_shops_is_active ON shops(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- ============================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================

-- Shops (Public read)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active shops" ON shops;
CREATE POLICY "Anyone can view active shops"
  ON shops FOR SELECT
  TO public
  USING (is_active = true);

-- Products (Public read)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view available products" ON products;
CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  TO public
  USING (is_available = true);

-- Addons (Public read)
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view available addons" ON addons;
CREATE POLICY "Anyone can view available addons"
  ON addons FOR SELECT
  TO public
  USING (is_available = true);

-- Coupons (Public read)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  TO public
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Payment Methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own payment methods" ON payment_methods;
CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
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

DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
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
DROP POLICY IF EXISTS "Users can view own order timeline" ON order_timeline;
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
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- PART 4: CREATE FUNCTIONS
-- ============================================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_count integer;
  order_num text;
BEGIN
  SELECT COUNT(*) INTO order_count FROM orders;
  order_num := '#TAZ' || (order_count + 1000)::text;
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

-- ============================================================
-- PART 5: CREATE TRIGGERS
-- ============================================================

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addons_updated_at ON addons;
CREATE TRIGGER update_addons_updated_at
  BEFORE UPDATE ON addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success notification
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: All tables, indexes, policies, functions, and triggers created!';
END $$;



-- ============================================================
-- PART 6: INSERT DATA
-- ============================================================


-- Insert Shops
INSERT INTO shops (id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at)
VALUES
  ('shop-1', 'Fresh Farm Meats', 'Benz Circle, Vijayawada, Andhra Pradesh', '0.5 km', 'https://images.pexels.com/photos/3659865/pexels-photo-3659865.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 98765 43210', 16.4997252, 80.6560636, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('shop-2', 'City Chicken Center', 'Patamata, Vijayawada, Andhra Pradesh - 520010', '1.2 km', 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 91234 56780', 16.494444, 80.663056, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('shop-3', 'Mutton & More', 'Kanaka Durga Varadhi, National Highway 65, Krishna Lanka, Vijayawada, Andhra Pradesh - 520013', '2.0 km', 'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 99887 66554', 16.492778, 80.619167, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  distance = EXCLUDED.distance,
  image_url = EXCLUDED.image_url,
  contact_phone = EXCLUDED.contact_phone,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_active = EXCLUDED.is_active,
  updated_at = now();



-- Insert Products
INSERT INTO products (id, name, category, weight, weight_in_kg, price, price_per_kg, original_price, discount_percentage, image_url, description, rating, is_available, shop_id, created_at, updated_at)
VALUES
  ('1', 'Whole Chicken  with Skin', 'Chicken', '', 1, 220, 220, NULL, NULL, '/images/Chicken/full%20chcken.jpg', 'Our chicken curry cut is a premium cut that is perfect for making delicious curries. The chicken tender cut has exquisite pieces for creating delicious and the juiciest bites.', 0, true, NULL, '2025-11-26T05:05:06.333Z', '2025-11-26T05:05:06.337Z'),
  ('2', 'Legs With Skin', 'Chicken', '', 1, 432, 432, NULL, NULL, '/images/Chicken/chicken%20legs.jpg', 'Premium boneless chicken cuts, perfect for grilling, frying, or making your favorite chicken dishes.', 0, true, NULL, '2025-11-26T05:05:06.337Z', '2025-11-26T05:05:06.337Z'),
  ('3', 'Legs Without Skin', 'Chicken', '', 0.5, 180, 360, NULL, NULL, '/images/Chicken/chicken%20skinless%20legs.webp', 'Fresh whole chicken leg, perfect for roasting or grilling. Tender and juicy.', 0, true, NULL, '2025-11-26T05:05:06.338Z', '2025-11-26T05:05:06.338Z'),
  ('4', 'Liver', 'Chicken', '', 0.5, 250, 500, NULL, NULL, '/images/Chicken/chicken-liver.webp', 'Crispy chicken wings, perfect for appetizers or snacks. Great for parties.', 0, true, NULL, '2025-11-26T05:05:06.338Z', '2025-11-26T05:05:06.338Z'),
  ('5', 'Chicken Breast Fillet', 'Chicken', '', 1, 380, 380, NULL, NULL, '/images/Chicken/Chicken%20Breast%20Fillet.jpg', 'Premium chicken breast fillets, lean and protein-rich. Perfect for healthy meals.', 0, true, NULL, '2025-11-26T05:05:06.338Z', '2025-11-26T05:05:06.338Z'),
  ('6', 'Chicken Curry Cut - Small Pieces', 'Chicken', '', 0.5, 160, 320, NULL, NULL, '/images/Chicken/Chicken%20Curry%20Cut%20-%20Small%20Pieces.webp', 'Juicy bone-in and boneless chicken pieces ideal for flavorful curries.', 0, true, NULL, '2025-11-26T05:05:06.338Z', '2025-11-26T05:05:06.338Z'),
  ('7', 'Chicken Curry Cut - Small Pieces (Large Pack)', 'Chicken', '', 1, 322, 322, NULL, NULL, '/images/Chicken/Chicken%20Curry%20Cut%20-%20Small%20Pieces%20(Large%20Pack).webp', 'Family-sized curry cut pack with generous juicy pieces perfect for big meals.', 0, true, NULL, '2025-11-26T05:05:06.338Z', '2025-11-26T05:05:06.338Z'),
  ('8', 'Chicken Breast - Boneless', 'Chicken', '', 0.45, 274, 608.89, NULL, NULL, '/images/Chicken/Chicken%20Breast%20-%20Boneless.webp', 'Lean and tender chicken breast portions perfect for grills, salads, and healthy cooking.', 0, true, NULL, '2025-11-26T05:05:06.338Z', '2025-11-26T05:05:06.338Z'),
  ('9', 'Chicken Boneless - Mini Bites', 'Chicken', '', 0.25, 218, 872, NULL, NULL, '/images/Chicken/Chicken%20Boneless%20-%20Mini%20Bites.webp', 'Juicy mini-sized boneless chicken bites great for snacks, stir fries, and wraps.', 0, true, NULL, '2025-11-26T05:05:06.338Z', '2025-11-26T05:05:06.338Z'),
  ('10', 'Premium Chicken Thigh Boneless', 'Chicken', '', 0.45, 304, 675.56, NULL, NULL, '/images/Chicken/Premium%20Chicken%20Thigh%20Boneless.webp', 'Succulent, meaty boneless chicken thighs perfect for roasting, grilling, or curries.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('11', 'Tender Spring Chicken Curry Cut', 'Chicken', '', 0.8, 305, 381.25, NULL, NULL, '/images/Chicken/Tender%20Spring%20Chicken%20Curry%20Cut.webp', 'Tender spring chicken pieces carefully cut for wholesome curries and gravies.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('12', 'Chicken Drumstick - Pack of 6', 'Chicken', '', 0.6, 273, 455, NULL, NULL, '/images/Chicken/Chicken%20Drumstick%20-%20Pack%20Of%206.webp', 'Juicy bone-in chicken drumsticks from the leg, great for frying, baking, or grilling.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('13', 'Chicken Breast Boneless (Large Pack)', 'Chicken', '', 0.9, 545, 605.56, NULL, NULL, '/images/Chicken/Chicken%20Breast%20Boneless%20(Large%20Pack).webp', 'Skinless, boneless chicken breast pieces perfect for meal prep and family feasts.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('14', 'Chicken Boneless Cubes', 'Chicken', '', 0.45, 260, 577.78, NULL, NULL, '/images/Chicken/Chicken%20Boneless%20Cubes.webp', 'Boneless chicken cubes made from leg and breast portions for versatile cooking.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('15', 'Chicken Drumsticks - Pack of 2 (Mini Pack)', 'Chicken', '', 0.2, 129, 645, NULL, NULL, '/images/Chicken/Chicken%20Drumsticks%20-%20Pack%20of%202%20(Mini%20Pack).webp', 'Convenient mini pack of drumsticks, ideal for single servings and quick meals.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('16', 'Chicken Mince (Keema)', 'Chicken', '', 0.45, 279, 620, NULL, NULL, '/images/Chicken/Chicken%20Mince%20(Keema).webp', 'Moist and tender chicken mince for kebabs, keema, momos, and flavorful curries.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('17', 'Premium Chicken Leg Curry Cut', 'Chicken', '', 0.3, 206, 686.67, NULL, NULL, '/images/Chicken/Premium%20Chicken%20Leg%20Curry%20Cut.webp', 'Juicy bone-in leg pieces trimmed for aromatic curries or biryanis.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('18', 'Classic Chicken Soup Bones', 'Chicken', '', 0.25, 99, 396, NULL, NULL, '/images/Chicken/Classic%20Chicken%20Soup%20Bones.webp', 'Cleaned chicken bones specially cut for rich stocks, soups, and broths.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('19', 'Premium Chicken Tangdi Biryani Cut', 'Chicken', '', 0.55, 313, 569.09, NULL, NULL, '/images/Chicken/Premium%20Chicken%20Tangdi%20Biryani%20Cut.webp', 'Juicy tangdi drumsticks and whole thigh pieces designed especially for biryanis.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('20', 'Chicken Curry Cut with Skin - Small Pieces', 'Chicken', '', 0.5, 176, 352, NULL, NULL, '/images/Chicken/Chicken%20Curry%20Cut%20with%20Skin%20-%20Small%20Pieces.webp', 'Flavor-packed skin-on chicken curry cut offering crispy bites and juicy meat.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('21', 'Chicken Leg With Thigh - Pack of 3', 'Chicken', '', 0.45, 266, 591.11, NULL, NULL, '/images/Chicken/Chicken%20Leg%20With%20Thigh%20-%20Pack%20of%203.webp', 'Large bone-in chicken legs with thigh portions ideal for biryanis and grills.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('22', 'Chicken Mince/Keema - 250g (Mini Pack)', 'Chicken', '', 0.25, 180, 720, NULL, NULL, '/images/Chicken/Chicken%20Mince%20(Keema)%20250g.webp', 'Mini pack of finely ground chicken mince perfect for quick snacks and fillings.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('23', 'Classic Chicken Biryani Cut', 'Chicken', '', 0.5, 215, 430, NULL, NULL, '/images/Chicken/Classic%20Chicken%20Biryani%20Cut.png', 'Five juicy biryani-ready chicken pieces that cook evenly for fluffy rice dishes.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('24', 'Chicken Lollipop - Pack of 10', 'Chicken', '', 0.4, 189, 472.5, NULL, NULL, '/images/Chicken/Chicken%20Lollipop%20-%20Pack%20of%2010.webp', 'Meaty chicken lollipops trimmed and frenched for crispy party starters.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('26', 'Chicken Wings with Skin', 'Chicken', '', 0.43, 169, 393.02, NULL, NULL, '/images/Chicken/Chicken%20Wings%20with%20Skin.webp', 'Cut and cleaned chicken wings with skin for crispy frying or saucy tossing.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('28', 'Chicken Curry Cut - Large Pieces (Large Pack)', 'Chicken', '', 1, 322, 322, NULL, NULL, '/images/Chicken/Chicken%20Curry%20Cut%20-%20Large%20Pieces%20(Large%20Pack).webp', 'Bulk pack of large curry cut pieces for family feasts and gatherings.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('39', 'Goat Curry Cut', 'Mutton', '', 0.5, 579, 1158, NULL, NULL, '/images/Mutton/goat%20curry%20cut.webp', 'Balanced bone-in and boneless goat cuts that deliver rich gravies every time.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('40', 'Pure Goat Mince', 'Mutton', '', 0.45, 494, 1097.78, NULL, NULL, '/images/Mutton/pure%20goat%20mince.webp', 'Finely ground goat mince that is ideal for curries, kebabs, samosas, and more.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('41', 'Mutton Liver (Small Pack)', 'Mutton', '', 0.1, 159, 1590, NULL, NULL, '/images/Mutton/mutton%20liver%20small%20pack.webp', 'Cut and cleaned mutton liver pieces that cook quickly for pan-fried delicacies.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('42', 'Mutton Liver - Chunks', 'Mutton', '', 0.25, 322, 1288, NULL, NULL, '/images/Mutton/mutton%20liver%20chunks.jpeg', 'Generous liver chunks, trimmed and cleaned for slow roasting or pan-frying.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('43', 'Premium Lamb (Mutton) - Curry Cut', 'Mutton', '', 0.5, 574, 1148, NULL, NULL, '/images/Mutton/primium%20lamb%20mutton%20curry%20cut.webp', 'Balanced lamb curry cut with the right mix of fat and meat for luxurious gravies.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('44', 'Pure Goat Mince (Mini Pack)', 'Mutton', '', 0.225, 260, 1155.56, NULL, NULL, '/images/Mutton/pure%20goat%20mince%20mini%20pack.jpg', 'Convenient mini pack of goat mince, perfect for quick weeknight recipes.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('45', 'Mutton Paya', 'Mutton', '', 0.6, 275, 458.33, NULL, NULL, '/images/Mutton/mutton%20paya.webp', 'Fresh and flavourful lamb trotters that add depth to soups, stews, and curries.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('46', 'Mutton Kidney (Small Pack)', 'Mutton', '', 0.1, 151, 1510, NULL, NULL, '/images/Mutton/mutton%20kidney%20small%20pack.webp', 'Neatly halved mutton kidneys ready for pan-fried or grilled delicacies.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('47', 'Mutton Soup Bones', 'Mutton', '', 0.35, 359, 1025.71, NULL, NULL, '/images/Mutton/mutton%20soup%20bones.jpeg', 'Cleaned mutton bones that simmer into deeply flavourful stocks and soups.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('49', 'Goat Boneless (Mini Pack)', 'Mutton', '', 0.25, 412, 1648, NULL, NULL, '/images/Mutton/goat%20boneless%20mini%20pack.jpg', 'Bite-sized goat boneless cuts, trimmed for pan-frying and quick sautés.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('50', 'Goat Chops', 'Mutton', '', 0.2, 285, 1425, NULL, NULL, '/images/Mutton/goat%20chops.jpg', 'Rich goat rib and T-bone steaks that grill beautifully every single time.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('51', 'Mutton Paya/Trotters (Whole)', 'Mutton', '', 1, 505, 505, NULL, NULL, '/images/Mutton/mutton%20paya%26trotters%20whole.jpg', 'Cleaned front and hind trotters, perfect for collagen-rich soups and gravies.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('52', 'Mutton Brain (Bheja)', 'Mutton', '', 0.2, 268, 1340, NULL, NULL, '/images/Mutton/mutton%20brain%20bheja.jpg', 'Premium mutton brain cleaned for rich, creamy bheja fry and specialty dishes.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('53', 'Goat Biryani Cut', 'Mutton', '', 0.5, 642, 1284, NULL, NULL, '/images/Mutton/goat%20biryani%20cut.jpeg', 'Fat-rich goat cuts chosen exclusively for flavour-packed biryanis.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('54', 'Lamb (Mutton) - Mince', 'Mutton', '', 0.45, 665, 1477.78, NULL, NULL, '/images/Mutton/lamb%20mutton%20mince.webp', 'Finely ground lamb mince that keeps kebabs, curries, and pies moist.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('56', 'Mutton Spleen (Thilli/Manneral/Suvarotti)', 'Mutton', '', 0.15, 249, 1660, NULL, NULL, '/images/Mutton/mutton%20spleen%20(thilli-manneral-suvarotti).webp', 'Cleaned whole mutton spleen, ready for traditional pan-fried or grilled recipes.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('57', 'Mutton Kapura - Medium', 'Mutton', '', 0.25, 239, 956, NULL, NULL, '/images/Mutton/mutton%20kapura%20-%20medium.webp', 'Cleaned kapura portions, perfect for pan-fried delicacies and grills.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('58', 'Mutton Heart', 'Mutton', '', 0.2, 207, 1035, NULL, NULL, '/images/Mutton/mutton%20heart.jpg', 'Cleaned, rich-flavoured mutton heart pieces ideal for slow cooking or grilling.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('59', 'Mutton Kapura - Large', 'Mutton', '', 0.25, 299, 1196, NULL, NULL, '/images/Mutton/mutton%20kapura%20-%20large.webp', 'Large tender kapura portions that stay juicy in pan-fried delicacies.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('60', 'Mutton Lungs', 'Mutton', '', 0.25, 98, 392, NULL, NULL, '/images/Mutton/mutton%20lungs.jpg', 'Light and airy mutton lungs ideal for sautéing, stewing, or spicy fries.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('61', 'Mutton Head Meat Medium (Thale Mamsa)', 'Mutton', '', 1, 275, 275, NULL, NULL, '/images/Mutton/mutton%20head%20meat%20medium(thala%20mamsam).webp', 'Head meat pieces perfect for broths, soups, and traditional slow-cooked meals.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('62', 'Goat Shoulder Curry & Liver Combo', 'Mutton', '', 0.75, 1099, 1465.33, NULL, NULL, '/images/Mutton/goat%20curry%20cut.webp', 'Combo saver with 500g goat shoulder curry cut and 250g mutton liver chunks.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('63', 'Mutton Boti & Intestine (1 Set)', 'Mutton', '', 1, 350, 350, NULL, NULL, '/images/Mutton/mutton%20boti.webp', 'Cleaned mutton boti and intestines, great for slow-cooked traditional recipes.', 0, true, NULL, '2025-11-26T05:05:06.339Z', '2025-11-26T05:05:06.339Z'),
  ('64', 'Fresh Pork Belly', 'Pork', '', 0.5, 450, 900, NULL, NULL, '/images/PORK/fresh%20pork%20belly.webp', 'Premium pork belly with perfect layers of meat and fat, ideal for roasting, braising, or making crispy pork belly.', 0, true, NULL, '2025-11-26T05:05:06.340Z', '2025-11-26T05:05:06.340Z'),
  ('65', 'Fresh Pork Curry Cut Boneless', 'Pork', '', 0.5, 380, 760, NULL, NULL, '/images/PORK/fresh%20pork%20curry%20cut%20boneless.webp', 'Tender boneless pork pieces cut perfectly for curries, stir-fries, and quick cooking dishes.', 0, true, NULL, '2025-11-26T05:05:06.340Z', '2025-11-26T05:05:06.340Z'),
  ('66', 'Fresh Pork Curry Cut with Bone', 'Pork', '', 0.5, 320, 640, NULL, NULL, '/images/PORK/Fresh%20Pork%20curry%20cut%20with%20bone.webp', 'Bone-in pork curry cut pieces that add rich flavor to curries, stews, and traditional dishes.', 0, true, NULL, '2025-11-26T05:05:06.340Z', '2025-11-26T05:05:06.340Z'),
  ('67', 'Fresh Pork Keema (Minced)', 'Pork', '', 0.45, 340, 755.56, NULL, NULL, '/images/PORK/fresh%20pork%20keema%20minced.webp', 'Finely minced fresh pork perfect for kebabs, samosas, keema curry, and stuffed dishes.', 0, true, NULL, '2025-11-26T05:05:06.340Z', '2025-11-26T05:05:06.340Z'),
  ('68', 'Fresh Pork Red Meat Only Curry Cut', 'Pork', '', 0.5, 420, 840, NULL, NULL, '/images/PORK/fresh%20pork%20red%20meat%20only%20curry%20cut.webp', 'Lean pork curry cut with minimal fat, perfect for healthy cooking and protein-rich meals.', 0, true, NULL, '2025-11-26T05:05:06.340Z', '2025-11-26T05:05:06.340Z'),
  ('69', 'Fresh Pork Ribs', 'Pork', '', 0.6, 480, 800, NULL, NULL, '/images/PORK/fresh%20pork%20ribs.webp', 'Meaty pork ribs perfect for grilling, slow-cooking, or making finger-licking BBQ ribs.', 0, true, NULL, '2025-11-26T05:05:06.340Z', '2025-11-26T05:05:06.340Z'),
  ('70', 'Pork Chops', 'Pork', '', 0.4, 360, 900, NULL, NULL, '/images/PORK/pork%20chops.webp', 'Thick-cut premium pork chops, tender and juicy, ideal for pan-frying, grilling, or baking.', 0, true, NULL, '2025-11-26T05:05:06.340Z', '2025-11-26T05:05:06.340Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  weight = EXCLUDED.weight,
  weight_in_kg = EXCLUDED.weight_in_kg,
  price = EXCLUDED.price,
  price_per_kg = EXCLUDED.price_per_kg,
  original_price = EXCLUDED.original_price,
  discount_percentage = EXCLUDED.discount_percentage,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating,
  is_available = EXCLUDED.is_available,
  shop_id = EXCLUDED.shop_id,
  updated_at = now();



-- Insert Addons
INSERT INTO addons (id, name, price, description, is_available, created_at, updated_at)
VALUES
  ('addon-1', 'Extra Spice Mix', 40, 'Special spice blend for enhanced flavor', true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('addon-2', 'Marination Pack', 80, 'Ready-to-use marination for your meat', true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_available = EXCLUDED.is_available,
  updated_at = now();



-- Insert Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, is_active, created_at, updated_at)
VALUES
  ('coupon-1', 'SAVE10', NULL, 'fixed', 40, 200, NULL, '2024-01-01T00:00:00.000Z', NULL, NULL, 0, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('coupon-2', 'DISCOUNT15', NULL, 'percentage', 15, 500, 100, '2024-01-01T00:00:00.000Z', NULL, 100, 5, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  max_discount = EXCLUDED.max_discount,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  usage_limit = EXCLUDED.usage_limit,
  used_count = EXCLUDED.used_count,
  is_active = EXCLUDED.is_active,
  updated_at = now();


-- Success message
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'SUCCESS: Database setup complete!';
  RAISE NOTICE 'Shops: 3 | Products: 56 | Addons: 2 | Coupons: 2';
  RAISE NOTICE '==============================================';
END $$;
