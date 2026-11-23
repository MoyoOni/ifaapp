/**
 * Native shell behaviour for the Capacitor iOS/Android app.
 *
 * Every export is a no-op on the website (Capacitor.isNativePlatform() is
 * false in a browser), so callers never need their own platform checks.
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { logger } from '@/shared/utils/logger';

export const isNativeApp = Capacitor.isNativePlatform();

/** Light tap for navigation (tab changes); medium for confirming an action. */
export function tapHaptic(strength: 'light' | 'medium' = 'light'): void {
  if (!isNativeApp) return;
  Haptics.impact({ style: strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
}

/**
 * Hide the native splash once the first real screen has content, instead of
 * revealing the white route-loading spinner. capacitor.config.ts also auto-hides
 * it after 3s natively, so a JS failure can never leave the splash up forever.
 */
function hideSplashWhenContentReady(): void {
  const started = Date.now();
  const check = () => {
    const main = document.getElementById('main-content');
    const hasContent = !!main && (main.textContent ?? '').trim().length > 0;
    if (hasContent || Date.now() - started > 3000) {
      SplashScreen.hide().catch(() => {});
      return;
    }
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

function syncStatusBarWithTheme(): void {
  // Style.Dark = light text (for dark backgrounds); Style.Light = dark text.
  const apply = () => {
    const dark = document.documentElement.classList.contains('dark');
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

/** Call once at startup, after the React tree is mounted. */
export function initNativeShell(): void {
  if (!isNativeApp) return;
  try {
    // Android hardware back: go back in history; leave the app only at the root.
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
    });

    // Keep the focused field visible when the on-screen keyboard opens.
    Keyboard.addListener('keyboardDidShow', () => {
      const focused = document.activeElement as HTMLElement | null;
      focused?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    });

    syncStatusBarWithTheme();
    hideSplashWhenContentReady();
  } catch (err) {
    logger.warn('[native] shell init failed', err);
    SplashScreen.hide().catch(() => {});
  }
}
