# Social Integrations System - Implementation Guide

## Overview

This document describes the Social Outreach Settings system that allows users to connect their social accounts (Instagram, Facebook, TikTok, Email) for outbound outreach.

## Architecture

### Database Schema

**Table: `social_integrations`**

- `id` (UUID, primary key)
- `user_id` (String, indexed) - User identifier
- `platform` (String, indexed) - instagram | facebook | tiktok | email
- `connection_status` (String) - connected | expired | revoked | unsupported | error
- `scopes_granted` (JSONB) - Array of granted OAuth scopes
- `account_id` (String) - Platform account ID
- `page_id` (String) - Facebook Page ID (if applicable)
- `business_id` (String) - Meta Business Account ID
- `access_token` (Text, encrypted) - Encrypted OAuth access token
- `refresh_token` (Text, encrypted, nullable) - Encrypted refresh token
- `token_expires_at` (DateTime) - Token expiration time
- `last_verified_at` (DateTime) - Last successful token validation
- `email_address` (String) - For email integrations
- `smtp_host` (String) - SMTP server hostname
- `smtp_port` (Integer) - SMTP port
- `smtp_username` (String) - SMTP username
- `smtp_password` (Text, encrypted) - Encrypted SMTP password
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `metadata` (JSONB) - Platform-specific metadata

**Indexes:**
- Unique constraint on (`user_id`, `platform`) - one integration per user per platform

### Security

1. **Token Encryption**: All tokens are encrypted at rest using Fernet symmetric encryption
2. **Encryption Key**: Stored in `ENCRYPTION_KEY` environment variable (32-byte base64-encoded Fernet key)
3. **Token Masking**: Tokens are never returned in API responses (only masked versions)
4. **Validation**: Tokens are validated before saving and on health checks

### API Endpoints

#### `GET /api/integrations/`
List all integrations for a user.

**Query Parameters:**
- `user_id` (required) - User ID

**Response:** List of `IntegrationResponse` objects (tokens are masked)

#### `GET /api/integrations/capabilities`
Get capabilities for all platforms.

**Query Parameters:**
- `user_id` (required) - User ID

**Response:** List of `CapabilityResponse` objects with:
- `is_connected` - Whether integration is connected
- `can_send_dm` - Whether DM/messaging is possible
- `can_discover` - Whether discovery is possible (always true)
- `can_read_messages` - Whether reading messages is possible
- `reason` - Explanation if capabilities are limited

**CRITICAL:** This endpoint is used by frontend to enable/disable buttons.

#### `GET /api/integrations/{platform}/capabilities`
Get capabilities for a specific platform.

#### `POST /api/integrations/`
Create or update an integration.

**Request Body:** `IntegrationCreate` model

**Validation:**
- Tokens are validated with platform API before saving
- Returns 400 with clear error message if validation fails

#### `POST /api/integrations/{platform}/validate`
Validate an existing integration's token/configuration.

**Updates:**
- `connection_status` based on validation result
- `last_verified_at` timestamp

#### `DELETE /api/integrations/{platform}`
Delete an integration.

#### `GET /api/integrations/oauth/{platform}/authorize`
Generate OAuth authorization URL.

**Query Parameters:**
- `user_id` (required)
- `redirect_uri` (required)

**Response:** `{"authorization_url": "..."}`

#### `POST /api/integrations/oauth/{platform}/callback`
Handle OAuth callback and exchange code for tokens.

**Request Body:** `OAuthCallbackRequest`

**TODO:** Implement OAuth token exchange logic

## Platform Capability Matrix

### Instagram
- **Can Send DM**: ✅ YES (if Business/Creator account + `instagram_manage_messages` scope + Facebook Page connected)
- **Can Discover**: ✅ YES (always works)
- **Can Read Messages**: ✅ YES (if `instagram_manage_messages` scope)
- **Requirements**: Business/Creator account, Facebook Page connection, proper OAuth scopes

### Facebook
- **Can Send DM**: ✅ YES (if `pages_messaging` scope + Page connected)
- **Can Discover**: ✅ YES (always works)
- **Can Read Messages**: ✅ YES (if `pages_messaging` scope)
- **Limitations**: Can only message users who have previously messaged the page (for most use cases)

### TikTok
- **Can Send DM**: ❌ NO (TikTok does not provide official DM API)
- **Can Discover**: ✅ YES (always works)
- **Can Read Messages**: ❌ NO
- **Reason**: Explicitly documented - TikTok does not provide messaging APIs

### Email
- **Can Send DM**: ✅ YES (if SMTP configured and validated)
- **Can Discover**: ✅ YES (always works)
- **Can Read Messages**: ❌ NO (requires IMAP, not implemented)
- **Requirements**: Valid SMTP configuration

## OAuth Flow (Meta Platforms)

### Instagram/Facebook OAuth Flow

