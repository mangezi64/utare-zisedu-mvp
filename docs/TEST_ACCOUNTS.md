# Utare ZEM AI — Internal Role Provisioning & Test Accounts Guide

> **Security Policy:** Passwords must **never** be committed to the repository. Public sign-up (`/login?tab=register` and `/employers`) can only create `candidate` or `employer` accounts. Facilitator (`admin`) and `superuser` roles can only be assigned from the backend.

## Roles Overview

| Role | Self-Sign-Up Allowed? | Capabilities |
| --- | --- | --- |
| `candidate` | Yes (with email confirmation) | Readiness diagnostic, AI career pathway, partner hub booking, CV studio, job applications |
| `employer` | Yes (with email confirmation + one-time admin verification) | Employer Portal (`/employer`): post & archive roles, view scoped applicants for own roles only, update applicant status |
| `admin` | **No** (Backend CLI / Superuser only) | Facilitator Console (`/admin`): verify employers, moderate jobs, enlist partner hubs, review candidate cohorts |
| `superuser` | **No** (Backend CLI only) | All `admin` capabilities + promote/demote any user account role in `/admin` (`User Roles` tab) |

## Provisioning Accounts via Backend CLI

Use `scripts/manage-user.mjs` inside the container or on the server to create or promote accounts. When `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, the script updates Supabase Auth (`app_metadata.role`) as well as the application database.

### 1. Create a Superuser or Admin Account

```bash
docker compose exec web node scripts/manage-user.mjs create \
  --email stewart@utare-zem.org \
  --password "<STRONG_PASSWORD_FROM_PASSWORD_MANAGER>" \
  --name "Stewart Mangezi" \
  --role superuser
```

```bash
docker compose exec web node scripts/manage-user.mjs create \
  --email munashe@utare-zem.org \
  --password "<STRONG_PASSWORD_FROM_PASSWORD_MANAGER>" \
  --name "Munashe Mugonda" \
  --role admin
```

### 2. Create a Verified Employer Test Account

```bash
docker compose exec web node scripts/manage-user.mjs create \
  --email hiring@savannahtech.co.uk \
  --password "<STRONG_PASSWORD_FROM_PASSWORD_MANAGER>" \
  --name "Sarah Jenkins" \
  --company "Savannah Tech Labs UK" \
  --role employer
```

### 3. Promote or Demote an Existing Account

```bash
# Promote an existing account to admin
docker compose exec web node scripts/manage-user.mjs promote \
  --email facilitator@utare-zem.org \
  --role admin

# Demote an account back to candidate
docker compose exec web node scripts/manage-user.mjs demote \
  --email facilitator@utare-zem.org \
  --role candidate
```

### 4. List Registered Accounts

```bash
docker compose exec web node scripts/manage-user.mjs list
```
