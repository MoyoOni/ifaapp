# API Error Response Format (PB-202.5)

All API error responses use a consistent JSON shape so clients can handle them predictably.

## Shape

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Appointment with id xyz not found",
    "userMessage": "The requested item was not found.",
    "statusCode": 404,
    "timestamp": "2026-02-15T12:34:56.789Z",
    "requestId": "req_abc123",
    "details": {}
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for error responses |
| `error.code` | string | Machine-readable code (e.g. `NOT_FOUND`, `UNAUTHORIZED`) |
| `error.message` | string | Developer-facing message (may be technical) |
| `error.userMessage` | string | User-facing message; safe to show in UI |
| `error.statusCode` | number | HTTP status code |
| `error.timestamp` | string | ISO 8601 timestamp |
| `error.requestId` | string? | Request id for support/debugging (when middleware is applied) |
| `error.details` | object? | Optional extra data (e.g. validation fields, stack in dev) |

## Error codes (backend)

Defined in `backend/src/common/errors/error-codes.ts`:

- `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`
- `CONFLICT`, `UNPROCESSABLE_ENTITY`, `INSUFFICIENT_FUNDS`, `PAYMENT_FAILED`
- `APPOINTMENT_UNAVAILABLE`, `RATE_LIMIT_EXCEEDED`, `REQUEST_TIMEOUT`
- `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`

## Frontend usage

Use `parseApiError(error)` from `@/shared/utils/api-error`. It:

- Prefers `error.userMessage` when the backend returns the standard format
- Falls back to legacy `message` / `error` when present
- Uses status-based default messages when no server message is available
- Returns `{ userMessage, recoverySuggestions, isNetworkError, statusCode, originalError }`

## Examples

**401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized",
    "userMessage": "Please log in to continue.",
    "statusCode": 401,
    "timestamp": "2026-02-15T12:34:56.789Z",
    "requestId": "req_xyz"
  }
}
```

**400 Validation (e.g. invalid DTO)**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed: email must be an email",
    "userMessage": "Invalid request. Please check your input.",
    "statusCode": 400,
    "timestamp": "2026-02-15T12:34:56.789Z",
    "requestId": "req_abc",
    "details": {}
  }
}
```

**429 Rate limit**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "ThrottlerException: Too Many Requests",
    "userMessage": "Too many requests. Please slow down and try again.",
    "statusCode": 429,
    "timestamp": "2026-02-15T12:34:56.789Z"
  }
}
```
