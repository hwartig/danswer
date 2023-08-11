export interface User {
  id: string;
  email: string;
  is_active: string;
  is_superuser: string;
  is_verified: string;
  role: "basic" | "admin";
}

export type ValidSources =
  | "web"
  | "github"
  | "slack"
  | "google_drive"
  | "bookstack"
  | "confluence"
  | "contentful"
  | "jira"
  | "productboard"
  | "slab"
  | "notion"
  | "guru"
  | "file";
export type ValidInputTypes = "load_state" | "poll" | "event";
export type ValidStatuses =
  | "success"
  | "failed"
  | "in_progress"
  | "not_started";

// CONNECTORS
export interface ConnectorBase<T> {
  name: string;
  input_type: ValidInputTypes;
  source: ValidSources;
  connector_specific_config: T;
  refresh_freq: number | null;
  disabled: boolean;
}

export interface Connector<T> extends ConnectorBase<T> {
  id: number;
  credential_ids: number[];
  time_created: string;
  time_updated: string;
}

export interface WebConfig {
  base_url: string;
}

export interface GithubConfig {
  repo_owner: string;
  repo_name: string;
}

export interface GoogleDriveConfig {
  folder_paths?: string[];
  include_shared?: boolean;
}

export interface BookstackConfig {}

export interface ConfluenceConfig {
  wiki_page_url: string;
}

export interface ContentfulConfig {
  space: string;
  environment: string;
}

export interface JiraConfig {
  jira_project_url: string;
}

export interface ProductboardConfig {}

export interface SlackConfig {
  workspace: string;
  channels?: string[];
}

export interface SlabConfig {
  base_url: string;
}

export interface GuruConfig {}

export interface FileConfig {
  file_locations: string[];
}

export interface NotionConfig {}

export interface ConnectorIndexingStatus<
  ConnectorConfigType,
  ConnectorCredentialType
> {
  connector: Connector<ConnectorConfigType>;
  credential: Credential<ConnectorCredentialType>;
  public_doc: boolean;
  owner: string;
  last_status: ValidStatuses | null;
  last_success: string | null;
  docs_indexed: number;
  deletion_attempts: DeletionAttemptSnapshot[];
  is_deletable: boolean;
}

// CREDENTIALS
export interface CredentialBase<T> {
  credential_json: T;
  public_doc: boolean;
}

export interface Credential<T> extends CredentialBase<T> {
  id: number;
  user_id: number | null;
  time_created: string;
  time_updated: string;
}

export interface GithubCredentialJson {
  github_access_token: string;
}

export interface ContentfulCredentialJson {
  contentful_cma_token: string;
}

export interface BookstackCredentialJson {
  bookstack_base_url: string;
  bookstack_api_token_id: string;
  bookstack_api_token_secret: string;
}

export interface ConfluenceCredentialJson {
  confluence_username: string;
  confluence_access_token: string;
}

export interface JiraCredentialJson {
  jira_user_email: string;
  jira_api_token: string;
}

export interface ProductboardCredentialJson {
  productboard_access_token: string;
}

export interface SlackCredentialJson {
  slack_bot_token: string;
}

export interface GoogleDriveCredentialJson {
  google_drive_tokens: string;
}

export interface SlabCredentialJson {
  slab_bot_token: string;
}

export interface NotionCredentialJson {
  notion_integration_token: string;
}
export interface GuruCredentialJson {
  guru_user: string;
  guru_user_token: string;
}

// DELETION

export interface DeletionAttemptSnapshot {
  connector_id: number;
  status: ValidStatuses;
  error_msg?: string;
  num_docs_deleted: number;
}
