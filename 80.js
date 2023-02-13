// ==UserScript==
// @name         yujian-80-dev-TW
// @namespace    https://lib10.cn/yujian
// @version      2.0.4
// @description  遇剑MUD辅助脚本
// @author       游戏爱好者
// @match        http://*.yytou.com/*
// @grant        none
// ==/UserScript==

const text = (<><![CDATA[
console.log("tampermonkey loaded.");

// 窗口跨域
document.domain = "swordman-s1.yytou.com";
// 开发属性
var app_domain = "https://lib10.cn";
var a80_ver='9.9.9'

if (window.gameAuth == undefined) {
  // export auth
  var auth = location.search.split("?");
  if (auth.length > 0) {
    window.gameAuth = auth[1];
  } else {
    window.gameAuth = auth[0];
  }
}

function getRequest() {
  var theRequest = new Object();
  var strs = gameAuth.split("&");
  for (var i = 0; i < strs.length; i++) {
    theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
  }
  return theRequest
}

var urlParams = getRequest();
var accId = urlParams['id']
var areaId = parseInt(urlParams['area'])
if (!areaId) {
  areaId = 1
}

// 生成大区名称
var userAreaName = '[' + areaId + '區]';
// 判断新老区
var isNewAreaUser = areaId > 75;

var node = document.body;
// var node = document.head;
// var node = document.getElementsByTagName('head')[0];

// 自定义的css
var alertCssText = ".swal-input-bottom{margin-bottom:0px !important;font-size:1rem !important;}.swal-btn-size{font-size:0.8rem !important;}"
var alertCss = document.createElement("style");
alertCss.type = 'text/css';
alertCss.appendChild(document.createTextNode(alertCssText));
node.appendChild(alertCss);

// 引用第三方插件
var alertJs = document.createElement("script");
alertJs.type = "text/javascript";
alertJs.src = app_domain + "/yujian/sweetalert2.all.min.js?v=0&" + gameAuth;
node.appendChild(alertJs);

var ieEncode = document.createElement("script");
ieEncode.type = "text/javascript";
ieEncode.src = app_domain + "/yujian/ie-encoding.min.js";
node.appendChild(ieEncode);

// 引用授权插件
var verJs = document.createElement("script");
verJs.type = "text/javascript";
verJs.src = "https://lib10.cn/yujian/yujian-80-ver.js?s=9.9.9&v=" + (new Date().getTime())+"&id="+accId+"&area="+areaId;
var node = document.getElementsByTagName('head')[0];
node.appendChild(verJs);
var yujianWasmRes = document.createElement("script");
yujianWasmRes.type = "text/javascript";
yujianWasmRes.src = app_domain + "/yujian/wasm-main-2.0.js?v=" + a80_ver;
node.appendChild(yujianWasmRes);
WriteToScreen("授权插件" + yujianWasmRes.src);

console.log("plugin loaded");



// ========== 功能逻辑 ==============
// 以下text最新代码请使用此链接获取:
// https://lib10.cn/yujian/yujian-min-2.0.js
// =================================

// import yujian-80-head.js
//
// 发布开关
var debug = "0";
// 日志开关
function Log(...args) {
  if (debug == "1") {
    console.debug(Date(), '\n', ...args);
  }
};

function copy(str) {
  Alert("路径详情<br/>" + str);
}

// 数据存储区
function getStore(key) {
  var val = localStorage.getItem(accId + "_" + key);
  var val = top.localStorage.getItem(accId + "_" + key);
  if (val == null) {
    val = localStorage.getItem(accId + "_" + key);
  }
  Log("getStore", accId, key, val)
  return val
}

function setStore(key, val) {
  Log("setStore:", accId, key, val)
  return top.localStorage.setItem(accId + "_" + key, val)
  // return localStorage.setItem(accId + "_" + key, val)
}

function serialStore() {
  var obj = {}
  for (var key in top.localStorage) {
    if (key.indexOf(accId) != 0) {
      continue
    }
    obj[key] = top.localStorage[key];
  };
  return JSON.stringify(obj)
}

function uploadCfg() {
  var params = new URLSearchParams();
  params.set("auth", auth80);
  params.set("data", serialStore());
  fetch("/yujian/cfg", {
    method: "post",
    body: params,
  }).then(function(resp) {
    if (resp.status != 200) {
      resp.text().then(function(data) {
        Alert(data);
      })
      return;
    }
    Alert("上传成功");
    return;
  })
}

function recoverCfg() {
  fetch("/yujian/cfg?auth=" + auth80).then(function(resp) {
    if (resp.status != 200) {
      resp.text().then(function(data) {
        Alert(data);
      })
      return;
    }
    resp.text().then(function(data) {
      var obj = JSON.parse(data);
      for (var key in obj) {
        top.localStorage.setItem(key, obj[key]);
      };
      Alert("恢复成功，请刷新游戏")
    })
    return;
  })
}

function yjDayStr() {
  return FormatDate(new Date(new Date() - 6 * 3600 * 1000), "yyyyMMdd")
}

function fixJhName(name) {
  switch (name) {
    case "白駝山":
      return "白馱山";
    case "黑木崖":
      return "魔教";
    case "光明頂":
      return "明教";
    case "鐵血大旗門":
      return "大旗門";
    case "梅莊":
      return "寒梅莊";
	case "恆山":
	  return "恒山"
  }
  return name
}

function getMaxJhList() {
  var jhList = g_obj_map.get("msg_jh_list");
  if (!jhList) return 0

  var max = 0;
  for (var key of jhList.keys()) {
    if (key.indexOf("finish") < 0) continue
    var val = jhList.get(key);
    if (val != "2") continue;
    var proc = parseInt(key.split("finish")[1]);
    if (proc > max) max = proc;
  }
  return (max + 1)
}

function inKuafu() {
  var userInfo = g_obj_map.get("msg_attrs")
  if (!userInfo) return
  return userInfo.get("id") != ("u" + accId)
}

function getRoomName() {
  var roomInfo = g_obj_map.get("msg_room");
  if (!roomInfo) return "";
  var roomName = roomInfo.get("short");
  if (!roomName) return "";
  return roomName
}

function callTeamMember(result) {
  addDispatchListener("callTeamMember", function(b, type, subtype) {
    if (type != "team" && type == "info") return;
    goFast("prev");
    delDispatchListener("callTeamMember");
    result(b);
  })
  go("team")
}

function callTeamLeaderId(result) {
  callTeamMember(function(b) {
    // "member1":"u7007377,[1;35m齐茗[2;37;0m,2000,5"
    var m = b.get("member1");
    var id = "";
    if (m) {
      id = m.split(",")[0];
    }
    result(id);
  })
}



function JTPYStr()
{
	return "只采仆锕皑蔼碍爱嗳嫒瑷暧霭谙铵鹌肮袄奥媪骜鳌坝罢钯摆败呗颁办绊钣帮绑镑谤剥饱宝报鲍鸨龅辈贝钡狈备惫鹎贲锛绷笔毕毙币闭荜哔滗铋筚跸边编贬变辩辫苄缏笾标骠飑飙镖镳鳔鳖别瘪濒滨宾摈傧缤槟殡膑镔髌鬓饼禀拨钵铂驳饽钹鹁补钸财参蚕残惭惨灿骖黪苍舱仓沧厕侧册测恻层诧锸侪钗搀掺蝉馋谗缠铲产阐颤冁谄谶蒇忏婵骣觇禅镡场尝长偿肠厂畅伥苌怅阊鲳钞车彻砗尘陈衬伧谌榇碜龀撑称惩诚骋枨柽铖铛痴迟驰耻齿炽饬鸱冲冲虫宠铳畴踌筹绸俦帱雠橱厨锄雏础储触处刍绌蹰传钏疮闯创怆锤缍纯鹑绰辍龊辞词赐鹚聪葱囱从丛苁骢枞凑辏蹿窜撺错锉鹾达哒鞑带贷骀绐担单郸掸胆惮诞弹殚赕瘅箪当挡党荡档谠砀裆捣岛祷导盗焘灯邓镫敌涤递缔籴诋谛绨觌镝颠点垫电巅钿癫钓调铫鲷谍叠鲽钉顶锭订铤丢铥东动栋冻岽鸫窦犊独读赌镀渎椟牍笃黩锻断缎簖兑队对怼镦吨顿钝炖趸夺堕铎鹅额讹恶饿谔垩阏轭锇锷鹗颚颛鳄诶儿尔饵贰迩铒鸸鲕罚阀珐矾钒烦贩饭访纺钫鲂飞诽废费绯镄鲱纷坟奋愤粪偾丰枫锋风疯冯缝讽凤沣肤辐抚辅赋负讣妇缚凫驸绂绋赙麸鲋鳆钆该钙盖赅杆赶秆赣尴擀绀冈刚钢纲岗戆镐睾诰缟锆搁鸽阁铬个纥镉颍给亘赓绠鲠龚宫巩贡钩沟苟构购够诟缑觏蛊顾诂毂钴锢鸪鹄鹘剐挂鸹掴关观馆惯贯诖掼鹳鳏广犷规归龟闺轨诡贵刽匦刿妫桧鲑鳜辊滚衮绲鲧锅国过埚呙帼椁蝈铪骇韩汉阚绗颉号灏颢阂鹤贺诃阖蛎横轰鸿红黉讧荭闳鲎壶护沪户浒鹕哗华画划话骅桦铧怀坏欢环还缓换唤痪焕涣奂缳锾鲩黄谎鳇挥辉毁贿秽会烩汇讳诲绘诙荟哕浍缋珲晖荤浑诨馄阍获货祸钬镬击机积饥迹讥鸡绩缉极辑级挤几蓟剂济计记际继纪讦诘荠叽哜骥玑觊齑矶羁虿跻霁鲚鲫夹荚颊贾钾价驾郏浃铗镓蛲歼监坚笺间艰缄茧检碱硷拣捡简俭减荐槛鉴践贱见键舰剑饯渐溅涧谏缣戋戬睑鹣笕鲣鞯将浆蒋桨奖讲酱绛缰胶浇骄娇搅铰矫侥脚饺缴绞轿较挢峤鹪鲛阶节洁结诫届疖颌鲒紧锦仅谨进晋烬尽劲荆茎卺荩馑缙赆觐鲸惊经颈静镜径痉竞净刭泾迳弪胫靓纠厩旧阄鸠鹫驹举据锯惧剧讵屦榉飓钜锔窭龃鹃绢锩镌隽觉决绝谲珏钧军骏皲开凯剀垲忾恺铠锴龛闶钪铐颗壳课骒缂轲钶锞颔垦恳龈铿抠库裤喾块侩郐哙脍宽狯髋矿旷况诓诳邝圹纩贶亏岿窥馈溃匮蒉愦聩篑阃锟鲲扩阔蛴蜡腊莱来赖崃徕涞濑赉睐铼癞籁蓝栏拦篮阑兰澜谰揽览懒缆烂滥岚榄斓镧褴琅阆锒捞劳涝唠崂铑铹痨乐鳓镭垒类泪诔缧篱狸离鲤礼丽厉励砾历沥隶俪郦坜苈莅蓠呖逦骊缡枥栎轹砺锂鹂疠粝跞雳鲡鳢俩联莲连镰怜涟帘敛脸链恋炼练蔹奁潋琏殓裢裣鲢粮凉两辆谅魉疗辽镣缭钌鹩猎临邻鳞凛赁蔺廪檩辚躏龄铃灵岭领绫棂蛏鲮馏刘浏骝绺镏鹨龙聋咙笼垄拢陇茏泷珑栊胧砻楼娄搂篓偻蒌喽嵝镂瘘耧蝼髅芦卢颅庐炉掳卤虏鲁赂禄录陆垆撸噜闾泸渌栌橹轳辂辘氇胪鸬鹭舻鲈峦挛孪滦乱脔娈栾鸾銮抡轮伦仑沦纶论囵萝罗逻锣箩骡骆络荦猡泺椤脶镙驴吕铝侣屡缕虑滤绿榈褛锊呒妈玛码蚂马骂吗唛嬷杩买麦卖迈脉劢瞒馒蛮满谩缦镘颡鳗猫锚铆贸麽没镁门闷们扪焖懑钔锰梦眯谜弥觅幂芈谧猕祢绵缅渑腼黾庙缈缪灭悯闽闵缗鸣铭谬谟蓦馍殁镆谋亩钼呐钠纳难挠脑恼闹铙讷馁内拟腻铌鲵撵辇鲶酿鸟茑袅聂啮镊镍陧蘖嗫颟蹑柠狞宁拧泞苎咛聍钮纽脓浓农侬哝驽钕诺傩疟欧鸥殴呕沤讴怄瓯盘蹒庞抛疱赔辔喷鹏纰罴铍骗谝骈飘缥频贫嫔苹凭评泼颇钋扑铺朴谱镤镨栖脐齐骑岂启气弃讫蕲骐绮桤碛颀颃鳍牵钎铅迁签谦钱钳潜浅谴堑佥荨悭骞缱椠钤枪呛墙蔷强抢嫱樯戗炝锖锵镪羟跄锹桥乔侨翘窍诮谯荞缲硗跷窃惬锲箧钦亲寝锓轻氢倾顷请庆揿鲭琼穷茕蛱巯赇虮鳅趋区躯驱龋诎岖阒觑鸲颧权劝诠绻辁铨却鹊确阕阙悫让饶扰绕荛娆桡热韧认纫饪轫荣绒嵘蝾缛铷颦软锐蚬闰润洒萨飒鳃赛伞毵糁丧骚扫缫涩啬铯穑杀刹纱铩鲨筛晒酾删闪陕赡缮讪姗骟钐鳝墒伤赏垧殇觞烧绍赊摄慑设厍滠畲绅审婶肾渗诜谂渖声绳胜师狮湿诗时蚀实识驶势适释饰视试谥埘莳弑轼贳铈鲥寿兽绶枢输书赎属术树竖数摅纾帅闩双谁税顺说硕烁铄丝饲厮驷缌锶鸶耸怂颂讼诵擞薮馊飕锼苏诉肃谡稣虽随绥岁谇孙损笋荪狲缩琐锁唢睃獭挞闼铊鳎态钛鲐摊贪瘫滩坛谭谈叹昙钽锬顸汤烫傥饧铴镗涛绦讨韬铽腾誊锑题体屉缇鹈阗条粜龆鲦贴铁厅听烃铜统恸头钭秃图钍团抟颓蜕饨脱鸵驮驼椭箨鼍袜娲腽弯湾顽万纨绾网辋韦违围为潍维苇伟伪纬谓卫诿帏闱沩涠玮韪炜鲔温闻纹稳问阌瓮挝蜗涡窝卧莴龌呜钨乌诬无芜吴坞雾务误邬庑怃妩骛鹉鹜锡牺袭习铣戏细饩阋玺觋虾辖峡侠狭厦吓硖鲜纤贤衔显险现献县馅羡宪线苋莶藓岘猃娴鹇痫蚝籼跹厢镶乡详响项芗饷骧缃飨萧嚣销晓啸哓潇骁绡枭箫协挟携胁谐写泻谢亵撷绁缬锌衅兴陉荥凶汹锈绣馐鸺虚嘘须许叙绪续诩顼轩悬选癣绚谖铉镟学谑泶鳕勋询寻驯训讯逊埙浔鲟压鸦鸭哑亚讶垭娅桠氩阉烟盐严岩颜阎艳厌砚彦谚验厣赝俨兖谳恹闫酽魇餍鼹鸯杨扬疡阳痒养样炀瑶摇尧遥窑谣药轺鹞鳐爷页业叶靥谒邺晔烨医铱颐遗仪蚁艺亿忆义诣议谊译异绎诒呓峄饴怿驿缢轶贻钇镒镱瘗舣荫阴银饮隐铟瘾樱婴鹰应缨莹萤营荧蝇赢颖茔莺萦蓥撄嘤滢潆璎鹦瘿颏罂哟拥佣痈踊咏镛优忧邮铀犹诱莸铕鱿舆鱼渔娱与屿语狱誉预驭伛俣谀谕蓣嵛饫阈妪纡觎欤钰鹆鹬龉鸳渊辕园员圆缘远橼鸢鼋约跃钥粤悦阅钺郧匀陨运蕴酝晕韵郓芸恽愠纭韫殒氲杂灾载攒暂瓒趱錾赃脏驵凿枣责择则泽赜啧帻箦贼谮赠综缯轧铡闸栅诈斋债毡盏斩辗崭栈战绽谵张涨帐账胀赵诏钊蛰辙锗这谪辄鹧贞针侦诊镇阵浈缜桢轸赈祯鸩挣睁狰争帧症郑证诤峥钲铮筝织职执纸挚掷帜质滞骘栉栀轵轾贽鸷蛳絷踬踯觯钟终种肿众锺诌轴皱昼骤纣绉猪诸诛烛瞩嘱贮铸驻伫槠铢专砖转赚啭馔颞桩庄装妆壮状锥赘坠缀骓缒谆准着浊诼镯兹资渍谘缁辎赀眦锱龇鲻踪总纵偬邹诹驺鲰诅组镞钻缵躜鳟翱并沉丑淀迭斗范干皋硅柜后伙秸杰诀夸凌么霉捻凄扦圣尸抬涂洼汙锨咸蝎彝涌游吁御愿云灶扎札筑于凋讠谫凼坂垅垴埯埝苘荬荮莜莼菰藁揸吒吣咔咝咴噘噼嚯幞岙嵴彷徼犸狍馀馇馓馕愣憷懔丬溆滟潴纟绔绱珉枧桊槔橥轱轷赍肷胨飚煳煅熘愍淼砜磙眍钚钷铘铞锃锍锎锏锘锝锪锫锿镅镎镢镥镩镲稆鹋鹛鹱疬疴痖癯裥襁耢颥螨麴鲅鲆鲇鲞鲴鲺鲼鳊鳋鳘鳙鞒鞴齄么复赞发发松松闲闲瞆"
} 

function FTPYStr()
{
	return "隻採僕錒皚藹礙愛噯嬡璦曖靄諳銨鵪骯襖奧媼驁鰲壩罷鈀擺敗唄頒辦絆鈑幫綁鎊謗剝飽寶報鮑鴇齙輩貝鋇狽備憊鵯賁錛繃筆畢斃幣閉蓽嗶潷鉍篳蹕邊編貶變辯辮芐緶籩標驃颮飆鏢鑣鰾鱉別癟瀕濱賓擯儐繽檳殯臏鑌髕鬢餅稟撥缽鉑駁餑鈸鵓補鈽財參蠶殘慚慘燦驂黲蒼艙倉滄廁側冊測惻層詫鍤儕釵攙摻蟬饞讒纏鏟產闡顫囅諂讖蕆懺嬋驏覘禪鐔場嘗長償腸廠暢倀萇悵閶鯧鈔車徹硨塵陳襯傖諶櫬磣齔撐稱懲誠騁棖檉鋮鐺癡遲馳恥齒熾飭鴟沖衝蟲寵銃疇躊籌綢儔幬讎櫥廚鋤雛礎儲觸處芻絀躕傳釧瘡闖創愴錘綞純鶉綽輟齪辭詞賜鶿聰蔥囪從叢蓯驄樅湊輳躥竄攛錯銼鹺達噠韃帶貸駘紿擔單鄲撣膽憚誕彈殫賧癉簞當擋黨蕩檔讜碭襠搗島禱導盜燾燈鄧鐙敵滌遞締糴詆諦綈覿鏑顛點墊電巔鈿癲釣調銚鯛諜疊鰈釘頂錠訂鋌丟銩東動棟凍崠鶇竇犢獨讀賭鍍瀆櫝牘篤黷鍛斷緞籪兌隊對懟鐓噸頓鈍燉躉奪墮鐸鵝額訛惡餓諤堊閼軛鋨鍔鶚顎顓鱷誒兒爾餌貳邇鉺鴯鮞罰閥琺礬釩煩販飯訪紡鈁魴飛誹廢費緋鐨鯡紛墳奮憤糞僨豐楓鋒風瘋馮縫諷鳳灃膚輻撫輔賦負訃婦縛鳧駙紱紼賻麩鮒鰒釓該鈣蓋賅桿趕稈贛尷搟紺岡剛鋼綱崗戇鎬睪誥縞鋯擱鴿閣鉻個紇鎘潁給亙賡綆鯁龔宮鞏貢鉤溝茍構購夠詬緱覯蠱顧詁轂鈷錮鴣鵠鶻剮掛鴰摑關觀館慣貫詿摜鸛鰥廣獷規歸龜閨軌詭貴劊匭劌媯檜鮭鱖輥滾袞緄鯀鍋國過堝咼幗槨蟈鉿駭韓漢闞絎頡號灝顥閡鶴賀訶闔蠣橫轟鴻紅黌訌葒閎鱟壺護滬戶滸鶘嘩華畫劃話驊樺鏵懷壞歡環還緩換喚瘓煥渙奐繯鍰鯇黃謊鰉揮輝毀賄穢會燴匯諱誨繪詼薈噦澮繢琿暉葷渾諢餛閽獲貨禍鈥鑊擊機積饑跡譏雞績緝極輯級擠幾薊劑濟計記際繼紀訐詰薺嘰嚌驥璣覬齏磯羈蠆躋霽鱭鯽夾莢頰賈鉀價駕郟浹鋏鎵蟯殲監堅箋間艱緘繭檢堿鹼揀撿簡儉減薦檻鑒踐賤見鍵艦劍餞漸濺澗諫縑戔戩瞼鶼筧鰹韉將漿蔣槳獎講醬絳韁膠澆驕嬌攪鉸矯僥腳餃繳絞轎較撟嶠鷦鮫階節潔結誡屆癤頜鮚緊錦僅謹進晉燼盡勁荊莖巹藎饉縉贐覲鯨驚經頸靜鏡徑痙競凈剄涇逕弳脛靚糾廄舊鬮鳩鷲駒舉據鋸懼劇詎屨櫸颶鉅鋦窶齟鵑絹錈鐫雋覺決絕譎玨鈞軍駿皸開凱剴塏愾愷鎧鍇龕閌鈧銬顆殼課騍緙軻鈳錁頷墾懇齦鏗摳庫褲嚳塊儈鄶噲膾寬獪髖礦曠況誆誑鄺壙纊貺虧巋窺饋潰匱蕢憒聵簣閫錕鯤擴闊蠐蠟臘萊來賴崍徠淶瀨賚睞錸癩籟藍欄攔籃闌蘭瀾讕攬覽懶纜爛濫嵐欖斕鑭襤瑯閬鋃撈勞澇嘮嶗銠鐒癆樂鰳鐳壘類淚誄縲籬貍離鯉禮麗厲勵礫歷瀝隸儷酈壢藶蒞蘺嚦邐驪縭櫪櫟轢礪鋰鸝癘糲躒靂鱺鱧倆聯蓮連鐮憐漣簾斂臉鏈戀煉練蘞奩瀲璉殮褳襝鰱糧涼兩輛諒魎療遼鐐繚釕鷯獵臨鄰鱗凜賃藺廩檁轔躪齡鈴靈嶺領綾欞蟶鯪餾劉瀏騮綹鎦鷚龍聾嚨籠壟攏隴蘢瀧瓏櫳朧礱樓婁摟簍僂蔞嘍嶁鏤瘺耬螻髏蘆盧顱廬爐擄鹵虜魯賂祿錄陸壚擼嚕閭瀘淥櫨櫓轤輅轆氌臚鸕鷺艫鱸巒攣孿灤亂臠孌欒鸞鑾掄輪倫崙淪綸論圇蘿羅邏鑼籮騾駱絡犖玀濼欏腡鏍驢呂鋁侶屢縷慮濾綠櫚褸鋝嘸媽瑪碼螞馬罵嗎嘜嬤榪買麥賣邁脈勱瞞饅蠻滿謾縵鏝顙鰻貓錨鉚貿麼沒鎂門悶們捫燜懣鍆錳夢瞇謎彌覓冪羋謐獼禰綿緬澠靦黽廟緲繆滅憫閩閔緡鳴銘謬謨驀饃歿鏌謀畝鉬吶鈉納難撓腦惱鬧鐃訥餒內擬膩鈮鯢攆輦鯰釀鳥蔦裊聶嚙鑷鎳隉蘗囁顢躡檸獰寧擰濘苧嚀聹鈕紐膿濃農儂噥駑釹諾儺瘧歐鷗毆嘔漚謳慪甌盤蹣龐拋皰賠轡噴鵬紕羆鈹騙諞駢飄縹頻貧嬪蘋憑評潑頗釙撲鋪樸譜鏷鐠棲臍齊騎豈啟氣棄訖蘄騏綺榿磧頎頏鰭牽釬鉛遷簽謙錢鉗潛淺譴塹僉蕁慳騫繾槧鈐槍嗆墻薔強搶嬙檣戧熗錆鏘鏹羥蹌鍬橋喬僑翹竅誚譙蕎繰磽蹺竊愜鍥篋欽親寢鋟輕氫傾頃請慶撳鯖瓊窮煢蛺巰賕蟣鰍趨區軀驅齲詘嶇闃覷鴝顴權勸詮綣輇銓卻鵲確闋闕愨讓饒擾繞蕘嬈橈熱韌認紉飪軔榮絨嶸蠑縟銣顰軟銳蜆閏潤灑薩颯鰓賽傘毿糝喪騷掃繅澀嗇銫穡殺剎紗鎩鯊篩曬釃刪閃陜贍繕訕姍騸釤鱔墑傷賞坰殤觴燒紹賒攝懾設厙灄畬紳審嬸腎滲詵諗瀋聲繩勝師獅濕詩時蝕實識駛勢適釋飾視試謚塒蒔弒軾貰鈰鰣壽獸綬樞輸書贖屬術樹豎數攄紓帥閂雙誰稅順說碩爍鑠絲飼廝駟緦鍶鷥聳慫頌訟誦擻藪餿颼鎪蘇訴肅謖穌雖隨綏歲誶孫損筍蓀猻縮瑣鎖嗩脧獺撻闥鉈鰨態鈦鮐攤貪癱灘壇譚談嘆曇鉭錟頇湯燙儻餳鐋鏜濤絳討韜鋱騰謄銻題體屜緹鵜闐條糶齠鰷貼鐵廳聽烴銅統慟頭鈄禿圖釷團摶頹蛻飩脫鴕馱駝橢籜鼉襪媧膃彎灣頑萬紈綰網輞韋違圍為濰維葦偉偽緯謂衛諉幃闈溈潿瑋韙煒鮪溫聞紋穩問閿甕撾蝸渦窩臥萵齷嗚鎢烏誣無蕪吳塢霧務誤鄔廡憮嫵騖鵡鶩錫犧襲習銑戲細餼鬩璽覡蝦轄峽俠狹廈嚇硤鮮纖賢銜顯險現獻縣餡羨憲線莧薟蘚峴獫嫻鷴癇蠔秈躚廂鑲鄉詳響項薌餉驤緗饗蕭囂銷曉嘯嘵瀟驍綃梟簫協挾攜脅諧寫瀉謝褻擷紲纈鋅釁興陘滎兇洶銹繡饈鵂虛噓須許敘緒續詡頊軒懸選癬絢諼鉉鏇學謔澩鱈勳詢尋馴訓訊遜塤潯鱘壓鴉鴨啞亞訝埡婭椏氬閹煙鹽嚴巖顏閻艷厭硯彥諺驗厴贗儼兗讞懨閆釅魘饜鼴鴦楊揚瘍陽癢養樣煬瑤搖堯遙窯謠藥軺鷂鰩爺頁業葉靨謁鄴曄燁醫銥頤遺儀蟻藝億憶義詣議誼譯異繹詒囈嶧飴懌驛縊軼貽釔鎰鐿瘞艤蔭陰銀飲隱銦癮櫻嬰鷹應纓瑩螢營熒蠅贏穎塋鶯縈鎣攖嚶瀅瀠瓔鸚癭頦罌喲擁傭癰踴詠鏞優憂郵鈾猶誘蕕銪魷輿魚漁娛與嶼語獄譽預馭傴俁諛諭蕷崳飫閾嫗紆覦歟鈺鵒鷸齬鴛淵轅園員圓緣遠櫞鳶黿約躍鑰粵悅閱鉞鄖勻隕運蘊醞暈韻鄆蕓惲慍紜韞殞氳雜災載攢暫瓚趲鏨贓臟駔鑿棗責擇則澤賾嘖幘簀賊譖贈綜繒軋鍘閘柵詐齋債氈盞斬輾嶄棧戰綻譫張漲帳賬脹趙詔釗蟄轍鍺這謫輒鷓貞針偵診鎮陣湞縝楨軫賑禎鴆掙睜猙爭幀癥鄭證諍崢鉦錚箏織職執紙摯擲幟質滯騭櫛梔軹輊贄鷙螄縶躓躑觶鐘終種腫眾鍾謅軸皺晝驟紂縐豬諸誅燭矚囑貯鑄駐佇櫧銖專磚轉賺囀饌顳樁莊裝妝壯狀錐贅墜綴騅縋諄準著濁諑鐲茲資漬諮緇輜貲眥錙齜鯔蹤總縱傯鄒諏騶鯫詛組鏃鉆纘躦鱒翺並沈醜澱叠鬥範幹臯矽櫃後夥稭傑訣誇淩麽黴撚淒扡聖屍擡塗窪污鍁鹹蠍彜湧遊籲禦願雲竈紮劄築於雕訁譾氹阪壟堖垵墊檾蕒葤蓧蒓菇槁摣咤唚哢噝噅撅劈謔襆嶴脊仿僥獁麅餘餷饊饢楞怵懍爿漵灩瀦糸絝緔瑉梘棬橰櫫軲軤賫膁腖飈糊煆溜湣渺碸滾瞘鈈鉕鋣銱鋥鋶鐦鐧鍩鍀鍃錇鎄鎇鎿鐝鑥鑹鑔穭鶓鶥鸌癧屙瘂臒襇繈耮顬蟎麯鮁鮃鮎鯗鯝鯴鱝鯿鰠鰵鱅鞽韝齇麽覆讚發髮松鬆閒閑瞶"
} 

function Traditionalized( cc )
{
	var str = '';
	var ss = JTPYStr();
	var tt = FTPYStr();

	for(var i = 0 ; i < cc.length ; i++ )
	{
		if( cc.charCodeAt(i) > 10000 && ss.indexOf( cc.charAt(i) ) != -1 )
			str += tt.charAt( ss.indexOf( cc.charAt(i) ) );
  		else
  			str += cc.charAt(i);
	}
	return str;
}

function Simplized(cc){
	var str = '';
	var ss = JTPYStr();
	var tt = FTPYStr();

	for( var i=0 ; i < cc.length ; i++)
	{
		if( cc.charCodeAt(i) > 10000 && tt.indexOf( cc.charAt(i) ) != -1 )
			str += ss.charAt( tt.indexOf( cc.charAt(i) ) );
  		else
  			str += cc.charAt(i);
	}
	return str;
}





var menuBackground = "rgba(255,255,255,0.9)"
var menuSelectedColor = "rgba(174,238,238, 0.9)"; // aquamarine
// var menuSelectedColor = "rgba(255,228,181, 0.9)"; // moccasin
// var menuSelectedColor = "PaleTurquoise2"//"rgba(255,228,181, 0.9)"; // moccasin

// 全局默认战斗技能
var maxUserSkillLen = 7; // 实际个数+1
var mySkillLists = "九天龙吟剑法;排云掌法;孔雀翎;如来神掌;织冰剑法;覆雨剑法;";

// 自动阵默认技能
var autoBattleDesc = "设置'自动阵'参数,<span style='color:red'>英文逗号</span>分割,第1个参数为触发的气值,其他的需要连续释放的技能。<br/>战斗技能数不能超过6个,否则可能会找不到可用技能。<br/>当前：";
var autoBattleSkillOri1 = "9,九天龙吟剑法,排云掌法,";
var autoBattleSkillOri2 = "6,九天龙吟剑法,排云掌法";
var autoBattleSkillOri3 = "3,九天龙吟剑法";
var autoBattleSkillOri4 = "3,千影百伤棍";
var autoBattleSkillOri5 = "6,凌波微步";
var autoBattleSkillKey = "auto_battle_key";
var autoBattleSkillKey1 = "auto_battle_1";
var autoBattleSkillKey2 = "auto_battle_2";
var autoBattleSkillKey3 = "auto_battle_3";
var autoBattleSkillKey4 = "auto_battle_4";
var autoBattleSkillKey5 = "auto_battle_5";

// 自动血默认技能
var autoCureDesc = "设置'自动血'的技能,<span style='color:red'>英文逗号</span>分割,第1个参数为加血技能，第2个参数是回血触发百分比;第3个回蓝技能，第4个回蓝触发百分比。<br/>战斗技能数不能超过6个,否则可能会找不到可用技能。<br/>当前：";
var autoCureSkillOri = "道种心魔经,30,不动明王诀,30";
var autoCureSkillKey = "auto_cure_key";

// 破招技能
var breakBattleDesc = "设置'我破招'技能,<span style='color:red'>英文逗号</span>分割,第1个为主技,第2个为备用。<br/>当前：";
var breakBattleSkillOri = "九天龙吟剑法,排云掌法";
// 破招关键字
// 带*仅在单人战斗中起效
var hitKeys = (
  "你猝不及防|你一不留神|你略一遲疑|你分身乏術|你避無可避" +
  "|你魂滅|你自感|你為之|你心存|你如遭|你未被|你急|你難抗|你頹然|縱是你|縱使你|對准你|攻至你|抓破你|貫穿你|你面對|你已是|你只覺|罩了你|向了你" +
  "|將你所處|將你吞沒|將你逼得|完全將你|瞬間將你|將你周身" +
  "|使你無法|使你左" +
  "|結果你被|在你眼前|打中你|落在你|在你右|按在你|擊在你|往你|往而你|向身下的你|在了你|只在你" +
  "|你被滾滾|入你|鑽你|由你|射你|搗你|掃你|過你|拍你|點你|劈你|取你|向你|像你|奔你|著你|斬你|撲你|朝你|擊你|打你|刺你" +
  "|你受困|你癱坐|你急急|要你|扣你|令你|指你|衝你|渡你|卷你|由你|於你" +
  "|你頓時亂了|你頓感窒息|你放棄抵抗|你心生愧念|氣空力盡的你|你竭力破解|你擋無可擋|你無法分辨|你眼花瞭亂|你愕然間|你生命之火|你根本無法看清|你大驚失色|你被震|至你的" +
  "|*起首式|*平平一劍|*大超從前|*四面八方響起|*將周圍生靈|*卻已不再存任何破綻|*順刺|*倒刺"
).split("|");
// 你根本無法看清|將你|
//
function inAttackKey(txt, fightPeopleNum) {
  var txtLen = txt.length;
  var c = 0;
  var c1 = 0;
  var hit = 0;
  var hitLen = 0;
  var hitEnd = 0;
  var match = false;
  var matching = false;
  var code = 0;
  var txtCursor = 0;
  var hitCursor = 0;
  for (var i = 0; i < txtLen; i++) {
    c = txt.charAt(i);
    //　调取破招技能
    for (var j = 0; j < describeListLen; j++) {
      txtCursor = i;
      hitCursor = 0;
      hit = hitDesList[j];
      hitLen = hit.msg.length;
      c1 = hit.msg.charAt(0);
      if (c1 == "*") {
        if (fightPeopleNum > 1) continue; // 多人时不启用，因为无法判断来源
        // 跳过一个字符
        c1 = hit.msg.charAt(1);
        hitCursor++;
        hitLen--;
      }

      // 首字不匹配,跳过
      if (c1 != c) continue;

      // 源字段串剩余长度不够用于匹配,跳过
      hitEnd = i + hitLen;
      if (hitEnd > txtLen) continue;

      // 截取字段串进行匹配
      match = false;
      matching = true;
      while (matching) {
        hitCursor++; // 跳过首字符
        // 没有关键字数据了, 结束配匹
        if (hitCursor == hitLen) {
          matching = false;
          continue
        }

        txtCursor++; // 跳过首字符
        // 没有可用的源字符串了, 结束配匹
        if (txtCursor == txtLen) {
          matching = false;
          continue;
        }

        // 两个游标的字符进行匹配
        code = txt.charCodeAt(txtCursor);
        if (code == hit.msg.charCodeAt(hitCursor)) {
          if (hitCursor + 1 == hitLen) {
            // 完成了匹配
            match = true;
            matching = false;
          }
          continue;
        }

        // 遇到了acsii值, 跳过该字符
        if (code < 256) {
          hitCursor--; // 保持n不变, 游标跳过一个字符
          continue
        } else {
          // 非acsii值,且与关键字不等代表没匹配到数据
          matching = false;
          continue
        }
      }
      if (!match) continue;

      Log("FOUND : ", j, hit.hits, hit.msg, txt);
      hit.hits++;

      // 使用排序算法根据调用频度优先使用
      var inSwitch = true;
      for (var n = 0; inSwitch; n++) {
        if (n < j) {
          if (hitDesList[n].hits < hit.hits) {
            // 调换优先顺序
            hitDesList[j] = hitDesList[n];
            hitDesList[n] = hit;
            inSwitch = false; // 如果这里使用break，跳出不仅是当前的for?
          }
        } else {
          inSwitch = false;
        }
      }

      return true
    }
  }
  return false
}


// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
FormatDate = function(date, fmt) { //author: meizz
  var o = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "h+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    "S": date.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

// 弹框显示池
var swalArr = [];
var swalShowing = false;

function closeSwal() {
  swal.close();
  showNext();
}

function showNext() {
  var next = swalArr.shift();
  if (!next) {
    swalShowing = false;
    return;
  }

  var showObj = {
    background: menuBackground,
    animation: false,
    reverseButtons: true,
    confirmButtonText: '确定',
    confirmButtonClass: "swal-btn-size",
    allowOutsideClick: false,
    allowEscapeKey: true,
    allowEnterKey: true,
  };
  switch (next.type) {
    case "tips":
      showObj.html = "<div style='text-align:left !important;font-size:1rem !important'>" + next.msg + "</div>";
      break;
    case "alert":
      showObj.html = "<div style='text-align:center !important;font-size:1rem !important'>" + next.msg + "</div>";
      break;
    case "confirm":
      showObj.html = "<div style='text-align:center !important;font-size:1rem !important'>" + next.msg + "</div>";
      showObj.showCancelButton = true
      showObj.cancelButtonText = '取消'
      showObj.cancelButtonClass = "swal-btn-size"
      break;
    case "message":
      showObj.html = "<div style='text-align:center !important;font-size:1.5rem !important'>" + next.title + "</div>" +
        "<div style='text-align:left !important;font-size:1rem !important'>" + next.msg + "</div>";
      showObj.showCancelButton = true
      showObj.cancelButtonText = '返回'
      showObj.cancelButtonClass = "swal-btn-size"
      break;

    case "input":
      if (next.val == null) {
        next.val = "";
      }
      showObj.html = "<div style='padding-left:0.6rem;text-align:left !important;font-size:1rem !important'>" + next.msg + "</div>";
      showObj.input = 'text'
      showObj.inputValue = next.val
      showObj.inputClass = "swal-input-bottom"
      showObj.showCancelButton = true
      showObj.cancelButtonText = '取消'
      showObj.cancelButtonClass = "swal-btn-size"
      break;
  }

  var s;
  try {
    swalShowing = true;
    s = swal(showObj);
  } catch (e) {
    alert(e);
    showNext();
    return;
  };
  if (!s) {
    alert("no swal");
    showNext();
    return;
  }

  var timeout = null;
  if (next.timeout) {
    timeout = setTimeout(function() {
      closeSwal();
      if (next.timeoutCb) next.timeoutCb()
      // 递归调用直到读空为止
      showNext();
    }, next.timeout);
  }

  s.then(function(...args) {
    clearTimeout(timeout);
    // 递归调用直到读空为止
    showNext();

    if (args && args.length > 0 && args[0].dismiss) {
      if (next.cancelCb) {
        next.cancelCb(...args);
      }
    } else {
      if (next.confirmCb) {
        next.confirmCb(...args);
      }
    }
  }, function(...args) {
    clearTimeout(timeout);
    // 递归调用直到读空为止
    showNext();

    if (next.cancelCb) {
      next.cancelCb(...args);
    }
  })

}

function showSwal(obj) {
  swalArr.push(obj)
  if (swalShowing) {
    return;
  }
  showNext();
};

function AutoAlert(msg, timeout, cb) {
  showSwal({
    type: "alert",
    msg: msg + "<br/>(" + timeout / 1000 + "秒后将自动关闭)",
    confirmCb: cb,
    timeout: timeout,
    timeoutCb: cb,
  });
}

// 警告框
function Alert(msg, cb) {
  AutoAlert(msg, 10 * 1000, cb);
};

// 提示框
function Tips(msg, cb) {
  showSwal({
    type: "tips",
    msg: msg,
    confirmCb: cb,
  });
}

// 带自动确认的计时器
// timeout -- 单位为秒
function AutoConfirm(msg, timeout, confirmCb, cancelCb) {
  Confirm(msg + "<br/>(" + timeout / 1000 + "秒后自动确定)", confirmCb, cancelCb, {
    timeout: timeout,
    timeoutCb: function() {
      if (confirmCb) confirmCb();
    },
  })
}

// 带自动取消的确认框
function AutoCancel(msg, timeout, confirmCb, cancelCb) {
  Confirm(msg + "<br/>(" + timeout / 1000 + "秒后自动取消)", confirmCb, cancelCb, {
    timeout: timeout,
    timeoutCb: function() {
      if (cancelCb) cancelCb();
    },
  })
}

// 确认框
function Confirm(msg, confirmCb, cancelCb, opt) {
  showSwal({
    type: "confirm",
    msg: msg,
    confirmCb: confirmCb,
    cancelCb: cancelCb,
    timeout: opt ? opt.timeout : null,
    timeoutCb: opt ? opt.timeoutCb : null,
  })
  return;
};

// 带确认的消息
function Message(title, msg, confirmCb, cancelCb) {
  showSwal({
    type: "message",
    title: title,
    msg: msg,
    confirmCb: confirmCb,
    cancelCb: cancelCb,
  })
  return;
};

// 带输入的框
function Input(msg, val, confirmCb, cancelCb) {
  showSwal({
    type: "input",
    msg: msg,
    val: val,
    confirmCb: confirmCb,
    cancelCb: cancelCb,
  })
  return;
}

function runCode() {
  var old = getStore("run_code")
  if (!old || old.length == 0) {
    old = "1|home";
  }
  Input("到指定的场景后输入执行代码,格式：需重复的次数|指令, 如：3|home", old, function(input) {
    var val = input.value;
    if (!val) {
      return
    }
    var arr = val.split("|")
    if (arr.length != 2) {
      Alert("指令格式错误")
      return
    }
    var times = parseInt(arr[0])
    if (!times) {
      Alert("次数错误")
      return
    }
    setStore("run_code", val)
    var execStr = arr[1]
    if (execStr.indexOf("clickButton") > -1) {
      var countTimer = setInterval(function() {
        times--;
        if (times == 0) {
          clearInterval(countTimer);
          return;
        }
        eval(execStr);
      }, 200)
      return
    } else {
      goWithTimes(times, execStr)
    }
  })
}

function travelNodes(nodes) {
  if (!nodes || nodes.length == 0) return "";

  var msg = "";
  for (var i = 0; i < nodes.length; i++) {
    var newMsg = travelNodes(nodes[i].children);
    if (newMsg.length > 0) {
      msg += (newMsg)
      continue
    }
    var clickMsg = nodes[i].getAttribute('onclick');
    if (clickMsg) {
      msg += (nodes[i].innerText + ":" + clickMsg + "<br/>")
    }
  }
  return msg
}

function getCodeFunc() {
  var nodes = document.getElementById("out").children;
  var code = "代码信息：<br/>";
  if (!inBattle()) {
    code += travelNodes(nodes);
  }
  Alert(code);
  return;
}

function testing() {
  Input("消息", "channel|sys|青龙会组织：[76-80区]二娘正在书房施展力量，本会愿出破岳拳套碎片的战利品奖励给本场战斗的最终获胜者。这是本大区第18个跨服青龙。", function(input) {
    var msg = input.value;
    var msgs = msg.split("|")
    var b = new Map();
    b.put("type", msgs[0]);
    b.put("subtype", msg[1]);
    b.put("msg", msg[2]);
    mainDispatchMsg(b, msgs[0], msgs[1], msgs[2]);
  });
}

// window.game = this;
// 聊天消息接收注入
var dispatchListeners = {};

function addDispatchListener(key, cb) {
  dispatchListeners[key] = cb;
}

function delDispatchListener(key) {
  delete dispatchListeners[key];
}

// 记录背包的内容，用于切换装备
var pkgItems = [];
// [{key:"items10","value":"equip_by_surcoat10,[31m鎏金缦罗[2;37;0m*[1;32m生命[2;37;0m之披风,1,1,个"}]
// value: id,name,num,on,uint

var restored = false;

function translateDispatch(b) {
  // var room = g_obj_map.get("msg_room");
  var type = b.get("type")
  var subtype = b.get("subtype");
  if (type == "items" && pkgOrder == "1") {
    // 整理背包
    orderPkg(b);
  }
  if (devDebug == "1") Log(type, subtype, b);

  // 发送给游戏端
  gSocketMsg.bakDispatchMsg(b);

  switch (type) {
    case "vs":
      // 战斗优先处理
      switch (subtype) {
        case "vs_info":
          // 初始化的战场信息
          if (b.containsKey("is_watcher")) {
            inBattleView = true;
            break;
          }
          inBattleFight = true;
          break;
        case "text":
          if (inBattleFight) {
            if (!battlingSkills.skillInit) {
              battlingSkills.skillInit = true;
              var bInfo = getBattleInfo();
              if (!bInfo) return;
              var xdz = bInfo.get(battleMyHead + "_xdz" + battleMyPos);
              battlingSkills.xdz = xdz;
              if (!battlingSkills.xdz) {
                Log("init xdz:", bInfo, battleMyHead + "_xdz" + battleMyPos, xdz, msg, battlingSkills)
              }
              if (!killTianJianTrigger) {
                // 完成初始战斗时发一个气值事件以便触发战斗
                inBattleEvent(battleTriggerData);
              }
            }
          } else {
            battlingSkills.clear();
          }
          break;
        case "next_skill":
        case "ready_skill":
          if (b.get("uid").indexOf(accId) < 0) {
            break;
          }
          battlingSkills.ready();
          break;
        case "add_xdz":
          battlingSkills.xdz = parseInt(b.get("xdz"));
          break;
        case "out_watch":
          // closeBattleResult(); // 关闭战斗结束的界面
          // 退出观战
          inBattleView = false;
          inBattleFight = false;
          battlingSkills.clear();
          break;
        case "combat_result":
          // closeBattleResult(); // 关闭战斗结束的界面
          // 退出正式战斗
          inBattleView = false;
          inBattleFight = false;
          battlingSkills.clear();
          break;
        default:
          // console.log(b.get("type"), b.get("subtype"), b);
          break;
      }
      break;
  }

  // 天剑打开时，不处理其他
  if (killTianJianTrigger) return;

  // 逻辑端未准备好
  if (!window.restoreData || !window.g_obj_map || !g_obj_map.get("msg_attrs")) return;
  // 执行配置恢复
  if (!restored) {
    restored = true;
    restoreData();
  }

  var msg = b.get("msg");
  if (!msg) {
    msg = ""
  } else {
    msg = dispatchMsg(msg)
  };

  // 发送给脚本逻辑端
  mainDispatchMsg(b, type, subtype, msg);
}

// 由转发数据
function mainDispatchMsg(b, type, subtype, msg) {
  if (type == "items" && subtype == "list") {
    pkgItems = b.elements;
  }

  // 需要转发的消息
  for (var key in dispatchListeners) {
    dispatchListeners[key](b, type, subtype, msg);
  }
}
// 注册信息监听
(function() {
  if (!window.gSocketMsg) return;
  var bakDispatchMsg = gSocketMsg.dispatchMessage;
  gSocketMsg.bakDispatchMsg = bakDispatchMsg;
  gSocketMsg.dispatchMessage = translateDispatch;
})();

// 注意send需要在对方加载后再加载本脚本。
var devDebug = "0";
var oldSend = this.send;
var send = function(a) {
  if (devDebug == "1") Log("send:", a);
  oldSend(a);
};

var pkgOrder = "1";

// 整理背包
// 由wasm调用
function orderPkg(b) {
  var newItems = [];
  var oldItems = [];
  var oldStores = [];
  for (var i in b.elements) {
    var key = b.elements[i].key;
    if (!key) continue
    var val = b.elements[i].value;
    if (!val) continue

    var vals = dispatchMsg(val).split(",");
    if (key.indexOf("items") > -1) {
      var idx = parseInt(key.split("items")[1])
      if (idx < 11) {
        newItems.push({
          index: idx,
          value: val,
        });
      } else {
        oldItems.push({
          name: vals[1],
          value: val,
        });
      }
    } else if (key.indexOf("stores") > -1) {
      oldStores.push({
        name: vals[1],
        value: val,
      });
    }
    // ignore else
  }

  var orderByIndex = function(a, b) {
    return a.index - b.index
  };
  // 重写顺序
  newItems.sort(orderByIndex);
  for (var i = 0; i < newItems.length; i++) {
    b.put("items" + (i + 1), newItems[i].value);
  }

  var orderByName = function(a, b) {
    return a.name.localeCompare(b.name);
  };
  oldItems.sort(orderByName);
  for (var i = oldItems.length - 1; i > -1; i--) {
    b.put("items" + (i + 1 + newItems.length), oldItems[i].value);
  }
  oldStores.sort(orderByName);
  for (var i = oldStores.length - 1; i > -1; i--) {
    b.put("stores" + (i + 1), oldStores[i].value);
  }
}

function orderPackageFunc() {
  Input("背包排序. 0, 使用系统;1,按名称排序", pkgOrder, function(input) {
    var val = input.value;
    if (val == null) return;
    pkgOrder = parseInt(val);
    setStore("pkgOrder", pkgOrder);
    go("items"); // 打开背包
  });
}

// 写入个人信息屏幕提示
function WriteToScreen(html) {
  var m = new Map();
  m.put("type", "main_msg");
  m.put("subtype", "html");
  m.put("msg", html)
  // mainDispatchMsg(m)
  gSocketMsg.dispatchMessage(m);
}

// 订阅系统消息
var sysMsgListener = {};

// 注意，key不支持英文字符, 否则无法匹配关键字
function addSysMsgListener(key, hit, fn) {
  sysMsgListener[key] = {
    hit: hit,
    fn: fn,
  };

}

function delSysMsgListener(key) {
  delete sysMsgListener[key]
}

// 订阅系消息结束
function commonSysMsg(b, type, subtype, msg) {
  if (type != "channel" || subtype != "sys") return;
  var hitObjs = ContainsChineseKey(msg, sysMsgListener);
  if (!hitObjs || hitObjs.length == 0) return;
  for (var i = hitObjs.length - 1; i > -1; i--) {
    hitObjs[i].fn(b, type, subtype, msg);
  }
}
addDispatchListener("sysMsgListener", commonSysMsg);

// 订阅帮派消息
var clanMsgListener = {};

// 注意，key不支持英文字符, 否则无法匹配关键字
function addClanMsgListener(key, hit, fn) {
  clanMsgListener[key] = {
    hit: hit,
    fn: fn,
  }
}

function delClanMsgListener(key) {
  delete clanMsgListener[key]
}

// 订阅系消息结束
function commonClanMsg(b, type, subtype, msg) {
  if (type != "channel" || subtype != "clan") return;
  var hitObjs = ContainsChineseKey(msg, clanMsgListener);
  if (!hitObjs || hitObjs.length == 0) return;
  for (var i = hitObjs.length - 1; i > -1; i--) {
    hitObjs[i].fn(b, type, subtype, msg);
  }
}
addDispatchListener("clanMsgListener", commonClanMsg);

// 订阅状态消息
var noticeMsgListener = {};

// 注意，key不支持英文字符, 否则无法匹配关键字
function addNoticeMsgListener(key, hit, fn) {
  noticeMsgListener[key] = {
    hit: hit,
    fn: fn,
  }
}

function delNoticeMsgListener(key) {
  delete noticeMsgListener[key]
}

// 订阅状态消息结束
function commonNoticeMsg(b, type, subtype, msg) {
  if (type != "notice" && type != "main_msg") return;
  var hitObjs = ContainsChineseKey(msg, noticeMsgListener);
  if (!hitObjs || hitObjs.length == 0) return;
  for (var i = hitObjs.length - 1; i > -1; i--) {
    hitObjs[i].fn(b, type, subtype, msg);
  }
}
addDispatchListener("noticeMsgListener", commonNoticeMsg);
addNoticeMsgListener("listenHanbinchangFunc", "你從寒玉床上爬起", function(b, type, subtype, msg) {
  go('sleep_hanyuchuang'); // 寒玉床
})
// 你从地髓石乳中出来，发现自己变强了。
addNoticeMsgListener("listenDishuishiruFunc", "你從地髓石乳中出來", function(b, type, subtype, msg) {
  go('sleep_hanyuchuang'); // 寒玉床
});

// 是否存在挂机锁,若是,不执行操作
function hasLeft() {
  if (cmdGroup.length > 0) return true; // 有指令正在执行，不执行新的操作
  if (taskLocking) return true; // 正在执行自动任务, 不再执行其他自动任务。
  if (checkHome()) return false; // 在主页，可以执行。
  if (inBattle()) return true;

  // 检查是否在指定区
  var roomName = getRoomName();
  switch (roomName) {
    case "玄冰室":
    case "北車道":
    case "藏嬌閣":
    case "凝香閣":
    case "沁芳閣":
    case "繡冬堂":
      return true;
  }
  return false;
}

// 检测是否在本服主页
function checkHome(callback) {
  if (!callback) return;
  var inHome = gSocketMsg.is_in_home();
  callback(inHome)
  return inHome;
}

//
//  战斗组监听器
//

// 检查是否在战斗中
var inBattleView = false;
var inBattleFight = false;
var failToBattleEventKind = -1;
var toBattleFightEventKind = 0;
var toBattleKillEventKind = 1;
var inBattleEventKind = 2;
var battleListener = {};
var battleTrigger = null;
var battleTriggerData = null; // new Map();

var battleMyIdx = 0;
var battleMyPos = "0";
var battleMyHead = "";
var battleMyVal = "";

var battleCureOn = false; // 自动回血开启
var battleBuxuanOn = false; // 自动步玄开启
var battleBxOn = false; // 自动碧血开启
var battleBsOn = false; // 自动白首开启
var battleLxOn = false; // 自动龙象开启
var battleZxOn = false; // 自动紫霞开启
var battleTxOn = false; // 自动天邪开启
var battleFollowOn = false; // 开跟招开启
var battleArrayOn = false; // 自动阵开启
var battleFocusOn = false; // 集火开启
var battleBreakOn = false; // 破招开启

// 使用技能组
function useAllSkills(skillNames) {
  var skl = []; 
  $.each(skillNames, function(i, v) {
	var snm = rs(v);
	skl.push(snm)
  })
  battlingSkills.useAll(skl);
}

// 使用任一技能
function useAnySkill(breakSkillNames) {
  var snm = rs(breakSkillNames);
  return battlingSkills.useAny(snm)
}

// 天剑专用
function useTianjianSkill(skillName) {
  return battlingSkills.play(skillName)
}


// 获取叫杀代码
function getIndexRoomNpc(idx, names, anyOne, newOne) {
  var roomInfo = g_obj_map.get("msg_room");
  if (!roomInfo) return null;
  var npcInfo = roomInfo.get("npc" + idx)
  if (!npcInfo) return null;
  var attrs = npcInfo.split(",");
  var dispName = dispatchMsg(attrs[1]);

  // 跳过白名NPC
  if (!anyOne && attrs[1] == dispName) return null;
  for (var i = 0; i < names.length; i++) {
    if (names[i] != dispName) continue;
    return {
      key: "npc" + idx,
      code: attrs[0],
      name: attrs[1],
      dispName: dispName,
      inputIdx: i,
    };
  }
  return null;

}

function getNextRoomNpc(npc, oppIdx) {
  var roomInfo = g_obj_map.get("msg_room");
  if (!roomInfo) return null;
  var curIdx = parseInt(npc.key.substring(3));
  var nextKey = npc.key.substring(0, 3) + (curIdx + oppIdx);
  var val = roomInfo.get(nextKey);
  if (!val) return null;
  var attrs = val.split(",")
  return {
    key: nextKey,
    code: attrs[0],
    name: attrs[1],
    dispName: dispatchMsg(attrs[1]),
    inputIdx: 0,
  }
}

function matchRoomNpc(names, anyOne, newOne) {
  var roomInfo = g_obj_map.get("msg_room");
  if (!roomInfo) return null;
  var result = null;
  if (newOne) {
    // 执行反序查找
    for (var i = roomInfo.elements.length - 1; i > -1; i--) {
      result = getIndexRoomNpc(i, names, anyOne, newOne);
      if (!result) continue;
      return result;
    }
  } else {
    // 执行正序序查找
    for (var i = 0; i < roomInfo.elements.length; i++) {
      result = getIndexRoomNpc(i, names, anyOne, newOne);
      if (!result) continue;
      return result;
    }
  }
  return null;
}

// 安全关闭战斗结束界面
function closeBattleResult() {
  //  if ($('span.outbig_text:contains(戰鬥結束)').length > 0) {
  //    clickButton("prev_combat");
  //  }
  if (!gSocketMsg._page) return;
  for (var i = gSocketMsg._page.length - 1; i > -1; i--) {
    if (gSocketMsg._page[i] != "combat_result_info") continue
    clickButton("prev_combat");
    return;
  }
}

function getBattleInfo() {
  var vsInfo = g_obj_map.get("msg_vs_info");
  if (!vsInfo) {
    vsInfo = new Map();
  }
  // key like : vs1_pos4
  if (vsInfo.elements.length > battleMyIdx &&
    vsInfo.elements[battleMyIdx].value == battleMyVal &&
    vsInfo.elements[battleMyIdx].key == battleMyHead + "_pos" + battleMyPos) {
    // 已初始化完成
    return vsInfo
  }

  // 首次进入战场时初始化数据,  提取出我方的数据
  for (var i = vsInfo.elements.length - 1; i > -1; i--) {
    var val = vsInfo.elements[i].value + "";
    if (!val || val.indexOf(accId) < 0) continue;
    // key like : vs1_pos4
    battleMyIdx = i;
    battleMyPos = vsInfo.elements[i].key.charAt(7);
    battleMyHead = vsInfo.elements[i].key.substring(0, 3);
    battleMyVal = val;
    break;
  }
  return vsInfo;
}

function getBattlePosByUid(uid) {
  // 若是觀戰，以觀戰id進行識別
  if (uid == accId && inBattleView) {
    var watchId = bInfo.get("is_watcher");
    if (!watchId) uid = watchId
  }
  var info = getBattleInfo();
  for (var i = info.elements.length - 1; i > -1; i--) {
    // key like : vs1_pos4
    var val = info.elements[i].value + "";
    if (val.indexOf(uid) < 0) continue;
    var head = info.elements[i].key.substring(0, 3);
    var pos = info.elements[i].key.charAt(7);
    var allName = dispatchMsg(info.get(head + "_name" + pos));
    var name = allName;
    var names = allName.split("]");
    if (names && names.length > 1) {
      name = names[1];
    }

    return {
      head: head,
      pos: pos,
      allName: allName,
      name: name,
      friend: head == battleMyHead,
    }
  }
  return null;
}

function getBattlePosByName(name) {
  var info = getBattleInfo();
  for (var i = info.elements.length - 1; i > -1; i--) {
    // key like : vs1_name4
    var val = info.elements[i].value + "";
    if (val.indexOf(name) < 0) continue;
    var head = info.elements[i].key.substring(0, 3);
    var pos = info.elements[i].key.charAt(8);
    return {
      head: head,
      pos: pos,
      name: name,
      friend: head == battleMyHead,
    }
  }
  return null;
}

function getBattleUidByTxt(txt) {
  var info = getBattleInfo();
  for (var i = info.elements.length - 1; i > -1; i--) {
    if (info.elements[i].key.indexOf("name") < 0) continue;
    var val = dispatchMsg(info.elements[i].value);
    if (txt.indexOf(val) < 0) continue;
    // found user
    return info.get(info.elements[i].key.replace("name", "pos"))
  }

  // 未找到时默认是自己放的
  return accId
}

function addBattleListener(key, fn) {
  battleListener[key] = fn;
}

function delBattleListener(key) {
  delete battleListener[key];
}

function resetBattleEvent() {
  // 退出正式战斗
  inBattleView = false;
  inBattleFight = false;
  txIn = false;
  zxIn = false;
  bxIn = false;
  bsIn = false;
  lxIn = false;
  battleCureTimes = 0;
  clearInterval(battleTrigger);
  battleTrigger = null;
}

function inBattleEvent(b, type, subtype, msg) {
  if (!b) return;
  if (!type) type = b.get("type");
  if (!subtype) subtype = b.get("subtype");

  if (battleTrigger == null) {
    battleTriggerData = new Map();
    battleTriggerData.put("type", "vs");
    battleTriggerData.put("subtype", "sec_timer");

    battleTrigger = setInterval(function() {
      // 如果存在气的定时器，使用服务器的定时器
      if (battlingSkills.xdz < 10) return;
      inBattleEvent(battleTriggerData);
    }, 1000)
  }

  switch (subtype) {
    case "vs_info":
      // 初始化的战场信息
      if (b.containsKey("is_watcher")) {
        inBattleView = true;
        inBattleFight = false;
        break;
      }
      inBattleFight = true;
      break;
    case "sec_timer":
      // 每秒定时器事件，因回气事件是不可靠的，因此使用本地计时器
      break;
    case "add_xdz":
      // 回气事件
      // battlingSkills.xdz = parseInt(b.get("xdz"));
      inBattleEvent(battleTriggerData);
      break;
    case "text":
      // 战斗文本
      break;
    case "playskill":
      // 使用的技能信息(对面已无此信息)
      break;
    case "out_watch":
      // 退出观战
      resetBattleEvent();
      break;
    case "combat_result":
      // 正式退出战斗
      resetBattleEvent();
      break;
    default:
      // console.log(b.get("type"), b.get("subtype"), b);
      break;
  }

  for (var key in battleListener) {
    battleListener[key](b, type, subtype, msg, inBattleEventKind);
  }

  if (battleCureOn && doAutoCure(b, type, subtype, msg)) return
  if (battleBuxuanOn && autoBuxuanSkillMon(b, type, subtype, msg)) return
  if (battleBxOn && autoBxSkillMon(b, type, subtype, msg)) return
  if (battleBsOn && autoBsSkillMon(b, type, subtype, msg)) return
  if (battleLxOn && autoLxSkillMon(b, type, subtype, msg)) return
  if (battleZxOn && autoZxSkillMon(b, type, subtype, msg)) return
  if (battleTxOn && autoTxSkillMon(b, type, subtype, msg)) return
  if (battleFollowOn && followSkillMon(b, type, subtype, msg)) return
  if (battleArrayOn && doAttack(b, type, subtype, msg)) return
  if (battleFocusOn && focusAttackMon(b, type, subtype, msg)) return
  if (battleBreakOn && doFightAll(b, type, subtype, msg)) return
  return;
}

// 注册战斗接收器
addDispatchListener("battleListener0", function(b, type, subtype, msg) {
  var type = b.get("type");
  var subtype = b.get("subtype");

  // 失败的通知，需要注册者进一步识别
  if (type == "notice" && subtype == "notify_fail") {
    for (var key in battleListener) {
      battleListener[key](b, type, subtype, msg, failToBattleEventKind);
    }
    return;
  }

  if (type != "main_msg") return;
  if (!msg) return;
  var mainMsg = msg;
  if (mainMsg && mainMsg.length > 4 && mainMsg.indexOf("幫派") > -1 && mainMsg.indexOf("選擇了『") > -1) {
    if (yytempleCommit < "1") return;
    goWithTimes(4, "clan bzmt puzz");
    return;
  }

  var sMsg = msg;
  if (sMsg.indexOf("對著") < 0) return; // 过滤非指定的数据，以便提高检测效率

  // 通知有杀的事件
  var matchKill = msg.match(/(.*)對著(.*)喝道：「(.*)！今日不是你死就是我活！」/);
  if (matchKill && matchKill[1] != "你") {
    Log("matchKill", matchKill);
    for (var key in battleListener) {
      battleListener[key](b, type, subtype, msg, toBattleKillEventKind, matchKill);
    }
    return;
  }

  // 通知有比试事件
  var matchFight = msg.match(/(.*)對著(.*)說道：(.*)，領教(.*)的高招！/);
  if (matchFight && matchFight[1] != "你") {
    Log("matchFight", matchFight);
    for (var key in battleListener) {
      battleListener[key](b, type, subtype, msg, toBattleFightEventKind, matchFight);
    }
    return;
  }
  return;

});
addDispatchListener("battleListener1", function(b, type, subtype, msg) {
  if (type == "vs") {
    // 收到进入战斗的事件
    inBattleEvent(b, type, subtype, msg);
  }
  return;
});

function inBattle() {
  // TODO: lookup local
  return inBattleView || inBattleFight;
}



// 战斗场景技能数据
var battlingSkills = {
  skillInit: false,
  skillInited: false,
  data: [{
    Enable: false,
    Pos: 1,
    Key: "playskill 1",
    Name: "",
    Xdz: 0,
  }, {
    Enable: false,
    Pos: 2,
    Key: "playskill 2",
    Name: "",
    Xdz: 0,
  }, {
    Enable: false,
    Pos: 3,
    Key: "playskill 3",
    Name: "",
    Xdz: 0,
  }, {
    Enable: false,
    Pos: 4,
    Key: "playskill 4",
    Name: "",
    Xdz: 0,
  }, {
    Enable: false,
    Pos: 5,
    Key: "playskill 5",
    Name: "",
    Xdz: 0,
  }, {
    Enable: false,
    Pos: 6,
    Key: "playskill 6",
    Name: "",
    Xdz: 0,
  }],
  xdz: -1,
  clear: function() {
    this.skillInit = false;
    this.skillInited = false;
    this.xdz = -1;
  },
  init: function() {
    if (!this.skillInit) return

    var bInfo = getBattleInfo();
    if (!bInfo) return;
    for (var i = this.data.length - 1; i > -1; i--) {
      this.data[i].Enable = false;
    }
    this.xdz = parseInt(bInfo.get(battleMyHead + "_xdz" + battleMyPos));
    for (var i = 0; i < 6; i++) {
      var btn = g_obj_map.get("skill_button" + (i + 1));
      if (!btn) continue;
      this.data[i].Enable = true;
      this.data[i].Name = dispatchMsg(btn.get("name"));
      this.data[i].Xdz = parseInt(btn.get("xdz"));
    }
    this.skillInited = true;
  },
  play: function(name) {
    if (!name) return;
    if (!this.skillInit) return
    if (!this.skillInited) {
      this.init();
    }

    // Log("skills", this.xdz, this.data);
    // 只能顺序查找，因为当技能不全时，后面的会出假技能
    var skill = null;
    for (var i = 0; i < this.data.length; i++) {
      var sk = this.data[i];
      if (!sk) continue;
      if (!sk.Enable) continue;
      if (sk.Name != name) continue;
      if (sk.Xdz > this.xdz) continue; // 气不足
      skill = sk;
      // 标记其他技能为不可用
      this.data[i].Enable = false;
      break;
    }
    if (!skill) {
      Log("Invalid Skill:", name);
      return false;
    }
    // Log("Play Skill:", name);
    this.xdz -= skill.Xdz;
    clickButton(skill.Key, 0)
    return true
  },
  ready: function() {
    this.init();
  },
  useAny: function(skillNames) {
    var namesLen = skillNames.length;
    if (namesLen == 0) {
      return false
    }
    for (var i = 0; i < namesLen; i++) {
      if (this.play(skillNames[i])) {
        return true
      }
    }
  },
  useAll: function(skillNames) {
    var namesLen = skillNames.length;
    if (namesLen == 0) {
      return false
    }
    for (var i = 0; i < namesLen; i++) {
      this.play(skillNames[i])
    }
  },
};

//-------------------------分割线-----------

var cmdGroup = [], // 命令组
  cmdCache = [], // 当前执行组
  cmdParam = null, //  当前执行组的完成回调器
  cmdDelayTimer = null, // 定时器句柄
  cmdDelayTime = 200, // 命令延迟时间
  cmdEmptyTimes = 0;
var taskLocking = false;

function stopCmd() {
  clearInterval(cmdDelayTimer);
  cmdDelayTimer = null;
  cmdCache = [];
  cmdGroup = [];
}

// 执行一组的命令
var hasResp = true;
addDispatchListener("cmdResp", function() {
  hashResp = true;
})

function execCmd() {
  // 执行命令池中第一个命令，并从池中删除
  if (!sock || !hasResp) return;
  // 空数组
  if (cmdCache.length == 0) return;

  var cmd = cmdCache.shift();

  // 空指令，跳过
  if (cmd.length == 0) execCmd();

  // 遇到了结束的标志, 执行结束并调用回调
  if (cmd == '\0') {
    // 已没有可执行的任务, 执行完成的回调
    // 需要注意，该回调被调用时，仅代表命令被执行了，不代表服务器已响应了。
    if (cmdParam.end) cmdParam.end();
    delayCmd(); // call the next group immediately
    return;
  } else {
    // 执行正确的指令
    hashResp = false;
    clickButton(cmd, cmdParam.btn);
  }
}

function delayCmd() {
  // 检查当前执行器是否存在可执行的任务
  if (cmdCache.length > 0) {
    cmdEmptyTimes = 0;
    execCmd();
    return;
  }

  if (cmdGroup.length > 0) {
    cmdCache = [];
    var newCmd = cmdGroup.shift();
    // 解析命令存入命令池中
    cmdCache = cmdCache.concat(newCmd.str.split(";"));
    cmdCache.push('\0'); // signal of end.
    cmdParam = newCmd;
    // 开始执行前，先通知要开始了
    if (cmdParam.begin) cmdParam.begin();
    delayCmd();
    return;
  }

  // 等待10轮后再释放，以便在频繁的新命令下可以减少执行器的创建。
  cmdEmptyTimes++;
  if (cmdEmptyTimes < 10) return;

  if (cmdDelayTimer == null) return;
  clearInterval(cmdDelayTimer);
  cmdDelayTimer = null;
}

// 重设置定时器时间, 单位毫秒
function resetCmdTimer(ms) {
  cmdDelayTime = ms;
  var delay = cmdDelayTimer != null;
  if (delay) {
    clearInterval(cmdDelayTimer);
  }
  // 重新生成计时器
  cmdDelayTimer = setInterval(delayCmd, cmdDelayTime);
}

function getGoParam(str, obj) {
  var param = {
    str: str
  }
  if (typeof(obj) == "function") {
    param.end = obj;
  } else if (obj) {
    param.btn = obj.btn;
    param.begin = obj.begin;
    param.end = obj.end;
  }
  return param;
}
// 执行命令串
// delay为值时，执行200秒间隔执行
// go("e",{btn:1}) == clickButton("e",1);
function go(str, obj) {
  if (!str) return;

  var param = getGoParam(str, obj);
  cmdGroup.push(param);
  if (cmdDelayTimer == null) {
    resetCmdTimer(cmdDelayTime);
  }
}

function goFast(str, obj) {
  if (!str) return;
  var param = getGoParam(str, obj);
  if (param.begin) param.begin();
  var arr = str.split(";");
  // 快速执行
  for (var i = 0; i < arr.length; i++) {
    clickButton(...(arr[i].split(',')));
  }
  if (param.end) param.end();
}

// 按次数执行
function cmdWithTimes(times, str) {
  if (!times && times < 1) return;
  var arr = [];
  for (var i = 0; i < times; i++) {
    arr.push(str);
  }
  return arr.join(";") + ";"
}

function goWithTimes(times, str, obj) {
  if (!times && times < 1) return;
  go(cmdWithTimes(times, str), obj);
}

//按钮加入窗体中----------------------------
function isContains(str, substr) {
  return str.indexOf(substr) > -1;
}

var popbk = {};
var popList = {};
var popBtnList = {};
var popButtonHeight = '20px';

function createPop(a) {
  var b = document.createElement('div');
  popbk[a] = b;
  b.style.position = 'absolute';
  b.style.top = '0';
  b.style.width = '100%';
  b.style.height = '100%';
  b.style.zIndex = '100';
  b.style.display = 'none';
  document.body.appendChild(b);
  var c = document.createElement('div');
  c.style.position = 'absolute';
  c.style.top = '0';
  c.style.width = '100%';
  c.style.height = '100%';
  b.appendChild(c);

  function closepop() {
    b.style.display = 'none'
  }
  c.addEventListener('click', closepop);

  var d = document.createElement('div');
  popList[a] = d;
  d.style.position = 'absolute';
  d.style.top = '100px';
  d.style.width = '325px';
  d.style.padding = '10px 5px 10px 0px';
  d.style.background = "rgba(175,175, 100, 0.9)"; // '#f0f0f0';
  d.style.textAlign = 'center';
  d.style.border = '2px solid #ccc';
  b.appendChild(d);
  return b
}

function createPopButton(a, b, c) {
  var d = document.createElement('button');
  d.innerText = a;
  d.style.padding = '0';
  d.style.margin = '5px 0 0 5px';
  d.style.width = '60px';
  d.style.height = '20px';
  d.style.height = popButtonHeight;
  d.addEventListener('click', c);
  popList[b].appendChild(d);
  popBtnList[a] = d;
}

// 显示弹出式菜单
function showPopGroup(b) {
  for (var key in popbk) {
    if (key == b) {
      popbk[key].style.display = '';
      var rightMenuStart = 0;
      if (innerWidth > innerHeight) {
        rightMenuStart = innerWidth - innerHeight * 9 / 16 - 420
      }
      // rightMenuStart = rightMenuStart / 16 转为字符长度
      popList[b].style.left = (innerWidth - rightMenuStart - 265) / 2 + 'px';
    } else {
      popbk[key].style.display = 'none';
    }
  }
}

// 隐藏弹出式菜单
function hidePopGroup(b) {
  popbk[b].style.display = 'none';
}


// 去指定地
function goPlace(name, way, doneFn, stageFn) {
  execNav(way, {
    stageFn: stageFn,
    doneFn: doneFn,
  });
}

// 进商城 -----------------------------------------------
function goShopFunc() {
  go('shop');
}

// 买灵芝
function buyMedicineFunc(medicalKind) {
  var qiannian = "buy /map/snow/obj/qiannianlingzhi_N_10 from snow_herbalist"
  var wannian = "buy /map/snow/obj/wannianlingzhi_N_10 from snow_herbalist"
  var lzCmd = qiannian;
  var lzName = "千年靈芝";
  if (medicalKind == "wannian") {
    lzCmd = wannian;
    lzName = "万年靈芝";
  }
  Input("请输入购买" + lzName + "数量，只能输入10的倍数：", "10", function(input) {
    var num = parseInt(input.value)
    if (num > 0) {
      num = parseInt(num / 10);

      var roomName = getRoomName();
      if (roomName == "桑鄰藥鋪") {
        goWithTimes(num, lzCmd);
        return;
      }

      execNav('jh 1;e;n;n;n;w;', function() {
        goWithTimes(num, lzCmd);
      });
      return;
    }
  })
}

// 签到--------------------------------------------------------
var clanBuyCfg = 0;

function setClanBuyOn(idx) {
  clanBuyCfg |= (1 << idx)
}

function setClanBuyOff(idx) {
  clanBuyCfg &= (~(1 << idx))
}

function clanBuy(idx, exec) {
  if (exec) setClanBuyOn(idx);
  switch (idx) {
    case 0:
      // 是否购买帮派引路蜂(10x 活跃度x5)
      if (exec) goWithTimes(10, "clan buy 101");
      return "引路蜂(10x 活跃度x5)";
    case 1:
      // 是否购买帮派分身卡(2x 活跃度x50)?
      if (exec) goWithTimes(2, "clan buy 102");
      return "分身卡(2x 活跃度x50)";
    case 2:
      // 是否购买帮派突破丹(2x 活跃度x30)?
      if (exec) goWithTimes(2, "clan buy 201");
      return "突破丹(2x 活跃度x30)";
    case 3:
      // 是否购买帮派保险卡(2x 活跃度x30)?
      if (exec) goWithTimes(2, "clan buy 202;items use obj_baoxianka");
      return "保险卡(2x 活跃度x30)";
    case 4:
      // 是否购买帮派悬红令(4x 声望x500 元宝x500)?
      if (exec) goWithTimes(4, "clan buy 203");
      return "悬红令(4x 声望x500 元宝x500)";
    case 5:
      // 是否购买帮派白银宝箱(5x 活跃度x20)?
      if (exec) goWithTimes(5, "clan buy 301");
      return "白银宝箱(5x 活跃度x20)";
    case 6:
      // 是否购买帮派金锭(5x 活跃度x30)?
      if (exec) goWithTimes(5, "clan buy 302");
      return "金锭(5x 活跃度x30)";
    case 7:
      // 是否购买帮派高突(活跃度x200)?
      if (exec) go("clan buy 401");
      return "高突(活跃度x200)";
    case 8:
      // 是否购买帮派黄金钥匙(活跃度x500)?
      if (exec) go("clan buy 501");
      return "黄金钥匙(活跃度x500)";
    case 9:
      // 是否购买帮派迷题令(声望x1000)?
      if (exec) go("clan buy 502");
      return "迷题令(声望x1000)";
    case 10:
      // 是否购买帮派空识卷轴(活跃度x200 声望x200)?
      if (exec) go("clan buy 601");
      return "空识卷轴(活跃度x200 声望x200)";
    case 11:
      // 是否购买帮派铂金钥匙(活跃度x2000 声望x1000)?
      if (exec) go("clan buy 602");
      return "铂金钥匙(活跃度x2000 声望x1000)";
    case 12:
      // 是否购买帮派胤天碎片(活跃度x500 声望x1000)?
      if (exec) go("clan buy 701");
      return "胤天碎片(活跃度x500 声望x1000)";
    case 13:
      // 是否购买帮派特级丹药(活跃度x1000 声望x1000)?
      if (exec) go("clan buy 702");
      return "特级丹药(活跃度x1000 声望x1000)";
    case 14:
      // 是否购买帮派狗年礼券(10x 声望x50)?
      if (exec) goWithTimes(10, "clan buy 703");
      return "狗年礼券(10x 声望x50)";
    case 15:
      // 是否购买帮派秘籍木盒(活跃度x2000 声望x2000)?
      if (exec) go("clan buy 801");
      return "秘籍木盒(活跃度x2000 声望x2000)";
    case 16:
      // 是否购买帮派隐武竹笺(活跃度x500 声望x500)?
      if (exec) go("clan buy 901");
      return "隐武竹笺(活跃度x500 声望x500)";
  }
  return "未知配置:" + idx;
}

var curAutoCheckinTime = getStore("autoCheckinTime");
var curAutoCheckinOn = getStore("autoCheckinOn");
var curAutoCheckined = getStore("autoCheckined");
(function() {
  addDispatchListener("autoCheckin", function(b, type, subtype, msg) {
    if (type == "attr") return; // 触发定时器
    if (curAutoCheckinOn != "1") return;
    if (inKuafu()) return;

    var yjDate = yjDayStr();
    if (curAutoCheckined == yjDate) return; // 已签到过
    var date = new Date();
    var h = date.getHours();
    var hStr = h + "";
    if (h < 10) {
      hStr = "0" + h;
    }
    var m = date.getMinutes();
    var mStr = m + "";
    if (m < 10) {
      mStr = "0" + m;
    }
    if (hStr + ":" + mStr < curAutoCheckinTime) return; // 已到签到时间
    curAutoCheckined = yjDate;
    setStore("autoCheckined", yjDate);
    var sign_type = getStore("sign_type");
	if (sign_type && sign_type == 'full') {
	  AutoConfirm("执行签到？", 10 * 1000, function() {
      // 开始签到
		checkinFunc(0);
      }, function() {
        Alert("请工手签到");
      })
	} else if (sign_type && sign_type == 'short') {
	  AutoConfirm("执行签到？", 10 * 1000, function() {
      // 开始签到
		ssign(0);
      }, function() {
        Alert("请工手签到");
      })
	}
  })
}())

function autoCheckin(restore) {
  var btn = getBtn("定时签到");
  if (btn.innerHTML == "定时签到") {
    if (!curAutoCheckinTime) {
      curAutoCheckinTime = "06:05"
    }

    var init = function() {
      btn.innerHTML = "关闭签到"
      curAutoCheckinOn = "1";
    };

    if (restore) {
      init();
      return;
    }
    Input("设置每日签到的时间，超过指定时分将触发自动签到, 触发后当天不再触发, 时间格式如：06:05，若最前頭添加*，則為短簽到", curAutoCheckinTime, function(input) {
      var val = input.value;
	  if (val && val.charAt(0) == '*') {
		var val = val.slice(1, 6);
		setStore("sign_type", 'short');
	  } else if (val && val.charAt(0) != '*') {
		setStore("sign_type", 'full');
	  }
      if (!val || val.length != 5) {
        Alert("时间格式有误");
        return;
      }
      init();

      curAutoCheckinTime = val;
      setStore("autoCheckinOn", curAutoCheckinOn)
      setStore("autoCheckinTime", curAutoCheckinTime)
      init();
    });
    return;
  }

  curAutoCheckinOn = "0";
  setStore("autoCheckinOn", curAutoCheckinOn)
  btn.innerHTML = "定时签到"
  return;
}

function checkinFunc(idx) {
  // 结束签到
  if (idx == -1) {
    taskLocking = false;
    AutoConfirm("签到完成，回主页？", 60 * 1000, function() {
      go("jh 1;home");
    });
    return;
  }
  taskLocking = true;
  idx++;
  var next = function() {
    checkinFunc(idx);
  }
  switch (idx) {
    case 1:
      //扬州签到
      execNav('jh 1;w;event_1_76648488;event_1_21318613;jh 5;n;n;n;w;sign7;e;s;e', function() {
        addDispatchListener("shuanger_libao", function(b, type, subtype, msg) {
          if (type != "look_npc") return;
          delDispatchListener("shuanger_libao");
          for (var i in b.elements) {
            if (!b.elements[i].value || b.elements[i].value.indexOf("event_") < 0) continue;
            go(b.elements[i].value, {
              btn: 1,
            });
          }
          next();
        });
        // go('event_1_1278209;event_1_85209776;event_1_67345350', next);
        go("look_npc yangzhou_yangzhou9");
      });
      return
    case 2:
      fengyi(next);
      return;
    case 3:
      baiyutang(next);
      return;
    case 4:
      go('home;sleep_hanyuchuang;exercise stop;exercise', next); // 寒玉床
      return
    case 5:
      go('shop money_buy mny_shop2_N_10', next); //买引路蜂10个
      return;
    case 6:
      go("home;vip drops;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu");
      go("vip finish_sort;vip finish_sort;vip finish_sort;vip finish_sort;vip finish_sort", next);
      return;
    case 7:
      AutoConfirm("是否掃蕩全部副本?", 10 * 1000, function() {
        go('vip finish_fb dulongzhai;vip finish_fb dulongzhai;vip finish_fb junying;vip finish_fb junying;vip finish_fb beidou;vip finish_fb beidou;vip finish_fb youling;vip finish_fb youling;vip finish_fb siyu;vip finish_fb changleweiyang;vip finish_fb heishuihuangling;vip finish_fb jiandangfenglingdu;vip finish_fb tianshanlongxue', next); //副本掃蕩
      }, next);
      return;
    case 8:
      go("jh 11;event_1_34159245", next);
      return;
    case 9:
      go("home;sort;sort fetch_reward;share_ok 1;share_ok 2;share_ok 3;share_ok 4;share_ok 5;share_ok 7;" +
        "cangjian get_all;xueyin_shenbinggu blade get_all;xueyin_shenbinggu unarmed get_all;xueyin_shenbinggu throwing get_all;xueyin_shenbinggu spear get_all;" +
        "xueyin_shenbinggu hammer get_all;xueyin_shenbinggu axe get_all;xueyin_shenbinggu whip get_all;xueyin_shenbinggu stick get_all;xueyin_shenbinggu staff get_all", next);
      return;
    case 10:
      execNav("jh 1;e;n;e;e;e;e;n", function() {
        go("lq_bysf_lb;lq_lmyh_lb", next); //比翼双飞和劳模英豪
      })
      return;
    case 11:
      execNav('jh 1;e;n;e;e', function() {
        go('event_1_44731074;event_1_8041045;event_1_8041045;event_1_29721519;event_1_60133236;home', next); //消费积分和谜题卡和狗年券
      })
      return
    case 12:
      execNav('jh 2;n;n;n;n;n;n;n;e;tzjh_lq;w;n;n;n;n;n;n;n;n;n;n;n;n;e;n;n;n;w', function() {
        go('event_1_31320275', next); //采莲
      })
      return
    case 13:
      execNav('jh 26;w;w;n;e;e', function() {
        go('event_1_18075497', next); //大招采矿
      });
      return
    case 14:
      execNav('jh 26;w;w;n;n', function() {
        go('event_1_14435995', next); //大招破阵
      });
      return
    case 15:
      execNav('jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;w;n;w', function() {
        go('event_1_53278632;sousuo;sousuo', next); //冰火岛玄重铁
      })
      return
    case 16:
      execNav("jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne;se;n", function() {
        go("event_1_97487911", next); //绝情谷鳄鱼
      });
      return;
    case 17:
      AutoCancel("是否點擊10次VIP暴擊謎題?", 10 * 1000, function() {
        go('home;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task', next); //10次暴击
      }, next);
      return;
    case 18:
      // 读取配置文件
      clanBuyCfg = parseInt(getStore("clan_buy"));
      if (!clanBuyCfg) {
        clanBuyCfg = 0;
      }
      if (clanBuyCfg > 0) {
        var cfgDesc = "";
        for (var i = 0; i < 17; i++) {
          // 开关未开
          if ((clanBuyCfg & (1 << i)) == 0) continue
          cfgDesc += clanBuy(i) + ";"
        }
        AutoConfirm("確定執行以下幫派購買,取消則重新配置。<br/>" + cfgDesc, 10 * 1000, function() {
          go("home;clan");
          for (var i = 0; i < 17; i++) {
            // 開關未開
            if ((clanBuyCfg & (1 << i)) == 0) continue
            clanBuy(i, true);
          }
          go("home", next);
        }, function() {
          clanBuyCfg = 0;
          setStore("clan_buy", clanBuyCfg);
          checkinFunc(idx - 1); // 重新執行
        })
        return;
      }

      AutoCancel("配置幫派購買？", 10 * 1000, function() {

        // 重新配置
        Confirm("配置購買幫派" + clanBuy(0), function() {
          setClanBuyOn(0);
        });
        Confirm("配置購買幫派" + clanBuy(1), function() {
          setClanBuyOn(1);
        });
        Confirm("配置購買幫派" + clanBuy(2), function() {
          setClanBuyOn(2);
        });
        Confirm("配置購買幫派" + clanBuy(3), function() {
          setClanBuyOn(3);
        });
        Confirm("配置購買幫派" + clanBuy(4), function() {
          setClanBuyOn(4);
        });
        Confirm("配置購買幫派" + clanBuy(5), function() {
          setClanBuyOn(5);
        });
        Confirm("配置購買幫派" + clanBuy(6), function() {
          setClanBuyOn(6);
        });
        Confirm("配置購買幫派" + clanBuy(7), function() {
          setClanBuyOn(7);
        });
        Confirm("配置購買幫派" + clanBuy(8), function() {
          setClanBuyOn(8);
        });
        Confirm("配置購買幫派" + clanBuy(9), function() {
          setClanBuyOn(9);
        });
        Confirm("配置購買幫派" + clanBuy(10), function() {
          setClanBuyOn(10);
        });
        Confirm("配置購買幫派" + clanBuy(11), function() {
          setClanBuyOn(11);
        });
        Confirm("配置購買幫派" + clanBuy(12), function() {
          setClanBuyOn(12);
        });
        Confirm("配置購買幫派" + clanBuy(13), function() {
          setClanBuyOn(13);
        });
        Confirm("配置購買幫派" + clanBuy(14), function() {
          setClanBuyOn(14);
        });
        Confirm("配置購買幫派" + clanBuy(15), function() {
          setClanBuyOn(15);
        });
        Confirm("配置購買幫派" + clanBuy(16), function() {
            setClanBuyOn(16);
            setStore("clan_buy", clanBuyCfg);
            checkinFunc(idx - 1); // 提示配置
          },
          function() {
            setStore("clan_buy", clanBuyCfg);
            checkinFunc(idx - 1);
          });
      }, function() {
        checkinFunc(idx); // 不配置
      });
      return;
    case 19:
      AutoConfirm("大昭壁畫?", 10 * 1000, function() {
        mianbiFunc(next);
      }, function() {
        next()
      });
      return
    case 20:
      AutoConfirm("俠客日常?", 10 * 1000, function() {
        richangFunc(next);
      }, function() {
        next()
      });
      return
    case 21:
      AutoConfirm("是否冰月?", 10 * 1000, function() {
        bingyueFunc(function() {
          checkinFunc(-1); //  最后一个，标识结束
        });
      }, function() {
        checkinFunc(-1); //  最后一个，标识结束
      });
      return;
    default:
      // 若找不到，执行下一个
      break;
  }
  checkinFunc(idx);
}

var scanEscaped;
var maikuli_i;
var duancha_i;
var dalie_i;
// 领取奖励 ------------------------------------------------
function getRewardsFunc() {
  var getRewardsdelay = 100;
  var getRewardsInterval = 5 * 60 * 1000; // ms
  var getRewardsBtn = getBtn("开领奖");

  // 处于未领奖状态，单击开始领奖,并将状态置于停领奖状态
  if (getRewardsBtn.innerHTML == '开领奖') {
    Log("开始自动领取奖励！");
    scanEscapedFish();
    scanEscaped = setInterval(scanEscapedFish, getRewardsInterval);
    maikuli_i = setInterval(maikuli, 5000 + getRewardsdelay); // 干苦力, 5s
    duancha_i = setInterval(duancha, 10 * 1000 + getRewardsdelay); // 端茶送水, 10s
    dalie_i = setInterval(dalie, 5 * 60 * 1000 + getRewardsdelay); // 上山打猎, 5 min = 300 s
    getRewardsBtn.innerHTML = '停领奖';
  } else {
    Log("停止自动领取奖励！");
    clearInterval(scanEscaped);
    clearInterval(maikuli_i);
    clearInterval(duancha_i);
    clearInterval(dalie_i);
    getRewardsBtn.innerHTML = '开领奖';
  }
}



function maikuli() {
  go('work click maikuli');
}

function duancha() {
  go('work click duancha');
}

function dalie() {
  go('work click dalie');
}

function scanEscapedFish() {
  maikuli();
  duancha();
  dalie();
  go('work click baobiao');
  go('work click maiyi');
  go('work click xuncheng');
  go('work click datufei');
  go('work click dalei');
  go('work click kangjijinbin');
  go('work click zhidaodiying');
  go('work click dantiaoqunmen');
  go('work click shenshanxiulian');
  go('work click jianmenlipai');
  go('work click dubawulin');
  go('work click youlijianghu');
  go('work click yibangmaoxiang'); // xian->xiang,游戏中笔误
  go('work click zhengzhanzhongyuan');
  go('work click taofamanyi');
  clickButton('public_op3'); // 向师傅磕头
}


// 清谜题 -----------------------------------------------
function clearPuzzleFunc() {
  go('auto_tasks cancel');
}
//  "龍淵扳指": "wear longyuan banzhi moke",
//  "龍象拳套": "wield weapon_sb_unarmed9",

function unwieldWeapon() {
  for (var i = pkgItems.length - 1; i > -1; i--) {
    // "/obj/weapon/hammer10_moke,[31m烛幽鬼煞锤[2;37;0m,1,把"
    var item = dispatchMsg(pkgItems[i].value);
    var items = item.split(",");
    if (items.length < 4 || items[3] != "1") {
      // 未装备, 不执行
      continue
    }
    // 不脱弓与匕首
    if (items[0].indexOf("bow") > -1 || items[0].indexOf("dagger") > -1) {
      continue;
    }
    var doKind = "wield";
    if (items[0].indexOf("equip") > -1) {
      continue
    } else if (items[0].indexOf("weapon") > -1) {
      // ignore
    } else if (
      (items[1].indexOf("劍") < 0) &&
      (items[1].indexOf("槍") < 0) &&
      (items[1].indexOf("棍") < 0) &&
      (items[1].indexOf("斧") < 0) &&
      (items[1].indexOf("錘") < 0) &&
      (items[1].indexOf("拳") < 0) &&
      (items[1].indexOf("刀") < 0) &&
      (items[1].indexOf("暗") < 0) &&
      (items[1].indexOf("鞭") < 0) &&
      (items[1].indexOf("杖") < 0)
    ) {
      continue
    }

    // 脱掉原装备
    go("unwield " + items[0]);
  }
}

function findEquip(name) {
  var isRumai = false;
  if (name.charAt(0) == "*") {
    isRumai = true;
    name = name.substring(1)
  }
  for (var i = pkgItems.length - 1; i > -1; i--) {
    if (pkgItems[i].key.indexOf("items") < 0) continue;
    var item = dispatchMsg(pkgItems[i].value);
    if (item.indexOf(name) < 0) {
      continue;
    }
    if (item.indexOf("碎片") > -1) {
      continue;
    }
    var items = item.split(",");
    var doKind = "wield";
    if (items[0].indexOf("weapon") > -1) {
      doKind = "wield";
    } else if (items[0].indexOf("equip") > -1) {
      doKind = "wear";
    } else if (
      items[1].indexOf("剑") > -1 ||
      items[1].indexOf("枪") > -1 ||
      items[1].indexOf("棍") > -1 ||
      items[1].indexOf("斧") > -1 ||
      items[1].indexOf("锤") > -1 ||
      items[1].indexOf("拳") > -1 ||
      items[1].indexOf("刀") > -1 ||
      items[1].indexOf("暗") > -1 ||
      items[1].indexOf("鞭") > -1 ||
      items[1].indexOf("杖") > -1
    ) {
      doKind = "wield";
    } else {
      doKind = "wear";
    }
    return doKind + " " + items[0] + (isRumai ? " rumai" : "");
  }

  return "";
}

function doEquip(val) {
  if (!val || val.length == 0) return;
  var arr = val.split(",")
  for (var n = 0; n < arr.length; n++) {
    if (arr[n].length == 0) {
      continue;
    }
    var code = findEquip(arr[n]);
    if (code.length == 0) {
      WriteToScreen("未找到:" + arr[n])
    } else {
      go(code);
    }
  }

}
// 一键装备 ------------------------------------------------------------------------------------------------------
// 战斗装
function battleEquip() {
  var zb = getStore("battleEquip");
  if (!zb || zb.length == 0) {
    zb = "";
  }
  Input("请输入需要补充装备的全称(物品栏)，使用英文逗号分割，物品前面带*号为入脉<br/>" +
    "例如：<空>，若不输入，执行默认装备<br/>" +
    "九天龙吟剑,开天宝棍,*风泉之剑",
    zb,
    function(input) {
      var val = input.value;
      if (val == null) {
        return;
      }
      // 存储最后一次记录
      setStore("battleEquip", val);
      addDispatchListener("battleEquip", function(b, type, subtype) {
        if (type != "items") return;
        delDispatchListener("battleEquip");
        if (val.length > 0) {
          unwieldWeapon();
          doEquip(val);
          return;
        }
      })
      // 执行自动装备
      go("auto_equip on");
      go("items");
    })
}


// 悟性装
function wuxingEquip() {
  var zb = getStore("wuxingEquip");
  if (!zb || zb.length == 0) {
    zb = "风泉之剑,迷幻经纶,龙渊扳指";
  }
  Input("请输入需要补充装备的全称(物品栏)，使用英文逗号分割，物品前面带*号为入脉<br/>" +
    "例如：风泉之剑,迷幻经纶,博睿扳指,*雨叶魔枪,天玑九玄冠",
    zb,
    function(input) {
      var val = input.value;
      if (val == null) {
        return;
      }
      // 存储最后一次记录
      setStore("wuxingEquip", val);
      addDispatchListener("wuxingEquip", function(b, type, subtype) {
        if (type != "items") return;
        delDispatchListener("wuxingEquip");
        unwieldWeapon();
        doEquip(val);
      })
      go("items");
    })
}

var autoGetTargetNames = [];

function AutoGetItemMon(b, type, subtype, msg) {
  if (type != "jh" || subtype != "new_item") return;
  var name = b.get("name");
  for (i = autoGetTargetNames.length - 1; i > -1; i--) {
    if (name.indexOf(autoGetTargetNames[i]) < 0) continue
    go("get " + b.get("id"));
	if (sanshanpumpkin == true) {
	  console.log('三湘南瓜');
	  var roomName = getRoomName();
	  if (roomName == '村口') {
		go("nw;nw;n");
	  } else if (roomName == '險惡山路') {
		go("s;se;se");
	  } else {
		go("rank go 236;nw;n;n;n;n;n;n");
	  }
	}
    console.log("撿：" + name);
  }
}

var autoOptNpcs = [];

function AutoOptNpcMon(b, type, subtype, msg) {
  if (type != "jh" || subtype != "new_npc") return;
  var name = b.get("name");
  for (i = autoOptNpcs.length - 1; i > -1; i--) {
    if (name != autoOptNpcs[i].Name) continue
    go(autoOptNpcs[i].Opt);
    console.log("執行：" + autoOptNpcs[i]);
  }
}

function listenItemDropFunc() {
  var btn = getBtn("监听掉落");
  if (btn.innerHTML == '监听掉落') {
    var autoGetTargetNamesStr = getStore("auto_get_names");
    if (!autoGetTargetNamesStr) {
      autoGetTargetNamesStr = "屍體,鑰匙"
    }
    Input("输入需要监听江湖界面新增的'物品'名称或部分名称, 以英文逗号分割，掉落时会直接触发捡取。<br />例如：尸体,钥匙",
      autoGetTargetNamesStr,
      function(input) {
        var val = input.value;
        if (!val) return;
		if (val == '三湘南瓜') {
		  setStore("auto_get_names", val);
		  var val = '李大嘴的屍體,白開心的屍體';
		  sanshanpumpkin = true;
		  var roomName = getRoomName();
		  if (roomName != '村口') {
			go("rank go 236;nw;n;n;n;n;n;n");
		  }
		} else {
		  sanshanpumpkin = false;
		  setStore("auto_get_names", val);
		}
        var vals = val.split(",");
        if (vals.length == 0) return;
        autoGetTargetNames = vals;
        addDispatchListener("listenItemDropFunc", AutoGetItemMon);
        btn.innerHTML = '关闭掉落';
      })
  } else {
    delDispatchListener("listenItemDropFunc");
    btn.innerHTML = '监听掉落';
  }
}

function listenOptNPCFunc() {
  var btn = getBtn("监听NPC");
  if (btn.innerHTML == '监听NPC') {
    var autoOptNpcsStr = getStore("auto_opt_npcs");
    if (!autoOptNpcsStr) {
      autoOptNpcsStr = "唐情|ask tangmen_tangmei;ask tangmen_tangmei"
    }
    Input("输入需要监听江湖界面新增的人物， 以英文逗号分割，人物新增时会直接触发事件。<br />" +
      "例如：<span style='color:red'>唐情|ask tangmen_tangmei,柳兰儿|event_1_15941870,醉汉|kill snow_drunk,钥匙|get yin yaoshi</span>" +
      "<br/>唐情|ask tangmen_tangmei;ask tangmen_tangmei -- <span style='color:blue'>当出现唐情字样时，执行ask tangmen_tangmei(对话唐情)操作;</span>" +
      "<br/>柳兰儿|event_1_15941870 -- <span style='color:blue'>当出现柳兰儿时，执行event_1_15941870(询问天胜寨)操作;</span>" +
      "<br/>醉汉|kill snow_drunk -- <span style='color:blue'>当出现醉汉时，执行kill snow_drunk(叫杀醉汉)操作;</span>",
      autoOptNpcsStr,
      function(input) {
        var val = input.value;
        if (!val) return;
        var vals = val.split(",");
        if (vals.length == 0) return;
        autoOptNpcs = [];
        for (var i = 0; i < vals.length; i++) {
          var v = vals[i].split("|");
          autoOptNpcs.push({
            Name: v[0],
            Opt: v[1],
          });
        }
        setStore("auto_opt_npcs", val);
        addDispatchListener("listenOptNpcFunc", AutoOptNpcMon);
        btn.innerHTML = '关闭NPC';
      })
  } else {
    delDispatchListener("listenOptNpcFunc");
    btn.innerHTML = '监听NPC';
  }
}


// 摸尸体----------------------------------------------------
function AutoGetItem(names) {
  if (inBattle()) return;

  var roomInfo = g_obj_map.get("msg_room");
  if (!roomInfo) {
    return;
  }
  for (var i = roomInfo.elements.length - 1; i > -1; i--) {
    var key = roomInfo.elements[i].key;
    var val = roomInfo.elements[i].value;
    if (key.length < 4) continue
    var keyName = key.substring(0, 4);
    if (keyName != "item") continue
    for (var j = names.length - 1; j > -1; j--) {
      if (val.indexOf(names[j]) < 0) continue
      go("get " + val.split(",")[0])
    }
  }
}

var autoGetTrigger = null;

function autoGetFunc() {
  var autoGetBtn = getMenu("摸尸体");
  if (autoGetBtn.innerHTML == '摸尸体') {
    AutoGetItem(["屍體", "骸骨"]);
    autoGetTrigger = setInterval(function() {
      if (autoGetTrigger == null) return;
      AutoGetItem(["屍體", "骸骨"]);
    }, 200)

    autoGetBtn.innerHTML = '不摸了';
    return;
  }
  Log("不摸了")
  autoGetBtn.innerHTML = '摸尸体';
  clearInterval(autoGetTrigger)
  autoGetTrigger = null;
  return;
}

Array.prototype.contains = function(obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }
  return false;
}

function ContainsChineseKey(txt, objs) {
  if (!txt) {
    return;
  }
  var matchs = [];
  for (var key in objs) {
    // 完成了匹配
    var val = objs[key];
    if (txt.indexOf(val.hit) < 0) continue
    matchs.push(val);
  } // end hit

  return matchs;
}

function removeByValue(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == val) {
      arr.splice(i, 1);
    }
  }
}


// 设置战前技能切换
function loadSkillKind(idx) {
  if (inBattle()) return;
  addDispatchListener("loadSkillKind", function(b) {
    var type = b.get("type");
    var subtype = b.get("subtype");
    if (type != "enable" && type !== "list") return;
    delDispatchListener("loadSkillKind");
    goFast("prev");
  })
  goFast("enable mapped_skills restore go " + idx);
}

function restoreSkillFunc(restore) {
  var skillKind = getStore("restore_skill");
  if (!skillKind) {
    skillKind = 1;
  }
  if (restore) {
    loadSkillKind(skillKind);
    return;
  }
  Input("设置技能方案，启动脚本时会导出技术方案。1方案一，2方案二，3方案三。当前:" + skillKind, skillKind, function(input) {
    var val = parseInt(input.value);
    if (val == null) {
      return;
    }
    if (val < 1 || val > 3) {
      Alert("输入范围有误");
      return;
    }
    setStore("restore_skill", val);
    loadSkillKind(val);
  })
}

// 自动战斗
// menKind -- 要找的人, 是0守方, 1攻方
// menToFight -- 要杀的人，0守方，1攻方
var autoFightNotFoundTimes = 0;

// {
//   targetName: "醉汉", // 中文名称,
//   fightKind: "kill", // 不填写或默认值时为kill, 填写fight时为比试
//   menKind: 0, // 要找的人是守方(0好人)还是攻方(1坏人)
//   menToFight: 0, // 要杀的人，0守方，1攻方
//   anyOne: true, // 是否过滤白名npc, (false过虑，true击杀任何人)
//   newOne: true, // 在场景中顺序找还是逆序找人。true为逆序
//   tryTimes: 3, // 尝试找人找几次
//   wait: 1000, // 等待毫秒后再叫杀
//   doneFn: function(code, msg) { // 战斗结束后回调，0进入战斗后退出，小于0未进入战斗时结束
//     if (code == 0) {
//       go('prev_combat'); // 关闭战斗界面再摸
//     } else {
//       Alert(msg+":"+code)
//     }
//   },
// }
function autoFight(param) {
  // 等待叫杀
  if (param && param.wait > 0) {
    setTimeout(function() {
      param.wait = 0;
      autoFight(param);
    }, param.wait);
    return;
  }

  if (!param.tryTimes) param.tryTimes = 40;
  var npc = matchRoomNpc([param.targetName], param.anyOne, param.newOne);
  if (!npc) {
    autoFightNotFoundTimes++;
    if (!param.tryTimes) param.tryTimes = 40;
    if (autoFightNotFoundTimes < param.tryTimes) {
      // 继续杀, 若40次(10秒)找不到就不杀
      setTimeout(function() {
        autoFight(param);
      }, 250)
      return;
    }

    autoFightNotFoundTimes = 0;
    if (param.doneFn) param.doneFn(-1, "未找到目标：" + param.targetName);
    return;
  }

  stopAutoFight(); // 清除上次
  autoFightNotFoundTimes = 0;
  // 执行战斗
  startAutoFight(npc, param);
}

var autoFightTrigger = null;
var startAutoFightFailTimes = 0;

function stopAutoFight() {
  // 已进入战斗, 清空尝试器
  clearInterval(autoFightTrigger);
  autoFightTrigger = null;
  startAutoFightFailTimes = 0;
  if (!inBattle()) {
    delDispatchListener("startAutoFight")
  }
}

// param.targetName, param.menKind, param.menToFight, param.doneFn, param.fightDispatch
function startAutoFight(npc, param) {
  var viewName = param.targetName,
    menKind = param.menKind,
    menToFight = param.menToFight,
    doneFn = param.doneFn,
    fightKind = param.fightKind,
    fightDispatch = param.fightDispatch;

  if (!fightKind || fightKind.length == 0) fightKind = "kill";

  if (autoFightTrigger == null) {
    startAutoFightFailTimes = 0;
    addDispatchListener("startAutoFight", function(b, type, subtype, msg) {
      // 转发状态
      if (fightDispatch) fightDispatch(b, type, subtype, msg);

      // 没找到人的事件
      if (type == "notice" && subtype == "notify_fail") {
        startAutoFightFailTimes++; // 计数进场失败
        if (startAutoFightFailTimes > 200 ||
          msg.indexOf("這兒沒有這個人") > -1 ||
          msg.indexOf("數量已經超量") > -1 || // 你今天完成的跨服青龙战数量已经超量了，明天继续吧。
          msg.indexOf("已達到上限") > -1 // 你今天的逃犯任务次数已达到上限，明天继续吧。
        ) {
          // 没找到人就结束了。
          stopAutoFight();
          if (doneFn) doneFn(-1, msg);
          return;
        }
        return;
      }

      // 进入了战斗
      if (type == "vs" && subtype == "vs_info") {
        stopAutoFight();
      }

      // 战斗结束的事件
      if (type == "vs" && subtype == "combat_result") {
        stopAutoFight();
        if (doneFn) doneFn(0, "戰鬥結束");
        return;
      }
    })

    autoFightTrigger = setInterval(function() {
      // 每250毫秒尝试进入战斗
      startAutoFight(npc, param);
    }, 250);

    // 继续下面的流程序，启动定时器的同时进行一次战斗
  }

  if (autoFightTrigger != null && !inBattle()) {
    if (menToFight == 1) {
      // 杀坏人
      var badMen = menKind == 1 ? npc : getNextRoomNpc(npc, 1);
      if (!badMen) {
        Log("auto fight to badmen:", fightKind, !menToFight, !menKind, menKind, menToFight, badMen, npc);
        stopAutoFight();
        if (doneFn) doneFn(-1, "未找到目標");
        return;
      }
      clickButton(fightKind + ' ' + badMen.code, 0); // 杀攻击者
      return;
    }

    // 杀好人
    var goodMen = menKind == 1 ? getNextRoomNpc(npc, -1) : npc;
    if (!goodMen) {
      Log("auto fight to goodme:", fightKind, !menToFight, !menKind, menKind, menToFight, goodMen, npc);
      stopAutoFight();
      if (doneFn) doneFn(-1, "未找到目標");
      return;
    }
    clickButton(fightKind + ' ' + goodMen.code, 0); // 杀守卫者
    return;
  }
  if (inBattle()) stopAutoFight();
}


var shimenMission = [];
var shimenProcess = []; // 1, 2
var shimenAskNpcs = [];
var shimenAskIdx = 0;

function shimenAskNpc() {
  if (shimenAskIdx >= shimenAskNpcs.length) return false;
  go("look_npc " + shimenAskNpcs[shimenAskIdx].split(",")[0]);
  shimenAskIdx++;
}

function shimenFindNpc() {
  switch (shimenMission[2]) {
    case "黑狗血":
    case "草莓":
    case "兔肉":
    case "拆招基礎":
    case "閃避進階":
    case "閃避基礎":
    case "「寒士列傳」":
    case "大剪刀":
    case "拐杖":
    case "冬不拉":
    case "舊書":
    case "古銅緞子襖裙":
    case "繡鞋":
    case "羊鞭":
    case "玉石琵琶":
	case "日月神教腰牌":
      return shimenLoc[shimenLoc.length - 1];
  }
  return ""

}

// callback(code, msg)
// code == 0 -- success
// code == 302 -- 需要引路蜂跳转
// code < 0 -- 错误的信息
function autoShiMen(done) {
  var cbTimeout = setTimeout(function() {
    AutoAlert("等待超时", 90 * 1000, function() {
      done(302, "等待超时")
    })
  }, 10 * 1000)
  var cb = function(code, msg) {
    clearTimeout(cbTimeout);
    done(code, msg);
  };
  addDispatchListener("autoShiMen", function(b, type, subtype, msg) {
    switch (type) {
      case "look_npc":
        // 优先NPC打身上的装备
        var npcName = shimenFindNpc();
        if (npcName.length == 0) {
          if (b.get("long").indexOf(shimenMission[2]) > -1) {
            // 查看身上装备，若有且可杀，杀了取之
            var match = "kill " + b.get("id");
            for (var val of b.values()) {
              if (val == match) {
                npcName = dispatchMsg(b.get("name"));
              }
            }
          }
        }
        if (npcName.length > 0) {
          go('prev', function() {
            autoFight({
              targetName: npcName,
              fightKind: "kill",
              menKind: 0,
              menToFight: 0,
              anyOne: true,
              newOne: false,
              tryTimes: 3,
              doneFn: function(code, msg) {
                if (code == 0) {
                  setTimeout(function() {
                    AutoGetItem([npcName]);
                    delDispatchListener("autoShiMen")
                    cb(0, "success");
                  }, 500);
                } else {
                  delDispatchListener("autoShiMen")
                  cb(code, msg);
                }
              },
            });
          });

          return;
        }

        for (var key of b.keys()) {
          var val = b.get(key);
          // 执行购买
          if (key.indexOf("cmd") > -1 && val == "購買") {
            go(b.get(key.split("_")[0]));
            return
          }
        }
        // 未找到购买，执行下一个人
        shimenAskNpc();
        return;
      case "buy":
        if (subtype != "list") return;
        for (var key of b.keys()) {
          var vals = dispatchMsg(b.get(key)).split(",");
          if (!vals || vals.length < 2) continue;
          if (vals[1] != shimenMission[2]) continue;
          go("buy " + vals[0] + " from " + b.get("npcid"));
          delDispatchListener("autoShiMen")
          cb(0, "success");
          // go("home;clan scene;clan submit_task;clan task");
          return;
        }
        // 未找到购买的物品，找下一个人
        shimenAskNpc();
        return;

      case "jh":
        // 寻路后开始查找数据
        if (subtype != "info") return;
        var shortName = dispatchMsg(b.get("short"));
		var shortName = Simplized(shortName);
        if (shortName == "議事堂" && b.get("append_msg")) return; // ignore 帮派的议事堂事件
        if (shimenLoc.join("-").indexOf(shortName) < 0) {
          // 地点不对，直接使用引路蜂
          cb(302, "导航位置似乎不对，使用引路蜂?");
          return;
        }
        shimenAskNpcs = [];
        for (var key of b.keys()) {
          var val = b.get(key);
          switch (shimenMission[1]) {
            case "戰勝":
            case "殺":
              autoFight({
                targetName: shimenMission[2], // 中文名称,
                fightKind: shimenMission[1] == "殺" ? "kill" : "fight", // 不填写或默认值时为kill, 填写fight时为比试
                menKind: 0, // 要找的人是守方(0好人)还是攻方(1坏人)
                menToFight: 0, // 要杀的人，0守方，1攻方
                anyOne: true, // 是否过滤白名npc, (false过虑，true击杀任何人)
                newOne: false, // 在场景中顺序找还是逆序找人。true为逆序
                tryTimes: 3, // 尝试找人找几次
                doneFn: function(code, msg) { // 战斗结束后回调，0进入战斗后退出，小于0未进入战斗时结束
                  if (code == 0) {
                    delDispatchListener("autoShiMen")
                    cb(0, "success");
                    // go("home;clan scene;clan task");
                  } else {
                    delDispatchListener("autoShiMen")
                    // Alert(msg + ":" + code)
                    cb(code, msg);
                  }
                },
              });
              return;
            case "尋找":
              // 检测地上的物品
              if (key.indexOf("item") != 0) {
                if (key.indexOf("npc") == 0) {
                  shimenAskNpcs.push(val);
                }
                break;
              }
              var item = val.split(",");
              if (dispatchMsg(item[1]) != shimenMission[2]) break;
              go("get " + item[0]);
              delDispatchListener("autoShiMen")
              // go("home;clan scene;clan submit_task;clan task");
              cb(0, "success");
              return;
          } // end switch
        } // end for

        // 一级场景未找到数据，执行二级深度寻找
        if (shimenMission[1] == "尋找") {
          shimenAskIdx = 0;
          shimenAskNpc();
          return;
        }
        break;
    } // end switch(type)
  });
}

function getShiMenWay(name) {
  shimenMission[0] = "";
  //  shimenMission[1] = dispatchChineseMsg(shimenMission[1]);
  //  shimenMission[2] = dispatchChineseMsg(shimenMission[2]);
  var npcName = "";
  if (shimenMission[1] == "尋找") {
    npcName = shimenLoc[shimenLoc.length - 1];
  } else {
    npcName = shimenMission[2];
  }

  WriteToScreen("执行" + shimenMission.join("-") + "," + shimenLoc.join("-"))
  var jh = fixJhName(shimenLoc[0]);

  var target = [];
  travelJhData(function(i, index, name) {
    if (name != jh) return false;
    var jhKey = name;
    travelNpcData(i, function(jh, loc, name, way, desc) {
	  var name = Traditionalized(name);
	  var way = Traditionalized(way);
	  var desc = Traditionalized(desc);
      if (name != npcName) return false;
      if (way.length == 0) return false;
      if (way.indexOf(".") == 0) return false;
      if (loc.length > 0) {
        var found = false;
        for (var i = shimenLoc.length - 1; i > -1; i--) {
          if (loc == shimenLoc[i]) {
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      }
      target.push({
        jh: jh,
        loc: loc,
        way: way,
        desc: desc,
      })
      return true;
    });
    return true;
  })
  return target;
}

function stopShiMen() {
  var btn = getBtn("自动师门");
  btn.innerText = '自动师门';
  delDispatchListener("autoShiMenFunc");
  delDispatchListener("autoShiMen");
  stopAutoFight();
}

var masterId = "";

var autoShiMenRoadOn = false;
// 自动师门
function autoShiMenFunc() {
  var btn = getBtn("自动师门");
  if (btn.innerHTML == '自动师门') {
    btn.innerText = '停止师门';
    masterId = g_obj_map.get("msg_attrs").get("master_id");
    var cb = function(code, msg) {
      switch (code) {
        case 0:
          go("home;give " + masterId + ";family_quest");
          return;
        case 302:
          var timeout = 3 * 1000;
          if (autoShiMenRoadOn) {
            timeout = 90 * 1000;
          }
          AutoConfirm(msg, timeout, function() {
            autoShiMen(cb); // 寻路
            go("find_family_quest_road"); // 使用引路蜂
          });
          return;
      }
      AutoConfirm(msg + "。重试？", 90 * 1000, function() {
        autoShiMen(cb)
        go("find_family_quest_road"); // 使用引路蜂
      });
      return;
    };
    addDispatchListener("autoShiMenFunc", function(b, type, subtype, msg) {
      if (type == "main_msg" && msg.indexOf("今天做的師門任務已過量") > -1) {
        stopShiMen();
        return;
      }
      if (type == "main_msg" && msg.indexOf("好好練") > -1) {
        go("family_quest");
        return;
      }
      if (type != "main_msg" || msg.indexOf("find_family_quest_road") < 0) return;

      var msgArr = msg.split("\n");
	  msgArr[2] = Simplized(msgArr[2]);
	  WriteToScreen(msgArr[2]);
      shimenMission = msgArr[1].match(/你現在的任務是(.*)\x03href;0;find_family_quest_road\x03(.*)\x030/)
      shimenLoc = msgArr[2].match(/任务所在地方好像是：(.*)/)[1].split("-");
      shimenProcess = msgArr[5].match(/你今天已完成(.*)\/(.*)個任務。/)
      if (!shimenMission || shimenMission.length < 2) {
        // 尝试用背包提交一次数据,再取一次模板数据
        go("give " + masterId + ";family_quest");
        return;
      }

      if (autoShiMenRoadOn) {
        autoShiMen(cb); // 寻路
        go("find_family_quest_road"); // 使用引路蜂
      } else {
        var target = getShiMenWay();
        if (target.length == 0) {
          cb(302, "未找到路径, 是否使用引路蜂？");
          return;
        }
        execNav(target[0].way, function(code, msg) {
          if (code != 0) {
            cb(302, "导航位置似乎不对，使用引路蜂?");
            return;
          }
          autoShiMen(cb); // 寻路
          go("golook_room");
        });
      }
      return;
    });
    // 去师门
    AutoCancel("是否直接使用引路蜂？", 3 * 1000, function() {
      autoShiMenRoadOn = true;
      go("home;give " + masterId + ";family_quest");
    }, function() {
      autoShiMenRoadOn = false;
      go("home;give " + masterId + ";family_quest");
    })
  } else {
    stopShiMen();
  }
}

function stopBangPai() {
  var btn = getBtn("自动帮派");
  btn.innerText = '自动帮派';
  delDispatchListener("autoBangPaiFunc");
  delDispatchListener("autoShiMen");
  stopAutoFight();
}

var autoBangPaiRoadOn = false;
// 自动帮派
function autoBangPaiFunc() {
  var btn = getBtn("自动帮派");
  if (btn.innerHTML == '自动帮派') {
    btn.innerText = '停止帮派';
    var cb = function(code, msg) {
      switch (code) {
        case 0:
          go("home;clan scene;clan submit_task;clan task");
          return;
        case 302:
          var timeout = 3 * 1000;
          if (autoBangPaiRoadOn) {
            timeout = 90 * 1000;
          }
          AutoConfirm(msg, timeout, function() {
            autoShiMen(cb); // 寻路
            go("find_clan_quest_road"); // 使用引路蜂
          });
          return;
      }
      AutoConfirm(msg + "。重试？", 90 * 1000, function() {
        autoShiMen(cb)
        go("find_clan_quest_road"); // 使用引路蜂
      });
      return;
    };

    addDispatchListener("autoBangPaiFunc", function(b, type, subtype, msg) {
      if (type == "main_msg" && msg.indexOf("今天做的幫派任務已過量") > -1) {
        stopBangPai();
        return;
      }
      if (type == "main_msg" && msg.indexOf("好好練") > -1) {
        go("clan task");
        return;
      }
      if (type != "main_msg" || msg.indexOf("find_clan_quest_road") < 0) return;

      var msgArr = msg.split("\n");
	  msgArr[2] = Simplized(msgArr[2]);
	  WriteToScreen(msgArr[2]);
      shimenMission = msgArr[1].match(/你現在的任務是(.*)\x03href;0;find_clan_quest_road\x03(.*)\x030/)
      shimenLoc = msgArr[2].match(/任务所在地方好像是：(.*)/)[1].split("-");
      shimenProcess = msgArr[5].match(/你今天已完成(.*)\/(.*)個任務。/)

      if (!shimenMission || shimenMission.length < 2) {
        // 尝试用背包提交一次数据,再取一次模板数据
        go("clan submit_task;clan task");
        return;
      }
      if (autoBangPaiRoadOn) {
        autoShiMen(cb); // 寻路
        go("find_clan_quest_road"); // 使用引路蜂
      } else {
        var target = getShiMenWay()
        if (target.length == 0) {
          cb(302, "未找到路径, 是否使用引路蜂？");
          return;
        }
        execNav(target[0].way, function(code, msg) {
          if (code != 0) {
            cb(302, "未找到路径, 是否使用引路蜂？");
            return;
          }
          autoShiMen(cb); // 寻路
          go("golook_room");
        });
      }
      return;
    });
    AutoCancel("是否直接使用引路蜂？", 3 * 1000, function() {
      autoBangPaiRoadOn = true;
      go("home;clan scene;clan submit_task;clan task");
    }, function() {
      autoBangPaiRoadOn = false;
      go("home;clan scene;clan submit_task;clan task");
    })
  } else {
    stopBangPai();
  }
}

//快速师门帮派---------
function vipShiMenFunc() {
  go("home;family_quest;"); // 占位以便可以多一个任务
  addDispatchListener("vipShiMenFunc", function(b, type, subtype, msg) {
    if (type == "main_msg" && msg.indexOf("好好練") > -1) {
      go("family_quest");
      return;
    }
    if (type == "notice" && subtype == "notify_fail") {
      delDispatchListener("vipShiMenFunc");
      AutoConfirm("執行最後一個師門任務？", 10 * 1000, function() {
        autoShiMenFunc();
      });
      return;
    }
    if (type != "notice") return;
    if (msg.indexOf("花費元寶0獲得經驗") < 0) return;
    go("vip finish_family");
  })
  go("vip finish_family");
}

function vipBangPaiFunc() {
  go("home;clan;clan scene;clan task;"); // 占位帮派任务
  addDispatchListener("vipBangPaiFunc", function(b, type, subtype, msg) {
    if (type == "main_msg" && msg.indexOf("好好練") > -1) {
      go("clan task");
      return;
    }
    if (type == "notice" && subtype == "notify_fail") {
      delDispatchListener("vipBangPaiFunc");
      AutoConfirm("執行最後一個幫派任務？", 10 * 1000, function() {
        autoBangPaiFunc();
      });
      return;
    }
    if (type != "main_msg") return;
    if (msg.indexOf("幫派任務獲得") < 0) return;
    go('vip finish_clan'); //帮派
  })
  go('vip finish_clan'); //帮派
}

// 打排行榜----------------------------
function clearPaiHang() {
  delBattleListener("paihangFunc");
  getBtn("打排行").innerText = '打排行';
}

function autoPaiHang() {
  addBattleListener("paihangFunc", function(b, type, subtype, msg) {
    // 总数已到
    if (type == "notice" && subtype == "notify_fail") {
      if (msg.indexOf("無法挑戰") > -1) {
        clearPaiHang();
        Alert(msg);
      }
      return;
    }
    // 战斗结束
    if (type == "vs" && subtype == "combat_result") {
      // 继续打
      go('prev_combat;fight_hero 1');
      return;
    }
    // 不管其他
  })
  go("sort;fight_hero 1");
}


function paihangFunc() {
  var paihangBtn = getBtn("打排行");
  if (paihangBtn.innerHTML == '打排行') {
    paihangBtn.innerText = '停排行';
    autoPaiHang();
  } else {
    clearPaiHang();
  }
}

// 试剑----------------------------
function shijianFunc() {
  go('swords');
  go('swords select_member xiaoyao_tonglao'); // 天山姥姥
  go('swords select_member taoist_zhangtianshi'); // 张在师
  go('swords select_member gumu_yangguo'); // 神雕大侠
  go('swords fight_test go');
  setTimeout(Shijie1, 1000); //code
}

function Shijie1() {
  if (isContains($('span:contains(你今天)').text().slice(-12), '你今天試劍次數已達限額。')) return;
  if (isContains($('span:contains(正式論劍中)').text().slice(-11), '正式論劍中，不可試劍。')) return;

  setTimeout(Shijie1, 1000); //code
  if (inBattle()) return
  go('swords fight_test go');
}

// 答题 ---------------------------------------------------
// 答题表中的问题不含有空格，即使原题中带有，在匹配的时候会去掉。
var QuestAnsLibs = {
  "首次通过桥阴县不可以获得那种奖励？": "a",
  "“白玉牌楼”场景是在哪个地图上？": "c",
  "“百龙山庄”场景是在哪个地图上？": "b",
  "“冰火岛”场景是在哪个地图上？": "b",
  "“常春岛渡口”场景是在哪个地图上？": "c",
  "“跪拜坪”场景是在哪个地图上？": "b",
  "“翰墨书屋”场景是在哪个地图上？": "c",
  "“花海”场景是在哪个地图上？": "a",
  "“留云馆”场景是在哪个地图上？": "b",
  "“日月洞”场景是在哪个地图上？": "b",
  "“蓉香榭”场景是在哪个地图上？": "c",
  "“三清殿”场景是在哪个地图上？": "b",
  "“三清宫”场景是在哪个地图上？": "c",
  "“双鹤桥”场景是在哪个地图上？": "b",
  "“无名山脚”场景是在哪个地图上？": "d",
  "“伊犁”场景是在哪个地图上？": "b",
  "“鹰记商号”场景是在哪个地图上？": "d",
  "“迎梅客栈”场景是在哪个地图上？": "d",
  "“子午楼”场景是在哪个地图上？": "c",
  "8级的装备摹刻需要几把刻刀": "a",
  "NPC公平子在哪一章地图": "a",
  "瑷伦在晚月庄的哪个场景": "b",
  "安惜迩是在那个场景": "c",
  "黯然销魂掌有多少招式？": "c",
  "黯然销魂掌是哪个门派的技能": "a",
  "八卦迷阵是哪个门派的阵法？": "b",
  "八卦迷阵是那个门派的阵法": "a",
  "白金戒指可以在哪位那里获得？": "b",
  "白金戒指可以在哪位npc那里获得？": "b",
  "白金手镯可以在哪位那里获得？": "a",
  "白金手镯可以在哪位npc那里获得？": "a",
  "白金项链可以在哪位那里获得？": "b",
  "白金项链可以在哪位npc那里获得？": "b",
  "白蟒鞭的伤害是多少？": "a",
  "白驼山第一位要拜的师傅是谁": "a",
  "白银宝箱礼包多少元宝一个": "d",
  "白玉腰束是腰带类的第几级装备？": "b",
  "拜师风老前辈需要正气多少": "b",
  "拜师老毒物需要蛤蟆功多少级": "a",
  "拜师铁翼需要多少内力": "b",
  "拜师小龙女需要容貌多少": "c",
  "拜师张三丰需要多少正气": "b",
  "包家将是哪个门派的师傅": "a",
  "包拯在哪一章": "d",
  "宝石合成一次需要消耗多少颗低级宝石？": "c",
  "宝玉帽可以在哪位那里获得？": "d",
  "宝玉鞋击杀哪个可以获得": "a",
  "宝玉鞋在哪获得": "a",
  "暴雨梨花针的伤害是多少？": "c",
  "北斗七星阵是第几个的组队副本": "c",
  "北冥神功是哪个门派的技能": "b",
  "北岳殿神像后面是哪位": "b",
  "匕首加什么属性": "c",
  "碧海潮生剑在哪位师傅处学习": "a",
  "碧磷鞭的伤害是多少？": "b",
  "镖局保镖是挂机里的第几个任务": "d",
  "冰魄银针的伤害是多少？": "b",
  "病维摩拳是哪个门派的技能": "b",
  "不可保存装备下线多久会消失": "c",
  "不属于白驼山的技能是什么": "b",
  "沧海护腰可以镶嵌几颗宝石": "d",
  "沧海护腰是腰带类的第几级装备？": "a",
  "藏宝图在哪个NPC处购买": "a",
  "藏宝图在哪个处购买": "b",
  "藏宝图在哪里那里买": "a",
  "草帽可以在哪位那里获得？": "b",
  "成功易容成异性几次可以领取易容成就奖": "b",
  "成长计划第七天可以领取多少元宝？": "d",
  "成长计划六天可以领取多少银两？": "d",
  "成长计划需要多少元宝方可购买？": "a",
  "城里打擂是挂机里的第几个任务": "d",
  "城里抓贼是挂机里的第几个任务": "b",
  "充值积分不可以兑换下面什么物品": "d",
  "出生选武学世家增加什么": "a",
  "闯楼第几层可以获得称号“藏剑楼护法”": "b",
  "闯楼第几层可以获得称号“藏剑楼楼主”": "d",
  "闯楼第几层可以获得称号“藏剑楼长老”": "c",
  "闯楼每多少层有称号奖励": "a",
  "春风快意刀是哪个门派的技能": "b",
  "春秋水色斋需要多少杀气才能进入": "d",
  "从哪个处进入跨服战场": "a",
  "摧心掌是哪个门派的技能": "a",
  "达摩在少林哪个场景": "c",
  "达摩杖的伤害是多少？": "d",
  "打开引路蜂礼包可以得到多少引路蜂？": "b",
  "打排行榜每天可以完成多少次？": "a",
  "打土匪是挂机里的第几个任务": "c",
  "打造刻刀需要多少个玄铁": "a",
  "打坐增长什么属性": "a",
  "大保险卡可以承受多少次死亡后不降技能等级？": "b",
  "大乘佛法有什么效果": "d",
  "大旗门的修养术有哪个特殊效果": "a",
  "大旗门的云海心法可以提升哪个属性": "c",
  "大招寺的金刚不坏功有哪个特殊效果": "a",
  "大招寺的铁布衫有哪个特殊效果": "c",
  "当日最低累积充值多少元即可获得返利？": "b",
  "刀法基础在哪掉落": "a",
  "倒乱七星步法是哪个门派的技能": "d",
  "等级多少才能在世界频道聊天？": "c",
  "第一个副本需要多少等级才能进入": "d",
  "貂皮斗篷是披风类的第几级装备？": "b",
  "丁老怪是哪个门派的终极师傅": "a",
  "丁老怪在星宿海的哪个场景": "b",
  "东方教主在魔教的哪个场景": "b",
  "斗转星移是哪个门派的技能": "a",
  "斗转星移阵是哪个门派的阵法": "a",
  "毒龙鞭的伤害是多少？": "a",
  "毒物阵法是哪个门派的阵法": "b",
  "独孤求败有过几把剑？": "d",
  "独龙寨是第几个组队副本": "a",
  "读书写字301-400级在哪里买书": "c",
  "读书写字最高可以到多少级": "b",
  "端茶递水是挂机里的第几个任务": "b",
  "断云斧是哪个门派的技能": "a",
  "锻造一把刻刀需要多少玄铁碎片锻造？": "c",
  "锻造一把刻刀需要多少银两？": "a",
  "兑换易容面具需要多少玄铁碎片": "c",
  "多少消费积分换取黄金宝箱": "a",
  "多少消费积分可以换取黄金钥匙": "b",
  "翻译梵文一次多少银两": "d",
  "方媃是哪个门派的师傅": "b",
  "飞仙剑阵是哪个门派的阵法": "b",
  "风老前辈在华山哪个场景": "b",
  "风泉之剑加几点悟性": "c",
  "风泉之剑可以在哪位那里获得？": "b",
  "风泉之剑可以在哪位npc那里获得？": "b",
  "风泉之剑在哪里获得": "d",
  "疯魔杖的伤害是多少？": "b",
  "伏虎杖的伤害是多少？": "c",
  "副本完成后不可获得下列什么物品": "b",
  "副本一次最多可以进几人": "a",
  "副本有什么奖励": "d",
  "富春茶社在哪一章": "c",
  "改名字在哪改？": "d",
  "丐帮的绝学是什么": "a",
  "丐帮的轻功是哪个": "b",
  "干苦力是挂机里的第几个任务": "a",
  "钢丝甲衣可以在哪位那里获得？": "d",
  "高级乾坤再造丹加什么": "b",
  "高级乾坤再造丹是增加什么的？": "b",
  "高级突破丹多少元宝一颗": "d",
  "割鹿刀可以在哪位npc那里获得？": "b",
  "葛伦在大招寺的哪个场景": "b",
  "根骨能提升哪个属性": "c",
  "功德箱捐香火钱有什么用": "a",
  "功德箱在雪亭镇的哪个场景？": "c",
  "购买新手进阶礼包在挂机打坐练习上可以享受多少倍收益？": "b",
  "孤独求败称号需要多少论剑积分兑换": "b",
  "孤儿出身增加什么": "d",
  "古灯大师是哪个门派的终极师傅": "c",
  "古灯大师在大理哪个场景": "c",
  "古墓多少级以后才能进去？": "d",
  "寒玉床睡觉修炼需要多少点内力值": "c",
  "寒玉床睡觉一次多久": "c",
  "寒玉床需要切割多少次": "d",
  "寒玉床在哪里切割": "a",
  "寒玉床在那个地图可以找到？": "a",
  "黑狗血在哪获得": "b",
  "黑水伏蛟可以在哪位那里获得？": "c",
  "红宝石加什么属性": "b",
  "洪帮主在洛阳哪个场景": "c",
  "虎皮腰带是腰带类的第几级装备？": "a",
  "花不为在哪一章": "a",
  "花花公子在哪个地图": "a",
  "华山村王老二掉落的物品是什么": "a",
  "华山施戴子掉落的物品是什么": "b",
  "华山武器库从哪个NPC进": "d",
  "黄宝石加什么属性": "c",
  "黄岛主在桃花岛的哪个场景": "d",
  "黄袍老道是哪个门派的师傅": "c",
  "积分商城在雪亭镇的哪个场景？": "c",
  "技能柳家拳谁教的？": "a",
  "技能数量超过了什么消耗潜能会增加": "b",
  "嫁衣神功是哪个门派的技能": "b",
  "剑冢在哪个地图": "a",
  "街头卖艺是挂机里的第几个任务": "a",
  "金弹子的伤害是多少？": "a",
  "金刚不坏功有什么效果": "a",
  "金刚杖的伤害是多少？": "a",
  "金戒指可以在哪位npc那里获得？": "d",
  "金手镯可以在哪位npc那里获得？": "b",
  "金丝鞋可以在哪位npc那里获得？": "b",
  "金项链可以在哪位npc那里获得？": "d",
  "金玉断云是哪个门派的阵法": "a",
  "锦缎腰带是腰带类的第几级装备？": "a",
  "精铁棒可以在哪位那里获得？": "d",
  "九区服务器名称": "d",
  "九阳神功是哪个门派的技能": "c",
  "九阴派梅师姐在星宿海哪个场景": "a",
  "军营是第几个组队副本": "b",
  "开通VIP月卡最低需要当天充值多少元方有购买资格？": "a",
  "可以召唤金甲伏兵助战是哪个门派？": "a",
  "客商在哪一章": "b",
  "孔雀氅可以镶嵌几颗宝石": "b",
  "孔雀氅是披风类的第几级装备？": "c",
  "枯荣禅功是哪个门派的技能": "a",
  "跨服是星期几举行的": "b",
  "跨服天剑谷每周六几点开启": "a",
  "跨服需要多少级才能进入": "c",
  "跨服在哪个场景进入": "c",
  "兰花拂穴手是哪个门派的技能": "a",
  "蓝宝石加什么属性": "a",
  "蓝止萍在哪一章": "c",
  "蓝止萍在晚月庄哪个小地图": "b",
  "老毒物在白驮山的哪个场景": "b",
  "老顽童在全真教哪个场景": "b",
  "莲花掌是哪个门派的技能": "a",
  "烈火旗大厅是那个地图的场景": "c",
  "烈日项链可以镶嵌几颗宝石": "c",
  "林祖师是哪个门派的师傅": "a",
  "灵蛇杖法是哪个门派的技能": "c",
  "凌波微步是哪个门派的技能": "b",
  "凌虚锁云步是哪个门派的技能": "b",
  "领取消费积分需要寻找哪个NPC？": "c",
  "鎏金缦罗是披风类的第几级装备？": "d",
  "柳淳风在哪一章": "c",
  "柳淳风在雪亭镇哪个场景": "b",
  "柳文君所在的位置": "a",
  "六脉神剑是哪个门派的绝学": "a",
  "陆得财是哪个门派的师傅": "c",
  "陆得财在乔阴县的哪个场景": "a",
  "论剑每天能打几次": "a",
  "论剑是每周星期几": "c",
  "论剑是什么时间点正式开始": "a",
  "论剑是星期几进行的": "c",
  "论剑是星期几举行的": "c",
  "论剑输一场获得多少论剑积分": "a",
  "论剑要在晚上几点前报名": "b",
  "论剑在周几进行？": "b",
  "论剑中步玄派的师傅是哪个": "a",
  "论剑中大招寺第一个要拜的师傅是谁": "c",
  "论剑中古墓派的终极师傅是谁": "d",
  "论剑中花紫会的师傅是谁": "c",
  "论剑中青城派的第一个师傅是谁": "a",
  "论剑中青城派的终极师傅是谁": "d",
  "论剑中逍遥派的终极师傅是谁": "c",
  "论剑中以下不是峨嵋派技能的是哪个": "b",
  "论剑中以下不是华山派的人物的是哪个": "d",
  "论剑中以下哪个不是大理段家的技能": "c",
  "论剑中以下哪个不是大招寺的技能": "b",
  "论剑中以下哪个不是峨嵋派可以拜师的师傅": "d",
  "论剑中以下哪个不是丐帮的技能": "d",
  "论剑中以下哪个不是丐帮的人物": "a",
  "论剑中以下哪个不是古墓派的的技能": "b",
  "论剑中以下哪个不是华山派的技能的": "d",
  "论剑中以下哪个不是明教的技能": "d",
  "论剑中以下哪个不是魔教的技能": "a",
  "论剑中以下哪个不是魔教的人物": "d",
  "论剑中以下哪个不是全真教的技能": "d",
  "论剑中以下哪个不是是晚月庄的技能": "d",
  "论剑中以下哪个不是唐门的技能": "c",
  "论剑中以下哪个不是唐门的人物": "c",
  "论剑中以下哪个不是铁雪山庄的技能": "d",
  "论剑中以下哪个不是铁血大旗门的技能": "c",
  "论剑中以下哪个是大理段家的技能": "a",
  "论剑中以下哪个是大招寺的技能": "b",
  "论剑中以下哪个是丐帮的技能": "b",
  "论剑中以下哪个是花紫会的技能": "a",
  "论剑中以下哪个是华山派的技能的": "a",
  "论剑中以下哪个是明教的技能": "b",
  "论剑中以下哪个是青城派的技能": "b",
  "论剑中以下哪个是唐门的技能": "b",
  "论剑中以下哪个是天邪派的技能": "b",
  "论剑中以下哪个是天邪派的人物": "a",
  "论剑中以下哪个是铁雪山庄的技能": "c",
  "论剑中以下哪个是铁血大旗门的技能": "b",
  "论剑中以下哪个是铁血大旗门的师傅": "a",
  "论剑中以下哪个是晚月庄的技能": "a",
  "论剑中以下哪个是晚月庄的人物": "a",
  "论剑中以下是峨嵋派技能的是哪个": "a",
  "论语在哪购买": "a",
  "骆云舟在哪一章": "c",
  "骆云舟在乔阴县的哪个场景": "b",
  "落英神剑掌是哪个门派的技能": "b",
  "吕进在哪个地图": "a",
  "绿宝石加什么属性": "c",
  "漫天花雨匕在哪获得": "a",
  "茅山的绝学是什么": "b",
  "茅山的天师正道可以提升哪个属性": "d",
  "茅山可以招几个宝宝": "c",
  "茅山派的轻功是什么": "b",
  "茅山天师正道可以提升什么": "c",
  "茅山学习什么技能招宝宝": "a",
  "茅山在哪里拜师": "c",
  "每次合成宝石需要多少银两？": "a",
  "每个玩家最多能有多少个好友": "c",
  "vip每天不可以领取什么": "b",
  "每天的任务次数几点重置": "d",
  "每天分享游戏到哪里可以获得20元宝": "a",
  "每天能挖几次宝": "d",
  "每天能做多少个谜题任务": "a",
  "每天能做多少个谜": "a",
  "每天能做多少个师门任务": "c",
  "每天微信分享能获得多少元宝": "d",
  "每天有几次试剑": "b",
  "每天在线多少个小时即可领取消费积分？": "b",
  "每突破一次技能有效系数加多少": "a",
  "密宗伏魔是哪个门派的阵法": "c",
  "灭绝师太在第几章": "c",
  "灭绝师太在峨眉山哪个场景": "a",
  "明教的九阳神功有哪个特殊效果": "a",
  "明月帽要多少刻刀摩刻？": "a",
  "摹刻10级的装备需要摩刻技巧多少级": "b",
  "摹刻烈日宝链需要多少级摩刻技巧？": "c",
  "摹刻扬文需要多少把刻刀？": "a",
  "魔鞭诀在哪里学习": "d",
  "魔教的大光明心法可以提升哪个属性": "d",
  "莫不收在哪一章": "a",
  "墨磷腰带是腰带类的第几级装备？": "d",
  "木道人在青城山的哪个场景": "b",
  "慕容家主在慕容山庄的哪个场景": "a",
  "慕容山庄的斗转星移可以提升哪个属性": "d",
  "哪个NPC掉落拆招基础": "a",
  "哪个处可以捏脸": "a",
  "哪个分享可以获得20元宝": "b",
  "哪个技能不是魔教的": "d",
  "哪个门派拜师没有性别要求": "d",
  "哪个npc属于全真七子": "b",
  "哪样不能获得玄铁碎片": "c",
  "能增容貌的是下面哪个技能": "a",
  "捏脸需要花费多少银两？": "c",
  "捏脸需要寻找哪个NPC？": "a",
  "欧阳敏是哪个门派的？": "b",
  "欧阳敏是哪个门派的师傅": "b",
  "欧阳敏在哪一章": "a",
  "欧阳敏在唐门的哪个场景": "c",
  "排行榜最多可以显示多少名玩家？": "a",
  "逄义是在那个场景": "a",
  "披星戴月是披风类的第几级装备？": "d",
  "劈雳拳套有几个镶孔": "a",
  "霹雳掌套的伤害是多少": "b",
  "辟邪剑法是哪个门派的绝学技能": "a",
  "辟邪剑法在哪学习": "b",
  "婆萝蜜多心经是哪个门派的技能": "b",
  "七宝天岚舞是哪个门派的技能": "d",
  "七星鞭的伤害是多少？": "c",
  "七星剑法是哪个门派的绝学": "a",
  "棋道是哪个门派的技能": "c",
  "千古奇侠称号需要多少论剑积分兑换": "d",
  "乾坤大挪移属于什么类型的武功": "a",
  "乾坤一阳指是哪个师傅教的": "a",
  "青城派的道德经可以提升哪个属性": "c",
  "青城派的道家心法有哪个特殊效果": "a",
  "清风寨在哪": "b",
  "清风寨在哪个地图": "d",
  "清虚道长在哪一章": "d",
  "去唐门地下通道要找谁拿钥匙": "a",
  "全真的道家心法有哪个特殊效果": "a",
  "全真的基本阵法有哪个特殊效果": "b",
  "全真的双手互搏有哪个特殊效果": "c",
  "日月神教大光明心法可以提升什么": "d",
  "如何将华山剑法从400级提升到440级？": "d",
  "如意刀是哪个门派的技能": "c",
  "山河藏宝图需要在哪个NPC手里购买？": "d",
  "上山打猎是挂机里的第几个任务": "c",
  "少林的混元一气功有哪个特殊效果": "d",
  "少林的易筋经神功有哪个特殊效果": "a",
  "蛇形刁手是哪个门派的技能": "b",
  "什么影响打坐的速度": "c",
  "什么影响攻击力": "d",
  "什么装备不能镶嵌黄水晶": "d",
  "什么装备都能镶嵌的是什么宝石？": "c",
  "什么装备可以镶嵌紫水晶": "c",
  "神雕大侠所在的地图": "b",
  "神雕大侠在哪一章": "a",
  "神雕侠侣的时代背景是哪个朝代？": "d",
  "神雕侠侣的作者是?": "b",
  "升级什么技能可以提升根骨": "a",
  "生死符的伤害是多少？": "a",
  "师门磕头增加什么": "a",
  "师门任务每天可以完成多少次？": "a",
  "师门任务每天可以做多少个？": "c",
  "师门任务什么时候更新？": "b",
  "师门任务一天能完成几次": "d",
  "师门任务最多可以完成多少个？": "d",
  "施令威在哪个地图": "b",
  "石师妹哪个门派的师傅": "c",
  "使用朱果经验潜能将分别增加多少？": "a",
  "首次通过乔阴县不可以获得那种奖励？": "a",
  "受赠的消费积分在哪里领取": "d",
  "兽皮鞋可以在哪位那里获得？": "b",
  "树王坟在第几章节": "c",
  "双儿在扬州的哪个小地图": "a",
  "孙天灭是哪个门派的师傅": "c",
  "踏雪无痕是哪个门派的技能": "b",
  "踏云棍可以在哪位那里获得？": "a",
  "唐门的唐门毒经有哪个特殊效果": "a",
  "唐门密道怎么走": "c",
  "天蚕围腰可以镶嵌几颗宝石": "d",
  "天蚕围腰是腰带类的第几级装备？": "d",
  "天山姥姥在逍遥林的哪个场景": "d",
  "天山折梅手是哪个门派的技能": "c",
  "天师阵法是哪个门派的阵法": "b",
  "天邪派在哪里拜师": "b",
  "天羽奇剑是哪个门派的技能": "a",
  "铁戒指可以在哪位那里获得？": "a",
  "铁手镯可以在哪位那里获得？": "a",
  "铁血大旗门云海心法可以提升什么": "a",
  "通灵需要花费多少银两？": "d",
  "通灵需要寻找哪个NPC？": "c",
  "突破丹在哪里购买": "b",
  "屠龙刀法是哪个门派的绝学技能": "b",
  "屠龙刀是什么级别的武器": "a",
  "挖剑冢可得什么": "a",
  "弯月刀可以在哪位那里获得？": "b",
  "玩家每天能够做几次正邪任务": "c",
  "玩家想修改名字可以寻找哪个NPC？": "a",
  "晚月庄的内功是什么": "b",
  "晚月庄的七宝天岚舞可以提升哪个属性": "b",
  "晚月庄的小贩在下面哪个地点": "a",
  "晚月庄七宝天岚舞可以提升什么": "b",
  "晚月庄主线过关要求": "a",
  "王铁匠是在那个场景": "b",
  "王重阳是哪个门派的师傅": "b",
  "魏无极处读书可以读到多少级？": "a",
  "魏无极身上掉落什么装备": "c",
  "魏无极在第几章": "a",
  "闻旗使在哪个地图": "a",
  "乌金玄火鞭的伤害是多少？": "d",
  "乌檀木刀可以在哪位那里获得？": "d",
  "乌檀木刀可以在哪位npc那里获得？": "d",
  "钨金腰带是腰带类的第几级装备？": "d",
  "武当派的绝学技能是以下哪个": "d",
  "武穆兵法提升到多少级才能出现战斗必刷？": "d",
  "武穆兵法通过什么学习": "a",
  "武学世家加的什么初始属性": "a",
  "舞中之武是哪个门派的阵法": "b",
  "西毒蛇杖的伤害是多少？": "c",
  "吸血蝙蝠在下面哪个地图": "a",
  "下列哪项战斗不能多个玩家一起战斗？": "a",
  "下列装备中不可摹刻的是": "c",
  "下面哪个不是古墓的师傅": "d",
  "下面哪个不是门派绝学": "d",
  "下面哪个不是魔教的": "d",
  "下面哪个地点不是乔阴县的": "d",
  "下面哪个门派是正派": "a",
  "下面哪个是天邪派的师傅": "a",
  "下面有什么是寻宝不能获得的": "c",
  "向师傅磕头可以获得什么？": "b",
  "逍遥步是哪个门派的技能": "a",
  "逍遥林是第几章的地图": "c",
  "逍遥林怎么弹琴可以见到天山姥姥": "b",
  "逍遥派的绝学技能是以下哪个": "a",
  "萧辟尘在哪一章": "d",
  "小李飞刀的伤害是多少？": "d",
  "小龙女住的古墓是谁建造的？": "b",
  "小男孩在华山村哪里": "a",
  "新人礼包在哪个npc处兑换": "a",
  "新手礼包在哪里领取": "a",
  "新手礼包在哪领取？": "c",
  "需要使用什么衣服才能睡寒玉床": "a",
  "选择孤儿会影响哪个属性": "c",
  "选择商贾会影响哪个属性": "b",
  "选择书香门第会影响哪个属性": "b",
  "选择武学世家会影响哪个属性": "a",
  "学习屠龙刀法需要多少内力": "b",
  "雪莲有什么作用": "a",
  "雪蕊儿是哪个门派的师傅": "a",
  "雪蕊儿在铁雪山庄的哪个场景": "d",
  "扬文的属性": "a",
  "扬州询问黑狗能到下面哪个地点": "a",
  "扬州在下面哪个地点的处可以获得玉佩": "c",
  "羊毛斗篷是披风类的第几级装备？": "a",
  "阳刚之劲是哪个门派的阵法": "c",
  "杨过小龙女分开多少年后重逢?": "c",
  "杨过在哪个地图": "a",
  "夜行披风是披风类的第几级装备？": "a",
  "夜皇在大旗门哪个场景": "c",
  "一个队伍最多有几个队员": "c",
  "一天能完成谜题任务多少个": "b",
  "一天能完成师门任务有多少个": "c",
  "一天能完成挑战排行榜任务多少次": "a",
  "一张分身卡的有效时间是多久": "c",
  "一指弹在哪里领悟": "b",
  "移开明教石板需要哪项技能到一定级别": "a",
  "以下不是步玄派的技能的哪个": "c",
  "以下不是天宿派师傅的是哪个": "c",
  "以下不是隐藏门派的是哪个": "d",
  "以下哪个宝石不能镶嵌到戒指": "c",
  "以下哪个宝石不能镶嵌到内甲": "a",
  "以下哪个宝石不能镶嵌到披风": "c",
  "以下哪个宝石不能镶嵌到腰带": "c",
  "以下哪个宝石不能镶嵌到衣服": "a",
  "以下哪个不是道尘禅师教导的武学？": "d",
  "以下哪个不是何不净教导的武学？": "c",
  "以下哪个不是慧名尊者教导的技能？": "d",
  "以下哪个不是空空儿教导的武学？": "b",
  "以下哪个不是梁师兄教导的武学？": "b",
  "以下哪个不是论剑的皮肤？": "d",
  "以下哪个不是全真七子？": "c",
  "以下哪个不是宋首侠教导的武学？": "d",
  "以下哪个不是微信分享好友、朋友圈、QQ空间的奖励？": "a",
  "以下哪个不是岳掌门教导的武学？": "a",
  "以下哪个不是在洛阳场景": "d",
  "以下哪个不是在雪亭镇场景": "d",
  "以下哪个不是在扬州场景": "d",
  "以下哪个不是知客道长教导的武学？": "b",
  "以下哪个门派不是隐藏门派？": "c",
  "以下哪个门派是正派？": "d",
  "以下哪个门派是中立门派？": "a",
  "以下哪个是步玄派的祖师": "b",
  "以下哪个是封山派的祖师": "c",
  "以下哪个是花紫会的祖师": "a",
  "以下哪个是晚月庄的祖师": "d",
  "以下哪些物品不是成长计划第二天可以领取的？": "c",
  "以下哪些物品不是成长计划第三天可以领取的？": "d",
  "以下哪些物品不是成长计划第一天可以领取的？": "d",
  "以下哪些物品是成长计划第四天可以领取的？": "a",
  "以下哪些物品是成长计划第五天可以领取的？": "b",
  "以下属于邪派的门派是哪个": "b",
  "以下属于正派的门派是哪个": "a",
  "以下谁不精通降龙十八掌？": "d",
  "以下有哪些物品不是每日充值的奖励？": "d",
  "倚天剑加多少伤害": "d",
  "倚天屠龙记的时代背景哪个朝代？": "a",
  "易容后保持时间是多久": "a",
  "易容面具需要多少玄铁兑换": "c",
  "易容术多少级才可以易容成异性NPC": "a",
  "易容术可以找哪位NPC学习？": "b",
  "易容术向谁学习": "a",
  "易容术在哪里学习": "a",
  "易容术在哪学习？": "b",
  "银手镯可以在哪位那里获得？": "b",
  "银丝链甲衣可以在哪位npc那里获得？": "a",
  "银项链可以在哪位那里获得？": "b",
  "尹志平是哪个门派的师傅": "b",
  "隐者之术是那个门派的阵法": "a",
  "鹰爪擒拿手是哪个门派的技能": "a",
  "影响你出生的福缘的出生是？": "d",
  "油流麻香手是哪个门派的技能": "a",
  "游龙散花是哪个门派的阵法": "d",
  "玉蜂浆在哪个地图获得": "a",
  "玉女剑法是哪个门派的技能": "b",
  "岳掌门在哪一章": "a",
  "云九天是哪个门派的师傅": "c",
  "云问天在哪一章": "a",
  "在洛阳萧问天那可以学习什么心法": "b",
  "在庙祝处洗杀气每次可以消除多少点": "a",
  "在哪个NPC可以购买恢复内力的药品？": "c",
  "在哪个处可以更改名字": "a",
  "在哪个处领取免费消费积分": "d",
  "在哪个处能够升级易容术": "b",
  "在哪里可以找到“香茶”？": "a",
  "在哪里捏脸提升容貌": "d",
  "在哪里消杀气": "a",
  "在逍遥派能学到的技能是哪个": "a",
  "在雪亭镇李火狮可以学习多少级柳家拳": "b",
  "在战斗界面点击哪个按钮可以进入聊天界面": "d",
  "在正邪任务中不能获得下面什么奖励？": "d",
  "怎么样获得免费元宝": "a",
  "赠送李铁嘴银两能够增加什么": "a",
  "张教主在明教哪个场景": "d",
  "张三丰在哪一章": "d",
  "张三丰在武当山哪个场景": "d",
  "张松溪在哪个地图": "c",
  "张天师是哪个门派的师傅": "a",
  "张天师在茅山哪个场景": "d",
  "长虹剑在哪位那里获得？": "a",
  "长剑在哪里可以购买？": "a",
  "正邪任务杀死好人增长什么": "b",
  "正邪任务一天能做几次": "a",
  "正邪任务中客商的在哪个地图": "a",
  "正邪任务中卖花姑娘在哪个地图": "b",
  "正邪任务最多可以完成多少个？": "d",
  "支线对话书生上魁星阁二楼杀死哪个NPC给10元宝": "a",
  "朱姑娘是哪个门派的师傅": "a",
  "朱老伯在华山村哪个小地图": "b",
  "追风棍可以在哪位npc那里获得？": "a",
  "追风棍在哪里获得": "b",
  "紫宝石加什么属性": "d",
  "下面哪个npc不是魔教的": "d",
  "藏宝图在哪里npc那里买": "a",
  "从哪个npc处进入跨服战场": "a",
  "钻石项链在哪获得": "a",
  "在哪个npc处能够升级易容术": "b",
  "扬州询问黑狗子能到下面哪个地点": "a",
  "北岳殿神像后面是哪位npc": "b",
  "兽皮鞋可以在哪位npc那里获得？": "b",
  "在哪个npc处领取免费消费积分": "d",
  "踏云棍可以在哪位npc那里获得？": "a",
  "钢丝甲衣可以在哪位npc那里获得？": "d",
  "铁手镯可以在哪位npc那里获得？": "a",
  "哪个npc处可以捏脸": "a",
  "草帽可以在哪位npc那里获得？": "b",
  "铁戒指可以在哪位npc那里获得？": "a",
  "银项链可以在哪位npc那里获得？": "b",
  "在哪个npc处可以更改名字": "a",
  "长剑在哪里可以购买？": "a",
  "宝玉帽可以在哪位npc那里获得？": "d",
  "论剑中以下哪个不是晚月庄的技能": "d",
  "精铁棒可以在哪位npc那里获得？": "d",
  "弯月刀可以在哪位npc那里获得？": "b",
  "密宗伏魔是哪个门派的阵法": "c",
  "vip每天不可以领取什么": "b",
  "华山施戴子掉落的物品是什么": "b",
  "钻石项链在哪获得": "a",
  "藏宝图在哪个npc处购买": "b",
  "宝玉鞋击杀哪个npc可以获得": "a",
  "银手镯可以在哪位npc那里获得？": "b",
  "莲花掌是哪个门派的技能": "a",
  "九区服务器名称": "d",
  "以下哪个不是在洛阳场景": "d",
  "扬州在下面哪个地点的npc处可以获得玉佩": "c",
  "花不为在哪一章": "a",
  "跨服天剑谷是星期几举行的": "b",
  "白金手镯可以在哪位npc那里获得？": "a",
  "长虹剑在哪位npc那里获得？": "a",
  "全真的基本阵法有哪个特殊效果": "b",
  "以下哪个门派不是隐藏门派？": "c",
  "追风棍在哪里获得？": "b",
  "林祖师是哪个门派的师傅": "a",
  "丁老怪是哪个门派的终极师傅": "a",
  "武学世家加的什么初始属性": "a",
  "白金项链可以在哪位npc那里获得？": "b",
  "黑水伏蛟可以在哪位npc那里获得？": "c",
  "跨服副本周六几点开启": "a",
};

function getAnswer2Question(localQuestion) {
  // 如果找到答案，返回响应答案，a,b,c或者d
  // 如果没有找到答案，返回 "failed"
  var answer = QuestAnsLibs[localQuestion]
  if (answer) {
    return answer;
  }

  var halfQuestion = localQuestion.substring(localQuestion.length / 2)
  for (var quest in QuestAnsLibs) {
    // 若没有直接找到答案，使用一半的数据进行查找，若找到，认为是对了。
    if (quest.indexOf(halfQuestion) == 0) {
      return QuestAnsLibs[quest];
    }
  }
  return null;
}

var lastQuestion = "";

function stopAnswerQuestions() {
  getBtn("开答题").innerText = "开答题";
  delDispatchListener("answerQuestionsFunc")
}

function answerQuestionsFunc() {
  var answerQuestionsBtn = getBtn("开答题");
  if (answerQuestionsBtn.innerHTML == "开答题") {
    answerQuestionsBtn.innerText = "停答题";
    lastQuestion = "";
    addDispatchListener("answerQuestionsFunc", answerQuestions)
    go("question"); // 开始答题
  } else {
    stopAnswerQuestions();
  }
}

function answerQuestions(b, type, subtype, msg) {
  if (type == "notice" &&
    (msg.indexOf("每日武林知識問答次數已經達到限額") > -1)) {
    // 签题结束
    stopAnswerQuestions();
	home;
    return;
  }

  if (type != "show_html_page") return;

  // 解析题目
  var q = msg.split("\n");
  if (!q) return;
  if (q[0].indexOf("知識問答第") < 0) {
    Log(msg)
    return; // 非答题题目
  }
  var resp = "";
  for (var i = 1; i < q.length; i++) {
    var resp = q[i].replace(/ /g, "");
    if (resp.length > 0) break;
  }
  if (resp == "回答正確！") {
    Log(lastQuestion);
    lastQuestion = "";
    // 继续问
    go("question");
    return;
  }

  lastQuestion += (msg + "\n");

  // 答题
  var answer = getAnswer2Question(resp);
  if (answer == null) {
    Alert("未找到答案：" + lastQuestion);
    return;
  }
  lastQuestion += ("answer:" + answer);
  go("question " + answer);
  return;
}
// 答题结束

// 刷碎片 ----------------------------
function killSuipian(name, times) {
  times--;
  Log("剩余次数：" + times);
  autoFight({
    targetName: name,
    menKind: 0,
    menToFight: 0,
    anyOne: true,
    doneFn: function(code, msg) {
      if (code != 0 || times < 1) {
        Alert(code + "," + msg);
        return;
      }
      killSuipian(name, times); // 继续杀
    },
  });
}

// 刷碎片
function killSuipianFunc() {
  var store = getStore("killsuipian_key");
  if (!store) {
    store = "20|青竹蛇"
  }
  Input("请输入'剩余数量|名称'，只支持以下三种名称：<br/>数量|青竹蛇<br/>数量|醉汉<br/>数量|地痞<br/>", store, function(input) {
    var val = input.value;
    if (!val) return;
    var arr = val.split("|");
    if (!arr || arr.length != 2) {
      Alert("格式不正确");
      return;
    }
    var c = parseInt(arr[0]);
    if (c < 1) {
      Alert("需要大于0的数量");
      return;
    }
    var loc = "";
    switch (arr[1]) {
      case "青竹蛇":
        loc = "jh 2;n;n;n;n;n;n;n;n;n;e;"
        break;
      case "醉汉":
        loc = "jh 1;e;n;n;";
        break;
      case "地痞":
        loc = "jh 2;n;n;n;n;";
        break;
      default:
        Alert("不支持的名称：" + arr[1]);
        return;
    }

    setStore("killsuipian_key", val);
    killSuipian(arr[1], c);
    go(loc);
  });
}

// 糖人张
function trzFunc() {
  execNav("jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;w");
};


//　左盟主
function zmzFunc(mission) {
  execNav("jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;n;n;n", function(code, msg) {
    if (code != 0) {
      Alert(msg);
      return;
    }
    addDispatchListener("zmzFunc", function(b, type, subtype, msg) {
      if (type == "unknow_command" || (type == "notice" && subtype == "notify_fail" &&
          msg.indexOf("你今天已經完成過【逆我者亡】任務了") > -1)) {
        delDispatchListener("zmzFunc");
        return;
      }

      // 【逆我者亡】左冷禅：酒肉和尚目前在青城山，去帮我杀掉他，我重重有赏
      if (type != "main_msg") return;
      if (msg.length < 7) return;
      if (msg.substring(0, 6) != "【逆我者亡】") return;
      delDispatchListener("zmzFunc");

      var l = msg.match(/【逆我者亡】左冷禪：(.*)目前在(.*)，去幫我殺掉他，我重重有賞/);
      if (!l) return;
      // Alert(l[1] + "--" + l[2]);
      var jh = fixJhName(l[2]);

      // 进行自动击杀
      var targets = [];
      travelJhData(function(index, jhIndex, jhName) {
        if (jhName != jh) return false;

        travelNpcData(index, function(jh, loc, name, way, desc) {
          if (way.length == 0) return false;
          if (way.charAt(0) == ".") return false;
          if (targets.length > 0) {
            var lastTarget = targets[targets.length - 1];
            if (lastTarget.way == way) return false; // 路径相同，不再考虑
          }
          targets.push({
            jh: jh,
            loc: loc,
            name: name,
            way: way,
            desc: desc,
          })
        });

        // done
        return true;
      })
      if (targets.length == 0) {
        Alert("无可寻路的NPC数据")
        return;
      };

      findJhMen(0, targets, l[1], function(code, msg, args) {
        if (code != 0) {
          Alert(msg);
          return;
        }

        Log("Arrived at target");
        // 已到达目的地，开始执行杀操作
        autoFight({
          targetName: l[1],
          menKind: 0,
          menToFight: 0,
          newOne: true,
          doneFn: function(code, msg) {
            if (code != 0) return;
            // 收听任务结束
            addDispatchListener("zmz_fight", function(b, type, subtype, msg) {
              // 收听任务结束, 执行提交任务
              if (type != "main_msg") return;
              if (msg.length < 7) return;
              if (msg.substring(0, 6) != "【逆我者亡】") return;
              delDispatchListener("zmz_fight");
              zmzFunc(1); // 执行提交任务
            });
          },
        });
      });

    });

    if (mission == 1) {
      go("event_1_55671421");
      return;
    }

    AutoConfirm("领取任务？", 3 * 1000, function() {
      go("event_1_55671421");
    }, function() {
      delDispatchListener("zmzFunc");
    })
  })
}

//　杨英雄
function yyxFunc(mission) {
  execNav("jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939;place?星星峽;ne;ne;nw;nw", function(code, msg) {
    if (code != 0) {
      Alert(msg)
      return
    }
    addDispatchListener("yyxFunc", function(b, type, subtype, msg) {
      if (type == "unknow_command" || (type == "notice" && subtype == "notify_fail" && msg.indexOf("你今天已經完成過【懲姦除惡】任務了") > -1) || (type == "main_msg" && msg.indexOf("楊英雄：做得好") > -1)) {
        delDispatchListener("yyxFunc");
        return;
      }

      // 【逆我者亡】左冷禅：酒肉和尚目前在青城山，去帮我杀掉他，我重重有赏
      if (type != "main_msg") return;
      if (msg.length < 7) return;
      if (msg.substring(0, 6) != "【懲姦除惡】") return;
      delDispatchListener("yyxFunc");
      execNav("jh 21", function() {
        autoFight({
          targetName: "星宿惡徒【一】",
          menKind: 0,
          menToFight: 0,
        });
      });
    })

    AutoConfirm("领取任务？", 3 * 1000, function() {
      go("event_1_20668593");
    }, function() {
      delDispatchListener("yyxFunc");
    })
  })
}

//血刀妖僧
function xdysFunc(mission) {
  var goXD = function(done) {
    execNav("jh 44;n;n;n;n;e;ne;ne;ne;n;n;n;n;n;nw;nw;nw;w;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne;e;se;se;se", function(code, msg) {
      if (code != 0) {
        Alert(msg);
        return;
      }
      if (done) done();
    })
  }

  // 雪山山腳
  var roomName = getRoomName();
  if (mission != 1 && (roomName != "雪山山腳")) {
    goXD(function() {
      xdysFunc(1)
    })
    return;
  }

  addDispatchListener("xdysFunc", function(b, type, subtype, msg) {
    if (type == "unknow_command" || (type == "notice" && subtype == "notify_fail" && msg.indexOf("你今天已經完成過【討好老祖】任務了") > -1)) {
      delDispatchListener("xdysFunc");
      return;
    }

    // 【逆我者亡】左冷禅：酒肉和尚目前在青城山，去帮我杀掉他，我重重有赏
    if (type != "main_msg") return;
    if (msg.length < 7) return;
    if (msg.substring(0, 6) != "【討好老祖】") return;
    delDispatchListener("xdysFunc");

    var l = msg.match(/【討好老祖】血刀妖僧：有個(.*)在(.*)出現，去幫我把她弄過來，我重重有賞/);
    if (!l) return;
    var jh = Simplized(fixJhName(l[2]));
    var jhIdx = -1;
    travelJhData(function(index, jhIndex, jhName) {
      if (jhName != jh) return
      jhIdx = jhIndex
    })
    if (jhIdx == -1) {
      Alert("未找到：" + jh)
      return;
    }

    findMenFunc(jhIdx + "|" + l[1]);
  })

  AutoConfirm("领取任务？", 3 * 1000, function() {
    go("event_1_52483341");
  }, function() {
    delDispatchListener("xdysFunc");
  })
}

// 爬天山
// 从瀑布处去领悟
var climbTimes = 0;

function doClimbTianShan() {
  climbTimes++;

  if (climbTimes == 30) {
    climbTimes = 0;
    AutoConfirm("已经走30次了，继续?", 10 * 1000, function() {
      doClimbTianShan();
    })
    return;
  }

  go('ne;nw;'); // 山路-攀山绳处
  // 开始攀山
  goPlace("失足岩", "event_1_58460791", function() {

    var roomName = getRoomName();
    if (roomName == "雪谷") {
      // 出去，再次来到山脚
      go('se;s;e;n;');
      doClimbTianShan();
      return;
    }

    // 到达指定位置
    goPlace("閉關室入口", "nw;n;ne;nw;nw;w;n;n;n;e;e;s;", function() {
      AutoConfirm("确定带了御寒衣？", 10 * 1000, function() {
        addDispatchListener("xuanbinshi", function(b, type, subtype, msg) {
          if (type == "main_msg" && msg.indexOf("你已在此打坐許久") > -1) {
            delDispatchListener("xuanbinshi");
            AutoConfirm("打坐完成,回主页？", 10 * 1000, function() {
              go("home");
            });
          }
        })
        go("give tianshan_hgdz;ask tianshan_hgdz;s;event_1_34855843");
      })
    });
    return;
  })
}

function tianshanFunc() {
  // 去天山山脚
  var roomName = getRoomName();
  if (roomName == "天山山腳") {
    doClimbTianShan();
    return;
  }

  goPlace("官道", 'jh 39', function() {
    goPlace("天山山腳", "ne;e;n;ne;ne;n;", function(code, msg) {
      if (code != 0) {
        Alert(msg + "或到“天山山腳”再点")
        return;
      }
      // 成功到达
      doClimbTianShan();
    });
  });
}


//大昭壁画-------------------------
function mianbiFunc(done) {
  execNav('jh 26;w;w;n;w;w;w;n;n', function(code, msg) {
    if (code != 0) {
      done(code, msg);
      return
    }
    var roomName = getRoomName();
    switch (roomName) {
      case "陰山岩畫":
        go('event_1_12853448;home', done);
        return
      case "野狼谷":
        setTimeout(function() {
          AutoEscapeFunc(function() {
            mianbiFunc(done) // 再次调用，直接完成
          })
        }, 1000);
        return;
    }
    mianbiFunc(done) // 再次调用，直接完成
  });
}

// 从瀑布处去领悟
var assimilateTimes = 0;

function doXkdAssimilate(done) {
  var roomName = getRoomName();
  if (roomName == "石門") {
    // 领悟
    go("event_1_36230918;e;e;s;event_1_77496481");
    if (done) {
      done(0, "success");
    }
    return;
  }

  assimilateTimes++;
  if (assimilateTimes == 30) {
    assimilateTimes = 0;
    AutoConfirm("已经试了30次，继续？", 10 * 1000, function() {
      // 重来
      doXkdAssimilate(done);
    }, function() {
      Log("End xkdDoAssimilate");
      if (done) done(-1, "用户取消");
    })
    return;
  }

  // 游出去并重来
  execNav('event_1_4788477;nw;w;sw;w;n;n;w;w;w;s;w;nw;ne;ne;ne;e;e;e;e;e;s;e;event_1_44025101', function(code, msg) {
    if (code != 0) {
      Alert(msg);
      return;
    }
    // 重来
    doXkdAssimilate(done);
  });
}

//一键侠客岛--------------------
function richangFunc(done) {
  var room = $('.cmd_click_room')[0]
  if (room && (room.innerText == "俠客島渡口")) {
    // 如果已到渡口，开始执行日常任务
    // 从渡口开始，领取并来到瀑布
    goPlace("石門", 'e;ne;ne;ne;e;e;e;event_1_9179222;e;event_1_11720543;w;n;e;e;s;e;event_1_44025101', function() {
      assimilateTimes = 0;
      // 开始领悟
      doXkdAssimilate(done);
    });
    return;
  }

  // 去侠客岛
  goPlace("瀑布", "jh 36;yell;e;ne;ne;ne;e;e;e;event_1_9179222;e;event_1_11720543;w;n;e;e;s;e;event_1_44025101", function(code, msg) {
    if (code != 0) {
      Alert(msg);
      return;
    }
    // 到达后开始执行任务
    assimilateTimes = 0;
    // 开始领悟
    doXkdAssimilate(done);
  });
}

// 扬州武庙
function wumiaoFunc(name) {
  execNav("jh 5;n;n;n;n;n;n;w");
}

//杀孽龙-------------------------
function nielongFunc(done) {
  go('jh 15;n;nw;w;nw;n;event_1_14401179', done);
}


//白驼军阵-------------------------
function pozhenFunc(done) {
  go('jh 21;n;n;n;n;w', done);
}

//白驮奇袭
function qixiFunc() {
  go("jh 21;n;n;n;n;e;e;e;e;e;e;e;s;s;event_1_66710076;s;e;ne;e;se;n");
};


//峨眉金狼-------------------------
function jinlangFunc() {
  Confirm("别忘了劳军\n\n1锭换朱果", function() {
    go('jh 8;ne;e;e;e;n;');
  });
}

// 峨眉孤城
function guchengFunc(done) {
  go('jh 8;ne;e;e;e;n;n;n;n;n;e;e;e', done);
}

//恒山杀神-------------------------
function shashenFunc(done) {
  go('jh 9;event_1_20960851;', done);
}

//明教毒魔-------------------------
function DuMoFunc(done) {
  go("jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;w;nw;nw;event_1_70957287", done);
}
//少林渡劫-------------------------
function DuJieFunc(done) {
  go("jh 13;e;s;s;w;w;w;event_1_38874360", done);
}

//-------------------------分割线-----------

//天山七剑-------------------------
function QiJianFunc(done) {
  execNav('jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939;', function() {
    var roomName = getRoomName();
    if (roomName == "星星峽") {
      go('ne;ne;nw;nw;', done);
      return;
    }
    QiJianFunc(done);
  });
}
//-------------------------分割线-----------

//唐門冰月-------------------------
function bingyueFunc(end) {
  var killBinglin = function(done) {
    // event_1_48044005
    go("event_1_48044005", function() {
      autoFight({
        targetName: "冰麟獸",
        menKind: 0,
        menToFight: 0,
        anyOne: true,
        tryTimes: 3,
        doneFn: function(code, msg) {
          if (done) done(code, msg);
        }, // end doneFn
      }) // end autoFight
    }); // end go
  };

  var killXuanwu = function(done) {
    go("event_1_95129086", function() {
      autoFight({
        targetName: "玄武機關獸",
        menKind: 0,
        menToFight: 0,
        anyOne: true,
        tryTimes: 3,
        doneFn: function(code, msg) {
          if (done) done(code, msg);
        },
      }) // end autoFight
    }) // end go
  };
  var killMoling = function(done) {
    go("event_1_17623983;event_1_41741346", function() {
      autoFight({
        targetName: "九幽魔靈",
        menKind: 0,
        menToFight: 0,
        anyOne: true,
        tryTimes: 3,
        doneFn: function(code, msg) {
          if (done) done(code, msg);
        },
      }) // end autoFight
    }) // end go
  };
  var killXianren = function(done) {
    go("s", function() {
      autoFight({
        targetName: "冰月仙人",
        menKind: 0,
        menToFight: 0,
        anyOne: true,
        tryTimes: 3,
        doneFn: function(code, msg) {
          if (done) done(code, msg);
        },
      }) // end autoFight
    }) // end go
  };

  execNav("jh 14;w;n;n;n;n;event_1_32682066", function() {
    // 一層
    killBinglin(function() {
      // 二層
      killXuanwu(function() {
        // 三層
        killMoling(function() {
          // 四層
          killXianren(end);
        });
      });
    });
  }); // end go 唐門冰月
}
//-------------------------分割線-----------

// 风泉之剑---------------------------------------------------
function FengquanFunc() {
  go("jh 7;s;s;s;s;s;s;s;s;e;n;e;s;e");
}
//-------------------------分割线-----------

// 天山姥姥
function TianshanlaolaoFunc() {
  go("jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w;event_1_57688376;n;n;e;n;event_1_88625473;event_1_82116250;event_1_90680562;event_1_38586637;fight xiaoyao_tonglao");
}
//-------------------------分割线-----------

//苗疆炼药

function LianYaoIt(resYaoParas) {
  addDispatchListener("LianYaoIt", function(b, type, subtype, msg) {
    // 炼失败,结束
    if (type == "notice" && subtype == "notify_fail") {
      Alert(msg);
      delDispatchListener("LianYaoIt")
      return;
    }

    // 监听成功事件,并继续
    if (type == "notice" && msg.indexOf("藥已煉制得差不多") > -1) {
      go('lianyao');
    }
  });
  Confirm("买材料?", function() {
    // 买15个毒琥珀
    go('shop money_buy mny_shop10_N_10');
    goWithTimes(5, "shop money_buy mny_shop10");
    // 买15个毒藤胶
    go('shop money_buy mny_shop11_N_10');
    goWithTimes(5, "shop money_buy mny_shop11");
    // 开始练药
    go('lianyao');
  }, function() {
    // 开始练药
    go('lianyao');
  });
}

var goMiaoJianTimes = 0;

function MiaoJiangFunc() {
  var room = $('.cmd_click_room')[0]
  if (room && room.innerText == "煉毒室") {
    LianYaoIt(0);
    return;
  }

  goPlace("煉毒室", "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914;place?瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;w", function(code, msg) {
    if (code != 0) {
      Alert(msg);
      return;
    }
    // 已到达,开始炼药
    LianYaoIt(0);
  });
}

function autoFb9() {
  execNav("fb 9;kill?劍影;n;kill?劍浪;n;kill?劍豹;n;kill?劍蟒;n;kill?劍飛;n;kill?劍神;home")
}

function autoFb8() {
  execNav("fb 8;n;kill?夜傷;n;kill?百裡傷;fb 8;w;kill?夜殺;w;kill?燭夜長老;fb 8;s;kill?夜刺;s;kill?千夜刺將;fb 8;e;kill?夜幽女;e;kill?千夜女使;event_1_91709617;kill?風陵總管");
  // event_1_44552735 风陵破阵
  // execNav("fb 8;n;kill?夜傷;n;kill?百里傷;home")
}

function autoFb7() {
  execNav("fb 7;event_1_56340108;kill?大夏神箭;event_1_21387224;s;kill?金錘虎將;event_1_94902320")
}

function autoChangleFunc() {
  execNav("fb 6;event_1_94101353;kill?黃門丞;fb 6;event_1_8221898;kill?少府卿;fb 6;event_1_18437151;kill?羽林衛;fb 6;event_1_74386803;kill?舞樂令")
}

function autoFb6() {
  execNav("fb 6;event_1_94101353;kill?黃門丞;event_1_39816829;kill?羽林中郎將;event_1_85127800;event_1_39026868;kill?大司馬;s;kill?未央公主")
}

function autoFb5() {
  execNav("fb 5;event_1_26662342;kill?勾陳教香主;se;kill?勾陳教掌教;nw;nw;event_1_15727082;kill?紫薇教香主;nw;kill?紫薇教掌教;se;se;event_1_12238479;kill?長生教香主;sw;kill?長生教掌教;ne;ne;event_1_889199;kill?後土教香主;ne;kill?後土教掌教;sw;sw", function() {
    setTimeout(function() {
      execNav("event_1_77337496;kill?後土真人");
    }, 1000)
  });
}

function autoFb4() {
  execNav("fb 4;n;kill?翻雲刀神;n;kill?織冰女俠;n;kill?覆雨劍神;n;kill?排雲狂神;n;kill?九天老祖");
}

function autoFb3() {
  execNav("fb 3;w;kill?天璇劍客;e;s;kill?玉衡劍客;n;e;kill?瑤光劍客;event_1_9777898;kill?天樞劍客");
}

function autoFb2() {
  execNav("fb 2;kill?護衛;kill?小兵;kill?小兵;e;n;kill?百夫長;kill?百夫長;event_1_48728674;s;s;kill?精兵;kill?千夫長;n;e;kill?李信");
}

function autoFb1() {
  execNav("fb 1;kill?獨龍寨土匪;n;kill?獨龍寨土匪;n;kill?獨龍寨土匪;n;kill?獨龍寨土匪;n;kill?傅一鏢");

}

kkf = function(t) {
  if (t == 1) {
	kkft = setInterval(function() {execNav("fb 1;kill?獨龍寨土匪;n;kill?獨龍寨土匪;n;kill?獨龍寨土匪;n;kill?獨龍寨土匪;n;kill?傅一鏢;jh 1;home")}, 15000)
  } else if (t == 0) {
	clearInterval(kkft);
  }

}

// 破除魔障---------------------------------------------------
function pochumozhangFunc() {
  go('jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;n;n;n;e;e;event_1_94442590;event_1_22950681');
}

//  佳人觅香
function jiarenFunc() {
  go("jh 32;n;n;se;e;s;s;look_npc murong_azhu;event_1_99232080;e;e;s;e;s;e;e;e;look_npc murong_fangling;event_1_2207248");
}
//  十八木人
function murenFunc() {
  go("jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;n;n;n;event_1_91914705;e;e;e");
}

//  破石寻花
function poshiFunc() {
  go("jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne;ne;nw;nw;w;event_1_95874671");
}

//  闻香寻芳
function xunhuaFunc() {
  go("jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;sw;sw;sw");
}

//  四大绝杀
function jueshaFunc() {
  go("jh 44;n;n;n;n;e;ne;ne;ne;n;n;n;n;n;nw;nw;nw;w;n;n;n;n;e;n;n;n;n;n;w;w;n;n;n;n;n;n;n;n");
}

// 闯入冥庄
function mingzhuangFunc() {
  execNav("jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e;e;e;event_1_77775145");
}

// 冥庄前院
function mzqianyuanFunc() {
  var roomName = getRoomName();
  if (roomName != "幽冥山庄前院" && roomName != "幽冥山莊前院") {
    Alert("请先进入幽冥山庄前院");
    return;
  }
  execNav("e;kill?絳衣殺手;e;kill?絳衣殺手;n;kill?絳衣劍客;s;s;kill?絳衣劍客;n;e;kill?絳衣殺手;e;kill?絳衣殺手;ne;kill?絳衣劍客;sw;s;kill?絳衣殺手;s;kill?絳衣殺手;s;kill?絳衣殺手;e;kill?巨鵬");
}
//// 冥庄花园
function mzhuayuanFunc() {
  var roomName = getRoomName();
  if (roomName != "幽冥山庄花园" && roomName != "幽冥山莊花園") {
    Alert("请先进入幽冥山庄花园");
    return;
  }
  execNav("e;kill?白骨秀士;e;kill?白骨秀士;ne;kill?白骨秀士;nw;kill?血劍客;se;ne;kill?白骨秀士;ne;kill?血劍客;sw;se;kill?白骨秀士;se;kill?白骨秀士;e;kill?血劍客;w;sw;kill?白骨秀士;sw;kill?白骨秀士;se;kill?血劍客;nw;sw;kill?白骨秀士;sw;kill?宇文秀");
}

// 冥庄后院
function mzhuoyuanFunc() {
  var roomName = getRoomName();
  if (roomName != "幽冥山庄后院" && roomName != "幽冥山莊後院") {
    Alert("请先进入幽冥山庄后院");
    return;
  }
  execNav("se;kill?鬼殺;se;kill?鬼殺;s;kill?鬼殺;w;kill?幽冥鬼殺;e;e;kill?幽冥鬼殺;w;s;kill?鬼殺;s;kill?鬼殺;s;kill?鬼殺;w;kill?幽冥鬼殺;e;e;kill?鬼殺;s;kill?幽冥鬼殺;n;e;kill?鬼殺;e;kill?鬼殺;n;kill?幽冥鬼殺;s;e;kill?鬼殺;e;kill?鬼殺;n;kill?莊主分身");
}

var yijianrichangIdx = 0;
var yijianrichangKill = false;

function getYijianrichangIdx() {
  var roomInfo = g_obj_map.get("msg_room");
  if (!roomInfo) roomInfo = new Map();;
  var mapId = roomInfo.get("map_id");
  var roomName = roomInfo.get("short");
  var idx = 0;
  switch (roomName) {
    case "龍晶石洞":
      idx = 0;
      break;
    case "武安君廟":
      idx = 1;
      break;
    case "青銅盾陣":
      idx = 2;
      break;
    case "飛羽箭陣":
      idx = 3;
      break;
    case "近衛狼營":
      idx = 4;
      break;
    case "中軍大帳":
      if (roomInfo.get("east")) {
        idx = 5;
      } else {
        idx = 16;
      }
      break;
    case "東新城門":
      idx = 6;
      break;
    case "鎮西門":
      idx = 7;
      break;
    case "護國門":
      idx = 8;
      break;
    case "箭樓":
      idx = 9;
      break;
    case "瞭望台":
      idx = 10;
      break;
    case "軍械庫":
      idx = 11;
      break;
    case "菩提金剛陣":
      idx = 12;
      break;
    case "豹師大帳":
      idx = 13;
      break;
    case "虎師大帳":
      idx = 14;
      break;
    case "鷹師大帳":
      idx = 15;
      break;
      //    case "中軍大帳":
      //      idx = 16;
      //      break;
    case "崑崙墟":
      idx = 17;
      break;
  }
  return {
    name: roomName,
    idx: idx,
  }
}

function killYijianrichang() {
  closeBattleResult();
  yijianrichangIdx++;
  switch (yijianrichangIdx) {
    case 0:
      nielongFunc(function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "孽龍分身",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 1:
      shashenFunc(function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "殺神寨頭目",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 2:
      pozhenFunc(function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "青衣盾衛",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 3:
      go("w", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "飛羽神箭",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 4:
      go("w", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "銀狼近衛",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 5:
      go("w", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "軍中主帥",
          menKind: 0,
          menToFight: 0,
          fightKind: "fight",
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 6:
      go('jh 8;ne;e;e;e;n;', function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "赤豹死士",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 7:
      go("n;n", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "黑鷹死士",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 8:
      go("n;n", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "金狼死士",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 9:
      // go("e;e;n;event_1_19360932 go"); // 劳军
      // go("s;e;event_1_55885405;w;s", function() {
      go("e;e;e;event_1_55885405;w;s", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "黑羽刺客",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      }); // 领军令
      return;
    case 10:
      go("n;w;s", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "阿保甲",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      })
      return;
    case 11:
      go("n;e;n", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "乞利",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 12:
      go("s;e;event_1_53216521"); // 交军令
      DuJieFunc(function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "渡雨神識",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 13:
      qixiFunc();
      go("event_1_53430818;n", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "豹軍侍衛",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 14:
      go("s;s;nw;n;n", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "虎軍侍衛",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      })
      return;
    case 15:
      go("s;s;se;e;e;e", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "鷹軍侍衛",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 16:
      go("w;w;w;nw;w;nw;event_1_89411813", function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "中軍侍衛",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 17:
      DuMoFunc(function() {
        if (!yijianrichangKill) return;
        autoFight({
          targetName: "九幽毒魔",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 1,
          wait: 1000,
        });
      });
      return;
    case 18:
      QiJianFunc(function() {
        addDispatchListener("QijianFunc", function(b, type, subtype, msg) {
          if (type != "jh" || subtype != "new_npc") return;
          var id = b.get("id");
          if (id == "tianshan_yangyingxiong") return;

          delDispatchListener("QijianFunc");
          clickButton('kill ' + id);
        });
      });
      stopYijianrichang();
      return;
  }
}

function addYijianrichangListen() {
  addDispatchListener("yijianrichang", function(b, type, subtype, msg) {
    if (type == "vs" && subtype == "combat_result") {
      yijianrichangIdx = getYijianrichangIdx().idx; // 重新修正位置
      killYijianrichang();
    }
  });
}

function stopYijianrichang() {
  var btn = getBtn("一键日常");
  yijianrichangKill = false;
  delDispatchListener("yijianrichang");
  btn.innerHTML = "一键日常";
}

function yijianrichangFunc() {
  var btn = getBtn("一键日常");
  if (btn.innerHTML == "停止日常") {
    stopYijianrichang();
    return;
  }
  yijianrichangIdx = getYijianrichangIdx().idx;
  Input("战斗结束后自动前往下一个关卡并等待战斗(0+1:开始为0，共有1个战斗)；第1个战斗是青城孽龙，请手动前往。<br \>" +
    "顺序：孽龍(0+1)-殺神(1+1)-破陣(2+4)-金狼(6+3)-孤城(9+3)-渡劫(12+1)+奇襲(13+4)+毒魔(17+1)<br />" +
    "请输入已战斗次数", yijianrichangIdx,
    function(input) {
      yijianrichangIdx = parseInt(input.value);
      btn.innerHTML = "停止日常"
      addYijianrichangListen();
      Confirm("主动叫杀?请单人时使用", function() {
        yijianrichangKill = true;
        yijianrichangIdx--;
        killYijianrichang();
      })
    })
};


//逃跑-------------------------
var AutoEscapeFuncIntervalFunc;

function AutoEscapeFunc(doneCb) {
  // 若已在执行，不再执行
  if (AutoEscapeFuncIntervalFunc) {
    return false;
  }
  // 间隔500毫秒逃跑一次
  AutoEscapeFuncIntervalFunc = setInterval(function() {
    AutoEscape(function(){
        clearEscape();
        if (doneCb) {
            doneCb();
        }
    })
  }, 500);
  return true;
}

function clearEscape() {
  clearInterval(AutoEscapeFuncIntervalFunc);
  AutoEscapeFuncIntervalFunc = null;
}

function AutoEscape(doneCb) {
  if (!inBattle()) {
    clearEscape();
    if (doneCb) {
      // 逃跑成功的回调
      doneCb();
    }
    return;
  }
  go('escape'); //逃跑
}

function escapeFunc() {
  var escapeBtn = getMenu("要逃跑");
  if (escapeBtn.innerHTML == '要逃跑') {
    escapeBtn.innerHTML = '不逃跑';
    AutoEscapeFunc(function() {
      escapeBtn.innerHTML = '要逃跑';
    });
  } else {
    clearEscape();
    escapeBtn.innerHTML = '要逃跑';
  }
}

// 补位
var forBattleTimer = null;

function endChangeBattleFunc(done) {
  clearInterval(forBattleTimer);
  clearEscape();
  if (done) done();
}

function startChangeBattleFunc(kind, done) {
  if (!inBattle()) {
    Alert("未观战或未在战斗中", done);
    return;
  }
  forBattleTimer = setInterval(function() {
    var bInfo = getBattleInfo();
    var watcherId = bInfo.get("is_watcher"); // 检查是否观战中

    var maxVs = parseInt(bInfo.get("max_vs"));
    var vacancy1 = false;
    var vacancy2 = false;
    var id1 = "";
    var id2 = "";
    var myLoc = battleMyHead; // 默认等于战斗位
    for (var i = 0; i < maxVs; i++) {
      var t1 = bInfo.get("vs1_pos" + i);
      if (!vacancy1 && !t1) {
        vacancy1 = true
      }
      if (!id1) {
        id1 = t1;
      }
      if (t1 && t1 == watcherId) {
        myLoc = "vs1"
      }

      var t2 = bInfo.get("vs2_pos" + i);
      if (!vacancy2 && !t2) {
        vacancy2 = true
      }
      if (!id2) {
        id2 = t2;
      }
      if (t2 && t2 == watcherId) {
        myLocl = "vs2"
      }
    }
    // 无可用位置
    if (!vacancy1 && !vacancy2) return;

    var killId = "";
    var killKind = "kill";
    switch (kind) {
      case "0": // 补本边
        if (myLoc == "vs1") {
          if (vacancy1) {
            killId = id2;
          } else {
            return
          }
        } else {
          if (vacancy2) {
            killId = id1;
          } else {
            return
          }
        }
        break;
      case "1": // 补对边
        if (myLoc == "vs1") {
          if (vacancy2) {
            killId = id1;
          } else {
            return
          }
        } else {
          if (vacancy1) {
            killId = id2;
          } else {
            return
          }
        }
        break;
      case "2": // 任一边空位时执行补位
        if (vacancy1) killId = id1;
        if (vacancy2) killId = id2;
        break;
      case "3": // 观战
        killId = id1
        killKind = "watch_vs";
        break;
    }

    AutoEscapeFunc(function() {
      // 逃跑成功
      clearInterval(forBattleTimer);
      go(killKind + " " + killId);
      endChangeBattleFunc(done);
    });
  }, 200);
}

var reBattleBtn = null;
var reBattleStartName = "";
var reBattleEnd = function() {
  endChangeBattleFunc()
  if (reBattleBtn) {
    reBattleBtn.innerHTML = reBattleStartName;
  }
  reBattleBtn = null;
};

function escapeAndReBattle(kind, startName, endName) {
  var btn = getBtn(startName);
  var btnName = btn.innerHTML;
  if (reBattleEnd) reBattleEnd();
  if (btnName != startName) return;

  reBattleStartName = startName;
  reBattleBtn = btn;
  btn.innerHTML = endName;
  startChangeBattleFunc(kind, reBattleEnd)
  return;
}

function escapeAndBattleFunc() {
  escapeAndReBattle("0", "本边补位", "停止补位");
}

function escapeAndOppBattleFunc() {
  escapeAndReBattle("1", "对边补位", "停止补位");
}

function escapeAndAutoFunc() {
  escapeAndReBattle("2", "自动补位", "停止补位");
}

function escapeAndViewBattleFunc() {
  escapeAndReBattle("3", "进入观战", "停止观战");
}

var teamLeaderId = "";
var followTeamOn = false;

function followTeamMon(b, type, subtype) {
  if (type != "channel" && subtype != "team") return;
  if (b.get("id") != teamLeaderId) return;
  go("")
}

function followTeamFunc() {
  var btn = getBtn("队伍跟随");
  if (btn.innerHTML == "队伍跟随") {
    callTeamLeaderId(function(id) {
      teamLeaderId = id;
      followTeamOn = true;
      btn.innerHTML = "停止跟随";
      addDispatchListener("followTeamMon", followTeamMon);
    })
    return;
  }
  delDispatchListener("followTeamMon", followTeamMon);
  btn.innerHTML = "队伍跟随";
  followTeamOn = false;
}




//加力------------------------
var enforcePoints = 800;
var enforceStoreKey = "enforce"

function resetEnforceFunc() {
  var resetEnforceBtn = getBtn("打开加力");
  if (resetEnforceBtn.innerHTML == '打开加力') {
    var eStore = getStore(enforceStoreKey);
    if (eStore) {
      eforcePoints = eStore;
    }
    Input("请设置你的加力最大值,不要超过，不然不加力", enforcePoints, function(input) {
      var e = parseInt(input.value)
      if (!e || e == 0) {
        return;
      }
      enforcePoints = e;
      setStore(enforceStoreKey, enforcePoints);
      clickButton('enforce ' + enforcePoints); //加力最大
      resetEnforceBtn.innerHTML = '关闭加力';
    });
  } else {
    go('enforce 0'); // 加力0
    resetEnforceBtn.innerHTML = '打开加力';
  }
}


var qlKeysOri = "0|碎片,斬龍,烈日,明月,花,草,木,菊,仙,雪英,龍皮至尊甲衣,九天龍吟劍,飛宇天怒刀,天罡掌套,小李飛刀,烏金玄火鞭,達摩杖,開天寶棍,斬神刀,龍象掌套,暴雨梨花針,殘陽棍,破冥斧,伏虎杖,七星鞭,日光寶甲衣,倚天劍,屠龍刀,墨玄掌套,冰魄銀針,烈日棍,星月大斧,西毒蛇杖,碧磷鞭,月光寶甲衣"
var qlKeysArr = [];
var qlKeysMenTo = 0;

function listenQLFunc(restore) {
  var listenQLBtn = getBtn("监听青龙");
  if (listenQLBtn.innerHTML == "监听青龙") {
    var init = function(val) {
      var valArr = val.split("|");
      var keyStr = "";
      if (valArr.length < 2) {
        keyStr = valArr[0];
      } else {
        qlKeysMenTo = parseInt(valArr[0])
        keyStr = valArr[1];
      }

      var keys = keyStr.split(",")
      qlKeysArr = [];
      for (var i = keys.length - 1; i > -1; i--) {
        if (keys[i].length == 0) {
          continue
        }
        var hasStar = keys[i].charAt(0) == "*";
        if (hasStar) {
          keys[i] = keys[i].substring(1);
        }

        qlKeysArr.push({
          name: keys[i],
          star: hasStar,
        });
      }
      listenQLBtn.innerText = '停止青龙';
      addSysMsgListener("listenQLFunc", "青龍", QinglongMon)
      setStore("qinglong_status", 1);
      setStore("qinglong_keys", val);
    }

    var storeKeys = getStore("qinglong_keys")
    if (!storeKeys) {
      storeKeys = qlKeysOri;
    }
    if (!restore) {
      Input("请输入监听的关键字,以<span style='color:red'>|、英文逗号</span>分割，并在<span style='color:red'>本服</span>中挂机。" +
        "<br/>格式：击杀类型|物品词组" +
        "<br/>击杀类型：0杀守方(好人)，1杀攻方(坏人)。" +
        "<br/>物品词组：以<span style='color:red'>英文逗号</span>分割多个关键词，关键词前带*为自动寻路击杀，不带仅提示。匹配顺序为从左到右，匹配到即止。" +
        "<br/><span style='color:red'>例如：</span>" +
        "<br/><span style='color:blue'>0|*斩龙宝镯,*碎片,斩龙</span> 自动击杀含'斩龙宝镯'、'碎片'的好人方(守方)青龙，提醒含'斩龙'关键字的青龙。" +
        "<br/><span style='color:blue'>1|*</span> 杀所有青龙中的坏人(攻方)。" +
        "<br/><span style='color:blue'>仅提示</span>：填空值。" +
        "<br/><br/>當前監聽：" + storeKeys, storeKeys,
        function(input) {

          var val = input.value;
          if (val == undefined) return;
          init(val);
        })
      return;
    }
    init(storeKeys);
  } else {
    stopAutoFight();
    delSysMsgListener("listenQLFunc")
    listenQLBtn.innerText = '监听青龙';
    setStore("qinglong_status", 0);
  }
}

// 跨服镖车
function biaocheSysMon(b, type, subtype, msg) {
  //【系统】荣威镖局：[81-85区]王世仲押运镖车行至跨服-北岳殿，忽入[81-85区]洪昭天埋伏之中，哪位好汉能伸出援手，我荣威镖局必有重谢！
  var l = msg.match(/【系統】榮威鏢局：(.*)押運鏢車行至跨服-(.*)，忽入(.*)埋伏之中，哪位好漢能伸出援手，我榮威鏢局必有重謝！/)
  if (!l) return;
  // 过滤非本服的
  if (l[1].indexOf(userAreaName) < 0) return;
  addDispatchListener("biaocheMon", biaocheMon);
}

// {
//     name:"",
//     opp: false,
// }
var biaocheMen = null;

// addDispatchListener("biaocheMon", biaocheMon); // for testing
function biaocheMon(b, type, subtype, msg) {
  if (!biaocheMen) return;
  if (type != "main_msg") return;
  // 榮威鏢局:(.*)押運鏢車行至跨服-(.*)，忽入(.*)埋伏之中，哪位好漢能伸出援手，我榮威鏢局必有重謝！
  // [81-85区]王世仲
  // href;0;find_qinglong_road 851806
  // [81-85区]洪昭天
  // msg = "榮威鏢局:[76-80区]花落云押运镖车行至跨服-\3,href;0;find_qinglong_road 974395,\3,上天梯,\3,0,\3，忽入[76-80区]墟归一埋伏之中，哪位好汉能伸出援手，我荣威镖局必有重谢！"
  var l = msg.match(/榮威鏢局:(.*)押運鏢車行至跨服-(.*)，忽入(.*)埋伏之中，哪位好漢能伸出援手，我榮威鏢局必有重謝！/);
  if (!l) return;
  // if (l[1].indexOf(userAreaName) < 0) return;
  // delDispatchListener("biaocheMon");
  // 过滤非本服的
  if (l[1].indexOf(userAreaName) < 0) return;
  if (l[1].indexOf(biaocheMen.name) < 0) return;
  delDispatchListener("biaocheMon")

  var roads = l[2].split("\3") // [\3,href;0;find_qinglong_road 974395,\3,上天梯,\3,0,\3]
  Log(roads);
  if (roads.length < 3) return;
  // 执行引路蜂寻路
  execNav(roads[1].split(";")[2], function(code, msg) {
    if (code != 0) {
      var found = false;
      travelNpcData(0, function(jh, loc, name, way, desc) {
        if (loc != "周日镖车" || roads[2].indexOf(name) < 0) {
          return false
        }
        found = true;
        goPlace(name, way, function() {
          autoFight({
            targetName: l[1],
            menKind: 0,
            menToFight: biaocheMen.to,
            newOne: 1,
            doneFn: function(code, msg) {
              AutoAlert(msg + ":" + code + "," + biaocheMen.name, 30 * 1000);
            },
          });
        })
        return true
      })
      if (!found) {
        Alert("未找到地图数据" + roads[2] + "请记录反馈开发者。");
      }
    } else {
      autoFight({
        targetName: l[1],
        menKind: 0,
        menToFight: biaocheMen.to,
        newOne: 1,
        doneFn: function(code, msg) {
          AutoAlert(msg + ":" + code + "," + biaocheMen.name, 30 * 1000);
        },
      });
    }
  })
  return;
}

function listenBiaocheFunc(restore) {
  var btn = getBtn("监听镖车");
  if (btn.innerHTML == "监听镖车") {
    var init = function(val) {
      if (val.charAt(0) == "#") {
        biaocheMen = {
          name: val.substring(1),
          to: 1,
        }
      } else {
        biaocheMen = {
          name: val,
          to: 0,
        }
      }
      addSysMsgListener("listenBiaocheFunc", "榮威鏢局", biaocheSysMon)
      btn.innerHTML = "停止镖车";
    };
    var biaocheKey = getStore("biaoche_key");
    if (!biaocheKey) {
      biaocheKey = "花落雲";
    }
    if (restore) {
      init(biaocheKey);
      return;
    }
    Input(
      "请输入需要监听的押车人物，前面带#为反杀劫车人物, 例如：<br/>王世仲--杀王世仲;<br/>#王世仲--杀劫车的人。<br />注意：当前需要有游戏vip直接寻路资格。",
      biaocheKey,
      function(input) {
        var val = input.value;
        if (!val) return;
        init(val);
        setStore("biaoche_key", val);
        setStore("biaoche_status", "1");
      })
    return;
  } else {
    btn.innerHTML = "监听镖车";
    delSysMsgListener("listenBiaocheFunc")
    delDispatchListener("biaocheMon")
    setStore("biaoche_status", "0");
  }
}


// 游侠
var allYXName = "林遠圖,厲工,金輪法王,鳩摩智,上官金虹,封寒,卓凌昭,厲若海,乾羅,孫恩,婠婠,練霓裳,成崑,侯希白,夜魔,柯鎮惡,哈瑪雅,喬峰,盧雲,虛竹,徐子陵,虛夜月,雲夢璃,花無缺,風行烈,黄藥師,洪七公,石破天,寧不凡,獨孤求敗,龐斑,楊肅觀,歐陽鋒,葉孤城,燕狂徒,逍遙子,李尋歡,令東來,宋缺,楚留香,王語嫣,範*,程靈素,水靈光,霍青桐,石青璇,李紅袖,宋玉致,華陀,魯妙子,顧倩兮,水笙,林仙儿,郭襄,程瑛,任盈盈,阿朱,袁紫衣,趙敏,小昭,韋小寶";

function listenYXFunc(restore) {
  var yxBtn = getBtn('监听游侠');
  if (yxBtn.innerHTML == "监听游侠") {
    var init = function(names) {
      var arr = names.split(",")
      if (!arr || arr.length == 0) {
        Alert("输入格式有误");
        return;
      };
      yxListenNames = arr;
      yxBtn.innerText = '停止游侠';
      addSysMsgListener("listenYXFunc", "遊俠會", YXMon);
    };
    var yxNames = getStore("youxia_names");
    if (!yxNames) {
      yxNames = allYXName;
    }
    if (restore == 1) {
      init(yxNames);
      return;
    }
    Input("请输入监听的游侠名称，以英文逗号分割，全部人员如下：<br/>" +
      allYXName + "<br/>" +
      "当前：<br/>" +
      yxNames + "<br/>",
      yxNames,
      function(input) {
        var val = input.value;
        init(val);
        setStore("youxia_names", val);
        setStore("youxia_status", 1);
      });
    return;
  }
  yxBtn.innerText = '监听游侠';
  setStore("youxia_status", 0);
  delSysMsgListener("listenYXFunc");
}

var yxListenNames = [];


function talkchannel() {
  addSysMsgListener("normal_talk", "【閒聊】", normal_talk);
}

function normal_talk(b, type, subtype, msg) {
  var l = msg.match(/【閒聊】(.*)/);
  if (!l) {
    return;
  }
  WriteToScreen(l);
}

talkchannel();

function YXMon(b, type, subtype, msg) {
  var l = msg.match(/【系統】遊俠會：聽說(.*)出來闖盪江湖了，目前正在前往(.*)的路上。/);
  if (!l) {
    return;
  }
  var match = false;
  for (var i = 0; i < yxListenNames.length; i++) {
    if (yxListenNames[i].indexOf(l[1]) < 0) continue
    match = true;
    break;
  }
  if (!match) return;

  // 检查是否是在主页，若不是，不执行
  var goKill = function(inHome) {
    // 进行自动击杀
    var targets = [];
    var jh = fixJhName(l[2]);
    travelJhData(function(index, jhIndex, jhName) {
      if (jhName != jh) return false;

      travelNpcData(index, function(jh, loc, name, way, desc) {
	    var name = Traditionalized(name);
	    var way = Traditionalized(way);
	    var desc = Traditionalized(desc);
        if (way.length == 0) return false;
        if (way.charAt(0) == ".") return false;
        if (targets.length > 0) {
          var lastTarget = targets[targets.length - 1];
          if (lastTarget.way == way) return false; // 路径相同，不再考虑
        }
        targets.push({
          jh: jh,
          loc: loc,
          name: name,
          way: way,
          desc: desc,
        })
      });

      // done
      return true;
    })
    if (targets.length == 0) {
      Alert("无可寻路的NPC数据")
      return;
    };
    findJhMen(0, targets, l[1], function(code, msg, args) {
      if (code != 0) return;
      Log("Arrived at target");
      // 已到达目的地，开始执行杀操作
      autoFight({
        targetName: l[1],
        menKind: 0,
        menToFight: 0,
        newOne: true,
        doneFn: function(code, msg) {
          if (code != 0) {
            AutoConfirm("回主页？", 10 * 1000, function() {
              go("jh 1;home");
            });
            return;
          }
          var getBodyTimer = null;
          // 监听战斗结束，并摸东西
          addDispatchListener(args[1], function(b, type, subtype, msg) {
            // 战斗结束后, 摸尸体
            if (type == "vs" && subtype == "combat_result") {
              getBodyTimer = setInterval(function() {
                AutoGetItem(["屍體", "骸骨"]);
              }, 5 * 1000)
            };

            // 检查是否摸到了
            if (msg.indexOf("屍體裡搜出") > -1 || msg.indexOf("物品已經太多了") > -1 || msg.indexOf("你週圍並沒有這樣物品") > -1) {
              clearInterval(getBodyTimer);
              delDispatchListener(args[0]);
              AutoConfirm("回主页？", 10 * 1000, function() {
                go("jh 1;home");
              })
            };
          });
        },
      });
    });
  };

  var time = 80;
  AutoConfirm('遊俠:' + l[1] + " --- " + l[2], time * 1000, function() {
    goKill(true);
  });
  return;
}

function zmlWay(name) {
  switch (name) {
    case "盈散花":
      return {
        way: "rank go 164;w;w;w;w;w;n;n;n;e;e;n",
        exec: "event_1_5392021 go",
      }
    case "寒碧翠":
      return {
        way: "rank go 164;w;w;w;w;w;n;n;n;e;e;e",
        exec: "event_1_48561012 go",
      }
    case "薄昭如":
      return {
        way: "rank go 164;w;w;w;w;w;n;n;n;e;e;s",
        exec: "event_1_29896809 go",
      }
  }
  return null;
}

function ZMLMon(b, type, subtype, msg) {
  if (hasLeft()) {
    return
  }
  var l = msg.match(/【系統】【醉夢銷魂】：各位大俠請知曉了，我醉夢樓的(.*)仙子此刻心情大好，小舞一曲以饗同好。座位有限，請速速前來。/);
  if (!l) {
    return;
  }
  var lastDay = getStore("zml_day"); // 读取已观舞
  if (lastDay == yjDayStr()) return; // 今天已观舞过，不再观舞

  var found = false;
  for (var i = 0; i < zmlListenNames.length; i++) {
    if (zmlListenNames[i] != l[1]) continue;
    found = true;
  }
  if (!found) return;

  var endTimeout = null;
  var endFunc = function() {
    clearTimeout(endTimeout);
    delDispatchListener("endZmlListener");
    AutoConfirm("回主页？", 10 * 1000, function() {
      go("jh 1;home");
    })
  }

  var execFunc = function() {
    var xianzi = zmlWay(l[1]);
    execNav(xianzi.way, function(code, msg) {
      if (code != 0) {
        endFunc()
        Alert(msg);
        return;
      }

      endTimeout = setTimeout(endFunc, 60 * 1000); // 若60秒内未收到观舞的事件，离开观舞
      // 监听结束
      addDispatchListener("endZmlListener", function(b, type, subtype, msg) {
        if (subtype == "notify_fail") {
          if (msg.indexOf("你今天已經觀舞過了") > -1) {
            setStore("zml_day", yjDayStr()); // 设置为已观舞
          }
          endFunc();
          return;
        }
        if (type == "main_msg" && msg.indexOf("觀舞中") > 0) {
          setStore("zml_day", yjDayStr()); // 设置为已观舞
          clearTimeout(endTimeout);
          endTimeout = setTimeout(endFunc, 60 * 1000);
          return;
        }
      });
      go(xianzi.exec);
    });
    return;
  }

  if (hasLeft()) {
    AutoAlert("醉夢樓-" + l[1], 3 * 1000)
  } else {
    AutoConfirm("醉夢樓-" + l[1], 10 * 1000, function() {
      execFunc();
    });
  }
  return;
}

var zmlListenNames = [];
var zmlAllNames = "盈散花,寒碧翠,薄昭如";

function listenZMLFunc(restore) {
  var btn = getBtn('监听观舞');
  if (btn.innerHTML == "监听观舞") {
    var init = function(names) {
      var arr = names.split(",")
      if (!arr || arr.length == 0) {
        Alert("输入格式有误");
        return;
      };
      zmlListenNames = arr;
      btn.innerText = '停止观舞';
      addSysMsgListener("listenZMLFunc", "醉夢銷魂", ZMLMon);
    };

    var zmlNames = getStore("zml_names");
    if (!zmlNames) {
      zmlNames = zmlAllNames;
    }
    if (restore == 1) {
      init(zmlNames);
      return;
    }

    Input("请输入监听的名称，以英文逗号分割，全部人员如下：<br/>" +
      "盈散花(加攻),寒碧翠(加血),薄昭如(加内)<br/>" +
      "当前：<br/>" +
      zmlNames + "<br/>",
      zmlNames,
      function(input) {
        var val = input.value;
        init(val);
        setStore("zml_names", val);
        setStore("zml_status", 1);
      });
    return;
  }
  btn.innerText = '监听观舞';
  setStore("zml_status", 0);
  delSysMsgListener("listenZMLFunc");
}

var qlzyNpc = {
  "任俠": false,
  "金刀客": false,
  "追命": false,
  "暗刺客": false,
  "無花": false,
  "傳鷹": false,
  "令東來": false,
  "西門吹雪": false,
  "石之軒": false,
  "朱大天王": false,
  "楚昭南": false,
  "阿青": false,
  "楚留香": false,
  "天山童姥": false,
  "乾羅": false,
  "令狐沖": false,
  "喬峰": false,
  "浪翻雲": false,
}
var qlzyDay = yjDayStr();

function dispatchQLZYName(name) {
  return dispatchMsg(name).trim()
}

function resetQLZY() {
  qlzyDay = yjDayStr();
  for (var npc in qlzyNpc) {
    qlzyNpc[npc] = false;
  }
}

function serialQLZY() {
  return JSON.stringify(qlzyNpc)
}

function parseQLZY(str) {
  return JSON.parse(str)
}

function setQLZYDone(name, stats) {
  if (qlzyDay != yjDayStr()) {
    resetQLZY();
  }
  qlzyNpc[name] = stats;
  setStore("qlzy_proc", qlzyDay + "|" + serialQLZY())
  WriteToScreen(name + "已標記為" + (stats ? "已打" : "未打"))
}


function reloadQLZYCfg() {
  var data = getStore("qlzy_proc");
  if (!data) return;
  var arr = data.split("|");
  // not the same day, using the init default.
  if (yjDayStr() != arr[0]) {
    resetQLZY();
    return;
  }
  qlzyNpc = parseQLZY(arr[1]);
}

function setQLZYStats(name, stats) {
  setQLZYDone(name, stats)
  closeSwal();
  showQLZYCfg();
}

function showQLZYCfg() {
  var tips = "";
  for (var npc in qlzyNpc) {
    tips += (npc + ":" + (qlzyNpc[npc] ? "<span style='color:RED'>已打</span>" : "<span>未打</span>"));
    tips += "&nbsp&nbsp<a style='text-decoration:underline;color:blue' onclick=\"setQLZYStats('" + npc + "',true)\">標記</a>"
    tips += "&nbsp&nbsp<a style='text-decoration:underline;color:blue' onclick=\"setQLZYStats('" + npc + "',false)\">取消</a>"
    tips += "<br/>"
  }
  Tips(tips);
}


function QLZYMon(b, type, subtype, msg) {
  // 【潜龙在渊】出品人◆风云打败江洋大盗谢居士，立下大功一件，官民同庆，圣上特赐下暗刺客 VS 暗刺客三对，请各位大侠前往泰山，少林寺，峨眉山捕获，共享大喜。
  // 【潜龙在渊】暗刺客 VS 暗剌客大战已结束。
  // 任侠，刀客，追三，暗剌客，无花，传鹰，令东来，西门吹雪，石之轩，朱大天王，楚昭南，阿青，楚留香，天山童姥，乾罗，令狐冲，乔峰，浪翻云
  var endQLZY = msg.match(/【潛龍在淵】(.*)VS(.*)大戰已結束/)
  if (endQLZY) {
    endQLZY[1] = dispatchQLZYName(endQLZY[1])
    var tips = "狀態：<span style='color:RED'>" + (qlzyNpc[endQLZY[1]] ? "已打" : "未打") + "</span>";
    tips += "&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='setQLZYDone(\"" + endQLZY[1] + "\",true)'>標記此潛龍為已打</a>";
    WriteToScreen(tips)
    return;
  }

  var l = msg.match(/【潛龍在淵】(.*)打敗江洋大盜(.*)，立下大功一件，官民同慶，聖上特賜下(.*)VS(.*)三對，請各位大俠前往(.*)，(.*)，(.*)捕獲，共享大喜/);
  if (!l) return;
  var jh1 = fixJhName(l[5]);
  var jh1Idx = -1;
  travelJhData(function(index, jhIndex, jhName) {
    if (jhName != jh1) return
    jh1Idx = jhIndex
  })
  if (jh1Idx == -1) {
    return;
  }
  l[3] = dispatchQLZYName(l[3]);
  l[4] = dispatchQLZYName(l[4]);
  var tips = "狀態：<span style='color:RED'>" + (qlzyNpc[l[3]] ? "已打" : "未打") + "</span>";
  tips += "&nbsp&nbsp&nbsp&nbsp前往&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='findMenFunc(\"" + jh1Idx + "|" + l[4] + "\")'>" + jh1 + "</a>";

  var jh2 = fixJhName(l[6]);
  var jh2Idx = -1;
  travelJhData(function(index, jhIndex, jhName) {
    if (jhName != jh2) return
    jh2Idx = jhIndex
  })
  if (jh2Idx == -1) {
    return;
  }
  tips += "&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='findMenFunc(\"" + jh2Idx + "|" + l[4] + "\")'>" + jh2 + "</a>";

  var jh3 = fixJhName(l[7]);
  var jh3Idx = -1;
  travelJhData(function(index, jhIndex, jhName) {
    if (jhName != jh3) return
    jh3Idx = jhIndex
  })
  if (jh3Idx == -1) {
    return;
  }
  tips += "&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='findMenFunc(\"" + jh3Idx + "|" + l[4] + "\")'>" + jh3 + "</a>";

  WriteToScreen(tips)
}

function listenQLZYFunc() {
  var btn = getBtn('监听潜龙');
  if (btn.innerHTML == "监听潜龙") {
    btn.innerText = "停止潜龙";
    addNoticeMsgListener("listenQLZYFunc", "潛龍在淵", QLZYMon);
    setStore("qlzy_status", 1);
    return;
  }
  btn.innerText = '监听潜龙';
  setStore("qlzy_status", 0);
  delNoticeMsgListener("listenQLZYFunc");
}

function findJHFZ(jhName, npcName) {
  var jhName = Simplized(jhName);
  var jh = fixJhName(jhName);
  var jhIdx = -1;
  travelJhData(function(tIndex, tJHIndex, tJHName) {
    if (tJHName != jh) return
    jhIdx = tJHIndex;
  })
  if (jhIdx == -1) {
    Alert("未找开地图数据");
    return;
  }
  findMenFunc(jhIdx + "|" + npcName);
}

function JHFZMon(b, type, subtype, msg) {
  // 【系统】【江湖纷争】：释、道流派的风际中剑客伤害同门，欺师灭组，判师而出，却有儒坚持此种另有别情而强行庇护，两派纷争在光明顶-卧房一触即发，江湖同门速速支援！
  // 【系统】【江湖纷争】：道、儒流派的荆无命剑客伤害同门，欺师灭组，判师而出，却有释坚持此种另有别情而强行庇护，两派纷争在碧海山庄-客房一触即发，江湖同门速速支援！
  // 【系统】【江湖纷争】：释流派的顾惜朝剑客伤害同门，欺师灭组，判师而出，却有儒、道坚持此种另有别情而强行庇护，两派纷争在高昌迷宫-山陵一触即发，江湖同门速速支援！
  var jhfz = msg.match(/【江湖紛爭】：(.*)流派的(.*)劍客傷害同門，欺師滅組，判師而出，卻有(.*)堅持此種另有別情而強行庇護，兩派紛爭在(.*)-(.*)一觸即發，江湖同門速速支援！/)
  if (!jhfz) {
    return;
  }

  var tips = b.get("msg") + "&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='findJHFZ(\"" + jhfz[4] + "\",\"" + jhfz[2] + "\")'>点击寻找</a>";
  WriteToScreen(tips)
  return;
}

function listenJHFZFunc() {
  var btn = getBtn('监听纷争');
  if (btn.innerHTML == "监听纷争") {
    btn.innerText = "停止纷争";
    addSysMsgListener("listenJHFZFunc", "江湖紛爭", JHFZMon);
    setStore("jhfz_status", 1);
    return;
  }
  btn.innerText = '监听纷争';
  setStore("jhfz_status", 0);
  delNoticeMsgListener("listenJHFZFunc");
}

var shouqueTimes = 1;

function getShouquePrize() {
  go("event_1_36867949 get") // 拿钱走人
  shouqueTimes--;
  if (shouqueTimes <= 0) {
    delDispatchListener("ShouqueMon");
    Alert("抽奖结束");
    return;
  }
}

var shouqueKind = 0;

function ShouqueMon(b, type, subtype, msg) {
  if (type == "notice" && msg.indexOf("已達到上限") > -1) {
    delDispatchListener("ShouqueMon");
    Alert(msg);
    return;
  }
  if (type == "show_html_page" && b.get("title") == "獸雀游戲") {
    var x = msg;
    var x_1 = x.split(">");
    var cs = x_1[2].split("<")[0];
    var jd = parseInt(x_1[16].split("<")[0].match(/(.*?)\s金錠/)[1]);
    if (x.indexOf("開始抽牌") >= 0) {
      go('event_1_36867949 take'); // 抽奖
      return;
    }
    switch (shouqueKind) {
      case 0:
        if (x.indexOf("乘勝追擊") >= 0) {
          if (jd < 8) {
            go('event_1_36867949 take');
          } else {
            getShouquePrize()
          }
          return;
        }
        break;
      case 1:
        if (x.indexOf("乘勝追擊") >= 0) {
          if (jd >= 30) {
            shouqueTimes = 0;
            getShouquePrize()
          } else {
            go('event_1_36867949 take');
          }
          return;
        }
        break;
    }
    if (x.indexOf("此輪結束") >= 0) {
      if (jd == 0) {
        go('event_1_36867949 pay'); // 重新抽奖
      } else {
        getShouquePrize()
      }
      return;
    }
    return;
  }
}

function doShouqueFunc() {
  var roomName = getRoomName();
  if (roomName != "青龙赌坊" && roomName != "青龍賭坊") {
    Alert("请先到青龙赌坊");
    return;
  }

  Input("请输入需要抽奖的次数，每次需要消耗100元宝(无积分)",
    shouqueTimes,
    function(input) {
      var val = input.value;
      if (!val) {
        Alert("输入有误");
        return;
      }
      shouqueKind = 0;
      shouqueTimes = parseInt(val);
      addDispatchListener("ShouqueMon", ShouqueMon);
      go("event_1_36867949 pay")
    })
}

function doShouque1Func() {
  var roomName = getRoomName();
  if (roomName != "青龙赌坊" && roomName != "青龍賭坊") {
    Alert("请先到青龙赌坊");
    return;
  }

  Input("请输入需要抽奖的次数，每次需要消耗100元宝(无积分)",
    shouqueTimes,
    function(input) {
      var val = input.value;
      if (!val) {
        Alert("输入有误");
        return;
      }
      shouqueKind = 1;
      shouqueTimes = parseInt(val);
      addDispatchListener("ShouqueMon", ShouqueMon);
      go("event_1_36867949 pay")
    })
}

var autoXHAsked = false;

function autoXH(idx, targets) {
  autoXHAsked = false;

  // 没有可自动执行的数据
  if (!targets || targets.length == 0 || idx == targets.length) {
    delDispatchListener("autoXH");
    stopFindNpcTask(); // 终止接收本监听数据
    Alert("已尝试完所有自动路径，但未找到数据。")
    return;
  }

  var target = targets[idx];
  var execWay = target.way;
  if (idx > 0) {
    var lastTarget = targets[idx - 1];
    if (lastTarget.way == target.way) {
      execWay = ".";
    } else {
      var lastWays = lastTarget.way.split(";");
      var curWays = target.way.split(";");
      var minLen = lastWays.length;
      if (minLen > curWays.length) {
        minLen = curWays.length;
      }
      var diffIdx = minLen;
      for (var i = 0; i < minLen; i++) {
        if (lastWays[i] != curWays[i]) {
          diffIdx = i;
          break;
        }
      }

      // 如要回退5步后可寻路，则执行回退操作
      var diffStep = lastWays.length - diffIdx;
      if (diffStep < 6) {
        var valid = true;
        var backWay = "";
        for (var i = lastWays.length - 1; i >= diffIdx; i--) {
          if (!valid) break;
          switch (lastWays[i]) {
            case "ne":
              backWay += "sw;"
              break;
            case "e":
              backWay += "w;"
              break;
            case "se":
              backWay += "nw;"
              break;
            case "s":
              backWay += "n;"
              break;
            case "sw":
              backWay += "ne;"
              break;
            case "w":
              backWay += "e;"
              break;
            case "nw":
              backWay += "se;"
              break;
            case "n":
              backWay += "s;"
              break;
            default:
              // invalid way;
              valid = false;
              break;
          }
        }
        if (valid) {
          execWay = backWay + curWays.slice(diffIdx - curWays.length).join(";");
        }
      }
    }
  }
  var targetNames = target.name.split(")");
  var targetName = targetNames[0];
  if (targetNames.length > 1) {
    targetName = targetNames[1];
  }

  // 检查开通了的江湖章节
  var jhList = getMaxJhList();
  if (jhList) {
    var ways = execWay.split(";")[0];
    if (ways) {
      var jhInfo = ways.split("jh ");
      if (jhInfo.length > 1 && parseInt(jhInfo[1]) > jhList) {
        delDispatchListener("autoXH");
        stopFindNpcTask(); // 终止接收本监听数据
        Alert("地图未开，请手动前往");
        return;
      }
    }
  }

  // 执行对话任务
  execNav(execWay, function(code, msg) {
    if (code != 0) {
      stopFindNpcTask(); // 终止接收本监听数据
      autoXH(idx + 1, targets);
      return;
    }

    autoXHAsked = false;
    askNpcTaskListenerIdx = (++askNpcTaskListenerIdx) % 1000000;
    addDispatchListener(askNpcTaskListenerKey(), function(b, type, subtype, msg) {
      // 解析江湖数据
      if (type == "jh" && subtype == "info") {
        // todo: order by scence
        for (var key of b.keys()) {
          if (key.indexOf("npc") < 0) continue;
          var args = b.get(key).split(",");
          var toName = dispatchChineseMsg(args[1]);
          if (args.length < 2 || targetName != toName) continue;
          autoXHAsked = true;
          go("ask " + args[0], {
            begin: function() {
              setTimeout(function() {
                if (inBattle()) return;

                WriteToScreen(targetName + " : 响应超时");
                // 3秒超时去找下一个
                stopFindNpcTask(); // 终止接收本监听数据
                autoXH(idx + 1, targets);
              }, 3 * 1000);
            },
          });
          return;
        }

        // 未找到人, 继续下一个
        stopFindNpcTask(); // 终止接收本监听数据
        autoXH(idx + 1, targets);
        return;
      }

      // 监听到战斗，等待战斗结束
      if (!autoXHAsked) return;

      // 解析战斗结束数据, 战斗结束后，继续自动对话
      if (type == "vs") {
        if (subtype == "combat_result") {
          stopFindNpcTask(); // 终止接收本监听数据
          if (autoXHOn) go("jh 1;w;event_1_40923067;");
          return;
        }
        return;
      }
    }); // end addDispatchListener

    go("golook_room"); // 再发送一个江湖事件
  }); // end execNavDone
}

// 悬红榜
function XHMon(b, type, subtype, msg) {
  if (subtype == "notify_fail" && (msg.indexOf("系統更新中") > -1)) {
    go("event_1_40923067");
    return
  }

  if (!(type == "main_msg" || type == "notice")) return;

  // 【江湖悬红榜】下一个江洋大盗的线索请找到位于『水烟阁』的『实是一位不简单的人物』打听。(你还有 17分00秒/17分钟 去完成)
  if (msg.indexOf("懸紅榜") < 0) return;

  if (autoXHOn && (msg.indexOf("你的任務超時") > -1 || msg.indexOf("領取") > -1)) {
    go("event_1_40923067");
    return;
  }

  var arr = msg.split("』的『");
  if (arr.length < 2) return;
  var jh = Simplized(fixJhName(arr[0].substring(arr[0].indexOf("『") + 1)));
  var xhjh = jh;

  var xhDesc = dispatchChineseMsg(arr[1].substring(0, arr[1].indexOf("』")));
  var targets = [];
  travelJhData(function(i, index, name) {
    var jhKey = name;
    travelNpcData(i, function(jh, loc, name, way, desc) {
	  var name = Traditionalized(name);
	  var way = Traditionalized(way);
	  var desc = Traditionalized(desc);
      if (dispatchChineseMsg(desc).indexOf(xhDesc) < 0 || dispatchChineseMsg(jh).indexOf(xhjh) < 0) return false;
	  WriteToScreen(desc);
	  switch (name) {
		case '范棋痴':
		  name = '李縱橫'
		  break
		case '蘇先生':
		  name = '莫辯聰'
		  break
		case '馮巧匠':
		  name = '賽魯班';
		  break
		case '薛神醫':
		  name = '閻王敵'
		  break
		case '康琴癲':
		  name = '劉鏗鏘'
		  break
		case '茍書癡':
		  name = '張通鑑'
		  break
		case '李唱戲':
		  name = '李傀儡'
		  break
		case '天山姥姥':
		  name = '童冰煙'
		  break
		case '風老前輩':
		  name = '獨孤傳人'
		  break
	  }
	  console.log('懸紅目標: ', name);
      switch (jh) {
        case "晚月庄":
        case "晚月莊":
          switch (name) {
            case "小贩":
            case "小販":
            case "酒肉和尚":
              jh = "晚月庄";
              break
          }
          break;
      }

      // 找到了描述数据
      targets.push({
        index: index,
        jh: jh,
        loc: loc,
        name: name,
        way: way,
        desc: desc,
      });
      // continue
      return false
    })

    // 继续遍历
    return false
  })
  if (targets.length == 0) {
    WriteToScreen("<span style='color:red'>未找到悬红描述数据，可参考以下链接</span>");
    mapNavigatorFunc(jh)
    return;
  }
  
  WriteToScreen("<span style='color:yellow'>找到悬红描述数据，点击链接前往</span>");
  var target = targets[i];
  var autoTargets = [];
  for (var i = 0; i < targets.length; i++) {
    target = targets[i];
    var way = target.way;
    if (way && way.length > 0) {
      if (way.charAt(0) != "." && target.jh == jh) {
        autoTargets.push(targets[i]);
      }
      var end = "&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='copy(\"" + way + "\")'>路径详情</a>";
      if (way.charAt(0) == "." || way.length == 0) {
        end += "&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='findTaskFunc(\"" + target.index + "|" + target.name + "\")'>无路径或隐藏图(迷题导航)</a>";
      }
      WriteToScreen("<a style='text-decoration:underline;color:yellow' onclick='execNav(" +
        "\"" + way + "\"" +
        ")'>" +
        target.jh + "-" + target.loc + "-" + target.name +
        "</a>" +
        end);
    } else {
      WriteToScreen("<span style='color:yellow' >" +
        target.jh + "-" + target.loc + "-" + target.name +
        ":无导航路径，请手动前往" +
        "</span>");
    }
  }

  // 执行自动前往
  if (autoXHOn == 1) autoXH(0, autoTargets);
}

var autoXHOn = 0;

function autoXHFunc(restore) {
  var xhBtn = getBtn('自动悬红');
  if (xhBtn.innerHTML == "自动悬红") {
    autoXHOn = 1;
    xhBtn.innerText = '停止悬红';
  } else {
    xhBtn.innerText = '自动悬红';
    autoXHOn = 0;
  }
  setStore("auto_xh_status", autoXHOn)
}

function manuXHFunc() {
  go("jh;jh 1;w;event_1_40923067");
}

function QinglongMon(b, type, subtype, msg) {
  var l = msg.match(/【系統】青龍會組織：(.*)正在(.*)施展力量，本會願出(.*)的戰利品獎勵給本場戰鬥的最終獲勝者。/);
  if (!l) {
    l = msg.match(/【系統】跨服：(.*)逃到了(.*)之中，青龍會組織懸賞(.*)懲治惡人，眾位英雄快來誅殺。/);
  }
  if (!l) {
    return;
  }
  if (msg.indexOf("這是跨服第") > -1) return; // 人已在跨服中

  // 过滤跨服的非本服青龙
  // 跨服，且是本大区、新服用户且新区青龙、老服用户且老服青龙, 如果不是，不给提示
  var isKuafuMsg = msg.indexOf('跨服') > -1;
  if (isKuafuMsg) {
    // 过滤非本区的青龙
    var isKuafuHome = l[2].indexOf("武林廣場") > -1;
    var isNewAreaQL = l[1].indexOf('新區') > -1; // 注意，对老区来说是会含有大区信息的
    if (isKuafuHome) {
      // 广场青龙，但不是新(老)区的，跳过
      if ((isNewAreaQL && !isNewAreaUser) || (!isNewAreaQL && isNewAreaUser)) return;
    } else {
      // 大区青龙，但不是本服的，跳过
      if (l[1].indexOf(userAreaName) < 0) return;
    }
    // 跨服条件通过
  }

  Log("FOUND QINLONG:", l, msg, qlKeysArr);

  var matchKey = undefined;
  var len = qlKeysArr.length;
  // 若未设定过滤，监听所有
  if (len == 0) {
    matchKey = {
      name: l[3],
      star: false,
    };
  } else if (len == 1 && qlKeysArr[0] == '*') {
    matchKey = {
      name: l[3],
      star: true,
    };
  }
  // 监听指定的关键字
  for (var i = len - 1; i > -1; i--) {
    if (l[3].indexOf(qlKeysArr[i].name) > -1) {
      matchKey = {
        name: l[3],
        star: qlKeysArr[i].star
      };
      break;
    }
  }
  if (!matchKey) return;

  Log("MATCH QINGLONG:", msg, matchKey);
  if (isKuafuMsg || !matchKey.star || hasLeft()) {
    AutoAlert('青龍:' + l[1] + " --- " + l[3] + "  " + l[2], 30 * 1000);
    return;
  }

  // 检查是否是在主页，若不是，不执行
  var goKill = function(inHome) {
    if (!inHome) {
      AutoConfirm('青龍:' + l[1] + " --- " + l[3] + "  " + l[2], 10 * 1000, function() {
        goKill(true);
      });
      return;
    }

    // 进行自动击杀
    goPlace(l[2], go_ql(l[2]).way, function() {
      Log("Arrived at target");
      // 已到达目的地，开始执行杀操作
      autoFight({
        targetName: l[1],
        menKind: 1,
        menToFight: qlKeysMenTo,
        newOne: true,
        doneFn: function(code, msg) {
          AutoConfirm(msg + ":" + code + "," + l[3] + ",回主页?", 30 * 1000, function() {
            go("jh 1;home");
          });
        },
      });
    });
  };
  checkHome(goKill);
  return;
}

var ql_w = {
  '書房': 1,
  '书房': 2,
  '打鐵鋪子': 3,
  '打铁铺子': 4,
  '桑鄰藥鋪': 5,
  '桑邻药铺': 6,
  '南市': 7,
  '繡樓': 8,
  '绣楼': 9,
  '北大街': 10,
  '錢莊': 11,
  '钱庄': 12,
  '雜貨鋪': 13,
  '杂货铺': 14,
  '祠堂大門': 15,
  '祠堂大门': 16,
  '廳堂': 17,
  '厅堂': 18
};
var ql_x = [{
  name: "書房",//1
  way: "jh 1;e;n;e;e;e;e;n"
}, {
  name: "书房",//2
  way: "jh 1;e;n;e;e;e;e;n"
}, {
  name: "打鐵鋪子",//3
  way: "jh 1;e;n;n;w"
}, {
  name: "打铁铺子",//4
  way: "jh 1;e;n;n;w"
}, {
  name: "桑鄰藥鋪",//5
  way: "jh 1;e;n;n;n;w"
}, {
  name: "桑邻药铺",//6
  way: "jh 1;e;n;n;n;w"
}, {
  name: "南市",//7
  way: "jh 2;n;n;e"
}, {
  name: "繡樓",//8
  way: "jh 2;n;n;n;n;w;s;w"
}, {
  name: "绣楼",//9
  way: "jh 2;n;n;n;n;w;s;w"
}, {
  name: "北大街",//10
  way: "jh 2;n;n;n;n;n;n;n"
}, {
  name: "錢莊",//11
  way: "jh 2;n;n;n;n;n;n;;n;e"
}, {
  name: "钱庄",//12
  way: "jh 2;n;n;n;n;n;n;;n;e"
}, {
  name: "雜貨鋪",//13
  way: "jh 3;s;s;e"
}, {
  name: "杂货铺",//14
  way: "jh 3;s;s;e"
}, {
  name: "祠堂大門",//15
  way: "jh 3;s;s;w"
}, {
  name: "祠堂大门",//16
  way: "jh 3;s;s;w"
}, {
  name: "廳堂",//17
  way: "jh 3;s;s;w;n"
}, {
  name: "厅堂",//18
  way: "jh 3;s;s;w;n"
}];

var go_ql = function(w) {
  return zx(ql_w[w]);
}

function zx(x) {
  return ql_x[parseInt(x) - 1];
}

var xl_w = {
  '山路': 1,
  '立雪亭': 2,
  '碧水寒潭': 3,
  '石亭': 4,
  '翠竹屋': 5,
  '飛雪堂': 6,
  '飞雪堂': 7,
  '雪原溫泉': 8,
  '雪原温泉': 9,
  '冰湖': 10,
  '雪山峰頂': 11,
  '雪山峰顶': 12,
  '斷崖': 13,
  '断崖': 14,
  '黑岩溪': 15,
  '朝暮閣': 16,
  '朝暮阁': 17,
  '冰川天柱': 18,
  '金頂': 19,
  '金顶': 20,
  '尋夢樓': 21,
  '寻梦楼': 22,
}
var xl_x = [{
  name: "山路",//1
  way: "jh 1;e;e;s;ne;ne"
}, {
  name: "立雪亭",//2
  way: "jh 13;n;n;n;n;n;n;n;n;n;n"
}, {
  name: "碧水寒潭",//3
  way: "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e;se;se;e"
}, {
  name: "石亭",//4
  way: "jh 24;n;n;n;n;n;n;n;n;w;n;n"
}, {
  name: "翠竹屋",//5
  way: "jh 31;n;n;n;w;w;w;w;n;n;n"
}, {
  name: "飛雪堂",//6
  way: "jh 5;n;n;n;n;n;e;n;e;n;w;n;n"
}, {
  name: "飞雪堂",//7
  way: "jh 5;n;n;n;n;n;e;n;e;n;w;n;n"
}, {
  name: "雪原溫泉",//8
  way: "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w"
}, {
  name: "雪原温泉",//9
  way: "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w"
}, {
  name: "冰湖",//10
  way: "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;e"
}, {
  name: "雪山峰頂",//11
  way: "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;ne;n"
}, {
  name: "雪山峰顶",//12
  way: "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;ne;n"
}, {
  name: "斷崖",//13
  way: "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne"
}, {
  name: "断崖",//14
  way: "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne"
}, {
  name: "黑岩溪",//15
  way: "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;sw"
}, {
  name: "朝暮閣",//16
  way: "jh 43;w;n;n;n;ne;nw;nw;ne"
}, {
  name: "朝暮阁",//17
  way: "jh 43;w;n;n;n;ne;nw;nw;ne"
}, {
  name: "冰川天柱",//18
  way: "jh 28;n;w;w;w;w;w;w;nw;ne;nw;ne;nw;ne;nw;ne;nw;ne;nw;ne;e"
}, {
  name: "金頂",//19
  way: "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill?看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;nw;nw;n;n"
}, {
  name: "金顶",//20
  way: "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill?看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;nw;nw;n;n"
}, {
  name: "尋夢樓",//21
  way: "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell;n;n;n;n;w;w"
}, {
  name: "寻梦楼",//22
  way: "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell;n;n;n;n;w;w"
}]

// 雪乱江湖
function go_xl(w) {
  return xl(xl_w[w]);
}

function xl(x) {
  return xl_x[parseInt(x) - 1];
}

var xljhTimer = parseInt(getStore("xljh_timer"));
xljhTimer = xljhTimer ? xljhTimer : 29 * 60; // 设定默认值

function setXLJHTimer() {
  Input("设定监听到雪乱后自动叫杀的时间, 默认为29分钟计时+15秒提示", xljhTimer, function(input) {
    var val = parseInt(input.value);
    if (!val) {
      Alert("输入格式有误")
      return
    }
    xljhTimer = val;
    setStore("xljh_timer", val)
  })
}
// {
//  kill:false,
//  name:"白自在",
// }
var xljhNpc = [];

function autoFindXLJH(npc, kill) {
  findJhMen(0, xl_x, [npc], function(code, msg, args) {
    if (code != 0) {
      Alert(msg);
      return;
    }
    if (kill) {
      killUserTargetFunc(npc)
    } else {
      Alert(msg);
    }
  })
}

var xljhTimeout = undefined;

function timerFindXLJH(npc, timeout) {
  clearTimeout(xljhTimeout);
  xljhTimeout = setTimeout(function() {
    Log("xljhTimeout called")
    if (hasLeft()) {
      Alert("雪乱湖江湖即将结束秒");
      return
    }
    AutoConfirm("将前往击杀雪乱江湖：" + npc, 15 * 1000, function() {
      autoFindXLJH(npc, true);
    })
  }, timeout * 1000)
}

function timerTipXLJH(npc, tiptime) {
  Input("请输入基于提示时间后多少秒前往(默认含有15秒确认计时, 单位为秒)", 5, function(input) {
    var val = parseInt(input.value);
    if (!val) {
      Alert("输入格式有误")
      return;
    }
    var now = new Date();
    var interval = ((val * 1000) - (now.getTime() - tiptime)) / 1000;
    if (interval < 0) {
      interval = 0
    }
    timerFindXLJH(npc, interval)
  })
}

var xljhEnd = getStore("xljh_end");

function listenXLJHMon(b, type, subtype, msg) {
  if (inKuafu()) return;

  // 检测到离开，结束自动杀
  var end = msg.match(/【系统】雪乱江湖：雪山派弟子(.*)：大爷抢够了，这就回山去，下次再来！/)
  if (end) {
    Log(msg)
    stopKillUserTarget();
    return;
  }

  // 检测结算次数
  // 这是你今天完成的第1/3个雪山派活动任务
  var endTimes = msg.match(/这是你今天完成的第(.*)\/(.*)个雪山派活动任务/);
  if (endTimes) {
    if (endTimes[1] == endTimes[2]) {
      xljhEnd = yjDayStr();
      setStore("xljh_end", xljhEnd);
    }
    stopKillUserTarget();
    go("jh 1;home");
    return;
  }

  var l = msg.match(/【系统】雪乱江湖：雪山派弟子(.*)哈哈大笑：大爷来了，把值钱的都交出来!/);
  if (!l) return;

  var foundNpc = undefined;
  for (var idx in xljhNpc) {
    if (xljhNpc[idx].name != l[1]) continue;
    foundNpc = xljhNpc[idx];
    break;
  }
  if (!foundNpc) return;
  var now = new Date();
  WriteToScreen(
    "<span style='color:red'>雪乱江湖</span>(" +
    FormatDate(now, "hh:mm:ss") +
    "):&nbsp&nbsp" +
    foundNpc.name +
    "&nbsp&nbsp&nbsp&nbsp<a style='text-decoration:underline;color:yellow' onclick='autoFindXLJH(\"" + foundNpc.name + "\",false)'>前往查找</a>" +
    "&nbsp&nbsp&nbsp&nbsp" +
    (foundNpc.kill ? "已开启叫杀" : "<a style='text-decoration:underline;color:yellow' onclick='timerTipXLJH(\"" + foundNpc.name + "\"," + now.getTime() + ")'>定时击杀</a>"));

  if (yjDayStr() == xljhEnd) {
    WriteToScreen("你今天已完成雪乱江湖")
    return; // 当天已打完
  }
  if (foundNpc.kill) {
    timerFindXLJH(foundNpc.name, xljhTimer)
  }
}

function listenXLJHFunc(restore) {
  var btn = getBtn("监听雪乱");
  if (btn.innerHTML == "监听雪乱") {
    var npc = getStore("xljh_npc");
    if (!npc) {
      npc = "花萬紫,白自在,白萬劍,白衣神君";
    }
    var init = function(npc) {
      btn.innerText = "停止雪乱";
      npcs = npc.split(",");
      xljhNpc = [];
      for (var i = 0; i < npcs.length; i++) {
        if (npcs[i].charAt(0) == "*") {
          xljhNpc.push({
            kill: true,
            name: npcs[i].substring(1),
          })
        } else {
          xljhNpc.push({
            kill: false,
            name: npcs[i],
          })
        }
      }

      addDispatchListener("listenXLJHFunc", listenXLJHMon)
    }
    if (restore == "1") {
      init(npc);
      return;
    }
    Input("请输入要监听的名称，以英文逗号分割。<br/>" +
      "仅提示，例如：花萬紫,白自在,白萬剑,白衣神君<br/>" +
      "循环杀，例如：*花萬紫,*白自在,*白萬剑,*白衣神君<br/>",
      npc,
      function(input) {
        var val = input.value;
        if (val == undefined) {
          return;
        }
        setStore("xljh_npc", val);
        setStore("xljh_status", "1");
        init(val);
      })
  } else {
    btn.innerText = '监听雪乱';
    delDispatchListener("listenXLJHFunc")
    setStore("xljh_status", "0");
  }
}


//一键恢复------------------------
var curing = 0;

function yijianhuifuFunc() {
  Log("yijianhuifuFunc called");
  if (curing) return;
  curing = 1;

  var yijianhuifuBtn = getMenu("药治疗");
  yijianhuifuBtn.innerHTML = '治疗中';
  healFunc(function() {
    yijianhuifuBtn.innerHTML = '药治疗';
    curing = 0;
  });
}

function healForce(force, max_force, doneFn) {
  // 计算万年所需的数量
  var qTimes = Math.floor((max_force - force) / 5000);
  if (max_force < 5000) qTimes = 1;

  var wTimes = Math.floor(qTimes / 6);
  if (qTimes == 0 && wTimes == 0) {
    if (doneFn) doneFn();
    return;
  }
  qTimes -= (wTimes * 6);
  if (qTimes > 4) {
    qTimes -= 5;
    wTimes += 1;
  }

  var doneTimes = 0;
  if (qTimes > 0) doneTimes++;
  if (wTimes > 0) doneTimes++;
  var done = function() {
    doneTimes--;
    if (doneTimes <= 0 && doneFn) doneFn();
  }

  WriteToScreen(
    "<span style='color:yellow'>使用" +
    qTimes + "棵千年+" +
    wTimes + "棵万年灵芝补" +
    (max_force - force) + "内力</span")
  if (qTimes > 0) {
    var qContent = "";
    for (var i = qTimes; i > 0; i--) {
      qContent += "items use snow_qiannianlingzhi;";
    }
    go(qContent, done);
  }

  if (wTimes > 0) {
    var wContent = "";
    for (var i = wTimes; i > 0; i--) {
      wContent += "items use snow_wannianlingzhi;";
    }
    go(wContent, done);
  }
}

function endCure(done) {
  delDispatchListener("goCure");
  if (done) done();
}


var healTimes = 0;

function healFunc(doneFn) {
  healTimes = 0;
  addDispatchListener("goCure", function(b, type, subtype, msg) {
    if (inBattleFight) {
      Log("goCure end with battle");
      endCure(doneFn);
      return;
    };

    var userInfo = g_obj_map.get("msg_attrs")
    var keeCurPer = 0;
    keeCur = parseInt(userInfo.get("kee")); // vs1_kee1
    keeMax = parseInt(userInfo.get("max_kee")); // vs1_max_kee1

    // 处理失败的结果
    // 血满或者治疗超过20次直接停止
    if (keeCur >= keeMax || msg.indexOf("你現在氣力充沛") > -1 || healTimes > 20) {
      healTimes++;
      Log("goCure end with fullpower");
      endCure(doneFn);
      useMedicineFunc();
      return;
    } else if (msg.indexOf("你的內力不夠") > -1) {
      useMedicineFunc();
	  go("recovery");
	  return;
    } else if (msg.indexOf("你深深吸了幾口氣") > -1) {
      // 解析气血变更事件，并给与回血
      // 回血
      healTimes++;
      go('recovery');
      return;
    }
    if (type == "notice" && subtype == "notify_fail") {
      Log("End width other", msg);
      // 其他失败时结束治疗并尝试回一次内
      endCure(doneFn);
      return;
    }
    return;
  });
  // 先补一次血以便触发服务器的气血回调
  go("recovery");
}


// 吃药----------------------------------------------------
function useMedicineFunc(doneFn) {
  var userInfo = g_obj_map.get("msg_attrs");
  var force = parseInt(userInfo.get("force"));
  var max_force = parseInt(userInfo.get("max_force"));
  if (force < max_force) {
    healForce(force, max_force, doneFn);
    return;
  }

  if (doneFn) doneFn();
  return;
}

//==========================================================帮派副本=====================================
var shenshouIdx = 0;

function killBangYi(next) {
  if (!next) {
    setTimeout(function() {
      killBangYi(true);
    }, 250)
    return
  }
  shenshouIdx = (shenshouIdx % 13) + 1;
  switch (shenshouIdx) {
    case 1:
      return go("s");
    case 2:
      return go("w"); // 一进
    case 3:
      return go("w");
    case 4:
      return go("w");
    case 5:
      return go("e")
    case 6:
      return go("e");
    case 7:
      return go("e");
    case 8:
      return go("e");
    case 9:
      return go("e");
    case 10:
      return go("e");
    case 11:
      return go("w");
    case 12:
      return go("w");
    case 13:
      return go("w"); // 回到原位
  }
}

function shenshouMon(b, type, subtype, msg) {
  if (type == "vs" && subtype == "combat_result") {
    var room = g_obj_map.get("msg_room");
    if (!room) return;
    var roomName = room.get("short");
    if (roomName.indexOf("應龍山") < 0 && roomName.indexOf("幽熒殿") < 0 && roomName.indexOf("螣蛇潭") < 0 && roomName.indexOf("饕餮谷") < 0) {
      delDispatchListener("killshenshouTargetFunc");
      return;
    }
    killBangYi(); // 战斗结束后打下一个
    return;
  }

  // 获取江湖的数据
  if (type != "jh" || subtype != "info") return;
  // 检测是否是最后一个位置
  if (!b.get("east") && !b.get("west") && !b.get("south")) {
    // 没有东边的方向，已是最后一个位置。
    delDispatchListener("killshenshouTargetFunc");
    return;
  }
  if (b.get("npc1")) return; // 有怪

  killBangYi(); // 没有怪，打下一个
}

function killshenshouTargetFunc() {
  var killshenshouTargetBtn = getBtn('帮派副本');
  if (killshenshouTargetBtn.innerHTML == '帮派副本') {
	killshenshouTargetBtn.innerHTML = '停止副本';

	var names = "鎮殿神獸#守殿神獸#幽荧幼崽#幽荧獸魂#幽熒分身#幽熒戰神#鎮潭神獸#守潭神獸#螣蛇幼崽#螣蛇獸魂#螣蛇分身#螣蛇戰神#鎮山神獸#守山神獸#應龍幼崽#應龍獸魂#應龍分身#應龍戰神#鎮谷神獸#守谷神獸#饕餮幼崽#饕餮獸魂#饕餮王#饕餮戰神#鐵狼軍#銀狼軍#金狼軍#金狼將#十夫長#百夫長#濯纓劍士#對影劍士#月幽劍士#夏花劍士#採菊隱士#歡喜羅漢#紫神將#魔郡主#快活居士#血斧客#龍山徒#縱橫聖使#千夜暗影#天梵僧#貳壹刀客";

	// 帮一检测
	var room = g_obj_map.get("msg_room");
    if (room) {
      var roomName = room.get("short");
      switch (roomName) {
        case "幽熒殿":
        case "螣蛇潭":
        case "應龍山":
        case "饕餮谷":
          addDispatchListener("killshenshouTargetFunc", shenshouMon);
          shenshouIdx = 0;
          killBangYi();
          break
        default:
          if (roomName.indexOf("應龍山") < 0 && roomName.indexOf("幽熒殿") < 0 && roomName.indexOf("螣蛇潭") < 0 && roomName.indexOf("饕餮谷") < 0) {
            break
          }
          Confirm("检测到帮画一，可回到副本入口处自动寻路。继续叫杀？", function() {
            killUserTargetFunc(names);
          }, function() {
            killshenshouTargetBtn.innerHTML = '帮派副本';
            delDispatchListener("killshenshouTargetFunc");
            stopKillUserTarget();
          });
          return
      }
    }
    killUserTargetFunc(names);
    return;
  }

  killshenshouTargetBtn.innerHTML = '帮派副本';
  delDispatchListener("killshenshouTargetFunc");
  stopKillUserTarget();
}

// 杀十二宫
function killZodiac(idx) {
  switch (idx) {
    case 0:
      goPlace("麒麟宮", "nw;nw", function() {
        autoFight({
          targetName: "天海·麒麟月",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "se;se", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 1:
      goPlace("蒼鷹宮", "ne;se", function() {
        autoFight({
          targetName: "鯤鵬·展蒼鷹",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "nw;sw", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 2:
      goPlace("白虎宮", "nw;e", function() {
        autoFight({
          targetName: "血瞳·獄虎令",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "w;se", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 3:
      goPlace("金獅宮", "nw;ne", function() {
        autoFight({
          targetName: "罪罰·鐵狂徒",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "sw;se", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 4:
      goPlace("鳳凰宮", "nw;w", function() {
        autoFight({
          targetName: "金曦·焚宇鳳",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "e;se", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 5:
      goPlace("銀豹宮", "ne;n", function() {
        autoFight({
          targetName: "銀豹·末日狂",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "s;sw", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 6:
      goPlace("雲獸宮", "ne;ne", function() {
        autoFight({
          targetName: "守序·雲行獸",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "sw;sw", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 7:
      goPlace("赤龍宮", "ne;e", function() {
        autoFight({
          targetName: "嘯日·赤猋影",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "w;sw", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 8:
      goPlace("玄武宮", "ne;nw", function() {
        autoFight({
          targetName: "蝶魂·玄魄武",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "se;sw", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 9:
      goPlace("朱雀宮", "nw;n", function() {
        autoFight({
          targetName: "火狂·熾巽翼",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "s;se", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 10:
      goPlace("荒狼宫", "nw;sw", function() {
        autoFight({
          targetName: "點星·劍魔狼",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "ne;se", function() {
              // 继续下一个
              killZodiac(idx + 1);
            })
          },
        });
      })
      return;
    case 11:
      goPlace("神猿宮", "ne;w", function() {
        autoFight({
          targetName: "刀行·玉琺猿",
          menKind: 0,
          menToFight: 0,
          anyOne: true,
          tryTimes: 2,
          doneFn: function(code, msg) {
            // 回到正厅事继续
            goPlace("正廳", "e;sw", function() {
              // 继续下一个
              Alert("已完成十二宫。");
            })
          },
        });
      })
      return;
  }
}

function killZodiacFunc() {
  var killZodiacBtn = getBtn('杀十二宫');
  var room = $('.cmd_click_room')[0]
  if (!room || room.innerText != "正廳") {
    Alert("请到正厅并清理两翼怪后再点击");
    return;
  }
  Input("请输入当前十二宫进度，若还没打过，为0。", "0", function(input) {
    var val = parseInt(input.value);
    if (val < 0 || val > 11) {
      Alert("进度有误，请输0~11");
      return;
    }
    killZodiac(val);
  })
}

// 杀云远寺
function stopYYTemple() {
  delSysMsgListener("yytemple_listen");
  stopAutoFight(); // 清除上次
  var killYYTempleBtn = getBtn("杀云远寺");
  killYYTempleBtn.innerText = "杀云远寺";
  setStore("yytemple_status", 0);
}

function getYYTempleLoc() {
  var room = g_obj_map.get("msg_room");
  if (!room) return null;
  var roomName = room.get("short");

  var way = "";
  switch (roomName) {
    case "百毒池":
      return way += "e;"
    case "萬蠱堂":
      return way += "s;";
    case "千蛇窟":
      return way += "n;";
    case "十惡殿":
      return way += "w;";
    case "地室":
      return "";
  }
  return null;
}

var yytempleCommit = "0"; // 0 手工提交; 1，开图时自动提交; 2, 打完一次提交一次(含1)
function setYYTempleCommitFunc(state) {
  var init = function(s) {
    yytempleCommit = s;
  }

  if (state) {
    init(state);
    return;
  }
  state = getStore("yytemple_commit");
  if (!state) {
    state = "0";
  }
  Input("请输入拼图类别，0手动拼图，1开图自动提交；2打完自动提交(含开图自动)", state, function(input) {
    var val = input.value;
    switch (val) {
      case "0":
      case "1":
      case "2":
        break;
      default:
        Alert("输入的类型有误");
        return;
    }
    setStore("yytemple_commit", val);
    init(val);
  })
  return;
}

var yytempleProcess = 0;
var yytempleProcessDay = '';

function getYYTempleProcess() {
  if (yytempleProcessDay != yjDayStr()) {
    yytempleProcess = 0;
  }
  return yytempleProcess
}

var yytempleMenKind = 1;

function killYYTemple(pName, tName, msg) {
  // 检查是否有挂机锁定
  if (hasLeft()) {
    AutoAlert(dispatchChineseMsg(msg), 10 * 1000);
    return;
  };

  // 检查是否在挂机位置,并回到地室
  var way = getYYTempleLoc();
  if (way == null) {
    msg = dispatchChineseMsg(msg);
    AutoConfirm(msg, 10 * 1000, function() {
      goPlace("地室", 'jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;e;event_1_2215721', function(code, msg) {
        if (code == 0) {
          killYYTemple(pName, tName, msg);
        } else {
          Alert(msg, function() {
            go("home");
          });
        }
      });
    });

    return;
  }

  // 从地室去
  switch (pName) {
    case "百毒池":
      way += "w;"
      break;
    case "萬蠱堂":
      way += "n;";
      break;
    case "千蛇窟":
      way += "s;";
      break;
    case "十惡殿":
      way += "e;";
      break;
  }

  goPlace(pName, way, function() {
    autoFight({
      targetName: tName,
      menKind: 0,
      menToFight: yytempleMenKind,
      newOne: false,
      anyOne: true,
      doneFn: function(code, msg) {
        // Alert(msg + ":" + code + "," + pName);
      },
    }); // end autoFight
  }); // end goPlace
}

function monYYTemple(b, type, subtype, msg) {
  if (type == "main_msg" && msg) {
    var keys = msg.match(/這是你今天完成的第(.*)\/4場寶藏秘圖之戰/);
    if (keys) {
      if (yytempleCommit == "2") {
        go("clan bzmt puzz");
      }
      yytempleProcess = parseInt(keys[1]);
      yytempleProcessDay = yjDayStr();
      setStore("yytemple_process", yytempleProcessDay + "|" + yytempleProcess);
      if (yytempleProcess == 4) {
        delDispatchListener("monYYTemple")
        AutoConfirm("回主页？", 10 * 1000, function() {
          go("jh 1;home");
        });
      }
      return;
    }
  }

  if (type == "notice" && subtype == "notify_fail" && msg.indexOf("你今天完成的寶藏秘圖任務數量已經超量") > -1) {
    delDispatchListener("monYYTemple")
    stopAutoFight();
    yytempleProcess = 4;
    yytempleProcessDay = yjDayStr();
    setStore("yytemple_process", yytempleProcessDay + "|" + yytempleProcess);
    AutoConfirm("回主页？", 10 * 1000, function() {
      go("jh 1;home");
    })
    return;
  }
}

function monSysYYTemple(b, type, subtype, msg) {
  // 已做满
  if (getYYTempleProcess() > 3) {
    delDispatchListener("monYYTemple")
    return;
  }

  var keys = msg.match(/【系統】(.*)對著(.*)叫道：(.*)，今天你可是在我的地盤，看來你是在劫難逃！/);
  if (!keys) return;
  var pName = "";
  var tName = keys[1];
  switch (tName) {
    case "百毒旗主":
      pName = "百毒池";
      break;
    case "巫蠱王":
      pName = "萬蠱堂";
      break;
    case "夜千麟":
      pName = "千蛇窟";
      break;
    case "十方惡神":
      pName = "十惡殿";
      break;
  }
  addDispatchListener("monYYTemple", monYYTemple);
  killYYTemple(pName, tName, msg);
}

function goYYTempleFunc() {
  go('jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;e;event_1_2215721');
}

function killYYTempleFunc(restore) {
  var killYYTempleBtn = getBtn("杀云远寺");
  if (killYYTempleBtn.innerHTML == "杀云远寺") {
    var init = function() {
      killYYTempleBtn.innerText = "停云远寺";
      addSysMsgListener("yytemple_listen", "今天你可是在我的地盤", monSysYYTemple);
      addDispatchListener("monYYTemple", monYYTemple);
    };
    if (restore == 1) {
      init();
      return;
    }

    Input("请输入要杀的怪，0防守方(坏人), 1攻击方(好人)，默认是1。", yytempleMenKind, function(input) {
      var val = input.value;
      yytempleMenKind = parseInt(val);
      if (yytempleMenKind != 1) {
        yytempleMenKind = 0;
      }
      setStore("yytemple_status", 1);
      setStore("yytemple_menkind", yytempleMenKind);
      init();
    })
    return;
  } else {
    stopYYTemple();
    return;
  }
}
// 杀云远寺结束

function killGongzhuFunc() {
  var btn = getBtn("杀公主");
  if (btn.innerHTML == "杀公主") {
    btn.innerHTML = "停公主";
    autoFight({
      targetName: "無『雙』公主", // 中文名称,
      fightKind: "kill", // 不填写或默认值时为kill, 填写fight时为比试
      menKind: 0, // 要找的人是守方(0好人)还是攻方(1坏人)
      menToFight: 0, // 要杀的人，0守方，1攻方
      anyOne: true, // 是否过滤白名npc, (false过虑，true击杀任何人)
      newOne: false, // 在场景中顺序找还是逆序找人。true为逆序
      tryTimes: 3, // 尝试找人找几次
      doneFn: function(code, msg) { // 战斗结束后回调，0进入战斗后退出，小于0未进入战斗时结束
        btn.innerHTML = "杀公主";
        stopAutoFight();
        Alert(msg + ":" + code)
      },
    });
  } else {
    btn.innerHTML = "杀公主";
    stopAutoFight();
  }
}

function killBuerFunc() {
  var btn = getBtn("杀不二");
  if (btn.innerHTML == "杀不二") {
    btn.innerHTML = "停不二";
    autoFight({
      targetName: "不『二』劍客", // 中文名称,
      fightKind: "kill", // 不填写或默认值时为kill, 填写fight时为比试
      menKind: 1, // 要找的人是守方(0好人)还是攻方(1坏人)
      menToFight: 1, // 要杀的人，0守方，1攻方
      anyOne: true, // 是否过滤白名npc, (false过虑，true击杀任何人)
      newOne: false, // 在场景中顺序找还是逆序找人。true为逆序
      tryTimes: 3, // 尝试找人找几次
      doneFn: function(code, msg) { // 战斗结束后回调，0进入战斗后退出，小于0未进入战斗时结束
        btn.innerHTML = "杀不二";
        stopAutoFight();
        Alert(msg + ":" + code)
      },
    });
  } else {
    btn.innerHTML = "杀不二";
    stopAutoFight();
  }
}

// 自动集火
var focusAttackPos = "1"; // 0时，击杀先出手的人, 1-8为第几号位
var focusAttackXdz = 3; // 触发的最小气值
var focusAttackSkills = []; // 集火时需要出招的技能列表，若可用，会优先从左到右使用技能

function focusAttackMon(b, type, subtype, msg) {
  if (subtype == "vs_info") {
    // 首次战斗时检测我方是多人还是单人
    fightPeopleNum = 0;
    var info = getBattleInfo();
    if (!info) return;
    for (var i = info.elements.length - 1; i > -1; i--) {
      var key = info.elements[i].key;
      if (key.length < 7) continue;
      var head = info.elements[i].key.substring(0, 7);
      if (head == battleMyHead + "_kee") fightPeopleNum++
    }
    Log("friend num:", fightPeopleNum)

    // 首次进入战斗时
    // 重置破招的原始顺序值
    for (var i = describeListLen - 1; i > -1; i--) {
      hitDesList[i].hits = 0;
    };
    return;
  }

  if (subtype != "text") return
  var txt = msg;
  var uid = getBattleUidByTxt(txt);
  if (!uid) return;

  // for playskill
  var player = getBattlePosByUid(uid);
  if (!player || player.friend) return; // 跳过我方技能
  if (focusAttackPos != "0" && focusAttackPos != player.pos) return; // 未检测到指定位

  // 未检测到攻击
  if (!inAttackKey(txt, fightPeopleNum)) return

  // 检查气值是否足够
  var curPower = battlingSkills.xdz
  if (curPower < focusAttackXdz) {
    Log("No power to focus")
    return;
  }
  Log("play focus skill by:", player, txt, focusAttackSkills);
  useAllSkills(focusAttackSkills)
  return true;
}

function addFocusAttackMon() {
  battleFocusOn = true;
}

function delFocusAttackMon() {
  battleFocusOn = false;
}

function setFocusAttackPos(pos) {
  focusAttackPos = pos;
  setStore("focusAttackPos", pos)
}

function getFocusAttackSkill() {
  if (focusAttackSkills.length > 0)
    return focusAttackXdz + "|" + focusAttackSkills.join(",")
  var skills = getStore("focusSkills")
  if (!skills) return "";
  var vals = skills.split("|");
  if (!vals || vals.length < 2) {
    return "";
  }
  focusAttackXdz = parseInt(vals[0]);
  focusAttackSkills = vals[1].split(",");
  return skills
}

function setFocusAttackSkill(val) {
  var vals = val.split("|");
  if (!vals || vals.length < 2) {
    Alert("格式不正确，正确格式如：4|九天龙吟剑法,排云掌法,独孤九剑");
    return;
  }
  focusAttackXdz = parseInt(vals[0]);
  if (!focusAttackXdz) {
    Alert("格式不正确，正确格式如：4|九天龙吟剑法,排云掌法,独孤九剑");
    return;
  }
  focusAttackSkills = vals[1].split(",");
  setStore("focusSkills", val);

  var pos = getStore("focusAttackPos");
  if (!pos) pos = "1";
  focusAttackPos = pos;
}

// 自动步玄
var buxuanKey = "覺得頭暈目眩，失去了方向";
var buxuanSkillKey = "breakskill_buxuan_skill"
var buxuanSkill = ["步玄七訣"];
var buxuanOnXdz = 2;
var buxuanOnKey = "breakskill_buxuan_on"
var buxuanOn = false;
var buxuanIn = false;
var buxuanMsg = "";
var buxuanTimeout = null;

function autoBuxuanSkillMon(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }
  if (!buxuanOn) return;
  if (buxuanIn) return;

  var txt = buxuanMsg;
  if (txt.length > 0 && subtype != "text") buxuanMsg = "";
  // 如果开启且未进入状态，使用此技能.
  switch (subtype) {
    case "sec_timer":
      var curPower = battlingSkills.xdz;
      if (curPower < buxuanOnXdz) {
        Log("No power to buxuan")
        return;
      }
      if (!useAnySkill(buxuanSkill)) {
        return;
      }
      buxuanTimes++;
      return true;
    case "text":
      buxuanMsg += msg;
      return;
    case "playskill":
      if (b.get("uid").indexOf(accId) < 0) {
        return;
      }
      if (txt.indexOf(buxuanKey) < 0) {
        return;
      }
      buxuanIn = true;
      if (buxuanTimeout) {
        clearTimeout(buxuanTimeout)
      }
      buxuanTimeout = setTimeout(function() {
        buxuanIn = false;
      }, 5000); // consider for skill failed, after 4 secs to restart.

      Log("buxuan success");
      return;
  }
}

function autoBuxuanSkillFunc(restore) {
  var btn = getMenu("开步玄");
  if (btn.innerHTML == "开步玄") {
    var init = function(val) {
      var vals = val.split("|");
      if (vals.length != 2) {
        Alert("輸入有誤，格式如：2|步玄七訣");
        return;
      }
      btn.innerText = "停步玄";
      buxuanOnXdz = parseInt(vals[0]);
      buxuanSkill = [vals[1]];
      buxuanOn = true;
      battleBuxuanOn = true;
    };
    var skill = getStore(buxuanSkillKey);
    if (restore == 1 && skill && skill.length > 0) {
      init(skill);
      return;
    }
    if (!skill || skill.length == 0) {
      skill = "2|步玄七訣";
    }
    Input("戰鬥時使用眩暈技能(停止關鍵字：" + buxuanKey + ")。<br/>格式如：2|步玄七訣", skill, function(input) {
      var val = input.value;
      if (!val) {
        return;
      }
      setStore(buxuanOnKey, "1");
      setStore(buxuanSkillKey, val);
      init(val);
    })
    return;
  } else {
    battleBuxuanOn = false;
    btn.innerText = "开步玄";
    buxuanOn = false;
    setStore(buxuanOnKey, "0");
  }
}

// 自动碧血
var bxKey = "噴出一口鮮血";
var bxSkillKey = "breakskill_bx_skill"
var bxSkill = ["暮雲真氣"];
var bxOnXdz = 4;
var bxOnKey = "breakskill_bx_on"
var bxOn = false;
var bxIn = false;
var bxTimes = 0;
var bxMsg = "";

function autoBxSkillMon(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }
  if (!bxOn) return;
  if (bxIn) return;

  var txt = bxMsg;
  if (txt.length > 0 && subtype != "text") bxMsg = "";
  // 如果开启了碧血且未进入状态，使用碧血.
  switch (subtype) {
    case "sec_timer":
      var curPower = battlingSkills.xdz;
      if (curPower < bxOnXdz) {
        Log("No power to bx")
        return;
      }
      if (!useAnySkill(bxSkill)) {
        return;
      }
      bxTimes++;
      if (bxTimes > 10) {
        // 最多尝试10次
        bxIn = true;
        bxTimes = 0;
        Log("bx times out")
        return true;
      }
      return true;
    case "text":
      bxMsg += msg;
      return;
    case "playskill":
      if (b.get("uid").indexOf(accId) < 0) {
        return;
      }
      if (txt.indexOf(bxKey) < 0) {
        return;
      }
      bxIn = true;
      bxTimes = 0;
      Log("bx success");
      return;
  }
}

function autoBxSkillFunc(restore) {
  var btn = getMenu("开碧血");
  if (btn.innerHTML == "开碧血") {
    var init = function(val) {
      var vals = val.split("|");
      if (vals.length != 2) {
        Alert("輸入有誤，格式如：4|碧血心法");
        return;
      }
      btn.innerText = "停碧血";
      bxOnXdz = parseInt(vals[0]);
      bxSkill = [vals[1]];
      bxOn = true;
      battleBxOn = true;
    };
    var skill = getStore(bxSkillKey);
    if (restore == 1 && skill && skill.length > 0) {
      init(skill);
      return;
    }
    if (!skill || skill.length == 0) {
      skill = "4|碧血心法";
    }
    Input("戰鬥時使用碧血技能(最多10次,停止關鍵字：" + bxKey + ")。<br/>格式如：4|碧血心法", skill, function(input) {
      var val = input.value;
      if (!val) {
        return;
      }
      setStore(bxOnKey, "1");
      setStore(bxSkillKey, val);
      init(val);
    })
    return;
  } else {
    battleBxOn = false;
    btn.innerText = "开碧血";
    bxOn = false;
    setStore(bxOnKey, "0");
  }
}

// 自动白首
var bsKey = "念心為我，玄天之志";
var bsSkillKey = "breakskill_bs_skill"
var bsSkill = ["白首太玄經"];
var bsOnXdz = 4;
var bsOnKey = "breakskill_bs_on"
var bsOn = false;
var bsIn = false;
var bsTimes = 0;
var bsMsg = "";

function autoBsSkillMon(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }
  if (!bsOn) return;
  if (bsIn) return;

  var txt = bsMsg;
  if (txt.length > 0 && subtype != "text") bsMsg = "";
  // 如果开启了碧血且未进入状态，使用碧血.
  switch (subtype) {
    case "sec_timer":
      var curPower = battlingSkills.xdz;
      if (curPower < bsOnXdz) {
        Log("No power to bs")
        return;
      }
      if (!useAnySkill(bsSkill)) {
        return;
      }
      bsTimes++;
      if (bsTimes > 10) {
        // 最多尝试10次
        bsIn = true;
        bsTimes = 0;
        Log("bs times out")
        return true;
      }
      return true;
    case "text":
      bsMsg += msg;
      return;
    case "playskill":
      if (b.get("uid").indexOf(accId) < 0) {
        return;
      }
      if (txt.indexOf(bsKey) < 0) {
        return;
      }
      bsIn = true;
      bsTimes = 0;
      Log("bs success");
      return;
  }
}

function autoBsSkillFunc(restore) {
  var btn = getMenu("开白首");
  if (btn.innerHTML == "开白首") {
    var init = function(val) {
      var vals = val.split("|");
      if (vals.length != 2) {
        Alert("輸入有誤，格式如：4|白首太玄經");
        return;
      }
      btn.innerText = "停白首";
      bsOnXdz = parseInt(vals[0]);
      bsSkill = [vals[1]];
      bsOn = true;
      battleBsOn = true;
    };
    var skill = getStore(bsSkillKey);
    if (restore == 1 && skill && skill.length > 0) {
      init(skill);
      return;
    }
    if (!skill || skill.length == 0) {
      skill = "4|白首太玄經";
    }
    Input("戰鬥時使用白首技能(最多10次)。<br/>請輸入白首技能，最小觸發氣值|技能，格式如：4|白首太玄經", skill, function(input) {
      var val = input.value;
      if (!val) {
        return;
      }
      setStore(bsOnKey, "1");
      setStore(bsSkillKey, val);
      init(val);
    })
    return;
  } else {
    battleBsOn = false;
    btn.innerText = "开白首";
    bsOn = false;
    setStore(bsOnKey, "0");
  }
}


// 自动龙象
var lxKey = "龍象般若功終於在頂層爆發出駭人威力";
var lxSkillKey = "breakskill_lx_skill"
var lxSkill = ["龍象般若功"];
var lxOnXdz = 4;
var lxOnKey = "breakskill_lx_on"
var lxOn = false;
var lxIn = false;
var lxTimes = 0;
var lxMsg = "";

function autoLxSkillMon(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }
  if (!lxOn) return;
  if (lxIn) return;

  var txt = lxMsg;
  if (txt.length > 0 && subtype != "text") lxMsg = "";
  // 如果开启了碧血且未进入状态，使用碧血.
  switch (subtype) {
    case "sec_timer":
      var curPower = battlingSkills.xdz;
      if (curPower < lxOnXdz) {
        Log("No power to lx")
        return;
      }
      if (!useAnySkill(lxSkill)) {
        return;
      }
      lxTimes++;
      if (lxTimes > 10) {
        // 最多尝试10次
        lxIn = true;
        lxTimes = 0;
        Log("lx times out")
        return true;
      }
      return true;
    case "text":
      lxMsg += msg;
      return;
    case "playskill":
      if (b.get("uid").indexOf(accId) < 0) {
        return;
      }
      if (txt.indexOf(lxKey) < 0) {
        return;
      }
      lxIn = true;
      lxTimes = 0;
      Log("lx success");
      return;
  }
}

function autoLxSkillFunc(restore) {
  var btn = getMenu("开龙象");
  if (btn.innerHTML == "开龙象") {
    var init = function(val) {
      var vals = val.split("|");
      if (vals.length != 2) {
        Alert("輸入有誤，格式如：4|龍象般若功");
        return;
      }
      btn.innerText = "停龙象";
      lxOnXdz = parseInt(vals[0]);
      lxSkill = [vals[1]];
      lxOn = true;
      battleLxOn = true;
    };
    var skill = getStore(lxSkillKey);
    if (restore == 1 && skill && skill.length > 0) {
      init(skill);
      return;
    }
    if (!skill || skill.length == 0) {
      skill = "4|龍象般若功";
    }
    Input("戰鬥時使用龍象技能(最多10次)。<br/>請輸入龍象技能，最小觸發氣值|技能，格式如：4|龍象般若功", skill, function(input) {
      var val = input.value;
      if (!val) {
        return;
      }
      setStore(lxOnKey, "1");
      setStore(lxSkillKey, val);
      init(val);
    })
    return;
  } else {
    battleLxOn = false;
    btn.innerText = "开龙象";
    lxOn = false;
    setStore(lxOnKey, "0");
  }
}



// 自动紫霞
var zxTimeout = null;;
var zxSkillKey = "breakskill_zx_skill"
var zxSkill = ["紫霞神功"];
var zxOnXdz = 6;
var zxOnKey = "breakskill_zx_on"
var zxOn = false;
var zxIn = false;


function autoZxSkillMon(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }
  if (!zxOn) return;
  if (zxIn) return;
  if (subtype != "sec_timer" && subtype != "vs_info" && subtype != "ready_skill") return false;

  var curPower = battlingSkills.xdz;
  if (curPower < zxOnXdz) {
    Log("No power to zx")
    return;
  }

  if (!useAnySkill(zxSkill)) {
    return;
  }
  zxIn = true;
  if (zxTimeout) {
    clearTimeout(zxTimeout)
  }
  zxTimeout = setTimeout(function() {
    zxIn = false;
  }, 15000); // 15秒后失效
  return true;
}

function autoZxSkillFunc(restore) {
  var btn = getMenu("开紫霞");
  if (btn.innerHTML == "开紫霞") {
    var init = function(val) {
      var vals = val.split("|");
      if (vals.length != 2) {
        Alert("輸入有誤，格式如：2|紫霞神功");
        return;
      }

      btn.innerText = "停紫霞";
      zxOnXdz = parseInt(vals[0]);
      zxSkill = [vals[1]];
      zxOn = true;
      battleZxOn = true;
    };
    var skill = getStore(zxSkillKey);
    if (restore == 1 && skill && skill.length > 0) {
      init(skill);
      return;
    }
    if (!skill || skill.length == 0) {
      skill = "2|紫霞神功";
    }
    Input("戰鬥時使用主動類技能，15秒後將再次使用。<br/>請輸入主動技能，最小觸發氣值|技能，格式如：2|紫霞神功：", skill, function(input) {
      var val = input.value;
      if (!val) {
        return;
      }
      setStore(zxOnKey, "1");
      setStore(zxSkillKey, val);
      init(val);
    })
    return;
  } else {
    battleZxOn = false;
    btn.innerText = "开紫霞";
    zxOn = false;
    clearTimeout(zxTimeout);
    setStore(zxOnKey, "0");
  }
}

// 自动紫霞
var txTimeout = null;;
var txSkillKey = "breakskill_tx_skill"
var txSkill = ["紫霞神功"];
var txOnXdz = 6;
var txOnKey = "breakskill_tx_on"
var txOn = false;
var txIn = false;


function autoTxSkillMon(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }
  if (!txOn) return;
  if (txIn) return;
  if (subtype != "sec_timer" && subtype != "vs_info" && subtype != "ready_skill") return false;

  var curPower = battlingSkills.xdz;
  if (curPower < txOnXdz) {
    Log("No power to tx")
    return;
  }

  if (!useAnySkill(txSkill)) {
    return;
  }
  txIn = true;
  if (txTimeout) {
    clearTimeout(txTimeout)
  }
  txTimeout = setTimeout(function() {
    txIn = false;
  }, 15000); // 15秒后失效
  return true;
}

function autoTxSkillFunc(restore) {
  var btn = getMenu("开天邪");
  if (btn.innerHTML == "开天邪") {
    var init = function(val) {
      var vals = val.split("|");
      if (vals.length != 2) {
        Alert("輸入有誤，格式如：2|天邪神功");
        return;
      }

      btn.innerText = "停天邪";
      txOnXdz = parseInt(vals[0]);
      txSkill = [vals[1]];
      txOn = true;
      battleTxOn = true;
    };
    var skill = getStore(txSkillKey);
    if (restore == 1 && skill && skill.length > 0) {
      init(skill);
      return;
    }
    if (!skill || skill.length == 0) {
      skill = "2|天邪神功";
    }
    Input("戰鬥時使用主動類技能，15秒後將再次使用。<br/>請輸入主動技能，最小觸發氣值|技能，格式如：2|天邪神功：", skill, function(input) {
      var val = input.value;
      if (!val) {
        return;
      }
      setStore(txOnKey, "1");
      setStore(txSkillKey, val);
      init(val);
    })
    return;
  } else {
    battleTxOn = false;
    btn.innerText = "开天邪";
    txOn = false;
    clearTimeout(txTimeout);
    setStore(txOnKey, "0");
  }
}

//空白按钮-------------------------
//============自动阵法
var autoBattleSkillCur = autoBattleSkillOri1;
var autoBattleSkillArr = [];

function setAutoBattleData(keyName, val) {
  if (!keyName || !val) {
    return false
  }
  autoBattleSkillCur = val.replace(/\s+/g, "");
  autoBattleSkillArr = autoBattleSkillCur.split(",");
  if (autoBattleSkillArr.length < 2) {
    Alert("技能格式有误,至少是两个参数，请检查是否以英文短号分割")
    return false;
  }
  autoBattleSkillArr[0] = parseInt(autoBattleSkillArr[0])
  if (!autoBattleSkillArr[0]) {
    Alert("技能格式有误,第一个参数是应是大于0的数值，请检查是否以英文短号分割");
    return false;
  }
  setStore(keyName, val);
  setStore(autoBattleSkillKey, keyName);
  return true
}

function autoBattleFunc() {
  var autoBattleBtn = getMenu("自动阵");
  if (autoBattleBtn.innerHTML == "自动阵") {
    var lastSkillKey = getStore(autoBattleSkillKey);
    autoBattleSkillCur = getStore(lastSkillKey)
    if (!autoBattleSkillCur) {
      Input(autoBattleDesc, autoBattleSkillOri1, function(input) {
        if (!setAutoBattleData(autoBattleSkillKey1, input.value)) {
          return
        }

        autoBattleBtn.innerHTML = '手动阵';
        battleArrayOn = true;
        setStore("autoskill_status", 1);
      });
    } else {
      if (!setAutoBattleData(lastSkillKey, autoBattleSkillCur)) {
        return
      }
      autoBattleBtn.innerHTML = '手动阵';
      battleArrayOn = true;
      setStore("autoskill_status", 1);
    }
  } else {
    autoBattleBtn.innerHTML = '自动阵';
    setStore("autoskill_status", 0);
    battleArrayOn = false;
  }
}

function doAttack(b, type, subtype, msg) {
  if (!inBattleFight) {
    return false;
  }
  // 只订阅这几个事件
  if (subtype != "sec_timer" && subtype != "vs_info" && subtype != "ready_skill") return false;

  // 未配置技能
  if (autoBattleSkillArr.length == 0) {
    Alert("未配置阵法技能");
    return false;
  }

  // 检查气的条件是否满足
  var needPower = parseInt(autoBattleSkillArr[0]);
  if (!needPower) {
    Log("技能气值配置错误:" + autoBattleSkillArr.join(","));
    return false;
  }
  var curPower = battlingSkills.xdz;
  if (!curPower) {
    Log("系统气值错误:" + curPower, subtype);
    return false;
  }
  if (curPower < needPower) return false;

  // 已有足够的气，尝试执行配置的技能
  useAllSkills(autoBattleSkillArr.slice(1));

  return true; // 正常调用
}

//切阵法一======================================
function setAutoBattle1Func(cb) {
  var storeSkill = getStore(autoBattleSkillKey1);
  if (!storeSkill) {
    storeSkill = autoBattleSkillOri1
  }
  Input(autoBattleDesc + autoBattleSkillCur, storeSkill, function(input) {
    setAutoBattleData(autoBattleSkillKey1, input.value);
  });
}

//切阵法二======================================
function setAutoBattle2Func() {
  var storeSkill = getStore(autoBattleSkillKey2);
  if (!storeSkill) {
    storeSkill = autoBattleSkillOri2
  }
  Input(autoBattleDesc + autoBattleSkillCur, storeSkill, function(input) {
    setAutoBattleData(autoBattleSkillKey2, input.value);
  });
}

//切阵法三======================================
function setAutoBattle3Func() {
  var storeSkill = getStore(autoBattleSkillKey3);
  if (!storeSkill) {
    storeSkill = autoBattleSkillOri3
  }
  Input(autoBattleDesc + autoBattleSkillCur, storeSkill, function(input) {
    setAutoBattleData(autoBattleSkillKey3, input.value);
  });
}
//切阵法四======================================
function setAutoBattle4Func() {
  var storeSkill = getStore(autoBattleSkillKey4);
  if (!storeSkill) {
    storeSkill = autoBattleSkillOri4
  }
  Input(autoBattleDesc + autoBattleSkillCur, storeSkill, function(input) {
    setAutoBattleData(autoBattleSkillKey4, input.value);
  });
}
//切阵法五======================================
function setAutoBattle5Func() {
  var storeSkill = getStore(autoBattleSkillKey5);
  if (!storeSkill) {
    storeSkill = autoBattleSkillOri5
  }
  Input(autoBattleDesc + autoBattleSkillCur, storeSkill, function(input) {
    setAutoBattleData(autoBattleSkillKey5, input.value);
  });
}
//* 我破招 方法 :start */
// ==============================================================================
var describeListLen = hitKeys.length;
var breakBattleSkillArr = [];
var breakBattleSkillArrLen = 0;
var breakBattleSkillKeyCur = "battle_break_cur";
var breakBattleSkillKey1 = "battle_break";
var breakBattleSkillKey2 = "battle_break2";
var breakBattleSkillKey3 = "battle_break3";
var hitDesList = []
for (var i = 0; i < describeListLen; i++) {
  hitDesList.push({
    msg: hitKeys[i],
    hits: 0
  });
}

function fightAllFunc() {
  var fightAllBtn = getMenu("我破招");
  if (fightAllBtn.innerHTML == "我破招") {
    var lastSkillKey = getStore(breakBattleSkillKeyCur);
    var store = getStore(lastSkillKey);
    if (!store) {
      store = breakBattleSkillOri
    }
    var inputArr = store.split(",")
    if (!inputArr || inputArr.length == 0) {
      Alert("未设置破招技能");
      return
    }
    breakBattleSkillArr = inputArr
    breakBattleSkillArrLen = inputArr.length

    // 检查是否设置了技能, 若未设置，提醒设置，以便提高性能
    battleBreakOn = true;
    fightAllBtn.innerHTML = '不破招';
    setStore("breakskill_status", 1);
  } else {
    fightAllBtn.innerHTML = '我破招'
    battleBreakOn = false;
    setStore("breakskill_status", 0);
  }
}

// 重置破阵技能
function resetBreakSkill(keyName, val) {
  if (!keyName || !val) {
    return false
  }
  var inputArr = val.replace(/\s+/g, "").split(",");
  breakBattleSkillArr = inputArr;
  breakBattleSkillArrLen = inputArr.length
  setStore(keyName, val);
  setStore(breakBattleSkillKeyCur, keyName)
}

function resetBreakSkillFunc1() {
  // 读取内存
  var store = getStore(breakBattleSkillKey1);
  if (!store) {
    store = breakBattleSkillOri
  }
  Input(breakBattleDesc + breakBattleSkillArr.join(","), store, function(input) {
    resetBreakSkill(breakBattleSkillKey1, input.value)
  });
}

function resetBreakSkillFunc2() {
  // 读取内存
  var store = getStore(breakBattleSkillKey2);
  if (!store) {
    store = breakBattleSkillOri
  }
  Input(breakBattleDesc + breakBattleSkillArr.join(","), store, function(input) {
    resetBreakSkill(breakBattleSkillKey2, input.value)
  });
}


function resetBreakSkillFunc3() {
  // 读取内存
  var store = getStore(breakBattleSkillKey3);
  if (!store) {
    store = breakBattleSkillOri
  }
  Input(breakBattleDesc + breakBattleSkillArr.join(","), store, function(input) {
    resetBreakSkill(breakBattleSkillKey3, input.value)
  });
}


// 单人还是多人？
var fightPeopleNum = 8;

function doFightAll(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }

  if (subtype == "vs_info") {
    // 首次战斗时检测我方是多人还是单人
    fightPeopleNum = 0;
    var info = getBattleInfo();
    if (!info) return;
    for (var i = info.elements.length - 1; i > -1; i--) {
      var key = info.elements[i].key;
      if (key.length < 7) continue;
      var head = info.elements[i].key.substring(0, 7);
      if (head == battleMyHead + "_kee") fightPeopleNum++
    }
    Log("friend num:", fightPeopleNum)

    // 首次进入战斗时
    // 重置破招的原始顺序值
    for (var i = describeListLen - 1; i > -1; i--) {
      hitDesList[i].hits = 0;
    };
    return;
  }
  if (subtype != "text") return;

  var txt = msg;
  var uid = getBattleUidByTxt(txt);
  if (!uid) return;
  // for playskill
  var player = getBattlePosByUid(uid);
  if (!player || player.friend) return; // 我方的数据不跟

  if (!txt || txt.length == 0) {
    Log("need message", b);
    return;
  }
  if (inAttackKey(txt, fightPeopleNum)) {
    // 尝试执行指定的破招技能
    return useAnySkill(breakBattleSkillArr)
  }
  Log(txt);
}
/* 我破招 方法 :end */

// 自动血
var autoCureSkillCur = autoCureSkillOri;
var autoCureSkillArr = [];

function autoCureFunc() {
  var autoCureBtn = getMenu("自动血");
  if (autoCureBtn.innerHTML == "自动血") {
    autoCureSkillCur = getStore(autoCureSkillKey)
    if (autoCureSkillCur) {
      autoCureSkillArr = autoCureSkillCur.split(",");
    }
    if (!autoCureSkillArr || autoCureSkillArr.length != 4) {
      setAutoCureFunc()
    }
    autoCureBtn.innerHTML = '手动血';
    setStore("autocure_status", 1);
    battleCureOn = true;
  } else {
    battleCureOn = false;
    autoCureBtn.innerHTML = '自动血';
    setStore("autocure_status", 0);
  }
}

var battleCureTimes = 0;

function doAutoCure(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }

  // 只接收战场开始与气增长的信息
  if (subtype != "sec_timer") return false;

  if (!autoCureSkillCur) {
    Log("未配置治疗技能");
    return;
  }

  var userInfo = g_obj_map.get("msg_attrs")
  var vsInfo = getBattleInfo()
  if (!vsInfo) return;

  var keeCurPer = 0;
  var forceCurPer = 0;
  keeCur = parseInt(vsInfo.get(battleMyHead + "_kee" + battleMyPos)); // vs1_kee1
  keeMax = parseInt(userInfo.get("max_kee")); // vs1_max_kee1
  keeCurPer = Math.floor(keeCur * 100 / keeMax);

  forceCur = parseInt(vsInfo.get(battleMyHead + "_force" + battleMyPos)); // vs1_kee1
  forceMax = parseInt(userInfo.get("max_force")); // vs1_max_kee1
  forceCurPer = Math.floor(forceCur * 100 / forceMax);

  if (keeCurPer == null) {
    Log("cure_kee_percent:", keeCurPer, keeMax, battleMyHead, battleMyPos, keeCur);
  }
  if (forceCurPer == null) {
    Log("cure_force_percent:", forceCurPer, forceMax, battleMyHead, battleMyPos, forceCur);
  }

  // 用户技能
  var skillCureName = autoCureSkillArr[0];
  var curePer = parseInt(autoCureSkillArr[1]);
  var skillForceName = autoCureSkillArr[2];
  var forcePer = parseInt(autoCureSkillArr[3]);

  // 加血
  if (keeCurPer != null && keeCurPer <= curePer && (battleCureTimes < 3 || skillCureName == "紫血大法")) {
    battleCureTimes++;
    return useAnySkill([skillCureName]);
  }

  // 加蓝
  if (forceCurPer != null && forceCurPer <= forcePer) {
    return useAnySkill([skillForceName]);
  }
}

// 设置自动治疗
function setAutoCureFunc() {
  var storeSkill = getStore(autoCureSkillKey);
  if (!storeSkill) {
    storeSkill = autoCureSkillOri
  }
  Input(autoCureDesc + autoCureSkillCur, storeSkill, function(input) {
    autoCureSkillCur = input.value
    autoCureSkillArr = autoCureSkillCur.split(",");
    if (!autoCureSkillArr || autoCureSkillArr.length != 4) {
      Alert("输入的格式有误");
      return;
    }
    var cureVal = parseInt(autoCureSkillArr[1])
    if (cureVal < 1 || cureVal > 99) {
      Alert("请输入触发回血百分比值，1-99之间");
      return;
    }
    var forceVal = parseInt(autoCureSkillArr[3])
    if (forceVal < 1 || forceVal > 99) {
      Alert("请输入触发回蓝百分比值，1-99之间");
      return;
    }

    setStore(autoCureSkillKey, input.value);
    return;
  });
}
// 自动血结束

function setAutoCure1Func(remain) {
  var setAutoCure1Btn = getBtn('战后治疗');
  if (setAutoCure1Btn.innerHTML == "战后治疗") {
    var init = function() {
      setAutoCure1Btn.innerHTML = '停后治疗'
      addBattleListener("setAutoCure1Func", function(b, type, subtype, msg) {
        if (subtype != "combat_result") return;

        // 执行治疗
        yijianhuifuFunc();
      });
    }

    if (remain) {
      setStore("autocure1_on", 1);
      Alert("已开启战后治疗，若内力已超过2万5，请确保背包里有万年与千年灵芝");
    }
    init();
  } else {
    setAutoCure1Btn.innerHTML = '战后治疗'
    delBattleListener("setAutoCure1Func");
    setStore("autocure1_on", 0);
  }
}
// 自动血1结束

// 杀隐藏怪
function killHideNpcFunc() {
  var btn = $('.cmd_click2');
  if (btn.length > 0) {
    for (var i = 0; i < btn.length; i++) {
      var msg = btn[i].getAttribute('onclick');
      if (msg.indexOf("ask ") < 0) continue;
      Alert("此人叫:" + msg.split("'")[1].split(" ")[1]);
      return;
    }
    return;
  }
  if (inBattle()) {
    var ids = "";
    var info = getBattleInfo();
    for (var i = info.elements.length - 1; i > -1; i--) {
      var key = info.elements[i].key;
      if (key.length != 8 || key.indexOf("pos") < 0) continue;
      var val = info.elements[i].value;
      // key like : vs1_pos4
      ids += (key + ":" + val + "<br />");
    }

    Alert(ids)

    return
  }

  var targetName = getStore("kill_hidenpc_name");
  if (targetName == null) {
    targetName = "";
  }
  Input("请输入怪物中代码值进行叫杀：\n如：choyin_luoshaoxinmo;在npc身上点此按钮可取到场景值;\n在战斗中点击此按钮会列出参战人员的ID", targetName, function(input) {
    var val = input.value;
    if (!val) {
      return;
    }
    val = val.trim();
    setStore("kill_hidenpc_name", val);
    // 若未找到，直接杀
    clickButton("kill " + val)
    return
  })
}
// 杀隐藏怪结束

var autoTrainArr = [];

function tupo(cfg) {
  var skills = getSkillSet(function() {
    tupo(cfg);
  });
  if (!skills) return;
  
  for (var skill of skills) {
    if (!isContains(skill[0], cfg.name)) continue;

    var onGoingSkillID = skill[1].key;
	
    go("enable " + onGoingSkillID, {
      btn: 0
    });
    go("tupo go," + onGoingSkillID, {
      btn: 1
    });
	go("tupo_speedup4_1 " + onGoingSkillID + " go");
    // 是否需要加速
    switch (cfg.star) {
      case "*":
        go("tupo_speedup2 " + onGoingSkillID + " go"); // 尝试高级加速
        go("tupo_speedup " + onGoingSkillID + " go"); // 尝试普通加速
        break;
      case "**":
        go("tupo_speedup3 " + onGoingSkillID + " go"); // 尝试超级加速
        break;
      case "***":
        go("tupo_speedup3_1 " + onGoingSkillID + " go"); // 尝试通天加速
        break;
	  case "****":
        go("tupo_speedup2 " + onGoingSkillID + " go"); // 尝试高级加速
        go("tupo_speedup " + onGoingSkillID + " go"); // 尝试普通加速
        break;
    }
    return;
  }
}

function autoTupo() {
  setTimeout(function() {
    getSkillsList(function(allSkills, tupoSkills) {
      if (tupoSkills.size > 0) return;
      if (inBattle()) {
        autoTupo(); // 延后处理
        return;
      }

      // 检查是否是最后一个，若是执行全部续突破
      for (var i = 0; i < autoTrainArr.length; i++) {
        tupo(autoTrainArr[i]); // 去突破技能
      }
      // 重导出技能以便还原配置
      restoreSkillFunc(1);
    })
  }, 2000); // 延迟2秒后执行, 以便加速卡已就绪
}

// 持续突破技能开始
function autoTrain(b, type, subtype, msg) {
  if (type == "notice") {
    var l = msg.match(/你的(.*)成功向前突破了/);
    if (l != null) {
      autoTupo();
      return;
    }
  }

  if (type == "practice" && subtype == "stop_practice") {
    // 自动续 练习
    Log(type, subtype, msg, b);
    var onGoingSkillID = b.get("sid");
    go("enable " + onGoingSkillID);
    go("practice " + onGoingSkillID);
    return;
  }
}

// 突破用技能集合---------------------------------------------------
var SkillSet = null;

function getSkillSet(done) {
  if (SkillSet) {
    return SkillSet;
  }
  Confirm("需要读取技能列表，是否读取?", function() {
    getSkillsList(function(all, tupo) {
      SkillSet = all;
      if (done) done();
    });
  });
}

function getSkillsList(cb) {
  addDispatchListener("getSkillsList", function(b, type, subtype, msg) {
    if (type != "skills" && subtype != "list") return;
    delDispatchListener("getSkillsList");
    goFast("prev");

    var all = new HashMap();
    var tupo = new HashMap();
    for (var i = b.elements.length - 1; i > -1; i--) {
      // "hlff,黑狼斧法,500,[1;33m深不可测[2;37;0m,attack,0,0,燕云世家"
      var attr = b.elements[i].value.split(",");
      var skill = {
        key: attr[0],
        name: dispatchMsg(attr[1]),
        level: parseInt(attr[2]),
        kind: attr[4],
        prepare: parseInt(attr[5]),
        state: parseInt(attr[6]),
        from: attr[7],
      }
      all.set(skill.name, skill);
      if (skill.state == 4) {
        tupo.set(skill.name, skill);
      }
    }
    SkillSet = all;
    cb(all, tupo);
  })
  goFast("skills")
}

function rs(skill) {
  switch (skill) {
	case '降龍十八式':
	  return '&#3670;&#1763;&#1756;S降龍十八式&#3670;&#1763;&#1756;S'
	case '乾坤挪移大法':
	  return '&#9775;乾坤挪移大法&#9775;'
	case '聖火梵劍':
	  return '&#128293;&#3858;聖火梵劍&#3858;&#128293;'
	default:
	  return skill
  }
}

function checkskill(target, SkillSet) {
  setforEach(function(value1, value2, set){
    if (`${value2}`.includes(target)) console.log(`${value2}`)
  })
}

function autoTrainFunc(restore) {
  var autoTrainBtn = getBtn("持续突破");
  if (autoTrainBtn.innerHTML != "持续突破") {
    delDispatchListener("autoTrainFunc");
    autoTrainBtn.innerHTML = "持续突破";
    setStore("autotrain_status", 0);
    return;
  }

  var init = function(keyStr) {
    // 解析配置文件
    var keys = keyStr.split(",")
    autoTrainArr = [];
    for (var i = keys.length - 1; i > -1; i--) {
      if (keys[i].length == 0) {
        continue
      }
      var star = "";
      // 注意，以下的截取需要从长到短的顺序取值
      if (keys[i].substring(0, 3) == "***") {
        star = "***";
        keys[i] = keys[i].substring(3);
      } else if (keys[i].substring(0, 2) == "**") {
        star = "**";
        keys[i] = keys[i].substring(2);
      } else if (keys[i].substring(0, 1) == "*") {
        star = "*";
        keys[i] = keys[i].substring(1);
      }
	  var nms = rs(keys[i]);
      autoTrainArr.push({
        name: nms,
        star: star,
      });
    }

    // 读取突破列表
    getSkillsList(function(allSkills, tupoSkills) {
      var currentTupo = [];
      for (var skill of tupoSkills) {
        currentTupo.push(skill[0]);
      }
      WriteToScreen("" +
        "当前在突技能：" + currentTupo.join(",") +
        "<br/><a style='text-decoration:underline;color:yellow' onclick=\"go('tupo_speedup')\">普通加速卡</a>" +
        "<br/><a style='text-decoration:underline;color:yellow' onclick=\"go('tupo_speedup2')\">高級加速卡</a>" +
        "<br/><a style='text-decoration:underline;color:yellow' onclick=\"go('tupo_speedup3')\">超級加速卡</a>" +
        "<br/><a style='text-decoration:underline;color:yellow' onclick=\"go('tupo_speedup3_1')\">通天丸</a>" +
		"<br/><a style='text-decoration:underline;color:yellow' onclick=\"go('tupo_speedup4_1')\">金剛舍利</a>" +
        "");
      addDispatchListener("autoTrainFunc", autoTrain);
      autoTrainBtn.innerHTML = "停续突破";
      if (tupoSkills.size == 0) {
        Confirm("是否自动突破：" + keyStr + "？", function() {
          // 检查配置的技能是否在突破中，若没有，进行突破
          for (var i = 0; i < autoTrainArr.length; i++) {
            tupo(autoTrainArr[i]);
          };
          // 重导出技能以便还原配置
          restoreSkillFunc(1);
        });
      }
    }); // end for getSkillsList
  } // end init

  var keys = getStore("autotrain_key");
  if (restore) {
    if (keys) init(keys);
    return;
  }

  if (!keys) keys = "<无>";
  Input("请输入需要自动突破的技能，以英文逗号分割，自动继突破将在最后一个突完时才会续。<br/>以*打头使用一般/高级加速卡; 以**打头使用超级加速卡; 以***打头使用通天加速卡。<br/>例如：*千影百伤棍,**排云掌法,***四海断潮斩,*无相金刚掌,**降龙十八掌,***独孤九剑", keys, function(input) {
    var val = input.value;
    if (!val) return;
    setStore("autotrain_status", 1);
    setStore("autotrain_key", val);
    init(val);
	WriteToScreen(val);
  });
  return;
}
// 持续突破技能结束


// 只招茅山道术的兵，需要两个的应配两个技能以便兵生兵
var callDogSkill = "茅山道术";
var callDogSkillMen = 1;
var callDogTimes = 0;
var callDogNpcIdx = 0; // 当前在观战的npc索引
var callDogNpcTimes = 0;
var callDogNpcKillIdx = 0; // 当前需要杀的npc索引
var callDogMaxTimes = 2 // 2次，若两次不出,跑路
var callDogTrigger = null;
var callDogPatrolIdx = 0;
var callDogPatrolLen = 10; // 等价于ql_w.length，但因该方法无法调用，而设定此值
var bloodMinLimit = 100000; // 脱离战场的最低血量
var bloodMaxLimit = 1000000; // 脱离战场的最大血量
var autoDogHomeTime = 60; // 在主页停留的时间
var autoDogEnd = 0;

var callDogAliveTimer = null; // 存活检查
var callDogAlive = 1; // 定时器置0，执行器置1，定时器2个回合检测到未置1时，重置浏览器

function setCallDogAliveTimer() {
  // 未开启自动清理
  if (callDogTrigger == null) {
    return;
  }

  // 先关闭，再重启
  clearInterval(callDogAliveTimer);
  callDogAliveTimer = null;

  // 卡住的定时器
  callDogAliveTimer = setInterval(function() {
    // 两个周期内检查是否有动的情况，若没有，执行网页重置
    if (callDogAlive == 1) {
      callDogAlive = 0;
      setCallDogAliveTimer(); // 重置定时器
      return;
    }

    // 重新刷新网页
    window.location.reload();
    // g_gmain.g_delay_connect = 0;
    // connectServer();
    // clearCallDog();
    // autoCallDogFunc(1);
  }, autoDogHomeTime * 3 * 1000)
  Log("reset DogAliveTimer")
}


function autoCallDogFunc(restore) {
  var autoCallDogBtn = getBtn('青龙清理');
  if (callDogTrigger == null) {
    autoCallDog(); // 开启清理定时器
    setCallDogAliveTimer() // 开启存活定时器

    autoCallDogBtn.innerHTML = '停止清理';
    if (!restore) setStore("autodog_status", 1);
  } else {
    Log("clear dog");
    delDispatchListener("autoCallDogFunc");
    clearCallDog();
    autoCallDogBtn.innerHTML = '青龙清理';
    setStore("autodog_status", 0);
  }
}

function resetAutoDogSkillFunc(restore) {
  var men = getStore("autodog_men");
  if (men) {
    callDogSkillMen = parseInt(men)
    if (restore) return;
  }

  Input("请输入需要清理的类型，0坏人，1好人。<br/>当前：" + callDogSkillMen, "1", function(input) {
    if (!input.value || input.value.length == 0) {
      return;
    }
    callDogSkillMen = parseInt(input.value);
    setStore("autodog_men", callDogSkillMen);
  })
}

function resetAutoDogBloodFunc(restore) {
  var bloodLimit = getStore("autodog_blood");
  if (bloodLimit) {
    var bloodLimitArr = bloodLimit.split(",")
    bloodMinLimit = parseInt(bloodLimitArr[0]);
    bloodMaxLimit = parseInt(bloodLimitArr[1]);
    if (restore) return;
  } else {
    bloodLimit = bloodMinLimit + "," + bloodMaxLimit;
  }
  Input("请输入脱离清理的对面血量区间<span style='color:red'>以英文逗号</span>分割最小最大血量。<br/>当前：" + bloodLimit, bloodLimit, function(input) {
    var val = input.value;
    if (!val) {
      return;
    }
    var arr = val.split(",");
    if (!arr || arr.length != 2) {
      Alert("输入的格式错误")
      return;
    }
    bloodMinLimit = parseInt(arr[0]);
    bloodMaxLimit = parseInt(arr[1]);
    setStore("autodog_blood", val);
  });
}

function resetAutoDogHomeTimeFunc(restore) {
  var homeTime = getStore("autodog_home");
  if (homeTime) {
    autoDogHomeTime = parseInt(homeTime)
    if (restore) return;
  }
  Input("请输入清理时在主页停留的时间，单位秒。<br/>当前：" + autoDogHomeTime, 60, function(input) {
    if (!input.value || input.value.length == 0) {
      return;
    }
    autoDogHomeTime = parseInt(input.value);
    if (autoDogHomeTime < 1) {
      return;
    }

    setStore("autodog_home", autoDogHomeTime);
    setCallDogAliveTimer() // 重新开启存活定时器
  });
}


// 杀坏人----------------------------------------------------------------------------------------------------------------
var HongMingNPCList = ["惡棍", "流寇", "雲老四", "嶽老三", "二娘", "段老大", "劇盜"];
// 返回是否找到人, startIdx起始为0, 小于0直接返回
function travelViewHongMing(startIdx) {
  if (startIdx == -1) {
    return -1
  }
  var peopleList = $(".cmd_click3");
  var thisonclick = null;

  // 从第一个开始循环
  for (var i = startIdx; i < peopleList.length; i++) {
    // 打印 NPC 名字，button 名，相应的NPC名
    thisonclick = peopleList[i].getAttribute('onclick');
    if (HongMingNPCList.contains(peopleList[i].innerText)) {
      var targetCode = thisonclick.split("'")[1].split(" ")[1];
      clickButton('watch_vs ' + targetCode); // 点击杀人
      return i
    }
  }
  return -1
}

function travelKillHongMing(startIdx) {
  if (startIdx == -1) {
    return -1
  }
  var peopleList = $(".cmd_click3");
  var thisonclick = null;

  // 从第一个开始循环
  for (var i = startIdx; i < peopleList.length; i++) {
    // 打印 NPC 名字，button 名，相应的NPC名
    thisonclick = peopleList[i].getAttribute('onclick');
    if (HongMingNPCList.contains(peopleList[i].innerText)) {
      var targetCode = thisonclick.split("'")[1].split(" ")[1];
      clickButton('kill ' + targetCode); // 点击杀人
      return i
    }
  }
  return -1
}

// 杀好人----------------------------------------------------------------------------------------------------------------
var HuangMingNPCList = ["王鐵匠", "楊掌櫃", "柳繪心", "柳小花", "賣花姑娘", "劉守財", "朱老伯", "方老闆", "客商", "方寡婦"];
// 返回是否找到人, startIdx起始为0, 小于0直接返回
function travelViewHuangMing(startIdx) {
  if (startIdx == -1) {
    return -1
  }
  var peopleList = $(".cmd_click3");
  var thisonclick = null;
  // 从第一个开始循环
  for (var i = startIdx; i < peopleList.length; i++) {
    // 白名NPC
    if (peopleList[i].innerText == peopleList[i].innerHTML) {
      continue
    }

    // 打印 NPC 名字，button 名，相应的NPC名
    thisonclick = peopleList[i].getAttribute('onclick');
    if (HuangMingNPCList.contains(peopleList[i].innerText)) {
      var targetCode = thisonclick.split("'")[1].split(" ")[1];
      clickButton('watch_vs ' + targetCode); // 点击观战
      return i
    }
  }
  return -1
}

function travelKillHuangMing(startIdx) {
  if (startIdx == -1) {
    return -1
  }
  var peopleList = $(".cmd_click3");
  var thisonclick = null;
  // 从第一个开始循环
  for (var i = startIdx; i < peopleList.length; i++) {
    // 白名NPC
    if (peopleList[i].innerText == peopleList[i].innerHTML) {
      continue
    }

    // 打印 NPC 名字，button 名，相应的NPC名
    thisonclick = peopleList[i].getAttribute('onclick');
    if (HuangMingNPCList.contains(peopleList[i].innerText)) {
      var targetCode = thisonclick.split("'")[1].split(" ")[1];
      clickButton('kill ' + targetCode); // 点击杀人
      return i
    }
  }
  return -1
}


// 观战
function travelDogView(idx) {
  if (callDogSkillMen == 1) {
    return travelViewHuangMing(idx)
  }
  return travelViewHongMing(idx)
}

// 杀进去
function travelDogKill(idx) {
  if (callDogSkillMen == 1) {
    return travelKillHuangMing(idx)
  }
  return travelKillHongMing(idx)
}

function autoCallDog() {
  // 若已在执行，不再执行
  if (callDogTrigger != null) {
    return false;
  }

  // 1秒钟检查一次战斗情况
  callDogTrigger = setInterval(function() {
    callDog(function(...args) {
      Log("Escape by :", ...args);
      // escape success
      // 返回上一界面以便继续查找下一个目标
      go("golook_room");
    });
  }, 1000);

  // 关闭定时巡逻
  return true;
}

function clearCallDog() {
  clearInterval(callDogTrigger);
  callDogTrigger = null;
  clearInterval(callDogAliveTimer);
  callDogAliveTimer = null;
  nextCallDogSceneing = 0;
}

var nextCallDogSceneing = 0;
var travelView = 1;

function callDog(escapeResult) {
  if (!inBattle()) {
    callDogTimes = 0;
    if (nextCallDogSceneing > 0) {
      nextCallDogSceneing--;
      return;
    }

    // 检查有没有可以击杀的目标
    Log("try clean:", callDogNpcIdx, travelView);

    if (travelView == 1) {
      // 观战模式
      var nextIdx = travelDogView(callDogNpcIdx);
      if (nextIdx == -1) {
        // 计算未找到怪的次数
        callDogNpcTimes++
      } else {
        callDogNpcKillIdx = nextIdx;
        callDogNpcIdx = nextIdx + 1;
        callDogNpcTimes = 0;
        Log("found view :", nextIdx, callDogNpcTimes);
      }
    } else {
      // 杀模式
      var nextId = travelDogKill(callDogNpcKillIdx);
      if (nextId == -1) {
        // 计算未找到怪的次数
        callDogNpcTimes++;

        // 已找不到怪物, 回到观察者模式
        travelView = 1;
        Log("killer not found:", travelView)
      } else {
        Log("found kill:", callDogNpcKillIdx, nextId);
        callDogNpcTimes = 0;
      }
    }

    // 去下一场景杀，执行2次NPC检查，若不存在可杀的目标，去下一场景
    if (callDogNpcTimes > 1) {
      callDogNpcIdx = 0;
      callDogNpcTimes = 0;
      if (callDogPatrolIdx < callDogPatrolLen) {
        nextCallDogSceneing = autoDogHomeTime; // 等待60回合后结束重新刷新整个浏览器
        var nextScene = zx(callDogPatrolIdx + 1);
        goPlace(nextScene.name, nextScene.way, function() {
          nextCallDogSceneing = 0; // 已到达位置，关闭此等待
        })
        callDogPatrolIdx++;
      } else {
        autoDogEnd++
        callDogPatrolIdx = 0;
        nextCallDogSceneing = autoDogHomeTime; // 等待60回合后结束重新刷新整个浏览器
        go("home"); // 回家以便非vip打坐
        go("score");
      }
    }
    return;
  }
  callDogNpcTimes = 0;


  // 检查队伍是否有非本人，若有，则退出
  // 坏人方
  var a11 = document.getElementById('vs11');
  var a12 = document.getElementById('vs12');
  var a13 = document.getElementById('vs13');
  var a14 = document.getElementById('vs14');
  var a15 = document.getElementById('vs15');
  var a16 = document.getElementById('vs16');
  var a17 = document.getElementById('vs17');
  var a18 = document.getElementById('vs18');

  // 好人方
  var a21 = document.getElementById('vs21');
  var a22 = document.getElementById('vs22');
  var a23 = document.getElementById('vs23');
  var a24 = document.getElementById('vs24');
  var a25 = document.getElementById('vs25');
  var a26 = document.getElementById('vs26');
  var a27 = document.getElementById('vs27');
  var a28 = document.getElementById('vs28');

  var userNum = 0;
  var noBlood = 0;
  if (a11 && a11.innerText.trim().length > 0) {
    // 用户数加1
    userNum++;
    // 检查血量，血太低时也不打
    var bloodNode = document.getElementById('vs_hp11');
    var blood = parseInt(bloodNode.innerText);
    if (!blood) {
      Log("a11 blood:", blood, a11.innerText, bloodNode.innerHTML);
    }
    if (blood && (blood < bloodMinLimit || blood > bloodMaxLimit) && callDogSkillMen == 0) noBlood = 1;
  }
  if (a12 && a12.innerText.trim().length > 0) {
    // 用户数加1
    userNum++;
  }
  if (a13 && a13.innerText.trim().length > 0) {
    // 用户数加1
    userNum++;
  }
  if (a14 && a14.innerText.trim().length > 0) {
    // 用户数加1
    userNum++;
  }
  if (a15 && a15.innerText.trim().length > 0) {
    userNum++;
  }
  if (a16 && a16.innerText.trim().length > 0) {
    userNum++;
  }
  if (a17 && a17.innerText.trim().length > 0) {
    userNum++;
  }
  if (a18 && a18.innerText.trim().length > 0) {
    userNum++;
  }
  if (a21 && a21.innerText.trim().length > 0) {
    userNum++;
    // 检查血量，血太低时也不打
    bloodNode = document.getElementById('vs_hp21');
    blood = parseInt(bloodNode.innerText);
    if (!blood) {
      Log("a21 blood:", blood, a21.innerText, bloodNode.innerHTML);
    }
    if (blood && (blood < bloodMinLimit || blood > bloodMaxLimit) && callDogSkillMen == 1) noBlood = 1;
  }
  if (a22 && a22.innerText.trim().length > 0) {
    userNum++;
  }
  if (a23 && a23.innerText.trim().length > 0) {
    userNum++;
  }
  if (a24 && a24.innerText.trim().length > 0) {
    userNum++;
  }
  if (a25 && a25.innerText.trim().length > 0) {
    userNum++;
  }
  if (a26 && a26.innerText.trim().length > 0) {
    userNum++;
  }
  if (a27 && a27.innerText.trim().length > 0) {
    userNum++;
  }
  if (a28 && a28.innerText.trim().length > 0) {
    userNum++;
  }

  if (travelView == 1) {
    if (userNum == 2 && noBlood == 0) {
      // 标记可以进入战斗
      travelView = 0;
      Log("goto kill,", travelView)
    }

    // 退出观战模式
    AutoEscapeFunc(function() {
      escapeResult(travelView, userNum, noBlood)
    })
    return;
  };

  // 进入战斗时，实时再检测一遍战斗条件，若不满足退出战斗
  // 如果战斗中不等于3人(不是正邪或有其他玩家)，或召唤超过次数，不再召唤, 有人血少于指定值
  if (userNum > 3 || callDogTimes > 3 || noBlood == 1) {
    travelView = 1;
    // 退出战斗模式
    AutoEscapeFunc(function() {
      escapeResult(travelView, userNum, callDogTimes, noBlood)
    })
    return;
  }

  // 呼叫狗狗
  var played = battlingSkills.play(callDogSkill)
  if (played) {
    callDogTimes++;
    callDogAlive = 1;
  }
}

//进入跨服-------------------------------------------------------------------------------------------------------------
var destryKuafuBookKind = 0

function jinkuafuFunc() {
  var bookKind = getStore("kuafu_book");
  if (!bookKind) {
    bookKind = 0;
  }
  Input("请选择销毁生死簿的方式，0银两，1元宝。", bookKind, function(input) {
    var val = parseInt(input.value);
    if (val == null) {
      return;
    }
    destryKuafuBookKind = val;
    setStore("kuafu_book", destryKuafuBookKind)
    if (destryKuafuBookKind == 1) {
      go('jh 1;e;n;n;n;n;w;event_1_68351907 go;home;change_server world');
    } else {
      go('jh 1;e;n;n;n;n;w;event_1_64058963 go;home;change_server world');
    }
  })
}

var kuafuHomeInfos = [{
  name: "武林廣場1",
  idx: 1
}, {
  name: "武林廣場2",
  idx: 2
}, {
  name: "武林廣場3",
  idx: 3
}, {
  name: "武林廣場4",
  idx: 4
}, {
  name: "武林廣場5",
  idx: 5
}, {
  name: "武林廣場6",
  idx: 6
}, {
  name: "武林廣場7",
  idx: 7
}, {
  name: "武林廣場8",
  idx: 8
}, {
  name: "武林廣場9",
  idx: 9
}, {
  name: "武林廣場10", // 注意，此值需要优化查找，否则会先找到广场1
  idx: 10
}, {
  name: "聚義廳",
  idx: 11
}, ];

function detectKuafu(locMsg) {
  for (var i = 0; i < locMsg.length; i++) {
    var c = locMsg.charAt(i);
    for (var n = kuafuHomeInfos.length - 1; n > -1; n--) {
      var nameLen = kuafuHomeInfos[n].name.length;
      var nameEnd = i + nameLen;
      if (c == kuafuHomeInfos[n].name.charAt(0) && nameEnd <= locMsg.length && locMsg.substring(i, nameEnd) == kuafuHomeInfos[n].name) {
        Log("Found Loc:", locMsg, kuafuHomeInfos[n]);
        if (locMsg.indexOf(kuafuHomeInfos[n].name) < 0) {
          Alert("广场识别算法错误：" + locMsg);
        }
        return kuafuHomeInfos[n];
      }
    }
  }
  return null;
}

// 开跟杀
var followMenArr = [];

function followKillFunc(restore) {
  var followKillBtn = getMenu('开跟杀');
  if (followKillBtn.innerHTML == '开跟杀') {
    followKillStatus = 1;
    var init = function(val) {
      if (!val) return;
      var keys = val.split(",")
      followMenArr = [];
      for (var i = keys.length - 1; i > -1; i--) {
        if (keys[i].length == 0) {
          continue
        }
        var hasStar = keys[i].charAt(0) == "*";
        if (hasStar) {
          keys[i] = keys[i].substring(1);
        }

        followMenArr.push({
          name: keys[i],
          star: hasStar,
        });
      }
      followKillBtn.innerText = '停跟杀';
      addBattleListener("followKillFunc", function(b, type, subtype, msg, kind, keys) {
        // 过滤类型数据
        switch (kind) {
          case toBattleKillEventKind:
          case toBattleFightEventKind:
            break;
          default:
            return;
        }

        // 执行喊杀处理
        var man = null;
        for (var i = 0; i < followMenArr.length; i++) {
          man = followMenArr[i];

          // 执行正杀
          if (!man.star && keys[1].indexOf(man.name) > -1) {
            var fightKind = "kill";
            if (kind != toBattleKillEventKind) {
              fightKind = "fight";
            }
            autoFight({
              targetName: keys[2], // 中文名称,
              fightKind: fightKind, // 不填写或默认值时为kill, 填写fight时为比试
              menKind: 0, // 要找的人是守方(0好人)还是攻方(1坏人)
              menToFight: 0, // 要杀的人，0守方，1攻方
              anyOne: true, // 是否过滤白名npc, (false过虑，true击杀任何人)
              tryTimes: 2, // 尝试找人找几次
            });
            return;
          }

          // 执行反杀
          if (man.star && keys[2].indexOf(man.name) > -1) {
            var fightKind = "kill";
            if (kind != toBattleKillEventKind) {
              fightKind = "fight";
            }
            autoFight({
              targetName: keys[1], // 中文名称,
              fightKind: fightKind, // 不填写或默认值时为kill, 填写fight时为比试
              menKind: 0, // 要找的人是守方(0好人)还是攻方(1坏人)
              menToFight: 0, // 要杀的人，0守方，1攻方
              anyOne: true, // 是否过滤白名npc, (false过虑，true击杀任何人)
              tryTimes: 2, // 尝试找人找几次
            });
            return;
          }
        }
      })
    };

    if (restore == 1) {
      init(getStore("followkill_keys"));
      return;
    }

    var curKeys = "<未配置>"
    var storeKeys = getStore("followkill_keys");
    if (storeKeys) {
      curKeys = storeKeys;
    } else {
      storeKeys = "";
    }
    Input("请输入跟杀的人名,以<span style='color:red'>英文逗号</span>分割，人名前带*为反跟杀。" +
      "<br/><span style='color:red'>例如：</span>" +
      "<br/><span style='color:blue'>步惊鸿,*醉汉</span> 步惊鸿杀(比试)谁我杀(比试)谁；谁杀(比试)醉汉我杀(比试)谁" +
      "<br/><br/>当前配置：" + curKeys, storeKeys,
      function(input) {
        var val = input.value;
        if (val == undefined) return;
        init(val);
        setStore("followkill_keys", val);
        setStore("followkill_status", 1);
      })
    return;
  }

  stopAutoFight(); // 清除上次
  followKillBtn.innerText = '开跟杀';
  delBattleListener("followKillFunc")
  setStore("followkill_status", 0);
  return;
}

// 开跟招
var followSkillKeyCur = "followskill_keys";
var followSkillPower = 0;
var followSkillArr = [];
var followSkillArrLen = 0;
var followSkillPlay = false;

function followSkillMon(b, type, subtype, msg) {
  if (!inBattleFight) {
    return;
  }
  if (subtype != "text") return;
  var txt = msg;
  var uid = getBattleUidByTxt(txt);
  if (!uid) return;
  var player = getBattlePosByUid(uid);
  // 过虑非我方释放的技能
  if (!player || !player.friend) {
    return;
  }
  // 检查气值
  var curPower = battlingSkills.xdz;
  if (curPower < followSkillPower) {
    Log("No power to follow")
    return;
  }
  var cfg = null;
  var useFollowSkill = false;
  for (var j = 0; j < followSkillArrLen; j++) {
    cfg = followSkillArr[j];
    // 这个玩家的技能不需要跟招
    if (cfg.followName != "*" && cfg.followName.indexOf(player.name) < 0) continue;
    if (cfg.followName == "月夜鬼蕭" && (
        txt.indexOf("鬼氣臨世") > -1 ||
        txt.indexOf("鬼魄雙眼") > -1 ||
        txt.indexOf("邪魅紅眼") > -1 ||
        txt.indexOf("厲鬼索命") > -1 ||
        txt.indexOf("鬼氣銜擊") > -1 ||
        txt.indexOf("鬼魄雙眼") > -1)) {
      // pass
    } else if (txt.indexOf(cfg.followSkill) < 0) continue;

    // Log("FOUND followSkill: ", player, cfg, txt);
    // 尝试执行指定的破招技能
    useAnySkill([cfg.playSkill]);
    useFollowSkill = true;
  }
  return useFollowSkill;
}

function followSkillFunc(restore) {
  var btn = getMenu('开跟招');
  if (btn.innerHTML == '开跟招') {
    followKillStatus = 1;
    var init = function(keyName, val) {
      resetFollowSkill(keyName, val);
      btn.innerText = '停跟招';
      setStore("followskill_status", 1);
      battleFollowOn = true;
    };
    var keyName = getStore(followSkillKeyCur)
    if (!keyName) {
      keyName = "followskill_cfg1"
      // 重置输入
      followSkillInputFunc(keyName, function(val) {
        init(keyName, val);
      });
      return;
    }
    init(keyName, getStore(keyName));
    return;
  } else {
    btn.innerText = '开跟招';
    battleFollowOn = false;
    setStore("followskill_status", 0);
    return;
  }
}

// 重置跟招技能
function resetFollowSkill(keyName, val) {
  if (!keyName || !val) {
    return false
  }
  if (!val) return;
  var vals = val.split("|");
  if (vals.length < 2) {
    return Alert("输入的跟招格式有误");
  }

  // 解析气值
  followSkillPower = parseInt(vals[0]);
  if (!followSkillPower) {
    followSkillPower = 0;
  }
  var keys = vals[1].split(";");
  followSkillArr = [];
  for (var i = 0; i < keys.length; i++) {
    if (!keys[i] || keys[i].length == 0) {
      continue
    }
    var skills = keys[i].split(",");
    if (skills.length != 3) {
      return Alert("输入的跟招格式有误");
    }
    followSkillArr.push({
      followName: skills[0],
      followSkill: skills[1],
      playSkill: skills[2],
    });
  }
  followSkillArrLen = followSkillArr.length;

  setStore(keyName, val);
  setStore(followSkillKeyCur, keyName);
}

function followSkillInputFunc(keyName, cb) {
  var curKeys = getStore(getStore(followSkillKeyCur));
  if (!curKeys) {
    curKeys = "<未配置>"
  }

  var storeKeys = getStore(keyName);
  if (!storeKeys) {
    storeKeys = "4|*,燎原百破,千影百傷棍;*,九天龍吟劍法,千影百傷棍";
  }
  Input("跟随指定的江湖招式，注意，必须是江湖招式。" +
    "<br/><span style='color:red'>格式如：</span>" +
    "<br/><span style='color:blue'>4|*,四海断潮斩,千影百伤棍;齐欢,燎原百破,千影百伤棍;齐欢/齐泰,九天龙吟剑法,千影百伤棍;</span>" +
    "<br/>4 -- 可以触发的最小气值" +
    "<br/>需要跟随的玩家(们,*为所有队友),需要跟随的技能1,需要出招的技能1;" +
    "<br/>需要跟随的玩家(们,*为所有队友),需要跟随的技能2,需要出招的技能2;" +
    "<br/>..." +
    "<br/><br/>当前配置：" + curKeys, storeKeys,
    function(input) {
      var val = input.value;
      if (val == undefined) return;
      cb(val);
    })
}

function resetFollow1Func() {
  var keyName = "followskill_cfg1";
  followSkillInputFunc(keyName, function(val) {
    resetFollowSkill(keyName, val)
  })
}

function resetFollow2Func() {
  var keyName = "followskill_cfg2";
  followSkillInputFunc(keyName, function(val) {
    resetFollowSkill(keyName, val)
  })
}

function resetFollow3Func() {
  var keyName = "followskill_cfg3";
  followSkillInputFunc(keyName, function(val) {
    resetFollowSkill(keyName, val)
  })
}

// 我抢人
var killUserTargetIntervalFunc = null;
var killUserTargetsNames = [];
var killUserTargets = [];

function stopKillUserTarget() {
  delBattleListener("killUserTargetFunc");
  var killUserTargetBtn = getBtn('开循环杀');
  killUserTargetBtn.innerHTML = '开循环杀';
  if (killUserTargetIntervalFunc == null) return;
  clearInterval(killUserTargetIntervalFunc);
  killUserTargetIntervalFunc = null;
}

function killUserTargetFunc(name) {
  var killUserTargetBtn = getBtn('开循环杀');
  var zdskill = null;
  if (killUserTargetIntervalFunc == null) {
    var init = function(val) {
      killUserTargets = [];
      var inputs = val.split('#');
      killUserTargetNames = [];
      for (var i = inputs.length - 1; i > -1; i--) {
        if (inputs[i].length > 1 && inputs[i].charAt(0) == "*") {
          killUserTargets.push({
            name: inputs[i].substring(1),
            mode: "fight"
          });
          killUserTargetNames.push(inputs[i].substring(1));
        } else {
          killUserTargets.push({
            name: inputs[i],
            mode: "kill"
          });
          killUserTargetNames.push(inputs[i].substring(0));
        }
      }
      killUserTargetBtn.innerHTML = '停循环杀';
      addBattleListener("killUserTargetFunc", function(b, type, subtype, msg) {
        switch (subtype) {
          case "out_watch":
          case "combat_result":
            closeBattleResult();
            break;
        }
      })
      killUserTargetIntervalFunc = setInterval(killUserTarget, 250);
      killUserTarget(); // 先杀一次
    }

    if (!name) {

      var lastName = getStore("killUserTargetName");
      if (!lastName) {
        lastName = "醉汉#收破烂的";
      }
      Input("输入目标全名，尝试多个目标时以#号作或分割，单个名字前带*为比试，不带为杀<br/>格式如：醉汉#收破烂的", lastName, function(input) {
        if (!input.value || input.value.length == 0) {
          return;
        }
        setStore("killUserTargetName", input.value);
        init(input.value);
      });
      return;
    }
    init(name);
    return;
  }

  stopKillUserTarget();
  return;
}

function killUserTarget() {
  if (inBattle()) return;
  var roomInfo = g_obj_map.get("msg_room");
  if (!roomInfo) return;
  // closeBattleResult();

  var npc = matchRoomNpc(killUserTargetNames, true, false);
  if (!npc) return;
  go(killUserTargets[npc.inputIdx].mode + ' ' + npc.code); // 点击比试或杀人
  return
}

// 广场青龙
function guangchangQLMon(b, type, subtype, msg) {
  var isLocal = msg.indexOf("跨服") < 0;
  if (isLocal) return; // 未在跨服中

  var l = msg.match(/【系統】青龍會組織：(.*)正在(.*)施展力量，本會願出(.*)的戰利品獎勵給本場戰鬥的最終獲勝者。/);
  if (!l) return;

  // 过滤非本区的青龙
  var isKuafuHome = l[2].indexOf("武林廣場") > -1;
  if (!isKuafuHome) return;
  var isNewAreaQL = l[1].indexOf('新區') > -1; // 注意，对老区来说是会含有大区信息的
  // 广场青龙，但不是新(老)区的，跳过
  if ((isNewAreaQL && !isNewAreaUser) || (!isNewAreaQL && isNewAreaUser)) return;

  // 跨服条件通过
  Log("FOUND GUANGCHANG QL:", l, userAreaName, isNewAreaUser, msg);

  var matchKey = undefined;
  var len = guangchangQLKeysArr.length;
  // 若未设定过滤，监听所有
  if (len == 0) {
    matchKey = {
      name: l[3],
      star: false,
    };
  } else if (len == 1 && guangchangQLKeysArr[0] == '*') {
    matchKey = {
      name: l[3],
      star: true,
    };
  }

  // 监听指定的关键字
  for (var i = len - 1; i > -1; i--) {
    if (l[3].indexOf(guangchangQLKeysArr[i].name) > -1) {
      matchKey = {
        name: l[3],
        star: guangchangQLKeysArr[i].star
      }
      break;
    }
  }
  if (!matchKey) return;

  Log("MATCH GUANGCHANG QL:", msg, matchKey);

  // 仅监听
  if (!matchKey.star || inBattle()) {
    AutoAlert('青龍:' + l[1] + " --- " + l[3] + "  " + l[2], 30 * 1000);
    return;
  }

  // 去击杀
  addDispatchListener("guangchangQLMon", function(b, type, subtype, msg) {
    if (type != "jh" || subtype != "info") return;

    var sMsg = b.get("short");
    if (sMsg.indexOf(l[2]) < 0) return;

    Log("Arrived at guangchang target:", l[2], l[1], b);
    // 已到达目的地，开始执行杀操作
    delDispatchListener("guangchangQLMon");
    autoFight({
      targetName: l[1],
      menKind: 1,
      menToFight: guangchangQLMenTo,
      newOne: true,
      doneFn: function(code, msg) {
        AutoAlert(msg + ":" + code + "," + l[3], 30 * 1000);
      },
    });
  })

  addDispatchListener("getLocInfo", function(b, type, subtype, msg) {
    if (type != "jh" || subtype != "info") return;

    var stage = detectKuafu(b.get("short"));
    if (!stage) return;
    delDispatchListener("getLocInfo");

    var homeName = stage.name;
    var homeIdx = stage.idx;
    if (homeIdx < 0) {
      Alert("无法导航到指定位置");
      return;
    } else if (homeIdx == 0) {
      Alert("你未在跨服中");
      return;
    }

    var goIdx = 0;
    switch (l[2]) {
      case "武林廣場1":
        goIdx = 1;
        break;
      case "武林廣場2":
        goIdx = 2;
        break;
      case "武林廣場3":
        goIdx = 3;
        break;
      case "武林廣場4":
        goIdx = 4;
        break;
      case "武林廣場5":
        goIdx = 5;
        break;
      case "武林廣場6":
        goIdx = 6;
        break;
      case "武林廣場7":
        goIdx = 7;
        break;
      case "武林廣場8":
        goIdx = 8;
        break;
      case "武林廣場9":
        goIdx = 9;
        break;
      case "武林廣場10":
        goIdx = 10;
        break;
    }

    var direct = goIdx - homeIdx;
    var n = 0;
    if (direct < 0) {
      for (n = direct; n < 0; n++) {
        go("w");
      }
    } else if (direct > 0) {
      for (n = direct; n > 0; n--) {
        go("e");
      }
    }
    return;
  });
  go("jh 1;home;golook_room");

  return;

};
var guangchangQLKeysArr = [];
var guangchangQLMenTo = 0;

function guangchangQLFunc(restore) {
  var guangchangQLBtn = getBtn('广场青龙');
  if (guangchangQLBtn.innerHTML == '广场青龙') {
    var init = function(val) {
      var valArr = val.split("|");
      var keyStr = "";
      if (valArr.length < 2) {
        keyStr = valArr[0];
      } else {
        guangchangQLMenTo = parseInt(valArr[0])
        keyStr = valArr[1];
      }

      var keys = keyStr.split(",")
      guangchangQLKeysArr = [];
      for (var i = keys.length - 1; i > -1; i--) {
        if (keys[i].length == 0) {
          continue
        }
        var hasStar = keys[i].charAt(0) == "*";
        if (hasStar) {
          keys[i] = keys[i].substring(1);
        }

        guangchangQLKeysArr.push({
          name: keys[i],
          star: hasStar,
        });
      }
      guangchangQLBtn.innerText = '停广场龙';
      addSysMsgListener("guangchangQLFunc", "青龍會", guangchangQLMon)
      setStore("guangchang_qinglong_status", 1);
      setStore("guangchang_qinglong_keys", val);
    };

    var storeKeys = getStore("guangchang_qinglong_keys");
    if (!storeKeys) {
      storeKeys = qlKeysOri;
    }
    if (!restore) {
      Input("请输入监听的关键字,以<span style='color:red'>|、英文逗号</span>分割，并在<span style='color:red'>跨服</span>中挂机。" +
        "<br/>格式：击杀类型|物品词组" +
        "<br/>击杀类型：0杀守方(好人)，1杀攻方(坏人)。" +
        "<br/>物品词组：以<span style='color:red'>英文逗号</span>分割多个关键词，关键词前带*为自动寻路击杀，不带仅提示。匹配顺序为从左到右，匹配到即止。" +
        "<br/><span style='color:red'>例如：</span>" +
        "<br/><span style='color:blue'>0|*斩龙宝镯,*碎片,斩龙</span> 自动击杀含'斩龙宝镯'、'碎片'的好人方(守方)青龙，提醒含'斩龙'关键字的青龙。" +
        "<br/><span style='color:blue'>1|*</span> 杀所有青龙中的坏人(攻方)。" +
        "<br/><span style='color:blue'>仅提示</span>：填空值。" +
        "<br/><br/>当前监听：" + storeKeys, storeKeys,
        function(input) {
          var val = input.value;
          if (val == undefined) return;
          init(val);
        })
      return;
    }
    init(storeKeys);
  } else {
    guangchangQLBtn.innerText = '广场青龙';
    stopAutoFight();
    delSysMsgListener("guangchangQLFunc")
    setStore("guangchang_qinglong_status", 0);
  }
}

// 跨服青龙
function kuafuQLMon(b, type, subtype, msg) {
  var isLocal = msg.indexOf("跨服") < 0;
  if (isLocal) return; // 未在跨服中

  var l = msg.match(/青龍會組織：(.*)正在(.*)施展力量，本會願出(.*)的戰利品獎勵給本場戰鬥的最終獲勝者。/);
  if (!l) return;

  // 过滤非本区的青龙
  var isKuafuHome = l[2].indexOf("武林广场") > -1;
  if (isKuafuHome) return;

  // 大区青龙，但不是本服的，跳过
  if (l[1].indexOf(userAreaName) < 0) return;

  // 跨服条件通过
  Log("FOUND KUAFU QL:", l, userAreaName, isNewAreaUser, msg);

  var matchKey = undefined;
  var len = kuafuQLKeysArr.length;
  // 若未设定过滤，监听所有
  if (len == 0) {
    matchKey = {
      name: l[3],
      star: false,
    };
  } else if (len == 1 && kuafuQLKeysArr[0] == '*') {
    matchKey = {
      name: l[3],
      star: true,
    };
  }

  // 监听指定的关键字
  for (var i = len - 1; i > -1; i--) {
    if (l[3].indexOf(kuafuQLKeysArr[i].name) > -1) {
      matchKey = {
        name: l[3],
        star: kuafuQLKeysArr[i].star
      }
      break;
    }
  }
  if (!matchKey) return;

  Log("MATCH KUAFU QL:", msg, matchKey);

  // 仅监听
  if (!matchKey.star || inBattle()) {
    AutoAlert('青龍:' + l[1] + " --- " + l[3] + "  " + l[2], 30 * 1000);
    return;
  }

  // 去击杀
  goPlace(l[2], go_ql(l[2]).way, function() {
    Log("Arrived at kuafu target:", l[2], l[1]);
    // 已到达目的地，开始执行杀操作
    autoFight({
      targetName: l[1],
      menKind: 1,
      menToFight: kuafuQLMenTo,
      newOne: true,
      doneFn: function(code, msg) {
        AutoAlert(msg + ":" + code + "," + l[3], 30 * 1000);
      },
    });
  });
  return;
};

var kuafuQLKeysArr = [];
var kuafuQLMenTo = 0;

function kuafuQLFunc(restore) {
  var kuafuQLBtn = getBtn('大区青龙');

  if (kuafuQLBtn.innerHTML == '大区青龙') {
    var init = function(val) {
      var valArr = val.split("|");
      var keyStr = "";
      if (valArr.length < 2) {
        keyStr = valArr[0];
      } else {
        kuafuQLMenTo = parseInt(valArr[0])
        keyStr = valArr[1];
      }

      var keys = keyStr.split(",")
      kuafuQLKeysArr = [];
      for (var i = keys.length - 1; i > -1; i--) {
        if (keys[i].length == 0) {
          continue
        }
        var hasStar = keys[i].charAt(0) == "*";
        if (hasStar) {
          keys[i] = keys[i].substring(1);
        }

        kuafuQLKeysArr.push({
          name: keys[i],
          star: hasStar,
        });
      }
      kuafuQLBtn.innerText = '停大区龙';
      addSysMsgListener("kuafuQLFunc", "青龍會", kuafuQLMon)
      setStore("kuafu_qinglong_status", 1);
      setStore("kuafu_qinglong_keys", val);
    };

    var storeKeys = getStore("kuafu_qinglong_keys");
    if (!storeKeys) {
      storeKeys = qlKeysOri;
    }
    if (!restore) {
      Input("请输入监听的关键字,以<span style='color:red'>|、英文逗号</span>分割，并在<span style='color:red'>跨服</span>中挂机。" +
        "<br/>格式：击杀类型|物品词组" +
        "<br/>击杀类型：0杀守方(好人)，1杀攻方(坏人)。" +
        "<br/>物品词组：以<span style='color:red'>英文逗号</span>分割多个关键词，关键词前带*为自动寻路击杀，不带仅提示。匹配顺序为从左到右，匹配到即止。" +
        "<br/><span style='color:red'>例如：</span>" +
        "<br/><span style='color:blue'>0|*斩龙宝镯,*碎片,斩龙</span> 自动击杀含'斩龙宝镯'、'碎片'的好人方(守方)青龙，提醒含'斩龙'关键字的青龙。" +
        "<br/><span style='color:blue'>1|*</span> 杀所有青龙中的坏人(攻方)。" +
        "<br/><span style='color:blue'>仅提示</span>：填空值。" +
        "<br/><br/>当前监听：" + storeKeys, storeKeys,
        function(input) {
          var val = input.value;
          if (val == undefined) return;
          init(val);
        })
      return;
    }
    init(storeKeys);
  } else {
    kuafuQLBtn.innerText = '大区青龙';
    stopAutoFight();
    delSysMsgListener("kuafuQLFunc");
    setStore("kuafu_qinglong_status", 0);
  }
}

// 周4跨服-------------------------------------------------------
var zhou4Map = {
  "雪亭鎮": {
    name: "飲風客棧",
    way: "jh 1"
  },
  "洛陽": {
    name: "龍門石窟",
    way: "jh 2"
  },
  "華山村": {
    name: "華山村村口",
    way: "jh 3"
  },
  "華山": {
    name: "華山山脚",
    way: "jh 4"
  },
  "揚州": {
    name: "安定門",
    way: "jh 5"
  },
  "丐幫": {
    name: "樹洞内部",
    way: "jh 6"
  },
  "喬陰縣": {
    name: "喬陰縣城北門",
    way: "jh 7"
  },
  "峨眉山": {
    name: "十二盤",
    way: "jh 8"
  },
  "恒山": {
    name: "大字嶺",
    way: "jh 9"
  },
  "恆山": {
    name: "大字嶺",
    way: "jh 9"
  },
  "武當山": {
    name: "林中小路",
    way: "jh 10"
  },
  "晚月莊": {
    name: "竹林",
    way: "jh 11"
  },
  "水煙閣": {
    name: "青石官道",
    way: "jh 12"
  },
  "少林寺": {
    name: "叢林山徑",
    way: "jh 13"
  },
  "唐門": {
    name: "蜀道",
    way: "jh 14"
  },
  "青城山": {
    name: "北郊",
    way: "jh 15"
  },
  "逍遙林": {
    name: "青石大道",
    way: "jh 16"
  },
  "開封": {
    name: "朱雀門",
    way: "jh 17"
  },
  "明教": {
    name: "小村",
    way: "jh 18"
  },
  "光明頂": {
    name: "小村",
    way: "jh 18"
  },
  "全真教": {
    name: "終南山路",
    way: "jh 19"
  },
  "古墓": {
    name: "山路",
    way: "jh 20"
  },
  "白駝山": {
    name: "戈壁",
    way: "jh 21"
  },
  "嵩山": {
    name: "太室闕",
    way: "jh 22"
  },
  "梅莊": {
    name: "柳樹林",
    way: "jh 23"
  },
  "寒梅莊": {
    name: "柳樹林",
    way: "jh 23"
  },
  "泰山": {
    name: "岱宗坊",
    way: "jh 24",
  },
  "鐵血大旗門": {
    name: "小路",
    way: "jh 25",
  },
  "大昭寺": {
    name: "草原",
    way: "jh 26",
  },
  "魔教": {
    name: "驛道",
    way: "jh 27",
  },
  "黑木崖": {
    name: "驛道",
    way: "jh 27",
  },
  "星宿海": {
    name: "天山下",
    way: "jh 28",
  }
};

var taofanMenArr = [];
var taofanMenTo = 0;
var taofanProcessDay = getStore("taofan_process");

// 监听聊天区
function taofanMon(b, type, subtype, msg) {
  if (taofanProcessDay == yjDayStr()) return; // 已打完。

  var isLocal = msg.indexOf("跨服") > -1;
  if (isLocal) return; // 含有"跨服"二字，是本服对跨服的提示，跳过跨服数据

  // 【系统】劇盜慌不擇路，逃往了全真教-終南山路
  var l = msg.match(/【系統】(.*)慌不擇路，逃往了(.*)-(.*)/);
  if (!l) return;
  //  l[1] = l[1];
  //  l[2] = l[2];
  //  l[3] = l[3];

  Log("FOUND TAOFAN:", l, taofanMenArr, msg);

  var matchKey = undefined;
  var len = taofanMenArr.length;
  // 若未设定过滤，监听所有
  if (len == 0) {
    matchKey = {
      name: l[1],
      star: false,
    };
  } else if (len == 1 && taofanMenArr[0] == '*') {
    matchKey = {
      name: l[1],
      star: true,
    };
  }

  // 监听指定的关键字
  for (var i = len - 1; i > -1; i--) {
    if (l[1] == taofanMenArr[i].name) {
      matchKey = {
        name: l[1],
        star: taofanMenArr[i].star
      }
      break;
    }
  }
  if (!matchKey) return;
  Log("MATCH TAOFAN:", msg);

  if (!matchKey.star || inBattle() || hasLeft()) {
    AutoAlert('本服逃犯:' + l[1] + " --- " + l[2], 30 * 1000);
    return;
  }

  var goKill = function(inHome) {
    if (!inHome) {
      AutoConfirm('本服逃犯:' + l[1] + " --- " + l[2], 10 * 1000, function() {
        goKill(true);
      });
      return;
    }

    // 去击杀
    var loc = zhou4Map[l[2]];
    if (!loc) {
      AutoConfirm("未找到目标路径:" + l[2] + "，回主页？", 30 * 1000, function() {
        go("jh 1;home");
      });
      return;
    }
    goPlace(loc.name, loc.way, function() {
      // 已到达目的地，开始执行杀操作
      autoFight({
        targetName: l[1],
        menKind: 0,
        menToFight: taofanMenTo,
        newOne: 1,
        doneFn: function(code, msg) {
          if (code != 0 && msg.indexOf("逃犯任務次數已達到上限") > -1) {
            taofanProcessDay = yjDayStr();
            setStore("taofan_process", taofanProcessDay);
          }
          AutoConfirm(msg + ":" + code + "," + loc.name + ", 回主页？", 30 * 1000, function() {
            go("jh 1;home");
          });
        },
      });
    });
  }
  checkHome(goKill);
  return;
}

function listenTaofanFunc(restore) {
  var taofanBtn = getBtn('监听逃犯');
  if (taofanBtn.innerHTML == '监听逃犯') {
    var init = function(val) {
      var valArr = val.split("|");
      var keyStr = "";
      if (valArr.length < 2) {
        keyStr = valArr[0];
      } else {
        taofanMenTo = parseInt(valArr[0])
        keyStr = valArr[1];
      }

      var keys = keyStr.split(",")
      taofanMenArr = [];
      for (var i = keys.length - 1; i > -1; i--) {
        if (keys[i].length == 0) {
          continue
        }
        var hasStar = keys[i].charAt(0) == "*";
        if (hasStar) {
          keys[i] = keys[i].substring(1);
        }

        taofanMenArr.push({
          name: keys[i],
          star: hasStar,
        });
      }
      taofanBtn.innerText = '停止逃犯';
      addSysMsgListener("listenTaofanFunc", "慌不擇路", taofanMon)
      setStore("taofan_status", 1);
      setStore("taofan_keys", val);
    }

    var storeKeys = getStore("taofan_keys")
    if (!storeKeys) {
      storeKeys = "0|*夜魔*二娘,夜魔*嶽老三,夜魔*雲老四";
    }
    if (!restore) {
      Input("请输入监听的关键字,以<span style='color:red'>|、英文逗号</span>分割，并在<span style='color:red'>本服</span>中挂机。" +
        "<br/>格式：击杀类型|逃犯词组" +
        "<br/>击杀类型：0杀守方(逃犯)，1杀攻方(捕快)。" +
        "<br/>逃犯词组：以<span style='color:red'>英文逗号</span>分割多个关键词，关键词前带*为自动寻路击杀，不带仅提示。匹配顺序为从左到右，匹配到即止。" +
        "<br/><span style='color:red'>例如：</span>" +
        "<br/><span style='color:blue'>0|*夜魔*二娘,夜魔*嶽老三,夜魔*雲老四</span> " +
		"<br/>自動擊殺出現的夜魔*二娘，夜魔*嶽老三、夜魔*雲老四出現時提醒但不自動擊殺。" +
        "<br/><span style='color:blue'>1|*</span> 杀所有逃犯中的捕快(攻方)。" +
        "<br/><span style='color:blue'>仅提示</span>：填空值。" +
        "<br/><br/>當前監聽：" + storeKeys, storeKeys,
        function(input) {
          var val = input.value;
          if (val == undefined) return;
          init(val);
        })
      return;
    }
    init(storeKeys);
  } else {
    taofanBtn.innerText = '监听逃犯';
    stopAutoFight();
    delSysMsgListener("listenTaofanFunc");
    setStore("taofan_status", 0);
  }
}

var zhou4MenArr = [userAreaName + "段老大"];
var zhou4MenTo = 0;
var zhou4ProcessDay = getStore("zhou4_process");

// 监听聊天区
function zhou4Mon(b, type, subtype, msg) {
  if (zhou4ProcessDay == yjDayStr()) return; // 今天已完成

  var isLocal = msg.indexOf("跨服") > -1;
  if (isLocal) return; // 含有"跨服"二字，是本服对跨服的提示，在跨服中监听要跳过

  // 【系统】[76-80区]段老大慌不择路，逃往了洛阳-龙门石窟
  var l = msg.match(/【系統】(.*)慌不擇路，逃往了(.*)-(.*)/);
  if (!l) return;

  Log("FOUND ZHOU4:", l, userAreaName, zhou4MenArr, msg);
  // 过滤非本区的逃犯
  if (!(l[1].indexOf(userAreaName) > -1)) return;
  if (!zhou4MenArr.contains(l[1])) return;
  Log("MATCH ZHOU4:", msg);

  if (inBattle()) {
    AutoAlert('跨服逃犯:' + l[1] + " --- " + l[2], 30 * 1000);
    return;
  }

  // 去击杀
  var loc = zhou4Map[l[2]];
  if (!loc) {
    AutoAlert("未找到目标路径:" + l[2], 30 * 1000);
    return;
  }
  goPlace(loc.name, loc.way, function() {
    // 已到达目的地，开始执行杀操作
    autoFight({
      targetName: l[1],
      menKind: 0,
      menToFight: zhou4MenTo,
      newOne: 1,
      doneFn: function(code, msg) {
        if (code != 0 && msg.indexOf("逃犯任務次數已達到上限") > -1) {
          zhou4ProcessDay = yjDayStr();
          setStore("zhou4_process", zhou4ProcessDay);
        }
        AutoAlert(msg + ":" + code + "," + loc.name, 30 * 1000);
      },
    });
  });
  return;
}

function zhou4Func(restore) {
  var zhou4Btn = getBtn('周四逃犯');
  if (zhou4Btn.innerHTML == '周四逃犯') {
    var init = function(to) {
      to = parseInt(to);
      switch (to) {
        case 0:
          break;
        case 1:
          break;
        default:
          Alert("输入有误，请输0或1, " + to);
          return;
      }
      zhou4MenTo = to;
      zhou4Btn.innerText = '停杀逃犯';
      addSysMsgListener("zhou4Func", "慌不择路", zhou4Mon);
      setStore("zhou4_status", 1);
      setStore("zhou4_to", to);
    };
    if (restore == 1) {
      init(getStore("zhou4_to"))
      return;
    }

    Input("请输入要击杀类型，并在<span style='color:red'>跨服</span>中挂机。" +
      "<br/>击杀类型：0，杀守方(段老大)；1，杀攻方(捕快)。" +
      "<br/><br/>当前：" + zhou4MenTo, zhou4MenTo,
      function(input) {
        var val = input.value;
        if (val == undefined) {
          return;
        }
        var to = parseInt(val);
        init(to);
      })
  } else {
    zhou4Btn.innerText = '周四逃犯';
    stopAutoFight();
    delSysMsgListener("zhou4Func")
    setStore("zhou4_status", 0);
  }
}

function qxSkillFriend(name) {
  switch (name) {
    case "宇文無敵":
      return 40000; // 已領悟破軍棍訣
    case "李玄霸":
      return 40000; // 已領悟玄胤天雷
    case "夏嶽卿":
      return 40000; // 已領悟天火飛錘
    case "玄月研":
      return 40000; // 已領悟玄天杖法
    case "穆妙羽":
      return 40000; // 已領悟九溪斷月槍
    case "烈九州":
      return 40000; // 已領悟昊雲破週斧
    case "厲滄若":
      return 40000; // 已領悟燎原百破
    case "八部龍將":
      return 40000; // 已領悟十怒絞龍索
    case "妙無心":
      return 40000; // 已領悟拈花解語鞭
    case "巫夜姬":
      return 40000; // 已領悟輝月杖法
    case "狼居胥":
      return 40000; // 已領悟四海斷潮斬
    case "風行騅":
      return 40000; // 已領悟萬流歸一
    case "風無痕":
      return 40000; // 已領悟千影百傷棍
    case "吳縝":
      return 40000; // 已領悟道種心魔經
    case "狐蒼雁":
      return 35000; // 已領悟幽影幻虛步
    case "護竺":
      return 35000; // 已領悟生生造化功
    case "李宇飛":
      return 25000; // 已領悟飛刀絕技
    case "龐統":
      return 25000; // 已領悟翻雲刀法
    case "逆風舞":
      return 25000; // 已領悟雪飲狂刀
    case "王蓉":
      return 25000; // 已領悟織冰劍法
    case "浪喚雨":
      return 25000; // 已領悟覆雨劍法
    case "火雲邪神":
      return 25000; // 已領悟如來神掌
    case "風南":
      return 25000; // 已領悟孔雀翎
    case "郭濟":
      return 25000; // 已領悟排雲掌法
    case "步驚鴻":
      return 25000; // 已領悟九天龍吟劍法
  }
  return 25000; // 默認兩萬五，以免對話超過
}

function isQxFullFriend(name, curFriendNum) {
  switch (name) {
    case "厲滄若":
      return curFriendNum >= 40000; // 已領悟燎原百破
    case "穆妙羽":
      return curFriendNum >= 40000; // 已領悟九溪斷月槍
    case "風無痕":
      return curFriendNum >= 40000; // 已領悟千影百傷棍
    case "宇文無敵":
      return curFriendNum >= 40000; // 已領悟破軍棍訣
    case "李玄霸":
      return curFriendNum >= 40000; // 已領悟玄胤天雷
    case "夏嶽卿":
      return curFriendNum >= 40000; // 已領悟天火飛錘
    case "妙無心":
      return curFriendNum >= 40000; // 已領悟拈花解語鞭
    case "八部龍將":
      return curFriendNum >= 40000; // 已領悟十怒絞龍索
    case "狼居胥":
      return curFriendNum >= 40000; // 已領悟四海斷潮斬
    case "烈九州":
      return curFriendNum >= 40000; // 已領悟昊雲破週斧
    case "玄月研":
      return curFriendNum >= 40000; // 已領悟玄天杖法
    case "巫夜姬":
      return curFriendNum >= 40000; // 已領悟輝月杖法
    case "吳縝":
      return curFriendNum >= 40000; // 已領悟道種心魔經
    case "風行騅":
      return curFriendNum >= 40000; // 已領悟萬流歸一
    case "狐蒼雁":
      return curFriendNum >= 35000; // 已領悟幽影幻虛步
    case "護竺":
      return curFriendNum >= 35000; // 已領悟生生造化功
    case "李宇飛":
      return curFriendNum >= 30000; // 已領悟飛刀絕技
    case "龐統":
      return curFriendNum >= 30000; // 已領悟翻雲刀法
    case "逆風舞":
      return curFriendNum >= 30000; // 已領悟雪飲狂刀
    case "王蓉":
      return curFriendNum >= 30000; // 已領悟織冰劍法
    case "浪喚雨":
      return curFriendNum >= 30000; // 已領悟覆雨劍法
    case "火雲邪神":
      return curFriendNum >= 30000; // 已領悟如來神掌
    case "風南":
      return curFriendNum >= 30000; // 已領悟孔雀翎
    case "郭濟":
      return curFriendNum >= 30000; // 已領悟排雲掌法
    case "步驚鴻":
      return curFriendNum >= 30000; // 已領悟九天龍吟劍法
  }
  return curFriendNum > 40000
}

function parseQxList(msg) {
  var el = document.createElement("div");
  el.innerHTML = msg;
  var tbody = el.getElementsByTagName("tbody")[0]
  var talkResult = [];
  var fullResult = [];
  for (var i = 0; i < tbody.childNodes.length; i++) {
    var node = tbody.childNodes[i];

    // 取名字
    var arr0 = node.childNodes[0].innerHTML.split("href;0;");
    var names = arr0[1].split("(");
    var name = dispatchChineseMsg(names[0]);
    // 取親密數
    var friendNum = 0;
    if (names.length > 1) {
      friendNum = parseInt(names[1].substring(0, names[1].length - 1))
    }
    // 取是否親密已滿
    var isFriendFull = isQxFullFriend(name, friendNum);
    var isSkillFull = qxSkillFriend(name) <= friendNum;
    // 出是否出師
    getMaster = node.childNodes[1].innerHTML.indexOf("未出世") < 0;
    inMasterHome = node.childNodes[2].innerHTML.indexOf("師門") > -1;

    var obj = {
      name: name,
      friendNum: friendNum,
      isFriendFull: isFriendFull,
      isSkillFull: isSkillFull,
      getMaster: getMaster,
      inMasterHome: inMasterHome,
      hasTalk: 0,
      index: i,
      way: "find_task_road qixia " + i,
    };
    if (isFriendFull) {
      fullResult.push(obj);
    } else {
      talkResult.push(obj);
    }
  }

  return {
    qxList: fullResult.concat(talkResult),
    // 找指定的奇俠數據
    get: function(name) {
      for (var i = this.qxList.length - 1; i > -1; i--) {
        if (this.qxList[i].name == name) return this.qxList[i];
      }
    },
  }
}

function getQxList(doneFn) {
  addDispatchListener("getQxList", function(b, type, subtype, msg) {
    if (type != "show_html_page") return;
    go("prev") // 返回按鍵
    delDispatchListener("getQxList");
    var result = parseQxList(msg);
    if (doneFn) doneFn(result);
  });
  go("open jhqx");
}

function qxSave(qxList, msg) {
  qxTalks = "";
  for (var i = 0; i < qxList.length; i++) {
    qxTalks += qxList[i].hasTalk == 1 ? qxList[i].name + "," : "";
  }
  setStore("qixia_prize", yjDayStr() + "|" + qxTalks);
  Alert(msg);
  return;
}

var fixNoTalkTimeout = null;

function stopQxPrize() {
  delDispatchListener("getQxPrize");
  if (fixNoTalkTimeout != null) {
    clearTimeout(fixNoTalkTimeout);
    fixNoTalkTimeout = null;
  }
};
// 領取奇俠朱果
function getQxPrize(qxList, idx) {
  // 領不滿的奇俠果子
  var qxListLen = qxList.length;
  if (idx >= qxListLen) {
    stopQxPrize();
    qxSave(qxList, "已完成當前可用領取,未領取的請入世後點擊此功能繼續 ");
	home;
    return;
  }

  // 必須按所組的組數倒序領取
  var talkTo = qxList[qxListLen - idx - 1];
  if (talkTo.hasTalk == 1) {
    // 已對話過,下一個
    getQxPrize(qxList, idx + 1);
    return;
  }

  if (!talkTo.getMaster || talkTo.inMasterHome) {

    AutoConfirm(talkTo.name + "未入世。跳過？", 10 * 1000, function() {
      getQxPrize(qxList, idx + 1);
    }, function() {
      stopQxPrize();
      qxSave(qxList, "進度已緩存， 請入世後點擊此功能繼續 ");
    });

    return;
  }

  var qxCode = "";
  var getQxPrizeListener = function(b, type, subtype, msg) {
    // 到達指定的奇俠位置
    if (type == "jh" && subtype == "info") {
      // 執行對話任務
      for (var val of b.values()) {
        // "fengwuhen_1521721328_65,風無痕,0")
        if (val.indexOf(talkTo.name) < 0) continue;
        var arr = val.split(",");
        qxCode = arr[0];
        go("ask " + qxCode);
        if (fixNoTalkTimeout) {
          clearTimeout(fixNoTalkTimeout);
          fixNoTalkTimeout = null;
        }
        fixNoTalkTimeout = setTimeout(function() {
          // 發送一個對話指令,因為有的奇俠會卡對話,比如:巫夜姬
          getQxPrizeListener(new Map(), "main_msg", "", talkTo.name + "結束對話");
        }, 5 * 1000)
        return;
      }
    } else if (type == "main_msg") {
      if (!msg) return;
      if (msg.indexOf("今日亲密度操作次数") > -1 || msg.indexOf("今日親密度操作次數") > -1) {
        // 未进行奇侠亲密度对话，中断此过程
        stopQxPrize();
        qxSave(qxList, "你還未進行奇俠親密度對話,請先完成親密度對話!!!");
        return;
      }

      // 對話成功, 繼續對話
      if (msg.indexOf("今日奇俠贈送次數") > -1) {
        var l = msg.match(/今日奇俠贈送次數(.*)\/(.*)，(.*)贈送次數(.*)\/(.*)/);
        if (l && parseInt(l[4]) == parseInt(l[5])) {
          // 對話已滿, 下一個
          delDispatchListener("getQxPrize")
          talkTo.hasTalk = 1;
          getQxPrize(qxList, idx + 1);
          return;
        }
        go("ask " + qxCode);
        return;
      }

      var nameMsg = msg;
      if (nameMsg.indexOf(talkTo.name) == 0) {
        // 此人對話已結束
        delDispatchListener("getQxPrize")
        talkTo.hasTalk = 1;
        getQxPrize(qxList, idx + 1);
        return;
      }
    } else if (type == "unknow_command") {
      // 需要對話的奇俠不在這裡，重新再來
      delDispatchListener("getQxPrize")
      if (inBattle()) {
        stopQxPrize();
        qxSave(idx, "進度已緩存，請戰鬥結束後點此功能繼續");
        return;
      }
      // getQxPrize(qxList, idx);
      go(talkTo.way);
      return;
    }
  }
  addDispatchListener("getQxPrize", getQxPrizeListener);
  go(talkTo.way);
}

function lingzhuguoFunc() {
  // 讀取未領取的進度數據
  var timeStr = FormatDate(new Date(new Date() - 6 * 3600 * 1000), "yyyyMMdd");
  var talkStatus = "";

  var prizeInfo = getStore("qixia_prize");
  // 存在進度數據
  if (prizeInfo != null) {
    var p = prizeInfo.split("|");
    if (p[0] != timeStr) {
      // 新的一天，需要重新来
      talkStatus = "";
    } else {
      talkStatus = p[1];
    }
  }
  Input("即將開始領朱果.<br/>請輸入已領取列表,不輸入時使用上一次進度繼續,每天6點重置:", talkStatus, function(input) {
    var val = input.value;
    if (!val) val = "";
    getQxList(function(result) {
      var statusArr = val.split(",");
      // 生成領取狀態數據
      for (var i = 0; i < result.qxList.length; i++) {
        result.qxList[i].hasTalk = statusArr.contains(result.qxList[i].name) ? 1 : 0;
      }
      getQxPrize(result.qxList, 0);
    })
  })
}

var inQixia = 0;
var qxBakCode = "";

function friendTo(kind, code, times) {
  qxBakCode = code; // backup
  var nameArr = code.split("_");
  switch (kind) {
    case 0:
      // 僅對話
      go("ask " + code)
      return;
    case 1:
      if (times < 3 || times > 4) {
        // 僅對話
        go("ask " + code);
        return
      } else if (times > 3) {
        // 贈送15金錠
        go("auto_zsjd20_" + nameArr[0])
        return;
      } else if (times > 2) {
        // 贈送1金錠
        go("auto_zsjd_" + nameArr[0])
        return;
      }
      return;
    case 15:
      // 贈送15金錠
      go("auto_zsjd20_" + nameArr[0])
      return;
  }
  return;
}

function goMijingPlace(name, doneFn) {
  switch (name) {
    case "山坳":
	case "山坳":
      goPlace(name, "jh 1;e;n;n;n;n;n;", doneFn);
      break;
    case "桃花泉":
	case "桃花泉":
      goPlace(name, "jh 3;s;s;s;s;s;nw;n;n;e;", doneFn);
      break;
    case "千尺幢":
	case "千尺幢":
      goPlace(name, "jh 4;n;n;n;n", doneFn);
      break;
    case "猢猻愁":
	case "猢狲愁":
      goPlace(name, "jh 4;n;n;n;n;n;n;e;n;n;", doneFn);
      break;
    case "潭畔草地":
	case "潭畔草地":
      goPlace(name, "jh 4;n;n;n;n;n;n;n;event_1_91604710;s;s;s;", doneFn);
      break;
    case "玉女峰":
	case "玉女峰":
      goPlace(name, "jh 4;n;n;n;n;n;n;n;n;w;", doneFn);
      break;
    case "長空棧道":
	case "长空栈道":
      goPlace(name, "jh 4;n;n;n;n;n;n;n;n;n;e;", doneFn);
      break;
    case "臨淵石台":
	case "临渊石台":
      goPlace(name, "jh 4;n;n;n;n;n;n;n;n;n;e;n;", doneFn);
      break;
    case "沙丘小洞":
	case "沙丘小洞":
      goPlace(name, "jh 6;event_1_98623439;ne;n;ne;ne;ne;event_1_97428251;", doneFn);
      break;
    case "九老洞":
	case "九老洞":
      goPlace(name, "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill?看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;nw;sw;w;nw;w;", doneFn);
      break;
    case "懸根松":
	case "悬根松":
      goPlace(name, "jh 9;n;w;", doneFn);
      break;
    case "夕陽嶺":
	case "夕阳岭":
      goPlace(name, "jh 9;n;n;e;", doneFn);
      break;
    case "青雲坪":
	case "青云坪":
      goPlace(name, "jh 13;e;s;s;w;w;", doneFn);
      break;
    case "玉壁瀑布":
	case "玉壁瀑布":
      goPlace(name, "jh 16;s;s;s;s;e;n;e;", doneFn);
      break;
    case "湖邊":
	case "湖边":
      goPlace(name, "jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w;", doneFn);
      break;
    case "碧水寒潭":
	case "碧水寒潭":
      goPlace(name, "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e;se;se;e;", doneFn);
      break;
    case "寒水潭":
	case "寒水潭":
      goPlace(name, "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;e;se;", doneFn);
      break;
    case "懸崖":
	case "悬崖":
      goPlace(name, "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;s;e;", doneFn);
      break;
    case "戈壁":
	case "戈壁":
      goPlace(name, "jh 21;", doneFn);
      break;
    case "盧崖瀑布":
	case "卢崖瀑布":
      goPlace(name, "jh 22;n;n;n;n;e;n", doneFn);
      break;
    case "啟母石":
	case "启母石":
      goPlace(name, "jh 22;n;n;w;w;", doneFn);
      break;
    case "無極洞":
    case "無極老姆洞":
	case "无极洞":
	case "无极老姆洞":
      goPlace(name, "jh 22;n;n;w;n;n;n;n;", doneFn);
      break;
    case "山溪畔":
	case "山溪畔":
      goPlace(name, "jh 22;n;n;w;n;n;n;n;event_1_88705407;s;s;", doneFn);
      break;
    case "奇槐坡":
	case "奇槐坡":
      goPlace(name, "jh 23;n;n;n;n;n;n;n;n;", doneFn);
      break;
    case "天梯":
	case "天梯":
      goPlace(name, "jh 24;n;n;n;", doneFn);
      break;
    case "小洞天":
	case "小洞天":
      goPlace(name, "jh 24;n;n;n;n;e;e;", doneFn);
      break;
    case "雲步橋":
	case "云步桥":
      goPlace(name, "jh 24;n;n;n;n;n;n;n;n;n;", doneFn);
      break;
    case "觀景台":
	case "观景台":
      goPlace(name, "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e;n;", doneFn);
      break;
    case "危崖前":
	case "危崖前":
      goPlace(name, "jh 25;w;", doneFn);
      break;
    case "草原":
	case "草原":
      goPlace(name, "jh 26;w;", doneFn);
      break;
    case "無名峽谷":
    case "無名山峽谷":
	case "无名峡谷":
	case "无名山峡谷":
      // place?洞口 -- 到宮門
      // place?無名山峽谷
      goPlace(name, "jh 29;n;n;n;n;event_1_60035830;place?平台;event_1_65661209;place?無名山峽谷", doneFn)
      break;
    default:
      Alert("未找到位置：" + name);
      return;
  }
}

function stopFriendQixia() {
  delDispatchListener("startFriendQixia");
  delDispatchListener("goMijingPlace");
  inQixia = 0;
};

var curQxSkillConfirm = false;
var curQxFriend = null;
var curQxFriendTimes = 0;
var curQxAskTimeout = null;
var mijingTimes = 0;
var saodang = false;

function startFriendQixia(qxName, times, friendKind, doneFn) {
  if (curQxFriendTimes >= 20) {
    stopFriendQixia();
    if (doneFn) doneFn();
    return;
  }
  mijingTimes = times;
  inQixia = 1;
  saodang = false;
  curQxSkillConfirm = false

  var getMijing = false;
  var mijingListener = function(msg) {
    addDispatchListener("goMijingPlace", function(b, type, subtype, msg) {
      if (type == "home" && subtype == "index") {
        mijingTimes++;
        // 退出的秘境
        delDispatchListener("goMijingPlace");
        getMijing = false;
        startFriendQixia(qxName, mijingTimes, friendKind, doneFn);
        return;
      }

      // (msg.indexOf("你在這兒一番搜尋，竟找到一條秘徑，來到了一個絕密的所在")>0){
      if (type != "jh" || subtype != "info") return;
      for (var i in b.elements) {
        var key = b.elements[i].key;
        var val = b.elements[i].value;
        if (!val) continue;
        if (val != "secret_op1" && val.indexOf("_op1") > -1) {
          go(val); // 找果子
          continue;
        }

        // 有掃蕩1的數據
        if (val.indexOf("_saodang") > 0) {
          if (saodang) continue;
          saodang = true;
          // 執行自動掃蕩
          mijingFunc();
          // 繼續遍歷翻找事件
          continue;
        }

        // 搜找可掃盪的目標
        if (val.indexOf("event") < 0) continue;
        // 如果是事件，進一步校驗事件的名稱
        var name = key + "_name";
        var nameVal = b.get(name);
        if (!nameVal) continue;

        if (nameVal.indexOf("掃盪") > -1) {
          if (saodang) continue;
          saodang = true;
          // 執行自動掃蕩
          mijingFunc();
          // 繼續遍歷翻找事件
          continue;
        } else {
          go(val); // 去找果子
          continue;
        }
      }

      // 先查找掃蕩事件，最后點擊仔細尋找
      for (var i in b.elements) {
        var key = b.elements[i].key;
        var val = b.elements[i].value;
        if (!val) continue;
        if (val != "secret_op1") continue
        go("secret_op1", {
          btn: 1
        });
        go("home");
        return;
      }
    });
    go("find_task_road secret;");
  };

  addDispatchListener("startFriendQixia", function(b, type, subtype, msg) {

    if (type == "show_html_page") {
      clearTimeout(curQxAskTimeout);

      // 讀取奇俠數據
      var searchMsg = msg;
      // 檢查是否已有探索的任務，若已有，先執行。
      var l = searchMsg.match(/(.*)對你悄聲道：你現在去(.*)，應當會有發現……/);
      if (l) {
        // 執行秘境任務
        getMijing = true;
        delDispatchListener("startFriendQixia")
        var target = l[2];
        goMijingPlace(target, mijingListener);
        return;
      }

      var qxList = parseQxList(msg);
      if (!qxList) return;
      var matchQx = qxList.get(qxName);
      if (matchQx == null || !matchQx.getMaster || matchQx.inMasterHome) {
        stopFriendQixia();
        Alert(qxName + "未入世");
        if (doneFn) doneFn(0);
        return;
      }
      curQxFriend = matchQx;

      var cFunc = function() {
        // 去執行贈送任務
        go(curQxFriend.way);
      }

      if (!curQxFriend.isSkillFull || curQxSkillConfirm) {
        cFunc();
        return;
      }
      AutoCancel("技能親密度已足夠" + qxSkillFriend(curQxFriend.name) + "(" + curQxFriend.friendNum + ")，繼續對話？", 10 * 1000, function() {
        curQxSkillConfirm = true;
        cFunc();
      }, function() {
        stopFriendQixia();
        if (doneFn) doneFn(0);
      });
      return;
    } else if (type == "jh" && subtype == "info") {
      clearTimeout(curQxAskTimeout);
      if (curQxFriendTimes >= 20) {
        stopFriendQixia();
        if (doneFn) doneFn();
        return;
      }
      // 執行贈送任務
      for (var val of b.values()) {
        if (val.indexOf(qxName) < 0) continue; // "fengwuhen_1521721328_65,風無痕,0")
        var arr = val.split(",");
        friendTo(friendKind, arr[0], mijingTimes);
        return;
      }
      return;
    } else if (type == "main_msg" && msg) {
      if (msg.indexOf("今日親密度操作次數") > -1) {
        var l = msg.match(/(.*)今日親密度操作次數\((.*)\/(.*)\)/)
        var curNum = parseInt(l[2]);
        var maxNum = parseInt(l[3]);
        Log(curNum + "/" + maxNum);
        curQxFriendTimes = curNum;
        if (curNum >= maxNum) {
          stopFriendQixia();
		  go(home);
          if (doneFn) doneFn(1);
          return;
        }

        // 繼續下一個對話
        clearTimeout(curQxAskTimeout);
        curQxAskTimeout = setTimeout(function() {
          if (curQxFriendTimes >= 20) {
            stopFriendQixia();
            if (doneFn) doneFn();
            return;
          }
          if (getMijing) return;
          if (!curQxFriend.isSkillFull || curQxSkillConfirm) {
            friendTo(friendKind, qxBakCode, mijingTimes);
            return;
          }
          AutoCancel("技能親密度已足夠" + qxSkillFriend(curQxFriend.name) + "(" + curQxFriend.friendNum + ")，继续对话？", 10 * 1000, function() {
            friendTo(friendKind, qxBakCode, mijingTimes);
            return;
          }, function() {
            stopFriendQixia();
            if (doneFn) doneFn(0);
          });
          return;
        }, 500);
        return;
      } else if (msg.indexOf("親密度增加") > -1) {
        if (!curQxFriend) return;
        // 更新親密度
        var l = msg.match(/你和(.*)的親密度增加了(.*)點/);
        var curNum = l[2];
        curQxFriend.friendNum += parseInt(curNum);
        curQxFriend.isFriendFull = isQxFullFriend(l[1], curQxFriend.friendNum);
        curQxFriend.isSkillFull = qxSkillFriend(l[1]) <= curQxFriend.friendNum;
      }
    } else if (type == "notice") {
      // 解析奇俠的内容
      switch (subtype) {
        case "notify_fail":
          go("open jhqx");
          // stopFriendQixia();
          // if (doneFn) doneFn(0);
          return;
      }

      var l = msg.match(/(.*)對你悄聲道：你現在去(.*)，應當會有發現……/);
      if (l) {
        clearTimeout(curQxAskTimeout);
        getMijing = true;
        // 找到並執行秘境任務
        delDispatchListener("startFriendQixia");
        var target = l[2];
        goMijingPlace(target, mijingListener);
        return;
      }
      return;
    } // end notice
  }); // end startFriendQixia
  go("open jhqx");
};

// 僅對話，用於小號
function jinduihuaFunc() {
  var jinduihuaBtn = getBtn("仅对话");
  if (jinduihuaBtn.innerHTML == "仅对话") {
    var inputName = getStore("qixia_name");
    if (inputName == null) inputName = "";
    Input("請輸入需要對話親密度的奇俠名稱", inputName, function(input) {
      var val = input.value;
      if (val == null) {
        return;
      }
      setStore("qixia_name", val);
      jinduihuaBtn.innerText = "停奇俠";
      curQxFriendTimes = 0;
      startFriendQixia(val, 0, 0, function(suc) {
        jinduihuaBtn.innerText = "仅对话";
        stopFriendQixia();
        return;
      });
    })
    return;
  } else {
    jinduihuaBtn.innerText = "仅对话";
    stopFriendQixia();
    return;
  }
}

// 自動1/15
function yishiwuFunc() {
  var yishiwuBtn = getBtn("五秘境");
  if (yishiwuBtn.innerHTML == "五秘境") {
    var inputName = getStore("qixia_name");
    if (inputName == null) inputName = "";
    Input("請輸入需要贈與金錠的奇俠名稱", inputName, function(input) {
      var val = input.value;
      if (val == null) {
        return;
      }
      setStore("qixia_name", val);
      Input("請輸入已出的探索數(正在探索需要出来後才算一次)", 0, function(input) {
        var times = input.value;
        if (times == undefined) return;
        var times = parseInt(times);
        yishiwuBtn.innerText = "停奇俠";
        curQxFriendTimes = 0;
        startFriendQixia(val, times, 1, function(suc) {
          yishiwuBtn.innerText = "五秘境";
          stopFriendQixia();
          return;
        });
      });
    })
    return;
  } else {
    yishiwuBtn.innerText = "五秘境";
    stopFriendQixia();
    return;
  }
}
// 自動全15
function quanshiwuFunc() {
  var quanshiwuBtn = getBtn("全金锭");
  if (quanshiwuBtn.innerHTML == "全金锭") {
    var inputName = getStore("qixia_name");
    if (inputName == null) inputName = "";
    Input("請輸入需要贈與15金錠的奇俠名稱", inputName, function(input) {
      var val = input.value;
      if (val == null) {
        return;
      }
      setStore("qixia_name", val);
      quanshiwuBtn.innerText = "停奇俠";
      curQxFriendTimes = 0;
      startFriendQixia(val, 0, 15, function(suc) {
        quanshiwuBtn.innerText = "全金锭";
        stopFriendQixia();
        return;
      });
    })
    return;
  } else {
    quanshiwuBtn.innerText = "全金锭";
    stopFriendQixia();
    return;
  }
}


// 秘境優化----------------------------------------------------------------------------------------------------------------
function mijingFunc() {
  var roominfor = g_obj_map.get("msg_room").get("map_id");
  var mijingid = [
    "tianlongshan", "dafuchuan", "fomenshiku", "dilongling", "luanshishan",
    "lvzhou", "taohuadu", "daojiangu", "baguamen", "lvshuige",
    "nanmanzhidi", "fengduguicheng", "leichishan", "binhaigucheng", "yaowanggu",
    "dixiamigong", "langhuanyudong", "shanya", "duzhanglin", "qiaoyinxiaocun",
    "lianhuashanmai", "liandanshi",
  ];
  if (mijingid.indexOf(roominfor) == -1) {
    Alert("當前秘境不支持優化:" + roominfor);
    return;
  } else if (roominfor == 'wujinshenyuan') {
    wujinFunc();
  }
  // 掃描當前的按鈕
  var btnList = $(".cmd_click3");
  var thisonclick = null;
  var targetCode = null;
  for (var i = 0; i < btnList.length; i++) {
    if (btnList[i].innerText.indexOf("掃盪") < 0) continue
    thisonclick = btnList[i].getAttribute('onclick');
    var targetCode = thisonclick.split("'")[1];
    startOptimize(roominfor, targetCode);
  }
}

function isOptimize(mapid, zhuguo, xuantie) {
  // 判斷結果
  switch (mapid) {
    case "liandanshi":
      return zhuguo > 2900 && xuantie > 2;
    case "lianhuashanmai":
      return zhuguo > 2900 && xuantie > 2;
    case "qiaoyinxiaocun":
      return zhuguo >= 2900 && xuantie > 2;
    case "duzhanglin":
      return zhuguo >= 2900 && xuantie > 2;
    case "shanya":
      return zhuguo >= 2900 && xuantie > 2;
    case "langhuanyudong":
      return zhuguo >= 2900 && xuantie > 2;
    case "dixiamigong":
      return zhuguo >= 2900 && xuantie > 2;
    case "yaowanggu":
      return zhuguo >= 5950 && xuantie > 4;
    case "binhaigucheng":
      return zhuguo >= 3390;
    case "leichishan":
      return zhuguo >= 5950 && xuantie > 4;
    case "fengduguicheng":
      return zhuguo >= 3895;
    case "nanmanzhidi":
      return zhuguo >= 3895;
    case "daojiangu":
      return zhuguo >= 1535;
    case "taohuadu":
      return zhuguo >= 1785;
    case "lvshuige":
      return zhuguo >= 1255;
    case "lvzhou":
      return zhuguo >= 2035;
    case "luanshishan":
      return zhuguo >= 2350;
    case "dilongling":
      return zhuguo >= 2385;
    case "fomenshiku":
      return zhuguo >= 2425;
    case "dafuchuan":
      return zhuguo >= 3090;
    case "tianlongshan":
      return zhuguo >= 3100;
    case "baguamen":
      return zhuguo >= 3635;
  }
  return false
}

function startOptimize(mapid, eCode) {
  addDispatchListener("startOptimize", function(b, type, subtype, msg) {
    var type = b.get("type");
    if (type != "prompt") return;
    // 接受到結果，刪除監聽器
    delDispatchListener("startOptimize");

    // 解析結果
    var msg = b.get("msg");
    var val1 = msg.split("朱果x")[1];
    var val1 = val1.substring(0, val1.length - 1);
    var zhuguo = parseInt(val1);
    if (zhuguo == 0) {
      Alert("當前掃蕩出錯了：" + msg);
      return;
    }
    var val2 = msg.split("、")[0].split("玄鐵令x")[1];
    var xuantie = parseInt(val2);
    if (isOptimize(mapid, zhuguo, xuantie)) {
      AutoConfirm("找到可領結果:玄鐵令x" + xuantie + "、朱果x" + zhuguo, 10 * 1000, function() {
        go(eCode + " go");
		console.log('點掃蕩')
      });
      return;
    } else {
      startOptimize(mapid, eCode);
      return;
    }
  })
  go(eCode); // 點掃蕩
}

// 秘境優化----------------------------------------------------------------------------------------------------------------
function mijingFuncY(ty) {
  var roominfor = g_obj_map.get("msg_room").get("map_id");
  var mijingid = [
    "tianlongshan", "dafuchuan", "fomenshiku", "dilongling", "luanshishan",
    "lvzhou", "taohuadu", "daojiangu", "baguamen", "lvshuige",
    "nanmanzhidi", "fengduguicheng", "leichishan", "binhaigucheng", "yaowanggu",
    "dixiamigong", "langhuanyudong", "shanya", "duzhanglin", "qiaoyinxiaocun",
    "lianhuashanmai", "liandanshi",
  ];
  if (mijingid.indexOf(roominfor) == -1) {
    Alert("當前秘境不支持優化:" + roominfor);
    return;
  } else if (roominfor == 'wujinshenyuan') {
    wujinFunc();
  }
  // 掃描當前的按鈕
  var btnList = $(".cmd_click3");
  var thisonclick = null;
  var targetCode = null;
  for (var i = 0; i < btnList.length; i++) {
    if (btnList[i].innerText.indexOf("掃盪") < 0) continue
    thisonclick = btnList[i].getAttribute('onclick');
    var targetCode = thisonclick.split("'")[1];
    startOptimizeY(roominfor, targetCode, ty);
  }
}

function startOptimizeY(mapid, eCode, ty) {
  addDispatchListener("startOptimize", function(b, type, subtype, msg) {
    var type = b.get("type");
    if (type != "prompt") return;
    // 接受到結果，刪除監聽器
    delDispatchListener("startOptimize");

    // 解析結果
    var msg = b.get("msg");
    var val1 = msg.split("朱果x")[1];
    var val1 = val1.substring(0, val1.length - 1);
    var zhuguo = parseInt(val1);
    if (zhuguo == 0) {
      Alert("當前掃蕩出錯了：" + msg);
      return;
    }
    var val2 = msg.split("、")[0].split("玄鐵令x")[1];
    var xuantie = parseInt(val2);
    if (isOptimize(mapid, zhuguo, xuantie)) {
      AutoConfirm("找到可領結果:玄鐵令x" + xuantie + "、朱果x" + zhuguo, 10 * 1000, function() {
        go(eCode + " go");
		if (ty == 'next') {
		  newYMLB_go(idxs)
		} else {
		  newYMLB_go(-1)
		}
      });
      return;
    } else {
	  startOptimizeY(mapid, eCode, ty);
      return;
    }
  })
  go(eCode); // 點掃蕩
}

// 瑯嬛玉洞--------------------------------------------------
function langhuanFunc() {
  resetCmdTimer(1000);
  go("event_1_61856223;nw;event_1_92817399;nw;event_1_92817399;w;event_1_91110342;s;event_1_74276536;se;event_1_14726005;sw;event_1_66980486;nw;event_1_39972900;nw;event_1_61689122;w;event_1_19336706;s;event_1_30457951;sw;event_1_96023188;s;");
}

// 无尽深渊-------------------------------------------------
function wujinFunc() {
  resetCmdTimer(500);
  goPlace("無盡深淵深處", "e;e;s;w;w;s;s;e;n;e;s;e;e;n;w;n;e;n;w;", function() {
    resetCmdTimer(200);
  }, function(b, type, subtype, msg) {
    if (type != "jh" || subtype != "info") return;
    for (var key of b.keys()) {
      var val = b.get(key);
      // 搜找可扫荡的目标
      if (val.indexOf("event") < 0) continue;
      // 如果是事件，进一步校验事件的名称
      var name = key + "_name";
      var nameVal = b.get(name);
      if (!nameVal) continue;
      goFast(val); // 去找果子
    }
  });
}

// 地下迷宫-------------------------------------------------
function dixiamigongFunc() {
  go("event_1_82876458;e;event_1_82876458;e;event_1_82876458;s;event_1_82876458;w;event_1_82876458;w;event_1_82876458;s;event_1_82876458;e;event_1_82876458;e;event_1_82876458;s;event_1_82876458;w;event_1_82876458;w;event_1_82876458;w;event_1_82876458;n;event_1_82876458;n;event_1_82876458;n;event_1_82876458;n;event_1_82876458;");
}

//逢义礼包
function fengyi(done) {
  var ignoreName = ['兌換禮包', '1元禮包'];
  var npcName = [];
  var lookIdx = 0;
  addDispatchListener("snow_libao", function(b, type, subtype, msg) {
    switch (type) {
      case "jh":
        for (var key of b.keys()) {
          if (key.indexOf("npc") != 0) continue;
          var val = b.get(key);
          npcName.push(val.split(",")[0]);
        }
        go("look_npc " + npcName[0]);
        break;
      case "look_npc":
        for (var key of b.keys()) {
          var val = dispatchMsg(b.get(key));
          if (val.indexOf("每日福利") < 0 && val.indexOf("禮包") < 0 && val.indexOf("領取會員") < 0 && val.indexOf("簽到") < 0) continue;
          if (ignoreName.contains(val)) continue;
          var cmd = b.get(key.split("_name")[0]);
          if (!cmd) continue;
          WriteToScreen("領取:" + val);
          go(cmd, {
            btn: 1,
          });
        }

        lookIdx++;
        if (lookIdx < npcName.length) {
          go("look_npc " + npcName[lookIdx]);
        } else {
          delDispatchListener("snow_libao");
          Log("done", lookIdx, npcName.length, npcName);
          if (done) done();
        }
        break;
    }
  });
  go("jh 1;event_1_45018293");
}

function ssign(idx) {
  // 结束签到
  if (idx == -1) {
    taskLocking = false;
    go("rank go 233;s;s;s;s;s;s;sw;diaoyu");
    return;
  }
  taskLocking = true;
  idx++;
  var next = function() {
    ssign(idx);
  }
  var ends = function() {
	ssign(-1)
  }
  switch (idx) {
    case 1:
      //扬州签到
      execNav('jh 1;w;event_1_76648488;event_1_21318613;jh 5;n;n;n;w;sign7;e;s;e', function() {
        addDispatchListener("shuanger_libao", function(b, type, subtype, msg) {
          if (type != "look_npc") return;
          delDispatchListener("shuanger_libao");
          for (var i in b.elements) {
            if (!b.elements[i].value || b.elements[i].value.indexOf("event_") < 0) continue;
            go(b.elements[i].value, {
              btn: 1,
            });
          }
          next();
        });
        // go('event_1_1278209;event_1_85209776;event_1_67345350', next);
        go("look_npc yangzhou_yangzhou9");
      });
      return
    case 2:
      fengyi(next);
      return;
	case 3:
      go('home;sleep_hanyuchuang;exercise stop;exercise', next); // 寒玉床
      return
	case 4:
      go('shop money_buy mny_shop2_N_10', next); //买引路蜂10个
      return;
	case 5:
	  go("home;vip drops;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu", function() {
        go("vip finish_sort;vip finish_sort;vip finish_sort;vip finish_sort;vip finish_sort", next);
      })
      return;
    case 6:
      go('vip finish_fb dulongzhai;vip finish_fb dulongzhai;vip finish_fb junying;vip finish_fb junying;vip finish_fb beidou;vip finish_fb beidou;vip finish_fb youling;vip finish_fb youling;vip finish_fb siyu;vip finish_fb changleweiyang;vip finish_fb heishuihuangling;vip finish_fb jiandangfenglingdu;vip finish_fb tianshanlongxue', next); //副本掃蕩
      return;
    case 7:
      execNav('jh 1;e;n;e;e', function() {
        go('event_1_44731074;event_1_8041045;event_1_8041045;event_1_29721519;event_1_60133236;home', ends); //消费积分和谜题卡和狗年券
      })
      return
    default:
      // 若找不到，执行下一个
      break;
  }
  ssign(idx);
}

// 白玉堂礼包
function baiyutang(done) {
  var ignoreName = ['兌換禮包', '1元禮包'];
  var npcName = [];
  var lookIdx = 0;
  addDispatchListener("kaifeng_libao", function(b, type, subtype, msg) {
    switch (type) {
      case "look_npc":
        for (var key of b.keys()) {
          var val = dispatchMsg(b.get(key));
          if (val.indexOf("礼包") < 0) continue;
          if (ignoreName.contains(val)) continue;
          var cmd = b.get(key.split("_name")[0]);
          if (!cmd) continue;
          Log("FOUND:" + val);
          go(cmd, {
            btn: 1,
          });
        }

        delDispatchListener("kaifeng_libao");
        Log("done", lookIdx, npcName.length, npcName);
        if (done) done();
        break;
    }
  });
  execNav("jh 17;n;look_npc snow_baiyutang");
}


var execNavCmdStack = null;

function execNavStack(b, type, subtype, msg) {
  if (type != "vs" || subtype != "combat_result") return;
  delBattleListener("execNavStack");
  // 战斗结束恢复栈数据继续执行寻路
  if (!execNavCmdStack) return;
  Log("restore nav stack", execNavCmdStack);
  execNavCmd(execNavCmdStack.paths, execNavCmdStack.params, execNavCmdStack.index);
}

// params = {
//   opp:false, // 正向执行还是反向执行
//   doneFn:function(){}, // 完成的回调
//   stageFn: function(b,type,subtype,msg){}, // 场景切换的回调(type=="jh" && subtype=="info");
//   interruptFn:function(){return false}, // 是否中断执行
// }
var execNavTimeout = null;

function clearNavTimeout() {
  clearTimeout(execNavTimeout);
  execNavTimeout = null;
}

function execNavCmd(paths, params, idx) {
  if (idx == undefined) idx = 0;
  if (!params) {
    console.log("need params");
    return;
  }
  if (params.interruptFn && params.interruptFn()) {
    taskLocking = false;
    if (params.doneFn) params.doneFn(-2, "user interrupt");
    return;
  }

  if (!paths || paths.length == idx) {
    taskLocking = false;
    if (params.doneFn) params.doneFn(0, "done");
    // go("golook_room"); // 再发送一个江湖事件
    return;
  }

  taskLocking = true;

  var i = idx;
  for (; i < paths.length; i++) {
    if (paths[i].length == 0) continue;
    if (paths[i].charAt(0) == ".") continue;

    // 去杀人
    if (paths[i].indexOf("kill?") > -1) {
      if (params.opp) continue;

      autoFight({
        targetName: paths[i].substring(5),
        menKind: 0,
        menToFight: 0,
        anyOne: true,
        tryTimes: 3,
        doneFn: function(code, msg) {
          if (code == 0) {
            go('prev_combat', function() {
              setTimeout(function() {
                execNavCmd(paths, params, i + 1);
              }, 500);
            }); // 关闭战斗界面再摸
          } else {
            execNavCmd(paths, params, i + 1);
          }
        },
      });
      return;
    }

    // 去摸尸体
    if (paths[i].indexOf("@") > -1) {
      if (params.opp) continue;
      AutoGetItem([paths[i].substring(1)]);
      // 执下一个指令
      setTimeout(function() {
        execNavCmd(paths, params, i + 1);
      }, 200);
      return;
    }

    // 叫船
    // 当叫船是最后一个时，跳过
    if (paths[i].indexOf("yell") > -1 && i < paths.length - 1) {
      addDispatchListener("execNavYell", function(b, type, subtype, msg) {
        // 渔船还没有达到这儿，等等吧。
        if (type == "main_msg" && msg.indexOf("漁船還沒有達到這兒，等等吧。") > -1) {
          execNavCmd(paths, params, i);
          return
        }
        if (type == "notice" && msg.indexOf("這兒沒有船可以喊") > -1) return;

        if (type != "jh" || subtype != "info") return;
        for (var key of b.keys()) {
          var val = b.get(key);
          if (val.indexOf("yell") < 0) continue
          // 到达对面, 继续执行剩下的指令
          delDispatchListener("execNavYell");
          execNavCmd(paths, params, i + 1);
        }
        return;
      });
      go(paths[i]);
      return;
    }

    // 随机跳转事件
    if (paths[i].indexOf("place") > -1) {
      var pName = paths[i].split("?")[1];
      var curName = g_obj_map.get("msg_room").get("short");
      // 未到达指定地，重新走
      if (pName != curName) {
        execNavCmd(paths, params, 0);
        return;
      }
      // 已到达指定地点，继续下一个
      execNavCmd(paths, params, i + 1);
      return;
    }

    // 路径为空，跳过执行下一个
    if (paths[i].length == 0) {
      execNavCmd(paths, params, i + 1);
      return;
    }
    // 设定响应超时，若超时，执行下一个
    execNavTimeout = setTimeout(function() {
      if (inBattle()) return;
      delDispatchListener("execNavCmd");
      execNavCmd(paths, params, i + 1);
      return;
    }, 2000);

    go(paths[i], {
      end: function() {},
      // 执行前做以下操作
      begin: function() {
        // 正常执行
        addDispatchListener("execNavCmd", function(b, type, subtype, msg) {
          if (params.stageFn) params.stageFn(b, type, subtype, msg);
          // 失败的提示
          if (type == "notice") {
            switch (subtype) {
              case "notify_fail":
                // 战斗中
                if (msg.indexOf("你正忙著呢") > -1) {
                  Log("exec nav vs_info:", paths[i], i);
                  clearNavTimeout();
                  delDispatchListener("execNavCmd");
                  // 处理战斗中断，比例杀气杀等
                  execNavCmdStack = {
                    paths: paths,
                    params: params,
                    index: i,
                  }
                  addBattleListener("execNavStack", execNavStack);
                  return;
                }

                // 确认无法到达的位置
                if (msg.indexOf("無法走動") > -1 ||
                  msg.indexOf("沒有這個方向") > -1 ||
                  msg.indexOf("只有VIP才可以直接去往此地") > -1 ||
                  msg.indexOf("你什麼都沒發覺") > -1 ||
                  msg.indexOf("就此鑽入恐有辱墓主") > -1 ||
                  msg.indexOf("你雖知這松林內有乾坤，但並沒發現任何線索") > -1 ||
                  msg.indexOf("此地圖還未解鎖，請先通關前面的地圖") > -1
                ) {
                  Log("exec nav notify_fail:", paths[i], i);
                  clearNavTimeout();
                  delDispatchListener("execNavCmd");
                  if (params.doneFn) params.doneFn(-1, msg);
                  return;
                }

                // 执行超时机制
                Log(type, subtype, msg);
                //            clearNavTimeout();
                //            delDispatchListener("execNavCmd");
                //            execNavCmd(paths, params, i + 1);
                return;
            }
            Log(type, subtype, msg);
            return;
          }

          // 正确走到下一个地址
          if (type == "unknow_command" || (type == "jh" && subtype == "info")) {
            clearNavTimeout();
            delDispatchListener("execNavCmd");
            execNavCmd(paths, params, i + 1);
            return;
          }

          // 执行超时机制
          Log(type, subtype, msg);
        });
      },
    }); // end for go(paths[i])
    return;
  } // end for
  execNavCmd(paths, params, i); // call the end;
}

// 反向行走, 返回是否可执行, true为可执行, false不可执行
function backNav(lspath, args) {
  if (!lspath || lspath.length == 0 || lspath.charAt(0) == ".") {
    Alert("此目标未含路径数据，无法自动导航");
    return;
  }

  var paths = lspath.split(";");
  if (paths && paths.length > 0) paths[0] = fixRankGo(paths[0])

  var newWays = [];
  var waytext = ''
  for (var i = paths.length - 1; i > -1; i--) {
    if (paths[i].indexOf("jh") > -1) {
      // found root
      break;
    }
    switch (paths[i]) {
      case "e":
        newWays.push("w");
		var waytext = waytext + 'w;';
        continue
      case "se":
        newWays.push("nw");
		var waytext = waytext + 'nw;';
        continue
      case "s":
        newWays.push("n");
		var waytext = waytext + 'n;';
        continue
      case "sw":
        newWays.push("ne");
		var waytext = waytext + 'ne;';
        continue
      case "w":
        newWays.push("e");
		var waytext = waytext + 'e;';
        continue
      case "nw":
        newWays.push("se");
		var waytext = waytext + 'se;';
        continue
      case "n":
        newWays.push("s");
		var waytext = waytext + 's;';
        continue
      case "ne":
        newWays.push("sw");
		var waytext = waytext + 'sw;';
        continue
      default:
        if (paths[i].indexOf("kill") > -1 ||
          paths[i].indexOf("?") ||
          paths[i].indexOf("@")) {
          newWays.push(paths[i]);
		  var waytext = waytext + +path[i] + ';';
          continue
        }
        // 其他的不处理
        return false
    }
  }
  console.log(waytext);
  var params = {};
  if (typeof args == "function") {
    params.doneFn = args;
  } else if (args) {
    params = args;
  }
  params.opp = true;
  execNavCmd(newWays, params);
  return true;
}

// 正向行走
function execNav(lspath, args) {
  if (!lspath || lspath.length == 0) {
    Alert("此目标未含路径数据，无法自动导航");
    return;
  }
  var paths = lspath.split(";");
  if (paths && paths.length > 0) paths[0] = fixRankGo(paths[0])

  var params = {};
  if (typeof args == "function") {
    params.doneFn = args;
  } else if (args) {
    params = args;
  }
  params.opp = false;
  execNavCmd(paths, params);
}


var askNpcTaskListenerIdx = 0;
var askNpcTaskIdx = 0;

// 超时定时器
var askName = "";
var askResult = [];
var askTimeout = null;
var askTargets = [];

function askNpcTaskListenerKey() {
  return "findTask_" + askNpcTaskListenerIdx;
}

function stopFindNpcTask(msg) {
  delDispatchListener(askNpcTaskListenerKey());
  if (askTimeout) clearTimeout(askTimeout);
  if (msg) Alert(msg);
}

function askNpcTask(idx, targets, key) {
  askNpcTaskIdx = idx;
  askTargets = targets;

  // 初始化数据
  if (idx == 0) {
    askResult = [];
  }

  // 已遍历所有人
  if (idx >= targets.length) {
    stopFindNpcTask();

    Alert("已遍历了所有npc,没有找到可用数据,请手工核对与对话", function() {
      WriteToScreen("=============对话开始线=============");
      for (var i = 0; i < askResult.length; i++) {
        WriteToScreen(askResult[i]);
      }
      WriteToScreen("=============对话结束线=============");
      // 释放对话数据
      askResult = [];
    });
    return
  }

  var target = askTargets[askNpcTaskIdx];
  var execWay = target.way;
  var targetNames = target.name.split(")");
  var targetName = targetNames[0];
  var targetNameZH = Traditionalized(targetName);
  if (targetNames.length > 1) targetName = targetNames[1];
  askName = "";
  if (askNpcTaskIdx > 0) {
    var lastTarget = askTargets[askNpcTaskIdx - 1];
    if (lastTarget.way == target.way) {
      execWay = ".";
    } else {
      var foundIdx = target.way.indexOf(lastTarget.way + ";");
      if (foundIdx > -1) {
        execWay = target.way.substring(lastTarget.way.length + 1);
      }
    }
  }

  WriteToScreen("执行 " + target.name + "-" + execWay);
  execNav(execWay, function(code, msg) {
    if (code != 0) {
      stopFindNpcTask(); // 终止接收本轮数据
      askNpcTask(askNpcTaskIdx + 1, askTargets, key); // 重新再问一次
      return;
    }

    // 给每一个场景分配一个对话监听器，以避免相互干扰
    askNpcTaskListenerIdx = (++askNpcTaskListenerIdx) % 1000000;
    var askNpcTaskListener = function(b, type, subtype, msg) {
      // 迷题已上限, 清空谜题后继续
      if (type == "notice" && subtype == "notify_fail") {
        // stopFindNpcTask(); // 终止接收本轮数据
        if (msg.indexOf("所接謎題過多") > -1) {
          go("auto_tasks cancel", function() {
            askNpcTask(askNpcTaskIdx, askTargets, key); // 重新再问一次
            go("golook_room");
          })
        }
        return;
      }

      // 从江湖信息中找人
      if (type == "jh" && subtype == "info") {
        // 开始找人并对话
        var bVal = null;
        for (var bKey of b.keys()) {
          if (bKey.indexOf("npc") < 0) continue;
          bVal = b.get(bKey);
          var args = bVal.split(",");
          var toName = dispatchChineseMsg(args[1]); // 取实际人的名字，因为配置文件中可能是带有多余的描述的
          if (args.length < 2 || targetNameZH != toName) continue;
          askName = toName;
          // 找到人了, 执行对话
          go("ask " + args[0], {
            begin: function() {
              if (askTimeout) clearTimeout(askTimeout);
              askTimeout = setTimeout(function() {
                // 问话超时，发一个带人名的关键字以便触发后面的找到响应的机制
                WriteToScreen(target.name + "：响应超时");
                return;
              }, 5 * 1000);
            },
          });
          return;
        }

        // 未找到人，发一个带人名的关键字以便触发后面的找到响应的机制
        WriteToScreen(target.name + "：没有此人");
        return;
      }

      // 解析对话数据
      // 监听到了某人的对话
      if (msg && msg.indexOf(askName) > -1) {
        stopFindNpcTask(); // 终止接收本轮数据
        askResult.push(msg);

        // 检测是否含有关键字
        msg = dispatchChineseMsg(msg);
        if (msg.indexOf(key) > -1) {
          // 找到的数据
          stopFindNpcTask(msg);
          return;
        }
        // 继续找下一个
        askNpcTask(askNpcTaskIdx + 1, askTargets, key);
        return;
      }
    };
    addDispatchListener(askNpcTaskListenerKey(), askNpcTaskListener);
    go("golook_room");
  });
}

function findJhTask(i, key) {
  var targets = [];
  travelNpcData(i, function(jh, loc, name, way, desc) {
    var jh = Simplized(jh);
    if (way.length == 0) return false;
    if (way.charAt(0) == ".") return false;
    targets.push({
      jh: jh,
      loc: loc,
      name: name,
      way: way,
      desc: desc,
    })
    // continue
    return false
  })
  if (targets.length == 0) {
    Alert("此章节无可寻路的NPC数据")
    return;
  }
  go("auto_tasks cancel", function() {
    askNpcTask(0, targets, key)
  })
}

function findTaskFunc(keys) {
  if (!keys || keys.length == 0) {
    keys = getStore("findTask_keys");
  }
  if (!keys) keys = "1|洛阳";
  Input("请输入需要找的江湖章节与迷题关键字。<br/>例如：<span style='color:red'>1|洛阳</span>表示在第1章中找'洛阳'的迷题。<br/><span style='color:red'>请注意:开始后会清除当前已有谜题对话!!!</span>", keys, function(input) {
    var val = input.value;
    var arr = val.split("|");
    if (!arr || arr.length < 2) {
      Alert("输入的格式有误")
      return;
    }
    var loc = parseInt(arr[0])
    var found = false;
    travelJhData(function(i, index, name) {
      if (index < loc) return false;
      found = true;
      setStore("findTask_keys", val);
      findJhTask(i, arr[1]);
      return true;
    })
    if (!found) {
      Alert("未找到章节数据:" + val);
    }
    return;
  })
}

// 全图找人
function findJhMen(idx, targets, keyName, doneFn) {
  if (targets.length == 0 || targets.length == idx) {
    if (doneFn) doneFn(-1, "未找到此人");
    return;
  }

  var target = targets[idx];
  var execWay = target.way;
  var stopExecNavCmd = false;
  var stageFn = function(b, type, subtype, msg) {
    if (type != "jh" || subtype != "info") return;
    for (var key of b.keys()) {
      if (key.indexOf("npc") < 0) continue;
      var args = b.get(key).split(",");
      var toName = dispatchChineseMsg(args[1]);
      if (args.length < 2 || toName.indexOf(keyName) < 0) continue;
      // 找到目标用户，执行回调
      stopExecNavCmd = true;
      if (doneFn) doneFn(0, "已找到目标:" + keyName, args);
      return;
    }

    return;
  }

  // 执行地图行走
  if (idx > 0) {
    var lastTarget = targets[idx - 1];
    if (lastTarget.way == target.way) {
      go("golook_room"); // 再发送一个江湖事件
      return;
    }
    var foundIdx = target.way.indexOf(lastTarget.way + ";")
    if (foundIdx > -1) {
      execWay = target.way.substring(lastTarget.way.length + 1);
    }
  }
  WriteToScreen("执行 " + target.name + "-" + execWay);
  execNav(execWay, {
    stageFn: stageFn,
    interruptFn: function() {
      return stopExecNavCmd;
    },
    doneFn: function(code, msg) {
      // 中断的操作
      if (stopExecNavCmd) return;

      // 未找到人, 继续下一个
      findJhMen(idx + 1, targets, keyName, doneFn);
    },
  })
}

function findMenFunc(keys) {
  if (!keys) {
    keys = getStore("findMen_keys");
  }
  if (!keys) keys = "1|游侠";
  Input("请输入需要找的江湖章节与人名。<br/>例如：<span style='color:red'>1|花不为</span>表示在第1章中找叫'花不为'的动态人物。", keys, function(input) {
    var val = input.value;
    var arr = val.split("|");
    if (!arr || arr.length < 2) {
      Alert("输入的格式有误")
      return;
    }
    setStore("findMen_keys", val);

    locIdx = parseInt(arr[0])
    var targets = [];
    travelJhData(function(index, jhIdx) {
      if (index != 0 && jhIdx != locIdx) return false;
      travelNpcData(index, function(jh, loc, name, way, desc) {
        if (index == 0) {
          if (loc != "全图") return false;
          if (jh != arr[0]) return false;
        }
        if (way.length == 0) return false;
        if (way.charAt(0) == ".") return false;
        if (targets.length > 0) {
          var lastTarget = targets[targets.length - 1];
          if (lastTarget.way == way) return false; // 路径相同，不再考虑
        }
        targets.push({
          jh: jh,
          loc: loc,
          name: name,
          way: way,
          desc: desc,
        })
        if (loc == "全图") return true;
      });
      // done
      return targets.length > 0;
    })
    if (targets.length == 0) {
      Alert("无可寻路的数据")
      return;
    };
    findJhMen(0, targets, arr[1], function(code, msg) {
      Alert(msg);
    });
  })
}

function TWmenNavigatorFunc(keys) {
  if (!keys) {
    keys = getStore("targetName");
  }
  if (!keys) keys = "农夫";
  Input("请输入导航的目标名称： NPC名称 如：农夫", keys, function(input) {
    var val = input.value;
    if (!val) {
      Alert("請輸入要導航的目標名稱!")
      return;
    }
	
    setStore("targetName", val);
	var val = Simplized(val);
	menNavigatorFunc(val);
  })
}

function TWmapNavigatorFunc(keys) {
  Input("请输入地图名称：<br/>地图名称<br/>如：洛阳", keys, function(input) {
    var val = Simplized(input.value);
	mapNavigatorFunc(val);
  })
}

/////////////////
// end--地图寻人
/////////////////

var llmysellitem = new RegExp(/天寒.*|木戟|瑤琴|阿拉伯彎刀|廢焦丹|廢藥渣|吹雪殘雲靴|蓑衣|兔肉|舊書|大光明經|羊鞭|竹刀|毛毯|灰布鑲邊袈裟|圓領小襖|鐵斧|船篙|水蜜桃|大理雪梨|金剛杖|牧羊鞭|綠羅裙|白袍|窄裉襖|哈密瓜|飛鏢|粗磁大碗|台夷頭巾|紫花瓣兒|鹿皮小靴|輕羅綢衫|木劍|長虹劍|皮鞭|黑袍|毒蒺藜|鐵項鏈|.*進階|.*基礎|銀手鐲|草帽|酒壺|鹿皮手套|草鞋|皮帽|銀戒|絲綢衣|牛皮酒袋|布鞋|金彈子|青葫蘆|菠菜粉條|水煙閣武士氅|牛皮靴|鮮紅金烏冠|天山雪蓮|錦緞腰帶|軟甲衣|拜月掌套|白蟒鞭|重甲|斬空刀|飛羽劍|銀簪|維吾爾族長袍|蛋糕|木刀|木錘|羊肉串|豆漿|彩衣|彩鐲|彩帶|彩帽|彩靴|彩巾|桃符紙|藥鋤|砍刀|白色棋子|黑色棋子|硫磺|拐杖|竹劍|木鉤|玉蜂漿|細劍|繡花小鞋|古銅緞子襖裙|道德經|白棋子|柴|木棍|鐵手鐲|藤甲盾|青銅盾|廢藥渣|七星寶戒|樹枝|水草|破爛衣服|破披風|鋼劍|長劍|青鋒劍|單刀|鋼刀|鬼頭刀|鋼杖|聖火令|新月棍|九環禪杖|逆鉤匕|鐵戒|布衣|絲衣|白色長袍|鐵甲|銀絲甲|銀絲鏈甲衣|長鬥篷|軍袍|絲質披風|金邊黑布袈裟|青色長衫|木盾|隕鐵盾|麻帶|鞶革|牛皮帶|虞姬劍|粗布鵝黃袍|紫霜血蟬衣|軟金束帶|穿花蛇影鞋|魔鞭翩瓏|紅色綢裙|繡花鞋|繡花針|無心錘|玉簫|竹杖|叫化雞|羊角匕|暗靈|帝王劍|黑水伏蛟|清心散|紫色長衫|七星劍|天魔刀|真武劍|灰色道袍|紫袍|鐵笛|長槍|長鞭|匕首|咒劍王|天師道袍|三清神冠|七星翻雲靴|大紅袈裟|紫金杖|禪杖|金剛罩|長戟|錦衣|白色長衫|全真道袍|垓下刀|粗布白袍|斷雲斧|護法袈裟|吳鉤|玄蘇劍|白纓冠|絲綢馬褂|狼皮雪靴|回旋鏢|梅花匕|橫斷鉤|灰色長衫|白色聖衣|松子|黃色道袍|青色道袍|拂塵|天怒斧|蓮蓬|筒裙|木槍/);
var llmyuseitem = new RegExp(/慶典八音盒|神秘寶箱|長生石寶箱|.*還丹|太陽花|.*靈草|.*紫芝|.*暴丹|.*補丸|突破丹禮包|引路蜂禮包|.*乾坤再造丹|青鳳紋綬|熱血印|風雲寶箱|神鳶寶箱|雲夢青|『神匠寶箱』|玉狻猊/);
var llstateitem = new RegExp(/三湘盟主令|南瓜盅|百彩酒|茉莉湯|蘭陵美酒|冰糖葫蘆|臘八粥|百草美酒|元宵|年糕|巧果兒/);
var llsplititem = new RegExp(/星河劍|殘雪.*|霹靂掌套|夜行披風|血屠刀|玉清棍|虎皮腰帶|毒龍鞭|瘋魔杖|破軍盾|羊毛鬥篷|金絲寶甲衣|玄武盾|金絲甲|紅光匕|滄海護腰|白玉腰束|貂皮鬥篷|金獅盾|寶玉甲|月光寶甲|無心匕|生死符|翎眼.*|赤護.*|青鸞護臂|蒼狼護臂/);
var tidyPkgItems = null;

function baoguoZhengli1Func(index) {
  if (!tidyPkgItems) return
  var runCmd = function(exec, total, done) {
    var cmd = "";
    var num_n = parseInt(num / 100);
    if (num_n > 0) {
      cmd += cmdWithTimes(num_n, exec + '_N_100');
    }
    var num_n = parseInt(num % 100);
    if (num_n > 0) {
      cmd += cmdWithTimes(1, exec + '_N_' + num_n);
    }
    go(cmd, done)
  }
  var runCmd_2 = function(exec, total, done) {
    var cmd = "";
	var num_n = parseInt(num / 1000);
	if (num_n > 0) {
	  cmd += cmdWithTimes(num_n, exec + '_N_1000');
	}
	var num_n = parseInt(num % 1000);
	if (num_n > 0) {
	  cmd += cmdWithTimes(1, exec + '_N_' + num_n);
	}
	go(cmd, done);
  }
  for (var i = index; i > -1; i--) {
    if (tidyPkgItems[i].key.indexOf("items") < 0) continue;
    var item = dispatchMsg(tidyPkgItems[i].value);
    var items = item.split(",");

    var num = parseInt(items[2]);
    var ls = items[1].match(llmysellitem);
    if (ls) {
      Confirm("賣：" + items[1] + " 數量：" + num, function() {
        var exec = "items sell " + items[0] + "_N_" + num;
        go(exec, function() {
          baoguoZhengli1Func(i - 1)
        })
      }, function() {
        baoguoZhengli1Func(i - 1)
      })
      return;
    }
    var lu = items[1].match(llmyuseitem);
    if (lu) {
      Confirm("使用：" + items[1] + " 數量：" + (num), function() {
        var exec = "items use " + items[0];
		runCmd_2(exec, num, function() {
          baoguoZhengli1Func(i - 1)
        });
      }, function() {
        baoguoZhengli1Func(i - 1)
      });
      return;
    }
    var lsp = items[1].match(llsplititem);
    if (lsp) {
      Confirm("分解:" + items[1] + " 數量：" + (num), function() {
        var exec = "items splite " + items[0];
        runCmd(exec, num, function() {
          baoguoZhengli1Func(i - 1)
        });
      }, function() {
        baoguoZhengli1Func(i - 1)
      });
      return;
    }
    var lstate = items[1].match(llstateitem);
    if (lstate) {
      // 只使用一次
      Confirm("使用：" + items[1], function() {
        var exec = "items use " + items[0];
        go(exec, function() {
          baoguoZhengli1Func(i - 1)
        });
      }, function() {
        baoguoZhengli1Func(i - 1)
      });
      return;
    }
  }
  // 整理结束
  pkgOrder = getStore("pkgOrder")
  tidyPkgItem = null;
}

// 背包整理协议解析
function tidyPkgListener(proto) {
  // 非背包的协议，跳回
  if (proto.get("type") != "items") return;
  pkgOrder = "0" // 开启整理时，使用系统的排序，以便提高效率。

  var pkg = {
    length: 0,
  };
  var store = {
    length: 0,
  };
  var elements = proto.elements;
  for (var i = elements.length - 1; i > -1; i--) {
    var el = elements[i];
    if (el.key.indexOf("items") > -1) {
      pkg.length++;
      pkg[el.key] = el.value
    } else if (el.key.indexOf("stores") > -1) {
      store.length++;
      store[el.key] = el.value
    }
  }

  // 取仓库容量
  var maxBagNum = parseInt(proto.get("max_bag_num"));
  if (store.length == maxBagNum && pkg.length == maxBagNum) {
    Alert("仓库已满，请至少留一格背包");
    return;
  }

  for (var sKey in store) {
    if (sKey == "length") continue
    for (var pKey in pkg) {
      if (pKey == "length") continue;
      var storeVals = store[sKey].split(",");
      var pkgVals = pkg[pKey].split(",");
      if (storeVals[1] != pkgVals[1]) continue;

      // 装备在了身上
      if (pkgVals[3] == "1") {
        Log("装备在身上：" + pkgVals[1])
        continue
      }
      // 执行放物品操作
      Log("合并了:", pKey, pkgVals)
      go("items put_store " + pkgVals[0]);
      return // 等待响应更新
    }
  }

  delDispatchListener("baoguoZhengliFunc");
  // 卖掉多余的东西
  tidyPkgItems = pkgItems;
  baoguoZhengli1Func(tidyPkgItems.length - 1)
};

// 整理背包
function baoguoZhengliFunc() {
  addDispatchListener("baoguoZhengliFunc", tidyPkgListener);
  go("items");
}

// 国庆接龙
function zuguoPkgListener(proto) {
  // 非背包的协议，跳回
  if (proto.get("type") != "items") return;
  var gczg = [
    "我和我的祖國一刻也不能分割",
    "無論我走到哪裡都流出一首贊歌",
    "我歌唱每一座高山我歌唱每一條河",
    "裊裊炊煙小小村落路上一道轍",
    "我最親愛的祖國我永遠緊依著你的心窩",
    "你用你那母親的脈搏和我訴說",
    "我的祖國和我像海和浪花一朵",
    "浪是海的赤子海是那浪的依托",
    "每當大海在微笑我就是笑的旋渦",
    "我分擔著海的憂愁分享海的歡樂",
    "我最親愛的祖國你是大海永不干涸",
    "永遠給我碧浪清波心中的歌",
  ]
  var elements = proto.elements;
  var result = [];
  for (var i = 0; i < gczg.length; i++) {
    result.push({
      key: "obj_zuguo" + (i + 1),
      value: gczg[i],
      num: 0,
    })
  }
  for (var i = elements.length - 1; i > -1; i--) {
    var el = elements[i];
    if (el.key.indexOf("items") > -1 && el.value.indexOf("obj_zuguo") > -1) {
      // 找到物品
      // 0: "obj_zuguo6"
      // 1: "name"
      // 2: "1"
      // 3: "0"
      // 4: "顆"
      var storeVals = el.value.split(",");
      for (var j = 0; j < result.length; j++) {
        if (result[j].key == storeVals[0]) {
          result[j].num = parseInt(storeVals[2])
        }
      }
    }
  }
  delDispatchListener("zuguoPkgFunc");

  var tips = "";
  for (var i = 0; i < result.length; i++) {
    tips += ((i + 1) + ":" + result[i].value + "，数量:" + result[i].num);
    if (result[i].num > 0) {
      tips += "&nbsp&nbsp<a style='text-decoration:underline;color:blue' onclick=\"go('items use " + result[i].key + "')\">使用</a>"
    }
    tips += "<br/>"
  }
  Tips(tips);
};

function zhu(n) {
  var i = 1
  execNav('n;s;')
  zhutimer = setInterval(function() {
	i++;
	if (i <= n) execNav('n;s;');
  }, 10000)
}

// 中秋活動按紐
function newYMLB() {
  idxs = 0;
  newYMLB_go(0);
  autoGetTargetNames = "吐蕃國師的屍體".split(",");
  addDispatchListener("listenItemDropFunc", AutoGetItemMon);
}

function newYMLB_go(idx) {
  if (idx == -1) {
    taskLocking = false;
	delDispatchListener("listenItemDropFunc");
	Alert("已完成雙秘境拿玄鐵令")
    return;
  }
  taskLocking = true;
  idxs++;
  idx++;
  switch (idx) {
    case 1:
      newYMLB1('next');
      return
    case 2:
      newYMLB1('next');
      return
	case 3:
      newYMLB1('next');
      return
	case 4:
      newYMLB1('next');
      return
	case 5:
      newYMLB1('next');
      return
    case 6:
      newYMLB2('next');
	  return;
    case 7:
      newYMLB2('next'); 
	  return;
    case 8:
      newYMLB2('next');
	  return;
    case 9:
      newYMLB2('next'); 
	  return;
    case 10:
	  newYMLB2('ends');      
	  return;
    default:
      // 若找不到，执行下一个
      break;
  }
  newYMLB_go(idx);
}


function newYMLB1(done) {
  execNav("jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;event_1_64526228;kill?暮昭雪;kill?窮黷武;kill?元真和尚;w;n;n;n;n;n;w", function() {
    mijingFuncY(done);
  })
}

function newYMLB2(done) {
  execNav("jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;event_1_52732806;kill?琦行;kill?奔狂驍;sw;kill?吐蕃國師;ne;n;n;se;se;se", function() {
    mijingFuncY(done);
  })
}

function ys(idx) {
  if (idx == -1) {
    taskLocking = false;
    go('event_1_71917017;event_1_71917017;event_1_71917017;event_1_71917017;jh 1;home')
    return;
  }
  taskLocking = true;
  idx++;
  console.log(idx);
  switch (idx) {
    case 1:
      go('jh 1');
      ys1(idx);
      return;
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
    case 16:
    case 17:
    case 18:
    case 19:
    case 20:
      ys1(idx);
      return;
    case 21:
      go('jh 5;n;n;n;w');
      ys2(idx);
      return;
    case 22:
    case 23:
    case 24:
    case 25:
      ys2(idx);
      return;
    case 26:
      go('jh 2;n;n;n;n;e');
      ys3(idx);
      return;
    case 27:
    case 28:
    case 29:
    case 30:
      ys3(idx);
      return;
    case 31:
      ys4p(idx);
      return;
    case 32:
    case 33:
    case 34:
    case 35:
    case 36:
      ys4(idx);
      return;
    case 37:
      go('jh 2;n;n;n')
      ys5(idx);
      return;
    case 38:
    case 39:
    case 40:
    case 41:
      ys5(idx);
      return;
    case 42:
      ys(-1);
      return;
    default:
      // 若找不到，执行下一个
      break;
  }
}

function ys1(idx) {
  go("buy_npc_item go 0;buy_npc_item go 1;buy_npc_item go 2;buy_npc_item go 3", function() {
    ys(idx)
  })
}

function ys2(idx) {
  go("buy_npc_item go 0", function() {
    ys(idx)
  })
}

function ys3(idx) {
  go("event_1_17045611 go 0", function() {
    ys(idx)
  })
}

function ys4p(idx) {
  execNav("jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill?看山弟子;n;n;n;n;w", function() {
    ys(idx)
  })
}

function ys4(idx) {
  go("event_1_39153184 go 0", function() {
    ys(idx)
  })
}

function ys5(idx) {
  go("event_1_10053782;event_1_48376442;event_1_25918230;event_1_74166959", function() {
    ys(idx)
  })
}


// 国庆接龙
function zuguoPkgFunc() {
  addDispatchListener("zuguoPkgFunc", zuguoPkgListener);
  go("items");
}

function baoshiCode(name) {
  switch (name) {
    case "紅寶石":
      return "hongbaoshi"
    case "黄寶石":
      return "huangbaoshi"
    case "綠寶石":
      return "lvbaoshi"
    case "藍寶石":
      return "lanbaoshi"
    case "紫寶石":
      return "zishuijing"
  }
}

// level:0,"碎裂的" + name
// level:1,"裂開的" + name
// level:2,name
// level:3,"無暇的" + name
// level:4,"完美的" + name
// level:5,"君王的" + name
// level:6,"皇帝的" + name
// level:7,"天神的" + name
function hebaoshi(targetName, pkgs) {
  var targetNames = targetName.split("的");
  if (targetNames.length == 1) {
    targetNames = ["", name];
  }
  var name = targetNames[1];
  var list = [{
    code: baoshiCode(name) + 1,
    name: "碎裂的" + name,
    execNum: 0,
    num: 0
  }, {
    code: baoshiCode(name) + 2,
    name: "裂開的" + name,
    execNum: 0,
    num: 0
  }, {
    code: baoshiCode(name) + 3,
    name: name,
    execNum: 0,
    num: 0
  }, {
    code: baoshiCode(name) + 4,
    name: "無暇的" + name,
    execNum: 0,
    num: 0
  }, {
    code: baoshiCode(name) + 5,
    name: "完美的" + name,
    execNum: 0,
    num: 0
  }, {
    code: baoshiCode(name) + 6,
    name: "君王的" + name,
    execNum: 0,
    num: 0
  }, {
    code: baoshiCode(name) + 7,
    name: "皇帝的" + name,
    execNum: 0,
    num: 0
  }, {
    code: baoshiCode(name) + 7,
    name: "天神的" + name,
    execNum: 0,
    num: 0
  }];
  var idx = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].name != targetName) {
      continue
    }
    idx = i;
    break;
  }
  // 生成已有的数量
  for (var i = 0; i < pkgs.length; i++) {
    var item = pkgs[i];
    if (item.key.indexOf("items") < 0) continue;
    // if (item.value.indexOf(name) < 0) continue;
    var vals = item.value.split(",");
    var itemCode = vals[0];
    var itemNum = parseInt(vals[2]);
    for (var j = list.length - 1; j > -1; j--) {
      if (list[j].code != itemCode) continue;
      list[j].num = itemNum;
    }
  }
  // 检查需要合成的对应次数
  var parentNeed = 1;
  for (var level = idx - 1; level > -1; level--) {
    list[level].execNum = parentNeed;
    var needNum = parentNeed * 3;
    if (list[level].num >= needNum) {
      // 已足够父级个数
      parentNeed = 0;
      break;
    }
    // 生成需要下级的个数
    parentNeed = needNum - list[level].num;
  }
  if (parentNeed > 0) {
    Alert("寶石數量不足");
    return;
  }
  // 合成宝石
  var cmd = "";
  for (var n = 0; n < idx; n++) {
    var consumer = list[n].execNum;
    var code = baoshiCode(name) + (n + 1);
    while (consumer > 0) {
      // 大于10的不执行，因为执行不了那么快，会造成后续不稳定
      if (consumer >= 10) {
        cmd += "items hecheng " + code + "_N_10;";
        consumer -= 10;
      } else {
        cmd += "items hecheng " + code + "_N_1;";
        consumer -= 1;
      }
    }
  }
  cmd += "items"; // 重新刷新背包
  pkgOrder = "0";
  go(cmd);
}

function hebaoshiFunc(name) {
  addDispatchListener("hebaoshiFunc", function(b, type, subtype, msg) {
    if (type != "items" || subtype != "list") return;
    delDispatchListener("hebaoshiFunc");
    hebaoshi(name, b.elements);
  })
  go("items");
}

createPop('合宝石');
popList['合宝石'].innerHTML = '<div>选择你要合成的宝石</div>';

function showHeBaoshi() {
  showPopGroup("合宝石");
}
createPopButton("無暇紅", "合宝石", function() {
  hebaoshiFunc("無暇的紅寶石")
});
createPopButton("完美紅", "合宝石", function() {
  hebaoshiFunc("完美的紅寶石")
});
createPopButton("君王紅", "合宝石", function() {
  hebaoshiFunc("君王的紅寶石")
});
createPopButton("皇帝紅", "合宝石", function() {
  hebaoshiFunc("皇帝的紅寶石")
});
createPopButton("天神紅", "合宝石", function() {
  hebaoshiFunc("天神的紅寶石")
});
createPopButton("無暇黃", "合宝石", function() {
  hebaoshiFunc("無暇的黃寶石")
});
createPopButton("完美黃", "合宝石", function() {
  hebaoshiFunc("完美的黃寶石")
});
createPopButton("君王黃", "合宝石", function() {
  hebaoshiFunc("君王的黃寶石")
});
createPopButton("皇帝黃", "合宝石", function() {
  hebaoshiFunc("皇帝的黃寶石")
});
createPopButton("天神黃", "合宝石", function() {
  hebaoshiFunc("天神的黃寶石")
});
createPopButton("無暇藍", "合宝石", function() {
  hebaoshiFunc("無暇的藍寶石")
});
createPopButton("完美藍", "合宝石", function() {
  hebaoshiFunc("完美的藍寶石")
});
createPopButton("君王藍", "合宝石", function() {
  hebaoshiFunc("君王的藍寶石")
});
createPopButton("皇帝藍", "合宝石", function() {
  hebaoshiFunc("皇帝的藍寶石")
});
createPopButton("天神藍", "合宝石", function() {
  hebaoshiFunc("天神的藍寶石")
});
createPopButton("無暇綠", "合宝石", function() {
  hebaoshiFunc("無暇的綠寶石")
});
createPopButton("完美綠", "合宝石", function() {
  hebaoshiFunc("完美的綠寶石")
});
createPopButton("君王綠", "合宝石", function() {
  hebaoshiFunc("君王的綠寶石")
});
createPopButton("皇帝綠", "合宝石", function() {
  hebaoshiFunc("皇帝的綠寶石")
});
createPopButton("天神綠", "合宝石", function() {
  hebaoshiFunc("天神的綠寶石")
});
createPopButton("無暇紫", "合宝石", function() {
  hebaoshiFunc("無暇的紫寶石")
});
createPopButton("完美紫", "合宝石", function() {
  hebaoshiFunc("完美的紫寶石")
});
createPopButton("君王紫", "合宝石", function() {
  hebaoshiFunc("君王的紫寶石")
});
createPopButton("皇帝紫", "合宝石", function() {
  hebaoshiFunc("皇帝的紫寶石")
});
createPopButton("天神紫", "合宝石", function() {
  hebaoshiFunc("天神的紫寶石")
});

function useBaoxiankaFunc() {
  Input("输入使用的张数", "1", function(input) {
    var val = parseInt(input.value);
    if (!val) {
      Alert("输入有误");
      return;
    }
    goWithTimes(val, "items use obj_baoxianka")
  })
}

createPop('使用令卡');
popList['使用令卡'].innerHTML = '<div>选择你要使用的令卡</div>';
// =================================
function showLingpai() {
  showPopGroup("使用令卡");
}
createPopButton("突破卡", "使用令卡", function() {
  go("tupo_speedup");
});
createPopButton("高突卡", "使用令卡", function() {
  go("tupo_speedup2");
});
createPopButton("超突卡", "使用令卡", function() {
  go("tupo_speedup3");
});
createPopButton("通天丸", "使用令卡", function() {
  go("tupo_speedup3_1");
});
createPopButton("舍利子", "使用令卡", function() {
  go("tupo_speedup4_1");
});
createPopButton("火腿粽", "使用令卡", function() {
  Confirm("直接使用火腿粽加速全部突破？", function() {
    go("items use obj_huotuizongzi");
  });
});
createPopButton("悬红令", "使用令卡", function() {
  go("items use obj_xuankongling");
});
createPopButton("师门令", "使用令卡", function() {
  go("items use obj_shimenling");
});
createPopButton("帮派令", "使用令卡", function() {
  go("items use obj_bangpailing");
});
createPopButton("正邪令", "使用令卡", function() {
  go("items use obj_zhengxieling");
});
createPopButton("江湖令", "使用令卡", function() {
  go("items use obj_jianghuling");
});
createPopButton("谜题令", "使用令卡", function() {
  go("items use obj_mitiling");
});
createPopButton("状元贴", "使用令卡", function() {
  go("items use obj_zhuangyuantie");
});
createPopButton("碧火酒", "使用令卡", function() {
  go("items use obj_xuanbingbihuojiu1");
});
createPopButton("玉露丸", "使用令卡", function() {
  go("items use obj_jiuhuayulouwan");
});

// =================================
var rankGoHJ = getStore("rank_go_hj")
var rankGoTTT = getStore("rank_go_ttt")
var rankGoHLS = getStore("rank_go_hls")
var rankGoGDC = getStore("rank_go_gdc")
var rankGoYNJ = getStore("rank_go_ynj")
var rankGoZJD = getStore("rank_go_zjd")
var rankGoPLT = getStore("rank_go_plt")
var rankGoZJG = getStore("rank_go_zjg")
var rankGoWXL = getStore("rank_go_wxl")
var rankGoCDT = getStore("rank_go_cdt")
var rankGoMHD = getStore("rank_go_mhd")
var rankGoMJT = getStore("rank_go_mjt")
var rankGoYPT = getStore("rank_go_ypt")

function fixRankGo(p) {
  switch (p) {
    case "rank go 164":
      return rankGoHJ;
    case "rank go 187":
      return rankGoTTT;
    case "rank go 188":
      return rankGoHLS;
    case "rank go 189":
      return rankGoGDC;
    case "rank go 198":
      return rankGoYNJ;
    case "rank go 204":
      return rankGoZJD;
    case "rank go 216":
      return rankGoPLT;
    case "rank go 217":
      return rankGoZJG;
    case "rank go 230":
      return rankGoWXL;
    case "rank go 231":
      return rankGoCDT;
    case "rank go 235":
      return rankGoMHD;
    case "rank go 262":
      return rankGoMJT;
    case "rank go 296":
      return rankGoYPT;
  }
  return p
}

function updateRankMon(b, type, subtype, msg) {
  if (type != "rank") return;
  var maxPage = parseInt(b.get("max_page"));
  var sizePage = parseInt(b.get("page_size"));
  var curPage = parseInt(b.get("page"));
  var idx = sizePage * (curPage - 1);
  for (var n = b.elements.length - 1; n > -1; n--) {
    var value = dispatchMsg(b.elements[n].value);
    // 完成主線第四十六章——花街 支線任務 戰勝乾羅——武林探花獲得
    if (value.indexOf("武林探花") > -1) {
      rankGoHJ = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_hj", rankGoHJ);
      WriteToScreen("花街:" + rankGoHJ);
    }
    // 京城-通天塔八層通關獲得
    if (value.indexOf("達摩傳人") > -1) {
      rankGoTTT = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_ttt", rankGoTTT)
      WriteToScreen("通天塔:" + rankGoTTT);
    }
    // 京城-紅螺寺八層通關獲得
    if (value.indexOf("怒蒼猛虎") > -1) {
      rankGoHLS = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_hls", rankGoHLS)
      WriteToScreen("紅螺寺:" + rankGoHLS);
    }
    // 挑戰地下格鬥城第50層獲得
    if (value.indexOf("暗影鬥士") > -1) {
      rankGoGDC = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_gdc", rankGoGDC)
      WriteToScreen("格鬥城:" + rankGoGDC);
    }
    // 越王劍宮-越女劍樓八層通關獲得
    if (value.indexOf("浪俠劍心") > -1) {
      rankGoYNJ = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_ynj", rankGoYNJ)
      WriteToScreen("越女樓:" + rankGoYNJ);
    }
    // 越王劍宮-鑄劍洞八層通關獲得
    if (value.indexOf("無上劍師") > -1) {
      rankGoZJD = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_zjd", rankGoZJD)
      WriteToScreen("鑄劍洞:" + rankGoZJD);
    }
    // 江陵-霹靂堂第九層通關獲得
    if (value.indexOf("怒劍沉舟") > -1) {
      rankGoPLT = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_plt", rankGoPLT)
      WriteToScreen("霹靂堂:" + rankGoPLT);
    }
    // 江陵-葬劍谷第十五層通關獲得
    if (value.indexOf("葬劍留名") > -1) {
      rankGoZJG = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_zjg", rankGoZJG)
      WriteToScreen("葬劍谷:" + rankGoZJG);
    }
    // 天龍寺-無湘樓第九層通關獲得
    if (value.indexOf("凡塵世尊") > -1) {
      rankGoWXL = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_wxl", rankGoWXL)
      WriteToScreen("無湘樓:" + rankGoWXL);
    }
    // 天龍寺-藏典塔第三層通關獲得
    if (value.indexOf("無念法師") > -1) {
      rankGoCDT = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_cdt", rankGoCDT)
      WriteToScreen("藏典塔:" + rankGoCDT);
    }
    // 天龍寺-魔皇殿第八層通關獲得
    if (value.indexOf("指桑罵槐") > -1) {
      rankGoMHD = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_mhd", rankGoMHD)
      WriteToScreen("魔皇殿:" + rankGoMHD);
    }
    //西夏-名將堂第五層通關獲得
    if (value.indexOf("宿將舊卒") > -1) {
      rankGoMJT = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_mjt", rankGoMJT)
      WriteToScreen("名將堂:" + rankGoMJT);
    }
    //西夏-一品堂第九層通關獲得
    if (value.indexOf("西夏") > -1 && value.indexOf("傳奇之浪客") > -1) {
      rankGoYPT = "rank go " + (idx + (parseInt(b.elements[n].key.split("rnk")[1])))
      setStore("rank_go_ypt", rankGoYPT)
      WriteToScreen("一品堂:" + rankGoYPT);
    }

  }
  if (curPage < maxPage) {
    go("rank all " + (curPage + 1));
  } else {
    delDispatchListener("updateRankMon");
    goFast("prev");
    WriteToScreen("稱號代碼更新成功");
  }
}

function updateRankFunc() {
  addDispatchListener("updateRankMon", updateRankMon);
  go("rank all");
}

function checkRankFunc() {
  var verTip = "ver_tip";
  if (getStore(verTip) == a80_ver) {
    return;
  }
  updateRankFunc();
}

// 设置挂机密码
var hangupCode = "";

function hangupMon(b) {
  if (!hangupCode) return;

  var type = b.get("type");
  if (type != "channel") return;
  var subType = b.get("subtype");
  if (subType != "tell") return;
  var msg = b.get("msg")
  var startIdx = msg.indexOf("告訴你：") + 4;
  var endIdx = startIdx + hangupCode.length;
  if (endIdx > msg.length) return;
  var code = msg.substring(startIdx, endIdx);
  if (code != hangupCode) return;
  alert("收到停止挂机指令:" + msg);
};

function hangupFunc(restore) {
  var store = getStore("hangup");
  if (store == null || store.length == 0) {
    store = "<未设定>"
    delDispatchListener("hangupFunc");
  } else {
    hangupCode = store;
    addDispatchListener("hangupFunc", hangupMon);
  }
  if (!restore) {
    Input("设置中断重连的口令，仅本地有效，用于紧急中断挂机功能。<br/>当收到指定的私聊口令后，卡住当前浏览器不再重连上线。<br/>当前:" + store, "", function(input) {
      var val = input.value;
      if (val == undefined) {
        return;
      }
      // 设置密码
      hangupCode = val;
      if (hangupCode.length > 0) {
        addDispatchListener("hangupFunc", hangupMon);
      } else {
        delDispatchListener("hangupFunc");
      }
      setStore("hangup", val);
    })
    return;
  }
}

var reconnectTime = 0;

function reconnectMon(b, type, subtype, msg) {
  if (type != "disconnect" && subtype != "change") return;
  if (reconnectTime == 0) return;

  Log("waiting reconnect:" + reconnectTime)
  setTimeout(function() {
    // 重新连接
    g_gmain.g_delay_connect = 0;
    connectServer();
    // window.location.reload();
  }, reconnectTime * 1000)
}

function reconnectFunc(restore) {
  var store = parseInt(getStore("reconnect"));
  if (!store) {
    store = 0
    delDispatchListener("reconnectFunc");
  } else {
    reconnectTime = store;
    addDispatchListener("reconnectFunc", reconnectMon);
  }
  if (!restore) {
    Input("输入被取代连接后继续重连的时间，单位:秒。输入0则不重连。<br/>当前:" + store, "600", function(input) {
      var val = parseInt(input.value);
      if (val == undefined) {
        return;
      }
      reconnectTime = val;
      if (reconnectTime > 0) {
        addDispatchListener("reconnectFunc", reconnectMon);
      } else {
        delDispatchListener("reconnectFunc");
      }
      setStore("reconnect", val);
    })
    return;
  }
}


// 天剑功能
var autoTianJianOn = 0;
var autoTianJianBoss = false;

function autoTianJianFunc() {
  var btn = getBtn("随机走");
  if (btn.innerHTML == "随机走") {
    btn.innerHTML = "停随机";
    autoTianJianOn = 1;
    return;
  } else {
    autoTianJianOn = 0;
    btn.innerHTML = "随机走";
  }
  return;
}
var autoTianJianSkill = "";

function autoTianJianSkillFunc() {
  var btn = getBtn("要出招");
  if (btn.innerHTML == "要出招") {
    var discribe = "<未启用>";

    var defaultSkill = getStore("tianjian_auto_skill");
    if (!defaultSkill) {
      defaultSkill = "獨孤九劍,玄鐵劍法"
    }
	if (autoTianJianSkill.length > 0) {
      discribe = autoTianJianSkill;
    }
    Input("请输入天剑杀怪技能，若不配置，不出招。<br/>当前：" + discribe, defaultSkill, function(input) {
      var val = input.value;
      if (val == undefined) return;
      autoTianJianSkill = val;
      if (val.length == 0) return;
      // 记录给下次使用
      setStore("tianjian_auto_skill", val);
      btn.innerHTML = "停出招";
    });
  } else {
    btn.innerHTML = "要出招";
    autoTianJianSkill = "";
  }
}

var autoForceOn = 0;

function autoTianJianForceFunc() {
  var btn = getBtn("自动内");
  if (btn.innerHTML == "自动内") {
    autoForceOn = 1;
    btn.innerHTML = "手动内";
    Alert("内力超过2万5时一定要同时买千万与万年灵芝!!!");
  } else {
    autoForceOn = 0;
    btn.innerHTML = "自动内";
  }
}

var killTianJianTarget = []; // 待杀名称列表
var killTianJianNoTarget = 0; // 空转计数
var killTianJianTrigger = null; // 定时器
var killTianJianTriggerNum = [];
var killTianJianAutoForcing = false;

function addKillTarget(name) {
  for (var i = 0; i < killTianJianTarget.length; i++) {
    if (killTianJianTarget[i] == name) return;
  }
  killTianJianTarget.push(name);
}

function delKillTarget(name) {
  for (var i = 0; i < killTianJianTarget.length; i++) {
    if (killTianJianTarget[i] == name) {
      killTianJianTarget.splice(i, 1)
      return;
    }
  }
}

function killTianJian() {
  if (inBattleFight) {
    useTianjianSkill(autoTianJianSkill);
    return;
  }

  // 检查是否有可杀的目标, 若有，进入战斗
  var npc = matchRoomNpc(killTianJianTarget, true, false);
  if (npc) {
    killTianJianNoTarget = 0;
    clickButton('kill ' + npc.code);
  }
  // 若走到这一步，说明已经没有可杀的目标
  if (autoForceOn) {
    // 治疗中时不执行其他
    if (killTianJianAutoForcing) return;

    var force = parseInt(g_obj_map.get("msg_attrs").get("force"));
    var max_force = parseInt(g_obj_map.get("msg_attrs").get("max_force"));
    // 小于40%时回内, 因为上面的获取可能是不实时的
    if (Math.floor(force * 100 / max_force) < 40) {
      killTianJianAutoForcing = true;
      healForce(force, max_force, function() {
        // 关闭治疗功能
        killTianJianAutoForcing = false;
      });
      return;
    }
  }


  killTianJianNoTarget++;
  // 尝试看是否是跳到其他界面, 确保是怪杀完了
  // if (killTianJianNoTarget == 1) clickButton("golook_room");

  // 跳过一定的回合, 以便等待同伴
  if (killTianJianNoTarget < 2) return;

  // 检查是否打开了队长功能，若打开，自动进入下一路径
  if (!autoTianJianOn) return;

  killTianJianNoTarget = 0;
  // 检查是否有BOSS房间，优先进BOSS房
  var roomInfo = g_obj_map.get("msg_room");
  if (autoTianJianBoss && roomInfo) {
    for (var i = roomInfo.elements.length - 1; i > -1; i--) {
      var key = roomInfo.elements[i].key;
      var code = '';
      switch (key) {
        case "east":
          code = "e";
          break;
        case "west":
          code = "w";
          break;
        case "north":
          code = "n";
          break;
        case "south":
          code = "s";
          break;
        case "southeast":
          code = "se";
          break;
        case "southwest":
          code = "sw";
          break;
        case "northeast":
          code = "ne";
          break;
        case "southwest":
          code = "sw";
          break;
      }
      if (code.length > 0 && roomInfo.elements[i].value.indexOf("峽谷") < 0) {
        clickButton(code, 0);
        return;
      }
    };
  }

  // 取随机方位移动
  var v = Math.random();
  var code = "ne";
  if (v < 0.125) code = "e";
  else if (v < 0.25) code = "se";
  else if (v < 0.375) code = "s";
  else if (v < 0.5) code = "sw";
  else if (v < 0.625) code = "w";
  else if (v < 0.75) code = "nw";
  else if (v < 0.875) code = "n";
  clickButton(code, 0);
  return;
}

function startKillTianJian() {
  killTianJianTriggerNum.push(true);
  if (killTianJianTrigger) return null;
  killTianJianTrigger = setInterval(killTianJian, 250);
  return null;
}

function stopKillTianJian() {
  killTianJianTriggerNum.pop();
  if (killTianJianTriggerNum.length > 0) return;
  clearInterval(killTianJianTrigger);
  killTianJianTrigger = null;
}

function killTianJianWeiShiFunc() {
  var btn = getBtn("杀卫士");
  if (btn.innerHTML == "杀卫士") {
    var err = startKillTianJian();
    if (err != null) {
      Alert(err)
      return;
    }
    addKillTarget("天劍谷衛士");
    btn.innerHTML = "停卫士";
    return;
  } else {
    delKillTarget("天劍谷衛士");
    btn.innerHTML = "杀卫士";
    stopKillTianJian();
    return;
  }
}
var tianJianBoss = "虹風,虹雨,虹雷,虹電,天劍,天劍真身";
var tianJianBossOri = "虹風,虹雨,虹雷,虹電,天劍,天劍真身";

function killTianJianBossFunc() {
  var btn = getBtn("杀老大");
  if (btn.innerHTML == "杀老大") {
    Input("请输入BOSS名称，并以<span style='color:red'>英文逗号</span>分割。当前:" + tianJianBoss, tianJianBoss, function(input) {
      var val = input.value;
      if (val == null) {
        return;
      }
      tianJianBoss = val;
      var err = startKillTianJian();
      if (err != null) {
        Alert(err)
        return;
      }
      var arr = tianJianBoss.split(",");
      for (var i = arr.length - 1; i > -1; i--) {
        addKillTarget(arr[i]);
      }
      btn.innerHTML = "停老大";
      autoTianJianBoss = true;
    })
    return;
  } else {
    var arr = tianJianBoss.split(",");
    for (var i = arr.length - 1; i > -1; i--) {
      delKillTarget(arr[i]);
    }
    btn.innerHTML = "杀老大";
    autoTianJianBoss = false;
    stopKillTianJian();
    return;
  }
}

function goTianjianguFunc() {
  var roomName = getRoomName();
  if (roomName != "武林廣場1") {
    Alert("请到武林广场1再使用");
    return;
  }
  go("go_tianjiangu");
}
// 天剑结束
//
// 辅助集菜单项
function kaiboss() {
  clickButton('clan boss go', 3)
}

function kailiubei() {
  clickButton('clan open_double go', 1);
  clickButton('clan open_triple go', 1)
}

function yongfu() {
  clickButton('items use obj_shaoxiangfu', 0)
}

function shaotanxiang() {
  goWithTimes(20, 'clan incense jx')
}

function shaochenxiang() {
  goWithTimes(5, 'clan incense cx')
}
//买箭囊------------------------------------------------
function maijiannang() {
  Confirm("需要花费500元宝，确认前往？", function() {
    go('jh 15;s;s;s;s;w;event_1_69194627 go;home;items use obj_baiyujian_bao')
  })
}
//捡钥匙------------------------------------------------
function getSilverKeyFunc() {
  var btn = getBtn("学御蜂")
  if (btn.innerHTML == "学御蜂") {
    Input("请输入捡钥匙时间间隔(秒)", "60", function(input) {
      var val = input.value;
      if (!val) return;
      val = parseInt(val);
      if (!val) {
        Alert("输入的格式有误");
        return;
      }

      getSilverKeys(); // 执行一次
      getSilverIntervalFunc = setInterval(getSilverKeys, val * 1000);
      btn.innerHTML = "停御蜂"
    })
  } else {
    clearInterval(getSilverIntervalFunc);
    btn.innerHTML = "学御蜂"
  }
}

function getSilverKeys() {
  Log("开始自动捡钥匙！");
  go('jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;s;s;s;e;e;event_1_3723773;get yin yaoshi;s;give gumu_longnv;home;study gumu_yufeng-book;study gumu_yufeng-book;study gumu_yufeng-book;study gumu_yufeng-book;study gumu_yufeng-book')
}
//杭界山------------------------------------------------
function gohj() {
  Confirm("去杭界山的世外桃源需要消耗1金锭，确认前往？", function() {
    nextgo = function() {
      setTimeout(hjs_xl, 200)
    };
    go('jh 2;n;n;e;s;luoyang317_op1;go_hjs go;se;se;ne;w;n', nextgo)
  });
}

function hjs_xl() {
  Log($('span.outtitle').text());
  if ($('span.outtitle').text().indexOf("青苔石階") > -1) {
    nextgo = function() {
      setTimeout(hjs_xl, 200)
    };
    go("ne;sw", nextgo)
  } else if ($('span.outtitle').text().indexOf("榆葉林") > -1) {
    nextgo = function() {
      setTimeout(hjs_xl, 200)
    };
    go("s;n;w", nextgo)
  } else if ($('span.outtitle').text().indexOf("杭界大門") > -1) {
    nextgo = function() {
      setTimeout(hjs_xl, 200)
    };
    go("n;ne", nextgo)
  }
  return;
}
// 买矿许可
function kuangxukeFunc() {
  go("jh 2;n;n;n;n;n;n;n;n;n;n;w;w;look_npc luoyang_kuangjian");
}

function goKuangChang(done) {
  var roomName = getRoomName();
  if (roomName != "礦洞入口") {
    execNav("jh 2;n;n;n;n;n;n;n;n;n;n;w;w;w;w", done);
  } else if (done) {
    done()
  }
}

// 采普通矿
function putongkuangFunc() {
  Input("请输入矿证数量", "1", function(input) {
    var val = parseInt(input.value);
    if (!val) {
      Alert("输入的数量有误");
      return;
    }
    goKuangChang(function() {
      goWithTimes(val, "event_1_95128595;event_1_40548659;event_1_40548659;event_1_40548659;event_1_40548659;event_1_40548659");
    });
  })
};

// 采地品矿
function dipinkuangFunc() {
  Input("请输入矿证数量", "1", function(input) {
    var val = parseInt(input.value);
    if (!val) {
      Alert("输入的数量有误");
      return;
    }
    goKuangChang(function() {
      goWithTimes(val, "event_1_39762344;event_1_64388826;event_1_64388826;event_1_64388826;event_1_64388826;event_1_64388826");
    });
  })
};
// 采天品矿
function tianpinkuangFunc() {
  Input("请输入矿证数量", "1", function(input) {
    var val = parseInt(input.value);
    if (!val) {
      Alert("输入的数量有误");
      return;
    }
    goKuangChang(function() {
      goWithTimes(val, "event_1_7898524;event_1_22920188;event_1_22920188;event_1_22920188;event_1_22920188;event_1_22920188");
    });
  })
};

// 解大石(1)
// 解中石(2)
// 解小石(3)
// 炼金矿(4)
// 炼银矿(5)
function goyielianFunc(kind) {
  var roomName = getRoomName();
  if (roomName != "冶煉場") {
    execNav("jh 2;n;n;n;n;n;n;n;n;n;n;w;w;w", function() {
      goyielianFunc(kind);
    })
    return;
  }
  // 执行
  switch (kind) {
    case 1:
      go("event_1_53776944")
      return;
    case 2:
      go("event_1_92804818")
      return;
    case 3:
      go("event_1_8771089")
      return;
    case 4:
      go("event_1_70038009")
      return;
    case 5:
      go("event_1_70129098")
      return;
  }
  Alert("未知冶炼类型:" + kind);
}
// 辅助集菜单项


// 专有活动
function caowuFunc() {
  execNav("jh 2;n;n;n;n;n;e;e;n;n;e;n")
}

function qingshuihuluFunc() {
  execNav("jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;w;nw")
}

function jingyanFunc() {
  execNav("jh 15;s;s;w;buy qingcheng_waiter")
}

function erduoFunc() {
  execNav("jh 13")
}

function luweiFunc() {
  execNav("jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w");
}

function zhurouFunc() {
  execNav("jh 15;s;s;e;buy qingcheng_tufu")
}

function huotuiFunc() {
  execNav("jh 33;sw;sw;s;s;s;s;s;s;s;e;buy dali_xiaoer2")
}

function yadanFunc() {
  execNav("jh 1;e;s;w;buy snow_old_farmer")
}

function chixiaodouFunc() {
  execNav("jh 2;n;buy luoyang_luoyang18")
}

function nuomiFunc() {
  execNav("jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;buy dali_nongfu2")
}
// 专有活动结束

addEventListener("keydown", function(key) {
  if (key.altKey || key.ctrlKey || key.metaKey || key.shiftKey) return; // 不考虑组合键
  if (document.activeElement && document.activeElement.tagName == "INPUT") return;
  switch (key.keyCode) {
    case 49: // 1
      leftMenuFunc();
      break;
    case 50: // 2
      rightMenuFunc();
      break;
    case 81: // q
      go("nw");
      break;
    case 87: // w
      go("n");
      break;
    case 69: // e
      go("ne");
      break;
    case 65: // a
      go("w");
      break;
    case 83: // s
    case 88: // x
      go("s");
      break;
    case 68: // d
      go("e");
      break;
    case 90: // z
      go("sw");
      break;
    case 67: // c
      go("se");
      break;
    case 86: // v
      go("vip");
      break;
  }
})

// 待开发的功能
function develop() {
  // 响应按钮
  var btn = getBtn("功能开发");
  if (btn.innerHTML == "功能开发") {
	Input("請輸入分鐘,秒鐘,ID,戰鬥結束後要切回的陣法編號(1~5)", getStore('timerKiller'), function(input) {
	  var val = input.value.split(',');
	  setStore('timerKiller', val);
	  if (val) {
		cc = setInterval(function() {
		  var min = new Date().getMinutes();
		  var sec = new Date().getSeconds();
		  if (val[2] == 'home') {
			var cmin = parseInt(val[0]);
			var csec = parseInt(val[1]);
			if (min == cmin && sec == csec) {
			  clearInterval(cc);
			  go("home");
			}
		  } else {
			var cmin = parseInt(val[0]);
			var csec = parseInt(val[1]) - 5;
			if (csec < 0) {
			  var cmin = cmin - 1;
			  var csec = csec + 60;
			}
			if (min == cmin && sec == csec) {
			  clearInterval(cc);
			  var storeSkill = getStore(autoBattleSkillKey5);
			  setAutoBattleData(autoBattleSkillKey5, storeSkill);
			  clickButton('kill ' + val[2], 1);
			  setTimeout(function() {
				var storeSkill = getStore('auto_battle_' + val[3]);
				setAutoBattleData('auto_battle_' + val[3], storeSkill);
				go("home");
			  }, 6000)
			}
		  }
		}, 1000)
	  }
	});
  }
}




// 版本说明
function showTip() {
  // return;
  var verTip = "ver_tip";
  if (getStore(verTip) == a80_ver) {
    return;
  }
  Message(
    a80_ver + "更新说明",
    "<br/>" +
	"* 功能修正<br />" +
	"* 歡迎加入台服論劍Q群，群號:428490361<br />" +
	"* 台版修正版腳本更新日期:9/13(v0.5)<br />" +
    "<br/>",
    function() {
      setStore(verTip, a80_ver);
    })
}
]]></>).toString();
window.eval(text);
