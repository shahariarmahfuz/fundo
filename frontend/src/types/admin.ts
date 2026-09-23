export interface DashboardSummary {
  total_members: number;
  active_members: number;
  total_beneficiaries: number;
  total_groups: number;
  total_funds_balance: number;
  total_donations: number;
  total_contributions: number;
  total_loans_disbursed: number;
  active_loans_count: number;
  total_loans_outstanding: number;
  fund_distribution: {
    name: string;
    code: string;
    balance: number;
    fund_type: string;
  }[];
  recent_transactions: {
    id: string;
    transaction_number: string;
    transaction_type: 'credit' | 'debit';
    category: string;
    amount: number;
    description: string;
    date: string;
  }[];
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
