Oliker.prototype.mainData={};

Oliker.prototype.start=function(object)
{
	for(var i in object)
		this.mainData[i]=object[i];
	this.checkVk();
	this.checkOlike();
};

Oliker.prototype.checkVk=function()
{
	if(/^https:\/\/oauth\.vk\.com\/blank\.html/.test(location.href))
	{
		var at=location.href.match(/access_token=([^&]+)(&|$)/);
		var ui=location.href.match(/user_id=([^&]+)(&|$)/);
		var se=location.href.match(/secret=([^&]+)(&|$)/);
		if(at && ui)
		{
			if(!('VK' in this.mainData) || !this.mainData.VK)
			{
				var data={access_token:at[1],user_id:ui[1],is_start:false};
				if(se) data['secret']=se[1];
				oliker.storage.chromeSet(false,'VK',data,function()
				{
					oliker.storage.chromeGet(false,null,function(object){
						window.close();
					});
				});
			}
		}
	}
};

Oliker.prototype.checkOlike=function()
{
	if(/#needlogin/.test(location.href))
	{
		var imgs=document.getElementsByTagName('IMG');
		for(var i=0;i<imgs.length;++i)
		{
			if(imgs[i].getAttribute('data-uloginbutton')==='vkontakte')
			{
				imgs[i].click();
				break;
			}
		}
	}
};

var oliker=new Oliker();
oliker.storage.chromeGet(false,null,oliker.start.bind(oliker));