
class daome {
	constructor(name, baseURL) {
		this.xhr = typeof XMLHttpRequest != 'undefined'
			? new XMLHttpRequest()
			: new ActiveXObject('Microsoft.XMLHTTP');
			
		this.schema = {};	
		this.name = name;
		this.base = baseURL;
		this.path = baseURL+"/api/"+name;
		
		this.table = null;
		this.tableBody = null;
		this.pageTable = 0;
		this.pageTableElement = 5;
		
	}
	
	remoteGet(feature, cb) {
		var oReq = new XMLHttpRequest();
		var url = this.path+"/"+feature;
		oReq.open("GET", url, true);
		oReq.onreadystatechange = function() {
			if (oReq.readyState == 4) {
				if (oReq.status == 200 || oReq.status == 304) {
					try {
						cb(JSON.parse(oReq.responseText));
					} catch(e) {
						cb(null);
					}
				}
				else
					cb(null);
			}
		};
		oReq.send();
	}
	
	remotePost(feature, args, cb) {
		/* format url encoded */
		var postEncoded = '';
		for(var a in args) {
			if(postEncoded.length > 0)
				postEncoded += "&";
			postEncoded += encodeURIComponent(a)+"="+encodeURIComponent(args[a]);
		}
		
		var oReq = new XMLHttpRequest();
		var url = this.path+"/"+feature;
		oReq.open("POST", url, true);
		
		oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		oReq.setRequestHeader("Content-length", postEncoded.length);
		
		oReq.onreadystatechange = function() {
			if (oReq.readyState == 4) {
				if (oReq.status == 200 || oReq.status == 304) {
					try {
						cb(JSON.parse(oReq.responseText));
					} catch(e) {
						cb(null);
					}
				}
				else
					cb(null);
			}
		};
		oReq.send(postEncoded);
	}
	
	createElement(type, attr) {
		var el = document.createElement(type);
		for(var a in attr)
			el.setAttribute(a, attr[a]);
		return(el);
	}
	
	cleanElement(name) {
		var el = name;
		if(typeof name === "string")
			el = document.getElementById(name);
		while (el.hasChildNodes())
			el.removeChild(el.lastChild);
		return(el);
	}
	
	connect(cb) {
		var self = this;
		this.remoteGet("schema", (data)=> {
			if(!data)
				return;
			self.schema = data;
			
			cb();
		});
	}
	
	views(views) {
		for(var a in views)
			this.schema[a] = views[a];
	}
	
