
window.debugLog = false
window.nextVersionNotifyTime = 0
window.pluginManifest = chrome.runtime.getManifest()

var getStackTrace = function () {
    let orig = Error.prepareStackTrace
    Error.prepareStackTrace = function(_, stack){ return stack }
    let err = new Error
    Error.captureStackTrace(err, arguments.callee)
    let stack = err.stack
    Error.prepareStackTrace = orig
    return stack
}
Object.defineProperty(console, 'plog', {
    onfigurable: true,
    enumerable: true,
    writable: true,
    value(...param){
        var stack = getStackTrace()[1], file = stack ? stack.getFileName() : ''
        var line = file ? "\r\n\r\n"+file+':'+stack.getLineNumber()+':'+stack.getPosition() : ''
        line && param.push(line)

        window.debugLog && console.log.apply(console, param)
    }
})
window.blogCategory = {
	1: '[问题]',
	2: '[公告]',
	4: '[教程]',
	8: '[已知问题]',
	16: '[经验]',
	64: '[开源]',
	128: '[活动]',
	256: '[QA]',
	512: '[API]',
	1024: '[教程]',
	524288: '[文章]',
	1048576: '[已知问题与需求反馈]'
}
window.blockUserArticles = {
	docId2openId:{},
	openId2docId:{}
}

window.syncBlockUsersArticleAllPages = 0
window.syncBlockUsersArticlePageCount = 0
window.isSaveBlockUsersArticle = false
window.isSyncingBlockUsersArticle = false

window.ports = {}
// 监听长连接
chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        console.plog('收到长连接消息：', msg);
        if(port.name == 'content2bg') {
        	for(var i in msg.initBgConnections){
        		chrome.tabs.query({ currentWindow: true }, (function(i){
        			return function(tabs){
	        			var r1 = /https?:\/\/developers\.weixin\.qq\.com\/community\/develop\/(article|mixflow|question)/,
						r2 = /https?:\/\/developers\.weixin\.qq\.com\/community\/develop\/doc\//,
	        			r3 = /https?:\/\/developers\.weixin\.qq\.com\/community\/search/
						for(var ii in tabs){
							var tab = tabs[ii], tabid = tab.id
							if(r1.test(tab.url) || r2.test(tab.url) || r3.test(tab.url)){
        						if(window.ports.hasOwnProperty(i) && window.ports[i].hasOwnProperty(tabid)) {
        							window.ports[i][tabid].postMessage({ name: 'tabid:'+tabid+' -> '+i+' inited already'});
        							continue
        						}
								var connection = chrome.tabs.connect(tabid, {name: i})
								
					        	let _postMessage = connection.postMessage
								Object.defineProperty(connection, 'postMessage', {
								    configurable: true,
								    enumerable: true,
								    writable: true,
								    value(...param){
								        if(typeof param[1] == 'function'){
								            this.onMessage.addListener(function(msg) {
								                param[1].apply(this, [msg])
								            })
								        }
								        return _postMessage.apply(this, [param[0]])
								    }
								})
								connection.onDisconnect.addListener((function(i, tabid){
									return function(p){
										delete window.ports[i][tabid]
									}
								})(i, tabid))

								connection.postMessage({ name: i, blockUsers: window.blockUsers, msg: 'tabid:'+tabid+' -> '+i+' inited'});
								window.ports[i] = window.ports[i] ? window.ports[i] : {}
								window.ports[i][tabid] = connection
								
							}
						}
					}
				})(i))
	        	
        	}
        	port.postMessage({ ok: true, msg: 'initConnection ok', nextVersionNotifyTime: window.nextVersionNotifyTime, debugLog: window.debugLog, blockUsers: window.blockUsers, blockUserArticles: window.blockUserArticles, filterSearch:window.filterSearch});
        	// port.disconnect()
        }else{
        	port.postMessage({ ok: true, ...msg, filterSearch:window.filterSearch});
        }

    });
});

