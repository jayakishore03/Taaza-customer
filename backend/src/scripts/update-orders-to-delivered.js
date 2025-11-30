/**
 * Update Orders to Delivered Status
 * Updates some orders to "Delivered" status with complete timeline
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

  console.log('📦 Updating orders to Delivered status...\n');
  console.log('='.repeat(50));

  // Get all orders
  const orders = db.prepare('SELECT id, order_number, status, total, created_at FROM orders ORDER BY created_at DESC').all();
  
  console.log(`\nFound ${orders.length} orders:\n`);
  orders.forEach(o => {
    console.log(`  ${o.order_number}: ${o.status} - ₹${o.total}`);
  });

  // Update first order to Delivered (oldest one)
  if (orders.length > 0) {
    const order1 = orders[orders.length - 1]; // Oldest order
    const now = new Date().toISOString();
    const deliveredTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago

    console.log(`\n✅ Updating ${order1.order_number} to Delivered...`);
    
    // Update order status
    db.prepare(`
      UPDATE orders 
      SET status = ?, 
          status_note = ?,
          delivered_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      'Delivered',
      'Delivered on ' + new Date(deliveredTime).toLocaleDateString('en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      }),
      deliveredTime,
      now,
      order1.id
    );

    // Add timeline events for delivered order
    const timelineEvents = [
      {
        stage: 'Order Placed',
        description: 'We have received your order request.',
        timestamp: new Date(new Date(order1.created_at).getTime() - 30 * 60 * 1000).toISOString(), // 30 min before order
        is_completed: true
      },
      {
        stage: 'Order Ready',
        description: 'Fresh cuts are packed and ready for pickup.',
        timestamp: new Date(new Date(order1.created_at).getTime() - 20 * 60 * 1000).toISOString(), // 20 min before
        is_completed: true
      },
      {
        stage: 'Picked Up',
        description: 'Delivery partner has picked up your order.',
        timestamp: new Date(new Date(order1.created_at).getTime() - 15 * 60 * 1000).toISOString(), // 15 min before
        is_completed: true
      },
      {
        stage: 'Out for Delivery',
        description: 'Order is on the way to your doorstep.',
        timestamp: new Date(new Date(order1.created_at).getTime() - 10 * 60 * 1000).toISOString(), // 10 min before
        is_completed: true
      },
      {
        stage: 'Delivered',
        description: 'Enjoy your fresh order!',
        timestamp: deliveredTime,
        is_completed: true
      }
    ];

    // Insert timeline events
    const insertTimeline = db.prepare(`
      INSERT INTO order_timeline (id, order_id, stage, description, timestamp, is_completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    timelineEvents.forEach((event, index) => {
      const timelineId = `${order1.id}-timeline-${index}`;
      insertTimeline.run(
        timelineId,
        order1.id,
        event.stage,
        event.description,
        event.timestamp,
        event.is_completed ? 1 : 0
      );
    });

    console.log(`  ✓ Updated ${order1.order_number} to Delivered`);
    console.log(`  ✓ Added ${timelineEvents.length} timeline events`);
  }

  // Update second order to Delivered (if exists)
  if (orders.length > 1) {
    const order2 = orders[orders.length - 2]; // Second oldest
    const now = new Date().toISOString();
    const deliveredTime = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago

    console.log(`\n✅ Updating ${order2.order_number} to Delivered...`);
    
    // Update order status
    db.prepare(`
      UPDATE orders 
      SET status = ?, 
          status_note = ?,
          delivered_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      'Delivered',
      'Delivered on ' + new Date(deliveredTime).toLocaleDateString('en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      }),
      deliveredTime,
      now,
      order2.id
    );

    // Add timeline events
    const timelineEvents = [
      {
        stage: 'Order Placed',
        description: 'We have received your order request.',
        timestamp: new Date(new Date(order2.created_at).getTime() - 25 * 60 * 1000).toISOString(),
        is_completed: true
      },
      {
        stage: 'Order Ready',
        description: 'Fresh cuts are packed and ready for pickup.',
        timestamp: new Date(new Date(order2.created_at).getTime() - 18 * 60 * 1000).toISOString(),
        is_completed: true
      },
      {
        stage: 'Picked Up',
        description: 'Delivery partner has picked up your order.',
        timestamp: new Date(new Date(order2.created_at).getTime() - 12 * 60 * 1000).toISOString(),
        is_completed: true
      },
      {
        stage: 'Out for Delivery',
        description: 'Order is on the way to your doorstep.',
        timestamp: new Date(new Date(order2.created_at).getTime() - 8 * 60 * 1000).toISOString(),
        is_completed: true
      },
      {
        stage: 'Delivered',
        description: 'Enjoy your fresh order!',
        timestamp: deliveredTime,
        is_completed: true
      }
    ];

    const insertTimeline = db.prepare(`
      INSERT INTO order_timeline (id, order_id, stage, description, timestamp, is_completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    timelineEvents.forEach((event, index) => {
      const timelineId = `${order2.id}-timeline-${index}`;
      insertTimeline.run(
        timelineId,
        order2.id,
        event.stage,
        event.description,
        event.timestamp,
        event.is_completed ? 1 : 0
      );
    });

    console.log(`  ✓ Updated ${order2.order_number} to Delivered`);
    console.log(`  ✓ Added ${timelineEvents.length} timeline events`);
  }

  // Show updated orders
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Updated Orders Status:\n');
  const updatedOrders = db.prepare('SELECT id, order_number, status, delivered_at, total FROM orders ORDER BY created_at DESC').all();
  updatedOrders.forEach(o => {
    const status = o.status === 'Delivered' ? '✅ Delivered' : o.status;
    const deliveredInfo = o.delivered_at ? ` (Delivered: ${new Date(o.delivered_at).toLocaleDateString()})` : '';
    console.log(`  ${o.order_number}: ${status} - ₹${o.total}${deliveredInfo}`);
  });

  console.log('\n✅ Orders updated successfully!');
  console.log('📝 Delivered orders will now show in the orders list\n');

  db.close();
} catch (error) {
  console.error('❌ Error updating orders:', error);
  process.exit(1);
}

