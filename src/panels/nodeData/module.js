
import {NodeDataCtrl} from './nodeData';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/prometheus-kubernetes-app/css/dark.css',
  light: 'plugins/prometheus-kubernetes-app/css/light.css'
});

export  {
  NodeDataCtrl as PanelCtrl
};
