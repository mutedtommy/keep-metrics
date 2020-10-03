# keep-metrics
Keep ECDSA Metrics for Prometheus

Following env variables are required for the app to work
```
PORT=<port number for the node app>
infura=<infura account id>
operator=<operator address>
```  
You can run the node application directly by using

```bash
node app.js
```

Once the app the running the stats would be available at localhost:<port number>/metrics. this end point can be used with prometheus to aggregate the metrics and chart on Grafana.

## Docker Build
You can build a docker image from the source code. Following is a sample command.

```bash
sudo docker build -t <image-name> .
```

## Docker Run

A pre-packaged docker image is available at Dockerhub at https://hub.docker.com/repository/docker/mutedtommy/keep-prom-metrics 

The image requires 2 environment variables `operator` address and `infura`project ID

Following is the sample command which starts a container and enables http access on port 3000.

```bash
sudo docker run -d \
-e infura=08xxxxxxxxxxxxb0b8a8d3cbfff4121c \
-e operator=0x0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxg5 \
-p 3000:3000  \
--name keep-metrics mutedtommy/keep-prom-metrics
```

Once the container is running the metrics for the operator can be accessed using `localhost:3000/metrics`. This endpoint can be used for scraping and storing metrics in Prometheus timeseries DB.

The output from /metrics endpoint will look like following

```
# HELP tbtc_supply Monitoring tBTC supply overtime
# TYPE tbtc_supply gauge
tbtc_supply 369.21

# HELP my_keeps Number of Keeps the Operator is/has been a part of
# TYPE my_keeps gauge
my_keeps 3

# HELP open_keeps Number of Keeps in open state
# TYPE open_keeps gauge
open_keeps 2

# HELP closed_keeps Number of Keeps successfully closed
# TYPE closed_keeps gauge
closed_keeps 1

# HELP redeem_stats Monitor tBTC Redemptions on Keep Network
# TYPE redeem_stats gauge
redeem_stats{deposit_state="REDEEMED",deposit_id="0x00000000001E04a0666b2c27583C316811XXXXXX"} 10

# HELP collateral_stats Monitor collateralisation %age of deposits held by your keeps
# TYPE collateral_stats gauge
collateral_stats{deposit_state="ACTIVE",lot_size="10",deposit_id="0x0000000968599132FbE1648267d0A7c7AE9XXXXX"} 150
collateral_stats{deposit_state="ACTIVE",lot_size="1",deposit_id="0x0000000f1C2734905647648c88FB42bb0cXXXXXX"} 150
```
