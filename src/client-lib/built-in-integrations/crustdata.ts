import { integrationsClient, showFakeData } from "@/client-lib/shared";
import { fakeCrustdataPersonProfile } from "@/fake-data/built-in-integrations/crustdata";
import type {
  CrustdataEnrichmentApiQueryParams,
  CrustdataPersonProfile,
} from "@/shared/models/built-in-integrations/crustdata";
import { buildQueryParams } from "@/shared/utils";

/**
 * Enrich a person's data using Crustdata API
 * @param searchParams
 * @note Important: if you provide business_email they can't be personal emails like john@gmail.com, only business emails are allowed like john@company.com
 * @returns Enriched person data from Crustdata
 */
export function useCrustdataEnrichPerson(searchParams: CrustdataEnrichmentApiQueryParams) {
  if (showFakeData) {
    return Promise.resolve(fakeCrustdataPersonProfile);
  }

  const params = buildQueryParams(searchParams as unknown as Record<string, unknown>);

  return integrationsClient
    .get<CrustdataPersonProfile[]>(`/integrations/crustdata/enrich-person?${params}`)
    .then((res) => res.data);
}
