# Vamo Store - Setup Guide

## Overview

Vamo Store is a Progressive Web App (PWA) for vending machine operations that integrates with the vm-service API.

## Features

- ✅ PWA Support (installable on mobile devices)
- ✅ Centralized API communication with vm-service
- ✅ Store ID management via URL parameters and Redux (Zustand)
- ✅ Product listing from vm-service API
- ✅ Dispense flow integration with vm-service

## Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# VM Service Configuration
NEXT_PUBLIC_VM_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_VM_SERVICE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET=your_client_secret_here
```

### Environment Variables Explained

- `NEXT_PUBLIC_VM_SERVICE_URL`: Base URL of the vm-service API (e.g., `http://localhost:8080` or `https://api.example.com`)
- `NEXT_PUBLIC_VM_SERVICE_CLIENT_ID`: Client ID for authentication (obtained from project admin)
- `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET`: Client secret for authentication (obtained from project admin)

### Getting Client Credentials

Client credentials (`client_id` and `client_secret`) are obtained from your project administrator via the Management API:

```bash
# Admin generates credentials for your project
POST /api/v1/projects/:project_id/credentials
Headers: X-API-Key: <organization_api_key>

# Response includes client_id and client_secret (shown only once!)
```

**Important**: The `client_secret` is shown only once when generated. Store it securely.

### Authentication Flow

1. **Get Credentials**: Credentials are primarily configured via:
   - Environment variables (`NEXT_PUBLIC_VM_SERVICE_CLIENT_ID` and `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET`) in `.env.local` - **Primary source**
   - Optional URL query parameters (`client_id` and `client_secret`) - Override env vars if provided
   - Stored credentials in localStorage (from previous URL params) - Fallback only

2. **Get Access Token**: The app automatically exchanges `client_id` and `client_secret` for an access token
   - Endpoint: `POST /api/v1/token`
   - Token is stored in localStorage and automatically refreshed when expired
   - Uses environment variables by default

3. **Use Access Token**: All API requests use Bearer token authentication
   - Header: `Authorization: Bearer <access_token>`
   - Project ID is automatically extracted from the token (no need to specify in URLs)

4. **Token Refresh**: Tokens are automatically refreshed when they expire
   - Uses refresh token stored in localStorage
   - Falls back to getting a new token if refresh fails
   - If credentials change (different client_id), a new token is automatically fetched

## Usage

### Starting the Application

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### Accessing a Store

The store ID is provided via URL query parameter. Client ID and Client Secret are configured via environment variables.

**Required URL Parameter:**
```
http://localhost:3000/?store_id=YOUR_STORE_ID
```

**Parameters:**
- `store_id` (required) - The store ID to fetch products from

**Optional URL Parameters (override env vars):**
- `client_id` (optional) - Client ID for authentication (overrides env var if provided)
- `client_secret` (optional) - Client secret for authentication (overrides env var if provided)

**Note:** 
- Client ID and Client Secret are primarily configured via environment variables (`NEXT_PUBLIC_VM_SERVICE_CLIENT_ID` and `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET`) in `.env.local`
- URL parameters for credentials are optional and only used to override environment variables
- The store ID is automatically extracted from the URL and stored in the app state (Zustand)

### Product Listing

Products are automatically fetched from the vm-service API endpoint:
```
GET /api/v1/stores/{store_id}/springs
Authorization: Bearer <access_token>
```

**Note**: Project ID is automatically extracted from the access token, so it's not needed in the URL.

Only springs with:
- `inventory > 0`
- `spring_status` not equal to `broken` or `maintenance`

are displayed as available products.

### Dispense Flow

When a user completes payment and proceeds to dispensing:

1. The app calls the vm-service dispense endpoint for each product:
   ```
   POST /api/v1/stores/{store_id}/vms/{vm_id}/dispense
   Authorization: Bearer <access_token>
   Body: {
     "selection_number": <number>,
     "products": [...],
     "metadata": {...}
   }
   ```

2. Each product is dispensed individually based on its `selection_number`

3. The app tracks:
   - Successful dispenses
   - Failed dispenses (for refund processing)
   - Partial failures

4. Results are displayed to the user with appropriate error handling

**Note**: Project ID is automatically extracted from the access token, so it's not needed in the URL.

## API Integration

### Centralized API Service

All API communication is handled through:

**Authentication** (`/src/lib/api/auth.ts`):
- `getAccessToken()` - Get access token from client credentials
- `getCurrentAccessToken()` - Get current valid token (with auto-refresh)
- `refreshAccessToken()` - Refresh expired token
- `clearToken()` - Clear stored token

