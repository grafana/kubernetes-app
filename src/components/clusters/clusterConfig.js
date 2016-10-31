import _ from 'lodash';
import appEvents from 'app/core/app_events';

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
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

    var promises = [];
    if ("cluster" in $location.search()) {
      promises.push(self.getCluster($location.search().cluster).then(() => {
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

    $q.all(promises).then(() => {
      self.pageReady = true;
    });
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

  saveAndDeploy() {
    var self = this;
    if (this.cluster.id) {
      return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster).then(() => {
        return self.deploySnap();
      });
    } else {
      return this.backendSrv.post('/api/datasources', this.cluster).then(() => {
        return self.deploySnap();
      });
    }
  }

  deploySnap() {
    var self = this;
    var task = _.cloneDeep(snapTask);
    task.workflow.collect.publish[0].config.prefix = "snap."+slugify(self.cluster.name) + ".<%NODE%>";
    task.workflow.collect.publish[0].config.port = self.cluster.jsonData.port;
    task.workflow.collect.publish[0].config.server = self.cluster.jsonData.server;
    var cm = _.cloneDeep(configMap);
    cm.data["core.json"] = JSON.stringify(task);

    if (!this.snapDeployed) {
      return this.createConfigMap(self.cluster.id, cm)
      .then(() => {
        return this.createDaemonSet(self.cluster.id, daemonSet);
      })
      .catch(err => {
        this.alertSrv.set("Error", err, 'error');
      }).then(() => {
        this.snapDeployed = true;
        this.alertSrv.set("Deployed", "Snap DaemonSet for Kubernetes metrics deployed to " + self.cluster.name, 'success', 5000);
      });
    } else {
      return self.updateSnapSettings(cm);
    }
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

  deleteConfigMap(clusterId) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/configmaps/snap-tasks',
      method: 'DELETE'
    });
  }

  updateSnapSettings(cm) {
    var self = this;
    return this.deleteConfigMap(self.cluster.id)
    .then(() => {
      return this.createConfigMap(self.cluster.id, cm);
    }).then(() => {
      return this.backendSrv.request({
        url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/pods?labelSelector=daemon%3Dsnapd',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    }).then(pods => {
      if (!pods || pods.items.length === 0) {
        throw "Failed to restart snap pod. No snapd pod found to update.";
      }

      return this.backendSrv.request({
        url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/pods/' + pods.items[0].metadata.name,
        method: 'DELETE',
      });
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

var snapTask = {
  "version": 1,
  "schedule": {
    "type": "simple",
    "interval": "10s"
  },
  "workflow": {
    "collect": {
      "metrics": {
        "/intel/docker/*":{},
        "/intel/procfs/cpu/*": {},
        "/intel/procfs/meminfo/*": {},
        "/intel/procfs/iface/*": {},
        "/intel/linux/iostat/*": {},
        "/intel/procfs/load/*": {}
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
        "daemon": "snapd"
      }
    },
    "template": {
      "metadata": {
        "name": "snap",
        "labels": {
          "daemon": "snapd"
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
            "image": "raintank/snap_k8s:v5",
            "ports": [
              {
                "name": "snap-api",
                "hostPort": 8181,
                "containerPort": 8181,
                "protocol": "TCP"
              }
            ],
            "env": [
              {
                "name": "PROCFS_MOUNT",
                "value": "/proc_host"
              }
            ],
            "resources": {},
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
