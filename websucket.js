(function(global) {
  var WebSocket = global.WebSocket;
  var closeEnabled = true;
  var sendEnabled = true;
  var eventBlocks = {};

  function WebSucket() {
    // Unfortunately we can't do contructor/prototype/apply tricks
    // on DOM objects. Chrome tells us to
    // "Please use the 'new' operator, this DOM object constructor cannot be called as a function."
    switch(arguments.length) {
      case 0:
        this._underlying = new WebSocket();
        break;
      case 1:
        this._underlying = new WebSocket(arguments[0]);
        break;
      case 2:
        this._underlying = new WebSocket(arguments[0], arguments[1]);
        break;
      default:
        throw new Error('Unable to handle invocations with ' + arguments.length + ' items');
    }
    var self = this;

    var createProxy = function (path, readOnly) {
      var pathCaps = path.replace(/^(.)(.*)$/, function(m) { return m[2].toUpperCase() + m[3]; });
      var propertyDefinition = {
        enumerable: true,
        configurable: false,
        get: function() {
          console.log('get ' + path);
          if(this['get' + pathCaps]) {
            return this['get' + pathCaps]();
          }

          return self._underlying[path];
        }
      };
      if(!readOnly) {
        propertyDefinition.set = function(value) {
          console.log('set ' + path);

          if(this['set' + pathCaps]) {
            return this['set' + pathCaps](value);
          }

          this._underlying[path] = value;
          return value;
        };
      }
      return propertyDefinition;
    };

    var createEventProxy = function (path, readOnly) {
      self._underlying[path] = function(e) {
        if(self[path] && !eventBlocks[path]) {
          self[path](e);
        }
      };
    }.bind(this);

    Object.defineProperties(this, {
      "binaryType":  createProxy('binaryType'),
      "bufferedAmount":  createProxy('bufferedAmount'),
      "extensions":  createProxy('extensions'),
      "protocol":  createProxy('protocol'),
      "readyState":  createProxy('readyState', true),
      "url":  createProxy('url', true)
    });

    createEventProxy('onclose');
    createEventProxy('onerror');
    createEventProxy('onmessage');
    createEventProxy('onopen');

  }

  WebSucket.prototype.close = function(code, reason) {
    if(!closeEnabled) return console.log('(ignored) websucket.close');
    console.log('websucket.close');
    var args = Array.prototype.slice.apply(arguments);
    return this._underlying.close.apply(this._underlying, args);
  };

  WebSucket.prototype.send = function(data) {
    if(!sendEnabled) return console.log('(ignored) websucket.send');
    var args = Array.prototype.slice.apply(arguments);
    return this._underlying.send.apply(this._underlying, args);
  };


  global.WebSocket = WebSucket;
  global.webSucketControl = {
    freeze: function() {
      sendEnabled = false;
      eventBlocks['onerror'] = true;
      eventBlocks['onmessage'] = true;
      eventBlocks['onclose'] = true;
      eventBlocks['onopen'] = true;
      closeEnabled = false;
    }
  };


})(window);
