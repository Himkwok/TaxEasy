define('TFileUploadCtrl',function(require, exports, module){
    var $ = jQuery;
    var Base = require('TBaseCtrl').TBaseCtrl;
    var TFileUploadCtrl = Base.extend({
    	
        initialize: function(config) 
        {   
        	TFileUploadCtrl.superclass.initialize.call(this, config);
            this.$obj = $('input[name="'+config.id+'"]').eq(0);
            this.$a = $('span[id="ATTACHMENT'+config.id+'_div"]');
            this.$s = $('div[id="SelFileDiv'+config.id+'"]');
            this.$divObj = $('#DIV_FILEUPLOAD_'+config.id+'');
            this.required = config.required;
            this.desc = config.desc;
            this.id = config.id;
            this.bindEvent();
        },
        
        bindEvent: function() {
            var self = this;
            this.$divObj.find('a').bind('click', function(){
                var api = self.$divObj.find('a').last().data('tipsy');
                api && api.hide();
            })
        },
        
        setOffsetTop: function() {
            var obj_val = this.$obj.val(),
                $field = this.$divObj,
                $a = this.$a,
                $s = this.$s;
            var required_val = this.required;
            if((obj_val == '' || typeof obj_val == 'undefined') && $a.find('span').length == 0 && $s.find('img').length == 0 && required_val)
            {
                if($field.find('a').last().length == 1)
                {
                    var objTop = $field.find('a').last().offset().top;
                    $("body,html").animate({ 
                        scrollTop: objTop - 150
                    },50); 
                    return false;
                }
            }            
        },
        
        onSubmit: function() {
            var obj_val = this.$obj.val(),
                $field = this.$divObj,
                $a = this.$a,
                $s = this.$s;
            var required_val = this.required;
            if((obj_val == '' || typeof obj_val == 'undefined') && $a.find('span').length == 0 && $s.find('img').length == 0 && required_val)
            {
                if($field.find('a').last().length == 1)
                {
                    this.validation(this.desc);
                    setTimeout(function(){
                        var api = $field.find('a').last().data('tipsy');
                        api && api.hide();
                    }, 5000);
                    return false;
                }
            }
        },
        
        validation: function(s) {
            this.$divObj.find('a').last().tipsy({
                title: function () {
                    this.title = this.getAttribute('original-title');
                    this.removeAttribute('original-title');
                    return '<b style="color:#E25C5C;">' + s + '</b>';
                },
                html: true,
                fade: true,
                gravity: $.fn.tipsy.autoWE,
                opacity: 1,
                trigger: 'manual',
                container: '#content-main',
                fixPos: function(tp){ 
                //tp.left -= 50;  
                    return tp; 
                }
            }).tipsy('show');
        }

    });
    exports.TFileUploadCtrl = window.TFileUploadCtrl = TFileUploadCtrl;
});

