const curMaskVersion = 3; //当前的掩码设置版本，用于检测是否更新

//仿GM_getValue函数v1.0
if (typeof (GM_getValue) == "undefined") {
	var GM_getValue = function (name, type) {
		var value = localStorage.getItem(name);
		if (value == undefined) return value;
		if ((/^(?:true|false)$/i.test(value) && type == undefined) || type == "boolean") {
			if (/^true$/i.test(value))
				return true;
			else if (/^false$/i.test(value))
				return false;
			else
				return Boolean(value);
		}
		else if ((/^\-?[\d\.]+$/i.test(value) && type == undefined) || type == "number")
			return Number(value);
		else
			return value;
	}
}
//仿GM_setValue函数v1.0
if (typeof (GM_setValue) == "undefined") {
	var GM_setValue = function (name, value) {
		localStorage.setItem(name, value);
	}
}
//仿GM_deleteValue函数v1.0
if (typeof (GM_deleteValue) == "undefined") {
	var GM_deleteValue = function (name) {
		localStorage.removeItem(name);
	}
}
//仿GM_listValues函数v1.0
if (typeof (GM_listValues) == "undefined") {
	var GM_listValues = function () {
		var keys = new Array();
		for (var ki = 0, kilen = localStorage.length; ki < kilen; ki++) {
			keys.push(localStorage.key(ki));
		}
		return keys;
	}
}

var maskObj = function (name, content) //一个掩码对象
{
	this.name = name;
	this.content = content;
	return this;
};
var masks = new Array(); //储存掩码数组
var mask_list = null; //掩码列表框
var mask_name = null;
var mask_content = null;
var outinfo = null;
var outcontent = null;

function mask_add() {
	if (mask_name.value.length > 0 && mask_content.value.length > 0) {
		addNewMask(mask_name.value, mask_content.value);
		mask_name.value = "";
		mask_content.value = "";
	} else {
		S_Alert("掩码名或内容为空");
	}
	mask_list.selectedIndex = mask_list.options.length - 1;
	save_mask_local();
}
//从文本添加一个新的掩码
function addNewMask(name, content) {
	var mask = new maskObj(name, content);
	masks.push(mask);
	var opt = new Option(name, content);
	mask_list.options.add(opt);
}
function mask_remove() {
	if (mask_list.selectedIndex >= 0) {
		let lastSelectedIndex = mask_list.selectedIndex;
		masks.splice(mask_list.selectedIndex, 1);
		mask_list.remove(mask_list.selectedIndex);
		mask_list.selectedIndex = (lastSelectedIndex < mask_list.options.length) ?
			lastSelectedIndex :
			(mask_list.options.length - 1);
	} else {
		S_Alert("没有选中掩码");
	}
	save_mask_local();
}
function mask_select() {
	mask_name.value = masks[mask_list.selectedIndex].name;
	mask_content.value = masks[mask_list.selectedIndex].content;
	if (redata) generate_output(redata); //重新生成
	GM_setValue("godl-mask-index", mask_list.selectedIndex);
}
function save_mask_local() //把掩码设置保存到本地
{
	var maskstr = JSON.stringify(masks);
	GM_setValue("godl-masks", maskstr);
	GM_setValue("godl-mask-index", mask_list.selectedIndex);
}
function load_mask_local() //从空白加载设置
{
	var maskstr = GM_getValue("godl-masks");
	var masksCfg;
	try {
		masksCfg = JSON.parse(maskstr);
	} catch (e) {
		masksCfg = null;
	}

	if (!Array.isArray(masksCfg) ||
		((parseInt(GM_getValue("new-mask-version"), 10) || 1) < curMaskVersion)
	) //没有掩码数据，初始化默认配置。
	{
		addNewMask("普通外链", "http://storage.live.com/items/${file.id}:/${file.name}");
		addNewMask("最短链接", "http://storage.live.com/items/${file.id}");
		addNewMask("UBB代码外链图片", "[img]http://storage.live.com/items/${file.id}:/${file.name}[/img]");
		addNewMask("模板字符串基本使用示例", "在OneDrive里查看 ${file.name} 的地址是：${file.webUrl}");
		addNewMask("表达式使用示例", "${index+1}号文件的尺寸是：${file.size>1024?Math.round(file.size/1024)+\"K\":file.size}B");
		addNewMask("自动选择img/mp3 UBB代码", "[${file.image?\"img\":(file.audio?\"mp3\":\"file\")}]http://storage.live.com/items/${file.id}:/${file.name}[/${file.image?\"img\":(file.audio?\"mp3\":\"file\")}]");
		addNewMask("ES6完整文件尺寸换算示例", "${index+1}号文件的尺寸是：${(function(size){const bArr = [\"B\",\"KiB\",\"MiB\",\"GiB\",\"TiB\"];for(let idx=0;idx<bArr.length;idx++){if(idx<bArr.length && size/Math.pow(1024,idx+1)>1)continue;else return (size/Math.pow(1024,idx)).toFixed(2) + \" \" + bArr[idx];}})(file.size)}");
		addNewMask("ES6闭包函数示例1", "文件的权限是：${(scope=>{switch(scope){case \"anonymous\":return \"所有人\";case \"users\":return \"仅限指定用户\";default:return \"私有\";}})(file.shared?file.shared.scope:null)}");
		addNewMask("ES6闭包函数示例2", "文件年份：${(createTime=>new Date(createTime).toLocaleString('zh-u-ca-chinese-nu-hanidec',{year:\"numeric\",month:\"long\"}))(file.createdDateTime)}");
		addNewMask("第三方 1drv.ws 项目", "${file.permissions[0].link.webUrl.replace(\"1drv.ms\",\"1drv.ws\")}");
		addNewMask("官方图片下载直连（短期？）", "${file[\"@microsoft.graph.downloadUrl\"].replace(/public\.\w+\.files/i,\"public.ch.files\")}");
		if (Array.isArray(masksCfg)) { addNewMask("▲以上为版本更新，重新添加的掩码示例", ""); }
		GM_setValue("new-mask-version", curMaskVersion);
	} else {
		masksCfg.forEach(function (item) {
			addNewMask(item.name, item.content);
		});
	}

	var mask_index = parseInt(GM_getValue("godl-mask-index"), 10) || 0;
	mask_list.selectedIndex = mask_index;
}

