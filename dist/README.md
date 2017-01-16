# Grafana App for Kubernetes

[Kubernetes](http://kubernetes.io/) is an open-source system for automating deployment, scaling, and management of containerized applications.

The Grafana Kubernetes App allows you to monitor your Kubernetes cluster's performance. It includes 4 dashboards, Cluster, Node, Pod/Container and Deployment. It also comes with collectors that are deployed to your cluster to collect health metrics. These these high-level cluster and node stats all the way down to the container level. Use the high-level metrics to alert on and the low-level metrics to troubleshoot.

![Container Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/cluster-dashboard-screenshot.png)

![Container Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/container-dashboard-screenshot.png)

![Node Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/node-dashboard-screenshot.png)

### Requirements

1. Currently only has support for **Graphite**.
2. For automatic deployment of the collectors, then Kubernetes 1.4 or higher is required.
3. Grafana 4 is required if using TLS Client Auth (rather than Basic Auth).

### Cluster Metrics

- Pod Capacity
- Memory Capacity
- CPU Capacity
- Disk Capacity (measures each container's /var/lib/docker)
- Overview of Nodes, Pods and Containers

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

### Pod/Container Metrics

- Memory Usage
- Network Traffic
- TCP Connections
- CPU Usage
- Read IOPS
- Write IOPS
- All Established TCP Conn

### Documentation

#### Connecting to your Cluster

1. Go to the Cluster List page via the Kubernetes app menu.

2. Click the `New Cluster` button.

3. Fill in the Auth details for your cluster.

4. Choose the Graphite datasource that will be used for reading data in the dashboards.

5. Fill in the details for the Carbon host that is used to write to Graphite. This url has to be available from inside the cluster.

6. Click `Deploy`. This will deploy a DaemonSet, to collect health metrics for every node, and a pod that collects cluster metrics.

#### Manual Deployment

If you do not want to deploy the collector DaemonSet and pod automatically, then it can be deployed manually with kubectl. If using an older version of Kubernetes than 1.4, you will have to adapt the json files, particularly for the daemonset, and remove some newer features. Please create an issue if you want support for older versions of Kubernetes.

The manual deployment instructions and files needed can be downloaded from the Cluster Config page. At the bottom, there is a help section with instructions and links to all the json files needed.

#### Uninstalling the App and DaemonSet

There is an Undeploy button on the Cluster Config page as well as manual instructions for kubectl at the bottom of the page.

#### Technical Details

Metrics are collected by the [Intel Snap](http://snap-telemetry.io/) collector using the [Docker plugin](https://github.com/intelsdi-x/snap-plugin-collector-docker/blob/master/METRICS.md).  A DaemonSet with Snap is deployed to your Kubernetes cluster when you add a new cluster in the app. The [snap_k8s](https://github.com/raintank/snap_k8s) docker image used for this is based off of Intel's Snap docker image.

The following Snap plugins are used to collect metrics:

- [CPU Collector](https://github.com/intelsdi-x/snap-plugin-collector-cpu/blob/master/METRICS.md)
- [Docker Collector](https://github.com/intelsdi-x/snap-plugin-collector-docker/blob/master/METRICS.md)
- [Network Interface Collector](https://github.com/intelsdi-x/snap-plugin-collector-interface/blob/master/METRICS.md)
- [IOStat Collector](https://github.com/intelsdi-x/snap-plugin-collector-iostat)
- [Load Collector](https://github.com/intelsdi-x/snap-plugin-collector-load#collected-metrics)
- [MemInfo Collector](https://github.com/intelsdi-x/snap-plugin-collector-meminfo/blob/master/METRICS.md)
- [Kubestats Collector](https://github.com/raintank/snap-plugin-collector-kubestate)

### Feedback and Questions

Please submit any issues with the app on [Github](https://github.com/raintank/kubernetes-app/issues).
