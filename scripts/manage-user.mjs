#!/usr/bin/env node
// =============================================================================
// UTARE ZEM AI — Backend User & Role Management CLI (v2)
// =============================================================================
// Creates, promotes, demotes, and lists user accounts across Candidate,
// Employer, Admin, and Superuser roles.
//
// Because `admin` and `superuser` roles can NEVER be self-assigned from the
// public signup UI, use this backend script to provision facilitator/admin
// accounts or promote existing accounts.
//
// Usage inside Docker or host:
//   node scripts/manage-user.mjs create --email admin@utare-zem.org --password "<StrongPass>" --name "Stewart Mangezi" --role superuser
//   node scripts/manage-user.mjs promote --email munashe@utare-zem.org --role admin
//   node scripts/manage-user.mjs demote --email user@example.com --role candidate
//   node scripts/manage-user.mjs list
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

const VALID_ROLES = ["candidate", "employer", "admin", "superuser"];
const KEY_LEN = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function parseArgs(argv) {
  const [, , command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[++i] : "true";
      flags[key] = val;
    }
  }
  return { command, flags };
}

const storePath = path.join(process.cwd(), ".data", "utare-store.json");

function loadStore() {
  try {
    if (fs.existsSync(storePath)) {
      const parsed = JSON.parse(fs.readFileSync(storePath, "utf-8"));
      if (!parsed.users) parsed.users = [];
      return parsed;
    }
  } catch {}
  return {
    activeCandidateId: null,
    users: [],
    candidates: [],
    hubs: [],
    coaches: [],
    jobs: [],
    applications: [],
    employerRegistrations: [],
    skillsCourses: [],
    contactMessages: [],
  };
}

function saveStore(state) {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(storePath, JSON.stringify(state, null, 2), "utf-8");
}

async function syncToSupabaseAdmin({ email, password, name, role, company }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || !url.startsWith("http")) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      const { data } = await admin.auth.admin.updateUserById(existing.id, {
        ...(password ? { password } : {}),
        email_confirm: true,
        app_metadata: { ...(existing.app_metadata || {}), role },
        user_metadata: {
          ...(existing.user_metadata || {}),
          ...(name ? { full_name: name } : {}),
          ...(company ? { company_name: company } : {}),
        },
      });
      return data?.user?.id || existing.id;
    } else if (password) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: {
          full_name: name || email.split("@")[0],
          ...(company ? { company_name: company } : {}),
        },
      });
      if (error) {
        console.warn("[Supabase Admin Warning]:", error.message);
        return null;
      }
      return data?.user?.id || null;
    }
  } catch (err) {
    console.warn("[Supabase Sync Skipped]:", err.message);
  }
  return null;
}

async function main() {
  const { command, flags } = parseArgs(process.argv);

  if (!command || command === "help" || command === "--help") {
    console.log(`
Utare ZEM AI — Backend User & Role CLI
Commands:
  create   --email <email> --password <password> --name "<Name>" --role <candidate|employer|admin|superuser> [--company "<Company>"]
  promote  --email <email> --role <admin|superuser|employer|candidate>
  demote   --email <email> [--role candidate]
  list
`);
    process.exit(0);
  }

  const state = loadStore();

  if (command === "list") {
    if (!state.users || state.users.length === 0) {
      console.log("No users registered in store yet.");
      return;
    }
    console.table(
      state.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        confirmed: u.emailConfirmed,
        company: u.companyName || "-",
      }))
    );
    return;
  }

  const email = (flags.email || "").trim().toLowerCase();
  if (!email) {
    console.error("Error: --email is required.");
    process.exit(1);
  }

  if (command === "create") {
    const password = flags.password || "";
    const role = (flags.role || "candidate").toLowerCase();
    const name = flags.name || email.split("@")[0];
    const companyName = flags.company || undefined;

    if (!VALID_ROLES.includes(role)) {
      console.error(`Error: --role must be one of: ${VALID_ROLES.join(", ")}`);
      process.exit(1);
    }
    if (!password || password.length < 8) {
      console.error("Error: --password (at least 8 characters) is required for create.");
      process.exit(1);
    }

    const supabaseId = await syncToSupabaseAdmin({
      email,
      password,
      name,
      role,
      company: companyName,
    });

    const existingIdx = state.users.findIndex(
      (u) => u.email.toLowerCase() === email
    );

    const record = {
      id:
        supabaseId ||
        (existingIdx >= 0 ? state.users[existingIdx].id : `usr-${Date.now()}`),
      email,
      name,
      role,
      passwordHash: hashPassword(password),
      emailConfirmed: true,
      ...(role === "employer" ? { orgRole: "org_admin" } : {}),
      ...(companyName ? { companyName } : {}),
      createdAt:
        existingIdx >= 0
          ? state.users[existingIdx].createdAt
          : new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      state.users[existingIdx] = record;
    } else {
      state.users.unshift(record);
    }

    if (role === "employer" && companyName) {
      if (!state.employerRegistrations) state.employerRegistrations = [];
      const empIdx = state.employerRegistrations.findIndex(
        (e) => e.email.toLowerCase() === email
      );
      const empRec = {
        id:
          empIdx >= 0
            ? state.employerRegistrations[empIdx].id
            : `emp-${Date.now()}`,
        userId: record.id,
        companyName,
        contactPerson: name,
        email,
        industry: "Technology & Operations",
        rolesInterested: ["Remote Operations", "Software & Data"],
        hiringModel: "100% Remote Contract",
        estimatedHires: 2,
        timezoneOverlapNeeded: "CAT (GMT+2)",
        verificationStatus: "verified",
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      if (empIdx >= 0) {
        state.employerRegistrations[empIdx] = empRec;
      } else {
        state.employerRegistrations.unshift(empRec);
      }
    }

    saveStore(state);
    console.log(`✓ Provisioned ${role} account: ${email} (${name})`);
    return;
  }

  if (command === "promote" || command === "demote") {
    const role = (
      flags.role || (command === "demote" ? "candidate" : "admin")
    ).toLowerCase();

    if (!VALID_ROLES.includes(role)) {
      console.error(`Error: --role must be one of: ${VALID_ROLES.join(", ")}`);
      process.exit(1);
    }

    const user = state.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      console.error(`Error: No user found with email ${email}. Run 'create' first.`);
      process.exit(1);
    }

    user.role = role;
    user.emailConfirmed = true;
    await syncToSupabaseAdmin({ email, name: user.name, role });
    saveStore(state);
    console.log(`✓ Updated ${email} role -> ${role}`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main();
