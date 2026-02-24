# P0-2 Quick Test Guide

## API Endpoints (Ready to Test)

### 1. Create Booking
```bash
POST /api/appointments
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

Body:
{
  "babalawoId": "kunle_babalawo_id",
  "clientId": "current_user_id",
  "date": "2026-02-15",
  "time": "14:00",
  "topic": "Love & Relationships",
  "preferredMethod": "VIDEO",
  "paymentMethod": "ESCROW",
  "price": 25000
}

Response:
{
  "id": "apt_123456",
  "confirmationCode": "APT12345",
  "status": "PENDING_CONFIRMATION",
  "babalawo": { "id", "name", "avatar" },
  "date": "2026-02-15",
  "time": "14:00",
  "topic": "Love & Relationships",
  "price": 25000
}
```

### 2. Babalawo Confirms
```bash
PATCH /api/appointments/apt_123456/confirm
Authorization: Bearer {BABALAWO_JWT}

Response: 200 OK
{ ...appointment with status: "CONFIRMED" }
```

### 3. Babalawo Declines
```bash
PATCH /api/appointments/apt_123456/decline
Authorization: Bearer {BABALAWO_JWT}

Body:
{ "reason": "Not available that day" }

Response: 200 OK
{ ...appointment with status: "DECLINED" }
```

### 4. Either Party Cancels
```bash
PATCH /api/appointments/apt_123456/cancel
Authorization: Bearer {EITHER_PARTY_JWT}

Body:
{ "reason": "Schedule conflict" }

Response: 200 OK
{ ...appointment with status: "CANCELLED" }
```

### 5. Get Client's Bookings
```bash
GET /api/appointments/client/{clientId}
Authorization: Bearer {CLIENT_JWT}

Response: 200 OK
[
  { ...appointment1 },
  { ...appointment2 }
]
```

### 6. Get Babalawo's Bookings
```bash
GET /api/appointments/babalawo/{babalawoId}
Authorization: Bearer {BABALAWO_JWT}

Response: 200 OK
[
  { ...appointment1 },
  { ...appointment2 }
]
```

---

## Frontend Testing Steps

### 1. Load Booking Page
- URL: `/appointments/{babalawoId}`
- Expected: Shows babalawo name + services
- Status: ✅ Ready

### 2. Select Service
- Click any service card
- Expected: Service highlighted in gold
- Status: ✅ Ready

### 3. Select Date & Time
- Use calendar navigation
- Select future date
- Choose time slot
- Expected: Both selected and highlighted
- Status: ✅ Ready

### 4. Review Summary
- See booking details
- See total price
- Status: ✅ Ready

### 5. Submit Booking
- Click "Proceed to Payment"
- Expected: API call sent
- Confirmation page shows: code, date/time, babalawo, cost
- Status: ✅ Ready

---

## Demo Data Users

### Babalawos (Can Confirm/Decline)
1. Kunle Okonkwo - `kunle_id`
2. Femi Adekunle - `femi_id`
3. Funmilayo Okafor - `funmilayo_id`
4. Oladele Adeyemi - `oladele_id`
5. Adekunle Bello - `adekunle_id`

### Clients (Can Book)
1. Ayo Okafor - `ayo_id`
2. Chioma Nwankwo - `chioma_id`
3. Tunde Ibrahim - `tunde_id`
4. Aisha Hassan - `aisha_id`
5. Ibrahim Oluwaseun - `ibrahim_id`

**Note:** Use actual UUIDs from database seed output

---

## Validation Testing

### Should Pass ✅
```json
{
  "babalawoId": "valid_uuid",
  "clientId": "valid_uuid",
  "date": "2026-02-15",
  "time": "14:00",
  "topic": "Valid topic",
  "preferredMethod": "VIDEO",
  "paymentMethod": "ESCROW"
}
```

### Should Fail ❌
```json
{
  "date": "2025-02-15",  // Past date
  "time": "invalid",     // Not HH:mm format
  "duration": 25,        // Below 30 min
  "duration": 600,       // Above 480 min
  "preferredMethod": "INVALID"  // Not in enum
}
```

---

## Known Status Indicators

| Status | Meaning | Next Action |
|--------|---------|-------------|
| PENDING_CONFIRMATION | Waiting for babalawo | Babalawo reviews |
| CONFIRMED | Babalawo accepted | Get session link |
| DECLINED | Babalawo rejected | Can rebook |
| CANCELLED | Either party cancelled | Refund issued |
| COMPLETED | Session finished | Leave review |
| IN_SESSION | Currently happening | Video active |

---

## Error Scenarios to Test

1. **Time Slot Conflict**
   - Try booking same babalawo/date/time twice
   - Expected: 400 "This time slot is already booked"

2. **Invalid Babalawo**
   - Use non-existent UUID
   - Expected: 400 "Invalid babalawo ID"

3. **Past Date**
   - Use yesterday's date
   - Expected: 400 "Appointment date and time must be in the future"

4. **Unauthorized Cancel**
   - Try to cancel someone else's appointment
   - Expected: 403 "You can only cancel your own appointments"

5. **Double Confirm**
   - Try to confirm already-confirmed booking
   - Expected: 400 "Only pending appointments can be confirmed"

---

## Performance Expectations

- Create booking: < 500ms
- Get bookings list: < 200ms
- Confirm/decline: < 300ms
- Frontend render: < 1s

---

## Notification Expectations

When creating booking:
✉️ Babalawo receives: "New booking request from {clientName}"

When confirming:
✉️ Client receives: "Your appointment confirmed with {babalawoName}"

When declining:
✉️ Client receives: "Your appointment was declined. Reason: {reason}"

When cancelling:
✉️ Other party receives: "Appointment cancelled by {canceller}. Reason: {reason}"

---

## Next Steps After Testing

1. ✅ Basic booking creation works
2. ⬜ Add wallet fund verification
3. ⬜ Add payment processing integration
4. ⬜ Add dynamic availability checking
5. ⬜ Add email notifications
6. ⬜ Load test with 100+ concurrent bookings

---

## Session Code Files

**Backend Ready:**
- ✅ `backend/src/appointments/dto/create-appointment.dto.ts`
- ✅ `backend/src/appointments/appointments.service.ts`
- ✅ `backend/src/appointments/appointments.controller.ts`
- ✅ `backend/src/notifications/notification.service.ts`

**Frontend Ready:**
- ✅ `frontend/src/features/appointments/booking-flow.tsx`
- ✅ `frontend/src/features/appointments/booking-confirmation.tsx`
- ✅ `frontend/src/features/appointments/hooks/use-babalawo.ts`
- ✅ `frontend/src/features/appointments/hooks/use-book-appointment.ts`

All files compile with 0 TypeScript errors ✅