**API Calls** (`/src/lib/api/vmService.ts`):
- `getSpringsByStoreId(storeId, limit, offset, clientId?, clientSecret?)` - Fetch products for a store (uses Bearer token)
- `dispenseProduct(storeId, vmId, request, clientId?, clientSecret?)` - Send dispense command to VM (uses Bearer token)
- `getConnectionStatus(storeId, vmId, clientId?, clientSecret?)` - Check VM connection status (uses Bearer token)
- `requestSpringData(storeId, vmId, clientId?, clientSecret?)` - Request spring data refresh (uses Bearer token)

All API calls automatically:
- Include Bearer token in Authorization header
- Extract project ID from token (not from URL)
- Handle token refresh when expired
- Support dynamic credentials (from URL params, localStorage, or env vars)

### Product Mapping

Springs from the API are mapped to Product format via `/src/lib/api/productMapper.ts`:

- Extracts product information from `linked_product` JSON field
- Maps spring data to Product interface
- Filters available products

## State Management

The app uses Zustand for state management:

### App Store (`/src/lib/stores/appStore.ts`)
- Store ID (from URL params)
- VM ID (for dispense operations)
- Age verification status
- Current order
- Payment method
- Loading and dispensing states

### Cart Store (`/src/lib/stores/cartStore.ts`)
- Cart items
- Cart operations (add, remove, update quantity)
- Cart totals

## PWA Configuration

The app is configured as a PWA with:

- Service worker registration (via `next-pwa`)
- Web app manifest (`/public/manifest.json`)
- Offline caching strategy (NetworkFirst)
- Installable on mobile devices

### Testing PWA

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Open in Chrome/Edge
4. Use "Add to Home Screen" or "Install" option
5. Test offline functionality

## Development Notes

### VM ID Handling

The VM ID can be:
1. Set explicitly via `useAppStore().setVmId()`
2. Extracted from product data (if products include `vmId` field)
3. Retrieved from the first product's `vmId` during dispense

### Error Handling

- API errors are caught and displayed to users
- Failed dispenses are tracked for refund processing
- Store ID validation ensures API calls succeed

### TypeScript Types

Product types are extended to include spring-specific fields:
- `selectionNumber` - Spring selection number for dispense
- `inventory` - Current inventory count
- `capacity` - Maximum capacity
- `springStatus` - Spring status
- `stripeCode` - Stripe code
- `vmId` - Associated VM ID

## Troubleshooting

### Products Not Loading

1. Check that `store_id` is provided in URL parameters
2. Verify `NEXT_PUBLIC_VM_SERVICE_URL` is correct in `.env.local`
3. Verify `NEXT_PUBLIC_VM_SERVICE_CLIENT_ID` and `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET` are configured in `.env.local`
4. Verify vm-service is running and accessible
5. Check browser console for authentication errors
6. Verify token is being stored in localStorage (check Application tab)
7. Ensure springs have `linked_product` data (products without linked_product are filtered out)
8. Restart the development server after updating `.env.local` (environment variables are loaded at build time)

### Dispense Failing

1. Ensure `storeId` and `vmId` are set
2. Verify VM is connected (check connection status)
3. Check that products have valid `selectionNumber`
4. Review API error messages in console

### PWA Not Working

1. Ensure you're using HTTPS (or localhost for development)
2. Check that service worker is registered (DevTools > Application > Service Workers)
3. Verify manifest.json is accessible
4. Clear browser cache and reload

## API Endpoints Used

**Authentication:**
- `POST /api/v1/token` - Get access token (uses client_id/client_secret)
- `POST /api/v1/refresh` - Refresh access token

**Protected Endpoints (require Bearer token):**
- `GET /api/v1/stores/{store_id}/springs` - List products (project ID from token)
- `POST /api/v1/stores/{store_id}/vms/{vm_id}/dispense` - Dispense product (project ID from token)
- `GET /api/v1/stores/{store_id}/vms/{vm_id}/connectionStatus` - Check connection (project ID from token)
- `POST /api/v1/stores/{store_id}/vms/{vm_id}/requestSpringData` - Refresh data (project ID from token)

**Note**: All protected endpoints automatically extract the project ID from the access token. No need to include it in the URL path.

## Next Steps

- [ ] Add error retry logic for failed API calls
- [ ] Implement connection status polling
- [ ] Add product image fallbacks
- [ ] Enhance offline support
- [ ] Add analytics tracking
