import logging
import sys
import json
import warnings
from datetime import datetime, timezone

# Suppress PendingDeprecationWarning from starlette 0.37.x which imports the
# legacy `multipart` shim bundled inside python-multipart 0.0.x. This warning
# is a third-party issue — our code uses `python_multipart` correctly.
# Can be removed when upgrading fastapi to >=0.112 (which pulls starlette >=0.38).
warnings.filterwarnings(
    "ignore",
    message="Please use `import python_multipart` instead.",
    category=PendingDeprecationWarning,
    module="multipart",
)

class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings after parsing the LogRecord.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)

def setup_logging(level: int = logging.INFO):
    """
    Configures the root logger with a JSON formatter.
    """
    logger = logging.getLogger()
    logger.setLevel(level)
    
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
        
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    
    # Set uvicorn loggers to use the same configuration
    for logger_name in ("uvicorn", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers = []
        uvicorn_logger.propagate = True
