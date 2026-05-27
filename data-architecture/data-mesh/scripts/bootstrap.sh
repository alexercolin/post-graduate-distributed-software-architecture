#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[1/6] Starting docker-compose stack..."
docker compose up -d

echo "[2/6] Waiting for Trino + Iceberg REST to be ready..."
for _ in {1..30}; do
  if curl -fsS http://localhost:8080/v1/info >/dev/null 2>&1 \
     && curl -fsS http://localhost:8181/v1/config >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "[3/6] Installing Python deps into .venv (pyiceberg, trino)..."
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --quiet --upgrade pip
python -m pip install --quiet "pyiceberg[s3fs,pyarrow]" trino pyarrow pyyaml

echo "[4/6] Seeding source-aligned products..."
python domains/orders/ingest/seed_orders.py
python domains/customers/ingest/seed_customers.py

echo "[5/6] Building aggregate + consumer-aligned products..."
TRINO_EXEC=(docker exec -i dm-trino trino --catalog iceberg --execute)
"${TRINO_EXEC[@]}" "$(cat domains/orders/transform/orders_daily.sql)"
"${TRINO_EXEC[@]}" "$(cat domains/customers/transform/customers_active.sql)"
"${TRINO_EXEC[@]}" "$(cat consumer-aligned/customer-360/query.sql)"
"${TRINO_EXEC[@]}" "$(cat governance/policies/pii_masking.sql)"

echo "[6/6] Running quality checks + sample consumer..."
python domains/orders/quality/checks.py
python domains/customers/quality/checks.py
python consumer-aligned/customer-360/consume.py

echo
echo "Done. Activate the venv to explore further:"
echo "  source data-architecture/data-mesh/.venv/bin/activate"
echo "  python data-architecture/data-mesh/scripts/discover.py"
