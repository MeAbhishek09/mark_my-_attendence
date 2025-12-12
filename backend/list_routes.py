# backend/list_routes.py
from app.main import app
print("Registered routes:")
for r in app.router.routes:
    try:
        methods = getattr(r, "methods", None)
        print(r.path, methods)
    except Exception:
        pass
