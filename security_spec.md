# Security Specification - PrankMaster

## Data Invariants
1. A prank link must have a valid ID string.
2. Global settings can only be modified by the admin.
3. Links are publicly createable but only admin-deletable.

## The Dirty Dozen Payloads
1. **Unauthenticated Settings Change**: Attempt to update `imageUrl` without being admin. -> `PERMISSION_DENIED`
2. **Settings Shadow Update**: Attempt to add `isAdmin: true` to settings document. -> `PERMISSION_DENIED`
3. **Invalid ID Poisoning**: Create a link with a 2KB ID string. -> `PERMISSION_DENIED`
4. **Timestamp Spoofing**: Set `createdAt` to a future date instead of `request.time`. -> `PERMISSION_DENIED`
5. **Role Escalation**: Attempt to create a document in `/admins/`. -> `PERMISSION_DENIED`
6. **Setting Deletion**: Attempt to delete the config document. -> `PERMISSION_DENIED`
7. **Junk Fields in Link**: Add `maliciousCode: "..."` to a new link. -> `PERMISSION_DENIED`
8. **Owner Spoofing**: Attempt to set `clicks` to 9999 as a public user. -> `PERMISSION_DENIED`
9. **Link ID Reuse**: Attempt to overwrite an existing link. -> `PERMISSION_DENIED` (handled by create only)
10. **Admin Email Spoofing**: Register with admin email but `email_verified: false`. -> `PERMISSION_DENIED` (rules will check verification)
11. **Settings Read Restriction**: (Actually setting needs to be readable by prank recipients)
12. **Mass Link Deletion**: Unauthenticated user tries to delete `/links/`. -> `PERMISSION_DENIED`

## Test Runner
I will verify these patterns in the rules.
