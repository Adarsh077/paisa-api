docker build -t paisa-api .
docker rm -f paisa-api
docker run --name paisa-api --env-file .env -p 8001:8001 -d paisa-api:latest