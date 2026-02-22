import { integrationsClient, showFakeData } from "@/client-lib/shared";
import { fakeForagerPersonalEmailLookup } from "@/fake-data/built-in-integrations/forager";
import type {
  ForagerPersonalEmailLookup,
  ForagerPersonalEmailLookupInput,
} from "@/shared/models/built-in-integrations/forager";

export function foragerPersonalEmailsLookup(input: ForagerPersonalEmailLookupInput) {
  if (showFakeData) {
    return Promise.resolve(fakeForagerPersonalEmailLookup);
  }

  return integrationsClient
    .post<ForagerPersonalEmailLookup[]>(`/integrations/forager/personal-emails-lookup`, input)
    .then((res) => res.data);
}
