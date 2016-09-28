import {ConfigCtrl} from './components/config/config';
import {loadPluginCss} from 'app/plugins/sdk';
import {ClustersCtrl} from './components/clusters/clusters';
import {ClusterConfigCtrl} from './components/clusters/clusterConfig';
import {ClusterInfoCtrl} from './components/clusters/clusterInfo';

loadPluginCss({
  dark: 'plugins/raintank-kubernetese-app/css/kubernetes.dark.css',
  light: 'plugins/raintank-kubernetes-app/css/kubernetes.light.css'
});

export {
  ConfigCtrl,
  ClustersCtrl,
  ClusterConfigCtrl,
  ClusterInfoCtrl
};
