from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import Base
from app.core.security import hash_password
from app.core.rbac_data import SYSTEM_PERMISSIONS, DEFAULT_ROLES
from app.modules.users.models import User, Role, Permission, RolePermission, UserRoleAssociation


def init_all():
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").replace("ssl=require", "sslmode=require")
    print("Connecting to database via sync engine...", flush=True)
    engine = create_engine(sync_url, pool_pre_ping=True)
    
    # 1. Create tables
    Base.metadata.create_all(engine)
    print("RBAC tables created or verified.", flush=True)

    # 2. Seed data
    with Session(engine, expire_on_commit=False) as session:
        # Permissions
        perm_id_map = {}
        for p_data in SYSTEM_PERMISSIONS:
            perm = session.execute(select(Permission).where(Permission.code == p_data["code"])).scalar_one_or_none()
            if not perm:
                perm = Permission(
                    code=p_data["code"],
                    module=p_data["module"],
                    action=p_data["action"],
                    description=p_data["description"]
                )
                session.add(perm)
                session.flush()
            perm_id_map[p_data["code"]] = perm.id
        session.commit()
        print(f"Verified {len(perm_id_map)} permissions.", flush=True)

        # Roles
        role_id_map = {}
        for r_data in DEFAULT_ROLES:
            role = session.execute(select(Role).where(Role.name == r_data["name"])).scalar_one_or_none()
            if not role:
                role = Role(
                    name=r_data["name"],
                    display_name=r_data["display_name"],
                    description=r_data["description"],
                    is_system=r_data["is_system"]
                )
                session.add(role)
                session.flush()
            role_id_map[r_data["name"]] = role.id

            # Role Permissions
            existing_pids = set(session.execute(
                select(RolePermission.permission_id).where(RolePermission.role_id == role.id)
            ).scalars().all())

            for code in r_data["permissions"]:
                if code in perm_id_map:
                    pid = perm_id_map[code]
                    if pid not in existing_pids:
                        session.add(RolePermission(role_id=role.id, permission_id=pid))
                        existing_pids.add(pid)

        session.commit()
        print(f"Verified {len(role_id_map)} roles and their permissions.", flush=True)

        # Users
        def ensure_user(email: str, password: str, full_name: str, role_name: str):
            user = session.execute(select(User).where(User.email == email.lower().strip())).scalar_one_or_none()
            role_id = role_id_map.get(role_name)

            if not user:
                user = User(
                    email=email.lower().strip(),
                    hashed_password=hash_password(password),
                    full_name=full_name,
                    role=role_name,
                    is_active=True
                )
                session.add(user)
                session.flush()
                print(f"Created user {email}", flush=True)
            else:
                user.role = role_name
                session.flush()
                print(f"Updated user {email}", flush=True)

            if role_id:
                assoc = session.execute(select(UserRoleAssociation).where(
                    UserRoleAssociation.user_id == user.id,
                    UserRoleAssociation.role_id == role_id
                )).scalar_one_or_none()
                if not assoc:
                    session.add(UserRoleAssociation(user_id=user.id, role_id=role_id))
                    session.flush()

        ensure_user("admin@fundo.org", "admin123456", "Dr. Amina Rahman (Super Admin)", "super_admin")
        ensure_user("staff@fundo.org", "staff123456", "Kareem Tariq (General Staff)", "staff")
        ensure_user("user_a@fundo.org", "user123456", "User A (Members View Only)", "members_viewer")
        ensure_user("user_b@fundo.org", "user123456", "User B (Finance Specialist)", "finance_specialist")
        ensure_user("user_c@fundo.org", "user123456", "User C (Donations Officer)", "donations_officer")

        session.commit()
        print("RBAC tables, roles, permissions, and test users seeded successfully!", flush=True)

    engine.dispose()


if __name__ == "__main__":
    init_all()
