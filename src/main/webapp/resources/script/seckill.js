//存放主要交互逻辑js代码
//将 javascript 模块化
var seckill = {

    //封装秒杀相关ajax的url
    URL: {
        //Controller中的请求地址
        now : function () {
            return '/seckill/time/now';
        },
        exposer : function (seckillId) {
            return '/seckill/'+ seckillId +'/exposer';
        },
        execution : function (seckillId,md5) {
            return '/seckill/'+ seckillId +'/'+ md5 +"/execution";
        }
    },

    //验证手机号方法
    validatePhone: function (phone){
        if (phone && phone.length == 11 && !isNaN(phone)){
            return true;
        }else {
            return false;
        }
    },

    //秒杀开始，获取秒杀地址，控制显示逻辑，执行秒杀
    handleSeckillkill : function (seckillId,node) {
        //node 就是传过来的seckillBox
        node.hide().html('<button class="btn btn-primary btn-lg" id="killBtn">开始秒杀</button>');
        //这个URL只接受post请求所以使用ajax的post
        $.post(seckill.URL.exposer(seckillId),{},function (result) {
           //result为SeckillResult<exposer>的实例
            if (result && result['success']){
                var exposer = result['data'];
                if (exposer['exposed']){
                    //开启秒杀，获取地址
                    var md5 = exposer['md5'];
                    var killUrl = seckill.URL.execution(seckillId,md5);
                    console.log("killUrl:"+killUrl);
                    //为按钮绑定一次点击事件
                    $('#killBtn').one('click',function () {
                        //执行秒杀请求，this相当于killBtn
                        //1.先禁用按钮
                        $(this).addClass('disabled');
                        //2. 发送秒杀请求执行秒杀
                        $.post(killUrl,{},function (result) {
                            //result相当于SeckillResult<SeckillExecution>的实例
                            if (result && result['success']){
                                var killResult = result['data'];
                                var state = killResult['state'];
                                var stateInfo = killResult['stateInfo'];
                                //3.显示秒杀结果
                                node.html('<span class="label label-success">' + stateInfo + '</span>');
                            }
                        });
                    });
                    node.show();
                }else{
                    /**
                     * 没有开启秒杀，当用户长时间等待计时面板
                     * 导致客户端与服务器端时间不一致
                     * 用户pc机计时太快
                     */
                    var now = exposer['now'];
                    var start = exposer['start'];
                    var end = exposer['end'];
                    //重新计算计时逻辑
                    seckill.countdown(seckillId, now, start, exposer);
                }
            }else{
                console.log('result:'+result);
            }
        });

    },

    //时间判断
    countdown : function (seckillId,nowTime,startTime,endTime) {
        var seckillBox = $('#seckill-box');
        if (nowTime > endTime){
            //秒杀结束
            seckillBox.html('秒杀结束');
        }else if (nowTime < startTime){
            //秒杀未开始，使用jQuery-countdown插件,计时事件绑定
            //+1秒用户端计时服务的时间偏移
            var killTime = new Date(startTime + 1000);
            seckillBox.countdown(killTime,function (event) {
                //控制时间格式
                var format = event.strftime('秒杀倒计时：%D天 %H时 %M分 %S秒');
                seckillBox.html(format);
            }).on('finish.countdown',function () {
                //倒计时结束后回调事件
                //获取秒杀地址，控制现实逻辑，执行秒杀
                seckill.handleSeckillkill(seckillId,seckillBox);
            });
        }else{
            //秒杀开始
            seckill.handleSeckillkill(seckillId,seckillBox);
        }
    },
    //详情页秒杀逻辑
    detail: {
        //详情页初始化
        init: function (params) {
            //手机验证和登录，计时交互
            //规划交互流程
            //在cookie中查找手机号
            var killPhone = $.cookie('killPhone');

            //验证手机号
            if (!seckill.validatePhone(killPhone)){
                //需要绑定phone,通过jQuery选择器将jsp中的modal节点选到
                var killPhoneModal = $('#killPhoneModal');
                //通过modal传入json,将modal显示出来
                killPhoneModal.modal({
                    show : true,//显示弹出层
                    backdrop : 'static',//禁止位置关闭，必须填写手机号
                    keyboard : false//关闭键盘事件比如Esc
                });
                //点击按钮（.click）只能点击一次，（.onclick）可以点击多次
                $('#killPhoneBtn').click(function () {
                    var inputPhone = $('#killPhoneKey').val();
                    if (seckill.validatePhone(inputPhone)){
                        //刷新页面,将号码写入cookie中并设置有效期和有效路径
                        $.cookie('killPhone',inputPhone,{expires:7,path: '/seckill'});
                        window.location.reload();
                    }else {
                        //输入手机号不符合,防止显示中间过程，先hide300毫秒后再show
                        $('#killPhoneMessage').hide().html('<label class="label label-danger">基佬你手机号写错了!</label>').show(300);
                    }
                });

            }
            //登录成功
            //计时交互，通过ajax请求拿到系统当前时间
            //ajax请求中{}为参数，function为回调函数
            //result就是SeckillResult<Long>的实例
            var startTime = params['startTime'];
            var endTime = params['endTime'];
            var seckillId = params['seckillId'];
            $.get(seckill.URL.now(),{},function (result) {
                if (result && result['success']){
                    //success为true就代表有数据
                    var nowTime = result['data'];
                    //时间判断，计时交互
                    seckill.countdown(seckillId,nowTime,startTime,endTime);
                }else {
                    console.log('result:' + result);
                }

            });
        }
    }
};