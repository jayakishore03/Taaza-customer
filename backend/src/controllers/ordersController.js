/**
 * Orders Controller
 */

import { supabase, supabaseAdmin } from '../config/database.js';
import { logActivity } from '../utils/activityLogger.js';

// Generate UUID function (same as in database.js)
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format order for response
 */
function formatOrder(order, items = [], timeline = [], shop = null, address = null, req = null) {
  // Get base URL for images
  let baseUrl = 'http://192.168.0.5:3000';
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || '192.168.0.5:3000';
    baseUrl = `${protocol}://${host}`;
  }

  // Format shop image URL
  let shopImage = shop?.image_url || '';
  if (shopImage && !shopImage.startsWith('http')) {
    if (shopImage.startsWith('/images/')) {
      shopImage = `${baseUrl}${shopImage}`;
    } else {
      shopImage = `${baseUrl}/images/${shopImage}`;
    }
  }

  // Format product images and include all product details
  const formattedItems = (items || []).map(item => {
    let imageUrl = item.image_url || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('/images/')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      } else if (imageUrl) {
        imageUrl = `${baseUrl}/images/${imageUrl}`;
      }
    }
    
    // Ensure price is a number
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    const pricePerKg = item.price_per_kg ? (typeof item.price_per_kg === 'number' ? item.price_per_kg : parseFloat(item.price_per_kg)) : null;
    
    return {
      name: item.name || 'Unknown Product',
      quantity: item.quantity || 1,
      weight: item.weight || '',
      weightInKg: item.weight_in_kg || null,
      price: `₹${price.toFixed(2)}`,
      pricePerKg: pricePerKg ? `₹${pricePerKg.toFixed(2)}/kg` : null,
      image: imageUrl,
      productId: item.product_id || null,
      addonId: item.addon_id || null,
    };
  });

  return {
    id: order.id,
    orderNumber: order.order_number,
    parentOrder: order.parent_order || '',
    placedOn: formatDate(order.created_at),
    total: `₹${order.total.toFixed(2)}`,
    status: order.status,
    statusNote: order.status_note || '',
    shopName: shop?.name || '',
    shopAddress: shop?.address || '',
    shopContact: shop?.contact_phone || '',
    shopImage: shopImage,
    paymentMethod: order.payment_method_text || '',
    specialInstructions: order.special_instructions || '',
    deliveryEta: order.delivery_eta ? formatDate(order.delivery_eta) : undefined,
    otp: order.otp || '',
    deliveredAt: order.delivered_at || undefined,
    deliveryAgent: order.delivery_agent_name ? {
      name: order.delivery_agent_name,
      mobile: order.delivery_agent_mobile || '',
    } : undefined,
    items: formattedItems,
    timeline: timeline.map(event => ({
      stage: event.stage,
      description: event.description,
      timestamp: formatTime(event.timestamp),
      isCompleted: event.is_completed,
    })),
  };
}

