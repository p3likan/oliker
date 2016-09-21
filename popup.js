Oliker.prototype.mainData={};

Oliker.prototype.start=function(object)
{
	for(var i in object)
		this.mainData[i]=object[i];
	this.loadOlike('balance');
	this.loadVk('vk');
};

Oliker.prototype.loadVk=function(id)
{
	var dom=document.getElementById(id);
	if(!dom) return;
	var s=document.createElement('DIV');
	s.className='subheader';
	s.innerText='Аккаунт Вконтакте';
	dom.appendChild(s);
	if(('VK' in this.mainData) && this.mainData.VK)
	{
		this.vk.get('users.get',{access_token:this.mainData.VK.access_token,fields:'photo_50,id,first_name,last_name,domain'},(function(content)
		{
			var isallright=false;
			try
			{
				var json=JSON.parse(content);
				if('response' in json)
				{
					isallright=true;
					var user=json.response[0];
					if(('deactivated' in user) && (user.deactivated=='deleted' || user.deactivated=='banned'))
					{
						var txt=document.createElement('A');
						txt.innerText=user.deactivated=='deleted'?'Пользователь удален':'Пользователь забанен';
						txt.className='vk_attension';
						if('domain' in user)
						{
							txt.href='https://vk.com/'+user.domain;
							txt.onclick=function(){chrome.tabs.create({url:this.href});};
						}
						dom.appendChild(txt);
					}
					else
					{
						var img=document.createElement('IMG');
						img.src=user.photo_50;
						dom.appendChild(img);
						var name=document.createElement('A');
						name.href='https://vk.com/'+user.domain;
						name.innerText=user.first_name+' '+user.last_name;
						name.className='vk_name';
						name.onclick=function(){chrome.tabs.create({url:this.href});};
						dom.appendChild(name);
					}
					var wrapLowButtons=document.createElement('DIV');
					wrapLowButtons.className='wrap';
					dom.appendChild(wrapLowButtons);
					var startButton=document.createElement('A');
					startButton.innerText=this.mainData.VK.is_start?'Стоп':'Старт';
					startButton.className='vk_name inline';
					startButton.onclick=(function(){this.mainData.VK.is_start?this.stopVk():this.startVk();}).bind(this);
					wrapLowButtons.appendChild(startButton);
					this.startButton=startButton;
					var closeButton=document.createElement('A');
					closeButton.innerText='Выйти';
					closeButton.className='vk_name inline';
					closeButton.onclick=(function(){this.dropVk();}).bind(this);
					wrapLowButtons.appendChild(closeButton);
					var is_captcha=(('captcha' in this.mainData.VK) && this.mainData.VK.captcha && !('captcha_key' in this.mainData.VK.captcha));
					if(is_captcha)
					{
						var div=document.createElement('DIV');
						div.id='captchablock';
						dom.appendChild(div);
						var img=document.createElement('IMG');
						img.src=this.mainData.VK.captcha.captcha_img;
						div.appendChild(img);
						var input=document.createElement('INPUT');
						input.id='captcha_key';
						div.appendChild(input);
						var button=document.createElement('BUTTON');
						button.onclick=(function()
						{
							var inp=document.getElementById('captcha_key');
							if(!inp) return;
							this.mainData.VK.captcha['captcha_key']=inp.value;
							console.log(inp.value);
							var div=document.getElementById('captchablock');
							div.remove();
							this.startVk();
						}).bind(this);
						button.innerText='Отправить';
						div.appendChild(button);
					}
					else if('captcha' in this.mainData.VK) console.log(this.mainData.VK.captcha);
				}
				else console.log(json);
			}
			catch(e)
			{
				console.log(e);
			}
			if(!isallright) this.dropVk();
		}).bind(this));
	}
	else
	{
		var e=document.createElement('A');
		e.className='vk_button';
		e.innerText='АВТОРИЗАЦИЯ';
		e.href='https://oauth.vk.com/authorize?client_id=5456414&display=page&redirect_uri=https%3A%2F%2Foauth.vk.com%2Fblank.html&scope=groups,wall,offline,messages&response_type=token&v=5.52';
		e.onclick=function(){chrome.tabs.create({url:this.href});};
		dom.appendChild(e);
	}
};

Oliker.prototype.loadOlike=function(id)
{
	//https://olike.ru/ajax.php?func=task&show=vk-followers
	var dom=document.getElementById(id);
	if(!dom) return;
	var s=document.createElement('DIV');
	s.className='subheader';
	s.innerText='Olike';
	s.onclick=function(){chrome.tabs.create({url:'https://olike.ru/'});};
	dom.appendChild(s);
	this.olike.getBalance((function(balance)
	{
		if(balance.balance_vk==='')
		{
			if(('VK' in this.mainData) && this.mainData.VK)
			{
				var s=document.createElement('DIV');
				s.innerText='Авторизация';
				s.className='olike_auth';
				dom.appendChild(s);
				chrome.tabs.create({url:'https://olike.ru/#needlogin'});
			}
			else
			{
				var s=document.createElement('DIV');
				s.innerText='Авторизация невозможна, добавьте ВК.';
				s.className='olike_attension';
				dom.appendChild(s);
			}
		}
		else
		{
			var place=document.createElement('DIV');
			place.className='olike_balance_place';
			dom.appendChild(place);
			for(var i in balance)
			{
				var s=document.createElement('SPAN');
				s.className='olike_balance '+i;
				place.appendChild(s);
				var img=document.createElement('SPAN');
				img.className='img';
				s.appendChild(img);
				var txt=document.createElement('SPAN');
				txt.innerText=balance[i];
				s.appendChild(txt);
			}
		}
	}).bind(this));
};

Oliker.prototype.dropVk=function()
{
	this.storage.chromeRemove(false,'VK',function(){location.reload();});
};

var startStopVk=function(object,action)
{
	return (function()
	{
		this.mainData.VK.is_start=(action=='start');
		this.storage.chromeSet(false,'VK',this.mainData.VK,(function()
		{
			chrome.runtime.sendMessage({action:action+'Vk'},(function(response)
			{
				if(response==='ok')
				{
					var button=this.startButton;
					button.innerText=(action=='start')?'Стоп':'Старт';
				}
			}).bind(this));
		}).bind(this));
	}).bind(object);
};


var oliker=new Oliker();
oliker.storage.chromeGet(false,null,oliker.start.bind(oliker));
Oliker.prototype.stopVk=startStopVk(oliker,'stop');
Oliker.prototype.startVk=startStopVk(oliker,'start');