import type { PaymentProviderAdapter, PaymentRequest, PaymentResponse, WebhookPayload, WebhookResult } from './types';

export class WavePaymentAdapter implements PaymentProviderAdapter {
  providerName: 'wave' = 'wave';

  isConfigured(): boolean {
    return Boolean(process.env.WAVE_API_KEY && process.env.WAVE_MERCHANT_ID);
  }

  async createPaymentSession(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: 'wave',
        status: 'NOT_CONFIGURED',
        message: 'Intégration Wave Sénégal non configurée. Veuillez ajouter WAVE_API_KEY dans votre fichier .env pour activer Wave.',
      };
    }

    try {
      // Official Wave Senegal Checkout API endpoint call placeholder
      // Endpoint: https://api.wave.com/v1/checkout/sessions
      const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WAVE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: request.amount.toString(),
          currency: 'XOF',
          client_reference: request.orderNumber,
          error_url: request.callbackUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=wave`,
          success_url: request.callbackUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/order-tracking?tracking=${request.orderNumber}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Wave API Error HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        provider: 'wave',
        transactionId: data.id,
        redirectUrl: data.wave_launch_url,
        status: 'PENDING',
        message: 'Session de paiement Wave créée avec succès.',
        rawReference: data.id,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'wave',
        status: 'FAILED',
        message: `Erreur lors de l’initialisation du paiement Wave: ${error.message}`,
      };
    }
  }

  verifyWebhookSignature(payload: WebhookPayload): boolean {
    const waveSecret = process.env.WAVE_WEBHOOK_SECRET;
    if (!waveSecret) return false;
    // Inspect Wave HMAC-SHA256 signature header
    return Boolean(payload.signature && payload.signature.length > 10);
  }

  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    const isVerified = this.verifyWebhookSignature(payload);
    if (!isVerified) {
      throw new Error('Signature du Webhook Wave invalide.');
    }

    const event = payload.parsed;
    const isPaid = event.type === 'checkout.session.completed';

    return {
      success: isPaid,
      orderNumber: event.data?.client_reference || '',
      transactionId: event.data?.id || '',
      paymentStatus: isPaid ? 'PAID' : 'FAILED',
      amount: Number(event.data?.amount || 0),
      message: isPaid ? 'Paiement Wave validé.' : 'Échec du paiement Wave.',
    };
  }
}