	htmlEntities(str) {
	    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
	
	/*
	 * Standalone form part
	 */
	getFormInput(name) {
		var id = "daome-form-"+this.name+"-"+name;
		return(document.getElementById(id));
	}
	
	generateForm(element) {
		var self = this;
		
		element = this.cleanElement(element);
		
		var form = document.createElement('form');
		
		for(var sName in this.schema) {
			var col = this.schema[sName];
			
			if(col.editable != true)
				continue;
			
			var formGroup = document.createElement('div');
			formGroup.setAttribute("class", "form-group");

			
			var id = "daome-form-"+self.name+"-"+sName;
		
			switch(col.type) {
				case "checkbox":
					formGroup.setAttribute("class", "checkbox");
					if(col.help) {
						var label = document.createElement('label');
						formGroup.appendChild(label);
					}
					
					var input = this.createElement('input', col.attr);
					input.setAttribute("type", col.type);
					input.setAttribute("id", id);
					input.setAttribute("name", sName);
					
					label.appendChild(input);
					label.innerHTML += col.help;
					
					formGroup.appendChild(label);
					
					break;
			
				case "text":
				case "password":
				case "radio":

					if(col.title) {
						var label = document.createElement('label');
						label.innerHTML = col.title;
						formGroup.appendChild(label);
					}
					
					if(col.help) {
						var small = document.createElement('div');
						small.innerHTML = col.help;
						small.setAttribute("class", "form-help");
						formGroup.appendChild(small);
					}
					
					var input = this.createElement('input', col.attr);
					input.setAttribute("type", col.type);
					if(!col.attr || !col.attr.class)
						input.setAttribute("class", "form-control");
					input.setAttribute("name", sName);
					
					
					input.setAttribute("id", id);
					formGroup.appendChild(input);
					
					break;
					
				default:
					break;
			}
		
			form.appendChild(formGroup);
		}
		
		element.appendChild(form);	
	}
	
	formResetInputs() {
		for(var sName in this.schema) {
			var sc = this.schema[sName];
			
			if(sc.editable != true)
				continue;
			
			var id = "daome-form-"+this.name+"-"+sName;
			var el = document.getElementById(id);
			if(!el)
				continue;
			el.disabled = false;
			switch(sc.type) {
				case "checkbox":
					if(sc.model && sc.model.default === true)
						el.checked = true;
					else
						el.checked = false;
					break;
			
				case "text":
				case "password":
				case "radio":
					if(sc.model && sc.model.default)
						el.value = sc.model.default;
					else
						el.value = "";
					break;
					
				default:
					break;
			}
		}
	}
	
	formUpdateInputs(id, view) {
		var self = this;
		this.formResetInputs();
		
		this.remotePost("id", {id: id}, function(data) {
			if(!data) {
				self.modalError("Can not get information");
				return;
			}
			
			if(typeof data.errors === "object" && data.errors.length > 0) {
				for(var a in data.errors)
					self.modalError(data.errors[a]);
				return;
			}

	
			var doc = data.doc;
			
			for(var sName in self.schema) {
				var sc = self.schema[sName];
				
				if(sc.editable != true)
					continue;
				
				var id = "daome-form-"+self.name+"-"+sName;
				var el = document.getElementById(id);
					
				if(view == true)
					el.disabled = true;
				else
					el.disabled = false;
				
				switch(sc.type) {
					case "checkbox":
						if(doc[sName] == true)
							el.checked = true;
						else
							el.checked = false;
						break;
				
					case "text":
					case "password":
					case "radio":
						el.value = doc[sName];
						break;
						
					default:
						break;
				}
			}
		});
	}
	
	formGetValues() {
		var args = {};
		for(var sName in this.schema) {
			var sc = this.schema[sName];
			
			if(sc.editable != true)
				continue;
			
			var id = "daome-form-"+this.name+"-"+sName;
			var el = document.getElementById(id);
			
			switch(sc.type) {
				case "checkbox":
					args[sName] = el.checked ? true : false;
					break;
			
				case "text":
				case "password":
				case "radio":
					args[sName] = el.value;
					break;
					
				default:
					break;
			}
		}
		return(args);
	}
	
	formCreate(vars, cb) {
		this.remotePost("create", vars, cb);
	}

	formUpdate(vars, cb) {
		this.remotePost("update", vars, cb);
	}
	
	formId(id, cb) {
		this.remotePost("id", {id: id}, cb);
	}
	
	formRemove(id, cb) {
		this.remotePost("remove", {id: id}, cb);
	}
	
	/*
	 * Modal related (need jquery + bootstrap)
	 */
	modalCreate(title) {
		var modalId = "daome-modal-"+this.name;
		
		this.modalTitle(title);
		this.modalCleanError();
		this.formResetInputs();
		this.modalButtonCreate();
		
		$('#'+modalId).modal('show');
	}
	
	modalRemove(title, id) {
		var modalId = "daome-modal-"+this.name;
		
		this.modalTitle(title);
		this.modalCleanError();
		this.formUpdateInputs(id, true);
		this.modalButtonRemove(id);
		
		$('#'+modalId).modal('show');
	}
	
	modalUpdate(title, id, view) {
		var modalId = "daome-modal-"+this.name;
		
		this.modalTitle(title);
		this.modalCleanError();
		this.formUpdateInputs(id, view);
		this.modalButtonUpdate(id, view);
		
		$('#'+modalId).modal('show');
	}
	
	modalView(title, id) {
		this.modalUpdate(title, id, true);
	}
	
	modalButtonCreate() {
		var self = this;
		var modalId = "daome-modal-"+this.name;
		var footId = "daome-modal-footer-"+this.name;
		var foot = document.getElementById(footId);
		this.cleanElement(foot);
	
		/* Cancel button */
		var el = this.createElement("button", {
			type: "button",
			"class": "btn btn-secondary"
		});
		el.innerHTML = "Cancel";
		el.onclick = function() {
			$('#'+modalId).modal('hide');
		}
		foot.appendChild(el);
		
		/* Create button */
		el = this.createElement("button", {
			type: "button",
			"class": "btn btn-primary"
		});
		el.innerHTML = "Create";
		el.onclick = function() {
			self.modalCleanError();
			
			/* get all values */
			var args = self.formGetValues();
			
			self.formCreate(args, function(data) {
				if(typeof data.errors === "object" && data.errors.length > 0) {
					for(var a in data.errors)
						self.modalError(data.errors[a]);
					return;
				}
				self.pollingShot = true;
				$('#'+modalId).modal('hide');
				
			});
		}
		foot.appendChild(el);
	}
	
	
	modalButtonUpdate(id, view) {
		var self = this;
		var modalId = "daome-modal-"+this.name;
		var footId = "daome-modal-footer-"+this.name;
		var foot = document.getElementById(footId);
		this.cleanElement(foot);
	
		/* Cancel button */
		var el = this.createElement("button", {
			type: "button",
			"class": "btn btn-secondary"
		});
		if(view == true) {
			el.setAttribute("class", "btn btn-primary");
			el.innerHTML = "Close";
		}
		else {
			el.innerHTML = "Cancel";
		}
		
		el.onclick = function() {
			$('#'+modalId).modal('hide');
		}
		foot.appendChild(el);
		
		/* Create button */
		if(view != true) {
			el = this.createElement("button", {
				type: "button",
				"class": "btn btn-primary"
			});
			el.innerHTML = "Save";
			el.onclick = function() {
				self.modalCleanError();
				
				/* get all values */
				var args = self.formGetValues();
				args.id = id;
				
				self.formUpdate(args, function(data) {
					if(typeof data.errors === "object" && data.errors.length > 0) {
						for(var a in data.errors)
							self.modalError(data.errors[a]);
						return;
					}
					self.pollingShot = true;
					$('#'+modalId).modal('hide');
				});
			}
			foot.appendChild(el);
		}
	}

	modalButtonRemove(id) {
		var self = this;
		var modalId = "daome-modal-"+this.name;
		var footId = "daome-modal-footer-"+this.name;
		var foot = document.getElementById(footId);
		this.cleanElement(foot);
	
		/* Cancel button */
		var el = this.createElement("button", {
			type: "button",
			"class": "btn btn-success"
		});
		el.innerHTML = "Cancel";
		el.onclick = function() {
			$('#'+modalId).modal('hide');
		}
		foot.appendChild(el);
		
		/* Remove button */
		el = this.createElement("button", {
			type: "button",
			"class": "btn btn-danger"
		});
		el.innerHTML = "Delete";
		el.onclick = function() {
			self.modalCleanError();
			self.formRemove(id, function(data) {
				if(typeof data.errors === "object" && data.errors.length > 0) {
					for(var a in data.errors)
						self.modalError(data.errors[a]);
					return;
				}
				self.pollingShot = true;
				$('#'+modalId).modal('hide');
			});
		}
		foot.appendChild(el);
		
	}
	
	modalError(message) {
		var errorId = "daome-modal-error-"+this.name;
		
		var root = this.createElement("div", {
			"class": "alert alert-warning alert-dismissible",
			role: "alert"
		});
		var button = this.createElement("div", {
			type: "button",
			"class": "close",
			"data-dismiss": "alert",
			"aria-label": "Close"
		});
		button.innerHTML = '<span aria-hidden="true">&times;</span>';
		
		root.appendChild(button);
		var dst = document.getElementById(errorId);
		dst.appendChild(root);
		
		root.innerHTML += message;
	}
	
	modalCleanError() {
		var errorId = "daome-modal-error-"+this.name;
		this.cleanElement(errorId);
	}
	
	modalTitle(title) {
		var titleId = "daome-modal-title-"+this.name;
		
		var el = document.getElementById(titleId);
		if(!el)
			return;
		el.innerHTML = title;
	}
	
	generateModal(element) {
		var dst = document.getElementById(element);
		
		var modalId = "daome-modal-"+this.name;
		var formId = "daome-modal-form-"+this.name;
		var titleId = "daome-modal-title-"+this.name;
		var errorId = "daome-modal-error-"+this.name;
		var footId = "daome-modal-footer-"+this.name;

		/* create base elements */
		var modal = this.createElement("div", {
			id: modalId,
			class: "modal fade",
			tabindex: -1,
			role: "dialog"
		});
		var modalDialog = this.createElement("div", {
			class: "modal-dialog",
			role: "document"
		});
		var modalContent = this.createElement("div", {
			class: "modal-content"
		});
		var modalHeader = this.createElement("div", {
			class: "modal-header",
		});
		var modalBody = this.createElement("div", {
			id: formId,
			class: "modal-body"
		});
		var modalFooter = this.createElement("div", {
			id: footId,
			class: "modal-footer"
		});
		
		/* generate modal header */
        var modalHeaderButton = this.createElement("button", {
        	"type": "button",	
			"class": "close",
			"data-dismiss": "modal",
			"aria-label": "Close"
        });
        modalHeaderButton.innerHTML = '<span aria-hidden="true">&times;</span>';
        modalHeader.appendChild(modalHeaderButton);
        
        var modalHeaderTitle = this.createElement("h4", {
        	id: titleId,
			"class": "modal-title"
        });
        modalHeader.appendChild(modalHeaderTitle);
        
		/* append everything */
		modalContent.appendChild(modalHeader);
		modalContent.appendChild(modalBody);
		modalContent.appendChild(modalFooter);
		
		modalDialog.appendChild(modalContent);
		modal.appendChild(modalDialog);
		
		/* clean dst and push new */
		this.cleanElement(dst);
		
		dst.appendChild(modal);
        
		/* generate modal content */
        this.generateForm(formId);
        
        /* once form has generated add notication error div */
		var modalError = this.createElement("div", {
			id: errorId,
			class: "modal-error"
		});
		modalBody.appendChild(modalError);
        
        
		return(modalId);
	}
	

	/*
	 * data table related
	 */
	tableUpdate() {
		this.cleanElement(this.tableBody);
		if(this.pollingData.length == 0)
			return;
		
		/* Pass#1: determine pagination */
		this.pageNumber = Math.floor(this.pollingData.length/this.pageTableElement);
		this.pageNumber += this.pollingData.length%this.pageTableElement ? 1 : 0;
		
		/* check for overflow */
		if(this.pageTable >= this.pageNumber)
			this.pageTable = 0;
		
		/* check for underflow */
		if(this.pageTable < 0)
			this.pageTable = 0;
		
		var dataFrom = this.pageTable*this.pageTableElement;
		var dataTo = (this.pageTable+1)*this.pageTableElement;
		
		if(dataTo > this.pollingData.length)
			dataTo = this.pollingData.length;
		
		/* align pagination if used */
		if(this.pagination) {
			/* prev */
			if(this.pageTable == 0)
				this.pagination.prev.setAttribute("disabled", "disabled");
			else
				this.pagination.prev.removeAttribute("disabled");
			
			/* next */
			if(this.pageTable >= this.pageNumber-1)
				this.pagination.next.setAttribute("disabled", "disabled");
			else
				this.pagination.next.removeAttribute("disabled");
			
			/* current page */
			this.pagination.current.innerHTML = this.pageTable+1;
			
			/* number of elements */
			this.pagination.right.innerHTML = "Elements from "+(dataFrom+1)+" to "+dataTo+" of "+this.pollingData.length+" entries";
			
			/* number of pages */
			this.pagination.pages.innerHTML = this.pageNumber+" pages";
		}
		
		/* Pass#2: rendering data */
		for(var id=dataFrom; id<dataTo; id++) {
			var el = this.pollingData[id];
			
			var tr = document.createElement("tr");
			for(var sid in this.schema) {
				var sc = this.schema[sid];
				
				if(sc && sc.table == true) {
					var th = document.createElement("th");
					
					if(sc.get) {
						var ret = sc.get(id, el, th);
						
						if(typeof ret === "string")
							th.innerHTML = ret;
						else if(typeof ret === "object")
							th.appendChild(ret);
					}
					else
						th.innerHTML = this.htmlEntities(el[sid]);
					
					tr.appendChild(th);
				}
			}
			
			this.tableBody.appendChild(tr);
		}
	}

	generateTable(element) {
		
		var output = document.getElementById(element);
		this.cleanElement(output);
		var self = this;
		
		self.table = document.createElement("table");
		self.table.setAttribute("class", "table");
		
		var thead = document.createElement("thead");
		var tr = document.createElement("tr");
		
		var data = this.schema;
		for(var a in data) {
			var item = data[a];
			if(item.table == true) {
				var th = document.createElement("th");
				if(item.title)
					th.innerHTML = data[a].title;
				tr.appendChild(th);
			}
		}
		
		thead.appendChild(tr);
		self.table.appendChild(thead);
		
		self.tableBody = document.createElement("tbody");
		self.table.appendChild(self.tableBody);
		
		var tfoot = document.createElement("tfoot");
		self.table.appendChild(tfoot);
		
		output.appendChild(self.table);
		
		/* once we have setup the datatable we start the polling */
		if(this.polling)
			clearInterval(this.polling);
		this.polling = null;
		this.pollingData = [];
		this.pollingShot = true;
		this.pollingRequest = false;
		
		function firstShot() {
			if(self.pollingShot == true && self.pollingRequest == false) {
				self.pollingShot = false;
				self.pollingRequest = true;
				
				var args = {};
				
				/* search string */
				if(self.search && self.search.length > 0)
					args.search = self.search;
				
				self.remotePost("search", args, function(data) {
					self.pollingData = data.docs;
					self.pollingRequest = false;
					self.tableUpdate();
				});
			}
			
			if(!self.polling)
				self.polling = setInterval(firstShot, 1000);
		}
		
		firstShot();
	}
	
	/*
	 * Pagination related 
	 */
	generatePagination(element) {
		if(this.pollingData.length == 0)
			return;
		
		var self = this;
		var output = document.getElementById(element);
		this.cleanElement(output);
		this.pagination = {};
		
        var root = this.createElement("div", {
			class: "container-fluid"
        });
        var row = this.createElement("div", {
			class: "row"
        });
        root.appendChild(row);
        
        var col1 = this.createElement("div", {
			class: "col-md-6"
        });
        var col2 = this.createElement("div", {
			class: "col-md-6 text-right"
        });
        row.appendChild(col1);
        row.appendChild(col2);
        
        /* col2 */
        var p = this.createElement("div", {
        	class: "btn btn-sm disabled"
        });
        col2.appendChild(p);
        self.pagination.right = p;
        
        /* col1 */
        var table = this.createElement("table", {});
        col1.appendChild(table);
        
        var tr = this.createElement("tr", {});
        table.appendChild(tr);

        function genButton(side) {
            var a = self.createElement("a", {
            	class: "btn btn-sm",
            	disabled: "disabled",
            	href: "#",
            	title: ""
            });
            var i = self.createElement("i", {
            	class: "glyphicon "+side
            });
            a.appendChild(i);
            return(a);
        }
        
        /* prev */
        var th = this.createElement("th", {});
        var a = genButton("glyphicon-chevron-left");
        a.onclick = function(e) {
        	self.pageTable--;
        	self.tableUpdate();
        	e.preventDefault();
        }
        th.appendChild(a);
        tr.appendChild(th);
        self.pagination.prev = a;
        
        /* current number */
        th = this.createElement("th", {});
        p = this.createElement("div", {
        	class: "btn btn-sm disabled",
        	role: "button"
        });
        th.appendChild(p);
        tr.appendChild(th);
        self.pagination.current = p;
        
        /* next */
        th = this.createElement("th", {});
        var a = genButton("glyphicon-chevron-right");
        a.onclick = function(e) {
        	self.pageTable++;
        	self.tableUpdate();
        	e.preventDefault();
        }
        th.appendChild(a);
        tr.appendChild(th);
        self.pagination.next = a;
        
        /* current pages */
        th = this.createElement("th", {});
        p = this.createElement("div", {
        	class: "btn btn-sm disabled",
        	role: "button"
        });
        th.appendChild(p);
        tr.appendChild(th);
        self.pagination.pages = p;
        
        
        output.appendChild(root);
        
	}
	
	pageChange(page) {
    	this.pageTable = page;
    	this.tableUpdate();
	}
	
	/*
	 * search related
	 */
	generateSearch(element) {
		var self = this;
		var output = document.getElementById(element);
		this.cleanElement(output);

        var input = this.createElement("input", {
        	type: "text",
			class: "form-control search",
			placeholder: "Search ..." 
        });
        input.addEventListener('input', function() {
        	self.search = input.value;
        	self.pollingShot = true;
		});
        
        output.appendChild(input);

	}
}




