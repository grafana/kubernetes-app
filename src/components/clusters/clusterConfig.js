import _ from 'lodash';
import appEvents from 'app/core/app_events';
import angular from 'angular';

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
  return slug;
}

export class ClusterConfigCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, $q, contextSrv, $location, $window, alertSrv) {
    var self = this;
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
    this.$window = $window;
    this.$location = $location;
    this.cluster = {
      type: 'raintank-kubernetes-datasource'
    };
    this.pageReady = false;
    this.prometheusDeployed = false;
    this.alertSrv = alertSrv;
    this.showHelp = false;
    document.title = 'Grafana Kubernetes App';

    this.getDatasources().then(() => {
      self.pageReady = true;
    });
  }

  toggleHelp() {
    this.showHelp = !this.showHelp;
  }

  getDatasources() {
    var self = this;
    var promises = [];
    if ("cluster" in self.$location.search()) {
      promises.push(self.getCluster(this.$location.search().cluster).then(() => {
        return self.getDeployments().then(ds => {
          _.forEach(ds.items, function (deployment) {
            if (deployment.metadata.name === "prometheus-deployment") {
              self.prometheusDeployed = true;
            }
          });
        });
      }));
    }

    promises.push(self.getPrometheusDatasources());

    return this.$q.all(promises);
  }

  getCluster(id) {
    var self = this;
    return this.backendSrv.get('/api/datasources/' + id)
      .then((ds) => {
        if (!(ds.jsonData.ds)) {
          ds.jsonData.ds = "";
        }
        self.cluster = ds;
      });
  }

  getPrometheusDatasources() {
    var self = this;
    return this.backendSrv.get('/api/datasources')
      .then((result) => {
        self.datasources = _.filter(result, {
          "type": "prometheus"
        });
      });
  }

  getDeployments() {
    var self = this;
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + self.cluster.id + '/apis/apps/v1beta2/namespaces/kube-system/deployments',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  save() {
    return this.saveDatasource()
      .then(() => {
        return this.getDatasources();
      })
      .then(() => {
        this.alertSrv.set("Saved", "Saved and successfully connected to " + this.cluster.name, 'success', 3000);
      })
      .catch(err => {
        this.alertSrv.set("Saved", "Saved but failed to connect to " + this.cluster.name + '. Error: ' + err, 'error', 5000);
      });
  }

  savePrometheusConfigToFile() {
    let cm = this.generatePrometheusConfigMap();
    this.saveToFile('prometheus-grafana-k8s.yaml', cm);
  }

  saveConfigMapToFile() {
    const cm = this.generateConfigMap();
    this.saveToFile('snap-configmap', cm);
  }

  saveKubestateConfigMapToFile() {
    const cm = this.generateKubestateConfigMap();
    this.saveToFile('snap-kubestate-configmap', cm);
  }

  saveDaemonSetToFile() {
    this.saveToFile('snap-daemonset', daemonSet);
  }

  saveDeploymentToFile() {
    this.saveToFile('snap-kubestate', kubestate);
  }

  saveToFile(filename, json) {
    const blob = new Blob([angular.toJson(json, true)], {
      type: "application/json;charset=utf-8"
    });
    const wnd = window;
    wnd.saveAs(blob, filename + '.json');
  }

  deploy() {
    var question = !this.prometheusDeployed ?
      'This action will deploy a DaemonSet to your Kubernetes cluster. It uses Intel Snap to collect health metrics. ' +
      'Are you sure you want to deploy?' :
      'This action will update the Config Map for the Snap DaemonSet and recreate the snapd pod on your Kubernetes cluster. ' +
      'Are you sure you want to deploy?';
    appEvents.emit('confirm-modal', {
      title: 'Deploy to Kubernetes Cluster',
      text: question,
      yesText: "Deploy",
      icon: "fa-question",
      onConfirm: () => {
        this.saveAndDeploy();
      }
    });
  }

  undeploy() {
    var question = 'This action will remove the DaemonSet on your Kubernetes cluster that collects health metrics. ' +
      'Are you sure you want to remove it?';

    appEvents.emit('confirm-modal', {
      title: 'Remove Daemonset Collector',
      text: question,
      yesText: "Remove",
      icon: "fa-question",
      onConfirm: () => {
        this.undeployPrometheus();
      }
    });
  }

  saveDatasource() {
    if (this.cluster.id) {
      return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster);
    } else {
      return this.backendSrv.post('/api/datasources', this.cluster);
    }
  }

  saveAndDeploy() {
    return this.saveDatasource()
      .then(() => {
        return this.deployPrometheus();
      });
  }

  generateConfigMap() {
    var task = _.cloneDeep(snapTask);
    task.workflow.collect.publish[0].config.prefix = "snap." + slugify(this.cluster.name) + ".<%NODE%>";
    task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
    task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
    var cadvisor_task = _.cloneDeep(snapCadvisorTask);
    cadvisor_task.workflow.collect.publish[0].config.prefix = "snap." + slugify(this.cluster.name) + ".<%NODE%>";
    cadvisor_task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
    cadvisor_task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
    var cm = _.cloneDeep(configMap);
    cm.data["core.json"] = JSON.stringify(task);
    cm.data["cadvisor.json"] = JSON.stringify(cadvisor_task);
    return cm;
  }

  generateKubestateConfigMap() {
    var task = _.cloneDeep(kubestateSnapTask);
    task.workflow.collect.publish[0].config.prefix = "snap." + slugify(this.cluster.name);
    task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
    task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
    var cm = _.cloneDeep(kubestateConfigMap);
    cm.data["core.json"] = JSON.stringify(task);
    return cm;
  }

  deploySnap() {
    if (!this.cluster || !this.cluster.id) {
      this.alertSrv.set("Error", "Could not connect to cluster.", 'error');
      return;
    }

    var self = this;
    var cm = this.generateConfigMap();
    var kubestateCm = this.generateKubestateConfigMap();

    if (!this.prometheusDeployed) {
      return this.checkApiVersion(self.cluster.id)
        .then(() => {
          return this.createConfigMap(self.cluster.id, cm);
        })
        .then(() => {
          return this.createConfigMap(self.cluster.id, kubestateCm);
        })
        .then(() => {
          return this.createDaemonSet(self.cluster.id, daemonSet);
        })
        .then(() => {
          return this.createDeployment(self.cluster.id, kubestate);
        })
        .catch(err => {
          this.alertSrv.set("Error", err, 'error');
        }).then(() => {
          this.prometheusDeployed = true;
          this.alertSrv.set("Deployed", "Snap DaemonSet for Kubernetes metrics deployed to " + self.cluster.name, 'success', 5000);
        });
    } else {
      return self.updateSnapSettings(cm, kubestateCm);
    }
  }

  undeploySnap() {
    var self = this;
    return this.deleteConfigMap(self.cluster.id, 'snap-tasks')
      .then(() => {
        return this.deleteConfigMap(self.cluster.id, 'snap-tasks-kubestate');
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.deleteDaemonSet(self.cluster.id);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.deleteDeployment(self.cluster.id, 'snap-kubestate-deployment');
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.deletePods();
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        this.prometheusDeployed = false;
        this.alertSrv.set("Daemonset removed", "Snap DaemonSet for Kubernetes metrics removed from " + self.cluster.name, 'success', 5000);
      });
  }

  checkApiVersion(clusterId) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(result => {
      if (!result.resources || result.resources.length === 0) {
        throw "This Kubernetes cluster does not support v1beta1 of the API which is needed to deploy automatically. " +
          "You can install manually using the instructions at the bottom of the page.";
      }
    });
  }

  createConfigMap(clusterId, cm) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/configmaps',
      method: 'POST',
      data: cm,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  createDaemonSet(clusterId, daemonSet) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/daemonsets',
      method: 'POST',
      data: daemonSet,
      headers: {
        'Content-Type': "application/json"
      }
    });
  }

  deleteDaemonSet(clusterId) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/daemonsets/node-exporter',
      method: 'DELETE',
    });
  }

  createDeployment(clusterId, deployment) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/deployments',
      method: 'POST',
      data: deployment,
      headers: {
        'Content-Type': "application/json"
      }
    });
  }

  deleteDeployment(clusterId, deploymentName) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/deployments/' + deploymentName,
      method: 'DELETE'
    }).then(() => {
      return this.backendSrv.request({
        url: 'api/datasources/proxy/' + clusterId +
          '/apis/apps/v1beta2/namespaces/kube-system/replicasets?labelSelector=grafanak8sapp%3Dtrue',
        method: 'DELETE'
      });
    });
  }

  deleteConfigMap(clusterId, cmName) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/configmaps/' + cmName,
      method: 'DELETE'
    });
  }

  deletePods() {
    var self = this;
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + self.cluster.id +
        '/api/v1/namespaces/kube-system/pods?labelSelector=grafanak8sapp%3Dtrue',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(pods => {
      if (!pods || pods.items.length === 0) {
        throw "No pods found to update.";
      }

      var promises = [];

      _.forEach(pods.items, pod => {
        promises.push(this.backendSrv.request({
          url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/pods/' + pod.metadata.name,
          method: 'DELETE',
        }));
      });

      return this.$q.all(promises);
    });
  }

  createService(clusterId, service) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/services',
      method: 'POST',
      data: service,
      headers: {
        'Content-Type': "application/json"
      }
    });
  }

  deleteService(clusterId) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/services/node-exporter',
      method: 'DELETE',
      headers: {
        'Content-Type': "application/json"
      }
    });
  }

  updateSnapSettings(cm, kubestateCm) {
    var self = this;
    return this.deleteConfigMap(self.cluster.id, 'snap-tasks')
      .then(() => {
        return this.createConfigMap(self.cluster.id, cm);
      }).then(() => {
        return this.deleteConfigMap(self.cluster.id, 'snap-tasks-kubestate');
      }).then(() => {
        return this.createConfigMap(self.cluster.id, kubestateCm);
      }).then(() => {
        return this.deletePods();
      }).catch(err => {
        this.alertSrv.set("Error", err, 'error');
      }).then(() => {
        this.alertSrv.set("Updated", "Graphite Settings in Config Map on " + self.cluster.name + " updated successfully", 'success', 3000);
      });
  }

  cancel() {
    this.$window.history.back();
  }

  deployPrometheus() {
    let self = this;
    if (!this.cluster || !this.cluster.id) {
      this.alertSrv.set("Error", "Could not connect to cluster.", 'error');
      return;
    }
    return this.checkApiVersion(self.cluster.id)
      .then(() => {
        return this.createConfigMap(self.cluster.id, this.generatePrometheusConfigMap());
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.createDeployment(self.cluster.id, kubestateDeployment);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.createDaemonSet(self.cluster.id, nodeExporterDaemonSet);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.createService(self.cluster.id, nodeExporterService);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.createDeployment(self.cluster.id, prometheusDeployment);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      }).then(() => {
        this.prometheusDeployed = true;
        this.alertSrv.set("Deployed", "Snap DaemonSet for Kubernetes metrics deployed to " + self.cluster.name, 'success', 5000);
      });
  }

  undeployPrometheus() {
    var self = this;
    return this.deleteConfigMap(self.cluster.id, 'prometheus-configmap')
      .then(() => {
        return this.deleteDeployment(self.cluster.id, 'kube-state-metrics');
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.deleteDeployment(self.cluster.id, 'prometheus-deployment');
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.deleteDaemonSet(self.cluster.id);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.deleteService(self.cluster.id);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        return this.deletePods();
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      })
      .then(() => {
        this.prometheusDeployed = false;
        this.alertSrv.set("Daemonset removed", "Snap DaemonSet for Kubernetes metrics removed from " + self.cluster.name, 'success', 5000);
      });
  }

  generatePrometheusConfigMap() {
    return {
      "apiVersion": "v1",
      "kind": "ConfigMap",
      "metadata": {
        "name": "prometheus-configmap"
      },
      "data": {
        "prometheus.yml": `
        scrape_configs:
          - job_name: \'kubernetes-kubelet\'
            scheme: https
            tls_config:
              ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
              insecure_skip_verify: true
            bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
            kubernetes_sd_configs:
            - role: node
            relabel_configs:
            - action: labelmap
              regex: __meta_kubernetes_node_label_(.+)
            - target_label: __address__
              replacement: kubernetes.default.svc:443
            - source_labels: [__meta_kubernetes_node_name]
              regex: (.+)
              target_label: __metrics_path__
              replacement: /api/v1/nodes/\${1}/proxy/metrics
            - source_labels: [__address__]
              regex: .*
              target_label: kubernetes_cluster
              replacement: ${this.cluster.name}
          - job_name: \'kubernetes-cadvisor\'
            scheme: https
            tls_config:
              ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
              insecure_skip_verify: true
            bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
            kubernetes_sd_configs:
            - role: node
            relabel_configs:
            - action: labelmap
              regex: __meta_kubernetes_node_label_(.+)
            - target_label: __address__
              replacement: kubernetes.default.svc:443
            - source_labels: [__meta_kubernetes_node_name]
              regex: (.+)
              target_label: __metrics_path__
              replacement: /api/v1/nodes/\${1}/proxy/metrics/cadvisor
            - source_labels: [__address__]
              regex: .*
              target_label: kubernetes_cluster
              replacement: ${this.cluster.name}
          - job_name: \'kubernetes-nodes\'
            scheme: https
            tls_config:
              ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
              insecure_skip_verify: true
            bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
            kubernetes_sd_configs:
            - role: node
            relabel_configs:
            - action: labelmap
              regex: __meta_kubernetes_node_label_(.+)
            - target_label: __address__
              replacement: kubernetes.default.svc:443
            - source_labels: [__meta_kubernetes_node_name]
              regex: (.+)
              target_label: __metrics_path__
              replacement: /api/v1/nodes/\${1}/proxy/metrics
            - source_labels: [__address__]
              regex: .*
              target_label: kubernetes_cluster
              replacement: ${this.cluster.name}
          - job_name: \'kubernetes-pods\'
            kubernetes_sd_configs:
            - role: pod
            relabel_configs:
            - action: labelmap
              regex: __meta_kubernetes_pod_label_(.+)
            - source_labels: [__meta_kubernetes_namespace]
              action: replace
              target_label: kubernetes_namespace
            - source_labels: [__meta_kubernetes_pod_name]
              action: replace
              target_label: kubernetes_pod_name
            - source_labels: [__meta_kubernetes_pod_label_grafanak8sapp]
              regex: .*true.*
              action: keep
            - source_labels: [__address__]
              regex: .*
              target_label: kubernetes_cluster
              replacement: ${this.cluster.name}
            - source_labels: [__meta_kubernetes_pod_node_name]
              action: replace
              target_label: instance`
      }
    };
  }
}

