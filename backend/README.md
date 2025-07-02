# Backend

This is the backend for ONSET-CHAT, responsible for authentication, real-time messaging, user management, and security.

## Structure

- `src/config/` - Configuration files (DB, environment, etc.)
- `src/controllers/` - Route controllers
- `src/middlewares/` - Express middlewares (auth, validation, etc.)
- `src/models/` - Database models/schemas
- `src/routes/` - API and socket routes
- `src/services/` - Business logic and integrations
- `src/utils/` - Utility functions
- `src/sockets/` - WebSocket logic
- `tests/` - Backend tests

## Security
- JWT/OAuth/2FA authentication
- Rate limiting, input validation, sanitization
- HTTPS and secure WebSocket
- End-to-end encryption support
- Protection against XSS, CSRF, and other attacks 