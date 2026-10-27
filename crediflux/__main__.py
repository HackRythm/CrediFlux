"""
CrediFlux CLI Runner
Run with: python -m crediflux
"""

import os
import uvicorn

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("crediflux.main:app", host=host, port=port, reload=False)
