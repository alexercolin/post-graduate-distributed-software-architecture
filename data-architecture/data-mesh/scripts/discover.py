"""Walk all data_product.yaml files and print the mesh catalog (DATSIS: Discoverable)."""
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent

print(f"{'PRODUCT':<32}{'TYPE':<18}{'OWNER':<32}{'OUTPUT PORT':<40}")
print("-" * 122)
for path in sorted(ROOT.rglob("data_product.yaml")):
    doc = yaml.safe_load(path.read_text())
    domain = doc.get("domain", "?")
    owner = doc.get("owner", "-")
    for p in doc.get("products", []):
        port = next(
            (op["address"] for op in p.get("output_ports", []) if op["kind"] == "iceberg-table"),
            "-",
        )
        print(f"{domain + '.' + p['name']:<32}{p['type']:<18}{owner:<32}{port:<40}")
