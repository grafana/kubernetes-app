# Grafana App for Kubernetes

[Kubernetes](http://kubernetes.io/) is an open-source system for automating deployment, scaling, and management of containerized applications.

The Grafana Kubernetes App allows you to monitor your Kubernetes cluster's performance. It includes 4 dashboards, Cluster, Node, Pod/Container and Deployment. It also comes with [Intel Snap](http://snap-telemetry.io/) collectors that are deployed to your cluster to collect health metrics. The metrics collected are high-level cluster and node stats as well as lower level pod and container stats. Use the high-level metrics to alert on and the low-level metrics to troubleshoot.

![Container Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/cluster-dashboard-screenshot.png)

![Container Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/container-dashboard-screenshot.png)

![Node Dashboard](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/node-dashboard-screenshot.png)

### Requirements

1. Currently only has support for **Graphite**.
2. For automatic deployment of the collectors, then Kubernetes 1.4 or higher is required.
3. Grafana 4 is required if using TLS Client Auth (rather than Basic Auth).

### Features

- The app uses Kubernetes tags to allow you to filter pod metrics. Kubernetes clusters tend to have a lot of pods and a lot of pod metrics. The Pod/Container dashboard leverages the pod tags so you can easily find the relevant pod or pods.

- Easy installation of collectors, either a one click deploy from Grafana or detailed instructions to deploy them manually them with kubectl (also quite easy!)

- Cluster level metrics that are not available in Heapster, like CPU Capacity vs CPU Usage.

- Pod and Container status metrics. See the [Snap Kubestate Collector](https://github.com/raintank/snap-plugin-collector-kubestate) for more details.

### Cluster Metrics

- Pod Capacity/Usage
- Memory Capacity/Usage
- CPU Capacity/Usage
- Disk Capacity/Usage (measurements from each container's /var/lib/docker)
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

#### Installation

1. Use the grafana-cli tool to install kubernetes from the commandline:

```
grafana-cli plugins install raintank-kubernetes-app
```

2. Restart your Grafana server.

3. Log into your Grafana instance. Navigate to the Plugins section, found in the Grafana main menu. Click the Apps tabs in the Plugins section and select the newly installed Kubernetes app. To enable the app, click the Config tab and click on the Enable button.

#### Connecting to your Cluster

1. Go to the Cluster List page via the Kubernetes app menu.

   ![Cluster List in main menu](https://raw.githubusercontent.com/raintank/kubernetes-app/master/src/img/app-menu-screenshot.png)

2. Click the `New Cluster` button.

3. Fill in the Auth details for your cluster.

4. Choose the Graphite datasource that will be used for reading data in the dashboards.

5. Fill in the details for the Carbon host that is used to write to Graphite. This url has to be available from inside the cluster.

6. Click `Deploy`. This will deploy a DaemonSet, to collect health metrics for every node, and a pod that collects cluster metrics.

#### Manual Deployment of Collectors

If you do not want to deploy the collector DaemonSet and pod automatically, then it can be deployed manually with kubectl. If using an older version of Kubernetes than 1.4, you will have to adapt the json files, particularly for the daemonset, and remove some newer features. Please create an issue if you need support for older versions of Kubernetes built in to the app.

The manual deployment instructions and files needed, can be downloaded from the Cluster Config page. At the bottom of the page, there is a help section with instructions and links to all the json files needed.

#### Uninstalling the Collectors (DaemonSet and Pod)

There is an Undeploy button on the Cluster Config page. To manually undeploy them:

```bash
kubectl delete daemonsets -n kube-system snap

kubectl delete deployments -n kube-system snap-kubestate-deployment

kubectl delete configmaps -n kube-system snap-tasks

kubectl delete configmaps -n kube-system snap-tasks-kubestate
```

#### Technical Details

Metrics are collected by the [Intel Snap](http://snap-telemetry.io/) collector using the [Docker plugin](https://github.com/intelsdi-x/snap-plugin-collector-docker/blob/master/METRICS.md).  A DaemonSet with Snap is deployed to your Kubernetes cluster when you add a new cluster in the app. For cluster level metrics, one Snap pod is also deployed to the cluster. The [snap_k8s](https://github.com/raintank/snap_k8s) docker image used for this is based off of Intel's Snap docker image.

The following Snap plugins are used to collect metrics:

- [CPU Collector](https://github.com/intelsdi-x/snap-plugin-collector-cpu/blob/master/METRICS.md)
- [Docker Collector](https://github.com/intelsdi-x/snap-plugin-collector-docker/blob/master/METRICS.md)
- [Network Interface Collector](https://github.com/intelsdi-x/snap-plugin-collector-interface/blob/master/METRICS.md)
- [IOStat Collector](https://github.com/intelsdi-x/snap-plugin-collector-iostat)
- [Load Collector](https://github.com/intelsdi-x/snap-plugin-collector-load#collected-metrics)
- [MemInfo Collector](https://github.com/intelsdi-x/snap-plugin-collector-meminfo/blob/master/METRICS.md)
- [Kubestate Collector](https://github.com/raintank/snap-plugin-collector-kubestate)

### Feedback and Questions

Please submit any issues with the app on [Github](https://github.com/raintank/kubernetes-app/issues).

#### Troubleshooting

If there are any problems with metrics not being collected then you can collect some logs with the following steps:

1. Get the snap pod (or pods if you have multiple nodes) name with:

    `kubectl get pods -n kube-system`

2. Check if the task is running with (replace xxxx with the guid):

    `kubectl exec -it snap-xxxxx-n kube-system -- /opt/snap/bin/snaptel task list`

    Include the output in the issue.

3. Get the logs with:

    `kubectl logs snap-xxxxx -n kube-system`

    Include this output in the issue too.