ClusterConfigCtrl.templateUrl = 'components/clusters/partials/cluster_config.html';

const raintankSnapImage = 'raintank/snap_k8s:v23';

var configMap = {
  "kind": "ConfigMap",
  "apiVersion": "v1",
  "metadata": {
    "name": "snap-tasks",
    "namespace": "kube-system"
  },
  "data": {
    "core.json": "",
    "cadvisor.json": ""
  }
};

var kubestateConfigMap = {
  "kind": "ConfigMap",
  "apiVersion": "v1",
  "metadata": {
    "name": "snap-tasks-kubestate",
    "namespace": "kube-system"
  },
  "data": {
    "core.json": ""
  }
};

var snapTask = {
  "version": 1,
  "start": true,
  "schedule": {
    "type": "simple",
    "interval": "10s"
  },
  "max-failures": 10,
  "workflow": {
    "collect": {
      "metrics": {
        "/intel/procfs/cpu/all/*": {},
        "/intel/procfs/meminfo/mem_available": {},
        "/intel/procfs/meminfo/mem_available_perc": {},
        "/intel/procfs/meminfo/mem_free": {},
        "/intel/procfs/meminfo/mem_free_perc": {},
        "/intel/procfs/meminfo/mem_total": {},
        "/intel/procfs/meminfo/mem_total_perc": {},
        "/intel/procfs/meminfo/mem_used": {},
        "/intel/procfs/meminfo/mem_used_perc": {},
        "/intel/procfs/filesystem/*/inodes_free": {},
        "/intel/procfs/filesystem/*/inodes_reserved": {},
        "/intel/procfs/filesystem/*/inodes_used": {},
        "/intel/procfs/filesystem/*/space_free": {},
        "/intel/procfs/filesystem/*/space_reserved": {},
        "/intel/procfs/filesystem/*/space_used": {},
        "/intel/procfs/filesystem/*/inodes_percent_free": {},
        "/intel/procfs/filesystem/*/inodes_percent_reserved": {},
        "/intel/procfs/filesystem/*/inodes_percent_used": {},
        "/intel/procfs/filesystem/*/space_percent_free": {},
        "/intel/procfs/filesystem/*/space_percent_reserved": {},
        "/intel/procfs/filesystem/*/space_percent_used": {},
        "/intel/procfs/iface/*/bytes_recv": {},
        "/intel/procfs/iface/*/bytes_sent": {},
        "/intel/procfs/iface/*/packets_recv": {},
        "/intel/procfs/iface/*/packets_sent": {},
        "/intel/procfs/iface/*/errs_recv": {},
        "/intel/procfs/iface/*/errs_sent": {},
        "/intel/iostat/device/*/%util": {},
        "/intel/iostat/device/*/rkB_per_sec": {},
        "/intel/iostat/device/*/wkB_per_sec": {},
        "/intel/iostat/device/ALL/r_per_sec": {},
        "/intel/iostat/device/ALL/w_per_sec": {},
        "/intel/procfs/load/min1_rel": {}
      },
      "config": {
        "/intel/procfs": {
          "proc_path": "/proc_host",
          "keep_original_mountpoint": false
        }
      },
      "publish": [{
        "plugin_name": "graphite",
        "config": {
          "prefix_tags": "",
          "prefix": "",
          "server": "",
          "port": 2003
        }
      }]
    }
  }
};

