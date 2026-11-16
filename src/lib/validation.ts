// =============================================================================
// UTARE ZEM AI — User Input Validation & Security Engine
// =============================================================================
// Provides strict email format verification, disposable domain rejection,
// and robust password strength evaluation.
// =============================================================================

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0: None, 1: Weak, 2: Fair, 3: Good, 4: Strong
  label: "Too Weak" | "Weak" | "Fair" | "Good" | "Strong";
  requirements: PasswordRequirement[];
  error?: string;
}

// Disallow obvious test/disposable/garbage email domains
const BLOCKED_DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "trashmail.com",
  "throwawaymail.com",
  "fake.com",
  "fake.org",
  "test.com",
  "test.org",
  "asdf.com",
  "nowhere.com",
  "invalid.com",
  "example.com", // allow only our specific hardcoded demo candidate demo@utarezem.ai
  "dispostable.com",
  "yopmail.com",
  "sharklasers.com",
  "temp-mail.org",
  "example.org",
  "example.net",
  "guerrillamail.net",
  "getnada.com",
  "maildrop.cc",
  "mailnesia.com",
  "fakeinbox.com",
  "emailondeck.com",
  "mintemail.com",
  "tempail.com",
  "burnermail.io",
  "mohmal.com",
  "tempmailo.com",
  "moakt.com",
]);

/**
 * Validates candidate and administrator email addresses.
 * Rejects malformed addresses, missing TLDs, and disposable domains.
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email address is required." };
  }

  const trimmed = email.trim().toLowerCase();

  // Special exemption for platform demo accounts
  if (
    trimmed === "demo@utarezem.ai" ||
    trimmed === "demo@utaresizedu.ai" ||
    trimmed === "tatenda.moyo@example.co.zw" ||
    trimmed === "admin@utare.co.zw"
  ) {
    return { isValid: true };
  }

  // Length limits
  if (trimmed.length < 6 || trimmed.length > 254) {
    return { isValid: false, error: "Email must be between 6 and 254 characters." };
  }

  // Formal RFC 5322 compliant pattern
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Please enter a valid email format (e.g., name@domain.com).",
    };
  }

  const [localPart, domainPart] = trimmed.split("@");

  if (!localPart || localPart.length < 2) {
    return {
      isValid: false,
      error: "Email username before @ must be at least 2 characters.",
    };
  }

  if (!domainPart || !domainPart.includes(".")) {
    return {
      isValid: false,
      error: "Email domain must include a valid extension (e.g. .com, .co.zw).",
    };
  }

  const domainSegments = domainPart.split(".");
  const tld = domainSegments[domainSegments.length - 1];

  // Top level domain must be at least 2 alpha characters
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return {
      isValid: false,
      error: "Email must end with a valid domain extension (e.g. .com, .org, .co.zw).",
    };
  }

  // Check against disposable throwaway domains
  if (BLOCKED_DISPOSABLE_DOMAINS.has(domainPart)) {
    return {
      isValid: false,
      error: "Temporary or disposable email domains are not accepted. Please use a permanent address.",
    };
  }

  // Check for common spam username prefixes
  if (
    (localPart === "test" ||
      localPart === "asdf" ||
      localPart === "fake" ||
      localPart === "user") &&
    domainPart.startsWith("test")
  ) {
    return {
      isValid: false,
      error: "Please provide a real candidate email address.",
    };
  }

  return { isValid: true };
}

/**
 * Evaluates password strength against 4 core security standards.
 * Minimum threshold for registration: Score >= 3 (Good) and meets all 4 rules.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const p = password || "";

  const hasMinLength = p.length >= 8;
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p);

  const requirements: PasswordRequirement[] = [
    {
      id: "length",
      label: "At least 8 characters",
      met: hasMinLength,
    },
    {
      id: "casing",
      label: "Uppercase & lowercase letters",
      met: hasLower && hasUpper,
    },
    {
      id: "number",
      label: "At least 1 number (0–9)",
      met: hasNumber,
    },
    {
      id: "symbol",
      label: "At least 1 symbol (!@#$%...)",
      met: hasSymbol,
    },
  ];

  let passedCount = requirements.filter((r) => r.met).length;

  // Extra boost if 12+ characters
  if (p.length >= 12 && passedCount === 4) {
    passedCount = 4;
  }

  let label: PasswordValidationResult["label"] = "Too Weak";
  if (p.length === 0) {
    label = "Too Weak";
  } else if (passedCount <= 1) {
    label = "Weak";
  } else if (passedCount === 2) {
    label = "Fair";
  } else if (passedCount === 3) {
    label = "Good";
  } else if (passedCount >= 4) {
    label = "Strong";
  }

  const isValid = hasMinLength && hasLower && hasUpper && hasNumber && hasSymbol;

  let error: string | undefined;
  if (!isValid && p.length > 0) {
    if (!hasMinLength) {
      error = "Password must be at least 8 characters.";
    } else if (!hasLower || !hasUpper) {
      error = "Password must include both uppercase and lowercase letters.";
    } else if (!hasNumber) {
      error = "Password must include at least one number.";
    } else if (!hasSymbol) {
      error = "Password must include at least one special character.";
    }
  }

  return {
    isValid,
    score: passedCount,
    label,
    requirements,
    error,
  };
}
