import type { PaymentProviderAdapter, PaymentRequest, PaymentResponse, WebhookPayload, WebhookResult } from './types';

export class CashOnDeliveryAdapter implements PaymentProviderAdapter {
  providerName: 'cash_on_delivery' = 'cash_on_delivery';

  isConfigured(): boolean {
    return true; // Cash on delivery is active out of the box when enabled
  }

  async createPaymentSession(request: PaymentRequest): Promise<PaymentResponse> {
    const txId = `cod_tx_${request.orderNumber}_${Date.now()}`;
    return {
      success: true,
      provider: 'cash_on_delivery',
      transactionId: txId,
      status: 'PENDING',
      message: 'Commande enregistrée avec succès. Le règlement s’effectuera en espèces lors de la livraison à domicile.',
      rawReference: txId,
    };
  }

  verifyWebhookSignature(_payload: WebhookPayload): boolean {
    return true;
  }

  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    return {
      success: true,
      orderNumber: payload.parsed?.orderNumber || '',
      transactionId: payload.parsed?.transactionId || '',
      paymentStatus: 'PAID',
      amount: Number(payload.parsed?.amount || 0),
      message: 'Paiement à la livraison confirmé par le livreur.',
    };
  }
}
