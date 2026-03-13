# Payment Refunds - Developer Documentation

## Overview

The payment refund system allows users to request refunds for payments made through Paystack or Flutterwave. Refunds are processed based on a policy that determines the refund amount based on the cancellation reason.

---

## Architecture

### Backend

**Service**: `PaymentsService` (`backend/src/payments/payments.service.ts`)

**Key Methods**:
- `refundPayment()` - Main refund logic
- `calculateRefundAmount()` - Policy-based refund calculation
- `refundPaystackPayment()` - Paystack API integration
- `refundFlutterwavePayment()` - Flutterwave API integration

**Controller**: `PaymentsController` (`backend/src/payments/payments.controller.ts`)

**Endpoint**: `POST /api/payments/refund`

### Frontend

**Component**: `RefundRequestModal` (`frontend/src/features/payments/refund-request-modal.tsx`)

**Integration Points**:
- Booking cancellation flow
- Order cancellation flow
- Admin dispute resolution

---

## API Reference

### Refund Payment

**Endpoint**: `POST /api/payments/refund`

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  reference: string;              // Payment reference
  amount?: number;                // Optional partial refund amount
  provider?: 'PAYSTACK' | 'FLUTTERWAVE';  // Optional, auto-detected if not provided
  cancellationReason?: CancellationReason;  // Optional, affects refund amount
  notes?: string;                 // Optional additional notes
}
```

**Cancellation Reasons**:
```typescript
enum CancellationReason {
  BABALAWO_CANCELLED = 'BABALAWO_CANCELLED',      // 100% refund
  USER_CANCELLED = 'USER_CANCELLED',              // 50% refund
  SERVICE_NOT_COMPLETED = 'SERVICE_NOT_COMPLETED', // 100% refund
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',      // 100% refund
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',            // 100% refund
  OTHER = 'OTHER',                                // 50% refund
}
```

**Response**:
```typescript
{
  provider: 'PAYSTACK' | 'FLUTTERWAVE';
  success: true;
  reference: string;
  amount: number;  // Refunded amount
}
```

**Error Responses**:
- `400` - Bad Request (invalid reference, refund failed at gateway)
- `401` - Unauthorized
- `500` - Internal Server Error

---

## Refund Policy Logic

### Policy Rules

The `calculateRefundAmount()` method implements the following policy:

| Cancellation Reason | Refund Amount |
|---------------------|---------------|
| `BABALAWO_CANCELLED` | 100% |
| `SERVICE_NOT_COMPLETED` | 100% |
| `DISPUTE_RESOLUTION` | 100% |
| `TECHNICAL_ISSUE` | 100% |
| `USER_CANCELLED` | 50% |
| `OTHER` | 50% |

### Custom Amounts

If an `amount` is provided in the request, it overrides the policy calculation. This is useful for:
- Partial refunds
- Admin-initiated refunds with custom amounts

---

## Payment Gateway Integration

### Paystack

**API**: `refund.create()`

**Payload**:
```javascript
{
  transaction: reference,  // Payment reference
  amount: amount * 100     // Amount in kobo (optional)
}
```

**Response**:
```javascript
{
  status: true,
  data: {
    transaction: {
      reference: string,
      amount: number  // In kobo
    }
  }
}
```

### Flutterwave

**API**: `Refund.create()`

**Payload**:
```javascript
{
  tx_ref: reference,  // Payment reference
  amount: amount      // Amount in naira (optional)
}
```

**Response**:
```javascript
{
  status: 'success',
  data: {
    tx_ref: string,
    amount: number
  }
}
```

---

## Wallet Integration

After a successful refund at the payment gateway, the wallet is updated:

**Method**: `walletService.recordRefundFromGateway()`

**Actions**:
1. Decrements user's wallet balance
2. Creates a `REFUND` transaction record
3. Attaches metadata (cancellation reason, provider)

**Transaction Record**:
```typescript
{
  type: 'REFUND',
  amount: refundAmount,
  currency: originalCurrency,
  reference: paymentReference,
  userId: userId,
  status: 'COMPLETED',
  metadata: {
    cancellationReason: string,
    provider: string,
  }
}
```

---

## Testing

### Unit Tests

**File**: `backend/src/payments/payments.service.spec.ts`

**Test Coverage** (11 tests):
1. 100% refund for `BABALAWO_CANCELLED`
2. 50% refund for `USER_CANCELLED`
3. 100% refund for `SERVICE_NOT_COMPLETED`
4. 100% refund for `DISPUTE_RESOLUTION`
5. 100% refund for `TECHNICAL_ISSUE`
6. Partial refund with custom amount
7. Flutterwave refund integration
8. Error handling for gateway failures
9. Warning for missing original transaction
10. Auto-detect provider from reference format
11. Paystack refund integration

**Run Tests**:
```bash
cd backend
npm test -- payments.service.spec.ts
```

### Manual Testing

**Prerequisites**:
1. Paystack/Flutterwave test credentials configured
2. Test payment completed successfully
3. Payment reference available

**Test Steps**:
1. Make a test payment (e.g., ₦1,000)
2. Note the payment reference
3. Call refund endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/payments/refund \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "reference": "ref-123",
       "cancellationReason": "USER_CANCELLED"
     }'
   ```
