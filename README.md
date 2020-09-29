# keep-metrics
Keep ECDSA Metrics for Prometheus

Following env variables are required for the app to work
```
PORT=<port number for the node app>
infura=<infura account id>
operator=<operator address>
```  
Once the app the running the stats would be available at localhost:8080/metrics. this end point can be used with prometheus to aggregate the metrics and chart on Grafana.
