apf.ChromeDebugHost = function(hostname, port, o3obj) {
    this.$hostname = hostname;
    this.$port = port;
    this.o3obj = o3obj;
    
    this.$debuggers = {};
    
    this.$init();
    this.$connect(function() {});
};

(function() {
     
    this.$connect = function(callback) {
        if (this.state == "connected") {
            return callback.call(this);
        } else {
            this.addEventListener("connect", callback);
        }
        if (this.state == "connecting")
            return;

        this.state = "connecting";

        // TODO #IDE-52
        var o3obj = document.getElementsByTagName("embed")[0];
        
        var socket = this.$socket = new O3Socket(this.$hostname, this.$port, o3obj);
        var msgStream = new ChromeDebugMessageStream(socket);

        var self = this;
        msgStream.addEventListener("connect", function() {
            self.$dts = new DevToolsService(msgStream);
            self.$v8ds = new V8DebuggerService(msgStream);
            self.state = "connected";
            self.dispatchEvent("connect");
            
            window.onunload = ace.bind(self.disconnect, self);
        });

        msgStream.connect();        
    };
    
    this.loadTabs = function(model) {
        var self = this;
        this.$connect(function() {
            self.$dts.listTabs(function(tabs) {
                var xml = [];
                for (var i = 0; i < tabs.length; i++) {
                    xml.push("<tab id='", tabs[i][0], "' url='", apf.escapeXML(tabs[i][1]+""), "' />");
                }
                model.load("<tabs>" + xml.join("") + "</tabs>");
            });
        });
    };
    
    this.attach = function(tabId, callback) {
        var dbg;
        
        if (dbg = this.$debuggers[tabId])
            callback(null, dbg)

        var self = this;
        this.$connect(function() {
            self.$v8ds.attach(tabId, function() {
                dbg = new apf.ChromeDebugger(new V8Debugger(tabId, self.$v8ds), this);
                self.$debuggers[tabId] = dbg;
                callback(null, dbg);
            });
        });
    };
    
    this.detach = function(dbg, callback) {        
        var self = this;
        for (var id in this.$debuggers) {
            if (this.$debuggers[id] == dbg) {
                this.$v8ds.detach(id, function(err) {
                    delete self.$debuggers[id];
                    dbg.dispatchEvent("detach");
                    callback && callback(err);
                });                
                break;
            }    
        }
    };  
    
    this.disconnect = function(callback) {
        var debuggers = [];
        for (var id in this.$debuggers) {
            debuggers.push(id);
        }
        
        var self = this;
        var detachNext = function() {
            if (debuggers.length) {
                var id = debuggers.shift();
                var dbg = self.$debuggers[id]
                self.$v8ds.detach(id, function() {
                    detachNext();
                    dbg.dispatchEvent("detach");
                });
            } else {
                self.$socket.close();
                self.$debuggers = {};
                self.dispatchEvent("disconnect", {});
                callback && callback();
            }
        }
        
        detachNext();
    };
    
}).call(apf.ChromeDebugHost.prototype = new apf.Class());