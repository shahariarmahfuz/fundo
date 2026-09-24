export interface DashboardSummary {
  total_members?: number | null;
  active_members?: number | null;
  total_beneficiaries?: number | null;
  total_groups?: number | null;
  total_funds_balance?: number | null;
  total_donations?: number | null;
  total_contributions?: number | null;
  total_loans_disbursed?: number | null;
  active_loans_count?: number | null;
  total_loans_outstanding?: number | null;
  fund_distribution?: {
    name: string;
    code: string;
    balance: number;
    fund_type: string;
  }[] | null;
}

export interface Member {
  id: string;
  member_number: string;
  full_name: string;
  national_id?: string | null;
  phone: string;
  email?: string | null;
  gender: string;
  date_of_birth?: string | null;
  address?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  membership_status: string;
  join_date: string;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  beneficiary_code: string;
  full_name: string;
  category: string;
  national_id?: string | null;
  phone?: string | null;
  location?: string | null;
  status: string;
  assistance_type: string;
  total_aid_received: number;
  notes?: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  region?: string | null;
  meeting_frequency: string;
  status: string;
  member_count: number;
  created_at: string;
}

export interface Fund {
  id: string;
  code: string;
  name: string;
  fund_type: string;
  currency: string;
  description?: string | null;
  is_active: boolean;
  current_balance: number;
  created_at: string;
}

export interface Donation {
  id: string;
  receipt_number: string;
  donor_name: string;
  donor_email?: string | null;
  donor_phone?: string | null;
  is_anonymous: boolean;
  amount: number;
  donation_category: string;
  fund_id: string;
  fund_name?: string | null;
  payment_method: string;
  payment_reference?: string | null;
  status: string;
  notes?: string | null;
  donation_date: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  receipt_number: string;
  member_id: string;
  member_name?: string | null;
  member_number?: string | null;
  fund_id: string;
  fund_name?: string | null;
  amount: number;
  contribution_type: string;
  payment_method: string;
  payment_reference?: string | null;
  status: string;
  contribution_date: string;
  created_at: string;
}

export interface Loan {
  id: string;
  loan_number: string;
  member_id: string;
  member_name?: string | null;
  member_number?: string | null;
  fund_id: string;
  fund_name?: string | null;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_installment: number;
  total_repayable: number;
  total_repaid: number;
  outstanding_balance: number;
  status: string;
  disbursement_date?: string | null;
  due_date?: string | null;
  purpose?: string | null;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  transaction_number: string;
  fund_id: string;
  fund_name?: string | null;
  transaction_type: string;
  category: string;
  amount: number;
  balance_after: number;
  source_module: string;
  source_reference?: string | null;
  description: string;
  created_by?: string | null;
  transaction_date: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_number: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  description: string;
  reference?: string | null;
  entry_date: string;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string | null;
  is_public: boolean;
  created_at: string;
}

export interface QardHasanahLoan {
  id: string;
  loan_number: string;
  borrower_id: string;
  borrower_name?: string | null;
  borrower_number?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  group_code?: string | null;
  fund_id: string;
  fund_name?: string | null;
  principal_amount: number;
  total_repaid: number;
  outstanding_principal: number;
  disbursement_date?: string | null;
  repayment_start_date?: string | null;
  repayment_schedule: string;
  installment_amount: number;
  installment_count: number;
  purpose?: string | null;
  notes?: string | null;
  status: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QardHasanahRepayment {
  id: string;
  receipt_number: string;
  loan_id: string;
  loan_number?: string | null;
  borrower_name?: string | null;
  borrower_number?: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface QardHasanahReport {
  total_issued_amount: number;
  total_principal_outstanding: number;
  total_principal_repaid: number;
  total_loans_count: number;
  active_count: number;
  partially_repaid_count: number;
  fully_repaid_count: number;
  pending_count: number;
  cancelled_count: number;
  overdue_count: number;
  borrower_summary: {
    borrower_name: string;
    member_number: string;
    loans_count: number;
    total_principal: number;
    total_repaid: number;
    outstanding: number;
  }[];
  group_summary: {
    group_name: string;
    group_code: string;
    loans_count: number;
    total_principal: number;
    total_repaid: number;
    outstanding: number;
  }[];
}

export interface SadaqaDonation {
  id: string;
  receipt_number: string;
  donor_type: 'member' | 'beneficiary' | 'other';
  member_id?: string | null;
  member_name?: string | null;
  member_number?: string | null;
  beneficiary_id?: string | null;
  beneficiary_name?: string | null;
  beneficiary_number?: string | null;
  donor_name: string;
  donor_email?: string | null;
  donor_phone?: string | null;
  is_anonymous: boolean;
  amount: number;
  fund_id: string;
  fund_name?: string | null;
  fund_code?: string | null;
  donation_date: string;
  payment_method: string;
  reference?: string | null;
  purpose?: string | null;
  notes?: string | null;
  status: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SadaqaReport {
  total_amount_received: number;
  total_donations_count: number;
  average_donation_amount: number;
  this_month_amount: number;
  this_year_amount: number;
  fund_breakdown: {
    fund_id: string;
    fund_name: string;
    fund_code: string;
    count: number;
    total_amount: number;
    percentage: number;
  }[];
  monthly_breakdown: {
    month: string;
    count: number;
    total_amount: number;
  }[];
  donor_type_breakdown: {
    donor_type: string;
    count: number;
    total_amount: number;
  }[];
  top_donors: {
    donor_name: string;
    donor_type: string;
    count: number;
    total_amount: number;
  }[];
}

export interface MemberApplication {
  id: string;
  application_reference: string;
  full_name: string;
  date_of_birth?: string | null;
  gender: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  area?: string | null;
  occupation?: string | null;
  emergency_contact?: string | null;
  reason_for_joining?: string | null;
  additional_info?: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by_id?: string | null;
  reviewed_by_name?: string | null;
  review_notes?: string | null;
  rejection_reason?: string | null;
  member_id?: string | null;
  member_number?: string | null;
  created_at: string;
  updated_at: string;
}

