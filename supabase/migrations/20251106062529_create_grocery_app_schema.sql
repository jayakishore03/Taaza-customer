/*
  # Meat & Grocery App Database Schema

  ## New Tables
  
  ### products
  - `id` (uuid, primary key)
  - `name` (text) - Product name
  - `category` (text) - Product category (Chicken, Mutton, Seafood, Fish)
  - `weight` (text) - Weight description
  - `price` (decimal) - Product price
  - `rating` (decimal) - Product rating
  - `image_url` (text) - Product image URL
  - `description` (text) - Product description
  - `discount` (integer) - Discount percentage
  - `nutrition_calories` (text) - Nutritional info
  - `nutrition_carbs` (text) - Nutritional info
  - `nutrition_fat` (text) - Nutritional info
  - `nutrition_protein` (text) - Nutritional info
  - `created_at` (timestamp)
  
  ### orders
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `delivery_address` (text) - Delivery address
  - `subtotal` (decimal) - Order subtotal
  - `delivery_charge` (decimal) - Delivery fee
  - `discount` (decimal) - Discount applied
  - `total` (decimal) - Total amount
  - `status` (text) - Order status
  - `created_at` (timestamp)
  
  ### order_items
  - `id` (uuid, primary key)
  - `order_id` (uuid, foreign key)
  - `product_id` (uuid, foreign key)
  - `quantity` (integer) - Quantity ordered
  - `price` (decimal) - Price at time of order
  - `created_at` (timestamp)
  
  ### favorites
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `product_id` (uuid, foreign key)
  - `created_at` (timestamp)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  weight text NOT NULL,
  price decimal(10, 2) NOT NULL,
  rating decimal(3, 2) DEFAULT 0.0,
  image_url text NOT NULL,
  description text DEFAULT '',
  discount integer DEFAULT 0,
  nutrition_calories text DEFAULT '0kcal',
  nutrition_carbs text DEFAULT '0g',
  nutrition_fat text DEFAULT '0g',
  nutrition_protein text DEFAULT '0g',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_address text NOT NULL,
  subtotal decimal(10, 2) NOT NULL,
  delivery_charge decimal(10, 2) DEFAULT 0.0,
  discount decimal(10, 2) DEFAULT 0.0,
  total decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample products
INSERT INTO products (name, category, weight, price, rating, image_url, description, discount, nutrition_calories, nutrition_carbs, nutrition_fat, nutrition_protein)
VALUES 
  -- Chicken Products
  (
    'Chicken Curry Cut - Small Pieces',
    'Chicken',
    '2 Packs | Serves 2-3',
    220.00,
    4.5,
    'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Our chicken curry cut is a premium cut that is perfect for making delicious curries. The chicken tender cut has exquisite pieces for creating delicious and the juiciest bites.',
    20,
    '120kcal',
    '0g',
    '4.8g',
    '18.6g'
  ),
  (
    'Chicken Boneless',
    'Chicken',
    '3.5 Packs | Serves 4-5',
    432.00,
    4.8,
    'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Premium boneless chicken cuts, perfect for grilling, frying, or making your favorite chicken dishes.',
    0,
    '165kcal',
    '0g',
    '3.6g',
    '31g'
  ),
  (
    'Chicken Whole Leg',
    'Chicken',
    '1 Pack | Serves 2',
    180.00,
    4.6,
    'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh whole chicken leg, perfect for roasting or grilling. Tender and juicy.',
    10,
    '185kcal',
    '0g',
    '9.3g',
    '24g'
  ),
  (
    'Chicken Wings',
    'Chicken',
    '500g | Serves 3-4',
    250.00,
    4.7,
    'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Crispy chicken wings, perfect for appetizers or snacks. Great for parties.',
    15,
    '203kcal',
    '0g',
    '12.6g',
    '20.3g'
  ),
  (
    'Chicken Breast Fillet',
    'Chicken',
    '2 Packs | Serves 2-3',
    380.00,
    4.9,
    'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Premium chicken breast fillets, lean and protein-rich. Perfect for healthy meals.',
    0,
    '165kcal',
    '0g',
    '3.6g',
    '31g'
  ),
  -- Mutton Products
  (
    'Fresh Mutton Curry Cut',
    'Mutton',
    '1.5 Packs | Serves 2-3',
    850.00,
    4.7,
    'https://images.pexels.com/photos/3689532/pexels-photo-3689532.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh mutton curry cut with the perfect balance of meat and bones for rich, flavorful curries.',
    15,
    '294kcal',
    '0g',
    '21g',
    '26g'
  ),
  (
    'Mutton Boneless',
    'Mutton',
    '1 Pack | Serves 2-3',
    950.00,
    4.8,
    'https://images.pexels.com/photos/3689532/pexels-photo-3689532.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Premium boneless mutton pieces, tender and flavorful. Perfect for biryani and kebabs.',
    10,
    '250kcal',
    '0g',
    '18g',
    '20g'
  ),
  (
    'Mutton Chops',
    'Mutton',
    '500g | Serves 2',
    750.00,
    4.6,
    'https://images.pexels.com/photos/3689532/pexels-photo-3689532.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh mutton chops, ideal for grilling or slow cooking. Rich and succulent.',
    20,
    '300kcal',
    '0g',
    '22g',
    '25g'
  ),
  (
    'Mutton Keema',
    'Mutton',
    '500g | Serves 3-4',
    680.00,
    4.5,
    'https://images.pexels.com/photos/3689532/pexels-photo-3689532.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Finely minced mutton keema, perfect for making kebabs, samosas, and curries.',
    0,
    '280kcal',
    '0g',
    '20g',
    '22g'
  ),
  -- Seafood Products
  (
    'Fresh Prawns',
    'Seafood',
    '500g | Serves 2-3',
    1299.00,
    4.6,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh, large prawns perfect for grilling, curry, or stir-fry dishes.',
    0,
    '99kcal',
    '0.2g',
    '1.7g',
    '24g'
  ),
  (
    'Lobster Tails',
    'Seafood',
    '2 Pieces | Serves 2',
    2500.00,
    4.9,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Premium lobster tails, fresh and succulent. Perfect for special occasions.',
    5,
    '90kcal',
    '0.5g',
    '0.5g',
    '19g'
  ),
  (
    'Crab Meat',
    'Seafood',
    '500g | Serves 2-3',
    1800.00,
    4.7,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh crab meat, sweet and tender. Great for salads, pasta, or curry.',
    10,
    '87kcal',
    '0.7g',
    '1.1g',
    '18g'
  ),
  (
    'Squid Rings',
    'Seafood',
    '500g | Serves 3-4',
    650.00,
    4.5,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh squid rings, perfect for frying or grilling. Tender and delicious.',
    15,
    '92kcal',
    '3.1g',
    '1.4g',
    '15.6g'
  ),
  -- Fish Products
  (
    'Fresh Pomfret',
    'Fish',
    '1 Piece (500g) | Serves 2',
    450.00,
    4.8,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh whole pomfret, perfect for frying or curry. Delicate and flavorful.',
    0,
    '104kcal',
    '0g',
    '3.4g',
    '17.8g'
  ),
  (
    'Rohu Fish',
    'Fish',
    '1 Piece (1kg) | Serves 4-5',
    380.00,
    4.6,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh rohu fish, popular for curry and fry. Rich in omega-3 fatty acids.',
    10,
    '97kcal',
    '0g',
    '2.7g',
    '17.5g'
  ),
  (
    'Salmon Fillet',
    'Fish',
    '300g | Serves 2',
    1200.00,
    4.9,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Premium salmon fillet, rich in omega-3. Perfect for grilling or baking.',
    5,
    '206kcal',
    '0g',
    '12g',
    '22g'
  ),
  (
    'Tuna Steaks',
    'Fish',
    '2 Pieces (400g) | Serves 2',
    950.00,
    4.7,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh tuna steaks, meaty and flavorful. Great for grilling or pan-searing.',
    0,
    '184kcal',
    '0g',
    '6.3g',
    '30g'
  ),
  (
    'Kingfish',
    'Fish',
    '1 Piece (800g) | Serves 3-4',
    680.00,
    4.8,
    'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Fresh kingfish, firm and flavorful. Perfect for curry or grilling.',
    15,
    '105kcal',
    '0g',
    '2.9g',
    '20.5g'
  )
ON CONFLICT DO NOTHING;