var snapCadvisorTask = {
  "version": 1,
  "start": true,
  "schedule": {
    "type": "streaming",
  },
  "workflow": {
    "collect": {
      "metrics": {
        "/grafanalabs/cadvisor/container/*/*/*/cpu/total/usage": {},
        "/grafanalabs/cadvisor/container/*/*/*/mem/usage": {},
        "/grafanalabs/cadvisor/container/*/*/*/fs/*": {},
        "/grafanalabs/cadvisor/container/*/*/*/diskio/*": {},
        "/grafanalabs/cadvisor/container/*/*/*/iface/*/out_bytes": {},
        "/grafanalabs/cadvisor/container/*/*/*/iface/*/in_bytes": {},
        "/grafanalabs/cadvisor/container/*/*/*/tcp/*": {},
        "/grafanalabs/cadvisor/container/*/*/*/tcp6/*": {},
      },
      "publish": [{
        "plugin_name": "graphite",
        "config": {
          "prefix_tags": "",
          "prefix": "",
          "server": "",
          "port": 2003
        }
      }]
    }
  }
};

var kubestateSnapTask = {
  "version": 1,
  "start": true,
  "schedule": {
    "type": "simple",
    "interval": "10s"
  },
  "max-failures": 10,
  "workflow": {
    "collect": {
      "metrics": {
        "/grafanalabs/kubestate/*": {}
      },
      "process": null,
      "publish": [{
        "plugin_name": "graphite",
        "config": {
          "prefix_tags": "",
          "prefix": "",
          "server": "",
          "port": 2003
        }
      }]
    }
  }
};

