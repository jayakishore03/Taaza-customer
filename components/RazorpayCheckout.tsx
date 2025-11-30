/**
 * Razorpay Checkout Component
 * Opens Razorpay payment gateway in a WebView
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  keyId: string;
  name: string;
  description: string;
  prefill?: {
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: (error: any) => void;
  onClose: () => void;
}

export default function RazorpayCheckout({
  orderId,
  amount,
  keyId,
  name,
  description,
  prefill,
  onSuccess,
  onFailure,
  onClose,
}: RazorpayCheckoutProps) {
  const webViewRef = useRef<WebView>(null);

  // Razorpay Checkout HTML
  const razorpayHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
          text-align: center;
          padding: 20px;
        }
        .loading {
          color: #333;
          font-size: 16px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading">Opening payment gateway...</div>
      </div>
      <script>
        var options = {
          "key": "${keyId}",
          "amount": ${Math.round(amount * 100)},
          "currency": "INR",
          "name": "${name}",
          "description": "${description}",
          "order_id": "${orderId}",
          "handler": function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            }));
          },
          "prefill": {
            ${prefill?.email ? `"email": "${prefill.email}",` : ''}
            ${prefill?.contact ? `"contact": "${prefill.contact}"` : ''}
          },
          "theme": {
            "color": "#DC2626"
          },
          "modal": {
            "ondismiss": function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'close'
              }));
            }
          }
        };
        
        var rzp = new Razorpay(options);
        rzp.open();
        
        rzp.on('payment.failed', function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'failure',
            error: response.error
          }));
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'success') {
        onSuccess(data.paymentId, data.orderId, data.signature);
      } else if (data.type === 'failure') {
        onFailure(data.error || 'Payment failed');
      } else if (data.type === 'close') {
        onClose();
      }
    } catch (error) {
      console.error('Error parsing Razorpay message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Complete Payment</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <WebView
        ref={webViewRef}
        source={{ html: razorpayHTML }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>Loading payment gateway...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});

