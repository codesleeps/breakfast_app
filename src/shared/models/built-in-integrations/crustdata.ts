/**
 * Type definitions for CrustdataAPI responses
 */

/**
 * You must provide at least one of linkedin_profile_url or business_email
 */
export interface CrustdataEnrichmentApiQueryParams {
  /**
   * Comma-separated list of LinkedIn profile URLs.
   */
  linkedin_profile_url?: string;
  /**
   * Comma-separated list of business email addresses.
   */
  business_email?: string;
  /**
   * If set to true, performs a real-time search from the web if data is not found in the database.
   */
  enrich_realtime?: boolean;
  /**
   * Comma-separated list of fields to return.
   */
  fields?: string;
}

export interface CrustdataEnrichmentApiResponse {
  profiles: CrustdataPersonProfile[];
  error?: string;
}

interface CrustdataEmployer {
  employer_name?: string;
  employer_linkedin_id?: string;
  employer_logo_url?: string;
  employer_linkedin_description?: string;
  employer_company_id?: number[];
  employer_company_website_domain?: string[];
  employee_position_id?: number;
  employee_title?: string;
  employee_description?: string;
  employee_location?: string;
  start_date?: string;
  end_date?: string;
}

interface CrustdataEducation {
  degree_name?: string;
  institute_name?: string;
  institute_linkedin_id?: string;
  institute_linkedin_url?: string;
  institute_logo_url?: string;
  field_of_study?: string;
  activities_and_societies?: string;
  start_date?: string;
  end_date?: string;
}

export interface CrustdataPersonProfile {
  linkedin_profile_url?: string;
  linkedin_flagship_url?: string;
  name?: string;
  location?: string;
  email?: string;
  title?: string;
  last_updated?: string;
  headline?: string;
  summary?: string;
  num_of_connections?: number;
  profile_picture_url?: string;
  profile_picture_permalink?: string;
  twitter_handle?: string;
  languages?: string[];
  enriched_realtime?: boolean;
  business_email?: string[];
  query_linkedin_profile_urn_or_slug?: string[];
  skills?: string[];
  all_employers?: CrustdataEmployer[];
  all_employers_company_id?: number[];
  all_titles?: string[];
  all_schools?: string[];
  all_degrees?: string[];
  current_employers?: CrustdataEmployer[];
  past_employers?: CrustdataEmployer[];
  education_background?: CrustdataEducation[];
  person_id?: number;
  score?: number;
}
