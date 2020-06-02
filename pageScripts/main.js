let loadingSvg = '<svg class="octicon octicon-octoface anim-pulse" height="20" viewBox="0 0 16 16" version="1.1" width="20" aria-hidden="true" style="fill: #fc8838;margin-right:10px">'+
'<path fill-rule="evenodd" d="M14.7 5.34c.13-.32.55-1.59-.13-3.31 0 0-1.05-.33-3.44 1.3-1-.28-2.07-.32-3.13-.32s-2.13.04-3.13.32c-2.39-1.64-3.44-1.3-3.44-1.3-.68 1.72-.26 2.99-.13 3.31C.49 6.21 0 7.33 0 8.69 0 13.84 3.33 15 7.98 15S16 13.84 16 8.69c0-1.36-.49-2.48-1.3-3.35zM8 14.02c-3.3 0-5.98-.15-5.98-3.35 0-.76.38-1.48 1.02-2.07 1.07-.98 2.9-.46 4.96-.46 2.07 0 3.88-.52 4.96.46.65.59 1.02 1.3 1.02 2.07 0 3.19-2.68 3.35-5.98 3.35zM5.49 9.01c-.66 0-1.2.8-1.2 1.78s.54 1.79 1.2 1.79c.66 0 1.2-.8 1.2-1.79s-.54-1.78-1.2-1.78zm5.02 0c-.66 0-1.2.79-1.2 1.78s.54 1.79 1.2 1.79c.66 0 1.2-.8 1.2-1.79s-.53-1.78-1.2-1.78z"></path>'+
'<style xmlns="http://www.w3.org/2000/svg" id="pulse" data-anikit="">.anim-pulse {animation-name: pulse;animation-duration: 1s;animation-timing-function: linear;animation-iteration-count: infinite}@keyframes pulse {0% {opacity: .3;color:#00c362}10% {opacity: .8;color:#fc8838}to {opacity: .3;color:#34abfd}}</style>'+
'</svg>'
let reInitSearchRows = async function(){
  var res = JSON.parse(this.response),
  allBlockTotal = res.data.allBlockTotal,
  totalNum = res.data.totalNum

  await (()=>new Promise((rs, rj)=>{
    // 延迟，等待 window.blockUserArticles 数据
    setTimeout(()=>{
      rs()
    }, 800)
  }))()

  blogList = res.data && res.data.blogList && res.data.blogList.length ? res.data.blogList : []
  /* blogCategory
   * 1 问答
   * 2 公告
   * 4,1024 教程
   * 512 知识库
   * 524288 文章
   */
  var newData = [], blockItems = {}, docId2openId = window.blockUserArticles && (window.blockUserArticles.docId2openId || {})
  console.plog(docId2openId)

  var loopOne = async (i, blogList, docId2openId, blockItems, newData)=>{
    var item = blogList[i]
    if(item.docid in docId2openId){
        blockItems[item.docid] = item
        blockItems[item.docid].nickname = docId2openId[item.docid] ? window.blockUsers[docId2openId[item.docid]] || '' : ''

        newData.push(item)
    }else{
      // var getArticle = (item, b)=>new Promise((rs, rj)=>{
      //   $.ajax({
      //     url:'https://developers.weixin.qq.com/community/ngi/'+(item.blog.blogCategory == '524288' ? 'article' : 'doc')+'/detail/'+item.docid,
      //     type: 'get',
      //     dataType:'JSON',
      //     success:function(r){
      //       if(r.data && r.data.OpenId in window.blockUsers){
      //         blockItems[item.docid] = item
      //         blockItems[item.docid].nickname = window.blockUsers[r.data.OpenId]
      //       }
      //       rs(item)
      //     },
      //     fail(r){
      //       rj(r)
      //     }
      //   })
      // })
      // newData.push(await getArticle(item, blockItems))
    }
    i + 1 < blogList.length && await loopOne(i+1, blogList, docId2openId, blockItems, newData)
  }
  blogList.length ? await loopOne(0, blogList, docId2openId, blockItems, newData) : void 0
  if (!this.pageScriptEventDispatched) {
    var newResponse = {code:0, success: true, data:{ blogList: newData, allBlockTotal, totalNum }}

    this.responseText = JSON.stringify(newResponse)
    this.response = JSON.stringify(newResponse)
    searchDoBlockUser(blockItems)
    this.pageScriptEventDispatched = true;
  }
  return newData
},
reInitPageData = async function(){
  var res = JSON.parse(this.response),
  { count, limit, page, rows = [] } = res.data || {}

  await (()=>new Promise((rs, rj)=>{
    // 延迟，等待 window.blockUserArticles 数据
    setTimeout(()=>{
      rs()
    }, 800)
  }))()
  /* blogCategory
   * 1 问答
   * 2 公告
   * 4,1024 教程
   * 512 知识库
   * 524288 文章
   */
  var newData = [], blockItems = {}
  // console.plog(window.blockUsers)

  var loopOne = async (i, rows, blockItems, newData)=>{
    var item = rows[i]
    if(item.OpenId in window.blockUsers ){
        blockItems[item.DocId] = item
        blockItems[item.DocId].nickname = window.blockUsers[item.OpenId] || ''

        newData.push(item)
    }
    i + 1 < rows.length && await loopOne(i+1, rows, blockItems, newData)
  }
  rows.length ? await loopOne(0, rows, blockItems, newData) : void 0
  // console.plog(blockItems)
  if (!this.pageScriptEventDispatched) {
    var newResponse = {code:0, success: true, count, limit, page, rows: newData }

    this.responseText = JSON.stringify(newResponse)
    this.response = JSON.stringify(newResponse)
    await doBlockUserFromBlockItems(blockItems)
    this.pageScriptEventDispatched = true;
  }
  return blockItems
},
reInitPageCommentData = async function(){
  var res = JSON.parse(this.response),
  { commentsCount, count, limit, page, rows = [] } = res || {}

  await (()=>new Promise((rs, rj)=>{
    // 延迟，等待 window.blockUser 数据
    setTimeout(()=>{
      rs()
    }, 800)
  }))()
  /* blogCategory
   * 1 问答
   * 2 公告
   * 4,1024 教程
   * 512 知识库
   * 524288 文章
   */
  var newData = [], blockItems = {}
  // console.plog(window.blockUsers)

  var loopOne = async (i, rows, blockItems, newData)=>{
    var item = rows[i]
    if(item.OpenId in window.blockUsers ){
        blockItems[item.DocId] = item
        blockItems[item.DocId].nickname = window.blockUsers[item.OpenId] || ''
        item.Sub && item.Sub.length ? await loopOne(0, item.Sub, blockItems, newData) : void 0
        newData.push(item)
    }
    i + 1 < rows.length && await loopOne(i+1, rows, blockItems, newData)
  }
  rows.length ? await loopOne(0, rows, blockItems, newData) : void 0
  // console.plog(blockItems)
  if (!this.pageScriptEventDispatched) {
    var newResponse = {code:0, success: true, count, limit, page, rows: newData }

    this.responseText = JSON.stringify(newResponse)
    this.response = JSON.stringify(newResponse)
    await doBlockUserFromBlockItems(blockItems)
    this.pageScriptEventDispatched = true;
  }
  return blockItems
}
// 命名空间
let ajax_interceptor_qoweifjqon = {
  settings: {
    ajaxInterceptor_switchOn: false,
    ajaxInterceptor_rules: [],
  },
  originalXHR: window.XMLHttpRequest,
  myXHR: function() {
    let t = this
    t.pageScriptEventDispatched = false;
    t.isReIniting = false;
    const modifyResponse = async () => {
      await (()=>new Promise((resolve, reject)=>{
        [{switchOn:ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn}].forEach(async ({switchOn = true}) => {
          if (switchOn) {
            if(/developers\.weixin\.qq\.com\/community\/ngi\/search\?/.test(t.responseURL)){
              !t.isReIniting && (t.isReIniting = true, await reInitSearchRows.apply(t), t.isReIniting = false)
            }else if(/developers\.weixin\.qq\.com\/community\/ngi\/(mixflow|article|question)\/list/.test(t.responseURL)){
              // console.plog('mixflow/list')
              !t.isReIniting && (t.isReIniting = true, await reInitPageData.apply(t), t.isReIniting = false)
            }else if(/developers\.weixin\.qq\.com\/community\/ngi\/comment\/list/.test(t.responseURL)){
              !t.isReIniting && (t.isReIniting = true, await reInitPageCommentData.apply(t), t.isReIniting = false)
            }
          }
        })
        resolve()
      }))()

      // 3.5s后强制显示
      setTimeout(()=>{
        $('.plugin-search-hide').removeClass('plugin-search-hide')
        $('.plugin-no-result-wrp').remove()
      }, 3500)
    }
    
    const xhr = new ajax_interceptor_qoweifjqon.originalXHR;
    for (let attr in xhr) {
      if (attr === 'onreadystatechange') {
        xhr.onreadystatechange = async (...args) => {
          if(ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn && this.readyState < 3){
            if(/developers\.weixin\.qq\.com\/community\/ngi\/search/.test(this.responseURL)){
              $('#article_frame').find('.plugin-no-result-wrp').remove()
              $('#article_frame .search_posts_area_body').addClass('plugin-search-hide').find('.search_posts_content').append('<div class="plugin-no-result-wrp"><p class="empty-box" title="社区小组手" style="color: rgb(234, 160, 0);display: flex;">'+loadingSvg+'正在玩命搜索中...</p></div>')
            }else if(/developers\.weixin\.qq\.com\/community\/ngi\/(mixflow|article|question)\/list/.test(this.responseURL)){
              /developers\.weixin\.qq\.com\/community\/ngi\/question\/list/.test(this.responseURL)
                &&  $('.simple_container_body')
                  .addClass('plugin-search-hide')
                  .find('.simple_container_body_body>div')
                  .addClass('plugin-mod_article_list_container')

              $('.plugin-no-result-wrp').remove()
              $('.simple_container_body')
                .addClass('plugin-search-hide')
                .find('.simple_container_body_body')
                .append('<div class="plugin-no-result-wrp"><p class="empty-box" title="社区小组手" style="text-algin: center; color: rgb(234, 160, 0);">'+loadingSvg+'正在玩命加载中...</p></div>')
            }
          }
          if (this.readyState == 4) {
            // 请求成功
            if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn) {
              // 开启拦截
              await modifyResponse()
            }
          }
          this.onreadystatechange && this.onreadystatechange.apply(this, args);
        }
        continue;
      } else if (attr === 'onload') {
        xhr.onload = async (...args) => {
          // 请求成功
          if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn) {
            // 开启拦截
            // await modifyResponse()
          }
          this.onload && this.onload.apply(this, args);
        }
        continue;
      }
  
      if (typeof xhr[attr] === 'function') {
        this[attr] = xhr[attr].bind(xhr);
      } else {
        // responseText和response不是writeable的，但拦截时需要修改它，所以修改就存储在this[`_${attr}`]上
        if (attr === 'responseText' || attr === 'response') {
          Object.defineProperty(this, attr, {
            get: () => this[`_${attr}`] == undefined ? xhr[attr] : this[`_${attr}`],
            set: (val) => this[`_${attr}`] = val,
            enumerable: true
          });
        } else {
          Object.defineProperty(this, attr, {
            get: () => xhr[attr],
            set: (val) => xhr[attr] = val,
            enumerable: true
          });
        }
      }
    }
  }
}

window.addEventListener("message", function(event) {
  const data = event.data;
  if(!/developers\.weixin\.qq\.com\/community/.test(window.location.href) || data == '') return

// console.plog('pageScript === >', data)
  if (data.type === 'ajaxInterceptor' && data.to === 'pageScript') {
    ajax_interceptor_qoweifjqon.settings[data.key] = data.value;
  }

  if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn) {
    window.XMLHttpRequest = ajax_interceptor_qoweifjqon.myXHR;
    window.fetch = ajax_interceptor_qoweifjqon.myFetch;
  } else {
    window.XMLHttpRequest = ajax_interceptor_qoweifjqon.originalXHR;
    window.fetch = ajax_interceptor_qoweifjqon.originalFetch;
  }
}, false);