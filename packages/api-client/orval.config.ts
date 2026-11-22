import { defineConfig } from 'orval';

const CUSTOMER_ECOMMERCE_TAGS = [
  'Account',
  'Account Addresses',
  'Authentication',
  'Checkout & Calculations',
  'Customer Cart',
  'Customer Wishlist',
  'Health',
  'Locations',
  'Orders',
  'PayStation Gateway',
  'Product Reviews',
  'Public Attributes',
  'Public Brands',
  'Public Categories',
  'Public Collections',
  'Public Coupons',
  'Public Payment Methods',
  'Public Product Tags',
  'Public Products',
  'Shipping & Tracking',
  'Store Settings',
  'User Notifications',
];

export default defineConfig({
  azEcommerce: {
    input: {
      target: '../../apps/api/openapi.json',
      filters: {
        mode: 'include',
        tags: CUSTOMER_ECOMMERCE_TAGS,
      },
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/endpoints',
      schemas: './src/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/mutator.ts',
          name: 'customFetch',
        },
        query: {
          signal: true,
        },
      },
    },
  },
});
