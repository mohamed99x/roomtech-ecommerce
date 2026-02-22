import { generateStoreUrl } from '@/utils/store-url-helper';

declare global {
  interface Window {
    FlutterwaveCheckout?: any;
  }
}

// Store payment data interface
export interface FlutterwavePaymentData {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  redirect_url: string;
  order_id: number;
  order_number: string;
}

// Plan payment options interface
export interface FlutterwavePlanOptions {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: string;
  flutterwaveKey: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
  processPayment: (method: string, data: any) => void;
}

// Store order placement
export const handleOrderPlacement = async (
  orderData: any,
  store: any,
  onSuccess: (orderNumber: string) => void,
  onError: (error: string) => void
) => {
  try {
    const response = await fetch(generateStoreUrl('store.order.place', store), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (result.success && result.payment_method === 'flutterwave') {
      const paymentData: FlutterwavePaymentData = result.payment_data;
      initializeFlutterwave({
        type: 'store',
        paymentData,
        onSuccess: () => onSuccess(paymentData.order_number),
        onError
      });
    } else {
      onError(result.message || 'Payment initialization failed');
    }
  } catch (error) {
    onError('Network error occurred. Please try again.');
  }
};

// Plan subscription payment
export const handlePlanPayment = (options: FlutterwavePlanOptions) => {
  initializeFlutterwave({
    type: 'plan',
    planOptions: options
  });
};

// Unified Flutterwave initialization
const initializeFlutterwave = (config: {
  type: 'store' | 'plan';
  paymentData?: FlutterwavePaymentData;
  planOptions?: FlutterwavePlanOptions;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) => {
  const loadScript = () => {
    if (!window.FlutterwaveCheckout) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      
      script.onload = () => processPayment();
      script.onerror = () => {
        if (config.type === 'store' && config.onError) {
          config.onError('Failed to load Flutterwave payment system');
        }
      };
      
      document.head.appendChild(script);
    } else {
      processPayment();
    }
  };

  const processPayment = () => {
    if (config.type === 'store' && config.paymentData) {
      const { paymentData, onSuccess, onError } = config;
      
      window.FlutterwaveCheckout({
        public_key: paymentData.public_key,
        tx_ref: paymentData.tx_ref,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_options: 'card,mobilemoney,ussd,bank_transfer',
        customer: {
          email: paymentData.customer_email,
          phone_number: paymentData.customer_phone,
          name: paymentData.customer_name,
        },
        customizations: {
          title: 'Order Payment',
          description: `Payment for Order #${paymentData.order_number}`,
          logo: '',
        },
        callback: function (data: any) {
          if (data.status === 'successful') {
            window.location.href = `${paymentData.redirect_url}?transaction_id=${data.transaction_id}&tx_ref=${data.tx_ref}`;
          } else {
            onError?.('Payment was not completed successfully');
          }
        },
        onclose: function () {
          onError?.('Payment was cancelled');
        },
      });
    } else if (config.type === 'plan' && config.planOptions) {
      const { planId, planPrice, couponCode, billingCycle, flutterwaveKey, currency, onSuccess, onCancel, processPayment } = config.planOptions;
      
      window.FlutterwaveCheckout({
        public_key: flutterwaveKey,
        tx_ref: `plan_${planId}_${Date.now()}`,
        amount: planPrice,
        currency: currency.toUpperCase(),
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: 'user@example.com',
          phone_number: '',
          name: 'Customer',
        },
        customizations: {
          title: 'Plan Subscription',
          description: 'Payment for subscription plan',
          logo: '',
        },
        callback: function (data: any) {
          if (data.status === 'successful') {
            processPayment('flutterwave', {
              planId,
              billingCycle,
              couponCode,
              payment_id: data.transaction_id,
              tx_ref: data.tx_ref,
            });
          } else {
            onCancel();
          }
        },
        onclose: function () {
          onCancel();
        },
      });
    }
  };

  loadScript();
};