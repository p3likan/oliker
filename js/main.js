var Oliker=function()
{
	this.storage={
		chromeGet:function(isglobal,key,callback,error)
		{
			chrome.storage[isglobal?'sync':'local'].get(key,function(object)
			{
				if(chrome.runtime.lastError)
				{
					console.log('Storage Error: '+chrome.runtime.lastError);
					if(error) error(chrome.runtime.lastError);
				}
				else
				{
					if(object && (!key || (key in object)))
					{
						if(callback) callback(key?object[key]:object);
					}
					else
					{
						OlikerMain.chromeGet(isglobal,key,callback,error);
					}
				}
			});
		},
		chromeSet:function(isglobal,key,value,callback)
		{
			if(!key) return;
			var object={};
			object[key]=value;
			chrome.storage[isglobal?'sync':'local'].set(object,callback);
		},
		chromeRemove:function(isglobal,key,callback)
		{
			chrome.storage[isglobal?'sync':'local'].remove(key,callback);
		}
	};

	this.ajax={
		_getXmlHttp:function() 
		{
			var xmlHttp=false;
			try {xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");} 
			catch(e) {
				try {xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");} 
				catch(E) {xmlHttp=false;}}
			if(!xmlHttp && typeof XMLHttpRequest!=='undefined') xmlHttp=new XMLHttpRequest();
			return xmlHttp;
		},
		send:function(type,link,parameters,headers,callback)
		{
			var xmlhttp=this._getXmlHttp();
			xmlhttp.onreadystatechange=function()
			{
				if(this.readyState===4)
				{
					try
					{
						if(callback) callback(xmlhttp.responseText);
					}
					catch(e)
					{
						console.log(this.status);
						console.log(xmlhttp.responseText);
						console.log(e);
					}
				}
			};
			try
			{
				xmlhttp.open(type||'GET',link,true);
				xmlhttp.setRequestHeader('Content-type','application/x-www-form-urlencoded; charset=UTF-8');
				if(headers)
				{
					for(var i in headers)
					{
						if(headers.hasOwnProperty(i)) xmlhttp.setRequestHeader(i,headers[i]);
					}
				}
				if(parameters)
				{
					if(Array.isArray(parameters)) parameters=parameters.map(encodeURIComponent).join('&');
					else if(typeof parameters!=='string')
					{
						var tmparr=[];
						for(var i in parameters)
						{
							if(parameters.hasOwnProperty(i)) tmparr.push(i+'='+encodeURIComponent(parameters[i]));
						}
						parameters=tmparr.join('&');
					}
					xmlhttp.send(parameters);
				}
				else xmlhttp.send();
			} 
			catch(e)
			{
				console.log(e);
			}
			return xmlhttp;
		}
	};
	
	this.vk={
		get:function(method,parameters,callback)
		{
			var link='https://api.vk.com/method/'+method;
			if(parameters)
			{
				if(Array.isArray(parameters)) parameters=parameters.map(encodeURIComponent).join('&');
				else if(typeof parameters!=='string')
				{
					var tmparr=[];
					for(var i in parameters)
					{
						if(parameters.hasOwnProperty(i)) tmparr.push(i+'='+encodeURIComponent(parameters[i]));
					}
					parameters=tmparr.join('&');
				}
				link+='?'+parameters;
			}
			this.parent.ajax.send('GET',link,null,null,callback);
		},
		subscribe:function(access_token,clubid,captcha_sid,captcha_key,callback)
		{
			var pars={group_id:clubid,access_token:access_token};
			if(captcha_sid)
			{
				pars['captcha_sid']=captcha_sid;
				pars['captcha_key']=captcha_key;
			}
			this.get('groups.join',pars,callback);
		},
		parent:this
	};
	
	this.olike={
		get:function(link,parameters,callback)
		{
			if(link.indexOf('://')<0) link='https://olike.ru/'+link;
			this.parent.ajax.send(parameters?'POST':'GET',link,parameters,null,callback);
		},
		getBalance:function(callback)
		{
			var link='ajax.php?func=balances';
			this.get(link,null,function(content)
			{
				var dataNames=[
					'balance_vk',
					'balance_inst',
					'balance_ytb',
					'balance_fb',
					'balance_ok'
				];
				var out={};
				dataNames&&dataNames.forEach(function(value)
				{
					var r=new RegExp(value+'[^>]*>([^<]*)<');
					var m=content.match(r);
					if(m)
					{
						out[value]=m[1];
						if(out[value]!='') out[value]=parseInt(out[value]);
					}
				});
				if(callback) callback(out);
			});
		},
		getTasks:function(callback)
		{
			var link='ajax.php?func=task&show=vk-followers';
			this.get(link,null,function(content)
			{
				var out=[];
				var result=content.match(/{[^}]+}/g);
				result&&result.forEach(function(value)
				{
					try
					{
						var obj=JSON.parse(value);
						if(obj.type==102)
							out.push(obj);
					}
					catch(e){}
				});
				if(callback) callback(out);
			});
		},
		startTask:function(id,is_repeat,callback)
		{
			if(is_repeat) callback('');
			else
			{
				var link='ajax.php?func=saveClick&id='+id;
				this.get(link,null,callback);
			}
		},
		checkTask:function(id,callback)
		{
			var link='ajax.php?func=checkAction&id='+id;
			this.get(link,null,callback);
		},
		parent:this
	};
};
