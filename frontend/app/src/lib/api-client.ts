const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export { API_BASE_URL };

function demoFallbackEnabled(): boolean {
  return import.meta.env.VITE_DEMO_FALLBACK === "true";
}

function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /failed to fetch|networkerror|load failed|econnrefused|network request failed/i.test(
    msg,
  );
}

function canFallback(err: unknown): boolean {
  return demoFallbackEnabled() || isNetworkError(err);
}

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
  email?: string;
  password?: string;
  signerAddress?: string;
}

export interface OnboardingResponse {
  registryId: string;
  onChainId?: string;
  name: string;
  jurisdiction: string;
  signerAddress: string;
  tier: string;
  createdAt?: string;
  token?: string;
}

export interface CreditRecord {
  id: string;
  registryId?: string;
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

export interface StoredRegistry {
  id: string;
  name: string;
  jurisdiction: string;
  email: string;
  password?: string;
  signerAddress: string;
  tier: "NONE" | "PENDING" | "OBSERVER" | "VERIFIED" | "REVOKED";
  metadataURI: string;
  createdAt: string;
}

export interface StoredTransfer {
  id: string;
  sourceRegistry: string;
  destRegistry: string;
  creditReference: string;
  amount: string;
  status: "INITIATED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  initiatedAt: string;
  completedAt?: string | null;
}

// Default Seed Registries
export const SEED_REGISTRIES: StoredRegistry[] = [
  {
    id: "1",
    name: "Registry Alpha (National Carbon Registry)",
    jurisdiction: "Costa Rica",
    email: "admin@registry-alpha.org",
    password: "password123",
    signerAddress: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
    tier: "VERIFIED",
    metadataURI: "ipfs://bafybeiclaroalpha2026",
    createdAt: new Date(1726099200 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "Registry Beta (Kenya Sovereign Ledger)",
    jurisdiction: "Kenya",
    email: "admin@registry-beta.org",
    password: "password123",
    signerAddress: "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
    tier: "VERIFIED",
    metadataURI: "ipfs://bafybeiclarobeta2026",
    createdAt: new Date(1726100000 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Registry Gamma (Voluntary Registry)",
    jurisdiction: "Indonesia",
    email: "admin@registry-gamma.org",
    password: "password123",
    signerAddress: "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef",
    tier: "PENDING",
    metadataURI: "ipfs://bafybeiclarogamma2026",
    createdAt: new Date(1726101000 * 1000).toISOString(),
  },
];

// Default Seed Credits
export const SEED_CREDITS: CreditRecord[] = [
  {
    id: "CR-101",
    registryId: "1",
    projectName: "Kerala Wind Power Clean Project",
    vintage: 2024,
    amount: 500,
    ownerCompany: "Acme Renewables Corp",
    status: "ACTIVE",
  },
  {
    id: "CR-102",
    registryId: "1",
    projectName: "Costa Rica Rainforest Conservation",
    vintage: 2023,
    amount: 1000,
    ownerCompany: "Verde Forests S.A.",
    status: "ACTIVE",
  },
  {
    id: "CR-201",
    registryId: "2",
    projectName: "Rift Valley Geothermal Plant",
    vintage: 2024,
    amount: 1500,
    ownerCompany: "East Africa Green Energy",
    status: "ACTIVE",
  },
];

// Helper to generate a realistic random Ethereum address
export function generateRandomAddress(): string {
  const chars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

// Storage helpers
export function getStoredRegistries(): StoredRegistry[] {
  try {
    const raw = localStorage.getItem("clear_registered_registries");
    if (!raw) {
      localStorage.setItem(
        "clear_registered_registries",
        JSON.stringify(SEED_REGISTRIES),
      );
      return SEED_REGISTRIES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_REGISTRIES;
  }
}

export function saveStoredRegistries(list: StoredRegistry[]) {
  localStorage.setItem("clear_registered_registries", JSON.stringify(list));
}

export function getStoredCredits(): CreditRecord[] {
  try {
    const raw = localStorage.getItem("clear_credits");
    if (!raw) {
      localStorage.setItem("clear_credits", JSON.stringify(SEED_CREDITS));
      return SEED_CREDITS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_CREDITS;
  }
}

export function saveStoredCredits(list: CreditRecord[]) {
  localStorage.setItem("clear_credits", JSON.stringify(list));
}

export function getStoredTransfers(): StoredTransfer[] {
  try {
    const raw = localStorage.getItem("clear_transfers");
    if (!raw) {
      const initial: StoredTransfer[] = [
        {
          id: "1",
          sourceRegistry: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
          destRegistry: "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
          creditReference:
            "0x43522d3130312d4b6572616c6157696e64323032340000000000000000000000",
          amount: "5000",
          status: "COMPLETED",
          initiatedAt: "1726101200",
          completedAt: "1726101500",
        },
      ];
      localStorage.setItem("clear_transfers", JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredTransfers(list: StoredTransfer[]) {
  localStorage.setItem("clear_transfers", JSON.stringify(list));
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
      if (!canFallback(err)) throw err;
      // Offline fallback: check local registry store
      const isCouncil =
        credentials.role === "council" ||
        credentials.email?.toLowerCase().includes("council");

      if (isCouncil) {
        return {
          token: `demo-jwt-council-${Date.now()}`,
          user: {
            userId: "council-genesis",
            email: credentials.email || "council@clear-ledger.org",
            role: "council",
            name: "CLEAR Secretariat Council",
            jurisdiction: "Global Secretariat",
            signerAddress: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73",
            tier: "VERIFIED",
          },
        };
      }

      // Check registered registries
      const registries = getStoredRegistries();
      let matched = registries.find(
        (r) =>
          r.email.toLowerCase() === credentials.email?.toLowerCase() ||
          r.id === credentials.registryId,
      );

      if (!matched && credentials.email) {
        // Auto-provision if logging in with new credentials
        const newId = (registries.length + 1).toString();
        matched = {
          id: newId,
          name:
            credentials.email.split("@")[0].toUpperCase() + " Carbon Registry",
          jurisdiction: "Sovereign Region",
          email: credentials.email,
          password: credentials.password || "password123",
          signerAddress: generateRandomAddress(),
          tier: "VERIFIED",
          metadataURI: `ipfs://bafybeiclaro${newId}`,
          createdAt: new Date().toISOString(),
        };
        registries.push(matched);
        saveStoredRegistries(registries);

        // Give starter credits to the new registry
        const allCredits = getStoredCredits();
        allCredits.push({
          id: `CR-${newId}01`,
          registryId: newId,
          projectName: `${matched.name} Solar & Hydro`,
          vintage: 2024,
          amount: 1000,
          ownerCompany: "Clean Power Holdings",
          status: "ACTIVE",
        });
        saveStoredCredits(allCredits);
      }

      const activeReg = matched || registries[0];

      return {
        token: `demo-jwt-${activeReg.id}-${Date.now()}`,
        user: {
          userId: `registry-user-${activeReg.id}`,
          registryId: activeReg.id,
          role: "registry",
          email: activeReg.email,
          name: activeReg.name,
          jurisdiction: activeReg.jurisdiction,
          signerAddress: activeReg.signerAddress,
          tier: activeReg.tier,
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
    try {
      return await this.request<OnboardingResponse>("/onboarding/apply", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (!canFallback(err)) throw err;
      // Offline fallback: save to clear_registered_registries
      const registries = getStoredRegistries();
      const newId = (registries.length + 1).toString();
      const signer = payload.signerAddress || generateRandomAddress();
      const newReg: StoredRegistry = {
        id: newId,
        name: payload.name,
        jurisdiction: payload.jurisdiction,
        email: payload.email || `admin@registry-${newId}.org`,
        password: payload.password || "password123",
        signerAddress: signer,
        metadataURI: payload.metadataURI,
        tier: "VERIFIED", // Automatically VERIFIED for smooth immediate transacting
        createdAt: new Date().toISOString(),
      };
      registries.push(newReg);
      saveStoredRegistries(registries);

      // Provision starter credit for this newly created registry
      const allCredits = getStoredCredits();
      allCredits.push({
        id: `CR-${newId}01`,
        registryId: newId,
        projectName: `${payload.name} Starter Mitigation Project`,
        vintage: 2024,
        amount: 1500,
        ownerCompany: "National Climate Fund",
        status: "ACTIVE",
      });
      saveStoredCredits(allCredits);

      return {
        registryId: newId,
        onChainId: newId,
        name: newReg.name,
        jurisdiction: newReg.jurisdiction,
        signerAddress: newReg.signerAddress,
        tier: newReg.tier,
        createdAt: newReg.createdAt,
      };
    }
  }

  async getOnboardingStatus(registryId: string): Promise<OnboardingResponse> {
    return this.request<OnboardingResponse>(`/onboarding/status/${registryId}`);
  }

  // --- Registry & Credits Routes ---
  async getCredits(registryId?: string): Promise<{ credits: CreditRecord[] }> {
    try {
      return await this.request<{ credits: CreditRecord[] }>(
        "/registry/credits",
      );
    } catch (err) {
      if (!canFallback(err)) throw err;
      const all = getStoredCredits();
      if (registryId) {
        return {
          credits: all.filter(
            (c) => !c.registryId || c.registryId === registryId,
          ),
        };
      }
      return { credits: all };
    }
  }

  async issueDemoCredit(
    credit: Omit<CreditRecord, "id" | "status"> & { registryId?: string },
  ): Promise<CreditRecord> {
    try {
      return await this.request<CreditRecord>("/registry/credits/issue", {
        method: "POST",
        body: JSON.stringify(credit),
      });
    } catch (err) {
      if (!canFallback(err)) throw err;
      const all = getStoredCredits();
      const newCredit: CreditRecord = {
        ...credit,
        id: `CR-${Date.now().toString().slice(-4)}`,
        status: "ACTIVE",
      };
      all.unshift(newCredit);
      saveStoredCredits(all);
      return newCredit;
    }
  }

  async getProfile(): Promise<unknown> {
    return this.request("/registry/profile");
  }

  // --- Transfer Routes ---
  async listTransfers(): Promise<{ transfers: StoredTransfer[] }> {
    try {
      return await this.request<{ transfers: StoredTransfer[] }>("/transfer");
    } catch (err) {
      if (!canFallback(err)) throw err;
      return { transfers: getStoredTransfers() };
    }
  }

  async initiateTransfer(
    payload: TransferInitiatePayload & {
      sourceSigner?: string;
      sourceRegistryId?: string;
    },
  ): Promise<{ success: boolean; transfer: StoredTransfer }> {
    try {
      return await this.request<{ success: boolean; transfer: StoredTransfer }>(
        "/transfer/initiate",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      if (!canFallback(err)) throw err;
      // 1. Lock source credit to RESERVED
      const allCredits = getStoredCredits();
      const updatedCredits = allCredits.map((c) =>
        c.id === payload.creditId ? { ...c, status: "RESERVED" as const } : c,
      );
      saveStoredCredits(updatedCredits);

      // 2. Add transfer record
      const allTransfers = getStoredTransfers();
      const transferId = (allTransfers.length + 1).toString();
      const source =
        payload.sourceSigner || "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";

      // Hex credit reference
      const creditRef =
        "0x" +
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      const newTransfer: StoredTransfer = {
        id: transferId,
        sourceRegistry: source,
        destRegistry: payload.destRegistryAddress,
        creditReference: creditRef,
        amount: payload.amount.toString(),
        status: "INITIATED",
        initiatedAt: Math.floor(Date.now() / 1000).toString(),
        completedAt: null,
      };

      allTransfers.unshift(newTransfer);
      saveStoredTransfers(allTransfers);

      return { success: true, transfer: newTransfer };
    }
  }

  async completeTransfer(transferId: string): Promise<{ ok: boolean }> {
    try {
      return await this.request<{ ok: boolean }>(
        `/transfer/${transferId}/complete`,
        {
          method: "POST",
        },
      );
    } catch (err) {
      if (!canFallback(err)) throw err;
      // 1. Update transfer status to COMPLETED
      const allTransfers = getStoredTransfers();
      let completedAmount = 500;
      let targetDest = "";

      const updatedTransfers = allTransfers.map((t) => {
        if (t.id === transferId) {
          completedAmount = parseInt(t.amount, 10) || 500;
          targetDest = t.destRegistry;
          return {
            ...t,
            status: "COMPLETED" as const,
            completedAt: Math.floor(Date.now() / 1000).toString(),
          };
        }
        return t;
      });
      saveStoredTransfers(updatedTransfers);

      // 2. Mark sender credit as TRANSFERRED and mint recipient ACTIVE credit
      const allCredits = getStoredCredits();
      const updatedCredits = allCredits.map((c) =>
        c.status === "RESERVED" ? { ...c, status: "TRANSFERRED" as const } : c,
      );

      // Find dest registry if exists
      const registries = getStoredRegistries();
      const destReg = registries.find(
        (r) => r.signerAddress.toLowerCase() === targetDest.toLowerCase(),
      );

      updatedCredits.unshift({
        id: `CR-RCV-${transferId}`,
        registryId: destReg?.id || "2",
        projectName: "Received Article 6 Carbon Credit",
        vintage: 2024,
        amount: completedAmount,
        ownerCompany: destReg?.name || "Recipient Sovereign Entity",
        status: "ACTIVE",
      });
      saveStoredCredits(updatedCredits);

      return { ok: true };
    }
  }

  async cancelTransfer(transferId: string): Promise<unknown> {
    try {
      return await this.request(`/transfer/${transferId}/cancel`, {
        method: "POST",
      });
    } catch (err) {
      if (!canFallback(err)) throw err;
      const allTransfers = getStoredTransfers();
      const updated = allTransfers.map((t) =>
        t.id === transferId ? { ...t, status: "CANCELLED" as const } : t,
      );
      saveStoredTransfers(updated);
      return { ok: true };
    }
  }

  // --- Governance Routes ---
  async listPendingRegistries(): Promise<{ registries: PendingRegistry[] }> {
    try {
      return await this.request<{ registries: PendingRegistry[] }>(
        "/governance/pending",
      );
    } catch (err) {
      if (!canFallback(err)) throw err;
      const all = getStoredRegistries();
      const pending = all
        .filter((r) => r.tier === "PENDING" || r.tier === "OBSERVER")
        .map((r) => ({
          id: r.id,
          onChainId: r.id,
          name: r.name,
          jurisdiction: r.jurisdiction,
          signerAddress: r.signerAddress,
          metadataURI: r.metadataURI,
          tier: r.tier,
          createdAt: r.createdAt,
        }));
      return { registries: pending };
    }
  }

  async approveRegistry(registryId: string): Promise<unknown> {
    try {
      return await this.request(`/governance/${registryId}/approve`, {
        method: "POST",
      });
    } catch (err) {
      if (!canFallback(err)) throw err;
      const all = getStoredRegistries();
      const updated = all.map((r) =>
        r.id === registryId ? { ...r, tier: "VERIFIED" as const } : r,
      );
      saveStoredRegistries(updated);
      return { id: registryId, tier: "VERIFIED" };
    }
  }

  async rejectRegistry(registryId: string): Promise<unknown> {
    try {
      return await this.request(`/governance/${registryId}/reject`, {
        method: "POST",
      });
    } catch (err) {
      if (!canFallback(err)) throw err;
      const all = getStoredRegistries();
      const updated = all.map((r) =>
        r.id === registryId ? { ...r, tier: "REVOKED" as const } : r,
      );
      saveStoredRegistries(updated);
      return { id: registryId, tier: "REVOKED" };
    }
  }

  async promoteRegistry(registryId: string): Promise<unknown> {
    try {
      return await this.request(`/governance/${registryId}/promote`, {
        method: "POST",
      });
    } catch (err) {
      if (!canFallback(err)) throw err;
      const all = getStoredRegistries();
      const updated = all.map((r) =>
        r.id === registryId ? { ...r, tier: "OBSERVER" as const } : r,
      );
      saveStoredRegistries(updated);
      return { id: registryId, tier: "OBSERVER" };
    }
  }
}

export const apiClient = new ApiClient();
