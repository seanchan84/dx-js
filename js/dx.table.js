function tableToJson(t) {
	var rs = t.getdom("tbody")[0].rows;
	if (!t.hasOwnProperty("structure")) t.structure = "array";
	switch (t.structure) {
		case "object":
			var json={};
			for (var i=0;i<rs.length;i++) {
				var  vn = rs[i].cells[0].dataval, vc = rs[i].cells[1];
				json[vn] = (vc.getdom("table").length>0) ? tableToJson(vc.getdom("table")[0]) : vc.dataval;
			}
			return json;
		break;
		case "array":
			var json=[], cols=[], cs = t.getdom("thead")[0].getdom("tr")[0];
			for (var i=0;i<cs.cells.length;i++) cols.push(cs.cells[i].dataval);
			function rowToJson(tr) {
				var jtr={},n=0,c;
				for (var i=0;i<cols.length;i++) {
					c = tr.cells[i];
					jtr[cols[i]] = (c.getdom("table").length>0) ? tableToJson(c.getdom("table")[0]) : c.dataval;
					n++;
					if (n>=tr.cells.length) break;
				}
				return jtr;
			}
			for (var i=0;i<rs.length;i++) json.push(rowToJson(rs[i]));
			return json;
		break;
	}
}

//Add Style
addStyle(".dx-table-ctr {position:relative;}");
addStyle(".dx-report {position:relative;padding:5px;}");
addStyle(".dx-btn-coll {border-radius: 5px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;z-index:9;position:absolute;width:20px;height:20px;top:0px;background-color:#CCC;font-size:20px;line-height:20px;text-align:center;font-weight:600;cursor:pointer;}");
addStyle(".dx-btn-coll:hover {background-color:#999;}");
addStyle(".dx-table {width:100%;}");
addStyle(".table-menu {padding-left:20px;}");
addStyle(".dx-table td {height:34px;text-overflow:ellipsis;white-space:nowrap;}");
addStyle(".dx-table thead td {font-weight:600;}");
addStyle(".dx-table thead td {background-color:#6cf;}");
addStyle(".dx-table .valname {background-color:#ddd;}");
addStyle(".dx-table thead td .inp {width:95%;}");
addStyle(".dx-table thead td textarea {height:100px;}");
addStyle(".dx-table tbody tr:hover {background-color:#EEE;}");
addStyle(".dx-table tbody tr.sel {background-color:#FF9;}");
addStyle(".menu-btn {background-repeat: no-repeat;background-position: center;height:30px;min-width:30px;margin-right:2px;display:inline-block;cursor:pointer;}");
addStyle(".btn-addrow {background-image:url(images/icons/add.png);}");
addStyle(".btn-delrow {background-image:url(images/icons/del.png);}");
addStyle(".menu-btn:hover {background-color:#CCC;}");
addStyle(".text-top {vertical-align:top;}");

