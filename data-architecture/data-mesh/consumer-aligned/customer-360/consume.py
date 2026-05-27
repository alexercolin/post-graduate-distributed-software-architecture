"""Sample consumer of the customer_360 consumer-aligned data product."""
import trino

conn = trino.dbapi.connect(host="localhost", port=8080, user="analyst", catalog="iceberg")
cur = conn.cursor()
cur.execute(
    """
    SELECT
      country,
      count(*)                            AS customers,
      round(avg(lifetime_value), 2)       AS avg_ltv,
      round(sum(lifetime_value), 2)       AS total_ltv
    FROM iceberg.consumer.customer_360
    GROUP BY country
    ORDER BY total_ltv DESC
    """
)
print(f"{'country':<10}{'customers':<12}{'avg LTV':<12}{'total LTV':<12}")
print("-" * 46)
for country, n, avg, total in cur.fetchall():
    print(f"{country:<10}{n:<12}{avg:<12}{total:<12}")
