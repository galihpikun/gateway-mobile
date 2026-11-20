/**
 * Gateway Mobile — API Client
 * Mirrors gateway-fe/src/lib/api.ts, adapted for React Native.
 *
 * Routes are mounted at both /api and / — we use /api prefix.
 */
import { backendUrl } from './backend';
import { getToken, setToken, removeToken } from './tokenStore';
import {
  User,
  Category,
  Event,
  PaginatedResponse,
  LoginResponse,
  IssuedTicket,
  Order,
  TicketType,
  OrganizerProfile,
  Refund,
} from '../types/api';

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers = new Headers((options.headers as Record<string, string>) || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = backendUrl() + cleanEndpoint;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, options.body instanceof FormData ? 120_000 : 20_000);

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });

    const contentType = res.headers.get('content-type');
    let data: unknown = null;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      const errorObj = data as { message?: string; statusCode?: number };
      const message =
        errorObj?.message ||
        `Request failed with status ${res.status}: ${res.statusText}`;
      throw new ApiError(message, res.status, data);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = controller.signal.aborted ? 'Permintaan ke Gateway melewati batas waktu.' : 'Gateway tidak dapat dihubungi. Periksa jaringan dan alamat backend.';
    throw new ApiError(message, 0);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    // Backend returns either `token` or `access_token`
    const token = res.token ?? res.access_token ?? res.accessToken;
    if (token) await setToken(token);
    return res;
  },

  register: async (
    fullName: string,
    email: string,
    password: string,
  ): Promise<{ message: string; user?: User }> => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });
  },

  getMe: async (): Promise<User> => {
    const res = await apiFetch<{ data: User }>('/auth/me');
    return res.data;
  },

  updateMe: async (
    formData: FormData,
  ): Promise<{ message: string; user?: User; data?: Partial<User> }> => {
    return apiFetch('/auth/me', {
      method: 'PATCH',
      body: formData,
    });
  },

  sendChangePasswordOtp: async (): Promise<{ message: string; email?: string }> => {
    return apiFetch('/auth/change-password/otp', {
      method: 'POST',
    });
  },

  changePassword: async (
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    return apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ otpCode: code, newPassword }),
    });
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      await removeToken();
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyForgotPassword: async (
    email: string,
    code: string,
  ): Promise<{ message: string }> => {
    return apiFetch('/auth/verify-forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  resetPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, password: newPassword }),
    });
  },
};

// ==========================================
// CATEGORIES API
// ==========================================
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    return apiFetch<Category[]>('/categories');
  },
};