var daemonSet = {
  "kind": "DaemonSet",
  "apiVersion": "extensions/v1beta1",
  "metadata": {
    "name": "snap",
    "namespace": "kube-system",
    "labels": {
      "daemon": "snapd"
    }
  },
  "spec": {
    "selector": {
      "matchLabels": {
        "daemon": "snapd",
        "app": "snap-collector"
      }
    },
    "template": {
      "metadata": {
        "name": "snap",
        "labels": {
          "daemon": "snapd",
          "app": "snap-collector"
        }
      },
      "spec": {
        "volumes": [{
            "name": "dev",
            "hostPath": {
              "path": "/dev"
            }
          },
          {
            "name": "cgroup",
            "hostPath": {
              "path": "/sys/fs/cgroup"
            }
          },
          {
            "name": "docker-sock",
            "hostPath": {
              "path": "/var/run/docker.sock"
            }
          },
          {
            "name": "fs-stats",
            "hostPath": {
              "path": "/var/lib/docker"
            }
          },
          {
            "name": "docker",
            "hostPath": {
              "path": "/usr/bin/docker"
            }
          },
          {
            "name": "proc",
            "hostPath": {
              "path": "/proc"
            }
          },
          {
            "name": "snap-tasks",
            "configMap": {
              "name": "snap-tasks"
            }
          }
        ],
        "containers": [{
          "name": "snap",
          "image": raintankSnapImage,
          "command": [
            "/usr/local/bin/start.sh"
          ],
          "args": [
            "/opt/snap/sbin/snapteld"
          ],
          "ports": [{
            "name": "snap-api",
            "hostPort": 8282,
            "containerPort": 8282,
            "protocol": "TCP"
          }],
          "livenessProbe": {
            "exec": {
              "command": [
                "/bin/bash",
                "-c",
                "/opt/snap/bin/snaptel task list |grep Disabled | awk 'BEGIN {err = 0} length($1) > 0 { err = 1} END {exit err}'"
              ]
            },
            initialDelaySeconds: 60
          },
          "env": [{
              "name": "PROCFS_MOUNT",
              "value": "/proc_host"
            },
            {
              "name": "NODE_NAME",
              "valueFrom": {
                "fieldRef": {
                  "fieldPath": "spec.nodeName"
                }
              }
            },
            {
              "name": "SNAP_PORT",
              "value": "8282"
            },
            {
              "name": "SNAP_URL",
              "value": "http://localhost:8282"
            },
            {
              "name": "SNAP_LOG_LEVEL",
              "value": "3"
            }
          ],
          "resources": {},
          "volumeMounts": [{
              "name": "cgroup",
              "mountPath": "/sys/fs/cgroup"
            },
            {
              "name": "docker-sock",
              "mountPath": "/var/run/docker.sock"
            },
            {
              "name": "fs-stats",
              "mountPath": "/var/lib/docker"
            },
            {
              "name": "docker",
              "mountPath": "/usr/local/bin/docker"
            },
            {
              "name": "proc",
              "mountPath": "/proc_host"
            },
            {
              "name": "snap-tasks",
              "mountPath": "/opt/snap/tasks"
            }
          ],
          "imagePullPolicy": "IfNotPresent",
          "securityContext": {
            "privileged": true
          }
        }],
        "restartPolicy": "Always",
        "hostNetwork": true,
        "hostPID": true
      }
    }
  }
};

