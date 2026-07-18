export type CustomerProfileData = {
  id: string;
  name: string;
  displayName: string;
  companyName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  shippingAddress?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  website: string;
  taxNumber: string;
  contactId: string;
  customerCode: string;
  openingBalance: number;
  payTermsType: string;
  payTermsValue: number;
  creditLimit: number;
  customerGroup: string;
  advanceBalance: number;
  totalSaleDue: number;
  totalSellReturnDue: number;
  customField1: string;
  customField2: string;
  customField3: string;
  customField4: string;
  customField5: string;
  notes: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tier: 'preferred' | 'standard' | 'vip' | 'new';
  totalPurchases: number;
  totalAmount: number;
  outstandingBalance: number;
  paymentTerms: string;
  leadTime: number;
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
  updatedAt: string;
  lastOrderDate: string;
  lastPaymentDate: string;
};

export type CustomerProfileTabKey =
  | 'ledger'
  | 'sales'
  | 'documents-notes'
  | 'payments'
  | 'activities';
