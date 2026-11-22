import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { azLightTheme } from '@/shared/theme';
import { ProductCard } from './product-card';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

describe('ProductCard (RNTL v14)', () => {
  const sampleProduct = {
    id: 'prod-1',
    slug: 'wireless-anc-headphones',
    title: 'Wireless ANC Headphones',
    imageUrl: null,
    price: 4500,
    regularPrice: 5500,
    rating: 4.8,
    inStock: true,
    defaultVariantId: 'var-1',
    variantsCount: 1,
  };

  it('renders product title, BDT price, and invokes press, wishlist, and quick-add callbacks', async () => {
    const onPress = jest.fn();
    const onToggleWishlist = jest.fn();
    const onQuickAdd = jest.fn();

    await render(
      <PaperProvider theme={azLightTheme}>
        <ProductCard
          product={sampleProduct}
          isWishlisted={false}
          onPress={onPress}
          onToggleWishlist={onToggleWishlist}
          onQuickAdd={onQuickAdd}
        />
      </PaperProvider>,
    );

    expect(screen.getByText('Wireless ANC Headphones')).toBeOnTheScreen();
    expect(screen.getByText('BDT 4,500')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Wireless ANC Headphones'));
    expect(onPress).toHaveBeenCalledWith('wireless-anc-headphones');

    fireEvent.press(screen.getByTestId('catalog.productCard.wireless-anc-headphones.wishlist'));
    expect(onToggleWishlist).toHaveBeenCalledWith(sampleProduct);

    fireEvent.press(screen.getByTestId('catalog.productCard.wireless-anc-headphones.quickAdd'));
    expect(onQuickAdd).toHaveBeenCalledWith(sampleProduct);
  });
});
