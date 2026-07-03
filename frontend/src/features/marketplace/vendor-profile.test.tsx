import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/theme-context';
import VendorProfile from './vendor-profile';

// Mock the API module
jest.mock('../../../services/api', () => ({
  marketplaceApi: {
    getVendorById: jest.fn(),
    getVendorProducts: jest.fn(),
  },
}));

const { marketplaceApi } = require('../../../services/api');

describe('VendorProfile Component', () => {
  const mockVendor = {
    id: 'vendor1',
    firstName: 'Herbalist',
    lastName: 'Smith',
    email: 'herbalist@example.com',
    bio: 'Traditional herbalist with 10 years of experience',
    avatar: 'avatar.jpg',
    rating: 4.8,
    totalSales: 150,
    createdAt: new Date().toISOString(),
  };

  const mockProducts = [
    {
      id: 'prod1',
      name: 'Herbal Remedy',
      description: 'Traditional herbal remedy',
      price: 2500,
      images: ['image1.jpg'],
      stockQuantity: 10,
    },
    {
      id: 'prod2',
      name: 'Spiritual Oil',
      description: 'Sacred oil for rituals',
      price: 3500,
      images: ['image2.jpg'],
      stockQuantity: 5,
    },
  ];

  beforeEach(() => {
    (marketplaceApi.getVendorById as jest.MockedFunction<typeof marketplaceApi.getVendorById>).mockResolvedValue(mockVendor);
    (marketplaceApi.getVendorProducts as jest.MockedFunction<typeof marketplaceApi.getVendorProducts>).mockResolvedValue(mockProducts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders vendor profile information correctly', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/vendors/vendor1']}>
          <Routes>
            <Route path="/vendors/:id" element={<VendorProfile />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Herbalist Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('Herbalist Smith')).toBeInTheDocument();
    expect(screen.getByText('Traditional herbalist with 10 years of experience')).toBeInTheDocument();
    expect(screen.getByText(/rating: 4\.8/)).toBeInTheDocument();
    expect(screen.getByText(/sales: 150/)).toBeInTheDocument();
  });

  it('displays vendor products', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/vendors/vendor1']}>
          <Routes>
            <Route path="/vendors/:id" element={<VendorProfile />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    });

    expect(screen.getByText('Herbal Remedy')).toBeInTheDocument();
    expect(screen.getByText('Spiritual Oil')).toBeInTheDocument();
    expect(screen.getByText('Traditional herbal remedy')).toBeInTheDocument();
    expect(screen.getByText('Sacred oil for rituals')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/vendors/vendor1']}>
          <Routes>
            <Route path="/vendors/:id" element={<VendorProfile />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (marketplaceApi.getVendorById as jest.MockedFunction<typeof marketplaceApi.getVendorById>).mockRejectedValue(
      new Error('Failed to load vendor')
    );

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/vendors/vendor1']}>
          <Routes>
            <Route path="/vendors/:id" element={<VendorProfile />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading vendor/i)).toBeInTheDocument();
    });
  });

  it('displays vendor avatar', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/vendors/vendor1']}>
          <Routes>
            <Route path="/vendors/:id" element={<VendorProfile />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByAltText('Herbalist Smith')).toBeInTheDocument();
    });

    expect(screen.getByAltText('Herbalist Smith')).toBeInTheDocument();
  });
});