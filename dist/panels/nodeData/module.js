'use strict';

System.register(['./nodeData', 'app/plugins/sdk'], function (_export, _context) {
  "use strict";

  var NodeDataCtrl, loadPluginCss;
  return {
    setters: [function (_nodeData) {
      NodeDataCtrl = _nodeData.NodeDataCtrl;
    }, function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }],
    execute: function () {

      loadPluginCss({
        dark: 'plugins/raintank-kubernetes-app/css/dark.css',
        light: 'plugins/raintank-kubernetes-app/css/light.css'
      });

      _export('PanelCtrl', NodeDataCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
