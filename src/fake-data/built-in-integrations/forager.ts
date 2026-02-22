import { ForagerPersonalEmailLookup } from "@/shared/models/built-in-integrations/forager";

export const fakeForagerPersonalEmailLookup: ForagerPersonalEmailLookup[] = [
  {
    email: "sarah.johnson@techcorp.com",
    email_type: "personal",
    validation_status: "valid",
  },
  {
    email: "sarah.j@ai-startup.io",
    email_type: "work",
    validation_status: "risky",
  },
  {
    email: "sarah.johnson@gmail.com",
    email_type: "personal",
    validation_status: "invalid",
  },
];
