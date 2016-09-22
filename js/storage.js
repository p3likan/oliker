var Storage={
	get:function(key,callback,error,isglobal)
	{
		chrome.storage[isglobal?'sync':'local'].get(key,(function(object)
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
					this.get(key,callback,error,isglobal);
				}
			}
		}).bind(this));
	},
	set:function(key,value,callback,isglobal)
	{
		if(!key) return;
		var object={};
		object[key]=value;
		chrome.storage[isglobal?'sync':'local'].set(object,callback);
	},
	remove:function(key,callback,isglobal)
	{
		chrome.storage[isglobal?'sync':'local'].remove(key,callback);
	}
};