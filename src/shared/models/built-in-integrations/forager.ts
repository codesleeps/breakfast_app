export interface ForagerPersonalEmailLookupInput {
  /**
   * Forager’s internal person ID - unknown to us
   */
  person_id?: string;
  /**
   * The slug from a LinkedIn personal profile URL
   * Example: https://www.linkedin.com/in/jane-doe/ will be jane-doe
   */
  linkedin_public_identifier: string;
}

export interface ForagerPersonalEmailLookup {
  email: string;
  email_type: string;
  validation_status: "valid" | "risky" | "invalid" | "unknown";
}
