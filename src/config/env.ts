/**
 * Environment Variables Configuration
 *
 * This module validates and exposes environment variables with type safety.
 * All environment variables are validated at application startup to catch
 * configuration errors early.
 *
 * @module config/env
 */

import { z } from 'zod';

/**
 * Environment variable schema definition
 * Uses Zod for runtime validation and type inference
 */
const envSchema = z.object({
  // VM Service Configuration
  NEXT_PUBLIC_VM_SERVICE_URL: z
    .string()
    .url('VM Service URL must be a valid URL')
    .describe('Base URL for the VM Service API'),

  NEXT_PUBLIC_VM_SERVICE_CLIENT_ID: z
    .string()
    .min(5, 'Client ID must be at least 5 characters')
    .describe('OAuth Client ID for VM Service authentication'),

  // NOTE: CLIENT_SECRET should ideally be moved to backend-only
  // For now, keeping it but marking as deprecated
  NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET: z
    .string()
    .min(5, 'Client Secret must be at least 5 characters')
    .describe('OAuth Client Secret (⚠️ DEPRECATED: Move to backend)'),

  // Payment Gateway Configuration
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z
    .string()
    .min(5, 'Razorpay Key ID must be at least 5 characters')
    .describe('Razorpay public key for payment processing'),

  // Optional: Base path for deployment
  NEXT_PUBLIC_BASE_PATH: z
    .string()
    .optional()
    .describe('Base path for the application (for GitHub Pages, etc.)'),
});

/**
 * Validated environment variables
 * Type is automatically inferred from the schema
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_VM_SERVICE_URL: process.env.NEXT_PUBLIC_VM_SERVICE_URL,
      NEXT_PUBLIC_VM_SERVICE_CLIENT_ID: process.env.NEXT_PUBLIC_VM_SERVICE_CLIENT_ID,
      NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET: process.env.NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET,
      NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `  - ${err.path.join('.')}: ${err.message}`
      );

      throw new Error(
        `❌ Environment variable validation failed:\n${errorMessages.join('\n')}\n\n` +
        `Please check your .env file and ensure all required variables are set correctly.`
      );
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 * Use this throughout the application instead of process.env
 *
 * @example
 * import { env } from '@/config/env';
 * const apiUrl = env.NEXT_PUBLIC_VM_SERVICE_URL;
 */
export const env = validateEnv();

/**
 * Check if the application is running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if the application is running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if the application is running in test mode
 */
export const isTest = process.env.NODE_ENV === 'test';