function do_error(e) {
	S_Alert("发生错误");
	outcontent.value = e.toString();
	outinfo.innerHTML = "发生错误";
}
function do_cancel() {
	S_Alert("取消操作");
	outinfo.innerHTML = "取消操作";

}
function do_success(files) {
	redata = files; //存入全局数组
	console.log("本次返回 %d 个文件，数据为 %o",
		redata.value.length,
		redata
	);
	generate_output(redata);
}

function generate_output(files) {
	var mask = masks[mask_list.selectedIndex] || masks[0];
	var filearr = files.value;

	S_Alert("共选择 " + filearr.length + " 个文件。")
	outinfo.innerHTML = "共选择 " + filearr.length + " 个文件。";
	if (filearr.some(function (item) {
		return item.shared == undefined || item.shared.scope != "anonymous";
	})) {
		outinfo.innerHTML += "存在非公共权限文件，注意添加通行许可代码。";
	}

	var outStrArr = filearr.map(function (item, index) {
		var outStr = showMask(mask.content, item, index);
		return outStr;
	});
	outcontent.value = outStrArr.join("\n");
}

//显示掩码用
function showMask(str, file, index) {
	var newTxt = eval("`" + str + "`");
	var pattern = "%{([^}]+)}";
	var rs = null;
	//	console.log(rs = regMask.exec(newTxt),rs = regMask.exec(newTxt),rs = regMask.exec(newTxt),rs = regMask.exec(newTxt))

	while ((rs = new RegExp(pattern).exec(newTxt)) != null) {
		var mskO = rs[0], //包含括号的原始掩码
			mskN = rs[1]; //去掉掩码括号
		if (mskN != undefined) {
			mskN = (mskN != undefined) ? mskN.replace(/\\{/ig, "{").replace(/\\}/ig, "}").replace(/\\\\/ig, "\\") : null;
			try {
				var evTemp = eval(mskN);
				if (evTemp != undefined)
					newTxt = newTxt.replace(mskO, evTemp.toString());
				else
					newTxt = newTxt.replace(mskO, "");
			} catch (e) {
				S_Alert("掩码异常，详情查看控制台");
				outinfo.innerHTML = "掩码异常，详情查看控制台";

				console.error(mskO + " 掩码出现了异常情况", e);
			}
		}
	}

	return newTxt;
}

