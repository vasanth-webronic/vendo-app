# Authentication Flow - vm-service Integration

## Overview

The vamo-store-main app uses **Bearer token authentication** with vm-service. The authentication flow follows vm-service's standard pattern using `client_id` and `client_secret` to obtain access tokens.

## Authentication Flow

### 1. Get Client Credentials

Client credentials are obtained from your project administrator via the Management API:

```bash
POST /api/v1/projects/:project_id/credentials
Headers: X-API-Key: <organization_api_key>
```

**Response:**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "client_id": "abc123def456ghi789",
  "client_secret": "secret123xyz789",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**⚠️ Important**: The `client_secret` is shown **only once** when generated. Store it securely.

### 2. Configure Environment Variables

Add credentials to `.env.local`:

```env
NEXT_PUBLIC_VM_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_VM_SERVICE_CLIENT_ID=abc123def456ghi789
NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET=secret123xyz789
```

### 3. Get Access Token

The app automatically exchanges credentials for an access token:

**Request:**
```bash
POST /api/v1/token
Content-Type: application/json

{
  "client_id": "abc123def456ghi789",
  "client_secret": "secret123xyz789"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_string",
  "token_type": "Bearer",
  "expires_at": "2024-01-01T12:00:00Z",
  "project_id": "uuid"
}
```

The token is stored in `localStorage` and automatically refreshed when expired.

### 4. Use Access Token

All API requests include the Bearer token in the Authorization header:

```bash
GET /api/v1/stores/{store_id}/springs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Key Points:**
- Project ID is **automatically extracted from the token** (not needed in URL)
- Token is automatically refreshed when expired
- No need to manually manage project ID

## Implementation Details

### Token Management (`/src/lib/api/auth.ts`)

- **`getAccessToken()`**: Exchanges client credentials for access token
- **`getCurrentAccessToken()`**: Returns valid token (auto-refreshes if needed)
- **`refreshAccessToken()`**: Refreshes expired token using refresh token
- **`clearToken()`**: Clears stored token from localStorage

### API Calls (`/src/lib/api/vmService.ts`)

All API functions automatically:
1. Get current access token (with auto-refresh)
2. Include `Authorization: Bearer <token>` header
3. Extract project ID from token (not from URL)

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/token` | None | Get access token from client credentials |
| POST | `/api/v1/refresh` | None | Refresh access token |

### Protected Endpoints (Require Bearer Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stores/{store_id}/springs` | List products (springs) |
| POST | `/api/v1/stores/{store_id}/vms/{vm_id}/dispense` | Dispense product |
| GET | `/api/v1/stores/{store_id}/vms/{vm_id}/connectionStatus` | Check VM connection |
| POST | `/api/v1/stores/{store_id}/vms/{vm_id}/requestSpringData` | Refresh spring data |

**Note**: Project ID is extracted from the token, so it's **not included in the URL path**.

## Token Lifecycle

1. **Initial Token**: Obtained on first API call
2. **Storage**: Stored in `localStorage` with expiration time
3. **Auto-Refresh**: Token is refreshed 5 minutes before expiration
4. **Fallback**: If refresh fails, a new token is obtained

## Error Handling

### Authentication Errors

- **401 Unauthorized**: Invalid credentials or expired token
  - App automatically attempts to get a new token
  - If that fails, user sees authentication error

- **403 Forbidden**: Project not active or insufficient permissions
  - Error message displayed to user

### Token Refresh Flow

```
1. API call made
2. Check if token exists and is valid
3. If expired or expiring soon:
   a. Try to refresh using refresh_token
   b. If refresh fails, get new token using client credentials
4. Make API call with valid token
```

## Security Best Practices

1. **Never commit credentials**: `.env.local` is gitignored
2. **Store tokens securely**: Tokens are stored in localStorage (consider httpOnly cookies for production)
3. **Rotate credentials**: Regularly rotate `client_id`/`client_secret` pairs
4. **Use HTTPS**: Always use HTTPS in production
5. **Token expiration**: Tokens expire automatically (default: 24 hours)

## Migration from Old API Key Method

If you were using the old `X-API-Key` method:

1. **Remove old env vars**:
   - `NEXT_PUBLIC_VM_SERVICE_API_KEY`
   - `NEXT_PUBLIC_VM_SERVICE_PROJECT_ID`

2. **Add new env vars**:
   - `NEXT_PUBLIC_VM_SERVICE_CLIENT_ID`
   - `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET`

3. **Get credentials** from your project admin

4. **Update URLs**: Remove project ID from API URLs (it comes from token now)

## Troubleshooting

### "Authentication failed" error

1. Check `NEXT_PUBLIC_VM_SERVICE_CLIENT_ID` and `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET` are set
2. Verify credentials are correct
3. Check browser console for detailed error
4. Verify vm-service is running and accessible

### "Project ID not found" error

- This shouldn't happen with Bearer token auth
- Project ID is automatically extracted from token
- Check token is valid and not expired

### Token not refreshing

1. Check `localStorage` for stored token
2. Verify refresh token is present
3. Check network tab for refresh API call
4. Clear localStorage and try again