// ==========================================
// EVENTS API
// ==========================================
export const eventApi = {
  getPublicEvents: async (params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Event>> => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category) q.set('category', params.category);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const events = await apiFetch<Event[]>(`/events?${q.toString()}`);
    const filtered = events.filter((event) => {
      const search = params?.search?.toLowerCase() || '';
      return (
        (!search ||
          `${event.title} ${event.location}`.toLowerCase().includes(search)) &&
        (!params?.category || event.categoryId === params.category)
      );
    });
    const page = params?.page || 1;
    const limit = params?.limit || 9;
    return {
      data: filtered.slice((page - 1) * limit, page * limit),
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
    };
  },

  getMostPopular: async (): Promise<Event[]> => {
    return apiFetch<Event[]>('/events/most-popular');
  },

  getEventDetail: async (id: string): Promise<Event> => {
    return apiFetch<Event>(`/events/${id}`);
  },

  getMyOrganizerEvents: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Event>> => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<PaginatedResponse<Event>>(
      `/events/organizer/my-events?${q.toString()}`,
    );
  },

  submitEvent: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/events/${id}/submit`, { method: 'PATCH' });
  },

  completeEvent: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/events/${id}/complete`, { method: 'PATCH' });
  },

  createEvent: async (formData: FormData): Promise<Event> => {
    const res = await apiFetch<{ event: Event }>('/events', {
      method: 'POST',
      body: formData,
    });
    return res.event;
  },

  updateEvent: async (
    id: string,
    formData: FormData,
  ): Promise<{ message: string; event: Event }> => {
    return apiFetch<{ message: string; event: Event }>(`/events/${id}`, {
      method: 'PATCH',
      body: formData,
    });
  },

  getOrganizerEventDetail: async (id: string): Promise<Event> => {
    return apiFetch<Event>(`/events/organizer/${id}`);
  },

  inviteStaff: async (
    eventId: string,
    userId: string,
  ): Promise<{ message: string }> => {
    return apiFetch(`/events/organizer/${eventId}/staff`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  removeOrganizerStaff: async (
    eventId: string,
    assignmentId: string,
  ): Promise<{ message: string }> => {
    return apiFetch(`/events/organizer/${eventId}/staff/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  searchInvitableUsers: async (search?: string): Promise<User[]> => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    return apiFetch<User[]>(`/events/search-invitable-users?${q.toString()}`);
  },
};

// ==========================================
// TICKET TYPES API
// ==========================================
export const ticketTypeApi = {
  getByEvent: async (eventId: string): Promise<TicketType[]> => {
    return apiFetch<TicketType[]>(`/ticket-types/event/${eventId}`);
  },

  create: async (
    eventId: string,
    data: { name: string; price: number; quota: number; viewPosition?: string },
  ): Promise<TicketType> => {
    return apiFetch<TicketType>(`/ticket-types/event/${eventId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      price?: number;
      quota?: number;
      viewPosition?: string;
    },
  ): Promise<TicketType> => {
    return apiFetch<TicketType>(`/ticket-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/ticket-types/${id}`, { method: 'DELETE' });
  },
};

// ==========================================
// ORDERS API
// ==========================================
export const orderApi = {
  create: async (data: {
    items: { ticketTypeId: string; quantity: number }[];
    buyer: { fullName: string; email: string; phone: string; identityType: string; identityNumber: string; language: 'id' | 'en' };
    idempotencyKey: string;
  }) => {
    const response = await apiFetch<{ order: Order; paymentUrl?: string }>('/orders', { method: 'POST', body: JSON.stringify(data) });
    return { ...response.order, paymentUrl: response.paymentUrl ?? response.order.paymentUrl };
  },
  getMyOrders: async (): Promise<PaginatedResponse<Order> | Order[]> => {
    return apiFetch<PaginatedResponse<Order> | Order[]>('/orders');
  },

  getOrderDetail: async (id: string): Promise<Order> => {
    return apiFetch<Order>(`/orders/${id}`);
  },
};

// ==========================================
// ISSUED TICKETS API
// ==========================================
export const issuedTicketApi = {
  getMyTickets: async (): Promise<IssuedTicket[]> => {
    return apiFetch<IssuedTicket[]>('/issued-tickets/my');
  },

  getTicketDetail: async (id: string): Promise<IssuedTicket> => {
    return apiFetch<IssuedTicket>(`/issued-tickets/${id}`);
  },
};

// ==========================================
// ORGANIZER API
// ==========================================
export const organizerApi = {
  apply: async (
    formData: FormData,
  ): Promise<{ message: string; status: string; organizerId?: string }> => {
    return apiFetch('/organizer/apply', {
      method: 'POST',
      body: formData,
    });
  },

  getMyProfile: async (): Promise<OrganizerProfile> => {
    return apiFetch<OrganizerProfile>('/organizer/me');
  },

  getDashboard: async (): Promise<unknown> => {
    return apiFetch('/organizer/dashboard');
  },

  getStaff: async (
    eventId?: string,
  ): Promise<{ active?: any[]; pending?: any[]; totalCount?: number }> => {
    const q = new URLSearchParams();
    if (eventId) q.set('eventId', eventId);
    return apiFetch(`/organizer/staff?${q.toString()}`);
  },
};

// ==========================================
// REFUNDS API
// ==========================================
export const refundApi = {
  create: (orderId: string, reason: string) => apiFetch<{ message: string }>('/refunds', { method: 'POST', body: JSON.stringify({ orderId, reason }) }),
  getOrganizerRefunds: async (params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<PaginatedResponse<Refund>> => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
      ...(params.status ? { status: params.status } : {}),
    });
    return apiFetch(`/refunds/organizer?${query.toString()}`);
  },

  approveRefund: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/refunds/admin/${id}/approve`, { method: 'PATCH' });
  },

  rejectRefund: async (
    id: string,
    adminReason: string,
  ): Promise<{ message: string }> => {
    return apiFetch(`/refunds/admin/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        reason: adminReason,
        adminReason,
        rejectionReason: adminReason,
      }),
    });
  },
};
