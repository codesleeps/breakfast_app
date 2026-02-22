import { integrationsClient, showFakeData } from "@/client-lib/shared";
import {
  fakePDLPersonIdentifyResponse,
  fakePDLPersonResponse,
} from "@/fake-data/built-in-integrations/people-data-labs";
import type {
  PDLPersonIdentifyInput,
  PDLPersonIdentifyResponse,
  PDLPersonResponse,
} from "@/shared/models/built-in-integrations/people-data-labs";

/**
 * Enrich a person's data using People Data Labs API
 * @param email
 * @returns Enriched person data from People Data Labs
 */
export function enrichPerson(email: string) {
  if (showFakeData) {
    return Promise.resolve(fakePDLPersonResponse);
  }
  return integrationsClient
    .post<PDLPersonResponse>("/integrations/people-data-labs/enrich-person", {
      email,
    })
    .then((res) => res.data);
}

/**
 * Identify/find people using People Data Labs Person Identify API
 * This is their Email Finder functionality that returns matches with scores
 * @param searchParams Search parameters for identifying people
 * @returns Search results with match scores from People Data Labs
 */
export function identifyPerson(searchParams: PDLPersonIdentifyInput) {
  if (showFakeData) {
    return Promise.resolve(fakePDLPersonIdentifyResponse);
  }
  return integrationsClient
    .post<PDLPersonIdentifyResponse>("/integrations/people-data-labs/person-identify", searchParams)
    .then((res) => res.data);
}