const NodeExporterImage='quay.io/prometheus/node-exporter:v0.15.0';

const nodeExporterDaemonSet = {
  "kind": "DaemonSet",
  "apiVersion": "apps/v1beta2",
  "metadata": {
    "name": "node-exporter",
    "namespace": "kube-system"
  },
  "spec": {
    "selector": {
      "matchLabels": {
        "daemon": "node-exporter",
        "grafanak8sapp": "true"
      }
    },
    "template": {
      "metadata": {
        "name": "node-exporter",
        "labels": {
          "daemon": "node-exporter",
          "grafanak8sapp": "true"
        }
      },
      "spec": {
        "volumes": [
          {
            "name": "proc",
            "hostPath": {
              "path": "/proc"
            }
          },
          {
            "name": "sys",
            "hostPath": {
              "path": "/sys"
            }
          }
        ],
        "containers": [{
          "name": "node-exporter",
          "image": NodeExporterImage,
          "args": [
            "--path.procfs=/proc_host",
            "--path.sysfs=/host_sys"
          ],
          "ports": [{
            "name": "node-exporter",
            "hostPort": 9100,
            "containerPort": 9100
          }],
          "volumeMounts": [{
              "name": "sys",
              "readOnly": true,
              "mountPath": "/host_sys"
            },
            {
              "name": "proc",
              "readOnly": true,
              "mountPath": "/proc_host"
            }
          ],
          "imagePullPolicy": "IfNotPresent"
        }],
        "restartPolicy": "Always",
        "hostNetwork": true,
        "hostPID": true
      }
    }
  }
};

