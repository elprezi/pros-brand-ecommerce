import type { PaymentProviderAdapter, PaymentRequest, PaymentResponse, WebhookPayload, WebhookResult } from './types';

export class OrangeMoneyPaymentAdapter implements PaymentProviderAdapter {
  providerName: 'orange_money' = 'orange_money';

  isConfigured(): boolean {
    return Boolean(process.env.ORANGE_MONEY_API_KEY && process.env.ORANGE_MONEY_MERCHANT_KEY);
  }

  async createPaymentSession(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: 'orange_money',
        status: 'NOT_CONFIGURED',
        message: 'Intégration Orange Money Sénégal non configurée. Veuillez renseigner ORANGE_MONEY_API_KEY dans votre fichier .env pour activer Orange Money.',
      };
    }

    try {
      // Official Orange Money Web Payment API v1
      const response = await fetch('https://api.orange.com/orange-money-webpay/dev/v1/webpayment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ORANGE_MONEY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
          currency: 'OUV',
          order_id: request.orderNumber,
          amount: request.amount,
          return_url: request.callbackUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/order-tracking?tracking=${request.orderNumber}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=om`,
          notif_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook/orange_money`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Orange Money API Error HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        provider: 'orange_money',
        transactionId: data.notif_token,
        redirectUrl: data.payment_url,
        status: 'PENDING',
        message: 'Session Orange Money Webpay initialisée.',
        rawReference: data.notif_token,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'orange_money',
        status: 'FAILED',
        message: `Erreur lors du paiement Orange Money: ${error.message}`,
      };
    }
  }

  verifyWebhookSignature(payload: WebhookPayload): boolean {
    return Boolean(payload.signature);
  }

  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    const isVerified = this.verifyWebhookSignature(payload);
    if (!isVerified) throw new Error('Signature Orange Money invalide.');

    const event = payload.parsed;
    const isPaid = event.status === 'SUCCESS';

    return {
      success: isPaid,
      orderNumber: event.order_id || '',
      transactionId: event.txnid || '',
      paymentStatus: isPaid ? 'PAID' : 'FAILED',
      amount: Number(event.amount || 0),
      message: isPaid ? 'Paiement Orange Money confirmé.' : 'Paiement Orange Money refusé.',
    };
  }
}
