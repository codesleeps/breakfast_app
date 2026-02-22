import { integrationsClient } from "@/client-lib/shared";

export function runDataQuery(dataQueryName: string) {
  return integrationsClient.post(`/data-queries/run`, {
    dataQueryName,
  });
}
