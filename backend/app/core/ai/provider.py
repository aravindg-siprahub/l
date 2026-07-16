from abc import ABC, abstractmethod
from typing import Any, Dict

class IAIProvider(ABC):
    """Abstract base class for interacting with AI engines."""

    @abstractmethod
    async def generate_text(self, prompt: str, context: str = "") -> str:
        """Generate text based on a prompt and optional context."""
        pass

    @abstractmethod
    async def extract_structured_data(self, text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured data adhering to a specific JSON schema."""
        pass
