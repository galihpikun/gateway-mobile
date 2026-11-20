// Exact TypeScript definitions matching gateway-be Prisma models

export type Role = 'USER' | 'ADMIN' | 'STAFF';

export type OtpType = 'VERIFY_EMAIL' | 'FORGOT_PASSWORD';

export type OrganizerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type EventStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';

export type RefundStatus =
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED';

export type RefundType = 'ORGANIZER_INITIATED' | 'CUSTOMER_REQUESTED';

export interface Refund {
  id: string;
  orderId: string;
  eventId: string;
  requestedById: string;
  type: RefundType;
  status: RefundStatus;
  originalAmount: number | string;
  deductionAmount: number | string;
  amount: number | string;
  reason: string;
  adminReason?: string | null;
  failureReason?: string | null;
  pgRefundId?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedById?: string | null;
  rejectedAt?: string | null;
  succeededAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  order?: Partial<Order>;
  event?: Partial<Event>;
  requestedBy?: Partial<User>;
}

export type OrganizerDocumentType =
  | 'BUSINESS_LICENSE'
  | 'GUARANTEE_LETTER'
  | 'ORGANIZATION_REGISTRATION'
  | 'IDENTITY_CARD';

export type OrganizerDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OrganizerDocument {
  id: string;
  organizerId: string;
  type: OrganizerDocumentType;
  status: OrganizerDocumentStatus;
  fileUrl: string;
  publicId?: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string;
  phoneNumber: string;
  address: string;
  identityCardNumber?: string | null;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  status: OrganizerStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  documents?: OrganizerDocument[];
  user?: Partial<User>;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  role: Role;
  emailVerified: boolean;
  isSuspended: boolean;
  suspendedAt?: string | null;
  suspendReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  organizerProfile?: OrganizerProfile | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  _count?: { events?: number };
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  viewPosition?: string | null;
  price: number | string;
  quota: number;
  availableQuota: number;
  createdAt?: string;
}

export interface Event {
  id: string;
  organizerId: string;
  categoryId: string;
  title: string;
  description: string;
  location: string;
  previewVideoUrl?: string | null;
  venueLayout?: string | null;
  coverImageUrl: string;
  startDatetime: string;
  endDatetime: string;
  isRefundable: boolean;
  status: EventStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  organizer?: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string | null;
    organizerProfile?: OrganizerProfile | null;
  };
  category?: Category;
  ticketTypes?: TicketType[];
  _count?: {
    ticketTypes?: number;
    staffs?: number;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  ticketTypeId: string;
  quantity: number;
  price: number | string;
  createdAt: string;
  ticketType?: TicketType;
  issuedTickets?: IssuedTicket[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number | string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  paymentUrl?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
  orderItems?: OrderItem[];
}

export interface IssuedTicket {
  id: string;
  orderItemId: string;
  ticketCode: string;
  isRedeemed: boolean;
  isCancelled: boolean;
  isRefunded: boolean;
  redeemedAt?: string | null;
  createdAt: string;
  orderItem?: {
    id: string;
    ticketType: {
      id: string;
      name: string;
      price: number | string;
      eventId: string;
      event?: {
        id: string;
        title: string;
        location: string;
        startDatetime: string;
        endDatetime: string;
        coverImageUrl: string;
      };
    };
    order?: {
      id: string;
      orderNumber: string;
      paymentStatus: PaymentStatus;
    };
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface LoginResponse {
  message?: string;
  token?: string;
  access_token?: string;
  accessToken?: string;
  role?: Role;
  data?: Partial<User>;
}
