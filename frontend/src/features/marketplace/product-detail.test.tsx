import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/theme-context';
import ProductDetail from './product-detail';
import { marketplaceApi } from '../../../services/api';

// Mock the API module
jest.mock('../../../services/api', () => ({
  marketplaceApi: {
    getProductById: jest.fn(),
    addToCart: jest.fn(),
  },
}));


describe('ProductDetail Component', () => {
  const mockProduct = {
    id: 'prod1',
    name: 'Herbal Remedy',
    description: 'Traditional herbal remedy with natural ingredients',
    price: 2500,
    vendor: {
      id: 'vendor1',
      firstName: 'Herbalist',
      lastName: 'Smith',
      avatar: '',
    },
    images: ['image1.jpg', 'image2.jpg'],
    stockQuantity: 10,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    (marketplaceApi.getProductById as jest.MockedFunction<typeof marketplaceApi.getProductById>).mockResolvedValue(mockProduct);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders product details correctly', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/products/prod1']}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    });

    expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    expect(screen.getByText('Traditional herbal remedy with natural ingredients')).toBeInTheDocument();
    expect(screen.getByText('₦2,500.00')).toBeInTheDocument();
    expect(screen.getByText('Herbalist Smith')).toBeInTheDocument();
    expect(screen.getByText('In Stock: 10')).toBeInTheDocument();
  });

  it('displays product images', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/products/prod1']}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByAltText('Herbal Remedy')).toBeInTheDocument();
    });

    expect(screen.getAllByAltText('Herbal Remedy')).toHaveLength(2);
  });

  it('adds product to cart', async () => {
    (marketplaceApi.addToCart as jest.MockedFunction<typeof marketplaceApi.addToCart>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/products/prod1']}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/add to cart/i));

    await waitFor(() => {
      expect(marketplaceApi.addToCart).toHaveBeenCalledWith({
        productId: 'prod1',
        quantity: 1,
      });
    });

    expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
  });

  it('handles quantity selection', async () => {
    (marketplaceApi.addToCart as jest.MockedFunction<typeof marketplaceApi.addToCart>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/products/prod1']}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    });

    const quantitySelect = screen.getByTestId('quantity-select');
    fireEvent.change(quantitySelect, { target: { value: '3' } });
    fireEvent.click(screen.getByText(/add to cart/i));

    await waitFor(() => {
      expect(marketplaceApi.addToCart).toHaveBeenCalledWith({
        productId: 'prod1',
        quantity: 3,
      });
    });
  });

  it('handles loading state', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/products/prod1']}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (marketplaceApi.getProductById as jest.MockedFunction<typeof marketplaceApi.getProductById>).mockRejectedValue(
      new Error('Failed to load product')
    );

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/products/prod1']}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });
  });
});