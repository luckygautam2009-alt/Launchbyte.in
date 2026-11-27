export type OpportunityType =
  | "internship"
  | "job"
  | "fellowship"
  | "scholarship"
  | "grant"
  | "hackathon"
  | "competition"
  | "program"
  | "event"
  | "other";

export type LocationType = "remote" | "onsite" | "hybrid";

export type CompensationType =
  | "paid"
  | "unpaid"
  | "stipend"
  | "funded"
  | "prize"
  | "unspecified";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "flagged"
  | "rejected";

export type OpportunityStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "closed"
  | "archived"
  | "rejected";

export type UserRole = "user" | "organizer" | "moderator" | "admin";

export interface OrganizationBrief {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  verification_status: VerificationStatus;
}

export interface TagRead {
  name: string;
  slug: string;
  count?: number;
}

export interface OpportunityListItem {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  type: OpportunityType;
  location_type?: LocationType | null;
  location_text?: string | null;
  country_code?: string | null;
  deadline_at?: string | null;
  is_rolling: boolean;
  compensation_type: CompensationType;
  compensation_min?: string | number | null;
  compensation_max?: string | number | null;
  compensation_currency?: string | null;
  compensation_note?: string | null;
  verification_status: VerificationStatus;
  trust_score?: number | null;
  is_featured: boolean;
  published_at?: string | null;
  thumbnail_url?: string | null;
  organizer_name_override?: string | null;
  team_size?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  application_url?: string | null;
  organization: OrganizationBrief;
  tags: TagRead[];
}

export interface OpportunityDetail extends OpportunityListItem {
  description?: string | null;
  eligibility?: string | null;
  requirements?: string[] | null;
  official_website?: string | null;
  source_url?: string | null;
  organizer_contact_url?: string | null;
  registration_opens_at?: string | null;
  tracks?: string | null;
  benefits?: string | null;
  additional_instructions?: string | null;
  view_count: number;
  status?: OpportunityStatus;
}

export interface OpportunityAdminItem extends OpportunityDetail {
  status: OpportunityStatus;
  organization_id: string;
  posted_by_id?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  role: UserRole;
  is_email_verified: boolean;
  handle?: string | null;
  avatar_url?: string | null;
  verification_email_sent?: boolean | null;
  verification_email_error?: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  photo_url?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, any> | null;
  read_at?: string | null;
  created_at: string;
}

export interface ApiError {
  code: string;
  message: string;
}

// ============ Phase 2: Events ============

export type EventMode = "online" | "onsite" | "hybrid";
export type EventStatus = "draft" | "published" | "closed" | "cancelled" | "completed";
export type RegistrationStatus =
  | "registered"
  | "waitlisted"
  | "pending_approval"
  | "rejected"
  | "cancelled"
  | "checked_in";

export interface EventOrg {
  id: string;
  name: string;
  logo_url?: string | null;
  slug: string;
}

export interface EventListItem {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  banner_url?: string | null;
  thumbnail_url?: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  mode: EventMode;
  venue_city?: string | null;
  capacity?: number | null;
  capacity_remaining?: number | null;
  is_full: boolean;
  status: EventStatus;
  organization: EventOrg;
}

