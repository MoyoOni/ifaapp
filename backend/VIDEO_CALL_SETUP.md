# Video Call Integration Setup Guide

## Overview

The platform uses **Agora.io** for real-time video consultations between Babalawos and clients. This document provides setup instructions.

## Prerequisites

1. Agora.io account (sign up at https://www.agora.io/)
2. Agora.io project with App ID and App Certificate

## Backend Configuration

### 1. Install Dependencies

Dependencies are already installed:
- `agora-token` - For generating access tokens

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Agora.io Configuration
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

### 3. Get Agora.io Credentials

1. Sign up at https://www.agora.io/
2. Create a new project
3. Navigate to Project Management → Your Project
4. Copy the **App ID** and **App Certificate**
5. Add them to your `.env` file

## Frontend Configuration

### 1. Install Dependencies

Dependencies are already installed:
- `agora-rtc-sdk-ng` - Agora RTC SDK for React

### 2. Usage

The `VideoCallView` component is ready to use. Import it in your appointments view:

```tsx
import VideoCallView from '@/features/video-call/video-call-view';

// In your component
<VideoCallView
  appointmentId={appointment.id}
  onEndCall={() => {
    // Handle call end (e.g., navigate back)
  }}
/>
```

## API Endpoints

### Generate Video Call Token
```
POST /video-call/appointment/:appointmentId/token/:userId
```

Returns:
```json
{
  "token": "agora_access_token",
  "roomId": "appointment_123",
  "appId": "your_app_id",
  "appointmentId": "123",
  "expiresIn": 3600
}
```

### Get Video Call Info
```
GET /video-call/appointment/:appointmentId
```

### End Video Session
```
PATCH /video-call/appointment/:appointmentId/end
```

### Store Recording URL
```
PATCH /video-call/appointment/:appointmentId/recording
Body: { "recordingUrl": "https://..." }
```

## Features

### ✅ Implemented
- Video room creation and token generation
- Real-time video/audio streaming
- Camera and microphone controls
- Session management
- Recording URL storage
- Appointment status updates (UPCOMING → IN_SESSION → COMPLETED)

### 🔄 Future Enhancements
- Screen sharing
- Recording automation (Agora Cloud Recording)
- Chat during video call
- Connection quality indicators
- Network reconnection handling

## Security Considerations

1. **Token Expiration**: Tokens expire after 1 hour for security
2. **Authorization**: Only appointment participants can generate tokens
3. **Room Isolation**: Each appointment has a unique room ID
4. **Token Storage**: Tokens are not stored long-term in the database

## Testing

1. Create an appointment
2. Navigate to the appointment detail view
3. Click "Start Video Call"
4. Both participants should see each other's video
5. Test camera/microphone toggles
6. End the call and verify appointment status updates

## Troubleshooting

### "Video call service is not configured"
- Ensure `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set in `.env`
- Restart the backend server after adding environment variables

### "Failed to initialize video call"
- Check browser console for errors
- Ensure camera/microphone permissions are granted
- Verify Agora.io credentials are correct

### "Connection Error"
- Check network connectivity
- Verify Agora.io service status
- Check if token has expired (tokens expire after 1 hour)

## Recording (Future)

To enable recording:
1. Enable Agora Cloud Recording in your Agora.io project
2. Configure recording webhooks
3. Update `storeRecording` endpoint to handle webhook callbacks
4. Store recording URLs in S3 (via Documents module)

## Support

For Agora.io-specific issues, refer to:
- Agora.io Documentation: https://docs.agora.io/
- Agora.io Support: https://www.agora.io/en/contact-us/
