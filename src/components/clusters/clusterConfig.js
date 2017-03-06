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
    this.cluster = {type: 'raintank-kubernetes-datasource'};
    this.pageReady = false;
    this.snapDeployed = false;
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
        return self.getDaemonSets().then(ds => {
          _.forEach(ds.items, function(daemonSet) {
            if (daemonSet.metadata.name === "snap") {
              self.snapDeployed = true;
            }
          });
        });
      }));
    }

    promises.push(self.getGraphiteDatasources());

    return this.$q.all(promises);
  }

  getCluster(id) {
    var self = this;
    return this.backendSrv.get('/api/datasources/'+id)
    .then((ds) => {
      if (!(ds.jsonData.ds)) {
        ds.jsonData.ds = "";
      }
      self.cluster = ds;
    });
  }

  getGraphiteDatasources() {
    var self = this;
    return this.backendSrv.get('/api/datasources')
    .then((result) => {
      self.datasources = _.filter(result, {"type": "graphite"});
    });
  }

  getDaemonSets() {
    var self = this;
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + self.cluster.id + '/apis/extensions/v1beta1/daemonsets',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
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
    const blob = new Blob([angular.toJson(json, true)], { type: "application/json;charset=utf-8" });
    const wnd = window;
    wnd.saveAs(blob, filename + '.json');
  }

  deploy() {
    var question = !this.snapDeployed ?
      'This action will deploy a DaemonSet to your Kubernetes cluster. It uses Intel Snap to collect health metrics. '
      + 'Are you sure you want to deploy?'
      : 'This action will update the Config Map for the Snap DaemonSet and recreate the snapd pod on your Kubernetes cluster. '
      + 'Are you sure you want to deploy?';
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
    var question = 'This action will remove the DaemonSet on your Kubernetes cluster that collects health metrics. '
      + 'Are you sure you want to remove it?';

    appEvents.emit('confirm-modal', {
      title: 'Remove Daemonset Collector',
      text: question,
      yesText: "Remove",
      icon: "fa-question",
      onConfirm: () => {
        this.undeploySnap();
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
        return this.deploySnap();
      });
  }

  generateConfigMap() {
    var task = _.cloneDeep(snapTask);
    task.workflow.collect.publish[0].config.prefix = "snap."+slugify(this.cluster.name) + ".<%NODE%>";
    task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
    task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
    var cm = _.cloneDeep(configMap);
    cm.data["core.json"] = JSON.stringify(task);
    return cm;
  }

  generateKubestateConfigMap() {
    var task = _.cloneDeep(kubestateSnapTask);
    task.workflow.collect.publish[0].config.prefix = "snap."+slugify(this.cluster.name);
    task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
    task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
    var cm = _.cloneDeep(kubestateConfigMap);
    cm.data["core.json"] = JSON.stringify(task);
    return cm;
  }

  deploySnap() {
    if(!this.cluster || !this.cluster.id) {
      this.alertSrv.set("Error", "Could not connect to cluster.", 'error');
      return;
    }

    var self = this;
    var cm = this.generateConfigMap();
    var kubestateCm = this.generateKubestateConfigMap();

    if (!this.snapDeployed) {
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
        this.snapDeployed = true;
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
        this.snapDeployed = false;
        this.alertSrv.set("Daemonset removed", "Snap DaemonSet for Kubernetes metrics removed from " + self.cluster.name, 'success', 5000);
      });
  }

  checkApiVersion(clusterId) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
    });
  }

  createDaemonSet(clusterId, daemonSet) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets',
      method: 'POST',
      data: daemonSet,
      headers: {'Content-Type': "application/json"}
    });
  }

  deleteDaemonSet(clusterId) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets/snap',
      method: 'DELETE',
    });
  }

  createDeployment(clusterId, deployment) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/deployments',
      method: 'POST',
      data: deployment,
      headers: {'Content-Type': "application/json"}
    });
  }

  deleteDeployment(clusterId, deploymentName) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/deployments/' + deploymentName,
      method: 'DELETE'
    }).then(() => {
      return this.backendSrv.request({
        url: 'api/datasources/proxy/' + clusterId +
        '/apis/extensions/v1beta1/namespaces/kube-system/replicasets?labelSelector=app%3Dsnap-collector',
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
      url: 'api/datasources/proxy/' + self.cluster.id
      + '/api/v1/namespaces/kube-system/pods?labelSelector=app%3Dsnap-collector',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(pods => {
      if (!pods || pods.items.length === 0) {
        throw "No snapd pod found to update.";
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

}

ClusterConfigCtrl.templateUrl = 'components/clusters/partials/cluster_config.html';

const raintankSnapImage = 'raintank/snap_k8s:v21';

var configMap = {
  "kind": "ConfigMap",
  "apiVersion": "v1",
  "metadata": {
    "name": "snap-tasks",
    "namespace": "kube-system"
  },
  "data": {
    "core.json": ""
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
        "/intel/docker/*/*/*/stats/cgroups/cpu_stats/cpu_usage/total_usage":{},
        "/intel/docker/*/*/*/stats/cgroups/memory_stats/usage/usage":{},
        "/intel/docker/*/*/*/stats/connection/tcp/*":{},
        "/intel/docker/*/*/*/stats/filesystem/*/available":{},
        "/intel/docker/*/*/*/stats/filesystem/*/capacity":{},
        "/intel/docker/*/*/*/stats/filesystem/*/reads_completed":{},
        "/intel/docker/*/*/*/stats/filesystem/*/usage":{},
        "/intel/docker/*/*/*/stats/filesystem/*/writes_completed":{},
        "/intel/docker/*/*/*/stats/network/*/rx_bytes":{},
        "/intel/docker/*/*/*/stats/network/*/tx_bytes":{},
        "/intel/procfs/cpu/all/*": {},
        "/intel/procfs/meminfo/mem_available": {},
        "/intel/procfs/meminfo/mem_available_perc": {},
        "/intel/procfs/meminfo/mem_free": {},
        "/intel/procfs/meminfo/mem_free_perc": {},
        "/intel/procfs/meminfo/mem_total": {},
        "/intel/procfs/meminfo/mem_total_perc": {},
        "/intel/procfs/meminfo/mem_used": {},
        "/intel/procfs/meminfo/mem_used_perc": {},
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
          "proc_path": "/proc_host"
        }
      },
      "process": null,
      "publish": [
        {
          "plugin_name": "graphite",
          "config": {
            "prefix_tags": "",
            "prefix": "",
            "server": "",
            "port": 2003
          }
        }
      ]
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
        "/grafanalabs/kubestate/*":{}
      },
      "process": null,
      "publish": [
        {
          "plugin_name": "graphite",
          "config": {
            "prefix_tags": "",
            "prefix": "",
            "server": "",
            "port": 2003
          }
        }
      ]
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
        "volumes": [
          {
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
        "containers": [
          {
            "name": "snap",
            "image": raintankSnapImage,
            "command": [
              "/usr/local/bin/start.sh"
            ],
            "args": [
              "/opt/snap/sbin/snapteld"
            ],
            "ports": [
              {
                "name": "snap-api",
                "hostPort": 8282,
                "containerPort": 8282,
                "protocol": "TCP"
              }
            ],
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
            "env": [
              {
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
            "resources": {
            },
            "volumeMounts": [
              {
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
          }
        ],
        "restartPolicy": "Always",
        "hostNetwork": true,
        "hostPID": true
      }
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
        labels: {
          "app": "snap-collector"
        }
      },
      "spec": {
        "volumes": [
          {
            "name": "snap-tasks",
            "configMap": {
              "name": "snap-tasks-kubestate"
            }
          }
        ],
        "containers": [
          {
            "name": "snap",
            "image": raintankSnapImage,
            "ports": [
              {
                "name": "snap-api",
                "hostPort": 8383,
                "containerPort": 8383,
                "protocol": "TCP"
              }
            ],
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
            "env": [
              {
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
            "volumeMounts": [
              {
                "name": "snap-tasks",
                "mountPath": "/opt/snap/tasks"
              }
            ],
            "imagePullPolicy": "IfNotPresent",
          }
        ],
        "restartPolicy": "Always",
      }
    }
  }
};