var redata;//储存返回的数据

window.onload = function () //网页加载初始化
{
	mask_list = document.querySelector(".mask-list");
	mask_name = document.querySelector(".mask-name");
	mask_content = document.querySelector(".mask-content");
	outinfo = document.querySelector(".outinfo");
	outcontent = document.querySelector(".outcontent");
	S_Alert("SpectreGao美化版")

	if (location.protocol != "https:" && location.hostname != "localhost" && location.hostname != "") {
		var goto = confirm("检测到你正在使用http模式，本应用要求使用https模式。\n是否自动跳转？");
		if (goto) {
			location.protocol = "https:";
		}
	}

	load_mask_local();
}
//OneDrive官方API格式
function launchOneDrivePicker(action = "query") {
	S_Alert("正在等待API返回数据");
	outinfo.innerHTML = "正在等待API返回数据";
	var odOptions = {
		//应用 ID
		//clientId: "5712d2c8-2c32-4f4f-a5aa-fdc966092171",
		//clientId: "fb9b5c9a-b2cb-4ee9-b4ba-7317167b0dd3",
		clientId: "46c7ce1e-f79f-4de4-9453-a1adaeb9fe1b",
		action: action, //share | download | query
		multiSelect: true,
		openInNewWindow: true,
		//advanced: {createLinkParameters: { type: "embed", scope: "anonymous" }},
		advanced: {
			queryParameters: "select=audio,content,createdBy,createdDateTime,cTag,deleted,description,eTag,file,fileSystemInfo,folder,id,image,lastModifiedBy,lastModifiedDateTime,location,malware,name,package,parentReference,photo,publication,remoteItem,root,searchResult,shared,sharepointIds,size,specialFolder,video,webDavUrl,webUrl,activities,children,listItem,permissions,thumbnails,versions,@microsoft.graph.conflictBehavior,@microsoft.graph.downloadUrl,@microsoft.graph.sourceUrl"
		},
		success: function (files) { do_success(files); /* success handler */ },
		cancel: function () { do_cancel(); /* cancel handler */ },
		error: function (e) { do_error(e); /* error handler */ }
	};
	OneDrive.open(odOptions);
}

function S_Alert(info) {
	if (!$('#SpectreAlert').length > 0) $(`<div id="SpectreAlert"><style>#SpectreAlert {position: fixed;z-index: 99999;top: 20px;right: 20px}#SpectreAlert>div {width: 250px !important;height: auto;display: none;padding: 10px 30px;background: rgba(255, 255, 255, .7);backdrop-filter: blur(5px);border: 1px solid #ddd;border-radius: 4px;box-shadow: 0 0 5px #ccc;margin-bottom: 12px;text-align: center;color: #555;position: relative;font-size: 13px;cursor: pointer;white-space: normal !important;text-overflow: clip !important;overflow: visible !important;animation: SMP_Show .8s;}@keyframes SMP_Show {0% {opacity: 0;transform: scale(.8) translateX(100%);}80%{transform: scale(.95) translateX(0%);}100% {opacity: 1;transform: scale(1) translateX(0%);}}.SpectreAlertClose {position: absolute;top: 50%;transform: translateY(-50%);right: 10px;padding: 10px 2px;transition: .3s}.SpectreAlertClose:hover {background: #eee;border-radius: 3px;}.SpectreAlertClose:active {background: #ddd;}.SpectreAlertClose::before,.SpectreAlertClose::after {content: '';width: 14px;height: 1px;background: gray;display: block}.SpectreAlertClose::before {transform: rotate(45deg)}.SpectreAlertClose::after {transform: translateY(-1px) rotate(-45deg)}</style></div>`).appendTo(document.body);
	$(`<div>${info}<span class="SpectreAlertClose"></span></div>`).prependTo('#SpectreAlert').fadeToggle('slow', function () {
		$('.SpectreAlertClose').click(function () {
			$(this).parent().fadeToggle('fast', function () {
				$(this).remove()
			})
		})
		setTimeout(() => {
			$(this).fadeToggle('slow', function () {
				$(this).remove()
			})
		}, 3000);
	})
}
