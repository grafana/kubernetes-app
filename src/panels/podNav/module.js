
import {PodNavCtrl} from './podNav';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/raintank-kubernetes-app/css/dark.css',
  light: 'plugins/raintank-kubernetes-app/css/light.css'
});

export  {
  PodNavCtrl as PanelCtrl
};
