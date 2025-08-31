const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'authUser';
const COMPANY_KEY = 'insurerCompany';
const BROKER_COMPANY_KEY = 'brokerCompany';

export function setAuthTokens(token: string, refreshToken?: string | null): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (refreshToken !== undefined) {
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      else localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {}
}

export function setAuthUser(user: unknown): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getAuthUser<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_KEY);
  } catch {}
}

export interface StoredCompanyInfo {
  id: number;
  name: string;
  logo?: string | null;
}

export function setInsurerCompany(company: StoredCompanyInfo): void {
  try {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  } catch {}
}

export function getInsurerCompany(): StoredCompanyInfo | null {
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    return raw ? JSON.parse(raw) as StoredCompanyInfo : null;
  } catch {
    return null;
  }
}

export function getInsurerCompanyId(): number | null {
  const company = getInsurerCompany();
  if (company?.id) return company.id;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return typeof user?.company_id === 'number' ? user.company_id : null;
  } catch {
    return null;
  }
}

// Broker company storage helpers
export function setBrokerCompany(company: StoredCompanyInfo): void {
  try {
    localStorage.setItem(BROKER_COMPANY_KEY, JSON.stringify(company));
  } catch {}
}

export function getBrokerCompany(): StoredCompanyInfo | null {
  try {
    const raw = localStorage.getItem(BROKER_COMPANY_KEY);
    return raw ? JSON.parse(raw) as StoredCompanyInfo : null;
  } catch {
    return null;
  }
}

export function getBrokerCompanyId(): number | null {
  const company = getBrokerCompany();
  if (company?.id) return company.id;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return typeof user?.company_id === 'number' ? user.company_id : null;
  } catch {
    return null;
  }
}


