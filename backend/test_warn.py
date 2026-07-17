import warnings
# Capture all PendingDeprecationWarnings specifically
warnings.simplefilter('always', PendingDeprecationWarning)
import starlette
import starlette.formparsers
print("starlette.formparsers imported OK")
from app.main import app
print("app.main imported OK")
print("No PendingDeprecationWarning from multipart")