export interface EventSections {
  schedule?: Array<{ time: string; title: string; description?: string; location?: string }>;
  prizes?: Array<{ rank: string; amount: string; description?: string }>;
  tracks?: Array<{ name: string; description?: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  sponsors?: Array<{ name: string; logo_url?: string; link?: string; tier?: string }>;
  rules?: string[];
}

export interface CustomQuestion {
  key: string;
  label: string;
  type: "text" | "select" | "textarea";
  required: boolean;
  options?: string[];
  max_length?: number;
}

export interface EventDetail extends EventListItem {
  description: string;
  venue_text?: string | null;
  venue_map_url?: string | null;
  online_url?: string | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  requires_approval: boolean;
  waitlist_enabled: boolean;
  team_min_size: number;
  team_max_size?: number | null;
  sections: EventSections;
  custom_questions: CustomQuestion[];
  theme_accent: string;
  published_at?: string | null;
  registration_state: string;
  user_registration?: {
    id: string;
    status: RegistrationStatus;
    registration_code: string;
    waitlist_position?: number | null;
  } | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  registration_code: string;
  waitlist_position?: number | null;
  registered_at: string;
  cancelled_at?: string | null;
  checked_in_at?: string | null;
  event_title?: string | null;
  event_slug?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface QRPass {
  token: string;
  registration_code: string;
  qr_nonce: string;
  status: RegistrationStatus;
  event_title: string;
  starts_at: string;
  ends_at: string;
  venue_text?: string | null;
  online_url?: string | null;
  attendee_name?: string | null;
}

export interface EventAdminItem extends EventListItem {
  description: string;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  requires_approval: boolean;
  waitlist_enabled: boolean;
  sections: EventSections;
  custom_questions: CustomQuestion[];
  theme_accent: string;
  created_at: string;
  updated_at: string;
  registrations_count?: number;
  checkins_count?: number;
  waitlist_count?: number;
}

export interface EventStats {
  registered: number;
  waitlisted: number;
  pending_approval: number;
  checked_in: number;
  cancelled: number;
  capacity?: number | null;
  checkins_by_hour?: Array<{ hour: string; count: number }>;
}

export interface EventRegistrationAdmin {
  id: string;
  user_id: string;
  status: RegistrationStatus;
  registration_code: string;
  waitlist_position?: number | null;
  registered_at: string;
  checked_in_at?: string | null;
  cancelled_at?: string | null;
  answers?: Record<string, any>;
  user?: {
    id: string;
    full_name?: string | null;
    email: string;
  };
}

export interface EventStaffRead {
  id: string;
  user_id: string;
  event_id: string;
  role: string;
  user?: {
    id: string;
    full_name?: string | null;
    email: string;
  };
}


// ==========================================
// Phase 4: Networking, Messaging & Projects
// ==========================================

export type ConnectionStatus = "pending" | "accepted" | "declined" | "cancelled";
export type ConversationType = "direct" | "team";
export type ProjectVisibility = "public" | "connections" | "private";
export type CollabRequestStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface ConnectionUserBrief {
  id: string;
  handle?: string | null;
  full_name?: string | null;
  email?: string | null;
  institution?: string | null;
  headline?: string | null;
  skills: string[];
}

export interface ConnectionRead {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  message?: string | null;
  created_at: string;
  responded_at?: string | null;
  user?: ConnectionUserBrief | null;
}

export interface NetworkSuggestion {
  user: ConnectionUserBrief;
  reasons: string[];
  mutual_events_count: number;
  shared_skills_count: number;
  score: number;
}

export interface UserBlockRead {
  id: string;
  blocked_id: string;
  created_at: string;
  blocked_user?: ConnectionUserBrief | null;
}

export interface ConversationParticipantRead {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_handle?: string | null;
  joined_at: string;
  muted: boolean;
}

export interface MessageRead {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_msg_id?: string | null;
  body: string;
  created_at: string;
  edited_at?: string | null;
  is_deleted: boolean;
  sender_name?: string | null;
  sender_handle?: string | null;
}

export interface ConversationRead {
  id: string;
  type: ConversationType;
  title?: string | null;
  team_id?: string | null;
  team_slug?: string | null;
  created_at: string;
  updated_at: string;
  last_message?: MessageRead | null;
  unread_count: number;
  /** Always sent by the API now, but UI code must tolerate it being absent. */
  participants?: ConversationParticipantRead[];
  participants_count?: number;
  other_user?: { id: string; email?: string; full_name?: string | null; handle?: string | null } | null;
}

export interface ConversationMessagesPage {
  items: MessageRead[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface ProjectListItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  repo_url?: string | null;
  demo_url?: string | null;
  tech_stack: string[];
  looking_for: string[];
  visibility: ProjectVisibility;
  owner_id: string;
  owner_name?: string | null;
  owner_handle?: string | null;
  member_count: number;
  created_at: string;
}

export interface ProjectMemberRead {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: ConnectionUserBrief | null;
}

export interface ProjectDetail extends ProjectListItem {
  description?: string | null;
  updated_at: string;
  team_id?: string | null;
  members: ProjectMemberRead[];
  is_owner?: boolean;
  my_collab_request_status?: CollabRequestStatus | null;
}

export interface ProjectCollabRequest {
  id: string;
  project_id: string;
  user_id: string;
  message?: string | null;
  status: CollabRequestStatus;
  created_at: string;
  user?: ConnectionUserBrief | null;
}

export interface TeamMemberRead {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: ConnectionUserBrief | null;
}

export interface TeamRead {
  id: string;
  name: string;
  slug: string;
  leader_id: string;
  created_at: string;
  members: TeamMemberRead[];
  conversation_id?: string | null;
}

export interface WSTicketResponse {
  ticket: string;
  expires_in: number;
}

// ==========================================
// PHASE 3: TEAMS & PROFILES
// ==========================================

export interface MyProfileRead {
  user_id: string;
  email: string;
  handle?: string | null;
  full_name: string;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  country_code?: string | null;
  institution?: string | null;
  field_of_study?: string | null;
  graduation_year?: number | null;
  skills: string[];
  interests: string[];
  open_to_teams: boolean;
  looking_for_roles: string[];
  availability_note?: string | null;
  is_public: boolean;
  show_linkedin: boolean;
  show_github: boolean;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  resume_url?: string | null;
  handle_updated_at?: string | null;
}

export interface PublicProfileRead {
  user_id: string;
  handle: string;
  full_name: string;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  institution?: string | null;
  field_of_study?: string | null;
  graduation_year?: number | null;
  skills: string[];
  interests: string[];
  open_to_teams: boolean;
  looking_for_roles: string[];
  availability_note?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
}

export interface ProfileUpdate {
  handle?: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  country_code?: string | null;
  institution?: string | null;
  field_of_study?: string | null;
  graduation_year?: number | null;
  skills?: string[];
  interests?: string[];
  open_to_teams?: boolean;
  looking_for_roles?: string[];
  availability_note?: string | null;
  is_public?: boolean;
  show_linkedin?: boolean;
  show_github?: boolean;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  resume_url?: string | null;
}

export interface TeammateCandidateRead {
  id: string;
  handle: string;
  full_name: string;
  avatar_url?: string | null;
  headline?: string | null;
  institution?: string | null;
  skills: string[];
  looking_for_roles: string[];
  availability_note?: string | null;
  match_score: number;
  shared_skills: string[];
}

export interface TeamMemberBrief {
  id: string;
  user_id: string;
  handle?: string | null;
  full_name: string;
  avatar_url?: string | null;
  role: "leader" | "member";
  joined_at: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatar_url?: string | null;
  event_id?: string | null;
  event_title?: string | null;
  owner_id: string;
  visibility: "public" | "unlisted" | "private";
  accepting_requests: boolean;
  max_size: number;
  looking_for_skills: string[];
  status: "active" | "disbanded" | "archived";
  is_locked: boolean;
  created_at: string;
  members: TeamMemberBrief[];
  conversation_id?: string | null;
  is_leader?: boolean;
  is_member?: boolean;
  has_pending_join_request?: boolean;
  open_spots: number;
}

export interface TeamCreate {
  name: string;
  slug?: string;
  description?: string;
  avatar_url?: string;
  event_id?: string;
  visibility?: "public" | "unlisted" | "private";
  accepting_requests?: boolean;
  max_size?: number;
  looking_for_skills?: string[];
}

export interface TeamUpdate {
  name?: string;
  description?: string | null;
  avatar_url?: string | null;
  visibility?: "public" | "unlisted" | "private";
  accepting_requests?: boolean;
  max_size?: number;
  looking_for_skills?: string[];
}

export interface TeamInviteCreate {
  user_id?: string;
  handle?: string;
  message?: string;
}

export interface TeamInviteRead {
  id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  invited_user_id?: string | null;
  invited_handle?: string | null;
  invited_name?: string | null;
  invited_email?: string | null;
  invited_by_id: string;
  inviter_name: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  message?: string | null;
  expires_at: string;
  created_at: string;
}

export interface TeamJoinRequestCreate {
  message?: string;
}

export interface TeamJoinRequestRead {
  id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  user_id: string;
  user_handle?: string | null;
  user_name: string;
  user_avatar_url?: string | null;
  user_skills: string[];
  message?: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
}
