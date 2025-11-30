/**
 * Seed Products Script
 * Populates the products table with data from dummyData.ts
 * 
 * Usage: Run this script to populate your database with products
 * Note: This is a TypeScript file - you'll need to compile and run it,
 * or use it as a reference to create a Node.js script
 */

import { supabase } from '../supabase';
import { dummyProducts } from '../../data/dummyData';

/**
 * Seed products from dummy data
 * Note: This converts local image requires to URLs
 * You'll need to upload images to Supabase Storage or use external URLs
 */
export async function seedProducts() {
  console.log('Starting product seeding...');

  const shopIds = [
    '00000000-0000-0000-0000-000000000001', // Fresh Farm Meats
    '00000000-0000-0000-0000-000000000002', // City Chicken Center
    '00000000-0000-0000-0000-000000000003', // Mutton & More
  ];

  let shopIndex = 0;
  const errors: any[] = [];

  for (const product of dummyProducts) {
    try {
      // Convert local image require to URL
      // In production, you should upload images to Supabase Storage
      const imageUrl = typeof product.image === 'string' 
        ? product.image 
        : 'https://via.placeholder.com/400'; // Placeholder for local images

      // Assign products to shops (round-robin)
      const shopId = shopIds[shopIndex % shopIds.length];
      shopIndex++;

      const { error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          category: product.category,
          weight: product.weight || null,
          weight_in_kg: product.weightInKg,
          price: product.price,
          price_per_kg: product.pricePerKg,
          original_price: product.originalPrice || null,
          discount_percentage: product.discountPercentage || 0,
          image_url: imageUrl,
          description: product.description,
          shop_id: shopId,
          is_available: true,
        });

      if (error) {
        console.error(`Error inserting ${product.name}:`, error);
        errors.push({ product: product.name, error });
      } else {
        console.log(`✓ Inserted: ${product.name}`);
      }
    } catch (error) {
      console.error(`Error processing ${product.name}:`, error);
      errors.push({ product: product.name, error });
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`Total products: ${dummyProducts.length}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(({ product, error }) => {
      console.log(`- ${product}: ${error.message}`);
    });
  }

  return { success: errors.length === 0, errors };
}

/**
 * Helper function to upload product images to Supabase Storage
 * You'll need to configure a 'product-images' bucket in Supabase Storage
 */
export async function uploadProductImage(
  productId: string,
  imagePath: string,
  imageData: Blob | ArrayBuffer
): Promise<string | null> {
  try {
    const fileName = `${productId}-${Date.now()}.webp`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageData, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    return null;
  }
}

// If running directly (not imported)
if (require.main === module) {
  seedProducts()
    .then((result) => {
      if (result.success) {
        console.log('✅ All products seeded successfully!');
        process.exit(0);
      } else {
        console.log('⚠️  Seeding completed with errors');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

