import { API_PREFIX, API_URL } from "./config";
import { t } from "@/i18n";
import { useAuthStore } from "@/store/auth";

export class ApiError extends Error {
    constructor(status, message, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

export function buildUrl(path, params) {
    const url = `${API_URL}${API_PREFIX}${path}`;
    if (!params) return url;
    const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    return qs ? `${url}?${qs}` : url;
}

let refreshing = null;

async function refreshSession() {
    const { refreshToken, setTokens, logout } = useAuthStore.getState();
    if (!refreshToken) return false;
    refreshing ??= fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
    })
        .then(async (res) => {
            if (!res.ok) throw new Error("refresh failed");
            const data = await res.json();
            setTokens(data.access_token, data.refresh_token ?? refreshToken);
            return true;
        })
        .catch(() => {
            logout();
            return false;
        })
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
}

export async function request(path, { method = "GET", params, body, retry = true } = {}) {
    const { accessToken } = useAuthStore.getState();
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let res;
    try {
        res = await fetch(buildUrl(path, params), {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError(0, t("common.networkError"));
    }

    if (res.status === 401 && accessToken && retry && (await refreshSession())) {
        return request(path, { method, params, body, retry: false });
    }

    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
        const message = (data && (data.detail?.toString?.() || data.message)) || t("common.httpError", { status: res.status });
        throw new ApiError(res.status, message, data);
    }
    return data;
}

function safeJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}
