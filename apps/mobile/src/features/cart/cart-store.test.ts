import {
  cartControllerGetCart,
  cartControllerSyncCart,
} from '@repo/api-client';
import { useAuthStore } from '../auth/auth-store';
import { selectActiveCartCount, useCartStore } from './cart-store';

jest.mock('@repo/api-client', () => ({
  configureApiClient: jest.fn(),
  cartControllerAddItem: jest.fn(),
  cartControllerUpdateItem: jest.fn(),
  cartControllerRemoveItem: jest.fn(),
  cartControllerClearCart: jest.fn(),
  cartControllerGetCart: jest.fn(),
  cartControllerSyncCart: jest.fn(),
}));

const mockedSync = cartControllerSyncCart as jest.Mock;
const mockedGet = cartControllerGetCart as jest.Mock;

describe('useCartStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSessionState();
    useCartStore.setState({
      guestItems: [],
      serverItems: [],
      syncWarnings: [],
      isSyncing: false,
    });
    jest.clearAllMocks();
  });

  it('adds, merges, updates, and removes guest cart items offline', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v-1',
      productId: 'p-1',
      title: 'T-Shirt',
      slug: 't-shirt',
      sku: 'TS-01',
      price: 550,
      quantity: 1,
    });
    await useCartStore.getState().addItem({
      variantId: 'v-1',
      productId: 'p-1',
      title: 'T-Shirt',
      slug: 't-shirt',
      sku: 'TS-01',
      price: 550,
      quantity: 2,
    });

    expect(selectActiveCartCount(useCartStore.getState(), false)).toBe(3);

    await useCartStore.getState().updateQuantity('v-1', 1);
    expect(useCartStore.getState().guestItems[0]?.quantity).toBe(1);

    await useCartStore.getState().removeItem('v-1');
    expect(useCartStore.getState().guestItems).toHaveLength(0);
  });

  it('syncs guest cart items to server on login and captures stock warnings', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v-2',
      productId: 'p-2',
      title: 'Smartwatch',
      slug: 'smartwatch',
      sku: 'SW-01',
      price: 3200,
      quantity: 2,
    });

    useAuthStore.getState().setSessionUser({
      id: 'u-1',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    mockedSync.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: {
        items: [
          {
            id: 'ci-1',
            variantId: 'v-2',
            productId: 'p-2',
            title: 'Smartwatch',
            slug: 'smartwatch',
            sku: 'SW-01',
            regularPrice: 3500,
            effectivePrice: 3200,
            quantity: 1,
            lineTotal: 3200,
            availableQuantity: 1,
            inStock: true,
            isUnavailable: false,
            updatedAt: '',
          },
        ],
        warnings: [
          {
            variantId: 'v-2',
            code: 'CLAMPED_STOCK',
            message: 'Quantity adjusted to available stock (1).',
          },
        ],
      },
    });

    await useCartStore.getState().syncGuestToServer();

    expect(mockedSync).toHaveBeenCalledWith({
      items: [{ variantId: 'v-2', quantity: 2 }],
    });
    expect(useCartStore.getState().guestItems).toHaveLength(0);
    expect(useCartStore.getState().serverItems).toHaveLength(1);
    expect(useCartStore.getState().syncWarnings).toHaveLength(1);
    expect(selectActiveCartCount(useCartStore.getState(), true)).toBe(1);
  });

  it('loads server cart when guest cart is empty on login', async () => {
    useAuthStore.getState().setSessionUser({
      id: 'u-2',
      name: 'Customer',
      role: 'CUSTOMER',
    });
    mockedGet.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { items: [] },
    });

    await useCartStore.getState().syncGuestToServer();
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });
});
