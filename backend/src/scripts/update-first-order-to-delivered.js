/**
 * Update First Order to Delivered Status
 * Updates the latest order to "Delivered" status with complete timeline
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

  console.log('📦 Updating first order to Delivered status...\n');
  console.log('='.repeat(60));

  // Get the latest order (first order)
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

  console.log(`\n✅ Updating ${latestOrder.order_number} to Delivered...`);
  console.log(`   Current Status: ${latestOrder.status}`);
  console.log(`   Total: ₹${latestOrder.total}\n`);

  const now = new Date().toISOString();
  const deliveredTime = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago

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
    latestOrder.id
  );

  console.log('  ✓ Updated order status to Delivered');

  // Check if timeline events already exist
  const existingTimeline = db.prepare(`
    SELECT COUNT(*) as count 
    FROM order_timeline 
    WHERE order_id = ?
  `).get(latestOrder.id);

  // Only add timeline events if they don't exist
  if (existingTimeline.count === 0) {
    // Add timeline events for delivered order
    const timelineEvents = [
      {
        stage: 'Order Placed',
        description: 'We have received your order request.',
        timestamp: new Date(new Date(latestOrder.created_at).getTime() - 5 * 60 * 1000).toISOString(), // 5 min before order
        is_completed: true
      },
      {
        stage: 'Preparing',
        description: 'Butcher is hand-cutting your order.',
        timestamp: new Date(new Date(latestOrder.created_at).getTime() - 3 * 60 * 1000).toISOString(), // 3 min before
        is_completed: true
      },
      {
        stage: 'Order Ready',
        description: 'Fresh cuts are packed and ready for pickup.',
        timestamp: new Date(new Date(latestOrder.created_at).getTime() - 2 * 60 * 1000).toISOString(), // 2 min before
        is_completed: true
      },
      {
        stage: 'Picked Up',
        description: 'Delivery partner has picked up your order.',
        timestamp: new Date(new Date(latestOrder.created_at).getTime() - 1 * 60 * 1000).toISOString(), // 1 min before
        is_completed: true
      },
      {
        stage: 'Out for Delivery',
        description: 'Order is on the way to your doorstep.',
        timestamp: new Date(new Date(latestOrder.created_at).getTime() - 30 * 1000).toISOString(), // 30 sec before
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
      const timelineId = `${latestOrder.id}-timeline-${index}`;
      insertTimeline.run(
        timelineId,
        latestOrder.id,
        event.stage,
        event.description,
        event.timestamp,
        event.is_completed ? 1 : 0
      );
    });

    console.log(`  ✓ Added ${timelineEvents.length} timeline events`);
  } else {
    // Update existing timeline to mark all as completed
    db.prepare(`
      UPDATE order_timeline 
      SET is_completed = 1 
      WHERE order_id = ?
    `).run(latestOrder.id);
    
    // Add Delivered event if it doesn't exist
    const hasDelivered = db.prepare(`
      SELECT COUNT(*) as count 
      FROM order_timeline 
      WHERE order_id = ? AND stage = 'Delivered'
    `).get(latestOrder.id);

    if (hasDelivered.count === 0) {
      const timelineId = `${latestOrder.id}-timeline-delivered`;
      db.prepare(`
        INSERT INTO order_timeline (id, order_id, stage, description, timestamp, is_completed)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        timelineId,
        latestOrder.id,
        'Delivered',
        'Enjoy your fresh order!',
        deliveredTime,
        1
      );
      console.log('  ✓ Added Delivered timeline event');
    }
  }

  // Show updated order
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Updated Order:\n');
  const updatedOrder = db.prepare(`
    SELECT id, order_number, status, delivered_at, total, created_at 
    FROM orders 
    WHERE id = ?
  `).get(latestOrder.id);

  console.log(`  Order: ${updatedOrder.order_number}`);
  console.log(`  Status: ${updatedOrder.status}`);
  console.log(`  Total: ₹${updatedOrder.total}`);
  console.log(`  Delivered At: ${updatedOrder.delivered_at ? new Date(updatedOrder.delivered_at).toLocaleString('en-IN') : 'N/A'}`);

  // Show timeline
  const timeline = db.prepare(`
    SELECT stage, description, timestamp, is_completed
    FROM order_timeline
    WHERE order_id = ?
    ORDER BY timestamp ASC
  `).all(latestOrder.id);

  console.log(`\n  Timeline Events: ${timeline.length}`);
  timeline.forEach(event => {
    const status = event.is_completed ? '✓' : '○';
    const time = new Date(event.timestamp).toLocaleTimeString('en-IN', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    console.log(`    ${status} ${event.stage} - ${time}`);
  });

  console.log('\n✅ Order updated successfully!\n');

  db.close();
} catch (error) {
  console.error('❌ Error updating order:', error);
  process.exit(1);
}

