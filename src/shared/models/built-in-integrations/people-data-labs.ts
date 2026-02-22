/**
 * Type definitions for People Data Labs API responses
 */

export interface PDLPersonResponse {
  status: number;
  likelihood: number; // Confidence score integer between 1 and 10
  data: PDLPerson;
  error?: {
    type: string;
    message: string;
  };
}

export interface PDLPerson {
  id: string;
  full_name: string;
  first_name: string;
  middle_initial?: string | null;
  middle_name?: string | null;
  last_initial?: string;
  last_name: string;
  sex?: string;
  birth_year?: number | boolean;
  birth_date?: string | boolean;
  linkedin_url?: string | null;
  linkedin_username?: string | null;
  linkedin_id?: string | null;
  facebook_url?: string | null;
  facebook_username?: string | null;
  facebook_id?: string | null;
  twitter_url?: string | null;
  twitter_username?: string | null;
  github_url?: string | null;
  github_username?: string | null;
  work_email?: string | boolean;
  personal_emails?: string[] | boolean;
  recommended_personal_email?: string | boolean;
  mobile_phone?: string | boolean;
  industry?: string | null;
  job_title?: string | null;
  job_title_role?: string | null;
  job_title_sub_role?: string | null;
  job_title_class?: string | null;
  job_title_levels?: string[];
  job_company_id?: string | null;
  job_company_name?: string | null;
  job_company_website?: string | null;
  job_company_size?: string | null;
  job_company_founded?: number | null;
  job_company_industry?: string | null;
  job_company_linkedin_url?: string | null;
  job_company_linkedin_id?: string | null;
  job_company_facebook_url?: string | null;
  job_company_twitter_url?: string | null;
  job_company_location_name?: string | null;
  job_company_location_locality?: string | null;
  job_company_location_metro?: string | null;
  job_company_location_region?: string | null;
  job_company_location_geo?: string | null;
  job_company_location_street_address?: string | null;
  job_company_location_address_line_2?: string | null;
  job_company_location_postal_code?: string | null;
  job_company_location_country?: string | null;
  job_company_location_continent?: string | null;
  job_last_changed?: string | null;
  job_last_verified?: string | null;
  job_start_date?: string | null;
  location_name?: string | boolean;
  location_locality?: string | boolean;
  location_metro?: string | boolean;
  location_region?: string | boolean;
  location_country?: string;
  location_continent?: string;
  location_street_address?: string | boolean;
  location_address_line_2?: string | null;
  location_postal_code?: string | boolean;
  location_geo?: string | boolean;
  location_last_updated?: string | null;
  phone_numbers?: string[] | boolean;
  emails?: string[] | boolean;
  interests?: string[];
  skills?: string[];
  location_names?: string[] | boolean;
  regions?: string[] | boolean;
  countries?: string[];
  street_addresses?: string[] | boolean;
  experience?: PDLExperience[];
  education?: PDLEducation[];
  profiles?: PDLProfile[];
  dataset_version?: string;
}

export interface PDLEducation {
  school: {
    name: string;
    type?: string | null;
    id?: string | null;
    location?: {
      name: string;
      locality: string;
      region: string;
      country: string;
      continent: string;
    } | null;
    linkedin_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    linkedin_id?: string | null;
    website?: string | null;
    domain?: string | null;
  };
  degrees?: string[];
  start_date?: string | null;
  end_date?: string | null;
  majors?: string[];
  minors?: string[];
  gpa?: number | null;
  summary?: string | null;
}

export interface PDLExperience {
  company: {
    name: string;
    size?: string | null;
    id?: string | null;
    founded?: number | null;
    industry?: string | null;
    location?: {
      name: string;
      locality: string;
      region: string;
      metro?: string | null;
      country: string;
      continent: string;
      street_address?: string | null;
      address_line_2?: string | null;
      postal_code?: string | null;
      geo: string;
    } | null;
    linkedin_url?: string | null;
    linkedin_id?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    website?: string | null;
    ticker?: string | null;
    type?: string | null;
    // raw?: string[];
  };
  location_names?: string[];
  end_date?: string | null;
  start_date?: string | null;
  title: {
    name: string;
    class?: string | null;
    role?: string | null;
    sub_role?: string | null;
    levels?: string[];
  };
  is_primary?: boolean;
  summary?: string | null;
}

export interface PDLProfile {
  network: string;
  id?: string | null;
  url: string;
  username: string;
  first_seen?: string;
  last_seen?: string;
  num_sources?: number;
}

export interface PDLPhone {
  number: string;
  first_seen: string;
  last_seen: string;
  num_sources: number;
}

export interface PDLEmail {
  address: string;
  type: string;
  first_seen?: string | null;
  last_seen?: string | null;
  num_sources?: number | null;
}

export interface PDLLanguage {
  name: string;
  proficiency?: number | null;
}

export interface PDLStreetAddress {
  name: string;
  locality: string;
  metro?: string | null;
  region: string;
  country: string;
  continent: string;
  street_address?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  geo?: string | null;
  first_seen?: string | null;
  last_seen?: string | null;
  num_sources?: number | null;
}

