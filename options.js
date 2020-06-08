var BGPage = chrome.extension.getBackgroundPage();
var pluginInfo = chrome.runtime.getManifest()
var blockUsers =  BGPage.getBlockUsers()
var currentTail = BGPage.commentTailSetting.current

console.log(BGPage,blockUsers)
$('.plugin-name').html(pluginInfo.name)
$('#versionNumber').html(pluginInfo.version)
$('.year').html(new Date().getFullYear())
$('#autoSearch').prop('checked', Boolean(BGPage.autoSearch))
$('#showLoading').prop('checked', Boolean(BGPage.showLoading))
$('#filterSearch').prop('checked', Boolean(BGPage.filterSearch))
var initBlockUsers = async function (){
	var bus = []

	blockUsers = await blockUsers
	for (var i in blockUsers) {
		bus.push('<span class="block-one"><a title="访问其主页" href="https://developers.weixin.qq.com/community/personal/'+i+'" target="_blank">'+blockUsers[i]+'</a><span class="del" title="取消屏蔽" data-openid="'+i+'">x</span></span>')
	}
	$('.blockOnes').empty().html(bus.join(''))
}
initBlockUsers()
var showTail = function(type, input){
	var answer = '', reply = '', discuss = ''
	answer = $('.commentTailArea textarea[name=answer]').val().trim()
	reply = $('.commentTailArea textarea[name=reply]').val().trim()
	discuss = $('.commentTailArea textarea[name=discuss]').val().trim()
	if(!input){
		answer = answer || currentTail.answer
		reply = reply || currentTail.reply
		discuss = discuss || currentTail.discuss
	}else{
		currentTail[type] = eval(type)
	}
	$('.commentTailArea [name=answer]').val(answer).attr('placeholder', '设置回答小尾巴HTML')
	$('.commentTailArea [name=reply]').val(reply).attr('placeholder', '设置回复小尾巴HTML')
	$('.commentTailArea [name=discuss]').val(discuss).attr('placeholder', '设置话题/评论小尾巴HTML')
	$('.tail-preview').html(type == 'reply' ? reply : (type == 'discuss' ? discuss : answer))
},
saveTail = function(){
	var answer = $('.commentTailArea textarea[name=answer]').val().trim(),
		reply = $('.commentTailArea textarea[name=reply]').val().trim(),
		discuss = $('.commentTailArea textarea[name=discuss]').val().trim()
		console.log({answer,reply,discuss})
	BGPage.updateCommentTailSetting({answer,reply,discuss});
}
$('.recoverDefaultTail .recover').on('click', (e)=>{
	if($(e.currentTarget).prop('checked')){
		$('.recoverDefaultTail .remember-save').show()
		$('.commentTailArea [name=answer]').val(BGPage.commentTailSetting.default.answer)
		$('.commentTailArea [name=reply]').val(BGPage.commentTailSetting.default.reply)
		$('.commentTailArea [name=discuss]').val(BGPage.commentTailSetting.default.discuss)
	}else{
		$('.recoverDefaultTail .remember-save').hide()
		$('.commentTailArea [name=answer]').val(currentTail.answer)
		$('.commentTailArea [name=reply]').val(currentTail.reply)
		$('.commentTailArea [name=discuss]').val(currentTail.discuss)
	}
})
$('.commentTailArea textarea').on('focus input', function(e){
	var t = e.currentTarget, val = $(t).val().trim()
	
	showTail($(t).attr('name'), e.type == 'input')
})
$('[name=blockUser]').on('blur', function(e){
	var t = $(e.currentTarget), val = t.val().trim(), bus = []

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
	var t = $(e.currentTarget)
	BGPage.updateAutoSearch($('#autoSearch').prop('checked'))
	BGPage.updateShowLoading($('#showLoading').prop('checked'))
	BGPage.updateFilterSearch($('#filterSearch').prop('checked'))
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

$('.common-reply-item').on('input', function(e){
	console.log($('.common-reply-list-form'))
})

BGPage.commonReplyListEnable ? $(".common-reply-list").show() : $(".common-reply-list").hide()
$('[name="codetip"]').val(BGPage.codeTipSetting.current||BGPage.codeTipSetting.default).attr('placeholder', BGPage.codeTipSetting.current||BGPage.codeTipSetting.default)
