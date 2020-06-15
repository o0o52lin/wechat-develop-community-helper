/**
 * @author 有脾气的酸奶
 * @date 2020-1-3 16:58:47
*/
window.debugLog = false
window.blockUsers = {}
window.blockUserArticles = {
    docId2openId:{},
    openId2docId:{}
}
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


chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        console.plog('收到'+port.name+'长连接消息：', msg);
        if(port.name == 'blockUser'){
            window.blockUsers = msg.blockUsers
            window.blockUserArticles = msg.blockUserArticles
            console.plog(msg.blockUserArticles)
            setTimeout(()=>{
                weChat.sendMessage({
                    event: 'doBlockUsers',
                    detail: { users: msg.blockUsers, cmd: 'doBlockUsers' }
                }, function(res){
                    console.plog(res)
                })
            }, 1000)
        }
    });
});

// 长连接
let port = chrome.runtime.connect({name:'content2bg'});

let _postMessage = port.postMessage
Object.defineProperty(port, 'postMessage', {
    onfigurable: true,
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
let initBgConnections = { blockUser: 1, bgMain: 1 }
port.postMessage({initBgConnections}, function(msg){
    window.debugLog = msg.debugLog
    window.nextVersionNotifyTime = msg.nextVersionNotifyTime
    console.plog(msg)
    if(msg.blockUsers){
        const blockU = document.createElement('script');
        blockU.setAttribute('id', 'plugin-blockUsers');
        blockU.innerText = 'window.blockUsers = '+JSON.stringify(msg.blockUsers || window.blockUserArticles);
        blockU.innerText += ';window.blockUserArticles = '+JSON.stringify(msg.blockUserArticles || window.blockUserArticles);
        blockU.innerText += ';window.nextVersionNotifyTime = '+(msg.nextVersionNotifyTime || 0);
        blockU.innerText += ';window.debugLog = '+(msg.debugLog || false);
        blockU.innerText += ';window.showLoading = '+(msg.showLoading || false);
        document.documentElement.appendChild(blockU);
    }
})




window.postMsg = (d , callback)=>{
    let { to = '', cmd = '', result = {}, website = 'https://developers.weixin.qq.com' } = d
    cmd = cmd ? cmd.replace(/Back$/, '')+'Back' : ''
    d.to = to
    d.cmd = cmd
    d.result = result
    d.from = 'content_script'
    to && cmd && window.postMessage(d, website)
    console.plog('callback:::::::::', callback)
}
window.weChat = {
    _exist(name, type){
        var t = weChat, e = true, tar = false, namePart = (name||'').split('.')
        for(var i in namePart){
            tar == false && (tar = window);
            if(tar.hasOwnProperty(namePart[i])){
                tar = tar[namePart[i]]
            }else{
                e = false
                break;
            }
        }
        if(type == 'function'){
            t._prop = typeof tar == 'function' ? tar : false
        }else{
            t._prop = tar
        }
        return e
    },
    _typeof(para) {
        const type = typeof para;
        if (type === "number" && isNaN(para)) return "NaN";
        if (type !== "object") return type;
        return Object.prototype.toString
            .call(para)
            .replace(/[\[\]]/g, "")
            .split(" ")[1]
            .toLowerCase();
    },
    doc: {
        create(tag, inner, attrs){
            var as = attrs || {}, inn = inner || {}, el
            as.id && (el = document.getElementById(as.id)) && el.remove();
            var e = document.createElement('script') 
            for(var i in as){
                e.setAttribute(i, as[i]);
            }
            inner.text && (e.innerText = inner.text)
            inner.html && (e.innerHTML = inner.html)
            document.documentElement.appendChild(e)
            return e
        },
        remove(id){
            return id ? document.getElementById(id).remove() : false
        }
    },
    onMessage:{
        addListener(evName = 'weChat-event', func){
            var t = weChat
            window.addEventListener(evName, function(res){
                let { api = {}, cmd = ''} = res.detail,
                { method = '', param = {}, hasCallback = false } = api,
                callback = (_)=>{},
                uuid = window.md5(JSON.stringify({ api, cmd, param }))
                if(JSON.stringify(api) != '{}'){
                    if(!method || !t._exist(method, 'function')) return
                    var _method = t._prop
                    hasCallback && (callback = (cbRes)=>{
                        var d = {}, tp = t._typeof(cbRes)
                        if(tp in { object:0, array:0 }){
                            d = JSON.stringify(cbRes)
                        }else if(tp == 'string'){
                            d = '`'+ cbRes.replace(/`/, '\\`') +'`'
                        }else if(tp == 'boolean'){
                            d = cbRes + ''
                        }else{
                            d = cbRes
                        }
                        t.doc.create('script', { text: 'window["'+uuid+'"] = '+d }, { id: uuid, 'dtype': tp })
                    });
                    _method && _method.apply(t, [param, callback])
                }else{
                    func && func.apply(t, [res])
                }
            })
        }
    },
    sendMessage:(o, func)=>{
        let t = weChat, { event = '', detail = {}, timeout = 5 } = o
        let { api = {}, cmd = ''} = detail,
        { method = '', param = {} } = api,
        uuid = window.md5(JSON.stringify({ api, cmd, param })),
        count = 0
        t.eventDispatchStates = t.eventDispatchStates ? t.eventDispatchStates : {}

        if(!event || t.eventDispatchStates.hasOwnProperty(uuid)) return
        t.eventDispatchStates[uuid] = true
        detail.uuid = uuid
        window.dispatchEvent(new CustomEvent(event, {
            detail: detail
        }));
        if(t._typeof(func) !== 'function') return 
        window.postMsgHandle = window.postMsgHandle ? window.postMsgHandle : {}
        if(!window.postMsgHandle[uuid]){
            window.postMsgHandle[uuid] = setInterval(()=>{
                count += 0.1
                if(window[uuid]){
                    clearInterval(window.postMsgHandle[uuid])
                    delete t.eventDispatchStates[uuid]
                    delete window.postMsgHandle[uuid]
                    var d = window[uuid]
                    if(d instanceof Element){
                        if(d.tagName == 'SCRIPT'){
                            var text = d.innerText.trim() || '', 
                            dt = d.getAttribute('dtype')
                            text = text.replace(/window\[[^\]]+\] = /, '').replace(/^`|`$/, '')
                            if(dt == 'object'){
                                d = JSON.parse(text)
                            }else if(dt == 'boolean'){
                                d = Boolean(text)
                            }else if(dt == 'number'){
                                d = Number(text)
                            }else{
                                d = text
                            }
                        }
                    }
                    func.apply(t, [d])
                    t.doc.remove(uuid)
                }else if(count > timeout){
                    clearInterval(window.postMsgHandle[uuid])
                    delete t.eventDispatchStates[uuid]
                    delete window.postMsgHandle[uuid]
                    throw {errMsg: 'event '+event+' callback timeout in '+timeout+'s'}
                    func.apply(t, [''])
                    t.doc.remove(uuid)
                }
            }, 100)
        }
    }
}

weChat.onMessage.addListener('getCurrentTail', function(res){
    console.plog('addListener CustomEvent getCurrentTail back : ==== ', res)
})

weChat.onMessage.addListener('commentContent')
weChat.onMessage.addListener('getAutoSearch')
weChat.onMessage.addListener('newVersionNotify')
weChat.onMessage.addListener('viewMore')

// chrome.runtime.sendMessage({type:"notifications", options:{
//         type: 'basic',
//         iconUrl: chrome.runtime.getURL('128.png'),
//         title: '这是标题',
//         eventTime: Date.now()+60,
//         message: '您刚才点击了自定义右键菜单',
//         buttons:[
//             { title:'查看详情' }
//         ]
//     }
// });

;(function(window, document, $) {

    window.addEventListener("message", function(event) {
        let { from = '', to = '', cmd = '', isCallback = !1 } = event.data
        if(from == 'inject_script'){
            if(to !== 'content_script') return
            if(cmd == 'getCurrentTail'){
                chrome.runtime.sendMessage({type:"getCurrentTail"}, function(res){
                    console.plog('currentTailSet=============================', res)
                    if(isCallback){
                        var e = document.createElement('script');
                        e.setAttribute('id', event.data.uuid);
                        e.innerText = 'window["'+event.data.uuid+'"] = '+JSON.stringify(res);
                        document.documentElement.appendChild(e);
                    }else{
                        window.postMsg({ to:'inject_script', cmd, result: res.tail || {} })
                    }
                });
            }else if(cmd == 'commentContent'){
                currentCommentContent = event.data.content
                isReply = event.data.type == 'reply' ? true : false
                postType = event.data.postType || 'answer'
                chrome.runtime.sendMessage({type:"hasTailMark", content:currentCommentContent, postType, isReply}, function(res){
                    // console.plog(res, event.data)
                    if($('#pre-post-comment-content').length > 0) $('#pre-post-comment-content').remove();
                    $('body').append('<div id="pre-post-comment-content" style="display:none;" data-type="'+event.data.type+'"></div>');
                    $('#pre-post-comment-content').html(res.result.content);
                    $('body').append('<img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" onload=\'doCommentOp(this)\' style="position:fixed;left:88888px;" />');
                });

            }

        }else{
            if(event.data.cmd == 'afterGetBaseInfo'){
                // baseInfo = event.data.data.__INITIAL_STATE__ || {}
                // postType = baseInfo.doc && baseInfo.doc.Topic == 1 ? 'discuss' : 'answer'
                // console.plog(baseInfo, postType,window.location.href)
                // if(/community\/develop(\/(mixflow|article|question))?/i.test(window.location.href)){
                //     setTimeout(()=>{
                //         new UScore().getScore()
                //     }, 1000)
                // }
            }else if(event.data.cmd == 'commentContent'){
                // currentCommentContent = event.data.content
                // isReply = event.data.type == 'reply' ? true : false
                // // console.plog(currentCommentContent)
                // chrome.runtime.sendMessage({type:"hasTailMark", content:currentCommentContent, postType, isReply}, function(res){
                //     // console.plog(res, event.data)
                //     if($('#pre-post-comment-content').length > 0) $('#pre-post-comment-content').remove();
                //     $('body').append('<div id="pre-post-comment-content" style="display:none;" data-type="'+event.data.type+'"></div>');
                //     $('#pre-post-comment-content').html(res.result.content);
                //     $('body').append('<img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" onload=\'doCommentOp(this)\' style="position:fixed;left:88888px;" />');
                // });
            }else if(event.data.cmd == 'update'){
                console.plog(event.data)
            }else if(event.data.cmd == 'doBlockUser'){
                // pageDataInfo = event.data.data.__INITIAL_STATE__ || {}
                // blockUsers = event.data.blockUsers || blockUsers
                // // console.plog('blockUsers', event.data.blockUsers)
                // if(!event.data.isCommentBlock){
                //     // 全部标签
                //     console.plog(pageDataInfo)
                //     var allRows = pageDataInfo.mixflowList ? (pageDataInfo.mixflowList.rows.length ? pageDataInfo.mixflowList.rows : []) : [],
                //     // 文章标签
                //     artRow = pageDataInfo.articleList ? (pageDataInfo.articleList.rows.length ? pageDataInfo.articleList.rows : []) : [],
                //     // 问答标签
                //     quesRows = pageDataInfo.develop ? (pageDataInfo.develop.hasOwnProperty(1) && pageDataInfo.develop[1].rows.length ? pageDataInfo.develop[1].rows : []) : [],
                //     hideOrshow = function(row){
                //         var tar = $('li[data-doc-id="'+row.DocId+'"]'), blockOneCls = 'block-user-item-'+row.DocId, _tar = false
                //         if(!tar.length) return
                //         if(row.OpenId in blockUsers && tar.attr('force-show') != 1){
                //             if(tar.attr('blocked') == 1) return

                //             _tar = tar.clone()
                //             _tar.children().addClass('plg-hide')
                //             _tar.addClass(blockOneCls+' plugin-block-user-item').find('>h2').removeClass('plg-hide').html('<a href="javascript:;" style="color: rgb(234, 160, 0);">该条已被你屏蔽(点击查看)</a>').parent()
                //             .attr('title', blockUsers[row.OpenId]).on('click', function(e){
                //                 $(this).remove()
                //                 $('li[data-doc-id="'+row.DocId+'"]').attr('force-show', 1).removeClass('plg-hide')
                //             })

                //             tar.attr('blocked', 1).addClass('plg-hide').before(_tar)

                //         }else{
                //             !(row.OpenId in blockUsers) && (tar.hasClass('plg-hide') && tar.removeClass('plg-hide'), $('.'+blockOneCls).remove())
                //         }
                        
                //     },
                //     rows = allRows
                //     // 删除所有屏蔽占位 以及 相关属性
                //     $('li.plugin-block-user-item').remove()
                //     $('li[blocked=1]').removeAttr('blocked')

                //     for (var i in rows) hideOrshow(rows[i])
                //     rows = artRow
                //     for (var i in rows) hideOrshow(rows[i])
                //     rows = quesRows
                //     for (var i in rows) hideOrshow(rows[i])
                // }else{
                //     // 评论列表
                //     var commentRows = pageDataInfo.doc && pageDataInfo.doc.Comments ? (pageDataInfo.doc.Comments.rows.length ? pageDataInfo.doc.Comments.rows : []) : [],
                //     hideOrshow = function(row){
                //         var tar = $('li[id="'+row.CommentId+'"]')
                //         if(!tar.length) return
                //         if(row.OpenId in blockUsers){
                //             if(tar.attr('blocked') == 1) return

                //             tar.attr('blocked', 1).addClass('plg-hide')
                //         }else{
                //             !(row.OpenId in blockUsers) && tar.hasClass('plg-hide') && tar.removeClass('plg-hide')
                //         }
                        
                //     }
                //     // 删除所有相关属性
                //     $('li[blocked=1]').removeAttr('blocked')
                //     // console.plog('commentRows', commentRows)
                //     for (var i in commentRows) {
                //         if(commentRows[i].OpenId in blockUsers){
                //             hideOrshow(commentRows[i])
                //         }else{
                //             var subCommentRows = commentRows[i].Sub && commentRows[i].Sub.length ? commentRows[i].Sub : []
                //             // console.plog('subCommentRows', subCommentRows)
                //             for (var i in subCommentRows) {
                //                 hideOrshow(subCommentRows[i])
                //             }
                //         }
                //     }
                // }


            }
        }
        
    })

})(window, window.document, jQuery);

chrome.extension.onRequest.addListener(async function(message, sender, sendResponse) {
    console.plog(message)
    if(message.type == 'getUserScore'){
        if(!message.openid) return
        weChat.sendMessage({
            event: 'showTargetUserScore',
            detail: { openid: message.openid, cmd: 'showTargetUserScore' }
        }, function(res){
            console.plog(res)
        })
    }else if(message.type == 'alert'){
        tips(message.msg, message.ok)
        if(message.op == 'tail'){
            currentTailSet = message.tail
        }
    }else if(message.type == 'copy'){
        weChat.sendMessage({
            event: 'doCopy',
            detail: { text: message.text, msg: message.msg, cmd: 'doCopy' }
        }, function(res){
            console.plog(res)
        })
    }else if(message.type == 'updateTail'){
        currentTailSet = message.tail
    }
})


var copy = function (text) {
    var clipElt = document.getElementById("plugin-clipboard");
    clipElt.value = text;
    clipElt.select();
    document.execCommand("Copy");
    window.getSelection && window.getSelection().removeAllRanges();
    clipElt.value = '';
}



const manifest = document.createElement('script');
manifest.setAttribute('id', 'chrome-manifest');
let mfJson = chrome.runtime.getManifest()
mfJson.id = chrome.runtime.id
mfJson.blockUsers = window.blockUsers
manifest.innerText = 'window.chromeManifest = '+JSON.stringify(mfJson);
document.documentElement.appendChild(manifest);

const css = document.createElement('link');
css.setAttribute('rel', 'stylesheet');
css.setAttribute('href', chrome.extension.getURL('css/inject-css.css'));
document.documentElement.appendChild(css);

// const localdb = document.createElement('script');
// localdb.setAttribute('type', 'text/javascript');
// localdb.setAttribute('src', chrome.extension.getURL('js/localDB.min.js'));
// document.documentElement.appendChild(localdb);

const jquery = document.createElement('script');
jquery.setAttribute('type', 'text/javascript');
jquery.setAttribute('src', chrome.extension.getURL('js/jquery.min.js'));
document.documentElement.appendChild(jquery);

const md5 = document.createElement('script');
md5.setAttribute('type', 'text/javascript');
md5.setAttribute('src', chrome.extension.getURL('js/md5.js'));
document.documentElement.appendChild(md5);

let iframeLoaded = false;
const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.extension.getURL('pageScripts/main.js'));
document.documentElement.appendChild(script);

script.addEventListener('load', () => {
    // 长连接
    let port = chrome.runtime.connect({name:'filterSearch'});
    port.onMessage.addListener((msg)=>{
        console.plog(msg)
        chrome.storage.local.set({ajaxInterceptor_switchOn: msg.filterSearch})
        postMessage({type: 'ajaxInterceptor', to: 'pageScript', key: 'ajaxInterceptor_switchOn', value: msg.filterSearch, refresh: true});
    })
    port.postMessage({filterSearch:1})

    // chrome.storage.local.get('ajaxInterceptor_switchOn', (result) => {
    //     console.plog('ajaxInterceptor_switchOn cache', result.ajaxInterceptor_switchOn, result)
    //     chrome.storage.local.set({ajaxInterceptor_switchOn: 0})
    //     if (result.hasOwnProperty('ajaxInterceptor_switchOn')) {
    //         postMessage({type: 'ajaxInterceptor', to: 'pageScript', key: 'ajaxInterceptor_switchOn', value: result.ajaxInterceptor_switchOn});
    //     }else{
    //         port.postMessage({filterSearch:1})
    //     }
    // });
});

const injectCode = document.createElement('script');
injectCode.setAttribute('type', 'text/javascript');
injectCode.setAttribute('src', chrome.extension.getURL('js/inject-plugin-code.js'));
document.documentElement.appendChild(injectCode);


// 接收background.js传来的信息，转发给pageScript
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    console.plog('接收background.js传来的信息，转发给pageScript', msg)
    if (msg.type === 'ajaxInterceptor' && msg.to === 'content') {
        if (msg.hasOwnProperty('iframeScriptLoaded')) {
            if (msg.iframeScriptLoaded) iframeLoaded = true;
        } else {
            postMessage({...msg, to: 'pageScript'}, 'https://developers.weixin.qq.com');
        }
    }else if(msg.type == 'doBlockUsers'){
        // blockUsers = msg.users || {}
        // var a = ()=>new Promise((rs, rj)=>{
        //     weChat.sendMessage({
        //         event: 'doBlockUsers',
        //         detail: { users: blockUsers, cmd: 'doBlockUsers' }
        //     }, function(res){
        //         console.plog('doBlockUsers 000000000000', res)
        //         rs(res)
        //     })
        // })
        // var r = await a()
        // sendResponse(r)
       
        // return true
    }else{
        sendResponse({errmsg:'content.js : chrome.runtime.onMessage UNMATCH'})
    }
    return true
});

// 接收pageScript传来的信息，转发给iframe
window.addEventListener("pageScript", function(event) {
    console.plog('接收pageScript传来的信息，转发给iframe', event)
  if (iframeLoaded) {
    chrome.runtime.sendMessage({type: 'ajaxInterceptor', to: 'iframe', ...event.detail});
  } else {
    let count = 0;
    const checktLoadedInterval = setInterval(() => {
      if (iframeLoaded) {
        clearInterval(checktLoadedInterval);
        chrome.runtime.sendMessage({type: 'ajaxInterceptor', to: 'iframe', ...event.detail});
      }
      if (count ++ > 500) {
        clearInterval(checktLoadedInterval);
      }
    }, 10);
  }
}, false);