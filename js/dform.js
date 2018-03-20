function dform(s,fn) {
	this.data={};
	this.srcs={};
	this.lists={};
	this.columns = (s.hasOwnProperty("columns")) ? s.form : "";
	this.form = (s.hasOwnProperty("form")) ? s.form : "";

	var self = this;
	this.findOptionSrc = function(node) {
		if (Array.isArray(node)) {
			for (var i=0;i<node.length;i++) self.findOptionSrc(node[i]);
		} else if (typeof node == "object") {
			for (var k in node) {
				if (k=="ctl") {
					if (node[k].hasOwnProperty("type")) {
						if (node[k].type=="select") {
							if (node[k].hasOwnProperty("src")) {
								if (self.srcs.hasOwnProperty(node[k].src)) node[k].options = self.srcs[node[k].src];
							}
						}
					}
				} else {
					self.findOptionSrc(node[k]);
				}
			}
		}
	};
	this.loadSrc = function(f) {
		var self = this;		
		if (s.hasOwnProperty("srcs")) {
			var ks = Object.keys(s.srcs);
			var n = 0;
			function getSrcs(n) {
				var srcItem = s.srcs[ks[n]];
				ajaxGet(guid(),"script/getjson",{fn:srcItem.src},function(b) {	
					if (Array.isArray(b.value)) {//replace &amp; by &
						b.value = JSON.parse(JSON.stringify(b.value).replace(/\&amp;/g,"&"));
					}
					self.srcs[ks[n]]=b.value;
					n++;
					if (n<ks.length) {
						getSrcs(n);
					} else {
						f();
					}
				});
			};
			getSrcs(n);
		} else {
			f();
		}
	};
	this.findLookupSrc = function(node) {
		if (Array.isArray(node)) {
			for (var i=0;i<node.length;i++) self.findLookupSrc(node[i]);
		} else if (typeof node == "object") {
			for (var k in node) {
				if (k=="lookup") {
					if (self.lists.hasOwnProperty(node[k].src)) node[k].list = self.lists[node[k].src];
				} else {
					self.findLookupSrc(node[k]);
				}
			}
		}
	};
	this.getLookup = function(fn) {
		var self = this;		
		if (s.hasOwnProperty("lists")) {
			var ks = Object.keys(s.lists);
			var n = 0;
			function getlist(n) {
				var listItem = s.lists[ks[n]];
				if (Array.isArray(listItem)) {

				} else {
					var d = {cmd:"select",table:listItem.table,fields:listItem.fields};
					if (listItem.hasOwnProperty("filter")) d.filter = listItem.filter;
					if (listItem.hasOwnProperty("sort")) d.sort = listItem.sort;					
					ajaxGet(guid(),"db/dba",d,function(b) {
						self.lists[ks[n]]=b.value;
						n++;
						if (n<ks.length) {
							getlist(n);
						} else {
							fn();
						}
					});
				}
			};
			getlist(n);
		} else {
			fn();
		}
	};
	this.getData = function(d,fn) {
		if (s.hasOwnProperty('data')) {
			if (typeof s.data === "string") {
				if (s.data.isJSON()) this.data = s.data; //json
			} else if (Array.isArray(s.data)) {
				this.data = s.data; //json
			} else if (typeof s.data === "object") {
				this.data = s.data; //single json
			} else {
				this.data="no data";
			}
		}
		ajaxGet(guid(),"db/dba",d,function(b) {fn(b)});
	};
	this.init = function(fn) {
		var self = this;
		this.loadSrc(function () {
			self.findOptionSrc(s.columns);
			self.getLookup(function() {
				self.findLookupSrc(s.columns);
				if (s.hasOwnProperty("srctype")) {
					if (s.srctype=="db") {
						var d = s;
						d.cmd="select";
						self.getData(d,function(b) {
							if (typeof fn != "undefined") fn();
						});
					}
				}
			});
		});		
	};
	this.init(fn);	
}