/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __WITH_UTILITIES

/**
 * Opens a window with the string in it
 * @param {String} str the html string displayed in the new window.
 */
apf.pasteWindow = function(str){
    var win = window.open("about:blank");
    win.document.write(str);
};

//#ifdef __WITH_ENTITY_ENCODING

/**
 * see string#escapeHTML
 * @param {String} str the html to be escaped.
 * @return {String} the escaped string.
 */
apf.htmlentities = function(str){
    return str.escapeHTML();
};

/**
 * Escape an xml string making it ascii compatible.
 * @param {String} str the xml string to escape.
 * @return {String} the escaped string.
 *
 * @todo This function does something completely different from htmlentities, 
 *       the name is confusing and misleading.
 */
apf.xmlentities = apf.escapeXML;

/**
 * Unescape an html string.
 * @param {String} str the string to unescape.
 * @return {String} the unescaped string.
 */
apf.html_entity_decode = function(str){
    return (str || "").replace(/\&\#38;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
};

//#endif

/**
 * Determines whether the keyboard input was a character that can influence
 * the value of an element (like a textbox).
 * @param {Number} charCode The ascii character code.
 */
apf.isCharacter = function(charCode){
    return (charCode < 112 || charCode > 122)
      && (charCode == 32 || charCode > 42 || charCode == 8);
};

/**
 * This random number generator has been added to provide a more robust and
 * reliable random number spitter than the native Ecmascript Math.random()
 * function.
 * is an implementation of the Park-Miller algorithm. (See 'Random Number
 * Generators: Good Ones Are Hard to Find', by Stephen K. Park and Keith W.
 * Miller, Communications of the ACM, 31(10):1192-1201, 1988.)
 * @author David N. Smith of IBM's T. J. Watson Research Center.
 * @author Mike de Boer (mike AT javeline DOT com)
 * @class randomGenerator
 */
apf.randomGenerator = {
    d: new Date(),
    seed: null,
    A: 48271,
    M: 2147483647,
    Q: null,
    R: null,
    oneOverM: null,

    /**
     * Generates a random Number between a lower and upper boundary.
     * The algorithm uses the system time, in minutes and seconds, to 'seed'
     * itself, that is, to create the initial values from which it will generate
     * a sequence of numbers. If you are familiar with random number generators,
     * you might have reason to use some other value for the seed. Otherwise,
     * you should probably not change it.
     * @param {Number} lnr Lower boundary
     * @param {Number} unr Upper boundary
     * @result A random number between <i>lnr</i> and <i>unr</i>
     * @type Number
     */
    generate: function(lnr, unr) {
        if (this.seed == null)
            this.seed = 2345678901 + (this.d.getSeconds() * 0xFFFFFF) + (this.d.getMinutes() * 0xFFFF);
        this.Q = this.M / this.A;
        this.R = this.M % this.A;
        this.oneOverM = 1.0 / this.M;
        return Math.floor((unr - lnr + 1) * this.next() + lnr);
    },

    /**
     * Returns a new random number, based on the 'seed', generated by the
     * <i>generate</i> method.
     * @type Number
     */
    next: function() {
        var hi = this.seed / this.Q;
        var lo = this.seed % this.Q;
        var test = this.A * lo - this.R * hi;
        if (test > 0)
            this.seed = test;
        else
            this.seed = test + this.M;
        return (this.seed * this.oneOverM);
    }
};

/**
 * Adds a time stamp to the url to prevent the browser from caching it.
 * @param {String} url the url to add the timestamp to.
 * @return {String} the url with timestamp.
 */
apf.getNoCacheUrl = function(url){
    return url
        + (url.indexOf("?") == -1 ? "?" : "&")
        + "nocache=" + new Date().getTime();
};

/**
 * Checks if the string contains curly braces at the start and end. If so it's
 * processed as javascript, else the original string is returned.
 * @param {String} str the string to parse.
 * @return {String} the result of the parsing.
 */
apf.parseExpression = function(str){
    if (!apf.parseExpression.regexp.test(str))
        return str;

    //#ifdef __DEBUG
    try {
    //#endif
        return eval(RegExp.$1);
    //#ifdef __DEBUG
    }
    catch(e) {
        throw new Error(apf.formatErrorString(0, null,
            "Parsing Expression",
            "Invalid expression given '" + str + "'"));
    }
    //#endif
};
apf.parseExpression.regexp = /^\{([\s\S]*)\}$/;

/**
 * @private
 */
apf.formatNumber = function(num, prefix){
    var nr = parseFloat(num);
    if (!nr) return num;

    var str = new String(Math.round(nr * 100) / 100).replace(/(\.\d?\d?)$/, function(m1){
        return m1.pad(3, "0", apf.PAD_RIGHT);
    });
    if (str.indexOf(".") == -1)
        str += ".00";

    return prefix + str;
};

/**
 * Execute a script in the global scope.
 *
 * @param {String} str  the javascript code to execute.
 * @return {String} the javascript code executed.
 */
apf.jsexec = function(str, win){
    if (!str)
        return str;
    if (!win)
        win = self;

    if (apf.isO3)
        eval(str, self);
    else if (apf.hasExecScript) {
        win.execScript(str);
    }
    else {
        var head = win.document.getElementsByTagName("head")[0];
        if (head) {
            var script = win.document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.text = str;
            head.appendChild(script);
            head.removeChild(script);
        } else
            eval(str, win);
    }

    return str;
};

/**
 * Shorthand for an empty function.
 */
apf.K = function(){};

// #ifdef __WITH_ECMAEXT

/**
 * Reliably determines whether a variable is a Number.
 *
 * @param {mixed}   value The variable to check
 * @type  {Boolean}
 */
apf.isNumber = function(value){
    return parseFloat(value) == value;
};

/**
 * Reliably determines whether a variable is an array.
 * @see http://thinkweb2.com/projects/prototype/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
 *
 * @param {mixed}   value The variable to check
 * @type  {Boolean}
 */
apf.isArray = function(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
};

/**
 * Determines whether a string is true in the html attribute sense.
 * @param {mixed} value the variable to check
 *   Possible values:
 *   true   The function returns true.
 *   'true' The function returns true.
 *   'on'   The function returns true.
 *   1      The function returns true.
 *   '1'    The function returns true.
 * @return {Boolean} whether the string is considered to imply truth.
 */
apf.isTrue = function(c){
    return (c === true || c === "true" || c === "on" || typeof c == "number" && c > 0 || c === "1");
};

/**
 * Determines whether a string is false in the html attribute sense.
 * @param {mixed} value the variable to check
 *   Possible values:
 *   false   The function returns true.
 *   'false' The function returns true.
 *   'off'   The function returns true.
 *   0       The function returns true.
 *   '0'     The function returns true.
 * @return {Boolean} whether the string is considered to imply untruth.
 */
apf.isFalse = function(c){
    return (c === false || c === "false" || c === "off" || c === 0 || c === "0");
};

/**
 * Determines whether a value should be considered false. This excludes amongst
 * others the number 0.
 * @param {mixed} value the variable to check
 * @return {Boolean} whether the variable is considered false.
 */
apf.isNot = function(c){
    // a var that is null, false, undefined, Infinity, NaN and c isn't a string
    return (!c && typeof c != "string" && c !== 0 || (typeof c == "number" && !isFinite(c)));
};

/**
 * Creates a relative url based on an absolute url.
 * @param {String} base the start of the url to which relative url's work.
 * @param {String} url  the url to transform.
 * @return {String} the relative url.
 */
apf.removePathContext = function(base, url){
    if (!url)  return "";

    if (url.indexOf(base) > -1)
        return url.substr(base.length);

    return url;
};

/**
 * @private
 * @todo why is this done like this?
 */
apf.cancelBubble = function(e, o, noPropagate){
    if (e.stopPropagation)
        e.stopPropagation()
    else 
        e.cancelBubble = true;
    // #ifdef __WITH_FOCUS
    //if (o.$focussable && !o.disabled)
        //apf.window.$focus(o);
    // #endif
    
    /*if (apf.isIE)
        o.$ext.fireEvent("on" + e.type, e);
    else 
        o.$ext.dispatchEvent(e.name, e);*/
    
    if (!noPropagate) {
        if (o && o.$ext && o.$ext["on" + (e.type || e.name)])
            o.$ext["on" + (e.type || e.name)](e);
        apf.window.$mousedown(e);
    }
    //if (apf.isGecko)
        //apf.window.$mousedown(e);
    
    //#ifdef __ENABLE_UIRECORDER_HOOK
    if (apf.uirecorder && apf.uirecorder.captureDetails 
      && (apf.uirecorder.isRecording || apf.uirecorder.isTesting)) {
        apf.uirecorder.capture.nextStream(e.type || e.name);
    }
    //#endif
};

// #endif

/**
 * Attempt to fix memory leaks
 * @private
 */
apf.destroyHtmlNode = function (element) {
    if (!element) return;

    if (!apf.isIE || element.ownerDocument != document) {
        if (element.parentNode)
            element.parentNode.removeChild(element);
        return;
    }

    var garbageBin = document.getElementById('IELeakGarbageBin');
    if (!garbageBin) {
        garbageBin    = document.createElement('DIV');
        garbageBin.id = 'IELeakGarbageBin';
        garbageBin.style.display = 'none';
        document.body.appendChild(garbageBin);
    }

    // move the element to the garbage bin
    garbageBin.appendChild(element);
    garbageBin.innerHTML = '';
};

//#ifdef __WITH_SMARTBINDINGS
/**
 * @private
 */
apf.getRules = function(node){
    var rules = {};

    for (var w = node.firstChild; w; w = w.nextSibling){
        if (w.nodeType != 1)
            continue;
        else {
            if (!rules[w[apf.TAGNAME]])
                rules[w[apf.TAGNAME]] = [];
            rules[w[apf.TAGNAME]].push(w);
        }
    }

    return rules;
};
//#endif

apf.isCoord = function (n){
    return n || n === 0;
}

apf.getCoord = function (n, other){
    return n || n === 0 ? n : other;
}

/**
 * @private
 */
apf.getBox = function(value, base){
    if (!base) base = 0;

    if (value == null || (!parseInt(value) && parseInt(value) != 0))
        return [0, 0, 0, 0];

    var x = String(value).splitSafe(" ");
    for (var i = 0; i < x.length; i++)
        x[i] = parseInt(x[i]) || 0;
    switch (x.length) {
        case 1:
            x[1] = x[0];
            x[2] = x[0];
            x[3] = x[0];
            break;
        case 2:
            x[2] = x[0];
            x[3] = x[1];
            break;
        case 3:
            x[3] = x[1];
            break;
    }

    return x;
};

/**
 * @private
 */
apf.getNode = function(data, tree){
    var nc = 0;//nodeCount
    //node = 1
    if (data != null) {
        for (var i = 0; i < data.childNodes.length; i++) {
            if (data.childNodes[i].nodeType == 1) {
                if (nc == tree[0]) {
                    data = data.childNodes[i];
                    if (tree.length > 1) {
                        tree.shift();
                        data = this.getNode(data, tree);
                    }
                    return data;
                }
                nc++
            }
        }
    }

    return null;
};

/**
 * Retrieves the first xml node with nodeType 1 from the children of an xml element.
 * @param {XMLElement} xmlNode the xml element that is the parent of the element to select.
 * @return {XMLElement} the first child element of the xml parent.
 * @throw error when no child element is found.
 */
apf.getFirstElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.firstChild.nodeType == 1
            ? xmlNode.firstChild
            : xmlNode.firstChild.nextSibling
    }
    catch (e) {
        throw new Error(apf.formatErrorString(1052, null,
            "Xml Selection",
            "Could not find element:\n"
            + (xmlNode ? xmlNode.xml : "null")));
    }
    // #endif

    return xmlNode.firstChild.nodeType == 1
        ? xmlNode.firstChild
        : xmlNode.firstChild.nextSibling;
};

/**
 * Retrieves the last xml node with nodeType 1 from the children of an xml element.
 * @param {XMLElement} xmlNode the xml element that is the parent of the element to select.
 * @return {XMLElement} the last child element of the xml parent.
 * @throw error when no child element is found.
 */
apf.getLastElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.lastChild.nodeType == 1
            ? xmlNode.lastChild
            : xmlNode.lastChild.nextSibling
    }
    catch (e) {
        throw new Error(apf.formatErrorString(1053, null,
            "Xml Selection",
            "Could not find last element:\n"
            + (xmlNode ? xmlNode.xml : "null")));
    }
    // #endif

    return xmlNode.lastChild.nodeType == 1
        ? xmlNode.lastChild
        : xmlNode.lastChild.previousSibling;
};

/**
 * Selects the content of an html element. Currently only works in
 * internet explorer.
 * @param {HTMLElement} oHtml the container in which the content receives the selection.
 */
apf.selectTextHtml = function(oHtml){
    if (!apf.hasMsRangeObject) return;// oHtml.focus();

    var r = document.selection.createRange();
    try {r.moveToElementText(oHtml);} catch(e){}
    r.select();
};

// #endif