export interface PDLCertification {
  name: string;
  organization: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface PDLJobHistory {
  company_id: string;
  company_name: string;
  title: string;
  first_seen: string;
  last_seen: string;
  num_sources: number;
}

// List of supported social profiles:
// acebook
// linkedin
// twitter
// xing
// indeed
// meetup
// github
// instagram
// quora
// stackoverflow
// gravatar
// angellist
// youtube
// klout
// foursquare
// crunchbase
// pinterest
// dribbble
// vimeo
// flickr
// aboutme
// google
// wordpress
// myspace
// behance
// soundcloud
// reddit
// gitlab
// ello
// medium
export interface PDLPersonIdentifyInput {
  first_name?: string; // If provided, last_name must be provided
  last_name?: string; // If provided, first_name must be provided
  company?: string;
  school?: string;
  title?: string;
  location?: string; // The location where a person lives. This can be anything from a street address to a country name.
  phone?: string;
  email?: string;
  email_hash?: string; // The SHA-256 or MD5 email hash for an email the person has used.
  profile?: string; // A social profile that the person has used (e.g. https://www.linkedin.com/in/john-doe) (see list of supported social profiles above)
  birth_date?: string; // year or YYYY-MM-DD
  include_if_matched?: boolean; // If true the response will include the field matches.matched_on that contains a list of every query input that matched this profile.
  street_address?: string; // The street address of the person. (e.g. 1234 Main Street)
  locality?: string; // The locality where the person lives.	(e.g. Boise)
  region?: string; // The state or region where the person lives.	(e.g. Idaho)
  postal_code?: string; // The postal code where the person lives. If there is no value for country, the postal code is assumed to be US. (e.g. 83704)
  name?: string; // The person's full name, at least the first and last.	(e.g. Jennifer C. Jackson)
  lid?: string; // The person's LinkedIn ID.	(e.g. 145991517)
}

export interface PDLPersonIdentifyData {
  // Identifiers
  id: string;
  first_name: string;
  full_name: string;
  last_initial?: string | null;
  last_name: string;
  middle_initial?: string | null;
  middle_name?: string | null;
  name_aliases?: string[];

  // Contact Information
  emails?: PDLEmail[];
  mobile_phone?: string | null;
  personal_emails?: string[];
  phone_numbers?: string[];
  phones?: PDLPhone[];
  recommended_personal_email?: string | null;
  work_email?: string | null;

  // Current Company
  job_company_12mo_employee_growth_rate?: number | null;
  job_company_facebook_url?: string | null;
  job_company_founded?: number | null;
  job_company_employee_count?: number | null;
  job_company_id?: string | null;
  job_company_industry?: string | null;
  job_company_inferred_revenue?: string | null;
  job_company_linkedin_id?: string | null;
  job_company_linkedin_url?: string | null;
  job_company_location_address_line_2?: string | null;
  job_company_location_continent?: string | null;
  job_company_location_country?: string | null;
  job_company_location_geo?: string | null;
  job_company_location_locality?: string | null;
  job_company_location_metro?: string | null;
  job_company_location_name?: string | null;
  job_company_location_postal_code?: string | null;
  job_company_location_region?: string | null;
  job_company_location_street_address?: string | null;
  job_company_name?: string | null;
  job_company_size?: string | null;
  job_company_ticker?: string | null;
  job_company_total_funding_raised?: number | null;
  job_company_twitter_url?: string | null;
  job_company_type?: string | null;
  job_company_website?: string | null;

  // Current Job
  inferred_salary?: string | null;
  job_last_changed?: string | null;
  job_last_verified?: string | null;
  job_onet_broad_occupation?: string | null;
  job_onet_code?: string | null;
  job_onet_major_group?: string | null;
  job_onet_minor_group?: string | null;
  job_onet_specific_occupation?: string | null;
  job_onet_specific_occupation_detail?: string | null;
  job_start_date?: string | null;
  job_summary?: string | null;
  job_title?: string | null;
  job_title_class?: string | null;
  job_title_levels?: string[];
  job_title_role?: string | null;
  job_title_sub_role?: string | null;

  // Demographics
  birth_date?: string | null;
  birth_year?: number | null;
  sex?: string | null;
  languages?: PDLLanguage[];

  // Education
  education?: PDLEducation[];

  // Location
  countries?: string[];
  location_address_line_2?: string | null;
  location_continent?: string | null;
  location_country?: string | null;
  location_geo?: string | null;
  location_last_updated?: string | null;
  location_locality?: string | null;
  location_metro?: string | null;
  location_name?: string | null;
  location_names?: string[];
  location_postal_code?: string | null;
  location_region?: string | null;
  location_street_address?: string | null;
  regions?: string[];
  street_addresses?: PDLStreetAddress[];

  // Lower Confidence Data
  possible_birth_dates?: string[];
  possible_emails?: PDLEmail[];
  possible_location_names?: string[];
  possible_phones?: PDLPhone[];
  possible_profiles?: PDLProfile[];
  possible_street_addresses?: PDLStreetAddress[];

  // Social Presence
  facebook_friends?: number | null;
  facebook_id?: string | null;
  facebook_url?: string | null;
  facebook_username?: string | null;
  github_url?: string | null;
  github_username?: string | null;
  linkedin_connections?: number | null;
  linkedin_id?: string | null;
  linkedin_url?: string | null;
  linkedin_username?: string | null;
  profiles?: PDLProfile[];
  twitter_url?: string | null;
  twitter_username?: string | null;

  // Work History
  certifications?: PDLCertification[];
  experience?: PDLExperience[];
  headline?: string | null;
  industry?: string | null;
  inferred_years_experience?: number | null;
  interests?: string[];
  job_history?: PDLJobHistory[];
  skills?: string[];
  summary?: string | null;

  // PDL Record Information & Metadata
  dataset_version?: string | null;
  first_seen?: string | null;
  num_records?: number | null;
  num_sources?: number | null;
  operation_id?: string | null;
}

export interface PDLPersonMatch {
  data: PDLPersonIdentifyData;
  match_score: number;
  matched_on?: string[];
}

export interface PDLPersonIdentifyResponse {
  status: number;
  matches: PDLPersonMatch[];
  error?: {
    type: string;
    message: string;
  };
}
