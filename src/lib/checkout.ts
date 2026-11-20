import type { Event, User } from '../types/api';

export function canBuy(user: User | null, event: Event) {
  return user?.role === 'USER' && !user.isSuspended && user.organizerProfile?.status !== 'APPROVED' && event.organizerId !== user.id &&
    event.status === 'PUBLISHED' && Date.parse(event.endDatetime) > Date.now();
}
