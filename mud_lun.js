// ==UserScript==
// @name         mud Lun TW
// @namespace    http://tampermonkey.net/
// @version      25.54 調整逃犯
// @description  個人專用
// @author       Yu
// @include      http://*.yytou.com*
// @include      http://*.hero123.com*
// @grant        none
// @run-at document-end
// ==/UserScript==
var isOnline = true;
// 單獨使用的物品
var single_use = ['obj_yonghengxianliang', 'obj_ybyb_lihe', 'obj_gqtd_lihe', 'obj_znqtd_lihe'];

// 要突破的技能
var topoText = '神龍東來,冰月破魔槍,燎原百擊,月夜鬼蕭,移花接玉刀,左手刀法,天刀八訣,天魔妙舞,神劍慧芒,不凡三劍,天外飛仙,紫虛辟邪劍,折花百式,打狗棒法,釋迦拈花指,降龍廿八掌,彈指神通,無相六陽掌,冰玄鞭法,子母龍鳳環,九星定形針,九字真言印,紫血大法,白首太玄經,龍象般若功,九陰逆,長春不老功,雲夢歸月,踏月留香,孔雀翎,飛刀絕技,覆雨劍法,織冰劍法,翻雲刀法,排雲掌,如來神掌,拈花解語鞭,十怒蛟龍索,玄冥錘子,天火飛錘,四海斷潮斬,昊天破周斧,玄天杖法,輝月杖法,破軍棍訣,千影百傷棍,道種心魔經,生生造化功,萬流歸一,幽影幻虛步,十二都天神杖';

// 要使用的技能 //
var useSkills = '天刀八訣；火貪一刀；天外飛仙；無劍之劍；神龍東來；月夜鬼蕭；燎原百擊；冰月破魔槍；如來神掌；九溪斷月槍；燎原百破；排雲掌法；九天龍吟劍法；覆雨劍法；雪飲狂刀；翻雲刀法';

// 要交好的遊俠
var loveYouxia = '李玄霸';
var autobuyfish = false;
var autozhu = false;
var userALlItem_id = '';
var userALlItem_amount = 0;

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
var accId = urlParams['id'];


var assistant = 'u6965572';
// var assistant = 'u7598681';

function getStore(key) {
	// var val = localStorage.getItem(key);
	var val = top.localStorage.getItem(key);
	if (val == null) {
		val = localStorage.getItem(accId + '_mud_lun_' + key);
	}
	return val
}

function setStore(key, val) {
	return top.localStorage.setItem(accId + '_mud_lun_' + key, val)
	// return localStorage.setItem(key, val)
}

function delStore(key) {
	return top.localStorage.removeItem(key)
}

// miti
var knownlist = [];
var right0ButtonArray = [];
var dispatchMessageListener = {};
var dispatchMessageList = [];
var clickButtonListener = {};
var show_userListener = {};
var show_scoreListener = {};
var qiangdipiTrigger = 0;
var curstamp = 0;
var prestamp = 0;
var cmdlist = [];
var deadlock = 0;
//
var hasDoneBangPai4 = false;

var my_family_name = '';

window.searchName = null;
var nameObj = {
    '4253282': '東方',
    '7030223': '王佬跟班',
    '7894304': '火狼',
    '4219507': '王佬'
};

function WriteToScreen(html) {
	var m = new Map();
	m.put("type", "main_msg");
	m.put("subtype", "html");
	m.put("msg", html)
	// mainDispatchMsg(m)
	gSocketMsg.dispatchMessage(m);
}

//go函數
var isDelayCmd = 1, // 是否延遲命令
    cmdCache = [],      // 命令池
    cmd = null,         //當前命令
    cmd_stop = 0,    //等待
    cmd_room = null,    //當前房間
    cmd_roomb = null,    //之前房間
    cmd_room1 = null,    //yell目的地
    cmd_room2 = null,    //event目的地
    cmd_target = null,    //目標npc
    cmd_target_id = null, //npc的id
    cmdBack = [],       //命令池備份
    timeCmd = null,     // 定時器句柄
    cmdDelayTime = 300; // 命令延遲時間
//-----------
function isContains(str, substr) {
    return str.indexOf(substr) >= 0;
}
//獲取房間npc
var all_npc = [];
function fj_npc(name) {
    all_npc = [];
    var r = g_obj_map.get("msg_room");
    var id = null;
    if (r) {
        for (var b = 1; r.get("npc" + b); b++) {
            var l = r.get("npc" + b).split(',');
            all_npc.push(l[0]);
            if (name == ys_replace(l[1])) {
                id = l[0];
            }
        }
    }
    return id
}
//顏色去除
function ys_replace(a) {
    a = a.replace(/\u001b.*?m|\u001b\d{1,2}\u001b|\u0003/g, "");
    return a;
}
// 執行命令串
window.go = function (str) {
    var arr = str.split(";");
    if (isDelayCmd && cmdDelayTime) {
        // 把命令存入命令池中
        cmdCache = cmdCache.concat(arr);

        // 當前如果命令沒在執行則開始執行
        if (!timeCmd) delayCmd();
    } else {
        for (var i = 0; i < arr.length; i++) {
            clickButton(arr[i])
        }
    }
};

// 執行命令池中的命令
function delayCmd() {
    if (g_gmain) {
        if (g_gmain.is_fighting) {
            cmd_go();
            return 0;
        }
    }

    var r = g_obj_map.get("msg_room");
    if (cmd_stop == 0) {
        cmd = cmdCache.shift();
        if (!cmd) {
            cmd_go();
            return 0;
        }
        if (cmd.indexOf('jh') != -1) {
            cmdBack = [];
            cmdBack.push(cmd);
        } else {
            cmdBack.push(cmd);
        }
        if (cmd.indexOf('trigger') != -1) {
            //trigger@btn-hitBang
            var id = cmd.split('@')[1];
            $('#' + id).trigger('click');
        } else if (cmd.indexOf('-') != -1) {
            if (cmd.indexOf('yell') != -1) {
                cmd_room1 = cmd.split('-')[1];
                cmd = cmd.split('-')[0];
                cmd_roomb = r.get('short').replace(/\u001b.*?m|\u001b\d{1,2}\u001b/g, "");
                clickButton(cmd);
                cmd_stop = 1;
            }
            else if (cmd.indexOf('event') != -1) {
                cmd_room2 = cmd.split('-')[1];
                cmd = cmd.split('-')[0];
                cmd_roomb = r.get('short').replace(/\u001b.*?m|\u001b\d{1,2}\u001b/g, "");
                clickButton(cmd);
                cmd = 'event';
                cmd_stop = 1;
            }
            else if (cmd.indexOf('kill') != -1 || cmd.indexOf('fight') != -1 || cmd.indexOf('ask') != -1 || cmd.indexOf('get') != -1) {
                cmd_target = cmd.split('-')[1];
                cmd = cmd.split('-')[0];
                cmd_stop = 1;
            }
            else {
                clickButton(cmd);
            }
        } else {
            if (cmd.indexOf('yell') != -1) {
                cmd_room1 = cmd.split('-')[1];
                cmd = cmd.split('-')[0];
                cmd_roomb = r.get('short').replace(/\u001b.*?m|\u001b\d{1,2}\u001b/g, "");
                clickButton(cmd);
                cmd_stop = 1;
            } else {
                clickButton(cmd);
            }
        }
    } else {
        cmd_room = r.get('short').replace(/\u001b.*?m|\u001b\d{1,2}\u001b/g, "");
        switch (cmd) {
            case 'yell': {
                if (cmd_room1 == cmd_room) {
                    cmd_room1 = null;
                    cmd_stop = 0;
                }
            }; break;
            case 'event': {
                if (cmd_room == cmd_room2) {
                    cmd_room2 = null;
                    cmd_stop = 0;
                } else if (cmd_room != cmd_roomb) {
                    cmdCache = cmdBack.concat(cmdCache);
                    cmd_room2 = null;
                    cmd_stop = 0;
                } else {
                    clickButton(cmd);
                }
            }; break;
            case 'kill': {
                if (cmd_target_id) {
                    if (g_obj_map.get("msg_combat_result")) {
                        if (all_npc.contains(g_obj_map.get("msg_combat_result").get('fail_uid').split(',')[0])) {
                            cmd_target = null;
                            cmd_target_id = null;
                            cmd_stop = 0;
                        }
                    }
                } else {
                    cmd_target_id = fj_npc(cmd_target);
                    if (cmd_target_id) {
                        clickButton(cmd + ' ' + cmd_target_id);
                    }
                }
            }; break;
            case 'fight': {
                if (cmd_target_id) {
                    if (g_obj_map.get("msg_combat_result")) {
                        if (all_npc.contains(g_obj_map.get("msg_combat_result").get('fail_uid').split(',')[0])) {
                            cmd_target = null;
                            cmd_target_id = null;
                            cmd_stop = 0;
                        }
                    }
                } else {
                    cmd_target_id = fj_npc(cmd_target);
                    if (cmd_target_id) {
                        clickButton(cmd + ' ' + cmd_target_id);
                    }
                }
            }; break;
            case 'get': {
                clickButton('golook_room');
                setTimeout(function () {
                    $("button.cmd_click3").each(function () {
                        var containNpc = isContains($(this).html(), cmd_target);
                        if (containNpc) {
                            cmd_target = null;
                            eval($(this).attr("onclick").replace("look_item corpse", "get corpse"));
                            cmd_stop = 0;
                        }
                    });
                }, 1000);
            }; break;
            case 'ask': {
                cmd_target_id = fj_npc(cmd_target);
                if (cmd_target_id) {
                    clickButton(cmd + ' ' + cmd_target_id);
                    cmd_stop = 0;
                }
            }; break;
        }
    }
    cmd_go();
}
function cmd_go() {
    // 如果命令池還有命令，則延時繼續執行
    if (cmdCache.length > 0 || cmd_stop == 1) {
        timeCmd = setTimeout(delayCmd, cmdDelayTime);
    } else {
        // 沒有命令 則歸零
        timeCmd = 1;
        setTimeout(function () {
            if (cmdCache.length == 0)
                timeCmd = 0;
            else
                delayCmd();
        }, cmdDelayTime);
    }
}
(function () {

    var btnGroup = [
        {
            'id': '0',
            'name': '隱藏按鍵',
            'function': function (e) {
                hideShowBtn(e);
            }
        },
        {
            'id': '1',
            'name': '更換技能',
            'function': function (e) {
                interServerFn1(e);
            }
        },
        {
            'id': '2',
            'name': '簽到',
            'function': function () {
                CheckIn();
            }
        }, {
            'id': '3',
            'name': '地圖導航',
            'function': function () {
                // killDrunkManFunc();
                // 買理財6
                // buyLicai();
                // vipRiChang();
                DaoHang();
            }
        }, {
            'id': '4',
            'name': '正氣中',
            'function': function (e) {
                hitScore(e);
            }
        },
        {
            'id': '51',
            'name': '搜屍',
            'function': function (e) {
                setCsearch(e);
            }
        },
        {
            'id': '5',
            'name': '江湖懸紅',
            'function': function (e) {
                jhxh_Func(e);
            }
        }, {
            'id': '6',
            'name': '跨服',
            'function': function (e) {
                interServerFn(e);
            }
        }, {
            'id': '7',
            'name': '對招',
            'function': function (e) {
                fightAllFunc(e);
            }
        }, {
            'id': '8',
            'name': '自動戰鬥',
            'function': function (e) {
                autoKill(e);
            }
        }, {
            'id': '9',
            'name': '殺青龍',
            'function': function (e) {
                killQinglong(e);
            }
        },
        // {
        //     'id': '10',
        //     'name': '搶紅包',
        //     'function': function (e) {
        //         killQLHB(e);
        //     }
        // },
        {
            'id': '11',
            'name': '殺天劍',
            'function': function (e) {
                killTianJianTargetFunc(e);
            }
        },
        {
            'id': '13',
            'name': '幫1走路',
            'function': function (e) {
                autoBang1Way(e);
            }
        }, {
            'id': '20',
            'name': '懸紅眩暈',
            'function': function (e) {
                autoKillXuanhong(e);
            }
        },
    ];

    var btnOtherGroup = [
        // {
        //     'id': 'o1',
        //     'name': '比試奇俠',
        //     'function': function (e) {
        //         startFightQixiaFn(e);
        //     }
        // },
        {
            'id': 'o18',
            'name': '給奇俠金',
            'function': function (e) {
                giveJinToQixiaFn(e);
            }
        }, {
            'id': 'o2',
            'name': '撩奇俠',
            'function': function (e) {
                // talkSelectQiXia(e);
                QiXiaTalkFunc();
            }
        },
        {
            'id': 'o3',
            'name': '試劍',
            'function': function (e) {
                CheckIn1(e);
            }
        }, {
            'id': 'o4',
            'name': '答題',
            'function': function (e) {
                answerQuestionsFunc(e)
            }
        }, {
            'id': 'o6',
            'name': '逃犯',
            'function': function (e) {
                killKuaFuTaoFanFn(e);
            }
        },
        // {
        //     'id': 'o8',
        //     'name': '墨家主線1',
        //     'function': function (e) {
        //         mojiaZhuxian(e)
        //         //青龍裝備  changeQinglong(e);
        //     }
        // },
        // {
        //     'id': 'o9',
        //     'name': '逃跑吃藥',
        //     'function': function (e) {
        //         escapeAndEat(e);
        //     }
        // },
        // {
        //     'id': 'o10',
        //     'name': '懟人',
        //     'function': function (e) {
        //         fightAllFunc1(e);
        //     }
        // },
        {
            'id': 'o11',
            'name': '切磋',
            'function': function (e) {
                // fightWithPlayer(e);
                killhideFunc(e);
            }
        }, {
            'id': 'o12',
            'name': '殺好人',
            'function': function (e) {
                killGoodNpc(e);
            }
        }, {
            'id': 'o13',
            'name': '殺壞人',
            'function': function (e) {
                killBadNpc(e);
            }
        }, {
            'id': 'o131',
            'name': '殺指定',
            'function': function (e) {
                killSomeOne(e);
            }
        }, {
            'id': 'o14',
            'name': '代碼定時',
            'function': function (e) {
                //更換奇俠 changeQiXiaName(e);
                doDaiMa(e)
            }
        },
        // {
        //     'id' : 'o14',
        //     'name' : '新春使者',
        //     'function': function(e){
        //         clickXinChun(e);
        //     }
        // },
        // {
        //     'id' : 'o15',
        //     'name' : '賣花姑娘',
        //     'function': function(e){
        //         clickMaiHua(e);
        //     }
        // },
        {
            'id': 'o16',
            'name': '快捷路徑',
            'function': function (e) {
                // getXuanTie()
                // mutourenFn()
                // 楊英雄 goYang()
                goFastWay(e)
            }
        },
        // {
        //     'id': 'o17',
        //     'name': '潛龍標記',
        //     'function': function (e) {
        //         showBiaoJi()
        //     }
        // },
        // {
        //     'id': 'o19',
        //     'name': '觀舞',
        //     'function': function (e) {
        //         // ZhuangBei(e);
        //         guanWu();
        //     }
        // },
        // {
        //     'id': 'o20',
        //     'name': '京城賭博',
        //     'function': function (e) {
        //         // ZhuangBei(e);
        //         doBo();
        //     }
        // },
        // {
        //     'id' : 'o20',
        //     'name' : '新聊奇俠',
        //     'function': function(e){
        //         QiXiaTalkFunc();
        //     }
        // },
        {
            'id': 'o21',
            // 'name' : '地圖碎片',
            'name': '突破',
            'function': function (e) {
                // ditusuipianFunc(e);
                tupoSkills2();
            }
        },
        // {
        //     'id': 'o22',
        //     'name': '突破火腿',
        //     'function': function (e) {
        //         // 交碎片 submitSuipian(e);
        //         tupoHuoTui();
        //     }
        // },
        // {
        //     'id': 'o23',
        //     'name': '對話奇俠',
        //     'function': function (e) {
        //         talkToQixiaFn(e);
        //     }
        // },
        // {
        //     'id' : 'o24',
        //     'name' : '監控年獸',
        //     'function': function(e){
        //         watchNianShou(e);
        //     }
        // },
        {
            'id': 'o25',
            'name': '合寶石',
            'function': function (e) {
                heBaoshi(e);
            }
        }, {
            'id': 'o28',
            'name': '掉線重連',
            'function': function (e) {
                //去給15金 give15Jin(e);
                openReLoad(e)
            }
        }, {
            'id': 'o26',
            'name': '定時恢復',
            'function': function (e) {
                recoverOnTimes(e);
            }
        }, {
            'id': 'o27',
            'name': '一鍵恢復',
            'function': function (e) {
                recoverOnByClick(e);
            }
        },
        {
            'id': 'o28',
            'name': '恢復內裏',
            'function': function (e) {
                recoverOnByClick1(e);
            }
        },
        // {
        //     'id': 'o29',
        //     'name': '華山碎片',
        //     'function': function (e) {
        //         goHuashanSuipian(e);
        //     }
        // },
        {
            'id': 'o30',
            'name': '突破火腿',
            'function': function (e) {
                tupoHuoTui();
            }
        },
    ];

    var btnVipGroup = [
        {
            'id': 'v1',
            'name': 'VIP簽到',
            'function': function (e) {
                CheckInFunc(e);
            }
        },
        // {
        //     'id': 'v2',
        //     'name': '開白銀',
        //     'function': function (e) {
        //         // 俠客島 newGetXiaKe(e);
        //         openBaiYin(e)
        //     }
        // }, {
        //     'id': 'v3',
        //     'name': '開青木',
        //     'function': function (e) {
        //         // 苗疆煉藥 MjlyFunc(e)
        //         openQingMu(e)
        //     }
        // }, {
        //     'id': 'v31',
        //     'name': '開曜玉',
        //     'function': function (e) {
        //         openYaoYu(e)
        //     }
        // },
        // {
        //     'id': 'v14',
        //     'name': '吃花',
        //     'function': function (e) {
        //         eatHua(e)
        //         //天山玄冰 TianShanFunc(e)
        //     }
        // },
        {
            'id': 'v17',
            'name': '點日常',
            // 'name' : '買糖葫蘆',
            'function': function (e) {
                // DaoHang(e)
                // BuyTang(e)
                vipRiChang();
            }
        },
        // {
        //     'id': 'v4',
        //     'name': '鐵雪除魔',
        //     'function': function (e) {
        //         goZhuHou();
        //     }
        // },
        // {
        //     'id': 'v5',
        //     'name': '大昭壁畫',
        //     'function': function (e) {
        //         MianBiFunc(e)
        //     }
        // },
        {
            'id': 'v6',
            'name': '完成其他',
            'function': function (e) {
                CheckInFunc1()
            }
        }, {
            'id': 'v7',
            'name': '冰月',
            'function': function (e) {
                getBingyue()
            }
        },
        // {
        //     'id': 'v8',
        //     'name': '十二宮',
        //     'function': function (e) {
        //         goCorrectJiWuPlace();
        //     }
        // },
        {
            'id': 'v9',
            'name': '跨服幫戰',
            // 'name' : '跨服裝備',
            'function': function (e) {
                // changeQinglong1();
                bangZhan_Func(e);
            }
        },
        // {
        //     'id': 'v10',
        //     'name': '打樓',
        //     'function': function (e) {
        //         fightLou(e);
        //     }
        // },
        {
            'id': 'v11',
            'name': '戰鬥裝備',
            'function': function (e) {
                beforeFightTongren(e);
            }
        },
        //  {
        //     'id': 'v12',
        //     'name': '穿衣',
        //     'function': function (e) {
        //         fightTongren(e);
        //     }
        // },
        // {
        //     'id': 'v15',
        //     'name': '跟招',
        //     'function': function (e) {
        //         followPozhaoFn(e);
        //     }
        // },
        {
            'id': 'v16',
            'name': '買藥',
            // 'name' : '天劍目標',
            'function': function (e) {
                maiYao()
                // changeTianJianTarget(e);
            }
        },
        {
            'id': 'v171',
            'name': '隊長說話',
            'function': function (e) {
                teamSay(e);
            }
        }, {
            'id': 'v181',
            'name': '跟隊長走',
            'function': function (e) {
                followTeam(e);
            }
        },
        {
            'id': 'v19',
            'name': '開白首',
            'function': function (e) {
                // 開鼻血 openBiXue(e);
                openBaiShou(e);
            }
        }, {
            'id': 's1',
            'name': '秒突卡+丸',
            'function': function (e) {
                tupoSpeed(e);
            }
        }, {
            'id': 's2',
            'name': '練習',
            'function': function (e) {
                skillPritice(e);
            }
        }, {
            'id': 's3',
            'name': '突破+舍利',
            'function': function (e) {
                tupoSpeed1(e);
            }
        },
        // {
        //     'id': 's5',
        //     'name': '打雪山',
        //     'function': function (e) {
        //         killXue(e);
        //     }
        // },
        {
            'id': 's6',
            'name': '打三樓',
            'function': function (e) {
                killThreeFloor(e);
            }
        }
        // {
        //     'id': 's6',
        //     'name': '打雪山時間',
        //     'function': function (e) {
        //         setKillXueTime(e);
        //     }
        // }
    ];

    var btnSelfGroup = [
        {
            'id': 's4',
            'name': '加入隊伍',
            'function': function (e) {
                tellJoinTeam(e);
            }
        },
        {
            'id': 's14',
            'name': '歡迎入伍',
            'function': function (e) {
                acceptTeam(e);
            }
        },
    ];
    var btnMoreGroup = [
        {
            'id': 'm1',
            'name': '殺正邪',
            'function': function (e) {
                killErNiangFn(e);
            }
        }, {
            'id': 'm2',
            'name': '殺逃犯',
            'function': function (e) {
                killTaoFanFn(e);
            }
        }, {
            'id': 'm3',
            'name': '清正邪',
            'function': function (e) {
                clearNpcFn(e);
            }
        }
    ];

    var btnWuYongGroup = [
        // {
        //     'id': 'w1',
        //     'name': '逃跑回坑',
        //     'function': function (e) {
        //         escapeStart(e);
        //     }
        // },
        // {
        //     'id': 'w2',
        //     'name': '逃跑換邊',
        //     'function': function (e) {
        //         escapechangeStart(e);
        //     }
        // },
        {
            'id': 'w3',
            'name': '按鈕代碼',
            'function': function (e) {
                showCode(e);
            }
        },
        {
            'id': 'w4',
            'name': '揣摩技能',
            'function': function (e) {
                chuoMoSkills();
            }
        },
        {
            'id': 'w5',
            'name': '補充魚餌',
            'function': function (e) {
                doOnBuyFish(e);
            }
        },
        {
            'id': 'w6',
            'name': '打祝玉研',
            'function': function (e) {
                doOnZhu(e);
            }
        }
    ];

    var qianLongGroup = [
        {
            'id': '12',
            'name': '監視潛龍',
            'function': function (e) {
                JianQianlong(e);
            }
        }
    ];

    var jianghuGroup = [
        {
            'id': '15',
            'name': '監視江湖',
            'function': function (e) {
                JianJianghu(e);
            }
        }
    ];


    //江湖懸紅提示
    var hairsfalling =
    {
        "奇俠秘境": {
            "石街": "jh 2;n;n;n;n;w;event_1_98995501;n",
            "桃花泉": "jh 3;s;s;s;s;s;nw;n;n;e",
            "潭畔草地": "jh 4;n;n;n;n;n;n;n;event_1_91604710;s;s;s;",
            "臨淵石臺": "jh 4;n;n;n;n;n;n;n;n;n;e;n",
            "沙丘小洞": "jh 6;event_1_98623439;ne;n;ne;ne;ne;event_1_97428251",
            "碧水寒潭": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e;se;se;e",
            "小洞天": "jh 24;n;n;n;n;e;e",
            "青雲坪": "jh 13;e;s;s;w;w",
            "湖邊": "jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w",
            "玉壁瀑布": "jh 16;s;s;s;s;e;n;e",
            "懸根松": "jh 9;n;w",
            "夕陽嶺": "jh 9;n;n;e",
            "天梯": "jh 24;n;n;n",
            "山溪畔": "jh 22;n;n;w;n;n;n;n;look_npc songshan_songshan7;event_1_88705407;s;s",
            "奇槐坡": "jh 23;n;n;n;n;n;n;n;n",
            "啟母石": "jh 22;n;n;w;w",
            "無極老姆洞": "jh 22;n;n;w;n;n;n;n",
            "草原": "jh 26;w",
            "戈壁": "jh 21",
            "雲步橋": "jh 24;n;n;n;n;n;n;n;n;n",
            "寒水潭": "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;e;se",
            "危崖前": "jh 25;w",
            "千尺幢": "jh 4;n;n;n;n",
            "玉女峰": "jh 4;n;n;n;n;n;n;n;n;w",
            "長空棧道": "jh 4;n;n;n;n;n;n;n;n;n;e",
            "山坳": "jh 1;e;n;n;n;n;n",
            "猢猻愁": "jh 4;n;n;n;n;n;n;e;n;n",
            "無名山峽谷": "jh 29;n;n;n;n;event_1_60035830;event_1_65661209",
            "懸崖": "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;s;e",
            "觀景臺": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e;n",
            "九老洞": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;n;n;n;n;w;n;n;n;n;n;n;n;n;n;nw;sw;w;nw;w",
            "盧崖瀑布": "jh 22;n;n;n;n;e;n"
        },
        "雪山": {
            '雪婷活動': 'jh 1;e;e;s;ne;ne',
            '揚州活動': 'jh 5;n;n;n;n;n;e;n;e;n;w;n;n',
            '峨眉活動': 'jh 8;w;nw;n;n;n;n;e;e;n;n;e;n;n;n;n;w;n;n;n;n;n;n;n;n;n;nw;nw;n;n',
            '少林活動': 'jh 13;n;n;n;n;n;n;n;n;n;n',
            '明教活動': 'jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e;se;se;e',
            '泰山活動': 'jh 24;n;n;n;n;n;n;n;n;w;n;n',
            '星宿活動': 'jh 28;n;w;w;w;w;w;w;nw;ne;nw;ne;nw;ne;nw;ne;nw;ne;nw;ne;e',
            '鐵雪活動': 'jh 31;n;n;n;w;w;w;w;n;n;n',
            '冰火雪原活動': 'jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w',
            '冰火冰湖活動': 'jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;e',
            '冰火雪山活動': 'jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;ne;n',
            '絕情谷活動': 'jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne',
            '掩月黑巖活動': 'jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;sw',
            '掩月朝暮活動': 'jh 43;w;n;n;n;ne;nw;nw;ne',
        },
        // "通天塔" :{
        //     "嚴松祝老太婆高天威宋公邁靈音靈定元易靈真靈智": "rank go 192",
        // },
        // "紅螺寺": {
        //     "項天壽言二娘郝湘震陸孤瞻石剛韓毅青衣秀土方子敬秦仲海": "rank go 193",
        // },
        // "越女劍樓": {
        //     "三少爺南仁通丹楓老人黃杉女子西門吹雪I獨孤不敗郭嵩陽張鴉九木道人陶弘景宮九曾從子沈浪燭庸子阿青歐冶子": "rank go 203",
        // },
        // "霹靂堂": {
        //     "唐經天慧明金世遺李布衣沈虎禪米蒼穹關七方歌吟李沈舟": "rank go 221",
        // },
        // "葬劍谷": {
        //     "陳家洛蕭中慧鰲拜夏雪宜華輝藍鳳凰郭靖苗人鳳何足道黃裳青蓮尊者劍魔慕容垂掃地僧重陽祖師": "rank go 222",
        // },
        // "五鼠": {
        // "「寒士列傳」":"喬陰縣-書生",
        // "金剛罩": "達摩",
        // "淑女劍": "龍兒",
        // "布鞋": "魏無極",
        // "玄蘇劍": "柳淳風",
        // "鐵戒指": "杜寬",
        // "烤雞腿": "雪亭鎮-店小二",
        // "繡花小鞋": "柳繪心",
        // "技能搭配秘籍": "魏無極",
        // "皮帽": "客商",
        // "繡鞋": "紅娘",
        // "叫花雞": "洪幫主",
        // "玉竹杖": "洪幫主",
        // "獸皮鞋": "盜墓賊",
        // "銀戒": "玉娘",
        // "腰鼓": "龜茲舞女",
        // "風花瓊釀": "方秀珣",
        // "青玉令牌": "玄甲衛士",
        // "觀海令": "白衣劍客",
        // "蓮蓬": "采蓮",
        // "拆招基礎": "王老二",
        // "金項鏈": "曲姑娘",
        // "長虹劍": "丐幫長老",
        // "金戒": "英白羅",
        // "白金項鏈": "公平子",
        // "銀絲衣": "古三通",
        // "追風棍": "冼老板",
        // "竹杖": "梁長老",
        // "大環刀": "何不凈",
        // "從壽衣撕下的布條": "孤魂野鬼",
        // "黑水伏蛟": "陸得財",
        // "烏檀木刀": "朦朧鬼影",
        // "桃木箱": "桃木箱",
        // "玉石琵琶": "琵琶鬼",
        // "銀簪": "婦人",
        // "硫磺": "謎題或師門飛",
        // "饅頭": "峨眉山-小販",
        // "粗瓷大碗": "峨眉山-飯堂",
        // "菠菜粉條": "峨眉山-飯堂",
        // "鉆石戒指": "日月神教頭目",
        // "香茶": "武當山-小翠",
        // "水蜜桃": "武當山-小翠",
        // "千斤頂": "俞二俠",
        // "黃金令牌": "夢玉樓",
        // "女兒紅": "曲馥琪",
        // "紫霜血蟬衣": "藍止萍",
        // "魔鞭翩瓏": "藍止萍",
        // "柳玉刀": "昭儀",
        // "鉆石胸針": "苗郁手",
        // "耳環": "苗郁手",
        // "繡花鞋": "昭儀",
        // "寶藍緞衫": "璦倫",
        // "腰帶": "莫欣芳",
        // "銀翅金餐": "昭蓉",
        // "紫玉寶劍": "安妮兒",
        // "吹雪殘雲巾": "蕭辟塵",
        // "吹雪殘雲靴": "蕭辟塵",
        // "吹雪殘雲衣": "蕭辟塵",
        // "吹雪殘雲帶": "蕭辟塵",
        // "妖刀狗屠": "於蘭天武",
        // "邪劍穿靈": "潘軍禪",
        // "怒龍錦胄": "於蘭天武",
        // "金鐘罩": "達摩老祖",
        // "寶玉鞋": "澄觀",
        // "齊眉棍": "澄靈",
        // "斷水劍": "澄尚",
        // "漫天花雨匕": "唐風",
        // "銀絲鏈甲衣": "唐芳",
        // "天心立命扇": "竺霽庵",
        // "紫狼刑天劍": "鹿熙吟",
        // "鬼赤劍": "程傾城",
        // "浣花令": "無名劍客",
        // "蕭瑟無晴劍": "甄不惡",
        // "玄冰經天劍": "素厲銘",
        // "微雨落花劍": "駱祺櫻",
        // "秋水長河劍": "謝麟玄",
        // "洞庭觀潮劍": "祝公博",
        // "青色道袍": "青袍老道",
        // "黃色道袍": "黃袍老道",
        // "石鎖": "青城山-黃衣鏢師",
        // "紫花瓣兒": "小甜",
        // "輕羅綢衫": "小甜",
        // "滿天星": "小甜",
        // "白羽箭囊": "兵器販子",
        // "周易": "讀千裏",
        // "步步生蓮": "湖邊",
        // "羽衣霓裳": "湖邊",
        // "小蒲團": "石室",
        // "踏雲棍": "七煞堂堂主",
        // "麻辣豆腐": "明教食堂",
        // "珊瑚白菜": "明教食堂",
        // "清水葫蘆": "明教食堂",
        // "聖火令": "張教主",
        // "淑文劍": "龍兒",
        // "銀鑰匙": "龍兒",
        // "豆漿": "肥肥",
        // "蛋糕": "肥肥",
        // "帝王劍": "夜皇",
        // "紫金杖": "靈空",
        // "舍利子": "大昭寺-乞丐",
        // "天龍槍": "楊延慶",
        // "無心錘": "巨靈",
        // "狂風鞭": "楚笑",
        // "奪魂叉": "趙長老",
        // "繡花針": "東方教主",
        // "日月神教腰牌": "外面船夫",
        // "暗靈": "張天師",
        // "飛花逐月之帶": "雪鴛",
        // "虞姬劍": "雪蕊兒",
        // "內功心法秘笈": "白袍公",
        // "金算盤": "謎題飛",
        // "鐵笛": "高侯爺",
        // "紡紗機": "紡紗女",
        // "鳳凰單樅": "茶葉販子",
        // "荀子": "江陵-書生",
        // "金飯碗": "江陵-乞丐",
        // "精鐵秤砣": "米三江",
        // "護心鏡": "江陵-巡城參將",
        // "仙桃蒸三元": "江陵-客棧小二",
        // "燕子風箏": "江小酒",
        // "五味子": "水掌櫃",
        // "鈞紅花釉": "霍無雙",
        // "桃花肚兜": "金蓮",
        // "峨嵋剌": "截道惡匪",
        // "大青樹葉": "天龍地上撿",
        // "魚鱗葉明甲": "陰九幽",
        // "鬼殺劍": "陰九幽",
        // "杜鵑花": "南詔公主",
        // "流雲劍": "謝逸紫",
        // "天龍降魔禪杖": "天龍方丈",
        // },
        "雪亭鎮": {
            "逄義": "jh 1",
            "店小二": "jh 1",
            "苦力": "jh 1;e",
            "廟祝": "jh 1;e;e",
            "野狗": "jh 1;e;e;s;ne",
            "蒙面劍客": "jh 1;e;e;s;ne;ne",
            "劉安祿": "jh 1;e;n;e",
            "武館弟子": "jh 1;e;n;e;e",
            "李火獅": "jh 1;e;n;e;e",
            "柳淳風": "jh 1;e;n;e;e;e",
            "柳繪心": "jh 1;e;n;e;e;e;e;n",
            "醉漢": "jh 1;e;n;n",
            "收破爛的": "jh 1;e;n;n",
            "花不為": "jh 1;e;n;n;n;n;e",
            "杜寬": "jh 1;e;n;n;n;n;w",
            "杜寬寬": "jh 1;e;n;n;n;n;w",
            "楊掌櫃": "jh 1;e;n;n;n;w",
            "樵夫": "jh 1;e;n;n;n;w",
            "王鐵匠": "jh 1;e;n;n;w",
            "安惜邇": "jh 1;e;n;w",
            "黎老八": "jh 1;e;s",
            "老農夫": "jh 1;e;s;w",
            "農夫": "jh 1;e;s;w",
            "魏無極": "jh 1;e;s;w;s",
            "瘋狗": "jh 1;e;s;w;w",
            "星河大師": "jh 1;inn_op1",
            "崔元基": "jh 1;inn_op1"
        },
        "洛陽": {
            "農夫": "jh 2;n",
            "守城士兵": "jh 2;n;n",
            "客商": "jh 2;n;n;e",
            "蓑衣男子": "jh 2;n;n;e;s;luoyang317_op1",
            "乞丐": "jh 2;n;n;n",
            "金刀門弟子": "jh 2;n;n;n;e",
            "王霸天": "jh 2;n;n;n;e;s",
            "地痞": "jh 2;n;n;n;n",
            "小販": "jh 2;n;n;n;n;e",
            "鄭屠夫": "jh 2;n;n;n;n;e;s",
            "綠袍老者": "jh 2;n;n;n;n;n;e;e;n;n;e;n",
            "山賊": "jh 2;n;n;n;n;n;e;e;n;n;n",
            "守墓人": "jh 2;n;n;n;n;n;e;e;n;n;n;n",
            "淩雲": "jh 2;n;n;n;n;n;e;e;n;n;n;n;e",
            "淩中天": "jh 2;n;n;n;n;n;e;e;n;n;n;n;e",
            "黑衣文士": "jh 2;n;n;n;n;n;e;e;n;n;n;n;n",
            "盜墓賊": "jh 2;n;n;n;n;n;e;e;n;n;n;n;n",
            "黑衣女子": "jh 2;n;n;n;n;n;e;e;n;n;n;n;n;get_silver",
            "白面書生": "jh 2;n;n;n;n;n;e;e;n;n;n;w",
            "護衛": "jh 2;n;n;n;n;n;e;e;n;n;w",
            "富家公子": "jh 2;n;n;n;n;n;e;n",
            "洪幫主": "jh 2;n;n;n;n;n;e;n;op1",
            "魯長老": "jh 2;n;n;n;n;n;n;e",
            "賣花姑娘": "jh 2;n;n;n;n;n;n;n",
            "劉守財": "jh 2;n;n;n;n;n;n;n;e",
            "守城武將": "jh 2;n;n;n;n;n;n;n;n",
            "瘋狗": "jh 2;n;n;n;n;n;n;n;n;n",
            "青竹蛇": "jh 2;n;n;n;n;n;n;n;n;n;e",
            "布衣老翁": "jh 2;n;n;n;n;n;n;n;n;n;e;n",
            "蕭問天": "jh 2;n;n;n;n;n;n;n;n;n;e;n;n",
            "藏劍樓首領": "jh 2;n;n;n;n;n;n;n;n;n;e;n;n;n",
            "督察官": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n;n;n;nw;w;sw;s;s;event_1_54329477;n",
            "神秘黑衣人": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n;n;n;nw;w;sw;s;s;event_1_54329477;n",
            "李元帥": "jh 2;n;n;n;n;n;n;n;n;w;luoyang14_op1",
            "陳扒皮": "jh 2;n;n;n;n;n;n;w",
            "馬倌": "jh 2;n;n;n;n;n;w;n;n;w",
            "守園老人": "jh 2;n;n;n;n;n;w;s",
            "賽牡丹": "jh 2;n;n;n;n;n;w;s;luoyang111_op1",
            "黑衣打手": "jh 2;n;n;n;n;n;w;w",
            "小偷": "jh 2;n;n;n;n;n;w;w;n",
            "玉娘": "jh 2;n;n;n;n;n;w;w;n;n;n;e",
            "張逍林": "jh 2;n;n;n;n;n;w;w;n;w;get_silver",
            "何九叔": "jh 2;n;n;n;n;w",
            "無賴": "jh 2;n;n;n;n;w;event_1_98995501;n",
            "甄大海": "jh 2;n;n;n;n;w;event_1_98995501;n;n;e",
            "紅娘": "jh 2;n;n;n;n;w;s",
            "柳小花": "jh 2;n;n;n;n;w;s;w",
            "廟祝": "jh 2;n;n;n;w",
            "老乞丐": "jh 2;n;n;n;w;putuan"
        },
        "長安": {
            "胡商": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "城門衛兵": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "江湖大盜": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;e;e",
            "李賀": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "雲夢璃": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;n;event_1_95312623",
            "遊客": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "捕快": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e",
            "捕快統領": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e",
            "苗一郎": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;e",
            "王府總管": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n",
            "王府小廝": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n",
            "董老板": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n;e",
            "龜茲樂師": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n;n",
            "上官小婉": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n;n;e",
            "龜茲舞女": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n;n;w",
            "卓小妹": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n;n;w",
            "護國軍衛": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n;w",
            "朱老板": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;n;w",
            "仇老板": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;w",
            "顧先生": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;n;w",
            "獨孤須臾": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "金甲衛士": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "獨孤皇後": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "刀僧衛": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w",
            "鎮魂使": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;s",
            "招魂師": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;w",
            "說書人": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;n;w",
            "客棧老板": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;n;w",
            "高鐵匠": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;e",
            "哥舒翰": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;e",
            "樊天縱": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;e",
            "若羌巨商": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;e",
            "烏孫馬販": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n",
            "孫三娘": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;e",
            "白衣少俠": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n",
            "玄甲衛兵": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n;n",
            "杜如晦": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n;n;n;e",
            "秦王": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n;n;n;n;n;n;n",
            "翼國公": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n;n;n;n;n;n;n;e",
            "尉遲敬德": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n;n;n;n;n;n;n;e",
            "程知節": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n;n;n;n;n;n;n;w",
            "房玄齡": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;;n;n;n;n;w",
            "馬夫": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;n",
            "大宛使者": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;n;n",
            "衛青": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;w",
            "方秀珣": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;n;w",
            "楊玄素": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;n;w",
            "遊四海": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;w",
            "糖人張": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;w",
            "無影衛": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w",
            "紫衣追影": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w",
            "城門禁衛": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w",
            "禁衛統領": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w",
            "藍色城門衛兵": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n",
            "血手天魔": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n;n;n",
            "先鋒大將": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n;n;n;n;n",
            "霍驃姚": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "看門人": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n;n;n;nw;w;sw;s",
            "欽官": "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w;w;n;n;n;n;n;n;nw;w;sw;s;s"
        },
        "華山村": {
            "米不為": "",
            "潑皮": "jh 3",
            "松鼠": "jh 3;n",
            "野兔": "jh 3;n;e",
            "潑皮頭子": "jh 3;s",
            "采花賊": "jh 3;s;e",
            "馮鐵匠": "jh 3;s;e;n",
            "村民": "jh 3;s;s",
            "方老板": "jh 3;s;s;e",
            "跛腳漢子": "jh 3;s;s;e;s",
            "雲含笑": "jh 3;s;s;e;s;huashancun24_op2",
            "英白羅": "jh 3;s;s;s",
            "劉三": "jh 3;s;s;s;s",
            "血屍": "jh 3;s;s;s;s;huashancun15_op1",
            "藏劍樓殺手": "jh 3;s;s;s;s;huashancun15_op1;event_1_46902878",
            "丐幫弟子": "jh 3;s;s;s;s;huashancun15_op1;event_1_46902878;kill-藏劍樓殺手;@藏劍樓殺手的屍體;jh 3;s;s;s;s;s;nw;n;n;n;w;give huashancun_huashancun_fb9",
            "毒蛇": "jh 3;s;s;s;s;s",
            "丐幫長老": "jh 3;s;s;s;s;s;e",
            "小狼": "jh 3;s;s;s;s;s;nw",
            "老狼": "jh 3;s;s;s;s;s;nw;n",
            "土匪": "jh 3;s;s;s;s;s;nw;n;n",
            "土匪頭目": "jh 3;s;s;s;s;s;nw;n;n;e",
            "玉牡丹": "jh 3;s;s;s;s;s;nw;n;n;e;get_silver",
            "劉龜仙": "jh 3;s;s;s;s;s;nw;n;n;n;n",
            "蕭獨眼": "jh 3;s;s;s;s;s;nw;n;n;n;n;n",
            "劉寨主": "jh 3;s;s;s;s;s;nw;n;n;n;n;n;n",
            "受傷的曲右使": "jh 3;s;s;s;s;w;get_silver",
            "曲姑娘": "jh 3;s;s;s;s;w;n",
            "朱老伯": "jh 3;s;s;w",
            "劍大師": "jh 3;s;s;w;n",
            "方寡婦": "jh 3;s;s;w;n",
            "小男孩": "jh 3;w",
            "村中地痞": "jh 3;w;event_1_59520311",
            "摳腳大漢": "jh 3;w;event_1_59520311;n",
            "黑狗": "jh 3;s;s;s",
            "黑狗": "jh 3;w;event_1_59520311;n;n",
            "青衣守衛": "jh 3;w;event_1_59520311;n;n;n",
            "葛不光": "jh 3;w;event_1_59520311;n;n;n;n;n",
            "米義為": "jh 3;w;event_1_59520311;n;n;w;get_silver",
            "王老二": "jh 3;w;n"
        },
        "華山": {
            "陶鈞": "",
            "趙輔徳": "",
            "叢雲棄": "",
            "孫駝子": "jh 4",
            "呂子弦": "jh 4;n",
            "女弟子": "jh 4;n;n",
            "遊客": "jh 4;n;n;n",
            "公平子": "jh 4;n;n;n;e",
            "白二": "jh 4;n;n;n;n;n;n",
            "山賊": "jh 4;n;n;n;n;n;n",
            "李鐵嘴": "jh 4;n;n;n;n;n;n;e",
            "趙輔德": "jh 4;n;n;n;n;n;n;e;n",
            "猿猴": "jh 4;n;n;n;n;n;n;n",
            "劍宗弟子": "jh 4;n;n;n;n;n;n;n;event_1_91604710",
            "從雲棄": "jh 4;n;n;n;n;n;n;n;event_1_91604710;s;s",
            "塵無劍": "jh 4;n;n;n;n;n;n;n;event_1_91604710;s;s;s",
            "封劍羽": "jh 4;n;n;n;n;n;n;n;event_1_91604710;s;s;s;s;e",
            "大松鼠": "jh 4;n;n;n;n;n;n;n;n",
            "英黑羅": "jh 4;n;n;n;n;n;n;n;n;n",
            "魔教嘍嘍": "jh 4;n;n;n;n;n;n;n;n;n;e",
            "史大哥": "jh 4;n;n;n;n;n;n;n;n;n;e;n",
            "盧大哥": "jh 4;n;n;n;n;n;n;n;n;n;e;n",
            "史老三": "jh 4;n;n;n;n;n;n;n;n;n;e;n;n",
            "閔老二": "jh 4;n;n;n;n;n;n;n;n;n;e;n;n;n",
            "藏劍樓刺客": "jh 4;n;n;n;n;n;n;n;n;n;e;n;n;n;e;s;event_1_11292200",
            "戚老四": "jh 4;n;n;n;n;n;n;n;n;n;e;n;n;n;n",
            "葛長老": "jh 4;n;n;n;n;n;n;n;n;n;e;n;n;n;n;e",
            "小林子": "jh 4;n;n;n;n;n;n;n;n;n;e;n;n;n;n;n",
            "高算盤": "jh 4;n;n;n;n;n;n;n;n;n;n",
            "嶽掌門": "jh 4;n;n;n;n;n;n;n;n;n;n;n",
            "舒奇": "jh 4;n;n;n;n;n;n;n;n;n;n;n;n",
            "梁師兄": "jh 4;n;n;n;n;n;n;n;n;n;n;n;n;e",
            "林師弟": "jh 4;n;n;n;n;n;n;n;n;n;n;n;n;e;s",
            "小尼姑": "jh 4;n;n;n;n;n;n;n;n;n;n;n;n;e;s;s",
            "勞師兄": "jh 4;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "寧女俠": "jh 4;n;n;n;n;n;n;n;n;n;n;n;n;n;get_silver",
            "小猴": "jh 4;n;n;n;n;n;n;n;n;n;n;n;n;w",
            "施劍客": "jh 4;n;n;n;n;n;n;n;n;n;n;w",
            "華山弟子": "jh 4;n;n;n;n;n;n;n;n;n;n;w;event_1_30014247",
            "蒙面劍客": "jh 4;n;n;n;n;n;n;n;n;n;n;w;event_1_30014247;s;s;s;s",
            "黑衣人": "jh 4;n;n;n;n;n;n;n;n;n;n;w;event_1_30014247;s;s;s;s;s;e",
            "嶽師妹": "jh 4;n;n;n;n;n;n;n;n;w;s",
            "六猴兒": "jh 4;n;n;n;n;n;n;n;n;w;w",
            "令狐大師哥": "jh 4;n;n;n;n;n;n;n;n;w;w;n",
            "風老前輩": "jh 4;n;n;n;n;n;n;n;n;w;w;n;get_xiangnang2",
            "豪客": "jh 4;n;n;w"
        },
        "揚州": {
            "船運東主": "",
            "少林惡僧": "",
            "鬥笠老人": "",
            "官兵": "jh 5",
            "大黑馬": "jh 5;n;n",
            "雙兒": "jh 5;n;n;e",
            "黑狗子": "jh 5;n;n;n",
            "武館護衛": "jh 5;n;n;n;e",
            "武館弟子": "jh 5;n;n;n;e;n",
            "方不為": "jh 5;n;n;n;e;n;n",
            "範先生": "jh 5;n;n;n;e;n;n;n",
            "古三通": "jh 5;n;n;n;e;n;n;n;e",
            "陳有德": "jh 5;n;n;n;e;n;n;n;n",
            "神秘客": "jh 5;n;n;n;e;n;n;w;n;get_silver",
            "王教頭": "jh 5;n;n;n;e;n;w",
            "遊客": "jh 5;n;n;n;n",
            "空空兒": "jh 5;n;n;n;n;n",
            "藝人": "jh 5;n;n;n;n;n",
            "朱先生": "jh 5;n;n;n;n;n;e;n;n;n",
            "馬夫人": "jh 5;n;n;n;n;n;n",
            "潤玉": "jh 5;n;n;n;n;n;n",
            "流氓": "jh 5;n;n;n;n;n;n",
            "醉仙樓夥計": "jh 5;n;n;n;n;n;n;e",
            "豐不為": "jh 5;n;n;n;n;n;n;e;n",
            "張總管": "jh 5;n;n;n;n;n;n;e;n;n",
            "胡神醫": "jh 5;n;n;n;n;n;n;e;n;n;e",
            "胖商人": "jh 5;n;n;n;n;n;n;e;n;n;n",
            "冼老板": "jh 5;n;n;n;n;n;n;e;n;n;n;n",
            "計無施": "jh 5;n;n;n;n;n;n;e;n;n;w",
            "馬員外": "jh 5;n;n;n;n;n;n;n",
            "茶社夥計": "jh 5;n;n;n;n;n;n;n;e",
            "雲九天": "jh 5;n;n;n;n;n;n;n;e",
            "柳文君": "jh 5;n;n;n;n;n;n;n;e;get_silver",
            "毒蛇": "jh 5;n;n;n;n;n;n;n;n",
            "小混混": "jh 5;n;n;n;n;n;n;n;n;n;e",
            "北城門士兵": "jh 5;n;n;n;n;n;n;n;n;n;n",
            "掃地僧": "jh 5;n;n;n;n;n;n;n;n;n;w;w;n",
            "張三": "jh 5;n;n;n;n;n;n;n;n;n;w;w;n;e",
            "火工僧": "jh 5;n;n;n;n;n;n;n;n;n;w;w;n;n;n;e",
            "柳碧荷": "jh 5;n;n;n;n;n;n;n;n;n;w;w;n;w",
            "惡丐": "jh 5;n;n;n;n;n;n;n;n;w",
            "頑童": "jh 5;n;n;n;n;n;n;n;n;w;w",
            "書生": "jh 5;n;n;n;n;n;n;n;n;w;w;n",
            "李麗君": "jh 5;n;n;n;n;n;n;n;n;w;w;n;get_silver",
            "青衣門衛": "jh 5;n;n;n;n;n;n;n;n;w;w;w",
            "玉嬌紅": "jh 5;n;n;n;n;n;n;n;n;w;w;w;s",
            "青樓小廝": "jh 5;n;n;n;n;n;n;n;n;w;w;w;s;e",
            "蘇小婉": "jh 5;n;n;n;n;n;n;n;n;w;w;w;s;e;e;s;s;e;e;s;s;s",
            "趙明誠": "jh 5;n;n;n;n;n;n;n;n;w;w;w;s;w",
            "唐老板": "jh 5;n;n;n;n;n;n;n;w",
            "劉步飛": "jh 5;n;n;n;n;n;n;w",
            "赤練仙子": "jh 5;n;n;n;n;n;w",
            "衙役": "jh 5;n;n;n;n;n;w;w;n",
            "程大人": "jh 5;n;n;n;n;n;w;w;n;n;n",
            "楚雄霸": "jh 5;n;n;n;n;n;w;w;n;n;n;get_silver",
            "公孫嵐": "jh 5;n;n;n;n;n;w;w;n;n;w",
            "白老板": "jh 5;n;n;n;n;n;w;w;s;s",
            "小飛賊": "jh 5;n;n;n;n;w",
            "賬房先生": "jh 5;n;n;n;n;w",
            "飛賊": "jh 5;n;n;n;n;w;yangzhou16_op1",
            "黃掌櫃": "jh 5;n;n;n;w",
            "鐵匠": "jh 5;n;n;w",
            "花店夥計": "jh 5;n;w;w;n"
        },
        "丐幫": {
            "裘萬家": "jh 6",
            "左全": "jh 6",
            "梁長老": "jh 6;event_1_98623439",
            "藏劍樓統領": "jh 6;event_1_98623439;ne;n",
            "何不凈": "jh 6;event_1_98623439;ne;n;ne;ne",
            "馬俱為": "jh 6;event_1_98623439;ne;n;ne;ne;ne",
            "余洪興": "jh 6;event_1_98623439;ne;n;ne;ne;ne;event_1_97428251",
            "莫不收": "jh 6;event_1_98623439;ne;ne",
            "藏劍樓探子": "jh 6;event_1_98623439;ne;ne;ne;event_1_16841370",
            "何一河": "jh 6;event_1_98623439;s",
            "密室": "jh 6;event_1_98623439;s;w"
        },
        "喬陰縣": {
            "朦朧鬼影": "jh 7;s;s;s;s;event_1_65599392",
            "桃木箱": "jh 7;s;s;s;s;event_1_65599392;n",
            "縣城官兵": "jh 7",
            "琵琶鬼": "",
            "孤魂野鬼": "jh 7",
            "藏劍樓學者": "",
            "藏劍樓長老": "",
            "守城官兵": "jh 7",
            "陸得財": "jh 7;s",
            "賣餅大叔": "jh 7;s",
            "賣包子的": "jh 7;s;s;s",
            "怪人": "jh 7;s;s;s;s;event_1_65599392;w",
            "湯掌櫃": "jh 7;s;s;s;s;s;s;e",
            "武官": "jh 7;s;s;s;s;s;s;e",
            "家丁": "jh 7;s;s;s;s;s;s;e;n",
            "貴公子": "jh 7;s;s;s;s;s;s;e;n",
            "酒樓守衛": "jh 7;s;s;s;s;s;s;e;n;n",
            "書生": "jh 7;s;s;s;s;s;s;s;s;e",
            "官家小姐": "jh 7;s;s;s;s;s;s;s;s;e;n;e",
            "丫鬟": "jh 7;s;s;s;s;s;s;s;s;e;n;e",
            "駱雲舟": "jh 7;s;s;s;s;s;s;s;s;e;n;e;s;e",
            "乾癟老太婆": "jh 7;s;s;s;s;s;s;s;sw;w",
            "婦人": "jh 7;s;s;s;s;s;s;s;sw;w;n"
        },
        "峨眉山": {
            "先鋒軍士": "jh 8;ne;e;e;e",
            "耶律霸": "jh 8;ne;e;e;e;e",
            "赤豹死士": "jh 8;ne;e;e;e;n",
            "守城軍士": "jh 8;ne;e;e;e;n;n",
            "黑鷹死士": "jh 8;ne;e;e;e;n;n;n",
            "金狼死士": "jh 8;ne;e;e;e;n;n;n;n;n",
            "運輸兵": "jh 8;ne;e;e;e;n;n;n;n;n;e",
            "王堅": "jh 8;ne;e;e;e;n;n;n;n;n;e;e;e",
            "參謀官": "jh 8;ne;e;e;e;n;n;n;n;n;e;e;e",
            "軍械官": "jh 8;ne;e;e;e;n;n;n;n;n;e;e;n",
            "神箭手": "jh 8;ne;e;e;e;n;n;n;n;n;e;e;s",
            "黑羽刺客": "jh 8;ne;e;e;e;n;n;n;n;n;e;e;s",
            "黑羽敵將": "jh 8;ne;e;e;e;n;n;n;n;n;e;e;s",
            "糧庫主薄": "jh 8;ne;e;e;e;n;n;n;n;n;e;n",
            "斥候": "jh 8;ne;e;e;e;n;n;n;n;n;e;s",
            "阿保甲": "jh 8;ne;e;e;e;n;n;n;n;n;e;s",
            "胡族軍士": "jh 8;ne;e;e;e;n;n;n;n;n;e;s",
            "傳令兵": "jh 8;ne;e;e;e;s",
            "文虛師太": "jh 8;w;nw;n;n;n;n;e;e;n;n;e",
            "看山弟子": "jh 8;w;nw;n;n;n;n;e;e;n;n;e",
            "文玉師太": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n",
            "文寒師太": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n",
            "巡山弟子": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n",
            "小女孩": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w",
            "小販": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w",
            "靜洪師太": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n",
            "靜雨師太": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n",
            "貝錦瑟": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;e;e;n;n;e",
            "毒蛇": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;n",
            "護法弟子": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;ne",
            "護法大弟子": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;ne;ne",
            "方碧翠": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;ne;ne;n",
            "滅絕掌門": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;ne;ne;n",
            "靜慈師太": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;ne;ne;se;e",
            "靜玄師太": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;w;w;n;n;w",
            "尼姑": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;w;w;w;w;n",
            "飯堂": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;e;e;n;n;n;e",
            "女孩": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;w;w;w;w;n",
            "小尼姑": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;w;w;w;w;sw",
            "青書少俠": "jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;n;e;e",
            "白猿": "jh 8;w;nw;n;n;n;n;w"
            //jh 8;w;nw;n;n;n;n;e;e;n;n;e;kill-看山弟子;n;n;n;n;w;n;n;n;n;n;n;n;n;n;nw;nw;n;n;
        },
        "恒山": {
            "山盜": "jh 9",
            "秦卷簾": "jh 9;n",
            "鄭婉兒": "jh 9;n;n",
            "啞太婆": "jh 9;n;n;e",
            "雲問天": "jh 9;n;n;n",
            "石高達": "jh 9;n;n;n;n",
            "公孫浩": "jh 9;n;n;n;n;e",
            "不可不戒": "jh 9;n;n;n;n;henshan15_op1",
            "山蛇": "jh 9;n;n;n;n;n",
            "嵩山弟子": "jh 9;n;n;n;n;n;event_1_85624865",
            "司馬承": "jh 9;n;n;n;n;n;event_1_85624865;n;e",
            "沙江龍": "jh 9;n;n;n;n;n;event_1_85624865;n;n;n;henshan_zizhiyu11_op1",
            "史師兄": "jh 9;n;n;n;n;n;event_1_85624865;n;n;n;n",
            "趙誌高": "jh 9;n;n;n;n;n;event_1_85624865;n;w",
            "定雲師太": "jh 9;n;n;n;n;n;n;n",
            "儀雨": "jh 9;n;n;n;n;n;n;n;e;e",
            "儀容": "jh 9;n;n;n;n;n;n;n;e;n",
            "吸血蝙蝠": "jh 9;n;n;n;n;n;n;n;n",
            "定安師太": "jh 9;n;n;n;n;n;n;n;n;n",
            "神教殺手": "jh 9;n;n;n;n;n;n;n;n;n;w",
            "魔教殺手": "jh 9;n;n;n;n;n;n;n;n;n;w;n;e;henshan_qinqitai23_op1",
            "魔教長老": "jh 9;n;n;n;n;n;n;n;n;n;w;n;e;n",
            "魔教護衛": "jh 9;n;n;n;n;n;n;n;n;n;w;n;e;n",
            "神秘人": "jh 9;n;n;n;n;n;n;n;n;n;w;n;event_1_89533343",
            "魔教頭目": "jh 9;n;n;n;n;n;n;n;n;n;w;n;n;n;n",
            "日月神教頭目": "jh 9;n;n;n;n;n;n;n;n;n;w;n;n;n;n",
            "小師太": "jh 9;n;n;n;n;n;n;n;w;n",
            "柳雲煙": "jh 9;n;n;n;w",
            "九戒大師": "jh 9;n;w"
        },
        "武當山": {
            "土匪": "jh 10",
            "布衣弟子": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n",
            "劍童": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;n;n",
            "劍遇安": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;n;n;n",
            "劍遇治": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;ne;n;n",
            "劍遇山": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;ne;n;n;e",
            "劍遇行": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;ne;s;e",
            "劍遇鳴": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;ne;s;sw",
            "劍遇南": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;nw;nw",
            "劍遇穆": "jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;n;n;n;nw;nw;n",
            "野兔": "jh 10;w;n;n;w",
            "進香客": "jh 10;w;n;n;w;w",
            "青書少俠": "jh 10;w;n;n;w;w",
            "知客道長": "jh 10;w;n;n;w;w;w;n;n;n",
            "道童": "jh 10;w;n;n;w;w;w;n;n;n;n",
            "蜜蜂": "jh 10;w;n;n;w;w;w;n;n;n;n;e;e;e;e;s;e;s;e;n",
            "小蜜蜂": "jh 10;w;n;n;w;w;w;n;n;n;n;e;e;e;e;s;e;s;e;n",
            "猴子": "jh 10;w;n;n;w;w;w;n;n;n;n;e;e;e;e;s;e;s;e;s",
            "清虛道長": "jh 10;w;n;n;w;w;w;n;n;n;n;n",
            "宋首俠": "jh 10;w;n;n;w;w;w;n;n;n;n;n",
            "張松溪": "jh 10;w;n;n;w;w;w;n;n;n;n;n;e",
            "俞二俠": "jh 10;w;n;n;w;w;w;n;n;n;n;n;e;e;e;e",
            "小翠": "jh 10;w;n;n;w;w;w;n;n;n;n;n;e;e;s",
            "俞蓮舟": "jh 10;w;n;n;w;w;w;n;n;n;n;n;n",
            "張三豐": "jh 10;w;n;n;w;w;w;n;n;n;n;n;n;n;n;n"
        },
        "晚月莊": {
            "晚月莊": "jh 11",
            "蝴蝶": "jh 11;e;e;s",
            "小販": "jh 11;e;e;s;n;nw;w;nw;e",
            "酒肉和尚": "jh 11;e;e;s;n;nw;w;nw;e;e;e;n;w",
            "陳子昂": "jh 11;e;e;s;n;nw;w;nw;e;e;e;se",
            "彩衣少女": "jh 11;e;e;s;sw",
            "金絲雀": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw",
            "美珊": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw",
            "小白兔": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se",
            "顏慧如": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se",
            "小金鼠": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n;n;n;w;s;s;w",
            "上官鈺翎": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n;n;n;w;s;s;w",
            "襲人": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n",
            "藍小蝶": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n;n;n;w;s;s;w;e;n",
            "曲馥琪": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n;n;n;w;s;s;w;e;n;n;e;n;n;n;w;n;s;w;n;w;e;s;w;w;e;s;n;e;s;w;e;s;e;e;e",
            "夢玉樓": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n;n;n;w;s;s;w;e;n;n;e;n;n;n;w;n;s;w;n;w;e;s;w;w;e;s;n;e;s;w;e;s;e;e;e;w;w;w;w;w;n;s;s",
            "芙雲": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n;n;n;w;s;s;w;e;n;n;e;n;n;n;w;n;s;w;n;w;e;s;w;w;e;s;n;e;s;w;e;s;e;e;e;w;w;w;w;w;n;s;s;n;e;s",
            "惜春": "jh 11;e;e;s;sw;se;s;s;s;e;se;s;sw;s;n;nw;w;nw;w;e;se;e;n;n;n;w;s;s;w;e;n;n;e;n;n;n;w;n;s;w;n;w;e;s;w;w;e;s;n;e;s;w;e;s;e;e;e;w;w;w;w;w;n;s;s;n;e;s;n;e;s;e;s;s;e;w;w;s;e;e;w;w;n;e;n;n;w;w;w;e;n;n;w;e;n;n;w",
            "婢女": "jh 11;e;e;s;sw;se;w",
            "藍止萍": "jh 11;e;e;s;sw;se;w",
            "藍雨梅": "jh 11;e;e;s;sw;se;w;n",
            "芳綾": "jh 11;e;e;s;sw;se;w;w;n;w",
            "昭蓉": "jh 11;e;e;s;sw;se;w;w;s;s;w",
            "昭儀": "jh 11;e;e;s;sw;se;w;w;w;w",
            "苗郁手": "jh 11;e;e;s;sw;se;w;w;s;s;s",
            "圓春": "jh 11;e;e;s;sw;se;w;w;s;s;s",
            "璦倫": "jh 11;e;e;s;sw;se;w;w;s;s;s;e;s;s;e",
            "虞瓊衣": "jh 11;e;e;s;sw;se;w;w;s;s;s;e;s;s;w",
            "龍韶吟": "jh 11;e;e;s;sw;se;w;w;s;s;s;e;s;s;w;s",
            "阮欣郁": "jh 11;e;e;s;sw;se;w;w;s;s;s;e;s;s;w;s;e",
            "金儀彤": "jh 11;e;e;s;sw;se;w;w;s;s;s;e;s;s;w;s;e;e",
            "鳳凰": "jh 11;e;e;s;sw;se;w;w;s;s;s;e;s;s;w;s;e;e"
        },
        "水煙閣": {
            "天邪虎": "jh 12;n;n;n",
            "水煙閣武士": "jh 12;n;n;n",
            "董老頭": "jh 12;n;n;n;e;n;n",
            "潘軍禪": "jh 12;n;n;n;n",
            "蕭辟塵": "jh 12;n;n;n;n",
            "水煙閣紅衣武士": "jh 12;n;n;n;w;n;nw",
            "水煙閣司事": "jh 12;n;n;n;w;n;nw;e",
            "於蘭天武": "jh 12;n;n;n;w;n;nw;e;n",
            "天邪水煙閣": "jh 12"
        },
        "少林寺": {
            "澄知": "",
            "虛通": "jh 13",
            "虛明": "jh 13;n",
            "山豬": "jh 13",
            "渡雲": "jh 13;e;s;s;w;w;w",
            "渡雨": "jh 13;e;s;s;w;w;w",
            "渡風": "jh 13;e;s;s;w;w;w",
            "僧人": "jh 13;n",
            "慧色尊者": "jh 13;n;n",
            "慧空尊者": "jh 13;n;n;n;n",
            "慧名尊者": "jh 13;n;n;n;n",
            "慧真尊者": "jh 13;n;n;n;n;n;n;n;n;n;n;n",
            "慧虛尊者": "jh 13;n;n;n;n;n;n;n;n;n;n;n",
            "慧修尊者": "jh 13;n;n;n;n;n;n;n;n;n;n;n;n",
            "慧合尊者": "jh 13;n;n;n;n;n;n;n;n;w",
            "慧潔尊者": "jh 13;n;n;n;n;n;n;n;n;w",
            "掃地和尚": "jh 13;n;n",
            "慧如尊者": "jh 13;n;n",
            "灑水僧": "jh 13;n;n;e",
            "小北": "jh 13;n;n;n",
            "玄痛大師": "jh 13;n;n;n",
            "進香客": "jh 13;n;n;n;n",
            "掃地僧": "jh 13;n;n;n;n;e",
            "行者": "jh 13;n;n;n;n;e",
            "道象禪師": "jh 13;n;n;n;n;n",
            "小南": "jh 13;n;n;n;n;n",
            "巡寺僧人": "jh 13;n;n;n;n;n;n",
            "托缽僧": "jh 13;n;n;n;n;n;n",
            "打坐僧人": "jh 13;n;n;n;n;n;n;e",
            "清曉比丘": "jh 13;n;n;n;n;n;n;n",
            "黑衣大漢": "jh 13;n;n;n;n;n;n;n",
            "清緣比丘": "jh 13;n;n;n;n;n;n;n",
            "清為比丘": "jh 13;n;n;n;n;n;n;n;n",
            "清無比丘": "jh 13;n;n;n;n;n;n;n;n",
            "小沙彌": "jh 13;n;n;n;n;n;n;n;n",
            "清聞比丘": "jh 13;n;n;n;n;n;n;n;n",
            "玄悲大師": "jh 13;n;n;n;n;n;n;n;n;e",
            "玄慈大師": "jh 13;n;n;n;n;n;n;n;n;n",
            "清樂比丘": "jh 13;n;n;n;n;n;n;n;n;n",
            "清善比丘": "jh 13;n;n;n;n;n;n;n;n;n",
            "清法比丘": "jh 13;n;n;n;n;n;n;n;n;n;n",
            "清觀比丘": "jh 13;n;n;n;n;n;n;n;n;n;n",
            "立雪亭": "jh 13;n;n;n;n;n;n;n;n;n;n",
            "白眉老僧": "jh 13;n;n;n;n;n;n;n;n;n;n",
            "青松": "jh 13;n;n;n;n;n;n;n;n;n;n;n",
            "冷幽蘭": "jh 13;n;n;n;n;n;n;n;n;n;n;n;e",
            "慧輪": "jh 13;n;n;n;n;n;n;n;n;n;n;n;n",
            "守藥僧": "jh 13;n;n;n;n;n;n;n;n;n;n;n;n;e",
            "砍柴僧": "jh 13;n;n;n;n;n;n;n;n;n;n;n;n;w",
            "道相禪師": "jh 13;n;n;n;n;n;n;n;n;n;n;n;n;w",
            "達摩老祖": "jh 13;n;n;n;n;n;n;n;n;n;n;n;n;w;n;get_silver",
            "道一禪師": "jh 13;n;n;n;n;n;n;n;n;n;n;n;w",
            "玄難大師": "jh 13;n;n;n;n;n;n;n;n;n;n;n;w",
            "道正禪師": "jh 13;n;n;n;n;n;n;n;n;n;n;n;w",
            "葉十二娘": "jh 13;n;n;n;n;n;n;n;n;n;shaolin25_op1",
            "玄苦大師": "jh 13;n;n;n;n;n;n;n;n;w",
            "灰衣僧": "jh 13;n;n;n;n;n;n;n;shaolin27_op1",
            "蕭遠山": "jh 13;n;n;n;n;n;n;n;shaolin27_op1",
            "守經僧人": "jh 13;n;n;n;n;n;n;n;shaolin27_op1;event_1_34680156",
            "盈盈": "jh 13;n;n;n;n;n;n;w",
            "道塵禪師": "jh 13;n;n;n;n;w",
            "獄卒": "jh 13;n;n;n;n;w",
            "道成禪師": "jh 13;n;n;w",
            "挑水僧": "jh 13;n;n;w",
            "道品禪師": "jh 13;n;w",
            "田鼠": "jh 13;n;w",
            "道覺禪師": "jh 13;n;w;w",
            "小孩": "jh 13;n;w;w",

            "澄觀": "jh 13;n;n;n;n;n;n;n;n;n;n;e",
            "澄知": "jh 13;n;n;n;n;n;n;n;n;n;n;e;s",
            "澄明": "jh 13;n;n;n;n;n;n;n;n;n;n;e;s;s",
            "澄凈": "jh 13;n;n;n;n;n;n;n;n;n;n;e;s;s;s",
            "澄堅": "jh 13;n;n;n;n;n;n;n;n;n;n;e;s;s;s;s;s",
            "澄寂": "jh 13;n;n;n;n;n;n;n;n;n;n;e;s;s;s;s;s;s",
            "澄滅": "jh 13;n;n;n;n;n;n;n;n;n;n;e;s;s;s;s;s;s;s",
            "澄和": "jh 13;n;n;n;n;n;n;n;n;n;n;e;s;s;s;s;s;s;s;s",
            "澄心": "jh 13;n;n;n;n;n;n;n;n;n;n;w",
            "澄意": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s",
            "澄思": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s;s",
            "澄識": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s;s;s",
            "澄誌": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s",
            "澄信": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;s",
            "澄靈": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;s;s",
            "澄欲": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;s;s;s",
            "澄尚": "jh 13;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;s;s;s;s"
        },
        "唐門": {
            "高一毅": "jh 14;e",
            "張之嶽": "jh 14;e;event_1_10831808;n",
            "程傾城": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e",
            "無名劍客": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e",
            "默劍客": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e",
            "竺霽庵": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n",
            "甄不惡": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne",
            "素厲銘": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne;e",
            "駱祺櫻": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne;e;se",
            "謝麟玄": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne;e;se;s;se",
            "祝公博": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne;e;se;s;se;e",
            "黃衫少女": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne;e;se;s;se;e;ne",
            "鹿熙吟": "jh 14;sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne;e;se;s;se;e;ne;n",
            "唐門弟子": "jh 14;w;n",
            "唐風": "jh 14;w;n;n",
            "唐看": "jh 14;w;n;n;n",
            "唐門弟子": "jh 14;w;n;n;n;e;e;n",
            "唐健": "jh 14;w;n;n;n;e;e;n",
            "(黃色)唐門弟子": "jh 14;w;n;n;n;e;e;n",
            "唐舌": "jh 14;w;n;n;n;e;e;n;e",
            "唐情": "jh 14;w;n;n;n;e;e;n;n",
            "唐剛": "jh 14;w;n;n;n;e;e;n;n",
            "歐陽敏": "jh 14;w;n;n;n;e;e;n;n;ask tangmen_tangmei;ask tangmen_tangmei;e;event_1_8413183;event_1_39383240;e;s;e;n;w;n;n",
            "方媃": "jh 14;w;n;n;n;n",
            "唐怒": "jh 14;w;n;n;n;n",
            "唐鶴": "jh 14;w;n;n;n;w;s",
            "唐鏢": "jh 14;w;n;n;n;w;w;s",
            "唐芳": "jh 14;w;n;n;n;w;w;w;n",
            "唐緣": "jh 14;w;n;n;n;w;w;w;s"
        },
        "青城山": {
            "海公公": "jh 15",
            "遊方郎中": "jh 15;n",
            "孽龍之靈": "jh 15;n;nw;w;nw;n;event_1_14401179",
            "孽龍分身": "jh 15;n;nw;w;nw;n;event_1_14401179",
            "暗甲盟主": "jh 15;n;nw;w;nw;n;event_1_14401179;event_1_80293122;n;n",
            "暗甲將領": "jh 15;n;nw;w;nw;n;event_1_14401179;event_1_80293122;n;n",
            "青城弟子": "jh 15;n;nw;w;nw;w;s;s",
            "候老大": "jh 15;n;nw;w;nw;w;s;s",
            "青城派弟子": "jh 15;n;nw;w;nw;w;s;s",
            "羅老四": "jh 15;n;nw;w;nw;w;s;s;s",
            "吉人英": "jh 15;n;nw;w;nw;w;s;s;s;kill-羅老四;w;w",
            "賈老二": "jh 15;n;nw;w;nw;w;s;s;s;kill-羅老四;w;w;n",
            "小室": "jh 15;n;nw;w;nw;w;s;s;s;kill-羅老四;w;w;n",
            "余大掌門": "jh 15;n;nw;w;nw;w;s;s;s;kill-羅老四;w;w;w",
            "黃袍老道": "jh 15;n;nw;w;nw;w;s;s;s;kill-羅老四;w;w;w;n",
            "青袍老道": "jh 15;n;nw;w;nw;w;s;s;s;kill-羅老四;w;w;w;n",
            "於老三": "jh 15;n;nw;w;nw;w;s;s;s;kill-羅老四;w;w;w;n;w",
            "仵作": "jh 15;s;ne",
            "惡少": "jh 15;s;s",
            "仆人": "jh 15;s;s",
            "屠夫": "jh 15;s;s;e",
            "小甜": "jh 15;s;s;s;e",
            "讀千裏": "jh 15;s;s;s;s;e",
            "福州府尹": "jh 15;s;s;s;s;s;e",
            "背劍老人": "jh 15;s;s;s;s;s;s;s;s;s;e;s",
            "木道神": "jh 15;s;s;s;s;s;s;w",
            "兵器販子": "jh 15;s;s;s;s;w",
            "阿美": "jh 15;s;s;s;w;w;n",
            "紅衣鏢師": "jh 15;s;s;s;w;w;s;s",
            "黃衣鏢師": "jh 15;s;s;s;w;w;s;s",
            "鏢局弟子": "jh 15;s;s;s;w;w;s;s",
            "林師弟": "jh 15;s;s;s;w;w;w;w;w;n",
            "店小二": "jh 15;s;s;w",
            "酒店老板": "jh 15;s;s;w",
            "女侍": "jh 15;s;s;w;n",
            "酒店女老板": "jh 15;s;s;w;n"
        },
        "逍遙林": {
            "石室": "jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w;event_1_57688376;n;n;w;w",
            "吳統領": "jh 16;s;s;s;s;e;e;s;w",
            "蒙面人": "jh 16;s;s;s;s;e;e;s;w",
            "範棋癡": "jh 16;s;s;s;s;e;e;s;w;n",
            "馮巧匠": "jh 16;s;s;s;s;e;e;s;w;s;s",
            "蘇先生": "jh 16;s;s;s;s;e;e;s;w;w",
            "石師妹": "jh 16;s;s;s;s;e;e;s;w;w;n",
            "薛神醫": "jh 16;s;s;s;s;e;e;s;w;w;n;n",
            "康琴癲": "jh 16;s;s;s;s;e;e;s;w;w;s;s",
            "茍書癡": "jh 16;s;s;s;s;e;e;s;w;w;w",
            "李唱戲": "jh 16;s;s;s;s;e;e;s;w;w;w;w;s",
            "天山姥姥": "jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w;event_1_57688376;n;n;e;n;event_1_88625473;event_1_82116250;event_1_90680562;event_1_38586637",
            "常一惡": "jh 16;s;s;s;s;e;n;e;event_1_56806815"
        },
        "開封": {
            "駱駝": "jh 17",
            "官兵": "jh 17;e",
            "七煞堂弟子": "jh 17;e;s",
            "七煞堂打手": "jh 17;e;s;s",
            "七煞堂護衛": "jh 17;e;s;s;s;s",
            "七煞堂堂主": "jh 17;e;s;s;s;s;s",
            "毒蛇": "jh 17;event_1_97081006",
            "野豬": "jh 17;event_1_97081006;s",
            "黑鬃野豬": "jh 17;event_1_97081006;s;s;s;s",
            "野豬王": "jh 17;event_1_97081006;s;s;s;s;s",
            "白面人": "jh 17;event_1_97081006;s;s;s;s;s;w;kaifeng_yezhulin05_op1",
            "鶴發老人": "jh 17;event_1_97081006;s;s;s;s;s;w;w",
            "鹿杖老人": "jh 17;event_1_97081006;s;s;s;s;s;w;w",
            "燈籠小販": "jh 17;n",
            "小男孩": "jh 17;n",
            "歐陽春": "jh 17;n;e",
            "展昭": "jh 17;n;e",
            "包拯": "jh 17;n;e;s",
            "皮貨商": "jh 17;n;n",
            "武官": "jh 17;n;n;e",
            "菜販子": "jh 17;n;n;e;e",
            "玄衣少年": "jh 17;n;n;e;e",
            "碼頭工人": "jh 17;n;n;e;e;n",
            "落魄書生": "jh 17;n;n;e;e;n;get_silver",
            "船老大": "jh 17;n;n;e;e;n;n",
            "王老板": "jh 17;n;n;e;e;s",
            "高衙內": "jh 17;n;n;e;s",
            "護寺僧人": "jh 17;n;n;e;s;s",
            "燒香老太": "jh 17;n;n;e;s;s;s",
            "潑皮": "jh 17;n;n;e;s;s;s;e",
            "老僧人": "jh 17;n;n;e;s;s;s;e;e",
            "燒火僧人": "jh 17;n;n;e;s;s;s;e;s",
            "張龍": "jh 17;n;n;e;s;s;s;s",
            "孔大官人": "jh 17;n;n;e;s;s;s;s;w",
            "素齋師傅": "jh 17;n;n;e;s;s;s;w",
            "李四": "jh 17;n;n;n",
            "陳舉人": "jh 17;n;n;n;e",
            "流浪漢": "jh 17;n;n;n;n",
            "富家弟子": "jh 17;n;n;n;n;e",
            "趙虎": "jh 17;n;n;n;n;n",
            "踏青婦人": "jh 17;n;n;n;n;n;e",
            "平夫人": "jh 17;n;n;n;n;n;e;n;n",
            "惡狗": "jh 17;n;n;n;n;n;e;n;n;n",
            "平怪醫": "jh 17;n;n;n;n;n;e;n;n;n;event_1_27702191",
            "楊排風": "jh 17;n;n;n;n;w",
            "天波侍衛": "jh 17;n;n;n;n;w",
            "柴郡主": "jh 17;n;n;n;n;w;w;w",
            "穆桂英": "jh 17;n;n;n;n;w;w;w;n;n",
            "楊文姬": "jh 17;n;n;n;n;w;w;w;n;n;w",
            "侍女": "jh 17;n;n;n;n;w;w;w;s",
            "佘太君": "jh 17;n;n;n;n;w;w;w;s;s;w",
            "楊延昭": "jh 17;n;n;n;n;w;w;w;w",
            "新郎官": "jh 17;n;n;w",
            "混混張三": "jh 17;n;n;w;n",
            "鐵翼": "jh 17;n;n;w;n;n",
            "劉財主": "jh 17;n;n;w;n;n",
            "趙大夫": "jh 17;n;w",
            "新娘": "jh 17;sw;nw",
            "耶律夷烈": "jh 17;sw;s;sw;nw;ne;event_1_38940168"
        },
        "光明頂": {
            "村民": "jh 18",
            "滄桑老人": "jh 18;e",
            "明教小聖使": "jh 18;n;nw;n;n;n;n;n",
            "聞旗使": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n",
            "韋蝠王": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n",
            "彭散玉": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n",
            "唐旗使": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e",
            "周散仙": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e;n",
            "莊旗使": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e;n;n",
            "冷步水": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n",
            "張散仙": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;e",
            "冷文臻": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n",
            "殷鷹王": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n",
            "明教教眾": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n",
            "謝獅王": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;e",
            "張教主": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;n",
            "範右使": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;n;n",
            "小昭": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;n;n;n",
            "黛龍王": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;w",
            "明教食堂": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;w",
            "九幽毒魔": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;w;nw;nw;event_1_70957287",
            "青衣女孩": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;w;nw;nw;event_1_70957287;event_1_39374335;kill mingjiao_jiuyoudutong;event_1_2077333",
            "九幽毒童": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;n;n;n;n;w;nw;nw;event_1_70957287;event_1_39374335",
            "明教小嘍啰": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;w",
            "辛旗使": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;w;w",
            "布袋大師": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;w;w;n",
            "顏旗使": "jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;w;w;n;n",
            "村婦": "jh 18;w",
            "小男孩": "jh 18;w;n",
            "老太婆": "jh 18;w;n"
        },
        "全真教": {
            "終南山遊客": "jh 19;s;s;s;sw;s",
            "男童": "jh 19;s;s;s;sw;s;e;n;nw",
            "全真女弟子": "jh 19;s;s;s;sw;s;e;n;nw;n",
            "迎客道長": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n",
            "程遙伽": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n",
            "尹誌平": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n",
            "練功弟子": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n",
            "孫不二": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;e;e;e",
            "柴火道士": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;e;e;n;n",
            "馬鈺": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n",
            "丘處機": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n",
            "老道長": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;e",
            "王處一": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n",
            "鹿道清": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;e",
            "青年弟子": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n",
            "譚處端": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n;n;e",
            "劉處玄": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n;n;e;e",
            "掌廚道士": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n;n;e;e;e",
            "小麻雀": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n;n;e;e;e;n",
            "老人": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "挑水道士": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;e",
            "蜜蜂": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;n",
            "觀想獸": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;w",
            "趙師兄": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;w;n",
            "老頑童": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;n;w;w;n",
            "(藏經殿)小道童": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;n;w",
            "王重陽": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;w;w;s",
            "小道童": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;w;w;w;s",
            "郝大通": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;n;n;w;w;w;w;n;n;n",
            "健馬": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;w;w;w;s",
            "李四": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;n;w;w;w;s",
            "(事為室)小道童": "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;w"
        },
        "古墓": {
            "天蛾": "jh 20;w;w;s;e;s;s;s",
            "食蟲虻": "jh 20;w;w;s;e;s;s;s;s;s;sw",
            "玉蜂": "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s",
            "玉蜂": "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;s;e",
            "龍兒": "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;s;s;s;e;e",
            "林祖師": "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;s;s;s;e;e;event_1_3723773;se;n;e;s;e;s;e",
            "孫婆婆": "jh 20;w;w;s;e;s;s;s;s;s;sw;sw;s;s;s;s;s;s;s;e;e;e;e;s;e"
        },
        "白駝山": {
            "白駝山": "jh 21",
            "玉門守將": "jh 21;n;n;n;n;e",
            "匈奴殺手": "jh 21;n;n;n;n;e;n;n;n",
            "玉門守軍": "jh 21;n;n;n;n;e;e",
            "玄甲騎兵": "jh 21;n;n;n;n;e;e;e",
            "車夫": "jh 21;n;n;n;n;e;e;e;e",
            "天策大將": "jh 21;n;n;n;n;e;e;e;e;e",
            "玄甲參將": "jh 21;n;n;n;n;e;e;e;e;e",
            "鳳七": "jh 21;n;n;n;n;e;e;e;e;e;s;s;w",
            "慕容孤煙": "jh 21;n;n;n;n;e;e;e;e;e;e;e;s",
            "醉酒男子": "jh 21;n;n;n;n;e;e;e;e;e;e;e;s",
            "馬匪": "jh 21;n;n;n;n;e;e;e;e;e;e;e;e;e",
            "花花公子": "jh 21;nw",
            "寡婦": "jh 21;nw;ne;ne",
            "小山賊": "jh 21;nw;ne;n;n",
            "山賊": "jh 21;nw;ne;n;n;ne;n",
            "侍杖": "jh 21;nw;ne;n;n;ne;w",
            "雷橫天": "jh 21;nw;ne;n;n;ne;n;n",
            "金花": "jh 21;nw;ne;n;n;ne;n;n;w",
            "鐵匠": "jh 21;nw;s",
            "農民": "jh 21;nw;w",
            "舞蛇人": "jh 21;nw;w",
            "店小二": "jh 21;nw;w;n",
            "村姑": "jh 21;nw;w;w",
            "小孩": "jh 21;nw;w;w;nw",
            "農家婦女": "jh 21;nw;w;w;nw;e",
            "樵夫": "jh 21;nw;w;w;nw;nw;nw",
            "門衛": "jh 21;nw;w;w;nw;n;n",
            "仕衛": "jh 21;nw;w;w;nw;n;n;n;w",
            "丫環": "jh 21;nw;w;w;nw;n;n;n;n",
            "歐陽少主": "jh 21;nw;w;w;nw;n;n;n;n",
            "李教頭": "jh 21;nw;w;w;nw;n;n;n;n;n",
            "小青": "jh 21;nw;w;w;nw;n;n;n;n;n;w;s",
            "黑冠巨蟒": "jh 21;nw;w;w;nw;n;n;n;n;n;w;w;w;n",
            "蟒蛇": "jh 21;nw;w;w;nw;n;n;n;n;n;w;w;w;n;n;n",
            "教練": "jh 21;nw;w;w;nw;n;n;n;n;n;e",
            "陪練童子": "jh 21;nw;w;w;nw;n;n;n;n;n;e;ne",
            "管家": "jh 21;nw;w;w;nw;n;n;n;n;n;n",
            "白衣少女": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n",
            "老毒物": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n",
            "肥肥": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;e",
            "老材": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;e;e",
            "張媽": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;nw",
            "白兔": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;ne",
            "狐貍": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;ne;w",
            "老虎": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;ne;w",
            "野狼": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;ne;w",
            "雄獅": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;ne;w",
            "竹葉青蛇": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;ne;e",
            "金環蛇": "jh 21;nw;w;w;nw;n;n;n;n;n;n;n;n;ne;e"
        },
        "嵩山": {
            "嵩山": "jh 22",
            "腳夫": "jh 22",
            "秋半仙": "jh 22;n",
            "風騷少婦": "jh 22;n",
            "錦袍老人": "jh 22;n;n",
            "遊客": "jh 22;n;n;w",
            "野狼": "jh 22;n;n;w;n",
            "山賊": "jh 22;n;n;w;n;n;n",
            "林立德": "jh 22;n;n;w;n;n",
            "修行道士": "jh 22;n;n;w;n;n;n;n",
            "黃色毒蛇": "jh 22;n;n;w;n;n;n;n;event_1_88705407",
            "麻衣刀客": "jh 22;n;n;w;n;n;n;n;event_1_88705407;s;s",
            "白板煞星": "jh 22;n;n;w;n;n;n;n;event_1_88705407;s;s;s;s",
            "小猴": "jh 22;n;n;w;n;n;n;n;n",
            "萬大平": "jh 22;n;n;w;n;n;n;n;n;e",
            "芙兒": "jh 22;n;n;w;n;n;n;n;n;e;e",
            "嵩山弟子": "jh 22;n;n;w;n;n;n;n;n;e;n",
            "麻衣漢子": "jh 22;n;n;w;n;n;n;n;n;e;n;n;w;n",
            "史師兄": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n",
            "白頭仙翁": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n",
            "左挺": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n",
            "鐘九曲": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;e",
            "樂老狗": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;w",
            "夥夫": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;w;n;w",
            "沙禿翁": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;w;w",
            "陸太保": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;n",
            "鄧神鞭": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;n;n",
            "聶紅衣": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;n;n;e",
            "高錦毛": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;n;e",
            "左盟主": "jh 22;n;n;w;n;n;n;n;n;e;n;n;n;n;n;n;n;n",
            "吸血蝙蝠": "jh 22;n;n;w;w;s",
            "瞎眼劍客": "jh 22;n;n;w;w;s;s",
            "瞎眼刀客": "jh 22;n;n;w;w;s;s;s;s;w",
            "瞎眼老者": "jh 22;n;n;w;w;s;s;s;s;s",
            "柳易之": "jh 22;n;n;n;n",
            "盧鴻一": "jh 22;n;n;n;n;e",
            "英元鶴": "jh 22;n;n;n;n;e;n"
        },
        "梅莊": {
            "柳府家丁": "jh 23",
            "老者": "jh 23;n;n",
            "柳玥": "jh 23;n;n",
            "筱西風": "jh 23;n;n;e",
            "梅莊護院": "jh 23;n;n;n",
            "梅莊家丁": "jh 23;n;n;n;n;n",
            "施令威": "jh 23;n;n;n;n;n;n",
            "丁管家": "jh 23;n;n;n;n;n;n;n",
            "黑老二": "jh 23;n;n;n;n;n;n;n;e;s",
            "瘦小漢子": "jh 23;n;n;n;n;n;n;n;n",
            "丹老四": "jh 23;n;n;n;n;n;n;n;n;e;n",
            "上官香雲": "jh 23;n;n;n;n;n;n;n;n;n;n",
            "禿筆客": "jh 23;n;n;n;n;n;n;n;n;n;n;e",
            "黑衣刀客": "jh 23;n;n;n;n;n;n;n;n;n;n;event_1_8188693;n",
            "青衣劍客": "jh 23;n;n;n;n;n;n;n;n;n;n;event_1_8188693;n;n",
            "黃衫婆婆": "jh 23;n;n;n;n;n;n;n;n;n;n;event_1_8188693;n;n;n;e;n",
            "紅衣僧人": "jh 23;n;n;n;n;n;n;n;n;n;n;event_1_8188693;n;n;n;n",
            "紫袍老者": "jh 23;n;n;n;n;n;n;n;n;n;n;event_1_8188693;n;n;w",
            "琴童": "jh 23;n;n;n;n;n;n;n;n;n;n;w",
            "黃老朽": "jh 23;n;n;n;n;n;n;n;n;n;n;w;n",
            "地牢看守": "jh 23;n;n;n;n;n;n;n;n;n;n;w;n;kill-黃老朽;get-黃老朽的屍體;s;e;s;s;s;w;w;give meizhuang_meizhuang3",
            "地鼠": "jh 23;n;n;n;n;n;n;n;n;n;n;w;n;kill-黃老朽;get-黃老朽的屍體;s;e;s;s;s;w;w;give meizhuang_meizhuang3;n;n",
            "柳蓉": "jh 23;n;n;n;n;n;n;n;n;w",
            "丁二": "jh 23;n;n;n;n;n;n;n;n;w;n",
            "聾啞老人": "jh 23;n;n;n;n;n;n;n;n;w;w",
            "向左使": "jh 23;n;n;n;n;n;n;n;w;w"
        },
        "泰山": {
            "泰山": "jh 24",
            "挑夫": "jh 24",
            "黃衣刀客": "jh 24;n",
            "瘦僧人": "jh 24;n;n",
            "柳安庭": "jh 24;n;n;n",
            "石雲天": "jh 24;n;n;n;n",
            "程不為": "jh 24;n;n;n;n;w",
            "朱瑩瑩": "jh 24;n;n;n;n;e",
            "溫青青": "jh 24;n;n;n;n;e;e",
            "易安居士": "jh 24;n;n;n;n;e;e",
            "歐陽留雲": "jh 24;n;n;n;n;e;s",
            "呂進": "jh 24;n;n;n;n;n",
            "司馬玄": "jh 24;n;n;n;n;n;n",
            "桑不羈": "jh 24;n;n;n;n;n;n;e",
            "魯剛": "jh 24;n;n;n;n;n;n;w",
            "於霸天": "jh 24;n;n;n;n;n;n;n",
            "神秘遊客": "jh 24;n;n;n;n;n;n;n;e",
            "海棠殺手": "jh 24;n;n;n;n;n;n;n;n;w",
            "路獨雪": "jh 24;n;n;n;n;n;n;n;n;w;n;n",
            "鐵雲": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n",
            "孔翎": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;n;n",
            "姬梓煙": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w",
            "朱櫻林": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n",
            "柳蘭兒": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n",
            "布衣男子": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n;event_1_15941870",
            "阮小": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n;event_1_15941870;n",
            "史義": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n;event_1_15941870;n;e",
            "阮大": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n;event_1_15941870;n;w",
            "司馬墉": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n;event_1_15941870;n;n;n;w",
            "林忠達": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n;event_1_15941870;n;n;n;n",
            "鐵面人": "jh 24;n;n;n;n;n;n;n;n;w;n;n;n;w;n;event_1_15941870;n;n;n;n;n",
            "李三": "jh 24;n;n;n;n;n;n;n;n;n",
            "仇霸": "jh 24;n;n;n;n;n;n;n;n;n;e",
            "平光傑": "jh 24;n;n;n;n;n;n;n;n;n;n",
            "玉師弟": "jh 24;n;n;n;n;n;n;n;n;n;n;w",
            "玉師兄": "jh 24;n;n;n;n;n;n;n;n;n;n;n",
            "玉師伯": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n",
            "任娘子": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e",
            "黃老板": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;s",
            "紅衣衛士": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e",
            "西門允兒": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e;n;n;w",
            "白飛羽": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e;n;e",
            "商鶴鳴": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e;n;n;e",
            "鐘逍林": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e;n;n;n;n",
            "西門宇": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;e;e;n;n;n;n;n",
            "黑衣密探": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;w",
            "毒蛇": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;w;n",
            "筱墨客": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;w;n;n;w",
            "遲一城": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "泰山弟子": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "建除": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e",
            "天柏": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "天松": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "玉師叔": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w",
            "泰山掌門": "jh 24;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n"
        },
        "鐵血大旗門": {
            "鐵血大旗門": "jh 25",
            "賓奴": "jh 25;w",
            "漁夫": "jh 25;e;e;e",
            "葉緣": "jh 25;e;e;e;e;s",
            "老婆子": "jh 25;e;e;e;e;s;yell-常春島渡口",
            "潘興鑫": "jh 25;e;e;e;e;s;yell-常春島渡口;s",
            "羅少羽": "jh 25;e;e;e;e;s;yell-常春島渡口;e",
            "青衣少女": "jh 25;e;e;e;e;s;yell-常春島渡口;e;ne",
            "日島主": "jh 25;e;e;e;e;s;yell-常春島渡口;e;ne;se;e;e;e;e",
            "鐵掌門": "jh 25;e;e;e;e;s;yell-常春島渡口;s;e;event_1_81629028",
            "夜皇": "jh 25;e;e;e;e;s;yell-常春島渡口;s;e;event_1_81629028;s;e;n;w;w",
            "紅衣少女": "jh 25;e;e;e;e;s;yell-常春島渡口;s;e;event_1_81629028;s;e;n;w;w;s;w",
            "紫衣少女": "jh 25;e;e;e;e;s;yell-常春島渡口;s;e;event_1_81629028;s;e;n;w;w;s;w",
            "藍衣少女": "jh 25;e;e;e;e;s;yell-常春島渡口;s;e;event_1_81629028;s;e;n;w;w;s;w",
            "橙衣少女": "jh 25;e;e;e;e;s;yell-常春島渡口;s;e;event_1_81629028;s;e;n;w;w;s;w",
            "小販": "jh 11;e;e;s;n;nw;w;nw;e",
            "酒肉和尚": "jh 11;e;e;s;n;nw;w;nw;e;e;e;n;w",
            "陳子昂": "jh 11;e;e;s;n;nw;w;nw;e;e;e;se"
        },
        "大昭寺": {
            "李將軍": "jh 26;w;w;n",
            "突厥先鋒大將": "jh 26;w;w;n;n",
            "神秘甲士": "jh 26;w;w;n;w",
            "牧羊女": "jh 26",
            "草原狼": "jh 26;w",
            "小綿羊": "jh 26;w",
            "牧羊女": "jh 26;w;w",
            "大綿羊": "jh 26;w;w",
            "白衣少年": "jh 26;w;w;w",
            "小羊羔": "jh 26;w;w;w",
            "城衛": "jh 26;w;w;w;w;w",
            "紫衣妖僧": "jh 26;w;w;w;w;w;n",
            "塔僧": "jh 26;w;w;w;w;w;n",
            "關外旅客": "jh 26;w;w;w;w;w;w",
            "護寺喇嘛": "jh 26;w;w;w;w;w;w",
            "護寺藏尼": "jh 26;w;w;w;w;w;w;n",
            "蔔一刀": "jh 26;w;w;w;w;w;w;n;n;e",
            "瘋狗": "jh 26;w;w;w;w;w;w;n;n;w",
            "余洪興": "jh 26;w;w;w;w;w;w;s",
            "店老板": "jh 26;w;w;w;w;w;w;s;e",
            "野狗": "jh 26;w;w;w;w;w;w;s;s;w;w;w;w",
            "收破爛的": "jh 26;w;w;w;w;w;w;s;s;w;w;w;w",
            "樵夫": "jh 26;w;w;w;w;w;w;s;s;w;w;w;w",
            "乞丐": "jh 26;w;w;w;w;w;w;s;s;w;w;w;w;n;n",
            "陶老大": "jh 26;w;w;w;w;w;w;s;w",
            "胭松": "jh 26;w;w;w;w;w;w;w;w;n;e",
            "塔祝": "jh 26;w;w;w;w;w;w;w;w;w",
            "靈空": "jh 26;w;w;w;w;w;w;w;w;w;w",
            "護寺藏尼": "jh 26;w;w;w;w;w;w;w;w;w;w",
            "葛倫": "jh 26;w;w;w;w;w;w;w;w;w;w;ask lama_master;event_1_91837538"
        },
        "黑木崖": {
            "冉無望": "jh 27;ne;n;ne",
            "外面船夫": "jh 27;ne;nw;w;nw;w;w",
            "藍色魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地-空地;n;n;n;n;n;n;e;e;e;e;e;n",
            "紅色魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;e;e;e;e;n",
            "青色魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;e;e;e;n",
            "紫色魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;e;n",
            "紫色魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n",
            "亮藍色魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;n",
            "見錢開": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;e",
            "(藍色)魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;e;e;e;e;e;n",
            "(紅色)魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;e;e;e;e;n",
            "(青色)魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;e;e;e;n",
            "(紫色)魔教犯人": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;e;n",
            "(紫色)魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n",
            "獨孤風": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;e",
            "楊延慶": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;e;e",
            "範松": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;e;e;e",
            "巨靈": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e",
            "楚笑": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;e;e;e;e;e",
            "蓮亭": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;n",
            "(亮藍色)魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;n",
            "東方教主": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;n;n;event_1_57107759;e;e;n;w",
            "花想容": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;w",
            "曲右使": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;w;w",
            "張矮子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;w;w;w",
            "張白發": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w",
            "趙長老": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;w",
            "王誠": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;ne",
            "上官雲": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;w;n",
            "桑三娘": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;w;ne",
            "葛停香": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;w;nw",
            "羅烈": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;w;se",
            "賈布": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;w;sw",
            "鮑長老": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n;yell-空地;n;n;n;n;n;n;w;w",
            "裏面船夫": "jh 27;ne;nw;w;nw;w;w;yell",
            "(青色)魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n",
            "青色魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n",
            "魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n",
            "白色魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n",
            "(白色)魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n",
            "(藍色)魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n",
            "藍色魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n",
            "黃色魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n",
            "(黃色)魔教弟子": "jh 27;ne;nw;w;nw;w;w;kill-船夫;get-船夫的屍體;yell-飲馬灘;w;nw;n;n;n;n;n;n;n;w;n;n;n;n;n;n;n;n;n;n",
            "店小二": "jh 27;ne;w",
            "客店老板": "jh 27;ne;w",
            "黑熊": "jh 27;se;e",
            "怪人": "jh 27;se;e;e;e"
        },
        "星宿海": {
            "波斯商人": "jh 28",
            "牧羊人": "jh 28;n",
            "星宿派鈸手": "jh 28;n;n",
            "星宿派鼓手": "jh 28;n;n",
            "獅吼師兄": "jh 28;n;n",
            "星宿派號手": "jh 28;n;n",
            "摘星大師兄": "jh 28;n;n;n",
            "丁老怪": "jh 28;n;n;n;n;n",
            "采花子": "jh 28;n;n;n;n;n;n;nw;w",
            "紫姑娘": "jh 28;n;w",
            "天狼師兄": "jh 28;n;w;n",
            "出塵師弟": "jh 28;n;w;n;n",
            "采藥人": "jh 28;n;w;w",
            "周女俠": "jh 28;n;w;w;w;w",
            "毒蛇": "jh 28;n;w;w;w;w",
            "牦牛": "jh 28;n;w;w;w;w;w;w;nw;ne;nw;w",
            "雪豹": "jh 28;n;w;w;w;w;w;w;nw;ne;nw;w",
            "唐冠": "jh 28;nw",
            "伊犁": "jh 28;nw",
            "矮胖婦女": "jh 28;nw",
            "巴依": "jh 28;nw;e",
            "小孩": "jh 28;nw;e",
            "阿凡提": "jh 28;nw;e;e",
            "伊犁馬": "jh 28;nw;nw",
            "阿拉木罕": "jh 28;nw;nw",
            "買賣提": "jh 28;nw;w",
            "天梵密使": "jh 28;nw;w;buy /map/xingxiu/npc/obj/fire from xingxiu_maimaiti;e;se;sw;event_1_83637364",
            "梅師姐": "jh 28;sw",
            "鐵屍": "jh 28;sw;nw;sw;sw;nw;nw;se;sw"
        },
        "茅山": {
            "茅山": "jh 29",
            "野豬": "jh 29;n",
            "張天師": "jh 29;n;n;n;n;event_1_60035830-平臺;event_1_65661209-無名山峽谷;n",
            "萬年火龜": "jh 29;n;n;n;n;event_1_60035830-平臺;event_1_65661209-無名山峽谷;n",
            "陽明居士": "jh 29;n;n;n;n;event_1_60035830-平臺;e",
            "道士": "jh 29;n;n;n;n;event_1_60035830-平臺;event_1_65661209-洞口;n;n;n;n;n;e;n",
            "孫天滅": "jh 29;n;n;n;n;event_1_60035830-平臺;event_1_65661209-洞口;n;n;n;n;n;n;n",
            "道靈": "jh 29;n;n;n;n;event_1_60035830-平臺;event_1_65661209-洞口;n;n;n;n;n;n;n;event_1_98579273",
            "護山使者": "jh 29;n;n;n;n;event_1_60035830-平臺;event_1_65661209-洞口;n;n;n;n;n;n;n;event_1_98579273;w",
            "林忌": "jh 29;n;n;n;n;event_1_60035830-平臺;event_1_65661209-洞口;n;n;n;n;n;n;n;event_1_98579273;n"
        },
        "桃花島": {
            "陸廢人": "jh 30",
            "老漁夫": "jh 30;n;n;n;n;n;n",
            "桃花島弟子": "jh 30;n;n;n;n;n;n;n",
            "(後院)桃花島弟子": "jh 30;n;n;n;n;n;n;n",
            "曲三": "jh 30;n;n;n;n;n;n;n;n;n;n;e;e;n",
            "丁高陽": "jh 30;n;n;n;n;n;n;n;n;n;n;e;s",
            "黃島主": "jh 30;n;n;n;n;n;n;n;n;n;n;n;n;n;n",
            "蓉兒": "jh 30;n;n;n;n;n;n;n;n;n;n;n;n;n;n;se;s",
            "桃花島弟子": "jh 30;n;n;n;n;n;n;n;n;n;n;w",
            "(習武房)桃花島弟子": "jh 30;n;n;n;n;n;n;n;n;n;n;w",
            "桃花島弟子": "jh 30;n;n;n;n;n;n;n;n;n;n;w;w;s",
            "(藥房)桃花島弟子": "jh 30;n;n;n;n;n;n;n;n;n;n;w;w;s",
            "啞仆": "jh 30;n;n;n;n;n;n;n;n;n;n;w;w;s",
            "啞仆人": "jh 30;n;n;n;n;n;n;n;w;w",
            "神雕大俠": "jh 30;n;n;ne",
            "傻姑": "jh 30;yell-牛家村海邊;w;n",
            "戚總兵": "jh 30;yell-牛家村海邊;w;n;e"
        },
        "鐵雪山莊": {
            "樵夫": "jh 31;n;n;n",
            "樵夫": "jh 31;n;n;n;w",
            "歐冶子": "jh 31;n;n;n;w;w;w",
            "老張": "jh 31;n;n;n;w;w;w;w;n",
            "雪鴛": "jh 31;n;n;n;w;w;w;w;n;n",
            "小翠": "jh 31;n;n;n;w;w;w;w;n;n;n",
            "雪蕊兒": "jh 31;n;n;n;w;w;w;w;n;n;n",
            "鐵少": "jh 31;n;n;n;w;w;w;w;n;n;n",
            "白袍公": "jh 31;n;n;n;w;w;w;w;n;n;n;n",
            "黑袍公": "jh 31;n;n;n;w;w;w;w;n;n;n;n",
            "陳小神": "jh 31;n;se",
            "劍蕩八荒": "jh 31;n;se;e",
            "魏嬌": "jh 31;n;se;e;se",
            "神仙姐姐": "jh 31;n;se;e;se;s",
            "寒夜·斬": "jh 31;n;se;e;se;s;s",
            "他": "jh 31;n;se;e;se;s;s;sw",
            "出品人◆風雲": "jh 31;n;se;e;se;s;s;sw;se",
            "二虎子": "jh 31;n;se;e;se;s;s;sw;se;se",
            "歡樂劍客": "jh 31;n;se;e;se;s;s;sw;se;se;e",
            "黑市老鬼": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw",
            "縱橫老野豬": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e",
            "無頭蒼蠅": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne",
            "神弒☆鐵手": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n",
            "禪師": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne",
            "道一": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n",
            "采菊隱士": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n",
            "【人間】雨修": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n",
            "漢時嘆": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;e;e;event_1_47175535",
            "冷泉心影": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;e;n",
            "烽火戲諸侯": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;n;n;n;e;e;event_1_94442590",
            "阿不": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;n;n;n;w;w;event_1_57281457",
            "男主角◆番茄": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;w;n",
            "劍仙": "jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;w;w;sw",
            "小飛": "jh 31;n;se;e;se;s;w"
        },
        "慕容山莊": {
            "家丁": "jh 32;n;n",
            "鄧家臣": "jh 32;n;n;se",
            "朱姑娘": "jh 32;n;n;se;e;s;s",
            "船工小廝": "jh 32;n;n;se;e;s;s;event_1_99232080",
            "芳綾": "jh 32;n;n;se;e;s;s;event_1_99232080;e;e;s;e;s;e;e;e",
            "無影斥候": "jh 32;n;n;se;e;s;s;event_1_99232080;e;e;s;e;s;e;e;e;n",
            "柳掌門": "jh 32;n;n;se;e;s;s;event_1_99232080;e;e;s;e;s;e;e;e;s;s;event_1_92057893;e;s;event_1_8205862",
            "慕容老夫人": "jh 32;n;n;se;n",
            "慕容侍女": "jh 32;n;n;se;n",
            "公冶家臣": "jh 32;n;n;se;n;n",
            "包家將": "jh 32;n;n;se;n;n;n;n",
            "風波惡": "jh 32;n;n;se;n;n;n;n;n",
            "慕容公子": "jh 32;n;n;se;n;n;n;n;w;w;n",
            "慕容家主": "jh 32;n;n;se;n;n;n;n;w;w;w;n;event_1_72278818;event_1_35141481;event_1_35141481;event_1_35141481;event_1_35141481;event_1_35141481;event_1_35141481;w",
            "小蘭": "jh 32;n;n;se;n;n;n;n;w;w;w;n;w",
            "神仙姐姐": "jh 32;n;n;se;n;n;n;n;w;w;w;n;w;n;e;n;e;n;e",
            "小茗": "jh 32;n;n;se;n;n;n;n;w;w;w;n;w;n;e;n;e;n;n",
            "王夫人": "jh 32;n;n;se;n;n;n;n;w;w;w;n;w;n;e;n;e;n;n",
            "嚴媽媽": "jh 32;n;n;se;n;n;n;n;w;w;w;n;w;n;e;n;e;n;w"
        },
        "大理": {
            "擺夷女子": "jh 33;sw;sw",
            "士兵": "jh 33;sw;sw;s;s",
            "武將": "jh 33;sw;sw;s;s",
            "51": "jh 33;sw;sw;s;s",
            "臺夷商販": "jh 33;sw;sw;s;s;s;nw;n",
            "烏夷商販": "jh 33;sw;sw;s;s;s;nw;n",
            "土匪": "jh 33;sw;sw;s;s;s;nw;n;ne;n;n;ne",
            "獵人": "jh 33;sw;sw;s;s;s;nw;n;nw;n",
            "皮貨商": "jh 33;sw;sw;s;s;s;nw;n;nw;n",
            "牧羊女": "jh 33;sw;sw;s;s;s;nw;n;nw;n;n;n;n;e;e",
            "牧羊人": "jh 33;sw;sw;s;s;s;nw;n;nw;n;n;n;n;e;e",
            "僧人": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;e;e",
            "貴公子": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;e;e;e;e;e",
            "惡奴": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;e;e;e;e;e",
            "枯大師": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;e;e;e;n",
            "平通鏢局鏢頭": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s",
            "「平通鏢局」鏢頭": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s",
            "遊客": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e",
            "村婦": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e",
            "段公子": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne",
            "農夫": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e",
            "(陽宗鎮)臺夷商販": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e",
            "臺夷商販": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e",
            "老祭祀": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;ne;e;n",
            "老祭司": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;ne;e;n",
            "采桑女": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;s",
            "竹葉青蛇": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;sw",
            "(陽宗鎮)采筍人": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;sw;s",
            "采筍人": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;sw;s",
            "砍竹人": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;sw;s;s",
            "養蠶女": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;sw;s;s;e;e",
            "紡紗女": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;e;e;e;ne;e;e;se;e;e;sw;s;s;e;n;e;n",
            "麻雀": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;s",
            "小道姑": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;s;w",
            "刀俏尼": "jh 33;sw;sw;s;s;s;s;e;e;e;e;se;s;s;w;n",
            "毒蜂": "jh 33;sw;sw;s;s;s;s;e;e;n",
            "傅護衛": "jh 33;sw;sw;s;s;s;s;s;e",
            "褚護衛": "jh 33;sw;sw;s;s;s;s;s;e;n",
            "家丁": "jh 33;sw;sw;s;s;s;s;s;e;n;se",
            "丹頂鶴": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e",
            "段王妃": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e",
            "養花女": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e;e;e",
            "段無畏": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e;n",
            "古護衛": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e;n;n",
            "王府禦醫": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e;n;n;n",
            "婉清姑娘": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e;n;n;n;ne;e;e;n",
            "段皇爺": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e;n;n;n;ne;n",
            "石人": "jh 33;sw;sw;s;s;s;s;s;e;n;se;e;e;s",
            "範司馬": "jh 33;sw;sw;s;s;s;s;s;e;n;se;n;e",
            "巴司空": "jh 33;sw;sw;s;s;s;s;s;e;n;se;n;n",
            "華司徒": "jh 33;sw;sw;s;s;s;s;s;e;n;se;n;w",
            "霍先生": "jh 33;sw;sw;s;s;s;s;s;e;n;se;w",
            "石匠": "jh 33;sw;sw;s;s;s;s;s;s;e;e",
            "薛老板": "jh 33;sw;sw;s;s;s;s;s;s;e;n",
            "江湖藝人": "jh 33;sw;sw;s;s;s;s;s;s;s",
            "太和居店小二": "jh 33;sw;sw;s;s;s;s;s;s;s;e",
            "歌女": "jh 33;sw;sw;s;s;s;s;s;s;s;e;n",
            "南國姑娘": "jh 33;sw;sw;s;s;s;s;s;s;s;s;e;s",
            "擺夷老叟": "jh 33;sw;sw;s;s;s;s;s;s;s;s;e;s",
            "大土司": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;n;w;n",
            "族頭人": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;n;w;n;se;ne",
            "黃衣衛士": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;n;w;s",
            "盛皮羅客商": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s",
            "客店店小二": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;e",
            "古燈大師": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;s",
            "族長": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;s;e;n;n",
            "祭司": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;s;e;n;n;n",
            "祭祀": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;s;s;e;n;n;n",
            "漁夫": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;s;se;sw;n",
            "臺夷獵人": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;s;se;sw;s",
            "臺夷婦女": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;s;se;sw;w",
            "臺夷姑娘": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;sw;sw",
            "水牛": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;sw;sw;n",
            "臺夷農婦": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;sw;sw;s",
            "采筍人": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;sw;sw;w",
            "(武定鎮)采筍人": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;s;s;s;sw;sw;w",
            "野兔": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;se",
            "侍者": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;w;w;se",
            "高侯爺": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;w;w;se;n",
            "素衣衛士": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;w;w;se;n",
            "傣族首領": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;w;w;se;n;n;e;e;se",
            "陪從": "jh 33;sw;sw;s;s;s;s;s;s;s;s;s;s;w;w;se;n;n;w;se",
            "擺夷小孩": "jh 33;sw;sw;s;s;s;s;s;s;w",
            "錦衣衛士": "jh 33;sw;sw;s;s;s;s;s;w",
            "朱護衛": "jh 33;sw;sw;s;s;s;s;s;w",
            "太監": "jh 33;sw;sw;s;s;s;s;s;w;n;n",
            "宮女": "jh 33;sw;sw;s;s;s;s;s;w;n;n;n;n",
            "破嗔": "jh 33;sw;sw;s;s;s;s;w;w;n",
            "破疑": "jh 33;sw;sw;s;s;s;s;w;w;n",
            "段惡人": "jh 33;sw;sw;s;s;s;s;w;w;n;se",
            "神農幫弟子": "jh 33;sw;sw;s;s;s;s;w;w;s",
            "無量劍弟子": "jh 33;sw;sw;s;s;s;s;w;w;s;nw",
            "吳道長": "jh 33;sw;sw;s;s;s;s;w;w;w;w",
            "(鎮雄)農夫": "jh 33;sw;sw;s;s;s;s;w;w;w;w;w;n;e",
            "農夫": "jh 33;sw;sw;s;s;s;s;w;w;w;w;w;n;e",
            "山羊": "jh 33;sw;sw;s;s;s;s;w;w;w;w;w;n;n",
            "少女": "jh 33;sw;sw;s;s;s;s;w;w;w;w;w;n;ne",
            "老祭祀": "jh 33;sw;sw;s;s;s;s;w;w;w;w;w;n;w;se",
            "老祭司": "jh 33;sw;sw;s;s;s;s;w;w;w;w;w;n;w;se",
            "孟加拉虎": "jh 33;sw;sw;s;s;s;s;w;w;w;w;w;s;s;w;w"
        },
        "斷劍山莊": {
            "斷劍山莊": "jh 34",
            "黑袍老人": "jh 34;ne;e;e;e;e;e;n;e;n",
            "白袍老人": "jh 34;ne;e;e;e;e;e;n;e;n",
            "和尚": "jh 34;ne;e;e;e;e;e;n;n;n;n;n;w",
            "尼姑": "jh 34;ne;e;e;e;e;e;n;n;n;n;n;n;e",
            "擺渡老人": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-小船",
            "天怒劍客": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;e;e",
            "任笑天": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;w;w",
            "摘星老人": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;w;s;w",
            "落魄中年": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;w;s",
            "栽花老人": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;n",
            "背刀人": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;n;e;e",
            "雁南飛": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;n;e;n;e",
            "夢如雪": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;n;n;w;w",
            "劍癡": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;n;n;n;n",
            "霧中人": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;n;n;n;n;n",
            "獨孤不敗": "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;yell-斷劍山莊;n;n;n;n;n;n;e;e;event_1_10251226"
        },
        "冰火島": {
            "冰火島": "jh 35",
            "火麒麟王": "jh 35;nw;nw;nw;n;ne;nw",
            "火麒麟": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;n;nw",
            "麒麟幼崽": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;n;nw",
            "遊方道士": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e",
            "梅花鹿": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e",
            "雪狼": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w;nw",
            "白熊": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w;nw",
            "殷夫人": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w;nw;s;s;s;s;s;s;e",
            "張五俠": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w;nw;s;s;s;s;s;s;w;w;n;e;n;w;w;s;s",
            "趙郡主": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n",
            "謝獅王": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;ne;n",
            "黑衣殺手": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;w;n;w;nw",
            "元真和尚": "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;w;n;w;nw;sw;se;s;sw;sw;se;se"
        },
        "俠客島": {
            "俠客島": "jh 36",
            "黃衣船夫": "jh 36;yell-俠客島渡口",
            "俠客島廝仆": "jh 36;yell-俠客島渡口",
            "張三": "jh 36;yell-俠客島渡口;e",
            "雲遊高僧": "jh 36;yell-俠客島渡口;e;ne;ne",
            "王五": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;s",
            "白衣弟子": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;s",
            "店小二": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;s;e",
            "俠客島閑人": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;s;w",
            "石公子": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;n",
            "書生": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;n",
            "丁當": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;n;n",
            "白掌門": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;n;w",
            "馬六": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e",
            "俠客島弟子": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e",
            "李四": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;n",
            "藍衣弟子": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;n",
            "童子": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e",
            "龍島主": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e",
            "木島主": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e;fly;e",
            "侍者": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e;e",
            "史婆婆": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e;e;e",
            "矮老者": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e;e;e;e;n;n;n;e;ne;nw",
            "高老者": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e;e;e;e;n;n;n;e;ne;nw;w",
            "謝居士": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e;e;e;e;n;e;e;ne",
            "朱熹": "jh 36;yell-俠客島渡口;e;ne;ne;ne;e;e;e;e;e;e;n;n;n;w;w",
            "小猴子": "jh 36;yell-俠客島渡口;e;se;e",
            "樵夫": "jh 36;yell-俠客島渡口;e;se;e;e",
            "醫者": "jh 36;yell-俠客島渡口;e;se;e;e;e;e",
            "石幫主": "jh 36;yell-俠客島渡口;e;se;e;e;n;e;s",
            "野豬": "jh 36;yell-俠客島渡口;e;se;e;e;w",
            "漁家男孩": "jh 36;yell-俠客島渡口;e;se;e;e;s;s;s;w",
            "漁夫": "jh 36;yell-俠客島渡口;e;se;e;e;s;s;s;s",
            "漁家少女": "jh 36;yell-俠客島渡口;e;se;e;e;s;s;s;e",
            "閱書老者": "jh 36;yell-俠客島渡口;e;se;e;e;s;s;s;e;ne",
            "青年海盜": "jh 36;yell-俠客島渡口;e;se;e;e;s;s;s;e;ne;e;e;n",
            "老海盜": "jh 36;yell-俠客島渡口;e;se;e;e;s;s;s;e;ne;e;e;n;e;n"
        },
        "絕情谷": {
            "絕情谷": "jh 37",
            "土匪": "jh 37;n",
            "村民": "jh 37;n;e;e",
            "野兔": "jh 37;n;e;e;nw;nw;w;n;nw;n;n",
            "絕情谷弟子": "jh 37;n;e;e;nw;nw;w;n;nw;n;n;ne;n;nw",
            "天竺大師": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w",
            "養花女": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n",
            "侍女": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n",
            "谷主夫人": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;nw",
            "門衛": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;nw;n;nw",
            "絕情谷谷主": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;nw;n;nw;n;nw",
            "谷主分身": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;nw;n;nw;n;nw",
            "白衣女子": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;nw;ne;n;ne",
            "采花賊": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;nw;n;ne;e;ne;e;n",
            "拓跋嗣": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;ne",
            "沒藏羽無": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;ne;e",
            "野利仁嶸": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;ne;e;ne",
            "嵬名元昊": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;nw;w;n;nw;n;ne;e;ne;se",
            "雪若雲": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne;event_1_16813927",
            "養鱷人": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne;se",
            "鱷魚": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne;se",
            "囚犯": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne;se;s;s;s",
            "地牢看守": "jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne;se;s;s;s;w"
        },
        "碧海山莊": {
            "碧海山莊": "jh 38",
            "法明大師": "jh 38;n;n;w",
            "僧人": "jh 38;n;n;w",
            "隱士": "jh 38;n;n;n;n;w",
            "野兔": "jh 38;n;n;n;n;w;w",
            "護衛": "jh 38;n;n;n;n;n;n;n",
            "侍女": "jh 38;n;n;n;n;n;n;n;w;w;nw",
            "尹秋水": "jh 38;n;n;n;n;n;n;n;w;w;nw;w",
            "養花女": "jh 38;n;n;n;n;n;n;n;w;w;nw;w;w;n;n",
            "家丁": "jh 38;n;n;n;n;n;n;n;n",
            "耶律楚哥": "jh 38;n;n;n;n;n;n;n;n;n",
            "護衛總管": "jh 38;n;n;n;n;n;n;n;n;n",
            "易牙傳人": "jh 38;n;n;n;n;n;n;n;n;n;e;se;s",
            "砍柴人": "jh 38;n;n;n;n;n;n;n;n;n;e;se;s;e",
            "獨孤雄": "jh 38;n;n;n;n;n;n;n;n;n;n;n;e;e;se;se;e;n",
            "王子軒": "jh 38;n;n;n;n;n;n;n;n;n;n;n;e;e;se;se;e;n;n;n",
            "王昕": "jh 38;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n"
        },
        "天山": {
            "天山": "jh 39;ne",
            "周教頭": "jh 39;ne",
            "辛怪人": "jh 39;ne;e;n;ne",
            "穆小哥": "jh 39;ne;e;n;ne;ne;n",
            "牧民": "jh 39;ne;e;n;nw",
            "塞外胡兵": "jh 39;ne;e;n;nw;nw;w;s;s",
            "胡兵頭領": "jh 39;ne;e;n;nw;nw;w;s;s;sw;n;nw;e;sw;w",
            "烏刀客": "jh 39;ne;e;n;nw;nw;w;s;s;sw;n;nw;e;sw;w;s;w",
            "波斯商人": "jh 39;ne;e;n;ne;ne;se",
            "賀好漢": "jh 39;ne;e;n;ne;ne;se;e",
            "鐵好漢": "jh 39;ne;e;n;ne;ne;se;e",
            "刁屠夫": "jh 39;ne;e;n;ne;ne;se;e;n",
            "金老板": "jh 39;ne;e;n;ne;ne;se;e;n",
            "韓馬夫": "jh 39;ne;e;n;ne;ne;se;e;e",
            "蒙面女郎": "jh 39;ne;e;n;ne;ne;se;e;s;e;se",
            "寶箱": "jh 39;ne;e;n;nw;nw;w;s;s;sw;n;nw;e;sw;w;s;w;n;w;event_1_69872740",
            "武壯士": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n",
            "程首領": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw",
            "菊劍": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;n",
            "石嫂": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;w",
            "蘭劍": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n",
            "符針神": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n",
            "梅劍": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n;e",
            "竹劍": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n;w",
            "余婆": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n;n;e;nw",
            "九翼": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n;n;e;nw;w;ne",
            "天山死士": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n;n;e;nw;w;nw",
            "天山大劍師": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n;n;e;nw;w;nw",
            "護關弟子": "jh 39;ne;e;n;ne;ne;n;ne;nw;event_1_58460791-失足巖;ts1;nw;n;ne;nw;nw;w;n;n;n;e;e;s",
            "楚大師兄": "jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939-星星峽;ts2",
            "傅奇士": "jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939-星星峽;ts2;ne;ne;nw",
            "楊英雄": "jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939-星星峽;ts2;ne;ne;nw;nw",
            "胡大俠": "jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939-星星峽;ts2;ne;ne;nw;nw;nw;w"
        },
        "苗疆": {
            "苗疆": "jh 40",
            "溫青": "jh 40;s;s;s;s",
            "苗村長": "jh 40;s;s;s;s;w;w;w",
            "苗家小娃": "jh 40;s;s;s;s;w;w;w;n",
            "苗族少年": "jh 40;s;s;s;s;w;w;w;w",
            "苗族少女": "jh 40;s;s;s;s;w;w;w;w",
            "田嫂": "jh 40;s;s;s;s;e;s;se",
            "金背蜈蚣": "jh 40;s;s;s;s;e;s;se;sw;s;s",
            "人面蜘蛛": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;s;sw",
            "吸血蜘蛛": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;s;sw",
            "樵夫": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e",
            "藍姑娘": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄峽;sw",
            "莽牯朱蛤": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s",
            "陰山天蜈": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;s",
            "食屍蠍": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s",
            "蛇": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e",
            "五毒教徒": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw",
            "沙護法": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n",
            "五毒弟子": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n",
            "毒郎中": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;e",
            "白鬢老者": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;w",
            "何長老": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;w;sw",
            "毒女": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;n",
            "潘左護法": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;n;n",
            "大祭司": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;n;n;e",
            "岑秀士": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;n;n;nw",
            "齊長老": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;n;n;nw;ne;ne;se;se",
            "五毒護法": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;n;n;nw;ne;ne;nw;ne;e",
            "何教主": "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se;event_1_8004914-瀾滄江南岸;se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;n;n;nw;ne;ne;nw;ne;e"
        },
        "白帝城": {
            "白帝城": "jh 41",
            "白衣弟子": "jh 41;se;e;e",
            "白衣少年": "jh 41;se;e;e;se;se;se;se",
            "李峰": "jh 41;se;e;e;se;se;se;se;s;s",
            "李白": "jh 41;se;e;e;se;se;se;se;s;s;s",
            "“妖怪”": "jh 41;se;e;e;se;se;se;se;s;s;s;e",
            "廟祝": "jh 41;se;e;e;se;se;se;se;s;s;s;e;e;ne",
            "獄卒": "jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;w;w;w",
            "白帝": "jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;n;n;n",
            "練武士兵": "jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;e;e",
            "鎮長": "jh 41;se;e;e;ne;ne;se;e;e;ne",
            "李巡": "jh 41;se;e;e;ne;ne;se;e;e;s;w",
            "守門士兵": "jh 41;se;e;e;nw;nw",
            "公孫將軍": "jh 41;se;e;e;nw;nw;n;n;e;ne;e",
            "貼身侍衛": "jh 41;se;e;e;nw;nw;n;n;e;ne;e",
            "糧官": "jh 41;se;e;e;nw;nw;n;n;e;ne;n;nw;n",
            "白衣士兵": "jh 41;se;e;e;nw;nw;n;n;w;w",
            "文將軍": "jh 41;se;e;e;nw;nw;n;n;w;w;n;n;e"
        },
        "墨家機關城": {
            "索盧參": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n",
            "墨家弟子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n",
            "高孫子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n",
            "燕丹": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;n;n",
            "荊軻": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;n;n",
            "庖丁": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;n;n;n;n;n",
            "縣子碩": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;w;w;n;e",
            "魏越": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;w;w;n;n;e",
            "公尚過": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;w;w;n;n;n;e",
            "高石子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;w",
            "大博士": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;w",
            "治徒娛": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;n;w",
            "黑衣人": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-非命崖底",
            "徐夫子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;s;e;s;ne;s;sw;nw;s;se;s;sw;s;s",
            "屈將子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;s;e;s;ne;s;sw;nw;s;se;s;e;e",
            "偷劍賊": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;s;e;s;ne;s;sw;nw;s;se;s;e;e;e",
            "大匠師": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;w;w",
            "隨巢子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;e",
            "高何": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;sw",
            "隨師弟": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;sw;sw",
            "曹公子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;n;e",
            "魯班": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;n;w",
            "耕柱子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;n;nw",
            "墨子": "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;n;ne"
        },
        "掩月城": {
            "掩月城": "jh 43",
            "執定長老": "jh 43",
            "佩劍少女": "jh 43",
            "野狗": "jh 43",
            "穿山甲": "jh 43;n;ne;ne;n;e;e;se;se;e;ne",
            "黑衣老者": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;se;se;s;s;sw;s",
            "六道禪師": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;se;se;s;s;sw;s;sw;sw;sw;sw",
            "火狐": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw",
            "黃鸝": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se",
            "夜攸裳": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se",
            "雲衛": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n",
            "雲將": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e",
            "女眷": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e;e",
            "莫邪傳人": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e;e;n",
            "老仆": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;se;ne",
            "采蓮": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;se;ne",
            "狄仁嘯": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e;e;e",
            "青雲仙子": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e;e;e",
            "秦東海": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e;e;e;e",
            "執劍長老": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e;e;e;e",
            "執典長老": "jh 43;n;ne;ne;n;e;e;se;se;e;ne;ne;n;nw;ne;e;se;se;se;se;ne;n;n;e;e;e;e;e;e;event_1_89957254;ne;ne;se;s;s;s",
            "野兔": "jh 43;n;ne;ne;n;n;n;nw",
            "雜貨腳夫": "jh 43;n;ne;ne;n;n;n;nw;n",
            "老煙桿兒": "jh 43;n;ne;ne;n;n;n;nw;n",
            "短衫劍客": "jh 43;n;ne;ne;n;n;n;nw;n;ne",
            "巧兒": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne",
            "青牛": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n",
            "騎牛老漢": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n",
            "書童": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w",
            "赤尾雪狐": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;sw",
            "泥鰍": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;sw;sw",
            "灰衣血僧": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;sw;sw;sw;s;s",
            "白鷺": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;sw;sw;sw;s;s;s",
            "青衫女子": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw",
            "樊川居士": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw",
            "無影暗侍": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw",
            "琴仙子": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n",
            "百曉居士": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e",
            "清風童子": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e;se;se",
            "刀仆": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e;se;se;se;sw;sw",
            "天刀宗師": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e;se;se;se;sw;sw",
            "虬髯長老": "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e;se;se;se;sw;sw;s;e;s;s;s;event_1_69228002",
            "仆人": "jh 43;w",
            "醉酒男子": "jh 43;w",
            "候君凜": "jh 43;w;w;w",
            "紫衣仆從": "jh 43;w;n",
            "輕紗女侍": "jh 43;w;n;n",
            "撫琴女子": "jh 43;w;n;n",
            "黑紗舞女": "jh 43;w;n;n;w",
            "女官人": "jh 43;w;n;n;w",
            "小廝": "jh 43;w;n;n;n",
            "梅映雪": "jh 43;w;n;n;n;ne",
            "舞眉兒": "jh 43;w;n;n;n;ne;nw;nw;nw",
            "寄雪奴兒": "jh 43;w;n;n;n;ne;nw;nw;ne",
            "琴楚兒": "jh 43;w;n;n;n;ne;nw;nw;ne",
            "赤髯刀客": "jh 43;w;w",
            "華衣女子": "jh 43;w;w",
            "老乞丐": "jh 43;w;w",
            "馬幫弟子": "jh 43;w;w;w",
            "養馬小廝": "jh 43;w;w;w;n",
            "客棧掌櫃": "jh 43;w;w;w;n;n",
            "店小二": "jh 43;w;w;w;n;n",
            "蝮蛇": "jh 43;w;w;w;w",
            "東方秋": "jh 43;w;w;w;w;nw;n;n",
            "函谷關官兵": "jh 43;w;w;w;w;nw;n;n;nw",
            "長刀敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw",
            "黑虎敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w",
            "長鞭敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw",
            "巨錘敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s",
            "狼牙敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw",
            "金剛敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw;sw;sw",
            "蠻斧敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw;sw;sw;nw;n",
            "血槍敵將": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw;sw;sw;nw;n;n;n;nw",
            "夜魔": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw;sw;sw;nw;n;n;n;nw;nw",
            "千夜精銳": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw;sw;sw;nw;n;n;n;nw;nw;n",
            "胡人王子": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw;sw;sw;nw;n;n;n;nw;nw;n;n;ne",
            "夜魔侍從": "jh 43;w;w;w;w;nw;n;n;nw;nw;nw;nw;w;sw;nw;sw;s;sw;sw;sw;nw;n;n;n;nw;nw;n;n;ne;ne;ne",
            "行腳販子": "jh 43;sw",
            "六婆婆": "jh 43;sw;sw;sw;w",
            "農家少婦": "jh 43;sw;sw;sw;w",
            "青壯小夥": "jh 43;sw;sw;sw;w;w",
            "店老板": "jh 43;sw;sw;sw;s;se;se;se",
            "白衣弟子": "jh 43;sw;sw;sw;s;se;se;se;e",
            "黑衣騎士": "jh 43;sw;sw;sw;s;se;se;se;e;n",
            "青衫鐵匠": "jh 43;sw;sw;sw;s;se;se;se;e;e",
            "青鬃野馬": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw",
            "牧民": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw",
            "小馬駒兒": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se",
            "絳衣劍客": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;se",
            "白衣公子": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;se;ne",
            "的盧幼駒": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne",
            "烏騅馬": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne",
            "秦驚烈": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s",
            "千小駒": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s",
            "牧羊犬": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e",
            "追風馬": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e",
            "諸侯秘使": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne",
            "赤菟馬": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne",
            "風如斬": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne;ne",
            "白狐": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne;ne;nw",
            "小鹿": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne;ne;nw;nw",
            "破石尋花": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne;ne;nw;nw;w",
            "爪黃飛電": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se",
            "黑狗": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s",
            "照夜玉獅子": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s",
            "灰耳兔": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;sw;sw",
            "聞香尋芳": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;sw;sw;sw",
            "魯總管": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;se",
            "風花侍女": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;se",
            "天璣童子": "jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;se;e"
        },
        '海雲閣': {
            '馬夫': 'jh 44',
            '野狗': 'jh 44;n',
            '老鎮長': 'jh 44;n;n',
            '煙袋老頭': 'jh 44;n;n;w',
            '青年女子': 'jh 44;n;n;w',
            '背槍客': 'jh 44;n;n;n',
            '小孩': 'jh 44;n;n;n;n',
            '野兔': 'jh 44;n;n;n;n;w;w',
            '遊客': 'jh 44;n;n;n;n;e;ne',
            '青年劍客': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;w;w;w',
            '九紋龍': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;w;w;w;w;w;w',
            '蟒蛇': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;w;w;w;w;w;w;n;n;n;n',
            '暗哨': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;w;w;w;w;w;w;n;n;n;n;n',
            '石邪王': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;w;w;w;w;w;w;n;n;n;n;n;e;e;s;s',
            '穿山豹': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n',
            '地殺': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n',
            '天殺': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n',
            '海東獅': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n;n',
            '海雲長老': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n;n',
            '紅紗舞女': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n;n',
            '青紗舞女': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n;n',
            '紫紗舞女': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n;n',
            '白紗舞女': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n;n',
            '六如公子': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;w;w;n;n;n',
            '蕭秋水': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;e;n;n;n;n;e;n;e;e;n;n',
            '嘯林虎': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n',
            '陸大刀': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e',
            '水劍俠': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne',
            '乘風客': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne',
            '血刀妖僧': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne;e;se;se;se',
            '花鐵槍': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne;e;se;se;se;ne;ne',
            '狄小俠': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne;e;se;se;se;ne;ne;n;n;n;n;nw',
            '水姑娘': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne;e;se;se;se;ne;ne;n;n;n;n;nw',
            '虬髯犯人': 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;n;w;n;n;n;n;w;n;e;e;n;n;n;n;n;n;n;n;nw;w;w;nw',
        },
        '幽冥山莊': {
            '野狗': 'jh 45;ne',
            '毒蛇': 'jh 45;ne;ne;n;n',
            '樵夫': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n',
            '鮑龍': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;e',
            '過之梗': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne',
            '翁四': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n',
            '屈奔雷': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;e',
            '伍湘雲': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;e;e',
            '殷乘風': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;e;e',
            '辛仇': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n',
            '辛殺': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n',
            '蔡玉丹': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw',
            '辛十三娘': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n',
            '暗殺': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n',
            '巴司空': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;w',
            '追命': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e',
            '艷無憂': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e',
            '攝魂鬼殺': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e',
            '幽冥山莊': 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e;e;e',
            '柳激煙': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n',
            '龜敬淵': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n',
            '淩玉象': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n',
            '沈錯骨': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n',
            '慕容水雲': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n',
            '金盛煌': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n;w',
            '冷血': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n;e',
            '莊之洞': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n;n',
            '高山青': 'jh 45;ne;ne;n;n;ne;ne;nw;nw;nw;n;n;n;n;n',
        },
        '花街': {
            '花劄敖': 'jh 46;e',
            '尊信門殺手': 'jh 46;e',
            '山赤嶽': 'jh 46;e;e',
            '鷹飛': 'jh 46;e;e;e',
            '由蚩敵': 'jh 46;e;e;e;e',
            '強望生': 'jh 46;e;e;e;e;e',
            '莫意閑': 'jh 46;e;e;e;e;e;e',
            '甄素善': 'jh 46;e;e;e;e;e;e;e',
            '談應手': 'jh 46;e;e;e;e;e;e;e;e',
            '戚長征': 'jh 46;e;e;e;e;e;e;e;e;e',
            '怒蛟高手': 'jh 46;e;e;e;e;e;e;e;e;e',
            '韓柏': 'jh 46;e;e;e;e;e;e;e;e;e;e',
            '烈震北': 'jh 46;e;e;e;e;e;e;e;e;e;e;e',
            '赤尊信': 'jh 46;e;e;e;e;e;e;e;e;e;e;e;e',
            '乾羅': 'jh 46;e;e;e;e;e;e;e;e;e;e;e;e;e',
            '厲若海': 'jh 46;e;e;e;e;e;e;e;e;e;e;e;e;e;e',
            '浪翻雲': 'jh 46;e;e;e;e;e;e;e;e;e;e;e;e;e;e;e',
            '方夜羽': 'jh 46;e;e;e;e;e;e;e;e;n',
            '封寒': 'jh 46;e;e;e;e;e;e;e;e;n;n;n;e;e',
            '盈散花': 'jh 46;e;e;e;e;e;e;e;e;n;n;n;e;e;n',
            '寒碧翠': 'jh 46;e;e;e;e;e;e;e;e;n;n;n;e;e;e',
            '薄昭如': 'jh 46;e;e;e;e;e;e;e;e;n;n;n;e;e;s',
            '攻擊': 'jh 46;e;e;e;e;e;e;e;e;n;n;n;e;e;n',
            '血': 'jh 46;e;e;e;e;e;e;e;e;n;n;n;e;e;e',
            '內': 'jh 46;e;e;e;e;e;e;e;e;n;n;n;e;e;s',
        },
        '西涼城': {
            '響尾蛇': 'jh 47;ne',
            '官差': 'jh 47;ne;n;n;n;nw',
            '門外官兵': 'jh 47;ne;n;n;n;nw',
            '驛卒': 'jh 47;ne;n;n;n;ne;ne;e',
            '官兵': 'jh 47;ne;n;n;n;ne;ne;e;e;e',
            '苦力': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne',
            '樵夫': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n',
            '瘋狗': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne',
            '野狗': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n',
            '伍定遠': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;w;w',
            '捕快': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;w;w',
            '農民': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n',
            '馬夫': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n',
            '黑衣鏢師': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;nw',
            '齊潤翔': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;nw',
            '鏢師': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;nw;nw',
            '管家': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;ne;n;ne',
            '李鐵杉': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;ne;n;ne;n',
            '鐵劍': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;ne;n;ne;n',
            '止觀大師': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;e;e;n;n;n;n;n',
            '慧清': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;e;e;n;n;n;n;n',
            '佛燈': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;e;e;n;n;n;n;n;n;ne;n;get xiliangcheng_fodeng',
            '屠淩心': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;se',
            '昆侖殺手': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;se',
            '金淩霜': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;se;s',
            '醉漢': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;se;s',
            '錢淩異': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;se;s;s',
            '齊伯川': 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;se;s;s;s',
        },
        '高昌迷宮': {
            '糟老頭子': 'jh 48;e;ne',
            '阿曼': 'jh 48;e;ne',
            '蘇普': 'jh 48;e;ne',
            '太行刀手': 'jh 48;e;ne',
            '陳達海': 'jh 48;e;ne',
            '哈蔔拉姆': 'jh 48;e;ne;ne',
            '天鈴鳥': 'jh 48;e;ne;ne;s',
            '牧民': 'jh 48;e;ne;ne;se',
            '霍元龍': 'jh 48;e;se',
            '惡狼': 'jh 48;e;se;se;e;ne;se',
            '響尾蛇': 'jh 48;e;se;se;e;ne;se;e',
            '鐵門': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;ne',
            '駱駝': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;se;se;s',
            '男屍': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;se;se;s;s;s;sw',
            '老翁': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;se;se;s;s;s;sw;sw;s',
            '李文秀': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;se;se;s;s;s;sw;sw;s;sw;se',
            '蘇魯克': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;ne;event_1_369927',
            '車爾庫': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;ne;event_1_369927;n',
            '瓦耳拉齊': 'jh 48;e;se;se;e;ne;se;e;e;e;ne;ne;event_1_369927;n;n;n',
        },
        '京城': {
            '饑民': 'jh 49',
            '捕快': 'jh 49;n;n;n;n',
            '武將': 'jh 49;n;n;n;n',
            '小丫鬟': 'jh 49;n;n;n;n;n',
            '侯府小姐': 'jh 49;n;n;n;n;n',
            '九華山女弟子': 'jh 49;n;n;n;n;n;n',
            '娟兒': 'jh 49;n;n;n;n;n;n',
            '東廠侍衛': 'jh 49;n;n;n;n;n;n;n',
            '城門官兵': 'jh 49;n;n;n;n;n;n;n;n',
            '柳昂天': 'jh 49;n;n;n;n;n;n;n;n;n;n;n;n;n;n',
            '江充': 'jh 49;n;n;n;n;n;n;n;n;n;n;n;n;n;n',
            '柳府鐵衛': 'jh 49;n;n;n;n;n;n;n;n;n;n;n;n;n;n',
            '莫淩山': 'jh 49;n;n;n;n;n;e',
            '昆侖弟子': 'jh 49;n;n;n;n;n;e',
            '安道京': 'jh 49;n;n;n;n;n;e;e',
            '郝震湘': 'jh 49;n;n;n;n;n;e;e;e',
            '錦衣衛': 'jh 49;n;n;n;n;n;e;e;e',
            '韋子壯': 'jh 49;n;n;n;n;n;e;e;e;e',
            '王府衛士': 'jh 49;n;n;n;n;n;e;e;e;e',
            '風流司郎中': 'jh 49;n;n;n;n;n;e;e;e;e;n',
            '伍崇卿': 'jh 49;n;n;n;n;n;e;e;s',
            '蘇穎超': 'jh 49;n;n;n;n;n;e;e;s',
            '店夥計': 'jh 49;n;n;n;n;n;e;e;s',
            '學士': 'jh 49;n;n;n;n;n;w',
            '書生': 'jh 49;n;n;n;n;n;w;w',
            '胡媚兒': 'jh 49;n;n;n;n;n;w;w;s',
            '荷官': 'jh 49;n;n;n;n;n;w;w;s',
            '白虎': 'jh 49;n;n;n;n;n;w;w;s',
            '青龍': 'jh 49;n;n;n;n;n;w;w;n',
            '打手': 'jh 49;n;n;n;n;n;w;w;n',
            '藏六福': 'jh 49;n;n;n;n;n;w;w;n',
            '雜貨販子': 'jh 49;n;n;n;n;n;w;w;w',
            '苦力': 'jh 49;n;n;n;n;n;w;w;w;w',
            '掌櫃': 'jh 49;n;n;n;n;n;w;w;w;w;s',
            '醉漢': 'jh 49;n;n;n;n;n;w;w;w;w;w',
            '遊客': 'jh 49;n;n;n;n;n;w;w;w;w;w;w',
            '顧倩兮': 'jh 49;n;n;n;n;n;w;w;w;w;w;w;n',
            '通天塔': 'jh 49;n;n;n;n;n;n;n;n;n;e;e;ne;e;e;ne;ne;n;n',
            '王一通': 'jh 49;n;n;n;n;n;n;n;n;n;w;w;nw;w;n;n;n;w;nw',
            '貴婦': 'jh 49;n;n;n;n;n;n;n;n;n;w;w;nw;w;n;n;n;w;nw;nw',
            '紅螺寺': 'jh 49;n;n;n;n;n;n;n;n;n;w;w;nw;w;n;n;n;w;nw;nw;nw;n',
        },
        '越王劍宮': {
            "樵夫": "jh 50",
            "毒蛇": "jh 50;ne;ne",
            "歐余刀客": "jh 50;ne;ne;n;n;n;ne",
            "山狼": "jh 50;ne;ne;n;n",
            "山狼王": "jh 50;ne;ne;n;n",
            "吳國暗探": "jh 50;ne;ne;n;n;n;ne",
            "山羊": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s",
            "文種": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e;n;n",
            "牧羊少女": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s",
            "獵人": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s",
            "白猿": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se",
            "老奶奶": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s",
            "範蠡": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e",
            "薛燭": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e;n;n;n",
            "西施": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e",
            "越王": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e;n;n",
            "采藥人": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se",
            "采藥少女": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne",
            "金衣劍士": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e;n;n",
            "鑄劍師": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e;n;n;n",
            "錦衣劍士": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n",
            "青竹巨蟒": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s",
            "青衣劍士": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n",
            "青衣劍士": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e",
            "青衣劍士": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e;n",
            "風胡子": "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e"
        },
        '江陵': {
            "茶葉販子": "jh 51",
            "書生": "jh 51;n",
            "乞丐": "jh 51;n;n;w;e;e;w",
            "王鐵柱": "jh 51;n;n;n;n;n;n;n;nw;n",
            "水掌櫃": "jh 51;n;n;n;n;n;n;n;nw;n",
            "婦人": "jh 51;n;n;w",
            "米店夥計": "jh 51;n;n;w",
            "米三江": "jh 51;n;n;w",
            "花小倩": "jh 51;n;n;w;e;e",
            "巡城參將": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e",
            "巡城府兵": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e",
            "客棧小二": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e",
            "酒保": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s",
            "江小酒": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s",
            "江老板": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n",
            "苦力": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e",
            "驛使": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e",
            "江陵府衛": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w",
            "蕭勁": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n",
            "參將": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n",
            "江陵府兵": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s",
            "醉漢": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n",
            "金蓮": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw",
            "邋遢男子": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w",
            "酒坊夥計": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e",
            "九叔": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e",
            "黑衣人": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n",
            "城門守衛": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e;e;n;n",
            "癩蛤蟆": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w",
            "霍無雙": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e",
            "趟子手": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e;e",
            "余小魚": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e",
            "漁老": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e",
            "分身": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e",
            "蕭長河": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e",
            "脫不花馬": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w",
            "周長老": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w",
            "截道惡匪": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e;e;n;n;nw;n",
            "漕幫好手": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e;e;n;n;nw;n;n;n",
            "揚子鱷": "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e;e;n;n;nw;n;n;n;e;e"
        }
    };
    //江湖懸紅提示
    var xhts = {
        "雪亭鎮": {
            "逄義": "逄義是封山派中和柳淳風同輩的弟子，但是生性好賭的他並不受師父及同門師兄弟的喜愛，因此輩分雖高，卻未曾擔任門中任何重要職務。逄義經常外出，美其名曰：旅行，實則避債，礙於門規又不敢做那打家劫舍的勾當，因此經常四處尋找賺錢發財的機會。",
            "店小二": "這位店小二正笑咪咪地忙著，還不時拿起掛在脖子上的抹布擦臉。",
            "星河大師": "帥",
            "崔元基": "",
            "樵夫": "你看到一個粗壯的大漢，身上穿著普通樵夫的衣服。",
            "苦力": "一個苦力打扮的漢子在這裏等人來雇用。",
            "黎老八": "這是位生性剛直，嫉惡如仇的丐幫八袋弟子。",
            "農夫": "你看到一位面色黝黑的農夫。",
            "老農夫": "你看到一位面色黝黑的農夫。",
            "瘋狗": "一只渾身臟兮兮的野狗，一雙眼睛正惡狠狠地瞪著你。",
            "魏無極": "魏無極是個博學多聞的教書先生，他年輕時曾經中過舉人，但是因為生性喜愛自由而不願做官，魏無極以教書為業，如果你付他一筆學費，就可以成為他的弟子學習讀書識字。",
            "野狗": "一只渾身臟兮兮的野狗。",
            "蒙面劍客": "蒙著臉，身後背著一把劍，看上去武藝頗為不俗。",
            "廟祝": "這個老人看起來七十多歲了，看著他佝僂的身影，你忽然覺得心情沈重了下來。",
            "劉安祿": "劉安祿是淳風武館的門房，除了館主柳淳風沒有人知道他的出身來歷，只知到他的武藝不弱，一手快刀在這一帶罕有敵手。",
            "武館弟子": "你看到一位身材高大的漢子，正在辛苦地操練著。",
            "李火獅": "李火獅是個孔武有力的大塊頭，他正在訓練他的弟子們習練「柳家拳法」。",
            "柳淳風": "柳淳風是個相當高大的中年儒生，若不是從他腰間掛著的「玄蘇劍」你大概猜不到眼前這個溫文儒雅的中年人竟是家大武館的館主。",
            "柳繪心": "柳繪心是淳風武館館主柳淳風的獨生女。",
            "安惜邇": "安惜邇是個看起來相當斯文的年輕人，不過有時候會有些心不在焉的樣子，雪亭鎮的居民對安惜邇都覺得有點神秘莫測的感覺，為什么他年紀輕輕就身為一家大錢莊的老板，還有他一身稀奇古怪的武功，所幸安惜邇似乎天性恬淡，甚至有些隱者的風骨，只要旁人不去惹他，他也絕不會去招惹旁人。",
            "醉漢": "一個喝得醉醺醺的年輕人。。。。。",
            "收破爛的": "這個人不但自己收破爛，身上也穿得破爛不堪。",
            "王鐵匠": "王鐵匠正用鐵鉗夾住一塊紅熱的鐵塊放進爐中。打孔",
            "楊掌櫃": "楊掌櫃是這附近相當有名的大善人，常常施舍草藥給付不起藥錢的窮人。此外他的醫術也不錯，年輕時曾經跟著山煙寺的玄智和尚學醫，一般的傷寒小病直接問他開藥吃比醫生還靈。",
            "花不為": "此人前幾年搬到雪亭鎮來，身世迷糊。",
            "杜寬": "杜寬擔任雪亭驛的驛長已經有十幾年了，雖然期間有幾次升遷的機會，但是他都因為舍不得離開這個小山村而放棄了，雪亭鎮的居民對杜寬的風評相當不錯，常常會來到驛站跟他聊天。",
            "杜寬寬": "不要殺我~~~~~~~~~~"
        },
        "洛陽": {
            "農夫": "一個戴著鬥笠，正在辛勤勞作的農夫。",
            "守城士兵": "一個守衛洛陽城的士兵",
            "客商": "長途跋涉至此的客商。",
            "蓑衣男子": "身穿蓑衣坐在船頭的男子，頭上的鬥笠壓得很低，你看不見他的臉。",
            "乞丐": "一個穿著破破爛爛的乞丐",
            "金刀門弟子": "這人雖然年紀不大，卻十分傲慢。看來金刀門是上梁不正下梁歪。",
            "王霸天": "王霸天已有七十來歲，滿面紅光，顎下一叢長長的白須飄在胸前，精神矍鑠，左手嗆啷啷的玩著兩枚鵝蛋大小的金膽。",
            "廟祝": "洛神廟的廟祝",
            "老乞丐": "一個穿著破破爛爛的乞丐",
            "地痞": "洛陽城裏的地痞，人見人惡。",
            "小販": "起早貪黑養家糊口的小販。",
            "鄭屠夫": "一個唾沫四濺，滿身油星的屠夫。看上去粗陋鄙俗，有些礙眼。",
            "何九叔": "丐幫5袋弟子，衣著幹凈，看起來是凈衣派的。",
            "無賴": "洛陽城無賴，專靠耍賴撒潑騙錢。",
            "甄大海": "洛陽地痞無賴頭領，陰險狡黠，手段極其卑鄙。",
            "紅娘": "一個肥胖的中年婦女，以做媒為生。",
            "柳小花": "洛陽武館館主的女兒，身材窈窕，面若桃花，十分漂亮。性格卻是驕縱任性，大小姐脾氣。",
            "富家公子": "此人一副風流倜儻的樣子，一看就是個不知天高地厚的公子哥。",
            "洪幫主": "他就是丐幫第十七任幫主，號稱洪老爺子。",
            "遊客": "來白冢遊玩的人，背上的包袱裏鼓鼓囊囊，不知道裝了什麽？",
            "綠袍老者": "一身綠袍的老人，除了滿頭白發，強健的身姿和矍鑠的眼神都不像一位老者。",
            "護衛": "大戶人家的護衛，一身勁裝。",
            "山賊": "隱藏在密林中打家劫舍的賊匪。",
            "白面書生": "書生打扮的中年男子，手中的折扇隱露寒光。",
            "守墓人": "負責看守白冢的老人，看起來也是有些功夫的。",
            "淩雲": "敗劍山莊少莊主，跟著父親雲遊四海。",
            "淩中天": "好遊山玩水的敗劍山莊莊主。",
            "盜墓賊": "以盜竊古墓財寶為生的人。",
            "黑衣文士": "看樣子很斯文，不像會欺負人哦～",
            "黑衣女子": "一身緊身黑衣將其身體勾勒的曲線畢露，黑紗遮住了面容，但看那剪水雙眸，已經足以勾魂",
            "馬倌": "這是是客棧的馬倌，正在悉心照料客人的馬匹。",
            "黑衣打手": "一身黑衣的打手，腳下功夫還是有點的。",
            "小偷": "混跡在賭坊裏的小偷。",
            "張逍林": "來洛陽遊玩的遊客，被困在銀鉤賭坊一段時間了。",
            "玉娘": "肌膚如白玉般晶瑩的美人，不知道在這賭坊雅舍中等誰？",
            "守園老人": "守護牡丹園的老人。因為洛陽城地痞不少，所以這守園老人可不輕松。",
            "賽牡丹": "人稱賽牡丹，自然是個美人兒啦~",
            "魯長老": "魯長老雖然武功算不得頂尖高手，可是在江湖上卻頗有聲望。因為他在丐幫中有仁有義，行事光明磊落，深得洪幫主的器重。",
            "陳扒皮": "據洛陽城中最小氣的人，號稱陳扒皮，意思是見了誰都想賺個小便宜。",
            "賣花姑娘": "她總是甜甜的微笑，讓人不忍拒絕她籃子裏的鮮花。",
            "劉守財": "洛陽城的財主，開了一家錢莊，家財萬貫。",
            "守城武將": "一個守衛洛陽城的武將",
            "李元帥": "吃了敗仗的元帥逃在此密室，卻不知是為了什麽。",
            "瘋狗": "一只四處亂竄的瘋狗，頂著一身臟兮兮的的毛發。",
            "青竹蛇": "一條全身翠綠的毒蛇，纏繞在竹枝上。",
            "布衣老翁": "一身布衣，面容慈祥的老人。",
            "蕭問天": "雖然身居陋室，衣著樸素，眼神的銳利卻讓人不能忽視他的存在。",
            "藏劍樓首領": "一名看上去風度非凡之人，正背手閉目養神中好像等候什麽。",
        },
        "長安": {
            "胡商": " ",
            "城門衛兵": " ",
            "無影衛": " ",
            "紫衣追影": " ",
            "禁衛統領": " ",
            "城門禁衛": " ",
            "藍色城門衛兵": " ",
            "血手天魔": " ",
            "看門人": " ",
            "欽官": " ",
            "先鋒大將": " ",
            "霍驃姚": " ",
            "江湖大盜": " ",
            "李賀": " ",
            "雲夢璃": " ",
            "遊客": " ",
            "捕快統領": " ",
            "捕快": " ",
            "刀僧衛": " ",
            "鎮魂使": " ",
            "招魂師": " ",
            "說書人": " ",
            "客棧老板": " ",
            "遊四海": " ",
            "糖人張": " ",
            "高鐵匠": " ",
            "哥舒翰": " ",
            "若羌巨商": " ",
            "樊天縱": " ",
            "楊玄素": " ",
            "烏孫馬販": " ",
            "衛青": " ",
            "方秀珣": " ",
            "孫三娘": " ",
            "大宛使者": " ",
            "馬夫": " ",
            "白衣少俠": " ",
            "玄甲衛兵": " ",
            "房玄齡": " ",
            "杜如晦": " ",
            "秦王": " ",
            "程知節": " ",
            "尉遲敬德": " ",
            "翼國公": " ",
            "獨孤須臾": " ",
            "金甲衛士": " ",
            "獨孤皇後": " ",
            "仇老板": " ",
            "顧先生": " ",
            "苗一郎": " ",
            "董老板": " ",
            "護國軍衛": " ",
            "朱老板": " ",
            "王府小廝": " ",
            "王府總管": " ",
            "龜茲樂師": " ",
            "龜茲舞女": " ",
            "卓小妹": " ",
            "上官小婉": " "
        },
        "華山村": {
            "松鼠": "一只在松林裏覓食的小松鼠。",
            "野兔": "正在吃草的野兔。",
            "潑皮": "好吃懶做的無賴，整天無所事事，欺軟怕硬。",
            "小男孩": "紮著雙髻的小男孩，正在杏林裏跟小夥伴們捉迷藏。",
            "王老二": "看起來跟普通村民沒什麽不同，但一雙眼睛卻透著狡黠。",
            "村中地痞": "村內地痞，人見人惡。",
            "摳腳大漢": "坐在土地面前摳腳的漢子",
            "黑狗": "一只黑色毛發的大狗。兇惡的黑狗，張開的大嘴露出鋒利的獠牙。",
            "青衣守衛": "身穿青衣的守衛，武功招式看起來有些眼熟。",
            "葛不光": "四十歲左右的中年男子，頗為好色。",
            "潑皮頭子": "好吃懶做的無賴，整天無所事事，欺軟怕硬。",
            "采花賊": "聲名狼藉的采花賊，一路潛逃來到了華山村。",
            "馮鐵匠": "這名鐵匠看上去年紀也不大，卻是一副飽經滄桑的樣子。",
            "村民": "身穿布衣的村民",
            "朱老伯": "一位德高望重的老人，須發已經全白。",
            "方寡婦": "頗有幾分姿色的女子，是個寡婦。",
            "劍大師": "宗之瀟灑美少年舉觴白眼望青天皎如玉樹臨風前",
            "方老板": "平日行蹤有些詭秘，看來雜貨鋪並不是他真正的營生。",
            "跛腳漢子": "衣著普通的中年男子，右腳有些跛。",
            "雲含笑": "眸含秋水清波流盼，香嬌玉嫩，秀靨艷比花嬌，指如削蔥根，口如含朱丹，一顰一笑動人心魂。",
            "英白羅": "這是華山派弟子，奉師命下山尋找遊玩未歸的小師妹。",
            "劉三": "這一代遠近聞名的惡棍，欺男霸女無惡不作",
            "曲姑娘": "這是一名身穿翠綠衣裳的少女，皮膚白皙，臉蛋清秀可愛。",
            "受傷的曲右使": "他已經深受重傷，半躺在地上。",
            "血屍": "這是一具極為可怖的男子屍體，只見他周身腫脹，肌膚崩裂，眼角、鼻子、指甲縫裏都沁出了鮮血，在這片美麗的花海裏，這具屍體的出現實在詭異至極。",
            "藏劍樓殺手": "極為冷酷無情的男人，手上不知道沾滿了多少無辜生命的鮮血。",
            "毒蛇": "一條色彩斑斕的毒蛇",
            "丐幫長老": "丐幫長老，衣衫襤褸，滿頭白發，看起來精神不錯。",
            "小狼": "出來覓食的小狼",
            "老狼": "在山上覓食的老狼",
            "土匪": "清風寨土匪",
            "土匪頭目": "清風寨土匪頭目",
            "玉牡丹": "這是一名看不出年齡的男子，一身皮膚又白又細，宛如良質美玉，竟比閨門處子都要光滑細膩許多。若不是高大身材和臉頰上青色胡茬，他可能會讓大多女子汗顏。",
            "劉龜仙": "清風寨軍事，詭計多端。",
            "蕭獨眼": "清風寨二當家，一次劫鏢時被刺傷一目，自此成了獨眼龍。",
            "劉寨主": "清風寨寨主，對手下極為嚴厲。",
            "米不為": "一名青年男子，衣衫上血跡斑斑，奄奄一息的躺在地上。"
        },
        "華山": {
            "孫駝子": "一面容猥瑣可憎，讓人不忍直視，脊背高高隆起的駝子。",
            "呂子弦": "青衣長袍的書生，前來華山遊玩。",
            "女弟子": "她是華山派女弟子，不施脂粉，衣著素雅。",
            "豪客": "一名滿臉彪悍之色的江湖豪客",
            "遊客": "這是一名來華山遊玩的中年男子，背著包裹。",
            "公平子": "這是一位仙風道骨的中年道人，早年雲遊四方，性好任俠，公正無私。",
            "山賊": "攔路搶劫的山賊",
            "白二": "山賊頭目，看起來很強壯。",
            "李鐵嘴": "李鐵嘴是個買蔔算卦的江湖術士，兼代客寫書信、條幅。",
            "趙輔徳": "負責打理群仙觀的老人",
            "猿猴": "華山上的猿猴，時常騷擾過路人",
            "劍宗弟子": "華山劍宗弟子",
            "叢雲棄": "華山派傳人，封劍羽的師弟。",
            "塵無劍": "他是華山控劍宗派的第一高手。",
            "封劍羽": "他是華山控劍宗派的第一高手。",
            "大松鼠": "一只在松林裏覓食的小松鼠。",
            "嶽師妹": "華山派掌門的愛女。她看起來十多歲，容貌秀麗，雖不是絕代美人，也別有一番可人之處。",
            "六猴兒": "六猴兒身材很瘦，又長的尖嘴猴腮的，但別看他其貌不揚，他在同門中排行第六，是華山派年輕一代中的好手。",
            "令狐大師哥": "他是華山派的大師兄，英氣逼人。",
            "風老前輩": "這便是當年名震江湖的華山名宿。他身著青袍，神氣抑郁臉如金紙。身材瘦長，眉宇間一直籠罩著一股淡淡的憂傷神色。",
            "英黑羅": "英白羅是嶽不群的第八位弟子",
            "魔教嘍嘍": "日月神教小嘍嘍嘍",
            "盧大哥": "日月神教教眾",
            "史老三": "日月神教教眾",
            "閔老二": "日月神教教眾",
            "戚老四": "日月神教教眾",
            "葛長老": "日月神教教眾",
            "小林子": "氣宗傳人小林子，實力已是非同凡響。",
            "高算盤": "此人整天拿著算盤，身材高大，長得很胖，但別看他其貌不揚，他在同門中排行第五，是華山派年輕一代中的好手。",
            "施劍客": "同門中排行第四，是華山派年輕一代中的好手。",
            "華山弟子": "華山派門下的第子",
            "蒙面劍客": "手握長劍的蒙面人",
            "黑衣人": "戴著神秘的黑衣人，壓低的帽檐遮住的他的面容。",
            "嶽掌門": "華山掌門，他今年四十多歲，素以溫文爾雅著稱。",
            "舒奇": "華山派小弟子",
            "小猴": "這是一只調皮的小猴子，雖是畜牲，卻喜歡模仿人樣。",
            "勞師兄": "他就是華山排行第二的弟子。",
            "寧女俠": "華山派掌門的夫人，眉宇間還少不了年輕時的英氣。",
            "梁師兄": "他就是華山排行第三的弟子。",
            "陶鈞": "陶鈞是嶽不群的第七位弟子",
            "林師弟": "林師弟是華山眾最小的一個弟子。",
            "小尼姑": "一個嬌俏迷人的小尼姑。"
        },
        "揚州": {
            "官兵": "守城的官兵，相貌可長得不好瞧。",
            "花店夥計": "花店的夥計，正忙碌地給花淋水。",
            "大黑馬": "一匹受驚的大黑馬，一路狂奔到了鬧市街頭。",
            "鐵匠": "看起來很強壯的中年男子",
            "雙兒": "柔善良，善解人意，乖巧聰慧，體貼賢惠，清秀可人，靦腆羞澀，似乎男人喜歡的品質都集中在她身上了。",
            "黑狗子": "揚州街頭人見人惡的地痞，嘴角一顆黑色痦子，看起來極為可憎。",
            "武館護衛": "一名武館護衛，專門對付那些想混進來鬧事的人。",
            "武館弟子": "在武館拜師學藝的弟子，看來還是會些基本功。",
            "方不為": "武館管家，館中大小事務都需要向他稟報。",
            "王教頭": "一名武館內的教頭，專門負責教新手武功。",
            "神秘客": "一名四十歲左右的中年男子，臉上一道刀疤給他平添了些許滄桑。",
            "範先生": "武館賬房先生，為人極為謹慎，賬房鑰匙通常帶在身上。",
            "陳有德": "這就是武館館主，紫金臉龐，面帶威嚴，威武有力，站在那裏就象是一座鐵塔。",
            "古三通": "一名看起來和藹的老人，手裏拿著一個旱煙袋，據說跟館主頗有淵源。",
            "黃掌櫃": "這就是武館館主，紫金臉龐，面帶威嚴，威武有力，站在那裏就象是一座鐵塔。",
            "遊客": "來揚州遊玩的遊客，背上的包裹看起來有些重。",
            "賬房先生": "滿臉精明的中年男子，手裏的算盤撥的飛快。",
            "小飛賊": "一個年級尚幼的飛賊。",
            "飛賊": "一身黑色勁裝，黑巾蒙面，眼露兇光。",
            "藝人": "一名四海為家的賣藝人，滿臉滄桑。",
            "空空兒": "一個滿臉風霜之色的老乞丐。",
            "馬夫人": "一名體格魁梧的婦人，看起來極為彪悍。",
            "潤玉": "買花少女，手中的花籃裏裝著時令鮮花。",
            "流氓": "揚州城裏的流氓，經常四處遊蕩，調戲婦女。",
            "劉步飛": "龍門鏢局的鏢師，正在武廟裏祭拜。",
            "馬員外": "馬員外是揚州有名的善人，看起來有點郁郁不樂。",
            "毒蛇": "一條毒蛇草叢竄出，正昂首吐信虎視眈眈地盯著你。",
            "掃地僧": "一名看起來很普通的僧人",
            "柳碧荷": "來禪智寺上香的女子，頗有幾分姿色。",
            "張三": "看起來很邋遢的道士，似乎有些功夫。",
            "火工僧": "禪智寺中專做雜事的火工僧，身體十分地強壯",
            "書生": "一個搖頭晃腦正在吟詩的書生。",
            "李麗君": "女扮男裝的女子，容顏清麗，孤身一身住在魁星閣的閣樓上。",
            "小混混": "揚州城裏的小混混，整天無所事事，四處遊蕩。",
            "北城門士兵": "看守城門的士兵",
            "青衣門衛": "淺月樓門口的侍衛。",
            "玉嬌紅": "淺月樓的老板娘，看似年不過三十，也是一個頗有姿色的女子。她擡起眼來，黛眉輕掃，紅唇輕啟，嘴角勾起的那抹弧度仿佛還帶著絲絲嘲諷。當她眼波一轉，流露出的風情似可讓人忘記一切。紅色的外袍包裹著潔白細膩的肌膚，她每走一步，都要露出細白水嫩的小腿。腳上的銀鈴也隨著步伐輕輕發出零零碎碎的聲音。",
            "趙明誠": "當朝仆射，也是一代名士，致力於金石之學，幼而好之，終生不渝。",
            "青樓小廝": "這是一個青樓的小侍從，不過十五六歲。",
            "蘇小婉": "名滿天下的第一琴姬，蘇小婉是那種文人夢中的紅顏知己。這樣美貌才智具備的女子，怕是世間幾百年才能出現一位。曾有人替她惋惜，說如若她是一大家閨秀，或許也能尋得一誌趣相投之人，也會有“賭書消得潑茶香”的美談。即使她只是一貧家女子，不讀書亦不學藝，縱使是貌勝西子，或許仍可安穩一生。然而命運時常戲弄人，偏偏讓那如花美眷落入淤泥，誤了那似水流年。本想為一人盛開，卻被眾人窺去了芳顏。可她只是微微一笑，說道：『尋一平凡男子，日出而作日落而息，相夫教子，如湮沒於歷史煙塵中的所有女子一般。那樣的生活，不是我做不到，只是不願意。沒有燃燒過的，只是一堆黑色的粉末，哪裏能叫做煙火？』",
            "惡丐": "看守城門的士兵",
            "頑童": "一個頑皮的小童。",
            "唐老板": "廣陵當鋪老板，肩寬體壯，看起來頗為威嚴。",
            "雲九天": "他是大旗門的掌刑長老，最是嚴厲不過。",
            "柳文君": "茶社老板娘，揚州聞名的才女，姿色嬌美，精通音律，善彈琴。許多文人墨客慕名前來，茶社總是客滿為患。",
            "茶社夥計": "提著茶壺的夥計，目露精光，看起來不簡單。",
            "醉仙樓夥計": "這是醉仙樓夥計，看起來有些功夫。",
            "豐不為": "一個常在酒樓混吃混喝的地痞，不知酒店老板為何不將他逐出。",
            "張總管": "一名中年男子，目露兇光。",
            "計無施": "一名劍眉星目的白衣劍客。",
            "胡神醫": "這就是江湖中有名的胡神醫，看起來很普通。",
            "胖商人": "一名衣著華麗，體態臃腫，手腳看起來極短的中年男子。",
            "冼老板": "醉仙樓老板，能將這家祖傳老店買下來，其來歷應該沒那麽簡單。",
            "赤練仙子": "她生得極為美貌，但冰冷的目光讓人不寒而栗。",
            "白老板": "玉器店老板，對珍寶古玩頗為熟稔。",
            "衙役": "揚州官衙衙役，看起來一臉疲態。",
            "公孫嵐": "揚州官衙有名的神捕，據說曾經抓獲不少江湖大盜。",
            "程大人": "揚州知府，臉色陰沈，微有怒色，",
            "楚雄霸": "江湖有名的江洋大盜，五短身材，貌不驚人。",
            "朱先生": "這就是當今大儒朱先生。",
            "書生（書院）": "一個搖頭晃腦正在吟詩的書生。",
            "少林惡僧": "因嗜酒如命，故從少林叛出，順便盜取些許經書以便拿來換酒。",
            "船運東主": "此人一身黝黑的皮膚，幾道深深的歲月的溝壑在他臉上烙下了印記。深邃凹進的眼眶中顯露出幹練的眼神。顯露出不凡的船上閱歷。"
        },
        "丐幫": {
            "左全": "這是位豪爽大方的丐幫七袋弟子，看來是個北地豪傑。",
            "裘萬家": "這是位衣著邋塌，蓬頭垢面的丐幫二袋弟子",
            "梁長老": "梁長老是丐幫出道最久，武功最高的長老，在武林中享名已久。丐幫武功向來較強，近來梁長老一力整頓，更是蒸蒸日上。",
            "何一河": "他是丐幫新近加入的弟子，可也一步步升到了五袋。他長的極其醜陋，臉上坑坑窪窪",
            "莫不收": "這是位衣著邋塌，蓬頭垢面的丐幫三袋弟子。",
            "藏劍樓統領": "此人似乎是這群人的頭目，正在叮囑手下辦事。",
            "何不凈": "這是位衣著邋塌，蓬頭垢面的丐幫七袋弟子",
            "馬俱為": "這是位武藝精強，卻沈默寡言的丐幫八袋弟子。",
            "余洪興": "這是位笑瞇瞇的丐幫八袋弟子，生性多智，外號小吳用。"
        },
        "喬陰縣": {
            "守城官兵": "這是個正在這裏站崗的守城官兵，雖然和許多武林人物比起來，官兵們的武功實在稀松平常，但是他們是有組織、有紀律的戰士，誰也不輕易地招惹他們。",
            "賣餅大叔": "一個相貌樸實的賣餅大叔，憨厚的臉上掛著和藹的笑容。",
            "陸得財": "陸得財是一個渾身臟兮兮的老丐，一副無精打采要死不活的樣子，可是武林中人人都識得他身上打著二十三個結的皮酒囊，這不但是「花紫會」龍頭的信物，更是名鎮漠南的「黑水伏蛟」獨門兵器，只不過陸得財行蹤詭密，據說各處隨時都有七、八的他的替身在四處活動，所以你也很難確定眼前這個陸得財到底是不是真的。",
            "賣包子的": "這個賣包子的小販對你微微一笑，說道：熱騰騰的包子，來一籠吧",
            "武官": "一位相貌威武的武官，獨自一個人站在這裏發呆，似乎正有什么事困擾著他。",
            "怪人": "體型與小孩一般，臉上卻滿是皺紋，頭發已經掉光。",
            "湯掌櫃": "湯掌櫃是這家大酒樓的主人，別看他只是一個小小的酒樓老板，喬陰縣境內除了知縣老爺以外，恐怕就屬他最財大勢大。",
            "家丁": "一個穿著家人服色的男子，必恭必敬地垂手站在一旁。",
            "貴公子": "一個相貌俊美的年輕貴公子正優雅地欣賞著窗外的景物。",
            "酒樓守衛": "一個身穿藍布衣的人，從他銳利的眼神跟神情，顯然是個練家子。",
            "書生": "一個看起來相當斯文的書生，正拿著一本書搖頭晃腦地讀著。",
            "丫鬟": "一個服侍有錢人家小姐的丫鬟，正無聊地玩弄著衣角。",
            "官家小姐": "一個看起來像是有錢人家的女子，正在這裏遊湖。",
            "乾癟老太婆": "這個老太婆懷中抱了個竹簍，似乎在賣什么東西，也許你可以跟她問問價錢？",
            "婦人": "一個衣飾華麗的婦人正跪在這裏虔誠地膜拜著。",
            "駱雲舟": "駱雲舟本是世家公子，因喜愛詩酒劍法，不為家族中人所偏愛。因此他年少離家，常年在外漂泊，時至今日，倒是武有所成，在文學的造詣上，也是深不可測了。",
            "藏劍樓長老": "一名談吐不凡的中年男子，備受手下尊崇",
            "藏劍樓學者": "此人文質彬彬，手持一本書冊，正不斷的翻閱似乎想在裏面找到想要的答案。"
        },
        "峨眉山": {
            "白猿": "這是一頭全身白色毛發的猿猴。",
            "文虛師太": "她是峨眉派的“文”輩弟子。",
            "看山弟子": "一個女弟子，手上拿著一把長劍。",
            "文寒師太": "她是峨眉派的“文”輩弟子。",
            "文玉師太": "她是峨眉派的“文”輩弟子。",
            "巡山弟子": "一個拿著武器，有點氣勢的巡山弟子。",
            "青書少俠": "他今年二十歲，乃是武當第三代中出類拔萃的人物。",
            "小女孩": "這是個小女孩。",
            "小販": "峨眉山上做點小生意的小販。",
            "靜洪師太": "她是峨眉派的“靜”輩弟子。",
            "靜雨師太": "她是峨眉派的“靜”輩弟子。",
            "女孩": "這是個少女，雖然只有十二、三歲，身材已經開始發育。",
            "尼姑": "這是一個年輕尼姑。",
            "小尼姑": "一個年紀賞小的尼姑。",
            "靜玄師太": "她是峨眉派的“靜”輩弟子。",
            "貝錦瑟": "她是峨嵋派的第四代俗家弟子。",
            "毒蛇": "一條劇毒的毒蛇。",
            "護法弟子": "她是一位年輕的師太。是滅絕石臺座前的護法弟子。",
            "護法大弟子": "她是一位年輕的師太。是滅絕石臺座前的護法弟子。",
            "靜慈師太": "這是一位年紀不算很大的師太。",
            "滅絕掌門": "她是峨嵋派的第三代弟子，現任峨嵋派掌門人。",
            "方碧翠": "她是峨嵋派的第四代俗家弟子。",
            "傳令兵": "釣魚城派往長安求援的傳令兵，行色匆匆，滿面塵土。",
            "運輸兵": "負責運送器械的士兵。",
            "斥候": "負責偵查敵情的軍士",
            "軍械官": "管理軍械庫的一位中年軍官，健壯有力。",
            "神箭手": "釣魚城守城大軍的神箭手，百步穿楊，箭無虛發。",
            "耶律霸": "遼國皇族後裔，蒙古宰相耶律楚材之子，金狼軍主帥。他驍勇善戰，精通兵法，憑借著一手堪可開山破嶽的好斧法殺得武林中人無人可擋聞之色變。視天波楊門為心腹之患欲處之而後快。",
            "先鋒軍士": "攻城大軍的先鋒軍士，滿臉兇狠，卻也掩飾不住疲乏之色。",
            "先鋒敵將": "攻城先鋒大將，長期毫無進展的戰事讓他難掩煩躁。",
            "赤豹死士": "攻城大軍的赤豹營死士，戰力蠻橫，重盔重甲，防禦極好。",
            "守城軍士": "守城的軍士，英勇強悍，不畏生死。",
            "黑鷹死士": "攻城大軍的黑鷹營死士，出手極準。",
            "金狼死士": "攻城大軍將領的近身精銳。",
            "金狼大將": "攻城大將，曾是江湖上一等一的好手。",
            "糧庫主薄": "管理糧庫的軍官，雙眼炯炯有神，一絲一毫的細節都牢記於心。",
            "參謀官": "守軍參謀軍官，負責傳遞消息和提出作戰意見。",
            "王堅": "釣魚城守城大將，智勇雙全，有條不紊地指揮著整座城市的防禦工作。",
            "藏劍樓劍客": "此人手持長劍，正虎視眈眈的留神周圍，準備伺機而動。"
        },
        "恒山": {
            "山盜": "一個盤踞山林的盜匪。",
            "秦卷簾": "恒山派俗家弟子，臉上沒有一絲表情，讓人望而卻步。",
            "九戒大師": "雖著一身袈裟，但一臉絡腮胡讓他看起來頗有些兇悍。",
            "鄭婉兒": "恒山派俗家弟子，看起來清麗可人。",
            "啞太婆": "一身黑衣，頭發雖已花白，但俏麗的容顏卻讓人忍不住多看兩眼",
            "雲問天": "身背行囊的遊客，看起來會些功夫。",
            "柳雲煙": "一身短裝的女子，頭戴紗帽，一張俏臉在面紗後若隱若現，讓人忍不住想掀開面紗瞧個仔細。",
            "石高達": "一名身份可疑的男子，最近常在山上遊蕩。",
            "公孫浩": "一名行走五湖四海的遊俠，看起來功夫還不錯。",
            "不可不戒": "曾經是江湖上有名的采花大盜，被不戒和尚用藥迷倒，剪掉了作案工具，剃度後收為徒弟。",
            "山蛇": "一條吐著紅舌頭的毒蛇",
            "定雲師太": "恒山派白雲庵庵主，外剛內和，脾氣雖然暴躁，心地卻極慈祥。",
            "儀容": "恒山派大弟子",
            "儀雨": "恒山派二弟子",
            "小師太": "恒山入門弟子",
            "吸血蝙蝠": "這是一只黑色的吸血蝙蝠",
            "定安師太": "恒山派掌門，心細如發，雖然平時極少出庵，但於江湖上各門各派的人物，無一不是了如指掌，其武功修為極高。",
            "神教殺手": "日月神教殺手，手段極其兇殘。",
            "魔教殺手": "魔教殺手，一張黃臉讓人過目難忘。",
            "魔教頭目": "看起來風流倜儻的中年男子，魔教的小頭目。",
            "嵩山弟子": "嵩山派弟子",
            "趙誌高": "嵩山派高手，看起來頗有些修為。",
            "司馬承": "嵩山派高手，看起來頗有些修為。",
            "沙江龍": "嵩山派高手，看起來頗有些修為。",
            "史師兄": "嵩山派大弟子，武功修為頗高。"
        },
        "武當山": {
            "土匪": "這家夥滿臉橫肉一付兇神惡煞的模樣，令人望而生畏。",
            "土匪頭": "這家夥滿臉殺氣，一付兇神惡煞的模樣，令人望而生畏。",
            "王五": "一位邋邋遢遢的道士。",
            "野兔": "一只好可愛的小野兔。",
            "進香客": "一位前往武當山進香的人。",
            "青書少俠": "他今年二十歲，乃是武當第三代中出類拔萃的人物。",
            "知客道長": "他是武當山的知客道長。",
            "道童": "他是武當山的小道童。",
            "清虛道長": "他就是清虛道長。他今年四十歲，主管武當派的俗事。",
            "練功弟子": "一位正在練功的青年弟子，但似乎很不耐煩。",
            "宋首俠": "他就是張三豐的大弟子、武當七俠之首。身穿一件幹幹凈凈的灰色道袍。他已年過六十，身材瘦長，滿臉紅光。恬淡沖和，沈默寡言。",
            "俞蓮舟": "他就是張三豐的二弟子俞蓮舟。他今年五十歲，身材魁梧，氣度凝重。雖在武當七俠中排名第二，功夫卻是最精。",
            "張三豐": "他就是武當派開山鼻祖、當今武林的泰山北鬥，中華武功承先啟後、繼往開來的大宗師。身穿一件汙穢的灰色道袍，不修邊幅。身材高大，年滿百歲，滿臉紅光，須眉皆白。",
            "張松溪": "他就是張三豐的四弟子張松溪。他今年四十歲，精明能幹，以足智多謀著稱。",
            "小翠": "這是個年年齡不大的小姑娘，但寬松的道袍也遮不住她過早發育的身體。一臉聰明乖巧，滿口伶牙俐齒。見有人稍微示意，便過去加茶倒水。",
            "俞二俠": "服下丹藥之後的他武功似乎提升了不少，實力不容小覷。",
            "蜜蜂": "這是一只蜜蜂，正忙著采蜜。",
            "小蜜蜂": "這是一只蜜蜂，正忙著采蜜。",
            "猴子": "這只猴子在在桃樹間跳上跳下，還不時津津有味地啃幾口著蜜桃。",
            "布衣弟子": "遇劍閣的一位弟子，不知是哪個長老門下的。",
            "劍童": "遇劍閣的一名劍童，長得十分可愛。",
            "劍遇安": "一位似乎身重劇毒的老前輩，但仍能看出其健康之時武功不凡。"
        },
        "晚月莊": {
            "蝴蝶": "一只翩翩起舞的小蝴蝶哦!",
            "彩衣少女": "小姑娘是晚月莊的女弟子，雖說身形單薄，可眼神裏透出的傲氣讓人感到並不好欺負。",
            "婢女": "一名婢女，長的到也清秀。",
            "藍止萍": "藍止萍是一個十分出色的美女，她彈的一手琵琶更是聞名千裏，許多王侯子弟，富商豪客都為她天下無雙的美貌與琴藝傾倒。",
            "藍雨梅": "藍雨梅是晚月莊主藍止萍的養女，由於莊主不信任男子，因此晚月莊接待外賓的工作向來由她負責。",
            "芳綾": "她看起來像個小靈精，頭上梳兩個小包包頭。她坐在地上，看到你看她便向你作了個鬼臉!你想她一定是調皮才會在這受罰!",
            "昭儀": "她看起來非常可愛。身材玲瓏有致，曲線苗條。第一眼印象，你覺的她舞蹈一定跳的不錯，看她的一舉一動有一種說不出的流暢優雅！",
            "昭蓉": "她長得十分漂亮！讓你忍不住多瞧她幾眼，從她身上你聞到淡淡的香氣。她很有禮貌的向你點頭，優雅的動作，輕盈的步伐，好美哦!",
            "苗郁手": "她看起來很有活力，兩眼明亮有神。給你一種巾幗不讓須眉的氣勢，但剛毅之中似又隱含著女孩子有的嬌柔。",
            "圓春": "她是惜春的妹妹，跟姐姐從小就在晚月莊長大。因為與雙親失散，被莊主收留。平常幫忙莊內瑣碎事務。",
            "惜春": "她看起來成熟中帶有一些稚氣。飄逸的長發十分迷人。她是個孤兒，從小與妹妹圓春被莊主收留，她很聰明，在第四代弟子中算是武功很出色的一個。",
            "鳳凰": "火神「鳳凰」乃勇士寒於的魂魄所化成的十三個精靈之一。由於其奇異神跡，被晚月莊供奉為護莊神獸。",
            "金儀彤": "她國色天香，嬌麗無倫；溫柔嫻靜，秀絕人寰。可惜眉心上有一道地煞紋幹犯紫鬥，恐要玉手染血，浩劫武林。",
            "璦倫": "她已是步入老年，但仍風采依舊。",
            "曲馥琪": "她國色天香，嬌麗無倫；溫柔嫻靜，秀絕人寰。她姿容絕美，世所罕見。從她身旁你聞道一寒谷幽香。",
            "夢玉樓": "一個風塵仆仆的俠客。。",
            "安妮兒": "無描述",
            "虞瓊衣": "無描述",
            "龍韶吟": "無描述",
            "阮欣郁": "無描述"
        },
        "水煙閣": {
            "天邪虎": "這是一只天邪派的靈獸「天邪虎」，火紅的毛皮上有著如白銀般的白紋，湛藍色的眼珠中散發出妖異的光芒。",
            "水煙閣武士": "這是一個水煙閣武士。",
            "董老頭": "於蘭天武的親兵，追隨於蘭天武多年，如今隱居於水煙閣，繼續保護王爺",
            "水煙閣紅衣武士": "這個人身著紅色水煙閣武士服色，眼神十分銳利。",
            "水煙閣司事": "這個人看起來十分和藹可親，一雙眼睛炯炯有神。",
            "蕭辟塵": "蕭辟塵自幼生長於嵐城之中，看起來仙風道骨，不食人間煙火。",
            "潘軍禪": "潘軍禪是當今武林的一位傳奇性人物，以他僅僅二十八歲的年齡竟能做到水煙閣執法使的職位，著實是一位不簡單的人物。潘軍禪是封山劍派掌門柳淳風的結拜義弟，但是他為人其實十分風趣，又好交朋友，絲毫不會擺出武林執法者的架子。",
            "於蘭天武": "於蘭天武是當今皇上的叔父，但是他畢生浸淫武學，甘願拋棄榮華富以換取水煙閣傳功使一職，以便閱讀水煙閣中所藏的武學典籍，無論你有什么武學上的疑難，他都能為你解答。"
        },
        "少林寺": {
            "山豬": "黑色山豬，披著一身剛硬的鬃毛。",
            "田鼠": "一只臟兮兮的田鼠，正在田間覓食。",
            "僧人": "少林寺僧人，負責看守山門。",
            "喬三槐": "勤勞樸實的山民，皮膚黝黑粗糙。",
            "小孩": "一個農家小孩，不知道在這裏幹什麽。",
            "掃地和尚": "一名年輕僧人，身穿灰色僧衣。",
            "挑水僧": "一名年輕僧人，身穿灰色僧衣。",
            "灑水僧": "一名年輕僧人，身穿灰色僧衣。",
            "青松": "天真無邪的小沙彌",
            "小北": "這是一個天真活潑的小沙彌，剛進寺不久，尚未剃度",
            "小南": "青衣小沙彌，尚未剃度。",
            "巡寺僧人": "身穿黃色僧衣的僧人，負責看守藏經閣。",
            "進香客": "來寺裏進香的中年男子，看起來滿臉疲憊。",
            "獄卒": "一名看起來兇神惡煞的獄卒",
            "行者": "他是一位雲遊四方的行者，風霜滿面，行色匆匆，似乎正在辦一件急事。",
            "掃地僧": "一個年老的僧人，看上去老態龍鐘，但是雙目間卻有一股精氣？",
            "托缽僧": "他是一位未通世故的青年和尚，臉上掛著孩兒般的微笑。",
            "灰衣僧": "一名灰衣僧人，灰布蒙面，一雙眼睛裏透著過人的精明。",
            "守藥僧": "一位守著少林藥樓的高僧。",
            "砍柴僧": "一名年輕僧人，身穿灰色僧衣。",
            "澄": "他是一位須發花白的老僧，身穿一襲金邊黑布袈裟。他身材瘦高，太陽穴高高鼓起，似乎身懷絕世武功。",
            "虛": "他是一位身穿黃布袈裟的青年僧人。臉上稚氣未脫，身手卻已相當矯捷，看來似乎學過一點武功。",
            "禪師": "他是一位身材高大的中年僧人，兩臂粗壯，膀闊腰圓。他手持兵刃，身穿一襲灰布鑲邊袈裟，似乎有一身武藝。",
            "尊者": "他是一位兩鬢斑白的老僧，身穿一襲青布鑲邊袈裟。他身材略高，太陽穴微凸，雙目炯炯有神。",
            "比丘": "他是一位體格強健的壯年僧人，他身得虎背熊腰，全身似乎蘊含著無窮勁力。他身穿一襲白布黑邊袈裟，似乎身懷武藝。",
            "玄難大師": "他是一位白須白眉的老僧，身穿一襲銀絲棕黃袈裟。他身材極瘦，兩手更象雞爪一樣。他雙目微閉，一副沒精打采的模樣。",
            "玄慈大師": "他是一位白須白眉的老僧，身穿一襲金絲繡紅袈裟。他身材略顯佝僂，但卻滿面紅光，目蘊慈笑，顯得神完氣足。",
            "玄痛大師": "他是一位白須白眉的老僧，身穿一襲銀絲棕黃袈裟。他身材高大，兩手過膝。雙目半睜半閉，卻不時射出一縷精光。",
            "玄苦大師": "他是一位白須白眉的老僧，身穿一襲銀絲棕黃袈裟。他身材瘦高，臉上滿布皺紋，手臂處青筋綻露，似乎久經風霜。",
            "玄悲大師": "他是一位白須白眉的老僧，身穿一襲銀絲棕黃袈裟。他身材甚高，但骨瘦如柴，頂門高聳，雙目湛然有神。",
            "盈盈": "魔教任教主之女，有傾城之貌，閉月之姿，流轉星眸顧盼生輝，發絲隨意披散，慵懶不羈。",
            "打坐僧人": "正在禪室打坐修行的僧人。",
            "守經僧人": "似乎常年鎮守於藏經閣，稀稀疏疏的幾根長須已然全白，正拿著經書仔細研究。",
            "小沙彌": "一名憨頭憨腦的和尚，手裏端著茶盤。",
            "黑衣大漢": "黑布蒙面，只露出一雙冷電般的眼睛的黑衣大漢。",
            "蕭遠山": "契丹絕頂高手之一，曾隨漢人學武，契丹鷹師總教頭。",
            "白眉老僧": "少林寺高僧，武功修為無人能知。",
            "葉十二娘": "頗有姿色的中年女子，一雙大眼裏似乎隱藏著無窮愁苦、無限傷心。",
            "冷幽蘭": "“吐秀喬林之下，盤根眾草之旁。雖無人而見賞，且得地而含芳。”她如同空谷幽蘭一般素雅靜謐，纖巧削細，面若凝脂，眉目如畫，神若秋水。",
            "慧輪": "少林寺弟子，虛竹的師傅，武功修為平平。",
            "達摩老祖": "這是少林派的開山祖師達摩老祖他身材高大，看起來不知有多大年紀，目光如炬，神光湛然！"
        },
        "唐門": {
            "高一毅": "五代十國神槍王後人，英氣勃發，目含劍氣。",
            "張之嶽": "張憲之子，身形高大，威風凜凜",
            "唐門弟子": "這是唐門的弟子，不茍言笑。",
            "唐風": "唐風是唐門一個神秘之人，世人對他知之甚少。他在唐門默默地傳授武藝，極少說話。",
            "唐看": "這是嫡系死士之一，一身的功夫卻是不凡。",
            "唐怒": "唐門門主，在江湖中地位很高。",
            "方媃": "一個美麗的中年婦女，使得一手好暗器。",
            "唐鶴": "唐門中的高層，野心很大，一直想將唐門稱霸武林。",
            "唐鏢": "唐門中所有的絕門鏢法，他都會用。",
            "唐緣": "人如其名，雖然年幼，但已是能看出美人胚子了。",
            "唐芳": "雖然是一個少女，但武藝已達精進之境界了。",
            "唐健": "他身懷絕技，心氣也甚高。",
            "唐舌": "這是嫡系死士之一，一身的功夫卻是不凡。用毒高手。",
            "唐情": "一個小女孩，十分可愛。",
            "唐剛": "一個尚未成年的小男孩，但也已經開始學習唐門的武藝。",
            "歐陽敏": "一個老婦人，眼睛中射出道道精光，一看就是武藝高強之人。",
            "程傾城": "曾是兩淮一代最有天賦的年輕劍客，在觀海莊追殺徽北劇盜之戰一劍破對方七人刀陣，自此“傾城劍客”之名響徹武林。",
            "無名劍客": "一位沒有名字的劍客，他很可能是曾經冠絕武林的劍術高手。",
            "默劍客": "這是一個沈默不語的劍客，數年來不曾說過一句話，專註地參悟著劍池絕學。",
            "竺霽庵": "湖竺家一門七進士，竺霽庵更是天子門生獨占鰲頭，隨身喜攜帶一柄折扇。後因朝廷亂政心灰意冷，棄仕從武，更拜入少林成為俗家弟子。不足二十三歲便學盡少林絕學，武功臻至登峰造極之化境。後在燕北之地追兇時偶遇當時也是少年的鹿熙吟和謝麟玄，三人聯手血戰七日，白袍盡赤，屠盡太行十八夜騎。三人意氣相投，誌同道合，結為異姓兄弟，在鹿謝二人引薦下，終成為浣花劍池這一代的破軍劍神。",
            "甄不惡": "他的相貌看起來是那麽寧靜淡泊、眼睛眉毛都透著和氣，嘴角彎彎一看就象個善笑的人。他不象個俠客，倒象一個孤隱的君子。不了解的人總是懷疑清秀如竹的他怎麽能拿起手中那把重劍？然而，他確是浣花劍派最嫉惡如仇的劍神，武林奸邪最懼怕的名字，因為當有惡人聽到『甄不惡』被他輕輕從嘴裏吐出，那便往往是他聽到的最後三個字。",
            "素厲銘": "本是淮南漁家子弟，也並無至高的武學天賦，然其自幼喜觀察魚蟲鳥獸，竟不自覺地悟出了一套氣脈運轉的不上心法。後因此絕學獲難，被千夜旗余孽追殺，欲奪其心法為己用。上代封山劍主出手相救，並送至廉貞劍神門下，專心修煉內功，最終竟憑借其一顆不二之心，成就一代劍神。",
            "駱祺櫻": "塞外武學世家駱家家主的千金，自幼聰慧無比，年紀輕輕便習盡駱家絕學，十八歲通過劍池試煉，成為劍池數百年來最年輕的七殺劍神。她雙眸似水，卻帶著談談的冰冷，似乎能看透一切；四肢纖長，有仙子般脫俗氣質。她一襲白衣委地，滿頭青絲用蝴蝶流蘇淺淺綰起，雖峨眉淡掃，不施粉黛，卻仍然掩不住她的絕世容顏。",
            "謝麟玄": "一襲青緞長衫，儒雅中透著英氣，好一個翩翩公子。書香門第之後，其劍學領悟大多出自絕世的琴譜，棋譜，和書畫，劍法狂放不羈，處處不合武學常理，卻又有著難以言喻的寫意和瀟灑。他擅長尋找對手的薄弱環節，猛然一擊，敵陣便土崩瓦解。",
            "祝公博": "曾經的湘西農家少年，全家遭遇匪禍，幸得上一代巨門劍神出手相救。劍神喜其非凡的武學天賦和不舍不棄的勤奮，收作關門弟子，最終得以承接巨門劍神衣缽。祝公博嫉惡如仇，公正不阿，視天道正義為世間唯一準則。",
            "黃衫少女": "身著鵝黃裙衫的少女，一席華貴的栗色秀發真達腰際，碧色的瞳孔隱隱透出神秘。她見你走過來，沖你輕輕一笑。",
            "鹿熙吟": "浣花劍派當世的首席劍神，他身形挺拔，目若朗星。雖然已是中年，但歲月的雕琢更顯出他的氣度。身為天下第一劍派的首席，他待人和善，卻又不怒自威。百曉公見過鹿熙吟之後，驚為天人，三月不知如何下筆，最後據說在百曉圖錄貪狼劍神鹿熙吟那一頁，只留下了兩個字：不凡。他的家世出身是一個迷，從來無人知曉。",
            // "獨臂劍客": "他一生守護在這，劍重要過他的生命。",
            // "無情劍客": "神秘的江湖俠客，如今在這裏不知道作甚麽。",
            // "黑衣劍客": "一身黑衣，手持長劍，就像世外高人一樣。",
            // "青衣劍客": "一個風程仆仆的俠客。",
            // "紫衣劍客": "傲然而立，一臉嚴肅，好像是在瞪著你一樣。"
        },
        "青城山": {
            "海公公": "海公公是皇帝身邊的紅人，不知為什麽在此？",
            "仵作": "這是福州城外的一個仵作，專門檢驗命案死屍。",
            "惡少": "這是福州城中人見人惡的惡少，最好別惹。",
            "仆人": "惡少帶著這個仆人，可是威風得緊的。",
            "屠夫": "一個賣肉的屠夫。",
            "酒店老板": "酒店老板是福州城有名的富人。",
            "店小二": "這個店小二忙忙碌碌，招待客人手腳利索。",
            "女侍": "這是一個女店小二，在福州城內，可是獨一無二哦。",
            "酒店女老板": "一個漂亮的女老板，體格風騷。",
            "小甜": "花店中賣花的姑娘，花襯人臉，果然美不勝收。",
            "阿美": "此人三十來歲，專門福州駕駛馬車。",
            "鏢局弟子": "福威鏢局的弟子。",
            "黃衣鏢師": "這個鏢師穿著一身黃衣。",
            "紅衣鏢師": "這個鏢師穿著一身紅衣。",
            "白衣鏢師": "這個鏢師穿著一身白衣。",
            "林師弟": "林師弟是華山眾最小的一個弟子。",
            "兵器販子": "一個販賣兵器的男子，看不出有什麽來歷。",
            "讀千裏": "此人學富五車，搖頭晃腦，只和人談史論經。",
            "福州捕快": "福州的捕快，整天懶懶散散，不務正業。",
            "福州府尹": "此人官架子很大。",
            "童澤": "一個青年人，眼神有悲傷、亦有仇恨。",
            "木道神": "木道神是青城山的祖師級人物了，年紀雖大，但看不出歲月滄桑。",
            "童隆": "一個眼神兇惡的老頭，身材有點佝僂。",
            "背劍老人": "背著一把普通的劍，神態自若，似乎有一股劍勢與圍於周身，退隱江湖幾十年，如今沈醉於花道。",
            "遊方郎中": "一個到處販賣藥材的赤腳醫生。",
            "青城派弟子": "青城派的弟子，年紀剛過二十，武藝還過得去。",
            "青城弟子": "青城派的弟子，年紀剛過二十，武藝不錯，資質上乘。",
            "侯老大": "他就是「英雄豪傑，青城四秀」之一，武功也遠高同門。",
            "羅老四": "他就是「英雄豪傑，青城四秀」之一，武功也遠高同門。",
            "吉人英": "他就是和申人俊焦孟不離的吉人通。",
            "賈老二": "他就是「青城派」中最為同門不齒、最下達的家夥。",
            "余大掌門": "青城派十八代掌門人",
            "黃袍老道": "一個穿著黃色道袍的老道士。",
            "青袍老道": "一個穿著青色道袍的老道士。",
            "於老三": "他就是「英雄豪傑，青城四秀」之一，武功也遠高同門。",
            "林總鏢頭": "他就是「福威鏢局」的總鏢頭。"
        },
        "逍遙林": {
            "蒙面人": "一個蒙著面部，身穿黑色夜行衣服的神秘人。",
            "吳統領": "他雅擅丹青，山水人物，翎毛花卉，並皆精巧。拜入師門之前，在大宋朝廷做過領軍將軍之職，因此大家便叫他吳統領",
            "馮巧匠": "據說他就是魯班的後人，本來是木匠出身。他在精於土木工藝之學，當代的第一巧匠，設計機關的能手",
            "範棋癡": "他師從先生，學的是圍棋，當今天下，少有敵手",
            "蘇先生": "此人就是蘇先生，據說他能言善辯，是一個武林中的智者，而他的武功也是無人能知。",
            "石師妹": "她精於蒔花，天下的奇花異卉，一經她的培植，無不欣欣向榮。",
            "薛神醫": "據說他精通醫理，可以起死回生。",
            "康琴癲": "只見他高額凸顙，容貌奇古，笑瞇瞇的臉色極為和謨，手中抱著一具瑤琴。",
            "茍書癡": "他看上去也是幾十歲的人了，性好讀書，諸子百家，無所不窺，是一位極有學問的宿儒，卻是純然一個書呆子的模樣。",
            "李唱戲": "他看起來青面獠牙，紅發綠須，形狀可怕之極，直是個妖怪，身穿一件亮光閃閃的錦袍。他一生沈迷扮演戲文，瘋瘋顛顛，於這武學一道，不免疏忽了。",
            "常一惡": "馬幫幫主，總管事，喜歡錢財的老狐貍。",
            "逍遙祖師": "他就是逍遙派開山祖師、但是因為逍遙派屬於一個在江湖中的秘密教派，所以他在江湖中不是很多人知道，但其實他的功夫卻是。。。。他年滿七旬，滿臉紅光，須眉皆白。",
            "天山姥姥": "她乍一看似乎是個十七八歲的女子，可神情卻是老氣橫秋。雙目如電，炯炯有神，向你瞧來時，自有一股淩人的威嚴。"
        },
        "開封": {
            "皮貨商": "這是一位皮貨商，他自己也是滿身皮裘。",
            "駱駝": "這是一條看起來有些疲憊的駱駝。",
            "新娘": "新郎官的未婚妻，被高衙內抓到此處。",
            "耶律夷烈": "遼德宗耶律大石之子，身材高大，滿面虬髯。",
            "毒蛇": "一條劇毒的毒蛇。",
            "野豬": "一只四肢強健的野豬，看起來很餓",
            "黑鬃野豬": "這是一直體型較大的野豬，一身黑色鬃毛",
            "野豬王": "這是野豬比普通野豬體型大了近一倍，一身棕褐色鬃毛豎立著，看起來很兇殘。",
            "鹿杖老人": "此人好色奸詐，但武功卓絕，乃是一代武林高手。經常與鶴發老人同闖武林。",
            "鶴發老人": "此人愚鈍好酒，但武功卓絕，乃是一代武林高手。經常與鹿杖老人同闖武林。",
            "白面人": "一個套著白色長袍，帶著白色面罩的人，猶如鬼魅，讓人見之心寒",
            "官兵": "這是一名官兵，雖然武藝不能跟武林人士比，但他們靠的是人多力量大",
            "七煞堂弟子": "江湖上臭名昭著的七煞堂弟子，最近經常聚集在禹王臺，不知道有什麽陰謀。",
            "七煞堂打手": "七煞堂打手，還有點功夫的",
            "七煞堂護衛": "七煞堂護衛，似乎有一身武藝",
            "七煞堂護法": "武功高強的護衛，乃總舵主的貼身心腹。",
            "七煞堂總舵主": "這是七煞堂總舵主，看起道貌岸然，但眼神藏有極深的戾氣。",
            "七煞堂堂主": "這是七煞堂堂主，看起來一表人才，不過據說手段極為殘忍。",
            "小男孩": "一個衣衫襤褸，面有饑色的10多歲小男孩，正跪在大堂前，眼裏布滿了絕望！",
            "燈籠小販": "這是一個勤勞樸實的手藝人，據說他做的燈籠明亮又防風。",
            "趙大夫": "趙大夫醫術高明，尤其善治婦科各種疑難雜癥。",
            "展昭": "這就是大名鼎鼎的南俠。",
            "歐陽春": "這是大名鼎鼎的北俠。",
            "包拯": "他就是朝中的龍圖大學士包丞相。只見他面色黝黑，相貌清奇，氣度不凡。讓你不由自主，好生敬仰。",
            "新郎官": "這是一名披著大紅花的新郎官，臉上喜氣洋洋。",
            "混混張三": "他長得奸嘴猴腮的，一看就不像是個好人。",
            "鐵翼": "他是大旗門的元老。他剛正不阿，鐵骨諍諍。",
            "劉財主": "開封府中的富戶，看起來腦滿腸肥，養尊處優。",
            "武官": "這名武官看起來養尊處優，不知道能不能出征打仗。",
            "高衙內": "這就是開封府內惡名遠揚的高衙內，專一愛調戲淫辱良家婦女。",
            "護寺僧人": "他是一位身材高大的青年僧人，兩臂粗壯，膀闊腰圓。他手持兵刃，身穿一襲白布鑲邊袈裟，似乎有一身武藝。",
            "燒香老太": "一個見佛燒香的老太太，花白的頭發松散的梳著發髻，滿是皺紋的臉上愁容密布",
            "張龍": "這便是開封府霍霍有名的捕頭張龍，他身體強壯，看上去武功不錯。",
            "孔大官人": "開封府中的富戶，最近家中似乎有些變故。",
            "素齋師傅": "在寺廟中燒飯的和尚。",
            "潑皮": "大相國寺附近的潑皮，常到菜園中偷菜。",
            "老僧人": "一個老朽的僧人，臉上滿是皺紋，眼睛都睜不開來了",
            "燒火僧人": "一名專職在竈下燒火的僧人",
            "玄衣少年": "一身玄衣的一個少年，似乎對開封的繁華十分向往。",
            "菜販子": "一個老實巴交的農民，賣些新鮮的蔬菜",
            "王老板": "王家紙馬店老板，為人熱誠。",
            "碼頭工人": "這是一名膀大腰圓的碼頭工人，也許不會什麽招式，但力氣肯定是有的",
            "船老大": "看起來精明能幹的中年男子，堅毅的眼神讓人心生敬畏。",
            "落魄書生": "名衣衫襤褸的書生，右手搖著一柄破扇，面色焦黃，兩眼無神。",
            "李四": "他長得奸嘴猴腮的，一看就不像是個好人。",
            "陳舉人": "看起來有些酸腐的書生，正在查看貢院布告牌。",
            "張老知府": "開封的前任知府大人，如今雖退休多年，但仍然憂國憂民。",
            "富家弟子": "一個白白胖胖的年輕人，一看就知道是嬌生慣養慣的富家子。",
            "天波侍衛": "天波府侍衛，個個均是能征善戰的勇士！",
            "楊排風": "容貌俏麗，風姿綽約，自幼在天波楊門長大，性情爽直勇敢，平日裏常跟穆桂英練功習武，十八般武藝樣樣在行。曾被封為“征西先鋒將軍”，大敗西夏國元帥殷奇。因為是燒火丫頭出身，且隨身武器是燒火棍，所以被宋仁宗封為“火帥”。又因為，民間稱贊其為“紅顏火帥”。",
            "楊延昭": "楊延昭是北宋抗遼名將楊業的長子，契丹人認為北鬥七星中的第六顆主鎮幽燕北方，是他們的克星，遼人將他看做是天上的六郎星宿下凡，故稱為楊六郎。",
            "侍女": "一個豆蔻年華的小姑娘，看其身手似也是有一點武功底子的呢。",
            "佘太君": "名將之女，自幼受其父兄武略的影響，青年時候就成為一名性機敏、善騎射，文武雙全的女將。她與普通的大家閨秀不同，她研習兵法，頗通將略，把戍邊禦侵、保衛疆域、守護中原民眾為己任，協助父兄練兵把關，具備巾幗英雄的氣度。夫君邊關打仗，她在楊府內組織男女仆人丫環習武，仆人的武技和忠勇之氣個個都不亞於邊關的士兵",
            "柴郡主": "六郎之妻，為後周世宗柴榮之女，宋太祖趙匡胤敕封皇禦妹金花郡主。一名巾幗英雄、女中豪傑，成為當時著名的楊門女將之一，有當時天下第一美女之稱。",
            "穆桂英": "穆柯寨穆羽之女，有沈魚落雁之容，且武藝超群，巾幗不讓須眉。傳說有神女傳授神箭飛刀之術。因陣前與楊宗保交戰，穆桂英生擒宗保並招之成親，歸於楊家將之列，為楊門女將中的傑出人物。",
            "楊文姬": "乃天波楊門幺女。體態文秀儒雅、有驚鴻之貌，集萬千寵愛於一身，被楊門一族視為掌上明珠。其武學集楊門之大成，卻又脫胎於楊門自成一格，實屬武林中不可多得的才女。",
            "趙虎": "這便是開封府霍霍有名的捕頭趙虎，他身體強壯，看上去武功不錯。",
            "踏青婦人": "春天出來遊玩的婦人，略有姿色。",
            "平夫人": "方面大耳，眼睛深陷，臉上全無血色。",
            "惡狗": "這是一條看家護院的惡狗。",
            "平怪醫": "他身材矮胖，腦袋極大，生兩撇鼠須，搖頭晃腦，形相十分滑稽。"
        },
        "光明頂": {
            "村民": "這是村落裏的一個村名。",
            "滄桑老人": "這是一個滿臉滄桑的老人。",
            "村婦": "一個村婦。",
            "老太婆": "一個滿臉皺紋的老太婆。",
            "小男孩": "這是個七八歲的小男孩。",
            "神秘女子": "這是一個女子",
            "明教小聖使": "他是一個明教小聖使。",
            "聞旗使": "他是明教巨林旗掌旗使。",
            "韋蝠王": "明教四大護法之一，傳說喜好吸人鮮血。",
            "彭散玉": "明教五散仙之一。",
            "明教小嘍啰": "明教的一個小嘍啰，看起來有點猥瑣，而且還有點陰險。",
            "辛旗使": "他是明教烈焰旗掌旗使。",
            "布袋大師": "他是明教五散仙之一的布袋大師說不得，腰間歪歪斜斜的掛著幾支布袋。",
            "顏旗使": "嚴垣是明教深土旗掌旗使。",
            "唐旗使": "他是明教白水旗掌旗使。",
            "周散仙": "明教五散仙之一",
            "莊旗使": "明教耀金旗掌旗使。",
            "楊左使": "明教光明左使。",
            "黛龍王": "她就是武林中盛傳的紫衣龍王，她膚如凝脂，杏眼桃腮，容光照人，端麗難言。雖然已年過中年，但仍風姿嫣然。",
            "明教教眾": "他是身材矮小，兩臂粗壯，膀闊腰圓。他手持兵刃，身穿一黑色聖衣，似乎有一身武藝",
            "九幽毒魔": "千夜旗至尊九長老之一，看似一個面容慈祥的白發老人，鶴發童顏，雙手隱隱的黑霧卻顯露了他不世的毒功！",
            "九幽毒童": "負責管理九幽毒池的童子們，個個面色陰沈，殘忍好殺。",
            "青衣女孩": "一個身著青衣的小女孩，被抓來此出準備煉毒之用，雖能感覺到恐懼，但雙眼仍透出不屈的頑強。",
            "冷步水": "他是明教五散仙之一。在他僵硬的面孔上看不出一點表情。",
            "張散仙": "明教五散仙之一。長於風雅之做。",
            "冷文臻": "冷步水的侄子，較為自傲，且要面子。",
            "殷鷹王": "他就是赫赫有名的白眉鷹王，張大教主的外公，曾因不滿明教的混亂，獨自創立了飛鷹教，自從其外孫成為教主之後，便回歸了明教",
            "謝獅王": "他就是赫赫有名的金發獅王，張大教主的義父，生性耿直，只因滿心仇恨和脾氣暴躁而做下了許多憾事。",
            "張教主": "年方二十多歲的年輕人。明教現今正統教主，武功集各家之長最全面，修為當世之罕見。",
            "範右使": "明教光明右使。",
            "小昭": "她雙目湛湛有神，修眉端鼻，頰邊微現梨渦，真是秀美無倫，只是年紀幼小，身材尚未長成，雖然容貌絕麗，卻掩不住容顏中的稚氣。",
            "蒙面人": "用厚厚面巾蒙著臉上的武士，看不清他的真面目"
        },
        "全真教": {
            "野馬": "一匹健壯的野馬。",
            "終南山遊客": "一個來終南山遊玩的遊客。",
            "男童": "這是一個男童。",
            "全真女弟子": "這是一個女道姑。",
            "迎客道長": "他是全真教內負責接待客人的道士。",
            "程遙伽": "她長相清秀端莊。",
            "小道童": "他是全真教的一個小道童",
            "小道童": "一個全真教的小道童。",
            "練功弟子": "這是全真教的練功弟子。",
            "尹誌平": "他是丘處機的得意大弟子尹誌平，他粗眉大眼，長的有些英雄氣概，在全真教第三代弟子中算得上年輕有為。身材不高，眉宇間似乎有一股憂郁之色。長的倒是長眉俊目，容貌秀雅，面白無須，可惜朱雀和玄武稍有不和。",
            "健馬": "一匹健壯的大馬",
            "李四": "這是一個中年道士。",
            "孫不二": "她就是全真教二代弟子中唯一的女弟子孫不二孫真人。她本是馬鈺入道前的妻子，道袍上繡著一個骷髏頭。",
            "柴火道士": "一個負責柴火的道士。",
            "馬鈺": "他就是王重陽的大弟子，全真七子之首，丹陽子馬鈺馬真人。他慈眉善目，和藹可親，正笑著看著你。",
            "重陽祖師": "他就是全真教的開山祖師，其身材消瘦，精神矍鑠，飄飄然仿佛神仙中人",
            "郝大通": "他就是全真七子中的郝大通郝真人。他身材微胖，象個富翁模樣，身上穿的道袍雙袖皆無。",
            "老頑童": "此人年齡雖大但卻頑心未改，一頭亂糟糟的花白胡子，一雙小眼睛透出讓人覺得滑稽的神色。",
            "觀想獸": "一只只有道家之所才有的怪獸",
            "王處一": "他就是全真七子之五王處一王真人。他身材修長，服飾整潔，三綹黑須飄在胸前，神態瀟灑",
            "老道長": "這是一個年老的道人。",
            "青年弟子": "一個風程仆仆的俠客。",
            "譚處端": "他就是全真次徒譚處端譚真人，他身材魁梧，濃眉大眼，嗓音洪亮，拜重陽真人為師前本是鐵匠出身。",
            "鹿道清": "他是全真教尹誌平門下第四代弟子",
            "劉處玄": "他就是全真三徒劉處玄劉真人，他身材瘦小，但顧盼間自有一種威嚴氣概。",
            "掌廚道士": "一個負責掌廚的道士。",
            "小麻雀": "一只嘰嘰咋咋的小麻雀。",
            "挑水道士": "這是全真教內負責挑水的道士。",
            "老人": "這是一個老人，在全真教內已有幾十年了。",
            "蜜蜂": "一直忙碌的小蜜蜂。",
            "丘處機": "他就是江湖上人稱‘長春子’的丘處機丘真人，他方面大耳，滿面紅光，劍目圓睜，雙眉如刀，相貌威嚴，平生疾惡如仇。"
        },
        "古墓": {
            "天蛾": "蜜蜂的天敵之一。",
            "食蟲虻": "食肉昆蟲，蜜蜂的天敵之一。",
            "玉蜂": "這是一只玉色的蜜蜂，個頭比普通蜜蜂大得多，翅膀上被人用尖針刺有字",
            "玉蜂": "這是一只玉色的蜜蜂，個頭比普通蜜蜂大得多，翅膀上被人用尖針刺有字。",
            "毒蟒": "缺",
            "龍兒": "盈盈而站著一位秀美絕俗的女子，肌膚間少了一層血色，顯得蒼白異常。披著一襲輕紗般的白衣，猶似身在煙中霧裏。",
            "林祖師": "她就是古墓派的開山祖師，雖然已經是四十許人，望之卻還如同三十出頭。當年她與全真教主王重陽本是一對癡心愛侶，只可惜有緣無份，只得獨自在這古墓上幽居。",
            "孫婆婆": "這是一位慈祥的老婆婆，正看著你微微一笑。"
        },
        "白駝山": {
            "傅介子": "中原朝廷出使西域樓蘭國的使臣，氣宇軒昂，雍容華度，似也會一些武功。",
            "青衣盾衛": "身著青衣，手持巨盾，是敵軍陣前的鐵衛，看起來極難對付。",
            "飛羽神箭": "百發百中的神箭手，難以近身，必須用暗器武學方可隔空攻擊",
            "銀狼近衛": "主帥身側的近衛，都是萬裏挑一的好手",
            "軍中主帥": "敵軍主帥，黑盔黑甲，手持長刀。",
            "玉門守將": "一位身經百戰的將軍，多年駐守此地，臉上滿是大漠黃沙和狂風留下的滄桑。",
            "匈奴殺手": "匈奴人殺手，手持彎刀，眼露兇光。",
            "玉門守軍": "玉門關的守衛軍士，將軍百戰死，壯士十年歸。",
            "玄甲騎兵": "黑盔黑甲的天策騎兵，連馬也被鋥亮的鎧甲包裹著。",
            "車夫": "一名駕車的車夫，塵霜滿面。",
            "天策大將": "天策府左將軍，英勇善戰，智勇雙全。身穿黑盔黑甲，腰間有一柄火紅的長刀。",
            "玄甲參將": "天策玄甲軍的參將，雙目專註，正在認真地看著城防圖。",
            "鳳七": "無影樓金鳳堂堂主，武功卓絕自是不在話下，腕上白玉鐲襯出如雪肌膚，腳上一雙鎏金鞋用寶石裝飾。",
            "慕容孤煙": "英姿颯爽的馬車店女老板，漢族和鮮卑族混血，雙目深邃，含情脈脈，細卷的栗色長發上夾著一個金色玉蜻蜓。",
            "醉酒男子": "此人看似已經喝了不少，面前擺著不下七八個空酒壇，兩頰緋紅，然而雙目卻仍是炯炯有神，身長不足七尺，腰別一把看似貴族名士方才有的長劍，談笑之間雄心勃勃，睥睨天下。男子醉言醉語之間，似是自稱青蓮居士。",
            "馬匪": "這是肆虐戈壁的馬匪，長相兇狠，血債累累。",
            "花花公子": "這是個流裏流氣的花花公子。",
            "寡婦": "一個年輕漂亮又不甘寂寞的小寡婦。",
            "農民": "一個很健壯的壯年農民。",
            "小山賊": "這是個尚未成年的小山賊。",
            "雷震天": "雷橫天的兒子，與其父親不同，長得頗為英俊。",
            "山賊": "這是個面目可憎的山賊。",
            "侍杖": "他頭上包著紫布頭巾，一襲紫衫，沒有一絲褶皺。",
            "雷橫天": "這是個粗魯的山賊頭。一身膘肉，看上去內力極度強勁！",
            "金花": "一個年少貌美的姑娘。",
            "鐵匠": "鐵匠正用汗流浹背地打鐵。",
            "舞蛇人": "他是一個西域來的舞蛇人。",
            "店小二": "這位店小二正笑咪咪地忙著招呼客人。",
            "村姑": "一個很清秀的年輕農村姑娘，挎著一只蓋著布小籃子。",
            "小孩": "這是個農家小孩子",
            "樵夫": "一個很健壯的樵夫。",
            "農家婦女": "一個很精明能幹的農家婦女。",
            "門衛": "這是個年富力強的衛兵，樣子十分威嚴。",
            "仕衛": "這是個樣子威嚴的仕衛。",
            "丫環": "一個很能幹的丫環。",
            "歐陽少主": "他一身飄逸的白色長衫，手搖折扇，風流儒雅。",
            "李教頭": "這是個和藹可親的教頭。",
            "小青": "這是個聰明乖巧的小姑娘，打扮的很樸素，一襲青衣，卻也顯得落落有致。小青對人非常熱情。你要是跟她打過交道就會理解這一點！",
            "黑冠巨蟒": "一只龐然大物，它眼中噴火，好象要一口把你吞下。",
            "金環蛇": "一只讓人看了起毛骨悚然的金環蛇。",
            "竹葉青蛇": "一只讓人看了起雞皮疙瘩的竹葉青蛇。",
            "蟒蛇": "一只昂首直立，吐著長舌芯的大蟒蛇。",
            "教練": "這是個和藹可親的教練。",
            "陪練童子": "這是個陪人練功的陪練童子。",
            "管家": "一個老謀深算的老管家。",
            "白衣少女": "一個聰明伶俐的白衣少女。",
            "老毒物": "他是白馱山莊主，號稱“老毒物”。",
            "肥肥": "一個肥頭大耳的廚師，兩只小眼睛不停地眨巴著。",
            "老材": "一個有名的吝嗇鬼，好象他整日看守著柴房也能發財似的",
            "白兔": "一只雪白的小白兔，可愛之致。",
            "馴蛇人": "蛇園裏面的馴蛇人，替白駝山莊馴養各種毒蛇。",
            "野狼": "一只獨行的野狼，半張著的大嘴裏露著幾顆獠牙。",
            "雄獅": "一只矯健的雄獅，十分威風。",
            "狐貍": "一只多疑成性的狐貍。",
            "老虎": "一只斑斕猛虎，雄偉極了。",
            "張媽": "一個歷經滄桑的老婆婆。"
        },
        "嵩山": {
            "腳夫": "五大三粗的漢子，看起來會些拳腳功夫。",
            "秋半仙": "一名算命道士，灰色道袍上綴著幾個補丁。",
            "風騷少婦": "一個風騷的少婦，頗有幾分姿色。",
            "錦袍老人": "神情威猛須發花白的老人，看起來武功修為頗高。",
            "柳易之": "朝廷通事舍人，負責傳達皇帝旨意。",
            "盧鴻一": "一名布衣老者，慈眉善目，須發皆白。",
            "英元鶴": "這是一名枯瘦矮小的黑衣老人，一雙灰白的耳朵看起來有些詭異。",
            "馬幫精銳": "身材異常高大的男子，眼神中充滿殺氣，臉上滿布虬龍似的傷疤。",
            "遊客": "來嵩山遊玩的男子，書生打扮，看來來頗為儒雅。",
            "吸血蝙蝠": "一只體型巨大的吸血蝙蝠。",
            "瞎眼劍客": "一名黑衣劍客，雙面失明。",
            "瞎眼刀客": "一名黑衣刀客，雙面失明。",
            "瞎眼老者": "這是一名黑衣瞎眼老者，看起來武功修為頗高。",
            "野狼": "山林覓食的野狼，看起來很餓。",
            "林立德": "在嵩陽書院進學的書生，看起來有些木訥。",
            "山賊": "攔路搶劫的山賊",
            "修行道士": "在嵩山隱居修行的道士",
            "黃色毒蛇": "一條吐舌蛇信子的毒蛇。",
            "麻衣刀客": "一身麻衣，頭戴鬥笠的刀客",
            "白板煞星": "沒有鼻子，臉孔平平，像一塊白板，看起來極為可怖",
            "小猴": "這是一只調皮的小猴子，雖是畜牲，卻喜歡模仿人樣。",
            "萬大平": "嵩山弟子，看起來很普通。",
            "嵩山弟子": "這是一名嵩山弟子，武功看起來稀松平常。",
            "芙兒": "一名身穿淡綠衫子的少女，只見她臉如白玉，顏若朝華，真是艷冠群芳的絕色美人。",
            "麻衣漢子": "頭戴鬥笠，身材瘦長，一身麻衣的中年男子，看起來有些詭異。",
            "史師兄": "嵩山派大弟子，武功修為頗高。",
            "白頭仙翁": "嵩山派高手，年紀不大，頭花卻已全白。",
            "左羅": "左掌門的侄子，武功平平，但多謀善斷，有傳聞說他是左掌門的親生兒子。",
            "左挺": "冷面短髯，相貌堂皇的青年漢子。",
            "樂老狗": "這人矮矮胖胖，面皮黃腫，約莫五十來歲年紀，目神光炯炯，凜然生威，兩只手掌肥肥的又小又厚。",
            "夥夫": "一名肥頭大耳的夥夫，負責打理嵩山派一眾大小夥食。",
            // "冷峻青年": "一個風程仆仆的俠客。",
            "沙禿翁": "這是一名禿頭老者，一雙鷹眼微閉。",
            "鐘九曲": "臉白無須，看起來不像練武之人。",
            "陸太保": "面目兇光的中年漢子，雖是所謂名門正派，但手段極為兇殘。",
            "高錦毛": "須發火紅的中年漢子",
            "鄧神鞭": "一名面容黯淡的老人，但看外表，很難想到他是一名內外皆修的高手。",
            "聶紅衣": "一名體態風流的少婦，酥胸微露，媚眼勾人。",
            "左盟主": "身穿杏黃長袍，冷口冷面，喜怒皆不行於色，心機頗深。",
            "枯瘦的人": "身形枯瘦，似乎被困於此多年，但眼神中仍有強烈的生存意誌"
        },
        "梅莊": {
            "柳府家丁": "這是杭州有名大戶柳府的家丁，穿著一身考究的短衫，一副目中無人的樣子。",
            "柳玥": "柳府二小姐，只見她眸含秋水清波流盼，香嬌玉嫩，秀靨艷比花嬌，指如削蔥根，口如含朱丹，一顰一笑動人心魂，旖旎身姿在上等絲綢長裙包裹下若隱若現。聽說柳府二千金芳名遠揚，傳聞柳府大小姐月夜逃婚，至今不知下落。",
            "老者": "一個姓汪的老者，似乎有什麽秘密在身上。",
            "筱西風": "這是一名看起來很冷峻的男子，只見他鬢若刀裁，眉如墨畫，身上穿著墨色的緞子衣袍，袍內露出銀色鏤空木槿花的鑲邊，腰上掛著一把長劍。",
            "武悼": "一個白發蒼蒼的老人，默默打掃著這萬人景仰的武穆祠堂。",
            "梅莊護院": "一身家人裝束的壯漢，要掛寶刀，看起來有些功夫。",
            "梅莊家丁": "一身家人裝束的男子，看起來有些功夫。",
            "施令威": "一身家人裝束的老者，目光炯炯，步履穩重，看起來武功不低。",
            "丁管家": "一身家人裝束的老者，目光炯炯，步履穩重，看起來武功不低。",
            "黑老二": "這人雖然生的眉清目秀，然而臉色泛白，頭發極黑而臉色極白，像一具僵屍的模樣。據說此人酷愛下棋，為人工於心計。",
            "向左使": "這是一名身穿白袍的老人，容貌清臒，刻頦下疏疏朗朗一縷花白長須，身材高瘦，要掛彎刀。",
            "瘦小漢子": "臉如金紙的瘦小的中年男子，一身黑衣，腰系黃帶。",
            "柳蓉": "這女子雖是一襲仆人粗布衣裳，卻掩不住其俊俏的容顏。只見那張粉臉如花瓣般嬌嫩可愛，櫻桃小嘴微微輕啟，似是要訴說少女心事。",
            "丁二": "這是一名滿臉油光的中年男子，雖然其貌不揚，據說曾是京城禦廚，蒸炒煎炸樣樣拿手。",
            "聾啞老人": "這是一名彎腰曲背的聾啞老人，須發皆白，滿臉皺紋。據說他每天都去湖底地牢送飯。",
            "丹老四": "此人髯長及腹，一身酒氣，據說此人極為好酒好丹青，為人豪邁豁達。",
            "上官香雲": "這女子有著傾城之貌，閉月之姿，流轉星眸顧盼生輝，發絲隨意披散，慵懶不羈。她是江南一帶有名的歌妓，據聞琴棋書畫無不精通，文人雅士、王孫公子都想一親芳澤。",
            "禿筆客": "這人身型矮矮胖胖，頭頂禿得油光滑亮，看起來沒有半點文人雅致，卻極為嗜好書法。",
            "琴童": "這是一名青衣童子，紮著雙髻，眉目清秀。",
            "黃老朽": "這是一名身型骨瘦如柴的老人，炯炯有神的雙目卻讓內行人一眼看出其不俗的內力。",
            "黑衣刀客": "一身黑色勁裝，手持大刀，看起來很兇狠。",
            "青衣劍客": "一身青衣，不知道練得什麽邪門功夫，看起來臉色鐵青。",
            "紫袍老者": "看起來氣度不凡的老人，紫色臉膛在紫袍的襯托下顯得更是威嚴。",
            "紅衣僧人": "這人雖然身穿紅色僧袍，但面目猙獰，看起來絕非善類。",
            "黃衫婆婆": "雖已滿頭白發，但眉眼間依舊可見年輕時的娟秀。",
            "地牢看守": "身穿灰布衣裳，臉色因為常年不見陽光，看起來有些灰白。",
            "地鼠": "一只肥大的地鼠，正在覓食。",
            "奎孜墨": "這是一名身穿黑衣的年輕男子，一張臉甚是蒼白，漆黑的眉毛下是藝術按個深沈的眼睛，深沈的跟他的年齡極不相符。",
            "任教主": "這名老者身材甚高，一頭黑發，穿的是一襲青衫，長長的臉孔，臉色雪白，更無半分血色，眉目清秀，只是臉色實在白得怕人，便如剛從墳墓中出來的僵屍一般。"
        },
        "泰山": {
            "鏢師": "當地鏢局的鏢師，現在被狼軍士兵團團圍住，難以脫身。",
            "挑夫": "這青年漢子看起來五大三粗，估計會些三腳貓功夫。",
            "黃衣刀客": "這家夥滿臉橫肉，一付兇神惡煞的模樣，令人望而生畏。",
            "瘦僧人": "他是一位中年遊方和尚，骨瘦如柴，身上的袈裟打滿了補丁。",
            "柳安庭": "這是個飽讀詩書，卻手無縛雞之力的年輕書生。",
            "石雲天": "生性豁達，原本是丐幫弟子，因為風流本性難改，被逐出丐幫。",
            "朱瑩瑩": "艷麗的容貌、曼妙的身姿，真是數不盡的萬種風情。",
            "歐陽留雲": "這是位中年武人，肩背長劍，長長的劍穗隨風飄揚，看來似乎身懷絕藝。",
            "溫青青": "這名女子神態嫻靜淡雅，穿著一身石青色短衫，衣履精致，一張俏臉白裏透紅，好一個美麗俏佳人。",
            "易安居士": "這是有“千古第一才女”之稱的李清照，自幼生活優裕，其父李格非藏書甚豐，小時候就在良好的家庭環境中打下文學基礎。少年時即負文學的盛名，她的詞更是傳誦一時。中國女作家中，能夠在文學史上占一席地的，必先提李易安。她生活的時代雖在北宋南宋之間，卻不願意隨著當時一般的潮流，而專意於小令的吟詠。她的名作象《醉花陰》，《如夢令》，有佳句象“花自飄零水自流，一種相思兩處閑愁”等等，都膾炙人口。",
            "程不為": "此人出身神秘，常常獨來獨往，戴一副鐵面具，不讓人看到真面目，師承不明。",
            "呂進": "此人出身神秘，常常獨來獨往，戴一副鐵面具，不讓人看到真面目，師承不明。",
            "司馬玄": "這是一名白發老人，慈眉善目，據說此人精通醫術和藥理。",
            "桑不羈": "此人身似猿猴，動作矯健，因輕功出眾，江湖中難有人可以追的上他，故而以刺探江湖門派消息為生。",
            "魯剛": "一名隱士，據聞此人精通鑄劍。",
            "於霸天": "此人身材魁梧，身穿鐵甲，看起來似乎是官府的人。",
            "神秘遊客": "此人年紀雖不大，但須發皆白，一身黑袍，看起來氣度不凡。",
            "海棠殺手": "這人的臉上看起來沒有一絲表情，手裏的刀刃閃著寒光。",
            "路獨雪": "這人便是江湖有名的海棠殺手“三劍斷命”，看起來倒也算是一表人才，只是雙目透出的殺氣卻讓人見之膽寒。",
            "鐵雲": "據說殺手無情便無敵，這人看起來風流倜儻，卻是極為冷血之人。",
            "孔翎": "據說他就是海棠殺手組織的首領，不過看他的樣子，似乎不像是一個能統領眾多殺手的人。",
            "姬梓煙": "這是一名極為妖艷的女子，一身黑色的緊身衣將其包裹得曲線畢露，估計十個男人見了十個都會心癢難耐。",
            "柳蘭兒": "這是一個看起來天真爛漫的少女，不過等她的劍刺穿你的身體時，你才會意識到天真是多麽好的偽裝。",
            "布衣男子": "這是一名身穿粗布衣服的男子，看起來很強壯。",
            "阮小": "這人五短身材，尖嘴猴腮。",
            "阮大": "這人五短身材，尖嘴猴腮。",
            "史義": "這人身穿粗布勁裝，滿臉絡腮胡，雙眼圓瞪，似乎隨時準備發怒。",
            "司馬墉": "這人穿著一身長袍，敏銳的雙眼讓人感覺到他的精明過人。",
            "林忠達": "這人看起來很普通，是那種見過後便會忘記的人。",
            "鐵面人": "這人臉上蒙著一張黑鐵面具，看不見他的模樣，但面具後雙眼卻給人一種滄桑感。",
            "鐵翼": "鐵翼是鐵血大旗門的元老。他剛正不阿，鐵骨諍諍，如今被囚禁於此。",
            "黑衣人": "一個風程仆仆的俠客。",
            "李三": "此人無發無眉，相貌極其醜陋。",
            "仇霸": "此人獨目禿頂，面目兇惡，來官府通緝要犯。",
            "平光傑": "這是一名身穿粗布衣服的少年，背上背著一個竹簍，裏面放著一些不知名的藥草。",
            "玉師弟": "此人一身道袍，看起來頗為狡詐。",
            "玉師兄": "這人面色灰白，雙眼無神，看起來一副沈溺酒色的模樣。",
            "玉師伯": "泰山掌門的師叔，此人看起來老奸巨猾。",
            "任娘子": "這是一名艷麗少婦，勾魂雙面中透出一股殺氣。",
            "黃老板": "雙鞭客棧老板，看起來精明過人。",
            "紅衣衛士": "一身紅色勁裝的衛士，看起來有些功夫。",
            "白飛羽": "這人算得上是一個美男子，長眉若柳，身如玉樹。",
            "商鶴鳴": "這人生的有些難看，黑紅臉膛，白發長眉，看起來有些陰郁。",
            "西門允兒": "這是一名極有靈氣的女子，穿著碧綠紗裙。",
            "馮太監": "皇帝身邊鶴發童顏的太監，權勢滔天，眼中閃著精光。",
            "鐘逍林": "這是一名魁梧的中年男子，看起來內家功夫造詣不淺。",
            "西門宇": "這是一名身材偉岸的中年男子，看起來霸氣逼人。",
            "黑衣密探": "這是一名蒙面密探。",
            "毒蛇": "這是一條斑斕的大蛇，一眼看去就知道有劇毒",
            "筱墨客": "這人臉上掛著難以捉摸的笑容，看起來城府極深。",
            "鐵惡人": "鐵毅同父異母之弟，為了「大旗門」寶藏，時常算計其大哥鐵毅。",
            "遲一城": "泰山弟子，劍眉星目，身姿挺拔如松。",
            "泰山弟子": "這是一名青衣弟子，手裏握著一把長劍。",
            "建除": "泰山掌門的弟子，身形矯健，看起來武功不錯。",
            "天柏": "泰山掌門的師弟，看起來英氣勃勃。",
            "天松": "泰山掌門的師弟，嫉惡如仇，性子有些急躁。",
            "玉師叔": "泰山掌門的師叔，處事冷靜，極有見識。",
            "泰山掌門": "此人為泰山掌門，此人看起來正氣凜然。"
        },
        "鐵血大旗門": {
            "陳子昂": "一個狂放書生，顯是出自豪富之家，輕財好施，慷慨任俠。",
            "小販": "這小販左手提著個籃子，右手提著個酒壺。籃上系著銅鈴，不住叮鐺作響。",
            "酒肉和尚": "這是一個僧不僧俗不俗，滿頭亂發的怪人",
            "賓奴": "陰賓所養的波斯貓",
            "漁夫": "這是一個滿臉風霜的老漁夫。",
            "葉緣": "剛拜入大旗門不久的青年。",
            "老婆子": "她面容被歲月侵蝕，風雨吹打，劃出了千百條皺紋，顯得那麽衰老但一雙眼睛，卻仍亮如閃電，似是只要一眼瞧過去，任何人的秘密，卻再也休想瞞過她。",
            "羅少羽": "剛拜入大旗門不久的青年。",
            "青衣少女": "一個身材苗條，身著青衣的少女。",
            "日島主": "日島主乃大旗門第七代掌門人雲翼之妻，因看不慣大旗門人對其n妻子的無情，開創常春島一派，以收容世上所有傷心女子。",
            "潘興鑫": "剛到拜入大旗門不久的青年。",
            "鐵掌門": "他是大旗門的傳人。",
            "夜皇": "他容光煥發，須發有如衣衫般輕柔，看來雖是瀟灑飄逸，又帶有一種不可抗拒之威嚴。",
            "橙衣少女": "她身穿輕紗柔絲，白足如霜，青絲飄揚。",
            "陰賓": "她面上蒙著輕紅羅紗，隱約間露出面容輪廓，當真美得驚人，宛如煙籠芍藥，霧裏看花",
            "朱藻": "風流倜儻",
            "隱藏-X衣少女": "她身穿輕紗柔絲，白足如霜，青絲飄揚。",
            "卓三娘": "閃電卓三娘輕功世無雙，在碧落賦中排名第三。",
            "風老四": "風梭風九幽，但他現在走火入魔，一動也不能動了。",
            "小白兔": "小白兔白又白兩只耳朵豎起來。",
            "水靈兒": "她滿面愁容，手裏雖然拿著本書，卻只是呆呆的出神。",
            "隱藏-葉緣": "一個風程仆仆的俠客。",
            "隱藏-羅少羽": "一個風程仆仆的俠客。",
            "隱藏-潘興鑫": "一個風程仆仆的俠客。"
        },
        "大昭寺": {
            "小綿羊": "一只全身雪白的的綿羊。",
            "大綿羊": "一只全身雪白的的綿羊。",
            "小羊羔": "一只全身雪白的的綿羊。",
            "牧羊女": "一個牧羊女正在放羊。",
            "草原狼": "一直兇殘的草原狼。",
            "白衣少年": "年紀輕輕的少年，武功了得，卻心狠手辣。",
            "李將軍": "一個玄甲黑盔，身披白色披風的少年將軍，雖面容清秀，卻不掩眉宇之間的果決和堅毅。",
            "突厥先鋒大將": "東突厥狼軍先鋒大將，面目兇狠，身披狼皮鎧甲，背負長弓，手持丈余狼牙棒。",
            "神秘甲士": "身披重甲，手持長戟，不許旁人前進一步。",
            "地宮暗哨": "黑衣黑靴，一旦有外人靠近地宮，便手中暗器齊發。",
            "守山力士": "他們的雙拳，便是鎮守陵寢最好的武器。",
            "城衛": "一個年青的藏僧。",
            "紫衣妖僧": "附有邪魔之氣的僧人。",
            "塔僧": "一個負責看管舍利塔的藏僧。",
            "關外旅客": "這是一位來大昭寺遊覽的旅客。",
            "護寺喇嘛": "一個大招寺的藏僧。",
            "護寺藏尼": "一個大招寺的藏尼。",
            "靈空": "靈空高僧是大昭寺現在的主持。",
            "葛倫": "葛倫高僧已在大昭寺主持多年。男女弟子遍布關外。",
            "塔祝": "這個老人看起來七十多歲了，看著他佝僂的身影，你忽然覺得心情沈重了下來。",
            "胭松": "胭松是葛倫高僧的得意二弟子。",
            "余洪興": "這是位笑瞇瞇的丐幫八袋弟子，生性多智，外號小吳用。",
            "陶老大": "這是整天笑咪咪的車老板，雖然功夫不高，卻也過得自在。",
            "店老板": "這位店老板正在招呼客人",
            "野狗": "一只渾身臟兮兮的野狗。",
            "樵夫": "你看到一個粗壯的大漢，身上穿著普通樵夫的衣服。",
            "收破爛的": "一個收破爛的。",
            "乞丐": "一個滿臉風霜之色的老乞丐。",
            "瘋狗": "一只渾身臟兮兮的野狗，一雙眼睛正惡狠狠地瞪著你。",
            "蔔一刀": "他是個看起來相當英俊的年輕人，不過點神秘莫測的感覺。",
            "鎮魂將": "金盔金甲的護陵大將。",
            "頭狼": "狼群之王，體型碩大，狼牙寒鋒畢露。"
        },
        "黑木崖": {
            "怪人": "看起來像是只妖怪一般。",
            "黑熊": "一只健壯的黑熊。",
            "店小二": "這是一個忙忙碌碌的小二。",
            "客店老板": "一個賊眉鼠眼的商人。",
            "冉無望": "一個面容俊朗的少年，卻眉頭深鎖，面帶殺氣。",
            "船夫": "一個船夫。",
            "魔教弟子": "這家夥滿臉橫肉，一付兇神惡煞的模樣，令人望而生畏。",
            "見錢開": "此人十分喜好錢財。",
            "賈布": "他使得一手好鉤法。",
            "鮑長老": "他一身橫練的功夫，孔武有力。",
            "葛停香": "他天生神力，勇猛無比。",
            "上官雲": "他使得一手好劍法。",
            "桑三娘": "她使得一手好叉法。",
            "羅烈": "他使得一手好槍法。",
            "童長老": "他使得一手好錘法",
            "王誠": "他使得一手好刀法。",
            "藍色魔教犯人": "一個魔教的犯人，他們都是到魔教臥底的各大門派弟子事泄被捕的",
            "紅色魔教犯人": "一個魔教的犯人，他們都是到魔教臥底的各大門派弟子事泄被捕的",
            "青色魔教犯人": "一個魔教的犯人，他們都是到魔教臥底的各大門派弟子事泄被捕的",
            "紫色魔教犯人": "一個魔教的犯人，他們都是到魔教臥底的各大門派弟子事泄被捕的",
            "花想容": "她使得一手好刀法。",
            "曲右使": "他使得一手好鉤法。",
            "張矮子": "他使得一手好武功。",
            "張白發": "他使得一手好掌法。",
            "趙長老": "她使得一手好叉法。",
            "獨孤風": "此人是用劍高手。",
            "楊延慶": "他使得一手好槍法。",
            "範松": "他使得一手好斧法。",
            "巨靈": "他使得一手好錘法。",
            "楚笑": "雖是女子，但武功絕不輸於須眉。",
            "蓮亭": "他身形魁梧，滿臉虬髯，形貌極為雄健。",
            "東方教主": "他就是日月神教教主。號稱無人可敵。"
        },
        "星宿海": {
            "梅師姐": "此人一臉幹皺的皮膚，雙眼深陷，猶如一具死屍。",
            "天梵密使": "天梵宗主密使，遮住了容貌，神秘莫測。",
            "波斯商人": "一個高鼻藍眼的波斯商人。他看著你臉上露出狡猾的笑容。",
            "矮胖婦女": "一個很胖的中年婦女。",
            "唐冠": "唐門中的貴公子，父親是唐門中的高層，看起來極自負",
            "波斯老者": "一個老者來自波斯，似乎是一個鐵匠，臉上看起來有點陰險的感覺。",
            "買賣提": "買賣提是個中年商人，去過幾次中原，能講一點兒漢話",
            "阿拉木罕": "她身段不肥也不瘦。她的眉毛像彎月，她的眼睛很多情",
            "伊犁馬": "這是一匹雄壯的母馬，四肢發達，毛發油亮。",
            "巴依": "一個風塵仆仆的俠客。。",
            "小孩": "這是個小孩子",
            "阿凡提": "他頭上包著頭巾，長著向上翹的八字胡，最喜歡捉弄巴依、幫助窮人。他常給別人出謎語。",
            "牧羊人": "一個老漢，趕著幾十只羊。",
            "紫姑娘": "她就是丁老怪弟子紫姑娘。她容顏俏麗，可眼神中總是透出一股邪氣。",
            "采藥人": "一個辛苦工作的采藥人。",
            "玄衣刀妖": "一個白發老人，身著紫衣，眼神兇狠，太陽穴隆起，顯是有不低的內力修為。",
            "周女俠": "身形修長，青裙曳地。皮膚白嫩，美若天人。恍若仙子下凡，是人世間極少的絕美女子。其武功修為十分了得。",
            "毒蛇": "一只有著三角形腦袋的蛇，尾巴沙沙做響。",
            "牦牛": "這是一頭常見的昆侖山野牦牛",
            "雪豹": "這是一頭通體雪白的昆侖山雪豹，極為罕有",
            "天狼師兄": "他就是丁老怪的三弟子。",
            "出塵師弟": "他就是丁老怪的八弟子。他身才矮胖，可手中握的鋼杖又長又重。",
            "星宿派號手": "他是星宿派的吹號手。他手中拿著一只銅號，鼓足力氣一臉沈醉地吹著。",
            "星宿派鈸手": "他是星宿派的擊鈸手。他手中拿著一對銅鈸，一邊敲一邊扯著嗓子唱些肉麻的話。",
            "星宿派鼓手": "他是星宿派的吹鼓手。他面前放著一只銅鼓，一邊敲一邊扯著嗓子唱些肉麻的話。",
            "獅吼師兄": "他就是丁老怪的二弟子。他三十多歲，獅鼻闊口，一望而知不是中土人士",
            "摘星大師兄": "他就是丁老怪的大弟子、星宿派大師兄。他三十多歲，臉龐瘦削，眼光中透出一絲乖戾之氣。",
            "丁老怪": "他就是星宿派開山祖師、令正派人士深惡痛絕的星宿老怪丁老怪。可是他看起來形貌清奇，仙風道骨。",
            "采花子": "采花子是星宿派的一個小嘍羅，武功雖不好，但生性淫邪，經常奸淫良家婦女，是官府通緝的犯人，故而星宿派名義上也不承認有這個弟子。",
            "鐵屍": "這人全身幹枯，不像一個人，倒像是一具幹屍。"
        },
        "茅山": {
            "野豬": "一只笨笨的野豬",
            "陽明居士": "陽明居士瀟灑俊逸，一代鴻儒，學識淵博且深諳武事，有「軍神」之美譽，他開創的「陽明心學」更是打破了朱派獨霸天下的局面。",
            "道士": "茅山派的道士，著一身黑色的道袍",
            "孫天滅": "孫天滅外號六指小真人，是林忌最喜愛的徒弟。他盡得林忌真傳！",
            "道靈": "道靈真人是林忌的師弟，也是上代掌門的關門弟子，雖然比林忌小了幾歲，但道行十分高深，「谷衣心法」已修煉到極高境界了。",
            "護山使者": "護山使者是茅山派的護法，著一身黑色的道袍",
            "林忌": "林忌是一位道行十分高深的修道者，你發現他的眼珠一個是黑色的，一個是金色的，這正是「谷衣心法」修煉到極高境界的徵兆。",
            "萬年火龜": "一只尺許大小，通體火紅的烏龜。",
            "張天師": "他是龍虎山太乙一派的嫡系傳人，他法力高強，威名遠播。",
            "心魔": "缺"
        },
        "桃花島": {
            "陸廢人": "他是黃島主的三弟子。",
            "神雕大俠": "他就是神雕大俠，一張清臒俊秀的臉孔，劍眉入鬢。",
            "老漁夫": "一個看上去毫不起眼的老漁夫，然而……",
            "桃花島弟子": "一個二十多歲的小夥子，身板結實，雙目有神，似乎練過幾年功夫。",
            "啞仆人": "又聾又啞，似乎以前曾是一位武林高手。",
            "啞仆": "這是一個桃花島的啞仆。他們全是十惡不赦的混蛋，黃藥師刺啞他們，充為下禦。",
            "丁高陽": "曲三的一位好友，神態似乎非常著急。",
            "曲三": "他是黃島主的四弟子。",
            "黃島主": "他就是黃島主，喜怒無常，武功深不可測。",
            "蓉兒": "她是黃島主的愛女，長得極為漂亮。",
            "傻姑": "這位姑娘長相還算端正，就是一副傻頭傻腦的樣子。",
            "戚總兵": "此乃東南海防駐軍主將，英武之氣凜凜逼人，威信素著，三軍皆畏其令，從不敢擾民。"
        },
        "鐵雪山莊": {
            "樵夫": "一個砍柴為生的樵夫。",
            "歐冶子": "華夏鑄劍第一人，許多神劍曾出自他手。",
            "老張": "鐵血山莊的門衛。",
            "雪鴛": "神秘的綠衣女子，似乎隱居在鐵雪山莊，無人能知其來歷。",
            "鐵少": "鐵山是一個風流倜儻的公子。",
            "雪蕊兒": "雪蕊兒膚白如雪，很是漂亮。在這鐵雪山莊中，和鐵少過著神仙一般的日子。",
            "小翠": "鐵雪山莊的一個丫鬟。",
            "白袍公": "一個一襲白衣的老翁。",
            "黑袍公": "一個一襲黑衣的老翁。",
            "陳小神": "快活林裏小神仙，一個眉清目秀的江湖新人，據說機緣巧合下得到了不少江湖秘藥，功力非同一般，前途不可限量。",
            "劍蕩八荒": "虬髯大漢，要憑一把鐵劍戰勝天下高手，八荒無敵。",
            "魏嬌": "女扮男裝的青衣秀士，手持長劍，英姿颯爽，好一個巾幗不讓須眉。",
            "神仙姐姐": "白裙襲地，仙氣氤氳，武林中冉冉升起的新星，誓要問鼎至尊榜，執天下之牛耳。",
            "小飛": "『不落皇朝』的二當家，為人灑脫風趣，酷愛蹴鞠，酒量超群，以球入道。傳聞只要飲下三杯佳釀，帶醉出戰，那麽不論是踢全場、轉花枝、大小出尖，流星趕月，他都能憑借出色的技藝獨占鰲頭。",
            "寒夜·斬": "一副浪蕩書生打扮的中年劍客，據說他也曾是一代高手。",
            "他": "這人的名字頗為奇怪，只一個字。行為也頗為怪誕，總是藏在花叢裏。不過武功底子看起來卻一點都不弱。",
            "出品人◆風雲": "江湖豪門『21世紀影業』的核心長老之一，與幫主番茄攜手打下一片江山，江湖中威震一方的豪傑。",
            "二虎子": "一個已過盛年的江湖高手，像是曾有過輝煌，卻早已隨風吹雨打去。他曾有過很多名字，現在卻連一個像樣的都沒有留下，只剩下喝醉後嘴裏呢喃不清的“大師”，“二二二”，“泯恩仇”，你也聽不出個所以然。",
            "老妖": "一個金眼赤眉的老人，傳說來自遙遠的黑森之山，有著深不可測的妖道修為。",
            "歡樂劍客": "『地府』威震江湖的右護法，手中大斧不知道收留了多少江湖高手的亡魂。",
            "黑市老鬼": "江湖人無人不知，無人不曉的黑市老鬼頭，包裹裏無奇不有，無所不賣，只要你有錢，什麽稀奇的貨品都有，比如黑鬼的凝視，眼淚，咆哮，微笑。。。一應俱全。",
            "縱橫老野豬?": "兩件普通的黑布衣衫罩在身上，粗獷的眉宇間英華內斂，目光凝實如玉，顯出極高的修行。《參同契》有雲：「故鉛外黑，內懷金華，被褐懷玉，外為狂夫」。目睹此人，可窺一斑。",
            "無頭蒼蠅": "一個佝僂著身軀的玄衣老頭，從後面看去，似是沒有頭一樣，頗為駭人。",
            "神弒☆鐵手": "武林中數一數二的後起之秀，和所有崛起的江湖高手一樣，潛心修煉，誌氣淩雲。",
            "禪師": "一個退隱的禪師，出家人連名字都忘懷了，只剩下眼中隱含的光芒還能看出曾是問鼎武林的高手。",
            "道一": "後起之秀，面若中秋之月，色如春曉之花，鬢若刀裁，眉如墨畫。",
            "采菊隱士": "一個與世無爭的清修高人，無心江湖，潛心修仙。用「美男子」來形容他一點也不為過。身高近七尺，穿著一襲繡綠紋的紫長袍，外罩一件亮綢面的乳白色對襟襖背子。",
            "【人間】雨修": "曾經的江湖第二豪門『天傲閣』的大當家，武勇過人，修為頗深。怎奈何門派日漸式微，江湖聲望一日不如一日，讓人不禁扼腕嘆息，縱使一方霸主也獨木難支。",
            "男主角◆番茄": "江湖豪門『21世紀影業』的靈魂，當世絕頂高手之一，正在此潛心修練至上武學心法，立誌要在這腥風血雨的江湖立下自己的聲威！",
            "劍仙": "白須白發，仙風道骨，離世獨居的高人。",
            "冷泉心影": "『不落皇朝』當之無愧的君主和領袖，致力破除心中習武障魔，參得無上武道。頭上戴著束發嵌寶紫金冠，齊眉勒著二龍搶珠金抹額，如同天上神佛降臨人世。",
            "漢時嘆": "身穿水墨色衣、頭戴一片氈巾，生得風流秀氣。『地府』幫的開山祖師，曾是武功橫絕一時的江湖至尊。手中暗器『大巧不工』聞者喪膽，鏢身有字『揮劍訣浮雲』。",
            "烽火戲諸侯": "身軀凜凜，相貌堂堂。一雙眼光射寒星，兩彎眉渾如刷漆。胸脯橫闊，有萬夫難敵之威風。武林至尊榜頂尖劍客，一人一劍，手持『春雷』蕩平天劍谷，天下武林無人不曉！神劍劍身一面刻“鳳年”，一面刻著“天狼”。",
            "阿不": "器宇軒昂，吐千丈淩雲之誌氣。?白衣黑發，雙手負於背後，立於巨巖之頂，直似神明降世??。這是武林至尊榜第一高手，不世出的天才劍客，率『縱橫天下』幫獨尊江湖。手持一柄『穿林雨』長槍，槍柄上刻著一行小字：『歸去，也無風雨也無晴』。"
        },
        "慕容山莊": {
            "家丁": "一個穿著仆人服裝的家丁。",
            "鄧家臣": "他是慕容家四大家臣之首，功力最為深厚。",
            "朱姑娘": "這是個身穿紅衣的女郎，大約十七八歲，一臉精靈頑皮的神氣。一張鵝蛋臉，眼珠靈動，別有一番動人風韻。",
            "慕容老夫人": "她身穿古銅緞子襖裙，腕帶玉鐲，珠翠滿頭，打扮的雍容華貴，臉上皺紋甚多，眼睛迷迷朦朦，似乎已經看不見東西。",
            "慕容侍女": "一個侍女，年齡不大。",
            "公冶家臣": "他是慕容家四大家臣之二，為人穩重。",
            "包家將": "他是慕容家四大家臣之三，生性喜歡饒舌。",
            "風波惡": "他是慕容家四大家臣之四，最喜歡打架，輕易卻不服輸。",
            "慕容公子": "他是姑蘇慕容的傳人，他容貌俊雅，風度過人，的確非尋常人可比。",
            "慕容家主": "他是姑蘇慕容的傳人，可以說是自慕容龍城以下武功最為傑出之人。不僅能貫通天下百家之長，更是深為精通慕容家絕技。",
            "小蘭": "這是一個蔓陀山莊的丫環。",
            "嚴媽媽": "一個中年婦女，身上的皮膚黝黑，常年不見天日的結果。",
            "神仙姐姐": "她秀美的面龐之上，端莊中帶有稚氣，隱隱含著一絲憂色。見你註目看她不覺低頭輕嘆。只聽得這輕輕一聲嘆息。霎時之間，你不由得全身一震，一顆心怦怦跳動。心想：“這一聲嘆息如此好聽，世上怎能有這樣的聲音？”聽得她唇吐玉音，更是全身熱血如沸！",
            "王夫人": "她身穿鵝黃綢衫，眉目口鼻均美艷無倫，臉上卻頗有風霜歲月的痕跡。",
            "小茗": "這是一個蔓陀山莊的丫環。",
            "船工小廝": "一位年輕的船工。表情看上去很消沈，不知道發生了什麽。",
            "芳綾": "她看起來像個小靈精，頭上梳兩個小包包頭。她坐在地上，看到你看她便向你作了個鬼臉!你想她一定是調皮才會在這受罰!",
            "無影斥候": "經常在孔府徘徊的斥候。",
            "柳掌門": "封山劍派掌門，看似中了某種迷香，昏昏沈沈的睡著。"
        },
        "大理": {
            "擺夷女子": "她是一個身著白衣的擺夷女子，長發飄飄，身態娥娜。",
            "士兵": "他是一個大理國禁衛軍士兵，身著錦衣，手執鋼刀，雙目精光炯炯，警惕地巡視著四周的情形。",
            "武將": "他站在那裏，的確有說不出的威風。",
            "臺夷商販": "一位臺夷族的商販，正在販賣一竹簍剛打上來的活蹦亂跳的鮮魚。",
            "烏夷商販": "一位烏夷族的商販，挑著一擔皮毛野味在販賣。",
            "土匪": "這家夥滿臉橫肉一付兇神惡煞的模樣，令人望而生畏。",
            "獵人": "一位身強力壯的烏夷族獵手。",
            "皮貨商": "一位來遠道而來的漢族商人，來此采購皮貨。",
            "牧羊女": "她是一個擺夷牧羊女子。",
            "牧羊人": "他一個擺夷牧羊男子。",
            "破嗔": "他是一個和尚，是黃眉大師的二弟子。",
            "破疑": "他是一個和尚，是黃眉大師的大弟子。",
            "段惡人": "他身穿一件青布長袍，身高五尺有余，臉上常年戴一張人皮面具，喜怒哀樂一絲不露。",
            "吳道長": "一個看起來道風仙骨的道士。",
            "農夫": "一位烏夷族的農夫，束發總於腦後，用布紗包著，上半身裸露，下著獸皮。",
            "老祭祀": "一個烏夷族的祭司，身披烏夷大麾，戴著頗多金銀飾物，顯示其地位不凡。",
            "少女": "一位烏夷族的少女，以酥澤發，盤成兩環，上披藍紗頭巾，飾以花邊。",
            "山羊": "一頭短角山羊，大理地區常見的家畜。",
            "孟加拉虎": "一只斑斕孟加拉虎，雄偉極了。",
            "神農幫弟子": "這是一個神農幫的幫眾，身穿黃衣，肩懸藥囊，手持一柄藥鋤。",
            "無量劍弟子": "這是無量劍派的一名弟子，腰挎一柄長劍，神情有些鬼祟，象是懼怕些什麽。",
            "朱護衛": "他是大理國四大護衛之一。一副書生酸溜溜的打扮行頭。",
            "錦衣衛士": "這是位錦衣衛士，身著錦衣，手執鋼刀，雙目精光炯炯，警惕地巡視著四周的情形。",
            "太監": "一個風塵仆仆的俠客。。",
            "丹頂鶴": "一只全身潔白的丹頂鶴，看來是修了翅膀，沒法高飛了。",
            "宮女": "一位大理皇宮烏夷族宮女，以酥澤發，盤成兩環，一身宮裝，目無表情。",
            "傅護衛": "他是大理國四大護衛之一。",
            "褚護衛": "他是大理國四大護衛之一。身穿黃衣，臉上英氣逼人。手持一根鐵桿。",
            "家丁": "他是大理國鎮南王府的家丁。",
            "霍先生": "他一身邋遢，形容委瑣，整天迷迷糊糊的睡不醒模樣。可是他的賬務十幾年來無可挑剔。原來他就是伏牛派的崔百泉，為避仇禍隱居於此。",
            "華司徒": "他是大理國三大公之一。華司徒本名阿根，出身貧賤，現今在大理國位列三公，未發跡時，幹部的卻是盜墓掘墳的勾當，最擅長的本領是偷盜王公巨賈的墳墓。這些富貴人物死後，必有珍異寶物殉葬，華阿根從極遠處挖掘地道，通入墳墓，然後盜取寶物。所花的一和雖巨，卻由此而從未為人發覺。有一次他掘入一墳，在棺木中得到了一本殉葬的武功秘訣，依法修習，練成了一身卓絕的外門功夫，便舍棄了這下賤的營生，輔佐保定帝，累立奇功，終於升到司徒之職。",
            "範司馬": "他是大理國三公之一。",
            "巴司空": "他是大理國三公之一。一個又瘦又黑的漢子，但他的擅長輕功。",
            "段王妃": "大理王妃，徐娘半老，風韻猶存。",
            "石人": "一個練功用的比武石人，雕鑿得很精細，如同真人一般。",
            "段無畏": "他是大理國鎮南王府管家。",
            "古護衛": "他是大理國四大護衛之一。",
            "王府禦醫": "一個風程仆仆的俠客。",
            "段皇爺": "他就是大理國的鎮南王，當今皇太弟，是有名的愛情聖手。",
            "婉清姑娘": "她長得似新月清暈，如花樹堆雪，一張臉秀麗絕俗，只是過於蒼白，沒半點血色，想是她長時面幕蒙臉之故，兩片薄薄的嘴唇，也是血色極淡，神情楚楚可憐，嬌柔婉轉。",
            "薛老板": "這是一個經驗老到的生意人，一雙精明的眼睛不停的打量著你。",
            "石匠": "他是一個打磨大理石的石匠，身上只穿了一件坎肩，全身布滿了厚實的肌肉。",
            "擺夷小孩": "一個幼小的擺夷兒童。",
            "江湖藝人": "他是一個外地來的江湖藝人，手裏牽著一只金絲猴兒，滿臉風塵之色。",
            "太和居店小二": "這位店小二正笑咪咪地忙著，還不時拿起掛在脖子上的抹布擦臉。",
            "歌女": "她是一個賣唱為生的歌女。",
            "南國姑娘": "南國的大姑娘頗帶有當地優美秀麗山水的風韻，甜甜的笑，又有天真的浪漫。她穿著白色上衣，藍色的寬褲，外面套著黑絲絨領褂，頭上纏著彩色的頭巾。",
            "擺夷老叟": "一個擺夷老叟大大咧咧地坐在竹籬板舍門口，甩著三四個巴掌大的棕呂樹葉，瞧著道上來來往往的人們，倒也快活自在。",
            "野兔": "一只好可愛的小野兔。",
            "盛皮羅客商": "這是一位從印度來的客商，皮膚黝黑，白布包頭，大理把印度人叫作盛皮羅。",
            "客店店小二": "這位店小二正笑咪咪地忙著，還不時拿起掛在脖子上的抹布擦臉。",
            "古燈大師": "他身穿粗布僧袍，兩道長長的白眉從眼角垂了下來，面目慈祥，長須垂肩，眉間雖隱含愁苦，但一番雍容高華的神色，卻是一望而知。大師一生行善，積德無窮。",
            "漁夫": "一位臺夷族的漁夫，扛這兩條竹槳，提著一個魚簍。",
            "臺夷獵人": "一位臺夷族的獵手，擅用短弩，射飛鳥。",
            "臺夷婦女": "一位中年的臺夷婦女，上著無領襯花對襟，下穿五色筒裙，正在編織漁網。",
            "臺夷姑娘": "一位年輕的臺夷姑娘，上著無領襯花對襟，下穿五色筒裙。",
            "水牛": "一頭南方山區常見的水牛，是耕作的主力，也用來拉車載物。由於水草茂盛，長得十分肥壯。",
            "臺夷農婦": "一位年輕的臺夷農婦，在田裏辛勤地勞作著。",
            "采筍人": "一個盧鹿部的青年臺夷婦女，背後背了個竹筐，手拿一把砍柴刀，來采竹筍。",
            "族長": "一位滿臉皺紋的老年婦女，正是本村的族長。臺夷時處母系氏族，族中權貴皆為婦女。",
            "祭祀": "一位滿臉皺紋的老年婦女，是本村的大祭司，常年司守祭臺。臺夷時處母系氏族，祭司要職皆為婦女。",
            "侍者": "他看上去長的眉清目秀。",
            "高侯爺": "大理國侯爺，這是位寬袍大袖的中年男子，三縷長髯，形貌高雅",
            "素衣衛士": "這是位身懷絕技的武士。",
            "陪從": "一個部族頭領的陪從。",
            "傣族首領": "這是一個身裹虎皮的高大男性。",
            "大土司": "大土司是擺夷族人氏，是蒼山納蘇系的。他倒是長的肥頭大耳的，每說一句話，每有一點表情，滿臉的肉紋便象是洱海裏的波浪一樣。他身著彩綢，頭帶鳳羽，腳踩藤鞋，滿身掛著不同色彩的貝殼。只見他傲氣凜然地高居上座，不把來人看在眼裏。",
            "侍從": "這位倒也打扮的利索，一身短打，白布包頭，翹起的褲腿，一雙潔白的布鞋，格外醒目。他正準備出去籌備白尼族一年一度的大會。",
            "族頭人": "這位是哈尼的族頭人，哈尼是大理國的第三大族，大多聚在大都附近。此人貌甚精明，身穿對襟衣，亦是白布包頭。他坐在大土司的右下首，對來人細細打量著。",
            "黃衣衛士": "這是位黃衣衛士，身著錦衣，手執鋼刀，雙目精光炯炯，警惕地巡視著四周的情形。",
            "毒蜂": "一只色彩斑斕大個野蜂，成群結隊的。",
            "平通鏢局鏢頭": "一個風塵仆仆的俠客。。",
            "麻雀": "一只嘰嘰喳喳，飛來飛去的小麻雀。",
            "小道姑": "玉虛觀的小道姑，她是在這接待香客的。",
            "刀俏尼": "這是個容貌秀麗的中年道姑，是個擺夷族女子，頗有雍容氣質。",
            "僧人": "一個精壯僧人。",
            "枯大師": "他的面容奇特之極，左邊的一半臉色紅潤，皮光肉滑，有如嬰兒，右邊的一半卻如枯骨，除了一張焦黃的面皮之外全無肌肉，骨頭突了出來，宛然便是半個骷髏骨頭。這是他修習枯榮禪功所致。",
            "惡奴": "他看上去膀大腰粗，橫眉怒目，滿面橫肉。看來手下倒也有點功夫。",
            "貴公子": "這是一介翩翩貴公子，長得到也算玉樹臨風、一表人才，可偏偏一雙眼睛卻愛斜著瞟人。",
            "遊客": "一個遠道來的漢族遊客，風塵仆仆，但顯然為眼前美景所動，興高彩烈。",
            "村婦": "一個年輕的擺夷村婦。",
            "段公子": "他是一個身穿青衫的年輕男子。臉孔略尖，自有一股書生的呆氣。",
            "竹葉青蛇": "一只讓人看了起雞皮疙瘩的竹葉青蛇。",
            "臺夷商販": "一個臺夷婦女，背著個竹簍販賣些絲織物品和手工藝品。",
            "采桑女": "一個年輕的擺夷采桑姑娘。",
            "采筍人": "一個壯年村民，住在數裏外的村莊，背後背了個竹筐，手拿一把砍柴刀，上山來采竹筍。",
            "砍竹人": "一個壯年村民，住在山下的村落裏，是上山來砍伐竹子的。",
            "養蠶女": "一個年輕的擺夷村婦，養蠶紡絲為生。",
            "紡紗女": "一個年輕的擺夷村婦，心靈手巧，專擅紡紗。",
            "老祭祀": "一個頗老朽的擺夷老人，穿戴齊整，是本村的祭司，權力頗大，相當於族長。"
        },
        "斷劍山莊": {
            "黑袍老人": "一生黑裝的老人。",
            "白袍老人": "一生白裝的老人。",
            "和尚": "出了家的人，唯一做的事就是念經了。",
            "尼姑": "一個正虔誠念經的尼姑。",
            "擺渡老人": "一個飽經風霜的擺渡老人。",
            "天怒劍客": "他是獨孤求敗的愛徒，但他和師傅的性格相差極遠。他從不茍言笑，他的臉永遠冰冷，只因他已看透了世界，只因他殺的人已太多。他永遠只在殺人的時候微笑，當劍尖穿過敵人的咽喉，他那燦爛的一笑令人感到溫暖，只因他一向認為——死者無罪！",
            "任笑天": "這是一個中年男子。正靜靜地站著，雙目微閉，正在聽海！",
            "摘星老人": "他站在這裏已經有幾十年了。每天看天上劃過的流星，已經完全忘記了一切……甚至他自己。",
            "落魄中年": "一位落魄的中年人，似乎是一位鐵匠。",
            "栽花老人": "一個飽經風霜的栽花老人。",
            "背刀人": "此人背著一把生銹的刀，他似乎姓浪，武功深不可測。",
            "雁南飛": "這是一個絕美的女子，正在靜靜地望著天上的圓月。她的臉美麗而憂傷，憂傷得令人心碎。",
            "夢如雪": "這是一個尋夢的人。他已厭倦事實。他只有尋找曾經的夢，不知道這算不算是一種悲哀呢？",
            "劍癡": "他是劍癡，劍重要過他的生命。",
            "霧中人": "這個人全身都是模糊的，仿佛是一個並不真正存在的影子。只因他一生都生活在霧中，霧朦朧，人亦朦朧。",
            "獨孤不敗": "這就是一代劍帝獨孤求敗。獨孤求敗五歲練劍，十歲就已經罕有人能敵。被江湖稱為劍術天才。"
        },
        "冰火島": {
            "火麒麟王": "渾身充滿灼熱的氣息，嘴巴可吐出高溫烈焰，擁有強韌的利爪以及鋒利的尖齒，是主宰冰火島上的獸王。島上酷熱的火山地帶便是他的領地，性格極其兇殘，會將所看到闖入其領地的生物物焚燒殆盡。",
            "火麒麟": "磷甲刀槍不入，四爪孔武有力速度奇快。渾身能散發極高溫的火焰，喜熱厭冷，嗜好吞噬火山晶元。現居於冰焰島火山一側。",
            "麒麟幼崽": "火麒麟的愛子，生人勿近。",
            "遊方道士": "一名雲遊四海的道士，頭束白色發帶，身上的道袍頗為殘舊，背馱著一個不大的行囊，臉上的皺紋顯示飽經風霜的遊歷，雙目卻清澈異常，仿佛包容了天地。",
            "梅花鹿": "一身赭黃色的皮毛，背上還有許多像梅花白點。頭上岔立著的一雙犄角，看上去頗有攻擊性。行動十分機敏。",
            "雪狼": "毛色凈白，眼瞳紅如鮮血，牙齒十分銳利，身形巨大強壯，速度極快。天性狡猾，通常都是群體出動。",
            "白熊": "全身長滿白色長毛，雙爪極度鋒利，身材頗為剽悍，十分嗜血狂暴。是冰焰島上最強的獵食者。",
            "殷夫人": "此女容貌嬌艷無倫，雖已過中年但風采依稀不減。為人任性長情，智計百出，武功十分了得。立場亦正亦邪。乃張五俠結發妻子，張大教主親生母親。",
            "張五俠": "在武當七俠之中排行第五，人稱張五俠。雖人已過中年，但臉上依然俊秀。為人彬彬有禮，謙和中又遮不住激情如火的風發意氣。可謂文武雙全，乃現任張大教主的親生父親。",
            "趙郡主": "天下兵馬大元帥汝陽王之女，大元第一美人。明艷不可方物，艷麗非凡，性格精靈俊秀，直率豪爽，對張大教主一往情深，為愛放棄所有與其共赴冰焰島廝守終身。",
            "謝獅王": "他就是明教的四大護法之一的金毛獅王。他身材魁偉異常，滿頭金發散披肩頭。但雙目已瞎。在你面前一站，威風凜凜，真如天神一般。",
            "黑衣殺手": "穿著極其神秘的黑衣人，黑色的面巾遮住了他的面容。武功十分高強。",
            "殺手頭目": "頗為精明能幹。閃爍的雙眼散發毋容置疑的威望。乃是這群不明來歷黑衣人的統領頭目。",
            "元真和尚": "此人武功極高，極富智謀，心狠手辣殺人如麻。因與前明教教主私怨而惱羞成怒，出家剃度意圖挑撥江湖各大派，以達殲滅明教顛覆武林之目的。與謝獅王也有過一段不為人知的恩怨情仇。",
            "蓬面老頭": "蓬頭垢面，衣服千絲萬縷，顯然被關在這裏已經很久了。"
        },
        "俠客島": {
            "黃衣船夫": "這是個身著黃衣的三十幾歲漢子，手持木槳，面無表情。",
            "俠客島廝仆": "他是島上的一個仆人，手底下似乎很有兩下子。",
            "張三": "乃江湖傳聞中賞善罰惡使者之一，其精明能幹，為人大公無私。但平時大大咧咧表情十分滑稽。",
            "雲遊高僧": "一位雲遊四方的行者，風霜滿面，行色匆匆，似乎正在辦一件急事。",
            "王五": "他大約二十多歲，精明能幹，笑嘻嘻的和藹可親。",
            "白衣弟子": "乃俠客島龍島主門下的一個弟子。身上穿著洗得發白的錦衣，頭上帶著秀才帽，一臉的書呆子氣，怎么看也不象是個武林中人。",
            "丁三": "一個鶴發童顏的老頭，穿得荒誕不經，但看似武功十分了得。",
            "店小二": "位店小二正笑咪咪地忙著，還不時拿起掛在脖子上的抹布擦臉。",
            "俠客島閑人": "他是島上一個遊手好閑的人。不懷好意。",
            "石公子": "這是一個年輕公子，面若中秋之月，色如春曉之花，鬢若刀裁，眉如墨畫，鼻如懸膽，情若秋波，雖怒而時笑，即視而有情。",
            "書生": "他看過去像個落泊的書生，呆頭呆腦的一付書呆子的樣子。但只要你留心，你就發現他兩眼深沈，而且腰掛一把長劍。",
            "丁當": "一個十七八歲的少女，身穿淡綠衫子，一張瓜子臉，秀麗美艷。",
            "白掌門": "他就是雪山劍派的掌門人，習武成性，自認為天下武功第一，精明能幹，嫉惡如仇，性如烈火。",
            "馬六": "他身材魁梧，圓臉大耳，笑嘻嘻地和藹可親。",
            "俠客島弟子": "這是身材魁梧的壯漢，膀大腰圓，是島主從中原招募來的。力氣十分之大。",
            "李四": "身形甚高，但十分瘦削，留一撇鼠尾須，臉色陰沈。就是江湖傳聞中賞善罰惡使者之一，其精明能幹，但總是陰沈著臉。",
            "藍衣弟子": "她是木島主的女弟子，專管傳授島上弟子的基本功夫。",
            "童子": "這是一個十五六歲的少年，眉清目秀，聰明伶俐，深得島主喜愛。",
            "龍島主": "就是天下聞之色變的俠客島島主，號稱“不死神龍”。他須眉全白，臉色紅潤，有如孩童。看不出他的實際年紀。",
            "木島主": "他就是天下聞之色變的俠客島島主，號稱“葉上秋露”。只見他長須稀稀落落，兀自黑多白少，但一張臉卻滿是皺紋。看不出他的實際年紀。",
            "侍者": "這是個身著黃衣的三十幾歲漢子，垂手站立，面無表情。",
            "史婆婆": "她是雪山派白掌門的妻子，雖說現在人已顯得蒼老，但幾十年前提起“江湖一枝花”史小妹來，武林中卻是無人不知。",
            "矮老者": "此老身軀矮小，但氣度非凡，令人不敢小窺。他與其師弟高老者閉關已久，江湖上鮮聞其名。武功之高，卻令人震驚。",
            "高老者": "他身形高大碩狀，滿面紅光。舉止滑稽，帶點傻氣，武功卻是極高。他因不常在江湖上露面，是以並非太多人知聞其名。",
            "謝居士": "他就是摩天崖的主人。是個亦正亦邪的高手，但信守承諾，年輕時好武成興，無比驕傲，自認為天下第一。",
            "朱熹": "他是個精通詩理的學者，原本是被逼而來到俠客島，但學了武功後死心塌地的留了下來。",
            "小猴子": "一只機靈的猴子，眼巴巴的看著你，大概想討些吃的。",
            "樵夫": "一個一輩子以砍材為生的老樵夫，由於飽受風霜，顯出與年齡不相稱的衰老。",
            "醫者": "一位白發銀須的老者。據說當年曾經是江湖上一位著名的神醫。但自從來到俠客島上後，隱姓埋名，至今誰也不知道他真名是甚麽了。他看起來懶洋洋的，你要是想請他療傷的話恐怕不那麽容易。",
            "石幫主": "為人忠厚老實，性情溫和，天賦極高，記性極好。穿著一身破爛的衣服，卻也擋不住他一身的英氣。似乎身懷絕世武功。",
            "野豬": "這是一只兇猛的野豬，長得極為粗壯，嘴裏還不斷發出可怕的哄聲。",
            "漁家男孩": "這是個漁家少年，大概由於長期在室外的緣故，皮膚已曬得黝黑，人也長得很粗壯了。",
            "漁夫": "看過去像個平平凡凡的漁夫，臉和赤裸的臂膀都曬得黑黑的。但只要你留心，你就發現他兩眼深沈，而且腰掛一把長劍。",
            "漁家少女": "這是個漁家少女，雖然只有十二、三歲，但身材已經發育得很好了，眼睛水汪汪很是誘人。",
            "閱書老者": "一個精神矍爍的老者，他正手持書籍，穩站地上，很有姜太公之風。",
            "青年海盜": "一個青年海盜，頗為精壯，，眼角中展露出了兇相。",
            "老海盜": "一個年老的海盜，雖然胡子一大把了，但還是兇巴巴的。"
        },
        "絕情谷": {
            "土匪": "在山谷下燒傷搶掠的惡人。",
            "村民": "世代生活於此的人，每日靠著進山打打獵生活。",
            "野兔": "正在吃草的野兔。",
            "絕情谷弟子": "年紀不大，卻心狠手辣，一直守候在絕情山莊。",
            "冰蛇": "身體猶如冰塊透明般的蛇。",
            "千年寒蛇": "一條通體雪白的大蛇。",
            "天竺大師": "在絕情谷中研究怎麽破解情花之毒的醫學聖手。",
            "養花女": "照顧著絕情谷的花花草草的少女。",
            "侍女": "好色的絕情谷谷主從來劫來的少女。",
            "谷主夫人": "絕情谷上一任谷主的女兒，被現任谷主所傷，終日只得坐在輪椅之上。",
            "門衛": "這是個年富力強的衛兵，樣子十分威嚴。",
            "絕情谷谷主": "好色、陰險狡詐的獨眼龍。",
            "白衣女子": "一個宛如仙女般的白衣女子。",
            "采花賊": "聲名狼藉的采花賊，一路潛逃來到了絕情谷。",
            "拓跋嗣": "鮮卑皇族後裔，自幼就表現出過人的軍事天賦，十七歲時就遠赴河套抗擊柔然騎兵，迫使柔然不敢入侵。",
            "沒藏羽無": "多權謀，善用計，所率西夏堂刺客素以神鬼莫測著稱，讓對頭心驚膽戰。",
            "野利仁嶸": "西夏皇族後裔，黑道威名赫赫的殺手頭領，決策果斷，部署周密，講究戰法，神出鬼沒。",
            "嵬名元昊": "一副圓圓的面孔，炯炯的目光下，鷹勾鼻子聳起，剛毅中帶著幾分凜然不可侵犯的神態。中等身材，卻顯得魁梧雄壯，英氣逼人。平素喜穿白色長袖衣，頭戴黑色冠帽，身佩弓矢。此人城府心機深不可測，憑借一身最驚世駭俗的的錘法位居西夏堂最處尊居顯之位，力圖在天波楊門與燕雲世家三方互相牽制各自鼎立態勢下，為本門謀求最大之利益。",
            "雪若雲": "身著黑色紗裙，面容精致秀美，神色冷若冰雪，嘴角卻隱隱透出一股溫暖的笑意。現在似是在被仇家圍攻，已是身受重傷。",
            "養鱷人": "飼養鱷魚的年輕漢子。",
            "鱷魚": "悠閑的在鱷魚潭邊休息，看似人畜無害，但是無人敢靠近它們。",
            "囚犯": "被關押在暗無天日的地牢內，落魄的樣子無法讓你聯想到他們曾是江湖好漢。",
            "地牢看守": "看守著地牢的武者，一臉嚴肅，不知道在想些什麽。"
        },
        "碧海山莊": {
            "法明大師": "管理龍王殿的高僧，龍王殿大大小小的事物都是他在負責。",
            "僧人": "龍王殿僧人，負責每年祭祀龍王。",
            "隱士": "厭倦了這世間的紛紛擾擾，隱居於此的世外高人。",
            "野兔": "正在吃草的兔子。",
            "護衛": "他是一個身材高大的中年男子，看起來兇神惡煞，招惹不得。",
            "侍女": "打理碧海山莊上上下下的雜物。",
            "尹秋水": "她肌膚勝雪，雙目猶似一泓清水，顧盼之際，自有一番清雅高華的氣質，讓人為之所攝、自慚形穢、不敢褻瀆。但那冷傲靈動中頗有勾魂攝魄之態，又讓人不能不魂牽蒙繞。",
            "養花女": "一位養花少女，她每天就是照顧這數也數不清的花。",
            "家丁": "碧海山莊的家丁。",
            "耶律楚哥": "出身契丹皇族，為人多智謀，善料敵先機，騎術了得，為大遼立下赫赫卓著戰功。故而被奉為燕雲世家之主。與天波楊門纏鬥一生，至死方休。",
            "護衛總管": "身材瘦小，可是一身武藝超群，碧海山莊之內能勝他者不超過五人",
            "易牙傳人": "一身廚藝已經傲世天下，煎、熬、燔、炙，無所不精。",
            "砍柴人": "碧海山莊所需木柴都由他來供給。",
            "獨孤雄": "一個風程仆仆的俠客。",
            "王子軒": "碧海山莊少莊主，整日沈迷於一些稀奇古怪的玩意。",
            "王昕": "年過半百的中年男子，長相平庸，很難讓人把他與碧海山莊莊主這個身份聯想起來。"
        },
        "天山": {
            "周教頭": "大內軍教頭，外表樸實無華，實則鋒芒內斂。有著一腔江湖豪情。",
            "辛怪人": "性情古怪，不好交往，喜用新招，每每和對方對招之際，學會對方的招式，然後拿來對付對方，令到對方啼笑皆非。。是個狼養大的孩子，他很能打，打起來不要命，一個性情古怪的人，有著一段謎一樣的過去。",
            "穆小哥": "一個只有十八九歲的小夥子，樂觀豁達，無處世經驗，對情感也茫然無措，擅長進攻，變化奇快。",
            "牧民": "這是一位邊塞牧民，正在驅趕羊群。",
            "塞外胡兵": "一副兇神惡煞的長相，來自塞外。以擄掠關外牧民衛生。",
            "胡兵頭領": "手持一根狼牙棒，背負一口長弓。身材高大，面目可憎。",
            "烏刀客": "他就是名動江湖的烏老大，昔日曾謀反童姥未遂而被囚禁於此。",
            "波斯商人": "這是一位來自波斯的商人，經商手段十分高明。",
            "賀好漢": "乃行走江湖的綠林好漢，脾氣極為暴躁。",
            "鐵好漢": "邱莫言重金雇傭的綠林好漢，賀蘭山草寇。缺乏主見，使一柄沒有太多特色的單刀，雖是為財而來，卻也不失為江湖義士",
            "刁屠夫": "乃龍門客棧屠夫，此人憑借常年累月的剔骨切肉練就一身好刀法。",
            "金老板": "龍門客棧老板娘，為人八面玲瓏。左手使鏢，右手使刀，體態婀娜多姿，嫵媚潑辣。",
            "韓馬夫": "一位憨直的漢子，面容普通，但本性古道熱腸，有俠義本色。",
            "蒙面女郎": "這是個身材嬌好的女郎，輕紗遮面，一雙秀目中透出一絲殺氣。",
            "武壯士": "他身穿一件藏藍色古香緞夾袍，腰間綁著一根青色蟒紋帶，一頭暗紅色的發絲，有著一雙深不可測眼睛，體型挺秀，當真是風度翩翩颯爽英姿。",
            "程首領": "她是「靈柩宮」九天九部中鈞天部的副首領",
            "菊劍": "這是個容貌姣好的女子，瓜子臉蛋，眼如點漆，清秀絕俗。",
            "石嫂": "她是[靈柩宮]的廚師。",
            "蘭劍": "這是個容貌姣好的女子，瓜子臉蛋。",
            "符針神": "她是「靈柩宮」九天九部中陽天部的首領她號稱「針神」",
            "梅劍": "她有著白皙的面容，猶如梅花般的親麗脫俗，堆雲砌黑的濃發，整個人顯得妍姿俏麗惠質蘭心。",
            "竹劍": "這是個容貌姣好的女子，瓜子臉蛋，眼如點漆，清秀絕俗。你總覺得在哪見過她",
            "余婆": "她是「靈柩宮」九天九部中昊天部的首領。她跟隨童姥多年，出生入死，飽經風霜。",
            "九翼": "他是西夏一品堂禮聘的高手，身材高瘦，臉上總是陰沈沈的他輕功極高，擅使雷公擋，憑一手雷公擋功夫，成為江湖的一流高手。",
            "天山死士": "是掌門從武林擄掠天資聰明的小孩至天山培養的弟子，自小就相互廝殺，脫穎而出者便會成為天山死士，只聽命於掌門一人，倘若有好事者在天山大動幹戈，他將毫不猶豫的將對方動武，至死方休。",
            "天山大劍師": "棄塵世而深居天山顛峰，數十年成鑄劍宗師，鑄成七把寶劍。此七把劍代表晦明大師在天山上經過的七個不同劍的境界。",
            "護關弟子": "這是掌門最忠心的護衛，武功高深莫測。正用警惕的眼光打量著你",
            "楚大師兄": "有“塞外第一劍客”之稱、“遊龍一出，萬劍臣服”之勇。性傲、極度自信、重情重義、兒女情長，具有英雄氣蓋，但容易感情用事，做事走極端。乃天山派大師兄。",
            "傅奇士": "一個三綹長須、面色紅潤、儒冠儒服的老人，不但醫術精妙，天下無匹，而且長於武功，在劍法上有精深造詣。除此之外，他還是書畫名家。",
            "楊英雄": "一個有情有義的好男兒，他武功高強大義凜然，乃天山派二師兄。",
            "胡大俠": "因其武功高強神出鬼沒。在江湖上人送外號「雪山飛狐」。他身穿一件白色長衫，腰間別著一把看起來很舊的刀。他滿腮虬髯，根根如鐵，一頭濃發，卻不結辮。"
        },
        "苗疆": {
            "溫青": "此人俊秀異常，個性溫和有風度，喜好遊歷山水是一位姿態優雅的翩翩君子",
            "苗村長": "這是本村的村長，凡是村裏各家各戶，老老少少的事他沒有不知道的。",
            "苗家小娃": "此娃肥肥胖胖，走路一晃一晃，甚是可愛。",
            "苗族少年": "一個身穿苗族服飾的英俊少年。",
            "苗族少女": "一個身穿苗族服飾的妙齡少女。",
            "田嫂": "一個白皙豐滿的中年婦人．",
            "金背蜈蚣": "一條三尺多長，張牙舞爪的毒蜈蚣。",
            "人面蜘蛛": "一只面盆大小，長著人樣腦袋的大蜘蛛。",
            "吸血蜘蛛": "一只拳頭大小，全身綠毛的毒蜘蛛。",
            "樵夫": "一位面色黑紅，悠然自得的樵夫．",
            "藍姑娘": "此女千嬌百媚，風韻甚佳，聲音嬌柔宛轉，蕩人心魄。年齡約莫二十三四歲。喜歡養毒蛇，能煉制傳說中苗族人的蠱毒，還善於配置各種劇毒。喜歡吹洞簫，口哨也很好。",
            "莽牯朱蛤": "一只拳頭大小，叫聲洪亮的毒蛤蟆。",
            "陰山天蜈": "一條三寸多長，長有一雙翅膀劇毒蜈蚣。",
            "食屍蠍": "一條三尺來長，全身鐵甲的毒蠍子。",
            "蛇": "一條七尺多長，手腕般粗細的毒蛇。十分駭人。",
            "五毒教徒": "一個五毒的基層教徒，看來剛入教不久。",
            "沙護法": "他就是五毒教的護法弟子，身材魁梧，方面大耳。在教中轉管招募教眾，教授弟子們的入門功夫。",
            "五毒弟子": "五毒教一個身體強壯的苗族青年，看來武功已小由所成。",
            "毒郎中": "一位身穿道服，幹癟黑瘦的中年苗人．",
            "白鬢老者": "一個須發皆白的老者，精神矍鑠，滿面紅光。",
            "何長老": "她就是五毒教的長老，教主的姑姑。隨然是教主的長輩，但功夫卻是一塊跟上代教主學的。據說她曾經被立為教主繼承人，但後來犯下大錯，所以被罰到此處面壁思過，以贖前罪。她穿著一身破舊的衣衫，滿臉疤痕，長得骨瘦如柴，雙目中滿是怨毒之色。",
            "毒女": "年紀約20歲，冷艷絕倫，背景離奇，混身是毒，外號毒女曼陀羅，涉嫌下毒命案，其實她是個十分善良的女子。與鐵捕快有一段纏綿悱惻的愛情，花耐寒而艷麗。",
            "潘左護法": "他就是五毒教的左護法，人稱笑面閻羅。別看他一臉笑瞇瞇的，但是常常殺人於彈指之間，一手五毒鉤法也已達到登峰造極的境界。",
            "大祭司": "乃苗疆最為德高望重的祭師。但凡祭祀之事皆是由其一手主持。",
            "岑秀士": "他就是五毒教的右護法，人稱五毒秀士。經常裝扮成一個白衣秀士的模樣，沒事總愛附庸風雅。",
            "齊長老": "他就是五毒教的長老，人稱錦衣毒丐。乃是教主的同門師兄，在教中一向飛揚跋扈，大權獨攬。他長的身材魁梧，面目猙獰，身穿一件五彩錦衣，太陽穴高高墳起。",
            "五毒護法": "乃幫主的貼身護法，為人忠心耿耿，武藝深不可測。幫主有難時，會豁盡全力以護佑她人身安全。",
            "何教主": "你對面的是一個一身粉紅紗裙，笑靨如花的少女。她長得肌膚雪白，眉目如畫，赤著一雙白嫩的秀足，手腳上都戴著閃閃的金鐲。誰能想到她就是五毒教的教主，武林人士提起她無不膽顫心驚。"
        },
        "白帝城": {
            "白衣弟子": "身穿白衣的青年弟子，似乎身手不凡，傲氣十足。",
            "守門士兵": "身穿白帝城軍服的士兵。",
            "白衣士兵": "身穿白衣的士兵，正在街上巡邏。",
            "文將軍": "白帝城公孫氏的外戚，主要在紫陽城替白帝城防禦外敵。",
            "糧官": "負責管理紫陽城的糧倉的官員。",
            "練武士兵": "正在奮力操練的士兵。",
            "近身侍衛": "公孫將軍的近身侍衛，手執長劍。",
            "公孫將軍": "公孫氏的一位將軍，深受白帝信任，被派到紫陽城擔任守城要務。",
            "白衣少年": "身穿白帝城統一服飾的少年，長相雖然一般，但神態看起來有點傲氣。",
            "李峰": "精神奕奕的中年漢子，看起來非常自信。",
            "李白": "字太白，號青蓮居士，又號“謫仙人”，他拿著一壺酒，似乎醉醺醺的樣子。",
            "“妖怪”": "一個公孫氏的紈絝弟子，無聊得假扮妖怪到處嚇人。",
            "廟祝": "一個風程仆仆的俠客。",
            "獄卒": "一個普通的獄卒，似乎在這發呆。",
            "白帝": "現任白帝，乃公孫氏族長，看起來威嚴無比，在他身旁能感受到不少壓力。",
            "李巡": "白發蒼蒼的老頭，貌似是李峰的父親。",
            "鎮長": "白發蒼蒼的鎮長，看起來還挺精神的。"
        },
        "墨家機關城": {
            "墨家弟子": "一聲正氣稟然的裝束，乃天下間心存俠義之人仰慕墨家風采而成為其中一員。",
            "索盧參": "此人乃墨子學生，為人特別誠懇，因此被指派負責接待外賓司儀一職。",
            "高孫子": "為墨子的學生，口才十分了得。故而負責機關城與外界聯系。",
            "燕丹": "此人乃前朝皇族，滅國之後投身到墨家麾下四處行俠仗義神秘莫測。",
            "荊軻": "墨家絕頂刺客，劍法在墨家中出類拔萃，為人慷慨俠義。備受墨家弟子所敬重。",
            "庖丁": "一名憨厚開朗的大胖子，其刀法如神，是個燒遍天下美食的名廚。",
            "治徒娛": "為墨子的學生，有過目不忘之才數目分明之能，因此在節用市坐鎮負責機關城資源調配。",
            "大博士": "對天下學術有著極高造詣的宗師，主管墨家學說的傳承。",
            "高石子": "此人乃墨子的學生，深受墨子欣賞。曾經當過高官，現主管墨家日常政務。",
            "縣子碩": "此人乃墨子學生，與高何一樣無惡不作，後師從墨子，收心斂性，專職培養墨家人才。",
            "魏越": "為墨子的學生，此人天敏而好學，時常不恥下問，因此被墨子欽點在此顧守書籍。",
            "黑衣人": "一身蒙面黑衣，鬼鬼祟祟，不知是何人。",
            "徐夫子": "墨家最優秀的鑄匠，畢生致力精研鑄劍術，很多名震天下的神兵利刃皆是出自他手。",
            "屈將子": "此人乃資深航海師，墨家麾下的殸龍船便是由其掌控。",
            "偷劍賊": "身穿黑色夜行衣，舉手投足之間盡顯高手風範，實力不容小覷。",
            "高何": "此人乃墨子學生，面相兇神惡煞，因而負責機關城的安全事務。",
            "隨師弟": "隨巢子的師弟，因犯事被暫時關於此地。",
            "大匠師": "鑄藝高超的墨家宗師，主管墨家兵器打造。",
            "隨巢子": "此人乃墨子的學生，沈迷於打造大型機關獸，木鳶便是出自其手。",
            "魯班": "機關術的專家，以善於發明各種機關而聞名。木匠出身，在機關術上有著天人一般的精湛技藝。如今不知為何來到墨家機關城。",
            "曹公子": "早年曾質疑墨子之道，後被博大精深的墨家機關術所折服，專職看守天工塢。",
            "耕柱子": "為墨子的學生，此人天資異稟，但驕傲自滿，因此被墨子懲罰到兼愛祠看管。",
            "墨子": "墨家的開山祖師，以一人之力開創出機關流派，須眉皆白，已不知其歲數幾何，但依然滿臉紅光，精神精神煥發。",
            "公尚過": "墨子的弟子，深得墨子器重，為人大公無私，現主管墨家的檢察維持門內秩序。"
        },
        "掩月城": {
            "佩劍少女": "兩個年方豆蔻的小女孩，身上背著一把短劍，腰間系著一塊『出雲』玉牌，臉上全是天真爛漫。",
            "野狗": "一條低頭啃著骨頭的野狗。",
            "執定長老": "出雲閣四大長老之一，負責出雲莊在城中的各種日常事務，也帶一些難得下山的年輕小弟子來城中歷練。雖表情嚴肅，卻深受晚輩弟子的喜愛。",
            "醉酒男子": "一名喝得酩酊大醉的男子，看起來似是個浪蕩的公子哥。",
            "仆人": "富家公子的仆人，唯唯諾諾地跟在身後。",
            "紫衣仆從": "身著紫衣的侍從，不像是青樓守衛，卻更有豪門王府門衛的氣派。",
            "候君凜": "一名中年男子，雖是平常俠客打扮，卻頗有幾分朝廷中人的氣度。",
            "輕紗女侍": "一名身著輕紗的女子，黛眉輕掃，紅唇輕啟，嘴角勾起的那抹弧度仿佛還帶著絲絲嘲諷。眼波一轉。流露出的風情讓人忘記一切。",
            "撫琴女子": "身著紅衣的撫琴少女，紅色的外袍包裹著潔白細膩的肌膚，她偶爾站起走動，都要露出細白水嫩的小腿。腳上的銀鈴也隨著步伐輕輕發出零零碎碎的聲音。纖細的手指劃過古樸的琵琶。令人騷動的琴聲從弦衫流淌下來。",
            "女官人": "猶憐樓的女主事，半老徐娘，風韻猶存。",
            "黑紗舞女": "一個在大廳中間舞臺上表演的舞女，身著黑紗。她玉足輕旋，在地上留下點點畫痕，水袖亂舞，沾染墨汁勾勒眼裏牡丹，裙擺旋舞，朵朵蓮花在她腳底綻放，柳腰輕搖，勾人魂魄，暗送秋波，一時間天地競相為此美色而失色羞愧。可謂是絲竹羅衣舞紛飛！",
            "小廝": "樓裏的小廝，看起來乖巧得很。",
            "梅映雪": "一名英姿颯爽的女劍客，身手非凡，負責把守通向後院的小路。",
            "舞眉兒": "猶憐樓內最善舞的女子，雲袖輕擺招蝶舞、纖腰慢擰飄絲絳。她似是一只蝴蝶翩翩飛舞、一片落葉空中搖曳，又似是叢中的一束花、隨著風的節奏扭動腰肢。若有若無的笑容始終蕩漾在她臉上，清雅如同夏日荷花。",
            "寄雪奴兒": "一條從西域帶來的波斯貓。",
            "琴楚兒": "女子長長的秀發隨著絕美的臉龐自然垂下，月光下，長發上似乎流動著一條清澈的河流，直直瀉到散開的裙角邊，那翠色欲流的玉簫輕輕挨著薄薄的紅唇，蕭聲淒美蒼涼。她的雙手潔白無瑕，輕柔的流動在樂聲中，白色的衣裙，散落的長發，流離淒美。她眉宇間，憂傷像薄薄的晨霧一樣籠罩著。沒有金冠玉飾，沒有尊貴華杉。她卻比任何人都美。",
            "華衣女子": "衣著華貴的女子，年紀尚輕，身上似藏有一些秘密。",
            "赤髯刀客": "一名面向粗曠威武的刀客，胡髯全是火紅之色，似是鐘馗一般。",
            "老乞丐": "衣衫破爛卻不汙穢的老乞丐，身上有八個口袋，似是丐幫凈衣八袋弟子。",
            "馬幫弟子": "漠北馬幫的得力弟子。",
            "養馬小廝": "這是客棧門口負責為客人牽馬餵馬的小廝。",
            "客棧掌櫃": "臥馬客棧的大掌櫃的。",
            "店小二": "一個跑前跑後的小二，忙得不可開交。",
            "蝮蛇": "當地特有的毒蛇，嘶嘶地發出警告，你最好不要靠近。",
            "東方秋": "一名年青劍客，腰插一塊顯是王府內的令牌，讓人對其身份產生了好奇。",
            "函谷關官兵": "這是鎮守函谷關的官兵，在渡口偵探敵情。",
            "函谷關武官": "函谷關統兵武官，駐守渡口監視著敵人的動向。",
            "長刀敵將": "這是一名手持長刀的敵將。",
            "穿山甲": "這是一只穿山甲。",
            "黑衣老者": "一個表情兇狠的黑衣老者，你最好還是不要招惹他。",
            "六道禪師": "曾經的武林禪宗第一高手，武功修為極高，內力深厚，一身真氣護體的功夫，尋常人難以企及。",
            "雪若雲": "這是無影樓長老雪若雲，此刻正在榻上打坐靜養。",
            "火狐": "這是一只紅色皮毛的狐貍。",
            "黃鸝": "這是一只黃鸝鳥兒，吱吱呀呀地唱著。",
            "夜攸裳": "一個來自波斯國的女子，看似穿著華裙，內中卻是勁衣。頭上紮著一個側髻，斜插著一支金玉雙鳳釵。",
            "雲衛": "這是守衛出雲莊大門的守衛，氣度不凡。",
            "雲將": "這是統管出雲莊護衛的將領，龍行虎步，神威凜凜。",
            "女眷": "這是出雲莊的女眷，雖為女流，卻精通武藝。",
            "制甲師": "這是一個頂尖的制造甲胄的大師。",
            "試劍士": "這是一個試煉各式兵器和器械的武士。",
            "莫邪傳人": "這是一個頂尖的鑄煉天匠，據傳曾是莫邪的弟子。",
            "老仆": "一名忠心耿耿的老仆人，一言不發地守在公子身後。",
            "狄嘯": "這是一個能征戰四方的將軍，出雲莊的得力大將。",
            "青雲仙子": "這是一個遊歷四方的道姑，姿態飄逸，身負古琴，能成為出雲莊的客人，怕也是來頭不小。",
            "秦東海": "是出雲莊的主人，也是出雲部軍隊的大統帥。身穿獅頭麒麟鎧，腰佩神劍。",
            "執劍長老": "這是出雲莊四大長老之一的執劍長老，負責傳授莊中武士的武藝，其一身武功之高自是不在話下。",
            "執法長老": "這是出雲莊四大長老之一的執法長老，負責莊中的法規制度的執行，嚴肅公正，一絲不茍。",
            "執典長老": "這是出雲莊四大長老之一的執典長老，負責維護管理莊中重要的典籍和秘書。",
            "野兔": "這是一只灰耳白尾的野兔",
            "老煙桿兒": "一名白發蒼蒼的老人，手持一柄煙桿兒。",
            "雜貨腳夫": "一個負責運送日常雜貨的腳夫。",
            "短衫劍客": "一個身著短衫，利落幹凈的劍客。",
            "巧兒": "一個聰明伶俐，嬌小可愛的小丫頭。",
            "騎牛老漢": "一個黑衫華發的老人，腰佩長劍。",
            "青牛": "一頭通體泛青，健碩無比的公牛。",
            "書童": "一名年不及二八的小書童，身上背著書簍。",
            "赤尾雪狐": "一只通體雪白，尾稍赤紅如火的狐貍。",
            "泥鰍": "一條烏黑油亮的小泥鰍，在溪水中暢快地遊著。",
            "灰衣血僧": "一個滿面煞氣，身著灰色僧袍，手持大環刀的中年惡僧。",
            "白鷺": "一只羽毛如雪的白鷺，雙翅一展有丈許，直欲振翅上九天而去。",
            "青衫女子": "一名身著青衫，頭戴碧玉簪的年青女子。手裏拿著一支綠色玉簫。",
            "樊川居士": "百年難得一出的天縱英才，詩文當世無二，其詩雄姿英發。而人如其詩，個性張揚，如鶴舞長空，俊朗飄逸。",
            "無影暗侍": "這是一個無影樓守門的侍衛，全身黑衣，面帶黑紗。",
            "琴仙子": "一個身著樸素白裙，滿頭青絲垂下的少女，手指輕動，天籟般的琴音便流淌而出。琴聲之間還包含了極深的內力修為。",
            "百曉居士": "這是一個江湖事無所不曉的老頭，總是一副若有所思的樣子。",
            "清風童子": "這是無影樓的小侍童。",
            "刀仆": "這是天刀宗師的仆人，忠心耿耿。",
            "天刀宗師": "一個白發老人，身形挺拔，傳說這是二十年前突然消失於武林的天下第一刀客。",
            "虬髯長老": "這是無影閣四大長老之一的虬髯公，滿面赤色的虬髯，腰間一把帝王之劍。",
            "行腳販子": "這是一個遠道而來的商人，滿面風塵。",
            "農家少婦": "附近農家的新婚婦人，一邊帶著孩子，一邊浣洗著衣服。",
            "六婆婆": "年長的婦女，總忍不住要善意地指導一下年輕女孩們的家務。",
            "青壯小夥": "在井邊打水的健壯少年，渾身都是緊實的肌肉，總是在有意無意之間展示著自己的力量。",
            "店老板": "馬車店老板，年近不惑。",
            "白衣弟子": "出雲莊的年輕弟子，第一次來到市集，看什麽都是新鮮。",
            "黑衣騎士": "穿著馬靴的黑衣少年，似是在維持市場的秩序。",
            "青衫鐵匠": "一個深藏不露的鐵匠，據說能打出最上乘的武器。",
            "牧民": "一個風霜滿面卻面帶微笑的中年男子。",
            "青鬃野馬": "野外的空闊遼遠，青鬃馬揚起鬃毛，收腰紮背，四蹄翻飛，跨阡度陌，躍丘越壑，盡情地奔馳在自由的風裏。",
            "小馬駒": "出生不足一年的小馬駒，雖不知其名，但顯是有著極純正優秀的血統，世人皆說風花牧場盡收天下名駒，此言非虛。",
            "的盧幼駒": "額上有白點，通體黝黑的神駿幼駒。",
            "烏騅馬": "通體黑緞子一樣，油光放亮，唯有四個馬蹄子部位白得賽雪。烏騅背長腰短而平直，四肢關節筋腱發育壯實，這樣的馬有個講頭，名喚“踢雪烏騅”。",
            "絳衣劍客": "一名身著絳色短衫的劍客，太陽穴微微鼓起，顯是有著極強內力修為。",
            "白衣公子": "手持折扇，白衣飄飄的俊美公子，似是女扮男裝。",
            "秦驚烈": "一個身高七尺的偉岸男子，腰裏掛著彎刀，明明是滿臉虬髯，臉上卻總是帶著溫和的微笑。",
            "千小駒": "一個年近弱冠的小孩子，身著皮襖，手拿小鞭，自幼在牧場長大，以馬駒為名，也極善與馬兒相處，據說他能聽懂馬兒說話。",
            "小馬駒兒": "一只剛出生不久的小馬駒，雖步行踉蹌，卻也已能看出純種烈血寶馬的一二分風采。",
            "牧羊犬": "牧民們的牧羊犬，威風凜凜，忠心耿耿。",
            "追風馬": "中原諸侯夢寐以求的軍中良馬，可日行六百，四蹄翻飛，逐風不休。",
            "諸侯秘使": "一個來求購良馬的使者，不知道哪個諸侯派出，身份隱秘。",
            "赤菟馬": "人中呂布，馬中赤兔，如龍如神，日行千裏，紅影震懾千軍陣！",
            "風如斬": "風花牧場上最好的牧人之一，左耳吊墜是一只狼王之齒，腰間的馬刀也是功勛赫赫！",
            "爪黃飛電": "據說是魏武帝最愛的名駒，體型高大，氣勢磅礴，萬馬之中也可一眼看出。",
            "黑狗": "一條牧場上的黑狗，汪汪地沖你叫著。",
            "照夜玉獅子": "此馬天下無雙，通體上下，一色雪白，沒有半根雜色，渾身雪白，傳說能日行千裏，產於西域，是極品中的極品。",
            "魯總管": "風花牧場的總管，上上下下的諸多事情都歸他打理，內務外交都會經他之手。他卻一副好整以暇的樣子，似是經緯盡在掌握。",
            "風花侍女": "風花牧場的侍女，雖名義上都是仆從，但卻神色輕松，喜笑顏開，和主人管事們都親熱非常。",
            "灰耳兔": "一只白色的兔子，耳朵卻是灰色。",
            "白狐": "一只通體雪白的小狐貍，在樹洞裏伸出頭來看著你。",
            "小鹿": "一只滿身梅花的小鹿，擡起頭看著你。",
            "天璣童子": "天璣樓裏的小童子，身穿青衫，頭系藍色發帶。"
        },
        "海雲閣": {
            "馬夫": "這是一個等候主人的馬夫，耐心地打掃著馬車。",
            "野狗": "一只渾身臟兮兮的野狗",
            "老鎮長": "這是海雲鎮的鎮長，平日裏也沒啥事情可管，便拿著個煙袋閑逛。",
            "煙袋老頭": "一個顯然有著不低功夫底子的老頭子，手拿一個煙袋。",
            "青年女子": "一個青年女劍客，年方二八，身姿矯健。",
            "背槍客": "這是一個青年武士，背後背著一把亮銀長槍。",
            "小孩": "這是海雲鎮的一個小孩子，年方五六歲，天真爛漫。",
            "野兔": "正在吃草的兔子。",
            "遊客": "這是一個遊客，背著手享受著山海美景。",
            "青年劍客": "這是一個青年劍客，眼含劍氣。",
            "九紋龍": "這是海雲閣四大殺手之一的九紋龍，兇狠非常。",
            "蟒蛇": "一只昂首直立，吐著長舌芯的大蟒蛇。",
            "暗哨": "這是海雲閣的暗哨，身穿平常的布衣，卻掩飾不了眼神裏的狡黠和敏銳。",
            "石邪王": "據說這曾是武林魔道名門掌門，其武學造詣也是登峰造極。",
            "穿山豹": "這事海雲閣四大殺手之一的穿山豹，行動敏捷，狡黠異常。",
            "地殺": "這是一名海雲閣高級殺手。",
            "天殺": "這是一名海雲閣高級殺手。",
            "海東獅": "這是海雲閣四大殺手之首的海東獅，近十年來從未失手，手底已有數十個江湖名門掌門的性命。",
            "海雲長老": "這是海雲閣內的長老級殺手。",
            "紅紗舞女": "這是一個身著輕紗的舞女，穿著輕薄，舞姿極盡媚態，眉目輕笑之間卻隱含著淡淡的殺氣。",
            "青紗舞女": "這是一個身著輕紗的舞女，穿著輕薄，舞姿極盡媚態，眉目輕笑之間卻隱含著淡淡的殺氣。",
            "紫紗舞女": "這是一個身著輕紗的舞女，穿著輕薄，舞姿極盡媚態，眉目輕笑之間卻隱含著淡淡的殺氣。",
            "白紗舞女": "這是一個身著輕紗的舞女，穿著輕薄，舞姿極盡媚態，眉目輕笑之間卻隱含著淡淡的殺氣。",
            "六如公子": "這是一個隱士，武學修為極高，也似乎並不受海雲閣轄制。",
            "蕭秋水": "傳聞他出自天下第一名門浣花劍派，卻無人知曉他的名諱。",
            "嘯林虎": "這事海雲閣四大殺手之一的嘯林虎，武功極高。",
            "陸大刀": "江湖南四奇之首，人稱仁義陸大刀。",
            "水劍俠": "江湖南四奇之一，外號叫作“冷月劍”",
            "乘風客": "江湖南四奇之一，外號叫作“柔雲劍”。",
            "血刀妖僧": "「血刀聖教」掌門人，自稱「武林第一邪派高手」，門下都作和尚打扮，但個個都是十惡不赦的淫僧。",
            "花鐵槍": "江湖南四奇之一，外號叫作“中平槍”",
            "狄小俠": "其貌不揚，但卻有情有義，敢愛敢恨，性格鮮明。",
            "水姑娘": "白衫飄飄，樣貌清秀俏麗，人品俊雅，嫉惡如仇。",
            "虬髯犯人": "這人滿臉虬髯，頭發長長的直垂至頸，衣衫破爛不堪，簡直如同荒山中的野人"
        },
        '幽冥山莊': {
            "野狗": "一只渾身臟兮兮的野狗。",
            "毒蛇": "當地特有的毒蛇，嘶嘶地發出警告，你最好不要靠近。",
            "樵夫": "你看到一個粗壯的大漢，身上穿著普通樵夫的衣服。",
            "鮑龍": "虬髯怒目的大漢。",
            "過之梗": "年約四五十歲，長眉黑髯，樣子十分剛正。",
            "翁四": "武功不弱，而且為人正義，素得俠名。",
            "屈奔雷": "行事於正邪之間，性格剛烈，脾氣古怪，不過從不作傷天害理之事，只是明目張膽的搶劫燒殺，這人可幹得多了；據說他武功很高，內功外功兼備，鐵斧也使得出神入化。",
            "伍湘雲": "一身彩衣，垂發如瀑，腰上挽了一個小花結，結上兩柄玲瓏的小劍，更顯得人嬌如花，容光照人。",
            "殷乘風": "身段頎長而略瘦，但眉宇之間，十分精明銳利，猶如瓊瑤玉樹，豐神英朗",
            "辛仇": "自幼殘肢斷臂，受人歧視，故苦練奇技，仇殺江湖，無人不畏之如神鬼也。",
            "辛殺": "一個風程仆仆的俠客。",
            "蔡玉丹": "家財萬貫，是絲綢商人，但仁俠異常，喜助人，義疏財，武功很高。",
            "辛十三娘": "這女魔頭似具有動物的本能護體色，如貼在樹上動也不動，便像一張葉子一般，如坐在地上動也不動，便像一顆巖石一般；在黑夜裏便像是夜色的一部分，在雪地上就變成了雪花，誰也認不出來。",
            "暗殺": "這是跟隨辛十三娘的殺手。",
            "巴司空": "他是大理國三公之一。一個又瘦又黑的漢子，但他的擅長輕功。",
            "追命": "腳力無雙，所以輕功也奇佳，追蹤術一流，嗜酒如命。",
            "艷無憂": "江湖中一大魔頭，年輕貌美，因她擅‘吸血功’，以別人之鮮血，保持她的青春與容貌。",
            "攝魂鬼殺": "這是跟隨艷無憂的殺手，武功頗為高深。",
            "柳激煙": "五湖九州、黑白兩道、十二大派都尊稱為“捕神”的六扇門第一把好手。",
            "龜敬淵": "一名鶉衣百結、滿臉黑須的老人，眼睛瞪得像銅錢一般大，粗眉大目，雖然比較矮，但十分粗壯，就像鐵罩一般，一雙粗手，也比常人粗大一二倍。這人身上並無兵器，但一身硬功，“鐵布衫”橫練，再加上“十三太保”與“童於功”，據說已有十一成的火候，不但刀劍不入，就算一座山塌下來，也未必把他壓得住！",
            "淩玉象": "銀眉白須，容貌十分清灌，身形頎長，常露慈藹之色，背插長劍",
            "慕容水雲": "一個白發斑斑，但臉色泛紅的老者，腰問一柄薄而利的緬刀，終日不離身，左右太陽穴高高鼓起，顯然內功已入化境。",
            "沈錯骨": "一個裝扮似道非道的老者，黑發長髯，態度冷傲，手中一把拂塵。",
            "金盛煌": "富甲一方，武功蓋世的“三十六手蜈蚣鞭”。",
            "冷血": "善劍法，性堅忍，他的劍法是沒有名堂的，他刺出一劍是一劍，快、準而狠，但都是沒招式名稱的。",
            "莊之洞": "腰間纏著椎鏈子，一副精明能幹的樣子。",
            "高山青": "高頭大馬，高山青拿著的是一條玉一般的桃木棍，棒身細滑，杖尖若刀，長七尺六寸。",
        },
        '花街': {
            "花劄敖": "魔宗長老，紫色瞳孔彰顯他天魔功法已經大成。",
            "尊信門殺手": "尊信門叛將帶領的殺手，個個心狠手辣。",
            "山赤嶽": "魔宗長老，使一對八角大錘。",
            "鷹飛": "魔宗後起高手，是魔宗的希望。",
            "由蚩敵": "蒙古兩大高手之一，擅用連環索。",
            "強望生": "火須紅發，蒙古兩大高手之一。",
            "莫意閑": "江湖黑道邪派高手之一，列名十大高手榜。",
            "甄素善": "黑道最富有誘惑力的女人，風情萬種。",
            "談應手": "黑道高手，十惡莊莊主，一方霸主。",
            "戚長征": "江湖中的後起之秀，新一代高手中最好的刀客，得左手刀封寒親傳。",
            "怒蛟高手": "這是黑道第一大幫-怒蛟幫的頂尖高手。",
            "韓柏": "陰差陽錯成為高手的小書童。",
            "烈震北": "黑道最負盛名的神醫，義氣幹雲。",
            "赤尊信": "尊信門門主，黑榜十大高手之一。",
            "乾羅": "山城門主，黑榜十大高手之一。",
            "厲若海": "黑道高手排名第三，也有人說他實力與浪翻雲相較也不差半分。",
            "浪翻雲": "黑榜之首，江湖第一大幫的核心人物。",
            "方夜羽": "「魔師」龐斑的關門弟子，有「小魔師」之稱，文秀之極，肌膚比少女還滑嫩，但身形頗高，肩寬膊闊，秀氣透出霸氣，造成一種予人文武雙全的感覺。",
            "封寒": "黑榜天下第二的高手，天下第一刀客。",
            "盈散花": "據說來自西域，擅長波斯舞，每日來觀舞之人絡繹不絕，雖耗費頗高，但據說觀舞可以領悟出武學攻擊招式的奧秘。",
            "薄昭如": "清雅十分，舞姿傾城，據說觀舞可領悟出防禦之道。",
            "寒碧翠": "優雅十分，舞姿傾城，據說觀舞可領悟出長生之道。",
        },
        '西涼城': {
            "響尾蛇": "一條帶有劇毒，尾環在禦敵時發出嗡嗡響的響尾蛇。",
            "官差": "這是西涼城衙門的一名官差，呆呆的不言不動，只是渾身顫抖。",
            "官兵": "西涼城的官兵，透著幾分疲憊。",
            "驛卒": "這是別的城市前來此處送信的驛卒，滿面塵土。",
            "苦力": "一個苦力打扮的漢子在這裏等人來雇用。",
            "瘋狗": "一只渾身臟兮兮的野狗，一雙眼睛正惡狠狠地瞪著你。",
            "捕快": "京城的捕快，自是與外地的不同。",
            "伍定遠": "黝黑的四方臉上一派威嚴，一望便知是這些官差的頭兒，衙門的捕頭。",
            "農民": "一個戴著鬥笠，正在辛勤勞作的農民。",
            "馬夫": "這是一個等候主人的馬夫，耐心地打掃著馬車。",
            "黑衣鏢師": "身著黑衣的鏢師，一看就是經驗豐富的老江湖。",
            "齊潤翔": "一名老者坐在鏢局大廳，須長及胸，生得一張紫膛臉，正是燕陵鏢局的總鏢頭齊潤翔。",
            "鏢師": "燕陵鏢局的年青鏢師，正在發呆。",
            "管家": "鐵劍山莊管家，約莫五十來歲。",
            "李鐵杉": "一名紅光滿面的高大老者。",
            "止觀大師": "一名白衣灰須的老僧，雙眼炯炯有神。",
            "慧清": "止觀大師的親傳弟子，灰色衣袍。",
            "屠淩心": "身材矮小，一張臉醜陋無比，滿是刀疤傷痕。",
            "昆侖殺手": "一個風程仆仆的俠客。",
            "醉漢": "一個喝得醉醺醺的年輕人。。。。。",
            "金淩霜": "六十來歲年紀，雙目神光湛然。",
            "錢淩異": "一名高瘦的漢子，眼神陰毒。",
            "齊伯川": "燕陵鏢局的少鏢頭，平日裏飛揚跋扈，現在卻是一副落魄樣子。",
        },
        '高昌迷宮': {
            "糟老頭子": "他滿頭白發，竟無一根是黑的，身材甚是高大，只是弓腰曲背，衰老已極",
            "阿曼": "貌美如花的哈薩克女子，蘇普的妻子。",
            "蘇普": "年輕俊朗的小夥子，虎背熊腰，是大漠第一勇士蘇魯克的兒子。",
            "太行刀手": "當地的刀功絕活大師，隨便放在江湖中都是個了不起的刀霸。",
            "陳達海": "一個身穿羊皮襖的高大漢子，虬髯滿腮，他腰間上左右各插著一柄精光閃亮的短劍。兩柄短劍的劍把一柄金色，一柄銀色。",
            "哈蔔拉姆": "鐵延部中精通「可蘭經」、最聰明最有學問的老人。",
            "天鈴鳥": "這鳥兒的歌聲像是天上的銀鈴。它只在晚上唱歌，白天睡覺。有人說，這是天上的星星掉下來之後變的。又有些哈薩克人說，這是草原上一個最美麗、最會唱歌的少女死了之後變的。她的情郎不愛她了，她傷心死的。",
            "牧民": "哈薩克牧民，正在做著晚餐。",
            "霍元龍": "虬髯大漢，身挎長刀，一臉兇神惡煞。",
            "惡狼": "一頭大灰狼，閃著尖利的牙齒。",
            "響尾蛇": "戈壁灘上的響尾蛇，你要小心了！",
            "駱駝": "行走於沙漠的商隊駱駝。",
            "男屍": "一具男屍，看身上的裝束似是中原武士。",
            "老翁": "身形瘦弱，形容枯槁，愁眉苦臉，身上穿的是漢人裝束，衣帽都已破爛不堪。但他頭發卷曲，卻又不大像漢人。",
            "李文秀": "身著哈薩克長袍的漢族少女，眉清目秀，貌美如花。有人說，她唱出的歌聲，便如同那天鈴鳥一般動人。",
            "蘇魯克": "哈薩克第一勇士，力大無窮。",
            "車爾庫": "哈薩克第二勇士，蘇魯克的好朋友。",
            "瓦耳拉齊": "白衣白袍的哈薩克高手，為李文秀所救。",
        },
        '京城': {
            "饑民": "天下災荒四起，流民失所，饑腸轆轆，只能上京城來乞食。",
            "武將": "京城武將，虎背熊腰，膽大心細。",
            "侯府小姐": "這是一個侯府的小姐，身著華麗，談吐優雅。",
            "小丫鬟": "一個笑嘻嘻的小丫頭，侯府的丫鬟，跟小姐顯是關系親密。",
            "娟兒": "青衣秀士徒弟，艷婷之師妹，對師傅師姐有極強的依賴心，情牽阿傻，然而阿傻恢復記憶後忘記與娟兒的一切經歷，離娟兒而去。",
            "九華山女弟子": "九華劍派的女弟子，身姿綽約，腰帶長劍。",
            "東廠侍衛": "東廠的鷹犬，怕是又在做什麽壞事",
            "城門官兵": "鎮守京城的官兵，銀盔銀甲，威風凜凜。",
            "柳昂天": "膽小的大將軍，赳赳武夫，官拜大都督，統領數十萬兵馬，卻是個怯懦政客。他表面是天下英雄的領袖和希望，然而卻一再屈從於強權，虛偽而懦弱。他不是殘害忠良之輩，但也不會為了公道正義損害自己的功名利祿；與奸臣鬥，並非因為伸張正義，而是因為自己也不好過。弱小者的沈默也許還能借口能力有限自身難保，然而處在這樣位高權重的位置，膽小卻是他千秋萬世的罪惡。",
            "柳府鐵衛": "柳府的私人衛隊。",
            "江充": "大奸臣，年約五十，十八省總按察，官拜太子太師。陰謀詭詐，多疑善變，是景泰王朝的第一權臣，與東廠劉敬、征北大都督柳昂天鼎足而立。為一宗多年塵封的舊案屢出天山，威勢所逼，終令朝廷要員棄官亡命，也讓許多江湖人物走投無路。一個沒有武功、沒有文才的矮胖小人，憑著三寸不爛之舌和掌控他人的心理，便能夠驅使天下英傑如驅使豬狗。所有禍端皆應他而起，縱你有神佛之能也要被他誣陷、算計。都說只因奸臣當道，所以才有天下英雄皆不得誌。然，哪朝沒有奸臣，何曾有過斷絕？當皇帝被蒙蔽、直言之人死於橫禍、天下黎民盡皆哀嚎的時候，為何朝堂之上鴉雀無聲；而元兇授首、挫骨揚灰之際，卻又為何如此人聲鼎沸、爭先恐後？其實，膽怯的我們都曾是小人的幫兇，在每個時代裏，扮演著每一個骯臟的龐然大物的吹鼓手。江充，便是所有沈默的天下人心裏開出的惡之花。",
            "莫淩山": "昆侖劍派高手之一，心狠手辣。",
            "昆侖弟子": "昆侖劍派的弟子，白衣長劍。",
            "安道京": "東廠大太監之一，功夫深不可測。",
            "東廠高手": "東廠高手，面目冷漠。",
            "郝震湘": "本是一方名捕，奈何受人冤枉入獄，為保家人性命不得已委身於錦衣衛旗下，滿面惆悵。",
            "錦衣衛": "本是朝廷衛士，卻已受東廠所轄。",
            "韋子壯": "武當弟子，現為侯府衛士統領，功力深厚。",
            "王府衛士": "善穆侯府的衛士，雙目炯炯有神，腰掛長刀。",
            "風流司郎中": "俊俏無比的當朝司郎中，風流倜儻，當朝大學士之子，也是少林天絕神僧關門弟子。",
            "伍崇卿": "伍定遠的義子，本為一流浪兒，伍定遠收養了他，並取名伍崇卿。武英帝復辟後為“義勇人”成員。後性情大變，怨伍定遠懦弱退縮。想用自己的方式保護伍定遠。曾在“魁星站五關”後蒙面黑衣獨自一人殺入太醫院，擊敗了包括蘇穎超、哲爾丹在內的眾多高手。",
            "蘇穎超": "武林四大宗師之一華山派掌門寧不凡嫡傳弟子，寧不凡退隱後，接任華山掌門，為武林新一代的俊傑。才貌雙全的蘇穎超，和「紫雲軒」少閣主瓊芳一見鐘情，可謂青梅竹馬。在太醫院中被黑衣人伍崇卿擊敗後，接著練劍遭遇瓶頸，背負上了沈重的心理包袱。",
            "店夥計": "一個酒樓的小夥計，十五六歲上下。",
            "學士": "一個在六部任職的學士，雖著便服，但氣度不凡。",
            "書生": "一個斯文的書生，穿著有些寒酸。",
            "打手": "賭坊打手，滿臉橫肉，手持大錘。",
            "藏六福": "青龍賭坊的老板，五十歲上下，腰間系著一塊絕世玉璧，眼睛裏閃著狡黠的光芒。",
            "胡媚兒": "絕美無比的性感尤物，她雖使毒厲害，但卻是一個極重情義之人。她認死理，為江充辦事，便是一心一意，縱然江充勢敗，也是全力為其尋找玉璽。後來遇見盧雲，兩人日久相處，產生愛意，更是願意為了盧雲犧牲自己的一切。後來在與盧雲返回自己家鄉的途中遭到“鎮國鐵衛”的追殺迫害，不得已成為“鎮國鐵衛”的一員，加入了“客棧”。",
            "荷官": "白虎賭坊的荷官，身姿曼妙，煙視媚行。",
            "雜貨販子": "一個賣雜貨的販子，你也許可以看看需要些什麽。",
            "苦力": "進城找活路的苦力，衣著隨便，滿身灰塵。",
            "掌櫃": "驛站的大掌櫃，眼神深邃。",
            "醉漢": "賭坊裏出來的醉漢，嘴裏嘟嘟囔囔些什麽，也許是一些賭坊的秘密。",
            "遊客": "來京城遊玩的外地人，對大城市的繁華目不暇接，滿眼都是驚喜的神色。",
            "顧倩兮": "出生揚州，其父乃景泰朝兵部尚書顧嗣源，未婚夫是景泰朝狀元盧雲，後因為盧雲掉入水瀑音訊全無，一邊撫養盧雲留下的小嬰兒楊神秀，一邊為父親被正統皇帝下獄的事而四處奔波，後因其父在獄中自殺，為繼承父親的誌向開辦書林齋，批判朝政，與正統皇帝針鋒相對。後嫁給佛國的創始人楊肅觀。正統十年，再遇盧雲。是典型的學識淵博，見識不凡的奇女子，當之無愧的揚州第一美女。",
            "王一通": "千萬個小人物中的一個，讀過書算過賬，沒有經世致用之才，沒有平定一方之力，匡扶天下他沒有這個誌氣，建功立業怕也沒有這個本事。老婆剛又生了個孩子，家裏卻又有債主上門，正急得如熱鍋上的螞蟻。",
            "貴婦": "城裏大戶人家的貴婦，正要上山拜佛還願。"
        },
        '越王劍宮': {
            "金衣劍士": "越國最頂尖的劍士，身著金衣，手持長劍。",
            "越王": "越王身披錦袍，形貌拙異，頭頸甚長，嘴尖如鳥，對你微微一笑，你卻覺得毛骨悚然。",
            "文種": "春秋末期著名的謀略家。越王勾踐的謀臣，和範蠡一起為勾踐最終打敗吳王夫差立下赫赫功勞。",
            "青衣劍士-極": "來自吳國的精英劍士，極度高傲自負。",
            "鑄劍師": "一個風程仆仆的俠客。",
            "薛燭": "",
            "青衣劍士-禦": "來自吳國的精英劍士，極度高傲自負。",
            "青衣劍士": "來自吳國的精英劍士，極度高傲自負。",
            "錦衣劍士": "越王劍宮的精英劍士，身佩長劍。",
            "西施": "施夷光，天下第一美女，世人稱為西施，尊稱其“西子“。越國苧蘿村浣紗女。她天生麗質、秀媚出眾。",
            "風胡子": "楚國鑄劍師，身著玄色短衫，歐冶子的二位弟子之一。",
            "範蠡": "越國當朝大夫，越王倚重的重臣。",
            "山狼": "歐余山中的霸主，山狼，比一般的野狼大一倍有余。",
            "采藥少女": "在山中采藥戶的小女孩，只有十二三歲，卻已能熟練地行走山間，采集藥材。",
            "山羊": "雪白的羊毛，在少女的馴服下，乖巧在吃草。",
            "青竹巨蟒": "青竹林中的巨型蟒蛇，通體翠綠，隱藏在竹林中，等待獵物自投羅網。",
            "牧羊少女": "這少女一張瓜子臉，睫長眼大，皮膚白晰，容貌甚是秀麗，身材苗條，弱質纖纖，手持一根長竹竿。",
            "白猿": "一頭巨大的白猿，若是見生人來了，一聲長嘯，躍上樹梢，接連幾個縱躍，已竄出數十丈外，但聽得嘯聲淒厲，漸漸遠去，山谷間猿嘯回聲，良久不絕。",
            "采藥人": "一個山中的采藥人，年紀近五十了。",
            "老奶奶": "一個拄著拐杖的老奶奶，似是在等著孫女回家。",
            "獵人": "山中的獵戶，正在尋覓今天的收獲。",
            "吳國暗探": "來自吳國的暗探，隱藏在山中，負責刺探劍宮內的消息。",
            "歐余刀客": "歐余山中隱藏的刀客，武功深不可測。",
            "山狼王": "歐余山中的霸主，山狼，比一般的野狼大一倍有余。",
            "毒蛇": "一條外表看起來十分花哨的蛇，毒性巨強。",
            "樵夫": "一個砍柴為生的樵夫。"
        },
        '江陵': {
            "茶葉販子": "來自外地的茶葉販子，來此收購也販賣茶葉。",
            "書生": "一個年紀輕輕的讀書人，拿著書本，搖頭晃腦。",
            "乞丐": "一個衣衫襤褸的乞丐，口中嘟囔著一些模糊的語句。",
            "婦人": "前來買米的婦人，手裏拿著米袋。",
            "米店夥計": "米店的小夥計，正忙的不可開交。",
            "米三江": "一個青衣小帽的中年商人，是米店的大掌櫃。",
            "花小倩": "一個二十出頭，笑容動人的少女，有人說她是城中最美麗的少女，每天都會收到不少求愛的信箋呢。",
            "巡城參將": "江陵巡城參將，身材高大，腳步沈穩。",
            "巡城府兵": "江陵總兵府的巡城士兵，手持長矛，腰別鋼刀。",
            "客棧小二": "手拿酒壺菜碟，腳步如飛，忙得不亦樂乎，擡頭看你一眼，飛快地給你指了個座位。",
            "酒保": "客棧的小酒保，年紀大約十來歲而已。",
            "江小酒": "客棧老板的女兒，一笑起來臉上就有兩個酒窩。",
            "江老板": "客棧的老板，身材不高，卻自有一番氣度。",
            "苦力": "一個衣衫襤褸的苦力，正在街角坐著等活兒上門。",
            "雷動山": "霹靂門兩湖分舵的舵主，太陽穴高高鼓起，顯然是有極深厚的內功。",
            "王鐵柱": "一個前來求藥的莊稼漢，看起來頗為著急。",
            "水掌櫃": "江陵府遠近幾百裏最出名的神醫，對藥材和醫理的理解出神入化。",
            "驛使": "一個遠方驛站來的信使，看起來頗為悠閑，應是沒有公務在身。",
            "江陵府衛": "江陵總兵府的衛士，身披軟甲，腰胯長刀。",
            "趟子手": "鏢局的趟子手，是鏢局最低級的打手。",
            "城門守衛": "江陵城的守衛士兵，鐵劍鐵甲。",
            "截道惡匪": "截道的惡匪，正惡狠狠地看著你。",
            "漕幫好手": "漕幫的好手，個個都是浪裏白條。",
            "揚子鱷": "兇狠的鱷魚，正不懷好意地盯著你。",
            "分身": "周長老的分身。",
            "蕭長河": "江陵鏢局總鏢頭，一身長衫，手握一對鋼珠，頗有威不可犯之風。",
            "脫不花馬": "大月氏遠道而來的最好的寶馬，可日行八百。",
            "周長老": "蕭長河相交三十多年的生死之交，也是鏢局日常事務最主要的負責人。",
            "余小魚": "豆蔻年華的小女孩，長得頗為清秀，正在熟練的整理著小食店，一副有條不紊成竹在胸的樣子。",
            "漁老": "念過半百的老人，精神很好，手中拿著一張漁網在仔細修復。",
            "醉漢": "一個醉醺醺的男人，嘴裏不知道嘟囔著什麽。",
            "黑衣人": "一個鬼鬼祟祟的黑衣人，腰間似乎藏著兵器。",
            "癩蛤蟆": "趴在城外泥路兩旁的沼澤地，正呱呱呱地叫著，真讓人心煩。",
            "霍無雙": "兩湖最好的手藝人，從他手裏出品的瓷器，白若瑞雪，清透如浮雲。",
            "金蓮": "玉泉酒坊老板的相好，眉目流媚，身姿誘人。",
            "邋遢男子": "一個醉醺醺的邋遢男子，正在對墻小便，你只想趕緊捂著鼻子走開。",
            "酒坊夥計": "酒坊的小夥計，忙得不可開交，瘦骨嶙峋。",
            "九叔": "酒坊現在的老板，身上一派珠光寶氣，卻有人說他是盜了哥哥的產業。",
            "蕭勁": "江陵府總兵，統管兩湖地界，手握數萬大軍。",
            "參將": "江陵總兵府的參將，都是蕭勁手下最得力的幹將。",
            "江陵府兵": "江陵府統禦下的士兵，一舉一動都有幹練之風，看起來頗為訓練得法。"
        }
    };

    //殺死 比試 對話 打探-------給予，物品，搜索此地待完成
    function kill_task(npcName) {
        //var shuchutishi=npcName;
        if (g_gmain.is_fighting) {
            return;//戰鬥中
        }
        var r = g_obj_map.get("msg_room");
        if (r) {
            for (var b = 1; r.get("npc" + b); b++) {
                var l = r.get("npc" + b).split(',');
                if (g_simul_efun.replaceControlCharBlank(l[1]) == npcName) {
                    clickButton('kill ' + l[0]);

                }
            }
        }
    }
    function fight_task(npcName) {
        if (g_gmain.is_fighting) {
            return -1;//戰鬥中
        }
        var r = g_obj_map.get("msg_room");
        if (r) {
            for (var b = 1; r.get("npc" + b); b++) {
                var l = r.get("npc" + b).split(',');
                if (g_simul_efun.replaceControlCharBlank(l[1]) == npcName) {
                    clickButton('fight ' + l[0]);

                }
            }
        }
    }
    function ask_task(npcName) {
        if (g_gmain.is_fighting) {
            return -1;//戰鬥中
        }
        var r = g_obj_map.get("msg_room");
        if (r) {
            for (var b = 1; r.get("npc" + b); b++) {
                var l = r.get("npc" + b).split(',');
                if (g_simul_efun.replaceControlCharBlank(l[1]) == npcName) {
                    clickButton('ask ' + l[0]);
                    return 1;
                }
            }
        }
    }
    function dt_task(npcName) {
        if (g_gmain.is_fighting) {
            return -1;//戰鬥中
        }
        var r = g_obj_map.get("msg_room");
        if (r) {
            for (var b = 1; r.get("npc" + b); b++) {
                var l = r.get("npc" + b).split(',');
                if (g_simul_efun.replaceControlCharBlank(l[1]) == npcName) {
                    clickButton('npc_datan ' + l[0]);
                }
            }
        }
    }
    function cmd_task(cmdName) {
        var r = g_obj_map.get("msg_room");
        if (r) {
            for (var i = 1; r.get('cmd' + i); i++) {
                if (ys_replace(r.get('cmd' + i + '_name')).indexOf(cmdName) != -1) {
                    go(r.get('cmd' + i));
                    return 1;
                }
            }
        }
    }

    var isDelayCmd = 1, // 是否延遲命令
        cmdCache = [],      // 命令池
        timeCmd = null,     // 定時器句柄
        cmdDelayTime = 400; // 命令延遲時間

    var bixueSwitch = false;
    var bishouSwitch = false;

    //var hitKeys = "你一不留神|你已是血|你急|你難抗|縱使你|對準你|攻至你|抓破你|貫穿你|你面對|你已是|你只覺|罩了你|向了你|將你吞沒|將你逼得|完全將你|瞬間將你|將你周身|在你眼前|打中你|落在你|在你右|按在你|擊在你|往你|往而你|向身下的你|在了你|只在你|由你|射你|搗你|掃你|過你|拍你|點你|劈你|取你|向你|像你|奔你|著你|斬你|撲你|朝你|擊你|打你|刺你|你急急|要你|扣你|令你|指你|沖你|渡你|卷你|由你|於你|氣空力盡的你|你竭力破解|你擋無可擋|你無法分辨|你眼花瞭亂|你愕然間|你生命之火|你根本無法看清|你大驚失色|你被震|起首式|平平一劍|大超從前|四面八方響起|將周圍生靈|順刺|倒刺".split("|");
    var hitKeys = ["你如", "教你", "向你", "點你", "指你", "你只覺", "你為", "往你", "割向你", "你反應", "青城", "大嵩陽", "裹向你", "你的對攻無法擊破", "推向你", "倒刺", "擊向你",
        "準你", "你的姿態", "奔你", "渡你", "取你", "朝你", "刺你", "擊你", "你面對", "你根本", "抓向你", "劈下", "砍向你", "扣你", "並力", "你這一招", "吹向你",
        "到你", "至你", "你被", "卷你", "將你", "了你", "於你", "你再", "你已是", "你已是", "雙目內視",
        "你愕然", "掃你", "從你", "你的招式盡", "削你", "撲你", "取你", "令你",
        "單手舞動，單刀離背而出", "沖你", "你一時", "落在你", "拍你", "切你", "斬你",
        "砍你", "砸你", "趁你", "封你", "待你", "在你", "與你", "劈你", "然你",
        "你正搜尋", "你發現時", "你猶如", "襲你", "使你", "你受困", "你在極端",
        "鉆你", "你未被擊中卻亦是身受", "你避無可避", "你分身乏術", "算你", "你被滾滾",
        "哪怕你", "你唯有", "你瞬不及", "你步步陷危", "你頓時", "你已呈九死", "鎖你", "你觀之",
        "中你", "只見你", "你受此浩勁", "你急急而擋", "你神識早已", "你縱使", "你難抗",
        "瞬間你已是", "你愕然", "使你", "你躲閃不及", "逼近你", "你宛如一葉", "你抵禦不住",
        "你自感", "縱是你", "搗你", "你唯有", "你頹然", "你擋無可擋", "你心頭一痛", "盡的你",
        "你當場受創", "你臉露懼", "管你"];
    var ignoreList = ['你招式之間組合', '將你的力道卸去大半', '你這幾招配合起來', '你將招式連成'];

    var Jianshi = { jianghu: 0, showcode: 0, longxiang: 0, xuanyun: 0, wk: 0, sl: 0, zha: 0, xs: 0, dr: 0, chonglian: 0, qianlong: 0, tianjian: 0, jstimer: 0, qingzhengxie: 0, bangzhan: 0, bx: 0, bs: 0, sp: 0, sys: 1, renwu: 0, zhengxie: 0, teshu: 0, tf: 0, yx: 0, gw: 0, hd: 0, qx: 0, qxmj: 0, qxhg: 0, gensha: 0 };

    function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    }
    //加入屏幕提示
    function InforOutFunc(text, goLink, type) {
        var node = document.createElement("span");
        node.className = "out2";
        node.style = "color:rgb(255, 127, 0)";
        if (goLink) {
            var anode = document.createElement("a");
            anode.style = "text-decoration:underline;color:yellow";
            anode.setAttribute("onClick", 'go("' + goLink + '")');
            if (type) {
                anode.appendChild(document.createTextNode(text));
            } else {
                anode.appendChild(document.createTextNode(text + ':' + goLink));
            }
            node.appendChild(anode);
        } else {
            var textnode = document.createTextNode(text);
            node.appendChild(textnode);
        }
        document.getElementById("out2").appendChild(node);
    }

    //加入屏幕提示
    function InforOutFuncClick(text, click) {
        var node = document.createElement("span");
        node.className = "out2";
        node.style = "color:rgb(255, 127, 0)";
        if (click) {
            var anode = document.createElement("a");
            anode.style = "text-decoration:underline;color:yellow";
            anode.setAttribute("onClick", '' + click + '');
            anode.appendChild(document.createTextNode(text));
            node.appendChild(anode);
        } else {
            var textnode = document.createTextNode(text);
            node.appendChild(textnode);
        }
        document.getElementById("out2").appendChild(node);
    };

    async function clickButtonAsync(s) {
        clickButton(s);
        await new Promise(function (resolve) {
            setTimeout(resolve, 400);
        });
    };

    var Base = {
        init: function () {
            this.skills();
            this.btnArrSet();
            this.writeBtn();
        },
        qi: 6,
        buttonWidth: '80px',
        buttonHeight: '20px',
        currentPos: 60,
        delta: 30,
        timeInter: 250,
        pozhaoNum: '1',
        DrunkMan_targetName: 'luoyang_luoyang26',
        correctQu: function () {

            var url = window.location.href;
            var qu = null;
            if (url.indexOf('direct37') != '-1') {
                qu = 37;
            }
            if (url.indexOf('direct38') != '-1') {
                qu = 38;
            }
            if (getQueryString('area') == '1') {
                qu = 1;
            }
            if (getQueryString('area') == '37') {
                qu = 37;
            }
            if (getQueryString('area') == '38') {
                qu = 38;
            }
            return qu;
        },
        getCorrectText: function (txt) {
            var url = window.location.href;
            var correctSwitch = false;
            if (url.indexOf(txt) != '-1') {
                correctSwitch = true;
            }
            return correctSwitch;
        },
        tianjianTarget: '',
        mySkillLists: useSkills,
        skills: function () {
            // 38區laodap123
            if (this.getCorrectText('4316804') && this.correctQu() == '38') {
                this.mySkillLists = '四海斷潮斬；覆雨劍法；六脈神劍';
            }
            // 37區東方紅
            if (this.getCorrectText('4253282')) {
                this.mySkillLists = '月夜鬼蕭；無劍之劍；同歸絕劍；步玄七訣';
            }
            // 王有財
            if (this.getCorrectText('4219507')) {
                this.mySkillLists = '月夜鬼蕭；冰月破魔槍；九溪斷月槍';
            }
            // 火狼
            if (this.getCorrectText('4238943')) {
                this.mySkillLists = '月夜鬼蕭；冰月破魔槍；九溪斷月槍';
            }
            // 跟班
            if (this.getCorrectText('7030223')) {
                this.mySkillLists = '月夜鬼蕭；冰月破魔槍；九溪斷月槍';
            }
        },
        btnArrSet: function () {
            var btnGroupArr = btnGroup;

            for (var i = 0; i < btnOtherGroup.length; i++) {
                btnGroupArr.push(btnOtherGroup[i]);
            }
            // if (isQianlongId()) {
            // for (var i = 0; i < qianLongGroup.length; i++) {
            //     btnGroupArr.push(qianLongGroup[i]);
            // }
            // }
            //jianghuGroup
            for (var i = 0; i < jianghuGroup.length; i++) {
                btnGroupArr.push(jianghuGroup[i]);
            }
            //vip
            // if (isVip()) {
            for (var i = 0; i < btnVipGroup.length; i++) {
                btnGroupArr.push(btnVipGroup[i]);
            }
            // } else {
            // for (var i = 0; i < btnMoreGroup.length; i++) {
            //     btnGroupArr.push(btnMoreGroup[i]);
            // }
            // }
            if (isLittleId()) {
                for (var i = 0; i < btnMoreGroup.length; i++) {
                    btnGroupArr.push(btnMoreGroup[i]);
                }
            }
            if (isSelfId()) {
                for (var i = 0; i < btnSelfGroup.length; i++) {
                    btnGroupArr.push(btnSelfGroup[i]);
                }
            }

            for (var i = 0; i < btnWuYongGroup.length; i++) {
                btnGroupArr.push(btnWuYongGroup[i]);
            }

            this.btnArr = btnGroupArr;
        },
        btnArr: [],
        writeBtn: function () {
            var btnArr = this.btnArr;
            for (var i = 0; i < btnArr.length; i++) {
                var rightPos = 0;
                if (i > 18) {
                    // rightPos = '360';
                    rightPos = '90';
                }
                if (i > 37) {
                    // rightPos = '450';
                    rightPos = '180';
                }
                if (i == 19) {
                    this.currentPos = 60;
                }
                if (i == 38) {
                    this.currentPos = 60;
                }
                var btnName = 'btn' + i;
                btnName = document.createElement('button');
                btnName.innerText = btnArr[i].name;
                btnName.style.width = this.buttonWidth;
                btnName.style.height = this.buttonHeight;
                btnName.style.position = 'absolute';
                btnName.style.zIndex = '10';
                btnName.style.right = rightPos + 'px';
                btnName.id = 'btn' + btnArr[i].id;
                btnName.className = 'btn-add btn-base';
                btnName.style.top = this.currentPos + 'px';
                this.currentPos = this.currentPos + this.delta;
                document.body.appendChild(btnName);
                // document.body.appendChild(btnName);
                if (btnArr[i].function) {
                    btnName.addEventListener('click', btnArr[i].function)
                }
            }
        }
    };

    var timeInter = Base.timeInter;
    var jhxh_Interval = null;
    function jhxh_Func(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '江湖懸紅') {
            Dom.html('停止懸紅');
            Jianshi.xuanhong = 1;
            Jianshi.xhnpc = [];
            go('jh 1;w;event_1_40923067;');
            jhxh_Interval = setInterval(function () {
                for (var i = 0; i < Jianshi.xhnpc.length; i++) {
                    if (ask_task(Jianshi.xhnpc[i]) == 1) {
                        Jianshi.xhnpc.splice(i, 1);
                    }
                }
            }, 300);
        } else {
            Jianshi.xuanhong = 0;
            clearInterval(jhxh_Interval);
            Dom.html('江湖懸紅');
        }
    }
    var buttonhiden = 0;
    var buttonhideButton = document.createElement("button");
    buttonhideButton.innerText = "";
    buttonhideButton.style.position = "absolute";
    buttonhideButton.style.left = "50px";
    buttonhideButton.style.top = "0px";
    buttonhideButton.style.width = "120px";
    buttonhideButton.style.height = "30px";
    buttonhideButton.style.backgroundColor = "transparent";
    buttonhideButton.style.border = "none";
    document.body.appendChild(buttonhideButton);
    buttonhideButton.addEventListener("click", buttonhideFunc);
    function buttonhideFunc() {
        if (buttonhiden == 0) {
            buttonhiden = 1;
            hideButton()
        } else {
            buttonhiden = 0;
            showButton()
        }
    }
    function hideButton() {
        $('.btn-add').hide();
        $('.btn-others').hide();
        $('.btn-place').hide();
        $('.btn-base').hide();
        showBtnSwitch = 0;
    }
    function showButton() {
        $('#btn0').html('顯示按鍵0');
        $('.btn-add').show();
        $('.btn-others').hide();
        $('.btn-place').hide();
        $('.btn-base').each(function (i) {
            if (i > 1) {
                $(this).hide();
            }
        });
        $('.btn-searchWay').show();
        $('#btn-chuzhao').hide();
        showBtnSwitch = 1
    }
    var showBtnSwitch = 0;
    function hideShowBtn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (showBtnSwitch == 0) {
            Dom.html('顯示按鍵0');
            $('.btn-add').show();
            $('.btn-others').hide();
            $('.btn-place').hide();
            $('.btn-base').each(function (i) {
                if (i > 1) {
                    $(this).hide();
                }
            });
            $('.btn-searchWay').show();
            // $('#btn-chuzhao').hide();
            showBtnSwitch = 1
        } else if (showBtnSwitch == 1) {
            Dom.html('顯示按鍵1');
            $('.btn-add').show();
            $('.btn-others').hide();
            $('.btn-place').hide();
            $('.btn-base').each(function (i) {
                if (i > 18) {
                    $(this).hide();
                }
            });
            $('.btn-searchWay').show();
            showBtnSwitch = 2
        } else if (showBtnSwitch == 2) {
            Dom.html('顯示按鍵2');
            $('.btn-base').show();
            $('.btn-others').show();
            $('.btn-place').hide();
            $('#btn-chuzhao').show();
            $('.btn-ql-place').hide();
            showBtnSwitch = 3
        } else if (showBtnSwitch == 3) {
            Dom.html('隱藏按鍵');
            $('.btn-searchWay').show();
            // $('.btn-add').hide();
            $('.btn-base').each(function (i) {
                if (i > 18) {
                    $(this).hide();
                }
            });
            $('.btn-ql-place').show();
            $('.btn-place').show();
            showBtnSwitch = 0
        }
    }
    var AutoPaiHangFuncIntervalFunc = null;
    function PaiHangFunc(e) {
        var Dom = $(e);
        var DomTxt = Dom.html();
        if (DomTxt == '打榜') {
            Dom.html('停打榜');
            clickButton('sort');
            clickButton('fight_hero 1');
            AutoPaiHangFunc();
        } else {
            Dom.html('打榜');
            clearPaiHang();
        }
    }

    function AutoPaiHangFunc() {
        // 間隔1500毫秒查找打一次
        AutoPaiHangFuncIntervalFunc = setInterval(AutoPaiHang, 500);
    }
    function clearPaiHang() {
        clearInterval(AutoPaiHangFuncIntervalFunc);
        AutoPaiHangFuncIntervalFunc = null;
    }
    function AutoPaiHang() {
        if ($('span.outbig_text:contains(戰鬥結束)').length > 0) {
            isOnstep1 = false;
            go('golook_room');
            clickButton('fight_hero 1');
        }
        else if (isContains($('span:contains(今日挑戰)').text().slice(-19), '今日挑戰高手的次數已達上限，明日再來。')) {
            clearPaiHang();
            $('#btn-hitBang').html('打榜');
            clickButton('home');
            console.log('打完收工！');
        }
    }

    function buyLicai() {
        //clickButton('touzi_jihua2 buy 6', 1);
        // clickButton('tzjh_lq', 1)
        go('jh 2;n;n;n;n;n;n;n;e;touzi_jihua2 buygo 6;tzjh_lq;home');
    };
    //Base.mySkillLists = '萬流歸一；雲夢歸月；天魔妙舞';
    // Base.skills();
    /* 更換技能方法 :start */
    async function interServerFn1(e) {
        var skillsText = '萬流歸一；雲夢歸月；天魔妙舞；步玄七訣';
        if (followTeamSwitch) {
            skillsText = '霹靂彈';
        }
        var skills = prompt("請輸入要使用的技能", skillsText);
        if (skills) {
            Base.mySkillLists = skills;
            if (followTeamSwitch) {
                Base.qi = 6;
            }
            if (skills.indexOf('萬流歸一') > -1) {
                Base.qi = 5;
            }
        } else {
            Base.skills();
            Base.qi = 3;
        }
    };
    /* 更換技能方法 :end */

    function changeTianJianTarget(e) {
        var targetText = '天劍谷衛士';

        var targetsPro = prompt("請更改天劍目標", targetText);
        if (targetsPro) {
            Base.tianjianTarget = targetsPro;
        } else {
            Base.tianjianTarget = '';
        }
    }
    function teamSay(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '隊長說話') {
            go1('cus|leader|1');
            Dom.html('停止說話');
        } else {
            go1('cus|leader|0');
            Dom.html('隊長說話');
        }
    }
    function bindClickEvent() {
        $(document).on('click', '.cmd_click2', function () {
            var clickText = $(this).attr('onclick');
            if (Jianshi.showcode) {
                log(clickText);
            }
        });
        $(document).on('click', '.cmd_click3', function () {
            var clickText = $(this).attr('onclick');
            if (Jianshi.showcode) {
                log(clickText);
            }
        });
        $(document).on('click', "button[class^='cmd_click_exits']", function () {
            var clickText = $(this).attr('onclick');
            if (Jianshi.showcode) {
                log(clickText);
            }
        });
    }
    var followTeamSwitch = 0;
    function followTeam(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '跟隊長走') {
            Dom.html('不跟走');
            followTeamSwitch = 1;
            clickButton("team");
            setTimeout(() => {
                var team_msg = g_obj_map.get("msg_team");
                if (team_msg) {
                    var team_elements = team_msg.elements;
                    for (var i = 0; i < team_elements.length; i++) {
                        if (team_elements[i].key.indexOf('member1') >= 0) {
                            var name = team_elements[i].value.split(',')[1];
                            followuser.userName = name;
                            go1('cus|follow|' + name);
                        }
                    }
                }
                // var name = g_obj_map.get("msg_user").get("name").replace(/^\[.*★\[2;37;0m/, ""); // 獲取隊長名稱
                // go1('cus|follow|'+ name);
            }, 2000);
        } else {
            Dom.html('跟隊長走');
            followTeamSwitch = 0;
            go1('cus|follow|');
        }
    }
    var qianlongNumber = 0;
    function JianQianlong(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '監視潛龍') {
            // qianlongNumber = prompt("請輸入要序號", qianlongNumber);
            Dom.html('不監視');
            Jianshi.qianlong = 1;
            isOnstep1 = false;
            setCookie(window.userId + 'qljs', '1')
        } else {
            Dom.html('監視潛龍');
            Jianshi.qianlong = 0;
            setCookie(window.userId + 'qljs', '0')
        }
    }
    function JianJianghu(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '監視江湖') {
            Dom.html('不打江湖');
            Jianshi.jianghu = 1;
            my_family_name = g_obj_map.get("msg_attrs").get("family_name");
            // my_family_name = prompt("請輸入您的門派或釋、道、儒", family_name);

            log('我的門派：' + my_family_name);

            var family_type = returnRuShiType();
            if (family_type) {
                var family_type_text = '我的入室：' + family_type;
                log(family_type_text);
            } else {
                family_type = '';
            }
            var word = family_type ? '，入室：' + family_type : '';

            g_gmain.notify_fail(HIG + "開始監聽江湖門派：" + my_family_name + word + NOR);
            setCookie(window.userId + 'jianghu', '1')
        } else {
            Dom.html('監視江湖');
            Jianshi.jianghu = 0;
            setCookie(window.userId + 'jianghu', '0')
        }
    }
    function openBiXue(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '開鼻血') {
            Dom.html('關鼻血');
            Jianshi.bx = 1;
        } else {
            Dom.html('開鼻血');
            Jianshi.bx = 0;
        }
    }
    function openBaiShou(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '開白首') {
            Dom.html('關白首');
            Jianshi.bs = 1;
        } else {
            Dom.html('開白首');
            Jianshi.bs = 0;
        }
    }
    function killThreeFloor(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '打三樓') {
            Dom.html('不打三樓');
            Jianshi.sl = 1;
            waitKillThreeFloor();
        } else {
            Dom.html('打三樓');
            Jianshi.sl = 0;
        }
    }
    // 循環查看擊殺NPC
    function waitKillThreeFloor() {
        setTimeout(() => {
            var careNpc = ['分身'];
            for (var i = 0; i < careNpc.length; i++) {
                var hasNpc = hasSamePerson(careNpc[i]);
                // console.log(hasNpc);
                if (hasNpc.length > 0 && hasNpc.length <= 4) {
                    var npcId = hasNpc[0][0];
                    if (npcId) {
                        Base.mySkillLists = '萬流歸一；雲夢歸月；天魔妙舞';
                        clickButton('kill ' + npcId);
                    }
                }
            }
            if (Jianshi.sl) {
                waitKillThreeFloor();
            }
        }, 1000);
    }
    var isDoneXueShan = false;
    // 雪山弟子
    function killXue(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '打雪山') {
            if (isDoneXueShan) {
                return false;
            }
            Dom.html('不打雪山');
            Jianshi.xs = 1;
            waitKillXueShan();
            setCookie(window.userId + 'xsdz', '1')
            // dunXueShan();
        } else {
            Dom.html('打雪山');
            Jianshi.xs = 0;
            setCookie(window.userId + 'xsdz', '0')
        }
    }
    function openXueShan() {
        var dom = $('#btns5');
        if (dom.html() == '打雪山') {
            dom.trigger('click');
        }
    }
    function closeXueShan() {
        var dom = $('#btns5');
        if (dom.html() == '不打雪山') {
            dom.trigger('click');
        }
    }
    // 移除色彩符號
    function removeChart(text) {
        var txt = g_simul_efun.replaceControlCharBlank(
            text.replace(/\u0003.*?\u0003/g, "")
        );
        return txt;
    }
    //根據幫派信息 去相應地址
    var isGone = false;
    function goCorrectBingXue(msg) {

        if (g_gmain.is_fighting) {
            return;//戰鬥中
        }
        msg = removeChart(msg);
        //name    g_obj_map.get('msg_room').get('map_id')
        var splitMsg = msg.split('-');
        var place = splitMsg[1].replace(/\n/g, "");
        var name = splitMsg[0].split('位於')[1].replace(/\n/g, "");

        renturnObj = place;
        switch (name) {
            case 'snow':
                goWay = 'jh 1;e;e;s;ne;ne';
                break;
            case 'yangzhou':
                goWay = 'jh 5;n;n;n;n;n;e;n;e;n;w;n;n';
                break;
            case 'emei':
                goWay = 'jh 8;w;nw;n;n;n;n;e;e;n;n;e;n;n;n;n;w;n;n;n;n;n;n;n;n;n;nw;nw;n;n';
                break;
            case 'shaolin':
                goWay = 'jh 13;n;n;n;n;n;n;n;n;n;n';
                //立雪亭
                break;
            case 'mingjiao':
                goWay = 'jh 18;n;nw;n;n;n;n;n;ne;n;n;n;n;n;e;e;se;se;e';
                break;
            case 'heilongtan':
                goWay = 'jh 24;n;n;n;n;n;n;n;n;w;n;n';
                break;
            case 'xingxiu':
                goWay = 'jh 28;n;w;w;w;w;w;w;nw;ne;nw;ne;nw;ne;nw;ne;nw;ne;nw;ne;e';
                break;
            case 'resort':
                goWay = 'jh 31;n;n;n;w;w;w;w;n;n;n';
            case 'binghuo':
                if (place == '冰湖') {
                    goWay = 'jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;e';
                }
                if (place == '雪山峰頂') {
                    goWay = 'jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;ne;n';
                }
                if (place == '雪原溫泉') {
                    goWay = 'jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w';
                }
                break;
            case 'jueqinggu':
                goWay = 'jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne';
                break;
            case 'yanyuecheng':
                if (place == '黑巖溪') {
                    goWay = 'jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;sw';
                }
                if (place == '朝暮閣') {
                    goWay = 'jh 43;w;n;n;n;ne;nw;nw;ne';
                }
                break;
        }
        if (!place || !goWay) {
            return false;
        }

        InforOutFunc(place, goWay);

        if (!Jianshi.xs) {
            return;
        }
        if (isDoneXueShan) {
            return;
        }
        if (isGone) {
            return;
        }
        if (hasPerson().length > 0) {
            return false;
        }

        dunXueShan(goWay, place, 'go');
        isGone = true;

        setTimeout(function () {
            isGone = false;
        }, 15 * 1000);
    }
    var renturnObj = '碧水寒潭';
    var goWay = hairsfalling['雪山']['明教活動'];
    /*
    var renturnObj = '石亭';
    var goWay = hairsfalling['雪山']['泰山活動'];
    var renturnObj = '碧水寒潭';
    var goWay = hairsfalling['雪山']['明教活動'];
    */
    // 蹲守雪山
    function dunXueShan(way, place, type) {

        if (hasPerson().length > 0) {
            return false;
        }

        var msg_room = g_obj_map.get("msg_room");
        if (msg_room) {
            if (place) {
                if (type) {
                    go(way)
                }
            } else {
                if (msg_room.get("short") != renturnObj) {
                    go(goWay)
                }
            }

        } else {
            if (way) {
                go(way)
            } else {
                go(goWay)
            }
        }
        if (place) {
            goInLine('去' + place + '殺雪山弟子了');
        }
    }
    //獲取當前地圖npcArr
    function getNpcArr() {
        var npcArr = [];
        var roomMsg = g_obj_map.get("msg_room");
        if (roomMsg) {
            var els = roomMsg.elements;
            for (var i = els.length - 1; i >= 0; i--) {
                if (els[i].key.indexOf("npc") > -1) {
                    npcArr.push(els[i].value);
                }
            }
        }
        return npcArr
    }
    // 判斷當前地圖中存在的Npc
    function hasSamePerson(name) {
        var npcList = getNpcArr();
        var personArr = [];
        for (var j = 0; j < npcList.length; j++) {
            var t = npcList[j].split(',');
            if (t[1].indexOf(name) > -1) {
                personArr.push(t);
            }
        }
        return personArr;
    }
    // 判斷當前地圖中存在的Npc
    function hasPerson() {
        var npcList = getNpcArr();
        var xueShanName = ['白衣神', '白自在'];
        var personArr = [];
        var hours = getHours();
        // if (hours > 9 && hours < 20) {
        //     // if (window.location.hostname.indexOf('laiwanqu') >-1){
        //     //     xueShanName = ['白衣神', '白自在', '老農夫'];
        //     // }else{
        //         xueShanName = ['白衣神'];
        //     // }
        // }
        for (var j = 0; j < npcList.length; j++) {
            var t = npcList[j].split(',');
            for (var i = 0; i < xueShanName.length; i++) {
                if (t[1].indexOf(xueShanName[i]) > -1) {
                    personArr.push(t);
                }
            }
        }
        return personArr;
    }
    var xueshanTime = 0;
    var waitIntervaltimer = null;

    // 根據"10分10秒"獲取時間
    function getSecond(time) {
        var newtime = 0;
        var timeArr = time.match(/\d+/g);
        newtime = parseInt(timeArr[0]) * 60 + parseInt(timeArr[1]);
        return newtime
    }

    // 根據剩余時間擊殺NPC
    function waitKillNpc(id) {
        var npcMsg = g_obj_map.get("msg_npc");
        var time = null;
        if (npcMsg) {
            var txt = g_obj_map.get("msg_npc").get("long");
            var txtArr = txt.split('\n');
            for (var i = 0; i < txtArr.length; i++) {
                if (txtArr[i].indexOf('剩余時間') >= 0) {
                    var newText = removeChart(txtArr[i]);
                    time = newText.split('剩余時間：')[1];
                    if (getSecond(time) < 5) {
                        console.log('擊殺倒計時:' + time);
                        Base.mySkillLists = '萬流歸一；雲夢歸月；天魔妙舞';
                        clickButton('kill ' + id);
                    }
                }
                if (txtArr[i].indexOf('正與') >= 0) {
                    var newText = removeChart(txtArr[i]);
                    var nameText = newText.split('正與')[1].split('激烈戰鬥')[0];
                    if (nameText.indexOf('風雨也') >= 0 || nameText.indexOf('驚喜隊長') >= 0 || nameText.indexOf('大英雄') >= 0 || nameText.indexOf('雪織雲') >= 0 || nameText.indexOf('風小皮') >= 0 || nameText.indexOf('李尋花') >= 0 || nameText.indexOf('摩訶王') >= 0 || nameText.indexOf('無頭') >= 0 || nameText.indexOf('小飛') >= 0 || nameText.indexOf('阿牛') >= 0) {
                        console.log('跟大佬殺');
                        Base.mySkillLists = '萬流歸一；雲夢歸月；天魔妙舞';
                        clickButton('kill ' + id);
                    }
                }
            }
        } else {
            time = null;
        }
    }
    // 循環查看擊殺NPC
    function waitKillXueShan() {
        setTimeout(() => {
            var careNpc = ['白衣神', '白自在'];
            if (!g_gmain.is_fighting) {
                for (var i = 0; i < careNpc.length; i++) {
                    var hasNpc = hasSamePerson(careNpc[i]);
                    if (hasNpc.length > 0) {
                        for (var j = 0; j < hasNpc.length; j++) {
                            var npcId = hasNpc[j][0];
                            if (npcId) {
                                clickButton('look_npc ' + npcId);
                                waitKillNpc(npcId);
                            }
                        }
                    }
                }
            }
            if (Jianshi.xs) {
                waitKillXueShan();
            }
        }, 1000);
    }
    // 定時殺雪山
    function waitKillXueShan1() {
        var post_list = hasPerson();
        if (waitIntervaltimer) clearTimeout(waitIntervaltimer);
        waitIntervaltimer = setTimeout(function () {
            if (g_gmain.is_fighting) {
                console.log('戰鬥中...重新定時');
            } else if (post_list.length > 0) {
                if (xueshanTime) {
                    var killtext = 'kill ' + post_list[0][0];
                    // 29分後開殺
                    if (new Date().getTime() > xueshanTime) {
                        Base.mySkillLists = '萬流歸一；雲夢歸月；天魔妙舞';
                        clickButton(killtext);
                        console.log('已過29.5分-開殺' + killtext);
                    }
                } else {
                    xueshanTime = new Date().getTime() * 1 + 29.5 * 60 * 1000;
                }
            } else {
                xueshanTime = 0;
            }
            if (Jianshi.xs) {
                waitKillXueShan();
            }
        }, 1000);
    }
    // 雪山弟子發現時間設置
    function setKillXueTime() {
        var timerText = getDate();
        var timer = prompt("請輸入叫殺雪山弟子的時間", timerText);
        if (timer) {
            xueshanTime = new Date(timer).getTime();
        }
    }
    function getDate(startType) {
        var d = new Date();
        var year = d.getFullYear();
        var month = getHandledValue(d.getMonth() + 1);
        var date = getHandledValue(d.getDate());
        var hours = getHandledValue(d.getHours());
        var minutes = getHandledValue(d.getMinutes());
        var second = getHandledValue(d.getSeconds());
        var resStr = '';
        if (startType === 'year') {
            resStr = year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + second;
        }
        else if (startType === 'date') {
            resStr = year + '/' + month + '/' + date;
        } else {
            resStr = year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + second;
        }
        return resStr;
    }
    function getHandledValue(num) {
        return num < 10 ? '0' + num : num
    }
    // 更換代碼
    var daimaInterval = null;
    var daimaText = 'ask tianlongsi_chaishao';
    function doDaiMa(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '代碼定時') {
            var daima = prompt("請輸入要代碼", daimaText);
            if (daima) {
                daimaText = daima;
                if (daima.indexOf('|') > 0) {
                    var nums = daima.split('|')[1] || 1;
                    for (var i = 0; i < nums; i++) {
                        go(daima)
                    }
                } else {
                    daimaInterval = setInterval(function () {
                        go(daima)
                    }, 500)
                }
                Dom.html('停止代碼');
            }
        } else {
            Dom.html('代碼定時');
            clearInterval(daimaInterval);
        }
    }
    /* 更換奇俠 方法 :start */
    var QiXiaIndex = 0;
    function changeQiXiaName() {
        var qixiaText = qixiaObj.name;

        var qixiaName = prompt("請輸入要比試的奇俠名字", qixiaText);
        if (qixiaName) {
            for (var i = 0; i < QixiaInfoList.length; i++) {
                if (QixiaInfoList[i].name == qixiaName) {
                    qixiaObj = QixiaInfoList[i];
                }
            }
        }
    }
    /* 更換奇俠 方法 :end */
    function beforeFightTongren(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '戰鬥裝備') {
            Dom.html('悟性裝備');
            // clickButton("enable unmap_all");
            // clickButton("auto_equip off");
            overrideclick('auto_equip on');       // 一鍵裝備
            overrideclick('unwield weapon_sb_sword11');   // 脫11級劍
            overrideclick('unwield weapon_sb_sword12');   // 脫12級劍
            overrideclick('unwield weapon_sb_whip12');    // 脫12級鞭
            overrideclick('unwield weapon_sb_throwing12');   // 脫12級暗
            overrideclick('unwield weapon_sb_stick11');   // 脫11級棍
            overrideclick('unwield weapon_sb_spear11');   // 脫11級槍
            overrideclick('unwield weapon_sb_stick12');   // 脫12級棍
            overrideclick('unwield weapon_sb_staff12');   // 脫12級杖
            overrideclick('unwield weapon_sb_spear12');   // 脫12級槍
            overrideclick('unwield weapon_sb_throwing12');   // 脫12級暗
            overrideclick('unwield weapon_sb_unarmed12');   // 脫12級拳
            overrideclick('unwield longwulianmoge_mojianlianhun');	//脫本3劍
            overrideclick('wield tianlongsi_sb_libiegou');	//裝離別鉤
            overrideclick('wield weapon_sb_spear11');   // 裝11級槍
            overrideclick('wield weapon_sb_stick11');   // 裝11級棍
            overrideclick('wield weapon_sb_spear12');   // 裝12級槍
            overrideclick('wield weapon_sb_stick12');   // 裝12級棍
            overrideclick('wield weapon_sb_staff12');   // 裝12級杖
            overrideclick('wield weapon_sb_throwing12');   // 裝12級暗
            overrideclick('wield weapon_sb_sword11 rumai');       // 入脈11級劍
            overrideclick('wield weapon_sb_whip12 rumai');       // 入脈12級鞭
            overrideclick('wield weapon_sb_unarmed12 rumai');       // 入脈12級拳
            overrideclick('wield weapon_sb_sword12 rumai');       // 入脈12級劍
        } else {
            Dom.html('戰鬥裝備');
            overrideclick('unwield tianlongsi_sb_libiegou');   // 脫離別鉤
            overrideclick('unwield weapon_sb_sword11');   // 脫11級劍
            overrideclick('unwield weapon_sb_sword12');   // 脫12級劍
            overrideclick('unwield weapon_sb_stick11');   // 脫11級棍
            overrideclick('unwield weapon_sb_spear11');   // 脫11級槍
            overrideclick('unwield weapon_sb_stick12');   // 脫12級棍
            overrideclick('unwield weapon_sb_spear12');   // 脫12級槍
            overrideclick('unwield weapon_sb_staff12');   // 脫12級杖
            overrideclick('unwield weapon_sb_whip12');   // 脫12級鞭
            overrideclick('unwield weapon_sb_throwing12');   // 脫12級暗
            overrideclick('wear equip_head_tianji_jiuxuan');       // 天機帽
            overrideclick('wear tianlongsi_mumianjiasha');			//木棉袈裟
            overrideclick('wear equip_finger_kongdong_bulao');     // 崆峒戒
            overrideclick('wield sword of windspring rumai');       // 入脈風泉
            overrideclick('wield weapon_stick_miaoyun_lhx');       // 裝備笛子
            overrideclick('wield longwulianmoge_mojianlianhun');   // 裝本3劍x
        }
    }
    function goYang() {
        go('jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939-星星峽;ts2;ne;ne;nw;nw');
    }
    // 簽到--------------------------------------------------------
    function CheckInFunc() {
        timeCmd = 0;
        console.log(getTimes() + 'VIP簽到');
        go('vip drops');//領通勤
        go('vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task');//10次暴擊
        // clickButton('vip buy_task', 0)
        // go('vip buy_task;vip buy_task;vip buy_task;vip buy_task;vip buy_task'); // 購買5次
        // go('vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task');
        go('vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan;vip finish_clan');// 20次幫派
        // clickButton('vip finish_clan', 0) clickButton('vip finish_family', 0)
        go('vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family;vip finish_family');//25次師門
        go('vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig;vip finish_dig');//挖寶
        go('vip finish_fb dulongzhai;vip finish_fb dulongzhai;vip finish_fb junying;vip finish_fb junying;vip finish_fb beidou;vip finish_fb beidou;vip finish_fb youling;vip finish_fb youling,vip finish_fb siyu,vip finish_fb changleweiyang');//副本掃蕩
        go('vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;vip finish_diaoyu;');  //釣魚
        // go('sort;sort fetch_reward;');//排行榜獎勵
        // go('shop money_buy shop1_N_10;home;');//買引路蜂10個
        // go('exercise stop;exercise;');//打坐
        // go("share_ok 1;share_ok 2;share_ok 3;share_ok 4;share_ok 5;");//分享
        // clickButton('vip finish_fb siyu', 0)
        go('cangjian get_all;xueyin_shenbinggu blade get_all;xueyin_shenbinggu unarmed get_all;xueyin_shenbinggu throwing get_all;');//闖樓獎勵
        // go('jh 5;n;n;n;w;sign7;home;');//揚州簽到
        // go('jh 1;event_1_763634;home;');//雪亭立冬禮包
        // go('jh 1;e;n;e;e;event_1_44731074;event_1_8041045;event_1_8041045;home;');//消費積分和謎題卡
        // if(Base.getCorrectText('4253282')){
        //     go("jh 1;e;n;e;e;e;e;n;lq_bysf_lb;home;");//比翼雙飛和勞模英豪
        // }
        go('jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;e;n;n;n;w;event_1_31320275;home');//采蓮
        go('jh 26;w;w;n;e;e;event_1_18075497;home');//大招采礦
        go('jh 26;w;w;n;n;event_1_14435995;home');//大招破陣
        go("jh 37;n;e;e;nw;nw;w;n;e;n;e;e;e;ne;ne;ne;se;n;event_1_97487911;home");//絕情谷鱷魚
        go('jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;w;n;w;event_1_53278632;sousuo;sousuo;home'); //冰火島玄重鐵
    }

    function CheckInFunc1() {
        timeCmd = 0;
        console.log(getTimes() + 'VIP簽到-正邪-逃犯-打榜');
        go('clan fb saodang longwulianmoge');
        // go('vip buy_task;vip buy_task;vip buy_task;vip buy_task;vip buy_task'); // 購買5次暴擊
        go('vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task;vip finish_big_task');//暴擊
        go('vip finish_task,vip finish_task,vip finish_task,vip finish_task,vip finish_task');
        if (killBadSwitch && !isBadBoy()) {
            // 獲取正氣
            go('vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;vip finish_bad 1;');//10次正邪
        } else {
            // 獲取負氣
            go('vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;vip finish_bad 2;');//10次正邪
        }
        // go('vip finish_taofan 2;vip finish_taofan 2;vip finish_taofan 2;vip finish_taofan 2;vip finish_taofan 2;');//5次逃犯
        go('vip finish_sort;vip finish_sort;vip finish_sort;vip finish_sort;vip finish_sort;');//5次打榜
    }
    function goZhuHou() {
        go('jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;n;n;n;e;e;event_1_94442590;event_1_85535721');// 鐵雪諸侯除魔
    }
    function BuyTang() {
        go('jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;w;event_1_712982 go;daily finish 11;daily finish 12'); // 洛陽買冰糖葫蘆
    }
    function goHuashanSuipian() {
        go('items get_store /obj/quest/qinglong_suipian');
        go('jh 4;n;n;w;');
        for (var i = 0; i < 15; i++) {
            go('do_duihuan_qinglong_suipian gift15');
        }
    };

    /* 簽到 方法 :start */
    async function CheckIn() {
        console.log(getTimes() + '簽到一次！');
        g_gmain.notify_fail(HIG + getTimes() + "開始簽到" + NOR);
        go('jh 1');        // 進入章節
        go('w;event_1_21318613;event_1_2882993'); // 潛龍
        setTimeout(function () {
            go('jh 1');
            // go('wsnjc clan');
            // go('wsnjc user');
            // go('look_npc snow_mercenary new_ym_lb');
            go('look_npc snow_mercenary');
            setTimeout(function () {
                getNewLibao();
            }, 2000);
        }, 2000);
        // clickJieRiNpc('小糖人');
        // setTimeout(function () {
        //     go('jh 17;n');
        //     // clickJieRiNpc('陳湯');
        //     setTimeout(function () {
        //         clickJieRiNpc('白玉堂');
        //     }, 2000);
        // }, 4000);
        setTimeout(function () {
            checkInList();
        }, 6000);
    };
    async function checkInList() {
        go('home');         //回主頁
        go('items get_store /map/tianlongsi/obj/sanxiangmenmgzhuling');
        go('items use tianlongsi_nanguagu'); // 南瓜
        go('items use tianlongsi_sanxiangmenmgzhuling'); // 盟主令
        go('fudi houshan fetch');// 收後山
        go('fudi shennong fetch');// 收神農
        go('fudi juxian fetch_zhuguo'); // 收果子
        // go('jh 1');        // 進入章節
        // go('go west') ;     // 金庸
        // go('event_1_46497436');
        go('share_ok 1'); //分享
        go('share_ok 2'); //分享
        go('share_ok 3'); //分享
        go('share_ok 4'); //分享
        go('share_ok 5'); //分享
        // go('share_ok 6'); //分享
        go('share_ok 7'); //分享
        go('exercise stop'); //取消打坐
        go('exercise');     //打坐
        go('sleep_hanyuchuang'); // 睡床
        go('xls practice');
        go('jh 5');       // 進入揚州
        go('go north');     // 南門大街
        go('go north');   // 十裏長街3
        go('go north');    // 十裏長街2
        go('go west');    // 黃記雜貨
        go('sign7');      //簽到
        go('home');         //回主頁
        go('jh 1');        // 進入章節
        go('give_ybjd');    // 每日禮包
        go('go east');     // 廣場
        go('go north');     // 雪亭鎮街道
        go('go east');     // 淳風武館大門
        go('go east');    // 淳風武館教練場
        go('event_1_8041045');//謎題卡
        go('event_1_8041045');//謎題卡
        go('event_1_44731074');//消費積分
        go('event_1_34254529');
        //clickButton('event_1_29721519', 1)
        go('event_1_29721519'); // 狗年禮券
        go('event_1_60133236'); // 暴擊卡福利
        if (Base.getCorrectText('4253282')) {
            go('go east');     // 淳風武館大門
            go('go east');    // 淳風武館教練場
            go('go north');    // 淳風武館教練場
            go('lq_bysf_lb');//謎題卡
        }
        go('home');  //回主頁
        // go('event_1_16891630'); // 狗年禮券
        go('clan buy 302');        // 幫派買金
        go('clan buy 302');        // 幫派買金
        go('clan buy 302');        // 幫派買金
        go('clan buy 302');        // 幫派買金
        go('clan buy 302');        // 幫派買金
        go('sort');//排行榜
        go('sort fetch_reward', 1);// 領取排行獎勵
        go('jh 2');
        go('go north');  // 南郊小路
        go('go north');  // 南門
        go('go north');  // 南大街
        go('go north');  // 洛川街
        go('go north');  // 中心鼓樓
        go('go north');  // 中州街
        go('go north');  // 北大街
        go('go east');   // 錢莊
        // if (Base.getCorrectText('4253282')) {
        //     go('touzi_jihua2 buygo 7');
        //     go('touzi_jihua2 buygo 6');
        // } else {
        go('touzi_jihua2 buygo 7');
        go('touzi_jihua2 buygo 6');
        // }
        go('tzjh_lq');   // 錢莊  clickButton('tzjh_lq', 1) touzi_jihua2 buygo 6
        go('home');
        go('items use obj_bingzhen_suanmeitang');   // 酸梅湯
        go('items use obj_baicaomeijiu');           // 百草美酒
        go('items use obj_niangao');                // 年糕
        // go('shop money_buy mny_shop1_N_10');         // 買10個引路蜂
        go('cangjian get_all'); // 一鍵領取藏劍樓獎勵
        go('xueyin_shenbinggu blade get_all'); // 一鍵領取霸刀樓獎勵
        go('xueyin_shenbinggu unarmed get_all'); // 一鍵領取鐵拳樓獎勵
        go('xueyin_shenbinggu throwing get_all'); // 一鍵領取天機樓獎勵
        go('xueyin_shenbinggu stick get_all'); // 一鍵領取棍樓
        go('xueyin_shenbinggu spear get_all');     // 槍樓
        go('xueyin_shenbinggu staff get_all'); // 杖
        go('xueyin_shenbinggu whip get_all'); // 辮
        go('jh 16;event_1_34159245');
        go('jh 33;sw;sw;s;s;event_1_20090664;event_1_97518803'); // 五一
        //clickButton('event_1_20090664', 1)
        go('home');     //回主頁
        // await clickShuangEr();              // 雙兒禮包
        // await clickShuangDan();
    };
    // 領取禮包
    async function getNewLibao() {
        setTimeout(function () {
            clickLibaoBtn();
        }, 1000);
    };
    // 判斷是什麽禮包
    async function clickLibaoBtn() {
        var LiBaoName = ['兌換禮包', '1元禮包'];
        var btn = $('.cmd_click2');
        btn.each(function () {
            var txt = $(this).text();
            if (txt.indexOf('禮包') != '-1') {
                if ($.inArray(txt, LiBaoName) == -1) {
                    var clickText = $(this).attr('onclick'); // clickButton('event_1_41502934', 1)
                    var clickAction = getLibaoId(clickText);
                    triggerClick(clickAction);
                }
            }
        });

        clickButton('golook_room');
    };

    // 節日使者點擊
    async function clickJieRiNpc(name) {
        setTimeout(function () {
            clickNpcAsk(name);
        }, 1000);
        setTimeout(function () { clickMaiHuaLibaoBtn() }, 3000);
    };

    // 看相應的人
    async function clickNpcAsk(name) {

        var btn = $('.cmd_click3');
        btn.each(function () {
            var txt = $(this).text();
            if (txt == name) {
                var clickText = $(this).attr('onclick');
                var clickAction = getLibaoId(clickText);
                triggerClick(clickAction);
            }
        })
    };
    async function clickShuangDan() {
        setTimeout(function () {
            clickShuangDan1();
        }, 6000)
    };
    async function clickShuangDan1() {
        go('home');     //回主頁
        go('jh 1');
        go('look_npc snow_xiaotangren');
        setTimeout(function () { clickMaiHuaLibaoBtn() }, 3000);
    };

    async function clickShuangEr() {
        go('home');     //回主頁
        go('jh 1');       // 進入揚州
        go('look_npc snow_zhounianxiaoer');
        setTimeout(function () { clickMaiHuaLibaoBtn() }, 3000);
    };
    async function clickMaiHua() {
        go('home');     //回主頁
        go('jh 2');       // 進入揚州
        go('go north');     // 南門大街
        go('go north');   // 十裏長街3
        go('go north');     // 南門大街
        go('go north');   // 十裏長街3
        go('go north');     // 南門大街
        go('go north');   // 十裏長街3
        go('go north');     // 南門大街
        go('look_npc luoyang_luoyang3');
        setTimeout(function () { clickMaiHuaLibaoBtn() }, 3000);
    };

    // 判斷是什麽禮包
    async function clickMaiHuaLibaoBtn() {

        var btn = $('.cmd_click2');
        btn.each(function () {
            var txt = $(this).text();
            if (txt.indexOf('禮包') > 0) {
                var clickText = $(this).attr('onclick');
                var clickAction = getLibaoId(clickText);
                triggerClick(clickAction);
            }
        });
        go('home');
    };

    // 判斷是什麽禮包
    async function clickXinChunLibaoBtn() {

        var btn = $('.cmd_click2');
        btn.each(function () {
            var txt = $(this).text();
            if (txt != "比試" && txt != "對話" && txt != "觀戰") {
                var clickText = $(this).attr('onclick');
                var clickAction = getLibaoId(clickText);
                triggerClick(clickAction);
            }
        });
        go('home');
    };
    // 獲取禮包方法的名稱
    function getLibaoId(text) {
        var arr = text.split(',');
        var newArr = arr[0].split('(');
        var nowArr = newArr[1].split("'");
        return nowArr[1];
    };
    // 觸發領方法
    async function triggerClick(name) {
        go(name);
    };
    /* 簽到 方法 :end */
    /* 刷碎片 方法 :start */
    var counthead = null;
    var killDrunkIntervalFunc = null;
    async function killDrunkManFunc() {
        Jianshi.sp = 1;
        counthead = 20;
        $('span:contains(勝利)').remove();
        go('jh 2');        // 進入章節
        go('go north');      // 南郊小路
        go('go north');     // 南門
        go('go north');     // 南大街
        go('go north');     // 洛川街
        killDrunkIntervalFunc = setInterval(killDrunMan, 3000);
    };
    async function killDrunMan() {
        getInfoFromDown('/20', getSuiPianNum);
        go('kill ' + Base.DrunkMan_targetName);
        doKillSetSuiPian();
    };

    // 獲取碎片信息
    function getInfoFromDown(text, callback) {
        var out = $('#out2 .out2');
        out.each(function () {
            if ($(this).hasClass('doneCommon')) {
                return
            }
            $(this).addClass('doneCommon');
            var txt = $(this).text();
            // 獲得朱雀碎片x1 (7/20)
            if (txt.indexOf(text) != '-1') {
                callback(txt);
            } else {
                // console.log('無碎片,請刷新取消刷碎片');
            }
        });
    }

    async function getSuiPianNum(text) {
        var num = 0;
        num = text.split('(')[1];
        if (num[1]) {
            num = num[1].split('/')[0];
            if (num >= 20) {
                Jianshi.sp = 0;
                console.log(getTimes() + '完成20個碎片');
                clickButton('home');
                clearInterval(killDrunkIntervalFunc);
            } else {
                console.log(getTimes() + '殺人一次，殺人次數：%d！', parseInt(num));
                clickButton('prev_combat');
                $('span:contains(勝利)').html('')
            }
        }
    };
    /* 刷碎片 方法 :end */
    /* 獲取正氣 方法 :start */
    var useDog = false,
        killBadSwitch = true;
    var killTargetArr = ['流寇', '惡棍', '劇盜', '段老大', '二娘', '嶽老三', '雲老四'];
    function hitScore(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '正氣中') {
            killBadSwitch = false;
            killTargetArr = ['楊掌櫃', '王鐵匠', '柳繪心', '客商', '賣花姑娘', '劉守財', '柳小花', '朱老伯', '方寡婦', '方老板'];
            Dom.html('負氣中');
        } else {
            killBadSwitch = true;
            killTargetArr = ['流寇', '惡棍', '劇盜', '段老大', '二娘', '嶽老三', '雲老四'];
            Dom.html('正氣中')
        }
    }
    function hasDog() {
        var nameArr = [];
        var nameDom = $('.outkee_text');
        nameDom.each(function () {
            var name = $(this).prev().text();
            if (name != '') {
                nameArr.push(name);
            }
        });
        var dogName = ['金甲符兵', '玄陰符兵'];

        var arr3 = [];
        for (var i = 0; i < nameArr.length; i++) {
            for (var j = 0; j < dogName.length; j++) {
                if (nameArr[i] == dogName[j]) {
                    arr3.push(nameArr[i]);
                    break;
                }
            }
        }
        return arr3;
    }
    /* 獲取正氣 方法 :end */
    /* 搜屍 方法 :start */
    var doGetCorpse = null;
    function setCsearch(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '搜屍') {
            // doGetCorpse = setInterval(function () {
            //     getC();
            // }, 500);
            qiangdipiTrigger = 1;
            qiangItem();
            console.log(getTimes() + '開始搜屍');
            Dom.html('取消搜屍');
        } else {
            qiangdipiTrigger = 0;
            knownlist = [];
            // clearInterval(doGetCorpse);
            Dom.html('搜屍');
            console.log(getTimes() + '停止搜屍');
        }
    }

    function qiangItem() {
        if (qiangdipiTrigger == 1) {
            var Objectlist = g_obj_map.get("msg_room").elements;
            for (var i = 0; i < Objectlist.length; i++) {
                if (Objectlist[i].key.indexOf("item") >= 0) {
                    if (knownlist.indexOf(" " + Objectlist[i].value.split(",")[0]) < 0) {
                        clickButton("get " + Objectlist[i].value.split(",")[0], 0)
                    }
                }
            }
        }
    }

    function getC() {
        // clickButton('golook_room');
        $('.cmd_click3').each(function () {
            var txt = $(this).text();
            if (txt.indexOf('的屍體') != '-1') {
                if (killOneName) {
                    if (txt.indexOf(killOneName) != '-1') {
                        var npcText = $(this).attr('onclick');
                        var id = getId(npcText);
                        clickButton('get ' + id);
                    }
                } else {
                    var npcText = $(this).attr('onclick');
                    var id = getId(npcText);
                    clickButton('get ' + id);
                }
            }
        });
    }
    /* 搜屍 方法 :end */
    /* 地圖碎片 */
    function submitSuipian() {
        go('clan bzmt puzz');
    }
    var suipianInterval = null;
    function ditusuipianFunc(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '地圖碎片') {
            foundSuiPian();
            suipianInterval = setInterval(function () {
                foundSuiPian();
            }, 1 * 60 * 1000);
            console.log(getTimes() + '開始地圖碎片');
            Dom.html('停止碎片');
        } else {
            clearInterval(suipianInterval);
            console.log(getTimes() + '停止地圖碎片');
            Dom.html('地圖碎片');
        }
    }
    function foundSuiPian() {
        var place = $('#out .outtitle').text();
        var placeArr = ['地室', '萬蠱堂', '百毒池', '十惡殿', '千蛇窟'];
        var index = $.inArray(place, placeArr);

        if (index >= 0) {
            if (index == '0') {
                goPlaceBtnClick('地室');
                goPlaceBtnClick('萬蠱堂');
            } else {
                var name = getBtnText();
                // console.log(name);
                if (name) {
                    if (name == '翼國公') {
                        clickButton('kill changan_yiguogong1');
                    }
                    if (name == '黑袍公') {
                        clickButton('kill changan_heipaogong1');
                    }
                    if (name == '雲觀海') {
                        clickButton('kill changan_yunguanhai1');
                    }
                    if (name == '獨孤須臾') {
                        clickButton('kill changan_duguxuyu1');
                    }
                } else {
                    if (index == '4') {
                        index = 0;
                    }
                    goNextRoom(index + 1);
                }
            }
        }
    }
    function getBtnText() {
        var npcName = ['獨孤須臾', '雲觀海', '黑袍公', '翼國公'];
        var targetName = null;
        var btn = $('.cmd_click3');
        for (var i = 0; i < npcName.length; i++) {
            var name = npcName[i];
            btn.each(function () {
                if ($(this).text() == name) {
                    targetName = name;
                }
            });
        }
        // console.log(targetName);
        return targetName;
    }

    function goNextRoom(index) {
        goPlaceBtnClick('地室');
        // console.log(index);
        setTimeout(function () {
            if (index == '1') {
                goPlaceBtnClick('萬蠱堂');
            } else if (index == '2') {
                goPlaceBtnClick('百毒池');
            } else if (index == '3') {
                goPlaceBtnClick('十惡殿');
            } else if (index == '4') {
                goPlaceBtnClick('千蛇窟');
            }
        }, 2000)
    }
    /* 切磋 :start */
    var fightInterval = null;
    function fightWithPlayer(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '切磋') {
            var id = prompt("請輸入要切磋的ID", "4316804");
            if (!id || id == '') {
                return
            }
            fightInterval = setInterval(function () {
                fightWithPlayerFn(id);
            }, 1000);
            console.log(getTimes() + '開啟切磋');
            Dom.html('取消切磋');
        } else {
            clearInterval(fightInterval);
            Dom.html('切磋');
            console.log(getTimes() + '停止切磋');
        }
    }
    function fightWithPlayerFn(id) {
        clickButton('fight u' + id);
    }
    /* 切磋 :end*/
    /* 殺正邪 方法 :start */
    var badNameArr = [];
    var killErInterval = null;
    var killErSwitch = false;
    var killENum = 0;
    function killErNiangFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '殺正邪') {
            killENum = 0;
            console.log(getTimes() + '開始殺正邪');
            useDog = false;
            badNameArr = ['段老大', '二娘'];
            Dom.html('取消殺正邪');
            killErInterval = setInterval(function () {
                if (killENum > 10) {
                    clickButton('escape');
                    useDog = true;
                    console.log(getTimes() + '取消殺正邪');
                    $("#btnm1").html('殺正邪');
                    killErSwitch = false;
                    clearInterval(killErInterval);
                } else {
                    doClearNpc();
                    killErSwitch = true;
                    // doKillDogSet();
                }

            }, 10000)
        } else {
            useDog = true;
            console.log(getTimes() + '取消殺正邪');
            Dom.html('殺正邪');
            clearInterval(killErInterval);
        }
    }
    /* 殺正邪 方法 :end */
    /* 殺逃犯 方法 :start */
    var killTaoFanInterval = null;
    var taoPlaceStep = 1;
    function killTaoFanFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '殺逃犯') {
            console.log(getTimes() + '開始殺逃犯');
            useDog = true;
            badNameArr = ['段老大', '二娘'];
            Dom.html('取消逃犯');
            killTaoFanInterval = setInterval(function () {
                doClearTaoFan();
                doKillTaoFanSet();
            }, 4000);
        } else {
            useDog = false;
            console.log(getTimes() + '停止殺逃犯');
            Dom.html('殺逃犯');
            clearInterval(killTaoFanInterval);
        }
    }
    // 清狗技能
    function doKillTaoFanSet() {
        var skillArr = Base.mySkillLists.split('；');
        if (hasDog().length < 2 && useDog) {
            skillArr = ['茅山道術', '天師滅神劍'];
        }

        if ($('.out_top').find('.outkee_text').length > 1) {
            clickButton('escape');
            return false;
        }
        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
        var clickSkillSwitch = false;
        $.each(skillIdA, function (index, val) {
            var btn = $('#skill_' + val);
            var btnName = btn.text();
            for (var i = 0; i < skillArr.length; i++) {
                var skillName = skillArr[i];
                if (btnName == skillName) {
                    btn.find('button').trigger('click');
                    clickSkillSwitch = true;
                    break;
                }
            }
        });
        //clickButton('escape');
        if (!clickSkillSwitch && $('.cmd_skill_button').length > 0) {
            clickButton('playskill 1');
        }
    }
    // 開始打壞人
    function doClearTaoFan() {
        findTaoFan();
    }
    //去位置
    async function goTaoFanPlace(place) {
        // go('home');
        go('jh ' + place);
    };
    // 去下一個位置
    async function goNextTaoFanPlace() {
        if (taoPlaceStep < 10) {
            taoPlaceStep++
        } else {
            taoPlaceStep = 1;
        }
        await goTaoFanPlace(taoPlaceStep);
    };

    // 殺逃犯
    async function doKillTaoFan(arr) {
        var maxId = arr[0];
        killENum++;
        console.log(getTimes() + '當前第：' + killENum + '個，' + bad_target_name + ':' + maxId);
        await new Promise(function (resolve) {
            setTimeout(resolve, 1000);
        });
        await killE(maxId);
    };
    // 找打壞人
    async function findTaoFan() {
        goNpcPlace(taoPlaceStep);
        // javascript:clickButton('golook_room');
        var btn = $('.cmd_click3');
        idArr = [];
        for (var j = 0; j < badNameArr.length; j++) {
            var badName = badNameArr[j];

            for (var i = btn.length; i > 0; i--) {
                var txt = btn.eq(i).text();
                if (txt == badName) {
                    bad_target_name = badName;
                    var npcText = null;
                    if (killBadSwitch) {
                        npcText = btn.eq(i).attr('onclick');
                    } else {
                        npcText = btn.eq(i - 1).attr('onclick');
                    }
                    var id = getId(npcText);
                    idArr.push(id);
                }
                // clickButton('score u4185184-15a1a', 0)
                var btnClick = btn.eq(i).attr('onclick');
                // 有玩家就閃過去
                if (btnClick) {
                    if (btnClick.indexOf('score') != '-1') {
                        idArr = [];
                    }
                }
            }
        }

        // 有狗就閃過去
        if (getDogNum().length > 0) {
            goNextTaoFanPlace();
        } else {
            if (idArr.length == 0) {
                goNextTaoFanPlace();
            } else {
                await doKillTaoFan(idArr);
            }
        }

    };

    /* 殺逃犯 方法 :end */
    /* 清正邪 方法 :start */
    var clearNpcInterval = null;
    var placeArr = ['書房', '打鐵鋪子', '桑鄰藥鋪', '南市', '繡樓', '北大街', '錢莊', '桃花別院', '雜貨鋪', '祠堂大門', '廳堂'];
    var placeStep = 0;
    var killENum = 0;
    var clearNpcIntervalSetSkill = null;
    var bad_target_name = null;
    function clearNpcFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '清正邪') {
            Jianshi.qingzhengxie = 1;
            useDog = true;
            badNameArr = ['段老大', '二娘', '嶽老三', '雲老四', '劇盜', '惡棍', '流寇'];
            console.log(getTimes() + '開始清正邪');
            Dom.html('取消正邪');
            doClearNpc();
            clearNpcInterval = setInterval(function () {
                doClearNpc();
            }, 10000);
            clearNpcIntervalSetSkill = setInterval(function () {
                doKillDogSet();
            }, 5000);
        } else {
            Jianshi.qingzhengxie = 0;
            useDog = false;
            console.log(getTimes() + '停止清正邪');
            Dom.html('清正邪');
            clearInterval(clearNpcInterval);
            clearInterval(clearNpcIntervalSetSkill);
        }

    }
    // 開始打壞人
    function doClearNpc() {
        findNpc();
    }
    // 清狗技能
    function doKillDogSet() {
        var skillArr = Base.mySkillLists.split('；');
        if (hasDog().length < 2 && useDog) {
            skillArr = ['茅山道術', '天師滅神劍'];
        }

        if (!killErSwitch) {
            if (hasDog().length > 0 && useDog || $('.out_top').find('.outkee_text').length > 1) {
                clickButton('escape');
                return false;
            }
        }

        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
        var clickSkillSwitch = false;
        $.each(skillIdA, function (index, val) {
            var btn = $('#skill_' + val);
            var btnName = btn.text();
            for (var i = 0; i < skillArr.length; i++) {
                var skillName = skillArr[i];
                if (btnName == skillName) {
                    btn.find('button').trigger('click');
                    clickSkillSwitch = true;
                    break;
                }
            }
        });
        if (!clickSkillSwitch && $('.cmd_skill_button').length > 0) {
            clickButton('playskill 1');
        }
    }
    // 找打壞人
    async function findNpc() {
        clickButton('golook_room');
        var btn = $('.cmd_click3');
        idArr = [];
        for (var j = 0; j < badNameArr.length; j++) {
            var badName = badNameArr[j];
            for (var i = btn.length; i > 0; i--) {
                var txt = btn.eq(i).text();
                if (txt == badName) {
                    bad_target_name = badName;
                    var npcText = null;
                    if (killBadSwitch) {
                        npcText = btn.eq(i).attr('onclick');
                    } else {
                        npcText = btn.eq(i - 1).attr('onclick');
                    }
                    var id = getId(npcText);
                    idArr.push(id);
                }
                var btnClick = btn.eq(i).attr('onclick');
                if (btnClick) {
                    if (btnClick.indexOf('score') != '-1') {
                        idArr = [];
                    }
                }
            }
        }

        if (getDogNum().length > 0 && !killErSwitch) {
            await goNextPlace();
        } else if (getPlayerNum().length > 0) {
            await goNextPlace();
        } else if ($('.cmd_skill_button').length == 0) {
            if (idArr.length == 0) {
                await goNextPlace();
            } else {
                await doKillBadNpc(idArr);
            }
        }
    };
    // 去下一個位置
    async function goNextPlace() {
        if (placeStep < 10) {
            placeStep++
        } else {
            placeStep = 0;
        }
        await goNpcPlace(placeArr[placeStep]);
    };
    // 獲取Dog的數量
    function getDogNum() {
        var nameArr = [];
        var nameDom = $('.cmd_click3');
        var dogName = ['金甲符兵', '玄陰符兵'];
        var arr3 = [];
        nameDom.each(function () {
            var name = $(this).text();
            if (name != '') {
                nameArr.push(name);
            }
        });

        for (var i = 0; i < nameArr.length; i++) {
            for (var j = 0; j < dogName.length; j++) {
                if (nameArr[i] == dogName[j]) {
                    arr3.push(nameArr[i]);
                    break;
                }
            }
        }
        return arr3;
    }
    // 獲取在場人的數量
    function getPlayerNum() {
        var nameArr = [];
        var nameDom = $('.cmd_click3');
        var dogName = ['score u'];
        var arr3 = [];
        nameDom.each(function () {
            var name = $(this).attr('onclick');
            if (name != '') {
                nameArr.push(name);
            }
        });

        for (var i = 0; i < nameArr.length; i++) {
            for (var j = 0; j < dogName.length; j++) {
                if (nameArr[i].indexOf(dogName[j]) != '-1') {
                    arr3.push(nameArr[i]);
                    break;
                }
            }
        }
        return arr3;
    }
    // 殺好人
    async function doKillBadNpc(arr) {
        var maxId = null;
        if (arr.length > 1) {
            var newIdArr = [];
            for (var i = 0; i < arr.length; i++) {
                if (killBadSwitch) {
                    newIdArr.push(idArr[i].replace('eren', ''));
                } else {
                    newIdArr.push(arr[i].replace('bad_target_', ''));
                }
            }
            maxId = newIdArr.max();;
            maxId = arr[maxId];
        } else {
            maxId = arr[0];
        }
        killENum++;
        console.log(getTimes() + '當前第：' + killENum + '個，' + bad_target_name + ':' + maxId);  //eren580108074
        await killE(maxId);
    };
    //去位置
    async function goNpcPlace(place) {
        switch (place) {
            case "書房":
                await goSfang();
                break;
            case "打鐵鋪子":
                await goTie();
                break;
            case "桑鄰藥鋪":
                await goYao();
                break;
            case "南市":
                await goNan();
                break;
            case "繡樓":
                await goXiu();
                break;
            case "北大街":
                await goNStreet();
                break;
            case "錢莊":
                await goQian();
                break;
            case "桃花別院":
                await goTao();
                break;
            case "雜貨鋪":
                await goZa();
                break;
            case "祠堂大門":
                await goCi();
                break;
            case "廳堂":
                await goTing();
                break;
        }
    };
    /* 清正邪 方法 :end */
    function getUrlParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //構造一個含有目標參數的正則表達式對象
        var r = window.location.search.substr(1).match(reg);  //匹配目標參數
        if (r != null) return unescape(r[2]); return null; //返回參數值
    }
    /* 跨服 方法 :start */
    var kuafuNpc = '';
    function interServerFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        var kuafutext = '36-40';
        if (getUrlParam('area') < 6) {
            kuafutext = '1-5';
        }
        if (DomTxt == '跨服') {
            kuafuNpc = '[' + kuafutext + '區]';
            console.log(getTimes() + '開始' + kuafutext + '跨服');
            Dom.html('取消跨服');
        } else {
            kuafuNpc = '';
            console.log(getTimes() + '停止' + kuafutext + '跨服');
            Dom.html('跨服');
        }

    }
    /* 跨服 方法 :end */

    function doOneSkillsJian() {
        var skillArr = ['九天龍吟劍法', '覆雨劍法'];
        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];

        $.each(skillIdA, function (index, val) {
            var btn = $('#skill_' + val);
            var btnName = btn.text();

            for (var i = 0; i < skillArr.length; i++) {
                var skillName = skillArr[i];
                if (btnName == skillName) {
                    btn.find('button').trigger('click');
                    break;
                }
            }
        });
    }
    function doOneSkillsZhang() {
        var skillArr = ['排雲掌法', '如來神掌'];
        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];

        $.each(skillIdA, function (index, val) {
            var btn = $('#skill_' + val);
            var btnName = btn.text();

            for (var i = 0; i < skillArr.length; i++) {
                var skillName = skillArr[i];
                if (btnName == skillName) {
                    btn.find('button').trigger('click');
                    break;
                }
            }
        });
    }
    /* 打樓 方法 :start */
    var fightLouInterval = null;
    var daLouMode = 0;
    function fightLou(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '打樓') {
            daLouMode = 1;
            console.log(getTimes() + '開始打樓');
            Dom.html('取消打樓');
        } else {
            daLouMode = 0;
            console.log(getTimes() + '停止打樓');
            Dom.html('打樓');
        }
    }
    function chuzhaoNum() {
        $('#btn-chuzhao').html('出招+' + maxQiReturn);
    }
    var maxQiReturn = 0;
    /* 打樓 方法 :end */
    /* 對招 方法 :start */
    var duiZhaoMode = 0;
    function fightAllFunc(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '對招') {
            duiZhaoMode = 1;
            console.log(getTimes() + '開始對招');
            Dom.html('取消對招');
        } else {
            duiZhaoMode = 0;
            console.log(getTimes() + '停止對招');
            Dom.html('對招');
        }
    }
    var maxQiReturn = 0;
    function doFightAll() {
        if ($('span.out4:contains(切磋一番)').length > 0) {
            isOnstep1 = false;
            go('golook_room');
        }
        if ($('#skill_1').length == 0) {
            maxQiReturn = 0;
            chuzhaoNum();
            bixueEnd();
            hitMaxEnd();
            return;
        }
        if (hasQiLin()) {
            clickButton('escape');
            clickButton('home');
            setTimeout(function () {
                clickButton('home');
            }, 1000);
            setTimeout(function () {
                clickButton('home');
            }, 2000);
            return false;
        }

        var out = $('#out .out');
        out.each(function () {

            if ($(this).hasClass('done')) {
                return
            }

            $(this).addClass('done');

            var txt = $(this).text();
            var qiNumber = gSocketMsg.get_xdz();
            if (qiNumber < 3) {
                return;
            }

            var clickSkillSwitch = checkHeal();

            if (!clickSkillSwitch && $('.cmd_skill_button').length > 0) {
                // var hitDesList = ['刺你','掃你','指你','你如','至你','拍你','向你','在你','準你','點你','劈你','取你','往你','奔你','朝你','擊你','斬你','撲你','取你','射你','你淬','卷你','要你','將你','湧向你','對準你','你急急','抓破你','對著你','你已是','你被震','鉆入你','穿過你','你愕然','你一時','你難辨','你竭力','縱使你有','圍繞著你','你生命之火','你掃蕩而去','你反應不及','你再難撐持','你無處可避','貫穿你軀體','你擋無可擋','你大驚失色','你的對攻無法擊破','你這一招並未奏效','你只好放棄對攻'];
                var hitDesList = hitKeys;
                for (var i = 0; i < hitDesList.length; i++) {
                    var hitText = hitDesList[i];
                    if (txt.indexOf('鐵鎖橫江') == '-1' && txt.indexOf('金剛不壞功力') == '-1' && txt.indexOf('太極神功') == '-1') {
                        if (txt.indexOf(hitText) != '-1') {
                            if (Base.getCorrectText('4253282')) {
                                if (txt.indexOf('掌') != '-1' || txt.indexOf('拳') != '-1') {
                                    kezhi('2');
                                } else {
                                    kezhi('1');
                                }
                            } else {
                                doKillSet();
                            }
                            return
                        }
                    }
                }
            }
        });
        var qiText = gSocketMsg.get_xdz();
        if (qiText > 8) {
            kezhi('2');
        }
    }

    function hasQiLin() {
        var text = $('#vs11').text();
        if (text.indexOf('火麒麟王') != '-1') {
            return true;
        } else {
            return false;
        }
    }
    /* 對招 方法 :end */
    var healSpaceTime = true;
    function checkHeal() {
        var hp = geKeePercent();
        var qiNumber = gSocketMsg.get_xdz();
        if (qiNumber < 3) {
            return;
        }
        if (!healSpaceTime) {
            return true;
        }
        var neili = geForcePercent();
        var hasHeal = false;
        if (hp < 50) {
            var skillArr = ["紫血大法", "道種心魔經", "茅山道術"];
            if (Base.getCorrectText('4253282')) {
                var skillArr = ["紫血大法"];
                if (maxQiReturn >= 50) {
                    return false;
                }
            } else if (maxQiReturn >= 3) {
                return false;
            }
            var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
            $.each(skillArr, function (index, val) {
                var skillName = val;

                for (var i = 0; i < skillIdA.length; i++) {
                    var btnNum = skillIdA[i];
                    var btn = $('#skill_' + btnNum);
                    var btnName = btn.text();

                    if (btnName == skillName) {
                        btn.find('button').trigger('click');
                        // console.log(getTimes() + '血過少，使用技能【' + skillName + '】');
                        hasHeal = true;
                        maxQiReturn++;
                        chuzhaoNum();
                        healSpaceTime = false;
                        setTimeout(function () {
                            healSpaceTime = true;
                        }, 1000);
                        break;
                    }
                }
            });
        } else if (parseInt(neili) < 20) {
            var skillArr = ["紫血大法", "道種心魔經"];
            var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
            $.each(skillArr, function (index, val) {
                var skillName = val;

                for (var i = 0; i < skillIdA.length; i++) {
                    var btnNum = skillIdA[i];
                    var btn = $('#skill_' + btnNum);
                    var btnName = btn.text();

                    if (btnName == skillName) {
                        btn.find('button').trigger('click');
                        // console.log(getTimes() + '內力過少，使用技能【' + skillName + '】');
                        healSpaceTime = false;
                        hasHeal = true;
                        setTimeout(function () {
                            healSpaceTime = true;
                        }, 2000);
                        break;
                    }
                }
            });
        } else if (hp < 50) {
            var zixueneigong = "紫血大法";
            for (var i = 1; i <= 8; i++) {
                if (g_obj_map.get("skill_button" + i) != undefined && ansi_up.ansi_to_text(g_obj_map.get("skill_button" + i).get("name")) == zixueneigong) {
                    clickButton("playskill " + i, 0);
                    healSpaceTime = false;
                    hasHeal = true;
                    setTimeout(function () {
                        healSpaceTime = true;
                    }, 2000);
                    return
                }
            }
        }

        if (!bixueSwitch && isBigBixue() && Jianshi.bx == 1) {
            var skillArr = ['碧血心法'];

            var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];

            $.each(skillArr, function (index, val) {
                var skillName = val;
                for (var i = 0; i < skillIdA.length; i++) {
                    var btnNum = skillIdA[i];
                    var btn = $('#skill_' + btnNum);
                    var btnName = btn.text();
                    if (btnName == skillName) {
                        btn.find('button').trigger('click');
                        console.log(getTimes() + '使用鼻血');
                    }
                }
            });
        }

        if (!bishouSwitch && Jianshi.bs == 1) {
            var skillArr = ['白首太玄經'];

            var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];

            $.each(skillArr, function (index, val) {
                var skillName = val;
                for (var i = 0; i < skillIdA.length; i++) {
                    var btnNum = skillIdA[i];
                    var btn = $('#skill_' + btnNum);
                    var btnName = btn.text();
                    if (btnName == skillName) {
                        btn.find('button').trigger('click');
                        console.log(getTimes() + '使用白首');
                    }
                }
            });
        }
        return hasHeal;
    }
    /* 懟人 方法 :start */
    var fightAllInter1 = null;
    var targetNpcName = null;
    function fightAllFunc1(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '懟人') {
            targetNpcName = prompt("請輸入要使用的技能", "公主丞,未央公主,百夫長,孽龍之靈,真身,極武聖,拳鬥師");
            if (targetNpcName) {
                Jianshi.dr = 1;
                // fightAllInter1 = setInterval(function () {
                //     doFightAll1(targetNpcName);
                // }, 200);
                console.log(getTimes() + '開始懟人');
                Dom.html('取消懟人');
            }
        } else {
            Jianshi.dr = 0;
            // clearInterval(fightAllInter1);
            console.log(getTimes() + '停止懟人');
            Dom.html('懟人');
        }
    }
    function doFightAll1(targetNpcName) {
        if ($('#skill_1').length == 0) {
            maxQiReturn = 0;
            chuzhaoNum();
            bixueEnd();
            hitMaxEnd();
            return;
        }
        var out = $('#out .out');
        out.each(function () {

            if ($(this).hasClass('doneTarget')) {
                return
            }

            $(this).addClass('doneTarget');

            var clickSkillSwitch = checkHeal();

            var qiText = gSocketMsg.get_xdz();
            if (qiText < 6 && targetNpcName) {
                return;
            }

            var txt = $(this).text();
            var hitDesList = null;
            // var OldList = ['刺你','掃你','指你','你如','至你','拍你','向你','在你','準你','點你','劈你','取你','往你','奔你','朝你','擊你','斬你','撲你','取你','射你','你淬','卷你','要你','將你','湧向你','對準你','你急急','抓破你','對著你','你已是','你被震','鉆入你','穿過你','你愕然','你一時','你難辨','你竭力','縱使你有','圍繞著你','你生命之火','你掃蕩而去','你反應不及','你再難撐持','你無處可避','貫穿你軀體','你擋無可擋','你大驚失色','你的對攻無法擊破','你這一招並未奏效','你只好放棄對攻'];
            var OldList = hitKeys;
            if (targetNpcName) {
                hitDesList = targetNpcName.split(',').concat(killTargetArr);
            } else {
                hitDesList = OldList;
            }
            for (var i = 0; i < hitDesList.length; i++) {
                var hitText = hitDesList[i];
                if (txt.indexOf(hitText) != '-1') {
                    if (txt.indexOf('太極神功') != '-1' || txt.indexOf('金剛不壞功力') != '-1' || txt.indexOf('手腳遲緩') != '-1' || txt.indexOf('手腳無力') != '-1' || txt.indexOf('傷害') != '-1' || txt.indexOf('武藝不凡') != '-1' || txt.indexOf('我輸了') != '-1' || txt.indexOf('臉色微變') != '-1' || txt.indexOf('直接對攻') != '-1') {
                        return;
                    }
                    else if (txt.indexOf('領教壯士的高招') == '-1' && txt.indexOf('深深吸了幾口氣') == '-1' && txt.indexOf('希望擾亂你') == '-1' && txt.indexOf('緊接著') == '-1' && txt.indexOf('同時') == '-1' && txt.indexOf('身形再轉') == '-1' && txt.indexOf('迅疾無比') == '-1') {
                        if (txt.indexOf('掌') != '-1' || txt.indexOf('拳') != '-1') {
                            kezhi('2');
                        } else {
                            kezhi('1');
                        }
                        return;
                    }
                }
            }
        });
    }
    /* 懟人 方法 :end */
    /* 自動戰鬥 方法 :start */
    var autoKillInter = null;
    function autoKill(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '自動戰鬥') {
            autoKillInter = setInterval(function () {
                doKillSetAuto();
            }, timeInter);
            console.log(getTimes() + '開始自動戰鬥,內力少於30%回內力');
            Dom.html('取消自動');
        } else {
            clearInterval(autoKillInter);
            console.log(getTimes() + '停止自動戰鬥');
            Dom.html('自動戰鬥')
        }
    }
    var autoKillXuanhongInter = null;
    function autoKillXuanhong(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '懸紅眩暈') {
            autoKillXuanhongInter = setInterval(function () {
                doKillSetXuanhong();
            }, timeInter);
            console.log(getTimes() + '開始懸紅眩暈');
            Dom.html('停止眩暈');
        } else {
            clearInterval(autoKillXuanhongInter);
            console.log(getTimes() + '停止懸紅眩暈');
            Dom.html('懸紅眩暈')
        }
    }
    function doKillSetXuanhong() {
        if ($('span.outbig_text:contains(戰鬥結束)').length > 0 && !AutoPaiHangFuncIntervalFunc && Jianshi.sp == '0') {
            isOnstep1 = false;
            go('golook_room');
        }
        if (!g_gmain.is_fighting) {
            Jianshi.xuanyun = 0;
            return;
        }
        var qiText = gSocketMsg.get_xdz();
        var hasHeal = false;
        if (qiText < 3) {
            return;
        }
        if (qiText >= 6) {
            // 改為槍在後
            setNewSkillsPosition('up');
        } else {
            setNewSkillsPosition('down');
        }
        var skillArr = Base.mySkillLists.split('；');
        if (Jianshi.tianjian == 1) {
            skillArr = ['月夜鬼蕭', '破軍棍訣', '千影百傷棍', '神龍東來', '冰月破魔槍'];
        }
        var vsName = g_obj_map.get("msg_vs_info").get("vs2_name1");
        if (vsName.indexOf('江洋大盜') >= 0) {
            if (Jianshi.xuanyun < 1) {
                Base.qi = 3;
                skillArr = ['步玄七訣', '意寒神功'];
            } else if (Jianshi.longxiang < 1) {
                skillArr = ['龍象般若功'];
            }
        } else {
            Base.qi = 6;
            hasHeal = checkHeal();
        }
        if (hasHeal || qiText < Base.qi) {
            return;
        }

        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
        var clickSkillSwitch = false;
        $.each(skillArr, function (index, val) {
            var skillName = val;

            for (var i = 0; i < skillIdA.length; i++) {
                var btnNum = skillIdA[i];
                var btn = $('#skill_' + btnNum);
                var btnName = btn.text();

                if (btnName == skillName) {
                    btn.find('button').trigger('click');
                    clickSkillSwitch = true;
                    break;
                }
            }
        });
    }
    function setNewSkillsArr(arr, key, type) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === key) {
                arr.splice(i, 1);
                break;
            }
        }
        if (type == 'up') {
            arr.unshift(key);
        } else {
            arr.push(key);
        }
        return arr;
    }
    function setNewSkillsPosition(type) {
        var skills = Base.mySkillLists;
        var skillsArr = skills.split('；');
        //破軍棍訣,千影百傷棍,
        if (skills.indexOf('月夜鬼蕭') > -1) {
            skillsArr = setNewSkillsArr(skillsArr, '月夜鬼蕭', type);
        } else if (skills.indexOf('破軍棍訣') > -1) {
            skillsArr = setNewSkillsArr(skillsArr, '破軍棍訣', type);
        } else if (skills.indexOf('千影百傷棍') > -1) {
            skillsArr = setNewSkillsArr(skillsArr, '千影百傷棍', type);
        }
        Base.mySkillLists = skillsArr.join('；');
        // console.log(Base.mySkillLists)
    }
    function doKillSet() {
        if ($('span.outbig_text:contains(戰鬥結束)').length > 0 && !AutoPaiHangFuncIntervalFunc && Jianshi.sp == '0') {
            isOnstep1 = false;
            go('golook_room');
        }
        if (!g_gmain.is_fighting) {
            Jianshi.xuanyun = 0;
            return;
        }
        var qiText = gSocketMsg.get_xdz();
        if (qiText < 3) {
            return;
        }
        if (qiText >= 6) {
            // 改為棍在前
            setNewSkillsPosition('up');
        } else {
            setNewSkillsPosition('down');
        }

        var skillArr = Base.mySkillLists.split('；');

        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
        var clickSkillSwitch = false;
        $.each(skillArr, function (index, val) {
            var skillName = val;

            for (var i = 0; i < skillIdA.length; i++) {
                var btnNum = skillIdA[i];
                var btn = $('#skill_' + btnNum);
                var btnName = btn.text();

                if (btnName.indexOf(skillName) > -1) {
                    btn.find('button').trigger('click');
                    clickSkillSwitch = true;
                    break;
                }
            }
        });
    }
    function doKillSetSuiPian() {
        if ($('#skill_1').length == 0) {
            isOnstep1 = false;
            return;
        }

        var skillArr = Base.mySkillLists.split('；');

        var skillIdA = ['1', '2', '3', '4', '5', '6'];
        var clickSkillSwitch = false;
        $.each(skillArr, function (index, val) {
            var skillName = val;

            for (var i = 0; i < skillIdA.length; i++) {
                var btnNum = skillIdA[i];
                var btn = $('#skill_' + btnNum);
                var btnName = btn.text();

                if (btnName == skillName) {
                    btn.find('button').trigger('click');
                    clickSkillSwitch = true;
                    break;
                }
            }
        });
        if (!clickSkillSwitch) {
            go('playskill 1');
        }
    }
    function doKillSetAuto() {
        if ($('span.outbig_text:contains(戰鬥結束)').length > 0 && !AutoPaiHangFuncIntervalFunc && Jianshi.sp == '0') {
            isOnstep1 = false;
            go('golook_room');
        }
        if ($('#skill_1').length == 0) {
            return;
        }
        var qiText = gSocketMsg.get_xdz();

        if (qiText < 3) {
            return;
        }

        var hasHeal = null;
        if (!followTeamSwitch) {
            hasHeal = checkHeal();
        }
        if (hasHeal) {
            return;
        }
        if (qiText < Base.qi) {
            return;
        }
        if (qiText >= 6) {
            // 改為槍在後
            setNewSkillsPosition('up');
        } else {
            setNewSkillsPosition('down');
        }
        var skillArr = Base.mySkillLists.split('；');

        if (daLouMode == 1) {
            skillArr = ["萬流歸一"];
        }

        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
        var clickSkillSwitch = false;
        $.each(skillArr, function (index, val) {
            var skillName = val;

            for (var i = 0; i < skillIdA.length; i++) {
                var btnNum = skillIdA[i];
                var btn = $('#skill_' + btnNum);
                var btnName = btn.text();

                if (btnName.indexOf(skillName) > -1) {
                    btn.find('button').trigger('click');
                    // console.log('自動技能：' + btnName);
                    clickSkillSwitch = true;
                    break;
                }
            }
        });
        // if (!clickSkillSwitch) {
        //     clickButton('playskill 1');
        // }
    }
    /* 自動戰鬥 方法 :end */
    /* 更換青龍裝備 :start */
    var myCareList = "";    // 關註裝備的名稱
    function changeQinglong(e) {
        var careList = prompt("請輸入要使用的技能", myCareList);
        if (careList) {
            myCareList = careList;
        }
    }
    /* 更換青龍裝備 :end */
    /* 更換跨服青龍裝備 :start */
    var myCareKuaFuList = "明月,碧玉錘,星月大斧,霸王槍,倚天劍,屠龍刀,墨玄掌套,冰魄銀針,烈日棍,西毒蛇杖,碧磷鞭,月光寶甲衣";    // 關註裝備的名稱
    function changeQinglong1(e) {
        var txt = myCareKuaFuList;
        var careList = prompt("請輸入要使用的技能", txt);
        if (careList) {
            myCareList = careList;
        }
    }
    /* 更換跨服青龍裝備 :end */

    /* 更換非關註青龍裝備 :start */
    var disCareList = "暴雨梨花針";    // 非關註裝備的名稱
    if (Base.getCorrectText('4253282')) {
        disCareList = "暴雨梨花針,軒轅劍碎片,破嶽拳套碎片,玄冰凝魄槍碎片,胤武伏魔斧碎片,九天滅世錘碎片";        // 非關註裝備的名稱
    }
    if (Base.getCorrectText('4254240') && Base.correctQu() == '38') {
        disCareList = "暴雨梨花針,軒轅劍碎片,破嶽拳套碎片,天神杖碎片,神龍怒火鞭碎片";        // 非關註裝備的名稱
    }
    if (Base.getCorrectText('3594649')) {
        disCareList = "暴雨梨花針,雷霆誅神刀碎片,軒轅劍碎片,破嶽拳套碎片,玄冰凝魄槍碎片,胤武伏魔斧碎片,九天滅世錘碎片";    // 非關註裝備的名稱
    }
    // 有才
    if (Base.getCorrectText('4219507')) {
        disCareList = "暴雨梨花針,軒轅劍碎片,破嶽拳套碎片,玄冰凝魄槍碎片,胤武伏魔斧碎片,九天滅世錘碎片";    // 非關註裝備的名稱
    }
    function setDisCareQingLong(e) {
        var careList = prompt("請輸入要使用的技能", disCareList);
        if (careList) {
            disCareList = careList;
        }
    }
    /* 更換非關註青龍裝備 :end */

    // 判斷不是關註的青龍裝備
    function getDisName(txt) {
        var _name = '';
        ALLNAME = disCareList.split(',');
        $.each(ALLNAME, function (n, v) {
            if (txt.indexOf(v) != '-1') {
                _name = v;
                return false;
            }
        });
        return _name;
    }
    /* 年獸 */
    var nianshouInterval = null;
    var nianshouChatInterval = null;
    function watchNianShou(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '監控年獸') {
            nianshouChatInterval = setInterval(autoGetBack, 2 * 60 * 1000);
            nianshouInterval = setInterval(function () {
                getNianInfo();
            }, 200);
            Dom.html('取消年獸');
        } else {
            clearInterval(nianshouInterval);
            clearInterval(nianshouChatInterval);
            Dom.html('監控年獸');
        }
    }
    function getNianInfo() {
        var len = $("#out>.out").length;
        var liCollection = $("#out>.out");

        $("#out>.out").each(function (i) {
            var Dom = liCollection.eq(len - i - 1);
            if (Dom.hasClass('doneNianshou')) {
                return
            }
            Dom.addClass('doneNianshou');
            var txt = Dom.text();

            if (txt.split('：').length > 2) {
                return;
            }

            if (txt.indexOf('聽說年獸被') == '-1') {
                return;
            }

            console.log(getTimes() + txt);
            go('jh 1;e;n;n;n;n;n');
            setTimeout(function () {
                if ($('#btn5').html() == '搜屍') {
                    $('#btn5').trigger('click');
                }
            }, 2000);
            setTimeout(function () {
                if ($('#btn5').html() == '取消搜屍') {

                    $('#btn5').trigger('click');
                    clickButton('home');
                }
            }, 5 * 60 * 1000);
        });
    }
    /* 殺青龍 方法 :start */
    var Qname = '';     // 青龍惡人名稱
    var idArr = [];     // 幾個青龍人物的名稱數組

    var ALLNAME = null;     // 裝備名稱字符串集合
    var qinglong = null;    // 定時查看是否有青龍
    var QLtrigger = 0;
    function killQinglong(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();

        if (DomTxt == '殺青龍') {
            Dom.html('取消青龍');
            //myCareList = prompt("請輸入要監控的裝備", "明月,烈日,墨玄掌套,冰魄銀針,烈日棍,西毒蛇杖,碧磷鞭,月光寶甲衣,斬神刀,龍象掌套,暴雨梨花針,殘陽棍,伏虎杖,七星鞭,日光寶甲衣,龍皮至尊甲衣,碎片,斬龍寶鐲,小李飛刀");
            console.log(getTimes() + '開始殺青龍');
            myCareList = "紫芝,靈草,大還丹,狂暴丹,小還丹,乾坤再造丹,草,花,梅,木,菊,晚香玉,仙客來,雪英";
            if (kuafuNpc) {
                myCareList = "紫芝,靈草,大還丹,狂暴丹,小還丹,乾坤再造丹,碎片,草,花,梅,木,菊,晚香玉,仙客來,雪英";
            }

            if (Base.getCorrectText('4254240') && Base.correctQu() == '38') {
                myCareList = "斬龍寶靴,小李飛刀,碎片,草,花,梅,木,菊,晚香玉,仙客來,雪英";
            }

            if (Base.getCorrectText('4316804')) {
                myCareList = "天雷斷龍斧,斬龍寶鐲,碎片,草,花,梅,木,菊,晚香玉,仙客來,雪英";
            }

            if (Base.getCorrectText('4253282') && Base.correctQu() == '38') {

            }
            if (Base.getCorrectText('6759436') || Base.getCorrectText('6759458') || Base.getCorrectText('6759488') || Base.getCorrectText('6759492') || Base.getCorrectText('6759497') || Base.getCorrectText('6759498')) {
                myCareList = "星河劍,血屠刀,霹靂掌套,生死符,毒龍鞭,封魔杖,玉清棍,金絲寶甲衣,殘雪,明月,倚天劍,屠龍刀,墨玄掌套,冰魄銀針,烈日棍,西毒蛇杖,碧磷鞭,月光寶甲衣,";
            }

            QLtrigger = 1;
        } else {
            clearInterval(qinglong);
            clearTimeout(getNameTimeout);
            console.log(getTimes() + '停止殺青龍');
            QLtrigger = 0;
            Dom.html('殺青龍');
        }
    }
    // 獲取最近出現的一個青龍
    Array.prototype.max = function () {
        var index = 0;
        var max = this[0];
        var len = this.length;
        for (var i = 1; i < len; i++) {
            if (Number(this[i]) >= Number(max)) {
                max = this[i];
                index = i;
            }
        }
        return index;
    };
    //去位置
    async function goPlace(place) {

        switch (place) {
            case "書房":
                await goSfang();
                break;
            case "打鐵鋪子":
                await goTie();
                break;
            case "桑鄰藥鋪":
                await goYao();
                break;
            case "南市":
                await goNan();
                break;
            case "繡樓":
                await goXiu();
                break;
            case "北大街":
                await goNStreet();
                break;
            case "錢莊":
                await goQian();
                break;
            case "桃花別院":
                await goTao();
                break;
            case "雜貨鋪":
                await goZa();
                break;
            case "祠堂大門":
                await goCi();
                break;
            case "廳堂":
                await goTing();
                break;
        }
        await new Promise(function (resolve) {
            setTimeout(resolve, 500);
        });

        idArr = [];
        await killQ();
    };


    function QinglongMon() {
        this.dispatchMessage = function (b) {
            var type = b.get("type"), subType = b.get("subtype");

            if (type == "main_msg") {
                var msg = g_simul_efun.replaceControlCharBlank(b.get("msg"));

                // 無級別限制鏢車
                if (msg.indexOf(kuafuNpc + '花落雲') != '-1') {
                    console.log(getTimes() + msg);
                    Qname = kuafuNpc + '墟歸一';
                    var urlSplitArr = msg.split("href;0;")[1].split("");
                    var url = urlSplitArr[0];
                    go(url);
                    killQ();
                    return false;
                }
                //監控有人開幫派拼圖
                if (msg.match("寶藏地圖。") != null) {
                    go('clan bzmt puzz');
                    go('clan bzmt puzz');
                    go('clan bzmt puzz');
                    go('clan bzmt puzz');

                    var json_msg = '幫派地圖碎片已經開起';
                    var msg = '[CQ:at,qq=35994480] ' + json_msg.replace(/\n/g, "");
                    var json_str = '{"act":"101","groupid":"465355403","msg": "' + msg + '"}';
                    // if(webSocket)webSocket.send(json_str);
                    return;
                }

                if (msg.match("有人取代了你的連線") != null) {
                    isOnline = false;
                    console.log(getTimes() + '被踢了');
                }

                //監控 青龍
                if (QLtrigger == 1) {

                    // var m = msg.match(/榮威鏢局：\[36-40區\]花落雲/);
                    // if (msg.indexOf('[36-40區]花落雲') != '-1') {
                    //     console.log(getTimes() + msg);
                    //     Qname = '[36-40區]墟歸一';
                    //     var urlSplitArr = msg.split("href;0;")[1].split("");
                    //     var url = urlSplitArr[0];
                    //     go(url);
                    //     killQ();
                    //     return false;
                    // }

                    if (msg.indexOf('新區') != '-1') {
                        return;
                    }

                    if (msg.indexOf('戰利品') == '-1') {
                        return
                    }

                    if (isKuaFu()) {
                        if (msg.indexOf(kuafuNpc) == '-1') {
                            return false;
                        }
                    } else {
                        if (msg.indexOf('本大區') != '-1') {
                            return false;
                        }
                    }

                    // console.log(msg);
                    if (getDisName(msg)) {
                        return;
                    }

                    var pname = getPname(msg);

                    if (pname) {
                        console.log(getTimes() + msg);
                        if (msg.indexOf('href') < 0) return;
                        var urlSplitArr = msg.split("href;0;")[1].split("");
                        var url = urlSplitArr[0];
                        Qname = msg.split("組織：")[1].split("正在")[0];
                        getKuaFuNpc(msg);
                        if (Qname) {
                            if (isBigId()) {
                                go(url);
                                killQ();
                            } else {
                                var placeName = urlSplitArr[1];
                                goPlace(placeName);
                                console.log('還沒開通Vip只能步行過去');
                            }
                        }
                    }
                }
            }
        }
    }
    var qlMon = new QinglongMon;

    async function quickKill(href) {
        window.location.href = href;
        idArr = [];
        killQ();
    };
    function isKuaFu() {
        var isTure = false;
        if (kuafuNpc != '') {
            isTure = true;
        }
        return isTure;
    }
    function getKuaFuNpc(msg) {
        if (isKuaFu() && !killBadSwitch) {
            getNameFromPlace(msg);
        }
    }
    function getNameFromPlace(msg) {
        if (msg.indexOf('打鐵鋪子') != '-1') {
            Qname = '王鐵匠';
        } else if (msg.indexOf('桑鄰藥鋪') != '-1') {
            Qname = '楊掌櫃';
        } else if (msg.indexOf('書房') != '-1') {
            Qname = '柳繪心';
        } else if (msg.indexOf('南市') != '-1') {
            Qname = '客商';
        } else if (msg.indexOf('北大街') != '-1') {
            Qname = '賣花姑娘';
        } else if (msg.indexOf('錢莊') != '-1') {
            Qname = '劉守財';
        } else if (msg.indexOf('繡樓') != '-1') {
            Qname = '柳小花';
        } else if (msg.indexOf('祠堂大門') != '-1') {
            Qname = '朱老伯';
        } else if (msg.indexOf('廳堂') != '-1') {
            Qname = '方寡婦';
        } else if (msg.indexOf('雜貨鋪') != '-1') {
            Qname = '方老板';
        }
        Qname = kuafuNpc + Qname;
    }
    // 找到青龍目標
    var getNameTimeout = null;
    async function killQ() {
        idArr = [];
        var btn = $('.cmd_click3:contains(' + Qname + ')');
        if (btn.length == 0) {
            console.log('沒有找到' + Qname + '重新找');
            clearTimeout(getNameTimeout);
            getNameTimeout = setTimeout(function () {
                killQ();
            }, 300);
            return;
        }

        for (var i = btn.length - 1; i >= 0; i--) {
            var THISBTN = btn.eq(i);
            var txt = THISBTN.text();

            if (txt == Qname) {
                var npcText = null;
                if (isKuaFu() && !killBadSwitch) {
                    npcText = THISBTN.attr('onclick');
                } else {
                    if (killBadSwitch) {
                        npcText = THISBTN.attr('onclick');
                    } else {
                        npcText = THISBTN.prev().attr('onclick');
                    }
                }
                // console.log(npcText);
                var id = getId(npcText);
                idArr.push(id);
                break;
            }
        }
        var maxId = null;
        if (idArr.length > 1) {
            var newIdArr = [];
            for (var i = 0; i < idArr.length; i++) {
                if (killBadSwitch) {
                    newIdArr.push(idArr[i].replace('eren', ''));
                } else {
                    newIdArr.push(arr[i].replace('bad_target_', ''));
                }
            }
            maxId = newIdArr.max();
            maxId = idArr[maxId];
        } else {
            maxId = idArr[0];
        }
        console.log(getTimes() + maxId);
        if (maxId) {
            await killE(maxId);
        }
        clearInterval(clearNpcInterval);
        setTimeout(function () {
            if ($('#skill_1').length == 0) {
                console.log('沒有進入戰鬥，重新來過');
                clearTimeout(getNameTimeout);
                getNameTimeout = setTimeout(function () {
                    killQ();
                }, 100);
            } else {
                clearTimeout(getNameTimeout);
            }
        }, 300);
    };
    // 殺死青龍
    async function killE(name) {
        await clickButton('kill ' + name);
    };
    // 獲取惡人的id
    function getId(text) {
        var arr = text.split(',');
        var newArr = arr[0].split('(');
        var nowArr = newArr[1].split(' ');
        var str = nowArr[1];
        var id = str.substr(0, str.length - 1);
        return id;
    }
    // 判斷是不是關註的青龍裝備
    function getPname(txt) {
        var _name = '';
        ALLNAME = myCareList.split(',');
        $.each(ALLNAME, function (n, v) {
            if (txt.indexOf(v) != '-1') {
                _name = v;
                return false;
            }
        });
        return _name;
    };
    // 去書院
    async function goSyuan() {
        go('home');
        go('jh 1');
        go('go east');  // 廣場
        go('go south'); // 街口
        go('go west');  // 街道
        go('go south'); // 書院
    };
    // 去書房
    async function goSfang() {
        go('home');
        go('jh 1');
        go('go east');  // 廣場
        go('go north'); // 街道
        go('go east');  // 大門
        go('go east');  // 教練場
        go('go east');  // 大廳
        go('go east');  // 天井
        go('go north'); // 進書房
    };
    // 去藥店
    async function goYao() {
        go('home');
        go('jh 1');
        go('go east');  // 廣場
        go('go north'); // 街道
        go('go north'); // 街道
        go('go north'); // 街道
        go('go west'); // 進藥店
    };
    // 去鐵匠鋪
    async function goTie() {
        go('home');
        go('jh 1');
        go('go east');  // 廣場
        go('go north'); // 街道
        go('go north'); // 街道
        go('go west')
    };
    // 去南市
    async function goNan() {
        go('home');
        go('jh 2');
        go('go north');  // 南郊小路
        go('go north');  // 南門
        go('go east');  // 南市
    };
    // 去北大街
    async function goNStreet() {
        go('home');
        go('jh 2');
        go('go north');  // 南郊小路
        go('go north');  // 南門
        go('go north');  // 南大街
        go('go north');  // 洛川街
        go('go north');  // 中心鼓樓
        go('go north');  // 中州街
        go('go north');  // 北大街
    };
    // 去北大街
    async function goQian() {
        go('home');
        go('jh 2');
        go('go north');  // 南郊小路
        go('go north');  // 南門
        go('go north');  // 南大街
        go('go north');  // 洛川街
        go('go north');  // 中心鼓樓
        go('go north');  // 中州街
        go('go north');  // 北大街
        go('go east');   // 錢莊
    };
    // 去桃花別院
    async function goTao() {
        go('home');
        go('jh 2');
        go('go north');  // 南郊小路
        go('go north');  // 南門
        go('go north');  // 南大街
        go('go north');  // 洛川街
        go('go west');   // 銅駝巷
        go('go south');  // 桃花別院
    };
    // 去繡樓
    async function goXiu() {
        go('home');
        go('jh 2');
        go('go north');  // 南郊小路
        go('go north');  // 南門
        go('go north');  // 南大街
        go('go north');  // 洛川街
        go('go west');   // 銅駝巷
        go('go south');  // 桃花別院
        go('go west');   // 繡樓
    };
    // 去雜貨店
    async function goZa() {
        go('home');
        go('jh 3');
        go('go south');  // 青石街
        go('go south');  // 銀杏廣場
        go('go east');  // 雜貨店
    };
    // 去祠堂大門
    async function goCi() {
        go('home');
        go('jh 3');
        go('go south');  // 青石街
        go('go south');  // 銀杏廣場
        go('go west');   // 祠堂大門
    };
    // 去廳堂
    async function goTing() {
        go('home');
        go('jh 3');
        go('go south');  // 青石街
        go('go south');  // 銀杏廣場
        go('go west');   // 祠堂大門
        go('go north');   // 廳堂
    };

    // 音樂地址
    // var myAudio = new Audio();
    // myAudio.src = 'http://front.52yingzheng.com/work/2018/Q2/wap-xjpsc/audio/wait.mp3';
    // 播放音樂
    // function playMp3() {
    //     myAudio.play();
    // }
    /* 殺青龍 方法 :end */
    // 紅包
    var hongBaoInterval = null, chatInterval = null;
    function killQLHB(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();

        if (DomTxt == '搶紅包') {

            Dom.html('取消紅包');
            console.log(getTimes() + '開始搶紅包');
            clickButton('go_chat');
            $('#out .out').addClass('doneHongB');
            hongBaoInterval = setInterval(function () {
                getQLHBName();
            }, 200);
            chatInterval = setInterval(function () {
                // autoGetBack();
            }, 1 * 60 * 1000);
        } else {
            clearInterval(hongBaoInterval);
            clearInterval(chatInterval);
            console.log(getTimes() + '停止搶紅包');
            Dom.html('搶紅包');
        }
    }
    function getQLHBName() {
        var out = $('#out .out');
        out.each(function () {

            if ($(this).hasClass('doneHongB')) {
                return
            }

            $(this).addClass('doneHongB');

            var txt = $(this).text();

            if (txt.split('：').length > 1) {
                return;
            }
            var txt = $(this).text();

            if (txt.indexOf('試試新年手氣') != '-1') {
                var placeDom = $(this).find('a');
                if (placeDom.length > 0) {
                    // console.log(txt);
                    var href = placeDom.attr('href');
                    window.location.href = href;
                }
            }
        });
    }
    /* 玄鐵: start */
    function getXuanTie() {
        console.log(getTimes() + '冰火島玄鐵');
        go('home;jh 5;n;n;n;n;n;n;n;n;n;n;ne;chuhaigo;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;n;n;w;n;w;event_1_53278632;sousuo;sousuo;home'); //冰火島玄重鐵
    }

    function getBingyue() {
        console.log(getTimes() + '開始冰月');
        go('home;jh 14;w;n;n;n;n;event_1_32682066;event_1_35756630;kill bingyuegu_yueyihan;');
        setTimeout(function () {
            console.log(getTimes() + '開始打第二層');
            go('event_1_55319823;kill bingyuegu_xuanwujiguanshou');
            setTimeout(function () {
                go('event_1_17623983;event_1_6670148;kill bingyuegu_hundunyaoling;');
                setTimeout(function () {
                    go('s;kill bingyuegu_xianrenfenshen');
                }, 40000);
            }, 40000);
        }, 30000);
    }
    /* 玄鐵: end */
    /* 釣魚 方法 :start */
    var resFishingParas = 100;   // 系統裏默認最多挖50次
    var diaoyu_buttonName = 'diaoyu';
    var firstFishingParas = true;
    var resFishToday = 10;
    var lastFishMsg = "";
    var fishFunc = null;
    function fishingFirstFunc() {
        console.log("開始走向冰火島！");
        fishingFirstStage();
    };
    async function fishingFirstStage() {
        go('home');
        clearInterval(fishFunc);
        // 進入揚州
        go('jh 5');       // 進入章節
        go('go north');     // 南門大街
        go('go north');   // 十裏長街3
        go('go north');    // 十裏長街2
        go('go north');      // 十裏長街1
        go('go north');      // 中央廣場
        go('go north');      // 十裏長街4
        go('go north');      // 十裏長街5
        go('go north');      // 十裏長街6
        go('go north');      // 北門大街
        go('go north');      // 鎮淮門
        go('go northeast');     // 揚州港
        go('look_npc yangzhou_chuanyundongzhu');
        go('chuhai go');
        go('chuhaigo');
        await fishingSecondFunc();
    };
    // 挖魚餌參數

    async function fishingSecondFunc() {
        resFishToday = 10;
        console.log("開始挖魚餌、砍樹、釣魚！");
        fishingSecondStage();
    };
    async function fishingSecondStage() {
        // 到達冰火島
        go('go northwest');      // 熔巖灘頭
        go('go northwest');      // 海蝕涯
        go('go northwest');      // 峭壁崖道
        go('go north');      // 峭壁崖道
        go('go northeast');     // 炙溶洞口
        go('go northwest');      // 炙溶洞
        go('go west');     // 炙溶洞口
        go('go northwest');     // 熔巖小徑
        go('go east');     // 熔巖小徑
        go('go east');      // 石華林
        go('go east');      // 分島嶺
        go('go east');      // 跨谷石橋
        go('go east');     // 大平原
        go('go southeast');
        go('go east');
        // 開始釣魚
        resFishingParas = 100;
        firstFishingParas = true;
        $('#out2 .out2').remove();
        fishIt();
        lastFishMsg = "";
        if (!fishFunc) {
            fishFunc = setInterval(fishIt, 6000);
        }
    };
    async function fishIt() {
        // 釣魚之前先判斷上次結果
        // 判斷是否調出了東西
        go('golook_room');
        // console.log($('span:contains(突然)').text().slice(-9));

        if ($('span:contains(突然)').text().slice(-9) !== '沒有釣上任何東西。' && !firstFishingParas) {
            if (lastFishMsg !== $('span:contains(突然)').text()) { // 防止釣魚太快
                resFishToday = resFishToday - 1;
                console.log(getTimes() + '釣到一條魚，剩余釣魚次數：%d，剩余魚的條數:%d', resFishingParas, resFishToday);
            } else {
                // console.log("應該是釣魚太快了！");
            }
        }
        else {
            if (!firstFishingParas) {
                // console.log(getTimes() +'shit！什麽也沒釣到！');
            }
        }
        lastFishMsg = $('span:contains(突然)').text();
        if (resFishingParas > 0 && resFishToday > 0) {
            clickButton(diaoyu_buttonName);
            resFishingParas = resFishingParas - 1;
            console.log(getTimes() + '釣一次魚，剩余釣魚次數：%d，剩余魚的條數:%d', resFishingParas, resFishToday);
            firstFishingParas = false;
            var hasYue = $('span:contains(釣魚需要)').text().slice(-20);
            if (isContains(hasYue, '釣魚需要魚竿和魚餌，你沒有') && hasYue != '') {
                clearInterval(fishFunc);
                console.log(getTimes() + '魚竿或魚餌不足，停止釣魚！');
            }
            var hasDoneYue = $('span:contains(被你釣光了)');
            if (hasDoneYue.length > 0) {
                clearInterval(fishFunc);
                console.log(getTimes() + '釣夠10條了');
                if (Base.getCorrectText('4253282')) {
                    go('go west');
                    go('go north');
                    go('go north');
                    go('go west');
                    go('go north');
                    go('go west');
                    go('event_1_53278632');
                    setTimeout(function () {
                        go('sousuo');
                        go('sousuo');
                        go('home');
                    }, 5000);
                } else {
                    go('home');
                }
            }
        }
        else {
            clearInterval(fishFunc);
            if (Base.getCorrectText('4253282')) {
                go('go west');
                go('go north');
                go('go north');
                go('go west');
                go('go north');
                go('go west');
                go('event_1_53278632');
                setTimeout(function () {
                    go('sousuo');
                    go('sousuo');
                    go('home');
                }, 5000);
            } else {
                go('home');
            }
        }
    };
    /* 釣魚 方法 :end */
    function removeByValue(arr, val) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == val) {
                arr.splice(i, 1);
            }
        }
    }
    /* 37 || 38 設置  :start */
    var QIxiaListText = '郭濟；步驚鴻；火雲邪神；浪喚雨；吳縝；護竺；李宇飛；王蓉；龐統；風行騅；風南；逆風舞；狐蒼雁';
    var qixiaPlace = false;
    function doPlace() {
        if (Base.correctQu() == '38') {
            qixiaPlace = true;
        }
    }
    doPlace();
    /* 37 || 38 設置  :end */
    /* 比試奇俠  :start */
    var giveJinSwitch = 0;
    function give15Jin(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '去給15金') {
            Dom.html('在給15金');
            giveJinSwitch = 1;
            console.log(getTimes() + '設置給15金');
        } else if (DomTxt == '在給15金') {
            Dom.html('在給1金');
            giveJinSwitch = 2;
            console.log(getTimes() + '設置給1金');
        } else {
            giveJinSwitch = 0;
            Dom.html('去給15金');
            console.log(getTimes() + '不設置給金');
        }
    }
    var QixiaInfoList = [];
    var QixiaIdList = [
        {
            'name': '浪喚雨',
            'id': qixiaPlace ? 'langfuyu_1494082366_3948' : 'langfuyu_1493782694_7241',
        }, {
            'name': '王蓉',
            'id': qixiaPlace ? 'wangrong_1494083286_5287' : 'wangrong_1493782958_7306',
        }, {
            'name': '龐統',
            'id': qixiaPlace ? 'pangtong_1494084207_2639' : 'pangtong_1493783879_4255',
        }, {
            'name': '李宇飛',
            'id': qixiaPlace ? 'liyufei_1494085130_5201' : 'liyufei_1493784259_6382',
        }, {
            'name': '步驚鴻',
            'id': qixiaPlace ? 'bujinghong_1494086054_1635' : 'bujinghong_1493785173_9368',
        }, {
            'name': '風行騅',
            'id': qixiaPlace ? 'fengxingzhui_1499611328_9078' : 'fengxingzhui_1499611243_9634',
        }, {
            'name': '郭濟',
            'id': qixiaPlace ? 'guoji_1494086978_5597' : 'guoji_1493786081_9111',
        }, {
            'name': '吳縝',
            'id': qixiaPlace ? 'wuzhen_1499612120_4584' : 'wuzhen_1499612120_7351',
        }, {
            'name': '風南',
            'id': qixiaPlace ? 'fengnan_1494087902_8771' : 'fengnan_1493786990_415',
        }, {
            'name': '火雲邪神',
            'id': qixiaPlace ? 'huoyunxieshen_1494088826_8655' : 'huoyunxieshen_1493787900_1939',
        }, {
            'name': '逆風舞',
            'id': qixiaPlace ? 'niwufeng_1494089750_5660' : 'niwufeng_1493788811_7636',
        }, {
            'name': '狐蒼雁',
            'id': qixiaPlace ? 'hucangyan_1499613025_5192' : 'hucangyan_1499613026_2522',
        }, {
            'name': '護竺',
            'id': qixiaPlace ? 'huzhu_1499613932_2191' : 'huzhu_1499613933_1522',
        }, {
            'name': '八部龍將',
            'id': qixiaPlace ? 'babulongjiang_1521719740_7754' : 'babulongjiang_1521719730_537',
        }, {
            'name': '玄月研',
            'id': qixiaPlace ? 'xuanyueyan_1521600969_7372' : 'xuanyueyan_1521600969_8119',
        }, {
            'name': '狼居胥',
            'id': qixiaPlace ? 'langjuxu_1521715080_132' : 'langjuxu_1521715081_4559',
        }, {
            'name': '烈九州',
            'id': qixiaPlace ? 'liejiuzhou_1521716031_1449' : 'liejiuzhou_1521716024_5316',
        }, {
            'name': '穆妙羽',
            'id': qixiaPlace ? 'mumiaoyu_1521716956_979' : 'mumiaoyu_1521716949_346',
        }, {
            'name': '宇文無敵',
            'id': qixiaPlace ? 'yuwenwudi_1521717883_6285' : 'yuwenwudi_1521717874_9561',
        }, {
            'name': '李玄霸',
            'id': qixiaPlace ? 'lixuanba_1521718813_5916' : 'lixuanba_1521718806_7259',
        }, {
            'name': '風無痕',
            'id': qixiaPlace ? 'fengwuhen_1521720667_2927' : 'fengwuhen_1521720658_2332',
        }, {
            'name': '厲滄若',
            'id': qixiaPlace ? 'licangruo_1521721595_4149' : 'licangruo_1521721586_3467',
        }, {
            'name': '夏嶽卿',
            'id': qixiaPlace ? 'xiaqing_1521722519_8891' : 'xiaqing_1521722508_7807',
        }, {
            'name': '妙無心',
            'id': qixiaPlace ? 'miaowuxin_1521723444_5139' : 'miaowuxin_1521723435_7261',
        }, {
            'name': '巫夜姬',
            'id': qixiaPlace ? 'wuyeju_1521724375_3924' : 'wuyeju_1521724367_482',
        }
    ];
    function GetNewQiXiaList() {
        clickButton('open jhqx');
        setTimeout(function () {
            getQiXiaList();
        }, 2000);
    }

    function getQiXiaList() {
        var html = g_obj_map.get("msg_html_page");
        if (html == undefined) {
            setTimeout(function () { GetNewQiXiaList(); }, 3000);
        } else if (g_obj_map.get("msg_html_page").get("msg").match("江湖奇俠成長信息") == null) {
            setTimeout(function () { GetNewQiXiaList(); }, 3000);
        } else {
            console.log('獲取奇俠列表成功');
            var firstQiXiaList = formatQx(g_obj_map.get("msg_html_page").get("msg"));
            QixiaInfoList = SortNewQiXia(firstQiXiaList);
            giveSoreQiXiaListId();
            setQiXiaObj();
        }
    }
    // 給排序的奇俠列表賦予id
    function giveSoreQiXiaListId() {
        for (var i = 0; i < QixiaIdList.length; i++) {
            var name = QixiaIdList[i].name;
            for (var j = 0; j < QixiaInfoList.length; j++) {
                var cname = QixiaInfoList[j].name;
                if (cname == name) {
                    QixiaInfoList[j].id = QixiaIdList[i].id;
                }
            }
        }
    }
    function SortNewQiXia(firstQiXiaList) {//冒泡法排序
        var temp = {};
        var temparray = [];
        var newarray = [];
        for (var i = 0; i < firstQiXiaList.length; i++) {
            for (var j = 1; j < firstQiXiaList.length - i; j++) {
                if (parseInt(firstQiXiaList[j - 1]["degree"]) < parseInt(firstQiXiaList[j]["degree"])) {
                    temp = firstQiXiaList[j - 1];
                    firstQiXiaList[j - 1] = firstQiXiaList[j];
                    firstQiXiaList[j] = temp;
                }
            }
        }
        var tempcounter = 0;
        // console.log("奇俠好感度排序如下:");
        // console.log(firstQiXiaList);
        //首次排序結束 目前是按照由小到大排序。現在需要找出所有的超過25000 小於30000的奇俠。找到後 排序到最上面；
        var newList = [];
        for (var i = 0; i < firstQiXiaList.length; i++) {
            if (parseInt(firstQiXiaList[i]["degree"]) >= 30000) {
                temparray[tempcounter] = firstQiXiaList[i];
                tempcounter++;
                newarray.push(firstQiXiaList[i]);
            } else {
                newList.push(firstQiXiaList[i]);
            }
        }
        var firstInsertIndex = 4;
        for (var i = 0; i < newarray.length; i++) {
            newList.splice(firstInsertIndex, 0, newarray[i]);
            firstInsertIndex++;
        }
        return newList;
    }

    function getQiXiaObj(name) {
        var newArr = [];
        if (name) {
            for (var i = 0; i < QixiaInfoList.length; i++) {
                if (QixiaInfoList[i].name == name) {
                    qixiaObj = QixiaInfoList[i];
                }
            }
        }
    }

    var fightQixiaSwitch = true;
    var qixiaObj = {};

    function setQiXiaObj() {
        getQiXiaObj(loveYouxia);
        if (Base.getCorrectText('4254240')) {
            getQiXiaObj('夏嶽卿');
        }
        // 37區大號
        if (Base.getCorrectText('4253282')) {
            getQiXiaObj('夏嶽卿');
        }
        //38區 張三豐
        else if (Base.getCorrectText('4316804') && Base.correctQu() == '38') {
            getQiXiaObj('風行騅');
        }
        // 37區小號  西方失敗
        else if (Base.getCorrectText('4316804') && Base.correctQu() == '37') {
            getQiXiaObj('風行騅');
        } else {
            getQiXiaObj('狐蒼雁');
        }
        if (Base.getCorrectText('4254240')) {
            getQiXiaObj('狐蒼雁');
        }
        //38區 東方大俠
        if (Base.getCorrectText('4254240') && Base.correctQu() == '38') {
            getQiXiaObj('逆風舞');
        }
        // 37區東方1-6號
        if (isSixId()) {
            getQiXiaObj('狐蒼雁');
        }
        // 37區東方1-6號
        if (isSmallId()) {
            getQiXiaObj('狐蒼雁');
        }
        //37區 老王跟班
        if (Base.getCorrectText('7030223')) {
            getQiXiaObj('夏嶽卿');
        }
        // 37區 火狼
        if (Base.getCorrectText('7894304')) {
            getQiXiaObj('夏嶽卿');
        }
        //37區 王有財
        if (Base.getCorrectText('4219507')) {
            getQiXiaObj('夏嶽卿');
        }
        // console.log(qixiaObj);
    }

    var fightSkillInter = null,
        setFight = null,
        zhaobing = true;

    var mijingNum = 0;
    var isTalkQiXia = false;

    // 給奇俠1金錠
    var qixiaDone = false;
    var giveJinInterval = null;
    var giveQixiaSwitch = false;
    // 對話奇俠
    function talkToQixiaFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();

        if (DomTxt == '對話奇俠') {
            if (qixiaDone) {
                return;
            }
            isTalkQiXia = true;
            $('#out2 .out2').addClass('done');
            console.log(getTimes() + '開始對話' + qixiaObj.name + '！');
            $('#out2 .out2').addClass('doneQiXia1');
            giveQixiaSwitch = true;
            Dom.html('停止對話');
            giveJinQiXiaFunc();
        } else {
            isTalkQiXia = false;
            giveQixiaSwitch = false;
            clearInterval(giveJinInterval);
            Dom.html('對話奇俠');
        }
    }

    // 給奇俠1金
    function giveJinToQixiaFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '給奇俠金') {
            if (qixiaDone) {
                return;
            }
            $('#out2 .out2').addClass('done');
            console.log(getTimes() + '開始給奇俠金' + qixiaObj.name + '！');
            isTalkQiXia = false;
            giveQixiaSwitch = true;
            isInMijing = false;
            $('#out2 .out2').addClass('doneQiXia1');
            Dom.html('取消給金');
            // clickButton('open jhqx');
            GetNewQiXiaList();
            setTimeout(function () {
                giveJinQiXiaFunc();
            }, 4000);
        } else {
            giveQixiaSwitch = false;
            clearInterval(giveJinInterval);
            Dom.html('給奇俠金');
        }
    }

    function giveJinQiXiaFunc() {
        clearInterval(giveJinInterval);
        // clickButton('home');
        // clickButton('open jhqx');
        clickButton('find_task_road qixia ' + qixiaObj.index);
        if (giveQixiaSwitch) {
            setTimeout(function () {
                var QiXiaId = getNewQiXiaId(qixiaObj.name, qixiaObj.index);
                var qixiaName1 = QiXiaId.split('_')[0];
                // if(!isTalkQiXia){
                if (giveJinSwitch == 0) {
                    if (mijingNum == 3) {
                        eval("clickButton('auto_zsjd_" + qixiaName1 + "')");
                    } else if (mijingNum == 5) {
                        eval("clickButton('ask " + QiXiaId + "')");
                    } else if (mijingNum > 3) {
                        eval("clickButton('auto_zsjd20_" + qixiaName1 + "')");
                    } else {
                        eval("clickButton('ask " + QiXiaId + "')");
                    }
                } else if (giveJinSwitch == 1) {
                    eval("clickButton('auto_zsjd20_" + qixiaName1 + "')");
                } else if (giveJinSwitch == 2) {
                    eval("clickButton('auto_zsjd_" + qixiaName1 + "')");
                }
                // }else{
                //     eval("clickButton('ask " + QiXiaId + "')");
                // }

            }, 1000);
            giveJinInterval = setInterval(function () {
                geiJinQiXiaInfo();
            }, 1000);
        }
    }

    // 獲取面板信息
    var isInMijing = false;
    var doGiveSetTimeout = null;
    function geiJinQiXiaInfo() {
        var out = $('#out2 .out2');
        out.each(function () {
            if ($(this).hasClass('doneQiXia1')) {
                return
            }
            $(this).addClass('doneQiXia1');
            var txt = $(this).text();
            if (txt.indexOf('悄聲') != '-1') {
                mijingNum++;
                giveQixiaSwitch = false;
                var place = getQxiaQuestionPlace(txt);
                console.log(getTimes() + '這是第' + mijingNum + '次秘境，地址是：' + place);
                isInMijing = true;
                doGiveSetTimeout = setTimeout(function () {
                    $('#out2 .out2').addClass('doneQiXia1');
                    GoPlaceInfo(place);
                }, 1500);
            } else if (txt.indexOf('20/20') != '-1') {
                isInMijing = false;
                giveQixiaSwitch = false;
                isTalkQiXia = false;
                qixiaDone = true;
                clearInterval(giveJinInterval);
                clickButton('home');
                $('#btno18').html('給奇俠金');
                $('#btno23').html('對話奇俠');
            } else if (txt.indexOf('太多關於親密度') != '-1') {
                isInMijing = false;
                giveQixiaSwitch = false;
                isTalkQiXia = false;
                qixiaDone = true;
                clearInterval(giveJinInterval);
                clickButton('home');
                $('#btno18').html('給奇俠金');
                $('#btno23').html('對話奇俠');
            } else if (txt.indexOf('你搜索到一些') != '-1') {
                doGiveSetTimeout = setTimeout(function () {
                    clickBtnByName('仔細搜索');
                }, 2000);
            } else if (txt.indexOf('秘境') != '-1') {
                doGiveSetTimeout = setTimeout(function () {
                    clickBtnByName('仔細搜索');
                }, 2000);
            } else if (txt.indexOf('秘密地圖') != '-1') {
                doGiveSetTimeout = setTimeout(function () {
                    clickBtnByName('仔細搜索');
                }, 2000);
            } else if (txt.indexOf('你開始四處搜索') != '-1') {
                if (!hasSaoDan()) {
                    doGiveSetTimeout = setTimeout(function () {
                        isInMijing = false;
                        giveQixiaSwitch = true;
                        giveJinQiXiaFunc();
                    }, 1500);
                } else {
                    clickBtnByName('仔細搜索');
                    clickBtnByName('掃蕩');
                    doGiveSetTimeout = setTimeout(function () {
                        $('.cmd_click2').trigger('click');
                    }, 2000);
                }
            } else if (txt.indexOf('掃蕩成功') != '-1') {
                doGiveSetTimeout = setTimeout(function () {
                    isInMijing = false;
                    giveQixiaSwitch = true;
                    giveJinQiXiaFunc();
                }, 3000);
            } else if (txt.indexOf('今日親密度操作次數') != '-1') {
                if (!isInMijing) {
                    doGiveSetTimeout = setTimeout(function () {
                        if (giveQixiaSwitch) {
                            giveJinQiXiaFunc();
                        }
                    }, 2500);
                }
            } else if (txt.indexOf('此地圖還未解鎖') != '-1') {
                doGiveSetTimeout = setTimeout(function () {
                    giveQixiaSwitch = true;
                    isInMijing = false;
                    giveJinQiXiaFunc();
                }, 10000);
            } else if (txt.match(qixiaObj.name + "往(.*?)離開。")) {
                if (isInMijing) {
                    return;
                }
                clearTimeout(doGiveSetTimeout);
                doGiveSetTimeout = setTimeout(function () {
                    giveQixiaSwitch = true;
                    isInMijing = false;
                    giveJinQiXiaFunc();
                }, 3000);
            }
        });
    }
    // 是否可以掃蕩
    function hasSaoDan() {
        var btns = $('.cmd_click3');
        var hasSD = false;
        btns.each(function () {
            if ($(this).text() == '掃蕩') {
                hasSD = true;
            }
        });
        return hasSD;
    }
    // 掃蕩
    function clickBtnByName(txt) {
        var btns = $('.cmd_click3');
        btns.each(function () {
            if ($(this).text() == txt) {
                $(this).trigger('click');
                setTimeout(function () {
                    console.log(getTimes() + '點擊掃蕩');
                }, 1000);
            }
        });
    }
    // 打奇俠方法
    function startFightQixiaFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();

        if (DomTxt == '比試奇俠') {
            $('#out2 .out2').addClass('doneQiXia');
            fightQixiaSwitch = true;
            Dom.html('取消奇俠');
            fightQiXiaFunc();
        } else {
            fightQixiaSwitch = false;
            clearInterval(fightSkillInter);
            clearInterval(setFight);
            Dom.html('比試奇俠');
        }
    }

    //
    function getNewQiXiaId(name, QXindex) {
        console.log("開始尋找奇俠：" + name);
        var QX_ID = "";
        var npcindex = 0;
        var els = g_obj_map.get("msg_room").elements;
        for (var i = els.length - 1; i >= 0; i--) {
            if (els[i].key.indexOf("npc") > -1) {
                if (els[i].value.indexOf(",") > -1) {
                    var elsitem_ar = els[i].value.split(',');
                    if (elsitem_ar.length > 1 && elsitem_ar[1] == name) {
                        // console.log(elsitem_ar[0]);
                        npcindex = els[i].key;
                        QX_ID = elsitem_ar[0];
                    }
                }
            }
        }
        if (QX_ID) {
            return QX_ID
        }
        return false;

    }
    // 打奇俠定時器
    function fightQiXiaFunc() {
        clickButton('home');
        zhaobing = true;
        console.log(getTimes() + '開始比試' + qixiaObj.name + '！');
        clickButton('open jhqx');
        clickButton('find_task_road qixia ' + qixiaObj.index);
        if (fightQixiaSwitch) {
            setTimeout(function () {
                var QiXiaId = getNewQiXiaId(qixiaObj.name, qixiaObj.index);
                eval("clickButton('fight " + QiXiaId + "')");
                // eval("clickButton('fight " + qixiaObj.id + "')");
                // clickButton('fight huoyunxieshen_1493787900_1939');
                fightSkillInter = setInterval(function () {
                    getQiXiaInfo();
                }, 2000);
                setFight = setInterval(function () {
                    dofightQixiaSet();
                }, 2000);
            }, 1000);
        }
    }

    // 比試奇俠技能
    function dofightQixiaSet() {
        var skillArr = Base.mySkillLists.split('；');
        if (zhaobing) {
            skillArr = ['茅山道術', '天師滅神劍'];
        }

        if (hasDog().length > 0 && zhaobing) {
            clickButton('escape');
            return false;
        }
        var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
        var clickSkillSwitch = false;
        $.each(skillIdA, function (index, val) {
            var btn = $('#skill_' + val);
            var btnName = btn.text();
            for (var i = 0; i < skillArr.length; i++) {
                var skillName = skillArr[i];
                if (btnName == skillName) {
                    btn.find('button').trigger('click');
                    clickSkillSwitch = true;
                    break;
                }
            }
        });
        //clickButton('escape');
        if (!clickSkillSwitch && $('.cmd_skill_button').length > 0) {
            clickButton('playskill 1');
        }
    }

    // 獲取面板信息
    function getQiXiaInfo() {
        var out = $('#out2 .out2');
        out.each(function () {
            if ($(this).hasClass('doneQiXia')) {
                return
            }
            $(this).addClass('doneQiXia');
            var txt = $(this).text();
            if (txt.indexOf('悄聲') != '-1') {
                mijingNum++;
                fightQixiaSwitch = false;
                clearInterval(fightSkillInter);
                clearInterval(setFight);
                var place = getQxiaQuestionPlace(txt);
                console.log(getTimes() + '這是第' + mijingNum + '次秘境，地址是：' + place);
                setTimeout(function () {
                    fightQixiaSwitch = false;
                    clearInterval(fightSkillInter);
                    clearInterval(setFight);
                    GoPlaceInfo(place);
                }, 2000);
            } else if (txt.indexOf('20/20') != '-1') {
                fightQixiaSwitch = false;
                clearInterval(fightSkillInter);
                clearInterval(setFight);
            } else if (txt.indexOf('逃跑成功') != '-1') {
                //clearInterval(fightSkillInter);
                // clickButton('golook_room');
                clickButton('home');
                clickButton('open jhqx');
                clickButton('find_task_road qixia ' + qixiaObj.index);
                setTimeout(function () {
                    fightDog();
                }, 1000);
            } else if (txt.indexOf('今日親密度操作次數') != '-1') {
                // fightQixiaSwitch = false;
                clearInterval(fightSkillInter);
                clearInterval(setFight);
                setTimeout(function () {
                    fightQiXiaFunc();
                }, 1000);
            } else if (txt.match(qixiaObj.name + "往(.*?)離開。")) {
                clearInterval(fightSkillInter);
                clearInterval(setFight);
                setTimeout(function () {
                    fightQiXiaFunc();
                }, 1000);
            }
        });
    }
    // 比試狗
    function fightDog() {
        if (getDogNum().length > 0) {
            doFightDog();
        }
    }
    function doFightDog() {
        var nameArr = [];
        var nameDom = $('.cmd_click3');
        console.log(getTimes() + '開始打兵');
        nameDom.each(function () {
            var name = $(this).text();
            if (name == '金甲符兵' || name == '玄陰符兵') {
                var npcText = $(this).attr('onclick');
                var id = getId(npcText);
                clickButton('fight ' + id);
                zhaobing = false;
            }
        })
    }
    function getQxiaQuestionPlace(txt) {
        var correctPlace = txt.split('，')[0].split('去')[1];
        return correctPlace;
    }
    // east  west south north northeast northwest northsouth southeast
    //
    // northwest    north(上)     northeast
    //
    // west(左)                   east(右)
    //
    // southwest    south(下)     southeast
    //
    function GoPlaceInfo(place) {
        var placeNum = '';
        var placeSteps = [];
        switch (place) {
            case '盧崖瀑布':
                placeNum = '22';
                placeSteps = [{ 'road': 'north' }];
                break;
            case '戈壁':
                placeNum = '21';
                placeSteps = [{ 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '草原':
                placeNum = '26';
                placeSteps = [{ 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '天梯':
                placeNum = '24';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '觀景臺':
                placeNum = '24';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'road': 'east' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '啟母石':
                placeNum = '22';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'west' }, { 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '無極老姆洞':
                placeNum = '22';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'west' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '千尺幢':
                placeNum = '4';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '猢猻愁':
                placeNum = '4';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'event_1_91604710' }, { 'road': 'northwest' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '潭畔草地':
                placeNum = '4';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'event_1_91604710' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '臨淵石臺':
                placeNum = '4';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '玉女峰':
                placeNum = '4';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '長空棧道':
                placeNum = '4';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '山坳':
                placeNum = '1';
                placeSteps = [{ 'road': 'east' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '山溪畔':
                placeNum = '22';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'west' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'event_1_88705407' }, { 'road': 'south' }, { 'road': 'south' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '小洞天':
                placeNum = '24';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'road': 'east' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '觀景臺':
                placeNum = '24';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'road': 'east' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '雲步橋':
                placeNum = '24';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '桃花泉':
                placeNum = '3';
                placeSteps = [{ 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'northwest' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '碧水寒潭':
                placeNum = '18';
                placeSteps = [{ 'road': 'north' }, { 'road': 'northwest' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'northeast' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'road': 'east' }, { 'road': 'southeast' }, { 'road': 'southeast' }, { 'road': 'east' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '玉壁瀑布':
                placeNum = '16';
                placeSteps = [{ 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'east' }, { 'road': 'north' }, { 'road': 'east' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '湖邊':
                placeNum = '16';
                placeSteps = [{ 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'east' }, { 'road': 'north' }, { 'road': 'east' }, { 'event': 'event_1_5221690' }, { 'road': 'south' }, { 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '懸根松':
                placeNum = '9';
                placeSteps = [{ 'road': 'north' }, { 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '夕陽嶺':
                placeNum = '9';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '沙丘小洞':
                placeNum = '6';
                placeSteps = [{ 'event': 'event_1_98623439' }, { 'road': 'northeast' }, { 'road': 'north' }, { 'road': 'northeast' }, { 'road': 'northeast' }, { 'road': 'northeast' }, { 'event': 'event_1_97428251' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '寒水潭':
                placeNum = '20';
                placeSteps = [{ 'road': 'west' }, { 'road': 'west' }, { 'road': 'south' }, { 'road': 'east' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'southwest' }, { 'road': 'southwest' }, { 'road': 'south' }, { 'road': 'east' }, { 'road': 'southeast' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '青雲坪':
                placeNum = '13';
                placeSteps = [{ 'road': 'east' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'west' }, { 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '懸崖':
                placeNum = '20';
                placeSteps = [{ 'road': 'west' }, { 'road': 'west' }, { 'road': 'south' }, { 'road': 'east' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'southwest' }, { 'road': 'southwest' }, { 'road': 'south' }, { 'road': 'south' }, { 'road': 'east' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '奇槐坡':
                placeNum = '23';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '無名山峽谷':
                placeNum = '29';
                placeSteps = [{ 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }];
                break;
            case '危崖前':
                placeNum = '25';
                placeSteps = [{ 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
            case '九老洞':
                placeNum = '8';
                placeSteps = [{ 'road': 'west' }, { 'road': 'northwest' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'road': 'east' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'east' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'west' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'north' }, { 'road': 'northwest' }, { 'road': 'southwest' }, { 'road': 'west' }, { 'road': 'northwest' }, { 'road': 'west' }, { 'event': 'find_task_road secret' }, { 'event': 'secret_op1' }];
                break;
        }

        GoPlace(placeNum, placeSteps);
    };
    async function GoPlace(num, steps) {
        go('home');
        go('jh ' + num);
        //clickButton('go south');
        for (var i = 0; i < steps.length; i++) {
            for (var j in steps[i]) {
                if (j == 'road') {
                    go('go ' + steps[i][j]);
                } else if (j == 'event') {
                    go(steps[i][j]);
                }
            }
        }
    };
    /* 比試奇俠  :end */
    /* 撩奇俠  :start */

    function talkSelectQiXia() {
        GetNewQiXiaList();
        setTimeout(function () {
            startTalk();
        }, 3000);
    }
    function startTalk() {
        var isLive = true;
        for (var i = 0; i < 4; i++) {
            if (!QixiaInfoList[i].isOk) {
                isLive = false;
            }
        }
        if (!isLive) {
            console.log(getTimes() + '前4排名奇俠在浪中，請稍後再試');
            return;
        }
        for (var i = 0; i < QixiaInfoList.length; i++) {
            doTalkWithQixia(QixiaInfoList[i]);
        }
    }

    function doTalkWithQixia(info) {
        var maxLength = 5;
        var QiXiaId = info.id;

        if (!QiXiaId) {
            return;
        }
        if (!info.isOk) {
            console.log(getTimes() + '沒找到' + info.name + ",請稍後再試");
            return;
        }

        console.log(getTimes() + "開始撩" + info.name + "！");
        go('open jhqx');
        go('find_task_road qixia ' + info.index);

        for (var i = 0; i < maxLength; i++) {
            go('ask ' + QiXiaId);
        };
        go('home');
    }

    String.prototype.trim = function (char, type) { // 去除字符串中，頭部或者尾部的指定字符串
        if (char) {
            if (type == 'left') {
                return this.replace(new RegExp('^\\' + char + '+', 'g'), '');
            } else if (type == 'right') {
                return this.replace(new RegExp('\\' + char + '+$', 'g'), '');
            }
            return this.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
        }
        return this.replace(/^\s+|\s+$/g, '');
    };
    /* 撩奇俠  :end */
    /* 殺天劍  :start */
    var TianJianNPCList = [];
    var BaseTarget = [];
    var TianJianNPCList1 = ["農夫", "食蟲虻", "天劍谷衛士", "十夫長", "百夫長", "銀狼軍", "鐵狼軍", "金狼軍", "金狼將", "鎮擂斧將", "赤豹死士", "黑鷹死士", "金狼死士", "暗靈殺手", "暗靈旗主", "鎮谷神獸", "守谷神獸", "饕餮幼崽", "饕餮分身", "饕餮獸魂", "饕餮戰神", "鎮潭神獸", "守潭神獸", "螣蛇幼崽", "螣蛇分身", "螣蛇獸魂", "螣蛇戰神", "鎮山神獸", "守山神獸", "應龍幼崽", "應龍獸魂", "應龍分身", "應龍戰神", "鎮殿神獸", "守殿神獸", "幽熒幼崽", "幽熒獸魂", "幽熒分身", "幽熒戰神"];
    var killTianJianIntervalFunc = null;
    var currentNPCIndex = 0;
    var fubenWalkTimeer = false;
    function killTianJianTargetFunc(e) {
        var Dom = $(e.target);
        if (Dom.html() == '殺天劍') {
            Base.skills();
            Base.qi = 6;
            currentNPCIndex = 0;
            if (Base.tianjianTarget != '') {
                BaseTarget = Base.tianjianTarget.split(',');
            }
            TianJianNPCList = BaseTarget.concat(TianJianNPCList1);
            console.log("開始殺天劍目標NPC！");
            Dom.html('停天劍');
            killTianJianIntervalFunc = setInterval(killTianJian, 2000);
            fubenWalkTimeer = true;
            goInFuben();
            Jianshi.tianjian = 1;

        } else {
            console.log("停止殺天劍目標NPC！");
            Dom.html('殺天劍');
            clearInterval(killTianJianIntervalFunc);
            fubenWalkTimeer = false;
            Jianshi.tianjian = 0;
        }
    };
    async function killTianJian() {
        if ($('.cmd_skill_button').length > 0) {
            return false;
        }
        // clickButton('golook_room')
        lookRoow();
        if ($('span').text().slice(-7) == "不能殺這個人。") {
            currentNPCIndex = currentNPCIndex + 1;
            console.log("不能殺這個人！");
            //        return;
        }
        getTianJianTargetCode();
        if (genZhaoMode != '1') {
            setTimeout(doKillSet, 1000);
        }
        if ($('span:contains(勝利)').text().slice(-3) == '勝利！' || $('span:contains(戰敗了)').text().slice(-6) == '戰敗了...') {
            currentNPCIndex = 0;
            console.log(getTimes() + '殺人一次！');
            go('golook_room');
        }
    };
    async function lookRoow() {
        if ($('.cmd_change_line').length > 0) {
            go('golook_room');
        }
    };
    async function getTianJianTargetCode() {
        var peopleList = $(".cmd_click3");
        var thisonclick = null;
        var targetNPCListHere = [];
        var countor = 0;
        for (var i = 0; i < peopleList.length; i++) { // 從第一個開始循環
            // 打印 NPC 名字，button 名，相應的NPC名
            thisonclick = peopleList[i].getAttribute('onclick');
            var btnText = peopleList[i].innerText;
            if (btnText.indexOf('屍體') != '-1') {
                continue;
            }
            if (btnText.indexOf('離開') != '-1') {
                continue;
            }
            if (btnText.indexOf('接引') != '-1') {
                continue;
            }
            if (btnText.indexOf('骸骨') != '-1') {
                continue;
            }
            if (TianJianNPCList.contains(btnText)) {
                var targetCode = thisonclick.split("'")[1].split(" ")[1];
                //           console.log("發現NPC名字：" +  peopleList[i].innerText + "，代號：" + targetCode);
                targetNPCListHere[countor] = peopleList[i];
                countor = countor + 1;
            }
        }
        // targetNPCListHere 是當前場景所有滿足要求的NPC button數組
        if (currentNPCIndex >= targetNPCListHere.length) {
            currentNPCIndex = 0;
        }
        if (targetNPCListHere.length > 0) {
            thisonclick = targetNPCListHere[currentNPCIndex].getAttribute('onclick');
            var targetCode = thisonclick.split("'")[1].split(" ")[1];
            var neili = geForcePercent();
            if (neili < 50) {
                go('items use snow_wannianlingzhi');
                go('items use snow_wannianlingzhi');
                go('items use snow_wannianlingzhi');
            }
            console.log("準備殺目標NPC名字：" + targetNPCListHere[currentNPCIndex].innerText + "，代碼：" + targetCode + "，目標列表中序號：" + (currentNPCIndex));
            go('kill ' + targetCode); // 點擊殺人
            setTimeout(detectKillTianJianInfo, 1000); // 200 ms後獲取殺人情況，是滿了還是進入了
        }
    };
    function detectKillTianJianInfo() {
        var TianJianInfo = $('span').text();
        if (TianJianInfo.slice(-15) == "已經太多人了，不要以多欺少啊。") {
            currentNPCIndex = currentNPCIndex + 1;
        } else {
            currentNPCIndex = 0;
        }
    }
    Array.prototype.contains = function (obj) {
        var i = this.length;
        while (i--) {
            if (obj.indexOf(this[i]) != '-1') {
                return true;
            }
            // if (this[i] === obj) {
            //     return true;
            // }
        }
        return false;
    };
    var finishFubenOneline = false;
    var finishFubenLeft = false;
    var finishFubenRight = false;

    function goInFuben() {
        // 在副本1
        if (hasTargetNameIndex('屍體')) {
            // 完成副本
            if (finishFubenOneline) {
                if ($(".cmd_click_exits_s")[0]) { // 下邊
                    clickButton('go south');
                    finishFubenOneline = false;
                    finishFubenLeft = false;
                    finishFubenRight = false;
                } else {
                    if ($(".cmd_click_exits_w")[0] && $(".cmd_click_exits_e")[0] && !$(".cmd_click_exits_s")[0]) { // 有左右無下時
                        clickButton('go west');
                    } else if ($(".cmd_click_exits_w")[0] && !$(".cmd_click_exits_e")[0]) { // 單左
                        clickButton('go west');
                    } else if (!$(".cmd_click_exits_w")[0] && $(".cmd_click_exits_e")[0]) { // 有左右時
                        clickButton('go east');
                    }
                }
            } else {
                // 沒完成左邊
                if (!finishFubenLeft) {
                    if ($(".cmd_click_exits_w")[0] && $(".cmd_click_exits_e")[0]) { // 有左右時
                        clickButton('go west');
                    }
                    if (!$(".cmd_click_exits_w")[0] && $(".cmd_click_exits_e")[0]) { // 有左右時
                        clickButton('go east');
                        finishFubenLeft = true;
                    }
                    //完成左邊
                } else {
                    //沒完成右邊
                    if (!finishFubenRight) {
                        if ($(".cmd_click_exits_w")[0] && $(".cmd_click_exits_e")[0]) { // 有左右時
                            clickButton('go east');
                        }
                        if ($(".cmd_click_exits_w")[0] && !$(".cmd_click_exits_e")[0]) { // 有左右時
                            clickButton('go west');
                            finishFubenRight = true;
                        }
                        //完成右邊
                    } else {
                        if ($(".cmd_click_exits_w")[0] && $(".cmd_click_exits_e")[0]) { // 有左右時
                            clickButton('go west');
                            finishFubenOneline = true;
                        }
                    }
                }
            }
        }
        if (fubenWalkTimeer) {
            setTimeout(function () {
                // goInFuben()
            }, 1000);
        };
    }
    function checkInFubenOne() {
        var npcArr = ["食蟲虻", "鎮谷神獸", "守谷神獸", "饕餮幼崽", "饕餮分身", "饕餮獸魂", "饕餮戰神", "鎮潭神獸", "守潭神獸", "螣蛇幼崽", "螣蛇分身", "螣蛇獸魂", "螣蛇戰神", "鎮山神獸", "守山神獸", "應龍幼崽", "應龍獸魂", "應龍分身", "應龍戰神", "鎮殿神獸", "守殿神獸", "幽熒幼崽", "幽熒獸魂", "幽熒分身", "幽熒戰神"];
        var npcBtn = $('.cmd_click3');
        var hasName = false;
        for (var i = 0; i < npcArr.length; i++) {
            var hasTarget = hasTargetName(npcArr[i]);
            if (hasTarget) { hasName = true }
        };
        return hasName
    }
    function hasTargetNameIndex(name) {
        var hasName = false;
        var peopleList = $(".cmd_click3");
        peopleList.each(function () {
            var peopleName = $(this).text();
            if (peopleName.indexOf(name) >= 0) {
                hasName = true;
            }
        });
        return hasName
    }
    /* 殺天劍  :end */
    /* 餵鱷魚+俠客島  :start */
    function newGetXiaKe() {
        goXiaKe();
    };
    async function goXiaKe() {
        go('home');
        go('jh 36');
        go('yell');
        setTimeout(function () {
            goRead();
        }, 25000);
    };
    async function goRead() {
        go('go east');
        go('go northeast');
        go('go northeast');
        go('go northeast');
        go('go east');
        go('go east');
        go('go east');
        // clickButton('event_1_9179222');     // 進入側廳
        setTimeout(function () {
            clickBtn('進入側廳');
            readBoard();
        }, 3000);
    };
    async function readBoard() {
        go('go east');
        // clickButton('event_1_11720543');    // 觀閱
        setTimeout(function () {
            clickBtn('觀閱');
            goJump();
        }, 3000);
    };
    async function goJump() {
        go('go west');
        go('go north');
        go('go east');
        go('go east');
        go('go south');
        go('go east');
        // clickButton('event_1_44025101');    // 跳下去
        setTimeout(function () {
            clickBtn('跳下去');
            setTimeout(function () {
                isCorrectJump();
            }, 2000);
        }, 3000);
    };
    async function goBackXiaKe() {
        go('go northwest');
        go('go west');
        go('go southwest');
        go('go west');
        go('go north');
        go('go north');
        go('go north');
        go('go west');
        go('go west');
        go('go south');
        go('go west');
        go('go northwest');
        go('go west');
        go('go east');
        go('go northeast');
        go('go northeast');
        go('go northeast');
        go('go east');
        go('go east');
        go('go east');
        go('go east');
        go('go east');
        go('go south');
        go('go east');
        setTimeout(function () {
            clickBtn('跳下去');
            setTimeout(function () {
                isCorrectJump();
            }, 2000);
        }, 2000);

    };
    async function isCorrectJump() {
        var clickName = getClickName('進入甬道');
        if (clickName) {
            clickBtn('進入甬道');
            setTimeout(function () {
                clickButtonAsync('go east');
                clickButtonAsync('go east');
                clickButtonAsync('go south');
                setTimeout(function () {
                    clickBtn('領悟');
                    clickButtonAsync('home');
                }, 2000);
            }, 2000);
        } else {
            setTimeout(function () {
                clickBtn('遊出去');
            }, 2000);
            setTimeout(function () {
                goBackXiaKe();
            }, 4000);
        }
    };
    function clickBtn(name) {
        var btn = $('.cmd_click3');
        btn.each(function () {
            var _name = $(this).text();
            if (_name == name) {
                $(this).trigger('click');
            }
        })
    }
    function getClickName(name) {
        var nameSwitch = false;
        var btn = $('.cmd_click3');
        btn.each(function () {
            var _name = $(this).text();
            if (_name == name) {
                nameSwitch = true;
            }
        });
        return nameSwitch;
    }
    /* 餵鱷魚+俠客島  :end */
    /* 試劍  :start */
    var zdskill111 = Base.mySkillLists;
    var killDrunkIntervalFunc1 = null;
    function CheckIn1(e) {
        go('home');
        window.Dom = $(e.target);
        if (Dom.html() == "試劍") {
            console.log(getTimes() + '開始試劍');
            Dom.html("停止");
            go('swords report go');
            go('swords');
            go('swords select_member heimuya_dfbb');   // 東方
            go('swords select_member qingcheng_mudaoren');   //木道人
            go('swords select_member tangmen_madam');  //歐陽敏
            go('swords fight_test go');
            killDrunkIntervalFunc1 = setInterval(killDrunMan1, 2000);//code
        }
        else {
            console.log(getTimes() + '停止試劍');
            Dom.html("試劍");
            clearInterval(killDrunkIntervalFunc1)
        }
    }
    function isContains1(str, substr) {
        if (!str) {
            return -1;
        }
        return str.indexOf(substr) >= 0;
    }
    function killDrunMan1() {
        var doneShijian = $('span:contains(你今天試劍次數已達限額)');
        if (doneShijian.length > 0) {
            Dom.html("試劍");
            clearInterval(killDrunkIntervalFunc1);
            return;
        } else {
            clickButton('swords fight_test go');
            doKillSet();
        }
    }
    /* 試劍  :end */
    /* 答題  :start */
    var answerQuestionsInterval = null;
    var QuestAnsLibs = {
        "首次通過喬陰縣不可以獲得那種獎勵？": "a",
        "“白玉牌樓”場景是在哪個地圖上？": "c",
        "“百龍山莊”場景是在哪個地圖上？": "b",
        "“冰火島”場景是在哪個地圖上？": "b",
        "“常春島渡口”場景是在哪個地圖上？": "c",
        "“跪拜坪”場景是在哪個地圖上？": "b",
        "“翰墨書屋”場景是在哪個地圖上？": "c",
        "“花海”場景是在哪個地圖上？": "a",
        "“留雲館”場景是在哪個地圖上？": "b",
        "“日月洞”場景是在哪個地圖上？": "b",
        "“蓉香榭”場景是在哪個地圖上？": "c",
        "“三清殿”場景是在哪個地圖上？": "b",
        "“三清宮”場景是在哪個地圖上？": "c",
        "“雙鶴橋”場景是在哪個地圖上？": "b",
        "“無名山腳”場景是在哪個地圖上？": "d",
        "“伊犁”場景是在哪個地圖上？": "b",
        "“鷹記商號”場景是在哪個地圖上？": "d",
        "“迎梅客棧”場景是在哪個地圖上？": "d",
        "“子午樓”場景是在哪個地圖上？": "c",
        "8級的裝備摹刻需要幾把刻刀": "a",
        "NPC公平子在哪一章地圖": "a",
        "璦倫在晚月莊的哪個場景": "b",
        "安惜邇是在那個場景": "c",
        "黯然銷魂掌有多少招式？": "c",
        "黯然銷魂掌是哪個門派的技能": "a",
        "八卦迷陣是哪個門派的陣法？": "b",
        "八卦迷陣是那個門派的陣法": "a",
        "白金戒指可以在哪位那裏獲得？": "b",
        "白金手鐲可以在哪位那裏獲得？": "a",
        "白金項鏈可以在哪位那裏獲得？": "b",
        "白蟒鞭的傷害是多少？": "a",
        "白駝山第一位要拜的師傅是誰": "a",
        "白銀寶箱禮包多少元寶一個": "d",
        "白玉腰束是腰帶類的第幾級裝備？": "b",
        "拜師風老前輩需要正氣多少": "b",
        "拜師老毒物需要蛤蟆功多少級": "a",
        "拜師鐵翼需要多少內力": "b",
        "拜師小龍女需要容貌多少": "c",
        "拜師張三豐需要多少正氣": "b",
        "包家將是哪個門派的師傅": "a",
        "包拯在哪一章": "d",
        "寶石合成一次需要消耗多少顆低級寶石？": "c",
        "寶玉帽可以在哪位那裏獲得？": "d",
        "寶玉鞋擊殺哪個可以獲得": "a",
        "寶玉鞋在哪獲得": "a",
        "暴雨梨花針的傷害是多少？": "c",
        "北鬥七星陣是第幾個的組隊副本": "c",
        "北冥神功是哪個門派的技能": "b",
        "北嶽殿神像後面是哪位": "b",
        "匕首加什麽屬性": "c",
        "碧海潮生劍在哪位師傅處學習": "a",
        "碧磷鞭的傷害是多少？": "b",
        "鏢局保鏢是掛機裏的第幾個任務": "d",
        "冰魄銀針的傷害是多少？": "b",
        "病維摩拳是哪個門派的技能": "b",
        "不可保存裝備下線多久會消失": "c",
        "不屬於白駝山的技能是什麽": "b",
        "滄海護腰可以鑲嵌幾顆寶石": "d",
        "滄海護腰是腰帶類的第幾級裝備？": "a",
        "藏寶圖在哪個NPC處購買": "a",
        "藏寶圖在哪個處購買": "b",
        "藏寶圖在哪裏那裏買": "a",
        "草帽可以在哪位那裏獲得？": "b",
        "成功易容成異性幾次可以領取易容成就獎": "b",
        "成長計劃第七天可以領取多少元寶？": "d",
        "成長計劃六天可以領取多少銀兩？": "d",
        "成長計劃需要多少元寶方可購買？": "a",
        "城裏打擂是掛機裏的第幾個任務": "d",
        "城裏抓賊是掛機裏的第幾個任務": "b",
        "充值積分不可以兌換下面什麽物品": "d",
        "出生選武學世家增加什麽": "a",
        "闖樓第幾層可以獲得稱號“藏劍樓護法”": "b",
        "闖樓第幾層可以獲得稱號“藏劍樓樓主”": "d",
        "闖樓第幾層可以獲得稱號“藏劍樓長老”": "c",
        "闖樓每多少層有稱號獎勵": "a",
        "春風快意刀是哪個門派的技能": "b",
        "春秋水色齋需要多少殺氣才能進入": "d",
        "從哪個處進入跨服戰場": "a",
        "摧心掌是哪個門派的技能": "a",
        "達摩在少林哪個場景": "c",
        "達摩杖的傷害是多少？": "d",
        "打開引路蜂禮包可以得到多少引路蜂？": "b",
        "打排行榜每天可以完成多少次？": "a",
        "打土匪是掛機裏的第幾個任務": "c",
        "打造刻刀需要多少個玄鐵": "a",
        "打坐增長什麽屬性": "a",
        "大保險卡可以承受多少次死亡後不降技能等級？": "b",
        "大乘佛法有什麽效果": "d",
        "大旗門的修養術有哪個特殊效果": "a",
        "大旗門的雲海心法可以提升哪個屬性": "c",
        "大招寺的金剛不壞功有哪個特殊效果": "a",
        "大招寺的鐵布衫有哪個特殊效果": "c",
        "當日最低累積充值多少元即可獲得返利？": "b",
        "刀法基礎在哪掉落": "a",
        "倒亂七星步法是哪個門派的技能": "d",
        "等級多少才能在世界頻道聊天？": "c",
        "第一個副本需要多少等級才能進入": "d",
        "貂皮鬥篷是披風類的第幾級裝備？": "b",
        "丁老怪是哪個門派的終極師傅": "a",
        "丁老怪在星宿海的哪個場景": "b",
        "東方教主在魔教的哪個場景": "b",
        "鬥轉星移是哪個門派的技能": "a",
        "鬥轉星移陣是哪個門派的陣法": "a",
        "毒龍鞭的傷害是多少？": "a",
        "毒物陣法是哪個門派的陣法": "b",
        "獨孤求敗有過幾把劍？": "d",
        "獨龍寨是第幾個組隊副本": "a",
        "讀書寫字301-400級在哪裏買書": "c",
        "讀書寫字最高可以到多少級": "b",
        "端茶遞水是掛機裏的第幾個任務": "b",
        "斷雲斧是哪個門派的技能": "a",
        "鍛造一把刻刀需要多少玄鐵碎片鍛造？": "c",
        "鍛造一把刻刀需要多少銀兩？": "a",
        "兌換易容面具需要多少玄鐵碎片": "c",
        "多少消費積分換取黃金寶箱": "a",
        "多少消費積分可以換取黃金鑰匙": "b",
        "翻譯梵文一次多少銀兩": "d",
        "方媃是哪個門派的師傅": "b",
        "飛仙劍陣是哪個門派的陣法": "b",
        "風老前輩在華山哪個場景": "b",
        "風泉之劍加幾點悟性": "c",
        "風泉之劍可以在哪位那裏獲得？": "b",
        "風泉之劍在哪裏獲得": "d",
        "瘋魔杖的傷害是多少？": "b",
        "伏虎杖的傷害是多少？": "c",
        "副本完成後不可獲得下列什麽物品": "b",
        "副本一次最多可以進幾人": "a",
        "副本有什麽獎勵": "d",
        "富春茶社在哪一章": "c",
        "改名字在哪改？": "d",
        "丐幫的絕學是什麽": "a",
        "丐幫的輕功是哪個": "b",
        "幹苦力是掛機裏的第幾個任務": "a",
        "鋼絲甲衣可以在哪位那裏獲得？": "d",
        "高級乾坤再造丹加什麽": "b",
        "高級乾坤再造丹是增加什麽的？": "b",
        "高級突破丹多少元寶一顆": "d",
        "割鹿刀可以在哪位npc那裏獲得？": "b",
        "葛倫在大招寺的哪個場景": "b",
        "根骨能提升哪個屬性": "c",
        "功德箱捐香火錢有什麽用": "a",
        "功德箱在雪亭鎮的哪個場景？": "c",
        "購買新手進階禮包在掛機打坐練習上可以享受多少倍收益？": "b",
        "孤獨求敗稱號需要多少論劍積分兌換": "b",
        "孤兒出身增加什麽": "d",
        "古燈大師是哪個門派的終極師傅": "c",
        "古燈大師在大理哪個場景": "c",
        "古墓多少級以後才能進去？": "d",
        "寒玉床睡覺修煉需要多少點內力值": "c",
        "寒玉床睡覺一次多久": "c",
        "寒玉床需要切割多少次": "d",
        "寒玉床在哪裏切割": "a",
        "寒玉床在那個地圖可以找到？": "a",
        "黑狗血在哪獲得": "b",
        "黑水伏蛟可以在哪位npc那裏獲得？": "c",
        "紅寶石加什麽屬性": "b",
        "洪幫主在洛陽哪個場景": "c",
        "虎皮腰帶是腰帶類的第幾級裝備？": "a",
        "花不為在哪一章": "a",
        "鐵手鐲 可以在哪位npc那裏獲得？": "a",
        "花花公子在哪個地圖": "a",
        "華山村王老二掉落的物品是什麽": "a",
        "華山施戴子掉落的物品是什麽": "b",
        "華山武器庫從哪個NPC進": "d",
        "黃寶石加什麽屬性": "c",
        "黃島主在桃花島的哪個場景": "d",
        "黃袍老道是哪個門派的師傅": "c",
        "積分商城在雪亭鎮的哪個場景？": "c",
        "技能柳家拳誰教的？": "a",
        "技能數量超過了什麽消耗潛能會增加": "b",
        "嫁衣神功是哪個門派的技能": "b",
        "劍冢在哪個地圖": "a",
        "街頭賣藝是掛機裏的第幾個任務": "a",
        "金彈子的傷害是多少？": "a",
        "金剛不壞功有什麽效果": "a",
        "金剛杖的傷害是多少？": "a",
        "金戒指可以在哪位npc那裏獲得？": "d",
        "金手鐲可以在哪位npc那裏獲得？": "b",
        "金絲鞋可以在哪位npc那裏獲得？": "b",
        "金項鏈可以在哪位npc那裏獲得？": "d",
        "金玉斷雲是哪個門派的陣法": "a",
        "錦緞腰帶是腰帶類的第幾級裝備？": "a",
        "精鐵棒可以在哪位那裏獲得？": "d",
        "九區服務器名稱": "d",
        "九陽神功是哪個門派的技能": "c",
        "九陰派梅師姐在星宿海哪個場景": "a",
        "軍營是第幾個組隊副本": "b",
        "開通VIP月卡最低需要當天充值多少元方有購買資格？": "a",
        "可以召喚金甲伏兵助戰是哪個門派？": "a",
        "客商在哪一章": "b",
        "孔雀氅可以鑲嵌幾顆寶石": "b",
        "孔雀氅是披風類的第幾級裝備？": "c",
        "枯榮禪功是哪個門派的技能": "a",
        "跨服是星期幾舉行的": "b",
        "跨服天劍谷每周六幾點開啟": "a",
        "跨服需要多少級才能進入": "c",
        "跨服在哪個場景進入": "c",
        "蘭花拂穴手是哪個門派的技能": "a",
        "藍寶石加什麽屬性": "a",
        "藍止萍在哪一章": "c",
        "藍止萍在晚月莊哪個小地圖": "b",
        "老毒物在白馱山的哪個場景": "b",
        "老頑童在全真教哪個場景": "b",
        "蓮花掌是哪個門派的技能": "a",
        "烈火旗大廳是那個地圖的場景": "c",
        "烈日項鏈可以鑲嵌幾顆寶石": "c",
        "林祖師是哪個門派的師傅": "a",
        "靈蛇杖法是哪個門派的技能": "c",
        "淩波微步是哪個門派的技能": "b",
        "淩虛鎖雲步是哪個門派的技能": "b",
        "領取消費積分需要尋找哪個NPC？": "c",
        "鎏金縵羅是披風類的第幾級裝備？": "d",
        "柳淳風在哪一章": "c",
        "柳淳風在雪亭鎮哪個場景": "b",
        "柳文君所在的位置": "a",
        "六脈神劍是哪個門派的絕學": "a",
        "陸得財是哪個門派的師傅": "c",
        "陸得財在喬陰縣的哪個場景": "a",
        "論劍每天能打幾次": "a",
        "論劍是每周星期幾": "c",
        "論劍是什麽時間點正式開始": "a",
        "論劍是星期幾進行的": "c",
        "論劍是星期幾舉行的": "c",
        "論劍輸一場獲得多少論劍積分": "a",
        "論劍要在晚上幾點前報名": "b",
        "論劍在周幾進行？": "b",
        "論劍中步玄派的師傅是哪個": "a",
        "論劍中大招寺第一個要拜的師傅是誰": "c",
        "論劍中古墓派的終極師傅是誰": "d",
        "論劍中花紫會的師傅是誰": "c",
        "論劍中青城派的第一個師傅是誰": "a",
        "論劍中青城派的終極師傅是誰": "d",
        "論劍中逍遙派的終極師傅是誰": "c",
        "論劍中以下不是峨嵋派技能的是哪個": "b",
        "論劍中以下不是華山派的人物的是哪個": "d",
        "論劍中以下哪個不是大理段家的技能": "c",
        "論劍中以下哪個不是大招寺的技能": "b",
        "論劍中以下哪個不是峨嵋派可以拜師的師傅": "d",
        "論劍中以下哪個不是丐幫的技能": "d",
        "論劍中以下哪個不是丐幫的人物": "a",
        "論劍中以下哪個不是古墓派的的技能": "b",
        "論劍中以下哪個不是華山派的技能的": "d",
        "論劍中以下哪個不是明教的技能": "d",
        "論劍中以下哪個不是魔教的技能": "a",
        "論劍中以下哪個不是魔教的人物": "d",
        "論劍中以下哪個不是全真教的技能": "d",
        "論劍中以下哪個不是是晚月莊的技能": "d",
        "論劍中以下哪個不是唐門的技能": "c",
        "論劍中以下哪個不是唐門的人物": "c",
        "論劍中以下哪個不是鐵雪山莊的技能": "d",
        "論劍中以下哪個不是鐵血大旗門的技能": "c",
        "論劍中以下哪個是大理段家的技能": "a",
        "論劍中以下哪個是大招寺的技能": "b",
        "論劍中以下哪個是丐幫的技能": "b",
        "論劍中以下哪個是花紫會的技能": "a",
        "論劍中以下哪個是華山派的技能的": "a",
        "論劍中以下哪個是明教的技能": "b",
        "論劍中以下哪個是青城派的技能": "b",
        "論劍中以下哪個是唐門的技能": "b",
        "論劍中以下哪個是天邪派的技能": "b",
        "論劍中以下哪個是天邪派的人物": "a",
        "論劍中以下哪個是鐵雪山莊的技能": "c",
        "論劍中以下哪個是鐵血大旗門的技能": "b",
        "論劍中以下哪個是鐵血大旗門的師傅": "a",
        "論劍中以下哪個是晚月莊的技能": "a",
        "論劍中以下哪個是晚月莊的人物": "a",
        "論劍中以下是峨嵋派技能的是哪個": "a",
        "論語在哪購買": "a",
        "駱雲舟在哪一章": "c",
        "駱雲舟在喬陰縣的哪個場景": "b",
        "落英神劍掌是哪個門派的技能": "b",
        "呂進在哪個地圖": "a",
        "綠寶石加什麽屬性": "c",
        "漫天花雨匕在哪獲得": "a",
        "茅山的絕學是什麽": "b",
        "茅山的天師正道可以提升哪個屬性": "d",
        "茅山可以招幾個寶寶": "c",
        "茅山派的輕功是什麽": "b",
        "茅山天師正道可以提升什麽": "c",
        "茅山學習什麽技能招寶寶": "a",
        "茅山在哪裏拜師": "c",
        "每次合成寶石需要多少銀兩？": "a",
        "每個玩家最多能有多少個好友": "b",
        "vip每天不可以領取什麽": "b",
        "每天的任務次數幾點重置": "d",
        "每天分享遊戲到哪裏可以獲得20元寶": "a",
        "每天能挖幾次寶": "d",
        "每天能做多少個謎題任務": "a",
        "每天能做多少個師門任務": "c",
        "每天微信分享能獲得多少元寶": "d",
        "每天有幾次試劍": "b",
        "每天在線多少個小時即可領取消費積分？": "b",
        "每突破一次技能有效系數加多少": "a",
        "密宗伏魔是哪個門派的陣法": "c",
        "滅絕師太在第幾章": "c",
        "滅絕師太在峨眉山哪個場景": "a",
        "明教的九陽神功有哪個特殊效果": "a",
        "明月帽要多少刻刀摩刻？": "a",
        "摹刻10級的裝備需要摩刻技巧多少級": "b",
        "摹刻烈日寶鏈需要多少級摩刻技巧？": "c",
        "摹刻揚文需要多少把刻刀？": "a",
        "魔鞭訣在哪裏學習": "d",
        "魔教的大光明心法可以提升哪個屬性": "d",
        "莫不收在哪一章": "a",
        "墨磷腰帶是腰帶類的第幾級裝備？": "d",
        "木道人在青城山的哪個場景": "b",
        "慕容家主在慕容山莊的哪個場景": "a",
        "慕容山莊的鬥轉星移可以提升哪個屬性": "d",
        "哪個NPC掉落拆招基礎": "a",
        "哪個處可以捏臉": "a",
        "哪個分享可以獲得20元寶": "b",
        "哪個技能不是魔教的": "d",
        "哪個門派拜師沒有性別要求": "d",
        "哪個npc屬於全真七子": "b",
        "哪樣不能獲得玄鐵碎片": "c",
        "能增容貌的是下面哪個技能": "a",
        "捏臉需要花費多少銀兩？": "c",
        "捏臉需要尋找哪個NPC？": "a",
        "歐陽敏是哪個門派的？": "b",
        "歐陽敏是哪個門派的師傅": "b",
        "歐陽敏在哪一章": "a",
        "歐陽敏在唐門的哪個場景": "c",
        "排行榜最多可以顯示多少名玩家？": "a",
        "逄義是在那個場景": "a",
        "披星戴月是披風類的第幾級裝備？": "d",
        "劈靂拳套有幾個鑲孔": "a",
        "霹靂掌套的傷害是多少": "b",
        "辟邪劍法是哪個門派的絕學技能": "a",
        "辟邪劍法在哪學習": "b",
        "婆蘿蜜多心經是哪個門派的技能": "b",
        "七寶天嵐舞是哪個門派的技能": "d",
        "七星鞭的傷害是多少？": "c",
        "七星劍法是哪個門派的絕學": "a",
        "棋道是哪個門派的技能": "c",
        "千古奇俠稱號需要多少論劍積分兌換": "d",
        "乾坤大挪移屬於什麽類型的武功": "a",
        "乾坤一陽指是哪個師傅教的": "a",
        "青城派的道德經可以提升哪個屬性": "c",
        "青城派的道家心法有哪個特殊效果": "a",
        "清風寨在哪": "b",
        "清風寨在哪個地圖": "d",
        "清虛道長在哪一章": "d",
        "去唐門地下通道要找誰拿鑰匙": "a",
        "全真的道家心法有哪個特殊效果": "a",
        "全真的基本陣法有哪個特殊效果": "b",
        "全真的雙手互搏有哪個特殊效果": "c",
        "日月神教大光明心法可以提升什麽": "d",
        "如何將華山劍法從400級提升到440級？": "d",
        "如意刀是哪個門派的技能": "c",
        "山河藏寶圖需要在哪個NPC手裏購買？": "d",
        "上山打獵是掛機裏的第幾個任務": "c",
        "少林的混元一氣功有哪個特殊效果": "d",
        "少林的易筋經神功有哪個特殊效果": "a",
        "蛇形刁手是哪個門派的技能": "b",
        "什麽影響打坐的速度": "c",
        "什麽影響攻擊力": "d",
        "什麽裝備不能鑲嵌黃水晶": "d",
        "什麽裝備都能鑲嵌的是什麽寶石？": "c",
        "什麽裝備可以鑲嵌紫水晶": "c",
        "神雕大俠所在的地圖": "b",
        "神雕大俠在哪一章": "a",
        "神雕俠侶的時代背景是哪個朝代？": "d",
        "神雕俠侶的作者是?": "b",
        "升級什麽技能可以提升根骨": "a",
        "生死符的傷害是多少？": "a",
        "師門磕頭增加什麽": "a",
        "師門任務每天可以完成多少次？": "a",
        "師門任務每天可以做多少個？": "c",
        "師門任務什麽時候更新？": "b",
        "師門任務一天能完成幾次": "d",
        "師門任務最多可以完成多少個？": "d",
        "施令威在哪個地圖": "b",
        "石師妹哪個門派的師傅": "c",
        "使用朱果經驗潛能將分別增加多少？": "a",
        "首次通過橋陰縣不可以獲得那種獎勵？": "a",
        "受贈的消費積分在哪裏領取": "d",
        "獸皮鞋可以在哪位那裏獲得？": "b",
        "樹王墳在第幾章節": "c",
        "雙兒在揚州的哪個小地圖": "a",
        "孫天滅是哪個門派的師傅": "c",
        "踏雪無痕是哪個門派的技能": "b",
        "踏雲棍可以在哪位那裏獲得？": "a",
        "唐門的唐門毒經有哪個特殊效果": "a",
        "唐門密道怎麽走": "c",
        "天蠶圍腰可以鑲嵌幾顆寶石": "d",
        "天蠶圍腰是腰帶類的第幾級裝備？": "d",
        "天山姥姥在逍遙林的哪個場景": "d",
        "天山折梅手是哪個門派的技能": "c",
        "天師陣法是哪個門派的陣法": "b",
        "天邪派在哪裏拜師": "b",
        "天羽奇劍是哪個門派的技能": "a",
        "鐵戒指可以在哪位那裏獲得？": "a",
        "鐵血大旗門雲海心法可以提升什麽": "a",
        "通靈需要花費多少銀兩？": "d",
        "通靈需要尋找哪個NPC？": "c",
        "突破丹在哪裏購買": "b",
        "屠龍刀法是哪個門派的絕學技能": "b",
        "屠龍刀是什麽級別的武器": "a",
        "挖劍冢可得什麽": "a",
        "彎月刀可以在哪位那裏獲得？": "b",
        "玩家每天能夠做幾次正邪任務": "c",
        "玩家想修改名字可以尋找哪個NPC？": "a",
        "晚月莊的內功是什麽": "b",
        "晚月莊的七寶天嵐舞可以提升哪個屬性": "b",
        "晚月莊的小販在下面哪個地點": "a",
        "晚月莊七寶天嵐舞可以提升什麽": "b",
        "晚月莊主線過關要求": "a",
        "王鐵匠是在那個場景": "b",
        "王重陽是哪個門派的師傅": "b",
        "魏無極處讀書可以讀到多少級？": "a",
        "魏無極身上掉落什麽裝備": "c",
        "魏無極在第幾章": "a",
        "聞旗使在哪個地圖": "a",
        "烏金玄火鞭的傷害是多少？": "d",
        "烏檀木刀可以在哪位npc那裏獲得？": "d",
        "鎢金腰帶是腰帶類的第幾級裝備？": "d",
        "武當派的絕學技能是以下哪個": "d",
        "武穆兵法提升到多少級才能出現戰鬥必刷？": "d",
        "武穆兵法通過什麽學習": "a",
        "武學世家加的什麽初始屬性": "a",
        "舞中之武是哪個門派的陣法": "b",
        "西毒蛇杖的傷害是多少？": "c",
        "吸血蝙蝠在下面哪個地圖": "a",
        "下列哪項戰鬥不能多個玩家一起戰鬥？": "a",
        "下列裝備中不可摹刻的是": "c",
        "下面哪個不是古墓的師傅": "d",
        "下面哪個不是門派絕學": "d",
        "下面哪個不是魔教的": "d",
        "下面哪個地點不是喬陰縣的": "d",
        "下面哪個門派是正派": "a",
        "下面哪個是天邪派的師傅": "a",
        "下面有什麽是尋寶不能獲得的": "c",
        "向師傅磕頭可以獲得什麽？": "b",
        "逍遙步是哪個門派的技能": "a",
        "逍遙林是第幾章的地圖": "c",
        "逍遙林怎麽彈琴可以見到天山姥姥": "b",
        "逍遙派的絕學技能是以下哪個": "a",
        "蕭辟塵在哪一章": "d",
        "小李飛刀的傷害是多少？": "d",
        "小龍女住的古墓是誰建造的？": "b",
        "小男孩在華山村哪裏": "a",
        "新人禮包在哪個npc處兌換": "a",
        "新手禮包在哪裏領取": "a",
        "新手禮包在哪領取？": "c",
        "需要使用什麽衣服才能睡寒玉床": "a",
        "選擇孤兒會影響哪個屬性": "c",
        "選擇商賈會影響哪個屬性": "b",
        "選擇書香門第會影響哪個屬性": "b",
        "選擇武學世家會影響哪個屬性": "a",
        "學習屠龍刀法需要多少內力": "b",
        "雪蓮有什麽作用": "a",
        "雪蕊兒是哪個門派的師傅": "a",
        "雪蕊兒在鐵雪山莊的哪個場景": "d",
        "揚文的屬性": "a",
        "揚州詢問黑狗能到下面哪個地點": "a",
        "揚州在下面哪個地點的處可以獲得玉佩": "c",
        "羊毛鬥篷是披風類的第幾級裝備？": "a",
        "陽剛之勁是哪個門派的陣法": "c",
        "楊過小龍女分開多少年後重逢?": "c",
        "楊過在哪個地圖": "a",
        "夜行披風是披風類的第幾級裝備？": "a",
        "夜皇在大旗門哪個場景": "c",
        "一個隊伍最多有幾個隊員": "c",
        "一天能完成謎題任務多少個": "b",
        "一天能完成師門任務有多少個": "c",
        "一天能完成挑戰排行榜任務多少次": "a",
        "一張分身卡的有效時間是多久": "c",
        "一指彈在哪裏領悟": "b",
        "移開明教石板需要哪項技能到一定級別": "a",
        "以下不是步玄派的技能的哪個": "c",
        "以下不是天宿派師傅的是哪個": "c",
        "以下不是隱藏門派的是哪個": "d",
        "以下哪個寶石不能鑲嵌到戒指": "c",
        "以下哪個寶石不能鑲嵌到內甲": "a",
        "以下哪個寶石不能鑲嵌到披風": "c",
        "以下哪個寶石不能鑲嵌到腰帶": "c",
        "以下哪個寶石不能鑲嵌到衣服": "a",
        "以下哪個不是道塵禪師教導的武學？": "d",
        "以下哪個不是何不凈教導的武學？": "c",
        "以下哪個不是慧名尊者教導的技能？": "d",
        "以下哪個不是空空兒教導的武學？": "b",
        "以下哪個不是梁師兄教導的武學？": "b",
        "以下哪個不是論劍的皮膚？": "d",
        "以下哪個不是全真七子？": "c",
        "以下哪個不是宋首俠教導的武學？": "d",
        "以下哪個不是微信分享好友、朋友圈、QQ空間的獎勵？": "a",
        "以下哪個不是嶽掌門教導的武學？": "a",
        "以下哪個不是在洛陽場景": "d",
        "以下哪個不是在雪亭鎮場景": "d",
        "以下哪個不是在揚州場景": "d",
        "以下哪個不是知客道長教導的武學？": "b",
        "以下哪個門派不是隱藏門派？": "c",
        "以下哪個門派是正派？": "d",
        "以下哪個門派是中立門派？": "a",
        "以下哪個是步玄派的祖師": "b",
        "以下哪個是封山派的祖師": "c",
        "以下哪個是花紫會的祖師": "a",
        "以下哪個是晚月莊的祖師": "d",
        "以下哪些物品不是成長計劃第二天可以領取的？": "c",
        "以下哪些物品不是成長計劃第三天可以領取的？": "d",
        "以下哪些物品不是成長計劃第一天可以領取的？": "d",
        "以下哪些物品是成長計劃第四天可以領取的？": "a",
        "以下哪些物品是成長計劃第五天可以領取的？": "b",
        "以下屬於邪派的門派是哪個": "b",
        "以下屬於正派的門派是哪個": "a",
        "以下誰不精通降龍十八掌？": "d",
        "以下有哪些物品不是每日充值的獎勵？": "d",
        "倚天劍加多少傷害": "d",
        "倚天屠龍記的時代背景哪個朝代？": "a",
        "易容後保持時間是多久": "a",
        "易容面具需要多少玄鐵兌換": "c",
        "易容術多少級才可以易容成異性NPC": "a",
        "易容術可以找哪位NPC學習？": "b",
        "易容術向誰學習": "a",
        "易容術在哪裏學習": "a",
        "易容術在哪學習？": "b",
        "銀手鐲可以在哪位那裏獲得？": "b",
        "銀絲鏈甲衣可以在哪位npc那裏獲得？": "a",
        "銀項鏈可以在哪位那裏獲得？": "b",
        "尹誌平是哪個門派的師傅": "b",
        "隱者之術是那個門派的陣法": "a",
        "鷹爪擒拿手是哪個門派的技能": "a",
        "影響你出生的福緣的出生是？": "d",
        "油流麻香手是哪個門派的技能": "a",
        "遊龍散花是哪個門派的陣法": "d",
        "玉蜂漿在哪個地圖獲得": "a",
        "玉女劍法是哪個門派的技能": "b",
        "嶽掌門在哪一章": "a",
        "雲九天是哪個門派的師傅": "c",
        "雲問天在哪一章": "a",
        "在洛陽蕭問天那可以學習什麽心法": "b",
        "在廟祝處洗殺氣每次可以消除多少點": "a",
        "在哪個NPC可以購買恢復內力的藥品？": "c",
        "在哪個處可以更改名字": "a",
        "在哪個處領取免費消費積分": "d",
        "在哪個處能夠升級易容術": "b",
        "在哪裏可以找到“香茶”？": "a",
        "在哪裏捏臉提升容貌": "d",
        "在哪裏消殺氣": "a",
        "在逍遙派能學到的技能是哪個": "a",
        "在雪亭鎮李火獅可以學習多少級柳家拳": "b",
        "在戰鬥界面點擊哪個按鈕可以進入聊天界面": "d",
        "在正邪任務中不能獲得下面什麽獎勵？": "d",
        "怎麽樣獲得免費元寶": "a",
        "贈送李鐵嘴銀兩能夠增加什麽": "a",
        "張教主在明教哪個場景": "d",
        "張三豐在哪一章": "d",
        "張三豐在武當山哪個場景": "d",
        "張松溪在哪個地圖": "c",
        "張天師是哪個門派的師傅": "a",
        "張天師在茅山哪個場景": "d",
        "長虹劍在哪位那裏獲得？": "a",
        "長劍在哪裏可以購買？": "a",
        "正邪任務殺死好人增長什麽": "b",
        "正邪任務一天能做幾次": "a",
        "正邪任務中客商的在哪個地圖": "a",
        "正邪任務中賣花姑娘在哪個地圖": "b",
        "正邪任務最多可以完成多少個？": "d",
        "支線對話書生上魁星閣二樓殺死哪個NPC給10元寶": "a",
        "朱姑娘是哪個門派的師傅": "a",
        "朱老伯在華山村哪個小地圖": "b",
        "追風棍可以在哪位npc那裏獲得？": "a",
        "追風棍在哪裏獲得": "b",
        "紫寶石加什麽屬性": "d",
        "下面哪個npc不是魔教的": "d",
        "藏寶圖在哪裏npc那裏買": "a",
        "從哪個npc處進入跨服戰場": "a",
        "鉆石項鏈在哪獲得": "a",
        "在哪個npc處能夠升級易容術": "b",
        "揚州詢問黑狗子能到下面哪個地點": "a",
        "北嶽殿神像後面是哪位npc": "b",
        "獸皮鞋可以在哪位npc那裏獲得？": "b",
        "在哪個npc處領取免費消費積分": "d",
        "踏雲棍可以在哪位npc那裏獲得？": "a",
        "鋼絲甲衣可以在哪位npc那裏獲得？": "d",
        "哪個npc處可以捏臉": "a",
        "草帽可以在哪位npc那裏獲得？": "b",
        "鐵戒指可以在哪位npc那裏獲得？": "a",
        "銀項鏈可以在哪位npc那裏獲得？": "b",
        "在哪個npc處可以更改名字": "a",
        "長劍在哪裏可以購買？": "a",
        "寶玉帽可以在哪位npc那裏獲得？": "d",
        "論劍中以下哪個不是晚月莊的技能": "d",
        "清風寨在哪": "b",
        "精鐵棒可以在哪位npc那裏獲得？": "d",
        "彎月刀可以在哪位npc那裏獲得？": "b",
        "密宗伏魔是哪個門派的陣法": "c",
        "vip每天不可以領取什麽": "b",
        "華山施戴子掉落的物品是什麽": "b",
        "鉆石項鏈在哪獲得": "a",
        "藏寶圖在哪個npc處購買": "b",
        "寶玉鞋擊殺哪個npc可以獲得": "a",
        "銀手鐲可以在哪位npc那裏獲得？": "b",
        "蓮花掌是哪個門派的技能": "a",
        "九區服務器名稱": "d",
        "以下哪個不是在洛陽場景": "d",
        "紅寶石加什麽屬性": "b",
        "摹刻10級的裝備需要摩刻技巧多少級": "b",
        "軍營是第幾個組隊副本": "b",
        "朱姑娘是哪個門派的師傅": "a",
        "金項鏈可以在哪位npc那裏獲得？": "d",
        "魏無極在第幾章": "a",
        "清風寨在哪": "b",
        "以下哪個不是在洛陽場景": "d",
        "風泉之劍可以在哪位npc那裏獲得？": "b",
        "魔鞭訣在哪裏學習": "d",
        "副本一次最多可以進幾人": "a",
        "城裏抓賊是掛機裏的第幾個任務": "b",
        "揚州在下面哪個地點的npc處可以獲得玉佩": "c",
        "白金戒指可以在哪位npc那裏獲得？": "b",
        "長虹劍在哪位npc那裏獲得？": "a",
        "跨服天劍谷是星期幾舉行的": "b",
        "白金手鐲可以在哪位npc那裏獲得？": "a",
        "白金項鏈可以在哪位npc那裏獲得？": "b"
    };
    function answerQuestionsFunc21(e) {
        clickButton('home');
        window.Dom = $(e.target);
        if (Dom.html() == "答題") {
            answerTrigger = 1;
            console.log("準備自動答題！");
            Dom.html("停答題");
            answerQuestions21();
        } else {
            answerTrigger = 0;
            console.log("停止自動答題！");
            Dom.html("答題");
            clearInterval(answerQuestionsInterval);
        }
    }
    function answerQuestionsFunc(e) {
        clickButton('home');
        window.Dom = $(e.target);
        if (Dom.html() == "答題") {
            console.log("準備自動答題！");
            answerQuestions();
            answerQuestionsInterval = setInterval(answerQuestions, 5000);
            Dom.html("停答題");
        } else {
            console.log("停止自動答題！");
            Dom.html("答題");
            clearInterval(answerQuestionsInterval);
        }
    }
    function answerQuestions() {
        if ($('span:contains(每日武林知識問答次數已經)').text().slice(-46) == "每日武林知識問答次數已經達到限額，請明天再來。每日武林知識問答次數已經達到限額，請明天再來。") {
            // 今天答題結束了
            console.log("完成自動答題！");
            Dom.html("答題");
            clearInterval(answerQuestionsInterval);
            return;
        }
        clickButton('question');
        setTimeout(getAndAnsQuestion, 2000); // 300 ms之後提取問題，查詢答案，並回答
    }
    function getAndAnsQuestion() {
        // 提取問題
        var firstSplitArr = $(".out").text().split("題");
        if (firstSplitArr.length < 2) {
            return;
        }
        var theQuestion = firstSplitArr[1].split("A")[0];
        // 左右去掉空格
        // theQuestion = theQuestion.trim(" ","left").trim(" ","right");
        theQuestion = theQuestion.replace(/^\theQuestion*/, "");
        theQuestion = theQuestion.replace(/\theQuestion*$/, "");
        theQuestion = $.trim(theQuestion);
        // theQuestion=theQuestion.slice(1);
        // 查找某個問題，如果問題有包含關系，則
        var theAnswer = getAnswer2Question(theQuestion);
        if (theAnswer !== "failed") {
            eval("clickButton('question " + theAnswer + "')");
        } else {
            // alert("沒有找到答案，請手動完成該題目！");
            console.log("停止自動答題！");
            Dom.html("答題");
            clearInterval(answerQuestionsInterval);
            return;
        }
        console.log($('span:contains(知識問答第)').text().split("繼續答題")[0]);
        printAnswerInfo(theAnswer);
    }
    function printAnswerInfo(theAnswer) {
        console.log("完成一道武林知識問答：" + "答案是：" + theAnswer);
        console.log($('span:contains(知識問答第)').text().split("繼續答題")[0]);
    }
    function getAnswer2Question(localQuestion) {
        // 如果找到答案，返回響應答案，a,b,c或者d
        // 如果沒有找到答案，返回 "failed"

        if (localQuestion.indexOf('鐵手鐲') >= 0) {
            return 'a';
        }
        var resultsFound = [];
        var countor = 0;
        for (var quest in QuestAnsLibs) {
            if (isContains(quest, localQuestion)) { //包含關系就可
                resultsFound[countor] = quest;
                countor = countor + 1;
            } else if (isContains(quest, localQuestion.replace("npc", "")) || isContains(quest, localQuestion.replace("NPC", ""))) {

            }
        }
        if (resultsFound.length >= 1) {
            return QuestAnsLibs[resultsFound[0]];
        }
        else {
            console.log("題目 " + localQuestion + " 找不到答案或存在多個答案，請手動作答！");
            return "failed";
        }
    }
    /* 答題  :end */

    /* 跨服逃犯 */
    var chatJianTing = null;
    var userClickMouse = false;
    var autoGetBackInterval = null;
    var autoGetBackCMDExced = true;
    var autoGetBackCMDInterval = null;
    var allQLHFinishedFlag = false;

    function killKuaFuTaoFanFn(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '逃犯') {
            Jianshi.tf = 1;
            console.log(getTimes() + '開始逃犯');
            Dom.html('取消逃犯');
        } else {
            Jianshi.tf = 0;
            console.log(getTimes() + '結束逃犯');
            Dom.html('逃犯')
        }
    }
    // 一鍵恢復
    function recoverOnByClick() {
        recoverIntervalFn();
    }

    function recoverOnByClick1() {
        bulan();
    }
    // 定時恢復
    var recoverInterval = null;
    function recoverOnTimes(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();

        if (DomTxt == '定時恢復') {
            recoverInterval = setInterval(recoverIntervalFn, 3 * 60 * 1000);
            console.log(getTimes() + '開始定時恢復');
            Dom.html('取消恢復');
        } else {
            clearInterval(recoverInterval);
            console.log(getTimes() + '結束定時恢復');
            Dom.html('定時恢復')
        }
    }

    function recoverIntervalFn() {
        if ($("#skill_1")[0] == undefined) {
            recoverFn();
        }
    }
    function recoverFn() {
        healFunc();
    }
    function bulan() {
        var p = g_obj_map.get('msg_attrs');
        var max_neili = parseInt(p.get('max_force'));;
        var neili = parseInt(p.get('force'));
        var BulanInterval = setInterval(function () {
            if (neili < max_neili - 30000) {
                go('items use snow_wannianlingzhi');
                neili += 30000;
            }
            else if (neili < max_neili) {
                go('items use snow_qiannianlingzhi');
                neili += 5000;
            } else {
                // go('golook_room');
                clearInterval(BulanInterval);
            }
        }, 120, max_neili, neili);
    }
    function healFunc() {
        var kee = parseInt(g_obj_map.get("msg_attrs").get("kee"));
        var max_kee = parseInt(g_obj_map.get("msg_attrs").get("max_kee"));
        var force = parseInt(g_obj_map.get("msg_attrs").get("force"));
        var max_force = parseInt(g_obj_map.get("msg_attrs").get("max_force"));
        // console.log("血量是: " + kee + "/" + max_kee);
        // console.log("內力是: " + force + "/" + max_force);
        if (g_gmain.is_fighting) {
            return -1;//戰鬥中
        }
        if (kee < max_kee) {
            if (force > 0) {
                clickButton('recovery', 0);
            } else {
                clickButton('items use snow_wannianlingzhi');
            }
            // console.log("治療中.....");
            setTimeout(function () { healFunc() }, 200);
        } else {
            if (force < max_force * 0.5) {
                clickButton('items use snow_wannianlingzhi');
                // console.log("治療中.....");
                setTimeout(function () { healFunc() }, 200);
            }
            else if (force < max_force * 0.95) {
                clickButton('items use snow_qiannianlingzhi');
                // console.log("治療中.....");
                setTimeout(function () { healFunc() }, 200);
            }
        }
    }

    /* 跨服逃犯 end*/
    var userClickMouse = false;
    var autoGetBackInterval = null;
    var autoGetBackCMDExced = true;
    var autoGetBackCMDInterval = null;
    var allQLHFinishedFlag = false;
    var currentPos = null;
    var scanEscaped = null;
    var maikuli_i = null;
    var duancha_i = null;
    var dalie_i = null;
    // 領取獎勵 ------------------------------------------------------------------------------------------------------
    //document.body.removeChild(getRewardsButton);

    var isAutoOn = false;
	var isyouxia = false;
    function fct(e) {
        ys(0)
    }
	
	

	function doOnBuyFish(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();

        if (DomTxt == '補充魚餌') {
            autobuyfish = true;
            Dom.html('停止補充');
        } else {
            autobuyfish = false;
            Dom.html('補充魚餌');
        }
    }

	function doOnZhu(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();

        if (DomTxt == '打祝玉研') {
            autozhu = true;
            Dom.html('停祝玉研');
        } else {
            autozhu = false;
            Dom.html('打祝玉研');
        }
    }
	
    var getRewardsInterval = 30 * 60 * 1000; // 30min
    function getRewardsFunc() {
        if (getRewardsButton.innerText == '開領獎') { // 處於未領獎狀態，單擊開始領獎,並將狀態置於停領獎狀態
            console.log("開始自動領取獎勵！");
            scanEscapedFish();
            scanEscaped = setInterval(scanEscapedFish, getRewardsInterval);
            getRewardsButton.innerText = '停領獎';
        } else {
            console.log("停止自動領取獎勵！");
            clearInterval(scanEscaped);
            clearInterval(maikuli_i);
            clearInterval(duancha_i);
            clearInterval(dalie_i);
            clearInterval(autoGetBackInterval);
            getRewardsButton.innerText = '開領獎';
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
    function baobiao() {
        go('work click baobiao');
    }
    function maiyi() {
        go('work click maiyi');
    }
    function xuncheng() {
        go('work click xuncheng');
    }
    function datufei() {
        go('work click datufei');
    }
    function dalei() {
        go('work click dalei');
    }
    function kangjijinbin() {
        go('work click kangjijinbin');
    }
    function zhidaodiying() {
        go('work click zhidaodiying');
    }
    function dantiaoqunmen() {
        go('work click dantiaoqunmen');
    }
    function shenshanxiulian() {
        go('work click shenshanxiulian');
        go('work click jianmenlipai');
        go('work click dubawulin');
        go('work click youlijianghu');
        go('work click yibangmaoxiang');
        go('work click zhengzhanzhongyuan');
    }
    function scanEscapedFish() {
        maikuli();
        duancha();
        dalie();
        baobiao();
        maiyi();
        xuncheng();
        datufei();
        dalei();
        kangjijinbin();
        zhidaodiying();
        dantiaoqunmen();
        shenshanxiulian();
        go('public_op3'); // 向師傅磕頭
    }

    /**/
    // 開始挖寶
    //document.body.removeChild(CheckInButton);

    // 吃藥 ------------------------------------------------------------------------------------------------------
    function userMedecineFunc() {
        clickButton('items use snow_qiannianlingzhi');
    }

    // 出招 ------------------------------------------------------------------------------------------------------
    function useSkillsFunc() {
        doKillSet();
    }
    // 隨機跑
    var randomRunJianIntervalFunc = null;
    function randomRunButtonFunc() {
        if (randomRunButton.innerText == '隨機跑') {
            randomRunButton.innerText = '停跑步';
            randomRunJianIntervalFunc = setInterval(function () { RandomRunOnce() }, 400);
        } else {
            console.log("停止自動切圖！");
            randomRunButton.innerText = '隨機跑';
            clearInterval(randomRunJianIntervalFunc);
        }
    };
    async function RandomRunOnce() {

        var randDirect = { 1: 'west', 2: 'east', 3: 'north', 4: 'south', 5: 'northwest', 6: 'northeast', 7: 'southwest', 8: 'southeast' };
        var direct = Math.floor(Math.random() * 8 + 1);
        var dicListHere = $("button[class*=cmd_click_exits]");
        var findBetterWay = false;
        var cmd = "";
        if ($('#skill_1').length > 0 || $(".cmd_click3").length == 0 || $('.prev').length > 0) {
            return;
        }
        //if(hasTianjian()){

        //}else
        if (Base.tianjianTarget != '' && hasTianjianShiwei()) {

        } else {/*
                for(var i = 0; i < dicListHere.length; i ++){
                    if(isContains(dicListHere[i].innerText,"湖邊")){
                        findBetterWay = true;
                        cmd = dicListHere[i].getAttribute('onclick');
                        break;
                    }
                }
                console.log('隨機跑一次！');
                if(findBetterWay){
                    eval(cmd);
                    return;
                }else{*/
            var cmd = clickButton('go ' + randDirect[direct]);
            eval(cmd);
            return;
            /*}*/
        }
    };

    function hasTianjianShiwei(name) {
        return hasTargetName('天劍谷衛士');
    }
    function hasTianjian() {
        return hasTargetName('天劍');
    }
    function hasTargetName(name) {
        var hasName = false;
        var peopleList = $(".cmd_click3");
        peopleList.each(function () {
            var peopleName = $(this).text();
            if (peopleName == name) {
                hasName = true;
            }
        });
        return hasName
    }

    /**/
    // 尋目標 ------------------------------------------------------------------------------------------------------
    var searchedLocList = [];
    var continuedSearch = false;
    chapList = ['雪亭鎮', '洛陽', '華山村', '華山', '揚州', '丐幫', '喬陰縣', '峨眉山', '恒山', '武當山',
        '晚月莊', '水煙閣', '少林寺', '唐門', '青城山', '逍遙林', '開封', '光明頂', '全真教', '古墓',
        '白駝山', '嵩山', '梅莊', '泰山', '鐵血大旗門', '大昭寺', '魔教', '星宿海', '茅山', '桃花島',
        '鐵雪山莊', '慕容山莊', '大理', '斷劍山莊', '冰火島'];
    // var findSpecTagerInfo = "雪亭鎮-王鐵匠";
    var findSpecTagerInfo = "";
    function findSpecargetFunc() {
        if (!(findSpecTagerInfo = prompt("請輸入尋找目標（章節名-目標名）：", findSpecTagerInfo))) {
            findSpecTagerInfo = '';
            return;
        };
        continuedSearch = false;
        if (isContains(findSpecTagerInfo, '-')) {
            // 包含‘-’
            var tempTargetInfo = findSpecTagerInfo.split('-');
            removeByValue(tempTargetInfo, ""); // 刪除空字符串
            for (var i = 0; i < tempTargetInfo.length; i++) {
                tempTargetInfo[i] = tempTargetInfo[i].trim(" ", "left").trim(" ", "right"); // 去除空白
            }
            if (tempTargetInfo.length !== 3) {
                searchedLocList = []; // 清空搜索路徑
            } else {
                continuedSearch = true;
            }
            var chapName = tempTargetInfo[0];
            var TargetName = tempTargetInfo[1];
            var ChapIndex = getChapIndex(chapName);
            if (ChapIndex > 0) {
                // searchForSpecificTarget(ChapIndex, TargetName);
                goFindNpcInPlace(chapName, TargetName)
            }
        } else {
            // （1） 如果不包含 -，證明只輸入目標名，從第一章找起
            writeScreenBtns(findSpecTagerInfo);
        }
    }

    function writeScreenBtns(name) {
        var TargetName = name.trim(" ", "left").trim(" ", "right");
        var wayArr = [];
        for (var j in hairsfalling) {
            for (var k in hairsfalling[j]) {
                if (k.indexOf(TargetName) > -1) {
                    var way = hairsfalling[j][k];
                    wayArr.push({ name: j + '-' + k, way: way });
                }
            }
        }
        addScreenBtn(wayArr);
    }

    function autoFindSpecargetFunc() {
        continuedSearch = false;
        if (isContains(findSpecTagerInfo, '-')) {
            // 包含‘-’
            var tempTargetInfo = findSpecTagerInfo.split('-');
            removeByValue(tempTargetInfo, ""); // 刪除空字符串
            for (var i = 0; i < tempTargetInfo.length; i++) {
                tempTargetInfo[i] = tempTargetInfo[i].trim(" ", "left").trim(" ", "right"); // 去除空白
            }
            if (tempTargetInfo.length !== 3) {
                searchedLocList = []; // 清空搜索路徑
            } else {
                continuedSearch = true;
            }
            var chapName = tempTargetInfo[0];
            var TargetName = tempTargetInfo[1];
            var ChapIndex = getChapIndex(chapName);
            if (ChapIndex > 0) {
                searchForSpecificTarget(ChapIndex, TargetName);
            }
        } else {
            // （1） 如果不包含 -，證明只輸入目標名，從第一章找起
            TargetName = targetInfo.trim(" ", "left").trim(" ", "right");
            var wayArr = [];
            for (var j in hairsfalling) {
                for (var k in hairsfalling[j]) {
                    if (k == TargetName) {
                        var way = hairsfalling[j][k];
                        wayArr.push({ name: k, way: way });
                    }
                }
            }
            addScreenBtn(wayArr);
        }
    }

    function getChapIndex(chap) {
        var findChaps = false;
        for (var i = 0; i < chapList.length; i++) {
            if (chapList[i] == chap) {
                findChaps = true;
                return (i + 1);
            }
        }
        if (!findChaps) {
            // 如果沒找到，發出警告
            console.error('## 找不到該目的地：' + chap + '！');
            return -1;
        }

    };

    async function clickButtonMapAsync(s) {
        clickButton(s);
        if (s == "client_map") {
            // 從場景切地圖
            while (true) {
                await new Promise(function (resolve) {
                    setTimeout(resolve, 300);
                });
                if ($('.out_line')[0]) {
                    break;
                }
            }
            await new Promise(function (resolve) {
                setTimeout(resolve, 300);
            });
        } else if (s == "prev") {
            //從地圖切場景
            while (true) {
                await new Promise(function (resolve) {
                    setTimeout(resolve, 300);
                });
                if (!$('.out_line')[0]) {
                    break;
                }
            }
            await new Promise(function (resolve) {
                setTimeout(resolve, 300);
            });
        } else if (s == "golook_room") {
            //從地圖切場景
            while (true) {
                await new Promise(function (resolve) {
                    setTimeout(resolve, 300);
                });
                if (!$('.out_line')[0]) {
                    break;
                }
            }
            await new Promise(function (resolve) {
                setTimeout(resolve, 300);
            });
        }
    };


    async function isCurrentLocSearched(locID) {
        // 判斷loc位置，是否已經在列表中
        var descrip = $(".out")[0].textContent.split("這兒有：")[0]; // 獲取描述
        var currentLocID = descrip + locID;
        return searchedLocList.includes(currentLocID);
    };

    async function addCurrLoc2List(locID) {
        // 判斷loc位置，是否已經在列表中
        var descrip = $(".out")[0].textContent.split("這兒有：")[0]; // 獲取描述
        var currentLocID = descrip + locID;
        searchedLocList.push(currentLocID);
        // console.log(currentLocID);
        // console.log(searchedLocList);
    };

    async function searchTheMap(targetName) {
        await clickButtonMapAsync('client_map');

        var currentLocID = $("button[style*='room_in.png']")[0];
        if (currentLocID !== undefined) {
            currentLocID = currentLocID.parentNode.getAttribute('id');   // 獲取在大地圖中的位置：
        } else {
            currentLocID = "大地圖中不存在該位置！";
        }
        await clickButtonMapAsync('prev');

        if (await isCurrentLocSearched(currentLocID)) {
            // console.log("此位置已經搜索過：" + $(".cmd_click_room")[0].innerText);
            return;
        }
        if ($(".cmd_click_room").length > 0) {
            console.log('搜尋位置： ' + $(".cmd_click_room")[0].innerText);
        }
        await addCurrLoc2List(currentLocID);
        // 判斷該位置是否發現目標
        if (findObjectHere(targetName)) {
            console.log("發現目標！");
            killQixia(targetName);
            throw new Error('發現目標！', 1);
        }

        // 分別判斷8個方向
        if ($(".cmd_click_exits_n")[0]) { // 北邊
            await clickButtonAsync('go north');
            await searchTheMap(targetName);
            await clickButtonAsync('go south');
        }
        if ($(".cmd_click_exits_s")[0]) { // 南
            await clickButtonAsync('go south');
            await searchTheMap(targetName);
            await clickButtonAsync('go north');
        }
        if ($(".cmd_click_exits_e")[0]) { // 東邊
            await clickButtonAsync('go east');
            await searchTheMap(targetName);
            await clickButtonAsync('go west');
        }
        if ($(".cmd_click_exits_w")[0]) { // 西
            await clickButtonAsync('go west');
            await searchTheMap(targetName);
            await clickButtonAsync('go east');
        }
        if ($(".cmd_click_exits_ne")[0]) { // 東北邊
            await clickButtonAsync('go northeast');
            await searchTheMap(targetName);
            await clickButtonAsync('go southwest');
        }

        if ($(".cmd_click_exits_se")[0]) { // 東南
            await clickButtonAsync('go southeast');
            await searchTheMap(targetName);
            await clickButtonAsync('go northwest');
        }

        if ($(".cmd_click_exits_sw")[0]) { // 西南
            await clickButtonAsync('go southwest');
            await searchTheMap(targetName);
            await clickButtonAsync('go northeast');
        }

        if ($(".cmd_click_exits_nw")[0]) { // 西北
            await clickButtonAsync('go northwest');
            await searchTheMap(targetName);
            await clickButtonAsync('go southeast');
        }
    };
    function findObjectHere(local_obj) {
        var NPCList = $(".cmd_click3");  // 先查當前目錄下NPC
        for (var i = 0; i < NPCList.length; i++) {
            if (NPCList[i].innerText == "探查此地") {
                eval(NPCList[i].getAttribute('onclick'));
                console.log("探索一次地方！");
            }
            if (NPCList[i].innerText == local_obj || NPCList[i].innerText == (local_obj + "的屍體")) {
                return true;
            }
            if (NPCList[i].innerText.indexOf(local_obj) >= 0) {
                return true;
            }
        }
        var localLocList = $("button[class*='cmd_click_']"); // 再查當前目錄下所有地點按鈕
        for (var i = 0; i < localLocList.length; i++) {
            if (localLocList[i].innerText == local_obj) {
                // 走到那邊，且返回true
                if (localLocList[i].getAttribute('class') !== "cmd_click_room") {
                    eval(localLocList[i].getAttribute('onclick')); // 朝這個方向走去
                }
                return true;
            }
        }
        return false;
    };

    async function searchForSpecificTarget(chapIndex, targetName) {
        try {
            searchName = targetName;
            console.log("開始在第 " + chapIndex + " 章搜尋目標 " + targetName);
            if (!continuedSearch) {
                // 返回主頁
                await clickButtonAsync('home');
                while (true) {
                    await new Promise(function (resolve) {
                        setTimeout(resolve, 300);
                    });
                    if ($('.cmd_main_jh')[0])
                        break;
                }
                await new Promise(function (resolve) {
                    setTimeout(resolve, 300);
                });

                await clickButtonAsync('jh ' + chapIndex);
                // 如果在峨眉，或者嵩山，停止搜尋
                if (chapIndex == 6 || chapIndex == 8 || chapIndex == 22) {
                    console.error("在丐幫、峨眉山、嵩山，取消自動搜索！");
                    return;
                }
                while (true) {
                    await new Promise(function (resolve) {
                        setTimeout(resolve, 300);
                    });
                    if (!$('.cmd_main_jh')[0])
                        break;
                }
                await new Promise(function (resolve) {
                    setTimeout(resolve, 300);
                });

            }
            await clickButtonMapAsync('client_map');
            await new Promise(function (resolve) {
                setTimeout(resolve, 300);
            });
            await clickButtonMapAsync('prev');
            await searchTheMap(targetName);
        }
        catch (e) {
            console.log(e);
        }
        console.log("搜索完畢！");
        await clickButtonAsync('home');
    };

    // 找到青龍目標
    function killQixia(name) {
        var btn = $('.cmd_click3');
        idArr = [];
        for (var i = 0; i < btn.length; i++) {
            var txt = btn.eq(i).text();

            if (txt == name) {
                var npcText = btn.eq(i).attr('onclick');
                var id = getId(npcText);
                idArr.push(id);
            }
        }
        console.log(idArr);
        var maxId = idArr[0];

        // console.log(maxId);  //eren580108074

        // followNPC(maxId);

        killE(maxId);
        sendToQQ('殺' + name);
        setTimeout(function () {
            killE(maxId);
        }, 1000);
        // $('#btn5').trigger('click')    // 搜屍
        // setTimeout(function(){
        //     $('#btn4').trigger('click')    // 搜屍
        // },3*60*1000)
    }

    function followNPC(name) {
        clickButton('follow_play ' + name);
    };

    /**/
    async function findQLHPath(targetLocation) {
        switch (targetLocation) {
            case '打鐵鋪子':
                // 打鐵鋪子：飲風客棧 --> 廣場 -->  雪亭鎮街道 --> 雪亭鎮街道 --> 打鐵鋪子                                          # 王鐵匠 # 或者 # 壞人 #
                go('jh 1');       // 進入章節
                go('go east');     // 廣場
                go('go north');   // 雪亭鎮街道
                go('go north');    // 雪亭鎮街道
                go('go west');      // 打鐵鋪子
                break;
            case '桑鄰藥鋪':
                // 桑林藥鋪：迎風客棧 --> 廣場 -->  雪亭鎮街道 --> 雪亭鎮街道 --> 雪亭鎮街道 --> 桑林藥鋪                           # 楊掌櫃 # 或者 # 壞人 #
                go('jh 1');        // 進入章節
                go('go east');      // 廣場
                go('go north');     // 雪亭鎮街道
                go('go north');    // 雪亭鎮街道
                go('go north');     // 雪亭鎮街道
                go('go west');    // 桑林藥鋪
                break;
            case '書房':
                // 書房：迎風客棧 --> 廣場 -->  雪亭鎮街道 --> 淳風武館大門 --> 淳風武館教練場 --> 淳風武館大廳 -->  天井 --> 書房  # 柳繪心 #  或者 # 壞人 #
                go('jh 1');        // 進入章節
                go('go east');     // 廣場
                go('go north');     // 雪亭鎮街道
                go('go east');     // 淳風武館大門
                go('go east');    // 淳風武館教練場
                go('go east');     // 淳風武館大廳
                go('go east');    // 天井
                go('go north');    // 書房
                break;
            case '南市':
                // 南市：  龍門石窟 --> 南郊小路 -->  南門 --> 南市 # 客商#  或者 # 壞人#
                go('jh 2');        // 進入章節
                go('go north');     // 南郊小路
                go('go north');     // 南門
                go('go east');     // 南市
                break;
            case '北大街':
                // 北大街： 龍門石窟 --> 南郊小路 -->  南門 --> 南大街 -->  洛川街 --> 中心鼓樓 --> 中州街 --> 北大街              # 賣花姑娘 #  或者 # 壞人 #
                go('jh 2');        // 進入章節
                go('go north');      // 南郊小路
                go('go north');     // 南門
                go('go north');     // 南大街
                go('go north');     // 洛川街
                go('go north');     // 中心鼓樓
                go('go north');     // 中州街
                go('go north');     // 北大街
                break;
            case '錢莊':
                // 錢莊：  龍門石窟 --> 南郊小路 -->  南門 --> 南大街 -->  洛川街 --> 中心鼓樓 --> 中州街 --> 北大街--> 錢莊       # 劉守財 #  或者 # 壞人 #
                go('jh 2');        // 進入章節
                go('go north');      // 南郊小路
                go('go north');     // 南門
                go('go north');     // 南大街
                go('go north');     // 洛川街
                go('go north');     // 中心鼓樓
                go('go north');     // 中州街
                go('go north');     // 北大街
                go('go east');     // 錢莊
                break;
            case '繡樓':
                // 繡樓：  龍門石窟 --> 南郊小路 -->  南門 --> 南大街 -->  洛川街 --> 銅鑼巷 --> 桃花別院 --> 繡樓                 # 柳小花 #  或者 # 壞人 #
                go('jh 2');        // 進入章節
                go('go north');      // 南郊小路
                go('go north');     // 南門
                go('go north');     // 南大街
                go('go north');     // 洛川街
                go('go west');    // 銅鑼巷
                go('go south');     // 桃花別院
                go('go west');     // 繡樓
                break;
            case '祠堂大門':
                // 祠堂大廳：華山村村口 --> 青石街 -->  銀杏廣場 --> 祠堂大門            # 朱老伯 #  或者 # 壞人 #
                go('jh 3');        // 進入章節
                go('go south');      // 青石街
                go('go south');     // 銀杏廣場
                go('go west');    // 祠堂大門
                break;
            case '廳堂':
                // 廳堂：華山村村口 --> 青石街 -->  銀杏廣場 --> 祠堂大門 -->  廳堂      # 方寡婦 #  或者 # 壞人 #
                go('jh 3');        // 進入章節
                go('go south');      // 青石街
                go('go south');     // 銀杏廣場
                go('go west');     // 祠堂大門
                go('go north');     // 廳堂
                break;
            case '雜貨鋪':
                // 雜貨鋪：華山村村口 --> 青石街 -->  銀杏廣場 --> 雜貨鋪                # 方老板 #  或者 # 壞人 #
                go('jh 3');        // 進入章節
                go('go south');      // 青石街
                go('go south');     // 銀杏廣場
                go('go east');     // 雜貨鋪
                break;
            case '洛陽寺廟':
                // 雜貨鋪：華山村村口 --> 青石街 -->  銀杏廣場 --> 雜貨鋪                # 方老板 #  或者 # 壞人 #
                go('jh 2');        // 進入章節
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go north');
                go('go west');
                go('go south');
                go('go south');
                go('go south');
                go('go south');
                go('go east');
                break;
            default:
                // 如果沒找到，發出警告
                console.log('## 找不到該目的地：' + targetLocation + '！');
        }
    };
    currentPos = 60;
    var delta = 30;
    var chapMapButton = [];
    var dis_right = "30";

    function makePlaceBtns() {
        currentPos = 60;
        delta = 30;
        dis_right = "30";
        for (var i = 0; i < chapList.length; i++) {
            if (i < 17) {
                // dis_right = "180";
                dis_right = "180";
            } else if (i == 17) {
                dis_right = "270";
                // dis_right = "90";
                currentPos = 60;
            }
            chapMapButton[i] = document.createElement('button');
            chapMapButton[i].innerText = chapList[i];
            chapMapButton[i].style.position = 'absolute';
            chapMapButton[i].style.zIndex = '10';
            chapMapButton[i].style.right = dis_right + 'px';
            chapMapButton[i].style.top = currentPos + 'px';
            currentPos = currentPos + delta;
            chapMapButton[i].style.width = Base.buttonWidth;
            chapMapButton[i].style.height = Base.buttonHeight;
            chapMapButton[i].className = 'btn-add btn-others btn-place';
            document.body.appendChild(chapMapButton[i]);
            (function (i) {
                chapMapButton[i].onclick = function () {
                    var cmd = "clickButton('jh " + (i + 1) + "')";
                    eval(cmd);
                }
            })(i);
        }
    }

    var QLHLocList = ['主頁', '背包', '技能', '打榜', '監控Q群', '使用令牌', '府邸遊俠', '打鐵鋪子', '桑鄰藥鋪', '書房', '南市', '北大街', '錢莊', '繡樓', '祠堂大門', '廳堂', '雜貨鋪', '洛陽寺廟'];
    var QLHchapMapButton = [];
    function makeOtherBtns() {
        currentPos = 60;
        delta = 30;
        for (var i = 0; i < QLHLocList.length; i++) {
            // dis_right = "450";
            dis_right = "90";
            QLHchapMapButton[i] = document.createElement('button');
            QLHchapMapButton[i].innerText = QLHLocList[i];
            QLHchapMapButton[i].style.position = 'absolute';
            QLHchapMapButton[i].style.zIndex = '10';
            QLHchapMapButton[i].style.right = dis_right + 'px';
            QLHchapMapButton[i].style.top = currentPos + 'px';
            currentPos = currentPos + delta;
            QLHchapMapButton[i].style.width = Base.buttonWidth;
            QLHchapMapButton[i].style.height = Base.buttonHeight;
            QLHchapMapButton[i].className = 'btn-add btn-others btn-ql-place';
            if (QLHLocList[i] == "監控Q群") {
                QLHchapMapButton[i].id = 'btn-watchQQ';
            }
            if (QLHLocList[i] == "打榜") {
                QLHchapMapButton[i].id = 'btn-hitBang';
            }

            document.body.appendChild(QLHchapMapButton[i]);
            if (QLHLocList[i] == "府邸遊俠") {
                currentPos = currentPos + 30;
            }

            (function (i) {
                QLHchapMapButton[i].onclick = function () {
                    if (QLHLocList[i] == "主頁") {
                        clickButton('quit_chat');
                        clickButton('home');
                    } else if (QLHLocList[i] == "使用令牌") {
                        // clickButton('quit_chat');
                        // clickButton('score');

                        doLingPai();
                        doUseLingPai();
                    } else if (QLHLocList[i] == "府邸遊俠") {
                        // clickButton('fudi');
                        clickButton('fudi juxian');
                        setTimeout(() => {
                            upFuDi();
                        }, 2000);
                    } else if (QLHLocList[i] == "背包") {
                        clickButton('quit_chat');
                        clickButton('items');
                    } else if (QLHLocList[i] == "技能") {
                        clickButton('quit_chat');
                        clickButton('skills');
                    } else if (QLHLocList[i] == "監控Q群") {
                        jianKong(this);
                    } else if (QLHLocList[i] == "打榜") {
                        // lunJian(this);
                        PaiHangFunc(this);
                    } else {
                        findQLHPath(QLHLocList[i]);
                    }
                }
            })(i);
        }
    }
    var startAutoOnTimeButton = null;
    var getRewardsButton = null;
    var digTreasureButton = null;
    var userMedecineButton = null;
    var useSkillsButton = null;
    var randomRunButton = null;
    var findSpecTargetButton = null;
    function makeMoreBtns() {

        startAutoOnTimeButton = document.createElement('button');
        startAutoOnTimeButton.innerText = '執行任務';
        startAutoOnTimeButton.style.position = 'absolute';
        startAutoOnTimeButton.style.zIndex = '10';
        startAutoOnTimeButton.style.right = '0px';
        startAutoOnTimeButton.style.top = '30px';
        currentPos = Base.currentPos + Base.delta;
        startAutoOnTimeButton.style.width = Base.buttonWidth;
        startAutoOnTimeButton.style.height = Base.buttonHeight;
        startAutoOnTimeButton.className = 'btn-add';
        startAutoOnTimeButton.id = 'btnOnTime';
        document.body.appendChild(startAutoOnTimeButton);
        startAutoOnTimeButton.addEventListener('click', fct);

        // getRewardsButton = document.createElement('button');
        // getRewardsButton.innerText = '開領獎';
        // getRewardsButton.style.position = 'absolute';
        // getRewardsButton.style.right = '270px';
        // getRewardsButton.style.top = '240px';
        // currentPos = Base.currentPos + Base.delta;
        // getRewardsButton.style.width = Base.buttonWidth;
        // getRewardsButton.style.height = Base.buttonHeight;
        // getRewardsButton.className = 'btn-add';
        // document.body.appendChild(getRewardsButton);
        // getRewardsButton.addEventListener('click', getRewardsFunc);

        // userMedecineButton = document.createElement('button');
        // userMedecineButton.innerText = '吃補藥';
        // userMedecineButton.style.position = 'absolute';
        // userMedecineButton.style.right = '270px';
        // userMedecineButton.style.top = '30px';
        // currentPos = Base.delta;
        // userMedecineButton.style.width = Base.buttonWidth;
        // userMedecineButton.style.height = Base.buttonHeight;
        // userMedecineButton.id = 'btnS';
        // userMedecineButton.className = 'btn-add btn-others';
        // document.body.appendChild(userMedecineButton);
        // userMedecineButton.addEventListener('click', userMedecineFunc);

        useSkillsButton = document.createElement('button');
        useSkillsButton.innerText = '出招';
        useSkillsButton.style.position = 'absolute';
        useSkillsButton.style.zIndex = '10';
        useSkillsButton.style.right = '180px';
        useSkillsButton.style.bottom = '2px';
        currentPos = Base.delta;
        useSkillsButton.style.width = Base.buttonWidth;
        useSkillsButton.style.height = '30px';
        useSkillsButton.className = 'btn-add';
        useSkillsButton.id = 'btn-chuzhao';
        document.body.appendChild(useSkillsButton);
        useSkillsButton.addEventListener('click', useSkillsFunc);

        // randomRunButton = document.createElement('button');
        // randomRunButton.innerText = '隨機跑';
        // randomRunButton.style.position = 'absolute';
        // randomRunButton.style.right = '450px';
        // randomRunButton.style.top = '600px';
        // currentPos = Base.delta;
        // randomRunButton.style.width = Base.buttonWidth;
        // randomRunButton.style.height = Base.buttonHeight;
        // randomRunButton.className = 'btn-add btn-others btn-place';
        // document.body.appendChild(randomRunButton);
        // randomRunButton.addEventListener('click', randomRunButtonFunc);

        findSpecTargetButton = document.createElement('button');
        // findSpecTargetButton.innerText = '尋目標';
        findSpecTargetButton.innerText = '挖礦';
        findSpecTargetButton.style.position = 'absolute';
        findSpecTargetButton.style.zIndex = '10';
        findSpecTargetButton.style.right = '180px';
        findSpecTargetButton.style.top = '30px';
        findSpecTargetButton.style.width = Base.buttonWidth;
        findSpecTargetButton.style.height = Base.buttonHeight;
        findSpecTargetButton.className = 'btn-add btn-others btn-wakuang';
        document.body.appendChild(findSpecTargetButton);
        // findSpecTargetButton.addEventListener('click', findSpecargetFunc);
        findSpecTargetButton.addEventListener('click', waKuang);

        digTreasureButton = document.createElement('button');
        digTreasureButton.innerText = '尋路';
        digTreasureButton.style.position = 'absolute';
        digTreasureButton.style.zIndex = '10';
        digTreasureButton.style.right = '90px';
        digTreasureButton.style.top = '30px';
        currentPos = Base.delta;
        digTreasureButton.style.width = Base.buttonWidth;
        digTreasureButton.style.height = Base.buttonHeight;
        digTreasureButton.className = 'btn-add btn-others btn-searchWay';
        document.body.appendChild(digTreasureButton);
        //挖寶藏 digTreasureButton.addEventListener('click', WabaoFunc);
        digTreasureButton.addEventListener('click', findSpecargetFunc);

        bixueTishi = document.createElement('span');
        bixueTishi.style.position = 'absolute';
        bixueTishi.style.left = '2px';
        bixueTishi.innerText = '';
        bixueTishi.style.color = 'red';
        bixueTishi.style.fontSize = '13px';
        bixueTishi.style.top = '53px';
        bixueTishi.className = 'bixueText';
        document.body.appendChild(bixueTishi);

        jichuTishi = document.createElement('span');
        jichuTishi.style.position = 'absolute';
        jichuTishi.style.left = '200px';
        jichuTishi.innerText = '';
        jichuTishi.style.color = 'red';
        jichuTishi.style.fontSize = '13px';
        jichuTishi.style.top = '53px';
        jichuTishi.className = 'jichuText';
        document.body.appendChild(jichuTishi);

        bixueTishi = document.createElement('span');
        bixueTishi.style.position = 'absolute';
        bixueTishi.style.left = '42px';
        bixueTishi.innerText = '';
        bixueTishi.style.color = 'red';
        bixueTishi.style.fontSize = '13px';
        bixueTishi.style.top = '0px';
        bixueTishi.className = 'hitMax';
        document.body.appendChild(bixueTishi);
    }

    // 監控Q群
    function jianKong(obj) {
        // console.log(obj);
        var Dom = $(obj);
        var text = Dom.html();
        if (text == '監控Q群') {
            Dom.html('停止監控');
            webSocketConnet();
        } else {
            Dom.html('監控Q群');
            webSocketClose();
        }

    }
    // 論劍
    var lunjianInterval = null;
    function lunJian(obj) {
        var Dom = $(obj);
        var text = Dom.html();
        if (text == '論劍') {
            Dom.html('停止論劍');
            lunjianInterval = setInterval(function () {
                doLunjianSkills();
            }, 600);
        } else {
            Dom.html('論劍');
            clearInterval(lunjianInterval);
        }
    }
    var lunjianUseDog = false;
    // 論劍釋放技能
    function doLunjianSkills() {

        if ($('#skill_1').length == 0) {
            lunjianUseDog = true;
            return;
        }
        // var qiNumber = $('#combat_xdz_text').text().split('/')[0];
        var qiNumber = gSocketMsg.get_xdz();
        if (qiNumber < 3) {
            return;
        }

        var skillArr = Base.mySkillLists.split('；');
        if (hasDog().length > 0 && lunjianUseDog) {
            lunjianUseDog = false;
        }

        if (lunjianUseDog) {
            skillArr = ['茅山道術', '天師滅神劍'];
            var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
            var clickSkillSwitch = false;
            $.each(skillIdA, function (index, val) {
                var btn = $('#skill_' + val);
                var btnName = btn.text();
                for (var i = 0; i < skillArr.length; i++) {
                    var skillName = skillArr[i];
                    if (btnName == skillName) {
                        btn.find('button').trigger('click');
                        clickSkillSwitch = true;
                        break;
                    }
                }
            });
        } else {
            var targetName = '九四浪,花飛,東方末明,七武器拳頭,魔泣神君,羅將神,愛爾奎特,邱鳴,慕雲樂,皮憲泰,邵為浩,稀飯無心,輪回之境,何為江湖';
            var qiText = gSocketMsg.get_xdz();
            if (qiText > 3) {
                doFightAll1(targetName);
            }
        }
        if (qiNumber > 9) {
            doFightAll();
        }
    }

    function showCode() {
        Jianshi.showcode = Jianshi.showcode ? 0 : 1;
        var txt = Jianshi.showcode ? '開始' : '關閉';
        g_gmain.notify_fail(HIG + txt + "輸出按鍵代碼" + NOR);
    }

    // 跟招
    var genZhaoMode = 0;
    function followPozhaoFn(e) {
        var Dom = $(e.target);
        var text = Dom.html();
        if (text == '跟招') {
            Dom.html('停止跟招');
            genZhaoMode = 1;
        } else {
            genZhaoMode = 0;
            Dom.html('跟招');
        }
    }
    // 獲取對戰方的名字
    function getVsName() {
        var c = g_obj_map.get("msg_vs_info"),
            a = gSocketMsg.get_vs_type(),
            nameArr = [];
        a = 1 == a ? 2 : 1;
        var d, e, f, g, h, j, l = gSocketMsg.get_vs_max_vs();

        for (var d = 1; d <= l; d++) {
            var b = '';
            1 < d && 0 == (d - 1) % 4 && (b += "</tr><tr>"),
                c.get("vs" + a + "_pos" + d) ? (e = c.get("vs" + a + "_name" + d),
                    b += e) : b = "";
            if (b != '') {
                nameArr.push(g_simul_efun.replaceControlCharBlank(b));
            }
        }
        return nameArr;
    }

    function getPozhaoNpcName() {
        var correctNameArr = [];
        for (var k = 0; k < killTargetArr.length; k++) {
            var name = killTargetArr[k];
            var vsNameArr = getVsName();
            if (vsNameArr.length > 0) {
                for (var i = 0; i < vsNameArr.length; i++) {
                    var vsName = vsNameArr[i];
                    if (vsName.indexOf(name) != '-1') {
                        correctNameArr.push(vsName);
                    }
                }
            } else {
                return killTargetArr;
            }
        }
        return correctNameArr;
    }
    var correctNameArr = [];

    // 苗疆煉藥
    function MjlyFunc() {
        var msg = "毒藤膠和毒琥珀準備好了嗎？\n苗疆地圖開了嗎？\n沒有就點取消！";
        if (confirm(msg) === true) {
            console.log("去苗疆。");
            setTimeout(Mjly1Func, 200);
        } else {
            return false;
        }
    }
    function Mjly1Func() {
        go('jh 40;s;s;s;s;e;s;se;sw;s;sw;e;e;sw;se;sw;se;');
        console.log("鐵索橋。");
        go('event_1_8004914;');
        setTimeout(Mjly2Func, 10000);
    }
    function Mjly2Func() {
        var place = $('#out .outtitle').text();
        if (place !== "瀾滄江南岸") {
            console.log("重新跑。");
            setTimeout(Mjly1Func, 2000);
        } else {
            console.log("繼續走。");
            go('se;s;s;e;n;n;e;s;e;ne;s;sw;e;e;ne;ne;nw;ne;ne;n;n;w;');
            setTimeout(Mjly3Func, 5000);
        }
    }
    function Mjly3Func() {
        if (isContains($('span.out2:contains(煉藥的丹爐)').text().slice(-6), '明天再來吧！')) {
            console.log("煉完了。");
            go('home');
        } else {
            go('lianyao;');
            setTimeout(Mjly3Func, 6000);
        }
    }

    // 天山玄冰
    function TianShanFunc() {
        var msg = "禦寒衣和掌門手諭準備好了嗎？\n天山地圖開了嗎？\n沒有就點取消！";
        if (confirm(msg) === true) {
            console.log("去天山。");
            setTimeout(TianShan1Func, 200);
        } else {
            return false;
        }
    }
    function TianShan1Func() {
        go('jh 39;ne;e;n;ne;ne;n;ne;nw;');
        console.log("攀山繩。");
        go('event_1_58460791;');
        setTimeout(TianShan2Func, 6000);
    }
    function TianShan2Func() {
        var place = $('#out .outtitle').text();
        if (place !== "失足巖") {
            console.log("重新跑。");
            setTimeout(TianShan1Func, 100);
        } else {
            console.log("繼續走。");
            go('nw;n;ne;nw;nw;w;n;n;n;e;e;s;');
            go('give tianshan_hgdz');
            setTimeout(TianShan3Func, 3000);
        }
    }
    function TianShan3Func() {
        go('ask tianshan_hgdz');
        go('ask tianshan_hgdz');
        setTimeout(TianShan4Func, 3000);
    }
    function TianShan4Func() {
        go('s');
        go('event_1_34855843');
        setTimeout(TianShan5Func, 3000);
    }

    function TianShan5Func() {
        if (isContains($('span.out2:contains(此打坐許久)').text().slice(-8), '離開了千年玄冰。')) {
            console.log("天山玄冰完了。");
            go('home');
        } else {
            setTimeout(TianShan5Func, 3000);
        }
    }

    // 挖寶
    function WabaoFunc() {
        go('cangbaotu_op1', 1)
    }
    function Trigger(r, h, c, n) {
        this.regexp = r;
        this.handler = h;
        this.class = c;
        this.name = n;

        this.enabled = true;

        this.trigger = function (line) {
            if (!this.enabled) return;

            if (!this.regexp.test(line)) return;

            // console.log("觸發器: " + this.regexp + "觸發了");
            var m = line.match(this.regexp);
            this.handler(m);
        };

        this.enable = function () {
            this.enabled = true;
        };

        this.disable = function () {
            this.enabled = false;
        };

    }

    var jh = function (w) {
        if (w == 'xt') w = 1;
        if (w == 'ly') w = 2;
        if (w == 'hsc') w = 3;
        if (w == 'hs') w = 4;
        if (w == 'yz') w = 5;
        if (w == 'gb') w = 6;
        if (w == 'qy') w = 7;
        if (w == 'em') w = 8;
        if (w == 'hs2') w = 9;
        if (w == 'wd') w = 10;
        if (w == 'wy') w = 11;
        if (w == 'sy') w = 12;
        if (w == 'sl') w = 13;
        if (w == 'tm') w = 14;
        if (w == 'qc') w = 15;
        if (w == 'xx') w = 16;
        if (w == 'kf') w = 17;
        if (w == 'gmd') w = 18;
        if (w == 'qz') w = 19;
        if (w == 'gm') w = 20;
        if (w == 'bt') w = 21;
        if (w == 'ss') w = 22;
        if (w == 'mz') w = 23;
        if (w == 'ts') w = 24;


        go("jh " + w, 0);
    };


    function Triggers() {
        this.allTriggers = [];

        this.trigger = function (line) {
            var t = this.allTriggers.slice(0);
            for (var i = 0, l = t.length; i < l; i++) {
                t[i].trigger(line);
            }
        };

        this.newTrigger = function (r, h, c, n) {
            var t = new Trigger(r, h, c, n);
            if (n) {
                for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                    if (this.allTriggers[i].name == n) this.allTriggers.splice(i, 1);
                }
            }

            this.allTriggers.push(t);

            return t;
        };

        this.enableTriggerByName = function (n) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.name == n) t.enable();
            }
        };

        this.disableTriggerByName = function (n) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.name == n) t.disable();
            }
        };

        this.enableByCls = function (c) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.class == c) t.enable();
            }
        };

        this.disableByCls = function (c) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.class == c) t.disable();
            }
        };

        this.removeByCls = function (c) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t && t.class == c) this.allTriggers.splice(i, 1);
            }
        };

        this.removeByName = function (n) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.name == n) this.allTriggers.splice(i, 1);
            }
        };
    }

    window.triggers = new Triggers;

    triggers.newTrigger(/似乎以下地方藏有寶物(.*)/, function (m) {
        m = m[1].split(/\d+/);
        var bl_found = false;
        for (i = 0; i < m.length; i++) {
            var a = m[i];
            // console.log(a);
            if (/一片翠綠的草地/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/大詩人白居易之墓，墓碑上刻著“唐少傅白公墓”。四周環繞著冬青。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/你現在正站在雪亭鎮南邊的一家小客棧裏，這家客棧雖小，卻是方圓五百裏/.test(a)) {
                jh('xt');
                go('dig go');
                bl_found = true;
                break;
            }
            if (/這裏是雪亭鎮鎮前廣場的空地，地上整齊地鋪著大石板。廣場中央有一個木頭搭的架子，經過多年的風吹日曬雨淋，看來非常破舊。四周建築林立。往西你可以看到一間客棧，看來生意似乎很好。/.test(a)) {
                jh('xt');
                go('e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間十分老舊的城隍廟，在你面前的神桌上供奉著一尊紅臉的城隍，廟雖老舊，但是神案四周已被香火薰成烏黑的顏色，顯示這裏必定相當受到信徒的敬仰。/.test(a)) {
                jh('xt');
                go('e;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一條普通的黃土小徑，彎彎曲曲往東北一路盤旋上山，北邊有一間城隍廟，往西則是雪亭鎮的街道。/.test(a)) {
                jh('xt');
                go('e;e;s;dig go');
                bl_found = true;
                break;
            }
            if (/這是一條普通的黃土小徑，小徑往西南通往一處山間的平地，從這裏可以望見不少房屋錯落在平地上，往東北則一路上山。/.test(a)) {
                jh('xt');
                go('e;e;s;ne;dig go');
                bl_found = true;
                break;
            }
            if (/這是一條說寬不寬，說窄倒也不窄的山路，路面用幾塊生滿青苔的大石鋪成，西面是一段坡地，從這裏可以望見西邊有幾間房屋錯落在林木間，東面則是山壁，山路往西南銜接一條黃土小徑，往北則是通往山上的石階。/.test(a)) {
                jh('xt');
                go('e;e;s;ne;ne;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是雪亭鎮的街口，往北是一個熱鬧的廣場，南邊是條小路通往一座林子，東邊則有一條小徑沿著山腰通往山上，往西是一條比較窄的街道，參差不齊的瓦屋之間傳來幾聲犬吠。從這裏向東南走就是進出關的驛道了。/.test(a)) {
                jh('xt');
                go('e;s;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是雪亭鎮的街道，你的北邊有一家客棧，從這裏就可以聽到客棧裏人們飲酒談笑/.test(a)) {
                jh('xt');
                go('e;s;w;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是一間寬敞的書院，雖然房子看起來很老舊了，但是打掃得很整潔，墻壁上掛著一幅山水畫，意境頗為不俗，書院的大門開在北邊，西邊有一扇木門通往邊廂。/.test(a)) {
                jh('xt');
                go('e;s;w;s;dig go');
                bl_found = true;
                break;
            }
            if (/這是一條寬敞堅實的青石板鋪成的大道，路上車馬的痕跡已經在路面上留下一條條明顯的凹痕，往東是一條較小的街道通往雪亭鎮。/.test(a)) {
                jh('xt');
                go('e;s;w;w;dig go');
                bl_found = true;
                break;
            }
            if (/你現在正走在雪亭鎮的街道上，東邊不遠處有一間高大的院子，門口立著一根粗大的旗桿/.test(a)) {
                jh('xt');
                go('e;n;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間素來以公平信用著稱的錢莊，錢莊的老板還是個曾經中過舉人的讀書人/.test(a)) {
                jh('xt');
                go('e;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/你現在正站在一間大宅院的入口，兩只巨大的石獅鎮守在大門的兩側，一陣陣吆喝與刀劍碰撞的聲音從院子中傳來，通過大門往東可以望見許多身穿灰衣的漢子正在操練。/.test(a)) {
                jh('xt');
                go('e;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/你現在正站在一個寬敞的教練場中，地上鋪著黃色的細砂，許多人正在這裏努力地操練著，北邊是一間高大的兵器廳，往東則是武館師父們休息的大廳。/.test(a)) {
                jh('xt');
                go('e;n;e;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間堆滿各式兵器、刀械的儲藏室，各式武器都依照種類、長短、依次放在一起，並且擦拭得一塵不染，儲藏室的出口在你的南邊，面對出口的左手邊有一個架子/.test(a)) {
                jh('xt');
                go('e;n;e;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是淳風武館的正廳，五張太師椅一字排開面對著門口，這是武館中四位大師傅與館主柳淳風的座位/.test(a)) {
                jh('xt');
                go('e;n;e;e;e;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是淳風武館中的天井，往西走可以回到正廳/.test(a)) {
                jh('xt');
                go('e;n;e;e;e;e;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是一間整理得相當乾凈的書房，紅木桌椅上鋪著藍綢巾，顯得十分考究，西面的立著一個書架，上面放著一排排的古書，往南走出房門可以看到天井。/.test(a)) {
                jh('xt');
                go('e;n;e;e;e;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是一間布置得相當雅致的廂房，從窗子可以看到北邊的天井跟南邊的庭園中各式各樣的奇花異草，以及他們所帶來的淡淡香氣，廂房的東面墻上還掛著一幅仕女圖/.test(a)) {
                jh('xt');
                go('e;n;e;e;e;e;s;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是淳風武館的內院，平常武館弟子沒有館主的允許是不敢到這裏來的/.test(a)) {
                jh('xt');
                go('e;n;e;e;e;e;e;dig go');
                bl_found = true;
                break;
            }
            if (/你現在正走在雪亭鎮的大街，往南直走不遠處是鎮上的廣場，在你的東邊是一間大宅院/.test(a)) {
                jh('xt');
                go('e;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是一間打鐵鋪子，從火爐中冒出的火光將墻壁映得通紅，屋子的角/.test(a)) {
                jh('xt');
                go('e;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是雪亭鎮的大街，東邊有一棟陳舊的建□，看起來像是什么店鋪，但是並沒有任何招牌，只有一扇門上面寫著一個大大的/.test(a)) {
                jh('xt');
                go('e;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這是一家中等規模的當鋪，老舊的櫃臺上放著一張木牌/.test(a)) {
                jh('xt');
                go('e;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是豐登當鋪的儲藏室，有時候當鋪裏的大朝奉會把鋪裏存不下的死當貨物拿出來拍賣/.test(a)) {
                jh('xt');
                go('e;n;n;n;e;e;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是雪亭鎮的大街，一條小巷子通往東邊，西邊則是一間驛站/.test(a)) {
                jh('xt');
                go('e;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是負責雪亭鎮官府文書跟軍令往來的雪亭驛/.test(a)) {
                jh('xt');
                go('e;n;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/一間小木屋，在這北方的風中吱吱作響。/.test(a)) {
                jh('xt');
                go('e;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是一處山坳，往南就是雪亭鎮，一條蜿蜒的小徑往東通往另一個鄰近的小山村/.test(a)) {
                jh('xt');
                go('e;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏便是有名的龍門石窟，石窟造像，密布於兩岸的崖壁上。遠遠可以望見琵琶峰上的白冢。/.test(a)) {
                jh('ly');
                go('dig go');
                bl_found = true;
                break;
            }
            if (/城南官道，道路兩旁是一片樹林，遠處是一片片的農田了。田地裏傳來農人的呼號，幾頭黃牛悠閑的趴臥著。/.test(a)) {
                jh('ly');
                go('n;dig go');
                bl_found = true;
                break;
            }
            if (/由此洛陽城南門出去，就可以通往南市的龍門石窟。城門處往來客商絡繹不絕，幾名守城官兵正在檢查過往行人。/.test(a)) {
                jh('ly');
                go('n;n;dig go');
                bl_found = true;
                break;
            }
            if (/洛陽最繁華的街市，這裏聚集著各國客商。/.test(a)) {
                jh('ly');
                go('n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這裏便是洛水渡口靜靜的洛水由此向東，匯入滾滾黃河。碼頭上正泊著一艘船塢，常常的纜繩垂在水中。/.test(a)) {
                jh('ly');
                go('n;n;e;s;dig go');
                bl_found = true;
                break;
            }
            if (/一艘普通的船塢，船頭坐著一位蓑衣男子。/.test(a)) {
                jh('ly');
                go('n;n;e;s;luoyang317_op1;dig go');
                bl_found = true;
                break;
            }
            if (/這兒是洛陽的南面了，街上有好幾個乞丐在行乞。/.test(a)) {
                jh('ly');
                go('n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這兒是一座供奉洛神的小廟。小廟的地上放著幾個蒲團。/.test(a)) {
                jh('ly');
                go('n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/這兒就是洛陽金刀世家了。金刀門雖然武功不算高，但也是有兩下子的。/.test(a)) {
                jh('ly');
                go('n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/金刀世家的練武場。金刀門的門主王天霸在這兒教眾弟子習武。/.test(a)) {
                jh('ly');
                go('n;n;n;e;s;dig go');
                bl_found = true;
                break;
            }
            if (/這兒是洛神廟下面的地道，上面人走動的聲音都隱約可聽見。/.test(a)) {
                jh('ly');
                go('n;n;n;w;putuan;dig go');
                bl_found = true;
                break;
            }
            if (/濕潤的青石路顯然是剛剛下過雨，因為來往行人過多，路面多少有些坑坑凹凹，一不留神很容易被絆到。/.test(a)) {
                jh('ly');
                go('n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這兒就是菜市口。各種小販商人十分嘈雜，而一些地痞流氓也混跡人群伺機作案。/.test(a)) {
                jh('ly');
                go('n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/一個豬肉攤，在這兒擺攤賣肉已經十多年了。/.test(a)) {
                jh('ly');
                go('n;n;n;n;e;s;dig go');
                bl_found = true;
                break;
            }
            if (/你剛踏進巷子，便聽得琴韻丁冬，小巷的寧靜和外面喧囂宛如兩個世界/.test(a)) {
                jh('ly');
                go('n;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/小院四周滿是盛開的桃花，穿過一條長廊，一座別致的繡樓就在眼前了。/.test(a)) {
                jh('ly');
                go('n;n;n;n;w;s;dig go');
                bl_found = true;
                break;
            }
            if (/繡樓內掛著湖綠色帳幔，一名女子斜靠在窗前的美人榻上。/.test(a)) {
                jh('ly');
                go('n;n;n;n;w;s;w;dig go');
                bl_found = true;
                break;
            }
            // if (/這裏就是背陰巷了，站在巷口可以萬劍陰暗潮濕的窄巷，這裏聚集著洛陽的地痞流氓，尋常人不敢近前。/.test(a)) {
            //     jh('ly');
            //     go('n;n;n;n;w;event_1_98995501;dig go');
            //     bl_found = true;
            //     break;
            // }
            // if (/黑暗的街道，幾個地痞無賴正慵懶的躺在一旁。/.test(a)) {
            //     jh('ly');
            //     go('n;n;n;n;w;event_1_98995501;n;dig go;n;dig go');
            //     bl_found = true;
            //     break;
            // }
            // if (/這是一家酒肆，洛陽地痞頭目甄大海正坐在裏面小酌。/.test(a)) {
            //     jh('ly');
            //     go('n;n;n;n;w;event_1_98995501;n;n;e;dig go');
            //     bl_found = true;
            //     break;
            // }
            // if (/院落裏雜草叢生，東面的葡萄架早已枯萎。/.test(a)) {
            //     jh('ly');
            //     go('n;n;n;n;w;event_1_98995501;n;w;dig go');
            //     bl_found = true;
            //     break;
            // }
            if (/一座跨街大青磚砌的拱洞高臺譙樓，矗立在城中心。鼓樓為二層木瓦建築，設有大鼓大鐘，晨鐘暮鼓，用以報時。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/相傳春秋時代，楚王在此仰望周王城，問鼎重幾何。周室暗弱，居然隱忍不發。這便是街名的由來。銀鉤賭坊也在這條街上。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/這裏便是洛陽有名的悅來客棧，只見客棧大門處人來人往，看來生意很紅火。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;n;dig go');
                bl_found = true;
                break;
            }
            if (/客棧大院，院內紫藤花架下放著幾張桌椅，東面是一座馬廄。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/客棧馬倌正在往馬槽裏添草料，旁邊草料堆看起來有些奇怪。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/房間布置的極為雅致，沒有太多的裝飾，唯有屋角放著一個牡丹屏風。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;w;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/賭坊二樓走廊，兩旁房間裏不時床來鶯聲燕語，看來這裏不止可以賭。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;w;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/通往賭坊二樓的樓梯，上面鋪著大紅色地毯。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;w;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/大廳滿是呼廬喝雉聲、骰子落碗聲、銀錢敲擊聲，男人和女人的笑聲，/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;w;n;dig go');
                bl_found = true;
                break;
            }
            if (/走出賭坊後門，桂花清香撲面而來，桂花樹下的水缸似乎被人移動過。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;w;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/賭坊門口人馬喧嘩，門上一支銀鉤在風中搖晃，不知道多少人咬上了這沒有魚餌的鉤/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;w;dig go');
                bl_found = true;
                break;
            }
            if (/自古以來，洛陽墨客騷人雲集，因此有“詩都”之稱，牡丹香氣四溢，又有“花都”的美譽/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;w;s;dig go');
                bl_found = true;
                break;
            }
            // if (/這兒是牡丹園內的一座小亭子，布置得十分雅致。/.test(a)) {
            //     jh('ly');
            //     go('n;n;n;n;n;w;s;luoyang111_op1;dig go');
            //     bl_found = true;
            //     break;
            // }
            if (/也許由於連年的戰亂，使得本來很熱鬧的街市冷冷清清，道路兩旁的店鋪早已破舊不堪，一眼望去便知道有很久沒有人居住了。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這間當鋪處於鬧市，位置極好。當鋪老板正半瞇著雙眼在高高的櫃臺上打盹。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/你無意中走進一條青石街，這裏不同於北大街的繁華熱鬧，兩邊是一些小店鋪，北面有一家酒肆，裏面出入的人看起來衣衫襤褸。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間小酒肆，裏面黑暗潮濕，滿是油垢的桌旁，幾名無賴正百無聊賴的就著一盤花生米喝酒。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/這是洛陽北邊街道，人群熙熙攘攘甚是熱鬧。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/洛陽城的錢莊，來往的商客往往都會將銀兩存於此處。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/就是洛陽北門，門口站著的是守城官兵。站在城樓望出去，外面是一片茅草路。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/城北通往邙山的小路，路旁草叢中時有小獸出沒。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/一片綠雲般的竹林隔絕了喧囂塵世，步入這裏，心不由平靜了下來。青石小路在竹林中蜿蜒穿行，竹林深處隱約可見一座小院。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/綠竹環繞的小院，院內幾間房舍都用竹子打造，與周圍竹林頗為和諧。這小院的主人顯然有些獨特之處。院內一名老翁正在劈柴。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;n;n;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/一間雅致的書齋，透過窗戶可以見到青翠修竹，四周如此清幽，竹葉上露珠滴落的聲音都能聽見。靠墻的書架看起來很別致。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;n;n;e;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/ 就是洛陽城墻上的城樓，駐守的官兵通常會在這兒歇個腳，或是聊下天。如果心細之人，能看到角落裏似乎有一個隱秘的把手。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            // if (/ 這個城樓上的密室顯然是守城軍士秘密建造的，卻不知有何用途。/.test(a)) {
            //     jh('ly');
            //     go('n;n;n;n;n;n;n;n;w;luoyang14_op1;dig go');
            //     bl_found = true;
            //     break;
            // }
            if (/這就是洛陽城的城墻。洛陽是重鎮，因此城墻上駐守的官兵格外多。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/由於連年的戰亂，整條金谷街的不少鋪子已經荒廢掉了。再往東走就是洛陽地痞流氓聚集的背陰巷。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這兒是洛陽首富的莊院，據說家財萬貫，富可敵國。莊院的的中間有一棵參天大樹。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/這兒是富人家的儲藏室，因此有不少奇珍異寶。仔細一看，竟然還有一個紅光滿面的老人家半躺在角落裏。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;n;op1;dig go');
                bl_found = true;
                break;
            }
            if (/一座樸實的石拱橋，清澈河水從橋下流過。對面可見一座水榭。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;dig go');
                bl_found = true;
                break;
            }
            if (/荷池旁的水榭，幾名遊客正在裏面小憩。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/回廊兩旁便是碧綠荷塘，陣陣荷香拂過。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/荷塘中的觀景臺，兩名女子在這裏遊玩。遠遠站著幾名護衛，閑雜人等一律被擋在外面。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/隱藏在一片蒼翠樹林中的小路，小路盡頭有座草屋。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/簡陋的茅草小屋，屋內陳設極其簡單。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/石階兩側山泉叮咚，林木森森。漫步而上，可見山腰有亭。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這就是聽伊亭，據說白居易曾與好友在此品茗、論詩。一旁的松樹上似乎有什麽東西。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/叢林小徑，因為走得人少，小徑已被雜草覆蓋。/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/聽著松濤之音，猶如直面大海/.test(a)) {
                jh('ly');
                go('n;n;n;n;n;e;e;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是華山村村口，幾個草垛隨意的堆放在路邊，三兩個潑皮慵懶躺在那裏。/.test(a)) {
                jh('hsc');
                go('dig go');
                bl_found = true;
                break;
            }
            if (/這是一條穿過村口松樹林的小路。/.test(a)) {
                jh('hsc');
                go('n;dig go');
                bl_found = true;
                break;
            }
            if (/這就是有名的神女冢，墓碑前散落著遊人墨客燒的紙錢，前面不遠處有一間破敗的土地廟。/.test(a)) {
                jh('hsc');
                go('n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一片溪邊的杏樹林，一群孩童在此玩耍。/.test(a)) {
                jh('hsc');
                go('w;dig go');
                bl_found = true;
                break;
            }
            if (/村口一個簡易茶棚，放著幾張木質桌椅，幹凈齊整，過往路人會在這裏喝杯熱茶歇歇腳，村裏的王老二常常會混在這裏小偷小摸。/.test(a)) {
                jh('hsc');
                go('w;n;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間破敗的土地廟門口，門旁的對聯已經模糊不清，隱約只見上聯“德之不修/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;dig go');
                bl_found = true;
                break;
            }
            if (/土地廟廟堂，正中供奉著土地，香案上堆積這厚厚的灰塵。/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;n;dig go');
                bl_found = true;
                break;
            }
            if (/隱藏在佛像後的地道入口，兩只黑狗正虎視眈眈的立在那裏。/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/通往西側的通道，前面被鐵柵欄擋住了。/.test(a)) {
                jh('hsc');
                bl_found = true;
                go('w;event_1_59520311;n;n;w;dig go');
                break;
            }
            if (/通往地下通道的木樓梯/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/通道兩側點著油燈，昏暗的燈光讓人看不清楚周圍的環境。/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/通往東側的通道，前面傳來有水聲和痛苦的呻吟。/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一件寬敞的大廳，正中間擺著一張太師椅，兩側放著一排椅子。/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;n;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這是一件布置極為簡單的臥房，顯然只是偶爾有人在此小憩。床上躺著一名半裸女子，滿臉驚恐。/.test(a)) {
                jh('hsc');
                go('w;event_1_59520311;n;n;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一條古老的青石街，幾個潑皮在街上遊蕩。/.test(a)) {
                jh('hsc');
                go('s;dig go');
                bl_found = true;
                break;
            }
            if (/這是一條碎石小路，前面有一個打鐵鋪。/.test(a)) {
                jh('hsc');
                go('s;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間打鐵鋪，爐火燒的正旺，一名漢子赤膊揮舞著巨錘，錘落之處但見火花四濺。/.test(a)) {

                jh('hsc');
                go('s;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/一棵千年銀杏樹屹立在廣場中央，樹下有一口古井，據說這口古井的水清澈甘甜，村裏的人每天都會來這裏挑水。/.test(a)) {
                jh('hsc');
                go('s;s;dig go');
                bl_found = true;
                break;
            }
            if (/村裏的雜貨鋪，店老板正在清點貨品。/.test(a)) {
                jh('hsc');
                go('s;s;e;dig go');
                bl_found = true;
                break;
            }
            if (/雜貨鋪後院，堆放著一些雜物，東邊角落裏放著一個馬車車廂，一個跛腳漢子坐在一旁假寐。/.test(a)) {
                jh('hsc');
                go('s;s;e;s;dig go');
                bl_found = true;
                break;
            }
            if (/這是一個普通的馬車車廂，粗布簾擋住了馬車車窗和車門，地板上面躺著一個人。/.test(a)) {
                jh('hsc');
                go('s;s;e;s;huashancun24_op2;dig go');
                bl_found = true;
                break;
            }
            if (/這是村內宗祠大門，門口一棵古槐，樹幹低垂。/.test(a)) {
                jh('hsc');
                go('s;s;w;dig go');
                bl_found = true;
                break;
            }
            if (/宗祠的大廳，這裏供奉著宗室先祖。/.test(a)) {
                jh('hsc');
                go('s;s;w;n;dig go');
                bl_found = true;
                break;
            }
            if (/青石板鋪就的小橋，幾棵野草從石縫中鉆出，清澈的溪水自橋下湍湍流過。/.test(a)) {
                jh('hsc');
                go('s;s;s;dig go');
                bl_found = true;
                break;
            }
            if (/田間泥濘的小路，一個稻草人孤單的立在一旁，似乎在指著某個地方。一個男子神色慌張的從一旁田地裏鉆出。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間竹籬圍城的小院，院內種著幾株桃花，屋後竹林環繞，頗為雅致。旁邊的西廂房上掛著一把銅制大鎖，看起來有些奇怪。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;w;dig go');
                bl_found = true;
                break;
            }
            if (/這是小院的廳堂，迎面墻壁上掛著一幅山水畫，看來小院的主人不是普通農人。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;w;n;dig go');
                bl_found = true;
                break;
            }
            if (/這是一間普通的廂房，四周窗戶被布簾遮得嚴嚴實實。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;w;get_silver;dig go');
                bl_found = true;
                break;
            }
            if (/一條雜草叢生的鄉間小路，時有毒蛇出沒。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;dig go');
                bl_found = true;
                break;
            }
            if (/一間看起來有些破敗的小茅屋，屋內角落裏堆著一堆稻草，只見稻草堆悉悉索索響了一陣，竟然從裏面鉆出一個人來。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;e;dig go');
                bl_found = true;
                break;
            }
            if (/清風寨山腳，站在此處可以搖搖望見四面懸崖的清風寨。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;dig go');
                bl_found = true;
                break;
            }
            if (/通往清風寨唯一的山路，一側便是萬丈深淵。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;dig go');
                bl_found = true;
                break;
            }
            if (/兩扇包鐵木門將清風寨與外界隔絕開來，門上寫著“清風寨”三字。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏就是桃花泉，一片桃林環繞著清澈泉水，據說泉水一年四季不會枯竭。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/清風寨前院，地面由堅硬巖石鋪就。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/清風寨練武場，四周放置著兵器架。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/清風寨議事廳，正中放置著一張虎皮椅。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏是清風寨後院，遠角有一顆大樹，樹旁有一扇小門。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這裏就是清風寨兵器庫了，裏面放著各色兵器。角落裏一個上鎖的黑鐵箱不知道裝著什麽。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;n;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/這裏的空氣中充滿清甜的味道，地上堆積著已經曬幹的柿子。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;n;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/這是清風寨寨主的臥房，床頭掛著一把大刀。/.test(a)) {
                jh('hsc');
                go('s;s;s;s;s;nw;n;n;n;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/這是通往二樓大廳的樓梯，樓梯扶手上的雕花精美絕倫，看來這酒樓老板並不是一般的生意人/.test(a)) {
                jh('yz');
                go('n;n;n;n;n;n;e;n;dig go');
                bl_found = true;
                break;
            }
            if (/二樓是雅座，文人學士經常在這裏吟詩作畫，富商土豪也在這裏邊吃喝邊作交易。/.test(a)) {
                jh('yz');
                go('n;n;n;n;n;n;e;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/進門繞過一道淡綠綢屏風，迎面墻上掛著一副『芙蓉出水』圖。廳內陳列奢華，雕花楠/.test(a)) {
                jh('yz');
                go('n;n;n;n;n;n;e;n;n;w;dig go');
                bl_found = true;
                break;
            }
            if (/進門繞過一道淡黃綢屏風，迎面墻上掛著一副『芍藥』圖，鮮嫩欲滴/.test(a)) {
                jh('yz');
                go('n;n;n;n;n;n;e;n;n;e;dig go');
                bl_found = true;
                break;
            }
            if (/進門繞過一道淡紅綢屏風，迎面墻上掛著一副『牡丹爭艷』圖，牡丹素以富貴著稱。圖側對聯：“幽徑天姿呈獨秀，古園國色冠群芳”。/.test(a)) {
                jh('yz');
                go('n;n;n;n;n;n;e;n;n;n;dig go');
                bl_found = true;
                break;
            }
            if (/你站在觀景臺上眺望，揚州城的美景盡收眼底。東面是就是小秦淮河岸，河岸楊柳輕拂水面，幾簇粉色桃花點綴其間。/.test(a)) {
                jh('yz');
                go('n;n;n;n;n;n;e;n;n;n;n;dig go');
                bl_found = true;
                break;
            }

        }
        if (bl_found) go("cangbaotu_op1");
        //      window.setTimeout('go("cangbaotu_op1")', 3000);
    }, "", "cbt");


    // 大昭寺壁畫
    function MianBiFunc() {
        console.log(getTimes() + '大昭壁畫');
        go('jh 26;w;w;n;w;w;w;n;n;e;event_1_12853448'); //大昭壁畫
    }

    window.onerror = function () {
        // return true
    };
    //-------------------------------------------------------------------------------------------------

    // 破招
    function kezhi(zhaoshi) { //1是劍法 2是拳法 3是刀法 4是暗器 5棍子 6槍
        var chuzhao = 0; //1劍法 2拳法 3刀法 4暗器 5棍子 6槍
        var skillname = "";
        var skillbutton = [];
        if (g_obj_map.get("skill_button1") != undefined)
            skillbutton[0] = ansi_up.ansi_to_text(g_obj_map.get("skill_button1").get("name"));
        else
            skillbutton[0] = 0;
        if (g_obj_map.get("skill_button2") != undefined)
            skillbutton[1] = ansi_up.ansi_to_text(g_obj_map.get("skill_button2").get("name"));
        else
            skillbutton[1] = 0;
        if (g_obj_map.get("skill_button3") != undefined)
            skillbutton[2] = ansi_up.ansi_to_text(g_obj_map.get("skill_button3").get("name"));
        else
            skillbutton[2] = 0;
        if (g_obj_map.get("skill_button4") != undefined)
            skillbutton[3] = ansi_up.ansi_to_text(g_obj_map.get("skill_button4").get("name"));
        else
            skillbutton[3] = 0;

        if (zhaoshi == 1) { //找自己的技能裏有沒有劍法
            // 槍法 燎原百擊 冰月破魔槍
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "神龍東來" || skillbutton[i - 1] == "燎原百擊" || skillbutton[i - 1] == "冰月破魔槍" || skillbutton[i - 1] == "九溪斷月槍" || skillbutton[i - 1] == "燎原百破") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }

            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "九天龍吟劍法" || skillbutton[i - 1] == "覆雨劍法" || skillbutton[i - 1] == "織冰劍法") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }

            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "排雲掌法" || skillbutton[i - 1] == "如來神掌") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            // 棍法
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "月夜鬼蕭" || skillbutton[i - 1] == "破軍棍訣" || skillbutton[i - 1] == "千影百傷棍") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "翻雲刀法" || skillbutton[i - 1] == "雪飲狂刀") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "飛刀絕技" || skillbutton[i - 1] == "孔雀翎") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            //還他媽沒有？你是不是沒有武墓或者沒有江湖絕學啊？那你破個屁招啊
        } else if (zhaoshi == 2) {  //找自己的技能裏有沒有拳法
            // 槍法 燎原百擊 冰月破魔槍
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "神龍東來" || skillbutton[i - 1] == "燎原百擊" || skillbutton[i - 1] == "冰月破魔槍" || skillbutton[i - 1] == "九溪斷月槍" || skillbutton[i - 1] == "燎原百破") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "排雲掌法" || skillbutton[i - 1] == "如來神掌") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "九天龍吟劍法" || skillbutton[i - 1] == "覆雨劍法" || skillbutton[i - 1] == "織冰劍法") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "飛刀絕技" || skillbutton[i - 1] == "孔雀翎") {

                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "翻雲刀法" || skillbutton[i - 1] == "雪飲狂刀") {

                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            // 棍法
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "月夜鬼蕭" || skillbutton[i - 1] == "破軍棍訣" || skillbutton[i - 1] == "千影百傷棍") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
        } else if (zhaoshi == 3) {
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "翻雲刀法" || skillbutton[i - 1] == "雪飲狂刀") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            // 槍法 燎原百擊 冰月破魔槍
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "神龍東來" || skillbutton[i - 1] == "燎原百擊" || skillbutton[i - 1] == "冰月破魔槍" || skillbutton[i - 1] == "九溪斷月槍" || skillbutton[i - 1] == "燎原百破") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "排雲掌法" || skillbutton[i - 1] == "如來神掌") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "飛刀絕技" || skillbutton[i - 1] == "孔雀翎") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }

            }
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "九天龍吟劍法" || skillbutton[i - 1] == "覆雨劍法" || skillbutton[i - 1] == "織冰劍法") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }

            // 棍法
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "月夜鬼蕭" || skillbutton[i - 1] == "破軍棍訣" || skillbutton[i - 1] == "千影百傷棍") {
                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
            }

        } else if (zhaoshi == 4) { //暗器絕學，無所謂什麽招。找到一個絕學就上。
            for (var i = 1; i <= 7; i++) {
                if (skillbutton[i - 1] == "翻雲刀法" || skillbutton[i - 1] == "雪飲狂刀") {

                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
                // 槍法 燎原百擊 冰月破魔槍
                for (var i = 1; i <= 7; i++) {
                    if (skillbutton[i - 1] == "神龍東來" || skillbutton[i - 1] == "燎原百擊" || skillbutton[i - 1] == "冰月破魔槍" || skillbutton[i - 1] == "九溪斷月槍" || skillbutton[i - 1] == "燎原百破") {
                        skillname = skillbutton[i - 1];
                        lianzhen(skillname, i);
                        return;
                    }
                }
                if (skillbutton[i - 1] == "九天龍吟劍法" || skillbutton[i - 1] == "覆雨劍法" || skillbutton[i - 1] == "織冰劍法") {

                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
                if (skillbutton[i - 1] == "飛刀絕技" || skillbutton[i - 1] == "孔雀翎") {

                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
                if (skillbutton[i - 1] == "排雲掌法" || skillbutton[i - 1] == "如來神掌") {

                    skillname = skillbutton[i - 1];
                    lianzhen(skillname, i);
                    return;
                }
                // 棍法
                for (var i = 1; i <= 7; i++) {
                    if (skillbutton[i - 1] == "月夜鬼蕭" || skillbutton[i - 1] == "破軍棍訣" || skillbutton[i - 1] == "千影百傷棍") {
                        skillname = skillbutton[i - 1];
                        lianzhen(skillname, i);
                        return;
                    }
                }
            }
        }
    }
    function checkzhen(skillname, skillbutton) {//按照按鈕編號返回數值 0就是沒有可以成陣的按鈕
        // console.log(skillname+"是我剛剛用的");
        if (skillname == "神龍東來") {
            if (skillbutton.indexOf("月夜鬼蕭") >= 0)
                return skillbutton.indexOf("月夜鬼蕭");
            return -1;
        }
        if (skillname == "燎原百擊") {
            if (skillbutton.indexOf("九溪斷月槍") >= 0)
                return skillbutton.indexOf("九溪斷月槍");
            if (skillbutton.indexOf("燎原百破") >= 0)
                return skillbutton.indexOf("燎原百破");
            return -1;
        }
        if (skillname == "九天龍吟劍法") {
            if (skillbutton.indexOf("排雲掌法") >= 0)
                return skillbutton.indexOf("排雲掌法");
            if (skillbutton.indexOf("雪飲狂刀") >= 0)
                return skillbutton.indexOf("雪飲狂刀");
            return -1;
        }
        if (skillname == "排雲掌法") {
            if (skillbutton.indexOf("九天龍吟劍法") >= 0)
                return skillbutton.indexOf("九天龍吟劍法");
            if (skillbutton.indexOf("雪飲狂刀") >= 0)
                return skillbutton.indexOf("雪飲狂刀");
            return -1;
        }
        if (skillname == "雪飲狂刀") {
            if (skillbutton.indexOf("排雲掌法") >= 0)
                return skillbutton.indexOf("排雲掌法");
            if (skillbutton.indexOf("九天龍吟劍法") >= 0)
                return skillbutton.indexOf("九天龍吟劍法");
            return -1;
        }
        if (skillname == "翻雲刀法") {
            if (skillbutton.indexOf("覆雨劍法") >= 0)
                return skillbutton.indexOf("覆雨劍法");
            if (skillbutton.indexOf("飛刀絕技") >= 0)
                return skillbutton.indexOf("飛刀絕技");
            return -1;
        }
        if (skillname == "覆雨劍法") {
            if (skillbutton.indexOf("如來神掌") >= 0)
                return skillbutton.indexOf("如來神掌");
            if (skillbutton.indexOf("翻雲刀法") >= 0)
                return skillbutton.indexOf("翻雲刀法");
            return -1;
        }
        if (skillname == "飛刀絕技") {
            if (skillbutton.indexOf("翻雲刀法") >= 0)
                return skillbutton.indexOf("翻雲刀法");
            if (skillbutton.indexOf("織冰劍法") >= 0)
                return skillbutton.indexOf("織冰劍法");
            return -1;
        }
        if (skillname == "織冰劍法") {
            if (skillbutton.indexOf("飛刀絕技") >= 0)
                return skillbutton.indexOf("飛刀絕技");
            if (skillbutton.indexOf("孔雀翎") >= 0)
                return skillbutton.indexOf("孔雀翎");
            return -1;
        }
        if (skillname == "孔雀翎") {
            if (skillbutton.indexOf("織冰劍法") >= 0)
                return skillbutton.indexOf("織冰劍法");
            if (skillbutton.indexOf("如來神掌") >= 0)
                return skillbutton.indexOf("如來神掌");
            return -1;
        }
        if (skillname == "如來神掌") {
            if (skillbutton.indexOf("孔雀翎") >= 0)
                return skillbutton.indexOf("孔雀翎");
            if (skillbutton.indexOf("覆雨劍法") >= 0)
                return skillbutton.indexOf("覆雨劍法");
            return -1;
        }
        if (skillname == "破軍棍訣") {
            if (skillbutton.indexOf("翻雲刀法") >= 0)
                return skillbutton.indexOf("翻雲刀法");
            if (skillbutton.indexOf("飛刀絕技") >= 0)
                return skillbutton.indexOf("飛刀絕技");
            if (skillbutton.indexOf("如來神掌") >= 0)
                return skillbutton.indexOf("如來神掌");
            return -1;
        }
        if (skillname == "九溪斷月槍") {
            if (skillbutton.indexOf("如來神掌") >= 0)
                return skillbutton.indexOf("如來神掌");
            if (skillbutton.indexOf("孔雀翎") >= 0)
                return skillbutton.indexOf("孔雀翎");
            return -1;
        }
    }
    function lianzhen(skillname, i) {//連陣 連陣畢竟是危險的事情，那麽只有在幾種情況下。第一 對面敵人數目只有一人。 第二 我的氣大於等於6 敵人小於等於3 這樣我出陣 大不了敵人破招而已。
        var enemycounter = 0;
        // console.log("*目前我有氣"+gSocketMsg.get_xdz() + '*');
        for (i = 1; i <= 8; i++) {
            if (g_obj_map.get("msg_vs_info").get("vs" + obside + "_name" + i) != undefined) {
                enemycounter++;
            }
        }
        var skillbutton = [];
        if (g_obj_map.get("skill_button1") != undefined)
            skillbutton[0] = ansi_up.ansi_to_text(g_obj_map.get("skill_button1").get("name"));
        else
            skillbutton[0] = 0;
        if (g_obj_map.get("skill_button2") != undefined)
            skillbutton[1] = ansi_up.ansi_to_text(g_obj_map.get("skill_button2").get("name"));
        else
            skillbutton[1] = 0;
        if (g_obj_map.get("skill_button3") != undefined)
            skillbutton[2] = ansi_up.ansi_to_text(g_obj_map.get("skill_button3").get("name"));
        else
            skillbutton[2] = 0;
        if (g_obj_map.get("skill_button4") != undefined)
            skillbutton[3] = ansi_up.ansi_to_text(g_obj_map.get("skill_button4").get("name"));
        else
            if (g_obj_map.get("skill_button5") != undefined)
                skillbutton[4] = ansi_up.ansi_to_text(g_obj_map.get("skill_button5").get("name"));
            else
                if (g_obj_map.get("skill_button6") != undefined)
                    skillbutton[5] = ansi_up.ansi_to_text(g_obj_map.get("skill_button6").get("name"));
                else
                    skillbutton[3] = 0;
        skillname = ansi_up.ansi_to_text(skillname);
        // console.log("使用按鈕"+i);
        // console.log("出招"+skillname);
        var enemyxdz = 0;
        if (enemycounter != 1) {
            for (var i = 1; i <= 4; i++) {
                if (g_obj_map.get("msg_vs_info") != undefined && g_obj_map.get("msg_vs_info").get("vs" + obside + "_xdz" + i) != undefined) {
                    enemyxdz = g_obj_map.get("msg_vs_info").get("vs" + obside + "_xdz" + i);
                    break;
                }
            }
        }

        clickButton('playskill ' + (skillbutton.indexOf(skillname) + 1), 0); //無論是誰，我先反擊一下
        var xdz = gSocketMsg.get_xdz(); //獲取我當時的行動值
        //重新獲取我們按鈕的布局
        if (g_obj_map.get("skill_button1") != undefined)
            skillbutton[0] = ansi_up.ansi_to_text(g_obj_map.get("skill_button1").get("name"));
        else
            skillbutton[0] = 0;
        if (g_obj_map.get("skill_button2") != undefined)
            skillbutton[1] = ansi_up.ansi_to_text(g_obj_map.get("skill_button2").get("name"));
        else
            skillbutton[1] = 0;
        if (g_obj_map.get("skill_button3") != undefined)
            skillbutton[2] = ansi_up.ansi_to_text(g_obj_map.get("skill_button3").get("name"));
        else
            skillbutton[2] = 0;
        if (g_obj_map.get("skill_button4") != undefined)
            skillbutton[3] = ansi_up.ansi_to_text(g_obj_map.get("skill_button4").get("name"));
        else
            if (g_obj_map.get("skill_button5") != undefined)
                skillbutton[4] = ansi_up.ansi_to_text(g_obj_map.get("skill_button5").get("name"));
            else
                if (g_obj_map.get("skill_button6") != undefined)
                    skillbutton[5] = ansi_up.ansi_to_text(g_obj_map.get("skill_button6").get("name"));
                else
                    skillbutton[3] = 0;
        var checkbutton = -1;
        checkbutton = checkzhen(skillname, skillbutton);
        if (checkbutton >= 0) {//enemyxdz<=3
            if (xdz >= 6) {
                // console.log("連陣按鈕"+(checkbutton+1));
                // console.log("我要出的絕學是"+g_obj_map.get("skill_button"+(checkbutton+1)).get("name"));
                clickButton('playskill ' + (checkbutton + 1), 0);
            }
        }
    }

    function fighttype(msg) {
        var sword, cuff, blade;//判斷哪個值大，用來判斷最後一個陣法出現的位置
        sword = msg.lastIndexOf("劍");
        cuff = msg.lastIndexOf("掌");
        if (msg.lastIndexOf("拳") > cuff) {
            cuff = msg.lastIndexOf("拳");
        }
        blade = msg.lastIndexOf("刀");
        if (sword > cuff && sword > blade) {
            return 2
        } else if (cuff > sword && cuff > blade) {
            return 3;
        } else if (blade > sword && blade > cuff) {
            return 1;
        } else {
            return 4;
        }
    }

    var obside = 0;

    function ZhuangBei(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '戰鬥裝備') {
            console.log("切換戰鬥裝備！");
            go('wield weapon_sb_sword10');      // 九天龍吟劍
            go('wear equip_moke_finger10');     // 斬龍戒指
            go('wear equip_moke_head10');       // 斬龍帽子
            go('wield weapon_sb_sword11');      // 11套劍
            go('wear equip_moke_finger11');     // 11套戒指
            go('wear equip_moke_head11');       // 11套帽子
            Dom.html('打坐裝備');
        } else {
            console.log("切換打坐裝備！");
            go('wield longwulianmoge_mojianlianhun');   // 幫3劍
            go('wear tianlongsi_mumianjiasha'); // 木棉袈裟
            go('wield sword of windspring rumai'); // 入脈風泉
            go('wield weapon_stick_miaoyun_lhx'); // 簫
            go('wear equip_finger_kongdong_bulao');  // 戒指
            go('wear equip_head_tianji_jiuxuan');   // 帽子
            Dom.html('戰鬥裝備');
        }
    };
    // 逃跑吃藥
    async function escapeAndEat() {
        clickButton('escape');
        clickButton('items use snow_wannianlingzhi');
    };

    // 面板觸發
    // window.game = this;

    window.attach = function () {
        if (!window.webSocketMsg) {
            return false;
        }

        var oldWriteToScreen = window.writeToScreen;
        window.writeToScreen = function (a, e, f, g) {
            oldWriteToScreen(a, e, f, g);
            a = a.replace(/<[^>]*>/g, "");
            triggers.trigger(a);
        };
        window.userId = getQueryString('id');
        loadAfter();
        window._dispatch_message = webSocketMsg.prototype.old = gSocketMsg.dispatchMessage;
        gSocketMsg.dispatchMessage = function (b) {
            var type = b.get("type");
            var subType = b.get("subtype");
            var ctype = b.get("ctype");
            var msg = b.get("msg");

            if (type == 'main_msg' && ctype == 'text' && /：ASSIST\//.test(msg)) {
                if (msg.indexOf('record') > 0) {
                    reSaveQianLong(msg);
                }
                if (msg.indexOf('告訴你：ASSIST') > 0 && msg.indexOf('join') > 0) {
                    console.log(msg);
                    joinTeam(msg);
                }
                if (msg.indexOf('告訴你：ASSIST') > 0 && msg.indexOf('bang') > 0) {
                    console.log(msg);
                    doBang1(msg);
                }
                if (msg.indexOf('告訴你：ASSIST') > 0 && msg.indexOf('you') > 0) {
                    goYouMing()
                }
                if (msg.indexOf('告訴你：ASSIST') > 0 && msg.indexOf('XUESHAN') > 0) {
                    console.log(msg);
                    goCorrectBingXue(msg);
                    msg = removeChart(msg);
                    if (msg.indexOf('find') > 0) {
                        var new_msg = msg.split('find/')[1];
                        g_gmain.clickButton('team chat ' + new_msg);
                    }
                }
                if (msg.indexOf('告訴你：ASSIST') > 0 && msg.indexOf('zha') > 0) {
                    console.log(msg);
                    goZha(msg);
                }
                return false;
            } else if (type == 'channel' && subType == 'tell' && /你告訴.+：ASSIST\//.test(msg)) {
                return false;
            } else if (type == 'channel' && subType == 'tell' && /告訴你：ASSIST\//.test(msg)) {
                return false;
            }
            if (type == 'main_msg' && ctype == 'text' && /：QUESTION\//.test(msg)) {
                var txt = g_simul_efun.replaceControlCharBlank(
                    msg.replace(/\u0003.*?\u0003/g, "")
                );
                if (!txt) {
                    return false;
                }
                if (txt.indexOf('謎題密碼') > 0) {
                    var txtArr = txt.split('：');
                    var txtMima = txtArr ? txtArr[txtArr.length - 1] : '';
                    if (txtMima) {
                        txtMima = txtMima.replace(/\s+/g, "");
                        // var submitCode = 'event_1_65953349 ' + txtMima;
                        var goPath = 'jh 1;e;n;n;n;n;w;event_1_65953349 ' + txtMima;
                        var txtPush = [
                            {
                                name: '【交密碼】',
                                way: goPath
                            }
                        ];
                        addScreenBtn(txtPush);
                        var place = txt.split('--')[0].split('/').length > 0 ? txt.split('--')[0].split('/')[2] : '';
                        var puzzleFinish = /完成謎題\((\d+)\/\d+\)：(.*)的謎題\S*\s*\S*x(\d+)\s*\S*x\d+\s*\S*銀兩x(\d{1,})/.exec(txt);
                        writeScreenBtns(puzzleFinish[2]);
                        findSpecTagerInfo = puzzleFinish[2];
                        log('暴擊npc：' + place + '-' + puzzleFinish[2]);
                    }
                } else {
                    var place = txt.split('--')[0].split('/').length > 0 ? txt.split('--')[0].split('/')[2] : '';
                    var puzzleFinish = /完成謎題\((\d+)\/\d+\)：(.*)的謎題\S*\s*\S*x(\d+)\s*\S*x\d+\s*\S*銀兩x(\d{1,})/.exec(txt);
                    writeScreenBtns(puzzleFinish[2]);
                    findSpecTagerInfo = puzzleFinish[2];
                    log('暴擊npc：' + place + '-' + puzzleFinish[2]);
                }
                return;
            }

            if (this.old) {
                this.old(b);
            }
            qlMon.dispatchMessage(b);
            // if (genZhaoMode==1){
            //     genZhaoView.dispatchMessage(b);
            // }
            if (escapeTrigger == 1) {
                escapeFunc.dispatchMessage(b)
            }
            // if (duiZhaoMode == 1 || genZhaoMode == 1 || daLouMode == 1) {
            zhanDouView.dispatchMessage(b);
            // }
            setTimeout(function () {
                var userId = g_obj_map.get("msg_attrs").get('id');
                window.qianlongCookieName = 'ql-' + userId;
            }, 200);

            if (type == "disconnect" && subType == "change") {
                if (!hasSendReload) {
                    hasSendReload = true;
                    var sendid = getQueryString('id');
                    var sendqu = Base.correctQu();
                    var sendtext = '';
                    if (nameObj[sendid]) {
                        sendtext = 'Duang,' + sendqu + '區，' + nameObj[sendid] + '被頂下線了!';
                        goInLine(sendtext);
                    }
                    if (Jianshi.chonglian == 1) {
                        setTimeout(function () {
                            reloadGame();
                        }, 20 * 1000);
                    }
                }
            }
        }
    };

    // 獲取氣血的百分比
    function geKeePercent() {
        var max_kee = g_obj_map.get("msg_attrs").get("max_kee");
        var kee = g_obj_map.get("msg_attrs").get("kee");
        var keePercent = parseInt(kee / max_kee * 100);
        return keePercent;
    }
    // 獲取內力的百分比
    function geForcePercent() {
        var max_force = g_obj_map.get("msg_attrs").get("max_force");
        var force = g_obj_map.get("msg_attrs").get("force");
        var forcePercent = parseInt(force / max_force * 100);
        return forcePercent;
    }
    // 加入隊伍
    function joinTeam(msg) {
        var txt = g_simul_efun.replaceControlCharBlank(
            msg.replace(/\u0003.*?\u0003/g, "")
        );
        var uid = txt.split('join/')[1];
        uid = $.trim(uid);
        clickButton('team join ' + uid);
    }
    function tellJoinTeam() {
        clickButton('team create');
        clickButton('tell u4219507 ASSIST/join/u4253282');
        clickButton('tell u7894304 ASSIST/join/u4253282');
        clickButton('tell u7030223 ASSIST/join/u4253282');
    }

    function doBang1(msg) {
        var txt = g_simul_efun.replaceControlCharBlank(
            msg.replace(/\u0003.*?\u0003/g, "")
        );
        if (txt.indexOf('close') > 0) {
            openOnTime();
            closeTianJian();
        } else {
            var num = txt.split('bang/')[1];
            num = $.trim(num);
            num = parseInt(num);
            doBang(num);
        }
    }
    function tellGoBang1(num) {
        clickButton('tell u4219507 ASSIST/bang/' + num);
        clickButton('tell u7894304 ASSIST/bang/' + num);
        clickButton('tell u7030223 ASSIST/bang/' + num);
        doBang(num);
    }
    function tellGoBang2(num) {
        clickButton('tell u4219507 ASSIST/bang/' + num);
        clickButton('tell u7894304 ASSIST/bang/' + num);
        clickButton('tell u7030223 ASSIST/bang/' + num);
        doBang(num);
    }
    function tellBangClose() {
        clickButton('tell u4219507 ASSIST/bang/close11');
        clickButton('tell u7894304 ASSIST/bang/close11');
        clickButton('tell u7030223 ASSIST/bang/close11');
    }

    function tellGoYouMing() {
        clickButton('tell u4219507 ASSIST/you/go');
        clickButton('tell u7894304 ASSIST/you/go');
        clickButton('tell u7030223 ASSIST/you/go');
        goYouMing();
        setTimeout(() => {
            $('#houyuanbtn').trigger('click');
        }, 20 * 1000);
    }

    function goYouMing() {
        go('jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e;e;e;event_1_77775145 ymsz_houyuan');
    }

    function acceptTeam() {
        clickButton('team');
        setTimeout(() => {
            var team_msg = g_obj_map.get("msg_team");
            if (team_msg) {
                var team_elements = team_msg.elements;
                for (var i = 0; i < team_elements.length; i++) {
                    if (team_elements[i].key.indexOf('try_member') >= 0) {
                        var id = team_elements[i].value.split(',')[0];
                        if (id) {
                            clickButton('team allow ' + id);
                        }
                    }
                }
            }
        }, 2000);
        // clickButton('team allow u4219507');
        // clickButton('team allow u7894304');
        // clickButton('team allow u7030223');
    }
    // 告訴炸
    function tellZha(text) {
        clickButton('tell u4219507 ASSIST/zha/' + text);
    }
    function stopZha(text) {
        clickButton('tell u4219507 ASSIST/zha/' + text);
    }
    // 去炸
    function goZha(text) {
        if (g_gmain.is_fighting) {
            warnning('戰鬥中...');
            return;//戰鬥中
        }
        if (text.indexOf('停止')) {
            go('home');
            clearInterval(killGoodSetInterval);
            Base.skills();
            return false;
        }
        if (killGoodSetInterval) {
            clearInterval(killGoodSetInterval);
        }
        text = removeChart(text);
        text = text.replace(/炸/g, '');
        var placetext = text.split('zha/')[1];
        var zhaObj = placetext.split('-');
        var place = zhaObj[0];
        var name = zhaObj[1];
        name = name.replace(/\n/g, "");
        var hasPerson = hasSamePerson(name);
        Base.mySkillLists = '霹靂彈';
        if (hasPerson.length > 0) {
            killGoodSetInterval = setInterval(function () {
                var hp = geKeePercent();
                if (hp > 95) {
                    killSet([name]);
                }
            }, 300);
        } else {
            Jianshi.zha = 1;
            isOnstep1 = false;
            goFindNpcInPlace(place, name);
        }
    }

    function doBang(num) {
        if (num > 4) {
            //clickButton('clan fb enter_51 daxuemangongdao', 0)
            go('clan fb enter_' + num + ' daxuemangongdao');
        } else {
            go('clan fb enter shenshousenlin');
            switch (num) {
                case 1:
                    go('event_1_40313353');
                    break;
                case 2:
                    go('event_1_2645997');
                    break;
                case 3:
                    go('event_1_43755600');
                    break;
                case 4:
                    go('event_1_64156549');
                    break;
            }
        }
        openTianJian();
        removeOnTime();
        sendToQQ('開始幫派' + num);
    }

    // attach();
    // 開啟本地服務
    var webSocket;

    function webSocketClose() {
        webSocket.close();
        webSocket = null;
    }
    function webSocketConnet() {
        webSocket = new WebSocket("ws://localhost:25303");

        webSocket.onerror = function (event) {
            console.log(event);
        };

        webSocket.onopen = function (event) {
            console.log(event);
            goInLine();
        };

        webSocket.onclose = function (event) {
            console.log(event);
        };

        webSocket.onmessage = function (event) {
            onMessage(event)
        };
    }

    function onMessage(event) {

        var obj = eval('(' + decodeURI(event.data) + ')');
        if (obj.error != 0) {
            return;
        }
        if (obj.fromGroup == '465355403') {
            var txt = obj.msg;
            if (txt.indexOf('開幫派副本') != '-1') {
                openBangFu();
            }

            if (obj.fromQQ == '35994480') {
                if (txt.indexOf('開幫派碎片') != '-1') {
                    openBangSuiPian();
                }
            }
        }
        //console.log(obj);
        if (obj.fromGroup != '291849393') {
            return;
        } else {
            var txt = obj.msg;

            if (isKuaFu()) {
                if (txt.indexOf('跨服時空') != '-1') {
                    getKuaPlace(txt);
                }
                return;
            } else {
                // 出遊俠
                var qu = Base.correctQu();
                // console.log(qu);
                if (txt.indexOf('出遊俠') != '-1') {
                    if (txt.indexOf(qu) != '-1') {
                        goQixia(txt);
                    }
                }
                if (obj.fromQQ == '348728733') {
                    if (txt.indexOf('重連') != '-1') {
                        goInLine("開始" + txt);
                        window.location.reload();
                    }
                }
                if (obj.fromQQ == '35994480') {
                    if (txt.indexOf('do簽到') != '-1') {
                        goInLine("開始" + txt);
                        CheckIn();
                    }
                    if (txt.indexOf('發現') != '-1' && txt.indexOf('位於') != '-1') {
                        goCorrectBingXue(txt);
                        // g_gmain.clickButton('team chat ' + msg);
                    }
                    if (txt.indexOf('英雄隊伍') != '-1') {
                        goInLine("申請加入" + txt);
                        clickButton('team join u7598502');
                    }
                    if (txt.indexOf('皮隊伍') != '-1') {
                        goInLine("申請加入" + txt);
                        go('rank go 235');
                        clickButton('team join u5921792');
                    }
                    if (txt.indexOf('蒼蠅隊伍') != '-1') {
                        goInLine("申請加入" + txt);
                        clickButton('team join u2626349')
                    }
                    if (txt.indexOf('掛機江湖') != '-1') {
                        goInLine(txt);
                        startJianghu();
                    }
                    if (txt.indexOf('東方隊伍') != '-1') {
                        goInLine("小號申請加入" + txt);
                        tellJoinTeam();
                    }
                    if (txt.indexOf('go挖礦') != '-1') {
                        goInLine(txt);
                        goWaKuang();
                    }
                    if (txt.indexOf('question-') != '-1') {
                        // goInLine(txt);
                        startQuestion(txt);
                    }
                    if (txt.indexOf('go幽冥3') != '-1') {
                        goInLine("去" + txt);
                        tellGoYouMing();
                    }
                    if (txt.indexOf('go釣魚') != '-1') {
                        goInLine("去" + txt);
                        startDiaoYu();
                    }
                    if (txt.indexOf('幫派副本1-1') != '-1') {
                        goInLine("去" + txt);
                        tellGoBang1(1);
                    }
                    if (txt.indexOf('幫派副本1-2') != '-1') {
                        goInLine("去" + txt);
                        tellGoBang1(2);
                    }
                    if (txt.indexOf('幫派副本1-3') != '-1') {
                        goInLine("去" + txt);
                        tellGoBang1(3);
                    }
                    if (txt.indexOf('幫派副本1-4') != '-1') {
                        goInLine("去" + txt);
                        tellGoBang1(4);
                    }
                    if (txt.indexOf('幫派副本2-') != '-1') {
                        goInLine("去" + txt);
                        var bangPaiFubenNum = txt.split('-')[1];
                        tellGoBang2(bangPaiFubenNum);
                    }
                    if (txt.indexOf('幫派副本3') != '-1') {
                        goInLine("掃蕩幫派副本3");
                        clickButton('clan');
                        clickButton('clan fb go_saodang longwulianmoge');
                        // 掃蕩副本3
                    }
                    if (txt.indexOf('歡迎入隊') != '-1') {
                        goInLine('歡迎加入東方隊伍');
                        acceptTeam();
                    }
                    if (txt.indexOf('doVip簽到') != '-1') {
                        goInLine("開始" + txt);
                        CheckInFunc();
                    }
                    // if (txt.indexOf('do刷碎片') != '-1') {
                    // goInLine("開始" + txt);
                    // killDrunkManFunc();
                    // }
                    if (txt.indexOf('do其他') != '-1') {
                        goInLine("開始" + txt);
                        CheckInFunc1();
                    }
                    if (txt.indexOf('do冰月') != '-1') {
                        goInLine("開始" + txt);
                        getBingyue();
                    }
                    if (txt.indexOf('do打榜') != '-1') {
                        goInLine("開始" + txt);
                        $('#btn-hitBang').trigger('click');
                    }
                    if (txt.indexOf('do令牌') != '-1') {
                        goInLine("開始" + txt);
                        doLingPai();
                    }
                    if (txt.indexOf('秒突') != '-1') {
                        goInLine("開始" + txt);
                        tupoSpeed();
                    }
                    if (txt.indexOf('突破加速') != '-1') {
                        goInLine("開始" + txt);
                        tupoSpeed1();
                    }
                    if (txt.indexOf('練習技能') != '-1') {
                        goInLine("開始" + txt);
                        skillPritice();
                    }
                    if (txt.indexOf('do use 令牌') != '-1') {
                        goInLine("開始" + txt);
                        doUseLingPai();
                    }
                    if (txt.indexOf('do突破') != '-1') {
                        goInLine("開始" + txt);
                        tupoSkills2();
                    }
                    if (txt.indexOf('重連') != '-1') {
                        goInLine("開始" + txt);
                        window.location.reload();
                    }
                    if (txt.indexOf('炸') != '-1' && txt.indexOf('-') != '-1') {
                        goInLine("開始" + txt);
                        tellZha(txt);
                    }
                    if (txt.indexOf('炸') != '-1' && txt.indexOf('停止') != '-1') {
                        goInLine("開始" + txt);
                        stopZha(txt);
                    }
                }

            }
        }
    }
    function sendToQQ(txt) {
        var msgObject = { "act": "101", "groupid": "291849393" };
        msgObject["msg"] = getTimes() + txt.replace(/\n/g, "");
        console.log(txt);
        if (webSocket) webSocket.send(JSON.stringify(msgObject));
    }

    function goQixia(txt) {
        txt = txt.split(',');
        findSpecTagerInfo = txt[1];

        autoFindSpecargetFunc();
    }


    var hasDoOnece = false;
    var hasSendMsg = false;
    // 到時做XXX
    function doOnTime() {
        var hours = getHours();
        var minTime = getMin();
        // var week = getWeek();
        // if (kuafuNpc != ''){
        //     return false;
        // }
        if (stopOnTime) {
            return false;
        }

        // 1、6、15 點
        if (hours == 12 || hours == 15) {
            hasDoOnece = false;
        }
        if (g_gmain.is_fighting) {
            warnning('戰鬥中...');
            return;//戰鬥中
        }
        // 0點 觀舞
        if (hours == 0) {
            $('span:contains(你今天試劍次數已達限額)').html('');
            mijingNum = 0;
            qixiaDone = false;
            if (minTime > 30) {
                if (isBigId()) {
                    guanWu();
                }
            } else {
                CheckIn();
            }
        }

        // 1點 蹲守雪山弟子
        // if (hours == 1) {
        //     if (isBigBixue()) {
        //         openXueShan();
        //         // dunXueShan();
        //     } else {
        //         CheckIn();
        //     }
        // }
        // if (hours == 2 || hours == 3 || hours == 4) {
        //     if (isBigBixue()) {
        //         openXueShan();
        //         // dunXueShan();
        //     }
        // }

        // 5點買藥
        if (hours == 5) {
            // closeXueShan();
            if (minTime > 30) {
                if (isBigId()) {
                    CheckInFunc1();
                    vipRiChang();
                }
            } else {
                maiYao();
            }
            delBiaoji()
        }
        // 6點 簽到
        if (hours == 6) {
            openBangFu();
            CheckIn();
            isDoneXueShan = false;
            hasDoneBangPai4 = false;
            // if (isBigBixue()) {
            //     startTaoFan();
            // }
            if (Base.getCorrectText('4253282')) {
                startJianghu();
            }
        }

        // 10 撩奇俠
        if (hours == 10) {
            Jianshi.sp = 0;
            GetNewQiXiaList(); // 生成奇俠列表
            setTimeout(function () {
                GiveMoneyOnTime();
            }, 5000);
        }
        // 11 試劍
        if (hours == 11) {
            go('home');
            go('swords report go');
            go('swords');
            if ($('#btno3').html() == "試劍") {
                $('#btno3').trigger('click');
            }
        }
        // // 12點 秒突
        // if (hours == 12) {
        //     doOnce(1)
        // }
        // 13 使用令牌打榜
        if (hours == 13) {
            // if (isLittleId() || isSmallId() || isSixId()) {
            //     waKuang();
            // }
            if (isBigBixue()) {
                doOnce('6');    // 令牌 打榜
            }
        }

        // 14點突破
        if (hours == 14) {
            tupoSpeed1();
        }

        // 16點 答題
        if (hours == 16) {
            doOnce(4);
        }

        // 17點與奇俠聊天
        if (hours == 17) {
            if (minTime > 30) {
                talkSelectQiXia();
            }
        }

        // 18點領獎勵
        if (hours == 18) {
            doReplay();
        }
        // 19點冰月或簽到
        if (hours == 19) {
            if (isBigId()) {
                getBingyue();
            }
            skillPritice();
        }

        // 21 回幫派 打坐
        if (hours == 21) {
            openBangFu();
            if (getWeek() == '3') {
                go('swords get_drop go');   // 領取論劍獎勵
            }
            go('clan scene');
            if (Base.getCorrectText('7598640')) {
                go('clan open_double go');
                go('clan open_triple go');
                hasSendMsg = true;
                var json_msg = '幫派開雙倍了';
                var msg = '[CQ:at,qq=35994480] ' + json_msg;
                var json_str = '{"act":"101","groupid":"465355403","msg": "' + msg + '"}';
                if (isOnline) {
                    // if(webSocket)webSocket.send(json_str);
                }

            }
        }
        if (hours == 1 || hours == 2 || hours == 3 || hours == 4 || hours == 23) {
            // 釣魚
            startDiaoYu();
        }
    }

    // 掛機號簽到
    function doOnTimeGuaJi() {
        var hours = getHours();
        // var week = getWeek();
        // 6點簽到
        if (hours == 6) {
            if (Base.getCorrectText('7905194')) {
                stopTaofanOntime()
            }
            if (Base.getCorrectText('6965572')) {
                openBangFu();
            }
            CheckIn();
        }
        if (hours == '7') {
            if (Base.getCorrectText('7905194')) {
                doTaofanOntime()
            }
        }
        // 19點簽到
        if (hours == 19) {
            // if(Base.getCorrectText('6965572')){
            //     go('clan fb go_saodang shenshousenlin');
            // }
            if (Base.getCorrectText('7905194')) {
                stopTaofanOntime()
            }
            CheckIn();
        }
        // 20點簽到
        if (hours == 20) {
            if (Base.getCorrectText('7905194')) {
                doTaofanOntime()
            }
        }
        // 21 回幫派 打坐
        if (hours == 21) {
            if (getWeek() == '3') {
                go('swords get_drop go');   // 領取論劍獎勵
            }
        }
    }
    function doTaofanOntime() {
        if (Jianshi.qingzhengxie == '1') {
            return;
        } else {
            $('#btnm3').trigger('click');
        }
    }
    function stopTaofanOntime() {
        if (Jianshi.qingzhengxie == '1') {
            $('#btnm3').trigger('click');
        } else {
            return
        }
    }
    // 每天執行一次
    function doOnce(type) {

        if (!hasDoOnece) {
            hasDoOnece = true;
            if (type == '1') {
                // fishingFirstFunc();     // 釣魚
                tupoSpeed(); // 秒突
            }
            // if (type == '2') {
            //     killDrunkManFunc();     // 刷碎片
            // }
            if (type == '3') {
                newGetXiaKe();          // 俠客島
            }
            if (type == '4') {
                $('#btno4').trigger('click')    // 答題
            }
            if (type == '6') {
                doLingPai(); //換取令牌
                doUseLingPai(); //使用令牌
            }
        }

        if (type == '5') {            // 簽到
            doReplay();
        }

    }
    // 獲取當前時間
    function getHours() {
        var date = new Date();
        var currentdate = date.getHours();
        return currentdate;
    }
    // 獲取當前分鐘
    function getMin() {
        var date = new Date();
        var currentdate = date.getMinutes();
        return currentdate;
    }
    // 獲取當前時間
    function getTimes() {
        var date = new Date();
        return date.toLocaleString();
    }
    function getWeek() {
        var week = new Date().getDay();
        return week;
    }
    function doReplay() {
        $('span:contains(你今天試劍次數已達限額)').html('');
        CheckIn();
    }

    // 技能對象
    var skillsList = [
        // 槍法
        {
            "name": "神龍東來",
            "id": "shenlongdonglai",
            "who": "",
        }, {
            "name": "冰月破魔槍",
            "id": "bingyuepomoqiang",
            "who": "",
        }, {
            "name": "燎原百擊",
            "id": "liaoyuanbaiji",
            "who": "",
        }, {
            "name": "九溪斷月槍",
            "id": "jxdyq",
            "who": "",
        }, {
            "name": "燎原百破",
            "id": "lybp",
            "who": "",
        },
        // 棍子
        {
            "name": "月夜鬼蕭",
            "id": "yueyeguixiao",
            "who": "",
        }, {
            "name": "破軍棍訣",
            "id": "pjgj",
            "who": "",
        }, {
            "name": "千影百傷棍",
            "id": "qybsg",
            "who": "",
        }, {
            // new
            "name": "打狗棒法",
            "id": "dagoubangfa",
            "who": "",
        },
        // 錘子
        {
            "name": "玄冥錘子",
            "id": "huimengwuheng",
            "who": "",
        }, {
            "name": "天火飛錘",
            "id": "thfc",
            "who": "",
        },
        // 斧子
        {
            "name": "四海斷潮斬",
            "id": "shdcz",
            "who": "",
        }, {
            "name": "昊天破周斧",
            "id": "hypzf",
            "who": "",
        },
        // 劍法
        {
            "name": "覆雨劍法",
            "id": "fuyu-sword",
            "who": "",
        }, {
            "name": "織冰劍法",
            "id": "binggong-jianfa",
            "who": "",
        }, {
            "name": "九天龍吟劍法",
            "id": "jiutian-sword",
            "who": "",
        }, {
            "name": "紫虛辟邪劍",
            "id": "zixubixiejian",
            "who": "",
        }, {
            //new
            "name": "神劍慧芒",
            "id": "shenjianhuimang",
            "who": "",
        }, {
            //new
            "name": "天外飛仙",
            "id": "tianwaifeixian",
            "who": "",
        },
        // 掌法
        {
            "name": "釋迦拈花指",
            "id": "shijianianhuazhi",
            "who": "",
        },
        {
            "name": "降龍廿八掌",
            "id": "xianglongnianbazhang",
            "who": "",
        },
        {
            "name": "彈指神通",
            "id": "tanzhishentong",
            "who": "",
        },
        {
            "name": "折花百式",
            "id": "zhehuabaishi",
            "who": "",
        },
        {
            "name": "排雲掌",
            "id": "paiyun-zhang",
            "who": "",
        }, {
            "name": "如來神掌",
            "id": "rulai-zhang",
            "who": "",
        }, {
            // new
            "name": "無相六陽掌",
            "id": "wuxiangliuyangzhang",
            "who": "",
        },
        // 刀法
        {
            "name": "翻雲刀法",
            "id": "fanyun-blade",
            "who": "",
        }, {
            "name": "雪飲狂刀",
            "id": "xueyin-blade",
            "who": "",
        }, {
            "name": "左手刀法",
            "id": "zuoshoudaofa",
            "who": "",
        }, {
            "name": "移花接玉刀",
            "id": "yihuajieyudao",
            "who": "",
        }, {
            "name": "天刀八訣",
            "id": "tiandaobajue",
            "who": "",
        },
        // 杖法
        {
            "name": "玄天杖法",
            "id": "xtzf",
            "who": "",
        },
        {
            "name": "輝月杖法",
            "id": "hyzf",
            "who": "",
        },
        {
            "name": "十二都天神杖",
            "id": "tianshenzhang",
            "who": "",
        },
        // 鞭法
        {
            "name": "拈花解語鞭",
            "id": "zhjyb",
            "who": "",
        }, {
            "name": "十怒蛟龍索",
            "id": "snjls",
            "who": "",
        }, {
            //new
            "name": "冰玄鞭法",
            "id": "bingxuanbianfa",
            "who": "",
        },
        // 暗器
        {
            "name": "孔雀翎",
            "id": "kongqueling",
            "who": "",
        }, {
            "name": "飛刀絕技",
            "id": "feidao",
            "who": "",
        }, {
            //new
            "name": "子母龍鳳環",
            "id": "zimulongfenghuan",
            "who": "",
        }, {
            //new
            "name": "九星定形針",
            "id": "jiuxingdingxingzhen",
            "who": "",
        }, {
            //new
            "name": "九字真言印",
            "id": "jiuzizhenyanyin",
            "who": "",
        },
        // 內功
        {
            "name": "紫血大法",
            "id": "zixuedafa",
            "who": "",
        }, {
            "name": "白首太玄經",
            "id": "baishoutaixuanjing",
            "who": "",
        }, {
            "name": "道種心魔經",
            "id": "dzxinmojing",
            "who": "",
        }, {
            "name": "生生造化功",
            "id": "sszaohuagong",
            "who": "",
        }, {
            "name": "龍象般若功",
            "id": "longxiangbanruogong",
            "who": "",
        }, {
            "name": "九陰逆",
            "id": "jiuyinni",
            "who": "",
        }, {
            "name": "長春不老功",
            "id": "changchunbulaogong",
            "who": "",
        },
        // 輕功
        {
            "name": "萬流歸一",
            "id": "wanliuguiyi",
            "who": "",
        }, {
            "name": "幽影幻虛步",
            "id": "yyhuanxubu",
            "who": "",
        }, {
            "name": "雲夢歸月",
            "id": "yunmengguiyue",
            "who": "",
        }, {
            "name": "天魔妙舞",
            "id": "tianmomiaowu",
            "who": "",
        }, {
            "name": "踏月留香",
            "id": "tayueliuxiang",
            "who": "",
        },
        // 練習
        {
            "name": "慈悲刀",
            "id": "cibei-dao",
            "who": "",
        }, {
            "name": "魔叉訣",
            "id": "mo-cha-jue",
            "who": "",
        }, {
            "name": "魔刀訣",
            "id": "mo-dao-jue",
            "who": "",
        }, {
            "name": "回風拂柳劍",
            "id": "fuliu-jian",
            "who": "",
        }, {
            "name": "天山杖法",
            "id": "tianshan-zhang",
            "who": "",
        }, {
            "name": "秋風步法",
            "id": "fall-steps",
            "who": "",
        }, {
            "name": "魔戟訣",
            "id": "mo-ji-jue",
            "who": "",
        }, {
            "name": "天罡指",
            "id": "tiangang-zhi",
            "who": "",
        }, {
            "name": "金頂綿掌",
            "id": "jinding-mianzhang",
            "who": "",
        }, {
            "name": "小步玄劍",
            "id": "mystsword",
            "who": "",
        }, {
            "name": "六陰追魂劍",
            "id": "six-chaos-sword",
            "who": "",
        }
    ];
    //秋風步法 魔戟訣 天罡指 金頂綿掌 小步玄劍 六陰追魂劍
    // 通過名稱數組獲取id數組
    function getSkillIdArr(arr) {
        var skillsIdArr = [];
        for (var j = 0; j < arr.length; j++) {
            var arr_name = arr[j];
            for (var i = 0; i < skillsList.length; i++) {
                if (skillsList[i].name == arr_name) {
                    skillsIdArr.push(skillsList[i].id);
                }
            }
        }

        return skillsIdArr
    }
    function tupoHuoTui() {
        go('items use obj_huotuizongzi');
    }
    // 獲取人物的技能列表
    function getSkills(practice) {
        var skillsArr = [];
        var msg_skills = g_obj_map.get("msg_skills");
        if (msg_skills) {
            var elements = msg_skills.elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].key.indexOf('skill') > -1) {
                    var val = elements[i].value;
                    if (val) {
                        var valArr = val.split(',');
                        if (practice) {
                            if (valArr[1] && valArr[2] > 250 && valArr[2] < 500 && valArr[4] != 'known' && valArr[4] != 'force') {
                                var skillsname = g_simul_efun.replaceControlCharBlank(
                                    valArr[1].replace(/\u0003.*?\u0003/g, "")
                                );
                                if (skillsname.indexOf('天魔焚身') == -1 && skillsname.indexOf('同歸絕劍') == -1) {
                                    skillsArr.push({ 'name': skillsname, 'id': valArr[0] });
                                }
                            }
                        } else {
                            if (valArr[1] && valArr[2] > 250 && valArr[4] != 'known') {
                                var skillsname = g_simul_efun.replaceControlCharBlank(
                                    valArr[1].replace(/\u0003.*?\u0003/g, "")
                                );
                                skillsArr.push({ 'name': skillsname, 'id': valArr[0] });
                            }
                        }
                    }
                }
            }
        }
        return skillsArr;
    }

    // 獲取人物的技能列表
    function getYouXia() {
        var arr = [];
        var msg = g_obj_map.get("msg_fudi_juxian");
        if (msg) {
            var elements = msg.elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].key.indexOf('yx') > -1) {
                    var val = elements[i].value;
                    if (val) {
                        var valArr = val.split(',');

                        if (valArr[1] && valArr[4] < 2000 && valArr[4] != 600) {
                            var name = g_simul_efun.replaceControlCharBlank(
                                valArr[1].replace(/\u0003.*?\u0003/g, "")
                            );
                            arr.push({ 'name': name, 'id': valArr[0], leavel: valArr[4] });
                        }
                    }
                }
            }
        }
        return arr;
    }

    function upFuDi() {
        var youxia = getYouXia();
        for (var i = 0; i < youxia.length; i++) {
            if (youxia[i].leavel / 100 > 4) {
                go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
                go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
                go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
                go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
                go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
            } else {
				go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
				go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
				go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
				go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
				go('fudi juxian upgrade go ' + youxia[i].id + ' 100');
			}
        }
    }

    // 獲取人物的技能列表
    function getChuoMoSkills() {
        var skillsArr = [];
        var msg_skills = g_obj_map.get("msg_skills");
        if (msg_skills) {
            var elements = msg_skills.elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].key.indexOf('skill') > -1) {
                    var val = elements[i].value;
                    if (val) {
                        var valArr = val.split(',');
                        if (valArr[1] && valArr[2] >= 500 && valArr[2] < 600 && valArr[4] != 'known' && valArr[4] != 'force') {
                            var skillsname = g_simul_efun.replaceControlCharBlank(
                                valArr[1].replace(/\u0003.*?\u0003/g, "")
                            );
                            skillsArr.push({ 'name': skillsname, 'id': valArr[0], 'num': valArr[2] });
                        }
                    }
                }
            }
        }
        return skillsArr;
    }
    // 獲取突破技能列表
    function getCanTupoSkills(sk_list, practice) {
        if (!sk_list) {
            sk_list = skillsList;
        }
        var mySkills = getSkills(practice);
        var willDoSkills = [];
        for (var i = 0; i < sk_list.length; i++) {
            var skillsName = sk_list[i].name || sk_list[i];

            for (var j = 0; j < mySkills.length; j++) {
                var mySkillsName = mySkills[j].name;
                if (mySkillsName.indexOf(skillsName) > -1) {
                    willDoSkills.push(mySkills[j]);
                }
            }

        }
        var arr1 = [...willDoSkills, ...mySkills];
        var newArr = [...new Set(arr1)];

        if (practice) {
            return newArr;
        }
        return willDoSkills
    }

    function chuoMoSkills() {
        if (g_gmain.is_fighting) {
            warnning('戰鬥中禁止揣磨');
            return;//戰鬥中
        }
        clickButton('skills');
        setTimeout(() => {
            var mySkills = getChuoMoSkills();
            if (mySkills.length === 0) {
                return false;
            }
            for (var i = 0; i < mySkills.length; i++) {
                var id = mySkills[i].id;
                if (id) {
                    go('enable ' + id);
                    var forNum = 600 - mySkills[i].num;
                    for (var j = 0; j < forNum; j++) {
                        go('chuaimo go,' + id);
                    }
                }
            }
        }, 2000);
    }

    // 突破技能
    function TuPoMySkills(sk_list, type) {
        if (g_gmain.is_fighting) {
            warnning('戰鬥中禁止突破');
            return;//戰鬥中
        }
        var skills = getCanTupoSkills(sk_list);

        var skillsNameArr = [];
        if (type == '1') {
            var dom = $('#out').text();
            // 6個突破+ 舍利
            if (dom.indexOf('突破中') > 0) {
                warnning('正在突破中...暫時不能新突破技能');
                return false;
            }
            for (var i = 0; i < skills.length; i++) {
                var id = skills[i].id;
                if (id) {
                    go('enable ' + id);
                    go('tupo go,' + id);
                    go('tupo_speedup4_1 ' + id + ' go');
                    skillsNameArr.push(skills[i].name);
                }
            }

        } else if (type == '2') {
            var dom = $('#out').text();
            // 單突破
            for (var i = 0; i < skills.length; i++) {
                var id = skills[i].id;
                if (id) {
                    go('enable ' + id);
                    go('tupo go,' + id);
                    skillsNameArr.push(skills[i].name);
                }
            }
        } else {
            var dom = $('#out').text();
            if (dom.indexOf('突破中') > 0) {
                warnning('正在突破中...暫時不能新突破技能');
                return false;
            }
            // 突破加超突 + 丸子
            for (var i = 0; i < skills.length; i++) {
                var id = skills[i].id;
                if (id) {
                    go('enable ' + id);
                    go('tupo go,' + id);
                    go('tupo_speedup3 ' + id + ' go');
                    go('tupo_speedup3_1 ' + id + ' go');
                    skillsNameArr.push(skills[i].name);
                }
            }
        }

        go('enable mapped_skills restore go 1');
        var logtext = '當前突破技能列表：' + skillsNameArr.join('、');
        if (skillsNameArr.length == 0) {
            logtext = '暫無可突破技能';
            warnning(logtext);
            return;
        }
        log(logtext);
    }
    //tupoSpeed
    function tupoSpeed() {
        clickButton('skills');
        go('items put_store tianlongsi_jingangsheli');
        // go('items put_store obj_tongtianwan');
        go('items get_store /obj/shop/tongtianwan');
        go('items get_store /obj/shop/tupo_jiasuka3');
        // go('items get_store /map/tianlongsi/obj/jingangsheli');
        // var selfTopoText = '移花接玉刀,雲夢歸月,左手刀法,天魔妙舞,折花百式,紫虛辟邪劍,九陰逆,紫血大法,白首太玄經,龍象般若功,降龍廿八掌,彈指神通,天刀八訣,長春不老功,釋迦拈花指';
        var selfTopoText = '無劍之劍,同歸絕劍,上元先天功,天罡北鬥陣,披羅紫氣,火貪一刀,天雷落,天魔策,鳳舞九天,小李飛刀,踏月留香,朝天一棍,九幽棍魔,溫候戟舞,天魔場,天魔焚身,日月鞭法,真武七截陣,太極神拳,純陽無極功,菩薩回生咒,護身鬥法符,天音攝魂針,總訣式,高山流水,擒龍功,此彼還施,曼華清音,浣花七訣,天外飛仙,天刀八訣,九星定形針,九字真言印,飛鴻鞭法,紫虛辟邪劍,神劍慧芒,不凡三劍,左手刀法,移花接玉刀,釋迦拈花指,降龍廿八掌,彈指神通,折花百式,九陰逆,長春不老功,雲夢歸月,天魔妙舞,紫血大法,白首太玄經,龍象般若功,降魔杖法,神龍東來,冰月破魔槍,燎原百擊,月夜鬼蕭,冰玄鞭法,打狗棒法,無相六陽掌';
        var topoArr = selfTopoText.split(',');
        // var idArr = getSkillIdArr(topoArr);
        setTimeout(function () {
            TuPoMySkills(topoArr);
            // var dom = $('#out').text();
            // if (dom.indexOf('突破中') > 0) {
            //     console.log('正在突破中...');
            //     return false;
            // }
            // for (var i = 0; i < idArr.length; i++) {
            //     var id = idArr[i];
            //     go('enable ' + id);
            //     go('tupo go,' + id);
            //     go('tupo_speedup3 ' + id + ' go');
            //     go('tupo_speedup3_1 ' + id + ' go');
            // }
            // go('enable mapped_skills restore go 1');
        }, 2000);
    }
    //tupoSpeed
    function tupoSpeed1() {
        clickButton('skills');
        go('items put_store obj_tongtianwan');
        go('items get_store /map/tianlongsi/obj/jingangsheli');

        // go('items put_store tianlongsi_jingangsheli');
        // go('items get_store /obj/shop/tongtianwan');
        var selfTopoText = '無劍之劍,同歸絕劍,上元先天功,天罡北鬥陣,披羅紫氣,火貪一刀,天雷落,天魔策,鳳舞九天,小李飛刀,踏月留香,朝天一棍,九幽棍魔,溫候戟舞,天魔場,天魔焚身,日月鞭法,真武七截陣,太極神拳,純陽無極功,菩薩回生咒,護身鬥法符,天音攝魂針,總訣式,高山流水,擒龍功,此彼還施,曼華清音,浣花七訣,天外飛仙,天刀八訣,九星定形針,九字真言印,飛鴻鞭法,紫虛辟邪劍,神劍慧芒,不凡三劍,左手刀法,移花接玉刀,釋迦拈花指,降龍廿八掌,彈指神通,折花百式,九陰逆,長春不老功,雲夢歸月,天魔妙舞,紫血大法,白首太玄經,龍象般若功,降魔杖法,神龍東來,冰月破魔槍,燎原百擊,月夜鬼蕭,冰玄鞭法,打狗棒法,無相六陽掌';
        var topoArr = selfTopoText.split(',');
        // var idArr = getSkillIdArr(topoArr);
        setTimeout(function () {
            TuPoMySkills(topoArr, 1);
        }, 2000);
        // for (var i = 0; i < 4; i++) {
        //     var id = idArr[i];
        //     go('enable ' + id);
        //     go('tupo go,' + id);
        //     go('tupo_speedup4_1 ' + id + ' go');
        // }
        // go('enable mapped_skills restore go 1');
    }
    // 突破技能列表
    //移花接玉刀、左手刀法、天魔妙舞、天刀八訣、彈指神通和折花百式
    function tupoSkills2() {
        clickButton('skills');
        if (Base.getCorrectText('4253282')) {
            topoText = '無劍之劍,同歸絕劍,上元先天功,天罡北鬥陣,披羅紫氣,火貪一刀,天雷落,天魔策,鳳舞九天,小李飛刀,踏月留香,朝天一棍,九幽棍魔,溫候戟舞,天魔場,天魔焚身,日月鞭法,真武七截陣,太極神拳,純陽無極功,菩薩回生咒,護身鬥法符,天音攝魂針,總訣式,高山流水,擒龍功,此彼還施,曼華清音,浣花七訣,天外飛仙,天刀八訣,九星定形針,九字真言印,飛鴻鞭法,紫虛辟邪劍,神劍慧芒,不凡三劍,左手刀法,移花接玉刀,釋迦拈花指,降龍廿八掌,彈指神通,折花百式,九陰逆,長春不老功,雲夢歸月,天魔妙舞,紫血大法,白首太玄經,龍象般若功,降魔杖法,神龍東來,冰月破魔槍,燎原百擊,月夜鬼蕭,冰玄鞭法,打狗棒法,無相六陽掌';
        }
        var topoArr = topoText.split(',');
        // var idArr = getSkillIdArr(topoArr);
        // console.log(idArr);
        setTimeout(function () {
            TuPoMySkills(topoArr, 2);
        }, 2000);

        //clickButton('enable taosword', 1) // 準備技能
        //clickButton('tupo go,taosword', 1) // 突破技能
        //clickButton('tupo go,xueyin-blade', 1) // 突破秘術
        //clickButton('tupo go,binggong-jianfa', 1) // 高級突破秘術
        //clickButton('tupo go,lingshe-zhangfa', 1) // 超級突破秘術
        //clickButton('tupo_speedup3 bingyuepomoqiang go', 1) 超突卡
        //clickButton('tupo_speedup3_1 bingyuepomoqiang go', 1) 通天
        //clickButton('tupo_speedup4_1 baishoutaixuanjing go', 1) 舍利
        //clickButton('practice taosword', 1) // 練習技能
        //clickButton('enable mapped_skills restore go 1', 1) // 導出技能配置1
    }

    //練習技能
    function skillPritice() {
        if (g_gmain.is_fighting) {
            warnning('戰鬥中禁止練習');
            return;//戰鬥中
        }
        clickButton('skills');
        var selfTopoText = '秋風步法,魔刀決,回風拂柳劍,六陰追魂劍,小步玄劍,天罡指,金頂綿掌,逍遙掌,同歸劍法,天山杖法,無常杖法,魔戟訣,一指禪,火蝠身法,輕煙飄渺掌,鷹爪擒拿手,魔鉤訣,伏魔劍,養心拳,混元掌,羅漢拳,普渡杖法,風雲手,韋陀棍,修羅刀';
        var topoArr = selfTopoText.split(',');

        // var idArr = getSkillIdArr(topoArr);
        setTimeout(function () {
            var dom = $('#out').text();
            if (dom.indexOf('練習中') > 0) {
                warnning('正在練習中...');
                return false;
            }
            var skills = getCanTupoSkills(topoArr, 1);
            // 單練習
            if (skills.length > 0) {
                var id = skills[0].id;
                if (id) {
                    go('enable ' + id);
                    go('practice ' + id);
                }
            }
            go('enable mapped_skills restore go 1');
            var logtext = '';
            if (skills.length == 0) {
                logtext = '暫無可練習技能';
                warnning(logtext);
                return;
            } else {
                logtext = '當前練習技能：' + skills[0].name
            }
            log(logtext);
        }, 2000);
    }

    function baiu() {
        var _hmt = _hmt || [];
        (function () {
            var hm = document.createElement("script");
            hm.src = "https://hm.baidu.com/hm.js?abcbaab681a05e1245b8357c01172a94";
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);
        })();
    }

    function openBangFu() {
        if (Base.getCorrectText('4253282') || Base.getCorrectText('4259178') || Base.getCorrectText('6965572') || Base.getCorrectText('7598640')) {
            go('home');
            go('clan fb open shenshousenlin');
            go('clan fb open daxuemangongdao');
            go('clan fb open longwulianmoge');
            openBangSuiPian();
        }
    }
    function openBangSuiPian() {
        go('clan bzmt cancel go');
        go('clan bzmt select go 1');
    }
    function isLittleId() {
        var littleIdArr = ['4316804', '4240258', '4316804', '4259178', '4254240', '6759436', '6759488', '6759498', '6759458', '6759492', '6759497', '7245058', '7245076', '7245061', '7245031', '7245082', '7245153', '7245033', '7245124', '7245468', '7245483'];
        var isLittle = false;
        for (var i = 0; i < littleIdArr.length; i++) {
            if (Base.getCorrectText(littleIdArr[i])) {
                isLittle = true;
                return true;
            }
        }
        return isLittle;
    }
    function isSmallId() {
        var littleIdArr = ['7245058', '7245076', '7245061', '7245031', '7245082', '7245153', '7245033', '7245124', '7245468', '7245483'];
        var isLittle = false;
        for (var i = 0; i < littleIdArr.length; i++) {
            if (Base.getCorrectText(littleIdArr[i])) {
                isLittle = true;
                return true;
            }
        }
        return isLittle;
    }
    function isSixId() {
        var littleIdArr = ['6759436', '6759488', '6759498', '6759458', '6759492', '6759497', '7905194'];
        var isLittle = false;
        for (var i = 0; i < littleIdArr.length; i++) {
            if (Base.getCorrectText(littleIdArr[i])) {
                isLittle = true;
                return true;
            }
        }
        return isLittle;
    }
    function isBigId() {
        var bigIdArr = ['4253282', '4238943', '4240258', '3594649', '4219507', '4213224', '4253282', '7030223', '7894304'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }

    function isQQJianKong() {
        var bigIdArr = ['4253282'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }

    function isBigBixue() {
        var bigIdArr = ['4219507', '7030223', '7894304', '4253282'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }

    function isBangPaiStore() {
        var bigIdArr = ['4316804', '4238943', '4219507', '5515016'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }

    function isSelfId() {
        var bigIdArr = ['4253282'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }
    function isBigQiamlong() {
        var bigIdArr = ['4253282', '4255266', '7018334'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }
    function isBadBoy() {
        var bigIdArr = ['7030223', '7894304', '4219507'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }
    function isQianlongId() {
        var idMap = { "4247985": "司空", "4004413": "禦劍飛行", "4219507": "老王家的", "4228120": "小錦鯉", "4247470": "曲無心[38區]", "4253282": "挑燈夜戰", "4255266": "地府-秦廣王", "4257225": "時麟[38區]", "4260402": "通天劍帝", "7018334": "何為江湖", "7030223": "王佬的跟班[37區]", "7828780": "攻城獅", "7894304": "碧血染銀槍[37區]" };
        var bigIdArr = [];
        for (var i in idMap) {
            bigIdArr.push(i);
        }
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }

    function isGuaJiId() {
        var bigIdArr = ['6965572', '6984251'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }

    function isVip() {
        var bigIdArr = ['3594649', '4219507', '4238943', '4240258', '4253282', '4316804', '4581683', '5515016', '7894304', '7030223'];
        var isBig = false;
        for (var i = 0; i < bigIdArr.length; i++) {
            if (Base.getCorrectText(bigIdArr[i])) {
                isBig = true;
                return true;
            }
        }
        return isBig;
    }

    function GiveMoneyOnTime() {
        // o18
        var btn = $('#btno18');
        btn.trigger('click');
    }
    function AskOnTime() {
        // o23
        var btn = $('#btno23');
        btn.trigger('click');
    }
    // Your code here...

    //去位置
    function getKuaPlace(txt) {
        var step = getPlace2(txt);
        findKuaTaoFan(step);
    };
    // 找打壞人
    async function findKuaTaoFan(step) {
        await goTaoFanPlace(step);
        await new Promise(function (resolve) {
            setTimeout(resolve, 6000);
        });
        // goNpcPlace(taoPlaceStep);
        // javascript:clickButton('golook_room');
        var btn = $('.cmd_click3');
        idArr = [];
        badNameArr = [kuafuNpc + '段老大', '厲工', '蒙赤行', '胡鐵花', '石幽明', '段老大', '二娘', '嶽老三', '雲老四', '劇盜', '惡棍', '流寇'];
        if (!killBadSwitch) {
            badNameArr = [kuafuNpc + '無一', '令東來', '傳鷹', '無花', '追命', '無一', '鐵二', '追三', '冷四', '黃衣捕快', '紅衣捕快', '錦衣捕快'];
        }

        for (var j = 0; j < badNameArr.length; j++) {
            var badName = badNameArr[j];

            for (var i = 0; i <= btn.length; i++) {
                var txt = btn.eq(i).text();
                if (txt.indexOf(badName) > -1) {
                    bad_target_name = txt;
                    var npcText = null;
                    npcText = btn.eq(i).attr('onclick');
                    var id = getId(npcText);
                    idArr.push(id);
                }
            }
        }
        console.log(idArr);
        if (idArr.length > 0) {
            setTimeout(function () {
                doKillTaoFan(idArr);
            }, 2000);
        }
    };
    //

    function getPlace2(txt) {
        var _place = null;
        var PLACE = ['雪亭鎮', '洛陽', '華山村', '華山', '揚州', '丐幫', '喬陰縣', '峨眉山', '恒山', '武當山', '晚月莊', '水煙閣', '少林寺', '唐門', '青城山', '逍遙林', '開封', '光明頂', '全真教', '古墓', '白駝山', '嵩山', '梅莊', '泰山', '鐵血大旗門', '大昭寺'];
        // var place = ['飲風客棧','龍門石窟','華山村村口','華山山腳','安定門','樹洞內部','喬陰縣城北門','十二盤','大字嶺','林中小路','竹林','青石官道','叢林山徑','蜀道','北郊','青石大道','朱雀門','小村','終南山路','山路','戈壁','太室闕','柳樹林','岱宗坊','小路']
        // $.each(place,function(n,v){
        //     if(txt.indexOf(v) != '-1'){
        //         _place = PLACE[n];
        //         _place = n;
        //         return false;
        //     }
        // })
        $.each(PLACE, function (n, v) {
            if (txt.indexOf(v) != '-1') {
                _place = n;
                return false;
            }
        });
        if (_place != null) {
            _place++;
        }
        return _place;
    }


    function bindKey() {
        console.log(getTimes() + '歡迎使用遊戲助手!\nwsad表示上下左右\nq左上，z左下，e右上，右下c');
        $(document).keydown(function (e) {
            if (e) {
                switch (e.keyCode) {
                    case 87: clickButton('go north', 0); break;  //上w
                    case 83: clickButton('go south', 0); break; //下s
                    case 65: clickButton('go west', 0); break; //左a
                    case 68: clickButton('go east', 0); break; //右d

                    case 81: clickButton('go northwest', 0); break; //左上q
                    case 69: clickButton('go northeast', 0); break; //左下z
                    case 90: clickButton('go southwest', 0); break; //右上e
                    case 67: clickButton('go southeast', 0); break; //右下c clickButton('home', 1)

                    // case 13:clickButton('home', 1);break;//回主頁


                    // case 49:clickButton('jh 1', 0);break;//直接進入第1章
                    // case 50:clickButton('jh 2', 0);break;//2
                    // case 51:clickButton('jh 3', 0);break;//3
                    // case 52:clickButton('jh 4', 0);break;//4
                    // case 53:clickButton('jh 5', 0);break;//5
                    // case 54:clickButton('jh 6', 0);break;//6
                    // case 55:clickButton('jh 7', 0);break;//7
                    // case 56:clickButton('jh 8', 0);break;//8
                    // case 57:clickButton('jh 9', 0);break;//9
                    // case 48:clickButton('jh 10', 0);break;//9

                    // case 107:clickButton('items', 0);break;// 小鍵盤+號 打開背包
                    // case 109:clickButton('score_info', 0);break;//小鍵盤-號 打開江湖屬性
                    // case 106:clickButton('score_base', 0);break;//小鍵盤*號 打開人物屬性
                }
            }
        });
    }

    //          0                 2        3        4                                            9        10
    var jiwuPlaceName = ['麒麟宮', '蒼鷹宮', '白虎宮', '金獅宮', '鳳凰宮', '銀豹宮', '雲獸宮', '赤龍宮', '玄武宮', '朱雀宮', '荒狼宮', '神猿宮'];
    var correctPlace = "正廳";
    window.step = 0;
    var jiwuInter = null;
    function killFirstJiWu() {
        var msg = '十二宮順序是：' + jiwuPlaceName.join(',') + '請到十二宮正廳再點擊開始\n沒有準備好就點取消！';

        if (confirm(msg) === true) {
            console.log("開始打十二宮");
            goJiWuPlaceWarp();
        } else {
            return false;
        }
    }
    function goCorrectJiWuPlace() {
        clearInterval(jiwuInter);
        jiwuInter = setInterval(function () {
            getJiWuInfo();
        }, 1000);
    }
    function goJiWuPlaceWarp() {
        clearInterval(jiwuInter);
        if (isCorrectJiWuPlace()) {
            // 殺
            killJiwuGong();
        } else if (inZhengTing()) {
            gojiwuPlace();
        } else {
            goZhengTing();
            setTimeout(function () {
                gojiwuPlace();
            }, 4000);

            setTimeout(function () {
                if (isCorrectJiWuPlace()) {
                    killJiwuGong();
                }
            }, 8000);
        }
    }
    // 殺十二宮BOSS
    function killJiwuGong() {
        var step = window.step;
        console.log(getTimes() + '殺' + jiwuPlaceName[step]);
        switch (step) {
            case '0':
                clickButton('kill jiwutan_tianhai', 1);
                break;
            case '1':
                clickButton('kill jiwutan_kunpeng', 1);
                break;
            case '2':
                clickButton('kill jiwutan_xuetong', 1);
                break;
            case '3':
                clickButton('kill jiwutan_zuifa', 1);
                break;
            case '4':
                clickButton('kill jiwutan_jinxi', 1);
                break;
            case '5':
                clickButton('kill jiwutan_yinbao', 1);
                break;
            case '6':
                clickButton('kill jiwutan_shouxu', 1);
                break;
            case '7':
                clickButton('kill jiwutan_xiaori', 1);
                break;
            case '8':
                clickButton('kill jiwutan_diehun', 1);
                break;
            case '9':
                clickButton('kill jiwutan_huokuang', 1);
                break;
            case '10':
                clickButton('kill jiwutan_dianxing', 1);
                break;
            case '11':
                clickButton('kill jiwutan_daoxing', 1);
                break;
        }
        goCorrectJiWuPlace();
    }
    function isCorrectJiWuPlace() {
        var step = window.step;
        var placeName = jiwuPlaceName[step];
        var roomName = $('#out .outtitle').text();
        if (roomName == placeName) {
            return true;
        }
        return false;
    }
    // 去正廳
    function goZhengTing() {
        if (inJiWuArr()) {
            goPlaceBtnClick('甬道');
            setTimeout(function () {
                goPlaceBtnClick('正廳');
            }, 1000);
        } else {
            goPlaceBtnClick('正廳');
        }
    }

    // 位置點擊
    function goPlaceBtnClick(placeName) {
        var btn = $('#out button');

        btn.each(function () {
            var btnName = $(this).text();
            if (btnName == placeName) {
                $(this).trigger('click');
            }
        });
    }

    // 去十二宮裏
    function gojiwuPlace() {
        var step = window.step;
        if (step == '0' || step == '2' || step == '3' || step == '4' || step == '9' || step == '10') {
            go('nw');
        } else {
            go('ne');
        }

        setTimeout(function () {
            goJiWuPlace();
        }, 1000);
    }

    function goJiWuPlace() {
        var placeName = jiwuPlaceName[step];;
        var btn = $('#out button');

        btn.each(function () {
            var btnName = $(this).text();
            if (btnName == placeName) {
                $(this).trigger('click');
            }
        });
    }

    // 當前位置是否是12宮中
    function inJiWuArr() {
        var roomName = $('#out .outtitle').text();
        if ($.inArray(roomName, jiwuPlaceName) != '-1') {
            return true;
        }
        return false;
    }

    // 是否在正廳
    function inZhengTing() {
        var roomName = $('#out .outtitle').text();
        var roomName1 = "正廳";
        if (roomName == roomName1) {
            return true;
        }
        return false;
    }

    // 獲取十二宮面板信息
    function getJiWuInfo() {
        var out = $('#out2 .out2');
        out.each(function () {
            if ($(this).hasClass('done12')) {
                return;
            }
            $(this).addClass('done12');
            var txt = $(this).text();
            var hasName = false;
            var npcName = '極武壇十二宮主';
            if (txt.indexOf(npcName) != '-1') {
                window.step = $.trim(txt.split(':')[1].split('/')[0]);
                clickButton('golook_room');
                if (window.step >= 12) {
                    console.log(getTimes() + '已經打完十二宮主');
                    clearInterval(jiwuInter);
                } else {
                    setTimeout(function () {
                        goJiWuPlaceWarp();
                    }, 2000);
                }
            }

        });
    }
    //
    var killGoodSetInterval = null;
    function killGoodNpc(e) {
        var player = ['任俠', '暗刺', '金刀', '追命', '無花', '傳鷹', '令東來', '西門吹雪', '石之軒', '朱大天王', '楚昭南', '阿青', '楚留香', '天山童姥', '乾羅', '令狐沖', '喬峰', '浪翻雲', '三少爺', '花無缺', '雲夢璃', '無『雙』公主', '守樓虎將', '天劍真身', '王鐵匠', '楊掌櫃', '柳繪心', '客商', '賣花姑娘', '劉守財', '柳小花', '朱老伯', '方寡婦', '方老板'];

        var Dom = $(e.target);
        var DomTxt = Dom.html();

        clearInterval(killGoodSetInterval);

        if (DomTxt == '殺好人') {
            killGoodSetInterval = setInterval(function () {
                killSet(player);
            }, 400);
            console.log(getTimes() + '開始殺好人');
            Dom.html('取消殺好人');
        } else {
            clearInterval(killGoodSetInterval);
            killGoodSetInterval = null;
            Dom.html('殺好人');
            console.log(getTimes() + '停止殺好人');
        }
    }
    //
    var killBadSetInterval = null;
    function killBadNpc(e) {
        var player = ['石幽明', '胡鐵花', '蒙赤行', '厲工', '葉孤城', '祝玉妍', '蕭秋水', '淩未風', '白猿', '石觀音', '李秋水', '方夜羽', '東方不敗', '慕容博', '龐斑', '燕十三', '小魚兒', '夜魔', '不『二』劍客', '攻樓死士', '天魔真身', '段老大', '二娘', '嶽老三', '雲老四', '劇盜', '惡棍', '流寇'];

        var Dom = $(e.target);
        var DomTxt = Dom.html();
        clearInterval(killBadSetInterval);

        if (DomTxt == '殺壞人') {
            killBadSetInterval = setInterval(function () {
                killSet(player);
            }, 400);
            console.log(getTimes() + '開始殺壞人');
            Dom.html('取消殺壞人');
        } else {
            clearInterval(killBadSetInterval);
            killBadSetInterval = null;
            Dom.html('殺壞人');
            console.log(getTimes() + '停止殺壞人');
        }
    }

    var killSomeOneSetInterval = null;
    var killSomeOneName = '';
    var killOneName = '';
    function killSomeOne(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '殺指定') {
            if (killSomeOneName != '') {
                killSomeOneSetInterval = setInterval(function () {
                    killSet([killSomeOneName]);
                }, 300)
            } else {
                killOneName = prompt("請輸入要殺的人", "");
                if (!killOneName || killOneName == '') {
                    return
                }
                killSomeOneSetInterval = setInterval(function () {
                    killSet([killOneName]);
                }, 300)
            }
            Dom.html('取消指定')
        } else {
            clearInterval(killSomeOneSetInterval);
            killSomeOneName = '';
            killOneName = '';
            Dom.html('殺指定')
        }
    }
    // 殺指定目標
    function killSet(player) {
        if ($('.cmd_skill_button').length > 0) {
            if (killGoodSetInterval) {
                clearInterval(killGoodSetInterval);
            }
            return false;
        }
        var btn = $('.cmd_click3');
        var idArr = [];
        var isSamePlayer = false;
        for (var i = 0; i < player.length; i++) {
            var Qname = player[i];
            for (var j = 0; j < btn.length; j++) {
                var txt = btn.eq(j).text();
                if (txt == Qname) {
                    var npcText = btn.eq(j).attr('onclick');
                    if (npcText.indexOf('score') >= 0) break;
                    var id = getId(npcText);
                    idArr.push(id);
                    if (player == '任俠' || player == '金刀客' || player == '暗刺客') {
                        isSamePlayer = true;
                    }
                    break;
                }
            }
        }

        var maxId = idArr[0];
        if (idArr.length > 1 && isSamePlayer && killBadSwitch) {
            maxId = idArr[1];
        }
        if (maxId) {
            killE(maxId);
        } else {
            stopOnTime = false;
        }
    }

    // 新奇俠

    var QXretried = 0;
    var QXStop = 0;
    var QXTalkcounter = 1;
    var QxTalking = 0;
    function GetQXID(name, QXindex) {
        if (QXStop == 1 && qinmiFinished == 1) {
            return;
        } else if (g_obj_map.get("msg_room") == undefined || QXStop == 1) {
            setTimeout(function () { GetQXID(name, QXindex); }, 500);
        } else {
            console.log("開始尋找" + name + QXindex);
            var QX_ID = "";
            var npcindex = 0;
            var els = g_obj_map.get("msg_room").elements;
            for (var i = els.length - 1; i >= 0; i--) {
                if (els[i].key.indexOf("npc") > -1) {
                    if (els[i].value.indexOf(",") > -1) {
                        var elsitem_ar = els[i].value.split(',');
                        if (elsitem_ar.length > 1 && elsitem_ar[1] == name) {
                            console.log(elsitem_ar[0]);
                            npcindex = els[i].key;
                            QX_ID = elsitem_ar[0];
                        }
                    }
                }
            }
            if (QX_ID == null || QX_ID == undefined || QX_ID == 0) {
                clickButton('find_task_road qixia ' + QXindex);
                setTimeout(function () { GetQXID(name, QXindex); }, 500);
            } else {
                console.log("找到奇俠編號" + QX_ID);
                if (QXTalkcounter <= 5) {
                    // console.log("開始與"+name+"第"+QXTalkcounter+"對話")
                    QXTalkcounter++;
                    clickButton('ask ' + QX_ID);
                    clickButton('find_task_road qixia ' + QXindex);
                    setTimeout(function () { GetQXID(name, QXindex) }, 500);
                    if (QXindex == finallist[finallist.length - 1].index && QXTalkcounter == 5) {
                        setTimeout(function () {
                            goeasyGetZhu();
                        }, 6000)
                    }
                } else if (QXTalkcounter > 5) {
                    QXTalkcounter = 1;
                    console.log("與" + name + "對話完成");
                    QixiaTotalCounter++;
                    if (QixiaTotalCounter > 25) {

                        console.log("今日奇俠已經完成");
                    } else {
                        console.log("下一個目標是" + finallist[QixiaTotalCounter]["name"]);
                    }
                    talktoQixia();
                }
            }
        }
    }
    var QixiaTotalCounter = 0;
    function TalkQXBase(name, QXindex) {
        var QX_NAME = name;
        console.log("開始撩" + QX_NAME + "！");
        if (g_obj_map.get("msg_room") != undefined)
            g_obj_map.get("msg_room").clear();
        go('find_task_road qixia ' + QXindex);
        go('golook_room');
        setTimeout(function () { GetQXID(QX_NAME, QXindex); }, 500);
    }

    var currentTime = 0;
    var delta_Time = 2000;
    var QXStop = 0;
    var qinmiFinished = 0;
    var QiXiaList = [], finallist = [];
    function QXWhisper() {
        this.dispatchMessage = function (b) {
            var type = b.get("type"), subtype = b.get("subType");
            if (type == "notice") {
                var msg = g_simul_efun.replaceControlCharBlank(b.get("msg"));
                if (msg.match("對你悄聲道") != null) {
                    QXStop = 1;
                    // console.log(msg);
                    QiXiaTalkButton.innerText = '繼續奇俠';
                }
                // console.log(msg);
            } else if (type == "main_msg") {
                var msg = g_simul_efun.replaceControlCharBlank(b.get("msg"));
                if (msg.match("今日親密度操作次數") != null) {
                    var qinmi = parseInt(msg.split("(")[1].split("/")[0]);
                    if (qinmi == 20) {
                        QXStop = 1;
                        qinmiFinished = 1;
                        // console.log("今日親密度操作已經達到20，奇俠功能暫停。再次使用請重新點擊開始領取果子。");
                        QXTalking = 0;
                    }
                }
            }
        }
    }
    var whipser = new QXWhisper;
    var easyGetZhu = [];
    async function GetQiXiaList() {
        var html = g_obj_map.get("msg_html_page");
        QxTalking = 1;
        if (html == undefined) {
            setTimeout(function () { GetQiXiaList(); }, 500);
        } else if (g_obj_map.get("msg_html_page").get("msg").match("江湖奇俠成長信息") == null) {
            setTimeout(function () { GetQiXiaList(); }, 500);
        } else {
            var returnArr = await setEasyZhu();
            console.log(returnArr);
            if (returnArr.length >= 25) {
                console.log('直接領取朱果');
                goeasyGetZhu();
            } else {
                console.log('奇俠開始排序');
                QiXiaList = formatQx(g_obj_map.get("msg_html_page").get("msg"));
                SortQiXia();
            }
        }
    };
    var easyGetZhu = [];
    function setEasyZhu() {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                var zhuGuoLink = $('.out table').find('a:contains(朱果)');
                for (var i = 0; i < zhuGuoLink.length; i++) {
                    var zhuguoHref = zhuGuoLink[i].href;
                    var clickFn = zhuguoHref.split("'")[1];
                    easyGetZhu.push(clickFn);
                }
                resolve(easyGetZhu);
            }, 5000);
        })
    }
    function SortQiXia() {//冒泡法排序
        var temp = {};
        var temparray = [];
        var newarray = [];
        for (var i = 0; i < QiXiaList.length; i++) {
            for (var j = 1; j < QiXiaList.length - i; j++) {
                if (parseInt(QiXiaList[j - 1]["degree"]) < parseInt(QiXiaList[j]["degree"])) {
                    temp = QiXiaList[j - 1];
                    QiXiaList[j - 1] = QiXiaList[j];
                    QiXiaList[j] = temp;
                }
            }
        }
        var tempcounter = 0;
        // console.log("奇俠好感度排序如下:");
        // console.log(QiXiaList);
        //首次排序結束 目前是按照由小到大排序。現在需要找出所有的超過25000 小於30000的奇俠。找到後 排序到最上面；
        for (var i = 0; i < QiXiaList.length; i++) {
            if (parseInt(QiXiaList[i]["degree"]) >= 25000 && parseInt(QiXiaList[i]["degree"]) < 30000) {
                temparray[tempcounter] = QiXiaList[i];
                tempcounter++;
                newarray.push(i);
            }
        }
        // console.log("提取滿朱果好感度排序如下:");
        for (var i = 0; i < QiXiaList.length; i++) {
            if (newarray.indexOf(i) == -1) {
                temparray[tempcounter] = QiXiaList[i];
                tempcounter++;
            }
        }
        finallist = [];
        finallist = temparray;
        console.log("奇俠好感度排序如下:");
        console.log(finallist);
        getZhuguo();
    }
    function getZhuguo() {
        var msg = "";
        // console.log(finallist);
        for (var i = 0; i < 4; i++) {//只檢查 頭四個奇俠是不是在師門，是不是已經死亡。
            if (finallist[i]["isOk"] != true) {
                msg += finallist[i]["name"] + " ";
            }
        }
        if (msg != "") {
            console.log("根據您的奇俠親密好感度，目前可以最優化朱果數目的以下奇俠不在江湖或者已經死亡：" + msg + "。請您稍後再嘗試使用奇俠領取朱果服務。");
        } else {//頭四位奇俠都在江湖中，可以開始領取朱果
            talktoQixia();
        }
    }
    var unfinish = "";
    function talktoQixia() {
        if (QixiaTotalCounter <= 24) {// 奇俠list仍然有元素。開始調取排列第一個的奇俠
            var Qixianame = "";
            var QixiaIndex = 0;
            // console.log(finallist[0]["name"]);
            Qixianame = finallist[QixiaTotalCounter]["name"];
            QixiaIndex = finallist[QixiaTotalCounter]["index"];
            if (finallist[QixiaTotalCounter]["isOk"] != true) {
                console.log("奇俠" + Qixianame + "目前不在江湖，可能死亡，可能在師門。領取朱果中斷，請在一段時間之後重新點擊領取朱果按鈕。無需刷新頁面");
                QixiaTotalCounter++;
                talktoQixia();
                return;
            } else {
                clickButton('find_task_road qixia ' + QixiaIndex);
                GetQXID(Qixianame, QixiaIndex);
            }
        } else {
            clickButton('home');
        }
    }

    function goeasyGetZhu() {
        for (var i = 0; i < easyGetZhu.length; i++) {
            go(easyGetZhu[i]);
        }
    }

    var finallist = [];
    function QiXiaTalkFunc() {
        // console.log('stard:奇俠領朱果');
        var QiXiaList_Input = "";
        //打開 江湖奇俠頁面。
        if (QXStop == 0) {
            clickButton('open jhqx');
            GetQiXiaList();
        } else if (QXStop == 1 && qinmiFinished == 0) {
            QXStop = 0;
            QiXiaTalkButton.innerText = '奇俠領朱果';
        } else if (QXStop == 1 && qinmiFinished == 1) {
            QXStop = 0;
            QixiaList = [];
            finallist = [];
            QXTalkcounter = 1;
            QixiaTotalCounter = 0;
            clickButton('open jhqx', 0);
            GetQiXiaList();
        }
    }
    // 格式話奇俠數據並返回數組
    function formatQx(str) {
        var tmpMsg = removeSpec(str);
        var arr = tmpMsg.match(/<tr>(.*?)<\/tr>/g);
        var qxArray = [];
        var qxInfo = {};
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].indexOf('-') > 0) {
                    continue;
                }
                qxInfo = {};
                arr[i] = arr[i].replace('朱果', '');
                arr2 = arr[i].match(/<td[^>]*>([^\d\(]*)\(?(\d*)\)?<\/td><td[^>]*>(.*?)<\/td><td[^>]*>(.*?)<\/td><td[^>]*>.*?<\/td>/);
                qxInfo["name"] = arr2[1].replace('(', '').replace(')', '');
                qxInfo["degree"] = arr2[2] == "" ? 0 : arr2[2];
                if (arr2[3].match("未出世") != null || arr2[4].match("師門") != null) {
                    qxInfo["isOk"] = false;
                } else {
                    qxInfo["isOk"] = true;
                }
                qxInfo["index"] = i;
                qxArray.push(qxInfo);

            }
            return qxArray;
        }
        return [];
    }

    // 去除鏈接以及特殊字符
    function removeSpec(str) {
        var tmp = g_simul_efun.replaceControlCharBlank(str.replace(/\u0003.*?\u0003/g, ""));
        tmp = tmp.replace(/[\x01-\x09|\x11-\x20]+/g, "");
        return tmp;
    }

    function getItemId(str) {
        var name = '';
        var strA = str.split(' info ')[1];
        name = strA.split("'")[0];
        return name;
    }
    function sameItem(item) {
        var itemArr = ['碎片', '寶石', '寶箱', '鑰匙', '殘頁', '隱武', '令', '龍庭魄', '昆侖印', '帝璽碎', '東海碧', '鉅子墨', '軒轅烈', '九天落'];
        if (itemArr.indexOf(item) >= 0) {
            return true;
        }
        return false;
    }
    function isOneItem(name) {
        var itemArr = ['『秘籍木盒』', '玫瑰花', '高級乾坤袋', '乾坤袋', '突破丹禮包', '突破丹大禮包', '舞鳶尾', '狗糧', '保險卡'];
        for (var i = 0; i < itemArr.length; i++) {
            if (name.indexOf(itemArr[i]) >= 0) {
                return true;
            }
        }
        return false;
    }
    function zhengli(itemName, itemid, action, limit) {
        var tr = $('#out table:eq(2) tr');
        tr.each(function () {
            var td = $(this).find('td').eq(0);
            var tdName = td.text();
            if (sameItem(itemName)) {
                if (tdName.indexOf(itemName) >= 0) {
                    var m = td.siblings().find('span').filter(function () {
                        return new RegExp("[0-9]+").test($(this).text());
                    });
                    itemid = getItemId($(this).attr('onclick')) || itemid;
                    var num = m.text().match(/(\d+)/);
                    if (num == null)
                        return;
                    var exec = "items " + action + " " + itemid;

                    num = parseInt(num[0]);
                    if (action == "put_store")
                        num = 1;
                    if (limit != null)
                        num = limit;
                    var larger100 = parseInt(num / 100);
                    if (isOneItem(itemName)) {
                        for (var i = 0; i < num; ++i) {
                            go(exec);
                        }
                    } else if (larger100 > 0) {
                        var newExec = exec + '_N_100';

                        for (var i = 0; i < larger100; i++) {
                            go(newExec);
                        }
                    } else {
                        if (action == "put_store") {
                            go(exec);
                        } else {
                            var newExec = exec + '_N_' + num;
                            go(newExec);
                        }
                    }
                }
            } else {
                if (tdName == itemName) {
                    var m = td.siblings().find('span').filter(function () {
                        return new RegExp("[0-9]+").test($(this).text());
                    });
                    itemid = getItemId($(this).attr('onclick')) || itemid;
                    console.log(itemid);
                    var num = m.text().match(/(\d+)/);
                    if (num == null)
                        return;
                    var exec = "items " + action + " " + itemid;

                    num = parseInt(num[0]);
                    if (action == "put_store")
                        num = 1;
                    if (limit != null)
                        num = limit;

                    var larger100 = parseInt(num / 100);
                    if (isOneItem(itemName)) {
                        for (var i = 0; i < num; ++i) {
                            go(exec);
                        }
                    } else if (larger100 > 0) {
                        var newExec = exec + '_N_100';
                        for (var i = 0; i < larger100; i++) {
                            go(newExec);
                        }
                    } else {
                        if (action == "put_store") {
                            go(exec);
                        } else {
                            var newExec = exec + '_N_' + num;
                            go(newExec);
                        }

                    }
                }
            }
        })
    }

  



    function heBaoshi() {
        go("score");
        go("items", 0);
        setTimeout(heBaoshiFunc, 3000);
    }
    function heBaoshiFunc() {

        timeCmd = 0;
        baoshi("碎裂的紅寶石", "hongbaoshi1");
        baoshi("裂開的紅寶石", "hongbaoshi2");
        baoshi("紅寶石", "hongbaoshi3");
        baoshi("無暇的紅寶石", "hongbaoshi4");
        baoshi("完美的紅寶石", "hongbaoshi5");
        baoshi("碎裂的綠寶石", "lvbaoshi1");
        baoshi("裂開的綠寶石", "lvbaoshi2");
        baoshi("綠寶石", "lvbaoshi3");
        baoshi("無暇的綠寶石", "lvbaoshi4");
        baoshi("完美的綠寶石", "lvbaoshi5");
        baoshi("碎裂的黃寶石", "huangbaoshi1");
        baoshi("裂開的黃寶石", "huangbaoshi2");
        baoshi("黃寶石", "huangbaoshi3");
        baoshi("無暇的黃寶石", "huangbaoshi4");
        baoshi("完美的黃寶石", "huangbaoshi5");
        baoshi("碎裂的紫寶石", "zishuijing1");
        baoshi("裂開的紫寶石", "zishuijing2");
        baoshi("紫寶石", "zishuijing3");
        baoshi("無暇的紫寶石", "zishuijing4");
        baoshi("完美的紫寶石", "zishuijing5");
        baoshi("碎裂的藍寶石", "lanbaoshi1");
        baoshi("裂開的藍寶石", "lanbaoshi2");
        baoshi("藍寶石", "lanbaoshi3");
        baoshi("無暇的藍寶石", "lanbaoshi4");
        baoshi("完美的藍寶石", "lanbaoshi5");
    }

    function baoshi(itemName, itemid, action, limit) {
        var m = $('#out table:eq(2) tr span:contains(' + itemName + ')');
        if (m.length == 0) {
            return;
        }
        if (m != null) {
            if (m.length > 1) {
                m.each(function () {
                    var that = this;
                    if ($(that).text() == itemName) {
                        var SPANbao = $(that).parent().parent().find('span');
                        SPANbao.each(function (i) {
                            if (new RegExp("[0-9]+").test(SPANbao.eq(i).text())) {
                                m = SPANbao.eq(i);
                            }
                        })
                    }
                })
            } else {
                if ($(m).text() == itemName) {
                    m = m.parent().parent().find('span').filter(function () {
                        return new RegExp("[0-9]+").test($(this).text());
                    });
                }
            }
            var num = m.text().match(/(\d+)/);

            if (num == null)
                return;

            var exec = "items hecheng" + " " + itemid;

            num = parseInt(num[0]);

            if (action == "put_store")
                num = 1;
            if (limit != null)
                num = limit;
            var larger10 = parseInt(num / 30);

            if (larger10 > 0) {
                var smallNum = parseInt(num % 30);
                var endNum = parseInt(smallNum / 3);

                var newExec = exec + '_N_10';

                for (var i = 0; i < larger10; i++) {
                    go(newExec);
                }

                for (var i = 0; i < endNum; i++) {
                    exec = exec + '_N_1';
                    go(exec);
                }

            } else {
                var endNum = parseInt(num / 3);
                for (var i = 0; i < endNum; i++) {
                    exec = exec + '_N_1';
                    go(exec);
                }
            }
        }
    }

    var pozhao_ok_patterns = [/(.+)的招式盡數被(.+)所破！/, /(.+)這一招正好擊向了(.+)的破綻！/, /(.+)一不留神，招式被(.+)所破！/];
    var pozhao_fail_patterns = [/(.+)的對攻無法擊破(.+)的攻勢，處於明顯下風！/, /(.+)的招式並未有明顯破綻，(.+)只好放棄對攻！/, /(.+)這一招並未奏效，仍被(.+)招式緊逼！/, /(.+)使出急忙使出“.+”閃躲，但差了一著，仍被(.+)招式緊逼！/, /(.+)使出急忙使出“.+”閃躲，但步法慢了一步，(.+)的招式迎面而來！/, /(.+)使出急忙使出“.+”閃躲，但(.+)招式更快，並未放棄攻擊！/, /(.+)急忙施展“.+”企圖防禦，但(.+)的真氣並未占據上風，失去了防禦之勢！/, /(.+)急忙施展“.+”企圖防禦，但真氣仍舊無法完全將(.+)逼開！/, /(.+)急忙施展“.+”企圖防禦，但(.+)招式在真氣之中仍舊施展自如！/];
    var normal_attack_patterns = [/(.+！|.+，|.+。|^)(.+)對準(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)用力揮出一拳！/m, /(.+！|.+，|.+。|^)(.+)往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)狠狠地踢了一腳！/m, /(.+！|.+，|.+。|^)(.+)揮拳攻擊(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)！/m, /(.+！|.+，|.+。|^)(.+)的.+往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)狠狠地一捅！/m, /(.+！|.+，|.+。|^)(.+)往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)一抓！/m, /(.+！|.+，|.+。|^)(.+)提起拳頭往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)捶去！/m, /(.+！|.+，|.+。|^)(.+)用.+往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)刺去！/m, /(.+！|.+，|.+。|^)(.+)用.+往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)直戳過去！/m, /(.+！|.+，|.+。|^)(.+)揮動.+，斬向(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)！/m, /(.+！|.+，|.+。|^)(.+)用.+往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)砍去！/m, /(.+！|.+，|.+。|^)(.+)揮舞.+，對準(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)一陣亂砍！/m, /(.+！|.+，|.+。|^)(.+)揮舞.+，往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)用力一□！/m, /(.+！|.+，|.+。|^)(.+)高高舉起.+，往(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)當頭砸下！/m, /(.+！|.+，|.+。|^)(.+)手握.+，眼露兇光，猛地對準(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)揮了過去！/m, /(.+！|.+，|.+。|^)(.+)的.+朝著(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)劈將過去！/m, /(.+！|.+，|.+。|^)(.+)對準(.+)的(左手|右手|後心|左耳|右耳|兩肋|左肩|右肩|左腿|右腿|左臂|右臂|腰間|左臉|右臉|小腹|頸部|頭頂|左腳|右腳|胸口)用力揮出一拳！/m];

    function is_pozhao_ok(vs_text) {
        for (var i = 0; i < pozhao_ok_patterns.length; i++) {
            if (pozhao_ok_patterns[i].test(vs_text)) {
                return true;
            }
        }
        return false;
    }
    function is_pozhao_fail(vs_text) {
        for (var i = 0; i < pozhao_fail_patterns.length; i++) {
            if (pozhao_fail_patterns[i].test(vs_text)) {
                return true;
            }
        }
        return false;
    }

    function is_normal_attack(vs_text) {
        for (var i = 0; i < normal_attack_patterns.length; i++) {
            if (normal_attack_patterns[i].test(vs_text)) {
                return true;
            }
        }
        return false;
    }

    var pozhao = 0;

    function ZhanDouView() {
        this.dispatchMessage = function (b) {
            var type = b.get("type"), subType = b.get("subtype");

            if (type == 'notice' || type == 'main_msg') {
                var notice_msg = b.get('msg');
                if (!notice_msg) {
                    return;
                }
                // console.log(notice_msg);
                // console.log(type);
                // console.log(subType);
                notice_msg = g_simul_efun.replaceControlCharBlank(notice_msg.replace(/\u0003.*?\u0003/g, ""));
                // console.log('notice&main_msg:' + notice_msg);
                // console.log(notice_msg);
                if (notice_msg.indexOf('基礎攻擊') > 0) {
                    setJichu(notice_msg);
                }
                if (notice_msg.indexOf('玄武碎片') > 0 || notice_msg.indexOf('白虎碎片') > 0 || notice_msg.indexOf('青龍碎片') > 0 || notice_msg.indexOf('朱雀碎片') > 0) {
                    // getSuiPianNum(notice_msg);
                }
                if (notice_msg.indexOf('逃犯任務') > 0 && notice_msg.indexOf('明天') > 0) {
                    // 逃犯任務達到上限
                    stopTaoFan();
                }
                // 這是你今天完成的第3/5個活動任務
                if (notice_msg.indexOf('活動任務') > 0 && notice_msg.indexOf('5/5') > 0) {
                    // 活動任務達到上限
                    stopJianghu();
                }

                if (notice_msg.indexOf('雪山派活動任務') > 0 && notice_msg.indexOf('明天') > 0) {
                    // 雪山任務達到上限
                    isDoneXueShan = true;
                    closeXueShan();
                }
                // 這是你今天王恒的第1/5個雪山派活動任務
                if (notice_msg.indexOf('雪山派活動任務') > 0 && notice_msg.indexOf('完成') > 0) {
                    // 雪山任務達到上限
                    sendToQQ(notice_msg);
                    Base.skills();
                    if (notice_msg.split('第')[1].split('/') >= 5) {
                        isDoneXueShan = true;
                        closeXueShan();
                    }
                }
                //突破到最大限制
                // if (notice_msg.indexOf('專屬稱號後') > 0 && notice_msg.indexOf('同時突破') > 0) {
                //     isTuPoMax = true;
                // }
                //潛龍在淵聖上特賜
                if (notice_msg.indexOf('潛龍在淵') > 0 && notice_msg.indexOf('聖上特賜') > 0) {
                    addTuBtn(notice_msg);
                }
                if (Jianshi.wk > 0 && notice_msg.indexOf('你覺得體力耗盡') >= 0 && notice_msg.indexOf('便往洞外走去') >= 0) {
                    waKuang1();
                }
                if (notice_msg.indexOf('逃犯任務') > 0 && notice_msg.indexOf('今天完成') > 0 && notice_msg.indexOf('已做完') < 0) {
                    // sendToQQ(notice_msg);
                    clickButton('tell ' + assistant + ' ASSIST/reTell/' + notice_msg);
                }

                if (notice_msg.indexOf('今天') > 0 && notice_msg.indexOf('殺生太多') > 0 && notice_msg.indexOf('已做完') < 0) {
                    // sendToQQ(notice_msg);
                    stopJianghu();
                    // clickButton('tell ' + assistant + ' ASSIST/reTell/' + notice_msg);
                }

                // if (notice_msg.indexOf('今天') > 0 && notice_msg.indexOf('已做完') < 0) {
                //     // sendToQQ(notice_msg);
                //     // stopJianghu();
                //     // clickButton('tell ' + assistant + ' ASSIST/reTell/' + notice_msg);
                // }

                if (notice_msg.indexOf('獲得了戰利品') >= 0 && notice_msg.indexOf('青木寶箱') >= 0) {
                    setKilledQianlong1(notice_msg);
                }
                if (notice_msg.indexOf('獲得') >= 0 && notice_msg.indexOf('天閣令') > 0) {
                    goUseXiang(1);
                }
                if (notice_msg.indexOf('獲得') >= 0 && notice_msg.indexOf('風雲令') > 0) {
                    goUseXiang(2);
                }
                if (notice_msg.indexOf('獲得') >= 0 && notice_msg.indexOf('風雲寶箱') > 0) {
                    goUseXiang(3);
                }
				if (notice_msg.indexOf('經過你的耐心診治，病人終於心滿意足的回去了。') >= 0) {
                    clickButton('event_1_12050280');
                }
				if (notice_msg.indexOf('不能一次使用多') >= 0) {
					var id = userALlItem_id;
					var amount = userALlItem_amount;
                    var cmd = 'items use ' + id + ';';
					go(cmd.repeat(amount));
                }
				if (notice_msg.indexOf('你的背包裡沒有這個物品') >= 0) {
					stopCmd();
                }
				if (notice_msg.indexOf('你當前沒有突破任何技能') >= 0) {
					clearInterval(tupoTimer);
                }
                if (autobuyfish && notice_msg.indexOf('你沒有精良魚餌，無法釣魚') >= 0) {
                    clickButton('shop buy shop44_N_10');
                    clickButton('diaoyu');
                }
                if (autozhu && notice_msg.indexOf('恭喜你，打敗祝玉研獲得') >= 0) {
                    go('n;s');
                }
				if (notice_msg.indexOf('你中了【黑蛭異毒】') >= 0) {
                    clickButton('items use obj_zuixianwan');
                }
                if (notice_msg.indexOf('獲得') >= 0 && notice_msg.indexOf('錦鯉') > 0 && (notice_msg.indexOf('獲得') < notice_msg.indexOf('錦鯉'))) {
                    // sendToQQ(notice_msg);
                    clickButton('tell ' + assistant + ' ASSIST/錦鯉/add/' + notice_msg);
                }
                if (notice_msg.indexOf('獲得') >= 0 && notice_msg.indexOf('錦袋') > 0) {
                    clickButton('tell ' + assistant + ' ASSIST/reTell/' + notice_msg);
                }
                if (notice_msg.indexOf('獲得') >= 0 && notice_msg.indexOf('百宜雪梅') > 0 && notice_msg.indexOf('蟠桃') > 0) {
                    clickButton('tell ' + assistant + ' ASSIST/reTell/' + notice_msg);
                }
                if (notice_msg.indexOf('獲得') >= 0 && notice_msg.indexOf('采茶') > 0) {
                    // sendToQQ(notice_msg);
                    clickButton('tell ' + assistant + ' ASSIST/錦鯉/add/' + notice_msg);
                }
                if (notice_msg.indexOf('大顯神威') > 0 && notice_msg.indexOf('[1區]地府') > 0) {
                    clearKillBeforeBangzhan();
                }
                var duboName = doBoZhu().name;
                if (isBigId() && Jianshi.tf > 0 && notice_msg.indexOf(duboName + "略勝一籌") != "-1" && notice_msg.indexOf("進入決賽") != "-1") {
                    doBo('1');
                    return;
                }
                if (notice_msg.indexOf(duboName + "力挫群雄") != "-1" && Jianshi.tf > 0) {
                    doBo('2');
                    return;
                }
                if (notice_msg.indexOf('開始觀舞') != '-1') {
                    sendToQQ(notice_msg)
                }
                if (notice_msg.indexOf('幫派副本') != '-1') {
                    console.log(notice_msg)
                }
                // 五鼠尋找
                if (notice_msg.indexOf('需要你幫忙找') != '-1') {
                    wushuSearch(notice_msg);
                }
                //五鼠殺人
                if (notice_msg.indexOf('需要你幫忙殺') != '-1') {
                    wushuKill(notice_msg);
                }
                // 五鼠回去
                if (notice_msg.indexOf('回去回復它吧') != '-1') {
                    var wayArr = [{ 'name': '五鼠', way: 'jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n' }];
                    addScreenBtn(wayArr);
                }
				// 80輔助使用
				if (notice_msg.indexOf('脚本权限') >= 0) {
					leftbtnlist = [];
                    $('button').each(function(i, v) {
						if ($(this).text() == '显左') {
							$(this).attr('id', 'leftmenu0');
						}
						if ($(this).text() == '脚本工具') {
							$(this).attr('id', 'leftmenu1');
						}
						if ($(this).text() == '杀隐藏怪') {
							$(this).attr('id', 'leftmenu2');
						}
						if ($(this).text() == '显示奇侠') {
							$(this).attr('id', 'leftmenu3');
						}
						if ($(this).text() == '地图寻人') {
							$(this).attr('id', 'leftmenu4');
						}
						if ($(this).text() == '自动天剑') {
							$(this).attr('id', 'leftmenu5');
						}
						if ($(this).text() == '常用辅助') {
							$(this).attr('id', 'leftmenu6');
						}
						if ($(this).text() == '管理背包') {
							$(this).attr('id', 'leftmenu7');
						}
						if ($(this).text() == '章节导航') {
							$(this).prev().after('<button type="button" id="mapN" style="position: absolute; visibility: hidden; top: 3.7rem; background-color: rgba(174, 238, 238, 0.9); left: 5rem; height: 1.5rem;">章节导航</button>');
							leftbtnlist.push('#mapN');
							$(this).remove();
							$('#mapN').on("click",function(){
								TWmapNavigatorFunc();
							});
						}
						if ($(this).text() == '寻人导航') {
							$(this).prev().after('<button type="button" id="xunren" style="position: absolute; visibility: hidden; top: 5.4rem; background-color: rgba(174, 238, 238, 0.9); left: 5rem; height: 1.5rem;">寻人导航</button>');
							leftbtnlist.push('#xunren');
							$(this).remove();
							$('#xunren').on("click",function(){
								TWmenNavigatorFunc();
							});
						}
					})
					$.each(leftbtnlist, function(id, value) {
						console.log(value);
						$('#leftmenu0').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
						$('#leftmenu1').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
						$('#leftmenu2').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
						$('#leftmenu3').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
						$('#leftmenu4').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
						$('#leftmenu5').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
						$('#leftmenu6').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
						$('#leftmenu7').on("click",function(){
							$(value).css('visibility', 'hidden');
						});
					}) 
					$('#leftmenu4').on("click",function(){
						if ($('#leftmenu4').text() == '地图寻人') {
							$('#xunren').css('visibility', 'hidden');
							$('#mapN').css('visibility', 'hidden');
						} else if ($('#leftmenu4').text() == '隐藏寻人') {
							$('#xunren').css('visibility', 'visible');
							$('#mapN').css('visibility', 'visible');
						}
					});
					
                }
            }
            if (type == 'channel') {
                var msg = b.get('msg');
                msg = g_simul_efun.replaceControlCharBlank(msg.replace(/\u0003.*?\u0003/g, ""));
                //監控大快朵頤
                if (Base.getCorrectText('4253282') && msg.indexOf("大快朵頤") != '-1') {
                    sendToQQ(msg);
                    return;
                }
                if (msg.indexOf('遊俠會') >= 0) {
                    // addTuBtn(msg);
					WriteToScreen(b.get('msg'));
					if (isyouxia) {
						setTimeout(function () {
						   youXiaHui(msg);
						}, 1000 * 60);
					}
                }
                // console.log('channel:' + msg);
				if (msg.slice(0,4) == '【閒聊】') {
					WriteToScreen('<span style="color:Aqua">' + msg);
				}
				if (msg.slice(0,6) == '【系統】跨服') {
					WriteToScreen(b.get('msg'));
				}
                if (msg.indexOf('判師而出') > 0) {
					dhourtime = parseInt(new Date().getHours());
					dmintime = parseInt(new Date().getMinutes()) + 26;
					dsectime = new Date().getSeconds();
					if (dmintime >= 60) {
						dmintime = dmintime - 60;
						dhourtime = dhourtime + 1;
					}
					if (dhourtime > 12) {
						var htype = '下午'
						dhourtime = dhourtime - 12;
					} else if (dhourtime < 12) {
						var htype = '上午'
					} else if (dhourtime == 12) {
						var htype = '中午'
					}
                    console.log(msg);
					if (msg.indexOf('風繼中') > 0) {
						var dspsv = '25億';
					} else if (msg.indexOf('顧惜朝') > 0) {
						var dspsv = '30億';
					} else if (msg.indexOf('荊無命') > 0) {
						var dspsv = '45億';
					} else if (msg.indexOf('楊肅觀') > 0) {
						var dspsv = '60億';
					}
					if (msg.indexOf('門派') > 0 && msg.indexOf('楊肅觀') > 0) {
						//WriteToScreen(b.get('msg') + '<span style="color:OrangeRed">結算時間: ' + htype + dhourtime + '點' + dmintime + '分' + dsectime + '秒\n可獲得潛能: ' + dspsv);
					} else if (msg.indexOf('門派') > 0 && msg.indexOf('荊無命') > 0) {
						//WriteToScreen(b.get('msg') + '<span style="color:OrangeRed">結算時間: ' + htype + dhourtime + '點' + dmintime + '分' + dsectime + '秒\n可獲得潛能: ' + dspsv);
					}
                    //if (my_family_name && msg.indexOf(my_family_name)>0){
                    addTuBtn1(msg);
                    //}
                }

                //【幫派】『天&&馬』：發現白衣神君位於binghuo-冰湖
                if (Jianshi.xs > 0 && msg) {
                    if (msg.indexOf('發現') > -1 && msg.indexOf('位於') > -1) {
                        console.log('channel幫派' + msg);
                        goCorrectBingXue(msg);
                        // g_gmain.clickButton('team chat ' + msg);
                    }
                }
                // 【系統】雪亂江湖：雪山派弟子白衣神君哈哈大笑：大爺來了，把值錢的都交出來!
                if (msg.indexOf('雪亂江湖') > -1 && msg.indexOf('哈哈大笑') > -1) {
                    // console.log('channel' + msg);
                }

                if (Jianshi.tf > 0) {
                    if (msg.indexOf('逃犯任務') > 0 && msg.indexOf('明天') > 0) {
                        // 逃犯任務達到上限
                        stopTaoFan();
                    }
                    if ($("#skill_1")[0] != undefined) {
                        return;
                    }
                    // var indexText = ['段老大','二娘','嶽老三','雲老四','劇盜','惡棍','流寇'];
                    var indexText = [
                        "二娘",
                        "夜魔",
                        // "嶽老三"
                    ];
                    for (var i = 0; i < indexText.length; i++) {
                        var name = '【系統】' + indexText[i];
                        if (msg.indexOf(name) != '-1') {
                            var place = getPlace2(msg);
                            if (place) {
                                findKuaTaoFan(place);
                            }
                        }
                    }

                    var indexTextKuFu = '【系統】' + kuafuNpc + '段老大';
                    if (msg.indexOf(indexTextKuFu) != '-1') {
                        var place = getPlace2(msg);
                        if (place) {
                            findKuaTaoFan(place);
                        }
                    }
                }
            }
            if (Jianshi.bangzhan > 0) {
                var msg = b.get('msg');
                if (!msg) {
                    return;
                }
                msg = g_simul_efun.replaceControlCharBlank(
                    msg.replace(/\u0003.*?\u0003/g, "")
                );
                if (msg.indexOf("幫派風雲戰") != "-1" && msg.indexOf('地府') != "-1" && msg.indexOf('鎮守') != "-1") {
                    goBangZhan(msg);
                    return;
                }
            }
            if (Jianshi.xuanhong > 0) {
                var msg = b.get('msg');
                if (type == 'notice') {
                    msg = g_simul_efun.replaceControlCharBlank(msg.replace(/\u0003.*?\u0003/g, ""));
                    if (msg.indexOf('【江湖懸紅榜】任務已完成。') != -1) {
                        Jianshi.xhnpc = [];
                        go('jh 1;w;event_1_40923067;event_1_40923067');
                    }
                    if (msg.indexOf('請稍候再試') != -1 || msg.indexOf('等下再來') != -1) {
                        Jianshi.xhnpc = [];
                        go('event_1_40923067');
                    }
                    if (msg.match(/此地圖還未解鎖/)) {
                        Jianshi.xhnpc = [];
                    }
                } else if (type == 'main_msg') {
                    msg = g_simul_efun.replaceControlCharBlank(msg.replace(/\u0003.*?\u0003/g, ""));
                    // console.log(msg)
                    if (msg.indexOf('江湖懸紅榜') != -1) {
                        var xh = msg.match('『(.*)』的『(.*)』');
                        var xh1 = xh[1], xh2 = xh[2];
                        // xh1 是地址  xh2是描述
                        var hasXuanhongWay = false;
                        if (xhts[xh1]) {
                            $.each(xhts[xh1], function (key, val) {
                                if (val.indexOf(xh2) != -1) {
                                    hasXuanhongWay = true;
                                    InforOutFunc(key);
                                    Jianshi.xhnpc.push(key);
                                    if (hairsfalling[xh1][key]) {
                                        InforOutFunc(key, hairsfalling[xh1][key]);
                                        go(hairsfalling[xh1][key]);
                                    };
                                }
                            });
                        }

                        if (!hasXuanhongWay) {
                            go('event_1_72202956 go;event_1_40923067');
                        }
                    }
                }
            }
            if (type == 'main_msg') {
                var msg = g_simul_efun.replaceControlCharBlank(b.get("msg"));
                //監控大快朵頤
                if (Base.getCorrectText('4253282') && msg.indexOf("大快朵頤") != '-1') {
                    // sendToQQ(msg)
                    return;
                }

                if (msg.indexOf('逃犯任務') > 0 && msg.indexOf('明天') > 0) {
                    // 逃犯任務達到上限
                    stopTaoFan();
                }
                if (msg.indexOf('隊伍') >= 0 && msg.indexOf('位於') >= 0) {
                    goCorrectBingXue(msg);
                    return;
                }

                // if (msg.indexOf('隊伍') == '-1' || followTeamSwitch == '0') {
                //     return;
                // }

                // var actionName = null;
                // var actionCode = null;
                // if (msg.indexOf('ask') > 0) {
                //     actionName = msg.split('click')[1].split("'，")[0];
                //     actionName = 'click' + actionName + "')";
                //     actionName = actionName.split('ask');
                //     actionCode = actionName[0] + 'ask ' + actionName[1];
                // }
                // if (msg.indexOf('jh') > 0) {
                //     actionName = msg.split('clickButton')[1];
                //     actionName = actionName.split('jh');
                //     actionCode = 'clickButton ' + actionName[0] + 'jh ' + actionName[1];
                // }

                // if (msg.indexOf('go') > 0) {
                //     actionName = msg.split('click')[1].split('。')[0];
                //     actionName = 'click' + actionName + "')";
                //     actionName = actionName.split('go');
                //     actionCode = actionName[0] + 'go ' + actionName[1];
                // }
                // if (msg.indexOf('kill') > 0) {
                //     actionName = msg.split('click')[1].split('，')[0];
                //     actionName = 'click' + actionName + ")";
                //     actionName = actionName.split('kill');
                //     actionCode = actionName[0] + 'kill ' + actionName[1];
                // }
                // if (msg.indexOf('fight') > 0) {
                //     actionName = msg.split('click')[1].split('，')[0];
                //     actionName = 'click' + actionName + ")";
                //     actionName = actionName.split('fight');
                //     actionCode = actionName[0] + 'fight ' + actionName[1];
                // }
                // if (msg.indexOf('event') > 0) {
                //     actionName = msg.split('click')[1].split('，')[0];
                //     actionName = 'click' + actionName + ")";
                //     actionCode = actionName;
                // }
                // // console.log(actionCode);
                // eval(actionCode);
            }
            if ($('#skill_1').length == 0) {
                maxQiReturn = 0;
                chuzhaoNum();
                bixueEnd();
                hitMaxEnd();
                return;
            }
            if (type == "vs" && subType == "text") {
                var msg = b.get('msg');
                if (!msg) {
                    return;
                }
                msg = g_simul_efun.replaceControlCharBlank(msg.replace(/\u0003.*?\u0003/g, ""));
                // console.log('msg_r' + msg)
                if (msg.indexOf("你驟地怒吼一聲") > -1) {
                    bixueStart();
                }
                if (msg.indexOf("玄天之志") > -1 && msg.indexOf("。你短時間內提升了") > -1) {
                    bishouStart();
                }
                //longxiang
                if (msg.indexOf("你的筋骨") > -1 && msg.indexOf("攻擊力") > -1) {
                    Jianshi.longxiang = 1;
                    longxiangStart();
                }
                //longxiang
                if (msg.indexOf("你運起天邪神功") > -1) {
                    tianxieStart();
                }
                // 步玄眩暈
                if (msg.indexOf("四處飄動") > -1 && msg.indexOf("頭暈目眩") > -1) {
                    var my_name = g_obj_map.get("msg_attrs").get('name');
                    my_name = removeChart(my_name);
                    if (msg.indexOf(my_name) >= 0) {
                        Jianshi.xuanyun = 1;
                        if (Jianshi.xuanhong == 1) {
                            Base.qi = 4;
                            xuanyunStart('步玄')
                        }
                    }
                }
                // 意寒眩暈
                if (msg.indexOf("你爆出大量") > -1 && msg.indexOf("瑟瑟發抖") > -1) {
                    Jianshi.xuanyun = 1;
                    if (Jianshi.xuanhong == 1) {
                        Base.qi = 4;
                        xuanyunStart('意寒')
                    }
                }


                if (msg.indexOf("斷潮一擊") > -1 || msg.indexOf("回天之力") > -1) {
                    hitMax();
                    // if (
                    //     Jianshi.tf > 0 &&
                    //     Base.getCorrectText(
                    //         "4316804"
                    //     ) &&
                    //     Base.correctQu() == "37" &&
                    //     kuafuNpc == ""
                    // ) {
                    //     clickButton("escape");
                    // }
                    // sendToQQ('已打過血上限')
                }

                // 跟招
                if (genZhaoMode == 1) {
                    if (msg !== "" && (msg.indexOf("--燎原百擊--") > -1 || msg.indexOf("--破軍棍訣--") > -1 || msg.indexOf("--千影百傷棍--") > -1) || msg.indexOf("--九溪斷月槍--") > -1) {
                        var qiNumber = gSocketMsg.get_xdz();
                        var qiText = gSocketMsg.get_xdz();

                        var hasHeal = checkHeal();
                        if (hasHeal) {
                            return;
                        }
                        if (qiText > 3) {
                            doKillSet();
                        }
                    }
                }
                // 懟人
                if (Jianshi.dr == 1) {
                    var txt = msg;
                    var hitDesList = null;
                    var OldList = hitKeys;
                    if (targetNpcName) {
                        hitDesList = targetNpcName.split(',').concat(killTargetArr);
                    } else {
                        hitDesList = OldList;
                    }
                    for (var i = 0; i < hitDesList.length; i++) {
                        var hitText = hitDesList[i];
                        if (txt.indexOf(hitText) != '-1') {
                            if (txt.indexOf('太極神功') != '-1' || txt.indexOf('金剛不壞功力') != '-1' || txt.indexOf('手腳遲緩') != '-1' || txt.indexOf('手腳無力') != '-1' || txt.indexOf('傷害') != '-1' || txt.indexOf('武藝不凡') != '-1' || txt.indexOf('我輸了') != '-1' || txt.indexOf('臉色微變') != '-1' || txt.indexOf('直接對攻') != '-1') {
                                return;
                            }
                            else if (txt.indexOf('領教壯士的高招') == '-1' && txt.indexOf('深深吸了幾口氣') == '-1' && txt.indexOf('希望擾亂你') == '-1' && txt.indexOf('緊接著') == '-1' && txt.indexOf('同時') == '-1' && txt.indexOf('身形再轉') == '-1' && txt.indexOf('迅疾無比') == '-1') {
                                console.log('出招～～～' + txt);
                                kezhi('1');
                                return;
                            } else {
                                console.log('其他～～～' + txt);
                            }
                        }
                    }
                }

                // 打樓
                if (daLouMode == 1) {
                    var txt = msg;
                    // var hp = geKeePercent();
                    var qiNumber = gSocketMsg.get_xdz();
                    if (qiNumber < 3) {
                        return;
                    }
                    var hasHeal = checkHeal();
                    if (hasHeal) {
                        return;
                    }

                    // 對面使用內功 我就使用輕功
                    var hitDesList = ['湧向你'];
                    var vsForce = g_obj_map.get("msg_vs_info").get("vs2_force1");
                    var hasDoDU = false;
                    if (vsForce > 100) {
                        for (var i = 0; i < hitDesList.length; i++) {
                            var hitText = hitDesList[i];
                            if (txt.indexOf(hitText) != '-1') {
                                var skillArr = ["無影毒陣"];
                                var skillIdA = ['1', '2', '3', '4', '5', '6', '7'];
                                var userSkillsSwitch = false;
                                $.each(skillArr, function (index, val) {
                                    var skillName = val;

                                    for (var i = 0; i < skillIdA.length; i++) {
                                        var btnNum = skillIdA[i];
                                        var btn = $('#skill_' + btnNum);
                                        var btnName = btn.text();
                                        if (btnName == skillName) {
                                            btn.find('button').trigger('click');
                                            userSkillsSwitch = true;
                                            hasDoDU = true;
                                            break;
                                        }
                                    }
                                });
                                if (!userSkillsSwitch) {
                                    kezhi('1');
                                }
                                return
                            }
                        }
                    }
                    if (!hasDoDU && $('.cmd_skill_button').length > 0) {
                        // var hitDesList = ['刺你','掃你','指你','你如','至你','拍你','向你','在你','準你','點你','劈你','取你','往你','奔你','朝你','擊你','斬你','撲你','取你','射你','你淬','卷你','要你','將你','湧向你','對準你','你急急','抓破你','對著你','你已是','你被震','鉆入你','穿過你','你愕然','你一時','你難辨','你竭力','縱使你有','圍繞著你','你生命之火','你掃蕩而去','你反應不及','你再難撐持','你無處可避','貫穿你軀體','你擋無可擋','你大驚失色','你的對攻無法擊破','你這一招並未奏效','你只好放棄對攻'];
                        var hitDesList = hitKeys;
                        for (var i = 0; i < hitDesList.length; i++) {
                            var hitText = hitDesList[i];
                            if (txt.indexOf('鐵鎖橫江') == '-1' && txt.indexOf('金剛不壞功力') == '-1' && txt.indexOf('太極神功') == '-1') {
                                if (txt.indexOf(hitText) != '-1') {
                                    // console.log('打樓當前信息：'+ txt);
                                    // if (Base.getCorrectText('4253282')) {
                                    //     if (txt.indexOf('掌') != '-1' || txt.indexOf('拳') != '-1' || txt.indexOf('指') != '-1') {
                                    //         kezhi('2');
                                    //     } else {
                                    //         kezhi('1');
                                    //     }
                                    // } else {
                                    doKillSet();
                                    // }
                                    return
                                }
                            }

                        }
                    }
                }

                // 對招
                if (duiZhaoMode == 1) {
                    if (hasQiLin()) {
                        go('escape');
                        setTimeout(function () {
                            go('home');
                        }, 1000);
                        return false;
                    }

                    var txt = msg;

                    if ($('.cmd_skill_button').length > 0) {
                        var qiNumber = gSocketMsg.get_xdz();
                        if (pozhao == 1 || qiNumber < 3) {
                            return;
                        }

                        var hasHeal = checkHeal();
                        if (hasHeal) {
                            return;
                        }
                        // console.log('is_pozhao_fail:' + is_pozhao_fail(txt));
                        // console.log('is_normal_attack:' + is_normal_attack(txt));
                        // var hitDesList = ['刺你','掃你','指你','你如','至你','拍你','向你','在你','準你','點你','劈你','取你','往你','奔你','朝你','擊你','斬你','撲你','取你','射你','你淬','卷你','要你','將你','湧向你','對準你','你急急','抓破你','對著你','你已是','你被震','鉆入你','穿過你','你愕然','你一時','你難辨','你竭力','縱使你有','圍繞著你','你生命之火','你掃蕩而去','你反應不及','你再難撐持','你無處可避','貫穿你軀體','你擋無可擋','你大驚失色','你的對攻無法擊破','你這一招並未奏效','你只好放棄對攻'];
                        var hitDesList = hitKeys;
                        for (var i = 0; i < hitDesList.length; i++) {
                            var hitText = hitDesList[i];
                            if (txt.indexOf('鐵鎖橫江') == '-1' && txt.indexOf('金剛不壞功力') == '-1' && txt.indexOf('太極神功') == '-1') {
                                if (txt.indexOf(hitText) >= 0) {
                                    // console.log('出招當前信息：'+ txt);
                                    // if (Base.getCorrectText('4253282')) {
                                    //     if (txt.indexOf('掌') != '-1' || txt.indexOf('拳') != '-1' || txt.indexOf('指') != '-1') {
                                    //         kezhi('2');
                                    //     } else {
                                    //         kezhi('1');
                                    //     }
                                    // } else {
                                    for (var j = 0; j < ignoreList.length; j++) {
                                        if (txt.indexOf(ignoreList[j]) >= 0) {
                                            return;
                                        }
                                    }
                                    pozhao = 1;
                                    doKillSet();
                                    setTimeout(function () { pozhao = 0 }, 400);
                                    // }
                                    return
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    // 使用令牌
    function goUseXiang(type) {
        go('clan scene');
        if (type == '1') {
            go('give_geling')
        }
        if (type == '2') {
            go('give_fengyunling')
        }
        if (type == '3') {
            go('items use obj_fengyunbaoxiang')
        }
    }
    var zhanDouView = new ZhanDouView;

    function bixueStart() {
        bixueArr.push('碧血');
        $('.bixueText').html('已開啟' + bixueArr.join('、'));
        bixueSwitch = true;
        g_gmain.notify_fail(HIG + "狂吐一口血：" + RED + "恭喜你碧血成功！！" + NOR);
        // console.log('已開啟碧血');
    }
    function longxiangStart() {
        bixueArr.push('龍象');
        $('.bixueText').html('已開啟' + bixueArr.join('、'));
        g_gmain.notify_fail(HIG + "龍象爆發出駭人威力：" + RED + "恭喜你龍象成功！！" + NOR);
        // console.log('已開啟鼻血');
    }
    function tianxieStart() {
        bixueArr.push('天邪');
        $('.bixueText').html('已開啟' + bixueArr.join('、'));
        g_gmain.notify_fail(HIG + "你運起天邪神功：" + RED + "恭喜你紅眼成功！！" + NOR);
        // console.log('已開啟鼻血');
    }
    function bishouStart() {
        bixueArr.push('白首');
        $('.bixueText').html('已開啟' + bixueArr.join('、'));
        bishouSwitch = true;
        g_gmain.notify_fail(HIG + "玄天之志：" + RED + "恭喜你白首成功！！" + NOR);
        // console.log('已開啟鼻血');
    }
    function xuanyunStart(name) {
        bixueArr.push(name);
        $('.bixueText').html('已開啟' + bixueArr.join('、'));
    }
    function hitMax() {
        $('.hitMax').html('已打過血上限');
        // goInLine(getTimes() + '已打過血上限')
    }
    var attack = 0;
    var attack_times = 0;
    function setJichu(txt) {
        var addNum = txt.split('+')[1];
        attack = parseInt(attack) + parseInt(addNum);
        attack_times++;
        // $('.jichuText').html('使用次數：' + attack_times + '，基礎攻擊+：' + attack);
    }

    var bixueArr = [];
    function bixueEnd() {
        if (g_gmain) {
            if (!g_gmain.is_fighting) {
                bixueSwitch = false;
                bishouSwitch = false;
                Jianshi.longxiang = 0;
                bixueArr = [];
                $('.bixueText').html('');
            }
        }
    }

    function hitMaxEnd() {
        if (g_gmain) {
            if (!g_gmain.is_fighting) {
                $('.hitMax').html('');
            }
        }
    }

    function btnInit() {
        $('#btn0').trigger('click');
        if (Base.getCorrectText('4253282')) {
            $('#btn7').trigger('click');
            $('#btn8').trigger('click');
            // $('#btn9').trigger('click');
            // $('#btno26').trigger('click');
            $('#btnOnTime').trigger('click');
            $('#btn-watchQQ').trigger('click');
        } else if (Base.getCorrectText('7905194')) {
            $('#btn4').trigger('click');
            $('#btn8').trigger('click');
            $('#btnOnTime').trigger('click');
        } else if (isSelfId() && Base.correctQu() != '1') {
            $('#btn7').trigger('click');
            $('#btn8').trigger('click');
            // $('#btn9').trigger('click');
            // $('#btno26').trigger('click');
            $('#btnOnTime').trigger('click');
        } else if (isLittleId()) {
            $('#btn7').trigger('click');
            $('#btn8').trigger('click');
            $('#btnOnTime').trigger('click');
        } else if (isGuaJiId()) {
            $('#btn7').trigger('click');
            $('#btn8').trigger('click');
            // $('#btn10').trigger('click');
            $('#btnOnTime').trigger('click');
        } else if (isVip()) {
            $('#btn7').trigger('click');        // 對招
            $('#btn8').trigger('click');        // 自動
            // $('#btno26').trigger('click');      // 自動恢復
            $('#btnOnTime').trigger('click');   // 定時任務
            // $('#btnv15').trigger('click');   // 跟招
        } else {
            $('#btn7').trigger('click');
            $('#btn8').trigger('click');
            // $('#btno26').trigger('click');
            $('#btnOnTime').trigger('click');
        }
        if (Base.getCorrectText('7905194')) {
            $('#btn4').trigger('click');
        }
        // if (isBigBixue()) {
        //     $('#btnv19').trigger('click');  // 鼻血
        //     $('#btno6').trigger('click');   // 逃犯
        // }
        // if (getCookie(window.userId + 'qljs') == '1') {
        //     $('#btn12').trigger('click');
        // }
        if (getCookie(window.userId + 'cljs') == '1') {
            $('#btno28').trigger('click');
        }
        if (getCookie(window.userId + 'jianghu') == '1') {
            setTimeout(function () {
                $('#btn15').trigger('click');
            }, 2000);
        }
        // if (getCookie(window.userId + 'xsdz') == '1') {
        //     $('#btns5').trigger('click');
        // }
    }
    // 停止逃犯
    function stopTaoFan() {
        if (Jianshi.tf > 0) {
            $('#btno6').trigger('click');   // 逃犯
            go('home');
        }
    }
    // 停止江湖
    function stopJianghu() {
        if (Jianshi.jianghu > 0) {
            $('#btn15').trigger('click');   // 江湖
            go('home');
        }
    }
    // 開始江湖
    function startJianghu() {
        if (Jianshi.jianghu == 0) {
            $('#btn15').trigger('click');   // 江湖
        }
    }
    // 開始逃犯
    function startTaoFan() {
        if (Jianshi.tf == 0) {
            $('#btno6').trigger('click');   // 逃犯
        }
    }
    // vip 點日常
    function vipRiChang() {
        go('clan fb go_saodang shenshousenlin');
        go('clan fb go_saodang daxuemangongdao');
        go('home');
        go('public_op12');
        // setTimeout(function () {
        //     clickRiChang();
        // }, 2000);
    }

    function waKuang(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '挖礦') {
            Dom.html('關挖礦');
            Jianshi.wk = 1;
            var roomName = $('#out .outtitle').text();
            var action = 'event_1_39762344';  // 地礦
            var action1 = 'event_1_64388826';  // 挖地礦
            if (killBadSwitch) {
                action = 'event_1_7898524';
                action1 = 'event_1_22920188';
            }
            //event_1_22920188
            //clickButton('event_1_64388826', 0)
            if (roomName.indexOf('礦洞入口') >= 0) {
                go(action);
            } else {
                go('jh 2;n;n;n;n;n;n;n;n;n;n;w;w;w;w');
                go(action);
            }
            for (var i = 0; i < 5; i++) {
                go(action1);
            }
        } else {
            Dom.html('挖礦');
            Jianshi.wk = 0;
        }
    }


    function waKuang1() {
        var roomName = $('#out .outtitle').text();
        var action = 'event_1_39762344';  // 地礦
        var action1 = 'event_1_64388826';  // 挖地礦
        if (killBadSwitch) {
            action = 'event_1_7898524';
            action1 = 'event_1_22920188';
        }
        //clickButton('event_1_64388826', 0)
        if (roomName.indexOf('礦洞入口') >= 0) {
            go(action);
        } else {
            go('jh 2;n;n;n;n;n;n;n;n;n;n;w;w;event_1_85329567;w;w');
            go(action);
        }
        for (var i = 0; i < 5; i++) {
            go(action1);
        }

    }

    function goWaKuang() {
        removeOnTime();
        clickWakuangBtn();
    }

    function clickRiChang() {
        var btn = $('.cmd_click2');
        btn.each(function () {
            var txt = $(this).text();
            if (txt.indexOf('立即完成') != '-1') {
                var clickText = $(this).attr('onclick');
                var clickAction = getLibaoId(clickText);
                triggerClick(clickAction);
            }
        })
    }
    // 令牌
    function doLingPai() {
        // go('home;jh 1');
        go('items get_store /obj/shop/zhengxieling;items get_store /obj/med/zhuangyuantie;items get_store /obj/shop/zhengxieling;items get_store /obj/shop/bangpailing;items get_store /obj/shop/jianghuling;items get_store /obj/shop/shimenling;');
        go('home');
        console.log(getTimes() + '完成令牌兌換');
    }
    // 開白銀
    var openBaiyinTimer = null;
    function openBaiYin(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '開白銀') {
            Dom.html('不開白銀');
            go('items get_store /obj/shop/box1');
            openBaiyinTimer = setInterval(function () {
                go('items use baiyin box_N_100');
            }, 1000);
        } else {
            Dom.html('開白銀');
            clearInterval(openBaiyinTimer);
        }
    }
    // 開青木
    var openQingmuTimer = null;
    function openQingMu(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '開青木') {
            Dom.html('不開青木');
            go('items get_store /obj/shop/qingmubaoxiang');
            openQingmuTimer = setInterval(function () {
                go('items use obj_qingmubaoxiang_N_100');
            }, 1000);
        } else {
            Dom.html('開青木');
            clearInterval(openQingmuTimer);
        }
    }
    // 開曜玉
    var openYaoYuTimer = null;
    function openYaoYu(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '開曜玉') {
            Dom.html('不開曜玉');
            go('items get_store /obj/shop/yaoyuyaoshi');
            go('items get_store /obj/shop/yaoyubaoxiang');
            openYaoYuTimer = setInterval(function () {
                go('items use obj_yaoyubaoxiang');
            }, 500);
        } else {
            Dom.html('開曜玉');
            clearInterval(openYaoYuTimer);
        }
    }
    //eatHua
    var eatHuaTimer = null;
    function eatHua(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '吃花') {
            Dom.html('不吃花');
            go('items get_store /obj/shop/wuyiwei');
            eatHuaTimer = setInterval(function () {
                go('items use obj_wuyiwei');
            }, 500);
        } else {
            Dom.html('吃花');
            clearInterval(eatHuaTimer);
        }
    }
    // 墨家主線
    // function mojiaZhuxian(e) {
    //     var Dom = $(e.target);
    //     var DomTxt = Dom.html();
    //     if (DomTxt == '墨家主線1') {
    //         go1();
    //         Dom.html('墨家主線2');
    //     }
    //     if (DomTxt == '墨家主線2') {
    //         go2();
    //         Dom.html('墨家主線3');
    //     }
    //     if (DomTxt == '墨家主線3') {
    //         go3();
    //         Dom.html('墨家主線4');
    //     }
    //     if (DomTxt == '墨家主線4') {
    //         go4();
    //         Dom.html('墨家主線5');
    //     }
    //     if (DomTxt == '墨家主線5') {
    //         go5();
    //         Dom.html('墨家主線1');
    //     }
    // }
    // function go1() {
    //     go('jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;ask mojiajiguancheng_suolucan');
    // }
    // function go2() {
    //     go('n;n;n;n;n;ask mojiajiguancheng_yandan;ask mojiajiguancheng_jingke');
    // }
    // function go3() {
    //     go('s;s;e;e;n;n;event_1_39026213;n;ne;se;s;event_1_623818-神龍山;e;n;e;s;e;n;nw;e;nw;w;w;ask mojiajiguancheng_dajiangshi');
    // }
    // function go4() {
    //     go('e;e;se;w;se;s;w;n;w;s;w;e;s;e;s;ne;s;sw;nw;s;se;s;sw;s;s;ask mojiajiguancheng_xufuzi');
    // }
    // function go5() {
    //     go('n;n;ne;n;nw;n;se;ne;n;sw;n;w;n;w;e;s;e;s;ne;s;sw;nw;s;se;s;e;e;e');
    // }
    // 令牌
    function doUseLingPai() {
        go('home');
        go('items use obj_zhengxieling');
        go('items use obj_zhengxieling');
        go('items use obj_zhengxieling');
        go('items use obj_zhuangyuantie');
        go('items use obj_zhuangyuantie');
        go('items use obj_zhuangyuantie');
        go('items use obj_shimenling');
        go('items use obj_shimenling');
        go('items use obj_shimenling');
        go('items use obj_bangpailing');
        go('items use obj_bangpailing');

        if (Base.getCorrectText('4253282')) {
            go('items use obj_jianghuling');
            go('items use obj_jianghuling');
            go('items use obj_jianghuling');
        }
        // 完成師門
        for (var i = 0; i < 100; i++) {
            go('vip finish_family');
        }
        // 完成幫派
        for (var i = 0; i < 60; i++) {
            go('vip finish_clan');
        }
        console.log(getTimes() + '完成使用令牌');
        go('trigger@btn-hitBang');
    }
    // 看舞
    function guanWu() {
        // 血n event_1_48561012 go
        // 內力s event_1_29896809 go
        go('rank go 169;w;w;w;w;w;n;n;n;e;e;s;event_1_29896809 go');
    }

    // 偃月
    function yanYue() {
        go('rank go 183;e;s;s;sw;sw;s;se;s;s;sw;sw;s;w;n;n;n;ne');
    }

    // 京城賭博
    function doBo(add) {
        go('rank go 195');
        // go('go south');
        // go('go south');
        var obj = doBoZhu();
        go('event_1_28816059 bet go ' + obj.id + ' 1');
        if (add == '1') {
            // 追加元寶
            go('event_1_28816059 rebet go 1', 1)
        }
        if (add == '2') {
            // 領取獎勵
            go('event_1_28816059 get');
            setTimeout(function () {
                go('event_1_28816059 get');
            }, 5000);
        }
    }
    var doboRen = [
        {
            "name": "喬峰",
            "id": "0"
        },
        {
            "name": "黃衫女子",
            "id": "1"
        },
        {
            "name": "西門吹雪",
            "id": "4"
        },
        {
            "name": "陸小鳳",
            "id": "5"
        },
        {
            "name": "寇準",
            "id": "7"
        }
    ];
    // 賭博押註
    function doBoZhu() {
        var renturnObj = doboRen[4];
        // 37區東方紅
        if (Base.getCorrectText('4253282')) {
            renturnObj = doboRen[0];
        }
        // 王有財
        if (Base.getCorrectText('4219507')) {
            renturnObj = doboRen[1];
        }
        // 火狼
        if (Base.getCorrectText('4238943')) {
            renturnObj = doboRen[2];
        }
        // 跟班
        if (Base.getCorrectText('7030223')) {
            renturnObj = doboRen[3];
        }
        return renturnObj;
    }
    // 木頭人
    function mutourenFn() {
        go('jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;n;n;n');
    }
    function bangZhan_Func(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '跨服幫戰') {
            Jianshi.bangzhan = 1;
            Dom.html('停止幫戰');
        } else {
            Jianshi.bangzhan = 0;
            Dom.html('跨服幫戰');
        }
    }
    // 開啟掉線重連
    function openReLoad(e) {
        var Dom = $(e.target);
        var DomTxt = Dom.html();
        if (DomTxt == '掉線重連') {
            Jianshi.chonglian = 1;
            Dom.html('停止重連');
            setCookie(window.userId + 'cljs', '1')
        } else {
            Jianshi.chonglian = 0;
            Dom.html('掉線重連');
            setCookie(window.userId + 'cljs', '0')
        }
    }
    function reloadGame() {
        window.location.reload();
    }
    // 去幫戰
    function goBangZhan(text) {
        clearKillBeforeBangzhan();
        go('jh 1');      // 進入章節
        go('home');     // 廣場
        killBangZhan(text);
    }
    // 取消殺人
    function clearKillBeforeBangzhan() {
        if (killBadSetInterval != null) {
            $('#btno13').trigger('click');
        }
        if (killGoodSetInterval != null) {
            $('#btno12').trigger('click');
        }
    }
    function goBangzhanPlace(name, text) {
        name = name ? name : '至尊殿';
        var stepNum = isCorrectBangZhanPlace(name);

        if (stepNum) {
            go('go south');
            go('go west');
        }
    }
    function goHuangGe() {
        go('go south');
        go('go east');
    }
    function goXuanGe() {
        go('go south');
        go('go southeast');
    }
    function killBangZhan(text) {
        var name = '';
        var bad = true;
        console.log(text);
        name = text.split('】')[1].split('戰場')[0];
        bad = text.indexOf('37區') > text.indexOf('鎮守') ? true : false;
        console.log(name);
        setTimeout(function () {
            goBangzhanPlace(name, text);
        }, 2000);
        setTimeout(function () {
            // o12
            if (bad) {
                // 殺好人
                $('#btno12').trigger('click');
            } else {
                // 殺壞人
                $('#btno13').trigger('click');
            }
        }, 12000);
    }
    // 確認幫戰地圖
    function isCorrectBangZhanPlace(placeName) {
        var roomName = $('#out .outtitle').text();
        var placeNum = getBangzhanPlaceNum(placeName);
        var placeSpace = 0;
        console.log('before:' + roomName + '|| end:' + placeName);
        if (roomName == placeName) {
            return false;
        } else if (roomName == '聚義廳') {
            placeSpace = 10 - placeNum;
        } else {
            var thatPlaceNum = sureBangZhanPlace(roomName);
            if (thatPlaceNum > placeNum) {
                placeSpace = thatPlaceNum - placeNum;
                for (var i = 0; i < placeSpace; i++) {
                    go('go west');
                }
            } else {
                placeSpace = placeNum - thatPlaceNum;
                for (var i = 0; i < placeSpace; i++) {
                    go('go east');
                }
            }
        }
        return true;
        // 武林廣場10  聚義廳
    }
    function getBangzhanPlaceNum(name) {
        var place = ['至尊殿', '翰海樓', '八荒谷', '九州城', '怒蛟澤', '淩雲峰'];
        var placeNum = 0;
        for (var i = 0; i < place.length; i++) {
            if (name == place[i]) placeNum = i + 1;
        }
        return placeNum;
    }
    function sureBangZhanPlace(name) {
        return name.replace('武林廣場', '');
    }
    // 買藥
    function maiYao() {
        go('jh 1;e;n;n;n;w');
        for (var i = 0; i < 50; i++) {
            go('buy /map/snow/obj/qiannianlingzhi_N_10 from snow_herbalist');
        }
        for (var i = 0; i < 50; i++) {
            go('buy /map/snow/obj/wannianlingzhi_N_10 from snow_herbalist');
        }
    }
    // 導航
    function DaoHang() {
        var placeName = [];
        for (var i in hairsfalling) {
            placeName.push(i);
            InfoOutDaohang(i);
        }
        log('輸出成功！');
    }
    function InfoOutDaohang(text) {
        // var node = document.createElement("span");
        // node.className = "out2";
        // node.style = "color:rgb(255, 127, 0)";
        // var anode = document.createElement("a");
        // anode.style= "text-decoration:underline;color:yellow";
        // anode.setAttribute("onClick",'daoHangPlace("'+ text +'")');
        // anode.appendChild(document.createTextNode(text));
        // node.appendChild(anode);
        // document.getElementById("out2").appendChild(node);
        var html = "<a style='text-decoration:underline;color:yellow' onclick=daoHangPlace(\"" + text + "\")>" + text + "</a>";
        WriteToScreen(html);
    }
    function WriteToScreen(e) {
        var n = new Map;
        n.put("type", "main_msg"),
            n.put("subtype", "html"),
            n.put("msg", e),
            gSocketMsg.dispatchMessage(n);
    }
    // 找遊俠會
    youXiaHui = function (txt) {
        var uname = getNpcName(txt);
        //
        var careYouxia = getStore('youlist').split(',');
        if ($.inArray(uname, careYouxia) == -1) {
            return false;
        }
        var place = '';
        for (var i = 0; i < chapList.length; i++) {
            if (txt.indexOf(chapList[i]) > 0) {
                place = chapList[i];
            }
        }
        goFindNpcInPlace(place, uname);
    };
    function getNpcName(txt) {
        var _name = "";
        var _name = txt.split("聽說")[1].split("出來")[0];
        return _name;
    }
    //goFastWay 快捷路徑
    function goFastWay(e) {
        var wayArr = [
            // {
            //     name: '大昭壁畫',
            //     way: 'jh 26;w;w;n;w;w;w;n;n;e;event_1_12853448'
            // },
            // {
            //     name: '破除魔障',
            //     way: 'jh 31;n;se;e;se;s;s;sw;se;se;e;nw;e;ne;n;ne;n;n;n;n;n;n;n;n;n;e;e;event_1_94442590;event_1_22950681'
            // },
            // {
            //     name: '佳人覓香',
            //     way: 'jh 32;n;n;se;e;s;s;look_npc murong_azhu;event_1_99232080;e;e;s;e;s;e;e;e;look_npc murong_fangling;event_1_2207248'
            // },
            // {
            //     name: '十八木人',
            //     way: 'jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;n;n;n;event_1_91914705;e;e;e'
            // },
            // {
            //     name: '破石尋花',
            //     way: 'jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne;ne;nw;nw;w;event_1_95874671'
            // },
            // {
            //     name: '聞香尋芳',
            //     way: 'jh 43;sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;sw;sw;sw'
            // },
            {
                name: '十八木人',
                way: 'jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;n;n;n;event_1_91914705;e;e;e'
            }, {
                name: '四大絕殺',
                way: 'jh 44;n;n;n;n;e;ne;ne;ne;n;n;n;n;n;nw;nw;nw;w;n;n;n;n;e;n;n;n;n;n;w;w;n;n;n;n;n;n;n;n'
            }, {
                name: '偃月-百曉居士',
                way: 'jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e'
            }, {
                name: '天山-楊英雄',
                way: 'jh 39;ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939-星星峽;ts2;ne;ne;nw;nw'
            }, {
                name: '海雲鎮-血刀妖僧',
                way: 'jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne;e;se;se;se'
            }, {
                name: '長安-遊四海',
                way: 'jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;w'
            }, {
                name: '花街-觀舞',
                way: 'rank go 170;w;w;w;w;w;n;n;n;e;e;n;event_1_5392021 go'
            }, {
                name: '通天塔',
                way: 'rank go 193'
            }, {
                name: '紅螺寺',
                way: 'rank go 194'
            }, {
                name: '葬劍谷',
                way: 'rank go 223'
            }, {
                name: '無相樓',
                way: 'rank go 230'
            }, {
                name: '魔皇樓',
                way: 'rank go 236'
            }, {
                name: '霹靂堂',
                way: 'rank go 222'
            }, {
                name: '鑄劍洞',
                way: 'rank go 209'
            }, {
                name: '越女劍樓',
                way: 'rank go 204'
            }, {
                name: '格鬥城',
                way: 'rank go 195'
            }, {
                name: '鐵劍',
                way: 'jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;ne;n;ne;n'
            }, {
                name: '白猿',
                way: 'rank go 210;sw;s;s;s;s;s;s;s;s;s;s;s;w;w;n;n;n;n;nw;nw;nw;n;n;n'
            }, {
                name: '闖入冥莊',
                way: 'jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e;e;e;event_1_77775145'
            }, {
                name: '釣魚',
                way: 'rank go 233;s;s;s;s;s;s;sw;se;sw'
            },
            {
                name: '打西夏',
                type: 5,
                click: hitXiXia
            },
            {
                name: '打魔皇',
                type: 5,
                click: hitMoHuang
            },
            {
                name: '打三樓',
                type: 5,
                click: hitSanLou
            },
            {
                name: '打一個NPC',
                type: 5,
                click: killOneNpc
            },
            // {
            //     name: '同步潛龍',
            //     type: 5,
            //     click: getQianlongMsg
            // },
        ];

        addScreenBtn(wayArr);
    }
    window.hitXiXia = function () {
        clickButton('kill xixiaxunbao_tieyaozi 1');
    };
    window.hitMoHuang = function () {
        clickButton('kill jingcheng_tongtiantafenshen 1');
    };
    window.hitSanLou = function () {
        clickButton('kill tianlongsi_difenshen 1');
    };
    window.killOneNpc = function () {
        killOnePerson();
    };
    window.getQianlongMsg = function () {
        clickButton('tell ' + assistant + ' ASSIST/潛龍/get');
    };

    function killOnePerson() {
        var objs = g_obj_map.get("msg_room").elements.filter(function (item) {
            return item.key.indexOf("npc") == 0 && !isNaN(item.key.replace("npc", ""))
        });
        if (objs.length > 0) {
            clickButton("kill " + objs[0].value.split(",")[0] + ' 1');
        }
    }
    function reSaveQianLong(msg) {
        var txt = g_simul_efun.replaceControlCharBlank(
            msg.replace(/\u0003.*?\u0003/g, "")
        );
        var record = txt.split('record')[1];
        record = $.trim(record);
        var map = {};
        if (record != 'null' && record != '{}') {
            var recordArr = record.split('，');
            var hasDoneText = [];
            for (var i = 0; i < recordArr.length; i++) {
                var newArr = recordArr[i].split('-');
                map[newArr[0]] = newArr[1];
                hasDoneText.push(newArr[0] * 1 + 1);
            }
            console.log(map);
            setCookie(qianlongCookieName, JSON.stringify(map));
            log('已打過' + hasDoneText.join(','));
        }
        log('已同步記錄成功！')
    }
    // 去釣魚
    function startDiaoYu() {
        var msg_room = g_obj_map.get("msg_room");
        if (msg_room) {
            if (msg_room.get("short") != '桃溪') {
                go('rank go 233;s;s;s;s;s;s;sw;se;sw;diaoyu')
            } else {
                go('diaoyu')
            }
        } else {
            go('rank go 233;s;s;s;s;s;s;sw;se;sw;diaoyu')
        }
    }
    /**
     *
     *
     */
    var steps = 0;
    var isOnstep1 = false;

    window.qianlongNpcArray = ['任俠', '暗刺客', '金刀客', '追命', '無花', '傳鷹', '令東來', '西門吹雪', '石之軒', '朱大天王', '楚昭南', '阿青', '楚留香', '天山童姥', '乾羅', '令狐沖', '喬峰', '浪翻雲', '三少爺', '花無缺', '雲夢璃'];
    window.qianlongNpcArray2 = ['任俠', '暗刺', '金刀', '石幽明', '胡鐵花', '蒙赤行', '厲工', '葉孤城', '祝玉妍', '蕭秋水', '淩未風', '白猿', '石觀音', '李秋水', '方夜羽', '東方不敗', '慕容博', '龐斑', '燕十三', '小魚兒', '夜魔'];
    window.setCookie = function (c_name, value, exdays) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + 100);
        var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
        document.cookie = c_name + "=" + c_value;
    };
    window.getCookie = function (c_name) {
        var i, x, y, ARRcookies = document.cookie.split(";");
        for (i = 0; i < ARRcookies.length; i++) {
            x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
            y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
            x = x.replace(/^\s+|\s+$/g, "");
            if (x == c_name) {
                return unescape(y);
            }
        }
    };
    // 記錄潛龍標記
    window.saveQianlongCookies = function (name, index, obj) {
        if (index == null) index = getIndexFromArr(name, qianlongNpcArray);
        var thisCookies = getCookie(qianlongCookieName);
        var saveParams = null;
        if (index != null) {
            saveParams = thisCookies ? JSON.parse(thisCookies) : {};
            saveParams[index] = 1;
            console.log(saveParams);
            setCookie(qianlongCookieName, JSON.stringify(saveParams));
            var newIndex = index * 1 + 1;
            if (obj) {
                obj.innerText = "已記" + newIndex + qianlongNpcArray[index];
                obj.style = "background:#EDEDED;color:#000;margin:5px;";
                obj.setAttribute("onClick", 'delBiaoji(this, ' + index + ')');
            }
            // else {
            //     sendToQQ('寫標記' + qianlongNpcArray[index]);
            // }
            clickButton('tell ' + assistant + ' ASSIST/潛龍/add/' + qianlongNpcArray[index]);
            log(newIndex + '已記' + qianlongNpcArray[index])
        }
    };
    // 移除潛龍標記
    window.delBiaoji = function (obj, index) {
        if (!obj) {
            setCookie(qianlongCookieName, '{}');
            return false;
        }
        var cookies = getCookie(qianlongCookieName);
        if (!cookies) {
            cookies = '{}';
        }
        cookies = JSON.parse(cookies);
        if (cookies[index]) {
            delete cookies[index];
            setCookie(qianlongCookieName, JSON.stringify(cookies));
            console.log('清除標記' + index);
        }
        var newIndex = index * 1 + 1;
        obj.innerText = "標記" + newIndex + qianlongNpcArray[index];
        obj.style = "background:#FF6B00;color:#fff;margin:5px;";
        obj.setAttribute("onClick", 'saveQianlongCookies("",' + index + ',this)');
        clickButton('tell ' + assistant + ' ASSIST/潛龍/del/' + qianlongNpcArray[index]);
        warnning('已清除' + qianlongNpcArray[index] + '標記');
    };
    function getIndexFromArr(txt, arr) {
        for (var i = 0; i < arr.length; i++) {
            if (txt.indexOf(arr[i]) != '-1') {
                return i
            }
        };
        return null;
    }
    function killhideFunc() {
        if (g_obj_map.get("msg_vs_info")) {
            if (g_obj_map.get("msg_vs_info").get("vs2_pos1")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos1") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos1") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos1") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs2_pos2")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos2") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos2") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos2") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs2_pos3")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos3") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos3") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos3") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs2_pos4")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos4") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos4") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos4") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs2_pos5")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos5") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos5") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos5") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs2_pos6")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos6") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos6") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos6") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs2_pos7")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos7") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos7") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos7") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs2_pos8")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs2_pos8") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs2_pos8") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs2_pos8") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos1")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos1") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos1") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos1") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos2")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos2") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos2") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos2") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos3")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos3") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos3") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos3") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos4")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos4") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos4") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos4") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos5")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos5") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos5") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos5") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos6")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos6") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos6") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos6") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos7")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos7") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos7") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos7") + "')\">切磋</a>]", 2, 1)
            }
            if (g_obj_map.get("msg_vs_info").get("vs1_pos8")) {
                writeToScreen(g_obj_map.get("msg_vs_info").get("vs1_pos8") + " [<a href=\"javascript:clickButton('kill " + g_obj_map.get("msg_vs_info").get("vs1_pos8") + "')\">殺</a> , <a href=\"javascript:clickButton('fight " + g_obj_map.get("msg_vs_info").get("vs1_pos8") + "')\">切磋</a>]", 2, 1)
            }
        }
    }

    // 展示潛龍標記
    function showBiaoJi() {
        var cookies = getCookie(qianlongCookieName);
        if (!cookies) {
            cookies = '{}'
        }
        cookies = JSON.parse(cookies);
        var indexArr = [];
        var qianlongArr = [];
        var doneArr = [];
        for (var i in cookies) {
            indexArr.push(i);
        }
        for (var i = 0; i < qianlongNpcArray.length; i++) {
            var hasSame = false;
            for (var j = 0; j < indexArr.length; j++) {
                if (i == indexArr[j]) {
                    hasSame = true;
                }
            }
            var index = i + 1;
            if (!hasSame) {
                qianlongArr.push({ name: '標記' + index + qianlongNpcArray[i], type: 1, click: 'saveQianlongCookies("' + qianlongNpcArray[i] + '",' + i + ',this)' });
            } else {
                doneArr.push({ name: '已記' + index + qianlongNpcArray[i], type: 2, click: 'delBiaoji(this' + ',"' + i + '")' });
            }
        }
        var returnArr = [...doneArr, ...qianlongArr];
        isOnstep1 = false;
        addScreenBtn(returnArr);
    }
    function isDoneThisQianlong(name) {
        var cookies = getCookie(qianlongCookieName);
        if (!cookies) {
            cookies = '{}'
        }
        cookies = JSON.parse(cookies);
        var indexArr = [];
        var qianlongArr = [];
        var doneArr = [];
        for (var i in cookies) {
            indexArr.push(i);
        }
        for (var i = 0; i < qianlongNpcArray.length; i++) {
            var hasSame = false;
            for (var j = 0; j < indexArr.length; j++) {
                if (i == indexArr[j]) {
                    hasSame = true;
                }
            }
            if (!hasSame) {
                qianlongArr.push(qianlongNpcArray[i]);
            } else {
                doneArr.push(qianlongNpcArray[i]);
            }
        }
        if (doneArr.length == 0) {
            return null;
        }
        var index = getIndexFromArr(name, doneArr);
        var index1 = getIndexFromArr(name, qianlongNpcArray);
        if (index != null) {
            return index1;
        }
        return null;
    }
    function getDoneQianlongNumber() {
        var cookies = getCookie(qianlongCookieName);
        if (!cookies) {
            cookies = '{}'
        }
        cookies = JSON.parse(cookies);
        var indexArr = [];
        for (var i in cookies) {
            indexArr.push(i);
        }
        return indexArr.length;
    }
    // 將數組內容寫到屏幕中
    function addScreenBtn(arr) {
        if (!arr) {
            return;
        }
        if (arr.length == 0) {
            return;
        }
        var node = document.createElement("span");
        node.className = "out2";
        for (var i = 0; i < arr.length; i++) {
            var button = document.createElement("button");
            button.innerText = arr[i].name;
            button.style = "background:#FF6B00;color:#fff;margin:5px;";
            if (arr[i].type == 1) {
                button.setAttribute("onClick", arr[i].click);
            } else if (arr[i].type == 2) {
                button.style = "background:#EDEDED;color:#000;margin:5px;";
                button.setAttribute("onClick", arr[i].click);
            } else if (arr[i].type == 5) {
                button.addEventListener('click', arr[i].click)
            } else {
                button.setAttribute("onClick", "go(\'" + arr[i].way + "\')");
            }
            node.appendChild(button);
        }
        document.getElementById("out2").appendChild(node);
        log('輸出成功');
    }
    window.stopOnTime = false;
    window.goFindNpcInPlace = function (w, name, type) {
        if ($('#skill_1').length > 0) {
            return;
        }
        if (type == '3') {
            isOnstep1 = false;
        }
        var qlcookies = getCookie(qianlongCookieName);
        if (!qlcookies) {
            qlcookies = '{}';
        }
        qlcookies = JSON.parse(qlcookies);

        var saveArr = [];
        var saveArr2 = [];
        for (var i in qlcookies) {
            saveArr.push(qianlongNpcArray[i]);
            saveArr2.push(qianlongNpcArray2[i])
        }
        if (getIndexFromArr(name, saveArr) != null) {
            // console.log('已打過');
            return false;
        }
        if (getIndexFromArr(name, saveArr2) != null) {
            // console.log('已打過');
            return false;
        }

        clickButton('home');

        var go_path = '';
        if (w.startsWith("雪亭鎮")) {
            go_path = "jh 1;inn_op1;w;e;n;s;e;w;s;e;s;w;s;n;w;e;e;e;ne;ne;sw;sw;n;w;n;w;e;e;e;n;s;e;e;n;s;s;n;e;w;w;w;w;w;n;w;e;n;w;e;e;e;w;w;n;e;w;w;e;n";
        } else if (w.startsWith("洛陽")) {
            go_path = "jh 2;n;n;e;s;luoyang317_op1;n;n;w;n;w;putuan;n;e;e;s;n;w;n;e;s;n;w;w;event_1_98995501;n;w;e;n;e;w;s;s;s;s;w;e;n;e;n;w;s;luoyang111_op1;e;n;w;n;w;get_silver;s;e;n;n;e;get_silver;n;w;s;s;s;e;n;n;w;e;s;s;e;e;n;op1;s;s;e;n;n;w;e;e;n;s;w;n;w;e;n;e;w;n;w;e;s;s;s;s;s;w;w;n;w;e;e;n;s;w;n;e;w;n;w;luoyang14_op1;n;e;e;w;n;e;n;n;n;s;s;s;w;n;w;w;w;w;e;e;e;e;n;n;n;n";
        } else if (w.startsWith("華山村")) {
            go_path = "jh 3;n;e;w;s;w;n;s;event_1_59520311;n;n;w;get_silver;s;e;n;n;e;get_silver;n;w;n;e;w;s;s;s;s;s;e;e;s;e;n;s;w;s;e;s;huashancun24_op2;w;n;w;w;n;s;e;s;s;w;get_silver;n;n;s;e;huashancun15_op1;event_1_46902878;kill-藏劍樓殺手;@藏劍樓殺手的屍體;w;w;s;e;w;nw;n;n;e;get_silver;s;w;n;w;give huashancun_huashancun_fb9;e;e;n;n;w;e;n;s;e";
        } else if (w.startsWith("華山")) {
            go_path = "jh 4;n;n;w;e;n;e;w;n;n;n;n;event_1_91604710;s;s;s;w;get_silver;s;e;s;e;w;n;n;n;n;nw;s;s;w;n;n;w;s;n;w;n;get_xiangnang2;w;s;e;e;n;e;n;n;w;w;event_1_26473707;e;e;e;n;e;s;event_1_11292200;n;n;w;n;e;w;n;s;s;s;s;s;w;n;n;n;w;e;n;get_silver;s;s;e;n;n;s;s;s;s;n;n;w;s;s;w;event_1_30014247;s;w;e;s;e;w;s;s;s;e";
        } else if (w.startsWith("揚州")) {
            go_path = "jh 5;n;w;w;n;s;e;e;e;w;n;w;e;e;w;n;w;e;e;n;w;e;n;w;n;get_silver;s;s;e;e;get_silver;n;w;n;n;s;e;w;s;s;s;w;n;w;yangzhou16_op1;e;e;n;e;n;n;n;s;s;w;n;e;n;n;s;s;w;n;n;e;n;n;event_1_89774889;s;s;s;e;s;s;s;w;s;w;w;w;n;n;w;n;n;n;s;s;s;e;n;get_silver;s;s;e;e;w;w;s;s;s;s;n;n;e;e;n;w;e;e;n;n;n;n;s;s;e;w;w;e;s;s;w;n;w;e;e;get_silver;s;w;n;w;w;n;get_silver;s;s;w;s;w;e;e;e;s;s;e;e;s;s;s;n;n;n;w;w;n;n;w;w;n;e;e;e;n;e;s;e;s;s;s;n;n;n;w;n;w;n;ne;sw;s;w;s;n;w;n;w;e;e;w;n;n;w;n;s;e;e;s;n;w;n;s;s;s;s;e;e;s;s;s;w;event_1_69751810";
        } else if (w.startsWith("丐幫")) {
            go_path = "jh 6;event_1_98623439;s;w;e;n;ne;n;ne;ne;ne;event_1_97428251;n;sw;sw;sw;s;ne;ne;event_1_16841370";
        } else if (w.startsWith("喬陰縣")) {
            go_path = "jh 7;s;s;s;w;s;w;w;w;e;e;e;e;event_1_65599392;n;s;w;e;ne;s;s;e;n;n;e;w;s;s;w;s;w;w;w;n;s;s;e;n;s;e;ne;s;e;n;e;s;e";
        } else if (w.startsWith("峨眉山")) {
            go_path = "jh 8;w;nw;n;n;n;n;w;e;se;nw;e;n;s;e;n;n;e;n;n;n;n;e;e;w;w;w;n;n;n;w;w;s;e;w;w;e;s;e;w;w;e;n;n;w;w;n;s;sw;ne;e;e;n;e;w;w;e;n;e;w;w;e;n;w;w;w;n;n;n;s;s;s;e;e;e;e;e;s;s;s;e;e;s;w;e;e;w;s;w;e;e;w;n;n;e;e;w;w;n;w;e;e;w;n;w;e;e;w;n;e;e;w;w;w;w;n;w;w;e;n;s;s;n;e;n;n;n;n;s;s;nw;nw;n;n;s;s;se;sw;w;nw;w;e;se;e;ne;se;ne;se;s;se;nw;n;nw;ne;n;s;se;e";
        } else if (w.startsWith("恒山")) {
            go_path = "jh 9;n;w;e;n;e;get_silver;w;w;n;w;e;n;henshan15_op1;e;e;w;n;event_1_85624865;n;w;event_1_27135529;e;e;e;w;n;n;n;s;henshan_zizhiyu11_op1;e;s;s;s;w;n;n;w;n;s;s;n;e;e;e;w;n;s;w;n;n;w;n;e;n;s;w;n;n;w;get_silver;s;e;n";
        } else if (w.startsWith("武當山")) {
            go_path = "jh 10;w;n;n;w;w;w;n;n;n;n;e;e;e;e;s;e;s;e;n;s;s;n;e;e;n;s;e;w;s;s;s;n;n;n;w;w;w;n;w;n;w;w;w;w;n;w;n;s;e;e;e;s;n;e;e;w;w;w;w;n;n;n;n;jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;w;nw;sw;ne;n;nw;event_1_5824311";
        } else if (w.startsWith("晚月莊")) {
            go_path = "jh 11;e;e;s;sw;se;w;n;s;w;w;s;n;w;e;e;s;w;e;s;e;e;e;w;w;w;w;s;n;w;n;s;s;n;e;e;s;w;w;e;e;e;e;w;w;s;e;e;w;w;n;e;n;n;w;n;n;n;e;e;s;s;s;w;s;s;w;e;se;e;se;ne;n;nw;w;s;s;s;se;s";
        } else if (w.startsWith("水煙閣")) {
            go_path = "jh 12;n;e;w;n;n;n;s;w;n;n;e;w;s;nw;e;e;sw;n;s;s;e;w;n;ne;w;n";
        } else if (w.startsWith("少林寺")) {
            go_path = "jh 13;e;s;s;w;w;w;event_1_38874360;jh 13;n;w;w;n;shaolin012_op1;s;s;e;e;n;w;e;e;w;n;n;w;e;e;w;n;n;w;e;e;w;n;shaolin27_op1;event_1_34680156;s;w;n;w;e;e;w;n;shaolin25_op1;w;n;w;s;s;s;get_silver;w;s;s;s;s;s;n;n;n;n;n;n;n;n;e;e;s;s;s;s;get_silver;w;s;s;s;get_silver;w;s;n;n;n;n;n;n;n;n;w;n;w;e;e;w;n;e;w;w;n;get_silver";
        } else if (w.startsWith("唐門")) {
            go_path = "jh 14;e;w;w;n;n;n;n;s;w;n;s;s;n;w;n;s;s;n;w;n;s;s;n;w;e;e;e;e;e;s;n;e;n;e;w;n;n;s;ask tangmen_tangmei;ask tangmen_tangmei;e;event_1_8413183;event_1_39383240;e;s;e;n;w;n;n;s;s;e";
        } else if (w.startsWith("青城山")) {
            go_path = "jh 15;s;s;e;w;w;n;s;e;s;e;w;w;w;n;s;s;s;n;n;w;w;w;n;s;w;e;e;e;e;e;e;s;e;w;w;e;s;e;w;s;w;s;ne;s;s;s;e;s;n;w;n;n;n;n;n;n;n;n;n;n;nw;w;nw;n;s;w;s;s;s";
        } else if (w.startsWith("逍遙林")) {
            go_path = "jh 16;s;s;s;s;e;e;s;w;n;s;s;s;n;n;w;n;n;s;s;s;s;n;n;w;w;n;s;s;n;w;e;e;e;e;e;e;n;n;e;event_1_5221690;s;w;event_1_57688376;n;n;w;w;e;n;s;e;e;n;event_1_88625473;event_1_82116250;event_1_90680562;event_1_38586637;s;s;e;n;n;w;n;e;jh 16;s;s;s;s;e;n;e;event_1_56806815;jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w;event_1_57688376;n;n;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366";
        } else if (w.startsWith("開封")) {
            go_path = "jh 17;n;w;e;e;s;n;w;n;w;s;n;n;n;s;s;e;e;e;s;n;n;n;s;s;w;s;s;s;w;e;s;w;e;n;e;n;s;s;n;e;e;jh 17;n;n;n;e;w;n;e;w;n;e;se;s;n;nw;n;n;n;event_1_27702191;jh 17;n;n;n;n;w;w;n;s;s;n;w;w;e;n;n;w;e;s;s;s;s;w;jh 17;sw;nw;se;s;sw;nw;ne;event_1_38940168;jh 17;e;s;s;s;e;kaifeng_yuwangtai23_op1;s;w;s;s;w;jh 17;n;n;e;e;n;get_silver";
        } else if (w.startsWith("明教") || w.startsWith("光明頂")) {
            go_path = "jh 18;w;n;s;e;e;w;n;nw;sw;ne;n;n;w;e;n;n;n;ne;n;n;e;w;w;e;n;e;w;w;e;n;n;e;e;se;se;e;w;nw;nw;n;w;w;w;w;s;s;n;e;w;n;n;n;e;nw;nw;se;se;e;s;w;e;e;w;n;e;e;se;e;w;sw;s;w;w;n;e;w;n;n;n;n;n;w;e;n;event_1_90080676;event_1_56007071;ne;n;nw;se;s;s;e;n;w;nw;sw;se;e;se;nw;s;s;s;s;w;nw;nw";
        } else if (w.startsWith("全真教")) {
            go_path = "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;w;e;e;w;n;w;w;w;s;n;w;s;n;e;e;e;e;e;n;s;e;n;n;s;s;e;w;w;w;n;n;n;w;e;e;s;n;e;n;n;n;n;s;e;s;n;n;n;w;n;w;w;w;s;s;s;s;s;e;n;n;n;s;w;s;n;w;n;s;s;s;w;n;n;n;s;w;s;s;s;s;e;s;s;n;n;e;s;s;n;n;e;e;n;n;n;n;w;w;w;n;n;e;n;e;e;n;n";
        } else if (w.startsWith("古墓")) {
            go_path = "jh 20;s;s;n;n;w;w;s;e;s;s;s;s;s;sw;sw;s;e;se;nw;w;s;w;e;e;w;s;s;w;w;e;s;sw;ne;e;s;s;w;w;e;e;s;n;e;e;e;e;s;e;w;n;w;n;n;s;e;w;w;s;n;n;n;n;s;e;w;w";
        } else if (w.startsWith("白駝山")) {
            go_path = "jh 21;nw;s;n;ne;ne;sw;n;n;ne;w;e;n;n;n;s;w;w;jh 21;nw;w;n;s;w;nw;e;w;nw;nw;n;w;sw;ne;s;event_1_47975698;s;sw;s;ne;e;s;s;jh 21;nw;w;w;nw;n;e;w;n;n;w;e;n;n;e;e;w;nw;se;e;ne;sw;e;se;nw;w;n;s;s;n;w;w;n;n;n;n;s;s;s;s;e;e;e;n;n;w;e;e;e;w;w;n;nw;se;ne;w;e;e;w;n";
        } else if (w.startsWith("嵩山")) {
            go_path = "jh 22;n;n;w;w;s;s;e;w;s;s;w;e;s;n;n;n;n;n;e;n;n;n;n;n;e;n;e;e;w;w;n;w;n;s;e;n;n;n;e;songshan33_op1;n;w;w;w;e;n;w;e;n;s;s;e;n;e;w;n;e;w;n;get_silver;jh 22;n;n;n;n;e;n;event_1_1412213;s;event_1_29122616;jh 22;n;n;n;n;n;n;n";
        } else if (w.startsWith("寒梅莊") || w.startsWith("梅莊")) {
            go_path = "jh 23;n;n;e;w;n;n;n;n;n;w;w;e;e;e;s;n;w;n;w;n;s;w;e;e;e;n;s;w;n;n;e;w;event_1_8188693;n;n;w;e;n;e;n;s;w;n;s;s;s;s;s;w;n";
        } else if (w.startsWith("泰山")) {
            go_path = "jh 24;se;nw;n;n;n;n;w;e;e;e;w;s;n;w;n;n;w;e;e;w;n;e;w;n;w;n;n;n;n;n;s;s;w;n;s;e;s;s;s;e;n;e;w;n;w;e;n;n;e;s;n;e;n;e;w;n;w;e;e;w;n;n;s;s;s;s;s;w;w;n;n;w;e;e;w;n;n;w;e;e;w;n;s;s;s;s;s;w;n;e;w;n;w;e;n;n;e";
        } else if (w.startsWith("鐵血大旗門")) {
            go_path = "jh 11;e;e;s;n;nw;w;nw;e;e;e;n;w;e;s;se;jh 25;e;e;e;e;s";
        } else if (w.startsWith("大昭寺")) {
            go_path = "jh 26;w;w;w;w;w;n;s;w;s;w;e;e;e;w;w;s;w;w;w;s;n;w;n;n;n;n;n;e;e;e;e;e;w;s;s;w;w;n;w;e;e;w;s;w;n;s;s;n;w;ask lama_master;ask lama_master;ask lama_master;event_1_91837538";
        } else if (w.startsWith("黑木崖")) {
            go_path = "jh 27;ne;nw;w;nw;w;w;yell";
        }
        if (go_path && !isOnstep1) {
            GetNPCPath(go_path, name);
            isOnstep1 = true;
            stopOnTime = true;
        }
        if (killGoodSetInterval) {
            clearInterval(killGoodSetInterval);
        }
    };

    window.goFindNpcInPlace1 = function (w, name, type) {

        if ($('#skill_1').length > 0) {
            return;
        }
        var go_path = '';
        if (w.startsWith("雪亭鎮")) {
            go_path = "jh 1;inn_op1;w;e;n;s;e;w;s;e;s;w;s;n;w;e;e;e;ne;ne;sw;sw;n;w;n;w;e;e;e;n;s;e;e;n;s;s;n;e;w;w;w;w;w;n;w;e;n;w;e;e;e;w;w;n;e;w;w;e;n";
        } else if (w.startsWith("洛陽")) {
            go_path = "jh 2;n;n;e;s;luoyang317_op1;n;n;w;n;w;putuan;n;e;e;s;n;w;n;e;s;n;w;w;event_1_98995501;n;w;e;n;e;w;s;s;s;s;w;e;n;e;n;w;s;luoyang111_op1;e;n;w;n;w;get_silver;s;e;n;n;e;get_silver;n;w;s;s;s;e;n;n;w;e;s;s;e;e;n;op1;s;s;e;n;n;w;e;e;n;s;w;n;w;e;n;e;w;n;w;e;s;s;s;s;s;w;w;n;w;e;e;n;s;w;n;e;w;n;w;luoyang14_op1;n;e;e;w;n;e;n;n;n;s;s;s;w;n;w;w;w;w;e;e;e;e;n;n;n;n";
        } else if (w.startsWith("華山村")) {
            go_path = "jh 3;n;e;w;s;w;n;s;event_1_59520311;n;n;w;get_silver;s;e;n;n;e;get_silver;n;w;n;e;w;s;s;s;s;s;e;e;s;e;n;s;w;s;e;s;huashancun24_op2;w;n;w;w;n;s;e;s;s;w;get_silver;n;n;s;e;huashancun15_op1;event_1_46902878;kill-藏劍樓殺手;@藏劍樓殺手的屍體;w;w;s;e;w;nw;n;n;e;get_silver;s;w;n;w;give huashancun_huashancun_fb9;e;e;n;n;w;e;n;s;e";
        } else if (w.startsWith("華山")) {
            go_path = "jh 4;n;n;w;e;n;e;w;n;n;n;n;event_1_91604710;s;s;s;w;get_silver;s;e;s;e;w;n;n;n;n;nw;s;s;w;n;n;w;s;n;w;n;get_xiangnang2;w;s;e;e;n;e;n;n;w;w;event_1_26473707;e;e;e;n;e;s;event_1_11292200;n;n;w;n;e;w;n;s;s;s;s;s;w;n;n;n;w;e;n;get_silver;s;s;e;n;n;s;s;s;s;n;n;w;s;s;w;event_1_30014247;s;w;e;s;e;w;s;s;s;e";
        } else if (w.startsWith("揚州")) {
            go_path = "jh 5;n;w;w;n;s;e;e;e;w;n;w;e;e;w;n;w;e;e;n;w;e;n;w;n;get_silver;s;s;e;e;get_silver;n;w;n;n;s;e;w;s;s;s;w;n;w;yangzhou16_op1;e;e;n;e;n;n;n;s;s;w;n;e;n;n;s;s;w;n;n;e;n;n;event_1_89774889;s;s;s;e;s;s;s;w;s;w;w;w;n;n;w;n;n;n;s;s;s;e;n;get_silver;s;s;e;e;w;w;s;s;s;s;n;n;e;e;n;w;e;e;n;n;n;n;s;s;e;w;w;e;s;s;w;n;w;e;e;get_silver;s;w;n;w;w;n;get_silver;s;s;w;s;w;e;e;e;s;s;e;e;s;s;s;n;n;n;w;w;n;n;w;w;n;e;e;e;n;e;s;e;s;s;s;n;n;n;w;n;w;n;ne;sw;s;w;s;n;w;n;w;e;e;w;n;n;w;n;s;e;e;s;n;w;n;s;s;s;s;e;e;s;s;s;w;event_1_69751810";
        } else if (w.startsWith("丐幫")) {
            go_path = "jh 6;event_1_98623439;s;w;e;n;ne;n;ne;ne;ne;event_1_97428251;n;sw;sw;sw;s;ne;ne;event_1_16841370";
        } else if (w.startsWith("喬陰縣")) {
            go_path = "jh 7;s;s;s;w;s;w;w;w;e;e;e;e;event_1_65599392;n;s;w;e;ne;s;s;e;n;n;e;w;s;s;w;s;w;w;w;n;s;s;e;n;s;e;ne;s;e;n;e;s;e";
        } else if (w.startsWith("峨眉山")) {
            go_path = "jh 8;w;nw;n;n;n;n;w;e;se;nw;e;n;s;e;n;n;e;n;n;n;n;e;e;w;w;w;n;n;n;w;w;s;e;w;w;e;s;e;w;w;e;n;n;w;w;n;s;sw;ne;e;e;n;e;w;w;e;n;e;w;w;e;n;w;w;w;n;n;n;s;s;s;e;e;e;e;e;s;s;s;e;e;s;w;e;e;w;s;w;e;e;w;n;n;e;e;w;w;n;w;e;e;w;n;w;e;e;w;n;e;e;w;w;w;w;n;w;w;e;n;s;s;n;e;n;n;n;n;s;s;nw;nw;n;n;s;s;se;sw;w;nw;w;e;se;e;ne;se;ne;se;s;se;nw;n;nw;ne;n;s;se;e";
        } else if (w.startsWith("恒山")) {
            go_path = "jh 9;n;w;e;n;e;get_silver;w;w;n;w;e;n;henshan15_op1;e;e;w;n;event_1_85624865;n;w;event_1_27135529;e;e;e;w;n;n;n;s;henshan_zizhiyu11_op1;e;s;s;s;w;n;n;w;n;s;s;n;e;e;e;w;n;s;w;n;n;w;n;e;n;s;w;n;n;w;get_silver;s;e;n";
        } else if (w.startsWith("武當山")) {
            go_path = "jh 10;w;n;n;w;w;w;n;n;n;n;e;e;e;e;s;e;s;e;n;s;s;n;e;e;n;s;e;w;s;s;s;n;n;n;w;w;w;n;w;n;w;w;w;w;n;w;n;s;e;e;e;s;n;e;e;w;w;w;w;n;n;n;n;jh 10;w;n;event_1_74091319;ne;n;sw;nw;w;ne;n;w;nw;sw;ne;n;nw;event_1_5824311";
        } else if (w.startsWith("晚月莊")) {
            go_path = "jh 11;e;e;s;sw;se;w;n;s;w;w;s;n;w;e;e;s;w;e;s;e;e;e;w;w;w;w;s;n;w;n;s;s;n;e;e;s;w;w;e;e;e;e;w;w;s;e;e;w;w;n;e;n;n;w;n;n;n;e;e;s;s;s;w;s;s;w;e;se;e;se;ne;n;nw;w;s;s;s;se;s";
        } else if (w.startsWith("水煙閣")) {
            go_path = "jh 12;n;e;w;n;n;n;s;w;n;n;e;w;s;nw;e;e;sw;n;s;s;e;w;n;ne;w;n";
        } else if (w.startsWith("少林寺")) {
            go_path = "jh 13;e;s;s;w;w;w;event_1_38874360;jh 13;n;w;w;n;shaolin012_op1;s;s;e;e;n;w;e;e;w;n;n;w;e;e;w;n;n;w;e;e;w;n;shaolin27_op1;event_1_34680156;s;w;n;w;e;e;w;n;shaolin25_op1;w;n;w;s;s;s;get_silver;w;s;s;s;s;s;n;n;n;n;n;n;n;n;e;e;s;s;s;s;get_silver;w;s;s;s;get_silver;w;s;n;n;n;n;n;n;n;n;w;n;w;e;e;w;n;e;w;w;n;get_silver";
        } else if (w.startsWith("唐門")) {
            go_path = "jh 14;e;w;w;n;n;n;n;s;w;n;s;s;n;w;n;s;s;n;w;n;s;s;n;w;e;e;e;e;e;s;n;e;n;e;w;n;n;s;ask tangmen_tangmei;ask tangmen_tangmei;e;event_1_8413183;event_1_39383240;e;s;e;n;w;n;n;s;s;e";
        } else if (w.startsWith("青城山")) {
            go_path = "jh 15;s;s;e;w;w;n;s;e;s;e;w;w;w;n;s;s;s;n;n;w;w;w;n;s;w;e;e;e;e;e;e;s;e;w;w;e;s;e;w;s;w;s;ne;s;s;s;e;s;n;w;n;n;n;n;n;n;n;n;n;n;nw;w;nw;n;s;w;s;s;s";
        } else if (w.startsWith("逍遙林")) {
            go_path = "jh 16;s;s;s;s;e;e;s;w;n;s;s;s;n;n;w;n;n;s;s;s;s;n;n;w;w;n;s;s;n;w;e;e;e;e;e;e;n;n;e;event_1_5221690;s;w;event_1_57688376;n;n;w;w;e;n;s;e;e;n;event_1_88625473;event_1_82116250;event_1_90680562;event_1_38586637;s;s;e;n;n;w;n;e;jh 16;s;s;s;s;e;n;e;event_1_56806815;jh 16;s;s;s;s;e;n;e;event_1_5221690;s;w;event_1_57688376;n;n;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366;event_1_38333366";
        } else if (w.startsWith("開封")) {
            go_path = "jh 17;n;w;e;e;s;n;w;n;w;s;n;n;n;s;s;e;e;e;s;n;n;n;s;s;w;s;s;s;w;e;s;w;e;n;e;n;s;s;n;e;e;jh 17;n;n;n;e;w;n;e;w;n;e;se;s;n;nw;n;n;n;event_1_27702191;jh 17;n;n;n;n;w;w;n;s;s;n;w;w;e;n;n;w;e;s;s;s;s;w;jh 17;sw;nw;se;s;sw;nw;ne;event_1_38940168;jh 17;e;s;s;s;e;kaifeng_yuwangtai23_op1;s;w;s;s;w;jh 17;n;n;e;e;n;get_silver";
        } else if (w.startsWith("明教") || w.startsWith("光明頂")) {
            go_path = "jh 18;w;n;s;e;e;w;n;nw;sw;ne;n;n;w;e;n;n;n;ne;n;n;e;w;w;e;n;e;w;w;e;n;n;e;e;se;se;e;w;nw;nw;n;w;w;w;w;s;s;n;e;w;n;n;n;e;nw;nw;se;se;e;s;w;e;e;w;n;e;e;se;e;w;sw;s;w;w;n;e;w;n;n;n;n;n;w;e;n;event_1_90080676;event_1_56007071;ne;n;nw;se;s;s;e;n;w;nw;sw;se;e;se;nw;s;s;s;s;w;nw;nw";
        } else if (w.startsWith("全真教")) {
            go_path = "jh 19;s;s;s;sw;s;e;n;nw;n;n;n;n;w;e;e;w;n;w;w;w;s;n;w;s;n;e;e;e;e;e;n;s;e;n;n;s;s;e;w;w;w;n;n;n;w;e;e;s;n;e;n;n;n;n;s;e;s;n;n;n;w;n;w;w;w;s;s;s;s;s;e;n;n;n;s;w;s;n;w;n;s;s;s;w;n;n;n;s;w;s;s;s;s;e;s;s;n;n;e;s;s;n;n;e;e;n;n;n;n;w;w;w;n;n;e;n;e;e;n;n";
        } else if (w.startsWith("古墓")) {
            go_path = "jh 20;s;s;w;w;s;e;s;s;s;s;s;sw;sw;s;e;se;s;w;e;s;s;s;s;s;s;s;e;e;e;e;s;e;e;e;event_1_3723773;se;n;e;s;e;s;e";
        } else if (w.startsWith("白駝山")) {
            go_path = "jh 21;nw;s;n;ne;ne;sw;n;n;ne;w;e;n;n;n;s;w;w;jh 21;nw;w;n;s;w;nw;e;w;nw;nw;n;w;sw;ne;s;event_1_47975698;s;sw;s;ne;e;s;s;jh 21;nw;w;w;nw;n;e;w;n;n;w;e;n;n;e;e;w;nw;se;e;ne;sw;e;se;nw;w;n;s;s;n;w;w;n;n;n;n;s;s;s;s;e;e;e;n;n;w;e;e;e;w;w;n;nw;se;ne;w;e;e;w;n";
        } else if (w.startsWith("嵩山")) {
            go_path = "jh 22;n;n;w;w;s;s;e;w;s;s;w;e;s;n;n;n;n;n;e;n;n;n;n;n;e;n;e;e;w;w;n;w;n;s;e;n;n;n;e;songshan33_op1;n;w;w;w;e;n;w;e;n;s;s;e;n;e;w;n;e;w;n;get_silver;jh 22;n;n;n;n;e;n;event_1_1412213;s;event_1_29122616;jh 22;n;n;n;n;n;n;n";
        } else if (w.startsWith("寒梅莊") || w.startsWith("梅莊")) {
            go_path = "jh 23;n;n;e;w;n;n;n;n;n;w;w;e;e;e;s;n;w;n;w;n;s;w;e;e;e;n;s;w;n;n;e;w;event_1_8188693;n;n;w;e;n;e;n;s;w;n;s;s;s;s;s;w;n";
        } else if (w.startsWith("泰山")) {
            go_path = "jh 24;se;nw;n;n;n;n;w;e;e;e;w;s;n;w;n;n;w;e;e;w;n;e;w;n;w;n;n;n;n;n;s;s;w;n;s;e;s;s;s;e;n;e;w;n;w;e;n;n;e;s;n;e;n;e;w;n;w;e;e;w;n;n;s;s;s;s;s;w;w;n;n;w;e;e;w;n;n;w;e;e;w;n;s;s;s;s;s;w;n;e;w;n;w;e;n;n;e";
        } else if (w.startsWith("鐵血大旗門")) {
            go_path = "jh 11;e;e;s;n;nw;w;nw;e;e;e;n;w;e;s;se;jh 25;e;e;e;e;s";
        } else if (w.startsWith("大昭寺")) {
            go_path = "jh 26;w;w;w;w;w;n;s;w;s;w;e;e;e;w;w;s;w;w;w;s;n;w;n;n;n;n;n;e;e;e;e;e;w;s;s;w;w;n;w;e;e;w;s;w;n;s;s;n;w;ask lama_master;ask lama_master;ask lama_master;event_1_91837538";
        } else if (w.startsWith("黑木崖")) {
            go_path = "jh 27;ne;nw;w;nw;w;w;yell";
        } else if (w.startsWith("星宿海")) {
            go_path = "jh 28;sw;nw;sw;se;ne;nw;nw;w;e;e;n;w;w;w;w;n;w;se;n;n;se;n;n;n;n;nw;w;ne;se;n;n;n;n;se";
        } else if (w.startsWith("茅山")) {
            go_path = "jh 29;n;n;n;n;event_1_60035830;event_1_65661209;n;n;n;n;n;e;n;n;n;event_1_98579273;w;nw;e;n;e;e";
        } else if (w.startsWith("桃花島")) {
            go_path = "jh 30;n;n;ne;n;n;n;w;e;n;n;w;w;e;n;s;n;n;n;w;w;s;s;e;n;s;e;n;e;n;s;nw;w;n;n;n;e;e;n;se;s";
        } else if (w.startsWith("鐵雪山莊")) {
            go_path = "jh 31;n;n;n;w;w;w;w;n;n;n;n;w;e";
        } else if (w.startsWith("慕容山莊")) {
            go_path = "jh 32;n;n;se;e;s;s;n;w;ne;n;n;n;e;n;w;s;w;w;n;event_1_72278818;event_1_35141481;event_1_35141481;event_1_35141481;event_1_35141481;w;w;n;e;n;e;n;w;e;n;event_1_55226665;n;event_1_99232080;e;e;s;e;s;e;e;e;n;s";
        } else if (w.startsWith("大理")) {
            go_path = "jh 33;sw;sw;s;s;s;nw;n;nw;n;n;n;n;n;e;n;s;e;sw;w;w;s;s;e;s;w;se;e;s;s;s;w;w;se;e;s;ne;e;se;n;n;n;n;n;w;ne;se;s;w;w;n;se;w;w;s;nw;n;e;se;n;n;w;se;e;se;e;se;e;e;n;s;e;e;se;e;e;se;n;n;n;n;n;n;e;n;n;n;e;e;se;e;s;ne;e;se;e;e;s;ne;e;n;sw;s;s;e;n;e;n;e;s;e;s;e;e;e;s;w;n;n;s;s;s;w;n;n;n;n;w;e;n;e;n;se;w;n;w;e;n;e;e;s;n;n;w;e;n;ne;n;e;e;n;s;e;ne;se;se;n;n;n;e;s;w;w;e;n;e;s;s;e;n;s;w;n;se;n;ne;s;w;e;n;s;s;e;s;w;se;s;s;s;e;n;sw;sw;w;s;n;n;s;e;n;n;n;s;e;se;s;sw;n;w;s";
        } else if (w.startsWith("斷劍山莊")) {
            go_path = "jh 34;ne;e;e;e;e;e;n;n;n;w;w;w;n;n;n;n;w;n;e;e;n;n";
        } else if (w.startsWith("冰火島")) {
            go_path = "jh 35;nw;nw;nw;n;ne;nw;w;nw;e;e;e;e;e;se;s;se;w;nw;s;s;s;s;s;s;w;w;n;e;n;w;w;s;s";
        } else if (w.startsWith("俠客島")) {
            go_path = "";
        } else if (w.startsWith("絕情谷")) {
            go_path = "jh 37;n;e;e;nw;nw;w;n;nw;n;n;ne;n;nw;se;s;sw;s;s;se;e;n;e;e;e;ne;ne;ne;se;s;s;s;w;e;n;n;n;nw;sw;sw;nw;w;n;nw;n;ne;e;ne;se;nw;sw;w;sw;nw;w;n;nw;n;s;se;s;e;n;nw;n;nw;se;s;se;s;ne;n;ne;sw;s;sw;n;ne;e;ne;e;n";
        } else if (w.startsWith("碧海山莊")) {
            go_path = "jh 38;n;n;n;n;w;w;e;e;n;n;n;w;w;nw;w;w;n;n;s;s;e;e;se;e;e;n;n;e;se;s;e;w;n;nw;w;n;n;e;e;se;se;e;n;n;n;s;s;s;w;nw;nw;w;w;n;n;n;n";
        } else if (w.startsWith("天山")) {
            go_path = "jh 39;ne;e;n;nw;nw;w;s;s;sw;n;nw;e;sw;w;s;w;n;w;";
        } else if (w.startsWith("苗疆")) {
            go_path = "jh 40;s;s;s;s;e;s;se;sw;s;s;s;e;e;sw;se;sw;se";
        } else if (w.startsWith("白帝城")) {
            go_path = "jh 41;se;e;e;se;se;se;se;se;se;event_1_57976870;e;e;w;w;n;n;n;s;s;s;w;w;w";
        } else if (w.startsWith("墨家機關城")) {
            go_path = "jh 42;nw;ne;n;e;nw;e;nw;w;ne;se;n;nw;e;n;w;n;n;n;n;w;w;n;n;n;e;w;s;s;s;e;e;e;e;n;n;n;w";
        } else if (w.startsWith("掩月城")) {
            go_path = "jh 43;n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e;se;se;se;sw;sw;s;e;s;s;s";
        } else if (w.startsWith("海雲閣")) {
            go_path = "jh 44;n;n;n;n;w;w;nw;n;n;ne;n;n;e;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;n;n;n;n;e;e;ne;ne;e;se;se;se;ne;ne;n;n;n;n;nw";
        } else if (w.startsWith("幽冥山莊")) {
            go_path = "jh 45;ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e;e;e";
        } else if (w.startsWith("花街")) {
            go_path = "jh 46;e;e;e;e;e;e;e;e;e;e;e;e;e;e;e;w;w;w;w;w;w;w;n;n;n;e;e;e;w;w;e;s;n;n";
        } else if (w.startsWith("西涼城")) {
            go_path = "jh 47;ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;e;e;n;n;n;n;n;n;ne;n";
        } else if (w.startsWith("高昌迷宮")) {
            go_path = "jh 48;e;se;se;e;ne;se;e;e;e;ne;se;se;s;s;s;sw;sw;s;sw;se";
        } else if (w.startsWith("越王劍宮")) {
            go_path = "jh 50;ne;ne;n;n;n;ne;ne;ne;n;n;n;s;s;s;se;se;se;s;s;s;s;sw;sw;sw;ne;ne;ne;se;se;e;n;n;n;e;w;n;n;n;n;n;w;e;n;n;n";
        } else if (w.startsWith("江陵")) {
            go_path = "jh 51;n;n;w;e;e;w;n;n;w;w;n;n;s;s;e;e;e;e;e;e;s;s;n;n;e;e;e;e;se;e;e;w;w;nw;w;w;s;s;s;se;se;e;e;w;w;nw;nw;n;n;n;w;w;n;n;e;w;w;w;e;e;n;n;nw;n;n;n;e;e";
        }
        if (go_path) {
            clickButton('home');
            GetNPCPath(go_path, name);
        }
        if (killGoodSetInterval) {
            clearInterval(killGoodSetInterval);
        }
    };
    // 五鼠尋找
    function wushuSearch(txt) {
        // txt = '翻江鼠_丙需要你幫忙找到：繡花鞋x 0 / 1 、大青樹葉x 0 / 1 、輕羅綢衫x 0 / 1 、斷水劍x 0 / 1 、彼岸花x 0 / 1 、金錠x 118018 / 100 、天龍降魔禪杖x 0 / 1 、火 雲 戰 甲x 0 / 1 、金飯碗x 0 / 1 、金算盤x 0 / 1 、白金項鏈x 0 / 1 、青色道袍x 0 / 1 、無心錘x 0 / 1 、鐵扇劍x 0 / 1 。任務時間剩余：09分50秒';
        // var keyword = txt.split('幫忙找到：')[1].split('。任務時間')[0];
        // var keyArr = keyword.split('、');
        // ckeckIsGetObj(keyArr);
    }
    function ckeckIsGetObj(arr) {
        var wayArr = [];
        for (var i = 0; i < arr.length; i++) {
            var firstSplit = arr[i].split('x ');
            var num = firstSplit[1].split('/')[0];
            var name = firstSplit[0];
            if (num < 1) {
                var map = goGetPosition(name);
                if (map) {
                    wayArr.push(map);
                }
            }
        }
        addScreenBtn(wayArr);
    }
    // 五鼠殺人
    function wushuKill(txt) {
        // txt = '展昭需要你幫忙殺死艷無憂。任務時間剩余：23分36秒。';
        var keyword = txt.split('殺死')[1].split('。任務時間')[0];
        // goKillPosition(keyword)
    }
    // 去物品或人
    function goGetPosition(key) {
        if (!key) {
            return false;
        }
        var map = hairsfalling['五鼠'];
        if (map[key]) {
            var TargetName = map[key];
            var way = '';
            if (TargetName.indexOf('-') > 0) {
                var place = TargetName.split('-');
                var targetPlace = place[1];
                for (var k in hairsfalling[place[0]]) {
                    if (k.indexOf(targetPlace) > -1) {
                        way = hairsfalling[place[0]][k];
                    } else if (targetPlace.indexOf(k) > -1) {
                        way = hairsfalling[place[0]][k];
                    }
                }
            } else {
                for (var j in hairsfalling) {
                    for (var k in hairsfalling[j]) {
                        if (k.indexOf(TargetName) > -1) {
                            way = hairsfalling[j][k];
                        } else if (TargetName.indexOf(k) > -1) {
                            way = hairsfalling[j][k];
                        }
                    }
                }
            }
            var newMap = { 'name': key + '-' + map[key], way: way };
            return newMap
        }
    }
    function goKillPosition(name) {
        console.log(name);
        writeScreenBtns(name);
        findSpecTagerInfo = name;
    }
    /**
     * 無用逃跑回坑、逃跑換邊
     *  */
    var changeTrigger = 0;
    var escapeTrigger = 0;
    var escapeTimer = null;
    function escapechangeStart() {
        escapeTrigger = 1;
        changeTrigger = 1;
        escapeloop()
    }
    function escapeStart() {
        escapeTrigger = 1;
        clearInterval(escapeTimer);
        escapeTimer = setInterval(escapeloop, 500)
    }
    function escapeloop() {
        clickButton("escape", 0);
        if (is_fighting == 0 || g_gmain.g_delay_connect > 0) {
            escapeTrigger = 0;
            clearInterval(escapeTimer)
        }
    }
    function EscapeFunc() {
        this.dispatchMessage = function (b) {
            var type = b.get("type"),
                subType = b.get("subtype");
            console.log(type);
            console.log(subType);
            var combat = g_obj_map.get("msg_vs_info");
            if (combat == undefined) {
                return
            }
            var npcid;
            var opnpc;
            var me = g_obj_map.get("msg_attrs").get("id");
            for (var i = 0; i < 8; i++) {
                if (combat.get("vs1_pos" + i) == me) {
                    opnpc = combat.get("vs1_pos1");
                    npcid = combat.get("vs2_pos1")
                } else {
                    if (combat.get("vs2_pos" + i) == me) {
                        opnpc = combat.get("vs2_pos1");
                        npcid = combat.get("vs1_pos1")
                    }
                }
            }
            if (type == "notice" && subType == "escape") {
                var msg = g_simul_efun.replaceControlCharBlank(b.get("msg"));
                console.log(msg);
                if (msg.match("逃跑成功") != null) {
                    escapeTrigger = 0;
                    if (changeTrigger == 1) {
                        restartFight(opnpc)
                    } else {
                        if (changeTrigger == 0) {
                            restartFight(npcid)
                        }
                    }
                }
            }
        };
        var restartFight = function (npcid) {
            if (!npcid) {
                return;
            }
            if (changeTrigger == 1) {
                changeTrigger = 0
            }
            console.log(npcid);
            clickButton("fight " + npcid, 0);
            clickButton("kill " + npcid, 0)
        }
    }

    var escapeFunc = new EscapeFunc;

    function GetNPCPath(dir, name) {
        if (name && name.indexOf('n')) {
            name = name.replace(/\n/g, "");
        }
        var hasFindName = false;
        if (is_fighting) {
            setTimeout(function () {
                GetNPCPath(dir, name);
            },
                300);
            return
        }
        var npcArr = hasSamePerson(name);
        if (npcArr.length > 0) {
            console.log(npcArr);
            hasFindName = true;
        }
        if (hasFindName) {
            killSomeOneName = name;
            var p = dir.split(";");
            var way = p.splice(0, steps);
			console.log('aaa');
            if (Jianshi.qianlong || Jianshi.zha || Jianshi.jianghu || Jianshi.youXia) {
				console.log('abb');
                isOnstep1 = false;
                steps = 0;
                killGoodSetInterval = setInterval(function () {
                    killSet([name]);
                }, 300);
            }
            sendToLine(name, way);
            return false;
        }
        var d = dir.split(";");

        if (steps < d.length) {
            var cmd = d[steps];
            clickButton(cmd);
            steps += 1;
            setTimeout(function () {
                GetNPCPath(dir, name);
            }, 400);
        } else {
            stopOnTime = false;
            steps = 0;
            isOnstep1 = false;
            console.log('未找到NPC' + name);
        }
    }
    function sendToLine(name, way) {
        var npcList = getNpcNameList();
        var npcName = '';
        if (npcList.length > 0) {
            npcName = '-' + npcList[0];
        }
        var roomname = g_obj_map.get("msg_room").get("short");
        roomname = removeChart(roomname);

        var msg = '找到' + name + ',在' + roomname + npcName + '-way:' + '"' + way.join(';') + '"';
        clickButton('tell ' + assistant + ' ASSIST/reTell/' + msg);
    }
    function getNpcNameList() {
        var npcList = getNpcArr();
        var QixiaList = ['段老大', '二娘', '嶽老三', '雲老四', '劇盜', '惡棍', '流寇', '無一', '鐵二', '追三', '冷四', '黃衣捕快', '紅衣捕快', '錦衣捕快', "浪喚雨", "王蓉", "龐統", "李宇飛", "步驚鴻", "風行騅", "郭濟", "吳縝", "風南", "火雲邪神", "逆風舞", "狐蒼雁", "護竺", "八部龍將", "玄月研", "狼居胥", "烈九州", "穆妙羽", "宇文無敵", "李玄霸", "風無痕", "厲滄若", "夏嶽卿", "妙無心", "巫夜姬", "玄陰符兵", "金甲符兵", '任俠', '暗刺客', '金刀客', '追命', '無花', '傳鷹', '令東來', '西門吹雪', '石之軒', '朱大天王', '楚昭南', '阿青', '楚留香', '天山童姥', '乾羅', '令狐沖', '喬峰', '浪翻雲', '三少爺', '石幽明', '胡鐵花', '蒙赤行', '厲工', '葉孤城', '祝玉妍', '蕭秋水', '淩未風', '白猿', '石觀音', '李秋水', '方夜羽', '東方不敗', '慕容博', '龐斑', '燕十三'];
        var noCareNpc = QixiaList.join(',');
        var newArr = [];
        for (var i = 0; i < npcList.length; i++) {
            var npcName = npcList[i].split(',')[1];
            npcName = removeChart(npcName);
            if (noCareNpc.indexOf(npcName) < 0) {
                newArr.push(npcName);
            }
        }
        return newArr;
    }

    function setKilledQianlong1(txt) {
        stopOnTime = false;
        var qingmuNum = txt.split('：')[1].split('x')[1];
        console.log(txt);
        var getQingNum = qingmuNum / 50;
        if (getQingNum) {
            var killedName = qianlongNpcArray[getQingNum - 1];
            saveQianlongCookies(killedName, getQingNum - 1);
            console.log('根據青木判斷已擊殺：' + killedName)
        }
    }
    /**
     *
     * 幫派本自動走
     */
    function autoBang1Way() {
        var dir = 's;e;e;e;e;e;e;e;e;e;w;w;w;w;w;w;e;e;e;s;w;w;w;e;e;e;e;e;e;w;w;w;s;w;w;w;e;e;e;e;e;e;w;w;w;s;w;w;w;e;e;e;e;e;e;w;w;w;s;w;w;w;e;e;e;e;e;e;w;w;w;s';
        if (Base.getCorrectText('4253282')) {
            dir = 's;w;w;w;w;w;w;w;e;e;e;e;e;e;e;e;e;e;e;e;w;w;w;s;w;w;w;e;e;e;e;e;e;w;w;w;s;w;w;w;e;e;e;e;e;e;w;w;w;s;w;w;w;e;e;e;e;e;e;w;w;w;s;w;w;w;e;e;e;e;e;e;w;w;w;s';
        }
        var name = TianJianNPCList1;
        GetNPCPath1(dir, name);
    }
    function GetNPCPath1(dir, name) {
        var peopleList = $(".cmd_click3");
        var thisonclick = null;
        var hasFindName = false;
        for (var i = 0; i < peopleList.length; i++) {
            thisonclick = peopleList[i].getAttribute('onclick');
            if (thisonclick != null && thisonclick.split("'")[1].split(" ")[0] == 'look_npc') {
                var targetCode = thisonclick.split("'")[1].split(" ")[1];
                if (name) {
                    if (isContains(name, peopleList[i].innerText)) {
                        // console.log("發現NPC名字：" + peopleList[i].innerText + "，代號：" + targetCode);
                        hasFindName = true;
                    }
                }
            }
        }
        if (peopleList.length > 0) {
            if (hasFindName) {
                setTimeout(function () {
                    GetNPCPath1(dir, name);
                }, 1000);
            } else {
                var d = dir.split(";");
                if (steps < d.length) {
                    clickButton(d[steps]);
                    steps += 1;
                    setTimeout(function () {
                        GetNPCPath1(dir, name);
                    }, 1000);
                } else {
                    sendToQQ('走完路線，結束走路');
                    if (Base.getCorrectText('4253282')) {
                        closeBangWay();
                    }
                    steps = 0;
                }
            }
        } else {
            setTimeout(function () {
                GetNPCPath1(dir, name);
            }, 1000);
        }
    }

    function closeBangWay() {
        var timeNum = 25 * 60 * 1000;
        var shortName = g_obj_map.get("msg_room").get("short");
        if (!shortName) {
            setTimeout(function () {
                closeBangWay();
            }, 3000);
            return;
        }
        if (shortName.indexOf("聖壇") >= 0) {
            timeNum = 5 * 60 * 1000;
        }
        console.log(timeNum);
        setTimeout(function () {
            tellBangClose();
            sendToQQ('打完副本繼續掛機');
            openOnTime();
            closeTianJian();
        }, timeNum);
    }

    function clickWakuangBtn() {
        var dom = $('.btn-wakuang');
        if (dom.html() == '挖礦') {
            dom.trigger('click');
        }
    }
    // 關閉定時與潛龍
    function removeOnTime(type) {
        var dom = $('#btnOnTime');
        if (dom.html() == '取消定時') {
            dom.trigger('click');
        }
        var dom1 = $('#btn12');
        if (dom1.html() == '不監視') {
            dom1.trigger('click');
        }
        var dom2 = $('#btns5');
        if (dom2.html() == '不打雪山') {
            dom2.trigger('click');
        }
        if (Base.getCorrectText('4253282')) {
            openTianJian();
            setTimeout(function () {
                autoBang1Way();
            }, 6000);
        } else if (type) {
            openTianJian();
            setTimeout(function () {
                autoBang1Way();
            }, 6000);
        }
    }
    // 開啟定時與潛龍
    function openOnTime() {
        var dom = $('#btnOnTime');
        if (dom.html() == '定時任務') {
            dom.trigger('click');
        }
        // if (Base.getCorrectText('4253282')) {
        var dom1 = $('#btn12');
        if (dom1.html() == '監視潛龍') {
            dom1.trigger('click');
        }
        // }
        // var dom2 = $('#btns5');
        // if (dom2.html() == '打雪山') {
        //     dom2.trigger('click');
        // }
        closeTianJian();
    }
    function openTianJian() {
        var dom2 = $('#btn11');
        if (dom2.html() == '殺天劍') {
            dom2.trigger('click');
        }
    }
    function closeTianJian() {
        var dom2 = $('#btn11');
        if (dom2.html() == '停天劍') {
            dom2.trigger('click');
        }
    }
    function goPlaceAndFight(way, callback) {
        if (!hasGoToEnd() || !window.hasReachRoom || is_fighting) {
            setTimeout(function () {
                goPlaceAndFight(way, callback)
            }, 1000);
            return
        }
        var objs = g_obj_map.get("msg_room").elements.filter(function (item) {
            return item.key.indexOf("npc") == 0 && !isNaN(item.key.replace("npc", ""))
        });
        if (objs.length > 0) {
            window.singleBattleTrigger = 1;
            window.singleBattleInstance = new window.singleBattle(function () {
                setTimeout(function () {
                    goPlaceAndFight(way, callback)
                }, 1000)
            });
            clickButton("kill " + objs[0].value.split(",")[0]);
            return
        }
        var ways = way.split(";");
        console.log(ways);
        if (ways.length > 0) {
            window.hasReachRoom = false;
            var wayWord = getDirectionFullName(ways.shift());
            if (wayWord) {
                clickButton("go " + wayWord);
                if (ways.length > 0) {
                    setTimeout(function () {
                        goPlaceAndFight(ways.join(";"), callback)
                    }, 300);
                }
            }
            return
        } else {
            // if (callback) {
            //     callback()
            // }
        }
    }
    function getDirectionFullName(sname) {
        switch (sname) {
            case "w":
                return "west";
            case "e":
                return "east";
            case "s":
                return "south";
            case "n":
                return "north";
            case "sw":
                return "southwest";
            case "se":
                return "southeast";
            case "ne":
                return "northeast";
            case "nw":
                return "northwest";
            default:
                return ""
        }
    }
    function MiGongNavi() {
        return {
            Append: function (name, cmd) {
                if ($("#out #MiGongNaviPanel").length == 0) {
                    $("#out table:eq(1)").after('<div id="MiGongNaviPanel"><div>馬車：</div></div>')
                }
                // button.setAttribute("onClick", 'go("' + arr[i].way + '")');
                $("#out #MiGongNaviPanel").append('<button type="button" cellpadding="0" cellspacing="0" onclick="go(\'' + cmd + '\')" class="cmd_click3"><font style="color:yellow">' + name + "</font></button>")
            },
            execNav: function (name, cmd) {
                if ($("#out #MiGongNaviPanel").length == 0) {
                    $("#out table:eq(1)").after('<div id="MiGongNaviPanel"><div>馬車：</div></div>')
                }
                // button.setAttribute("onClick", 'go("' + arr[i].way + '")');
                $("#out #MiGongNaviPanel").append('<button type="button" cellpadding="0" cellspacing="0" onclick="execNav(\'' + cmd + '\')" class="cmd_click3"><font style="color:yellow">' + name + "</font></button>")
            },
            Clear: function () {
                $("#out #MiGongNaviPanel").remove()
            }
        }
    }
    var miGongNavi = new MiGongNavi();

    function addMiGongWatch() {
        window.oldgSocketMsg2 = gSocketMsg2;
        gSocketMsg2.old_show_room = gSocketMsg2.show_room;
        gSocketMsg2.show_room = function () {
            gSocketMsg2.old_show_room();
            miGongNavi.Clear();
            var elements = g_obj_map.get("msg_room").elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].value == 'task_quest') {
                    miGongNavi.Append("清空謎題", "auto_tasks cancel");
                    miGongNavi.Append("使用謎題卡", "items use miticska");
                    break;
                }
            }
            switch (g_obj_map.get("msg_room").get("map_id")) {
                case "mojiajiguancheng":
                    if (g_obj_map.get("msg_room").get("short") == "墨攻禦陣" && g_obj_map.get("msg_room").get("south") == "雲海山谷") {
                        miGongNavi.Append("機關城", "w;n;e;e;nw;w;ne;se;n;nw");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "變化道" && g_obj_map.get("msg_room").get("west") == "神龍山") {
                        miGongNavi.Append("石板大道", "n;e;s;e;n;nw;e;nw");
                        miGongNavi.Append("盤龍湖", "s;e;s;ne;s;sw;nw;s;se;s");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "變化道" && g_obj_map.get("msg_room").get("northwest") == "石板大道") {
                        miGongNavi.Append("神龍山", "e;se;s;w");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "變化道" && g_obj_map.get("msg_room").get("south") == "盤龍湖") {
                        miGongNavi.Append("神龍山", "nw;w;ne;n;w");
                    }
                    break;
                case "miaojiang":
                    if (g_obj_map.get("msg_room").get("obj_p") == "4583") {
                        miGongNavi.Append("江邊小路", "sw;e;e;sw;se;sw");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4540") {
                        miGongNavi.Append("噬生沼澤", "s;s;e;n;n;e");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4600") {
                        miGongNavi.Append("上山小路", "s;e;ne;s;sw;e;e;ne");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4568") {
                        miGongNavi.Append("瀾滄江南岸", "event_1_41385370;e;ne;nw;e;sw;se;s;ne;e;e;n;nw");
                    }
                    break;
                case "xiakedao":
                    if (g_obj_map.get("msg_room").get("obj_p") == "4018") {
                        miGongNavi.Append("平原平地", "e;s;s;s");
                        miGongNavi.Append("養心居", "e;e;e;e");
                        miGongNavi.Append("石壁", "e;s;n;e;s");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3987") {
                        miGongNavi.Append("土路", "n;w;w;w;s;w");
                        miGongNavi.Append("養心居", "n;n;e;e");
                        miGongNavi.Append("石壁", "n;w;n;e;s");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4028") {
                        miGongNavi.Append("平原平地", "w;s;s;s;s");
                        miGongNavi.Append("土路", "w;w;w;w;s;w");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3998") {
                        miGongNavi.Append("平原平地", "n;e;s;s");
                        miGongNavi.Append("土路", "n;w;w;s;w");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3994") {
                        miGongNavi.Append("山頂", "n;n;n;e;ne;nw");
                        miGongNavi.Append("摩天崖", "n;e;e;ne");
                        miGongNavi.Append("木屋", "n;n;n;w;w");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3992") {
                        miGongNavi.Append("後山山路", "se;s;s;s");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3980") {
                        miGongNavi.Append("後山山路", "sw;s;s;s");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3982") {
                        miGongNavi.Append("後山山路", "e;s;s;s");
                    }
                    break;
                case "binghuo":
                    if (g_obj_map.get("msg_room").get("obj_p") == "3931") {
                        miGongNavi.Append("彩虹瀑布", "nw;s;s;s;s;s;s;e");
                        miGongNavi.Append("雪松林海深處", "nw;s;s;s;s;s;s;w;w;n;e;n;w;w;s");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3881") {
                        miGongNavi.Append("雪松林海深處", "w;w;w;n;e;n;w;w;s");
                        miGongNavi.Append("雪原溫泉", "w;n;e;e;n;se");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "3930") {
                        miGongNavi.Append("彩虹瀑布", "n;n;s;s;s;s;e");
                        miGongNavi.Append("雪原溫泉", "n;n;s;s;s;s;n;e;e;n;se");
                    }
                case "wudang":
                    if (g_obj_map.get("msg_room").get("short") == "山谷通道" && g_obj_map.get("msg_room").get("south") == "山谷口") {
                        miGongNavi.Append("環山之地", "sw;nw;w;ne");
                    }
                    break;
                case "baituo":
                    if (g_obj_map.get("msg_room").get("short") == "密林" && g_obj_map.get("msg_room").get("north") == "山莊大門") {
                        miGongNavi.Append("正堂", "sw;s;ne;e;s;s");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "戈壁" && g_obj_map.get("msg_room").get("north") == "戈壁") {
                        miGongNavi.Append("天山", "jh 39");
                    }
                    break;
                case "tianshan":
                    if (g_obj_map.get("msg_room").get("short") == "官道" && g_obj_map.get("msg_room").get("northeast") == "官道") {
                        miGongNavi.Append("星星峽", "ne;e;n;ne;ne;n;ne;nw;ne;nw;event_1_17801939");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "天池瀑布") {
                        miGongNavi.Append("去白駝山", "jh 21");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4448") {
                        miGongNavi.Append("大漠深處", "s;s;sw;n;nw;e;sw");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "雪谷" && g_obj_map.get("msg_room").get("southeast") == "雪谷") {
                        miGongNavi.Append("失足巖", "se;s;e;n;ne;nw;event_1_58460791");
                        miGongNavi.Append("星星峽", "se;s;e;n;ne;nw;ne;nw;event_1_17801939");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "星星峽") {
                        miGongNavi.Append("楊英雄", "ts2;ne;ne;nw;nw");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4507") {
                        miGongNavi.Append("閉關室入口", "nw;n;ne;nw;nw;w;n;n;n;e;e;s");
                    }
                    break;
                case "luoyang":
                    if (g_obj_map.get("msg_room").get("obj_p") == "112") {
                        miGongNavi.Append("長安", "n;n;n;n;n;n;n;n;n;n;n;n;n;n");
                        miGongNavi.Append("礦場", "n;n;n;n;n;n;n;n;n;n;w;w");
                        miGongNavi.Append("五鼠廣場", "n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n");
                        miGongNavi.Append("遊記貨棧", "n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;w;w;w;n;w");
                    }
                    break;
                case "changan":
                    if (g_obj_map.get("msg_room").get("obj_p") == "4367") {
                        miGongNavi.Append("落魄池", "n;n;w;s;s;s;s;e;event_1_2215721");
                        miGongNavi.Append("淩煙閣", "n;n;n;n;n;n;e;e;e;e;e;e;n;n;n;n;n;n;n;n;n;event_1_95312623");
                        miGongNavi.Append("風花酒館", "n;n;w;w;w;w;n;n;n;w");
                        miGongNavi.Append("遊記貨棧", "n;n;w;w;w;w;n;w");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4410") {
                        miGongNavi.Append("回收錦鯉", "event_1_97758064");
                        miGongNavi.Append("兌換", "event_1_32991030");
                    }
                    break;
                case "yanyuecheng":
                    if (g_obj_map.get("msg_room").get("short") == "越女玉雕") {
                        miGongNavi.Append("百裏原", "sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;se;s;s;sw;sw;sw");
                        miGongNavi.Append("璃雲石", "sw;sw;sw;s;se;se;se;e;s;sw;se;ne;se;s;e;e;e;ne;ne;ne;nw;nw;w");
                        miGongNavi.Append("千葉飛瀑", "n;ne;ne;n;n;n;nw;n;ne;ne;n;n;w;nw;nw;n;n;n;n;ne;ne;nw;ne;ne;n;n;ne;e");
                    }
                    if (g_obj_map.get("msg_room").get("short") == "璃雲石") {
                        miGongNavi.Append("百裏原", "e;se;se;sw;sw;se;s;s;sw;sw;sw");
                    }
                    break;
                case "baidicheng":
                    if (g_obj_map.get("msg_room").get("short") == "岸邊路" && g_obj_map.get("msg_room").get("southeast") == "岸邊路") {
                        miGongNavi.Append("璇璣宮", "se;e;e;se;se;se;se;se;se;event_1_57976870;n;n;n;event_1_91914705");
                    }
                    break;
                case "xiliangcheng":
                    if (g_obj_map.get("msg_room").get("short") == "荒漠" && g_obj_map.get("msg_room").get("northeast") == "荒漠") {
                        miGongNavi.Append("鐵劍", "ne;n;n;n;ne;ne;e;e;e;e;ne;n;ne;n;n;n;n;n;nw;nw;ne;n;ne;n");
                    }
                    break;
                case "haiyunge":
                    if (g_obj_map.get("msg_room").get("short") == "海運鎮" && g_obj_map.get("msg_room").get("north") == "海雲鎮") {
                        miGongNavi.Append("海雲堂", "n;n;n;n;w;n;nw;n;n;ne;n;n;e;n;n;n;n;e;n;n;n;n;n;w;w;n;n;n;n;n;n;n;n");
                        miGongNavi.Append("雪山山腳", "n;n;n;n;w;n;nw;n;n;ne;n;n;e;n;n;n;n;e;n;n;n;n;n;w;w;n;n;n;n;n;n;e;e;e;e;e;e;s;e;e;ne;ne;e;se;se;se");
                    }
                    break;
                case "taohuayuan":
                    var btn = '<button type="button" cellpadding="0" cellspacing="0" id="hjsbtn" class="cmd_click3"><font style="color:yellow">杭界山</button>';
                        $("#out .out .cmd_click3:first").before(btn).before("<br>");
                        $("body").off("click", "#hjsbtn").on("click", "#hjsbtn",
                            function () {
                                nextgo = function() {
									setTimeout(hjs_xl, 200)
								};
								go('jh 2;n;n;e;s;luoyang317_op1;go_hjs go;se;se;ne;w;n', nextgo)
                            })
                    break;
                case "snow":
                    if (g_obj_map.get("msg_room").get("obj_p") == "21") {
                        miGongNavi.Append("沁芳閣", "rank go 160;w;w;w;w;w;n;n;n;e;e;e");
                    }
					if (g_obj_map.get("msg_room").get("obj_p") == "18") {
                        miGongNavi.Append("去南詔", "e;n;n;n;n;w;event_1_90287255 go 9");		
					}
					if (g_obj_map.get("msg_room").get("obj_p") == "18") {
                        miGongNavi.Append("去大理", "e;n;n;n;n;w;event_1_90287255 go 8");		
					}
					if (g_obj_map.get("msg_room").get("obj_p") == "47") {
                        miGongNavi.Append("兌換刻刀", "event_1_58404606");		
					}
                    break;
				case "nanzhaoguo":
                    if (g_obj_map.get("msg_room").get("short") == "忘憂酒館") {
                        miGongNavi.Append("醫館", "n;w;w;w;w;w;w;w;s");
                        miGongNavi.Append("洱海橋", "n;e;e;e;e;e;s;s;s;s;e;e");
                    }
					if (g_obj_map.get("msg_room").get("short") == "洱海橋" && g_obj_map.get("msg_room").get("east") == "南蠻沼澤") {
						miGongNavi.execNav("密林", "e;e;e;se;ne;sw;escape;nw;e;ne;e");
                    }
					if (g_obj_map.get("msg_room").get("short") == "密林" && g_obj_map.get("msg_room").get("west") == "南蠻沼澤") {
						miGongNavi.execNav("洱海橋", "w;w;se;n;nw;s;escape;e;w;sw;w");
						miGongNavi.Append("巍山", "e;n;e;event_1_30634412;e;ne;e;e");
                    }
					if (g_obj_map.get("msg_room").get("short") == "巍山山道" && g_obj_map.get("msg_room").get("west") == "巍山山道" && g_obj_map.get("msg_room").get("north") == "巍山山道" && g_obj_map.get("msg_room").get("south") == "巍山山道") {
						miGongNavi.Append("密林", "w;w;sw;w;event_1_69046360;w;s;s;w");
						miGongNavi.Append("陳異叔石棺", "n;n;n;nw;nw;w;nw;n;n;w;n;n");
						miGongNavi.Append("無為寺", "n;n;n;ne;ne;nw;nw;n;n;n;n;n;n");
						miGongNavi.Append("巍山文廟", "s;e;e;n;e;e");
                    }
					if (g_obj_map.get("msg_room").get("short") == "陳異叔石棺") {
						miGongNavi.Append("巍山", "s;s;e;s;s;se;e;se;se;s;s;s");
                    }
					if (g_obj_map.get("msg_room").get("short") == "無為寺") {
						miGongNavi.Append("巍山", "s;s;s;s;s;s;se;se;sw;sw;s;s;s");
                    }
					if (g_obj_map.get("msg_room").get("short") == "巍山文廟") {
						miGongNavi.Append("巍山", "w;w;s;w;w;n");
                    }
                    break;
                case "tianlongsi":
                    if (g_obj_map.get("msg_room").get("obj_p") == "4651") {
                        miGongNavi.Append("柴紹", "ne;ne;n;n;n;ne;ne;e;e;se;se;s;s;s;event_1_83417762");
                        miGongNavi.Append("塔林", "ne;ne;n;n;n;ne;ne;e;e;se;se;s;s;s;event_1_83417762;w;sw;s;s");
                        miGongNavi.Append("閒釣", "ne;ne;n;n;n;ne;ne;e;e;se;se;s;s;s;event_1_83417762;e;ne;ne;n;n;n;ne;ne;nw");
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4698") {
                        var cstr = "ask tianlongsi_chaishao;";
                        var caoshoa = cstr.repeat(950);
                        miGongNavi.Append("天命丹", caoshoa);
                    }
                    if (g_obj_map.get("msg_room").get("obj_p") == "4773") {
						var btn = '<button type="button" cellpadding="0" cellspacing="0" id="ssignbtn" class="cmd_click3"><font style="color:yellow">小簽到</button>';
                        $("#out .out .cmd_click3:first").before(btn).before("<br>");
                        $("body").off("click", "#ssignbtn").on("click", "#ssignbtn",
                            function () {
                                ssign(0)
                            })
                    }
                    break;
                case "tangmen":
                    if (g_obj_map.get("msg_room").get("obj_p") == "1372") {
                        miGongNavi.Append("七殺劍閣", "sw;s;e;s;s;sw;sw;w;w;s;s;e;e;e;n;ne;e;se;");
                    }
                    break;
                case "murong":
                    if (g_obj_map.get("msg_room").get("obj_p") == "3197") {
                        miGongNavi.Append("孔府大門", "n;n;se;e;s;s;event_1_99232080;e;e;s;e;s;e;e;e")
                    }
                    break;
                case "youmingshanzhuang":
                    if (g_obj_map.get("msg_room").get("short") == "幽暗山路" && g_obj_map.get("msg_room").get("northeast") == "幽暗山路" && g_obj_map.get("msg_room").get("north") == undefined && g_obj_map.get("msg_room").get("northwest") == undefined && g_obj_map.get("msg_room").get("west") == undefined && g_obj_map.get("msg_room").get("southwest") == undefined && g_obj_map.get("msg_room").get("south") == undefined && g_obj_map.get("msg_room").get("southeast") == undefined && g_obj_map.get("msg_room").get("east") == undefined) {
                        miGongNavi.Append("闖入冥莊", "ne;ne;n;n;ne;ne;e;ne;n;n;n;n;n;ne;ne;n;n;n;nw;nw;n;e;e;e;e;e;event_1_77775145")
                    }
                    break;
                case "huajie":
                    if (g_obj_map.get("msg_room").get("short") == "西城門" && g_obj_map.get("msg_room").get("east") == "花街") {
                        miGongNavi.Append("二樓", "e;e;e;e;e;e;e;e;n;n;n;e;e")
                    }
                    if (g_obj_map.get("msg_room").get("short") == "藏嬌閣") {
                        var gwbtn2 = '<button type="button" cellpadding="0" cellspacing="0" id="gwbtn" class="cmd_click3">觀舞</button>';
                        $("#out .out .cmd_click3:first").before(gwbtn2).before("<br>");
                        $("body").off("click", "#gwbtn").on("click", "#gwbtn",
                            function () {
                                var gwtimer = setInterval(function () {
                                    clickButton("event_1_5392021 go");
                                    if ($("#out2 .out2:contains('你今天已經觀舞過了。')").length > 0) {
                                        clearInterval(gwtimer)
                                    }
                                },
                                    500)
                            })
                    }
                    if (g_obj_map.get("msg_room").get("short") == "沁芳閣") {
                        var gwbtn1 = '<button type="button" cellpadding="0" cellspacing="0" id="gwbtn" class="cmd_click3">觀舞</button>';
                        $("#out .out .cmd_click3:first").before(gwbtn1).before("<br>");
                        $("body").off("click", "#gwbtn").on("click", "#gwbtn",
                            function () {
                                var gwtimer = setInterval(function () {
                                    clickButton("event_1_48561012 go");
                                    if ($("#out2 .out2:contains('你今天已經觀舞過了。')").length > 0) {
                                        clearInterval(gwtimer)
                                    }
                                },
                                    500)
                            })
                    }
                    if (g_obj_map.get("msg_room").get("short") == "凝香閣") {
                        var gwbtn3 = '<button type="button" cellpadding="0" cellspacing="0" id="gwbtn" class="cmd_click3">觀舞</button>';
                        $("#out .out .cmd_click3:first").before(gwbtn3).before("<br>");
                        $("body").off("click", "#gwbtn").on("click", "#gwbtn",
                            function () {
                                var gwtimer = setInterval(function () {
                                    clickButton("event_1_29896809 go");
                                    if ($("#out2 .out2:contains('你今天已經觀舞過了。')").length > 0) {
                                        clearInterval(gwtimer)
                                    }
                                },
                                    500)
                            })
                    }
                    break;
                case "jiwutan":
                    if (g_obj_map.get("msg_room").get("short") == "泥濘小路" && g_obj_map.get("msg_room").get("east") == undefined && g_obj_map.get("msg_room").get("west") == "泥濘小路") {
                        var btn = '<button type="button" cellpadding="0" cellspacing="0" id="fbbtn" class="cmd_click3">開始</button>';
                        $("#out .out .cmd_click3:first").before(btn).before("<br>");
                        $("body").off("click", "#fbbtn").on("click", "#fbbtn",
                            function () {
                                goPlaceAndFight("w;s;e;e;e;e;e;nw;w;nw;nw;se;se;ne;se;nw;sw;nw;e;w;se;nw;ne;sw;se;nw;w;e;se;ne;n;s;sw;ne;ne;sw;sw;ne;e;w;sw;ne;nw;se;sw;nw;n;s;se;nw;sw;ne;se;ne;w;e;sw")
                            })
                    }
                    break;
                case "ymsz_qianyuan":
                    if (g_obj_map.get("msg_room").get("short") == "幽冥山莊前院") {
                        var btn = '<button type="button" cellpadding="0" cellspacing="0" id="qianyuanbtn" class="cmd_click3">開始</button>';
                        $("#out .out .cmd_click3:first").before(btn).before("<br>");
                        $("body").off("click", "#qianyuanbtn").on("click", "#qianyuanbtn",
                            function () {
                                goPlaceAndFight("e;e;n;s;s;n;e;e;ne;sw;s;s;s;e")
                            })
                    }
                    break;
                case "ymsz_huayuan":
                    if (g_obj_map.get("msg_room").get("short") == "幽冥山莊花園") {
                        var btn = '<button type="button" cellpadding="0" cellspacing="0" id="qianyuanbtn" class="cmd_click3">開始</button>';
                        $("#out .out .cmd_click3:first").before(btn).before("<br>");
                        $("body").off("click", "#qianyuanbtn").on("click", "#qianyuanbtn",
                            function () {
                                goPlaceAndFight("e;e;ne;nw;se;ne;ne;sw;se;se;e;w;sw;sw;se;nw;sw;sw")
                            })
                    }
                    break;
                case "ymsz_houyuan":
                    if (g_obj_map.get("msg_room").get("short") == "幽冥山莊後院") {
                        var btn = '<button type="button" cellpadding="0" cellspacing="0" id="houyuanbtn" class="cmd_click3">開始</button>';
                        $("#out .out .cmd_click3:first").before(btn).before("<br>");
                        $("body").off("click", "#houyuanbtn").on("click", "#houyuanbtn",
                            function () {
                                goPlaceAndFight("se;se;s;w;e;e;w;s;s;s;w;e;e;s;n;e;e;n;s;e;e;n;s")
                            })
                    }
                    break;
                case "zhenwuwendao":
                    if (g_obj_map.get("msg_room").get("short") == "兌澤閣") {
                        var btn = '<button type="button" cellpadding="0" cellspacing="0" id="houyuanbtn" class="cmd_click3">開始</button>';
                        $("#out .out .cmd_click3:first").before(btn).before("<br>");
                        $("body").off("click", "#houyuanbtn").on("click", "#houyuanbtn",
                            function () {
                                goPlaceAndFight("n;n;n;n;n;n;n;n;n;n;n;n")
                            })
                    }
                    break;
                case "jingcheng":
                    if (g_obj_map.get("msg_room").get("short") == "入城大道" && g_obj_map.get("msg_room").get("south") == undefined && g_obj_map.get("msg_room").get("north") == "入城大道") {
                        miGongNavi.Append("青龍賭坊", "n;n;n;n;n;w;w;n");
                        miGongNavi.Append("通天塔", "n;n;n;n;n;n;n;n;n;e;e;ne;e;e;ne;ne;n;n");
                        miGongNavi.Append("紅螺寺", "n;n;n;n;n;n;n;n;n;w;w;nw;w;n;n;n;w;nw;nw;nw;n")
                    }
                    break;
                case "yuewangjiangong":
                    if (g_obj_map.get("msg_room").get("short") == "歐余山路" && g_obj_map.get("msg_room").get("northeast") == "歐余山路" && g_obj_map.get("msg_room").get("southeast") == undefined && g_obj_map.get("msg_room").get("south") == undefined && g_obj_map.get("msg_room").get("north") == undefined && g_obj_map.get("msg_room").get("east") == undefined && g_obj_map.get("msg_room").get("north") == undefined && g_obj_map.get("msg_room").get("southwest") == undefined) {
                        miGongNavi.Append("鑄劍洞", "ne;ne;n;n;n;ne;ne;ne;se;se;se;s;s;s;s;se;se;e;n;n;n;n;n;n;n;n;n;n;n;ne");
                        miGongNavi.Append("越女劍樓", "ne;ne;n;n;n;ne;ne;ne;se;se;se;s;s;s;s;se;se;e;n;n;n;n;n;n;n;n;w")
                    }
                    break;
                case "jiangling":
                    if (g_obj_map.get("msg_room").get("short") == "霹靂門" && g_obj_map.get("msg_room").get("east") == "長平街") {
                        //clickButton('event_1_98432051 go gift1', 1)
                        miGongNavi.Append("買霹靂彈", "event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;");
                    }
                    // if (g_obj_map.get("msg_room").get("short") == "長平街" && g_obj_map.get("msg_room").get("north") == "長平街" && g_obj_map.get("msg_room").get("south") == undefined ) {
                    //     miGongNavi.Append("霹靂堂", "event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;event_1_98432051 go gift1;");
                    // }
                    break;
				case "huashan":
					if (g_obj_map.get("msg_room").get("obj_p") == "367") {
						miGongNavi.Append("換玄鐵令", "do_duihuan_qinglong_suipian gift8")
					}
					break;
            }
            $("#out .out").html($("#out .out").html().replace("&nbsp;&nbsp;&nbsp;" + g_obj_map.get("msg_room").get("long"), '<div style="height:40px;overflow:hidden;">&nbsp;&nbsp;&nbsp;' + g_obj_map.get("msg_room").get("long") + "</div>"));
            var centertr = $("#out .out table:eq(1) td:has(.cmd_click_room)").parent("tr");
            if (centertr.prev().length == 0) {
                centertr.before("<tr><td></td><td></td><td></td></tr>")
            }
            if (centertr.next().length == 0) {
                centertr.after("<tr><td></td><td></td><td></td></tr>")
            }
            $("#out .out table:eq(1) td").css({
                "width": $(".cmd_click_room").width(),
                "height": $(".cmd_click_room").height()
            })
        };
    }
    /**
     *
     *
     */
    window.daoHangPlace = function (key) {
        var data = null;
        for (var i in hairsfalling) {
            if (key == i) {
                data = hairsfalling[i];
            }
        };
        for (var k in data) {
            InforOutFunc(k, data[k]);
            // var html = '<a style="text-decoration:underline;color:yellow" onclick=go("'+ data[k] + '")>' + k + '</a>';
            // WriteToScreen(html);
        }
        log('輸出成功！');
    };
    // 獲取同步潛龍信息
    function getOption() {
        if (!g_obj_map.get("msg_attrs") || !g_obj_map.get("msg_attrs").get('id')) {
            setTimeout(() => {
                getOption();
            }, 2000);
            return;
        }
        getQianlongMsg();
    }

    // 去做暴擊
    function startQuestion(txt) {
        var txtSplit = txt.split('-');
        var name = txtSplit[1];
        var place = null;
        if (txtSplit.length > 2) {
            place = txtSplit[1];
            name = txtSplit[2];
        }
        var TargetName = name.trim(" ", "left").trim(" ", "right");
        var wayArr = [];

        if (place) {
            var placeData = hairsfalling[place];
            for (var k in placeData) {
                if (k.indexOf(TargetName) > -1) {
                    var way = placeData[k];
                    wayArr.push({ name: place + '-' + k, way: way });
                }
            }
        } else {
            for (var j in hairsfalling) {
                for (var k in hairsfalling[j]) {
                    if (k.indexOf(TargetName) > -1) {
                        var way = hairsfalling[j][k];
                        wayArr.push({ name: j + '-' + k, way: way });
                    }
                }
            }
        }

        addScreenBtn(wayArr);

        if (wayArr.length > 1) {
            console.log('查找到多個路徑，請自己選擇')
        } else if (wayArr.length == 1) {
            go(wayArr[0].way);
            setTimeout(() => {
                doAskNpc(name);
            }, 10000);
            setTimeout(() => {
                var href = $('.go-btn:last').attr('href');
                eval(href)
            }, 14000);
        }
    }

    function doAskNpc(name) {
        var hasNpc = hasSamePerson(name);
        if (hasNpc.length > 0) {
            for (var j = 0; j < hasNpc.length; j++) {
                var npcId = hasNpc[j][0];
                if (npcId) {
                    clickButton('ask ' + npcId);
                }
            }
        }
    }

    function loadAfter() {
        Base.init();
        makePlaceBtns();
        makeOtherBtns();
        makeMoreBtns();
        // GetNewQiXiaList();
        baiu();
        btnInit();
        addMiGongWatch();
        questionFn1();
        questionFn2();
        bindClickEvent();
        window.standForPuzzle = new StandForPuzzle();
        var doOntimeInterval = setInterval(function () {
            if (isAutoOn) {
                if (Base.getCorrectText('6984251') || Base.getCorrectText('6965572')) {
                    doOnTimeGuaJi();
                } else {
                    doOnTime();
                }
            }
        }, 15 * 60 * 1000);
        // getOption();
    }
    function goInLine(msg) {
        msg = msg ? msg : "噔噔噔噔，挑燈上線了！";
        if (Base.getCorrectText('4253282')) {
            var json_str = {
                "act": "101",
                "groupid": "291849393",
            };
            json_str["msg"] = '[CQ:at,qq=35994480] ' + msg;
            console.log(json_str);
            if (webSocket) webSocket.send(JSON.stringify(json_str));
        }
    }
    function addTuBtn(txt) {
        if (g_gmain.is_fighting) {
            warnning('戰鬥中');
            return;//戰鬥中
        }
        var btnArr = [];
        // chapList.forEach((item, index) => {
        //     if (txt.indexOf(item) > 0) {
        //         btnArr.push({ name: item, num: index + 1 });
        //     }
        // });
        var firstSplit = txt.split('前往');
        if (firstSplit.length > 0) {
            // if (txt.indexOf('遊俠會') >= 0){
            //     btnArr = firstSplit[1].split('的路上')[0];
            // }else{
            btnArr = firstSplit[1].split('捕獲')[0].split('，');
            // }
        } else {
            console.log('不符合' + txt);
            return false;
        }

        //13紅14黑15紅16紅17黑18紅
        var NPCNAME = txt.split('賜下')[1].split('VS')[0];    // 紅
        var CookiesNpc = txt.split('賜下')[1].split('VS')[0]; // 黑
        if (killBadSwitch) {
            if (NPCNAME == '楚留香' || NPCNAME == '乾羅' || NPCNAME == '令狐沖' || NPCNAME == '浪翻雲') {
                NPCNAME = txt.split('賜下')[1].split('VS')[0]; // 紅
            } else {
                NPCNAME = txt.split('VS')[1].split('三對')[0]; // 黑
            }
        } else {
            if (NPCNAME == '楚留香' || NPCNAME == '乾羅' || NPCNAME == '令狐沖' || NPCNAME == '浪翻雲') {
                NPCNAME = txt.split('VS')[1].split('三對')[0]; // 黑
            } else {
                NPCNAME = txt.split('賜下')[1].split('VS')[0]; // 紅
            }
        }
        CookiesNpc = $.trim(CookiesNpc);
        NPCNAME = $.trim(NPCNAME);
        var arr = [];

        for (var i = 0; i < btnArr.length; i++) {
            arr.push({ name: btnArr[i] + '-' + NPCNAME, click: 'goFindNpcInPlace("' + btnArr[i] + '", "' + NPCNAME + '", 3)', type: 1 });
        }
        // btnArr.forEach((item) => {
        //     arr.push({ name: item + '-' + NPCNAME, click: 'goFindNpcInPlace("' + item + '", "' + NPCNAME + '", 3)', type: 1 });
        // });
        var index = isDoneThisQianlong(CookiesNpc);
        if (index != null) {
            arr.push({ name: '已記過' + CookiesNpc, type: 2, click: 'delBiaoji(this' + ',"' + index + '")' });
        } else {
            arr.push({ name: '標記' + CookiesNpc, click: 'saveQianlongCookies("' + CookiesNpc + '", null, this)', type: 1, stype: 1 });
        }
        addScreenBtn(arr);
        var doneNumber = getDoneQianlongNumber();
        if (doneNumber >= 6) {
            // console.log('已經殺滿潛龍');
            return false;
        }
        // console.log('已經擊殺' + doneNumber + '個潛龍');
        if (Jianshi.qianlong) {
            isOnstep1 = false;
            var qianlongIndex = getIndexFromArr(CookiesNpc, qianlongNpcArray);
            // 不到前幾個
            if (qianlongIndex < 15 && CookiesNpc != '西門吹雪') {
                return false;
            }
            if (qianlongIndex < 16 && CookiesNpc != '西門吹雪' && isBigQiamlong()) {
                return false;
            }
            if (Base.getCorrectText('4253282')) {
                if (btnArr[0] != '峨眉山' && btnArr[0] != '鐵血大旗門' && !btnArr[0].stype && btnArr[0] != '黑木崖') {
                    goFindNpcInPlace(btnArr[0], NPCNAME);
                } else if (btnArr[1] != '峨眉山' && btnArr[1] != '鐵血大旗門' && !btnArr[1].stype && btnArr[1] != '黑木崖') {
                    goFindNpcInPlace(btnArr[1], NPCNAME);
                } else if (btnArr[2] != '峨眉山' && btnArr[2] != '鐵血大旗門' && !btnArr[2].stype && btnArr[2] != '黑木崖') {
                    goFindNpcInPlace(btnArr[2], NPCNAME);
                }
            } else {
                var btnIndexArr = [];
                if (btnArr[0] != '峨眉山' && btnArr[0] != '鐵血大旗門' && !btnArr[0].stype && btnArr[0] != '黑木崖') {
                    btnIndexArr.push(0);
                }
                if (btnArr[1] != '峨眉山' && btnArr[1] != '鐵血大旗門' && !btnArr[1].stype && btnArr[1] != '黑木崖') {
                    btnIndexArr.push(1);
                }
                if (btnArr[2] != '峨眉山' && btnArr[2] != '鐵血大旗門' && !btnArr[2].stype && btnArr[2] != '黑木崖') {
                    btnIndexArr.push(2);
                }
                var index = Math.floor((Math.random() * btnIndexArr.length));
                goFindNpcInPlace(btnArr[btnIndexArr[index]], NPCNAME);
            }
        }
    }

    function sideNpc(name) {
        var npcMap = {
            '楊肅觀': '盧雲',
            '荊無命': '阿飛',
            '顧惜朝': '戚少商',
            '風際中': '陳近南',
        };
        var sideName = '';
        for (var i in npcMap) {
            if (name.indexOf(i) > -1) {
                sideName = npcMap[name]
            }
        }
        return sideName;
    }

    function returnRuShiType() {
        var menpai = {
            "道": '武當、全真、茅山',
            "儒": '華山、步玄、慕容',
            "釋": '少林、大理、峨眉',
        };
        var menpaiType = '';
        var new_key = my_family_name.replace('派', '');
        for (var i in menpai) {
            if (menpai[i].indexOf(new_key) > -1) {
                menpaiType = i;
            }
        }
        return menpaiType;
    }

    // 【系統】【江湖紛爭】：鏡星府、斷劍山莊門派的荊無命劍客傷害同門，欺師滅組，判師而出，卻有全真派、封山劍派堅持此種另有別情而強行庇護，兩派紛爭在越王劍宮-鑄劍洞七層一觸即發，江湖同門速速支援！
    // 【系統】【江湖紛爭】：斷劍山莊門派的風際中劍客傷害同門，欺師滅組，判師而出，卻有風花牧場、白駝山派、逍遙派、大理段家、榮威鏢局堅持此種另有別情而強行庇護，兩派紛爭在茅山-無名山峽谷一觸即發，江湖同門速速支援！
    // 道、釋流派的風際中劍客傷害同門，欺師滅組，判師而出，卻有儒堅持此種另有別情而強行庇護，兩派紛爭在鐵雪山莊-踏雲小徑一觸即發，江湖同門速速支援！
    function addTuBtn1(txt) {
        if (g_gmain.is_fighting) {
            warnning('戰鬥中');
            return; // 戰鬥中
        }
        var isRuShi = false;
        var rushiType = '';
        var userTitle = g_obj_map.get("msg_attrs").get("title");
        if (userTitle.indexOf('入室') > 0) {
            isRuShi = true;
            rushiType = returnRuShiType();
            console.log('您的入室類型：' + rushiType);
        }

        var place = '';

        var firstSplit = txt.split('兩派紛爭在');
        if (firstSplit.length > 0) {
            place = firstSplit[1].split('一觸')[0].split('-')[0];
        } else {
            console.log('不符合' + txt);
            return false;
        }

        var npc = txt.split('劍客傷害')[0].split('派的')[1];
        console.log('npc:' + npc);

        if (!my_family_name) {
            console.log('未選擇門派');
            // log('未選擇門派');
            return false;
        }

        // 判斷是殺當前name還是隱藏的
        if (npc != '風際中' && npc != '顧惜朝') {
            if (Jianshi.jianghu) {
                if (firstSplit[0].indexOf(my_family_name) > 0) {
                    if (firstSplit[0].indexOf(my_family_name) < firstSplit[0].indexOf('欺師滅組')) {
                        npc = sideNpc(npc);
                        console.log('sideNpc:' + npc);
                    }
                    goFindNpcInPlace1(place, npc);
                    addJianghuToScreen(place, npc);
                } else if (isRuShi && firstSplit[0].indexOf(rushiType) > 0) {
                    if (firstSplit[0].indexOf(rushiType) < firstSplit[0].indexOf('欺師滅組')) {
                        npc = sideNpc(npc);
                        console.log('sideNpc:' + npc);
                    }
                    goFindNpcInPlace1(place, npc);
                    addJianghuToScreen(place, npc);
                }
            }
        }
    }

    function addJianghuToScreen(place, npc) {
        var logText = '位置：' + place + '，NPC' + npc;
        log(logText);

        var arr = [];
        arr.push({ name: npc + '-' + place, click: 'goFindNpcInPlace1("' + place + '", "' + npc + '", 3)', type: 1 });
        addScreenBtn(arr);
    }

    function log(text) {
        var msg = new Map();
        msg.put('type', 'main_msg');
        msg.put('ctype', 'text');
        msg.put('msg', HIG + text);
        _dispatch_message(msg);
        console.log(text);
    }
    function warnning(text) {
        var msg = new Map();
        msg.put('type', 'main_msg');
        msg.put('ctype', 'text');
        msg.put('msg', RED + text);
        _dispatch_message(msg);
        console.log(text);
    }


    // 加載完後運行
    $(function () {
        if (Base.getCorrectText('3594649') || Base.getCorrectText('4238943')) {
            bindKey();
        }
        attach();
    });
    window.hasSendReload = false;
})();

var aotucangbaotuTrigger = 0;

dispatchMessageList.push(function (b) {
    var type = b.get("type"),
        msg = b.get("msg"),
        subtype = b.get("subtype");
    if (type == "channel" && subtype == "sys" && msg && msg.indexOf("今天你可是在我的地盤，看來你是在劫難逃！") > -1) {
        var lastlocation = "";
        var npc = "";
        var npcid = "";
        if (msg.indexOf("巫蠱王") > -1) {
            lastlocation = "n";
            npc = "巫蠱王";
            // npcid = $(cangbaotuRadio1).is(":checked") ? "changan_yunguanhai1" : "changan_wuguwang"
        } else {
            if (msg.indexOf("夜千麟") > -1) {
                lastlocation = "s";
                npc = "夜千麟";
                // npcid = $(cangbaotuRadio1).is(":checked") ? "changan_yiguogong1" : "changan_yeqianlin"
            } else {
                if (msg.indexOf("百毒旗主") > -1) {
                    lastlocation = "w";
                    npc = "百毒旗主";
                    // npcid = $(cangbaotuRadio1).is(":checked") ? "changan_heipaogong1" : "changan_baiduqizhu"
                } else {
                    if (msg.indexOf("十方惡神") > -1) {
                        lastlocation = "e";
                        npc = "十方惡神";
                        // npcid = $(cangbaotuRadio1).is(":checked") ? "changan_duguxuyu1" : "changan_shifangeshen"
                    }
                }
            }
        }
        var cmd = "jh 2;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;n;w;s;s;s;s;e;event_1_2215721;" + lastlocation;
        writeToScreen("<span style='color:rgb(118, 235, 32)'>寶藏秘圖碎片-" + npc + "</span> [<a href=\"javascript:go('" + cmd + "')\">GO</a>]", 2, 1);
    }
});
function addListener(listenList, funcname, func) {
    listenList[funcname] = func
}
function removeListener(listenList, funcname) {
    delete listenList[funcname]
}
function fireListener(listenList, args) {
    for (var name in listenList) {
        listenList[name].apply(this, args)
    }
}
function overrideclick(cmd) {
    deadlock = 1;
    cmdlist.push(cmd);
    deadlock = 0;
}
function newoverrideclick() {
    if (cmdlist.length == 0) {
        setTimeout(function () {
            newoverrideclick();
        }, 10);
    } else {
        if (cmdlist.length > 0 && deadlock == 1) {
            setTimeout(function () {
                newoverrideclick();
            }, 10);
        } else {
            if (deadlock == 0 && cmdlist.length > 0) {
                curstamp = (new Date()).valueOf();
                if ((curstamp - prestamp) > 150) {
                    if (cmdlist.length != 0) {
                        if (qiangdipiTrigger == 0) {
                            if (cmdlist[0].match("get1") == null) {
                                clickButton(cmdlist[0]);
                                cmdlist.shift();
                                prestamp = curstamp;
                            } else {
                                cmdlist.shift();
                                prestamp = curstamp;
                            }
                        } else {
                            if (qiangdipiTrigger == 1) {
                                if (cmdlist[0].match("get1") == null) {
                                    clickButton(cmdlist[0]);
                                    cmdlist.shift();
                                    prestamp = curstamp
                                } else {
                                    if (knownlist.indexOf(cmdlist[0].split("get1")[1]) < 0 && cmdlist[0].split("get1")[1].match("corpse") != null) {
                                        knownlist.push(cmdlist[0].split("get1")[1])
                                    }
                                    clickButton("get" + cmdlist[0].split("get1")[1]);
                                    cmdlist.shift();
                                    prestamp = curstamp
                                }
                            }
                        }
                    }
                    setTimeout(function () {
                        newoverrideclick()
                    }, 10);
                } else {
                    setTimeout(function () {
                        newoverrideclick()
                    }, 10);
                }
            }
        }
    }
}

function Base64() {
    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    this.encode = function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = _utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64
            } else {
                if (isNaN(chr3)) {
                    enc4 = 64
                }
            }
            output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4)
        }
        return output
    };
    this.decode = function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2)
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3)
            }
        }
        output = _utf8_decode(output);
        return output
    };
    _utf8_encode = function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c)
            } else {
                if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128)
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128)
                }
            }
        }
        return utftext
    };
    _utf8_decode = function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++
            } else {
                if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2
                } else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3
                }
            }
        }
        return string
    }
}

// 無用跟隨
function FollowUserClass() {
    addListener(show_userListener, "followuser",
        function () {
            if ($(".cusbtn-follow").length == 0) {
                var rank = g_obj_map.get("msg_attrs").get("rank").split("★")[0];
                var flg = g_obj_map.get("msg_user").get("long").indexOf(rank) > -1;
                flg = flg || (window.idcheck[i].indexOf(g_obj_map.get("msg_user").get("id")) > -1);
                if (flg) {
                    if ($("#out .out table:last tr:last td").length >= 4) {
                        $("#out .out table:last tr:last").append("<tr></tr>")
                    }
                    var name = g_obj_map.get("msg_user").get("name").replace(/^\[.*★\[2;37;0m/, "");
                    if (followuser.userName == name) {
                        $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="go1(\'cus|follow|\')" class="cmd_click2 cusbtn-follow">取消<br>跟隨</button></td>')
                    } else {
                        $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="go1(\'cus|follow|' + name + '\')" class="cmd_click2 cusbtn-follow">跟隨</button></td>')
                    }
                }
            }
        });
    addListener(show_scoreListener, "leaduser",
        function () {
            if ($(".cusbtn-follow").length == 0) {
                if ($("#out .out table:last tr:last td").length >= 4) {
                    $("#out .out table:last tr:last").append("<tr></tr>")
                }
                if (followuser.isLeader) {
                    $("#out .out table:last tr:last").append('<td><button type="button" onclick="go1(\'cus|leader|0\')" class="cmd_click2 cusbtn-follow">停止<br>帶隊</button></td>')
                } else {
                    $("#out .out table:last tr:last").append('<td><button type="button" onclick="go1(\'cus|leader|1\')" class="cmd_click2 cusbtn-follow">帶隊</button></td>')
                }
            }
        });
    return {
        allowedcmds: ["go", 'fb', 'rank', "fight", "kill", "escape", "jh", "ask", "npc_datan", "give", "room_sousuo"],
        userName: "",
        follow: function (uname) {
            var that = this;
            that.userName = uname;
            var listenerName = "followUserListener";
            if (that.userName) {
                addListener(dispatchMessageListener, listenerName,
                    function (c) {
                        var a = c.get("type"),
                            b = c.get("subtype"),
                            d = c.get("msg");
                        var userName = that.userName;
                        if (a == "channel" && b == "team") {
                            if (d.indexOf(userName) > 0) {
                                if (d.indexOf("【隊伍】") > 0) {
                                    var cmd = d.split('：')[1].replace("[2;37;0m", "");
                                    var base64 = new Base64();
                                    cmd = cmd.replace(/-/g, "");
                                    cmd = base64.decode(cmd);
                                    cmd = cmd.replace(/\n/g, "");
                                    if (that.allowedcmds.indexOf(cmd.split(" ")[0]) > -1 || cmd.indexOf("find_") == 0 || cmd.indexOf("event_") == 0 || cmd.indexOf("give_") == 0 || cmd === 'w' || cmd === 'e' || cmd === 's' || cmd === 'n' || cmd === 'se' || cmd === 'sw' || cmd === 'ne' || cmd === 'nw') {
                                        clickButton(cmd);
                                        if (cmd.indexOf("fight ") == 0 || cmd.indexOf("kill ") == 0) {
                                            setTimeout(function () {
                                                if (g_obj_map.get("msg_vs_info")) {
                                                    var vsinfo = g_obj_map.get("msg_vs_info").elements.filter(function (item) {
                                                        return item.key.indexOf("vs1_") == 0 && item.value == that.userName
                                                    });
                                                    $("#out2 .out2 td#" + vsinfo[0].key.replace("_name", "")).click()
                                                }
                                            },
                                                800)
                                        }
                                    }
                                }
                            }

                        }
                    })
            } else {
                removeListener(dispatchMessageListener, listenerName);
            }
            clickButton("score " + g_obj_map.get("msg_user").get("id"));
        },
        isLeader: false,
        toBeLeader: function (isLeader) {
            var that = this;
            that.isLeader = isLeader;
            var listenerName = "leadUserListener";
            if (that.isLeader) {
                addListener(clickButtonListener, listenerName,
                    function (cmd, e) {
                        if (that.allowedcmds.indexOf(cmd.split(" ")[0]) > -1 || cmd.indexOf("find_") == 0 || cmd.indexOf("event_") == 0 || cmd.indexOf("give_") == 0 || cmd === 'w' || cmd === 'e' || cmd === 's' || cmd === 'n' || cmd === 'se' || cmd === 'sw' || cmd === 'ne' || cmd === 'nw') {
                            var base64 = new Base64();
                            cmd = base64.encode(cmd);
                            cmd = cmd.split("").join("-");
                            send("team chat " + cmd + "\n")
                        }
                    })
            } else {
                removeListener(clickButtonListener, listenerName)
            }
            // clickButton("score")
        },
    }
}
var followuser = new FollowUserClass();

function StandForPuzzle() {
    var standForObj = {};
    return {
        add: function (puzzleid, objname, action, npcname) {
            standForObj[puzzleid] = {
                "objname": objname,
                "action": action,
                "npcname": npcname,
            };
            this.scan()
        },
        remove: function (puzzleid) {
            delete standForObj[puzzleid]
        },
        stand: function (c) {
            var type = c.get("type"),
                subType = c.get("subtype");
            if (type != "jh") {
                return
            }
            if (subType != "new_item" && subType != "new_npc") {
                return
            }
            var name = ansi_up.ansi_to_text(c.get("name")),
                id = c.get("id");
            if (subType == "new_item") {
                for (var key in standForObj) {
                    if (standForObj[key].objname == name) {
                        clickButton("get " + id)
                    } else {
                        if (standForObj[key].action == "killget" && (standForObj[key].npcname + "的屍體" == name || name == "腐爛的屍體" || name == "一具枯乾的骸骨")) {
                            clickButton("get " + id)
                        }
                    }
                }
            } else {
                if (subType == "new_npc") {
                    for (var key in standForObj) {
                        if (standForObj[key].objname == name || standForObj[key].npcname == name) {
                            if (standForObj[key].action == "killget") {
                                window.singleBattleTrigger = 1;
                                window.singleBattleInstance = new window.singleBattle();
                                clickButton("kill " + id)
                            } else {
                                clickButton(standForObj[key].action + " " + id);
                                if (standForObj[key].action == "npc_datan" || standForObj[key].action == "ask" || standForObj[key].action == "give") {
                                    this.remove(key)
                                }
                            }
                        }
                    }
                }
            }
        },
        scan: function () {
            var msg_room = g_obj_map.get("msg_room");
            for (var key in standForObj) {
                if (standForObj[key].action == "killget" || standForObj[key].action == "get") {
                    for (var i = 1; i <= msg_room.size(); i++) {
                        var objkey = "item" + i;
                        if (msg_room.containsKey(objkey)) {
                            var name = ansi_up.ansi_to_text(msg_room.get(objkey).split(",")[1]);
                            if (name == "") {
                                continue
                            }
                            var id = msg_room.get(objkey).split(",")[0];
                            if (name == standForObj[key].objname) {
                                clickButton("get " + id)
                            } else {
                                if (standForObj[key].action == "killget" && (name == standForObj[key].npcname + "的屍體" || name == "腐爛的屍體" || name == "一具枯乾的骸骨")) {
                                    clickButton("get " + id)
                                }
                            }
                        } else {
                            break
                        }
                    }
                }
                if (standForObj[key].action != "get") {
                    for (var i = 1; i <= msg_room.size(); i++) {
                        var objkey = "npc" + i;
                        if (msg_room.containsKey(objkey)) {
                            var name = ansi_up.ansi_to_text(msg_room.get(objkey).split(",")[1]);
                            if (name == "") {
                                continue
                            }
                            var id = msg_room.get(objkey).split(",")[0];
                            if (name == standForObj[key].npcname || name == standForObj[key].objname) {
                                if (standForObj[key].action == "killget") {
                                    window.singleBattleTrigger = 1;
                                    window.singleBattleInstance = new window.singleBattle();
                                    clickButton("kill " + id)
                                } else {
                                    clickButton(standForObj[key].action + " " + id)
                                }
                            }
                            if (standForObj[key].action == "npc_datan" || standForObj[key].action == "ask" || standForObj[key].action == "give") {
                                this.remove(key)
                            }
                        } else {
                            break
                        }
                    }
                }
            }
        },
        isstanding: function () {
            return !$.isEmptyObject(standForObj)
        },
        endstandingGet: function (str) {
            for (var key in standForObj) {
                if ((standForObj[key].action == "killget" || standForObj[key].action == "get") && str.indexOf(standForObj[key].objname) > -1) {
                    this.remove(key)
                }
            }
        },
        endstandingKill: function () {
            if (!g_obj_map.containsKey("msg_vs_info")) {
                return
            }
            for (var key in standForObj) {
                if (standForObj[key].action == "kill" || standForObj[key].action == "fight") {
                    for (var i = 1; i <= +g_obj_map.get("msg_vs_info").get("max_vs"); i++) {
                        if (g_obj_map.get("msg_vs_info").containsKey("vs2_name" + i) && ansi_up.ansi_to_text(g_obj_map.get("msg_vs_info").get("vs2_name" + i)) == standForObj[key].objname) {
                            this.remove(key)
                        }
                    }
                }
            }
        },
        getaction: function (puzzleid) {
            return (puzzleid in standForObj) ? standForObj[puzzleid].action : ""
        }
    }
}
function AutoPuzzle() {
    puzzleList = {};
    puzzleWating = {};
    return {
        puzzleList: puzzleList,
        puzzleWating: {},
        analyzePuzzle: function (puzzle) {
            var puzzleid = "";
            var publisherName = "";
            var targetName = "";
            var publisherResult = /<a[^>]*find_task_road2 [^>]*>((?!<a[^>]*>).)+<\/a>/.exec(puzzle);
            if (publisherResult && publisherResult.length > 0) {
                publisherName = publisherResult[0].replace(/<\/?a[^>]*>/g, "");
                if (publisherName.indexOf("-") > -1) {
                    publisherName = publisherName.split("-")[1]
                }
                publisherName = publisherName.replace(//g, "").replace(/^<\/span>/, "");
                var result1 = /find_task_road2 [^>^']*/.exec(publisherResult[0]);
                puzzleid = result1[0].replace(/find_task_road2 /g, "")
            }
            var targetResult = puzzle.match(/<a[^>]*find_task_road [^>]*>((?!<a[^>]*>).)+<\/a>/g);
            if (targetResult && targetResult.length > 0) {
                var targetInfoIndex = 0;
                if (/搶走了，去替我要回來吧！/.test(puzzle)) {
                    targetInfoIndex = targetResult.length - 1
                }
                targetName = targetResult[targetInfoIndex].replace(/<\/?a[^>]*>/g, "");
                if (targetName.indexOf("-") > -1) {
                    targetName = targetName.split("-")[1]
                }
                targetName = targetName.replace(//g, "").replace(/^<\/span>/, "");
                if (!puzzleid) {
                    var result1 = /find_task_road [^>^']*/.exec(targetResult[targetInfoIndex]);
                    puzzleid = result1[0].replace(/find_task_road /g, "")
                }
            }
            if (!puzzleid) {
                return ""
            }
            if (puzzleid in this.puzzleList) {
                $.extend(this.puzzleList[puzzleid], {
                    puzzle: puzzle,
                    publisherName: publisherName,
                    targetName: targetName,
                })
            } else {
                this.puzzleList[puzzleid] = {
                    puzzle: puzzle,
                    publisherName: publisherName,
                    targetName: targetName,
                    firstPublisherName: publisherName,
                    firstStep: puzzle.replace(/<[^>]*>/g, ""),
                    publisherMap: g_obj_map.get("msg_room").get("map_id"),
                    publisherRoom: g_obj_map.get("msg_room").get("short")
                }
            }
            return puzzleid
        },
        startpuzzle: function (puzzleid) {
            var puzzle = this.puzzleList[puzzleid].puzzle;
            if (/看上去好生奇怪，/.test(puzzle) || /鬼鬼祟祟的叫人生疑，/.test(puzzle)) {
                this.puzzleWating = {
                    puzzleid: puzzleid,
                    action: "npc_datan",
                    actionCode: "npc_datan",
                    target: window.puzzleList[puzzleid].targetName,
                    status: "start",
                }
            } else {
                if (/你一番打探，果然找到了一些線索，回去告訴/.test(puzzle) || /你一番搜索，果然找到了，回去告訴/.test(puzzle) || /好，我知道了。你回去轉告/.test(puzzle) || /老老實實將東西交了出來，現在可以回去找/.test(puzzle) || /好，好，好，我知錯了……你回去轉告/.test(puzzle) || /腳一蹬，死了。現在可以回去找/.test(puzzle)) {
                    this.puzzleWating = {
                        puzzleid: puzzleid,
                        action: "answer",
                        actionCode: "ask",
                        target: window.puzzleList[puzzleid].publisherName,
                        status: "start"
                    }
                } else {
                    if (/我想找/.test(puzzle) || /我有個事情想找/.test(puzzle)) {
                        this.puzzleWating = {
                            puzzleid: puzzleid,
                            action: "ask",
                            actionCode: "ask",
                            target: window.puzzleList[puzzleid].targetName,
                            status: "start"
                        }
                    } else {
                        if (/我十分討厭那/.test(puzzle) || /好大膽，竟敢拿走了我的/.test(puzzle) || /竟敢得罪我/.test(puzzle) || /搶走了，去替我要回來吧！/.test(puzzle) || /十分囂張，去讓[他她]見識見識厲害！/.test(puzzle)) {
                            this.puzzleWating = {
                                puzzleid: puzzleid,
                                action: "fight",
                                actionCode: "fight",
                                target: window.puzzleList[puzzleid].targetName,
                                status: "start"
                            }
                        } else {
                            if (/上次我不小心，竟然吃了/.test(puzzle) || /竟對我橫眉瞪眼的，真想殺掉[他她]！/.test(puzzle) || /昨天撿到了我幾十輛銀子，拒不歸還。錢是小事，但人品可不好。/.test(puzzle)) {
                                this.puzzleWating = {
                                    puzzleid: puzzleid,
                                    action: "kill",
                                    actionCode: "kill",
                                    target: window.puzzleList[puzzleid].targetName,
                                    status: "start"
                                }
                            } else {
                                if (/突然想要一/.test(puzzle) || /唉，好想要一/.test(puzzle)) {
                                    this.puzzleWating = {
                                        puzzleid: puzzleid,
                                        action: "get",
                                        actionCode: "get",
                                        target: window.puzzleList[puzzleid].targetName,
                                        status: "start",
                                    }
                                } else {
                                    if (/可前去尋找/.test(puzzle)) {
                                        this.puzzleWating = {
                                            puzzleid: puzzleid,
                                            action: "room_sousuo",
                                            actionCode: "room_sousuo",
                                            target: "",
                                            status: "start"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            this.gotoPuzzle(puzzleid)
        },
        gotoPuzzle: function (puzzleid) {
            if (puzzleid != this.puzzleWating.puzzleid) {
                return
            }
            var that = this;
            switch (this.puzzleWating.action) {
                case "npc_datan":
                case "ask":
                case "fight":
                case "kill":
                case "room_sousuo":
                    this.puzzleWating.status = "trace";
                    go1("find_task_road " + puzzleid);
                    break;
                case "get":
                    if (g_obj_map.get("msg_room").get("map_id") == this.puzzleList[puzzleid].publisherMap && g_obj_map.get("msg_room").get("short") == this.puzzleList[puzzleid].publisherRoom) {
                        var npc = g_obj_map.get("msg_room").elements.filter(function (item) {
                            return item.key.indexOf("npc") == 0 && that.ansiToHtml(item.value.split(",")[1]) == that.puzzleList[puzzleid].publisherName
                        });
                        if (npc.length > 0) {
                            this.puzzleWating.waitTimer = setTimeout(function () {
                                that.puzzleWating.status = "trace";
                                go1("find_task_road " + puzzleid)
                            },
                                2000);
                            this.puzzleWating.status = "give";
                            var npcArr = {};
                            for (var i = 0; i < npc.length; i++) {
                                var npcinfo = npc[i].value.split(",");
                                npcArr[npcinfo[0]] = npc[i]
                            }
                            this.puzzleWating.waitCount = 0;
                            for (var npcid in npcArr) {
                                go1("give " + npc[0].value.split(",")[0]);
                                this.puzzleWating.waitCount++
                            }
                            return
                        }
                    }
                    this.puzzleWating.status = "trace";
                    go1("find_task_road " + puzzleid);
                    break;
                case "answer":
                    this.puzzleWating.status = "trace";
                    go1("find_task_road2 " + puzzleid);
                    break
            }
        },
        doPuzzle: function (puzzleid) {
            if (puzzleid != this.puzzleWating.puzzleid) {
                return
            }
            var that = this;
            switch (this.puzzleWating.action) {
                case "npc_datan":
                case "answer":
                case "ask":
                case "fight":
                case "kill":
                    that.puzzleWating.status = "wait";
                    var npcs = g_obj_map.get("msg_room").elements.filter(function (item) {
                        return item.key.indexOf("npc") == 0 && that.ansiToHtml(item.value.split(",")[1]) == that.puzzleWating.target
                    });
                    if (npcs.length > 0) {
                        var distinctNpcs = {};
                        for (var i = 0; i < npcs.length; i++) {
                            distinctNpcs[npcs[i].value.split(",")[0]] = 1
                        }
                        if (this.puzzleWating.action == "fight") {
                            for (var npcid in distinctNpcs) {
                                go1("fight " + npcid);
                                go1("kill " + npcid)
                            }
                        } else {
                            for (var npcid in distinctNpcs) {
                                go1(this.puzzleWating.actionCode + " " + npcid)
                            }
                        }
                    }
                    break;
                case "get":
                    if (that.puzzleWating.status == "traced") {
                        that.puzzleWating.status = "wait";
                        var objs = g_obj_map.get("msg_room").elements.filter(function (item) {
                            return item.key.indexOf("item") == 0 && that.ansiToHtml(item.value.split(",")[1]) == that.puzzleWating.target
                        });
                        if (objs.length > 0) {
                            for (var index in objs) {
                                go1("get " + objs[index].value.split(",")[0])
                            }
                        } else {
                            var npcs = g_obj_map.get("msg_room").elements.filter(function (item) {
                                return item.key.indexOf("npc") == 0 && !isNaN(item.key.replace("npc", "")) && item.value.indexOf("金甲符兵") == -1 && item.value.indexOf("玄陰符兵") == -1
                            });
                            that.lookNpcForBuy(npcs,
                                function () {
                                    that.puzzleWating.status = "return";
                                    go1("find_task_road2 " + puzzleid)
                                },
                                function () {
                                    npcs = g_obj_map.get("msg_room").elements.filter(function (item) {
                                        return item.key.indexOf("npc") == 0 && !isNaN(item.key.replace("npc", "")) && item.value.indexOf("金甲符兵") == -1 && item.value.indexOf("玄陰符兵") == -1
                                    });
                                    that.lookNpcForKillGet(npcs)
                                })
                        }
                    } else {
                        if (that.puzzleWating.status == "returned") {
                            var npcs = g_obj_map.get("msg_room").elements.filter(function (item) {
                                return item.key.indexOf("npc") == 0 && that.ansiToHtml(item.value.split(",")[1]) == that.puzzleWating.target
                            });
                            if (npcs.length > 0) {
                                for (var index in npcs) {
                                    if (npcs[index].value) go1("give " + npcs[index].value.split(",")[0])
                                }
                            }
                        }
                    }
                    break;
                case "room_sousuo":
                    go1("room_sousuo");
                    break
            }
        },
        lookNpcForBuy: function (npcs, foundcallback, notfoundcallback) {
            if (this.puzzleWating.actionCode != "get") {
                return
            }
            if (npcs.length > 0) {
                var that = this;
                var npc = npcs.shift();
                var npcid = npc.value.split(",")[0];
                go1("look_npc " + npcid);
                setTimeout(function () {
                    that.getNpcInfoForBuy(npcid, npcs, foundcallback, notfoundcallback)
                },
                    200)
            } else {
                if (notfoundcallback) {
                    notfoundcallback()
                }
            }
        },
        getNpcInfoForBuy: function (npcid, othernpcs, foundcallback, notfoundcallback) {
            if (this.puzzleWating.actionCode != "get") {
                return
            }
            var that = this;
            if (!g_obj_map.get("msg_npc") || g_obj_map.get("msg_npc").get("id") != npcid) {
                setTimeout(function () {
                    that.getNpcInfoForBuy(npcid, othernpcs, foundcallback, notfoundcallback)
                },
                    200);
                return
            }
            cmds = g_obj_map.get("msg_npc").elements.filter(function (item) {
                return item.value == "購買"
            });
            if (cmds.length > 0) {
                go1("buy " + npcid);
                setTimeout(function () {
                    that.getNpcBuyInfo(npcid, othernpcs, foundcallback, notfoundcallback)
                },
                    200)
            } else {
                if (othernpcs.length > 0) {
                    var npc = othernpcs.shift();
                    var npcid = npc.value.split(",")[0];
                    go1("look_npc " + npcid);
                    setTimeout(function () {
                        that.getNpcInfoForBuy(npcid, othernpcs, foundcallback, notfoundcallback)
                    }, 200)
                } else {
                    if (notfoundcallback) {
                        notfoundcallback()
                    }
                }
            }
        },
        getNpcBuyInfo: function (npcid, othernpcs, foundcallback, notfoundcallback) {
            if (this.puzzleWating.actionCode != "get") {
                return
            }
            var that = this;
            if (!g_obj_map.get("msg_buys") || g_obj_map.get("msg_buys").get("npcid") != npcid) {
                setTimeout(function () {
                    that.getNpcBuyInfo(npcid, othernpcs, foundcallback, notfoundcallback)
                },
                    200);
                return
            }
            var buyitems = g_obj_map.get("msg_buys").elements.filter(function (item) {
                return item.key.indexOf("item") == 0 && that.ansiToHtml(item.value.split(",")[1]) == that.puzzleWating.target
            });
            if (buyitems.length > 0) {
                for (var i = 0; i < buyitems.length; i++) {
                    go1("buy " + buyitems[i].value.split(",")[0] + " from " + npcid)
                }
                if (foundcallback) {
                    foundcallback()
                }
            } else {
                if (othernpcs.length > 0) {
                    var npc = othernpcs.shift();
                    var npcid = npc.value.split(",")[0];
                    go1("look_npc " + npcid);
                    setTimeout(function () {
                        that.getNpcInfoForBuy(npcid, othernpcs, foundcallback, notfoundcallback)
                    },
                        200)
                } else {
                    if (notfoundcallback) {
                        notfoundcallback()
                    }
                }
            }
        },
        lookNpcForKillGet: function (npcs, foundcallback, notfoundcallback) {
            if (this.puzzleWating.actionCode != "get") {
                return
            }
            if (npcs.length > 0) {
                var that = this;
                var npc = npcs.shift();
                var npcid = npc.value.split(",")[0];
                go1("look_npc " + npcid);
                setTimeout(function () {
                    that.getNpcInfoForKillGet(npcid, npcs, foundcallback, notfoundcallback)
                },
                    200)
            } else {
                if (notfoundcallback) {
                    notfoundcallback()
                }
            }
        },
        getNpcInfoForKillGet: function (npcid, othernpcs, foundcallback, notfoundcallback) {
            if (this.puzzleWating.actionCode != "get") {
                return
            }
            var that = this;
            if (!g_obj_map.get("msg_npc") || g_obj_map.get("msg_npc").get("id") != npcid) {
                setTimeout(function () {
                    that.getNpcInfoForKillGet(npcid, othernpcs, foundcallback, notfoundcallback)
                },
                    200);
                return
            }
            cmds = g_obj_map.get("msg_npc").elements.filter(function (item) {
                return item.value == "殺死"
            });
            if (cmds.length > 0 && g_obj_map.get("msg_npc").get("long").indexOf(that.puzzleWating.target) > -1) {
                that.puzzleWating.waitTarget = npcid;
                go1("kill " + npcid);
                if (foundcallback) {
                    foundcallback()
                }
            } else {
                if (othernpcs.length > 0) {
                    var npc = othernpcs.shift();
                    var npcid = npc.value.split(",")[0];
                    go1("look_npc " + npcid);
                    setTimeout(function () {
                        that.getNpcInfoForKillGet(npcid, othernpcs, foundcallback, notfoundcallback)
                    },
                        200)
                } else {
                    if (notfoundcallback) {
                        notfoundcallback()
                    }
                }
            }
        },
        puzzlekillget: function () {
            var npcname = prompt("請輸入要殺的npc名稱", "");
            if (npcname) {
                this.puzzleWating.actionCode = "killget";
                this.puzzleWating.waitTargetName = npcname
            }
        },
        ansiToHtml: function (str) {
            return ansi_up.ansi_to_html(str).replace(//g, "")
        },
        puzzlesubmit: function (puzzleid) {
            var serverurl = "http://www.11for.cn:8100/home/log";
            var mapList = {
                "snow": "雪亭鎮",
                "luoyang": "洛陽",
                "huashancun": "華山村",
                "huashan": "華山",
                "yangzhou": "揚州",
                "gaibang": "丐幫",
                "choyin": "喬陰縣",
                "emei": "峨眉山",
                "henshan": "恒山",
                "wudang": "武當山",
                "latemoon": "晚月莊",
                "waterfog": "水煙閣",
                "shaolin": "少林寺",
                "tangmen": "唐門",
                "qingcheng": "青城山",
                "xiaoyao": "逍遙林",
                "kaifeng": "開封",
                "mingjiao": "光明頂",
                "quanzhen": "全真教",
                "gumu": "古墓",
                "baituo": "白馱山",
                "songshan": "嵩山",
                "meizhuang": "寒梅莊",
                "taishan": "泰山",
                "tieflag": "大旗門",
                "guanwai": "大昭寺",
                "heimuya": "魔教",
                "xingxiu": "星宿海",
                "taoguan": "茅山",
                "taohua": "桃花島",
                "resort": "鐵雪山莊",
                "murong": "慕容山莊",
                "dali": "大理",
                "duanjian": "斷劍山莊",
                "binghuo": "冰火島",
                "xiakedao": "俠客島",
                "jueqinggu": "絕情谷",
                "bihaishanzhuang": "碧海山莊",
                "tianshan": "天山",
                "miaojiang": "苗疆",
                "baidicheng": "白帝城",
                "mojiajiguancheng": "墨家機關城",
                "yanyuecheng": "掩月城",
                "haiyunge": "海雲閣",
                "beiyinxiang": "洛陽",
                "yingoudufang": "洛陽",
                "baizhong": "洛陽",
                "tudimiao": "華山村",
                "qingfengzhai": "華山村",
                "tianshengxia": "華山",
                "luoyanya": "華山",
                "wuqiku": "華山",
                "wuguan": "揚州",
                "yangzhouguanya": "揚州",
                "zuixianlou": "揚州",
                "zizhiyu": "恒山",
                "qinqitai": "恒山",
                "luohantang": "少林寺",
                "banruotang": "少林寺",
                "yezhulin": "開封",
                "yuwangtai": "開封",
                "moyundong": "嵩山",
                "jishanlvgu": "嵩山",
                "xinglinxiaoyuan": "寒梅莊",
                "hudidinao": "寒梅莊",
                "heilongtan": "泰山",
                "tianshengzhai": "泰山",
                "yuhuangding": "泰山",
            };
            var mapname = mapList[this.puzzleList[puzzleid].publisherMap] ? mapList[this.puzzleList[puzzleid].publisherMap] : this.puzzleList[puzzleid].publisherMap;
            var value = this.puzzleList[puzzleid].prize + "\n位置：" + mapname + "-" + ansi_up.ansi_to_html(this.puzzleList[puzzleid].publisherRoom).replace(/<[^>]*>/g, "") + "\n首步：" + this.puzzleList[puzzleid].firstStep;
            // console.log(value);
            $.post(serverurl, {
                value: value
            })
        }
    }
}
newoverrideclick();
function Qiang() {
    this.dispatchMessage = function (b) {
        var type = b.get("type"),
            subType = b.get("subtype");
        if (type == "jh" && subType == "new_item") {
            clickButton("get " + b.get("id"))
        }
    }
}
var qiang = new Qiang;
// var lingshi = new Lingshi();
// window.gameOption = {LingshiSwitch: false};
// setTimeout(function () {
//     if (gameOption && gameOption.LingshiSwitch) {
//         lingshi.init()
//     }
// },3000);
function GoSlowAction(cmds) {
    if (cmds.length <= 0) {
        return
    }
    if (!hasGoToEnd()) {
        setTimeout(function () {
            GoSlowAction(cmds)
        },
            200);
        return
    }
    var cmd = cmds.shift();
    if (cmd == "delay") {
        setTimeout(function () {
            GoSlowAction(cmds)
        },
            200);
        return
    }
    go(cmd);
    setTimeout(function () {
        GoSlowAction(cmds)
    },
        200)
}
function openXiang(obj, obj1) {
    var items = g_obj_map.get("msg_items").elements.filter(function (item) {
        return item.key.indexOf("items") > -1
    });
    var cmds = [];
    var itemId = null;
    var itemName = null;
    var itemNums = 0;
    var itemNums0 = 0;

    var itemId1 = null;
    var itemName1 = null;
    var itemNums1 = 0;

    for (var i = 0; i < items.length; i++) {
        var id = items[i].value.split(",")[0];
        var name = items[i].value.split(",")[1];
        var nums = items[i].value.split(",")[2];
        var txt = g_simul_efun.replaceControlCharBlank(
            name.replace(/\u0003.*?\u0003/g, "")
        );
        if (txt.indexOf(obj) != '-1') {
            itemId = id;
            itemName = txt;
            itemNums = nums;
            break;
        }
    }
    itemNums0 = itemNums;
    if (obj1) {
        for (var i = 0; i < items.length; i++) {
            var id = items[i].value.split(",")[0];
            var name = items[i].value.split(",")[1];
            var nums = items[i].value.split(",")[2];
            var txt = g_simul_efun.replaceControlCharBlank(
                name.replace(/\u0003.*?\u0003/g, "")
            );
            // console.log(id + '----' + txt)
            if (txt.indexOf(obj1) != '-1') {
                itemId1 = id;
                itemName1 = txt;
                itemNums1 = nums;
                break;
            }
        }
        if (itemNums1) {
            if (itemNums1 * 1 > itemNums * 1) {
                itemNums0 = itemNums;
            } else {
                itemNums0 = itemNums1;
            }
            openXiangCode(itemId, itemNums0)
        }
    } else {
        openXiangCode(itemId, itemNums0)
    }
    // if (cmds.length > 0) {
    //     GoSlowAction(cmds)
    // }
}
function openXiangCode(id, num) {
    console.log(id + '--' + num);
    go('items use ' + id + "_N_" + num);

    //clickButton(\'items use ' + item.get("id") + "_N_" + item.get("amount") + '\', 1)
    //clickButton('items use obj_yaoyubaoxiang', 0)
}
window.spliteALlItem = function (text) {
    var itemArr = text.split(',');
    var id = itemArr[0];
    var amount = itemArr[1];
    if (amount > 100) {
        var useTimes = amount / 100;
        var useLeast = amount % 100;
        useTimes = parseInt(useTimes);
        for (var i = 0; i < useTimes; i++) {
            go('items splite ' + id + '_N_100');
        }
        if (useLeast > 0) {
            go('items splite ' + id + '_N_' + useLeast);
        }
    } else {
        clickButton('items splite ' + id + '_N_' + amount);
    }
    // 'onclick="clickButton(\'items use ' + item.get("id") + "_N_" + item.get("amount") + '\', 1)"'
};
window.userALlItem = function (text) {
    var itemArr = text.split(',');
    var id = itemArr[0];
    var amount = itemArr[1];
	userALlItem_id = id;
	userALlItem_amount = amount;
	if (amount > 1000) {
		var useTimes = amount / 1000;
		var useLeast = amount % 1000;
		useTimes = parseInt(useTimes);
		for (var i = 0; i < useTimes; i++) {
			go('items use ' + id + '_N_1000');
		}
		if (useLeast > 0) {
			go('items use ' + id + '_N_' + useLeast);
		}
	} else {
		clickButton('items use ' + id + '_N_' + amount);
	}
	// 'onclick="clickButton(\'items use ' + item.get("id") + "_N_" + item.get("amount") + '\', 1)"'
    
};
window.mokeALlItem = function (text) {
    var itemArr = text.split(',');
    var id = itemArr[0];
    var amount = itemArr[1];

    for (var i = 0; i < amount; i++) {
        go('moke ' + id);
    }

    // 'onclick="clickButton(\'items use ' + item.get("id") + "_N_" + item.get("amount") + '\', 1)"'
};

window.autolearnSkill = function (text) {
	var item = g_obj_map.get("msg_master_skills");
	var npc = item.get('id');
	var arry = [];
    for (var i = 0; i < item.size(); i++) {
		if (item.containsKey("skill" + i)) {
			arry.push(item.get('skill' + i).split(',')[0]);
			continue
		}
	}
	console.log('學習紀錄: ' + item.get('uname'));
	console.log(arry);
	for (var i = 0; i < arry.length; i++) {
		go('skills info ' + npc + ' ' + arry[i], function() {
			var imt = g_obj_map.get("msg_skill");
			var mylvl = parseInt(imt.get('my_lvl'));
			var tolvl = parseInt(imt.get('lvl'));
			console.log(imt.get('name') + '(' + mylvl + '/' + tolvl + ')')
			if (mylvl < tolvl) {
				var count = tolvl - mylvl
				console.log('學習: ' + imt.get('name') + ' ' + count + '次')
				var count = Math.ceil(count / 10)
				for (var ii = 0; ii < count; ii++) {
					go(imt.get('cmd2'));
				}
			}
		});
	}
	go('prev');
};

window.learnSkill = function (text) {
    var itemArr = text.split(',');
    var cmd = itemArr[0];
    var mylvl = parseInt(itemArr[1]);
    var tolvl = parseInt(itemArr[2]);
	var count = Math.ceil((tolvl - mylvl) / 10)
	if (count > 0) {
		for (var i = 0; i < count; i++) {
			go(cmd);
		}
	} else {
		go(cmd);
	}
};

window.chuaimoSkill = function (text) {
    var itemArr = text.split(',');
    var id = itemArr[0];
    var lvl = parseInt(itemArr[1]);
	var count = 600 - lvl;
	if (count > 0) {
		go('enable ' + id);
		for (var i = 0; i < count; i++) {
			go('chuaimo go,' + id);
		}
	} else {
		go('chuaimo go,' + id);
	}
};

window.tupoSkill = function (text) {
    var itemArr = text.split(',');
    var id = itemArr[0];
	go('enable ' + id);
	go('tupo go,' + id);
	tupoTimer = setInterval(function() {
		go('event_1_66830905 ' + id + ' go')
	}, 300);
};

var url = 'http://47.94.105.83:9099/test';	//服務器地址

var version = 't3.1.87-200120';
function clearTrigger() {
    TriggerFuc = function () { }
}
var _$ = function (url, param, fun = function () { }, errorFun = function () { }) {
    param.version = version;
    $.ajax({
        type: "post",
        url: url,
        // timeout:2000,
        data: param,
        cache: false,
        dataType: 'jsonp',
        jsonp: 'jsonpCallback',
        tryCount: 0,
        retryLimit: 3,
        success: function (data) {
            if (data != null) {
                if (data.code != 200) {
                    InforOutFunc(data.msg);
                    //return;
                }
                fun(data);
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log(textStatus + ' --- ' + errorThrown);
            console.log(XMLHttpRequest);
            this.tryCount++;
            errorFun();
            return;
            if (this.tryCount <= this.retryLimit) {
                //try again
                $.ajax(this);
                return;
            }
        }
    });
};
// 答題
function answerQuestions21() {
    if (answerTrigger == 0) return;
    TriggerFuc = function (b) {
        var type = b.get('type');
        var ll, l;
        if (type == 'show_html_page') {
            var msg = b.get('msg');
            if (msg.indexOf('回答正確') > -1) {
                clearTrigger();
                setTimeout(answerQuestions, cmdDelayTime);
                return;
            } else if (msg.indexOf('回答錯誤') > -1) {
                clearTrigger();
                InforOutFunc('回答錯誤');
                setTimeout(answerQuestions, 300);
                return;
            }
            l = msg.split(/\n/g);
            if (l.length > 2 && l[0].match(/知識問答第 (.*)\/(.*) 題<\/p>/)) {
                var question = g_simul_efun.replaceControlCharBlank(l[1]);
                if (question.trim() == '')
                    question = g_simul_efun.replaceControlCharBlank(l[2]);
                var param = {
                    types: 'answerQuestion',
                    question: question,
                    userID: g_obj_map.get("msg_attrs").get('id'),
                    qu: g_area_id,
                };
                _$(url, param, function (data) {
                    var aswdata = data.data;
                    if (!aswdata) {
                        InforOutFunc('沒有找到答案！！');
                        return;
                    }
                    clickButton('question ' + aswdata);
                }, function () {
                    InforOutFunc('沒有找到答案！！');
                });
            }
        } else if (type == 'notice' && b.get('msg').indexOf('每日武林知識問答次數已經達到限額') > -1) {
            console.log('完成自動答題！');
            clearTrigger();
            answerTrigger = 0;
            $('#btno4').trigger('click');
            return;
        }
    };
    clickButton('question')
}


var TriggerFuc = function () { };

function questionFn1() {
    window.go1 = function (dir) {
        dir = $.trim(dir);
        if (dir.indexOf("cus|") == 0) {
            var dirarr = dir.split("|");
            switch (dirarr[1]) {
                case "talk":
                    talkparamarr = dirarr[2].split(",");
                    custalkQX(talkparamarr[0], talkparamarr[1]);
                    return;
                case "playCustomSkill_0":
                    customSkillClass.playCustomSkill(0);
                    return;
                case "playCustomSkill_1":
                    customSkillClass.playCustomSkill(1);
                    return;
                case "setCustomSkill_0":
                    customSkillClass.setCustomSkill(0);
                    return;
                case "setCustomSkill_1":
                    customSkillClass.setCustomSkill(1);
                    return;
                case "setCustomSkillName_0":
                    customSkillClass.setCustomSkillName(0);
                    return;
                case "setCustomSkillName_1":
                    customSkillClass.setCustomSkillName(1);
                    return;
                case "standforpuzzle":
                    var npcname = "";
                    if (dirarr[4] == "killget") {
                        npcname = prompt("請輸入要殺的npc名稱", "");
                        if (npcname == "") {
                            return
                        }
                    }
                    standForPuzzle.add(dirarr[2], dirarr[3], dirarr[4], npcname);
                    return;
                case "follow":
                    var username = dirarr[2];
                    followuser.follow(username);
                    return;
                case "leader":
                    var tobeleader = dirarr[2];
                    followuser.toBeLeader(tobeleader == "1");
                    return;
                case "startpuzzle":
                    var puzzleid = dirarr[2];
                    autoPuzzle.startpuzzle(puzzleid);
                    return;
                case "puzzlekillget":
                    autoPuzzle.puzzlekillget();
                    return;
                case "puzzlesubmit":
                    autoPuzzle.puzzlesubmit(dirarr[2]);
                    return;
                case "vipclick":
                    shimenvipFunc()
            }
        }
        var d = dir.split(";");
        for (var i = 0; i < d.length; i++) {
            overrideclick(d[i], 0)
        }
    };
    window.singleBattleTrigger = 0;
    window.singleBattleInstance = null;
    window.singleBattle = function (callback) {
        this.timer = null;
        this.callback = callback;
        this.dispatchMessage = function (b) {
            var type = b.get("type"),
                subType = b.get("subtype");
            if ((type == "vs" && subType == "vs_info") || (this.timer == null && is_fighting)) {
                neigongPlayCount = 0;
                clearInterval(this.timer);
                // setTimeout(autoSkill, 500);
                // this.timer = setInterval(autoSkill, 1000)
            } else {
                if ((type == "vs" && subType == "combat_result") || (this.timer != null && !is_fighting)) {
                    window.singleBattleTrigger = 0;
                    clearInterval(this.timer);
                    this.timer = null;
                    if (callback) {
                        callback()
                    }
                }
            }
        }
    };
    window.hasGoToEnd = function () {
        return cmdlist.length <= 0 && $("#img_loading:visible").length == 0
    };

    var old_adjustLayout = g_gmain.adjustLayout;
    g_gmain.adjustLayout = function () {
        old_adjustLayout();
        g_gmain.notifyEndTop = 0;
        g_gmain.notifyStartTop = 50
    };

    jh = function (w) {
        if (w == "xt") {
            w = 1
        }
        if (w == "ly") {
            w = 2
        }
        if (w == "hsc") {
            w = 3
        }
        if (w == "hs") {
            w = 4
        }
        if (w == "yz") {
            w = 5
        }
        if (w == "gb") {
            w = 6
        }
        if (w == "qy") {
            w = 7
        }
        if (w == "em") {
            w = 8
        }
        if (w == "hs2") {
            w = 9
        }
        if (w == "wd") {
            w = 10
        }
        if (w == "wy") {
            w = 11
        }
        if (w == "sy") {
            w = 12
        }
        if (w == "sl") {
            w = 13
        }
        if (w == "tm") {
            w = 14
        }
        if (w == "qc") {
            w = 15
        }
        if (w == "xx") {
            w = 16
        }
        if (w == "kf") {
            w = 17
        }
        if (w == "gmd") {
            w = 18
        }
        if (w == "qz") {
            w = 19
        }
        if (w == "gm") {
            w = 20
        }
        if (w == "bt") {
            w = 21
        }
        if (w == "ss") {
            w = 22
        }
        if (w == "mz") {
            w = 23
        }
        if (w == "ts") {
            w = 24
        }
        overrideclick("jh " + w, 0)
    };
    window.game = this;
    window.attach = function () {
        window.oldWriteToScreen = window.writeToScreen;
        window.writeToScreen = function (a, e, f, g) {
            if (!window.definedAutoPuzzle && e == 2 && a.indexOf("find_task_road") > -1) {
                a = a.replace(/find_task_road3/g, "find_task_road2");
                var puzzleItems = a.split("<br/><br/>");
                for (var i = 0; i < puzzleItems.length; i++) {
                    var result = /<a[^>]*find_task_road [^>]*>.*<\/a>/.exec(puzzleItems[i]);
                    if (result && result.length > 0) {
                        var objname = result[0].replace(/<[^>]*>/g, "");
                        if (objname.indexOf("-") > -1) {
                            objname = objname.split("-")[1];
                            objname = ansi_up.ansi_to_text(objname)
                        }
                    } else {
                        continue
                    }
                    var result2 = /<a[^>]*find_task_road2 [^>]*>.*<\/a>/.exec(puzzleItems[i]);
                    if (result2 && result2.length > 0) {
                        var oldobjname = result2[0].replace(/<[^>]*>/g, "");
                        if (oldobjname.indexOf("-") > -1) {
                            oldobjname = oldobjname.split("-")[1];
                            oldobjname = ansi_up.ansi_to_text(oldobjname)
                        }
                    }
                    var result1 = /find_task_road [^>^']*/.exec(puzzleItems[i]);
                    if (!result1 || result1.length == 0) {
                        continue
                    }
                    var puzzleid = result1[0].replace(/find_task_road /g, "");
                    var curpuzzleaction = standForPuzzle.getaction(puzzleid);
                    if (/看上去好生奇怪，/.test(puzzleItems[i]) || /鬼鬼祟祟的叫人生疑，/.test(puzzleItems[i])) {
                        puzzleItems[i] += "<a style='color:green' href=\"javascript:go1('cus|standforpuzzle|" + puzzleid + "|" + objname + "|npc_datan', 0);go1('task_quest')\">[打探" + (curpuzzleaction == "" ? "" : "中") + "]</a>"
                    } else {
                        if (/你一番打探，果然找到了一些線索，回去告訴/.test(puzzleItems[i]) || /我想找/.test(puzzleItems[i]) || /好，我知道了。你回去轉告/.test(puzzleItems[i]) || /我有個事情想找/.test(puzzleItems[i]) || /老老實實將東西交了出來，現在可以回去找/.test(puzzleItems[i]) || /腳一蹬，死了。現在可以回去找/.test(puzzleItems[i])) {
                            puzzleItems[i] += "<a style='color:green' href=\"javascript:go1('cus|standforpuzzle|" + puzzleid + "|" + objname + "|ask', 0);go1('task_quest')\">[對話" + (curpuzzleaction == "" ? "" : "中") + "]</a>"
                        } else {
                            if (/我十分討厭那/.test(puzzleItems[i]) || /好大膽，竟敢拿走了我的/.test(puzzleItems[i]) || /竟敢得罪我/.test(puzzleItems[i]) || /搶走了，去替我要回來吧！/.test(puzzleItems[i])) {
                                puzzleItems[i] += "<a style='color:green' href=\"javascript:go1('cus|standforpuzzle|" + puzzleid + "|" + objname + "|fight', 0);go1('task_quest')\">[比試" + (curpuzzleaction == "fight" ? "中" : "") + "]</a> ";
                                puzzleItems[i] += "<a style='color:green' href=\"javascript:go1('cus|standforpuzzle|" + puzzleid + "|" + objname + "|kill', 0);go1('task_quest')\">[殺" + (curpuzzleaction == "kill" ? "中" : "") + "]</a>"
                            } else {
                                if (/上次我不小心，竟然吃了/.test(puzzleItems[i]) || /竟對我橫眉瞪眼的，真想殺掉他！/.test(puzzleItems[i]) || /昨天撿到了我幾十輛銀子，拒不歸還。錢是小事，但人品可不好。/.test(puzzleItems[i])) {
                                    puzzleItems[i] += "<a style='color:green' href=\"javascript:go1('cus|standforpuzzle|" + puzzleid + "|" + objname + "|kill', 0);go1('task_quest')\">[殺" + (curpuzzleaction == "" ? "" : "中") + "]</a>"
                                } else {
                                    if (/突然想要一/.test(puzzleItems[i]) || /唉，好想要一/.test(puzzleItems[i])) {
                                        puzzleItems[i] += "<a style='color:green' href=\"javascript:go1('cus|standforpuzzle|" + puzzleid + "|" + objname + "|get', 0);go1('task_quest')\">[撿" + (curpuzzleaction == "get" ? "中" : "") + "]</a> ";
                                        puzzleItems[i] += "<a style='color:green' href=\"javascript:go1('cus|standforpuzzle|" + puzzleid + "|" + objname + "|killget', 0);go1('task_quest')\">[殺&撿" + (curpuzzleaction == "killget" ? "中" : "") + "]</a> "
                                    }
                                }
                            }
                        }
                    }
                }
                a = puzzleItems.join("<br/><br/>");
                oldWriteToScreen(a, e, f, g);
                return
            }
            if (e == 2 && a.indexOf("你沒有引路蜂，無法直接去往此地。") > -1) {
                go1("shop buy shop14;items use yinlufeng libao;golook_room");
                oldWriteToScreen(a, e, f, g);
                return
            }
            oldWriteToScreen(a, e, f, g);
            if (e == 2 && standForPuzzle.isstanding() && (/你從\S+的屍體裏搜出\S+/.test(a) || /你撿起\S+/.test(a))) {
                standForPuzzle.endstandingGet(a);
                return
            }

            if (e == 2 && a.indexOf("你停止了打坐。") > -1) {
                go1("exercise");
                return
            }
            if (window.singleBattleTrigger == 1 && e == 2 && (a.indexOf("已經太多人了，不要以多欺少啊。") > -1 || a.indexOf("這兒沒有這個人。") > -1)) {
                window.singleBattleTrigger = 0;
                if (window.singleBattle) {
                    if (window.singleBattle.timer) {
                        clearInterval(window.singleBattle.timer);
                        window.singleBattle.timer = null
                    }
                    if (window.singleBattle.callback) {
                        window.singleBattle.callback()
                    }
                }
                return
            }
        };
        window.oldgSocketMsg = gSocketMsg;
        gSocketMsg.old_change_room_object = gSocketMsg.change_room_object;
        gSocketMsg.change_room_object = function (c) {
            if (standForPuzzle.isstanding()) {
                standForPuzzle.stand(c)
            }
            gSocketMsg.old_change_room_object(c)
        };
        window.hasReachRoom = true;
        gSocketMsg.old_dispatchMessage = gSocketMsg.dispatchMessage;
        gSocketMsg.dispatchMessage = function (b) {
            gSocketMsg.old_dispatchMessage(b);
            TriggerFuc(b);
            for (var name in dispatchMessageListener) {
                dispatchMessageListener[name](b)
            }
            var a = b.get("type"),
                c = b.get("subtype");
            if (!is_fighting && "jh" == a && "info" == c) {
                window.hasReachRoom = true
            }



            if (qiangdipiTrigger == 1) {
                qiang.dispatchMessage(b)
            }


            if (window.singleBattleTrigger == 1 && window.singleBattleInstance) {
                window.singleBattleInstance.dispatchMessage(b)
            }
            if (dispatchMessageList.length > 0) {
                for (var i = 0; i < dispatchMessageList.length; i++) {
                    dispatchMessageList[i](b)
                }
            }
        };
        window.oldgSocketMsg2 = gSocketMsg2;
        gSocketMsg2.old_show_item_info = gSocketMsg2.show_item_info;
        gSocketMsg2.show_item_info = function () {
            gSocketMsg2.old_show_item_info();
            var item = g_obj_map.get("msg_item");
            var foundsplit = false;
            var founduse = false;
            var foundhecheng = false;
            var foundhechengys = false;
            var foundsellall = false;
            var foundmoke = false;
            if (item) {
                for (var i = 1; i <= item.size(); i++) {
                    if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("client_prompt items splite") == 0) {
                        foundsplit = true;
                        continue
                    }
                    if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("items use") == 0 && !item.containsValue("use_all")) {
                        founduse = true;
                        continue
                    }
                    if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("items hecheng ") >= 0) {
                        foundhecheng = true;
                        continue
                    }
                    if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("hhjz hecheng_ys ") >= 0) {
                        foundhechengys = true;
                        continue
                    }
                    if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("items sell ") >= 0) {
                        foundsellall = true;
                        continue
                    }
                    if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("moke ") >= 0) {
                        foundmoke = true;
                        continue
                    }
                }
                if (foundmoke) {
                    if ($("#out .out table:last tr:last td").length == 4) {
                        $("#out .out table:last").append('<tr algin="center"></tr>')
                    }
                    $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="mokeALlItem(\'' + item.get("id") + ',' + item.get("amount") + '\')" class="cmd_click2">全部<br>摩刻</button></td>')
                }
                if (foundsellall) {
                    if ($("#out .out table:last tr:last td").length == 4) {
                        $("#out .out table:last").append('<tr algin="center"></tr>')
                    }
                    $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="clickButton(\'client_prompt items sell ' + item.get("id") + "_N_" + item.get("amount") + '\', 1)" class="cmd_click2">全部<br>賣出</button></td>')
                }
                if (foundsplit) {
                    if ($("#out .out table:last tr:last td").length == 4) {
                        $("#out .out table:last").append('<tr algin="center"></tr>')
                    }
                    // $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="clickButton(\'items splite ' + item.get("id") + "_N_" + item.get("amount") + '\', 1)" class="cmd_click2">全部<br>分解</button></td>')
                    $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="spliteALlItem(\'' + item.get("id") + ',' + item.get("amount") + '\')" class="cmd_click2">全部<br>分解</button></td>')
                }
                if (founduse) {
                    if ($("#out .out table:last tr:last td").length == 4) {
                        $("#out .out table:last").append('<tr algin="center"></tr>')
                    }
                    $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="userALlItem(\'' + item.get("id") + ',' + item.get("amount") + '\')" class="cmd_click2">全部<br>使用</button></td>')
                }
                if (foundhecheng) {
                    if (["lanbaoshi1", "lvbaoshi1", "hongbaoshi1", "zishuijing1", "huangbaoshi1"].indexOf(item.get("id")) > -1) {
                        if (item.get("amount") / 9 >= 1) {
                            if ($("#out .out table:last tr:last td").length == 4) {
                                $("#out .out table:last").append('<tr algin="center"></tr>')
                            }
                            $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="clickButton(\'items hecheng ' + item.get("id") + "_N_" + (Math.floor(item.get("amount") / 9) * 3) + '\', 1)" class="cmd_click2">合' + (Math.floor(item.get("amount") / 9) * 3) + "次</button></td>")
                        }
                    } else {
                        if (item.get("amount") / 3 >= 2) {
                            if ($("#out .out table:last tr:last td").length == 4) {
                                $("#out .out table:last").append('<tr algin="center"></tr>')
                            }
                            $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="clickButton(\'items hecheng ' + item.get("id") + "_N_" + (Math.floor(item.get("amount") / 3)) + '\', 1)" class="cmd_click2">合' + (Math.floor(item.get("amount") / 3)) + "次</button></td>")
                        }
                    }
                }
                if (foundhechengys) {
                    if (item.get("amount") / 7 > 1) {
                        if ($("#out .out table:last tr:last td").length == 4) {
                            $("#out .out table:last").append('<tr algin="center"></tr>')
                        }
                        $("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="clickButton(\'hhjz hecheng_ys ' + item.get("id") + "_N_" + (Math.floor(item.get("amount") / 7)) + '\', 1)" class="cmd_click2">合' + (Math.floor(item.get("amount") / 7)) + "次<br>玉石</button></td>")
                    }
                }
            }
        };
        gSocketMsg2.old_show_skill_info = gSocketMsg2.show_skill_info;
		gSocketMsg2.show_skill_info = function () {
            gSocketMsg2.old_show_skill_info();
            var item = g_obj_map.get("msg_skill");
			var foundlearn = false;
			var foundchuaimo = false;
			var foundtupo = false;
            if (item) {
				for (var i = 1; i <= item.size(); i++) {
					if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("learn") == 0) {
						foundlearn = true;
						continue
					}
					if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("chuaimo") == 0) {
						foundchuaimo = true;
						continue
					}
					if (item.containsKey("cmd" + i) && item.get("cmd" + i).indexOf("tupo") == 0) {
						foundtupo = true;
						continue
					}
				}
				if (foundlearn) {
					if ($("#out .out table:last tr:last td").length == 4) {
                        $("#out .out table:last").append('<tr algin="center"></tr>')
                    }
					$("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="learnSkill(\'' + item.get("cmd2") + ',' + item.get("my_lvl") + ',' + item.get("lvl") + '\')" class="cmd_click2">一鍵<br>學習</button></td>')
				}
				if (foundchuaimo) {
					if ($("#out .out table:last tr:last td").length == 4) {
                        $("#out .out table:last").append('<tr algin="center"></tr>')
                    }
					$("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="chuaimoSkill(\'' + item.get("id") + ',' + item.get("lvl") + '\')" class="cmd_click2">一鍵<br>揣摩</button></td>')
				}
				if (foundtupo) {
					if ($("#out .out table:last tr:last td").length == 4) {
                        $("#out .out table:last").append('<tr algin="center"></tr>')
                    }
					if (item.get('tupo_p')) {
						var tpp = 0;
					} else {
						var tpp = item.get('tupo_p');
					}
					var count = Math.ceil((item.get('tupo_max_p') - tpp) / 5)
					$("#out .out table:last tr:last").append('<td align="center"><button type="button" onclick="tupoSkill(\'' + item.get("id") + ',' + count + '\')" class="cmd_click2">一鍵<br>突破</button></td>')
				}
			};
		};
		gSocketMsg2.old_show_master_skills = gSocketMsg2.show_master_skills;
		gSocketMsg2.show_master_skills = function () {
            gSocketMsg2.old_show_master_skills();
            var item = g_obj_map.get("msg_master_skills");
            if (item) {
				$("#out .out table:last td:last").css('width', '30%')
				$("#out .out table:last td:last").attr('align', 'center')
				$("#out .out table:last tr:last").append('<td style="width:30%" align="center"><button type="button" onclick="autolearnSkill()" class="cmd_click2">一鍵<br>學習</button></td>')
				$("#out .out table:last tr:last").append('<td style="width:30%" align="center"></td>')
				$("#out .out table:last tr:last").append('<td style="width:5%"></td>')
			};
		};
        gSocketMsg2.old_show_items = gSocketMsg2.show_items;
        gSocketMsg2.show_items = function (b) {
            gSocketMsg2.old_show_items(b);
            $(".out table:eq(1) tbody:eq(0) td:eq(0)").css("vertical-align", "top");
            var cangkuclone = $(".out table:eq(1) table:eq(1) tr[onclick]").clone();
            cangkuclone = cangkuclone.sort(function (a, b) {
                return ansi_up.ansi_to_text($(a).text()) > ansi_up.ansi_to_text($(b).text()) ? 1 : -1
            });
            $(".out table:eq(1) table:eq(1) tr[onclick]").remove();
            $(".out table:eq(1) table:eq(1)").prepend(cangkuclone);

            // var baoclone = $(".out table:eq(1) table:eq(0) tr[onclick]").clone();
            // baoclone = baoclone.sort(function (a, b) {
            //     return ansi_up.ansi_to_text($(a).text()) > ansi_up.ansi_to_text($(b).text()) ? 1 : -1
            // });
            // $(".out table:eq(1) table:eq(0) tr[onclick]").remove();
            // $(".out table:eq(1) table:eq(0)").prepend(baoclone);

            if ($("#items-div #items-zhengli1").length == 0) {
                $("#out .out table:first").after("<div id='items-div'><button id='items-zhengli1' class='cmd_click3'><span class='out2'>普通整理</span></button><button id='items-zhengli2' class='cmd_click3'><span class='out2'>完整整理</span></button><button id='items-qingmu' class='cmd_click3'><span class='out2'>開青木</span></button><button id='items-baiyin' class='cmd_click3'><span class='out2'>開白銀</span></button><button id='items-huangjin' class='cmd_click3'><span class='out2'>開黃金</span></button><button id='items-bojin' class='cmd_click3'><span class='out2'>開鉑金</span></button><button id='items-yaoyu' class='cmd_click3'><span class='out2'>開曜玉</span></button><button id='items-chili' class='cmd_click3'><span class='out2'>開赤璃</span></button></div>");
                $("#items-div #items-zhengli1").off("click").on("click",
                    function () {
                        var stores = g_obj_map.get("msg_items").elements.filter(function (item) {
                            return item.key.indexOf("stores") > -1
                        });
                        var items = g_obj_map.get("msg_items").elements.filter(function (item) {
                            return item.key.indexOf("items") > -1
                        });
                        var cmds = [];
                        for (var i = 0; i < stores.length; i++) {
                            var name = stores[i].value.split(",")[1];
                            var sameitems = items.filter(function (item) {
                                return item.value.indexOf("," + name + ",") > -1
                            });
                            for (var j = 0; j < sameitems.length; j++) {
                                cmds.push("items put_store " + sameitems[j].value.split(",")[0])
                            }
                        }
                        if (cmds.length > 0) {
                            GoSlowAction(cmds)
                        }
                    });
				$("#items-div #items-zhengli2").off("click").on("click",
                    function () {
                        baoguoZhengliFunc();
                    });
                $("#items-div #items-baiyin").off("click").on("click",
                    function () {
                        openXiang('白銀寶箱');
                    });
                $("#items-div #items-huangjin").off("click").on("click",
                    function () {
                        openXiang('黃金寶箱', '黃金鑰匙');
                    });
                $("#items-div #items-bojin").off("click").on("click",
                    function () {
                        openXiang('鉑金寶箱', '鉑金鑰匙');
                    });
                $("#items-div #items-qingmu").off("click").on("click",
                    function () {
                        openXiang('青木寶箱');
                    });
                $("#items-div #items-yaoyu").off("click").on("click",
                    function () {
                        openXiang('曜玉寶箱', '曜玉鑰匙');
                    });
				$("#items-div #items-chili").off("click").on("click",
                    function () {
                        openXiang('赤璃寶箱', '赤璃鑰匙');
                    });
            }
        };
		
        gSocketMsg2.old_show_user = gSocketMsg2.show_user;
        gSocketMsg2.show_user = function () {
            gSocketMsg2.old_show_user();
            fireListener(show_userListener)
        };
        gSocketMsg2.old_show_score = gSocketMsg2.show_score;
        gSocketMsg2.show_score = function () {
            gSocketMsg2.old_show_score();
            fireListener(show_scoreListener)
        };
        g_gmain.old_clickButton = g_gmain.clickButton;
        g_gmain.clickButton = function (a, e) {
            g_gmain.old_clickButton(a, e);
            fireListener(clickButtonListener, [a, e])
        };
        gSocketMsg.move_lose_kee_gif = function (c) {
            var a = document.getElementById("lose_kee_gif" + c);
            if (a) {
                setTimeout(function () {
                    a.parentNode.removeChild(a)
                }, 300)
            }
        };
        gSocketMsg.old_show_html_page = gSocketMsg.show_html_page;
        gSocketMsg.show_html_page = function () {
            gSocketMsg.old_show_html_page();
            if ($("#out .out button:contains('傳十次'),#out .out button:contains('學十次')").length > 0) {
                $("#out .out button:contains('傳十次'),#out .out button:contains('學十次')").each(function () {
                    var btn1 = $(this).clone();
                    btn1.attr("onclick", btn1.attr("onclick").replace("10", "100")).html(btn1.html().replace("十", "百"));
                    $(this).after(btn1)
                })
            }
            if ($("#out .out button:contains('升40級'),#out .out button:contains('升40級')").length > 0) {
                $("#out .out button:contains('升40級'),#out .out button:contains('升40級')").each(function () {
                    var btn1 = $(this).clone();
                    btn1.attr("onclick", btn1.attr("onclick").replace("40", "100")).html(btn1.html().replace("4", "10"));
                    $(this).after(btn1)
                })
            }
            if ($("#out .out button:contains('兌換一個')").length > 0) {
                $("#out .out button:contains('兌換一個')").each(function () {
                    var btn1 = $(this).clone();
                    var clickText = btn1.attr("onclick");
                    clickText = clickText.replace('client_prompt ', '');
                    clickText = clickText.replace('clickButton(', '');
                    clickText = clickText.replace(')', '');
                    //fudi shennong exch 1
                    // clickButton('client_prompt fudi shennong exch 1', 0)
                    btn1.attr("onclick", 'doClickButtonTime(' + clickText + ')').html(btn1.html().replace("一", "十"));
                    $(this).after(btn1)
                })
            }
        };
    };
    attach()
}
window.doClickButtonTime = function (text) {
    for (var i = 0; i < 10; i++) {
        go(text);
    }
};
function questionFn2() {
    window.attach = function () {
        var oldWriteToScreen = window.writeToScreen;
        window.writeToScreen = function (a, e, f, g) {
            if (e == 2 && a.indexOf("find_task_road") > -1) {
                a = a.replace(/find_task_road3/g, "find_task_road2");
                var puzzleItems = a.split("<br/><br/>");
                var puzzleid = "";
                for (var i = 0; i < puzzleItems.length; i++) {
                    if (puzzleItems[i].indexOf("find_task_road") == -1) {
                        continue
                    }
                    puzzleid = autoPuzzle.analyzePuzzle(puzzleItems[i]);
                    puzzleItems[i] += " <a class='go-btn' href='javascript:go1(\"cus|startpuzzle|" + puzzleid + "\")'>【GO】</a>";
                    if (autoPuzzle.puzzleWating && puzzleid == autoPuzzle.puzzleWating.puzzleid) {
                        if (autoPuzzle.puzzleWating.actionCode == "get" && autoPuzzle.puzzleWating.status == "wait") {
                            puzzleItems[i] += " <a href='javascript:go1(\"cus|puzzlekillget\")'>【殺】</a>"
                        }
                        if (puzzleItems[i].indexOf("謎題") == -1) {
                            autoPuzzle.startpuzzle(puzzleid)
                        }
                    }
                }
                a = puzzleItems.join("<br/><br/>")
            } else {
                if (e == 2 && a.indexOf("不接受你給的東西。") > -1 && autoPuzzle.puzzleWating && autoPuzzle.puzzleWating.puzzleid && autoPuzzle.puzzleWating.status == "give") {
                    autoPuzzle.puzzleWating.waitCount--;
                    if (autoPuzzle.puzzleWating.waitCount <= 0) {
                        clearTimeout(autoPuzzle.puzzleWating.waitTimer);
                        autoPuzzle.puzzleWating.status = "trace";
                        go1("find_task_road " + autoPuzzle.puzzleWating.puzzleid)
                    }
                } else {
                    if (e == 2 && autoPuzzle.puzzleWating && autoPuzzle.puzzleWating.puzzleid && (autoPuzzle.puzzleWating.status == "wait" || autoPuzzle.puzzleWating.status == "traced") && autoPuzzle.puzzleWating.action == "get" && (a.indexOf("你撿起") > -1 || /你從.*的屍體裏搜出.*。/.test(a) || /你用.*向.*買下.*。/.test(a)) && a.indexOf(autoPuzzle.puzzleWating.target) > -1) {
                        autoPuzzle.puzzleWating = {
                            puzzleid: autoPuzzle.puzzleWating.puzzleid,
                            action: "get",
                            actionCode: "give",
                            target: window.puzzleList[autoPuzzle.puzzleWating.puzzleid].publisherName,
                            status: "return"
                        };
                        go1("find_task_road2 " + autoPuzzle.puzzleWating.puzzleid)
                    } else {
                        if (e == 2 && a.indexOf("我就不給，你又能怎樣？") > -1 && autoPuzzle.puzzleWating && autoPuzzle.puzzleWating.puzzleid && autoPuzzle.puzzleWating.actionCode == "fight") {
                            autoPuzzle.doPuzzle(autoPuzzle.puzzleWating.puzzleid)
                        } else {
                            if (e == 2 && autoPuzzle.puzzleWating && autoPuzzle.puzzleWating.puzzleid && /完成謎題\((\d+)\/\d+\)：(.*)的謎題\S*\s*\S*x(\d+)\s*\S*x\d+\s*\S*銀兩x(\d{1,})/.test(a)) {
                                var puzzleFinish = /完成謎題\((\d+)\/\d+\)：(.*)的謎題\S*\s*\S*x(\d+)\s*\S*x\d+\s*\S*銀兩x(\d{1,})/.exec(a);
                                puzzleFinish[2] = puzzleFinish[2].replace(/^<\/span>/, "").replace(//g, "");
                                if (puzzleFinish[2] == autoPuzzle.puzzleList[autoPuzzle.puzzleWating.puzzleid].firstPublisherName) {
                                    autoPuzzle.puzzleList[autoPuzzle.puzzleWating.puzzleid].prize = puzzleFinish[0].replace(/<\/?span[^>]*>/g, "").replace(/<br\/>/g, "\n");
                                    if (+ puzzleFinish[4] > 1800) {
                                        a += "<br/><button onClick='go1(\"cus|puzzlesubmit|" + autoPuzzle.puzzleWating.puzzleid + "\")' style='background: #FF6B00; color: #fff; margin: 5px;'>【提交】</button>"
                                    }
                                    if (a.indexOf('當前謎題密碼') >= 0) {
                                        // console.log(a);
                                        // a = '<span style="color:rgb(37, 167, 182)">完成謎題(2/15)：老狼的謎題，獲得：<br/>經驗x285048<br/>潛能x5700960<br/>銀兩x3067</span><span style="color:rgb(235, 218, 32)"><br/>當前謎題密碼：603534</span><br/><a href='javascript:go1("cus|puzzlesubmit|huashancun_huashancun_fb7")'>【提交】</a>'
                                        //當前謎題密碼：327945
                                        var mimatext = a.split('當前謎題密碼：')[1].split('<')[0];
                                        var submitCode = 'event_1_65953349 ' + mimatext;
                                        var goPath = 'jh 1;e;n;n;n;n;w;' + submitCode;
                                        a += "<button onClick='go(\"" + goPath + "\")' style='background: #FF6B00; color: #fff; margin: 5px;'>【交密碼】</button>";
                                    }
                                    autoPuzzle.puzzleWating = {}
                                }
                            }
                        }
                    }
                }
            }
            oldWriteToScreen(a, e, f, g)
        }
    };
    window.hasReachRoom = true;
    var old_dispatchMessage = gSocketMsg.dispatchMessage;
    gSocketMsg.dispatchMessage = function (b) {
        old_dispatchMessage(b);
        var a = b.get("type"),
            c = b.get("subtype");
        if ("jh" == a && "info" == c) {
            window.hasReachRoom = true;
            if (autoPuzzle.puzzleWating.puzzleid) {
                if (autoPuzzle.puzzleWating.status == "trace") {
                    autoPuzzle.puzzleWating.status = "traced";
                    autoPuzzle.doPuzzle(autoPuzzle.puzzleWating.puzzleid)
                } else {
                    if (autoPuzzle.puzzleWating.status == "return") {
                        autoPuzzle.puzzleWating.status = "returned";
                        autoPuzzle.doPuzzle(autoPuzzle.puzzleWating.puzzleid)
                    }
                }
            }
        }
    };
    var old_change_room_object = gSocketMsg.change_room_object;
    gSocketMsg.change_room_object = function (c) {
        var type = c.get("type"),
            subType = c.get("subtype");
        if (type == "jh" && (subType == "new_item" || subType == "new_npc")) {
            var name = autoPuzzle.ansiToHtml(c.get("name")),
                plainName = ansi_up.ansi_to_text(c.get("name")),
                id = c.get("id");
            if (autoPuzzle.puzzleWating && autoPuzzle.puzzleWating.puzzleid && autoPuzzle.puzzleWating.status == "wait") {
                if (subType == "new_npc") {
                    if (["npc_datan", "answer", "ask", "fight", "kill", "give"].indexOf(autoPuzzle.puzzleWating.actionCode) > -1 && name == autoPuzzle.puzzleWating.target) {
                        go1(autoPuzzle.puzzleWating.actionCode + " " + id)
                    } else {
                        if (autoPuzzle.puzzleWating.actionCode == "killget" && plainName == autoPuzzle.puzzleWating.waitTargetName) {
                            go1("kill " + id)
                        }
                    }
                } else {
                    if (subType == "new_item" && ["get"].indexOf(autoPuzzle.puzzleWating.actionCode) > -1) {
                        if (name == autoPuzzle.puzzleWating.target || id.indexOf("corpse") > -1) {
                            go1("get " + id)
                        }
                    }
                }
            }
        }
        old_change_room_object(c)
    };
    window.attach();
    var autoPuzzle = window.autoPuzzle = new AutoPuzzle();
    window.definedAutoPuzzle = true
}