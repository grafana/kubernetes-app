import _ from 'lodash';

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
  return slug;
}

export class ClusterConfigCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, $q, contextSrv, $location, $window) {
    var self = this;
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
    this.$window = $window;
    this.$location = $location;
    this.cluster = {type: 'raintank-kubernetes-datasource'};
    this.pageReady = false;
    this.snapDeployed = false;
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
    var self = this;
    if (this.cluster.id) {
      return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster).then(() => {
        self.$location.path('plugins/raintank-kubernetes-app/page/clusters');
      });
    } else {
      return this.backendSrv.post('/api/datasources', this.cluster).then(() => {
        self.$location.path('plugins/raintank-kubernetes-app/page/clusters');
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
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/configmaps',
      method: 'POST',
      data: cm,
      headers: { 'Content-Type': 'application/json' }
    }).then(() => {
      return self.backendSrv.request({
        url: 'api/datasources/proxy/' + self.cluster.id + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets',
        method: 'POST',
        data: daemonSet,
        headers: {'Content-Type': "application/json"}
      }).then(() => {
        this.snapDeployed = true;
      });
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
            "image": "raintank/snap_k8s:v4",
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