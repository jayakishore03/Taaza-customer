/**
 * Keep Only Latest 2 Orders
 * Removes all orders except the 2 most recent ones
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '../../database.db');

try {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  console.log('🗑️  Removing orders, keeping only latest 2...\n');
  console.log('='.repeat(60));

  // Get all orders sorted by created_at (newest first)
  const allOrders = db.prepare(`
    SELECT id, order_number, status, total, created_at 
    FROM orders 
    ORDER BY created_at DESC
  `).all();

  console.log(`\n📊 Total orders in database: ${allOrders.length}\n`);

  if (allOrders.length <= 2) {
    console.log('✅ Already have 2 or fewer orders. No deletion needed.\n');
    allOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.order_number}: ${order.status} - ₹${order.total}`);
    });
    db.close();
    process.exit(0);
  }

  // Get the 2 latest orders (keep these)
  const ordersToKeep = allOrders.slice(0, 2);
  const ordersToDelete = allOrders.slice(2);

  console.log('✅ Orders to KEEP (latest 2):\n');
  ordersToKeep.forEach((order, index) => {
    console.log(`  ${index + 1}. ${order.order_number}: ${order.status} - ₹${order.total}`);
  });

  console.log(`\n🗑️  Orders to DELETE (${ordersToDelete.length} orders):\n`);
  ordersToDelete.forEach((order, index) => {
    console.log(`  ${index + 1}. ${order.order_number}: ${order.status} - ₹${order.total}`);
  });

  // Get IDs of orders to delete
  const orderIdsToDelete = ordersToDelete.map(o => o.id);

  console.log(`\n🔄 Deleting ${orderIdsToDelete.length} orders and related data...\n`);

  // Delete order items for orders to be deleted
  const deleteOrderItems = db.prepare(`
    DELETE FROM order_items 
    WHERE order_id IN (${orderIdsToDelete.map(() => '?').join(',')})
  `);
  
  const itemsDeleted = deleteOrderItems.run(...orderIdsToDelete);
  console.log(`  ✓ Deleted ${itemsDeleted.changes} order items`);

  // Delete timeline events for orders to be deleted
  const deleteTimeline = db.prepare(`
    DELETE FROM order_timeline 
    WHERE order_id IN (${orderIdsToDelete.map(() => '?').join(',')})
  `);
  
  const timelineDeleted = deleteTimeline.run(...orderIdsToDelete);
  console.log(`  ✓ Deleted ${timelineDeleted.changes} timeline events`);

  // Delete the orders
  const deleteOrders = db.prepare(`
    DELETE FROM orders 
    WHERE id IN (${orderIdsToDelete.map(() => '?').join(',')})
  `);
  
  const ordersDeleted = deleteOrders.run(...orderIdsToDelete);
  console.log(`  ✓ Deleted ${ordersDeleted.changes} orders`);

  // Verify remaining orders
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Remaining Orders in Database:\n');
  const remainingOrders = db.prepare(`
    SELECT id, order_number, status, total, created_at 
    FROM orders 
    ORDER BY created_at DESC
  `).all();

  remainingOrders.forEach((order, index) => {
    console.log(`  ${index + 1}. ${order.order_number}: ${order.status} - ₹${order.total}`);
    console.log(`     Created: ${new Date(order.created_at).toLocaleString('en-IN')}`);
  });

  console.log(`\n✅ Successfully kept ${remainingOrders.length} latest orders`);
  console.log(`🗑️  Deleted ${ordersToDelete.length} older orders\n`);

  db.close();
} catch (error) {
  console.error('❌ Error cleaning orders:', error);
  process.exit(1);
}

