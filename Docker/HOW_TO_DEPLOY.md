Update `flask` and `react` images to versions specified in
`docker-compose` file:
```
docker-compose -f docker-compose-deploy.yml pull flask react
```

Stop and restart the containers:
```
docker-compose -f docker-compose-deploy.yml down
docker-compose -f docker-compose-deploy.yml up -d
```

View the logs:
```
docker-compose -f docker-compose-deploy.yml logs --tail="all" -f
```
