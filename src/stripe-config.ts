export const STRIPE_PRODUCTS = {
  dayPass: {
    priceId: 'price_1RP98PGdoQAZzII54mZe3eAR',
    name: 'InterviewIQ Day Pass',
    description: 'Get unlimited access to all Pro features for 24 hours. Perfect for last-minute interview prep!',
    mode: 'payment' as const,
  },
  pro: {
    priceId: 'price_1RP97RGdoQAZzII5wADD2KCb',
    name: 'InterviewIQ Pro',
    description: 'Unlock unlimited reports, advanced research, and premium features with the Pro plan.',
    mode: 'subscription' as const,
  },
} as const;

export type StripeProduct = keyof typeof STRIPE_PRODUCTS;