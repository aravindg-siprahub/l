from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Any, Optional, List

T = TypeVar("T")
ID = TypeVar("ID")

class IBaseRepository(ABC, Generic[T, ID]):
    """Abstract base class defining standard CRUD operations."""

    @abstractmethod
    async def get_by_id(self, id: ID) -> Optional[T]:
        pass

    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        pass

    @abstractmethod
    async def update(self, entity: T) -> T:
        pass

    @abstractmethod
    async def delete(self, id: ID) -> None:
        pass
