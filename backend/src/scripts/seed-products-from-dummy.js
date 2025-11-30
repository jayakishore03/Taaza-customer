/**
 * Seed products from frontend dummyData to backend JSON database
 * Uses images from backend/images/Chicken and backend/images/Mutton
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Product name to image filename mapping
const IMAGE_MAP = {
  // Chicken products
  'Whole Chicken  with Skin': 'full chcken.jpg',
  'Legs With Skin': 'chicken legs.jpg',
  'Legs Without Skin': 'chicken skinless legs.webp',
  'Liver': 'chicken-liver.webp',
  'Chicken Breast Fillet': 'Chicken Breast Fillet.jpg',
  'Chicken Curry Cut - Small Pieces': 'Chicken Curry Cut - Small Pieces.webp',
  'Chicken Curry Cut - Small Pieces (Large Pack)': 'Chicken Curry Cut - Small Pieces (Large Pack).webp',
  'Chicken Breast - Boneless': 'Chicken Breast - Boneless.webp',
  'Chicken Boneless - Mini Bites': 'Chicken Boneless - Mini Bites.webp',
  'Premium Chicken Thigh Boneless': 'Premium Chicken Thigh Boneless.webp',
  'Tender Spring Chicken Curry Cut': 'Tender Spring Chicken Curry Cut.webp',
  'Chicken Drumstick - Pack of 6': 'Chicken Drumstick - Pack Of 6.webp',
  'Chicken Breast Boneless (Large Pack)': 'Chicken Breast Boneless (Large Pack).webp',
  'Chicken Boneless Cubes': 'Chicken Boneless Cubes.webp',
  'Chicken Drumsticks - Pack of 2 (Mini Pack)': 'Chicken Drumsticks - Pack of 2 (Mini Pack).webp',
  'Chicken Mince (Keema)': 'Chicken Mince (Keema).webp',
  'Premium Chicken Leg Curry Cut': 'Premium Chicken Leg Curry Cut.webp',
  'Classic Chicken Soup Bones': 'Classic Chicken Soup Bones.webp',
  'Premium Chicken Tangdi Biryani Cut': 'Premium Chicken Tangdi Biryani Cut.webp',
  'Chicken Curry Cut with Skin - Small Pieces': 'Chicken Curry Cut with Skin - Small Pieces.webp',
  'Chicken Leg With Thigh - Pack of 3': 'Chicken Leg With Thigh - Pack of 3.webp',
  'Chicken Mince/Keema - 250g (Mini Pack)': 'Chicken Mince (Keema) 250g.webp',
  'Classic Chicken Biryani Cut': 'Classic Chicken Biryani Cut.png',
  'Chicken Lollipop - Pack of 10': 'Chicken Lollipop - Pack of 10.webp',
  'Chicken Wings with Skin': 'Chicken Wings with Skin.webp',
  'Chicken Curry Cut - Large Pieces (Large Pack)': 'Chicken Curry Cut - Large Pieces (Large Pack).webp',
  
  // Mutton products
  'Goat Curry Cut': 'goat curry cut.webp',
  'Pure Goat Mince': 'pure goat mince.webp',
  'Mutton Liver (Small Pack)': 'mutton liver small pack.webp',
  'Mutton Liver - Chunks': 'mutton liver chunks.jpeg',
  'Premium Lamb (Mutton) - Curry Cut': 'primium lamb mutton curry cut.webp',
  'Pure Goat Mince (Mini Pack)': 'pure goat mince mini pack.jpg',
  'Mutton Paya': 'mutton paya.webp',
  'Mutton Kidney (Small Pack)': 'mutton kidney small pack.webp',
  'Mutton Soup Bones': 'mutton soup bones.jpeg',
  'Goat Boneless (Mini Pack)': 'goat boneless mini pack.jpg',
  'Goat Chops': 'goat chops.jpg',
  'Mutton Paya/Trotters (Whole)': 'mutton paya&trotters whole.jpg',
  'Mutton Brain (Bheja)': 'mutton brain bheja.jpg',
  'Goat Biryani Cut': 'goat biryani cut.jpeg',
  'Lamb (Mutton) - Mince': 'lamb mutton mince.webp',
  'Mutton Spleen (Thilli/Manneral/Suvarotti)': 'mutton spleen (thilli-manneral-suvarotti).webp',
  'Mutton Kapura - Medium': 'mutton kapura - medium.webp',
  'Mutton Heart': 'mutton heart.jpg',
  'Mutton Kapura - Large': 'mutton kapura - large.webp',
  'Mutton Lungs': 'mutton lungs.jpg',
  'Mutton Head Meat Medium (Thale Mamsa)': 'mutton head meat medium(thala mamsam).webp',
  'Goat Shoulder Curry & Liver Combo': 'goat curry cut.webp',
  'Mutton Boti & Intestine (1 Set)': 'mutton boti.webp',
};

const DUMMY_PRODUCTS = [
  // Chicken Products
  { id: '1', name: 'Whole Chicken  with Skin', category: 'Chicken', weight: '', weightInKg: 1.0, price: 220.00, pricePerKg: 220.00, description: 'Our chicken curry cut is a premium cut that is perfect for making delicious curries. The chicken tender cut has exquisite pieces for creating delicious and the juiciest bites.' },
  { id: '2', name: 'Legs With Skin', category: 'Chicken', weight: '', weightInKg: 1.0, price: 432.00, pricePerKg: 432.00, description: 'Premium boneless chicken cuts, perfect for grilling, frying, or making your favorite chicken dishes.' },
  { id: '3', name: 'Legs Without Skin', category: 'Chicken', weight: '', weightInKg: 0.5, price: 180.00, pricePerKg: 360.00, description: 'Fresh whole chicken leg, perfect for roasting or grilling. Tender and juicy.' },
  { id: '4', name: 'Liver', category: 'Chicken', weight: '', weightInKg: 0.5, price: 250.00, pricePerKg: 500.00, description: 'Crispy chicken wings, perfect for appetizers or snacks. Great for parties.' },
  { id: '5', name: 'Chicken Breast Fillet', category: 'Chicken', weight: '', weightInKg: 1.0, price: 380.00, pricePerKg: 380.00, description: 'Premium chicken breast fillets, lean and protein-rich. Perfect for healthy meals.' },
  { id: '6', name: 'Chicken Curry Cut - Small Pieces', category: 'Chicken', weight: '', weightInKg: 0.5, price: 160.0, pricePerKg: 320.0, description: 'Juicy bone-in and boneless chicken pieces ideal for flavorful curries.' },
  { id: '7', name: 'Chicken Curry Cut - Small Pieces (Large Pack)', category: 'Chicken', weight: '', weightInKg: 1.0, price: 322.0, pricePerKg: 322.0, description: 'Family-sized curry cut pack with generous juicy pieces perfect for big meals.' },
  { id: '8', name: 'Chicken Breast - Boneless', category: 'Chicken', weight: '', weightInKg: 0.45, price: 274.0, pricePerKg: 608.89, description: 'Lean and tender chicken breast portions perfect for grills, salads, and healthy cooking.' },
  { id: '9', name: 'Chicken Boneless - Mini Bites', category: 'Chicken', weight: '', weightInKg: 0.25, price: 218.0, pricePerKg: 872.0, description: 'Juicy mini-sized boneless chicken bites great for snacks, stir fries, and wraps.' },
  { id: '10', name: 'Premium Chicken Thigh Boneless', category: 'Chicken', weight: '', weightInKg: 0.45, price: 304.0, pricePerKg: 675.56, description: 'Succulent, meaty boneless chicken thighs perfect for roasting, grilling, or curries.' },
  { id: '11', name: 'Tender Spring Chicken Curry Cut', category: 'Chicken', weight: '', weightInKg: 0.8, price: 305.0, pricePerKg: 381.25, description: 'Tender spring chicken pieces carefully cut for wholesome curries and gravies.' },
  { id: '12', name: 'Chicken Drumstick - Pack of 6', category: 'Chicken', weight: '', weightInKg: 0.6, price: 273.0, pricePerKg: 455.0, description: 'Juicy bone-in chicken drumsticks from the leg, great for frying, baking, or grilling.' },
  { id: '13', name: 'Chicken Breast Boneless (Large Pack)', category: 'Chicken', weight: '', weightInKg: 0.9, price: 545.0, pricePerKg: 605.56, description: 'Skinless, boneless chicken breast pieces perfect for meal prep and family feasts.' },
  { id: '14', name: 'Chicken Boneless Cubes', category: 'Chicken', weight: '', weightInKg: 0.45, price: 260.0, pricePerKg: 577.78, description: 'Boneless chicken cubes made from leg and breast portions for versatile cooking.' },
  { id: '15', name: 'Chicken Drumsticks - Pack of 2 (Mini Pack)', category: 'Chicken', weight: '', weightInKg: 0.2, price: 129.0, pricePerKg: 645.0, description: 'Convenient mini pack of drumsticks, ideal for single servings and quick meals.' },
  { id: '16', name: 'Chicken Mince (Keema)', category: 'Chicken', weight: '', weightInKg: 0.45, price: 279.0, pricePerKg: 620.0, description: 'Moist and tender chicken mince for kebabs, keema, momos, and flavorful curries.' },
  { id: '17', name: 'Premium Chicken Leg Curry Cut', category: 'Chicken', weight: '', weightInKg: 0.3, price: 206.0, pricePerKg: 686.67, description: 'Juicy bone-in leg pieces trimmed for aromatic curries or biryanis.' },
  { id: '18', name: 'Classic Chicken Soup Bones', category: 'Chicken', weight: '', weightInKg: 0.25, price: 99.0, pricePerKg: 396.0, description: 'Cleaned chicken bones specially cut for rich stocks, soups, and broths.' },
  { id: '19', name: 'Premium Chicken Tangdi Biryani Cut', category: 'Chicken', weight: '', weightInKg: 0.55, price: 313.0, pricePerKg: 569.09, description: 'Juicy tangdi drumsticks and whole thigh pieces designed especially for biryanis.' },
  { id: '20', name: 'Chicken Curry Cut with Skin - Small Pieces', category: 'Chicken', weight: '', weightInKg: 0.5, price: 176.0, pricePerKg: 352.0, description: 'Flavor-packed skin-on chicken curry cut offering crispy bites and juicy meat.' },
  { id: '21', name: 'Chicken Leg With Thigh - Pack of 3', category: 'Chicken', weight: '', weightInKg: 0.45, price: 266.0, pricePerKg: 591.11, description: 'Large bone-in chicken legs with thigh portions ideal for biryanis and grills.' },
  { id: '22', name: 'Chicken Mince/Keema - 250g (Mini Pack)', category: 'Chicken', weight: '', weightInKg: 0.25, price: 180.0, pricePerKg: 720.0, description: 'Mini pack of finely ground chicken mince perfect for quick snacks and fillings.' },
  { id: '23', name: 'Classic Chicken Biryani Cut', category: 'Chicken', weight: '', weightInKg: 0.5, price: 215.0, pricePerKg: 430.0, description: 'Five juicy biryani-ready chicken pieces that cook evenly for fluffy rice dishes.' },
  { id: '24', name: 'Chicken Lollipop - Pack of 10', category: 'Chicken', weight: '', weightInKg: 0.4, price: 189.0, pricePerKg: 472.5, description: 'Meaty chicken lollipops trimmed and frenched for crispy party starters.' },
  { id: '26', name: 'Chicken Wings with Skin', category: 'Chicken', weight: '', weightInKg: 0.43, price: 169.0, pricePerKg: 393.02, description: 'Cut and cleaned chicken wings with skin for crispy frying or saucy tossing.' },
  { id: '28', name: 'Chicken Curry Cut - Large Pieces (Large Pack)', category: 'Chicken', weight: '', weightInKg: 1.0, price: 322.0, pricePerKg: 322.0, description: 'Bulk pack of large curry cut pieces for family feasts and gatherings.' },
  // Mutton Products
  { id: '39', name: 'Goat Curry Cut', category: 'Mutton', weight: '', weightInKg: 0.5, price: 579.0, pricePerKg: 1158.0, description: 'Balanced bone-in and boneless goat cuts that deliver rich gravies every time.' },
  { id: '40', name: 'Pure Goat Mince', category: 'Mutton', weight: '', weightInKg: 0.45, price: 494.0, pricePerKg: 1097.78, description: 'Finely ground goat mince that is ideal for curries, kebabs, samosas, and more.' },
  { id: '41', name: 'Mutton Liver (Small Pack)', category: 'Mutton', weight: '', weightInKg: 0.1, price: 159.0, pricePerKg: 1590.0, description: 'Cut and cleaned mutton liver pieces that cook quickly for pan-fried delicacies.' },
  { id: '42', name: 'Mutton Liver - Chunks', category: 'Mutton', weight: '', weightInKg: 0.25, price: 322.0, pricePerKg: 1288.0, description: 'Generous liver chunks, trimmed and cleaned for slow roasting or pan-frying.' },
  { id: '43', name: 'Premium Lamb (Mutton) - Curry Cut', category: 'Mutton', weight: '', weightInKg: 0.5, price: 574.0, pricePerKg: 1148.0, description: 'Balanced lamb curry cut with the right mix of fat and meat for luxurious gravies.' },
  { id: '44', name: 'Pure Goat Mince (Mini Pack)', category: 'Mutton', weight: '', weightInKg: 0.225, price: 260.0, pricePerKg: 1155.56, description: 'Convenient mini pack of goat mince, perfect for quick weeknight recipes.' },
  { id: '45', name: 'Mutton Paya', category: 'Mutton', weight: '', weightInKg: 0.6, price: 275.0, pricePerKg: 458.33, description: 'Fresh and flavourful lamb trotters that add depth to soups, stews, and curries.' },
  { id: '46', name: 'Mutton Kidney (Small Pack)', category: 'Mutton', weight: '', weightInKg: 0.1, price: 151.0, pricePerKg: 1510.0, description: 'Neatly halved mutton kidneys ready for pan-fried or grilled delicacies.' },
  { id: '47', name: 'Mutton Soup Bones', category: 'Mutton', weight: '', weightInKg: 0.35, price: 359.0, pricePerKg: 1025.71, description: 'Cleaned mutton bones that simmer into deeply flavourful stocks and soups.' },
  { id: '49', name: 'Goat Boneless (Mini Pack)', category: 'Mutton', weight: '', weightInKg: 0.25, price: 412.0, pricePerKg: 1648.0, description: 'Bite-sized goat boneless cuts, trimmed for pan-frying and quick sautés.' },
  { id: '50', name: 'Goat Chops', category: 'Mutton', weight: '', weightInKg: 0.2, price: 285.0, pricePerKg: 1425.0, description: 'Rich goat rib and T-bone steaks that grill beautifully every single time.' },
  { id: '51', name: 'Mutton Paya/Trotters (Whole)', category: 'Mutton', weight: '', weightInKg: 1.0, price: 505.0, pricePerKg: 505.0, description: 'Cleaned front and hind trotters, perfect for collagen-rich soups and gravies.' },
  { id: '52', name: 'Mutton Brain (Bheja)', category: 'Mutton', weight: '', weightInKg: 0.2, price: 268.0, pricePerKg: 1340.0, description: 'Premium mutton brain cleaned for rich, creamy bheja fry and specialty dishes.' },
  { id: '53', name: 'Goat Biryani Cut', category: 'Mutton', weight: '', weightInKg: 0.5, price: 642.0, pricePerKg: 1284.0, description: 'Fat-rich goat cuts chosen exclusively for flavour-packed biryanis.' },
  { id: '54', name: 'Lamb (Mutton) - Mince', category: 'Mutton', weight: '', weightInKg: 0.45, price: 665.0, pricePerKg: 1477.78, description: 'Finely ground lamb mince that keeps kebabs, curries, and pies moist.' },
  { id: '56', name: 'Mutton Spleen (Thilli/Manneral/Suvarotti)', category: 'Mutton', weight: '', weightInKg: 0.15, price: 249.0, pricePerKg: 1660.0, description: 'Cleaned whole mutton spleen, ready for traditional pan-fried or grilled recipes.' },
  { id: '57', name: 'Mutton Kapura - Medium', category: 'Mutton', weight: '', weightInKg: 0.25, price: 239.0, pricePerKg: 956.0, description: 'Cleaned kapura portions, perfect for pan-fried delicacies and grills.' },
  { id: '58', name: 'Mutton Heart', category: 'Mutton', weight: '', weightInKg: 0.2, price: 207.0, pricePerKg: 1035.0, description: 'Cleaned, rich-flavoured mutton heart pieces ideal for slow cooking or grilling.' },
  { id: '59', name: 'Mutton Kapura - Large', category: 'Mutton', weight: '', weightInKg: 0.25, price: 299.0, pricePerKg: 1196.0, description: 'Large tender kapura portions that stay juicy in pan-fried delicacies.' },
  { id: '60', name: 'Mutton Lungs', category: 'Mutton', weight: '', weightInKg: 0.25, price: 98.0, pricePerKg: 392.0, description: 'Light and airy mutton lungs ideal for sautéing, stewing, or spicy fries.' },
  { id: '61', name: 'Mutton Head Meat Medium (Thale Mamsa)', category: 'Mutton', weight: '', weightInKg: 1.0, price: 275.0, pricePerKg: 275.0, description: 'Head meat pieces perfect for broths, soups, and traditional slow-cooked meals.' },
  { id: '62', name: 'Goat Shoulder Curry & Liver Combo', category: 'Mutton', weight: '', weightInKg: 0.75, price: 1099.0, pricePerKg: 1465.33, description: 'Combo saver with 500g goat shoulder curry cut and 250g mutton liver chunks.' },
  { id: '63', name: 'Mutton Boti & Intestine (1 Set)', category: 'Mutton', weight: '', weightInKg: 1.0, price: 350.0, pricePerKg: 350.0, description: 'Cleaned mutton boti and intestines, great for slow-cooked traditional recipes.' },
];

const DATA_DIR = path.join(__dirname, '../../data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getImageUrl(productName, category) {
  const imageFile = IMAGE_MAP[productName];
  if (!imageFile) {
    console.warn(`⚠️  No image found for: ${productName}`);
    return 'https://images.pexels.com/photos/3659865/pexels-photo-3659865.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  
  // Return full URL path that will be served by Express static middleware
  // For mobile, use IP address; for web, localhost works
  // The frontend will construct the full URL using the API base URL
  // Format: /images/Chicken/filename or /images/Mutton/filename
  // Frontend will prepend: http://192.168.0.5:3000
  return `/images/${category}/${encodeURIComponent(imageFile)}`;
}

function convertProduct(product) {
  return {
    id: product.id || generateId(),
    name: product.name,
    category: product.category,
    weight: product.weight || '',
    weight_in_kg: product.weightInKg,
    price: product.price,
    price_per_kg: product.pricePerKg,
    image_url: getImageUrl(product.name, product.category),
    description: product.description || '',
    original_price: null,
    discount_percentage: null,
    rating: 0.0,
    is_available: true,
    shop_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function seedProducts() {
  try {
    console.log('🌱 Seeding products to backend with local images...');
    
    const products = DUMMY_PRODUCTS.map(convertProduct);
    
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    
    console.log(`✅ Successfully seeded ${products.length} products to ${PRODUCTS_FILE}`);
    console.log(`   - Chicken products: ${products.filter(p => p.category === 'Chicken').length}`);
    console.log(`   - Mutton products: ${products.filter(p => p.category === 'Mutton').length}`);
    console.log(`   - Images will be served from: http://localhost:3000/images/`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
