export type PaymentProviderType = 'wave' | 'orange_money' | 'card' | 'cash_on_delivery';

export interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  callbackUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  provider: PaymentProviderType;
  transactionId?: string;
  redirectUrl?: string;
  qrCodeUrl?: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'NOT_CONFIGURED';
  message: string;
  rawReference?: string;
}

export interface WebhookPayload {
  provider: PaymentProviderType;
  signature: string;
  rawBody: string;
  parsed: any;
}

export interface WebhookResult {
  success: boolean;
  orderNumber: string;
  transactionId: string;
  paymentStatus: 'PAID' | 'FAILED' | 'REFUNDED';
  amount: number;
  message: string;
}

export interface PaymentProviderAdapter {
  providerName: PaymentProviderType;
  isConfigured(): boolean;
  createPaymentSession(request: PaymentRequest): Promise<PaymentResponse>;
  verifyWebhookSignature(payload: WebhookPayload): boolean;
  handleWebhook(payload: WebhookPayload): Promise<WebhookResult>;
}
