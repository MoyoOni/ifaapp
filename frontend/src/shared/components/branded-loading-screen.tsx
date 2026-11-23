import React from 'react';
import { Loader2 } from 'lucide-react';
import appLogo from '@/assets/logo.png';

/**
 * Full-screen cold-start loader shown while the session is being checked.
 * Uses the native splash's background (#252423, see capacitor.config.ts) and
 * the app mark, so in the mobile app the hand-off from splash to this screen
 * is seamless instead of flashing to a white page with a spinner.
 */
export const BrandedLoadingScreen: React.FC = () => (
  <div
    role="status"
    aria-label="Loading Ìlú Àṣẹ"
    className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-8 bg-[#252423]"
  >
    <img src={appLogo} alt="" className="w-20 h-20 rounded-2xl shadow-lg" />
    <Loader2 className="w-6 h-6 animate-spin text-white/50" aria-hidden="true" />
  </div>
);

export default BrandedLoadingScreen;