1. **Authorization Request**
   ```
   GET /api/integrations/oauth/instagram/authorize?user_id=xxx&redirect_uri=...
   ```
   Returns Meta OAuth URL with required scopes.

2. **User Consent**
   User is redirected to Meta OAuth consent screen.

3. **Callback**
   ```
   POST /api/integrations/oauth/instagram/callback
   ```
   Receives authorization code, exchanges for tokens, validates, and saves integration.

### Required Scopes

**Instagram:**
- `instagram_basic` - Basic profile access
- `instagram_manage_messages` - Send/receive DMs (requires Business/Creator account)
- `pages_show_list` - List connected Facebook Pages

**Facebook:**
- `pages_messaging` - Send/receive messages via Messenger API
- `pages_show_list` - List Facebook Pages

## Token Management

### Encryption

Tokens are encrypted using Fernet symmetric encryption:
- Encryption key stored in `ENCRYPTION_KEY` environment variable
- Generate key: `python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'`

### Token Expiry

- `token_expires_at` tracks when access token expires
- `is_token_expired()` method checks expiry
- Expired tokens trigger `connection_status = "expired"`

### Token Refresh

- Refresh tokens are stored (encrypted) for platforms that support them
- Refresh logic should be implemented in token validation endpoints
- TODO: Implement automatic token refresh

## Error Handling

### Clear Error Messages

All endpoints return explicit error messages:
- `"Missing 'instagram_manage_messages' scope. Reconnect with proper permissions."`
- `"TikTok does not provide an official Direct Message API."`
- `"SMTP authentication failed - check username and password"`

### Fail-Fast Validation

- Tokens are validated before saving
- Invalid configurations return 400 immediately
- No silent failures

## Frontend Integration

### Capability Detection

Frontend MUST call `/api/integrations/capabilities` to determine which buttons to enable:

```typescript
const capabilities = await fetch('/api/integrations/capabilities?user_id=xxx')
const instagram = capabilities.find(c => c.platform === 'instagram')

if (instagram?.can_send_dm) {
  // Enable "Send DM" button
} else {
  // Disable button, show reason: instagram.reason
}
```

### Discovery Without Integrations

Discovery works without integrations - capabilities endpoint returns `can_discover: true` for all platforms.

### Outreach Requires Integrations

Outreach actions (sending DMs, emails) require valid integrations:
- Check `is_connected` status
- Check `can_send_dm` capability
- Show clear error if integration missing or invalid

## Migration

Run migration to create table:
```bash
alembic upgrade head
```

Migration file: `20250120180000_add_social_integrations_table.py`

## Environment Variables

Required:
- `ENCRYPTION_KEY` - Fernet encryption key (32 bytes, base64-encoded)

Optional (for OAuth):
- `INSTAGRAM_CLIENT_ID` - Instagram OAuth client ID
- `FACEBOOK_CLIENT_ID` - Facebook OAuth client ID
- `INSTAGRAM_CLIENT_SECRET` - Instagram OAuth client secret
- `FACEBOOK_CLIENT_SECRET` - Facebook OAuth client secret

## Testing

### Manual Testing

1. **Create Integration**
   ```bash
   curl -X POST http://localhost:8000/api/integrations/?user_id=test \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "email",
       "email_address": "test@example.com",
       "smtp_host": "smtp.gmail.com",
       "smtp_port": 587,
       "smtp_username": "test@example.com",
       "smtp_password": "password123"
     }'
   ```

2. **Get Capabilities**
   ```bash
   curl http://localhost:8000/api/integrations/capabilities?user_id=test
   ```

3. **Validate Integration**
   ```bash
   curl -X POST http://localhost:8000/api/integrations/email/validate?user_id=test
   ```

## Next Steps

1. **Implement OAuth Token Exchange**
   - Complete `oauth_callback` endpoint
   - Exchange authorization code for tokens
   - Handle token refresh

2. **Implement Platform Clients**
   - Complete Instagram Graph API client
   - Complete Facebook Graph API client
   - Add token refresh logic

3. **Add Token Refresh Logic**
   - Automatic refresh before expiry
   - Background job to refresh expired tokens

4. **Add Frontend UI**
   - Settings page for integrations
   - OAuth flow UI
   - Capability display

5. **Add Integration Tests**
   - Test token encryption/decryption
   - Test capability detection
   - Test OAuth flows

## Security Checklist

- ✅ Tokens encrypted at rest
- ✅ Tokens never logged
- ✅ Tokens never returned in API responses
- ✅ Token validation before saving
- ✅ Clear error messages (no silent failures)
- ✅ Fail-fast validation
- ⚠️ OAuth token exchange (TODO)
- ⚠️ Token refresh logic (TODO)
- ⚠️ Rate limiting (TODO)
- ⚠️ Audit logging (TODO)

