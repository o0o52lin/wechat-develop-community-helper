
var postType = 'answer', isReply = false, currentCommentContent = '', currentTailSet = {answer:'', reply: '', discuss:''}
window.baseInfo = {}
window.baseUserInfo = {}
window.pageDataInfo = {}
window.blockUsers = {}
Object.defineProperty(console, 'plog', {
    onfigurable: true,
    enumerable: true,
    writable: true,
    value(...param){
        window.debugLog && console.log.apply(console, param)
    }
})
window.weChat = {
    _exist(name){
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
        return tar
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
                let { api = {}, cmd = '', uuid } = res.detail,
                { method = '', param = {}, hasCallback = false } = api,
                callback = (_)=>{}
                uuid = uuid || window.md5(JSON.stringify({ api, cmd, param }))
                if(JSON.stringify(api) != '{}'){
                    if(!method) return
                    var _method = t._exist(method)
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
                    // addListener(evName, functino(msg, sendRespone){})
                    func && func.apply(t, [res, (function(t, uuid){
                       return function(r){
                            var d = {}, tp = t._typeof(r)
                            if(tp in { object:0, array:0 }){
                                d = JSON.stringify(r)
                            }else if(tp == 'string'){
                                d = '`'+ r.replace(/`/, '\\`') +'`'
                            }else if(tp == 'boolean'){
                                d = r + ''
                            }else{
                                d = r
                            }
                            t.doc.create('script', { text: 'window["'+uuid+'"] = '+d }, { id: uuid, 'dtype': tp })
                       } 
                    })(t, uuid)])
                }
            })
        }
    },
    sendMessage:(o, func)=>{
        let t = weChat, { event = '', detail = {}, timeout = 5 } = o
        let { api = {}, cmd = '', uuid } = detail,
        { method = '', param = {} } = api,
        count = 0
        uuid = uuid || window.md5(JSON.stringify({ api, cmd, param }))
        t.eventDispatchStates = t.eventDispatchStates ? t.eventDispatchStates : {}
        if(!event || t.eventDispatchStates.hasOwnProperty(uuid)) return
        t.eventDispatchStates[uuid] = true
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

let {onload} = window
window.onload = async function(){

    setTimeout(()=>{
        $("body").delegate(".js_comment.best_comment_discuss,.js_comment.post_opr_meta_comment_reply,.mode__rich-text-editor .ql-editor,.post_comment_opr .post_opr_meta", "click", function(e){
            var li = $(e.currentTarget).parents('li[itemprop="answer"]')
            if(li.find(".ql-toolbar .tail-op-bar").length && li.find(".new-post-btn").length){
                return;
            }
            initClickArea(e.currentTarget)
            $(e.currentTarget).hasClass('ql-editor') && window.initEditorContent(li);
        });
        window.initAppEditorArr();
    }, 500)

    setTimeout(()=>{
        getBaseInfo()
        window.takeoverClickModifyCommentOpt();
        // baseInfo && baseInfo.doc && Object.defineProperty(baseInfo.doc, 'QuestionAnswered', {
        //     configurable: true,
        //     enumerable: true,
        //     get(v){
        //         return this._QuestionAnswered
        //     },
        //     set(v){
        //         this._QuestionAnswered = v
        //         if(v){
        //             var coms = $('.post_comment_list>li>a')
        //             for(var i = 0; i< coms.length; i++){
        //                 if(coms[i].href.indexOf(baseUserInfo.openid) > 0){
        //                     baseUserInfo.userAnswerEle = $(coms[i])
        //                     window.takeoverClickModifyCommentOpt();
        //                     break
        //                 }
        //             }
        //         } 
        //     }
        // })
    }, 600)


    
    

    $('body').delegate('#wx-popoverWrapId', 'mouseenter', function(e){
        var hd = parseInt($(this).data('closeHandle'))||0
        $(this).data('closeHandle', 0)
        if(hd) clearTimeout(hd)
    })

    $('body').delegate('#wx-popoverWrapId', 'mouseleave', function(e){
        $(this).data('closeHandle', setTimeout(function () {
          textObj.close()
        }, 800))
    })

    setTimeout(()=>{
        weChat.sendMessage({
            event: 'getCurrentTail',
            detail: { api: { method: 'chrome.runtime.sendMessage', param: { type: 'getCurrentTail' }, hasCallback: !0 }, cmd: 'getCurrentTail' }
        }, function(res){
            currentTailSet = res.tail
        })

    }, 800)


    onload && onload()
}
weChat.onMessage.addListener('doBlockUsers', async function(msg, sendRespone){
    window.blockUsers = msg.detail.users || {}
    await doBlockUser(blockUsers)
    sendRespone({msg:'doBlockUsers execd'})
})
weChat.onMessage.addListener('showTargetUserScore', async function(msg, sendRespone){
    await showTargetUserScore(msg.detail.openid)
    sendRespone({msg:'showTargetUserScore execd'})
})




window.postMsg = (d, callback)=>{
    let { to = '', cmd = '', result = {}, website = 'https://developers.weixin.qq.com' } = d
    cmd = cmd ? cmd : ''
    d.to = to
    d.cmd = cmd
    d.result = result
    d.from = 'inject_script'
    var dd = JSON.parse(JSON.stringify(d))
    var uuid = window.btoa(JSON.stringify(dd))
    d.uuid = uuid
    d.isCallback = callback ? !0 : !1
    to && cmd && window.postMessage(d, website)

    window.postMsgHandle = window.postMsgHandle ? window.postMsgHandle : {}
    if(!window.postMsgHandle[uuid]){
        window.postMsgHandle[uuid] = setInterval(()=>{
            if(window[uuid]){
                clearInterval(window.postMsgHandle[uuid])
                delete window.postMsgHandle[uuid]
                callback(window[uuid])
                document.getElementById(uuid).remove()
            }
        }, 100)
    }
    
    console.plog('callback:::::::::', callback)
}
var tips = function(msg, type, time){
    type = typeof type == 'undefined' ? 1 : type
    $('#wx-alert').remove()
    $('body').append('<div id="wx-alert" class="weui-toptips '+(!type?'weui-toptips_error':'weui-toptips_success')+'" style="z-index: 10005;"><div class="weui-toptips__inner">'+msg+'</div></div>')
    setTimeout(()=>{
        $('#wx-alert').remove()
    }, time||2e3)
}, UScore = function (openid) {
    this.token = baseInfo.token || getCookie('server_token') || '';
    this.openid = openid ? openid : (baseUserInfo.openid ? baseUserInfo.openid : '');
    this.tpl = function() {
        return '<div check-reduce="" class="block-list public_box page_mod_blog_panel">'+
        '   <div class="page_mod_blog_panel_foot" style="margin-top: 0;margin-bottom: 18px;border-top: none;border-bottom: 1px solid rgba(0,0,0,.08);padding: 0 0 18px 0;">'+
        '       <a href="javascript:;" class="page_mod_blog_panel_foot_item" title="{scoreDate}">'+
        '           新增: {newScore}'+
        '       </a>'+
        '       <a href="javascript:;" class="page_mod_blog_panel_foot_item">'+
        '           总分: {totalScore}'+
        '       </a>'+
        '   </div>'+
        '   {scoreItems}'+
        '   <div class="new-version-tip page_mod_blog_panel_foot" style="border-top: 1px solid rgba(0,0,0,.08);padding-top: 10px;display: none;">'+
        '   </div>'+
        '</div>'
    };

    this.getScore = function(openid, tpl, render, updateFn){
        var t = this
        if(!this.token || !this.openid){
            return
        }
        $.post('//developers.weixin.qq.com/community/ngi/getuserscore?token='+this.token, 'openidList%5B0%5D='+this.openid, function(res){
            if(res.data){
                var info = res.data.length ? res.data[0] : {DayActionList:'[]'}
                try{
                    info.DayActionList = JSON.parse(info.DayActionList)
                }catch(e){
                    info.DayActionList = []
                }

                info = t.initHtml(info, tpl, render)

                if(updateFn){
                    updateFn(info)
                }
                else {
                    var tar = $('.page_mod_blog_panel:eq(0)')
                    tar.length && tar.after(info)
                    chkVersion()
                }
            }
        })
    };
    this.initHtml = function(data, tpl, render) {
        var info = tpl||this.tpl(), html = render ? render(data) : this.initScore(data)
        for(var i in tmp = {'totalScore':data.TotalScore||0, 'newScore':data.DayDiff||0, 'scoreDate':data.DS||'', 'scoreItems':html}){
            info = info.replace('{'+i+'}', tmp[i])
        }
        return info
    };
    this.getKeyStr = (key) => {
        switch (key) {
            case 1: // 提BUG被确认 400/个
                return {str:"反馈BUG", base:'400/个'};
            case 2: 
                return {str:"反馈内容("+key+"?)", base:'未知/次'};
            case 3: // 文章加精 2000 / 次
                return {str:"文章加精", base:'2000/次'};
            case 4:
            case 5:
            case 6:
                return {str:"回答/评论("+key+"?)", base:'未知/次'};
            case 7: // 话题加精 800/次
                return {str:"话题/回答加精", base:'800/次'};
            case 8: // 话题置顶 800/次
                return {str:"话题/回答置顶", base:'800/次'};

            case 9: 
                return {str:"文章("+key+"?)", base:'未知/次'};
            case 10: // 文章被点赞 400/次
                return {str:"文章被点赞", base:'400/次'};
            case 11: // 文章被收藏 400/次 或问题被收藏
                return {str:"文章/问题被收藏", base:'400/次'};
            case 12: // 回答被点赞 300/次
                return {str:"回答被点赞", base:'300/次'};
            case 13:
                return {str:"回答/评论("+key+"?)", base:'未知/次'};
            case 14: // 回复被点赞 100/次
                return {str:"回复被点赞", base:'100/次'};
            case 15: // 被关注 200/次
                return {str:"被关注", base:'200/次'};
            case 16: // * 问题被关注 100/次
                return {str:"问题被关注", base:'100/次'};
                // return "活跃";
            case 17: // 文章被浏览 1/次
                return {str:"文章被浏览", base:'1/次'};
                // return "文章";
            case 18: // 每日登录 100
                return {str:"每日登录", base:'100/天'};
            case 19:
                return {str:"活跃("+key+"?)", base:'未知/次'};
            case 20: // 完善资料网站 500
                return {str:"完善资料", base:'500'};
            case 21: // 添加案例 500/次
                return {str:"添加案例", base:'500/次'};
                // return "完善资料";
            case 22:
            case 23:
            case 24:
            case 25:
                return {str:"违法平台规定("+key+"?)", base:'未知/次'}
        }
    };
    this.initScore = (data)=>{
        var item = {}, html = ''
        for (var i = 1; i <= data.DayActionList.length; i++) {
            var k = Object.keys(item).pop()||1,
            keyInfo = this.getKeyStr(data.DayActionList[i-1].key)
            if(i%3 == 0){
                if(i < data.DayActionList.length){
                    item[parseInt(k)+1] = item[parseInt(k)+1] ? item[parseInt(k)+1] : ['<div class="page_mod_blog_panel_body">']
                }
                item[k].push('<a href="javascript:;" class="page_mod_blog_panel_body_item" title="'+keyInfo.base+'">'+
                '<p class="page_mod_blog_panel_body_item_title">'+keyInfo.str+'</p>'+
                '<p class="page_mod_blog_panel_body_item_desc">'+data.DayActionList[i-1].value+'</p>'+
                '</a>')

                item[k].push('</div>')
            }else{
                if(i == 1){
                    item = {1:['<div class="page_mod_blog_panel_body" style="margin-top: 0;">']}
                }
                item[k].push('<a href="javascript:;" class="page_mod_blog_panel_body_item" title="'+keyInfo.base+'">'+
                '<p class="page_mod_blog_panel_body_item_title">'+keyInfo.str+'</p>'+
                '<p class="page_mod_blog_panel_body_item_desc">'+data.DayActionList[i-1].value+'</p>'+
                '</a>')

                if(i >= data.DayActionList.length){
                    item[k].push('</div>')
                }
            }
        }

        for(var i in item){
            html += item[i].join('')
        }

        return html
    }
}, getCookie = (key)=>{
    return document.cookie.replace(new RegExp('(.*)?'+key+'=(\\d+);?(.*)?'), '$2')
}, getUserInfo = (openid)=>{
    return new Promise((rs, rj)=>{
        var token = baseInfo.token || getCookie('server_token') || ''
        $.get('//developers.weixin.qq.com/community/ngi/personal/'+openid+'?token='+token, function(res){
            if(res.success){
                rs(res.data)
            }else{
                tips('获取用户信息失败')
                rs({})
            }
        })
    })
}, showTargetUserScore = async (openid)=>{
    if(!openid) return
    var user = await getUserInfo(openid)
    var uScore = new UScore(openid)
    var html = 
    '<div class="uscore-dialog mod_dialog_invite_answer">'+
    '   <div class="dialog_wrapper dialog_invite_answer dialog_with_head" onclick="$(\'.uscore-dialog\').remove()">'+
    '       <div class="dialog_wrp_new dialog_component" style="min-width: 400px;">'+
    '           <div class="dialog" onclick="stopBubbleDefault(event)">'+
    '               <a href="javascript:;" class="icon16_opr closed pop_closed" onclick="$(\'.uscore-dialog\').remove()">'+
    '                   关闭'+
    '               </a>'+
    '               <div class="dialog_hd">'+
    '                   <h3>'+(user.userInfo ? user.userInfo.nickname : '该用户')+'</h3>'+
    '               </div>'+
    '               <div class="dialog_bd">'+
    '                   <div class="dialog_invite_answer_box">'+
    '                       <div class="dialog_invite_answer_box_head">'+
    '                           <p class="dialog_invite_answer_box_head_desc" title="{scoreDate}">'+
    '                               新增: <span class="cls">{newScore}</span>&nbsp;&nbsp;|&nbsp;&nbsp;总分: <span class="cls">{totalScore}</span>'+
    '                           </p>'+
    '                       </div>'+
    '                       <div class="dialog_invite_answer_box_body">'+
    '                           <ul class="invite_answer_list">{scoreItems}</ul>'+
    '                       </div>'+
    '                   </div>'+
    '               </div>'+
    '           </div>'+
    '       </div>'+
    '   </div>'+
    '</div>'
    uScore.getScore(openid, html, (data)=>{
        var item = {}, html = ''
        for (var i = 1; i <= data.DayActionList.length; i++) {
            var keyInfo = uScore.getKeyStr(data.DayActionList[i-1].key)
            html += '<li class="invite_answer_list_item" title="'+keyInfo.base+'">'+
            '   <div class="invite_answer_list_item_head">'+
            '       <div class="invite_answer_list_item_head_content">'+keyInfo.str+'</div>'+
            '   </div>'+
            '   <div class="invite_answer_list_item_foot cls">'+data.DayActionList[i-1].value+'</div>'+
            '</li>'
        }

        return html
    }, (res)=>{
        $('body').append(res)
    })
},  copy = function (text) {
    var clipElt = document.getElementById("plugin-clipboard");
    clipElt.value = text;
    clipElt.select();
    document.execCommand("Copy");
    window.getSelection && window.getSelection().removeAllRanges();
    clipElt.value = '';
}, chkVersion = ()=>{
    $.get('//developers.weixin.qq.com/community/ngi/article/detail/000caac50f4a38351f19596b35c813', function(res){
    	var manifest = window.chromeManifest || {}, e = $('<div>'+res.data.Content+'</div>').find('[title="plugin-hepler-info"]')

        var info = e.length ? e.text().trim() : '{}', npv = {}, opv = chromeManifest

        console.plog('chkVersion', e, info)
        compare_version = (v1, v2)=>{
            var p1 = (v1||'').match(/(\d+)/g)||[], p2=(v2||'').match(/(\d+)/g)||[], loop = p1.length > p2.length ? p1.length : p2.length,
            r = null
            for(var i=0;i<loop;i++){
                if(p1.hasOwnProperty(i) && p2.hasOwnProperty(i)){
                    if(parseInt(p1[i]) == parseInt(p2[i])){
                        r = 0
                    }else if(parseInt(p1[i]) > parseInt(p2[i])){
                        r = 1
                        break
                    }else{
                        r = -1
                        break
                    }
                }else if(!p1.hasOwnProperty(i) && p2.hasOwnProperty(i)){
                    r = -1
                    break
                }else if(p1.hasOwnProperty(i) && !p2.hasOwnProperty(i)){
                    r = 1
                    break
                }
            }
            return r
        }
        try{
            npv = JSON.parse(info)
            console.plog(npv)
            var c = compare_version(npv.version, opv.version)
            if(c != null && c > 0){
                var tip = '<a href="javascript:;" class="view-new-version cls page_mod_blog_panel_foot_item" title="查看更新内容" style="background: linear-gradient(45deg, #E91E63, #F44336, #FFEB3B);font-size: 10px;color: transparent;-webkit-background-clip: text;">插件有更新哦~</a>'+
                    '<a class="cls page_mod_blog_panel_foot_item" href="https://github.com/o0o52lin/wechat-develop-community-helper" target="_blank" style="color: rgb(7, 193, 96);font-size: 10px;">github地址</a>'
                $('.new-version-tip').html(tip).css({display:'flex'})
                $('.view-new-version').on('click', function(e){
                    var html = 
                    '<div class="uscore-dialog mod_dialog_invite_answer">'+
                    '   <div class="dialog_wrapper dialog_invite_answer dialog_with_head" onclick="$(\'.uscore-dialog\').remove()">'+
                    '       <div class="dialog_wrp_new dialog_component" style="min-width: 450px;">'+
                    '           <div class="dialog" onclick="stopBubbleDefault(event)">'+
                    '               <a href="javascript:;" class="icon16_opr closed pop_closed" onclick="$(\'.uscore-dialog\').remove()">'+
                    '                   关闭'+
                    '               </a>'+
                    '               <div class="dialog_hd">'+
                    '                   <h3>最新版本('+npv.version+')更新内容(当前版本:'+opv.version+')</h3>'+
                    '               </div>'+
                    '               <div class="dialog_bd">'+
                    '                   <div class="dialog_invite_answer_box">'+
                    '                       <div class="dialog_invite_answer_box_body">'+
                    '                           <ul class="invite_answer_list">'
                    for(var i in npv.update){
                        html += '<li class="invite_answer_list_item" style="'+(npv.update[i].imgs.length ? 'padding-bottom:0;' : '')+'">'+
                        '       <div class="invite_answer_list_item_head">'+
                        '           <div class="invite_answer_list_item_head_content">'+npv.update[i].title+'</div>'+
                        '       </div>'+
                        '       <div class="invite_answer_list_item_foot cls">'+npv.update[i].date+'</div>'+
                        '</li>'
                        if(npv.update[i].imgs.length){
                            html += '<li class="invite_answer_list_item" style="padding-top:0;display:block;">'
                            for(var ii in img = npv.update[i].imgs){
                                html += '<p style="margin:4px 0;border:1px dashed #ccc"><img src="'+img[ii].src+'" title="'+img[ii].title+'" /></p>'
                            }
                            html += '</li>'
                        }
                    }
                    html += '                    </ul>'+
                    '                       </div>'+
                    '                   </div>'+
                    '               </div>'+
                    '           </div>'+
                    '       </div>'+
                    '   </div>'+
                    '</div>'
                    $('body').append(html)
                })

                if(window.nextVersionNotifyTime <= new Date().valueOf()){
                    // 发送桌面弹框通知
                    weChat.sendMessage({
                        event: 'newVersionNotify',
                        detail: { api: { method: 'chrome.runtime.sendMessage', param: {
                            type:"notifications",
                            options:{
                                type: 'basic',
                                title: '社区小助手有更新啦',
                                message: '赶紧去升级，体验一下吧',
                                buttons:[
                                    { title:'查看详情' },
                                    { title:'今日不再提醒' }
                                ]
                            }
                        }, hasCallback: !0 }, cmd: 'newVersionNotify' }
                    }, function(res){
                        res.autoSearch && quickSearch()
                    })
                }
            }
            if(/show-new-version-log$/.test(window.location.href)){
                window.location.href = window.location.href.replace(/#show-new-version-log/, '#')
                $('.view-new-version').trigger('click');
            }

            
        }catch(e){
            data = {}
            console.error(e)
        }
    })
}



window.blockUsers = {};
window.isSearchPage = false;
window.tips = function(msg, type, time){
    type = typeof type == 'undefined' ? 1 : type;
    $('#wx-alert').remove();
    $('body').append('<div id="wx-alert" class="weui-toptips '+(!type?'weui-toptips_error':'weui-toptips_success')+'" style="z-index: 10005;"><div class="weui-toptips__inner">'+msg+'</div></div>');
    setTimeout(()=>{
        $('#wx-alert').remove();
    }, time||2e3);
};
function stopBubbleDefault(e) { 
    e && e.stopPropagation ? e.stopPropagation() : (window.event.cancelBubble = true);
    e && e.preventDefault ? e.preventDefault() : (window.event.returnValue = false);
    return false;
};
function getBaseInfo() {
    if(/community\/develop(\/(mixflow|article|question))?/i.test(window.location.href)){
        setTimeout(()=>{
            new UScore().getScore()
        }, 1000)
    }
};
function doBlockUser(users) {
    // 废弃
    return
    var isCommentBlock = /community\/develop\/doc/.test(location.href) ? true : false;

    pageDataInfo = window.__INITIAL_STATE__ || {}
    blockUsers = users || blockUsers
    // console.plog('blockUsers', blockUsers)
    if(!isCommentBlock){
        // 全部标签
        // console.plog(pageDataInfo,window)
        var allRows = pageDataInfo.mixflowList ? (pageDataInfo.mixflowList.rows.length ? pageDataInfo.mixflowList.rows : []) : [],
        // 文章标签
        artRow = pageDataInfo.articleList ? (pageDataInfo.articleList.rows.length ? pageDataInfo.articleList.rows : []) : [],
        // 问答标签
        quesRows = pageDataInfo.develop ? (pageDataInfo.develop.hasOwnProperty(1) && pageDataInfo.develop[1].rows.length ? pageDataInfo.develop[1].rows : []) : [],
        hideOrshow = function(row){
            var tar = $('li[data-doc-id="'+row.DocId+'"]'), blockOneCls = 'block-user-item-'+row.DocId, _tar = false
            if(!tar.length) return
            if(row.OpenId in blockUsers && tar.attr('force-show') != 1){
                if(tar.hasClass('plg-hide')) return
                tar.addClass('plg-hide')
                _tar = $(
                    '<li class="post_item post_overview post_item_simple_qa '+blockOneCls+' plugin-block-user-item" title="来自社区小助手的提示，屏蔽用户:'+blockUsers[row.OpenId]+'">'+
                    '<a href="javascript:;" style="color: rgb(234, 160, 0);"><h2 class="post_title">该条已被你屏蔽(点击查看)</h2></a>'+
                    '<li>')
                _tar.on('click', function(e){
                    $(this).off('click').remove()
                    $('li[data-doc-id="'+row.DocId+'"]').attr('force-show', 1).removeClass('plg-hide')
                })

                tar.before(_tar)

            }else{
                !(row.OpenId in blockUsers) && (tar.hasClass('plg-hide') && tar.removeClass('plg-hide'), $('.'+blockOneCls).off('click').remove())
            }
            
        },
        rows = allRows

        // 删除所有屏蔽占位 以及 相关class
        $('li.plugin-block-user-item').off('click').remove()
        $('li.plg-hide').removeClass('plg-hide')

        for (var i in rows) hideOrshow(rows[i])
        rows = artRow
        for (var i in rows) hideOrshow(rows[i])
        rows = quesRows
        for (var i in rows) hideOrshow(rows[i])
    }else{
        // 评论列表
        var commentRows = pageDataInfo.doc && pageDataInfo.doc.Comments ? (pageDataInfo.doc.Comments.rows.length ? pageDataInfo.doc.Comments.rows : []) : [],
        hideOrshow = function(row){
            var tar = $('li[id="'+row.CommentId+'"]'), blockTip = $('.plugin-blockTip')
            if(!tar.length) return
            if(row.OpenId in blockUsers){
                if(tar.hasClass('plg-hide')) return

                tar.addClass('plg-hide')
                if(!blockTip.length){
                    $('.anwser__title').append('<span class="plugin-blockTip" title="来自社区小助手的提示">有些回答或回复已被你屏蔽，点此显示</span>').on('click', '.plugin-blockTip', function(e){
                        $('li.plg-hide').removeClass('plg-hide')
                        $(this).off('click').remove()
                    })
                }

            }else{
                !(row.OpenId in blockUsers) && tar.hasClass('plg-hide') && tar.removeClass('plg-hide')
            }
            
        }
        // 删除所有相关class
        $('li.plg-hide').removeClass('plg-hide')

        // console.plog('commentRows', commentRows)
        for (var i in commentRows) {
            if(commentRows[i].OpenId in blockUsers){
                hideOrshow(commentRows[i])
            }else{
                var subCommentRows = commentRows[i].Sub && commentRows[i].Sub.length ? commentRows[i].Sub : []
                // console.plog('subCommentRows', subCommentRows)
                for (var i in subCommentRows) {
                    hideOrshow(subCommentRows[i])
                }
            }
        }
    }
};
function doBlockUserFromBlockItems(blockItems) { 
    var isCommentBlock = /community\/develop(\/article)?\/doc/.test(location.href) ? true : false;

    // console.plog('blockItems', blockItems, isCommentBlock)
    if(!isCommentBlock){
        hideOrshow = function(row){
            var tar = $('li[data-doc-id="'+row.DocId+'"]'), blockOneCls = 'block-user-item-'+row.DocId, _tar = false
            if(!tar.length) return
            if(row.OpenId in blockUsers && tar.attr('force-show') != 1){
                if(tar.hasClass('plg-hide')) return
                tar.addClass('plg-hide')
                _tar = $(
                    '<li class="post_item post_overview post_item_simple_qa '+blockOneCls+' plugin-block-user-item" title="来自社区小助手的提示，屏蔽用户:'+blockUsers[row.OpenId]+'">'+
                    '<a href="javascript:;" style="color: rgb(234, 160, 0);"><h2 class="post_title">该条已被你屏蔽(点击查看)</h2></a>'+
                    '<li>')
                _tar.on('click', function(e){
                    $(this).off('click').remove()
                    $('li[data-doc-id="'+row.DocId+'"]').attr('force-show', 1).removeClass('plg-hide')
                })

                tar.before(_tar)

            }else{
                !(row.OpenId in blockUsers) && (tar.hasClass('plg-hide') && tar.removeClass('plg-hide'), $('.'+blockOneCls).off('click').remove())
            }
            
        },
        rows = blockItems || {}

        // 删除所有屏蔽占位 以及 相关class
        $('li.plugin-block-user-item').off('click').remove()
        $('li.plg-hide').removeClass('plg-hide')

        for (var i in rows) hideOrshow(rows[i])

        $('.plugin-search-hide').removeClass('plugin-search-hide')
        $('.plugin-no-result-wrp').remove()
    }else{
        hideOrshow = function(row){
            var tar = $('li[id="'+row.CommentId+'"]'), blockTip = $('.plugin-blockTip')
            if(!tar.length) return
            if(row.OpenId in blockUsers){
                if(tar.hasClass('plg-hide')) return

                tar.addClass('plg-hide')
                if(!blockTip.length){
                    $('.anwser__title').append('<span class="plugin-blockTip" title="来自社区小助手的提示">有些回答或回复已被你屏蔽，点此显示</span>').on('click', '.plugin-blockTip', function(e){
                        $('li.plg-hide').removeClass('plg-hide')
                        $(this).off('click').remove()
                    })
                }

            }else{
                !(row.OpenId in blockUsers) && tar.hasClass('plg-hide') && tar.removeClass('plg-hide')
            }
            
        }
        // 删除所有相关class
        $('li.plg-hide').removeClass('plg-hide')

        // console.plog('commentRows', commentRows)
        for (var i in blockItems) hideOrshow(blockItems[i])
    }
};
function searchDoBlockUser(blockItmes) {
    var items = blockItmes || {},
    ul = $('#search_article_list'),
    lis = ul.find('li')
    for(var docid in items){
        for(var i=0;i<lis.length;i++){
            var href = $(lis[i]).find('.post_title a').attr('href') || ''
            if(href.indexOf(docid) > 0){
                $(lis[i]).attr('docid', docid)
                var _li = $(
                    '<li class="post_item post_overview" title="来自社区小助手，屏蔽用户: '+items[docid].nickname+'">'+
                    '<a href="javascript:;" style="color: rgb(234, 160, 0);"><h2 class="post_title">该搜索结果已被你屏蔽(点击查看)</h2></a>'+
                    '</li>'
                ).on('click', function(e){
                        $(this).off('click').remove()
                        ul.find('li[docid="'+docid+'"]').removeClass('plugin-search-li-hide')
                    })
                $(lis[i]).addClass('plugin-search-li-hide').before(_li)
                break;
            }
        }
    }
    $('.plugin-search-hide').removeClass('plugin-search-hide')
    $('.plugin-no-result-wrp').remove()
};
window.targetAppEditor = false;
window.targetCommentTail = "";
window.loopAppEditorArr=(tar)=>{
   var tar = tar||window.app.$children;
   for(var i in tar){
        // if($(tar[i].$el)){console.plog(tar[i].$el);};
        $(tar[i].$el).hasClass("mode__rich-text-editor") && window.answerAppRichEditorArrs.push({uid:tar[i]._uid, el:tar[i].$el, o:tar[i]});
        $(tar[i].$el).hasClass("frm_control_group_textarea__focus") && window.answerAppEditorArrs.push({uid:tar[i]._uid, el:tar[i].$el, o:tar[i]});
        $(tar[i].$el).hasClass("js_post_comment_item") && window.replyAppEditorArrs.push({uid:tar[i]._uid, el:tar[i].$el, o:tar[i]});
        $(tar[i].$el).hasClass("anwsers__list") && (window.baseInfo = tar[i]);
        if(!window.baseUserInfo.openid){
            for(var k in tar[i]){
                k == 'user' && (window.baseUserInfo = tar[i].user)
            }
        }
        if(tar[i].$children.length){
            window.loopAppEditorArr(tar[i].$children);
        }
   }
};
window.initAppEditorArr = function() {
   window.answerAppRichEditorArrs = [];
   window.answerAppEditorArrs = [];
   window.replyAppEditorArrs = [];
   window.loopAppEditorArr();
};
window.removeTail = function(event) {
   window.targetCommentTail = "";
   $(event.currentTarget).find("button").removeClass("del").addClass("add");
   $(event.currentTarget).off("click").on("click", function(e){window.addTail(e)}).find(".tail-tips").html("添加小尾巴");

   stopBubbleDefault(event);
};
window.addTail = function(event) {
   window.targetCommentTail = "[Tail]";
   $(event.currentTarget).find("button").removeClass("add").addClass("del");
   $(event.currentTarget).off("click").on("click", function(e){window.removeTail(e)}).find(".tail-tips").html("移除当前小尾巴");

   stopBubbleDefault(event);
};
window.replyRemoveTail = function(o) {
   window.targetCommentTail = "";
   $(o).removeClass("del").addClass("add").attr("title", "添加小尾巴");
};
window.replyAddTail = function(o) {
   window.targetCommentTail = "[Tail]";
   $(o).removeClass("add").addClass("del").attr("title", "移除小尾巴");
};


window.addEventListener("message", function(event) {
    let { from = '', to = '', cmd = '', result = {} } = event.data
    if(from == 'content_script'){
        if(to !== 'inject_script') return
        if(cmd == 'getCurrentTailBack'){
            // console.plog('getCurrentTailBack =============================', result)
            currentTailSet = result
        }

    }else{
        if(event.data.cmd == "replyAddTail"){
            window.replyAddTail(".tail-op-a[tarmark="+event.data.mark+"]");
        }else if(event.data.cmd == "replyRemoveTail"){
            window.replyRemoveTail(".tail-op-a[tarmark="+event.data.mark+"]");
        }
    }
});
window.initEditorContent = (li)=>{
    var box = li.find('.post_comment_editor_area.comment_editor_box'), tbar = box.length ? box.find('.tail-op-bar') : [],
    newOp = box.length ? box.find(".new-modify-op") : []
    if(tbar.length && newOp.length) return

    var hasTail = !1, tmp = baseInfo.doc && baseInfo.doc.Comments  && (baseInfo.doc.Comments.rows||[]);
    for(var i in tmp){
        if(li.attr("id") == tmp[i].CommentId){
            var conEl = $("<div>"+tmp[i].Content+"</div>"), tailEl = conEl.find("p[title=tail]");
            hasTail = /display:([ ]+)?tail;/.test(tmp[i].Content) || tailEl.length || (tmp[i].hasOwnProperty('ContentTail') ? tmp[i].ContentTail : false);
            window.targetCommentTail = hasTail ? (tailEl.length ? tailEl[0].outerHTML : (tmp[i].hasOwnProperty('ContentTail') ? tmp[i].ContentTail : '')) : "";
            hasTail && tailEl.remove();
            hasTail && (tmp[i].Content = conEl.html(), tmp[i].ContentTail = window.targetCommentTail);
            break;
        }
    }
    // console.plog(window.targetCommentTail)
    for(var i in window.answerAppRichEditorArrs){
        if(window.answerAppRichEditorArrs[i].o.$parent.comment && window.answerAppRichEditorArrs[i].o.$parent.comment.CommentId == li.attr("id")){
            window.answerAppRichEditorArrs[i].o.$parent.onStartModify();
            var toolbar = $(window.answerAppRichEditorArrs[i].o.$el).parents(".post_comment_editor_area").find(".ql-toolbar"), tailOp = toolbar.length ? toolbar.find(".tail-op-bar") : !1;
            toolbar.delegate(".tail-op-bar", "click", function(e){hasTail ? window.removeTail(e) : window.addTail(e)});

            // tailOp.length <= 0 && setTimeout(()=>{
                if(toolbar.parents(".post_editor_box").find('.preview-tail').length > 0){
                    hasTail && window.targetCommentTail != '' && toolbar.parents(".post_editor_box").find('.preview-tail').html(window.targetCommentTail)
                }else{
                    if(hasTail){
                        toolbar.parents(".post_editor_box").find(".tool_bar > :first").before('<div class="preview-tail">'+window.targetCommentTail+'</div>');
                    }else{
                        toolbar.parents(".post_editor_box").find(".tool_bar .preview-tail").remove()
                        toolbar.parents(".post_editor_box").find(".tool_bar > :first").before('<div class="preview-tail"></div>')
                    }
                }
                toolbar.find(".tail-op-bar").length || toolbar.append(
                   '<div class="weui-desktop-tooltip__wrp tail-op-bar">'+
                   '   <button class="mode__rich-text-editor__icon '+(hasTail ? 'del' : 'add')+'" type="button"></button>'+
                   '   <span class="weui-desktop-tooltip weui-desktop-tooltip__ tail-op-bar-tip"><p class="tail-tips">'+(hasTail ? '移除当前小尾巴' : '添加小尾巴')+'</p></span>'+
                   '</div>'
                );
            // }, 500);
            break;
        }
    }
}
window.takeoverClickModifyCommentOpt = ()=>{
    take_over = (i, v)=>{
        var s = $(v).parent().parent().find("a.post_opr_meta.new-modify-op");
        if($(v).siblings("span:eq(0)").text().trim() == "编辑"){
            var tbar = $(v).parents('.post_comment_info').siblings('.post_comment_editor_area.comment_editor_box').find('.tail-op-bar'),
            previewTail = $(v).parents('.post_comment_info').siblings('.post_comment_editor_area.comment_editor_box').find(".preview-tail")
            if(s.length) {
                if(tbar.length && previewTail.length) return
                s.off('click').remove()
            }
            t = $(v).parents("a.post_opr_meta");
            t.removeClass("origin-modify-op").after(
                t.clone().attr("title", "社区小助手插件已接管 - 编辑回答").removeClass("origin-modify-op").addClass("new-modify-op").css({display:"inline-block", color:"#eaa000"})
                .on("click", ()=>{
                    window.initEditorContent($(v).parents("li[itemprop=answer]"))
                })
            ).addClass("origin-modify-op").hide();
        }
    };

    $("a.post_opr_meta i.edit").each(take_over);
};
window.takeoverCreateCommentOpt = (type)=>{
    var el = $(window.targetAppEditor.$el), p = type == "modify" ? el.parent() : el.parents(".post_comment_editor_area"),
    s = p.length ? p.find(".tool_bar .btn_primary.new-post-btn") : [], tt = p.length ? p.find(".tool_bar .btn_primary:eq(0)") : [];
    if(s.length) s.off('click').remove();
    tt.length && tt.removeClass("origin-post-btn").after(
        tt.clone().attr("title", "社区小助手插件已接管").removeClass("origin-post-btn").addClass("new-post-btn").css({display:"inline-block", background:"#eaa000"})
        .on("click", ()=>{
            postType = (baseInfo.doc && baseInfo.doc.Topic == 1) || /develop\/article\/doc/.test(window.location.href) ? 'discuss' : 'answer'
            var content = window.targetAppEditor.getContent().trim();
            // window.postMsg({ cmd:"commentContent", type: "modify", postType, content: (content == "" ? "" : content+window.targetCommentTail)}, "https://developers.weixin.qq.com");
            weChat.sendMessage({
                event: 'commentContent',
                detail: { 
                    api: {
                        method: 'chrome.runtime.sendMessage',
                        param: {
                            type:"hasTailMark",
                            content: (content == "" ? "" : content+window.targetCommentTail),
                            postType,
                            isReply: !1
                        }, 
                        hasCallback: !0 
                    },
                    cmd: 'commentContent'
                }
            }, function(res){
                console.plog('CustomEvent commentContent back : ==== ', res)
                if($('#pre-post-comment-content').length > 0) $('#pre-post-comment-content').remove();
                $('body').append('<div id="pre-post-comment-content" style="display:none;" data-type="'+(type || 'modify')+'"></div>');
                $('#pre-post-comment-content').html(res.result.content);
                doCommentOp()
                // $('body').append('<img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" onload=\'doCommentOp(this)\' style="position:fixed;left:88888px;" />');
            })
        })
    ).addClass("origin-post-btn").hide();
};
window.takeoverReplyCommentOpt = ()=>{
    var el = $(window.targetAppEditor.$el), t = el.parents("li[itemprop=answer]"), p = t.length ? t : el.parents("li[itemprop=comment]"),
    s = p.length ? p.find("button.btn_primary.new-reply-btn") : [], tt = p.length ? p.find("button.btn_primary:eq(0)") : [];
    if(s.length) s.off('click').remove();
    console.plog({el, t, p, s, tt})
    tt.length && tt.removeClass("origin-reply-btn").after(
         tt.clone().attr("title", "社区小助手插件已接管").removeClass("origin-reply-btn").addClass("new-reply-btn").css({display:"inline-block", background:"#eaa000"})
         .on("click", ()=>{
            postType = (baseInfo.doc && baseInfo.doc.Topic == 1) || /develop\/article\/doc/.test(window.location.href) ? 'discuss' : 'answer'
             var p = window.targetAppEditor.$parent, childs = p.$children||[], len = childs.length;
             if(!p.handleReply){
                 for(var i=(len > 0 ? len-1 : -1);i>=0;i--){
                     if(childs[i].handleReply){
                         p = childs[i];
                         break;
                     }
                 };
             };
             var content = (p.inputvalue||"").trim();
             // window.postMessage({ cmd:"commentContent", type: "reply", postType, content: (content == "" ? "" : content+window.targetCommentTail)}, "https://developers.weixin.qq.com");
             weChat.sendMessage({
                event: 'commentContent',
                detail: { 
                    api: {
                        method: 'chrome.runtime.sendMessage',
                        param: {
                            type:"hasTailMark",
                            content: (content == "" ? "" : content+window.targetCommentTail),
                            postType,
                            isReply: !0
                        }, 
                        hasCallback: !0 
                    },
                    cmd: 'commentContent'
                }
            }, function(res){
                console.plog('CustomEvent commentContent back reply : ==== ', res)
                if($('#pre-post-comment-content').length > 0) $('#pre-post-comment-content').remove();
                $('body').append('<div id="pre-post-comment-content" style="display:none;" data-type="reply"></div>');
                $('#pre-post-comment-content').html(res.result.content);
                doCommentOp()
                // $('body').append('<img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" onload=\'doCommentOp(this)\' style="position:fixed;left:88888px;" />');
            })
         })
    ).addClass("origin-reply-btn").hide();
};

function initClickArea(t){
    if( ($(t).hasClass('ql-editor') && $(t).parents('li[itemprop="answer"]').find('.new-modify-op').length) ){
        // 点击的是编辑器 并且 已接管
        return
    }
    console.plog(t);
    (()=>new Promise((rs,rj)=>{
        window.initAppEditorArr();
        rs();
    }))().then(res=>{
        window.targetAppEditor = false;
        if($(t).hasClass("best_comment_discuss")){
            for(var i in window.answerAppRichEditorArrs){
                /*console.plog("answer", i,$(t).parents("li[itemprop='answer']").attr("id"), $(window.answerAppRichEditorArrs[i].el).parents("li").attr("id"),$(window.answerAppRichEditorArrs[i].el));*/
                if($(t).parents("li[itemprop='"+(baseInfo.doc.BlogCategory == "524288" ? 'comment' : 'answer')+"']").attr("id") === $(window.answerAppRichEditorArrs[i].el).parents("li").attr("id")){
                    window.targetAppEditor = window.answerAppRichEditorArrs[i].o;
                    setTimeout(()=>{
                       window.takeoverReplyCommentOpt();
                       // console.plog('takeoverReplyCommentOpt')
                       var rb = $(window.targetAppEditor.$parent.$el).find(".comment_reply_body"), ext = rb.find(".comment_reply_input_box__extend"), tailA = ext.find(".tail-op-a"), rtp = rb.siblings(".reply-preview-tail");
                       if(!tailA.length){
                           ext.append('<a href="javascript:;" class="comment_reply_input_box__extend__item tail-op-a add" title="添加小尾巴"></a>');
                       }
                       if(!rtp.length){
                           rb.after('<div class="reply-preview-tail"></div>');
                       }
                    }, 300);
                    // console.plog("answer", window.targetAppEditor);
                    break;
                }
            }
        }else if($(t).hasClass("post_opr_meta_comment_reply")){
            for(var i in window.replyAppEditorArrs){
                if($(t).parents("li[itemprop='comment']").attr("id") === $(window.replyAppEditorArrs[i].el).attr("id")){
                    window.targetAppEditor = window.replyAppEditorArrs[i].o;
                    setTimeout(()=>{
                       window.takeoverReplyCommentOpt();
                       // console.plog(window.targetAppEditor.$parent)
                       var rb = $(window.targetAppEditor.$parent.$el).find(".comment_reply_body"), ext = rb.find(".comment_reply_input_box__extend"), tailA = ext.find(".tail-op-a"), rtp = rb.siblings(".reply-preview-tail");
                       if(!tailA.length){
                           ext.append('<a href="javascript:;" class="comment_reply_input_box__extend__item tail-op-a add" title="添加小尾巴"></a>');
                       }
                       if(!rtp.length){
                           rb.after('<div class="reply-preview-tail"></div>');
                       }
                    }, 300);
                    // console.plog("comment", window.targetAppEditor);
                    break;
                }
            }
        }else if($(t).hasClass("post_opr_meta")){
            if($(t).find(".edit").length){
                for(var i in window.answerAppRichEditorArrs){
                    if($(t).parents("li[itemprop='answer']").attr("id") === $(window.answerAppRichEditorArrs[i].el).parents("li[itemprop='answer']").attr("id")){
                        window.targetAppEditor = window.answerAppRichEditorArrs[i].o;
                        window.takeoverCreateCommentOpt("modify");
                        // console.plog("answerRichEidt", window.targetAppEditor);
                        break;
                    }
                }
            }
        }else{
            if($(t).parents("#comment-editor").length){
                for(var i in window.answerAppRichEditorArrs){
                    if("comment-editor" === $(window.answerAppRichEditorArrs[i].el).attr("id")){
                        window.targetAppEditor = window.answerAppRichEditorArrs[i].o;
                        window.takeoverCreateCommentOpt();
                        var toolbar = $(window.targetAppEditor.$el).parents(".post_comment_editor_area").find(".ql-toolbar"), tailOp = toolbar.length ? toolbar.find(".tail-op-bar") : !1;
                        toolbar.delegate(".tail-op-bar", "click", function(e){window.addTail(e)});
                        tailOp.length <= 0 && setTimeout(()=>{
                           /*console.plog(tailOp);*/
                           toolbar.append(
                               '<div class="weui-desktop-tooltip__wrp tail-op-bar">'+
                                  '<button class="mode__rich-text-editor__icon add" type="button"></button>'+
                                  '<span class="weui-desktop-tooltip weui-desktop-tooltip__ tail-op-bar-tip"><p class="tail-tips">添加小尾巴</p></span>'+
                               '</div>'
                           );
                        }, 500);
                        toolbar.parents(".comment_editor_box").find(".tool_bar .preview-tail").text().trim() == "" && (
                        toolbar.parents(".comment_editor_box").find(".tool_bar .preview-tail").remove(),
                        toolbar.parents(".comment_editor_box").find(".tool_bar > :first").before('<div class="preview-tail"></div>'));
                        // console.plog("answerRich", window.targetAppEditor);
                        break;
                    }
                }
            }else{
                for(var i in window.answerAppRichEditorArrs){
                    if($(t).parents("li[itemprop='answer']").attr("id") === $(window.answerAppRichEditorArrs[i].el).parents("li[itemprop='answer']").attr("id")){
                        window.targetAppEditor = window.answerAppRichEditorArrs[i].o;
                        window.takeoverCreateCommentOpt("modify");
                        // console.plog("answerRichEidt0", window.targetAppEditor);
                        break;
                    }
                }
            }
        }
    });
}

function doCommentOp(o) { 
    var t = $("#pre-post-comment-content"), d = t.data(), content = t.html();
    if(d.type == "create"){
       $(window.targetAppEditor.$el).find(".ql-editor").html(content);
       window.targetAppEditor.$parent.onCheckAgain("create");
    }else if(d.type == "modify"){
       window.targetCommentTail = "";
       $(window.targetAppEditor.$el).find(".ql-editor").html(content);
       window.targetAppEditor.$parent.onCheckAgain("modify");
    }else if(d.type == "reply"){
       $(window.targetAppEditor.$el).find(".ql-editor").html(content);
       var p = window.targetAppEditor.$parent, childs = p.$children||[], len = childs.length;
       if(!p.handleReply){
           for(var i=(len > 0 ? len-1 : -1);i>=0;i--){
               if(childs[i].handleReply){
                   p = childs[i];
                   break;
               }
           };
       };
       p.handleReply && (p.inputvalue = content);
       p.handleReply && p.handleReply();
    }
    $(".tail-op-bar").find("button").removeClass("del").addClass("add");
    $(".tail-op-bar").find(".tail-tips").html("添加小尾巴");
    $(".tail-op-a").removeClass("del").addClass("add").attr("title", "添加小尾巴");
    $(".preview-tail,.reply-preview-tail").empty();
};



// 黑名单逻辑，对应blankListFunc
var blankList = ['richText', 'link', 'word'];

var blankListFunc = {
    // richText: 富文本
    richText: function () {
        var textSelection = textObj.getTextSelection(), $anchor = textSelection.anchorNode, isRichFlag = false;
        var isRich = function ($node) {
            if (isRichFlag === false && $node !== document.body) {
                var attrContenteditable = $node.getAttribute('contenteditable');
                if (attrContenteditable === '' || attrContenteditable === 'true') {
                    isRichFlag = true;
                } else {
                    isRich($node.parentElement);
                }
            }
        };
        isRich($anchor.parentElement);
        return isRichFlag;
    },
    // link: 超链接
    link: function () {
        var textSelection = textObj.getTextSelection(), $anchor = textSelection.anchorNode, isRichFlag = false;
        if ($anchor.parentElement && $anchor.parentElement.nodeName === 'A') {
            return true;
        } else {
            return false;
        }
    },
    // 纯字母，空格，字符之类的不出(避免和翻译插件的冲突)
    word: function () {
        var text = textObj.getSelectedText();
        if (/[\u4e00-\u9fa5]/.test(text)) {
            return false
        } else {
            if (!/[a-zA-Z]/.test(text)) {
                return false;
            }
            return window.location.host == 'developers.weixin.qq.com' ? false : true;
        }
    }
};

function TextObj () {
    var text;
    // 获取选中的文本句柄，由于是插件，不用兼容IE
    this.getTextSelection = function() {
        var sel = window.getSelection();
        if (sel && sel.focusNode && sel.focusNode.nodeType == 3 && sel.getRangeAt(0).commonAncestorContainer) {
            return sel;
        } else {
            return null;
        }
    };
    this.getSearchEl = function() {
        var el = document.getElementById('wx-popoverWrapId');
        if (el) {
            return el;
        }
        
        el = document.createElement('div');
        el.id = 'wx-popoverWrapId';
        el.setAttribute('class', 'pop-links__wrp');
        el.innerHTML = '<div class="pop-links__list"><div class="pop-links__item">'+
        '   <div class="wx-show-head no-border">'+
        '       <span class="plugin-by">社区小助手</span>'+
        '    </div>'+
        '   <div id="wx-reco-list" class="reco-list__wrp">'+
        '       <ul class="reco__list"></ul>'+
        '   </div>'+
        '   <div class="show-more">'+
        '       <a href="javascript:;" class="reco-item__link ops">复制内容</a>'+
        '       <a href="javascript:;" class="reco-item__link ops">查看更多</a>'+
        '    </div>'+
        '</div></div>'
        document.getElementsByTagName('body')[0].appendChild(el);
        return el;
    };
    this.getSelectedText = function() {
        var textSelection = this.getTextSelection();
        if (textSelection) {
            return textSelection.toString();
        }
    };
    this.getRect = function(){
        var sel = this.getTextSelection(),
        rect = sel.getRangeAt(0).getClientRects()[0]
        return {
            x: (rect.right - rect.width/2)+(document.documentElement.scrollLeft || document.body.scrollLeft),
            y: (rect.top + rect.height/2)+(document.documentElement.scrollTop || document.body.scrollTop)+10
        }
    }
    this.pop = function(screenX, screenY) {
        if (!/community\/develop\/doc/i.test(window.location.href)) {
            return
        }
        text = this.getSelectedText();
        if (!text) {
            return;
        }
        var rect;
        var searchEl = this.getSearchEl();
        var len;
        text = text.replace(/[\n\r\t]/g, '');
        len = this.getTextLength(text);
        if (len && len <= 80) {
            rect = this.getRect()
            var quickSearch = ()=>{
                $.get('//developers.weixin.qq.com/search?action=wxa_search&size=10&query='+text+'&page=1&language=1&type=wxadoc&doc_type=miniprogram', function(res){
                    if(res.base_resp.err_msg == 'ok'){
                        var list = (res.doc_item_list||{item_list:[]}).item_list,
                        tar = $('#wx-reco-list').find('.reco__list'),
                        lis = []
                        tar.empty()
                        for(var i in list){
                            var v = list[i]
                            lis.push('<li class="reco__item">'+
                            '    <a href="'+v.url+'" target="_blank" class="reco-item__link">'+
                            '        <div class="reco-item__hd">'+
                            '            <h5>'+(v.highlight.title[0] || v.title)+'</h5>'+
                            '            <span class="reco-item__group">开发</span>'+
                            '        </div>'+
                            '        <div class="reco-item__bd">'+
                            '            <p class="reco-item__desc">'+(v.highlight.content[0] || v.content)+'</p>'+
                            '        </div>'+
                            '    </a>'+
                            '</li>')
                        }
                        tar.html(lis.join(''))
                        console.plog(tar.find('li').length)
                        tar.find('li').length > 0 ? $('.wx-show-head').removeClass('no-border') : $('.wx-show-head').addClass('no-border')
                    }
                })
            }
            
            weChat.sendMessage({
                event: 'getAutoSearch',
                detail: { api: { method: 'chrome.runtime.sendMessage', param: { type: 'getAutoSearch' }, hasCallback: !0 }, cmd: 'getAutoSearch' }
            }, function(res){
                res.autoSearch && quickSearch()
            })


            searchEl.style.left = rect.x + 'px';
            searchEl.style.top = rect.y + 'px';
            searchEl.style.display = 'block';
            searchEl.style.opacity = '1';

            $(searchEl).data('closeHandle', setTimeout(()=>{
                textObj.close()
            }, 2*1e3))
        }
    };
    this.close = function() {
        if(window.getSelection){
            window.getSelection().removeAllRanges();
        }
        $(this.getSearchEl()).remove()
    }
    this.getTextLength = function(str) {
        var len = str.length;
        var lenStart, lenEnd;
        str = escape(str.replace(/%/g, ''));
        lenStart = str.length;
        str = str.replace(/%/g, '');
        lenEnd = str.length;
        return len + lenStart - lenEnd;
    };
    this.getText = function() {
        return text;
    }
}

var textObj = new TextObj();
var originX, originY, originElt;

document.addEventListener('mousedown', function (e) {
    e = e || event;
    originX = e.pageX || e.clientX;
    originY = e.pageY || e.clientY;
    originElt = e.target || e.srcElement || {};
    // console.plog(originElt, $(originElt).attr('class'), '[button='+e.button+']')

    if($(originElt).parent().hasClass('tail-op-bar') && e.button == 0){
        if($(originElt).hasClass('add')){
            postType = (baseInfo.doc && baseInfo.doc.Topic == 1) || /develop\/article\/doc/.test(window.location.href) ? 'discuss' : 'answer'
            $(originElt).parents(".comment_editor_box").find(".tool_bar .preview-tail").html(currentTailSet[postType]);
        }else if($(originElt).hasClass('del')){
            $(originElt).parents(".comment_editor_box").find(".tool_bar .preview-tail").empty();
        }
    }else if($(originElt).hasClass('tail-op-a') && e.button == 0){
        var tmk = new Date().valueOf()
        $(originElt).attr('tarmark', tmk)
        // console.plog(currentTailSet)
        if($(originElt).hasClass('add')){
            $(originElt).parents(".comment_reply_body").siblings(".reply-preview-tail").html(currentTailSet['reply']);
            window.postMessage({ cmd:"replyAddTail", mark: tmk}, "https://developers.weixin.qq.com");
        }else if($(originElt).hasClass('del')){
            $(originElt).parents(".comment_reply_body").siblings(".reply-preview-tail").empty();
            window.postMessage({ cmd:"replyRemoveTail", mark: tmk }, "https://developers.weixin.qq.com");
        }
    }
}, false);


document.addEventListener('mouseup', function (e) {
    var e = e || event;
    var x = e.x || e.clientX;
    var y = e.y || e.clientY;
    var target = e.target || e.srcElement || {};
    var blankTag = false;
    try {
        // textObj.close();

        if (/input|textarea/i.test(target.nodeName) || /input|textarea/i.test(originElt.nodeName)) {
          return;
        }

        var textSelection = textObj.getTextSelection();

        if (!textSelection) {
            return;
        }

        var boundingClientRect = textSelection.getRangeAt(0).getBoundingClientRect();

        if (boundingClientRect.top === boundingClientRect.bottom || boundingClientRect.left === boundingClientRect.right) {
            return;
        }

        if (originX == x && originY == y) {
          return;
        }

        // 黑名单逻辑(富文本,链接，包含单词的情况)
        blankList.forEach(function (item) {
            if (blankListFunc[item]() === true) {
                blankTag = true;
            }
        });

        if (blankTag) {
            return;
        }

        setTimeout(function () {
          textObj.pop(x, y);
        }, 50);
    } catch(e) {

    }


}, false);
document.addEventListener('click', function (e) {
    var target = e.srcElement || e.target;
    var text = textObj.getText();

    if (target.offsetParent && target.offsetParent.id == 'wx-popoverWrapId') {
      if (target.innerHTML == '查看更多') {
        chrome.extension.sendMessage({cmd: 'search', text: text, host: window.location.host}, (res)=>{
            textObj.close()
        });
      }else if (target.innerHTML == '复制内容') {
        document.execCommand( 'Copy' );
        tips('复制成功')
        textObj.close()
      }
    }
}, false);