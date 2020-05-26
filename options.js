var BGPage = chrome.extension.getBackgroundPage();
var pluginInfo = chrome.runtime.getManifest()
var blockUsers =  BGPage.getBlockUsers()
console.log(BGPage,blockUsers)
$('.plugin-name').html(pluginInfo.name)
$('#versionNumber').html(pluginInfo.version)
$('.year').html(new Date().getFullYear())
$('#autoSearch').prop('checked', Boolean(BGPage.autoSearch))
var initBlockUsers = async function (){
	var bus = []

	blockUsers = await blockUsers
	for (var i in blockUsers) {
		bus.push('<span class="block-one"><a title="访问其主页" href="https://developers.weixin.qq.com/community/personal/'+i+'" target="_blank">'+blockUsers[i]+'</a><span class="del" title="取消屏蔽" data-openid="'+i+'">x</span></span>')
	}
	$('.blockOnes').empty().html(bus.join(''))
}
initBlockUsers()
var showTail = function(type){
	var answer = $('.commentTailArea textarea[name=answer]').val().trim() || BGPage.commentTailSetting.default.answer,
		reply = $('.commentTailArea textarea[name=reply]').val().trim() || BGPage.commentTailSetting.default.reply,
		discuss = $('.commentTailArea textarea[name=discuss]').val().trim() || BGPage.commentTailSetting.default.discuss
	$('.commentTailArea [name=answer]').val(BGPage.commentTailSetting.current.answer).attr('placeholder', BGPage.commentTailSetting.default.answer)
	$('.commentTailArea [name=reply]').val(BGPage.commentTailSetting.current.reply).attr('placeholder', BGPage.commentTailSetting.default.reply)
	$('.commentTailArea [name=discuss]').val(BGPage.commentTailSetting.current.discuss).attr('placeholder', BGPage.commentTailSetting.default.discuss)
	$('.tail-preview').html(type == 'reply' ? reply : (type == 'discuss' ? discuss : answer))
},
saveTail = function(){
	var answer = $('.commentTailArea textarea[name=answer]').val().trim() || BGPage.commentTailSetting.default.answer,
		reply = $('.commentTailArea textarea[name=reply]').val().trim() || BGPage.commentTailSetting.default.reply,
		discuss = $('.commentTailArea textarea[name=discuss]').val().trim() || BGPage.commentTailSetting.default.discuss
	BGPage.updateCommentTailSetting({answer,reply,discuss});
}
$('#autoSearch').on('click', (e)=>{
	BGPage.updateAutoSearch($(e.currentTarget).prop('checked'))
})
$('.commentTailArea textarea').on('focus input', function(e){
	var t = this, val = $(t).val().trim()
	
	showTail($(t).attr('name'))
})
$('[name=blockUser]').on('blur', function(e){
	var t = $(this), val = t.val().trim(), bus = []

	if(val == '') return
	var ps = val.split(/community\/personal\/([^\/\?]+)/) || []
	var openid = ps[1] || (val.length > 0 && val.length < 64 ? val : '')
	if(openid){
		var chk = $('.blockOnes').find('[data-openid="'+openid+'"]')
		if(chk.length) {
			t.val('')
			alert('该用户已存在屏蔽列表')
			return
		}
		$.get('https://developers.weixin.qq.com/community/ngi/personal/'+openid+'?random='+Math.random(), function(res){
			res.data && res.data.userInfo && res.data.userInfo.openid && (
				blockUsers[res.data.userInfo.openid] = res.data.userInfo.nickname,
				$('.blockOnes').append('<span class="block-one"><a title="访问其主页" href="https://developers.weixin.qq.com/community/personal/'+res.data.userInfo.openid+'" target="_blank">'+res.data.userInfo.nickname+'</a><span class="del" title="取消屏蔽" data-openid="'+res.data.userInfo.openid+'">x</span></span>')
			)
			t.val('')
		}, 'json')
	}else{
		t.val('')
		alert('填写其主页链接或openid')
	}
})
$('.blockOnes').on('click', '.block-one .del', function(e){
	if(id = $(e.currentTarget).data('openid') || false){
		$(e.currentTarget).parent().remove()
		console.log(blockUsers)
		delete blockUsers[id]
		console.log(blockUsers)
	}
})

$('.submit.btn_primary').on('click', function(e){
	var t = $(this)
	saveTail()
	BGPage.saveBlockUsers(blockUsers)
	t.html('保存成功')
	setTimeout(()=>{
		window.location.reload()
	}, 1500)
	console.log(blockUsers)
})
showTail()




$('[name=common-reply-list]').prop('checked', BGPage.commonReplyListEnable).on('click', (e)=>{
	var t = e.currentTarget
	console.log(e.currentTarget, $(t).prop('checked'))
	BGPage.updateCommonReplyListState($(e.currentTarget).prop('checked'))
})

// $('.common-reply-item').on('input', function(e){
// 	console.log($('.common-reply-list-form'))
// })

// BGPage.commonReplyListEnable ? $(".common-reply-list").show() : $(".common-reply-list").hide()
// $('[name="replyItem[codetip]"]').val(BGPage.codeTipSetting.current||BGPage.codeTipSetting.default).attr('placeholder', BGPage.codeTipSetting.current||BGPage.codeTipSetting.default)