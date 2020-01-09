
;(function (window) {

	function updateAutoSearch(autoSearch){
	    var data = {};
	    data[autoSearch_key] = autoSearch;
	    window[autoSearch_key] = autoSearch;
	    chrome.storage.local.set(data);
	    chrome.contextMenus.update(menus.aSearchMid(), {checked:Boolean(autoSearch)});
	}

	function updateCommentTail(tail){
	    var data = {}, tail = tail ? tail.trim() : ''
	    data['commentTail'] = tail.trim();
	    window['commentTail'] = tail.trim();
	    tail && chrome.storage.local.set(data);
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
			this.txdzmid = this.commentTailmid ? this.commentTailmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '设置回答小尾巴', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var data = window.prompt('设置回答小尾巴(非必填，默认"--↓↓👍点赞是回答的动力哦")\r\n回答内容末尾加 特定标识 即可自动带小尾巴\r\n特定标识有：[t]、[T]、[tail]、[Tail]、【t】、【T】、【tail】、【Tail】', (window.commentTail ? window.commentTail : '--↓↓👍点赞是回答的动力哦'))
					data = (data || '').trim();
					updateCommentTail(data);
			        data != '' && chrome.tabs.sendRequest(tab[0].id, {type: 'alert', ok: 1, msg:'设置成功'});
			    })
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.commentTailmid
		}

	}
	for(var i in menus){
		menus[i]()
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
			}
		}
	});

	chrome.storage.local.get(autoSearch_key, function (ret) {
        updateAutoSearch(ret.autoSearch)
    })
	chrome.storage.local.get('commentTail', function (ret) {
        updateCommentTail(ret.commentTail && ret.commentTail.trim() != '' ? ret.commentTail.trim() : false)
    })


	chrome.webRequest.onBeforeRequest.addListener(
		function(details) {
			
			if(/^https?:\/\/developers\.weixin\.qq\.com\/community\/ngi\/comment\/(create|update)/.test(details.url)){
				console.log(details);
				chrome.tabs.insertCSS(details.tabId, {code: '.page_tips.error{display:none;}'});
				if(/&blockpassed=/.test(details.url)){
					return {}
				}else{
					
					var rex = /(【tail】|【t】|【T】|【Tail】|\[t\]|\[tail\]|\[Tail\]|\[T\])/,
					rex2 = /(【tail】|【t】|【T】|【Tail】|\[t\]|\[tail\]|\[Tail\]|\[T\])/g,
					formData = details.requestBody.formData,
					content = formData.Content[0].trim(), tar = $('<div>'+content+'</div>'), tail = tar.find('p[title="tail"]'),
					txt = tar.text().trim(), hasTailMark = rex.test(txt),
					hasOldTail = tail.length >= 1 ? !0 : !1, ops = 'update'
					if(/^https?:\/\/developers\.weixin\.qq\.com\/community\/ngi\/comment\/create/.test(details.url)){
						ops = formData.hasOwnProperty('TargetCommentId') ? 'reply' : 'add'
					}
					if(hasOldTail && hasTailMark){
						tail.remove()
						content = tar.html()
					}
					console.log(content, details.requestBody.formData);
					if(hasTailMark || hasOldTail){

						content = content.replace(rex2, '')
						hasTailMark && (content += "<p style=\"display: tail;background: linear-gradient(45deg, red, yellow, rgb(204, 204, 255));font-size: 10px;color: transparent;-webkit-background-clip: text;border-top: 0.5px solid rgba(0,0,0,.06);padding-top: 5px;margin-top: 15px;\" title=\"tail\">"+(window.commentTail ? window.commentTail : '--↓↓👍点赞是回答的动力哦')+"</p>")
						hasOldTail && (content = content.replace(/<p style="display:([^;]+)?;/, '<p style="display: tail;'));
						formData.Content[0] = content

						chrome.tabs.sendRequest(details.tabId, {type: 'addComment', formData, url:details.url, ops});
						
						return {cancel: true}
					}
					setTimeout(()=>chrome.tabs.insertCSS(details.tabId, {code: '.page_tips.error{display:block;}'}), 1000);
					return {}
				}
			}
		},
		{urls: ["<all_urls>"], types: [ "main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]},
		["blocking","requestBody"]
	);
	

})(this);