;(async function (window) {
	window.blockUsers = {}
	window.commonReplyListEnable = !0
	window.commentTailSetting = {
		default:{
			answer: '<p class="post_comment_agreen__status" style="display: tail;text-align: left;border-top: 0.5px solid rgba(0,0,0,.06);padding-top: 5px;margin-top: 15px;" title="tail"><span class="selected"><i class="icon_radio"></i>若认为该回答有用，给回答者点个[ <span style="background:none;color:#576b95"><i class="icon_post_opr icon_topic_unagree"></i>有用</span> ]，让答案帮助更多的人</span></p>',
			reply: '<p class="post_comment_agreen__status" style="display: tail;text-align: left;border-top: 0.5px solid rgba(0,0,0,.06);padding-top: 5px;margin-top: 15px;" title="tail"><span class="selected"><i class="icon_radio"></i>若认为该回答有用，给回答者点个[ <span style="background:none;color:rgba(0,0,0,.5)"><i class="icon_post_opr icon_agree"></i>赞</span> ]</span></p>',
			discuss: '<p class="post_comment_agreen__status" style="display: tail;text-align: left;border-top: 0.5px solid rgba(0,0,0,.06);padding-top: 5px;margin-top: 15px;" title="tail"><span class="selected"><i class="icon_radio"></i>点个[ <span style="background:none;color:#576b95"><i class="icon_post_opr icon_topic_unagree"></i>赞同</span> ]，英雄所见略同</span></p>'
		},
		current:{
			answer: '',
			reply: '',
			discuss: ''
		}
	}

	window.codeTipSetting = {
		default: "弄一个 [ 能复现问题的简单的 ] 代码片段，我帮你看看\r\nhttps://developers.weixin.qq.com/miniprogram/dev/devtools/minicode.html",
		current: ''
	}

	window.updateAutoSearch = function updateAutoSearch(autoSearch){
		var data = {};
		data[autoSearch_key] = autoSearch;
		window[autoSearch_key] = autoSearch;
		chrome.storage.local.set(data);
		chrome.contextMenus.update(menus.aSearchMid(), {checked:Boolean(autoSearch)});
	}

	window.updateFilterSearch = function updateFilterSearch(filterSearch){
		var data = {};
		data[filterSearch_key] = filterSearch;
		window[filterSearch_key] = filterSearch;
		chrome.storage.local.set(data);
		chrome.contextMenus.update(menus.filterSearchMid(), {checked:Boolean(filterSearch)});
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
		window.updateCommonReplyList = list
		chrome.storage.local.set(data);
	}


	window.updateCommentTailSetting = function updateCommentTailSetting(data){
		var data = data || {}
		chrome.storage.local.get('commentTailSetting', function (ret) {
			var def = JSON.parse(JSON.stringify(window.commentTailSetting.default)),
			set = Object.assign(def, ret.commentTailSetting||{}),
			html = data.hasOwnProperty('answer') ? data : {}
			set = JSON.stringify(html) != '{}' ? html : window.commentTailSetting.default
			chrome.storage.local.set({commentTailSetting:set});
			window.commentTailSetting.current = set
			chrome.tabs.query({ currentWindow: true },function(res){
				for(var i in res){
					chrome.tabs.sendRequest(res[i].id, { type: 'updateTail', tail: window.getCurrentTail() });
				}
			})
		})
	}

	window.getCurrentTail = function(){
		return window.commentTailSetting.current
	}
	window.getBlockUsers = async function(){
		var blockUsers = ()=>new Promise((rs, rj)=>{
			chrome.storage.local.get('blockUsers', function (ret) {
				rs(ret.blockUsers||{})
			})
		})
		window.blockUsers = await blockUsers()
		return window.blockUsers
	}
	await window.getBlockUsers()

	window.saveBlockUsers = async function(d){
		window.blockUsers = d || {}
		chrome.storage.local.set({ blockUsers: window.blockUsers })
		
		for(var i in window.ports['blockUser']){
			window.ports['blockUser'][i].postMessage({ name: 'blockUser', blockUsers: window.blockUsers})
		}

		window.syncBlockUsersArticle()
	}
	window.getBlockUsersArticle = async function(){
		var article = ()=>new Promise((rs, rj)=>{
			chrome.storage.local.get('blockUsersArticle', function (ret) {
				rs(ret.blockUsersArticle||{ docId2openId:{}, openId2docId:{} })
			})
		})
		window.blockUserArticles = await article()
		return window.blockUserArticles
	}
	await window.getBlockUsersArticle()

	window.checkBlockUsersArticle = async function(d){
		var res = await window.getBlockUsers()

		var check = ()=>new Promise((rs, rj)=>{
			if(!res || JSON.stringify(res) == '{}'){
				window.blockUsers = {}
				return rs({
					docId2openId:{},
					openId2docId:{}
				})
				
			}
			var arts = { docId2openId:{}, openId2docId:{} },
			{docId2openId, openId2docId} = d
			for(var i in res){
				for(var h in docId2openId){
					if(docId2openId[h] == i){
						arts.docId2openId[h] = i
					}
				}
				for(var g in openId2docId){
					if(g == i){
						arts.openId2docId[g] = openId2docId[g]
					}
				}
			}
			rs(arts)
		})

		return await check()
	}
	window.saveBlockUsersArticle = async function (d){
		var data = {};
		d = await window.checkBlockUsersArticle(d)

		data['blockUsersArticle'] = d || {};
		window.blockUserArticles = d || {}
		chrome.storage.local.set(data);
		window.isSaveBlockUsersArticle = false
		window.syncBlockUsersArticlePageCount = 0
		window.syncBlockUsersArticleAllPages = 0
	}

	window.oneSyncBlockUsersArticle = async function(i, openids, type = 'article', morePageOpenids = []){
		// console.plog(i, openids)
		return new Promise((rs, rj)=>{
			var openid = openids[i].openid, page = openids[i].page
			$.ajax({
	          url:'https://developers.weixin.qq.com/community/ngi/personal/'+openid+'/'+type+'?page='+page,
	          type: 'get',
	          dataType:'JSON',
	          success: async function(r){
	            if(r.success){
					r.data.list.length > 0 && window.syncBlockUsersArticlePageCount++
	            	window.blockUserArticles.openId2docId[openid] = window.blockUserArticles.openId2docId.hasOwnProperty(openid) ? window.blockUserArticles.openId2docId[openid] : {}
	            	for(var k in r.data.list){
	            		window.blockUserArticles.docId2openId[r.data.list[k].DocId] = openid
						window.blockUserArticles.openId2docId[openid][r.data.list[k].DocId] = 1
	            	}
	            	var maxPage = Math.ceil(r.data.total / 10),
	            	npage = r.data.page + 1 > maxPage ? 0 : r.data.page + 1
	            	openids[i].npage = npage
	            	openids[i].pages = maxPage
	        		npage > 0 && morePageOpenids.push({openid, page: npage, pages: maxPage})
					maxPage && (window.syncBlockUsersArticleAllPages += maxPage)
	        		if(i + 1 < openids.length){
	        			await window.oneSyncBlockUsersArticle(i + 1, openids, type, morePageOpenids)
	        		}else{
	        			await window.oneSyncBlockUsersArticleOfMorePageOpenids(0, morePageOpenids, type)
	        		}
	        		rs()
	            }
	          }
	        })
		})
		
	}
	window.oneSyncBlockUsersArticleOfMorePageOpenids = async function(i, openids, type = 'article'){
		// console.plog('oneSyncBlockUsersArticleOfMorePageOpenids', i, openids)
		if(!openids.length){
			return window.saveBlockUsersArticle(window.blockUserArticles)
		}
		return new Promise((rs, rj)=>{
			var openid = openids[i].openid, page = openids[i].page
			$.ajax({
	          url:'https://developers.weixin.qq.com/community/ngi/personal/'+openid+'/'+type+'?page='+page,
	          type: 'get',
	          dataType:'JSON',
	          success:async function(r){
	            if(r.success){
					r.data.list.length > 0 && window.syncBlockUsersArticlePageCount++
	            	window.blockUserArticles.openId2docId[openid] = window.blockUserArticles.openId2docId.hasOwnProperty(openid) ? window.blockUserArticles.openId2docId[openid] : {}
	            	for(var k in r.data.list){
	            		window.blockUserArticles.docId2openId[r.data.list[k].DocId] = openid
						window.blockUserArticles.openId2docId[openid][r.data.list[k].DocId] = 1
	            	}
	            	var maxPage = Math.ceil(r.data.total / 10),
	            	npage = r.data.page + 1 > maxPage ? 0 : r.data.page + 1

	            	if(npage > 0){
		            	openids[i].npage = npage
		            	openids[i].page = npage
		            	openids[i].pages = maxPage
	            		window.oneSyncBlockUsersArticleOfMorePageOpenids(i, openids, type)
	            	}else if(i + 1 < openids.length){
	            		window.oneSyncBlockUsersArticleOfMorePageOpenids(i + 1, openids, type)
	            	}else{
						// console.plog(window.syncBlockUsersArticlePageCount, window.syncBlockUsersArticleAllPages)
						if(!window.isSaveBlockUsersArticle && window.syncBlockUsersArticleAllPages > 0 && window.syncBlockUsersArticlePageCount >= window.syncBlockUsersArticleAllPages){
							// console.plog('saveBlockUsersArticle')
							window.isSaveBlockUsersArticle = true
							await window.saveBlockUsersArticle(window.blockUserArticles)
						}
						window.isSyncingBlockUsersArticle = false
	            	}
	            	rs()
	            }
	          }
	        })
		})
	}

	window.syncBlockUsersArticle = function(t){
		var ps = [], tar = window.blockUsers, openids = [], morePageOpenids = []
		for(var i in tar){
			openids.push({openid: i, page: 1, pages: 1})
		}
		if(openids.length){
			if(!window.isSyncingBlockUsersArticle){
				window.isSyncingBlockUsersArticle = true
				window.oneSyncBlockUsersArticle(0, openids, 'article', morePageOpenids, true).then(res=>{
					morePageOpenids = []
					window.oneSyncBlockUsersArticle(0, openids, 'question', morePageOpenids, true)
				})
			}
		}else{
			window.saveBlockUsersArticle({})
		}
	}

	var autoSearch_key = 'autoSearch';
	var filterSearch_key = 'filterSearch'
	var menus = {
		baseMid: ()=>{
			this.bmid = this.bmid ? this.bmid : chrome.contextMenus.create({"title": '微信社区小助手', "contexts": ["all"], "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.bmid
		},
		aSearchMid: ()=>{
			this.asmid = this.asmid ? this.asmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '启用选中自动查询', "type":'checkbox',"contexts": ["all"], "onclick": (e, tab)=>{
				updateAutoSearch(e.checked ? 1 : 0);
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.asmid
		},
		filterSearchMid: ()=>{
			this.fsmid = this.fsmid ? this.fsmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '启用搜索屏蔽功能', "type":'checkbox',"contexts": ["all"], "onclick": (e, tab)=>{
				updateFilterSearch(e.checked ? 1 : 0);
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.fsmid
		},
		getUserScoreMid: ()=>{
			this.gusmid = this.gusmid ? this.gusmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '查询TA的积分', "contexts": ['link'], "onclick": (e)=>{
				var openid = e.linkUrl.replace(/(.*)?community\/personal\/([a-zA-Z0-9_-]+)(.*)?/, '$2')
				chrome.tabs.query({active:true}, function(tab) {
					var message = {'type': 'getUserScore', openid:openid, tab:tab[0]};
					console.plog(tab,message)
					chrome.tabs.sendRequest(tab[0].id, message);
				})
			}, "documentUrlPatterns": ['*://developers.weixin.qq.com/*']})
			return this.gusmid
		},

		codeTipMid: ()=>{
			this.ctmid = this.ctmid ? this.ctmid : chrome.contextMenus.create({"parentId": menus.baseMid(), "title": '复制代码片段提示', "contexts": ['all'], "onclick": (e)=>{
				chrome.tabs.query({active:true}, function(tab) {
					var text = "弄一个 [ 能复现问题的简单的 ] 代码片段，我帮你看看\r\nhttps://developers.weixin.qq.com/miniprogram/dev/devtools/minicode.html"
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
				case 'getfilterSearch':
					sendResponse({fiterSearch:window[filterSearch_key]})
					break;
			}
		}
	});

	chrome.storage.local.get(autoSearch_key, function (ret) {
		updateAutoSearch(ret.autoSearch)
	})

	chrome.storage.local.get('nextVersionNotifyTime', function (res) {
		window.nextVersionNotifyTime = res.nextVersionNotifyTime || 0
	})

	chrome.storage.local.get(filterSearch_key, function (ret) {
		updateFilterSearch(ret.filterSearch)
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
	})

	for(var i in menus){
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
			console.plog('requestBody', requestBody)
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
	window.getTailMarkContent = (content, postType, isReply)=>{
		var tar = $('<div>'+content+'</div>'), tail = tar.find('p[title="tail"]'),
		txt = tar.text().trim(), hasTailMark = checkTailMark(txt),
		hasOldTail = tail.length >= 1 ? !0 : !1
		if(hasOldTail && hasTailMark){
			tail.remove()
			content = tar.html()
		}
		if(hasTailMark || hasOldTail){
			content = removeTailMark(content)
			postType = isReply ? 'reply' : postType
			var tails = getCurrentTail() || {answer:'', reply: '', discuss:''}
			hasTailMark && (content += (tails[postType] || ''))
			hasOldTail && (content = content.replace(/<p style="display:([^;]+)?;/, '<p style="display: tail;'));
		}
		console.plog({content, hasTailMark, hasOldTail, tails,postType})
		return {content, hasTailMark, hasOldTail}
	}

})(this);


chrome.runtime.onInstalled.addListener(function(){
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
		chrome.declarativeContent.onPageChanged.addRules([
			{
				conditions: [
					// 只有打开微信开发者社区才显示pageAction
					new chrome.declarativeContent.PageStateMatcher({pageUrl: {urlContains: 'developers.weixin.qq.com'}})
				],
				actions: [new chrome.declarativeContent.ShowPageAction()]
			}
		]);
	});
});


// omnibox 演示
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
	console.plog('inputChanged: ' + text);
	if(!text) return;
	if(/view/.test(text)) {
		suggest([
			{content: '小程序 view', description: '你要找“小程序view”吗？'},
			{content: '小程序 cover-view', description: '你要找“小程序cover-view”吗？'},
		]);
	}
	else if(text == '微博') {
		suggest([
			{content: '新浪' + text, description: '新浪' + text},
			{content: '腾讯' + text, description: '腾讯' + text},
			{content: '搜狐' + text, description: '搜索' + text},
		]);
	}
	else {
		suggest([
			{content: '百度搜索 ' + text, description: '百度搜索 ' + text},
			{content: '谷歌搜索 ' + text, description: '谷歌搜索 ' + text},
		]);
	}
});

// 当用户接收关键字建议时触发
chrome.omnibox.onInputEntered.addListener((text) => {
	console.plog('inputEntered: ' + text);
	if(!text) return;
	var href = '';
	if(text.endsWith('cover-view')) href = 'https://developers.weixin.qq.com/miniprogram/dev/component/cover-view.html';
	else if(text.endsWith('view')) href = 'https://developers.weixin.qq.com/miniprogram/dev/component/view.html';
	else if(text.startsWith('百度搜索')) href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text.replace('百度搜索 ', '');
	else if(text.startsWith('谷歌搜索')) href = 'https://www.google.com.tw/search?q=' + text.replace('谷歌搜索 ', '');
	else href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text;
	openUrlCurrentTab(href);
});
// 获取当前选项卡ID
function getCurrentTabId(callback)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		if(callback) callback(tabs.length ? tabs[0].id: null);
	});
}

// 当前标签打开某个链接
function openUrlCurrentTab(url)
{
	getCurrentTabId(tabId => {
		chrome.tabs.update(tabId, {url: url});
	})
}

window.notifyOps = {}
chrome.notifications.onPermissionLevelChanged.addListener((r)=>{
    console.plog(r)
})
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex)=>{
    console.plog(notificationId, window.notifyOps.buttons[buttonIndex])
    if(window.notifyOps.buttons[buttonIndex].title == '查看详情'){
    	chrome.tabs.query({ currentWindow: true },function(tabs){
    		var tarTab = false
			for(var i in tabs){
				if(/community\/develop(\/(mixflow|article|question))?$/i.test(tabs[i].url)){
					tarTab = tabs[i]
					break;
				}
			}
			tarTab == false ? chrome.tabs.create({
	    		url:'https://developers.weixin.qq.com/community/develop/mixflow?f=#show-new-version-log'
	    	}) : chrome.tabs.update(tarTab.id, {
	    		active: true,
	    		url:'https://developers.weixin.qq.com/community/develop/mixflow?f=#show-new-version-log'
	    	})
		})
    	window.nextVersionNotifyTime = new Date().valueOf()+5*60*1000
    	chrome.storage.local.set({ nextVersionNotifyTime: window.nextVersionNotifyTime })
    }else if(window.notifyOps.buttons[buttonIndex].title == '今日不再提醒'){
    	window.nextVersionNotifyTime = new Date(new Date(new Date().valueOf()+86400*1000).toJSON().replace(/T.*/, '')).valueOf()
    	chrome.storage.local.set({ nextVersionNotifyTime: window.nextVersionNotifyTime })
    }
    chrome.notifications.clear(notificationId)
})

function notify(o){
	o.iconUrl = o.iconUrl || chrome.runtime.getURL('128.png')
	window.notifyOps = o
	chrome.notifications.create(null, o);
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
		console.plog('message', message)
	type = message.type || '';
	if(type == 'hasTailMark'){
		console.plog(message)
		sendResponse({result:getTailMarkContent(message.content, message.postType, message.isReply)})
	}else if(type == 'getCurrentTail'){
		sendResponse({tail:getCurrentTail()})
	}else if(type == 'notifications'){
		notify(message.options)
		sendResponse({})
	}else if(type == 'getManifest'){
		console.plog('getManifest', window.pluginManifest)
		sendResponse(window.pluginManifest)
	}else if(type == 'getAutoSearch'){
		sendResponse({autoSearch:window['autoSearch']})
	}else{
		sendResponse({errmsg:'background.js : chrome.runtime.onMessage UNMATCH'})
	}

})