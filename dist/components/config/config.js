"use strict";

System.register([], function (_export, _context) {
  "use strict";

  var _createClass, ConfigCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export("ConfigCtrl", ConfigCtrl = function () {
        /** @ngInject */
        function ConfigCtrl($scope, $injector, $q) {
          _classCallCheck(this, ConfigCtrl);

          this.$q = $q;
          this.enabled = false;
          this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
        }

        _createClass(ConfigCtrl, [{
          key: "postUpdate",
          value: function postUpdate() {
            var _this = this;

            if (!this.appModel.enabled) {
              return this.$q.resolve();
            }
            return this.appEditCtrl.importDashboards().then(function () {
              _this.enabled = true;
              return {
                url: "plugins/raintank-kubernetes-app/page/clusters",
                message: "Kubernetes App enabled!"
              };
            });
          }
        }]);

        return ConfigCtrl;
      }());

      _export("ConfigCtrl", ConfigCtrl);

      ConfigCtrl.templateUrl = 'components/config/config.html';
    }
  };
});
//# sourceMappingURL=config.js.map
