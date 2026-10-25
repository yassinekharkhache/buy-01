# export $(grep -v '^#' .env | xargs)
docker compose -p buy01-user-db down -v
docker compose -p buy01-user-db up -d
docker exec -it mongodb_user_service bash