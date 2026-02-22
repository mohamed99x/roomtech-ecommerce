import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { handlePlanPayment } from '@/utils/flutterwave-payment';

interface FlutterwavePaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: string;
  flutterwaveKey: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FlutterwavePaymentForm({ 
  planId, 
  planPrice,
  couponCode, 
  billingCycle, 
  flutterwaveKey,
  currency,
  onSuccess, 
  onCancel 
}: FlutterwavePaymentFormProps) {
  const { t } = useTranslation();
  const initialized = useRef(false);

  const { processPayment } = usePaymentProcessor({
    onSuccess,
    onError: (error) => toast.error(error)
  });

  useEffect(() => {
    if (!flutterwaveKey || initialized.current) return;
    initialized.current = true;

    handlePlanPayment({
      planId,
      planPrice,
      couponCode,
      billingCycle,
      flutterwaveKey,
      currency,
      onSuccess,
      onCancel: () => {
        toast.error(t('Payment was cancelled'));
        onCancel();
      },
      processPayment
    });
  }, [flutterwaveKey, planId, billingCycle, couponCode, currency]);

  if (!flutterwaveKey) {
    return <div className="p-4 text-center text-red-500">{t('Flutterwave not configured')}</div>;
  }

  return (
    <div className="p-4 text-center">
      <p>{t('Redirecting to Flutterwave...')}</p>
    </div>
  );
}