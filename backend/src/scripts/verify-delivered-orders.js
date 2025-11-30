/**
 * Verify Delivered Orders
 * Shows all delivered orders with their details
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
  
  console.log('📦 Delivered Orders Verification\n');
  console.log('='.repeat(60));
  
  // Get all delivered orders
  const deliveredOrders = db.prepare(`
    SELECT 
      id, 
      order_number, 
      status, 
      status_note,
      total, 
      delivered_at,
      created_at
    FROM orders 
    WHERE status = 'Delivered'
    ORDER BY delivered_at DESC
  `).all();
  
  console.log(`\n✅ Total Delivered Orders: ${deliveredOrders.length}\n`);
  
  deliveredOrders.forEach((order, index) => {
    console.log(`${index + 1}. ${order.order_number}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: ₹${order.total}`);
    console.log(`   Status Note: ${order.status_note || 'N/A'}`);
    console.log(`   Delivered At: ${order.delivered_at ? new Date(order.delivered_at).toLocaleString('en-IN') : 'N/A'}`);
    console.log(`   Created At: ${new Date(order.created_at).toLocaleString('en-IN')}`);
    
    // Get timeline for this order
    const timeline = db.prepare(`
      SELECT stage, description, timestamp, is_completed
      FROM order_timeline
      WHERE order_id = ?
      ORDER BY timestamp ASC
    `).all(order.id);
    
    console.log(`   Timeline Events: ${timeline.length}`);
    timeline.forEach(event => {
      const status = event.is_completed ? '✓' : '○';
      const time = new Date(event.timestamp).toLocaleTimeString('en-IN', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      console.log(`     ${status} ${event.stage} - ${time}`);
    });
    console.log('');
  });
  
  // Summary by status
  console.log('='.repeat(60));
  console.log('\n📊 Orders Summary by Status:\n');
  const statusSummary = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
    ORDER BY count DESC
  `).all();
  
  statusSummary.forEach(stat => {
    console.log(`  ${stat.status.padEnd(20)}: ${stat.count} orders`);
  });
  
  console.log('\n✅ Verification complete!\n');
  
  db.close();
} catch (error) {
  console.error('❌ Error verifying orders:', error);
  process.exit(1);
}

