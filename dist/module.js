'use strict';

System.register(['./components/config/config', 'app/plugins/sdk', './components/clusters/clusters', './components/clusters/clusterConfig', './components/clusters/clusterInfo'], function (_export, _context) {
  "use strict";

  var ConfigCtrl, loadPluginCss, ClustersCtrl, ClusterConfigCtrl, ClusterInfoCtrl;
  return {
    setters: [function (_componentsConfigConfig) {
      ConfigCtrl = _componentsConfigConfig.ConfigCtrl;
    }, function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }, function (_componentsClustersClusters) {
      ClustersCtrl = _componentsClustersClusters.ClustersCtrl;
    }, function (_componentsClustersClusterConfig) {
      ClusterConfigCtrl = _componentsClustersClusterConfig.ClusterConfigCtrl;
    }, function (_componentsClustersClusterInfo) {
      ClusterInfoCtrl = _componentsClustersClusterInfo.ClusterInfoCtrl;
    }],
    execute: function () {

      loadPluginCss({
        dark: 'plugins/raintank-kubernetese-app/css/kubernetes.dark.css',
        light: 'plugins/raintank-kubernetes-app/css/kubernetes.light.css'
      });

      _export('ConfigCtrl', ConfigCtrl);

      _export('ClustersCtrl', ClustersCtrl);

      _export('ClusterConfigCtrl', ClusterConfigCtrl);

      _export('ClusterInfoCtrl', ClusterInfoCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
