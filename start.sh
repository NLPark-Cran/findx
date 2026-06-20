#!/bin/bash
set -e

cd "$(dirname "$0")"

start_backend() {
    echo "Starting backend on port 8006..."
    cd backend
    source .venv/bin/activate
    uvicorn main:app --host 127.0.0.1 --port 8006
}

start_frontend() {
    echo "Starting frontend on port 3006..."
    cd frontend
    npm start -- -p 3006
}

case "${1:-both}" in
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    both)
        start_backend &
        start_frontend &
        wait
        ;;
    *)
        echo "Usage: $0 {backend|frontend|both}"
        exit 1
        ;;
esac
