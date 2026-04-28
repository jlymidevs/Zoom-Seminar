# Security Specification - Multimedia Seminar App

## 1. Data Invariants
- `Registration` documents must be created with a server-side timestamp `createdAt`.
- Only `create` is allowed for public users.
- `read` (get/list) is restricted to a hardcoded list of verified admin emails.
- Documents are immutable once created (no update or delete by non-admins).

## 2. The "Dirty Dozen" Payloads (Anti-Patterns to Reject)
1. **Identity Spoofing**: Attempt to set `email` to an admin's email while being a different user. (Rejected by `create` logic checking `request.auth` if we decide the user must be signed in to register, OR we just allow public create). The user request implies "form submission registration", usually these don't require sign-in to register, but the portal does. Actually, it says "use firebase authentication and add admin portal". This might mean registration is public but admin portal is auth-only.
2. **Schema Break (Excess Keys)**: Adding `isVerified: true` to a registration.
3. **Type Poisoning**: Sending `age: "one hundred"` (if age existed) or `committed: "yes"` (instead of boolean).
4. **ID Poisoning**: Creating a doc with ID `../../system/root`.
5. **PII Leak**: A signed-in user trying to `list` registrations they didn't create.
6. **State Skip**: (Not applicable as there's no status flow yet).
7. **Resource Exhaustion**: Sending a 1MB string for `fullName`.
8. **Email Spoofing (Admin)**: A user with `email_verified: false` but using an admin email.
9. **Admin Lockout**: Rules that accidentally prevent admins from seeing data.
10. **Immutable Field Change**: Trying to update `createdAt`.
11. **Orphaned Registration**: (Not applicable, it's a root collection).
12. **Null Values**: Sending `null` for required fields like `fullName`.

## 3. Test Runner (Draft)
```typescript
// firestore.rules.test.ts (logic plan)
// - Guest can CREATE a registration with valid fields.
// - Guest CANNOT READ/UPDATE/DELETE.
// - Verified Admin User CAN READ everything.
// - Unverified Admin User CANNOT READ.
// - Random Verified User CANNOT READ.
```
