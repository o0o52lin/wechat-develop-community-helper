/**
 * @author 有脾气的酸奶
 * @date 2020-1-3 16:58:47
*/
var baseInfo = {}, pageDataInfo = {}, blockUsers = {}, postType = 'answer', isReply = false, currentCommentContent = '', currentTailSet = {answer:'', reply: '', discuss:''}
var tips = function(msg, type, time){
    type = typeof type == 'undefined' ? 1 : type
    $('#wx-alert').remove()
    $('body').append('<div id="wx-alert" class="weui-toptips '+(!type?'weui-toptips_error':'weui-toptips_success')+'" style="z-index: 10005;"><div class="weui-toptips__inner">'+msg+'</div></div>')
    setTimeout(()=>{
        $('#wx-alert').remove()
    }, time||2e3)
}, UScore = function (openid) {
    this.token = baseInfo.token || getCookie('server_token') || '';
    this.openid = openid ? openid : (baseInfo.user && baseInfo.user.openid ? baseInfo.user.openid : '');
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
},getUserInfo = (openid)=>{
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
}, copy = function (text) {
    var clipElt = document.getElementById("plugin-clipboard");
    clipElt.value = text;
    clipElt.select();
    document.execCommand("Copy");
    window.getSelection && window.getSelection().removeAllRanges();
    clipElt.value = '';
}, chkVersion = ()=>{
    $.get('//developers.weixin.qq.com/community/develop/article/doc/000caac50f4a38351f19596b35c813', function(res){
        var e = $(res).find('p[title="plugin-hepler-info"]'), info = e.length ? e.text().trim() : '{}', npv = {}, opv = chrome.runtime.getManifest()
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
            var c = compare_version(npv.version, opv.version)
            if(c != null && c > 0){
                var tip = '<a href="javascript:;" class="view-new-version cls page_mod_blog_panel_foot_item" title="查看更新内容" style="background: linear-gradient(45deg, #E91E63, #F44336, #FFEB3B);font-size: 10px;color: transparent;-webkit-background-clip: text;">插件有更新哦~</a>'+
                    '<a class="cls page_mod_blog_panel_foot_item" href="https://github.com/o0o52lin/wechat-develop-community-helper" target="_blank" style="color: rgb(7, 193, 96);font-size: 10px;">github地址</a>'
                $('.new-version-tip').html(tip)
                .css({display:'flex'})
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
            }

            
        }catch(e){
            data = {}
            console.error(e)
        }
    })
}

