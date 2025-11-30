/**
 * Delete All Orders
 * Removes all orders and related data from the database
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.db');

try {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  console.log('🗑️  Deleting all orders from database...\n');
  console.log('='.repeat(60));

  // Get count of orders before deletion
  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const orderItemsCount = db.prepare('SELECT COUNT(*) as count FROM order_items').get();
  const timelineCount = db.prepare('SELECT COUNT(*) as count FROM order_timeline').get();

  console.log(`\n📊 Current database state:`);
  console.log(`   Orders: ${ordersCount.count}`);
  console.log(`   Order Items: ${orderItemsCount.count}`);
  console.log(`   Timeline Events: ${timelineCount.count}\n`);

  if (ordersCount.count === 0) {
    console.log('✅ No orders found in database. Nothing to delete.\n');
    db.close();
    process.exit(0);
  }

  // Delete order timeline events first (child table)
  console.log('🔄 Deleting order timeline events...');
  const deleteTimeline = db.prepare('DELETE FROM order_timeline');
  const timelineResult = deleteTimeline.run();
  console.log(`   ✓ Deleted ${timelineResult.changes} timeline events`);

  // Delete order items second (child table)
  console.log('🔄 Deleting order items...');
  const deleteOrderItems = db.prepare('DELETE FROM order_items');
  const itemsResult = deleteOrderItems.run();
  console.log(`   ✓ Deleted ${itemsResult.changes} order items`);

  // Delete orders last (parent table)
  console.log('🔄 Deleting orders...');
  const deleteOrders = db.prepare('DELETE FROM orders');
  const ordersResult = deleteOrders.run();
  console.log(`   ✓ Deleted ${ordersResult.changes} orders`);

  // Verify deletion
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Database state after deletion:');
  const remainingOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const remainingItems = db.prepare('SELECT COUNT(*) as count FROM order_items').get();
  const remainingTimeline = db.prepare('SELECT COUNT(*) as count FROM order_timeline').get();

  console.log(`   Orders: ${remainingOrders.count}`);
  console.log(`   Order Items: ${remainingItems.count}`);
  console.log(`   Timeline Events: ${remainingTimeline.count}\n`);

  if (remainingOrders.count === 0 && remainingItems.count === 0 && remainingTimeline.count === 0) {
    console.log('✅ Successfully deleted all orders and related data!\n');
  } else {
    console.log('⚠️  Some data may still remain. Please check manually.\n');
  }

  db.close();
} catch (error) {
  console.error('❌ Error deleting orders:', error);
  process.exit(1);
}