function makeTable(p) {
	var j = (p.hasOwnProperty("data")) ? p.data : "";
	var editable = (p.hasOwnProperty("editable")) ? p.editable : false;
	var alwaysEdit = (p.hasOwnProperty("alwaysEdit")) ? p.alwaysEdit : false;
	var menuOn = (p.hasOwnProperty("menuOn")) ? p.menuOn : true;
	var addRowOn = (p.hasOwnProperty("addRowOn")) ? p.addRowOn : true;
	var delRowOn = (p.hasOwnProperty("delRowOn")) ? p.delRowOn : true;
	var addFieldOn = (p.hasOwnProperty("addFieldOn")) ? p.addFieldOn : true;
	var reportOn = (p.hasOwnProperty("reportOn")) ? p.reportOn : true;
	var collapsed = (p.hasOwnProperty("collapsed")) ? p.collapsed : false;

	var form = (p.hasOwnProperty("form")) ? p.form : "";
	var onchangeEvent = (p.hasOwnProperty("onchange")) ? p.onchange : function() {};
	var cols = (p.hasOwnProperty("cols")) ? p.cols : {};

	var rep = (p.hasOwnProperty("report")) ? p.report : {};

	var ctr=newdom("div").addClass("dx-table-ctr"), t=newdom("table").addClass("dx-table"), tb=newdom("tbody"), th = t.createTHead(), thr = th.insertRow();
	var td, tr, menu=newdom("div");

	var btnAddField=newdom("div").addClass("menu-btn").html("+field");
	var btnAddRow=newdom("div").addClass("menu-btn").addClass("btn-addrow");
	var btnDelRow=newdom("div").addClass("menu-btn").addClass("btn-delrow");
	var report = newdom("div").addClass("dx-report");
	var collBtn = newdom("div").addClass("dx-btn-coll").html((collapsed) ? "+" : "-");
	collBtn.title="open table";
	
	t.style.display = (collapsed) ? "none" : "";

	collBtn.ctlTable = t;

	collBtn.onclick = function() {
		this.html((this.html()=="-") ? "+" : "-");
		if ((this.html()=="-")) {
			collBtn.ctlTable.style.display="";
		} else {
			collBtn.ctlTable.style.display="none";
		}
	};
	ctr.append(collBtn);

	th.append(thr);
	t.form = form;
	t.report = newdom("div").addClass("dx-report");
	t.append(tb);
	if (addFieldOn) menu.addClass("table-menu").append(btnAddField);
	if (editable && menuOn) ctr.append(menu);
	if (reportOn) ctr.append(t.report);
	ctr.append(t);

	function genReport() { //report
		var reptxt="", fs=rep.data, fnLst=["sum"], vals={};
		ctr.reportVals={};

		function sum(t,f) { //Collect and Sum all the td which the fieldname = f
			var v=0, tds=[];
			tds = t.getdom("td");
			for (var i=0;i<tds.length;i++) {
				if (tds[i].hasOwnProperty("fieldname")) {
					if (tds[i].fieldname==f) {
						if ((typeof tds[i].dataval == "string") || (!isNaN(tds[i].dataval))) {
							if (getNumber(tds[i].dataval)!="") v+=getNumber(tds[i].dataval);
						}
					}
				}
			}
			return round(v);
		}

		for (var k in fs) {
			var calc = (fs[k].hasOwnProperty("calc")) ? fs[k].calc : "", v = calc;
			if (v != "") {
				for (var i=0;i<fnLst.length;i++) {
					switch (fnLst[i]) {
						case "sum":
							for (m in cols) {
								if (v.indexOf("{{sum_"+m+"}}")>=0) {
									v = v.replace(new RegExp("{{sum_"+m+"}}","g"),sum(t,m));
								}
							}
						break;
					}
				}
			}
			v = eval(v);

			ctr.reportVals[k] = v;

			var format = (fs[k].hasOwnProperty("format")) ? fs[k].format : "", fm=format;
			fm = fm.replace(/{{val}}/g,v);
			if (fm!="") {
				for (var k2 in vals) fm = fm.replace("{{"+k2+"}}",vals[k2]);
				if (form!="") {
					var vs = form.data;
					for (var k2 in vs) {
						var fv = (form.getdom("#"+k2) != null) ? form.getdom("#"+k2).value :vs[k2];
						var reg = new RegExp('{{form.'+k2+'}}','g');
						fm = fm.replace(reg,fv);
					}
				}
			}
			vals[k] = fm;
		}

		reptxt = (rep.hasOwnProperty("layout")) ? rep.layout : "";
		if (reptxt!="") {
			for (var k in vals) reptxt = reptxt.replace("{{"+k+"}}",vals[k]);
		}
		t.report.html(reptxt);
	}
	function tdEdit() {
		if (!this.editOn) {
			var td = this;
			this.editOn = true;
			if (!(this.getdom("table").length>0)) {
				var list=[];
				if (Object.keys(cols).length>0) {
					if (this.hasOwnProperty("fieldname")) list=(cols[this.fieldname].hasOwnProperty("lookup")) ? cols[this.fieldname].lookup.list : [];
				}
				if (list.length>0) {
					var inp = newdom("select").addClass("inp");
					this.html("").append(inp);
					inp.style.width=inp.parentNode.offsetWidth+"px";
					for (var i=0;i<list.length;i++) inp.append(newdom("option").val(list[i].value).html(list[i].display));
					inp.value = this.dataval;
					inp.focus();
					inp.onchange = function() {
						td.dataval = this.value;
						td.tmp = td.dataval;
						onchangeEvent();
						td.doCalc();
						genReport();
					}
					inp.onblur = function() {
						if (!alwaysEdit) {
							td.html((this.selectedIndex>=0) ? this.options[this.selectedIndex].text : "(No Value)");
							inp.remove();
						}
						td.editOn = false;
					};
				} else {
					var inp, fn;
					if (this.hasOwnProperty("fieldname")) {
						fn = this.fieldname;
						if (!cols[fn].hasOwnProperty("ctl")) {
							switch (td.datatype) {
								case "email": 	inp = newdom("input").attr("type","email");break;
								case "number":	inp = newdom("input").attr("type","number");break;
								case "text":	inp = newdom("input").attr("type","text");break;
								case "datestr":	inp = newdom("input").attr("type","date");break;
								case "string":
								default: 		inp = newdom("textarea");break;
							}
							inp.addClass("inp").val((td.datatype!="number") ? this.dataval : getNumber(this.dataval));

							var inpWidth=100;
							var addWidth=20;
							switch (inp.type) {
								case "email": 	addWidth = 0;break;
								case "number":	addWidth = 10;break;
								case "text":	addWidth = 0;break;
								case "date":	addWidth = 0;break;
								default: addWidth = 20;break;
							}
							inpWidth = (this.getBoundingClientRect().width-4)+addWidth; //Get the current TD width for the inp

							this.html("").append(inp);
							inp.style.width=inpWidth+"px";
							inp.focus();
							inp.onblur = function() {
								td.dataval = (td.datatype == "number") ? this.value.replace(",","") : this.value;
								td.tmp = td.dataval;
								onchangeEvent();
								td.runCalc().lookup().formating();
								if (!alwaysEdit) inp.remove();
								td.editOn = false;
								td.doCalc();
								genReport();
							};
						} else {							
							switch (cols[fn].ctl.type) {
								case "select": //Create Options for selectboxes
									var inp = newdom("select").addClass("inp");
									this.html("").append(inp);
									if (cols[fn].ctl.hasOwnProperty("options")) {
										var opts = cols[fn].ctl.options;
										for (var i=0;i<opts.length;i++) inp.append(newdom("option").val(opts[i].value).html(opts[i].text));
									} else if (cols[fn].ctl.hasOwnProperty("src")) {
										console.log("src");
									}
									inp.value = this.dataval;
									inp.focus();
									inp.onchange = function() {
										td.dataval = this.value;
										td.tmp = td.dataval;
										onchangeEvent();
										td.doCalc();
										genReport();
									}
									inp.onblur = function() {
										if (!alwaysEdit) {
											td.html((this.selectedIndex>=0) ? this.options[this.selectedIndex].text : "(No Value)");
											inp.remove();
										}
										td.editOn = false;
									};
								break;
							}
						}
					}
				}				
			}
		}
	}
	function createHeaders() { //Make Headers
		if (editable) {
			td = thr.insertCell();
			var chk = newdom("input").attr("type","checkbox").addClass("chk-all");
			chk.onchange = function() {
				var rs = tb.getdom(".chk-row");
				for (var i=0;i<rs.length;i++) {
					rs[i].checked = this.checked;
					rs[i].onchange();
				}
			};
			td.append(chk);
		}
		for (var k in cols) {//j[0]
			td = thr.insertCell();
			td.html((cols[k].hasOwnProperty("title")) ? cols[k].title : k);
			td.table=t;
			td.row=thr;
			td.field=cols[k];
			td.fieldname=k;
			td.dataval=k;
			td.tmp = td.dataval;
			/*if (editable) {
				if (!alwaysEdit) {
					td.ondblclick = function() {tdEdit.apply(this)};
				} else {
					tdEdit.apply(td);
				}
			}*/
		}
	}
	function createRow(currow) {
		tr = tb.insertRow(); //Create Row
		if (editable) {
			td = tr.insertCell();
			var chk = newdom("input").attr("type","checkbox").addClass("chk-row");
			chk.onchange = function() {
				var ptr = this.parentNode.parentNode;
				if (this.checked) {
					if (!ptr.hasClass("sel")) ptr.addClass("sel");
				} else {
					if (ptr.hasClass("sel")) ptr.removeClass("sel");
				}
			};
			td.append(chk);
		}

		for (var k in cols) { //Create Cells
			td = tr.insertCell();
			td.table=t;
			td.row=tr;
			td.field=cols[k];
			td.datatype = (cols[k].hasOwnProperty("datatype")) ? cols[k].datatype : "text";
			td.fieldname=k;
			td.editOn = false;
			td.dataval = (currow.hasOwnProperty(k)) ? currow[k] : "";
			td.tmp = td.dataval;
			td.doCalc = function() {};

			function isSelect(td) {
				if (td.field.hasOwnProperty("lookup")) return true;
				if (td.field.hasOwnProperty("ctl")) {
					if (td.field.ctl.hasOwnProperty("type")) return (td.field.ctl.type=="select");
				}
				return false;
			}
			function getCtlSelect(td) {
				var sel = [];
				var cf = td.field;
				if ((cf.hasOwnProperty("lookup"))) {
						sel = cf.lookup.list;
				} else if ((cf.hasOwnProperty("ctl"))) {
					if (cf.ctl.hasOwnProperty("type")) {
						if (cf.ctl.type=="select") {
							sel = cf.ctl.options;
						}
					}
				}
				return sel;
			}

			function getCellCtl(r, f) {	
				for (var i=0;i<r.length;i++) {
					if (r[i].hasOwnProperty("fieldname")) {
						if (r[i].fieldname == f) {
							return r[i];
							break;
						}
					}
				}
				return false;
			}

			if (!(typeof currow[k] == "object")) {
				if (cols.hasOwnProperty(k)) {
					td.runCalc = function() {
						if (this.field.hasOwnProperty("calc")) {
							var cc = this.field.calc;
							if (cc!="") { //if need calc
								var curTd = this;
								var rcs = curTd.row.cells;
								function replaceCalcTxt(cc) {
									var res = cc.replace(new RegExp("{{[^{^{]+}}","g"),function(m) {
										var df = m.substring(2, m.length - 2);
										if (df=="val") {
											return (typeof curTd.tmp!="undefined") ? curTd.tmp : "";
										} else {
											var es = df.split("."), curCtl, hasCtl=false, rv=m;
											switch (es[0]) {
												case "row": curCtl = getCellCtl(rcs,es[1]); break;
												case "form": curCtl = getdom("#" + es[1]); break;
												default: curCtl = getCellCtl(rcs,es[0]); break;
											}
											hasCtl = ((curCtl == false) || (curCtl == null)) ? false : true;
											if (!hasCtl) return rv;
											switch (es[0]) {
												case "row": // Current Row Value
													var ele = (es.length>=3) ? es[2] : "display";
													if (isSelect(curCtl)) {
														var sel = getCtlSelect(curCtl);
														for (var i=0;i<sel.length;i++) {
															if (curCtl.dataval==sel[i].value) {
																rv = sel[i][ele];
																break;
															}
														}
													} else {
														rv = curCtl.dataval;
													}
												break;
												case "form": rv = getdom("#"+es[1]).val(); break;
												default: rv = getdom("#"+es[0]).val(); break;
											}
											if (hasCtl) {
												var oCalc = curCtl.doCalc;
												curCtl.doCalc = function() {
													oCalc();
													curTd.runCalc().lookup().formating();
												};
											}
											return rv;
										}
										return rv;
									});
									return res;
								}
								try {
									this.tmp = eval(replaceCalcTxt(cc));
								} catch(e) {
									console.log("err:"+replaceCalcTxt(cc));
								}
							}
						}
						return this;
					};
					td.lookup=function() {
						if (this.field.hasOwnProperty("lookup")) {
							if (this.field.lookup.hasOwnProperty("list")) {
								var list = this.field.lookup.list;
								for (var m=0;m<list.length;m++) {
									if (list[m].value == this.tmp) {
										this.html(list[m].display);
										break;
									}
								}
							}
						} else if (this.field.hasOwnProperty("ctl")) {
							if (this.field.ctl.hasOwnProperty("type")) {
								if (this.field.ctl.type=="select") {
									if (this.field.ctl.hasOwnProperty("options")) {
										var opts = this.field.ctl.options;
										for (var m=0;m<opts.length;m++) {
											if (opts[m].value == this.tmp) {
												this.html(opts[m].text);
												break;
											}
										}
									}
								}
							}
						}
						this.dataval = this.tmp; //Upadate Dataval
						return this;
					};
					td.formating=function() {
						if (isSelect(this)) return this;
						var txt=this.dataval;
						if (this.field.hasOwnProperty("format")) {
							txt = this.field.format.replace(/{{val}}/g,txt);
							for (var k2 in cols) {
								var reg = new RegExp('{{'+k2+'}}','g');
								txt = txt.replace(reg,(currow.hasOwnProperty(k2)) ? currow[k2] : "");
							}

							if (form!="") {
								var vs = form.data;
								for (var k2 in vs) {
									if (txt.indexOf('{{form.'+k2+'}}')>=0) {
										var fv = (getdom("#"+k2)) ? getdom("#"+k2).value :vs[k2];
										var reg = new RegExp('{{form.'+k2+'}}','g');
										txt = txt.replace(reg,fv);
									}
								}
							}
						}
						this.html(txt);
						return this;
					};
					td.runCalc().lookup().formating();
				} else {
					td.html(td.dataval);
				}
				if (editable) {
					if (!alwaysEdit) {
						td.ondblclick = function() {tdEdit.apply(this)};
						td.addEventListener('touchstart', function() {this.ondblclick();});
					} else {
						tdEdit.apply(td);
					}
				}
			} else {
				td.append(makeTable({data:(currow.hasOwnProperty(k)) ? currow[k] : "", cols:cols, editable:editable, onchange:onchangeEvent}));
			}
		}
	}
	function bindFormCtls() {
		var cs = form.columns, cs2={};
		for (var k in cs) {
			if ((cs[k].datatype=="json") || (cs[k].datatype=="filelist")) {
				cs2 = cs[k].cols;
				for (var k2 in cs2) {
					for (var k3 in cs2[k2]) {
						switch (k3) {
							case "calc":
							case "format":
								for (var k4 in cs) {
									if (form.getdom("#"+k4) != null) {
										if (!form.getdom("#"+k4).hasOwnProperty("affectedCtls")) form.getdom("#"+k4).affectedCtls={};
										if (cs2[k2][k3].indexOf("{{form."+k4+"}}")>=0) {
											form.getdom("#"+k4).affectedCtls[k]="";
											form.getdom("#"+k4).onchange=function() {
												for (var k in this.affectedCtls) {
													switch (cs[k].datatype) {
														case "json":
														case "filelist":
															form.getdom("#"+k).render();
														break;
													}
												}
											};
										}
									}
								}
							break;
						}
					}
				}
			}
		}
	}

	if (Array.isArray(j)) {
		t.structure = "array";
		createHeaders();
		for (var i=0;i<j.length;i++) createRow(j[i]); //Fetch Rows
		if (reportOn) genReport();

		//btn
		btnAddField.onclick=function() {
			td = thr.insertCell().html("[field]");
			td.table=t;
			td.row=thr;
			td.dataval="";
			for (var i=0;i<tb.rows.length;i++) {
				td = tb.rows[i].insertCell().html("");
				td.dataval="";
				if (editable) {
					if (!alwaysEdit) {
						td.ondblclick = function() {tdEdit.apply(this)};
						td.addEventListener('touchstart', function() {this.ondblclick();});
					} else {
						tdEdit.apply(td);
					}
				}
			}
		};
		btnAddRow.onclick=function() {
			var newrow={};
			for (var k in j[0]) newrow[k] = "";
			createRow(newrow);
		};
		btnDelRow.onclick=function() {
			var rs = tb.getdom(".sel");
			if (rs.length>0) {
				if (confirm("刪除選取的資料欄?")) {
					for (var i=0;i<rs.length;i++) rs[i].remove();
					onchangeEvent();
				}
			}
		};
		if (addRowOn) menu.addClass("table-menu").append(btnAddRow);
		if (delRowOn) menu.addClass("table-menu").append(btnDelRow);
		
		//=====

		bindFormCtls();
		return ctr;
	} else if (typeof j == "object") {
		t.structure = "object";
		thr.insertCell().html("name"); //Make Header
		thr.insertCell().html("value"); //Make Header
		for (var k in j) { //Fetch Rows
			tr = tb.insertRow(); //Create Row
			td = tr.insertCell().html(k).addClass("valname"); //Make Header
			td.table=t;
			td.row=tr;
			td.dataval=k;

			if (editable) {
				if (!alwaysEdit) {
					td.ondblclick = function() {tdEdit.apply(this)};
					td.addEventListener('touchstart', function() {this.ondblclick();});
				} else {
					tdEdit.apply(td);
				}
			}
			td = tr.insertCell(); //Create a Cell
			td.table=t;
			td.row=tr;
			td.fieldname=k;
			td.editOn = false;
			td.dataval = j[k];
			if (typeof j[k] === "string") { // If context is Text Value
				td.html(""+td.dataval+"");
				if (editable) {
					if (!alwaysEdit) {
						td.ondblclick = function() {tdEdit.apply(this)};
						td.addEventListener('touchstart', function() {this.ondblclick();});
					} else {
						tdEdit.apply(td);
					}
				}
			} else if (typeof j[k] == "object") { // If context is Json Data
				td.append(makeTable({data:j[k], cols:cols, editable:editable, onchange:onchangeEvent}));
			} else if (Array.isArray(j[k])) { // If context is Array
				td.append(makeTable({data:j[k], cols:cols, editable:editable, onchange:onchangeEvent}));
			}
		}

		//btn
		btnAddField.onclick = function() {
			var tr = tb.insertRow();
			var td = tr.insertCell().html("[field]").addClass("valname");
			td.table=t;
			td.row=tr;
			td.dataval="";
			if (editable) {
				td.ondblclick = function() {tdEdit.apply(this)};
				td.addEventListener('touchstart', function() {this.ondblclick();});
			}
			td = tr.insertCell().html("");
			td.table=t;
			td.dataval="";
			if (editable) {
				td.ondblclick = function() {tdEdit.apply(this)};
				td.addEventListener('touchstart', function() {this.ondblclick();});
			}
		}
		//=====
		return ctr;
	}
}