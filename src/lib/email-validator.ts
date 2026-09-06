/**
 * Email Security & Disposable/Burner Domain Filter
 * Protects FixFlow from temporary, burner, throwaway, and fake email registrations.
 */

// Set of known disposable, temporary, and burner email provider domains
const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  // Popular burner & temp-mail domains
  "tempmail.com",
  "temp-mail.org",
  "tempmail.net",
  "tempmail.io",
  "temp-mail.io",
  "tempail.com",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "10minmail.com",
  "minutemail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "sharklasers.com",
  "grr.la",
  "guerrillamailblock.com",
  "pokemail.net",
  "spam4.me",
  "mailinator.com",
  "mailinator2.com",
  "mailinator.net",
  "notmailinator.com",
  "mailin8r.com",
  "throwawaymail.com",
  "throwaway.email",
  "trashmail.com",
  "trashmail.net",
  "trashmail.me",
  "trash-mail.com",
  "trashmail.de",
  "dispostable.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.fr.nf",
  "getairmail.com",
  "airmail.net",
  "burnermail.io",
  "burner.email",
  "burneremail.com",
  "burner.io",
  "inboxkitten.com",
  "mohmal.com",
  "mohmal.in",
  "mohmal.im",
  "mytemp.email",
  "mytempmail.com",
  "nada.ltd",
  "getnada.com",
  "abyssmail.com",
  "emailondeck.com",
  "emailondeck2.com",
  "fakeinbox.com",
  "maildrop.cc",
  "generator.email",
  "fakemailgenerator.com",
  "fakemail.net",
  "fakemail.org",
  "tmpmail.org",
  "tmpmail.net",
  "disposablemail.com",
  "disposable.email",
  "byom.de",
  "tempr.email",
  "discard.email",
  "discardmail.com",
  "dropmail.me",
  "10mail.org",
  "harakirimail.com",
  "tmailor.com",
  "spambox.us",
  "deadaddress.com",
  "anonymouse.org",
  "crazymailing.com",
  "crazymail.com",
  "zillamail.com",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "mailcatch.com",
  "filzmail.com",
  "incognitomail.org",
  "inboxbear.com",
  "mailnesia.com",
  "mytrashmail.com",
  "tempinbox.com",
  "mintemail.com",
  "meltmail.com",
  "spamex.com",
  "trashymail.com",
  "trashymail.net",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "einrot.com",
  "nowmymail.com",
  "spambog.com",
  "trashymail.org",
  "kasmail.com",
  "spamgourmet.com",
]);

// Fake / dummy / non-deliverable placeholder test domains
const FAKE_TEST_DOMAINS: ReadonlySet<string> = new Set([
  "fake.com",
  "fake.org",
  "dummy.com",
  "nowhere.com",
  "nowhere.org",
  "invalid.com",
  "test.com",
  "test.org",
  "test.net",
  "localhost",
  "invalid",
]);

// Substring patterns indicating temporary/burner infrastructure
const DISPOSABLE_PATTERNS = [
  /temp[-_.]?mail/i,
  /throwaway/i,
  /trash/i,
  /mailinator/i,
  /guerrilla/i,
  /dispostable/i,
  /disposable/i,
  /10minute/i,
  /minutemail/i,
  /burner/i,
  /sharklaser/i,
  /inboxkitten/i,
  /getnada/i,
  /emailondeck/i,
  /yopmail/i,
  /mohmal/i,
  /maildrop/i,
  /fakeinbox/i,
  /tmpmail/i,
  /fakemail/i,
  /wegwerfmail/i,
  /incognitomail/i,
  /generator.*mail/i,
  /spambox/i,
  /deadaddress/i,
];

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that an email is structurally sound and not from a disposable, temporary,
 * or burner email service.
 */
export function validateRealEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Please provide a valid email address." };
  }

  const normalized = email.trim().toLowerCase();

  // Basic RFC 5322 syntax check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return {
      isValid: false,
      error: "Please enter a properly formatted email address (e.g. yourname@gmail.com).",
    };
  }

  const parts = normalized.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Please provide a valid email address." };
  }

  const [localPart, domain] = parts;

  if (!localPart || !domain) {
    return { isValid: false, error: "Please provide a valid email address." };
  }

  if (localPart.length > 64) {
    return { isValid: false, error: "Email address prefix is too long." };
  }

  if (domain.length > 255) {
    return { isValid: false, error: "Email domain is too long." };
  }

  if (normalized.includes("..")) {
    return {
      isValid: false,
      error: "Email address cannot contain consecutive dots.",
    };
  }

  // TLD check (must be at least 2 alpha characters)
  const domainParts = domain.split(".");
  if (domainParts.some((part) => !part || part.startsWith("-") || part.endsWith("-"))) {
    return {
      isValid: false,
      error: "Please enter a valid email domain.",
    };
  }

  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { isValid: false, error: "Email domain must have a valid top-level domain." };
  }

  // Check against fake / dummy placeholder domains
  if (FAKE_TEST_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Test, dummy, or placeholder email domains are not permitted. Please use your real email address.",
    };
  }

  // Direct O(1) disposable domain check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Temporary, burner, or disposable email addresses are not permitted. Please use a permanent email address (e.g. Gmail, Outlook, Yahoo, or your official email).",
    };
  }

  // Check subdomains of known disposable providers (e.g., custom.mailinator.com)
  for (let i = 0; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join(".");
    if (DISPOSABLE_DOMAINS.has(parentDomain)) {
      return {
        isValid: false,
        error: "Temporary, burner, or disposable email addresses are not permitted. Please use a permanent email address.",
      };
    }
  }

  // Check heuristic patterns for unlisted burner domains
  for (const pattern of DISPOSABLE_PATTERNS) {
    if (pattern.test(domain)) {
      return {
        isValid: false,
        error: "Temporary, burner, or disposable email addresses are not permitted. Please use a permanent email address (e.g. Gmail, Outlook, Yahoo).",
      };
    }
  }

  return { isValid: true };
}