;(function(window, document, $) {
    var pluginCode = '<style id="plugin-style">.plg-hide{display:none !important;}</style>'+
    '<textarea id="plugin-clipboard" style="position:fixed;left:99999px;"></textarea>'+
    '<script id="plugin-script">'+
    'window.tips = function(msg, type, time){'+
    '    type = typeof type == \'undefined\' ? 1 : type;'+
    '    $(\'#wx-alert\').remove();'+
    '    $(\'body\').append(\'<div id="wx-alert" class="weui-toptips \'+(!type?\'weui-toptips_error\':\'weui-toptips_success\')+\'" style="z-index: 10005;"><div class="weui-toptips__inner">\'+msg+\'</div></div>\');'+
    '    setTimeout(()=>{'+
    '        $(\'#wx-alert\').remove();'+
    '    }, time||2e3);'+
    '};'+
    'function stopBubbleDefault(e) { '+
    '    e && e.stopPropagation ? e.stopPropagation() : (window.event.cancelBubble = true);'+
    '    e && e.preventDefault ? e.preventDefault() : (window.event.returnValue = false);'+
    '    return false;'+
    '};'+
    'function getBaseInfo(o) { '+
    '    intervalFunction();'+
    '    window.postMessage({ cmd:"afterGetBaseInfo", data: typeof __INITIAL_STATE__ == "undefined"?{}:{__INITIAL_STATE__}}, "https://developers.weixin.qq.com");'+
    '    document.body.removeChild(o);'+
    '};'+
    'function doBlockUser(o, users) { '+
    '    var isCommentBlock = /community\\/develop\\/doc/.test(location.href) ? true : false;'+
    '    window.postMessage({ cmd:"doBlockUser", isCommentBlock, blockUsers:users||{}, data: typeof __INITIAL_STATE__ == "undefined"?{}:{__INITIAL_STATE__}}, "https://developers.weixin.qq.com");'+
    '    document.body.removeChild(o);'+
    '};'+
    'window.targetAppEditor = false;'+
    'window.targetCommentTail = "";'+
    'window.loopAppEditorArr=(tar)=>{'+
    '   var tar = tar||window.app.$children;'+
    '   for(var i in tar){'+
    '       if($(tar[i].$el).hasClass("edui-default")){/*console.log(tar[i]);*/};'+
    '       $(tar[i].$el).hasClass("mode__rich-text-editor") && window.answerAppRichEditorArrs.push({uid:tar[i]._uid, el:tar[i].$el, o:tar[i]});'+
    '       $(tar[i].$el).hasClass("frm_control_group_textarea__focus") && window.answerAppEditorArrs.push({uid:tar[i]._uid, el:tar[i].$el, o:tar[i]});'+
    '       $(tar[i].$el).hasClass("js_post_comment_item") && window.replyAppEditorArrs.push({uid:tar[i]._uid, el:tar[i].$el, o:tar[i]});'+
    '       if(tar[i].$children.length){'+
    '           window.loopAppEditorArr(tar[i].$children);'+
    '       }'+
    '   }'+
    '};'+
    'window.initAppEditorArr = function() {'+
    '   window.answerAppRichEditorArrs = [];'+
    '   window.answerAppEditorArrs = [];'+
    '   window.replyAppEditorArrs = [];'+
    '   window.loopAppEditorArr();'+
    '};'+
    'window.removeTail = function(event) {'+
    '   window.targetCommentTail = "";'+
    '   $(event.currentTarget).find("button").removeClass("del").addClass("add");'+
    '   $(event.currentTarget).off("click").on("click", function(e){window.addTail(e)}).find(".tail-tips").html("添加小尾巴");'+
    // '   tips("已移除小尾巴");'+
    '   stopBubbleDefault(event);'+
    '};'+
    'window.addTail = function(event) {'+
    '   window.targetCommentTail = "[Tail]";'+
    '   $(event.currentTarget).find("button").removeClass("add").addClass("del");'+
    '   $(event.currentTarget).off("click").on("click", function(e){window.removeTail(e)}).find(".tail-tips").html("移除当前小尾巴");'+
    // '   tips("已添加小尾巴");'+
    '   stopBubbleDefault(event);'+
    '};'+
    'window.replyRemoveTail = function(o) {'+
    '   window.targetCommentTail = "";'+
    '   $(o).removeClass("del").addClass("add").attr("title", "添加小尾巴");'+
    '};'+
    'window.replyAddTail = function(o) {'+
    '   window.targetCommentTail = "[Tail]";'+
    '   $(o).removeClass("add").addClass("del").attr("title", "移除小尾巴");'+
    '};'+
    'window.addEventListener("message", function(event) {'+
    '    if(event.data.cmd == "replyAddTail"){'+
    '        window.replyAddTail(".tail-op-a[tarmark="+event.data.mark+"]");'+
    '    }else if(event.data.cmd == "replyRemoveTail"){'+
    '        window.replyRemoveTail(".tail-op-a[tarmark="+event.data.mark+"]");'+
    '    }'+
    '});'+
    'window.takeoverClickModifyCommentOpt = ()=>{'+
    '    var takeover = (i, v)=>{'+
    '        var s = $(v).parent().parent().find("a.post_opr_meta.new-modify-op");'+
    '        if($(v).siblings("span:eq(0)").text().trim() == "编辑"){'+
    '            if(s.length) s.remove();'+
    '            t = $(v).parents("a.post_opr_meta");'+
    '            t.removeClass("origin-modify-op").after('+
    '                t.clone().attr("title", "社区小助手插件已接管").removeClass("origin-modify-op").addClass("new-modify-op").css({display:"inline-block", color:"#eaa000"})'+
    '                .on("click", ()=>{'+
    '                    var hasTail = !1, tmp = __INITIAL_STATE__ && __INITIAL_STATE__.doc && __INITIAL_STATE__.doc.Comments  && (__INITIAL_STATE__.doc.Comments.rows||[]);'+
    '                    for(var i in tmp){'+
    '                        if($(v).parents("li[itemprop=\'answer\']").attr("id") == tmp[i].CommentId){'+
    '                            var conEl = $("<div>"+tmp[i].Content+"</div>"), tailEl = conEl.find("p[title=tail]");'+
    '                            hasTail = /display:([ ]+)?tail;/.test(tmp[i].Content) || tailEl.length;'+
    '                            window.targetCommentTail = hasTail ? tailEl[0].outerHTML : "";'+
    '                            hasTail && tailEl.remove();'+
    '                            hasTail && (__INITIAL_STATE__.doc.Comments.rows[i].Content = conEl.html());'+
    '                            break;'+
    '                        }'+
    '                    }'+
    '                    for(var i in window.answerAppRichEditorArrs){'+
    '                        if(window.answerAppRichEditorArrs[i].o.$parent.comment.CommentId == $(v).parents("li[itemprop=answer]").attr("id")){'+
    '                            window.answerAppRichEditorArrs[i].o.$parent.onStartModify();'+
    '                            var toolbar = $(window.answerAppRichEditorArrs[i].o.$el).parents(".post_comment_editor_area").find(".ql-toolbar"), tailOp = toolbar.length ? toolbar.find(".tail-op-bar") : !1;'+
    '                            toolbar.delegate(".tail-op-bar", "click", function(e){hasTail ? window.removeTail(e) : window.addTail(e)});'+
    '                            tailOp.length <= 0 && setTimeout(()=>{'+
    '                               /*console.log(tailOp);*/'+
    '                               hasTail && toolbar.parents(".post_editor_box").find(".tool_bar > :first").before(\'<div class="preview-tail">\'+window.targetCommentTail+\'</div>\');'+
    '                               if(hasTail && !$(".preview-tail").find("span[title=tail]").length){$(".preview-tail")}'+
    '                               toolbar.append(\''+
    '                                   <div class="weui-desktop-tooltip__wrp tail-op-bar">'+
    '                                      <button class="mode__rich-text-editor__icon \'+(hasTail ? \'del\' : \'add\')+\'" type="button"></button>'+
    '                                      <span class="weui-desktop-tooltip weui-desktop-tooltip__ tail-op-bar-tip"><p class="tail-tips">\'+(hasTail ? \'移除当前小尾巴\' : \'添加小尾巴\')+\'</p></span>'+
    '                                   </div>'+
    '                               \');'+
    '                            }, 500);'+
    '                            break;'+
    '                        }'+
    '                    }'+
    '                })'+
    '            ).addClass("origin-modify-op").hide();'+
    '        }'+
    '    };'+
    '    $("body").delegate(".post_comment_opr a.post_opr_meta[class=post_opr_meta]", "mouseenter", (e)=>{'+
    '       var t = e.currentTarget.firstChild;'+
    '       if($(e.currentTarget).hasClass("new-modify-op")){'+
    '           return;'+
    '       }'+
    '       takeover(null, t);'+
    '       window.initAppEditorArr();'+
    '    });'+
    '    $("a.post_opr_meta i.edit").each(takeover);'+
    '};'+
    'window.takeoverCreateCommentOpt = (type)=>{'+
    '    var el = $(window.targetAppEditor.$el), p = type == "modify" ? el.parent() : el.parents(".post_comment_editor_area"),'+
    '    s = p.length ? p.find(".tool_bar .btn_primary.new-post-btn") : [], tt = p.length ? p.find(".tool_bar .btn_primary:eq(0)") : [];'+
    '    if(s.length) s.remove();'+
    '    tt.length && tt.removeClass("origin-post-btn").after('+
    '         tt.clone().attr("title", "社区小助手插件已接管").removeClass("origin-post-btn").addClass("new-post-btn").css({display:"inline-block", background:"#eaa000"})'+
    '         .on("click", ()=>{'+
    '             var content = window.targetAppEditor.getContent().trim();'+
    '             window.postMessage({ cmd:"commentContent", type: "modify", content: (content == "" ? "" : content+window.targetCommentTail)}, "https://developers.weixin.qq.com");'+
    '         })'+
    '    ).addClass("origin-post-btn").hide();'+
    '};'+
    'window.takeoverReplyCommentOpt = ()=>{'+
    '    var el = $(window.targetAppEditor.$el), t = el.parents("li[itemprop=answer]"), p = t.length ? t : el.parents("li[itemprop=comment]"),'+
    '    s = p.length ? p.find("button.btn_primary.new-reply-btn") : [], tt = p.length ? p.find("button.btn_primary:eq(0)") : [];'+
    '    if(s.length) s.remove();'+
    '    tt.length && tt.removeClass("origin-reply-btn").after('+
    '         tt.clone().attr("title", "社区小助手插件已接管").removeClass("origin-reply-btn").addClass("new-reply-btn").css({display:"inline-block", background:"#eaa000"})'+
    '         .on("click", ()=>{'+
    '             var p = window.targetAppEditor.$parent, childs = p.$children||[], len = childs.length;'+
    '             if(!p.handleReply){'+
    '                 for(var i=(len > 0 ? len-1 : -1);i>=0;i--){'+
    '                     if(childs[i].handleReply){'+
    '                         p = childs[i];'+
    '                         break;'+
    '                     }'+
    '                 };'+
    '             };'+
    '             var content = (p.inputvalue||"").trim();'+
    '             window.postMessage({ cmd:"commentContent", type: "reply", content: (content == "" ? "" : content+window.targetCommentTail)}, "https://developers.weixin.qq.com");'+
    '         })'+
    '    ).addClass("origin-reply-btn").hide();'+
    '};'+
    'function initClickReply() { '+
    '    $("body").delegate(".js_comment.best_comment_discuss,.js_comment.post_opr_meta_comment_reply,.mode__rich-text-editor .ql-editor,.post_comment_opr .post_opr_meta", "click", function(e){'+
    '        var t = this;'+
    '        (()=>{return new Promise((rs,rj)=>{'+
    '            window.initAppEditorArr();'+
    '            rs();'+
    '        })})().then(res=>{'+
    '            /*console.log("initClickReply", window.answerAppEditorArrs);*/'+
    '            window.targetAppEditor = false;'+
    '            if($(t).hasClass("best_comment_discuss")){'+
    '                for(var i in window.answerAppRichEditorArrs){'+
    '                    /*console.log("answer", i,$(t).parents("li[itemprop=\'answer\']").attr("id"), $(window.answerAppRichEditorArrs[i].el).parents("li").attr("id"),$(window.answerAppRichEditorArrs[i].el));*/'+
    '                    if($(t).parents("li[itemprop=\'answer\']").attr("id") === $(window.answerAppRichEditorArrs[i].el).parents("li").attr("id")){'+
    '                        window.targetAppEditor = window.answerAppRichEditorArrs[i].o;'+
    '                        setTimeout(()=>{'+
    '                           window.takeoverReplyCommentOpt();'+
    '                           var rb = $(window.targetAppEditor.$parent.$el).find(".comment_reply_body"), ext = rb.find(".comment_reply_input_box__extend"), tailA = ext.find(".tail-op-a"), rtp = rb.siblings(".reply-preview-tail");'+
    '                           if(!tailA.length){'+
    '                               ext.append(\'<a href="javascript:;" class="comment_reply_input_box__extend__item tail-op-a add" title="添加小尾巴"></a>\');'+
    '                           }'+
    '                           if(!rtp.length){'+
    '                               rb.after(\'<div class="reply-preview-tail"></div>\');'+
    '                           }'+
    '                        }, 300);'+
    '                        /*console.log("answer", window.targetAppEditor);*/'+
    '                        break;'+
    '                    }'+
    '                }'+
    '            }else if($(t).hasClass("post_opr_meta_comment_reply")){'+
    '                for(var i in window.replyAppEditorArrs){'+
    '                    if($(t).parents("li[itemprop=\'comment\']").attr("id") === $(window.replyAppEditorArrs[i].el).attr("id")){'+
    '                        window.targetAppEditor = window.replyAppEditorArrs[i].o;'+
    '                        setTimeout(()=>{'+
    '                           window.takeoverReplyCommentOpt();'+
    '                           var rb = $(window.targetAppEditor.$parent.$el).find(".comment_reply_body"), ext = rb.find(".comment_reply_input_box__extend"), tailA = ext.find(".tail-op-a"), rtp = rb.siblings(".reply-preview-tail");'+
    '                           if(!tailA.length){'+
    '                               ext.append(\'<a href="javascript:;" class="comment_reply_input_box__extend__item tail-op-a add" title="添加小尾巴"></a>\');'+
    '                           }'+
    '                           if(!rtp.length){'+
    '                               rb.after(\'<div class="reply-preview-tail"></div>\');'+
    '                           }'+
    '                        }, 300);'+
    '                        /*console.log("comment", window.targetAppEditor);*/'+
    '                        break;'+
    '                    }'+
    '                }'+
    '            }else if($(t).hasClass("post_opr_meta")){'+
    '                if($(t).find(".edit").length){'+
    '                    for(var i in window.answerAppRichEditorArrs){'+
    '                        if($(t).parents("li[itemprop=\'answer\']").attr("id") === $(window.answerAppRichEditorArrs[i].el).parents("li[itemprop=\'answer\']").attr("id")){'+
    '                            window.targetAppEditor = window.answerAppRichEditorArrs[i].o;'+
    '                            window.takeoverCreateCommentOpt("modify");'+
    '                            /*console.log("answerRichEidt", window.targetAppEditor);*/'+
    '                            break;'+
    '                        }'+
    '                    }'+
    '                }'+
    '            }else{'+
    '                if($(t).parents("#comment-editor").length){'+
    '                    for(var i in window.answerAppRichEditorArrs){'+
    '                        if("comment-editor" === $(window.answerAppRichEditorArrs[i].el).attr("id")){'+
    '                            window.targetAppEditor = window.answerAppRichEditorArrs[i].o;'+
    '                            window.takeoverCreateCommentOpt();'+
    '                            var toolbar = $(window.targetAppEditor.$el).parents(".post_comment_editor_area").find(".ql-toolbar"), tailOp = toolbar.length ? toolbar.find(".tail-op-bar") : !1;'+
    '                            toolbar.delegate(".tail-op-bar", "click", function(e){window.addTail(e)});'+
    '                            tailOp.length <= 0 && setTimeout(()=>{'+
    '                               /*console.log(tailOp);*/'+
    '                               toolbar.append(\''+
    '                                   <div class="weui-desktop-tooltip__wrp tail-op-bar">'+
    '                                      <button class="mode__rich-text-editor__icon add" type="button"></button>'+
    '                                      <span class="weui-desktop-tooltip weui-desktop-tooltip__ tail-op-bar-tip"><p class="tail-tips">添加小尾巴</p></span>'+
    '                                   </div>'+
    '                               \');'+
    '                            }, 500);'+
    '                            toolbar.parents(".comment_editor_box").find(".tool_bar .preview-tail").text().trim() == "" && ('+
    '                            toolbar.parents(".comment_editor_box").find(".tool_bar .preview-tail").remove(),'+
    '                            toolbar.parents(".comment_editor_box").find(".tool_bar > :first").before(\'<div class="preview-tail"></div>\'));'+
    '                            /*console.log("answerRich", window.targetAppEditor);*/'+
    '                            break;'+
    '                        }'+
    '                    }'+
    '                }else{'+
    '                    for(var i in window.answerAppRichEditorArrs){'+
    '                        if($(t).parents("li[itemprop=\'answer\']").attr("id") === $(window.answerAppRichEditorArrs[i].el).parents("li[itemprop=\'answer\']").attr("id")){'+
    '                            window.targetAppEditor = window.answerAppRichEditorArrs[i].o;'+
    '                            window.takeoverCreateCommentOpt("modify");'+
    '                            /*console.log("answerRichEidt0", window.targetAppEditor);*/'+
    '                            break;'+
    '                        }'+
    '                    }'+
    '                }'+
    '            }'+
    '        });'+
    '    });'+
    '};'+
    'function intervalFunction() { '+
    '    var h = setInterval(()=>{'+
    '        if(window.app && window.app.$children){'+
    '           clearInterval(h);'+
    '           initClickReply();'+
    '           setTimeout(()=>{'+
    '               window.initAppEditorArr();'+
    '               window.takeoverClickModifyCommentOpt();'+
    '           }, 1000);'+
    '        }'+
    '    }, 1000);'+
    '};'+
    'function doCommentOp(o) { '+
    '    var t = $("#pre-post-comment-content"), d = t.data(), content = t.html();'+
    // '    if(content == "" || !d.type){'+
    // '       console.log("content or type is empty", content, d);'+
    // '       return;'+
    // '    }'+
    '    if(d.type == "create"){'+
    '       $(window.targetAppEditor.$el).find(".ql-editor").html(content);'+
    '       window.targetAppEditor.$parent.onCheckAgain("create");'+
    '    }else if(d.type == "modify"){'+
    '       window.targetCommentTail = "";'+
    '       $(window.targetAppEditor.$el).find(".ql-editor").html(content);'+
    '       window.targetAppEditor.$parent.onCheckAgain("modify");'+
    '    }else if(d.type == "reply"){'+
    '       $(window.targetAppEditor.$el).find(".ql-editor").html(content);'+
    '       var p = window.targetAppEditor.$parent, childs = p.$children||[], len = childs.length;'+
    '       if(!p.handleReply){'+
    '           for(var i=(len > 0 ? len-1 : -1);i>=0;i--){'+
    '               if(childs[i].handleReply){'+
    '                   p = childs[i];'+
    '                   break;'+
    '               }'+
    '           };'+
    '       };'+
    '       p.handleReply && (p.inputvalue = content);'+
    '       p.handleReply && p.handleReply();'+
    '    }'+
    '    $(".tail-op-bar").find("button").removeClass("del").addClass("add");'+
    '    $(".tail-op-bar").find(".tail-tips").html("添加小尾巴");'+
    '    $(".tail-op-a").removeClass("del").addClass("add").attr("title", "添加小尾巴");'+
    '    $(".preview-tail,.reply-preview-tail").empty();'+
    '};'+
    '</script>'
    $('body').append(pluginCode)
    setTimeout(()=>{
        $('body').append('<img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" onload="getBaseInfo(this)" style="position:fixed;left:88888px;" />')
    }, 1000)

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
                            list.forEach((v, i)=>{
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
                            })
                            tar.html(lis.join(''))
                        }
                    })
                }
                

                chrome.extension.sendMessage({cmd: 'getAutoSearch'}, (res)=>{
                    res.autoSearch && quickSearch()
                });

                searchEl.style.left = rect.x + 'px';
                searchEl.style.top = rect.y + 'px';
                searchEl.style.display = 'block';
                searchEl.style.opacity = '1';

                $(searchEl).data('closeHandle', setTimeout(()=>{
                    textObj.close()
                }, 1e3))
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
        // console.log(originElt, $(originElt).attr('class'), '[button='+e.button+']')

        if($(originElt).parent().hasClass('tail-op-bar') && e.button == 0){
            if($(originElt).hasClass('add')){
                $(originElt).parents(".comment_editor_box").find(".tool_bar .preview-tail").html(currentTailSet[postType]);
            }else if($(originElt).hasClass('del')){
                $(originElt).parents(".comment_editor_box").find(".tool_bar .preview-tail").empty();
            }
        }else if($(originElt).hasClass('tail-op-a') && e.button == 0){
            var tmk = new Date().valueOf()
            $(originElt).attr('tarmark', tmk)
            // console.log(currentTailSet)
            if($(originElt).hasClass('add')){
                $(originElt).parents(".comment_reply_body").siblings(".reply-preview-tail").html(currentTailSet['reply']);
                window.postMessage({ cmd:"replyAddTail", mark: tmk}, "https://developers.weixin.qq.com");
            }else if($(originElt).hasClass('del')){
                $(originElt).parents(".comment_reply_body").siblings(".reply-preview-tail").empty();
                window.postMessage({ cmd:"replyRemoveTail", mark: tmk }, "https://developers.weixin.qq.com");
            }
        }
    }, false);

    $('body').delegate('#wx-popoverWrapId', 'mouseenter', function(e){
        var hd = parseInt($(this).data('closeHandle'))||0
        $(this).data('closeHandle', 0)
        if(hd) clearTimeout(hd)
    })

    $('body').delegate('#wx-popoverWrapId', 'mouseleave', function(e){
        $(this).data('closeHandle', setTimeout(function () {
          textObj.close()
        }, 500))
    })

    $('body').delegate('.new-post-btn', 'click', function(e){
        // console.log(currentCommentContent,e)
        currentCommentContent != '' && chrome.runtime.sendMessage({type:"hasTailMark", content:currentCommentContent}, function(res){
            // $(window.targetAppEditor.getContent()).find(".ql-editor").html("123");
            // setTimeout(v.click(), 500);
        });
    })

    chrome.runtime.sendMessage({type:"getCurrentTail"}, function(res){
        currentTailSet = res.tail
        // console.log('currentTailSet', currentTailSet)
    });

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


    window.addEventListener("message", function(event) {
        if(event.data.cmd == 'afterGetBaseInfo'){
            baseInfo = event.data.data.__INITIAL_STATE__ || {}
            postType = baseInfo.doc && baseInfo.doc.Topic == 1 ? 'discuss' : 'answer'

            if(/community\/develop(\/(mixflow|article|question))?$/i.test(window.location.href)){
                setTimeout(()=>{
                    new UScore().getScore()
                }, 1000)
            }
        }else if(event.data.cmd == 'commentContent'){
            currentCommentContent = event.data.content
            isReply = event.data.type == 'reply' ? true : false
            // console.log(currentCommentContent)
            chrome.runtime.sendMessage({type:"hasTailMark", content:currentCommentContent, postType, isReply}, function(res){
                // console.log(res, event.data)
                if($('#pre-post-comment-content').length > 0) $('#pre-post-comment-content').remove();
                $('body').append('<div id="pre-post-comment-content" style="display:none;" data-type="'+event.data.type+'"></div>');
                $('#pre-post-comment-content').html(res.result.content);
                $('body').append('<img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" onload=\'doCommentOp(this)\' style="position:fixed;left:88888px;" />');
            });
        }else if(event.data.cmd == 'update'){
            console.log(event.data)
        }else if(event.data.cmd == 'doBlockUser'){
            pageDataInfo = event.data.data.__INITIAL_STATE__ || {}
            blockUsers = event.data.blockUsers || blockUsers
            // console.log('blockUsers', event.data.blockUsers)
            if(!event.data.isCommentBlock){
                // 全部标签
                var allRows = pageDataInfo.mixflowList ? (pageDataInfo.mixflowList.rows.length ? pageDataInfo.mixflowList.rows : []) : [],
                // 文章标签
                artRow = pageDataInfo.articleList ? (pageDataInfo.articleList.rows.length ? pageDataInfo.articleList.rows : []) : [],
                // 问答标签
                quesRows = pageDataInfo.develop ? (pageDataInfo.develop.hasOwnProperty(1) && pageDataInfo.develop[1].rows.length ? pageDataInfo.develop[1].rows : []) : [],
                hideOrshow = function(row){
                    var tar = $('li[data-doc-id="'+row.DocId+'"]'), _tar = false
                    if(!tar.length) return
                    if(row.OpenId in blockUsers && tar.attr('force-show') != 1){
                        _tar = tar.clone()
                        _tar.children().addClass('plg-hide')
                        _tar.find('>h2').removeClass('plg-hide').html('<a href="javascript:;" style="color: rgb(234, 160, 0);">该条已被你屏蔽(点击查看)</a>').parent()
                        .attr('title', blockUsers[row.OpenId]).on('click', function(e){
                            $(this).remove()
                            $('li[data-doc-id="'+row.DocId+'"]').attr('force-show', 1).removeClass('plg-hide')
                        })

                        tar.addClass('plg-hide')
                        tar.before(_tar)
                    }else{
                        !(row.OpenId in blockUsers) && tar.hasClass('plg-hide') && tar.removeClass('plg-hide')
                    }
                    
                },
                rows = allRows
                for (var i in rows) hideOrshow(rows[i])
                rows = artRow
                for (var i in rows) hideOrshow(rows[i])
                rows = quesRows
                for (var i in rows) hideOrshow(rows[i])
            }else{
                // 评论列表
                var commentRows = pageDataInfo.doc && pageDataInfo.doc.Comments ? (pageDataInfo.doc.Comments.rows.length ? pageDataInfo.doc.Comments.rows : []) : [],
                hideOrshow = function(row){
                    var tar = $('li[id="'+row.CommentId+'"]')
                    if(!tar.length) return
                    if(row.OpenId in blockUsers && tar.attr('force-show') != 1){
                        tar.addClass('plg-hide')
                    }else{
                        !(row.OpenId in blockUsers) && tar.hasClass('plg-hide') && tar.removeClass('plg-hide')
                    }
                    
                }
                // console.log('commentRows', commentRows)
                for (var i in commentRows) {
                    if(commentRows[i].OpenId in blockUsers){
                        $('li[id="'+commentRows[i].CommentId+'"]').css({display:'none'})
                    }else{
                        var subCommentRows = commentRows[i].Sub && commentRows[i].Sub.length ? commentRows[i].Sub : []
                        // console.log('subCommentRows', subCommentRows)
                        for (var i in subCommentRows) {
                            // console.log(subCommentRows[i].OpenId,' in ', blockUsers, subCommentRows[i].OpenId in blockUsers)
                            subCommentRows[i].OpenId in blockUsers && $('li[id="'+subCommentRows[i].CommentId+'"]').css({display:'none'})
                        }
                    }
                }
            }


        }
        
    })

})(window, window.document, jQuery);

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)
{
    if(message.type == 'doBlockUsers'){
        blockUsers = message.users || {}
    }
});

chrome.extension.onRequest.addListener(async function(message, sender, sendResponse) {
    if(message.type == 'getUserScore'){
        if(!message.openid) return
        var user = await getUserInfo(message.openid)
        var uScore = new UScore(message.openid)
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
        uScore.getScore(message.openid, html, (data)=>{
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
    }else if(message.type == 'alert'){
        tips(message.msg, message.ok)
        if(message.op == 'tail'){
            currentTailSet = message.tail
        }
    }else if(message.type == 'copy'){
        copy(message.text)
        tips(message.msg, 1)
    }else if(message.type == 'updateTail'){
        currentTailSet = message.tail
    }
})