const nodeExporterService = {
  "apiVersion": "v1",
  "kind": "Service",
  "metadata": {
    "labels": {
      "app": "node-exporter",
      "grafanak8sapp": "true"
    },
    "name": "node-exporter"
  },
  "spec": {
    "type": "ClusterIP",
    "clusterIP": "None",
    "ports": [{
      "name": "http-metrics",
      "port": 9100,
      "protocol": "TCP"
    }],
    "selector": {
      "daemon": "node-exporter"
    }
  }
};

const kubestate = {
  "kind": "Deployment",
  "apiVersion": "extensions/v1beta1",
  "metadata": {
    "name": "snap-kubestate-deployment",
    "namespace": "kube-system",
  },
  "spec": {
    "replicas": 1,
    "template": {
      "metadata": {
        "labels": {
          "app": "snap-collector"
        }
      },
      "spec": {
        "volumes": [{
          "name": "snap-tasks",
          "configMap": {
            "name": "snap-tasks-kubestate"
          }
        }],
        "containers": [{
          "name": "snap",
          "image": raintankSnapImage,
          "ports": [{
            "name": "snap-api",
            "hostPort": 8383,
            "containerPort": 8383,
            "protocol": "TCP"
          }],
          "livenessProbe": {
            "exec": {
              "command": [
                "/bin/bash",
                "-c",
                "/opt/snap/bin/snaptel task list |grep Disabled | awk 'BEGIN {err = 0} length($1) > 0 { err = 1} END {exit err}'"
              ]
            },
            initialDelaySeconds: 60
          },
          "env": [{
              "name": "SNAP_PORT",
              "value": "8383"
            },
            {
              "name": "SNAP_URL",
              "value": "http://localhost:8383"
            },
            {
              "name": "SNAP_LOG_LEVEL",
              "value": "3"
            }
          ],
          "resources": {},
          "volumeMounts": [{
            "name": "snap-tasks",
            "mountPath": "/opt/snap/tasks"
          }],
          "imagePullPolicy": "IfNotPresent",
        }],
        "restartPolicy": "Always",
      }
    }
  }
};

