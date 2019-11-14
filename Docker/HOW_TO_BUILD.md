Build the Docker images:
```
docker-compose -f docker-compose-deploy.yml build react flask
```

Tag the images:
```
docker tag hoechenberger/webtaste-react:latest hoechenberger/webtaste-react:YYYY.MM.DD
docker tag hoechenberger/webtaste-flask:latest hoechenberger/webtaste-flask:YYYY.MM.DD
```

Upload the images to Docker Hub:
```
docker push hoechenberger/webtaste-react:YYYY.MM.DD
docker push hoechenberger/webtaste-react:latest

docker push hoechenberger/webtaste-flask:YYYY.MM.DD
docker push hoechenberger/webtaste-flask:latest
```