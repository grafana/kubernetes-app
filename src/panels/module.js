
import {NodeDataCtrl} from './nodeData';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/raintank-kubernetes-app/css/dark.css',
  light: 'plugins/raintank-kubernetes-app/css/light.css'
});

export  {
  NodeDataCtrl as PanelCtrl
};
