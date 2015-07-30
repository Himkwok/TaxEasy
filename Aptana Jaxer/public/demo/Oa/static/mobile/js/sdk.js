/*
 * name: ��ҳ�ˣ�����header���
 * dependencies: zepto,gmu,frozen
 * author: lijun
 * description: ����ͳһ��json��������ҳ����Ⱦheader
 * */

//���������ռ�
var tMobileSdk = {};

//����header��������
tMobileSdk.buildHeader = function(headerData,options){
    //����δ�������ݺʹ�������Ϊ�ն�������
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

    //���ò���
    var opts = {};
    opts.container = options.targetEl || 'body';
    opts.leftBtns = new Array('<i class="ui-icon-return" data-op="' + headerData.l.event + '"></i>');
    opts.rightBtns = new Array('<button class="ui-btn ' + headerData.r.class + '" data-op="' + headerData.r.event + '">' + headerData.r.title + '</button>');
    //���headerData.c������
    if($.isArray(headerData.c)){
        opts.title = '';
        $.each(headerData.c,function(index,item){
            opts.title += '<button class="ui-btn ui-btn-primary" data-op="' + item.event + '">' + item.title + '</button>';
        });
    } else {
        opts.title = headerData.c.title || '';
    }


    //ʵ����
    var _id = options.id || "J_toolbar";//get the container id
    if(options.type === "header"){//header
        new gmu.Toolbar('<header class="ui-header ui-header-stable" id="'+ _id +'"></header>',opts);
    } else if(options.type === "footer"){//footer
        new gmu.Toolbar('<footer class="ui-footer ui-footer-stable" id="'+ _id +'"></footer>',opts);
    }
    


    //���д���������
    //�����˰�ť
    $('#'+ _id +' .ui-icon-return').on('click',function(e){
        var cb = $(this).attr('data-op');
        if(cb){
            eval(cb);
        }
    });
    //�Ҳ������ť
    $('#'+ _id +' .ui-toolbar-right .ui-btn').on('click',function(e){
        var cb = $(this).attr('data-op');
        if(cb){
            eval(cb);
        }
    });
    //�м�Ĳ�����ť
    $('#'+ _id +' .ui-toolbar-title .ui-btn').on('click',function(e){
        var cb = $(this).attr('data-op'); 
        if(cb){
            eval(cb);
        }
    });
};