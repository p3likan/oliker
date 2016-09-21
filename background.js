chrome.runtime.onMessage.addListener(function(request,sender,sendResponse) 
{
	if('action' in request)
	{
		if(oliker[request.action]()===false)
		{
			sendResponse('error');
			return true;
		}
	}
	sendResponse('ok');
	return true;
});

Oliker.prototype.startVk=function(notset)
{
	if(!('VK' in this.mainData) || !this.mainData.VK)
	{
		this.storage.chromeGet(false,null,this.start.bind(this));
		return false;
	}
	if(!notset) this.mainData.VK.is_start=true;
	this.storage.chromeGet(false,null,(function(object)
	{
		for(var i in object)
			this.mainData[i]=object[i];
		if(('VK' in this.mainData) && this.mainData.VK.is_start) 
			this.timeout=setTimeout(this.workVk.bind(this),30000*Math.random()+60000);
	}).bind(this));
};

Oliker.prototype.stopVk=function(save)
{
	this.mainData.VK.is_start=false;
	if(this.timeout)
	{
		clearTimeout(this.timeout);
		this.timeout=false;
	}
	if(save) this.storage.chromeSet(false,'VK',this.mainData.VK);
};

Oliker.prototype.workVk=function()
{
	if(!this.mainData.VK.is_start) return;
	if(this.tasks.length<=0)
	{
		this.olike.getTasks((function(tasks)
		{
			this.tasks=tasks;
			this.workVk();
		}).bind(this));
		return;
	}
	var task;
	var is_captcha=(('captcha' in this.mainData.VK) && this.mainData.VK.captcha);
	if(is_captcha) task=this.mainData.VK.captcha.task;
	else task=this.tasks.pop();
	if(task)
	{
		if(is_captcha && !('captcha_key' in this.mainData.VK.captcha))
		{
			console.log(this.mainData.VK.captcha);
			return;
		}
		this.olike.startTask(task.id,is_captcha,(function(content)
		{
			var resp={};
			try
			{
				var resp=JSON.parse(content);
			}
			catch(e)
			{
			}
			if(('status' in resp) && resp.status=='error')
			{
				this.startVk(true);
				return;
			}
			var captcha_sid='';
			var captcha_key='';
			if(is_captcha)
			{
				captcha_sid=this.mainData.VK.captcha.captcha_sid;
				captcha_key=this.mainData.VK.captcha.captcha_key;
				console.log(this.mainData.VK.captcha);
				delete this.mainData.VK.captcha;
				this.storage.chromeSet(false,'VK',this.mainData.VK);
				console.log('captcha_key:'+captcha_key);
			}
			this.vk.subscribe(this.mainData.VK.access_token,task.url_id,captcha_sid,captcha_key,(function(content)
			{
				try
				{
					var resp=JSON.parse(content);
					if(resp.response==1)
					{
						this.olike.checkTask(task.id,(function(status)
						{
							console.log(status);
							if(status>0 || status==-4 || status==-7 || status==-2)
								this.startVk(true);
							else
								this.stopVk(true);
						}).bind(this));
					}
					else if(('error' in resp)&&(resp.error.error_code==14))
					{
						console.log(resp);
						this.mainData.VK['captcha']={task:task,captcha_sid:resp.error.captcha_sid,captcha_img:resp.error.captcha_img};
						this.storage.chromeSet(false,'VK',this.mainData.VK);
						var myAudio=new Audio(); 
						myAudio.src="alarm.mp3";
						myAudio.play(); 
					}
					else
					{
						console.log(resp);
						this.stopVk(true);
					}
				}
				catch(e){console.log(content);}
			}).bind(this));
		}).bind(this));
	}
};

Oliker.prototype.mainData={};
Oliker.prototype.tasks=[];

Oliker.prototype.timeout=false;

Oliker.prototype.start=function(object)
{
	for(var i in object)
		this.mainData[i]=object[i];
	if(('VK' in this.mainData) && this.mainData.VK)
		this.startVk(true);
};

var oliker=new Oliker();
oliker.storage.chromeGet(false,null,oliker.start.bind(oliker));