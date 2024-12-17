# Storage indexer

This repo demonstrates possible workflow of storage indexer. Main purpose is to listen the events of specific Storage contract and store calldata of each `addFile` function call.

To run the service correctly do some prerequisites:

Copy `.env.blank` file and create `.env.akavefuji`. Populate it with necessary data.

To start the service in docker run:

```shell
docker-compose --env-file .env.akavefuji up -d
```

This will start the application and bind it to port 8080 on your local machine. You should see the following message in your terminal:

```shell
Express app listening at http://localhost:8080
```

Access the application: Now that the application is running, you can access it by opening your browser and navigating to the following URL:

```shell
http://localhost:8080/ids
```

This endpoint will return a list of ids that are stored at the database.

```shell
http://localhost:8080/cids/<ID>
```

This endpoint will return a list of cids.
