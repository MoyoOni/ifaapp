import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/theme-context';
import ProductListing from './product-listing';
import { marketplaceApi } from '../../../services/api';

// Mock the API module
jest.mock('../../../services/api', () => ({
  marketplaceApi: {
    getProducts: jest.fn(),
    getProductById: jest.fn(),
  },
}));


describe('ProductListing Component', () => {
  const mockProducts = [
    {
      id: 'prod1',
      name: 'Herbal Remedy',
      description: 'Traditional herbal remedy',
      price: 2500,
      vendor: {
        id: 'vendor1',
        firstName: 'Herbalist',
        lastName: 'Smith',
        avatar: '',
      },
      images: ['image1.jpg'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod2',
      name: 'Spiritual Candle',
      description: 'Sacred candle for rituals',
      price: 1500,
      vendor: {
        id: 'vendor2',
        firstName: 'Ritualist',
        lastName: 'Jones',
        avatar: '',
      },
      images: ['image2.jpg'],
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    (marketplaceApi.getProducts as jest.MockedFunction<typeof marketplaceApi.getProducts>).mockResolvedValue(mockProducts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders product listings correctly', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ProductListing />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    });

    expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    expect(screen.getByText('Traditional herbal remedy')).toBeInTheDocument();
    expect(screen.getByText('₦2,500.00')).toBeInTheDocument();
    expect(screen.getByText('Herbalist Smith')).toBeInTheDocument();

    expect(screen.getByText('Spiritual Candle')).toBeInTheDocument();
    expect(screen.getByText('Sacred candle for rituals')).toBeInTheDocument();
    expect(screen.getByText('₦1,500.00')).toBeInTheDocument();
    expect(screen.getByText('Ritualist Jones')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ProductListing />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (marketplaceApi.getProducts as jest.MockedFunction<typeof marketplaceApi.getProducts>).mockRejectedValue(
      new Error('Failed to load products')
    );

    render(
      <ThemeProvider>
        <MemoryRouter>
          <ProductListing />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no products available', async () => {
    (marketplaceApi.getProducts as jest.MockedFunction<typeof marketplaceApi.getProducts>).mockResolvedValue([]);

    render(
      <ThemeProvider>
        <MemoryRouter>
          <ProductListing />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no products available/i)).toBeInTheDocument();
    });
  });

  it('displays product images', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ProductListing />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByAltText('Herbal Remedy')).toBeInTheDocument();
    });

    expect(screen.getByAltText('Herbal Remedy')).toBeInTheDocument();
    expect(screen.getByAltText('Spiritual Candle')).toBeInTheDocument();
  });
});