const prometheusImage = 'prom/prometheus:v2.0.0';
const kubestateImage = 'quay.io/coreos/kube-state-metrics:v1.1.0';

let prometheusDeployment = {
  "apiVersion": "apps/v1beta2",
  "kind": "Deployment",
  "metadata": {
    "name": "prometheus-deployment",
    "namespace": "kube-system"
  },
  "spec": {
    "replicas": 1,
    "strategy": {
      "rollingUpdate": {
        "maxSurge": 0,
        "maxUnavailable": 1
      },
      "type": "RollingUpdate"
    },
    "selector": {
      "matchLabels": {
        "app": "prometheus",
        "grafanak8sapp": "true"
      }
    },
    "template": {
      "metadata": {
        "name": "prometheus",
        "labels": {
          "app": "prometheus",
          "grafanak8sapp": "true"
        }
      },
      "spec": {
        "containers": [{
          "name": "prometheus",
          "image": prometheusImage,
          "args": [
            '--config.file=/etc/prometheus/prometheus.yml',
          ],
          "ports": [{
            "name": "web",
            "containerPort": 9090
          }],
          "env": [],
          "volumeMounts": [{
            "name": "config-volume",
            "mountPath": "/etc/prometheus"
          }]
        }],
        "volumes": [{
          "name": "config-volume",
          "configMap": {
            "name": "prometheus-configmap"
          }
        }]
      }
    }
  }
};

let kubestateDeployment = {
  "apiVersion": "apps/v1beta2",
  "kind": "Deployment",
  "metadata": {
    "name": "kube-state-metrics",
    "namespace": "kube-system"
  },
  "spec": {
    "selector": {
      "matchLabels": {
        "k8s-app": "kube-state-metrics",
        "grafanak8sapp": "true"
      }
    },
    "replicas": 1,
    "template": {
      "metadata": {
        "labels": {
          "k8s-app": "kube-state-metrics",
          "grafanak8sapp": "true"
        }
      },
      "spec": {
        "containers": [{
          "name": "kube-state-metrics",
          "image": kubestateImage,
          "ports": [{
            "name": "http-metrics",
            "containerPort": 8080
          }],
          "readinessProbe": {
            "httpGet": {
              "path": "/healthz",
              "port": 8080
            },
            "initialDelaySeconds": 5,
            "timeoutSeconds": 5
          }
        }]
      }
    }
  }
};
