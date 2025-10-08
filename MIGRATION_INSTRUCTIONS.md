# Migration Instructions for Production (Render)

## Context
The deployment is failing because the production database needs to run migrations to create the new tables for the beta keys and multi-tenant architecture.

## New Tables Created
1. **tenants** - Stores business information for each registered organization
2. **beta_keys** - Manages beta access keys for registration

## Modified Tables
- **users** - Added fields: `tenantId`, `isOwner`, `documentId`, `phoneNumber`

## How to Run Migration in Render

### Option 1: Via Render Shell (Recommended)
1. Go to your Render dashboard
2. Navigate to your backend service (nexopos-backend)
3. Click on "Shell" tab
4. Run the following command:
   ```bash
   npm run migration:run
   ```

### Option 2: Via Manual Connection
If shell is not available, connect to your Render PostgreSQL database and run the migration SQL manually.

### Option 3: Temporary Enable DB_SYNC
**WARNING: Not recommended for production, use only if migrations fail**

1. In Render dashboard, go to your backend service
2. Go to Environment tab
3. Set `DB_SYNC=true` (temporarily)
4. Trigger a new deployment
5. **IMPORTANT**: After deployment succeeds, immediately set `DB_SYNC=false` and redeploy

## Verification Steps
After running the migration:

1. Check that tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('tenants', 'beta_keys');
   ```

2. Verify users table was modified:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users'
   AND column_name IN ('tenantId', 'isOwner', 'documentId', 'phoneNumber');
   ```

3. Test the API endpoints:
   - GET /api/beta-keys/validate/BETA-TEST-12345 (should return valid: false)
   - POST /api/auth/register (with valid beta key)

## Rollback (if needed)
If something goes wrong, run:
```bash
npm run migration:revert
```

This will undo the last migration.

## Notes
- The migration is idempotent and safe to run multiple times
- Foreign key constraints ensure data integrity
- Indices are created for better query performance
- The migration supports both up and down operations

## Migration File
Location: `backend/src/migrations/1728347000000-AddBetaKeysAndTenants.ts`
