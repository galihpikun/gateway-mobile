import { apiFetch } from './api';
import type { Event, OrganizerProfile, PaginatedResponse, Refund, User } from '../types/api';

const patch = (path: string, data?: object) => apiFetch<{ message: string }>(path, {
  method: 'PATCH', ...(data ? { body: JSON.stringify(data) } : {}),
});

export const adminApi = {
  dashboard: () => apiFetch<{ summary: Record<string, number> }>('/admin/dashboard'),
  events: (page: number) => apiFetch<PaginatedResponse<Event>>('/events/admin?limit=10&page=' + page),
  organizers: (page: number) => apiFetch<PaginatedResponse<OrganizerProfile>>('/organizer/admin?limit=10&page=' + page),
  organizer: (id: string) => apiFetch<OrganizerProfile>('/organizer/admin/' + id),
  refunds: (page: number) => apiFetch<PaginatedResponse<Refund>>('/refunds/admin?limit=10&page=' + page),
  users: (page: number) => apiFetch<PaginatedResponse<User>>('/users/admin?limit=10&page=' + page),
  reviewEvent: (id: string, action: 'approve' | 'reject', reason?: string) => patch('/events/admin/' + id + '/' + action, reason ? { reason } : undefined),
  reviewOrganizer: (id: string, action: 'approve' | 'reject', reason?: string) => patch('/organizer/admin/' + id + '/' + action, reason ? { reason } : undefined),
  reviewDocument: (id: string, action: 'approve' | 'reject', reason?: string) => patch('/organizer/admin/documents/' + id + '/' + action, reason ? { reason } : undefined),
  reviewRefund: (id: string, action: 'approve' | 'reject', reason?: string) => patch('/refunds/admin/' + id + '/' + action, reason ? { adminReason: reason } : undefined),
};

export type GateEvent = Pick<Event, 'id' | 'title' | 'location' | 'status' | 'startDatetime' | 'endDatetime'> & { isActive: boolean };
export type GateDashboard = {
  event: GateEvent;
  statistics: { totalParticipants: number; totalRedeemed: number; remainingTickets: number; redemptionRate: number };
  recentRedemptions: { id: string; ticketCode: string; ticketType: string; buyerName: string; redeemedAt: string }[];
};
export type GateTicket = {
  id: string; ticketCode: string; isRedeemed: boolean; isCancelled: boolean; isRefunded: boolean;
  owner: Pick<User, 'fullName'>;
  ticketType: { name: string };
};
export const staffApi = {
  events: () => apiFetch<GateEvent[]>('/staff/events'),
  dashboard: (id: string) => apiFetch<GateDashboard>('/staff/events/' + id + '/dashboard'),
  lookup: (eventId: string, ticketCode: string) => apiFetch<GateTicket>('/ticket-redemption/lookup', { method: 'POST', body: JSON.stringify({ eventId, ticketCode }) }),
  redeem: (eventId: string, ticketCode: string) => apiFetch<{ message: string }>('/ticket-redemption/redeem', { method: 'POST', body: JSON.stringify({ eventId, ticketCode }) }),
};
