# export $(grep -v '^#' .env | xargs)
docker compose -p buy01-media-db down -v
docker compose -p buy01-media-db up -d
docker exec -it mongodb_media_service bash