4. Verify response shows 50% refund (₦500)
5. Check wallet balance decreased by ₦500
6. Check transaction history shows `REFUND` entry

---

## Frontend Integration

### Using RefundRequestModal

```typescript
import { RefundRequestModal } from '@/features/payments/refund-request-modal';

function BookingDetails() {
  const [showRefundModal, setShowRefundModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowRefundModal(true)}>
        Request Refund
      </button>

      <RefundRequestModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        paymentReference="ref-123"
        originalAmount={10000}
        currency="NGN"
        onSuccess={() => {
          // Refresh booking data
          refetchBooking();
        }}
      />
    </>
  );
}
```

---

## Error Handling

### Common Errors

**1. Refund Failed at Gateway**
```
BadRequestException: Refund failed
```
**Cause**: Payment gateway rejected refund (e.g., insufficient funds, already refunded)  
**Solution**: Check gateway dashboard, verify payment status

**2. Transaction Not Found**
```
Warning: Refund succeeded but no DEPOSIT transaction found
```
**Cause**: Original payment not recorded in database  
**Solution**: Refund succeeded at gateway, but wallet not updated. Manual intervention required.

**3. Provider Not Configured**
```
BadRequestException: Paystack is not configured
```
**Cause**: Missing API keys in environment  
**Solution**: Set `PAYSTACK_SECRET_KEY` or `FLUTTERWAVE_SECRET_KEY`

---

## Best Practices

### 1. Always Provide Cancellation Reason

```typescript
// Good
await refundPayment('ref-123', undefined, undefined, 'USER_CANCELLED');

// Bad (defaults to 50% refund)
await refundPayment('ref-123');
```

### 2. Handle Errors Gracefully

```typescript
try {
  const result = await apiClient.post('/payments/refund', { reference });
  showSuccess(`Refund of ${result.amount} processed`);
} catch (error) {
  showError('Refund failed. Please contact support.');
  logError(error); // Log for debugging
}
```

### 3. Verify Original Transaction Exists

Before calling refund, verify the payment exists:
```typescript
const payment = await prisma.transaction.findFirst({
  where: { reference, type: 'DEPOSIT' }
});

if (!payment) {
  throw new Error('Payment not found');
}
```

---

## Troubleshooting

### Refund Not Appearing in Wallet

**Check**:
1. Was refund successful at gateway? (check logs)
2. Was original transaction found? (check for warning log)
3. Was `recordRefundFromGateway` called? (check logs)

**Solution**:
- If gateway succeeded but wallet not updated, manually create refund transaction

### Refund Amount Incorrect

**Check**:
1. What cancellation reason was used?
2. Was custom amount provided?
3. Check `calculateRefundAmount` logic

**Solution**:
- Verify cancellation reason matches expected policy
- For custom amounts, ensure amount is passed correctly

---

## Future Enhancements

**Potential Improvements**:
1. **Idempotency** - Prevent duplicate refund requests
2. **Refund Status Tracking** - Track pending/processing/completed states
3. **Partial Refund UI** - Allow users to request custom amounts
4. **Refund Notifications** - Email/SMS when refund processed
5. **Refund Analytics** - Dashboard for refund metrics

---

## Support

For refund-related issues:
1. Check payment gateway dashboard (Paystack/Flutterwave)
2. Review server logs for errors
3. Verify environment variables configured
4. Contact payment gateway support if needed

---

**Last Updated**: February 11, 2026
