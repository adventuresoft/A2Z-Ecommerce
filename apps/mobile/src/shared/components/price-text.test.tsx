import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { azLightTheme } from '@/shared/theme';
import { PriceText } from './price-text';

describe('PriceText (RNTL v14)', () => {
  it('renders formatted BDT price with South Asian grouping and discount percentage', async () => {
    await render(
      <PaperProvider theme={azLightTheme}>
        <PriceText price={125000} regularPrice={150000} />
      </PaperProvider>,
    );

    expect(screen.getByText('BDT 1,25,000')).toBeOnTheScreen();
    expect(screen.getByText('BDT 1,50,000')).toBeOnTheScreen();
    expect(screen.getByText('-17%')).toBeOnTheScreen();
  });

  it('omits strikethrough and badge when regularPrice is not greater than price', async () => {
    await render(
      <PaperProvider theme={azLightTheme}>
        <PriceText price={950} regularPrice={950} />
      </PaperProvider>,
    );

    expect(screen.getByText('BDT 950')).toBeOnTheScreen();
    expect(screen.queryByText(/-\d+%/)).toBeNull();
  });
});
