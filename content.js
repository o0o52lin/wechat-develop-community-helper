/**
 * @author 有脾气的酸奶
 * @date 2020-1-3 16:58:47
*/
var baseInfo = {}
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
}
;(function(window, document, $) {
    var pluginCode = '<textarea id="plugin-clipboard" style="position:fixed;left:99999px;"></textarea>'+
    '<script id="plugin-script">'+
    'function stopBubbleDefault(e) { '+
    '    console.log(e);'+
    '    e && e.stopPropagation ? e.stopPropagation() : (window.event.cancelBubble = true);'+
    '    e && e.preventDefault ? e.preventDefault() : (window.event.returnValue = false);'+
    '    return false;'+
    '};'+
    'function getBaseInfo() { '+
    '    window.postMessage({ type:"afterGetBaseInfo", data: typeof __INITIAL_STATE__ == "undefined"?{}:{__INITIAL_STATE__}}, "*");'+
    '};'+
    '</script>'
    $('body').append(pluginCode)
    setTimeout(()=>{
        $('body').append('<img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" onload="getBaseInfo()" style="position:fixed;left:88888px;">')
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
            console.log(rect)
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
                

                chrome.storage.local.get('autoSearch', function (ret) {
                    ret.autoSearch && quickSearch()
                })

                searchEl.style.left = rect.x + 'px';
                searchEl.style.top = rect.y + 'px';
                searchEl.style.display = 'block';
                searchEl.style.opacity = '1';

                $(searchEl).data('closeHandle', setTimeout(()=>{
                    textObj.close()
                }, 3e3))
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
    }, false);

    $('body').delegate('#wx-popoverWrapId', 'mouseenter', function(e){
        var hd = parseInt($(this).data('closeHandle'))||0
        $(this).data('closeHandle', 0)
        if(hd) clearTimeout(hd)
    })

    $('body').delegate('#wx-popoverWrapId', 'mouseleave', function(e){
        $(this).data('closeHandle', setTimeout(function () {
          textObj.close()
        }, 1e3))
    })



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
        if(event.data.type == 'afterGetBaseInfo'){
            baseInfo = event.data.data.__INITIAL_STATE__ || {}
            if(/community\/develop(\/(mixflow|article|question))?$/i.test(window.location.href)){
                setTimeout(()=>{
                    new UScore().getScore()
                }, 1000)
            }
        }
    })

})(window, window.document, jQuery);


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
    }else if(message.type == 'copy'){
        copy(message.text)
        tips(message.msg, 1)
    }
})