# Testing Coverage Plan - Sprint Z1-6

## Goal
Increase test coverage to meet targets:
- 80% backend unit test coverage
- 60% frontend component test coverage
- Integration test suite for critical flows

## Scope
This plan covers the implementation of missing unit and integration tests for services that currently lack adequate coverage.

## Target Services for Backend Unit Tests
The following services need comprehensive unit test coverage:

### Forum Module
- forum.service.ts
- forum-thread.service.ts
- forum-post.service.ts

### Circles Module
- circles.service.ts
- circle-membership.service.ts

### Events Module
- events.service.ts
- event-registration.service.ts

### Marketplace Module
- marketplace.service.ts
- product.service.ts
- vendor.service.ts

### Messaging Module
- messaging.service.ts
- message-interceptor.service.ts

### Notifications Module
- notifications.service.ts
- push-notification.service.ts

### Search Module
- search.service.ts
- search-indexer.service.ts

### Recommendations Module
- recommendations.service.ts

### Video Call Module
- video-call.service.ts
- agora-token.service.ts

## Frontend Component Tests
- Forum components (thread-view, thread-create, post-reply)
- Marketplace components (product-listing, product-detail, vendor-profile)
- Circle components (circle-view, membership-controls)
- Event components (event-card, event-details, registration-form)
- User profile components (profile-view, settings-form)

## Integration Tests
- User registration → onboarding → profile setup flow
- Appointment booking → payment → consultation → feedback flow
- Forum post creation → moderation → response chain
- Product listing → purchase → vendor notification → fulfillment flow

## Implementation Timeline
- Week 1: Backend unit tests for forum, circles, and events modules
- Week 2: Backend unit tests for marketplace, messaging, and notifications
- Week 3: Frontend component tests and integration tests

## Success Criteria
- Backend unit test coverage reaches 80%
- Frontend component test coverage reaches 60%
- All critical user flows covered by integration tests
- Zero failing tests in the expanded test suite