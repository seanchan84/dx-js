if (!elementPrototype.dtable) {
	elementPrototype.dtable=function(s) {
		s.dom=this;
		//s.dom.dtable = new dtable(s);
		return new dtable(s)
	}
}

function chkNodeVal(o,n,v,t,f) {
	if (o.hasOwnProperty(n)) {
		if (typeof t != "undefined") t(o);
	} else {
		if (typeof f != "undefined") f(o);
	}
}

function dtable(s) {
	this.data={};
	this.srcs={};
	this.lists={};
	var self = this;

	this.findOptionSrc = function(node) {
		console.log("findOptionSrc");
		if (Array.isArray(node)) {
			for (var i=0;i<node.length;i++) self.findOptionSrc(node[i]);
		} else if (typeof node == "object") {
			for (var k in node) {
				if (k=="ctl") {
					chkNodeVal(node[k],"type","select", function(obj) {
						if (obj.hasOwnProperty("src")) {
							if (self.srcs.hasOwnProperty(obj.src)) obj.options = self.srcs[obj.src];
						}
					});
					/*if (node[k].hasOwnProperty("type")) {
						if (node[k].type=="select") {
							if (node[k].hasOwnProperty("src")) {
								if (self.srcs.hasOwnProperty(node[k].src)) node[k].options = self.srcs[node[k].src];
							}
						}
					}*/
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
	this.getDbColumn = function(d,fn) {
		ajaxGet(guid(),"db/dba",{cmd:"cols",table:s.table},function(b) {fn(b)});
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

	function popmsg(ctx) {
 		if (getdom("#popmsgbox")) getdom("#popmsgbox").remove();
 		var pm = newdom("div").html(ctx).attr('id','popmsgbox');
 		pm.setAttribute("style","position:fixed;right:10px;top:10px;padding:10px;background-color:#2BBAF8");
 		document.body.append(pm);
 		setTimeout(function() {pm.remove()},2000);
 	}

	function buildStyles() {
		addStyle(".editable{background-color:#EFF;}");
		addStyle(".editable:hover{cursor:pointer;background-color:#DFF !important;}");
		addStyle(".table-ctl {line-height:1.25em;}");
	}

	this.renderTable = function(j) {
		var t=newdom("table"), tb=newdom("tbody"), th=t.createTHead(), thr=th.insertRow(), dispCols={}, td, tr, chk;
		th.append(thr);
		t.append(tb);
		t.className = "dtable";
		if (!s.hasOwnProperty("columns")) s.columns = {};
		if (!Array.isArray(j)) return newdom("div").html("no data.");

		//Build Visible Cols
		if (s.hasOwnProperty("columns")) {
			for (var k in s.columns) {
				if (!s.columns[k].hasOwnProperty("visible")) s.columns[k].visible = 1;
				if (s.columns[k].visible!=0) dispCols[k] = s.columns[k];
			}
		}
		//------

		//make header
		chk = newdom("input").attr("type","checkbox").addClass("chk-all");
		td = thr.insertCell().append(chk);
		chk.onchange = function() {
			var chks = this.parentNode.parentNode.parentNode.parentNode.getdom(".row-chk");
			for (var i=0;i<chks.length;i++) chks[i].checked = this.checked;
			//update selected rows
			var rs = tb.getdom("tr");
			for (var i=0;i<rs.length;i++) {
				if (this.checked) {
					if (!rs[i].hasClass("selected-row")) rs[i].addClass("selected-row");
				} else {
					if (rs[i].hasClass("selected-row")) rs[i].removeClass("selected-row");
				}
			}
		};
		for (var k in s.columns) { //Bulid Columns; Table Header
			var txt=k;
			if (s.hasOwnProperty("columns")) {
				if (s.columns.hasOwnProperty(k)) {
					txt = (s.columns[k].hasOwnProperty("title")) ? s.columns[k].title : k;
					if (!s.columns[k].hasOwnProperty("visible")) s.columns[k].visible = 1;											
				} else {
					s.columns[k] = {title:k,datatype:"text",visible:1,format:""};
				}
			}

			if (s.columns[k].visible != 0) {
				td = thr.insertCell().html(txt);
				if (s.columns[k].hasOwnProperty("css")) {
					var css = s.columns[k].css;
					for (var c in css) td.style[c] = css[c];
				}	
				td.fieldname = k;
				td.onclick = function() {
					var ind=this.cellIndex, cs=this.parentNode, tb=cs.parentNode.parentNode.getdom("tbody")[0], rs=tb.rows, rows=[];
					for (var i=0;i<rs.length;i++) rows.push(rs[i]);
					for (var i=0;i<cs.cells.length;i++) {
						if (i!=ind) {
							if (cs.cells[i].hasClass("desc")) cs.cells[i].removeClass("desc");
							if (cs.cells[i].hasClass("asc")) cs.cells[i].removeClass("asc");
						}
					}
					if ((!this.hasClass("desc")) && (!this.hasClass("asc"))) this.addClass("asc");
					var dt = s.columns[this.fieldname].datatype;
					if (this.hasClass("desc")) {
						this.removeClass("desc").addClass("asc");
						if ((dt=="datestr") || (dt=="text") || (dt=="string") || (dt=="json")) rows.sort(function(a,b) {return b.cells[ind].html().localeCompare(a.cells[ind].html())});
						if (dt=="number") rows.sort(function(a,b) {return parseInt(b.cells[ind].html()) - parseInt(a.cells[ind].html())});
					} else if (this.hasClass("asc")) {
						this.removeClass("asc").addClass("desc");
						if ((dt=="datestr") || (dt=="text") || (dt=="string") || (dt=="json")) rows.sort(function(b,a) {return b.cells[ind].html().localeCompare(a.cells[ind].html())});
						if (dt=="number") rows.sort(function(b,a) {return parseInt(b.cells[ind].html()) - parseInt(a.cells[ind].html())});
					}

					tb.html("");
					for (var i=0;i<rows.length;i++) {
						tb.append(rows[i]);
					}
				}
			}
		}
		//------

		//Build Cell Style
		for (var k in dispCols) { //Build Cell Style
			if (s.columns[k].hasOwnProperty("tablectl")) {
				if (s.columns[k].tablectl.hasOwnProperty("css")) {
					var csstxt = [];
					for (var ce in s.columns[k].tablectl.css) csstxt.push(ce + ":" + s.columns[k].tablectl.css[ce]);
					addStyle('.cell-' + k + ' {'+ csstxt.join(";") + ";}");
				}
			}
		}
		//------

		for (var i=0;i<j.length;i++) {makeRow(j[i],s.columns)} //make rows

		return t;

		//Render Functions
		function formatRow(tr) { //Set Cell Format
			var data = tr.data;
			function replaceVal(txt) {
				for (var k in data) txt = txt.replace(new RegExp("{{"+k+"}}","g"),data[k]);
				return txt;
			}
			if (s.hasOwnProperty("row")) {
				if (s.row.hasOwnProperty("format")) {
					var f = s.row.format;
					if (f.use) {
						if (Array.isArray(f)) {
							for (var i=0;i<f.length;i++) {
								var cond = replaceVal(f[i].cond,data);
								if (eval("("+cond+")") == true) {

									tr.setAttribute("style", replaceVal(f[i].css,data));
									break;
								}
							}
						}
					}
				}
			}
		}

		function formatCell(col,data,val) { //Set Cell Format
			function replaceVal(txt,data,val) {
				txt = txt.replace(new RegExp("{{val}}","g"),val);
				for (var k in data) txt = txt.replace(new RegExp("{{"+k+"}}","g"),data[k]);
				return txt;
			}
			if (col.hasOwnProperty("tablectl")) {
				if (col.tablectl.hasOwnProperty("format")) {
					var f = col.tablectl.format;
					if (Array.isArray(f)) {
						for (var i=0;i<f.length;i++) {
							var cond = replaceVal(f[i].cond,data,val);
							if (eval("("+cond+")") == true) {
								return replaceVal(f[i].format,data,val);
								break;
							}
						}
					} else {
						return replaceVal(f,data,val);
					}
				}
			}
			return val;
		}

		function makeInputBox(dom,df,col,ae) {
			var val = dom.dataval;
			var field = dom.field;
			var keyfield = s.keyfield;
			var rowdata = dom.parentNode.data;
			var ctltype = "text";
			if (col[field].hasOwnProperty("datatype")) ctltype = col[field].datatype;
			if (col[field].hasOwnProperty("ctltype")) ctltype = col[field].ctltype;

			var ctltype = (col[field].hasOwnProperty("datatype")) ? col[field].datatype : "";
			if (col[field].hasOwnProperty("datatype")) {
				if (ctltype == "") ctltype = col[field].datatype;
			}

			var srcType = "", src = [], inp;

			if (col[field].hasOwnProperty("lookup")) {
				ctltype = "select";
				src = (col[field].lookup.hasOwnProperty("srcType")) ? df.srcs[col[field].lookup.src] : df.lists[col[field].lookup.src];
			} else {
				if (col[field].hasOwnProperty("ctl")) {
					if (col[field].ctl.hasOwnProperty("type")) ctltype = col[field].ctl.type;
					src = (col[field].ctl.hasOwnProperty("srcType")) ? df.srcs[col[field].ctl.src] : df.lists[col[field].ctl.src];
				}
			}

			function buildCtlOptions(dom, src) {
				for (var i=0;i<src.length;i++) dom.append(newdom("option").val(src[i].value).html((src[i].hasOwnProperty("text")) ? src[i].text : src[i].display));
			}

			switch (ctltype) {
				case "datestr":
					inp = newdom("input").addClass("table-ctl").attr("type","date").val(val);					
				break;
				case "text":
					inp = newdom("input").addClass("table-ctl").attr("type","text").val(val);
				break;
				case "number":
					inp = newdom("input").addClass("table-ctl").attr("type","number").val(val);
				break;
				case "email":
					inp = newdom("input").addClass("table-ctl").attr("type","email").val(val);
				break;
				case "string":
					inp = newdom("textarea").addClass("table-ctl").val(val);
				break;
				case "select":
					inp = newdom("select").addClass("table-ctl");
					buildCtlOptions(inp,src);
					inp.val(val);
				break;
			}

			function updateData() {
				var curInp = this;
				if (dom.dataval != this.val()) {
					dom.dataval = this.val();
					var fs = {};
					fs[field] = this.val();
					var d = {cmd:"update",table:s.table,fieldSet:JSON.stringify(fs),filter:keyfield+"='"+rowdata[keyfield]+"'"};

					dom.html("<img src='data:image/gif;base64,R0lGODlhKAAoAIABAH2u3v///yH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3MUI1QkNENjMzQTlFMTExOTkwODg2RjEzQjREMEVBNiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo1NTE0NTdEQzY0Q0YxMUUyQTBCOTk2MjRFNDZFMkIzNyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1NTE0NTdEQjY0Q0YxMUUyQTBCOTk2MjRFNDZFMkIzNyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCODdCMzIzOTM1QTlFMTExOUFFNzg4NzhBOTUxN0IzOCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3MUI1QkNENjMzQTlFMTExOTkwODg2RjEzQjREMEVBNiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEAACH5BAkKAAEALAAAAAAoACgAAAJKjI+py+0Po5y02ouz3rz7D4YTQJakYZpaWqIssL4uG9PBC2f4nNb9LdMFd0IbUYRMVo4hJsj5gXqkHSrHusEqt9yu9wsOi8dkTgEAIfkECQoAAQAsAAAAACgAKAAAAkqMj6nL7Q+jnLTai7PevPsPhhNAlqRhmlpaoiywvi4b08ELZ/ic1v0t0wV3QhtRhExCjiEmyPmBeqQdKse6wSq33K73Cw6Lx+RQAQAh+QQJCgABACwAAAAAKAAoAAACSoyPqcvtD6OctNqLs968+w+GE0CWpGGaWlqiLLC+LhvTwQtn+JzW/S3TBXdCG1GETC6OISbI+YF6pB0qx7rBKrfcrvcLDovH5G0BACH5BAkKAAEALAAAAAAoACgAAAJJjI+py+0Po5y02ouz3rz7D4YTQJakaJgmGqgl655oDMBxemc07mp7mxP9hMHLb2jMIS3HItP5WUahHmmVyspqt9yu9wsOi8eJAgAh+QQJCgABACwAAAAAKAAoAAACSIyPqcvtD6OctNqLs968+w+GE0CWpGiYJhqoJeueaAzAse3iKsv3EZ26ZYAtIYZIPAqTF6SxuXxanLlhtOrLarfcrvcLDosdBQAh+QQJCgABACwAAAAAKAAoAAACTIyPqcvtD6OctNqLs968+w+GGECWpGiYJhqoJeueaAzAse3iKsv3DJ26ZYAt4UhIPOaKS+WO+XSuoFPpi3q1ypK+rvcLDovH5LK5UQAAIfkECQoAAQAsAAAAACgAKAAAAkiMj6nL7Q+jnLTai7PevPsPhh1AlqRomCYaqCXrnmgMwLHt4irL9wedumWALSGGSDwKkxeksbl8Wpy5YbTqy2q33K73Cw6LHQUAIfkECQoAAQAsAAAAACgAKAAAAkiMj6nL7Q+jnLTai7PevPsPhh1AlqRomCYaqCXrnmgMaHQa23m7Yzfv0gVnvdDv59shL8ciaPl0fqBTqYfKymq33K73Cw6LvwUAOw=='>");
					ajaxGet(guid(),"db/dba",d,function(b) {
						if (b.value == "success") {
							d = {cmd:"select",table:s.table,fields:field,filter:keyfield+"='"+rowdata[keyfield]+"'"};
							ajaxGet(guid(),"db/dba",d,function(b2) {
								dom.dataval = b2.value[0][field];

								var curTr=dom.parentNode;
								curTr.rawdata[field] = dom.dataval; //raw data from db
								curTr.data[field] = dom.dataval; //data for edit

								dom.html((curInp.tagName=="SELECT") ? curInp.options[curInp.selectedIndex].text : dom.dataval);
								if (!ae) curInp.remove();
								updateRow(curTr,col);
								popmsg("update success!");
							});
						} else {
							console.log(" Error: update failure!");
							if (!ae) curInp.remove();
							dom.html(dom.oldhtml);
							popmsg("update failure!");
						}
					});
				} else {
					if (!ae) {
						this.remove();
						dom.html(dom.oldhtml);
					}
				}
			}

			inp.onblur=function() {updateData.apply(this)};
			if (ae) inp.onchange=function() {updateData.apply(this)};
			dom.html("").append(inp);
			if (!ae) inp.focus();
		}

		function rowCheck_onchange() {
			var r = this.parentNode.parentNode;
			if (this.checked) {
				if (!r.hasClass("selected-row")) r.addClass("selected-row");
			} else {
				if (r.hasClass("selected-row")) r.removeClass("selected-row");
			}
		}

		function updateRow(tr,col) {
			dr = tr.rawdata;
			tr.html("");
			buildRow(dr,col,tr);
		}
		function makeRow(dr,col) { //dr = datarow
			var tr = tb.insertRow();
			tr.rawdata = dr; //raw data from db
			tr.data = dr; //data for edit
			buildRow(dr,col,tr);
		}
		function buildRow(dr,col,tr) {
			addRowCheckBox(tr);
			buildCells(dr,col,tr);
			formatRow(tr);
		}
		function buildCells(dr,col,tr) {
			for (var k in dispCols) { //Create Visable Cols
				var curCol = col[k];
				var dt = curCol.datatype;
				var fm = (curCol.hasOwnProperty("format")) ? curCol.format : "";
				td = tr.insertCell();
				td.field = k;
				td.addClass("cell-" + k);

				switch (dt) { //ctltype
					case "string":
					case "text":
					case "datestr":
					case "number":
						td.dataval=dr[k];
						var txt = td.dataval;
						if (curCol.hasOwnProperty("lookup")) {
							if (curCol.lookup.hasOwnProperty("list")) {
								var rv = td.dataval;
								if (curCol.hasOwnProperty("value")) {
									rv = curCol.value;
									for (var kk in dr) rv = rv.replace(new RegExp("{{"+kk+"}}","g"),dr[kk]);
								}
								var list = curCol.lookup.list;
								for (var m=0;m<list.length;m++) {
									if (list[m].value == rv) {
										txt = (curCol.lookup.hasOwnProperty("display")) ? list[m][curCol.lookup.display] : list[m].display;
										break;
									}
								}
							}
						}
						if (fm!="") {
							txt = fm.replace(/{{val}}/g,txt);
							for (var k2 in dr) {
								var reg = new RegExp('{{'+k2+'}}','g');
								txt = txt.replace(reg,dr[k2]);
							}
						}
						if (curCol.hasOwnProperty("calc")) {
							txt = curCol.calc;
							if (typeof td.dataval != "undefined") {
								txt = txt.replace(/{{val}}/g, td.dataval);
							}
							for (var kk in dr) txt = txt.replace(new RegExp("{{"+kk+"}}","g"),dr[kk]);

							try {
								txt = eval(txt);
							} catch(err) {
								txt = "[err]";
							}
						}
						td.html(formatCell(dispCols[k],dr,txt));
					break;
					case "bool":
						td.dataval=dr[k];
						var txt = '<div class="switch-range">';
  						txt += '<input type="range" id="'+k+'" name="'+k+'" min="0" max="1" value="'+td.dataval+'" disabled="true">';
						txt += '</div>';
						td.html(txt);
					break;
					case "json":
					case "filelist":
						var r=(curCol.hasOwnProperty("report")) ? curCol.report : "";
						var c=curCol.cols;
						td.dataval=dr[k];
						td.addClass("text-top");
						var fd = newdom("div");
						fd.data=dr;

						if (isJson(dr[k])) {
							td.dtable=makeTable({data:JSON.parse(dr[k]),cols:c,report:r,form:fd,collapsed:true});
							td.append(td.dtable);
						} else {
							td.html((typeof v != "undefined")? v : "");
						}
					break;
				}

				addEditableFeature(td,curCol,col);
			}
		}
		function addEditableFeature(td,curCol,col) {
			if (curCol.hasOwnProperty("tablectl")) {
				if (curCol.tablectl.hasOwnProperty("editable")) { // Add editable feature
					if (curCol.tablectl.editable == true) {
						td.addClass("editable");
						var ae = (curCol.tablectl.hasOwnProperty("alwaysEdit")) ? curCol.tablectl.alwaysEdit : false;
						if (ae) {
							td.oldhtml = td.html();
							makeInputBox(td, self, col, true);
						} else {
							td.ondblclick=function() {
								this.oldhtml = this.html();
								makeInputBox(this, self, col, false);
							};
						}
					}
				}
			}
		}
		function addRowCheckBox(tr) {
			chk=newdom("input").attr("type","checkbox").addClass("row-chk");
			tr.insertCell().append(chk);
			chk.onchange = function() {rowCheck_onchange.apply(this)};			
		}
		//------
	}
	
	this.init = function() {
		var self = this;
		buildStyles();
		this.loadSrc(function () {
			self.findOptionSrc(s.columns);
			self.getLookup(function() {
				self.findLookupSrc(s.columns);
				if (s.hasOwnProperty("srctype")) {
					if (s.srctype=="db") {
						var d = s;
						d.cmd="select";
						self.getData(d,function(b) {
							s.dom.append(self.renderTable(b.value));							
							if (s.hasOwnProperty("afterLoaded")) s.afterLoaded();//after load
						});
					}
				}
			});
		});
	};
	this.init();
}