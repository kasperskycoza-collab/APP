# Security Specification for Firestore Security Rules

## 1. Data Invariants
- Only authenticated users can access, create, read, update, or delete their own data (`request.auth.uid == userId`).
- Subcollections (`transactions`, `goals`, `accounts`) are strictly scoped to the parent user (`/users/{userId}/...`).
- Document IDs must match the `isValidId` format (`^[a-zA-Z0-9_\-]+$`) and adhere to length bounds (<= 128 chars).
- Incoming data must match the defined schema, non-null types, and length bounds.
- Users cannot overwrite or modify other users' documents.
- Sensitive user data and subcollections are denied by default for unauthenticated access.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read to /users/user123**: Attempting to read a user document without authentication token.
2. **Unauthenticated Write to /users/user123**: Attempting to write a user document without auth.
3. **Cross-User Document Write**: User A attempts to write to `/users/userB/transactions/tx1`.
4. **Cross-User Document Read**: User A attempts to read `/users/userB/goals/goal1`.
5. **Junk / Overflow Document ID**: Attempting to create `/users/userA/transactions/` with an ID containing special chars or > 128 characters.
6. **Payload with Spoofed userId**: Attempting to set `userId` in document payload to a different user's UID.
7. **Negative or NaN amounts in Transactions**: Attempting to inject non-number or corrupt types for amount.
8. **Invalid Transaction Type**: Setting `type` to `"gift"` instead of `"income"` or `"expense"`.
9. **Oversized String Injection**: Injecting a 1MB string in `description` or `name` field.
10. **Shadow Field Injection**: Adding unexpected fields like `isAdmin: true` or `verified: true` to a user or transaction document.
11. **Cross-User List Query**: Attempting to query `/users/userB/transactions` without userB's credentials.
12. **Catch-All Root Document Write**: Attempting to write directly to arbitrary root collection `/system_config/123`.

## 3. Threat Model
- All operations require `request.auth != null && request.auth.uid == userId`.
- All writes are validated using standalone validation functions (`isValidUserProfile`, `isValidTransaction`, `isValidGoal`, `isValidAccount`).
- Global default rule rejects any unmatched documents.
