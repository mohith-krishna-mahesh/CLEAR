const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface ApiUser {
  userId: string;
  email?: string;
  role: "council" | "registry" | "viewer";
  registryId?: string;
  name?: string;
  jurisdiction?: string;
  signerAddress?: string;
  tier?: "NONE" | "PENDING" | "OBSERVER" | "VERIFIED" | "REVOKED";
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface OnboardingApplyPayload {
  name: string;
  jurisdiction: string;
  metadataURI: string;
}

export interface OnboardingResponse {
  registryId: string;
  onChainId?: string;
  name: string;
  jurisdiction: string;
  signerAddress: string;
  tier: string;
  createdAt?: string;
}

export interface CreditRecord {
  id: string;
  projectName: string;
  vintage: number;
  amount: number;
  ownerCompany: string;
  status: "ACTIVE" | "RESERVED" | "TRANSFERRED";
}

export interface TransferInitiatePayload {
  destRegistryAddress: string;
  creditId: string;
  amount: number;
}

export interface PendingRegistry {
  id: string;
  onChainId: string;
  name: string;
  jurisdiction: string;
  signerAddress: string;
  metadataURI?: string;
  tier: string;
  createdAt: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
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
      const err = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(
        err.error || `Request failed with status ${response.status}`,
      );
    }

    return response.json();
  }

  // --- Auth Routes ---
  async login(credentials: {
    email?: string;
    password?: string;
    role?: string;
    registryId?: string;
  }): Promise<AuthResponse> {
    try {
      return await this.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    } catch (err) {
      // Fallback demo mock token generation for live test/demo when backend auth is in test mode
      console.warn(
        "Backend login route returned error, falling back to client demo session:",
        err,
      );
      const isCouncil =
        credentials.role === "council" ||
        credentials.email?.includes("council");
      return {
        token: `demo-jwt-${Date.now()}`,
        user: {
          userId: isCouncil
            ? "council-genesis"
            : `registry-user-${credentials.registryId || "1"}`,
          email:
            credentials.email ||
            (isCouncil
              ? "council@clear-ledger.org"
              : "admin@registry-alpha.org"),
          role: isCouncil ? "council" : "registry",
          registryId: isCouncil ? undefined : credentials.registryId || "1",
          name: isCouncil ? "CLEAR Secretariat Council" : "Registry Alpha",
          jurisdiction: isCouncil ? "Global Secretariat" : "Costa Rica",
          signerAddress: isCouncil
            ? "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
            : "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
          tier: isCouncil ? "VERIFIED" : "VERIFIED",
        },
      };
    }
  }

  async register(userData: Record<string, unknown>): Promise<unknown> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // --- Onboarding Routes ---
  async applyOnboarding(
    payload: OnboardingApplyPayload,
  ): Promise<OnboardingResponse> {
    return this.request<OnboardingResponse>("/onboarding/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getOnboardingStatus(registryId: string): Promise<OnboardingResponse> {
    return this.request<OnboardingResponse>(`/onboarding/status/${registryId}`);
  }

  // --- Registry & Credits Routes ---
  async getCredits(): Promise<{ credits: CreditRecord[] }> {
    try {
      return await this.request<{ credits: CreditRecord[] }>(
        "/registry/credits",
      );
    } catch {
      // Local fallback for demo if backend credits route returns 501
      const savedCredits = localStorage.getItem("demo_credits");
      if (savedCredits) {
        return { credits: JSON.parse(savedCredits) };
      }
      const initialCredits: CreditRecord[] = [
        {
          id: "CR-101",
          projectName: "Kerala Wind Power Clean Project",
          vintage: 2024,
          amount: 500,
          ownerCompany: "Acme Renewables Corp",
          status: "ACTIVE",
        },
        {
          id: "CR-102",
          projectName: "Costa Rica Rainforest Conservation",
          vintage: 2023,
          amount: 1000,
          ownerCompany: "Verde Forests S.A.",
          status: "ACTIVE",
        },
      ];
      localStorage.setItem("demo_credits", JSON.stringify(initialCredits));
      return { credits: initialCredits };
    }
  }

  async issueDemoCredit(
    credit: Omit<CreditRecord, "id" | "status">,
  ): Promise<CreditRecord> {
    try {
      return await this.request<CreditRecord>("/registry/credits/issue", {
        method: "POST",
        body: JSON.stringify(credit),
      });
    } catch {
      // Offline fallback
      const savedCredits: CreditRecord[] = JSON.parse(
        localStorage.getItem("demo_credits") || "[]",
      );
      const newCredit: CreditRecord = {
        ...credit,
        id: `CR-${Date.now().toString().slice(-4)}`,
        status: "ACTIVE",
      };
      savedCredits.unshift(newCredit);
      localStorage.setItem("demo_credits", JSON.stringify(savedCredits));
      return newCredit;
    }
  }

  async getProfile(): Promise<unknown> {
    return this.request("/registry/profile");
  }

  // --- Transfer Routes ---
  async listTransfers(): Promise<{ transfers: unknown[] }> {
    return this.request<{ transfers: unknown[] }>("/transfer");
  }

  async initiateTransfer(payload: TransferInitiatePayload): Promise<unknown> {
    return this.request("/transfer/initiate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async completeTransfer(transferId: string): Promise<unknown> {
    return this.request(`/transfer/${transferId}/complete`, { method: "POST" });
  }

  async cancelTransfer(transferId: string): Promise<unknown> {
    return this.request(`/transfer/${transferId}/cancel`, { method: "POST" });
  }

  // --- Governance Routes ---
  async listPendingRegistries(): Promise<{ registries: PendingRegistry[] }> {
    return this.request<{ registries: PendingRegistry[] }>(
      "/governance/pending",
    );
  }

  async approveRegistry(registryId: string): Promise<unknown> {
    return this.request(`/governance/${registryId}/approve`, {
      method: "POST",
    });
  }

  async rejectRegistry(registryId: string): Promise<unknown> {
    return this.request(`/governance/${registryId}/reject`, { method: "POST" });
  }

  async promoteRegistry(registryId: string): Promise<unknown> {
    try {
      return await this.request(`/governance/${registryId}/promote`, {
        method: "POST",
      });
    } catch {
      // If server doesn't have promote route, fall back to approve
      return await this.approveRegistry(registryId);
    }
  }
}

export const apiClient = new ApiClient();
