import _ from 'lodash';
import $ from 'jquery';
import {K8sClusterAPI} from './k8sClusterAPI';

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
  return slug;
}

function extractContainerID(str) {
  var dockerIDPattern = /docker\:\/\/(.{12})/;
  return dockerIDPattern.exec(str)[1];
}

export class ClusterInfoCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, $q, $location, alertSrv) {
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.$location = $location;
    this.clusterAPI = {};

    this.pageReady = false;
    this.cluster = {};
    this.componentStatuses = [];
    this.namespaces = [];
    this.namespace = "";
    this.nodes = [];
    this.daemonSets = [];
    this.replicationControllers = [];
    this.deployments = [];
    this.pods = [];
    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    }

    this.getCluster($location.search().cluster).then(() => {
      this.clusterAPI = new K8sClusterAPI(this.cluster.id, backendSrv);
      this.pageReady = true;
      this.getWorkloads();
    });
  }

  getWorkloads() {
    this.clusterAPI.get('componentstatuses').then(stats => {
      this.componentStatuses = stats.items;
    });
    this.clusterAPI.get('namespaces').then(ns => {
      this.namespaces = ns.items;
    });
    this.clusterAPI.get('nodes').then(nodes => {
      this.nodes = nodes.items;
    });
    this.getDaemonSets().then(ds => {
      this.daemonSets = ds.items;
    });
    this.getReplicationControllers().then(rc => {
      this.replicationControllers = rc.items;
    });
    this.getDeployments().then(deploy => {
      this.deployments = deploy.items;
    });
    this.getPods().then(pod => {
      this.pods = pod.items;
    });
  }

  getCluster(id) {
    return this.backendSrv.get('api/datasources/'+id)
    .then((ds) => {
      this.cluster = ds;
    });
  }

  componentHealth(component) {
    var health = "unhealthy";
    _.forEach(component.conditions, function(condition) {
      if ((condition.type === "Healthy") && (condition.status === "True")) {
        health = "healthy";
      }
    });
    return health;
  }

  isComponentHealthy(component) {
    return this.componentHealth(component) === "healthy";
  }

  nodeStatus(node) {
    var health = "unhealthy";
    _.forEach(node.status.conditions, function(condition) {
      if ((condition.type === "Ready") && (condition.status === "True")) {
        health = "healthy";
      }
    });
    return health;
  }

  isNodeHealthy(node) {
    return this.nodeStatus(node) === "healthy";
  }

  goToNodeDashboard(node, evt) {
    var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
    if (clickTargetIsLinkOrHasLinkParents === false) {
      this.$location.path("dashboard/db/kubernetes-node")
      .search({
        "var-datasource": this.cluster.jsonData.ds,
        "var-cluster": this.cluster.name,
        "var-node": slugify(node.metadata.name)
      });
    }
  }

  goToPodDashboard(pod, evt) {
    var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
    if (clickTargetIsLinkOrHasLinkParents === false) {
      var containerIDs = _.map(pod.status.containerStatuses, (status) => {
        return extractContainerID(status.containerID);
      });
      this.$location.path("dashboard/db/kubernetes-container")
      .search({
        "var-datasource": this.cluster.jsonData.ds,
        "var-cluster": this.cluster.name,
        "var-node": pod.spec.nodeName,
        "var-container": containerIDs
      });
    }
  }

  goToWorkloads(ns, evt) {
    var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
    if (clickTargetIsLinkOrHasLinkParents === false) {
      this.$location.path("plugins/raintank-kubernetes-app/page/cluster-workloads")
      .search({
        "cluster": this.cluster.id,
        "namespace": slugify(ns.metadata.name)
      });
    }
  }

  goToNodeInfo(node, evt) {
    var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;

    var closestElm = _.head($(evt.target).closest('div'));
    var clickTargetClickAttr = _.find(closestElm.attributes, {name: "ng-click"});
    var clickTargetIsNodeDashboard = clickTargetClickAttr ? clickTargetClickAttr.value === "ctrl.goToNodeDashboard(node, $event)" : false;
    if (clickTargetIsLinkOrHasLinkParents === false &&
        clickTargetIsNodeDashboard === false) {
      this.$location.path("plugins/raintank-kubernetes-app/page/node-info")
      .search({
        "cluster": this.cluster.id,
        "node": slugify(node.metadata.name)
      });
    }
  }

  goToPodInfo(pod, evt) {
    var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;

    var clickTargetClickAttr = _.find(evt.target.attributes, {name: "ng-click"});
    var clickTargetIsNodeDashboard = clickTargetClickAttr ? clickTargetClickAttr.value === "ctrl.goToPodDashboard(pod, $event)" : false;
    if (clickTargetIsLinkOrHasLinkParents === false &&
        clickTargetIsNodeDashboard === false) {
      this.$location.path("plugins/raintank-kubernetes-app/page/pod-info")
      .search({
        "cluster": this.cluster.id,
        "namespace": pod.metadata.namespace,
        "pod": pod.metadata.name
      });
    }
  }

  getResource(prefix, resource) {
    if (this.namespace) {
      resource = "namespaces/" + this.namespace + "/" + resource;
    }

    return this.clusterAPI.getRawResource(prefix + resource);
  }

  getDaemonSets() {
    return this.getResource("/apis/extensions/v1beta1/", "daemonsets");
  }

  getReplicationControllers() {
    return this.getResource("/api/v1/", "replicationcontrollers");
  }

  getDeployments() {
    return this.getResource("/apis/extensions/v1beta1/", "deployments");
  }

  getPods() {
    return this.getResource("/api/v1/", "pods");
  }
}

ClusterInfoCtrl.templateUrl = 'components/clusters/partials/cluster_info.html';
