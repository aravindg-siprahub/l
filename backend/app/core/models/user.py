from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin
from app.core.security.roles import Role

class User(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"
    
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    role: Mapped[Role] = mapped_column(SQLEnum(Role), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
