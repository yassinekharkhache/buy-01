# export $(grep -v '^#' .env | xargs)
docker compose -p buy01-order-db down -v
docker compose -p buy01-order-db up -d
docker exec -it mongodb_order_service bash