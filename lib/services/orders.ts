/**
 * Order Service
 * Handles all order-related database operations
 */

import { supabase } from '../supabase';
import type { OrderSummary, OrderStatus, OrderTimelineEvent } from '../../data/dummyData';

export interface CreateOrderInput {
  userId: string;
  shopId?: string;
  addressId: string;
  items: Array<{
    productId?: string;
    addonId?: string;
    name: string;
    quantity: number;
    weight?: string;
    weightInKg?: number;
    price: number;
    pricePerKg?: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponId?: string;
  paymentMethodId?: string;
  paymentMethodText?: string;
}

/**
 * Get all orders for a user
 */
export async function getUserOrders(userId: string): Promise<OrderSummary[]> {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      shop:shops(*),
      address:addresses(*),
      items:order_items(*),
      timeline:order_timeline(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    throw ordersError;
  }

  if (!orders) return [];

  // Transform orders to match OrderSummary type
  return orders.map((order: any) => {
    const shop = order.shop || {};
    const address = order.address || {};
    
    return {
      id: order.id,
      orderNumber: order.order_number,
      parentOrder: order.parent_order || '',
      placedOn: formatDate(order.created_at),
      total: `₹${order.total.toFixed(2)}`,
      status: order.status as OrderStatus,
      statusNote: order.status_note || '',
      shopName: shop.name || '',
      shopAddress: shop.address || '',
      shopContact: shop.contact_phone || '',
      paymentMethod: order.payment_method_text || '',
      deliveryEta: order.delivery_eta ? formatDate(order.delivery_eta) : undefined,
      otp: order.otp || '',
      deliveredAt: order.delivered_at || undefined,
      deliveryAgent: order.delivery_agent_name ? {
        name: order.delivery_agent_name,
        mobile: order.delivery_agent_mobile || '',
      } : undefined,
      items: (order.items || []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        weight: item.weight || '',
        price: `₹${item.price.toFixed(2)}`,
        image: item.image_url || '',
      })),
      timeline: (order.timeline || []).map((event: any) => ({
        stage: event.stage,
        description: event.description,
        timestamp: formatTime(event.timestamp),
        isCompleted: event.is_completed,
      })),
    };
  });
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string, userId: string): Promise<OrderSummary | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      shop:shops(*),
      address:addresses(*),
      items:order_items(*),
      timeline:order_timeline(*)
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching order:', error);
    throw error;
  }

  if (!order) return null;

  const shop = order.shop || {};
  const address = order.address || {};

  return {
    id: order.id,
    orderNumber: order.order_number,
    parentOrder: order.parent_order || '',
    placedOn: formatDate(order.created_at),
    total: `₹${order.total.toFixed(2)}`,
    status: order.status as OrderStatus,
    statusNote: order.status_note || '',
    shopName: shop.name || '',
    shopAddress: shop.address || '',
    shopContact: shop.contact_phone || '',
    paymentMethod: order.payment_method_text || '',
    deliveryEta: order.delivery_eta ? formatDate(order.delivery_eta) : undefined,
    otp: order.otp || '',
    deliveredAt: order.delivered_at || undefined,
    deliveryAgent: order.delivery_agent_name ? {
      name: order.delivery_agent_name,
      mobile: order.delivery_agent_mobile || '',
    } : undefined,
    items: (order.items || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      weight: item.weight || '',
      price: `₹${item.price.toFixed(2)}`,
      image: item.image_url || '',
    })),
    timeline: (order.timeline || []).map((event: any) => ({
      stage: event.stage,
      description: event.description,
      timestamp: formatTime(event.timestamp),
      isCompleted: event.is_completed,
    })),
  };
}

/**
 * Create a new order
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderSummary> {
  // Generate order number
  const { data: orderNumberData, error: orderNumberError } = await supabase
    .rpc('generate_order_number');

  if (orderNumberError) {
    console.error('Error generating order number:', orderNumberError);
    throw orderNumberError;
  }

  const orderNumber = orderNumberData || `#TAZ${Date.now()}`;

  // Generate OTP
  const { data: otpData, error: otpError } = await supabase
    .rpc('generate_otp');

  if (otpError) {
    console.error('Error generating OTP:', otpError);
    throw otpError;
  }

  const otp = otpData || Math.floor(100000 + Math.random() * 900000).toString();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: input.userId,
      shop_id: input.shopId,
      address_id: input.addressId,
      order_number: orderNumber,
      subtotal: input.subtotal,
      delivery_charge: input.deliveryCharge,
      discount: input.discount,
      coupon_id: input.couponId,
      total: input.subtotal + input.deliveryCharge - input.discount,
      status: 'Preparing',
      status_note: 'Butcher is hand-cutting your order.',
      payment_method_id: input.paymentMethodId,
      payment_method_text: input.paymentMethodText,
      otp: otp,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }

  // Create order items
  const orderItems = input.items.map(item => ({
    order_id: order.id,
    product_id: item.productId || null,
    addon_id: item.addonId || null,
    name: item.name,
    quantity: item.quantity,
    weight: item.weight || null,
    weight_in_kg: item.weightInKg || null,
    price: item.price,
    price_per_kg: item.pricePerKg || null,
    image_url: item.imageUrl || null,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    throw itemsError;
  }

  // Create initial timeline event
  const { error: timelineError } = await supabase
    .from('order_timeline')
    .insert({
      order_id: order.id,
      stage: 'Order Placed',
      description: 'We have received your order request.',
      is_completed: true,
    });

  if (timelineError) {
    console.error('Error creating timeline:', timelineError);
    // Don't throw, timeline is not critical
  }

  // Fetch the complete order
  const completeOrder = await getOrderById(order.id, input.userId);
  if (!completeOrder) {
    throw new Error('Failed to fetch created order');
  }

  return completeOrder;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  userId: string,
  status: OrderStatus,
  statusNote?: string
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      status_note: statusNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }

  // Add timeline event
  const stageDescriptions: Record<OrderStatus, string> = {
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

  await supabase
    .from('order_timeline')
    .insert({
      order_id: orderId,
      stage,
      description: statusNote || stageDescriptions[status] || '',
      is_completed: status !== 'Cancelled',
    });
}

/**
 * Helper function to format date
 */
function formatDate(dateString: string): string {
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

/**
 * Helper function to format time
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

