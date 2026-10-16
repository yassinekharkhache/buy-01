# export $(grep -v '^#' .env | xargs)
docker compose down -v
docker compose up -d
docker exec -it mongodb bash