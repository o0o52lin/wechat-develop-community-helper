
;(function (window) {
	window.commonReplyListEnable = !0
	window.commentTailDefaulContent = '--↓↓👍点赞是回答的动力哦'
	window.commentTailDefaulBgcolor = 'linear-gradient(45deg, red, yellow, rgb(204, 204, 255))'
	window.commentTailDefaulTpl = '<p style="display: tail;text-align: left;border-top: 0.5px solid rgba(0,0,0,.06);padding-top: 5px;margin-top: 15px;" title="tail"><span style="width: fit-content;background: {bgcolor};font-size: 10px;color: transparent;-webkit-background-clip: text;">{content}</span></p>'
	window.commentTailSetting = {
		type: 1,
		default:{
			type: 1,
			content: window.commentTailDefaulContent,
			bgcolor: window.commentTailDefaulBgcolor,
			html: (function(){return window.commentTailDefaulTpl.replace('{content}', window.commentTailDefaulContent).replace('{bgcolor}', window.commentTailDefaulBgcolor)})()
		},
		current:{
			type: 1
		}
	}
	window.codeTipSetting = {
		default: "你好，请提供能复现问题的简单代码片段\r\nhttps://developers.weixin.qq.com/miniprogram/dev/devtools/minicode.html",
		current: ''
	}

	window.updateAutoSearch = function updateAutoSearch(autoSearch){
		var data = {};
		data[autoSearch_key] = autoSearch;
		window[autoSearch_key] = autoSearch;
		chrome.storage.local.set(data);
		chrome.contextMenus.update(menus.aSearchMid(), {checked:Boolean(autoSearch)});
	}

	window.updateCommonReplyListState = function updateCommonReplyListState(s){
		var data = {}, s = Boolean(s)
		data.commonReplyListEnable = s;
		window.commonReplyListEnable = s;
		chrome.storage.local.set(data);
	}

	window.updateCommonReplyList = function updateCommonReplyList(list){
		var data = {}, list = list ? list : []
		data.updateCommonReplyList = list
		window..updateCommonReplyList = list
		chrome.storage.local.set(data);
	}


	window.updateCommentTailSetting = function updateCommentTailSetting(type, data){
		var type = type || 1, data = data || {}
		chrome.storage.local.get('commentTailSetting', function (ret) {
			var def = JSON.parse(JSON.stringify(window.commentTailSetting.default))
			set = Object.assign(def, ret.commentTailSetting||{})
			if(type == 1){
				var content = data.hasOwnProperty('content') ? data.content.trim() : '',
				bgcolor = data.hasOwnProperty('bgcolor') ? data.bgcolor.trim() : ''
				set.type = 1
				set.content = content != '' ? content : def.content
				set.bgcolor = bgcolor != '' ? bgcolor : def.bgcolor
				set.html = window.commentTailDefaulTpl.replace('{bgcolor}', set.bgcolor).replace('{content}', set.content)
			}else{
				var html = data.hasOwnProperty('html') ? data.html.trim() : ''
				set.type = 2
				set.content = ''
				set.bgcolor = ''
				set.html = html != '' ? html : window.commentTailDefaulTpl.replace('{bgcolor}', def.bgcolor).replace('{content}', def.content)
			}
			window.commentTailSetting.type = set.type
			window.commentTailSetting.current = set;
			chrome.storage.local.set({commentTailSetting:set});
			chrome.tabs.query({ currentWindow: true },function(res){
				for(var i in res){
					chrome.tabs.sendRequest(res[i].id, { type: 'updateTail', tail: window.getCurrentTail() });
				}
				
			})
		})
	}

	window.getCurrentTail = function getCurrentTail(){
		return window.commentTailSetting.current.html
	}

	var autoSearch_key = 'autoSearch';
	var menus = {
		baseMid: ()=>{
			this.bmid = this.bmid ? this.bmid : chrome.contextMenus.create({"title": '微信社区小组手', "contexts": ["all"], "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.bmid
		},
		aSearchMid: ()=>{
			this.asmid = this.asmid ? this.asmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '启用选中自动查询', "type":'checkbox',"contexts": ["all"], "onclick": (e, tab)=>{
				updateAutoSearch(e.checked ? 1 : 0);
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.asmid
		},
		getUserScoreMid: ()=>{
			this.gusmid = this.gusmid ? this.gusmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '查询TA的积分', "contexts": ['link'], "onclick": (e)=>{
				var openid = e.linkUrl.replace(/(.*)?community\/personal\/([a-zA-Z0-9_-]+)(.*)?/, '$2')
				chrome.tabs.query({active:true}, function(tab) {
					var message = {'type': 'getUserScore', openid:openid, tab:tab[0]};
					console.log(tab,message)
					chrome.tabs.sendRequest(tab[0].id, message);
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.gusmid
		},

		codeTipMid: ()=>{
			this.ctmid = this.ctmid ? this.ctmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '复制代码片段提示', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var text = "你好，请提供能复现问题的简单代码片段\r\nhttps://developers.weixin.qq.com/miniprogram/dev/devtools/minicode.html"
					chrome.tabs.sendRequest(tab[0].id, {type: 'copy', text, msg:'复制成功，粘贴即可', tab:tab[0]});
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.ctmid
		},

		txMid: ()=>{
			this.txmid = this.txmid ? this.txmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '特效代码', "contexts": ['all'], "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.txmid
		},

		txzMid: ()=>{
			this.txzmid = this.txzmid ? this.txzmid : chrome.contextMenus.create({"parentId": menus.txMid(), "title": '旋转文字', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var data = window.prompt('输入旋转的文字内容(必填)').trim()
					if( data == '' )
					{
						return chrome.tabs.sendRequest(tab[0].id, {type: 'alert', ok:0, msg:'内容不能为空', tab:tab[0]});
					}

					var text = '<div style="font-size: 1rem; animation: weuiLoading 2s ease-in-out infinite;width: fit-content;background-image: -webkit-linear-gradient(left, red, rgb(20, 11, 255));-webkit-background-clip: text;-webkit-text-fill-color: transparent;display:inline-block;">'+data+'</div>'
					chrome.tabs.sendRequest(tab[0].id, {type: 'copy', text, msg:'复制成功，粘贴即可', tab:tab[0]});
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.txzmid
		},

		txdzMid: ()=>{
			this.txdzmid = this.txdzmid ? this.txdzmid : chrome.contextMenus.create({"parentId": menus.txMid(), "title": '大写的赞', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var data = window.prompt('输入赞里的内容(非必填，默认"给你一个大大的赞")', '给你一个大大的赞')
					data = (data || '').trim()

					var text = '<p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:16s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:250px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:17s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="width: 0px!important;height: 0px!important;"><br></p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:15s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:230px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:18s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:42px;border-radius:10%;display:inline-block;">赞</p><p style="width: 0px!important;height: 0px!important;"><br></p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:11s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:80px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:12s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:13s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:14s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:19s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:64px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:20s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:21s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:22s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="width: 0px!important;height: 0px!important;"><br></p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:10s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:80px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:1s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:41px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:23s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:246px;border-radius:10%;display:inline-block;">赞</p><p style="width: 0px!important;height: 0px!important;"><br></p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:9s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:80px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:2s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:41px;border-radius:10%;display:inline-block;">赞</p><p style="color: #000;padding:6px 10px;margin-left: 0;margin-bottom:5px;display:inline-block;width:228px;text-align:center;">'+(data||'给你一个大大的赞')+'</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:24s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:0;border-radius:10%;display:inline-block;">赞</p><p style="width: 0px!important;height: 0px!important;"><br></p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:8s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:80px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:3s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:41px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:25s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:221px;border-radius:10%;display:inline-block;">赞</p><p style="width: 0px!important;height: 0px!important;"><br></p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:7s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:80px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:4s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:41px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:26s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:204px;border-radius:10%;display:inline-block;">赞</p><p style="width: 0px!important;height: 0px!important;"><br></p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:6s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:80px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:5s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:32s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:31s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:30s;background-color:orange;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:29s;background-color:red;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:28s;background-color:skyblue;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p><p style="animation:weuiLoading 1s ease-in-out infinite;animation-delay:27s;background-color:green;color:#fff;padding:6px 10px;margin-bottom:5px;margin-left:5px;border-radius:10%;display:inline-block;">赞</p>'
					data != '' && chrome.tabs.sendRequest(tab[0].id, {type: 'copy', text, msg:'复制成功，粘贴即可', tab:tab[0]});
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.txdzmid
		},

		commentTailMid: ()=>{
			this.commentTailmid = this.commentTailmid ? this.commentTailmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '设置回答小尾巴', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var data = window.prompt('设置回答小尾巴(非必填，默认"--↓↓👍点赞是回答的动力哦")\r\n回答内容中带有 特定标识 即可自动带小尾巴\r\n特定标识有：[t]、[T]、[tail]、[Tail]、【t】、【T】、【tail】、【Tail】', (window.commentTailSetting.current.content ? window.commentTailSetting.current.content : '--↓↓👍点赞是回答的动力哦'))
					data = (data || '').trim();
					updateCommentTailSetting(1, {content:data});
					data != '' && chrome.tabs.sendRequest(tab[0].id, {type: 'alert', ok: 1, msg:'设置成功', op: 'tail', tail:getCurrentTail()});
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.commentTailmid
		},

		commentTailBgMid: ()=>{
			this.commentTailmid = this.commentTailmid ? this.commentTailmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '设置小尾巴颜色', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var data = window.prompt('设置回答小尾巴颜色(非必填，默认"linear-gradient(45deg, red, yellow, rgb(204, 204, 255))")', (window.commentTailSetting.current.bgcolor ? window.commentTailSetting.current.bgcolor : 'linear-gradient(45deg, red, yellow, rgb(204, 204, 255))'))
					data = (data || '').trim()
					updateCommentTailSetting(1, {bgcolor:data});
					data != '' && chrome.tabs.sendRequest(tab[0].id, {type: 'alert', ok: 1, msg:'设置成功', op: 'tail', tail:getCurrentTail()});
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.commentTailmid
		},

		commentTail: ()=>{
			this.commentmid = this.commentmid ? this.commentmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '设置回答小尾巴HTML', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var data = window.prompt('设置回答小尾巴HTML(非必填)', window.commentTailSetting.current.html)
					data = (data || '').trim();
					updateCommentTailSetting(2, {html:data});
					data != '' && chrome.tabs.sendRequest(tab[0].id, {type: 'alert', ok: 1, msg:'设置成功', op: 'tail', tail:getCurrentTail()});
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.commentmid
		},
		settingMid: ()=>{
			this.settingmid = this.settingmid ? this.settingmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '更多设置', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.create({url:chrome.runtime.getURL('options.html')}, function(tab) {
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.settingmid
		}

	}
	chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
		if (request && request.cmd) {
			switch (request.cmd) {
				case 'search':
					chrome.tabs.create({
						url: request.host == 'developers.weixin.qq.com' ? ('https://developers.weixin.qq.com/doc/search?doc_type=miniprogram&query='+ request.text) : ('http://www.baidu.com/s?wd=' + encodeURIComponent(request.text))
					});
					sendResponse({cmd:'search', msg:'ok'})
					break;
				case 'getAutoSearch':
					sendResponse({autoSearch:window[autoSearch_key]})
					break;
			}
		}
	});

	chrome.storage.local.get(autoSearch_key, function (ret) {
		updateAutoSearch(ret.autoSearch)
	})
	chrome.storage.local.get('commonReplyListEnable', function (res) {
		window.commonReplyListEnable = res.commonReplyListEnable
	})
	chrome.storage.local.get('updateCommonReplyList', function (res) {
		window.updateCommonReplyList = res.updateCommonReplyList
	})
	chrome.storage.local.get('commentTailSetting', function (ret) {
		var def = JSON.parse(JSON.stringify(window.commentTailSetting.default))
		window.commentTailSetting.current = Object.assign(def, ret.commentTailSetting||{})
		window.commentTailSetting.type = window.commentTailSetting.current.type
	})

	for(var i in menus){
		if(window.commentTailSetting.type == 1){
			if(i == 'commentTailMid' || i == 'commentTailBgMid') continue
		}else{
			if(i == 'commentTail') continue
		}
		menus[i]()
	}

	$.ab2str = function(ab) {
		let unit8Arr = ab
		if (unit8Arr instanceof ArrayBuffer){
			unit8Arr = new Uint8Array(unit8Arr) 
		}
		return decodeURIComponent(escape(String.fromCharCode.apply(null, unit8Arr)));
	}
	$.par2Json = function (string) {
		var obj = {}, pairs = string.split('&'), d = decodeURIComponent, name, value;
		$.each(pairs, function (i, pair) {
			pair = pair.split('=');
			name = d(pair[0]);
			value = d(pair[1]);
			obj[name] = value;
		});
		return obj;
	}
	$.initData = (requestBody)=>{
		var data = {}
		if(requestBody.hasOwnProperty('formData')){
			for(var i in requestBody.formData){
				data[i] = requestBody.formData[i][0]
			}
		}else if(requestBody.hasOwnProperty('raw')){
			data = $.par2Json($.ab2str(requestBody.raw[0].bytes))
		}else{
			console.log('requestBody', requestBody)
		}
		return data
	}
	window.tailMarks = ['Tail', 'tail', 'T', 't']
	window.checkTailMark = (str)=>{
		var ret = !1
		for (var i in tailMarks) {
			ret = new RegExp('(\\['+tailMarks[i]+'\\]|【'+tailMarks[i]+'】)').test(str)
			if(ret) break;
		}
		return ret
	}
	window.removeTailMark = (str, removeAll)=>{
		var res = str, g = typeof removeAll == 'boolean' ? removeAll : !1
		for (var i in tailMarks) {
			ret = new RegExp('(\\['+tailMarks[i]+'\\]|【'+tailMarks[i]+'】)').test(str)
			if(ret){
				res = res.replace(removeAll ? new RegExp('(\\['+tailMarks[i]+'\\]|【'+tailMarks[i]+'】)') : new RegExp('(\\['+tailMarks[i]+'\\]|【'+tailMarks[i]+'】)', 'g'), '')
				break;
			}
		}
		return res
	}
	window.getTailMarkContent = (content)=>{
		var tar = $('<div>'+content+'</div>'), tail = tar.find('p[title="tail"]'),
		txt = tar.text().trim(), hasTailMark = checkTailMark(txt),
		hasOldTail = tail.length >= 1 ? !0 : !1
		if(hasOldTail && hasTailMark){
			tail.remove()
			content = tar.html()
		}
		if(hasTailMark || hasOldTail){
			content = removeTailMark(content)
			hasTailMark && (content += getCurrentTail())
			hasOldTail && (content = content.replace(/<p style="display:([^;]+)?;/, '<p style="display: tail;'));
		}
		return {content, hasTailMark, hasOldTail}
	}

	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
		type = message.type || '';
		if(type == 'hasTailMark'){
			console.log(message)
			sendResponse({result:getTailMarkContent(message.content)})
		}else if(type == 'getCurrentTail'){
			sendResponse({tail:getCurrentTail()})
		}

	})

})(this);