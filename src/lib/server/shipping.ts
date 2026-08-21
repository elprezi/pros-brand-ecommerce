import { INITIAL_SETTINGS } from '../../data/products';

export interface ShippingCalculationInput {
  region: string;
  city?: string;
  subtotal: number;
  deliveryMethod: 'dakar_express' | 'region_standard' | 'boutique_pickup';
}

export interface ShippingCalculationOutput {
  price: number;
  estimatedDelivery: string;
  methodName: string;
  freeShippingApplied: boolean;
}

export function calculateShipping(input: ShippingCalculationInput): ShippingCalculationOutput {
  const { region, subtotal, deliveryMethod } = input;

  const isFree = subtotal >= INITIAL_SETTINGS.freeShippingThreshold;

  if (deliveryMethod === 'boutique_pickup') {
    return {
      price: 0,
      estimatedDelivery: 'Disponible immédiatement',
      methodName: 'Retrait Gratuit Showroom PROS Dakar',
      freeShippingApplied: true,
    };
  }

  if (deliveryMethod === 'dakar_express' || region.toLowerCase().includes('dakar')) {
    return {
      price: isFree ? 0 : INITIAL_SETTINGS.dakarShippingFee,
      estimatedDelivery: '24 heures (remise en main propre)',
      methodName: 'Livraison Express Dakar',
      freeShippingApplied: isFree,
    };
  }

  return {
    price: isFree ? 0 : INITIAL_SETTINGS.regionShippingFee,
    estimatedDelivery: '48 à 72 heures (expédié par transporteur)',
    methodName: `Livraison Régionale (${region})`,
    freeShippingApplied: isFree,
  };
}
