var BGPage = chrome.extension.getBackgroundPage();
var pluginInfo = chrome.runtime.getManifest()

$('.plugin-name').html(pluginInfo.name)
$('#versionNumber').html(pluginInfo.version)
$('.year').html(new Date().getFullYear())

$("#settings").on("click", function(e) {
	chrome.tabs.create({
		url: "/options.html"
	})
})