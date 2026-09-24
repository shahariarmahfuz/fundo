from typing import List, Dict, Any

SYSTEM_PERMISSIONS: List[Dict[str, str]] = [
    # Members
    {"code": "members.view", "module": "members", "action": "view", "description": "View community members directory and profiles"},
    {"code": "members.create", "module": "members", "action": "create", "description": "Enroll new community members"},
    {"code": "members.edit", "module": "members", "action": "edit", "description": "Update community member information"},
    {"code": "members.delete", "module": "members", "action": "delete", "description": "Remove community member records"},

    # Member Applications
    {"code": "member_applications.view", "module": "member_applications", "action": "view", "description": "View public member applications and review queue"},
    {"code": "member_applications.review", "module": "member_applications", "action": "review", "description": "Review and add notes to member applications"},
    {"code": "member_applications.approve", "module": "member_applications", "action": "approve", "description": "Approve member applications and enroll members"},
    {"code": "member_applications.reject", "module": "member_applications", "action": "reject", "description": "Reject member applications"},
    {"code": "member_applications.delete", "module": "member_applications", "action": "delete", "description": "Delete member application records"},

    # Beneficiaries
    {"code": "beneficiaries.view", "module": "beneficiaries", "action": "view", "description": "View charitable beneficiary registry"},
    {"code": "beneficiaries.create", "module": "beneficiaries", "action": "create", "description": "Register new aid beneficiaries"},
    {"code": "beneficiaries.edit", "module": "beneficiaries", "action": "edit", "description": "Update beneficiary information and aid allocations"},
    {"code": "beneficiaries.delete", "module": "beneficiaries", "action": "delete", "description": "Remove beneficiary records"},

    # Groups
    {"code": "groups.view", "module": "groups", "action": "view", "description": "View savings circles and cluster groups"},
    {"code": "groups.create", "module": "groups", "action": "create", "description": "Form new community savings circles"},
    {"code": "groups.edit", "module": "groups", "action": "edit", "description": "Update savings circle details and cadences"},
    {"code": "groups.delete", "module": "groups", "action": "delete", "description": "Disband savings circles"},

    # Contributions
    {"code": "contributions.view", "module": "contributions", "action": "view", "description": "View member savings and deposit contributions"},
    {"code": "contributions.create", "module": "contributions", "action": "create", "description": "Record member savings and dues receipts"},
    {"code": "contributions.edit", "module": "contributions", "action": "edit", "description": "Modify contribution records"},
    {"code": "contributions.delete", "module": "contributions", "action": "delete", "description": "Void contribution records"},

    # Loans
    {"code": "loans.view", "module": "loans", "action": "view", "description": "View Qard Hasan micro-loan portfolio"},
    {"code": "loans.create", "module": "loans", "action": "create", "description": "Disburse revolving micro-loans"},
    {"code": "loans.edit", "module": "loans", "action": "edit", "description": "Adjust loan repayment terms and schedules"},
    {"code": "loans.delete", "module": "loans", "action": "delete", "description": "Cancel loan applications or records"},

    # Qard Hasanah (Interest-Free Loans)
    {"code": "qard_hasanah.view", "module": "qard_hasanah", "action": "view", "description": "View interest-free Qard Hasanah loan portfolio and repayment records"},
    {"code": "qard_hasanah.create", "module": "qard_hasanah", "action": "create", "description": "Issue interest-free Qard Hasanah loans"},
    {"code": "qard_hasanah.edit", "module": "qard_hasanah", "action": "edit", "description": "Update Qard Hasanah terms and status"},
    {"code": "qard_hasanah.delete", "module": "qard_hasanah", "action": "delete", "description": "Cancel or delete Qard Hasanah records"},
    {"code": "qard_hasanah.repayment", "module": "qard_hasanah", "action": "repayment", "description": "Record interest-free principal repayments"},
    {"code": "qard_hasanah.reports", "module": "qard_hasanah", "action": "reports", "description": "Access Qard Hasanah portfolio reports and analytics"},

    # Finance
    {"code": "finance.view", "module": "finance", "action": "view", "description": "View foundation funds, balances, and double-entry ledgers"},
    {"code": "finance.create", "module": "finance", "action": "create", "description": "Establish new capital funds and record financial entries"},
    {"code": "finance.edit", "module": "finance", "action": "edit", "description": "Modify fund configurations"},
    {"code": "finance.delete", "module": "finance", "action": "delete", "description": "Close or archive funds"},

    # Donations & Sadaqa
    {"code": "donations.view", "module": "donations", "action": "view", "description": "View charitable donations and Sadaqa/Zakat inflows"},
    {"code": "donations.create", "module": "donations", "action": "create", "description": "Record donor gifts and charity receipts"},
    {"code": "donations.edit", "module": "donations", "action": "edit", "description": "Modify donation records"},
    {"code": "donations.delete", "module": "donations", "action": "delete", "description": "Void donation entries"},

    # Sadaqa (Dedicated Module)
    {"code": "sadaqa.view", "module": "sadaqa", "action": "view", "description": "View Sadaqa donations, donor registries, and receipts"},
    {"code": "sadaqa.create", "module": "sadaqa", "action": "create", "description": "Record new permanent Sadaqa donations with financial settlement"},
    {"code": "sadaqa.edit", "module": "sadaqa", "action": "edit", "description": "Update Sadaqa donation records and metadata"},
    {"code": "sadaqa.delete", "module": "sadaqa", "action": "delete", "description": "Cancel or void Sadaqa donations with transaction reversal"},
    {"code": "sadaqa.reports", "module": "sadaqa", "action": "reports", "description": "Access Sadaqa donor breakdowns, trends, and fund reports"},

    # Reports
    {"code": "reports.view", "module": "reports", "action": "view", "description": "View financial reports and portfolio analytics"},

    # Users
    {"code": "users.view", "module": "users", "action": "view", "description": "View staff directory and operator accounts"},
    {"code": "users.create", "module": "users", "action": "create", "description": "Provision new administrative staff accounts"},
    {"code": "users.edit", "module": "users", "action": "edit", "description": "Update staff profiles, roles, and status"},
    {"code": "users.delete", "module": "users", "action": "delete", "description": "Deactivate or remove staff accounts"},

    # Roles
    {"code": "roles.view", "module": "roles", "action": "view", "description": "View role definitions and permissions matrix"},
    {"code": "roles.create", "module": "roles", "action": "create", "description": "Create custom roles and permission bundles"},
    {"code": "roles.edit", "module": "roles", "action": "edit", "description": "Update role permissions and assignments"},
    {"code": "roles.delete", "module": "roles", "action": "delete", "description": "Delete custom roles"},

    # Settings
    {"code": "settings.view", "module": "settings", "action": "view", "description": "View system configuration parameters"},
    {"code": "settings.edit", "module": "settings", "action": "edit", "description": "Modify global platform settings"},
]

