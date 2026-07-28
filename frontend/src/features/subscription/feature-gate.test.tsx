import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { FeatureGate, UpgradePrompt } from './feature-gate';

const mockUseSubscription = vi.fn();
vi.mock('./use-subscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

describe('FeatureGate (V8-202)', () => {
  beforeEach(() => {
    mockUseSubscription.mockReset();
  });

  it('shows children when the user isDevoted', () => {
    mockUseSubscription.mockReturnValue({ isDevoted: true, isLoading: false });

    render(
      <MemoryRouter>
        <FeatureGate feature="profile-views">
          <div>Secret Devoted Content</div>
        </FeatureGate>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Devoted Content')).toBeInTheDocument();
  });

  it('shows the default UpgradePrompt when the user is FREE and no fallback is given', () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false, isLoading: false });

    render(
      <MemoryRouter>
        <FeatureGate feature="profile-views">
          <div>Secret Devoted Content</div>
        </FeatureGate>
      </MemoryRouter>
    );

    expect(screen.queryByText('Secret Devoted Content')).not.toBeInTheDocument();
    expect(screen.getByText(/Become Devoted/)).toBeInTheDocument();
  });

  it('shows the provided fallback instead of the default prompt when given', () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false, isLoading: false });

    render(
      <MemoryRouter>
        <FeatureGate feature="profile-views" fallback={<div>Custom fallback</div>}>
          <div>Secret Devoted Content</div>
        </FeatureGate>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText(/Become Devoted/)).not.toBeInTheDocument();
  });

  it('renders nothing while subscription status is still loading (avoids a flash of the wrong state)', () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false, isLoading: true });

    const { container } = render(
      <MemoryRouter>
        <FeatureGate feature="profile-views">
          <div>Secret Devoted Content</div>
        </FeatureGate>
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('UpgradePrompt (V8-202)', () => {
  it('renders the custom message when provided', () => {
    render(
      <MemoryRouter>
        <UpgradePrompt message="See who visited your profile — Devoted only" />
      </MemoryRouter>
    );

    expect(screen.getByText('See who visited your profile — Devoted only')).toBeInTheDocument();
  });

  it('renders a default message when none is provided', () => {
    render(
      <MemoryRouter>
        <UpgradePrompt />
      </MemoryRouter>
    );

    expect(screen.getByText(/Devoted-only feature/)).toBeInTheDocument();
  });

  it('navigates to /pricing when the CTA is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/somewhere']}>
        <Routes>
          <Route path="/somewhere" element={<UpgradePrompt />} />
          <Route path="/pricing" element={<div>Pricing Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Become Devoted/));

    expect(screen.getByText('Pricing Page')).toBeInTheDocument();
  });
});
