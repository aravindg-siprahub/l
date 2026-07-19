import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.infrastructure.database.session import SessionLocal
from app.services.timesheet_service import get_client_manager_stats
from app.core.db.models import User

def main():
    db = SessionLocal()
    try:
        # Let's find the client manager first. Based on screenshot, name is 'kumar' or something similar.
        # But we can just find any user with role 'client_manager'
        managers = db.query(User).filter(User.role == 'client_manager').all()
        if not managers:
            print("No client managers found.")
            return

        for manager in managers:
            print(f"Stats for {manager.email} ({manager.full_name}):")
            try:
                stats = get_client_manager_stats(db, manager.email)
                print(stats)
            except Exception as e:
                import traceback
                print(f"Error fetching stats for {manager.email}: {e}")
                traceback.print_exc()
            print("-" * 20)

    finally:
        db.close()

if __name__ == "__main__":
    main()
