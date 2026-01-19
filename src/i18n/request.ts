/**
 * i18n Request Configuration
 *
 * Handles locale detection and configuration for next-intl.
 * This file is used by Next.js middleware and server components.
 *
 * @module i18n/request
 */

import { getRequestConfig } from 'next-intl/server';
import { APP_METADATA } from '@/config/constants';

/**
 * Get the user's locale based on various sources:
 * 1. URL parameter (?lang=en)
 * 2. localStorage (client-side)
 * 3. Browser language
 * 4. Default locale
 */
export default getRequestConfig(async () => {
  // In a real app, you would detect locale from:
  // - URL params
  // - Cookies
  // - Browser Accept-Language header
  // For now, we'll use the default locale

  const locale = APP_METADATA.DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