ALL_PERMISSION_CODES = [p["code"] for p in SYSTEM_PERMISSIONS]

DEFAULT_ROLES: List[Dict[str, Any]] = [
    {
        "name": "super_admin",
        "display_name": "Super Admin",
        "description": "Unrestricted administrative authority with full system control and bypass capabilities",
        "is_system": True,
        "permissions": ALL_PERMISSION_CODES,
    },
    {
        "name": "admin",
        "display_name": "General Administrator",
        "description": "Full day-to-day administrative authority over all operational modules",
        "is_system": True,
        "permissions": [
            p for p in ALL_PERMISSION_CODES
            if not p.startswith("roles.delete")
        ],
    },
    {
        "name": "finance",
        "display_name": "Finance & Treasury",
        "description": "Fiduciary management over funds, donations, loan disbursements, and general ledgers",
        "is_system": True,
        "permissions": [
            "finance.view", "finance.create", "finance.edit",
            "donations.view", "donations.create", "donations.edit",
            "sadaqa.view", "sadaqa.create", "sadaqa.edit", "sadaqa.delete", "sadaqa.reports",
            "contributions.view", "contributions.create", "contributions.edit",
            "loans.view", "loans.create", "loans.edit",
            "qard_hasanah.view", "qard_hasanah.create", "qard_hasanah.edit", "qard_hasanah.repayment", "qard_hasanah.reports",
            "reports.view",
        ],
    },
    {
        "name": "manager",
        "display_name": "Operations Manager",
        "description": "Program supervisor for community members, aid beneficiaries, and savings circles",
        "is_system": True,
        "permissions": [
            "members.view", "members.create", "members.edit",
            "beneficiaries.view", "beneficiaries.create", "beneficiaries.edit",
            "groups.view", "groups.create", "groups.edit",
            "loans.view", "loans.create",
            "qard_hasanah.view", "qard_hasanah.create", "qard_hasanah.reports",
            "sadaqa.view", "sadaqa.reports",
            "reports.view",
        ],
    },
    {
        "name": "staff",
        "display_name": "Field Officer / Staff",
        "description": "Read-only field worker access for program coordination",
        "is_system": True,
        "permissions": [
            "members.view",
            "beneficiaries.view",
            "groups.view",
            "contributions.view",
            "loans.view",
            "qard_hasanah.view",
            "donations.view",
            "sadaqa.view",
        ],
    },
    {
        "name": "members_viewer",
        "display_name": "Community Member Registry Viewer",
        "description": "Restricted access to view community member profiles only",
        "is_system": False,
        "permissions": [
            "members.view",
        ],
    },
    {
        "name": "finance_specialist",
        "display_name": "Capital & Accounts Specialist",
        "description": "Fiduciary access to view and create financial funds and entries",
        "is_system": False,
        "permissions": [
            "finance.view",
            "finance.create",
        ],
    },
    {
        "name": "donations_officer",
        "display_name": "Charitable Giving & Sadaqa Officer",
        "description": "Restricted to viewing and recording donations and charitable gifts",
        "is_system": False,
        "permissions": [
            "donations.view",
            "donations.create",
            "sadaqa.view",
            "sadaqa.create",
            "sadaqa.reports",
        ],
    },
]
