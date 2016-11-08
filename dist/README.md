# Grafana App for Kubernetes

[Kubernetes](http://kubernetes.io/) is an open-source system for automating deployment, scaling, and management of containerized applications.

The Grafana Kubernetes App allows you to monitor your Kubernetes cluster's performance.

![Container Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/container-dashboard-screenshot.png)

![Node Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/node-dashboard-screenshot.png)

### Requirements

1. Currently only saves metrics to Graphite.

2. Basic Auth needs to be set up for accessing your Kubernetes cluster.

### Node Metrics

- CPU
- Memory Available
- Load per CPU
- Read IOPS
- Write IOPS
- %Util
- Network Traffic/second
- Network Packets/second
- Network Errors/second

### Container Metrics

- Memory Usage
- Network Traffic
- TCP Connections
- CPU Usage
- Read IOPS
- Write IOPS
- All Established TCP Conn

### Documentation

#### Connecting to your Cluster

1. Go to the Cluster List page via the Kubernetes app menu

  ![Cluster List](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/app-menu-screenshot.png)

2. Click the `New Cluster` button.

3. Fill in the Basic Auth details for your cluster

4. Choose the Graphite datasource that is used for the dashboards.

5. Fill in the details for the Carbon host that is used to write to Graphite.

6. Click `Save and Deploy`.

#### Uninstalling the App and DaemonSet

``` bash
kubectl delete daemonsets -n kube-system snap
kubectl delete configmaps -n kube-system snap-tasks
```

#### Technical Details

Metrics are collected by the [Intel Snap](http://snap-telemetry.io/) collector using the [Docker plugin](https://github.com/intelsdi-x/snap-plugin-collector-docker/blob/master/METRICS.md).  A DaemonSet with Snap is deployed to your Kubernetes cluster when you add a new cluster in the app. The [snap_k8s](https://github.com/raintank/snap_k8s) docker image used for this is based off of Intel's Snap docker image.

The following Snap plugins are used to collect metrics:

- [CPU Collector](https://github.com/intelsdi-x/snap-plugin-collector-cpu/blob/master/METRICS.md)
- [Docker Collector](https://github.com/intelsdi-x/snap-plugin-collector-docker/blob/master/METRICS.md)
- [Network Interface Collector](https://github.com/intelsdi-x/snap-plugin-collector-interface/blob/master/METRICS.md)
- [IOStat Collector](https://github.com/intelsdi-x/snap-plugin-collector-iostat)
- [Load Collector](https://github.com/intelsdi-x/snap-plugin-collector-load#collected-metrics)
- [MemInfo Collector](https://github.com/intelsdi-x/snap-plugin-collector-meminfo/blob/master/METRICS.md)

### Feedback and Questions

Please submit any issues with the app on [Github](https://github.com/raintank/kubernetes-app/issues).
