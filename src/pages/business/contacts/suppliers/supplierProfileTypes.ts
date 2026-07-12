export type SupplierProfileData = {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  website: string;
  taxNumber: string;
  registrationNumber: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tier: 'preferred' | 'standard' | 'vip' | 'new';
  rating: number;
  totalPurchases: number;
  totalAmount: number;
  outstandingBalance: number;
  paymentTerms: string;
  leadTime: number;
  notes: string;
  categories: string[];
  paymentMethods: string[];
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  contactPerson: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  lastOrderDate: string;
  lastPaymentDate: string;
};

export type SupplierProfileTabKey =
  | 'ledger'
  | 'purchases'
  | 'stock-report'
  | 'documents-notes'
  | 'payments'
  | 'activities';