/**
 * Get all orders for authenticated user
 * GET /api/orders
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get all orders for user
    const ordersResult = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const orders = ordersResult.data || [];

    // Fetch related data for each order
    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const [itemsResult, timelineResult, shopResult, addressResult] = await Promise.all([
          supabase.from('order_items').select('*').eq('order_id', order.id),
          supabase.from('order_timeline').select('*').eq('order_id', order.id).order('timestamp', { ascending: true }),
          order.shop_id ? supabase.from('shops').select('*').eq('id', order.shop_id).single() : Promise.resolve({ data: null }),
          order.address_id ? supabase.from('addresses').select('*').eq('id', order.address_id).single() : Promise.resolve({ data: null }),
        ]);

        // Enrich order items with product details if image_url is missing
        const itemsData = itemsResult.data || [];
        console.log(`Order ${order.id} has ${itemsData.length} items`);
        
        const enrichedItems = await Promise.all(
          itemsData.map(async (item) => {
            // If image_url is missing and product_id exists, fetch from products table
            if ((!item.image_url || item.image_url === '') && item.product_id) {
              const productResult = await supabase
                .from('products')
                .select('image_url, name, weight, weight_in_kg, price_per_kg')
                .eq('id', item.product_id)
                .single();
              
              if (productResult.data) {
                // Use product image if order item doesn't have one
                if (!item.image_url && productResult.data.image_url) {
                  item.image_url = productResult.data.image_url;
                }
                // Ensure name, weight, and price_per_kg are set if missing
                if (!item.name && productResult.data.name) {
                  item.name = productResult.data.name;
                }
                if (!item.weight && productResult.data.weight) {
                  item.weight = productResult.data.weight;
                }
                if (!item.weight_in_kg && productResult.data.weight_in_kg) {
                  item.weight_in_kg = productResult.data.weight_in_kg;
                }
                if (!item.price_per_kg && productResult.data.price_per_kg) {
                  item.price_per_kg = productResult.data.price_per_kg;
                }
              }
            }
            return item;
          })
        );

        const formattedOrder = formatOrder(
          order,
          enrichedItems,
          timelineResult.data || [],
          shopResult.data,
          addressResult.data,
          req
        );
        
        console.log(`Formatted order ${order.id} has ${formattedOrder.items?.length || 0} items`);
        return formattedOrder;
      })
    );

    res.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const orderResult = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!orderResult.data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const order = orderResult.data;

    // Fetch related data
    const [itemsResult, timelineResult, shopResult, addressResult] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', order.id),
      supabase.from('order_timeline').select('*').eq('order_id', order.id).order('timestamp', { ascending: true }),
      order.shop_id ? supabase.from('shops').select('*').eq('id', order.shop_id).single() : Promise.resolve({ data: null }),
      order.address_id ? supabase.from('addresses').select('*').eq('id', order.address_id).single() : Promise.resolve({ data: null }),
    ]);

    // Enrich order items with product details if image_url is missing
    const enrichedItems = await Promise.all(
      (itemsResult.data || []).map(async (item) => {
        // If image_url is missing and product_id exists, fetch from products table
        if ((!item.image_url || item.image_url === '') && item.product_id) {
          const productResult = await supabase
            .from('products')
            .select('image_url, name, weight, weight_in_kg, price_per_kg')
            .eq('id', item.product_id)
            .single();
          
          if (productResult.data) {
            // Use product image if order item doesn't have one
            if (!item.image_url && productResult.data.image_url) {
              item.image_url = productResult.data.image_url;
            }
            // Ensure name, weight, and price_per_kg are set if missing
            if (!item.name && productResult.data.name) {
              item.name = productResult.data.name;
            }
            if (!item.weight && productResult.data.weight) {
              item.weight = productResult.data.weight;
            }
            if (!item.weight_in_kg && productResult.data.weight_in_kg) {
              item.weight_in_kg = productResult.data.weight_in_kg;
            }
            if (!item.price_per_kg && productResult.data.price_per_kg) {
              item.price_per_kg = productResult.data.price_per_kg;
            }
          }
        }
        return item;
      })
    );

    res.json({
      success: true,
      data: formatOrder(
        order,
        enrichedItems,
        timelineResult.data || [],
        shopResult.data,
        addressResult.data,
        req
      ),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new order
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const {
      shopId,
      addressId,
      items,
      subtotal,
      deliveryCharge = 40,
      discount = 0,
      couponId,
      paymentMethodId,
      paymentMethodText,
      specialInstructions,
    } = req.body;

    console.log('========================================');
    console.log('🛒 CREATE ORDER REQUEST RECEIVED');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Shop ID:', shopId);
    console.log('Address ID from request:', addressId);
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Subtotal:', subtotal);
    console.log('Delivery Charge:', deliveryCharge);
    console.log('Discount:', discount);
    console.log('Payment Method:', paymentMethodText);
    console.log('Special Instructions:', specialInstructions || 'None');
    console.log('========================================');

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ No items provided in request');
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required field: items' },
      });
    }

    // Get user's address if not provided
    let finalAddressId = addressId;
    if (!finalAddressId) {
      console.log('⚠️ No addressId in request, fetching from user profile...');
      const userProfile = await supabaseAdmin
        .from('user_profiles')
        .select('address_id')
        .eq('id', userId)
        .single();
      
      console.log('User profile result:', JSON.stringify(userProfile, null, 2));
      finalAddressId = userProfile.data?.address_id;
      
      if (!finalAddressId) {
        console.error('❌ No address found for user');
        return res.status(400).json({
          success: false,
          error: { message: 'No delivery address found. Please add a delivery address.' },
        });
      }
      console.log('✅ Found address from profile:', finalAddressId);
    }

    // Verify address exists
    console.log('🔍 Verifying address exists:', finalAddressId);
    const addressCheck = await supabaseAdmin
      .from('addresses')
      .select('id, street, city, state')
      .eq('id', finalAddressId)
      .single();
    
    if (addressCheck.error || !addressCheck.data) {
      console.error('❌ Address not found in database:', addressCheck.error);
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid address. Please update your delivery address.' },
      });
    }
    console.log('✅ Address verified:', JSON.stringify(addressCheck.data, null, 2));

    // Check user's order count - free delivery for first 3 orders
    const userOrdersResult = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const userOrderCount = userOrdersResult.count || 0;
    const finalDeliveryCharge = userOrderCount < 3 ? 0 : deliveryCharge;

    // Generate order number using RPC
    const orderNumberResult = await supabaseAdmin.rpc('generate_order_number');
    const orderNumber = orderNumberResult.data || `#TAZ${Date.now()}`;

    // Generate OTP using RPC
    const otpResult = await supabaseAdmin.rpc('generate_otp');
    const otp = otpResult.data || Math.floor(100000 + Math.random() * 900000).toString();

    const now = new Date().toISOString();
    const total = subtotal + finalDeliveryCharge - discount;

    console.log('📝 Creating order with data:');
    console.log('  User ID:', userId);
    console.log('  Shop ID:', shopId || 'None');
    console.log('  Address ID:', finalAddressId);
    console.log('  Order Number:', orderNumber);
    console.log('  Subtotal:', subtotal);
    console.log('  Delivery Charge:', finalDeliveryCharge);
    console.log('  Discount:', discount);
    console.log('  Total:', total);
    console.log('  Payment Method:', paymentMethodText || 'Cash on Delivery');
    console.log('  OTP:', otp);

    // Create order (ID will be auto-generated)
    const orderResult = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        shop_id: shopId || null,
        address_id: finalAddressId,
        order_number: orderNumber,
        subtotal,
        delivery_charge: finalDeliveryCharge,
        discount,
        coupon_id: couponId || null,
        total: total,
        status: 'Preparing',
        status_note: 'Butcher is hand-cutting your order.',
        payment_method_id: paymentMethodId || null,
        payment_method_text: paymentMethodText || 'Cash on Delivery',
        special_instructions: specialInstructions || null,
        otp,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (orderResult.error || !orderResult.data) {
      console.error('========================================');
      console.error('❌ ERROR CREATING ORDER IN DATABASE');
      console.error('========================================');
      console.error('Error Object:', JSON.stringify(orderResult.error, null, 2));
      console.error('Error Code:', orderResult.error?.code);
      console.error('Error Message:', orderResult.error?.message);
      console.error('Error Details:', orderResult.error?.details);
      console.error('Error Hint:', orderResult.error?.hint);
      console.error('========================================');
      
      // Provide more specific error message
      let errorMessage = 'Failed to create order';
      if (orderResult.error?.message) {
        errorMessage += ': ' + orderResult.error.message;
      }
      
      return res.status(500).json({
        success: false,
        error: { 
          message: errorMessage,
          details: orderResult.error?.details || orderResult.error?.message || 'Unknown error',
          code: orderResult.error?.code || 'UNKNOWN',
          hint: orderResult.error?.hint || ''
        },
      });
    }

    const order = orderResult.data;
    const orderId = order.id;
    
    console.log('========================================');
    console.log('✅ ORDER SAVED TO DATABASE');
    console.log('========================================');
    console.log(`Order ID: ${orderId}`);
    console.log(`Order Number: ${orderNumber}`);
    console.log(`User ID: ${userId}`);
    console.log(`Shop ID: ${shopId || 'None'}`);
    console.log(`Address ID: ${finalAddressId}`);
    console.log(`Total: ₹${order.total}`);
    console.log(`Payment Method: ${paymentMethodText || 'Cash on Delivery'}`);
    console.log(`Items Count: ${items.length}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created At: ${order.created_at}`);
    console.log('========================================');

    // Log order creation activity
    await logActivity(req, 'ORDER_CREATED', `Order ${orderNumber} created`, 'order', orderId, {
      orderNumber,
      shopId: shopId || null,
      itemCount: items.length,
      total: order.total,
      paymentMethod: paymentMethodText || 'Cash on Delivery',
    });

    // Validate and format order items
    console.log('🔍 Validating order items...');
    const orderItems = items.map((item, index) => {
      console.log(`  Item ${index + 1}:`, JSON.stringify(item, null, 2));
      
      // Check required fields
      if (!item.name) {
        console.warn(`  ⚠️ Item ${index + 1} missing name, using default`);
      }
      if (!item.price && item.price !== 0) {
        console.warn(`  ⚠️ Item ${index + 1} missing price, using 0`);
      }
      
      // Ensure all required fields are present and properly formatted
      const orderItem = {
        id: generateId(), // Generate ID explicitly
        order_id: orderId,
        product_id: item.productId || null,
        addon_id: item.addonId || null,
        name: item.name || 'Unknown Product',
        quantity: item.quantity || 1,
        weight: item.weight || null,
        weight_in_kg: item.weightInKg || null,
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        price_per_kg: item.pricePerKg ? (typeof item.pricePerKg === 'number' ? item.pricePerKg : parseFloat(item.pricePerKg)) : null,
        image_url: item.imageUrl || null,
        created_at: now,
      };
      return orderItem;
    });

    console.log(`✅ Validated ${orderItems.length} order items for order ${orderId}`);
    console.log('Order items data:', JSON.stringify(orderItems, null, 2));
    
    try {
      const itemsInsertResult = await supabaseAdmin.from('order_items').insert(orderItems);
      
      if (itemsInsertResult.error) {
        console.error('Error inserting order items:', itemsInsertResult.error);
        console.error('Error details:', JSON.stringify(itemsInsertResult.error, null, 2));
        return res.status(500).json({
          success: false,
          error: { 
            message: 'Failed to create order items', 
            details: itemsInsertResult.error?.message || String(itemsInsertResult.error)
          },
        });
      } else {
        console.log(`✅ Successfully saved ${orderItems.length} order items to database`);
        console.log('Order Items Details:');
        orderItems.forEach((item, index) => {
          console.log(`  Item ${index + 1}: ${item.name} - Qty: ${item.quantity}, Weight: ${item.weight_in_kg}kg, Price: ₹${item.price}`);
        });
      }
    } catch (insertError) {
      console.error('Exception inserting order items:', insertError);
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Failed to create order items', 
          details: insertError?.message || String(insertError)
        },
      });
    }

    // Create initial timeline event
    const timelineInsertResult = await supabaseAdmin.from('order_timeline').insert({
      order_id: orderId,
      stage: 'Order Placed',
      description: 'We have received your order request.',
      is_completed: true,
      timestamp: now,
    });
    
    if (!timelineInsertResult.error) {
      console.log('✅ Order timeline event saved to database');
    }

    // Fetch complete order with all details
    console.log(`\n📦 Fetching complete order ${orderId} from database...`);
    const [itemsResult, timelineResult, shopResult, addressResult] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', orderId),
      supabase.from('order_timeline').select('*').eq('order_id', orderId).order('timestamp', { ascending: true }),
      shopId ? supabase.from('shops').select('*').eq('id', shopId).single() : Promise.resolve({ data: null }),
      supabase.from('addresses').select('*').eq('id', addressId).single(),
    ]);
    
    console.log(`✅ Retrieved ${itemsResult.data?.length || 0} order items from database`);
    console.log(`✅ Retrieved ${timelineResult.data?.length || 0} timeline events from database`);
    console.log(`✅ Shop: ${shopResult.data ? shopResult.data.name : 'None'}`);
    console.log(`✅ Address: ${addressResult.data ? addressResult.data.street + ', ' + addressResult.data.city : 'Not found'}`);

    // Enrich order items with product details if image_url is missing
    const enrichedItems = await Promise.all(
      (itemsResult.data || []).map(async (item) => {
        // If image_url is missing and product_id exists, fetch from products table
        if ((!item.image_url || item.image_url === '') && item.product_id) {
          const productResult = await supabase
            .from('products')
            .select('image_url, name, weight, weight_in_kg, price_per_kg')
            .eq('id', item.product_id)
            .single();
          
          if (productResult.data) {
            // Use product image if order item doesn't have one
            if (!item.image_url && productResult.data.image_url) {
              item.image_url = productResult.data.image_url;
            }
            // Ensure name, weight, and price_per_kg are set if missing
            if (!item.name && productResult.data.name) {
              item.name = productResult.data.name;
            }
            if (!item.weight && productResult.data.weight) {
              item.weight = productResult.data.weight;
            }
            if (!item.weight_in_kg && productResult.data.weight_in_kg) {
              item.weight_in_kg = productResult.data.weight_in_kg;
            }
            if (!item.price_per_kg && productResult.data.price_per_kg) {
              item.price_per_kg = productResult.data.price_per_kg;
            }
          }
        }
        return item;
      })
    );

    const formattedOrder = formatOrder(
      order,
      enrichedItems,
      timelineResult.data || [],
      shopResult.data,
      addressResult.data,
      req
    );
    
    console.log(`Formatted order response - Items count: ${formattedOrder.items?.length || 0}`);
    if (formattedOrder.items && formattedOrder.items.length > 0) {
      console.log(`First item:`, JSON.stringify(formattedOrder.items[0], null, 2));
    } else {
      console.log('WARNING: No items in formatted order!');
      console.log('Enriched items count:', enrichedItems.length);
      console.log('Enriched items:', JSON.stringify(enrichedItems, null, 2));
    }
    
    res.status(201).json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    console.error('========================================');
    console.error('❌ UNEXPECTED ERROR IN CREATE ORDER');
    console.error('========================================');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('========================================');
    
    // Return a more descriptive error
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create order',
        details: error.message || 'An unexpected error occurred',
      },
    });
  }
};

/**
 * Update order status
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { status, statusNote } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status is required' },
      });
    }

    const validStatuses = ['Preparing', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status' },
      });
    }

    // Check if order exists and belongs to user
    const orderResult = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!orderResult.data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const now = new Date().toISOString();

    // Update order
    await supabaseAdmin
      .from('orders')
      .update({
        status,
        status_note: statusNote || null,
        updated_at: now,
        ...(status === 'Delivered' && { delivered_at: now }),
      })
      .eq('id', id)
      .eq('user_id', userId);

    // Add timeline event
    const stageDescriptions = {
      'Preparing': 'Butcher is hand-cutting your order.',
      'Order Ready': 'Fresh cuts are packed and ready for pickup.',
      'Picked Up': 'Delivery partner has picked up your order.',
      'Out for Delivery': 'Order is on the way to your doorstep.',
      'Delivered': 'Enjoy your fresh order!',
      'Cancelled': 'Amount will be refunded within 24 hours.',
    };

    const stage = status === 'Order Ready' ? 'Order Ready' :
                  status === 'Picked Up' ? 'Picked Up' :
                  status === 'Out for Delivery' ? 'Out for Delivery' :
                  status === 'Delivered' ? 'Delivered' :
                  status === 'Cancelled' ? 'Order Cancelled' :
                  'Order Placed';

    await supabaseAdmin.from('order_timeline').insert({
      order_id: id,
      stage,
      description: statusNote || stageDescriptions[status] || '',
      is_completed: status !== 'Cancelled',
      timestamp: now,
    });

    // Log order status update activity
    await logActivity(req, 'ORDER_STATUS_UPDATED', `Order status changed to ${status}`, 'order', id, {
      previousStatus: orderResult.data.status,
      newStatus: status,
      statusNote: statusNote || null,
    });

    res.json({
      success: true,
      data: { message: 'Order status updated successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper functions
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return `${day}, ${dayNum} ${month} ${year} • ${time}`;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

