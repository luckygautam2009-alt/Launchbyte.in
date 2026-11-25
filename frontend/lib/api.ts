import {
  ApiError,
  EventAdminItem,
  EventDetail,
  EventListItem,
  EventRegistration,
  EventRegistrationAdmin,
  EventStaffRead,
  EventStats,
  NotificationItem,
  OpportunityAdminItem,
  OpportunityDetail,
  OpportunityListItem,
  OpportunityType,
  Page,
  QRPass,
  TagRead,
  TeamMember,
  User,
  ConnectionRead,
  NetworkSuggestion,
  UserBlockRead,
  ConversationRead,
  MessageRead,
  ConversationMessagesPage,
  ProjectListItem,
  ProjectDetail,
  ProjectCollabRequest,
  TeamRead,
  WSTicketResponse,
  MyProfileRead,
  PublicProfileRead,
  ProfileUpdate,
  TeamDetail,
  TeamCreate,
  TeamUpdate,
  TeamInviteCreate,
  TeamInviteRead,
  TeamJoinRequestCreate,
  TeamJoinRequestRead,
  TeammateCandidateRead,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("lb_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      if (token) {
        localStorage.setItem("lb_token", token);
        document.cookie = `lb_token=${token}; path=/; max-age=3600; SameSite=Lax${secureFlag}`;
      } else {
        localStorage.removeItem("lb_token");
        document.cookie = `lb_token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("lb_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.getToken()) {
      headers.set("Authorization", `Bearer ${this.getToken()}`);
    }

    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && typeof window !== "undefined") {
      // Clear token on 401
      this.setToken(null);
    }

    if (res.status === 204) {
      return {} as T;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let code = "UNKNOWN_ERROR";
      let message = "An unexpected error occurred.";

      if (data?.error?.code && data?.error?.message) {
        code = data.error.code;
        message = data.error.message;
      } else if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        message = data.detail[0]?.msg || "Validation error";
      }

      const err: ApiError = { code, message };
      throw err;
    }

    return data as T;
  }

  // --- Auth ---
  async login(formData: URLSearchParams): Promise<{ access_token: string }> {
    const url = `${API_BASE}/auth/login`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw {
        code: data?.error?.code || "UNAUTHORIZED",
        message: data?.error?.message || data?.detail || "Invalid email or password",
      };
    }
    this.setToken(data.access_token);
    return data;
  }

  async register(body: { email: string; password: string; full_name?: string }): Promise<User> {
    return this.request<User>("/users", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>("/users/me");
  }

  async requestEmailVerification(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/verify-email/request", {
      method: "POST",
    });
  }

  async confirmEmailVerification(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/verify-email/confirm", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(token: string, new_password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    });
  }

  // --- Opportunities Public ---
  async listOpportunities(params: Record<string, any> = {}): Promise<Page<OpportunityListItem>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        if (Array.isArray(v)) {
          v.forEach((val) => query.append(k, val));
        } else {
          query.set(k, String(v));
        }
      }
    });
    return this.request<Page<OpportunityListItem>>(`/opportunities?${query.toString()}`);
  }

  async getOpportunity(slug: string): Promise<OpportunityDetail> {
    return this.request<OpportunityDetail>(`/opportunities/${encodeURIComponent(slug)}`);
  }

  async getTags(): Promise<TagRead[]> {
    return this.request<TagRead[]>("/tags");
  }

  async getTypes(): Promise<{ type: OpportunityType; count: number }[]> {
    return this.request<{ type: OpportunityType; count: number }[]>("/opportunities/types");
  }

  // --- Saved ---
  async saveOpportunity(id: string): Promise<void> {
    await this.request(`/opportunities/${id}/save`, { method: "POST" });
  }

  async unsaveOpportunity(id: string): Promise<void> {
    await this.request(`/opportunities/${id}/save`, { method: "DELETE" });
  }

  async listSaved(limit = 20, offset = 0): Promise<Page<OpportunityListItem>> {
    return this.request<Page<OpportunityListItem>>(`/me/saved?limit=${limit}&offset=${offset}`);
  }

  // --- Reports ---
  async reportOpportunity(id: string, reason: string, details?: string): Promise<any> {
    return this.request(`/opportunities/${id}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    });
  }

  // --- Organizer ---
  async createOrganizerOpportunity(orgId: string, data: any): Promise<OpportunityDetail> {
    return this.request<OpportunityDetail>(`/organizations/${orgId}/opportunities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateOrganizerOpportunity(oppId: string, data: any): Promise<OpportunityDetail> {
    return this.request<OpportunityDetail>(`/opportunities/${oppId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async submitOrganizerOpportunity(oppId: string): Promise<OpportunityDetail> {
    return this.request<OpportunityDetail>(`/opportunities/${oppId}/submit`, {
      method: "POST",
    });
  }

  async deleteOrganizerOpportunity(oppId: string): Promise<void> {
    await this.request(`/opportunities/${oppId}`, { method: "DELETE" });
  }

  async listOrganizerOpportunities(limit = 20, offset = 0): Promise<Page<OpportunityDetail>> {
    return this.request<Page<OpportunityDetail>>(`/me/opportunities?limit=${limit}&offset=${offset}`);
  }

  // --- Admin Moderation ---
  async listAdminOpportunities(params: { status?: string; limit?: number; offset?: number } = {}): Promise<Page<OpportunityAdminItem>> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    return this.request<Page<OpportunityAdminItem>>(`/admin/opportunities?${query.toString()}`);
  }

  async approveOpportunity(id: string, verification_status?: string, trust_score?: number): Promise<OpportunityAdminItem> {
    return this.request<OpportunityAdminItem>(`/admin/opportunities/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ verification_status, trust_score }),
    });
  }

  async rejectOpportunity(id: string, reason: string): Promise<OpportunityAdminItem> {
    return this.request<OpportunityAdminItem>(`/admin/opportunities/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // --- Notifications ---
  async listNotifications(limit = 20, offset = 0): Promise<Page<NotificationItem>> {
    return this.request<Page<NotificationItem>>(`/notifications?limit=${limit}&offset=${offset}`);
  }

  async markNotificationRead(id: string): Promise<NotificationItem> {
    return this.request<NotificationItem>(`/notifications/${id}/read`, { method: "POST" });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request(`/notifications/read-all`, { method: "POST" });
  }

  // --- Image Upload ---
  async uploadImage(file: File): Promise<{ url: string; width: number; height: number }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<{ url: string; width: number; height: number }>("/uploads/images", {
      method: "POST",
      body: formData,
    });
  }

  // --- Team ---
  async getPublicTeam(): Promise<TeamMember[]> {
    return this.request<TeamMember[]>("/about/team");
  }

  // ============ Phase 2: Events (Public) ============

  async listEvents(params: Record<string, any> = {}): Promise<Page<EventListItem>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });
    return this.request<Page<EventListItem>>(`/events?${query.toString()}`);
  }

  async getEvent(slug: string): Promise<EventDetail> {
    return this.request<EventDetail>(`/events/${encodeURIComponent(slug)}`);
  }

  async registerForEvent(id: string, answers: Record<string, any> = {}): Promise<EventRegistration> {
    return this.request<EventRegistration>(`/events/${id}/register`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  async cancelEventRegistration(id: string): Promise<EventRegistration> {
    return this.request<EventRegistration>(`/events/${id}/cancel-registration`, {
      method: "POST",
    });
  }

  async getRegistrationPass(registrationId: string): Promise<QRPass> {
    return this.request<QRPass>(`/registrations/${registrationId}/pass`);
  }

  getPassPngUrl(registrationId: string): string {
    return `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1")}/registrations/${registrationId}/pass.png`;
  }

  async rotatePass(registrationId: string): Promise<QRPass> {
    return this.request<QRPass>(`/registrations/${registrationId}/pass/rotate`, {
      method: "POST",
    });
  }

  async checkIn(
    eventId: string,
    payload: { token?: string; registration_code?: string }
  ): Promise<{ success: boolean; message: string; attendee_name?: string; registration_code?: string }> {
    return this.request(`/events/${eventId}/check-in`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMyRegistrations(): Promise<EventRegistration[]> {
    return this.request<EventRegistration[]>("/me/registrations");
  }

  // ============ Phase 2: Events (Admin) ============

  async createAdminEvent(data: any): Promise<EventAdminItem> {
    return this.request<EventAdminItem>("/admin/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAdminEvent(id: string, data: any): Promise<EventAdminItem> {
    return this.request<EventAdminItem>(`/admin/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async publishEvent(id: string): Promise<EventAdminItem> {
    return this.request<EventAdminItem>(`/admin/events/${id}/publish`, {
      method: "POST",
    });
  }

  async unpublishEvent(id: string): Promise<EventAdminItem> {
    return this.request<EventAdminItem>(`/admin/events/${id}/unpublish`, {
      method: "POST",
    });
  }

  async closeEvent(id: string): Promise<EventAdminItem> {
    return this.request<EventAdminItem>(`/admin/events/${id}/close`, {
      method: "POST",
    });
  }

  async cancelEvent(id: string): Promise<EventAdminItem> {
    return this.request<EventAdminItem>(`/admin/events/${id}/cancel`, {
      method: "POST",
    });
  }

  async deleteAdminEvent(id: string): Promise<void> {
    await this.request(`/admin/events/${id}`, { method: "DELETE" });
  }

  async listAdminEvents(params: { status?: string; limit?: number; offset?: number } = {}): Promise<Page<EventAdminItem>> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    return this.request<Page<EventAdminItem>>(`/admin/events?${query.toString()}`);
  }

  async getAdminEvent(id: string): Promise<EventAdminItem> {
    return this.request<EventAdminItem>(`/admin/events/${id}`);
  }

  async listEventRegistrations(
    eventId: string,
    params: { status?: string; q?: string; limit?: number; offset?: number } = {}
  ): Promise<Page<EventRegistrationAdmin>> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.q) query.set("q", params.q);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    return this.request<Page<EventRegistrationAdmin>>(`/admin/events/${eventId}/registrations?${query.toString()}`);
  }

  async approveRegistration(eventId: string, rid: string): Promise<EventRegistrationAdmin> {
    return this.request<EventRegistrationAdmin>(`/admin/events/${eventId}/registrations/${rid}/approve`, {
      method: "POST",
    });
  }

  async rejectRegistration(eventId: string, rid: string): Promise<EventRegistrationAdmin> {
    return this.request<EventRegistrationAdmin>(`/admin/events/${eventId}/registrations/${rid}/reject`, {
      method: "POST",
    });
  }

  async undoCheckIn(eventId: string, rid: string): Promise<EventRegistrationAdmin> {
    return this.request<EventRegistrationAdmin>(`/admin/events/${eventId}/registrations/${rid}/undo-check-in`, {
      method: "POST",
    });
  }

  async getEventStats(eventId: string): Promise<EventStats> {
    return this.request<EventStats>(`/admin/events/${eventId}/stats`);
  }

  async exportRegistrationsCSV(eventId: string): Promise<string> {
    const url = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1")}/admin/events/${eventId}/registrations/export`;
    const token = this.getToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw { code: "EXPORT_ERROR", message: "Failed to export CSV" };
    return res.text();
  }

  async addEventStaff(eventId: string, payload: { email: string; role: string }): Promise<EventStaffRead> {
    return this.request<EventStaffRead>(`/admin/events/${eventId}/staff`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async removeEventStaff(eventId: string, userId: string): Promise<void> {
    await this.request(`/admin/events/${eventId}/staff/${userId}`, { method: "DELETE" });
  }

  async listEventStaff(eventId: string): Promise<EventStaffRead[]> {
    return this.request<EventStaffRead[]>(`/admin/events/${eventId}/staff`);
  }

  // ============ Phase 4: Networking ============

  async requestConnection(payload: { user_id?: string; handle?: string; message?: string }): Promise<ConnectionRead> {
    return this.request<ConnectionRead>("/connections/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listConnections(params: { status?: string; page?: number; per_page?: number } = {}): Promise<Page<ConnectionRead>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });
    return this.request<Page<ConnectionRead>>(`/connections?${query.toString()}`);
  }

  async listConnectionRequests(direction: "incoming" | "outgoing" = "incoming"): Promise<ConnectionRead[]> {
    return this.request<ConnectionRead[]>(`/connections/requests?direction=${direction}`);
  }

  async acceptConnection(requestId: string): Promise<ConnectionRead> {
    return this.request<ConnectionRead>(`/connections/requests/${requestId}/accept`, { method: "POST" });
  }

  async declineConnection(requestId: string): Promise<ConnectionRead> {
    return this.request<ConnectionRead>(`/connections/requests/${requestId}/decline`, { method: "POST" });
  }

  async cancelConnectionRequest(requestId: string): Promise<ConnectionRead> {
    return this.request<ConnectionRead>(`/connections/requests/${requestId}/cancel`, { method: "POST" });
  }

  async removeConnection(connectionId: string): Promise<void> {
    await this.request(`/connections/${connectionId}`, { method: "DELETE" });
  }

  async getNetworkSuggestions(limit: number = 20): Promise<NetworkSuggestion[]> {
    return this.request<NetworkSuggestion[]>(`/network/suggestions?limit=${limit}`);
  }

  async blockUser(userId: string): Promise<void> {
    await this.request("/blocks", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async unblockUser(userId: string): Promise<void> {
    await this.request(`/blocks/${userId}`, { method: "DELETE" });
  }

  async listBlocks(): Promise<UserBlockRead[]> {
    return this.request<UserBlockRead[]>("/blocks");
  }

  // ============ Phase 4: Messaging & Chat ============

  async listConversations(): Promise<ConversationRead[]> {
    return this.request<ConversationRead[]>("/conversations");
  }

  async startDirectConversation(userId: string): Promise<ConversationRead> {
    return this.request<ConversationRead>("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getConversationMessages(
    conversationId: string,
    params: { cursor?: string; limit?: number } = {}
  ): Promise<ConversationMessagesPage> {
    const query = new URLSearchParams();
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));
    return this.request<ConversationMessagesPage>(`/conversations/${conversationId}/messages?${query.toString()}`);
  }

  async sendMessage(
    conversationId: string,
    payload: { body: string; client_msg_id?: string }
  ): Promise<MessageRead> {
    return this.request<MessageRead>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async editMessage(messageId: string, body: string): Promise<MessageRead> {
    return this.request<MessageRead>(`/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.request(`/messages/${messageId}`, { method: "DELETE" });
  }

  async markConversationRead(conversationId: string, messageId?: string): Promise<void> {
    await this.request(`/conversations/${conversationId}/read`, {
      method: "POST",
      body: JSON.stringify({ message_id: messageId }),
    });
  }

  async reportMessage(messageId: string, payload: { reason: string; details?: string }): Promise<void> {
    await this.request(`/messages/${messageId}/report`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getWsTicket(): Promise<WSTicketResponse> {
    return this.request<WSTicketResponse>("/ws/ticket", { method: "POST" });
  }

  // ============ Phase 4: Collaborative Projects ============

  async listProjects(params: Record<string, any> = {}): Promise<Page<ProjectListItem>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });
    return this.request<Page<ProjectListItem>>(`/projects?${query.toString()}`);
  }

  async getProject(slugOrId: string): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/projects/${encodeURIComponent(slugOrId)}`);
  }

  async createProject(payload: {
    title: string;
    slug?: string;
    summary?: string;
    description?: string;
    repo_url?: string;
    demo_url?: string;
    tech_stack?: string[];
    looking_for?: string[];
    visibility?: string;
  }): Promise<ProjectDetail> {
    return this.request<ProjectDetail>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateProject(
    slugOrId: string,
    payload: {
      title?: string;
      summary?: string;
      description?: string;
      repo_url?: string;
      demo_url?: string;
      tech_stack?: string[];
      looking_for?: string[];
      visibility?: string;
    }
  ): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/projects/${encodeURIComponent(slugOrId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteProject(slugOrId: string): Promise<void> {
    await this.request(`/projects/${encodeURIComponent(slugOrId)}`, { method: "DELETE" });
  }

  async requestProjectCollab(slugOrId: string, message?: string): Promise<ProjectCollabRequest> {
    return this.request<ProjectCollabRequest>(`/projects/${encodeURIComponent(slugOrId)}/collab-requests`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  async listProjectCollabRequests(slugOrId: string): Promise<ProjectCollabRequest[]> {
    return this.request<ProjectCollabRequest[]>(`/projects/${encodeURIComponent(slugOrId)}/collab-requests`);
  }

  async acceptProjectCollab(slugOrId: string, requestId: string): Promise<void> {
    await this.request(`/projects/${encodeURIComponent(slugOrId)}/collab-requests/${requestId}/accept`, {
      method: "POST",
    });
  }

  async rejectProjectCollab(slugOrId: string, requestId: string): Promise<void> {
    await this.request(`/projects/${encodeURIComponent(slugOrId)}/collab-requests/${requestId}/reject`, {
      method: "POST",
    });
  }

  async withdrawProjectCollab(slugOrId: string): Promise<void> {
    await this.request(`/projects/${encodeURIComponent(slugOrId)}/collab-requests/withdraw`, {
      method: "POST",
    });
  }

  async leaveProject(slugOrId: string): Promise<void> {
    await this.request(`/projects/${encodeURIComponent(slugOrId)}/members/me`, { method: "DELETE" });
  }

  // ============ Phase 4: Teams (legacy simple) ============

  async getTeam(slugOrId: string): Promise<TeamRead> {
    return this.request<TeamRead>(`/teams/${encodeURIComponent(slugOrId)}`);
  }

  async createTeamSimple(payload: { name: string; slug?: string }): Promise<TeamRead> {
    return this.request<TeamRead>("/teams", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ============ Phase 3: Profiles ============

  async getMyProfile(): Promise<MyProfileRead> {
    return this.request<MyProfileRead>("/me/profile");
  }

  async updateMyProfile(data: ProfileUpdate): Promise<MyProfileRead> {
    return this.request<MyProfileRead>("/me/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<{ avatar_url: string }>("/me/profile/avatar", {
      method: "POST",
      body: formData,
    });
  }

  async getPublicProfile(handle: string): Promise<PublicProfileRead> {
    return this.request<PublicProfileRead>(`/profiles/${encodeURIComponent(handle)}`);
  }

  async discoverPeople(params?: {
    event_id?: string;
    skills?: string[];
    q?: string;
    limit?: number;
  }): Promise<TeammateCandidateRead[]> {
    const qs = new URLSearchParams();
    if (params?.event_id) qs.set("event_id", params.event_id);
    if (params?.skills?.length) params.skills.forEach(s => qs.append("skills", s));
    if (params?.q) qs.set("q", params.q);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return this.request<TeammateCandidateRead[]>(`/people/discover${q ? `?${q}` : ""}`);
  }

  // ============ Phase 3: Teams (full) ============

  async createTeam(payload: TeamCreate): Promise<TeamDetail> {
    return this.request<TeamDetail>("/teams", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listTeams(params?: {
    event_id?: string;
    skills?: string[];
    has_open_spots?: boolean;
    q?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ items: TeamDetail[]; total: number; page: number; per_page: number }> {
    const qs = new URLSearchParams();
    if (params?.event_id) qs.set("event_id", params.event_id);
    if (params?.skills?.length) params.skills.forEach(s => qs.append("skills", s));
    if (params?.has_open_spots !== undefined) qs.set("has_open_spots", String(params.has_open_spots));
    if (params?.q) qs.set("q", params.q);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    const q = qs.toString();
    return this.request(`/teams${q ? `?${q}` : ""}`);
  }

  async getMyTeams(): Promise<TeamDetail[]> {
    return this.request<TeamDetail[]>("/me/teams");
  }

  async getTeamBySlug(slug: string): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/teams/${encodeURIComponent(slug)}`);
  }

  async updateTeam(teamId: string, payload: TeamUpdate): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/teams/${teamId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async disbandTeam(teamId: string): Promise<void> {
    await this.request(`/teams/${teamId}/disband`, { method: "POST" });
  }

  async leaveTeam(teamId: string): Promise<void> {
    await this.request(`/teams/${teamId}/leave`, { method: "POST" });
  }

  async transferLeadership(teamId: string, newLeaderId: string): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/teams/${teamId}/transfer-leadership`, {
      method: "POST",
      body: JSON.stringify({ new_leader_id: newLeaderId }),
    });
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await this.request(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
  }

  // Invites
  async createTeamInvite(teamId: string, payload: TeamInviteCreate): Promise<TeamInviteRead> {
    return this.request<TeamInviteRead>(`/teams/${teamId}/invites`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listMyInvites(): Promise<TeamInviteRead[]> {
    return this.request<TeamInviteRead[]>("/me/invites");
  }

  async listTeamInvites(teamId: string): Promise<TeamInviteRead[]> {
    return this.request<TeamInviteRead[]>(`/teams/${teamId}/invites`);
  }

  async acceptInvite(inviteId: string): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/invites/${inviteId}/accept`, { method: "POST" });
  }

  async declineInvite(inviteId: string): Promise<void> {
    await this.request(`/invites/${inviteId}/decline`, { method: "POST" });
  }

  async revokeInvite(inviteId: string): Promise<void> {
    await this.request(`/invites/${inviteId}`, { method: "DELETE" });
  }

  // Join requests
  async createJoinRequest(teamId: string, payload?: TeamJoinRequestCreate): Promise<TeamJoinRequestRead> {
    return this.request<TeamJoinRequestRead>(`/teams/${teamId}/join-requests`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  }

  async listTeamJoinRequests(teamId: string): Promise<TeamJoinRequestRead[]> {
    return this.request<TeamJoinRequestRead[]>(`/teams/${teamId}/join-requests`);
  }

  async acceptJoinRequest(requestId: string): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/join-requests/${requestId}/accept`, { method: "POST" });
  }

  async rejectJoinRequest(requestId: string): Promise<void> {
    await this.request(`/join-requests/${requestId}/reject`, { method: "POST" });
  }

  async withdrawJoinRequest(requestId: string): Promise<void> {
    await this.request(`/join-requests/${requestId}`, { method: "DELETE" });
  }

  // Suggestions
  async getTeamSuggestions(teamId: string): Promise<TeammateCandidateRead[]> {
    return this.request<TeammateCandidateRead[]>(`/teams/${teamId}/suggestions`);
  }

  // Organizer / Admin
  async lockEventTeams(eventId: string, locked: boolean = true): Promise<{ locked_teams_count: number }> {
    return this.request(`/admin/events/${eventId}/lock-teams`, {
      method: "POST",
      body: JSON.stringify({ locked }),
    });
  }

  async listEventTeams(eventId: string): Promise<TeamDetail[]> {
    return this.request<TeamDetail[]>(`/admin/events/${eventId}/teams`);
  }

  async adminRemoveTeam(teamId: string, reason: string): Promise<void> {
    await this.request(`/admin/teams/${teamId}?reason=${encodeURIComponent(reason)}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
