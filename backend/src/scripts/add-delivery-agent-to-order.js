/**
 * Add Delivery Agent to First Order
 * Adds delivery agent name and mobile to the latest order
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

  console.log('👤 Adding delivery agent to first order...\n');
  console.log('='.repeat(60));

  // Get the latest order
  const latestOrder = db.prepare(`
    SELECT id, order_number, status, total, created_at 
    FROM orders 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get();

  if (!latestOrder) {
    console.log('❌ No orders found in database.\n');
    db.close();
    process.exit(0);
  }

  console.log(`\n✅ Updating ${latestOrder.order_number}...`);
  console.log(`   Current Status: ${latestOrder.status}\n`);

  // Sample delivery agent details
  const deliveryAgentName = 'Rajesh Kumar';
  const deliveryAgentMobile = '+91 98765 12345';

  const now = new Date().toISOString();

  // Update order with delivery agent details
  db.prepare(`
    UPDATE orders 
    SET delivery_agent_name = ?,
        delivery_agent_mobile = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    deliveryAgentName,
    deliveryAgentMobile,
    now,
    latestOrder.id
  );

  console.log(`  ✓ Added delivery agent: ${deliveryAgentName}`);
  console.log(`  ✓ Mobile: ${deliveryAgentMobile}`);

  // Show updated order
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Updated Order:\n');
  const updatedOrder = db.prepare(`
    SELECT id, order_number, status, delivery_agent_name, delivery_agent_mobile, total 
    FROM orders 
    WHERE id = ?
  `).get(latestOrder.id);

  console.log(`  Order: ${updatedOrder.order_number}`);
  console.log(`  Status: ${updatedOrder.status}`);
  console.log(`  Total: ₹${updatedOrder.total}`);
  console.log(`  Delivery Agent: ${updatedOrder.delivery_agent_name || 'Not assigned'}`);
  console.log(`  Mobile: ${updatedOrder.delivery_agent_mobile || 'Not assigned'}`);

  console.log('\n✅ Delivery agent added successfully!');
  console.log('📱 Delivery agent details will now display in the tracking page\n');

  db.close();
} catch (error) {
  console.error('❌ Error adding delivery agent:', error);
  process.exit(1);
}

