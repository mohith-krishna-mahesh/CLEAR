const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || "API Request failed");
    }

    return response.json();
  }

  // Auth
  async login(credentials: unknown): Promise<{ token: string; user: unknown }> {
    return this.request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
  }

  async register(userData: unknown): Promise<unknown> {
    return this.request("/auth/register", { method: "POST", body: JSON.stringify(userData) });
  }

  // Onboarding
  async applyOnboarding(payload: unknown): Promise<unknown> {
    return this.request("/onboarding/apply", { method: "POST", body: JSON.stringify(payload) });
  }

  async getOnboardingStatus(registryId: string): Promise<unknown> {
    return this.request(`/onboarding/status/${registryId}`);
  }

  // Registry
  async getCredits(): Promise<unknown> {
    return this.request("/registry/credits");
  }

  async getProfile(): Promise<unknown> {
    return this.request("/registry/profile");
  }

  // Transfer
  async listTransfers(): Promise<unknown> {
    return this.request("/transfer");
  }

  async initiateTransfer(payload: unknown): Promise<unknown> {
    return this.request("/transfer/initiate", { method: "POST", body: JSON.stringify(payload) });
  }

  async completeTransfer(transferId: string): Promise<unknown> {
    return this.request(`/transfer/${transferId}/complete`, { method: "POST" });
  }

  async cancelTransfer(transferId: string): Promise<unknown> {
    return this.request(`/transfer/${transferId}/cancel`, { method: "POST" });
  }

  // Governance
  async listPendingRegistries(): Promise<unknown> {
    return this.request("/governance/pending");
  }

  async approveRegistry(registryId: string): Promise<unknown> {
    return this.request(`/governance/${registryId}/approve`, { method: "POST" });
  }

  async rejectRegistry(registryId: string): Promise<unknown> {
    return this.request(`/governance/${registryId}/reject`, { method: "POST" });
  }
}

export const apiClient = new ApiClient();
