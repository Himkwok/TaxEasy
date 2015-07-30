/*
 * name: 网页端，构建header组件
 * dependencies: zepto,gmu,frozen
 * author: lijun
 * description: 根据统一的json数据在网页端渲染header
 * */

//定义命名空间
var tMobileSdk = {};

//定义header构建方法
tMobileSdk.buildHeader = function(headerData,options){
    //处理未传入数据和传入数据为空对象的情况
    if(!headerData){
        return false;
    } else {
        var isEmpty = true;
        for(var prop in headerData){
            isEmpty = false;
            break;
        }
        if(isEmpty){
            return false;
        }
    }

    //配置参数
    var opts = {};
    opts.container = options.targetEl || 'body';
    opts.leftBtns = new Array('<i class="ui-icon-return" data-op="' + headerData.l.event + '"></i>');
    opts.rightBtns = new Array('<button class="ui-btn ' + headerData.r.class + '" data-op="' + headerData.r.event + '">' + headerData.r.title + '</button>');
    //如果headerData.c是数组
    if($.isArray(headerData.c)){
        opts.title = '';
        $.each(headerData.c,function(index,item){
            opts.title += '<button class="ui-btn ui-btn-primary" data-op="' + item.event + '">' + item.title + '</button>';
        });
    } else {
        opts.title = headerData.c.title || '';
    }


    //实例化
    var _id = options.id || "J_toolbar";//get the container id
    if(options.type === "header"){//header
        new gmu.Toolbar('<header class="ui-header ui-header-stable" id="'+ _id +'"></header>',opts);
    } else if(options.type === "footer"){//footer
        new gmu.Toolbar('<footer class="ui-footer ui-footer-stable" id="'+ _id +'"></footer>',opts);
    }
    


    //集中处理点击操作
    //左侧后退按钮
    $('#'+ _id +' .ui-icon-return').on('click',function(e){
        var cb = $(this).attr('data-op');
        if(cb){
            eval(cb);
        }
    });
    //右侧操作按钮
    $('#'+ _id +' .ui-toolbar-right .ui-btn').on('click',function(e){
        var cb = $(this).attr('data-op');
        if(cb){
            eval(cb);
        }
    });
    //中间的操作按钮
    $('#'+ _id +' .ui-toolbar-title .ui-btn').on('click',function(e){
        var cb = $(this).attr('data-op'); 
        if(cb){
            eval(cb);
        }
    });
};