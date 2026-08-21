import type { PaymentProviderAdapter, PaymentProviderType } from './types';
import { WavePaymentAdapter } from './waveAdapter';
import { OrangeMoneyPaymentAdapter } from './orangeMoneyAdapter';
import { CreditCardPaymentAdapter } from './cardAdapter';
import { CashOnDeliveryAdapter } from './cashOnDeliveryAdapter';

export class PaymentManager {
  private adapters: Map<PaymentProviderType, PaymentProviderAdapter>;

  constructor() {
    this.adapters = new Map();
    this.adapters.set('wave', new WavePaymentAdapter());
    this.adapters.set('orange_money', new OrangeMoneyPaymentAdapter());
    this.adapters.set('card', new CreditCardPaymentAdapter());
    this.adapters.set('cash_on_delivery', new CashOnDeliveryAdapter());
  }

  getAdapter(provider: PaymentProviderType): PaymentProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Prestataire de paiement non pris en charge: ${provider}`);
    }
    return adapter;
  }

  getAvailableProviders(): { provider: PaymentProviderType; configured: boolean }[] {
    return Array.from(this.adapters.entries()).map(([provider, adapter]) => ({
      provider,
      configured: adapter.isConfigured(),
    }));
  }
}

export const paymentManager = new PaymentManager();
