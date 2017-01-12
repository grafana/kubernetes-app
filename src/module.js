import {ConfigCtrl} from './components/config/config';
import {ClustersCtrl} from './components/clusters/clusters';
import {ClusterConfigCtrl} from './components/clusters/clusterConfig';
import {ClusterInfoCtrl} from './components/clusters/clusterInfo';
import {ClusterWorkloadsCtrl} from './components/clusters/clusterWorkloads';
import {NodeInfoCtrl} from './components/clusters/nodeInfo';
import {PodInfoCtrl} from './components/clusters/podInfo';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/raintank-kubernetes-app/css/dark.css',
  light: 'plugins/raintank-kubernetes-app/css/light.css'
});

export {
  ConfigCtrl,
  ClustersCtrl,
  ClusterConfigCtrl,
  ClusterInfoCtrl,
  ClusterWorkloadsCtrl,
  NodeInfoCtrl,
  PodInfoCtrl
};
