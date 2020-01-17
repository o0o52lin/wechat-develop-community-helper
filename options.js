var BGPage = chrome.extension.getBackgroundPage();
var pluginInfo = chrome.runtime.getManifest()

console.log(BGPage)
$('.plugin-name').html(pluginInfo.name)
$('#versionNumber').html(pluginInfo.version)
$('.year').html(new Date().getFullYear())
$('#autoSearch').prop('checked', Boolean(BGPage.autoSearch))

var showTail = function(t){
	if(t == 1){
		$('.commentTailArea.t2').hide()
		$('.commentTailArea.t1').show()
		$('.commentTailArea.t1 [name=content]').val(BGPage.commentTailSetting.current.content||BGPage.commentTailSetting.default.content).attr('placeholder', BGPage.commentTailSetting.current.content || BGPage.commentTailSetting.default.content)
		$('.commentTailArea.t1 [name=bgcolor]').val(BGPage.commentTailSetting.current.bgcolor||BGPage.commentTailSetting.default.bgcolor).attr('placeholder', BGPage.commentTailSetting.current.bgcolor || BGPage.commentTailSetting.default.bgcolor)

		var content = $('.commentTailArea textarea[name=content]').val().trim() || BGPage.commentTailDefaulContent,
		bgcolor = $('.commentTailArea textarea[name=bgcolor]').val().trim() || BGPage.commentTailDefaulBgcolor
		console.log('BGPage',BGPage.commentTailDefaulTpl.replace('{content}', content).replace('{bgcolor}', bgcolor))
		$('.tail-preview').html(BGPage.commentTailDefaulTpl.replace('{content}', content).replace('{bgcolor}', bgcolor))
		BGPage.updateCommentTailSetting(1, {content, bgcolor});

	}else{
		$('.commentTailArea.t1').hide()
		$('.commentTailArea.t2').show()
		$('.commentTailArea.t2 [name=html]').val(BGPage.commentTailSetting.current.html).attr('placeholder', BGPage.commentTailSetting.default.html)
		var html = $('.commentTailArea textarea[name=html]').val().trim() || BGPage.commentTailSetting.default.html
		console.log('html',html)
		console.log('current',BGPage.commentTailSetting.current.html)
		$('.tail-preview').html(html)
		BGPage.updateCommentTailSetting(2, {html});
	}
}
$('#autoSearch').on('click', (e)=>{
	BGPage.updateAutoSearch($(e.currentTarget).prop('checked'))
})
$('.commentTailArea textarea').on('blur', function(e){
	var t = e.currentTarget, val = $(t).val().trim()
	console.log(e.currentTarget, $(t).attr('name'), val)
	if($(t).attr('name') == 'html'){
		$('.tail-preview').html(val||'-- 请输入内容 --')
		BGPage.updateCommentTailSetting(2, {html:val});
	}else{
		var content = $('.commentTailArea textarea[name=content]').val().trim() || BGPage.commentTailDefaulContent,
		bgcolor = $('.commentTailArea textarea[name=bgcolor]').val().trim() || BGPage.commentTailDefaulBgcolor
		BGPage.updateCommentTailSetting(1, {content, bgcolor});
		content =  content || '-- 请输显示入内容 --'
		$('.tail-preview').html(BGPage.commentTailDefaulTpl.replace('{content}', content).replace('{bgcolor}', bgcolor))
	}
})
$('.commentTailArea textarea').on('input', function(e){
	var t = e.currentTarget, val = $(t).val().trim()
	if($(t).attr('name') == 'html'){
		$('.tail-preview').html(val)
	}else{
		var content = $('.commentTailArea textarea[name=content]').val().trim() || BGPage.commentTailDefaulContent,
		bgcolor = $('.commentTailArea textarea[name=bgcolor]').val().trim() || BGPage.commentTailDefaulBgcolor
		$('.tail-preview').html(BGPage.commentTailDefaulTpl.replace('{content}', content).replace('{bgcolor}', bgcolor))
	}
})
$('.commentTailType').on('click', (e)=>{
	var t = e.currentTarget
	showTail($(t).hasClass('t1') ? 1 : 2)
})
showTail(BGPage.commentTailSetting.type == 1 ? 1 : 2)

$('.tail-preview').html(BGPage.commentTailSetting.current.html||BGPage.commentTailSetting.default.html)
$('.commentTailType.t'+BGPage.commentTailSetting.type).prop('checked', true)




$('[name=common-reply-list]').prop('checked', BGPage.commonReplyListEnable).on('click', (e)=>{
	var t = e.currentTarget
	console.log(e.currentTarget, $(t).prop('checked'))
	BGPage.updateCommonReplyListState($(e.currentTarget).prop('checked'))
})
BGPage.commonReplyListEnable ? $(".common-reply-list").show() : $(".common-reply-list").hide()
$('[name=codetip]').val(BGPage.codeTipSetting.current||BGPage.codeTipSetting.default).attr('placeholder', BGPage.codeTipSetting.current||BGPage.codeTipSetting.default)