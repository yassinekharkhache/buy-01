# export $(grep -v '^#' .env | xargs)
docker compose -p buy01-product-db down -v
docker compose -p buy01-product-db up -d
docker exec -it mongodb_product_service bash