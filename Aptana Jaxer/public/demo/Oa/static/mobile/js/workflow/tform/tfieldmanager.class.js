define('TFieldManager', ['TFieldLoader',"base"], function(require, exports, module){    
    var $ = jQuery;
    var Base = require('base');
    var Fields = require('TFieldLoader');
    var TFieldManager = Base.extend({
        attrs: {
            runId: null,
            flowId: null,
            wrapper: 'body'
        },
        initialize: function(config, store) {
            TFieldManager.superclass.initialize.call(this, config);
            this.register = store || [];
            this.instances = {};
            this.initFields();
            this.bindEvent();
        },
        regist: function(cfg){
            this.register.push(cfg);
        },
        factory: function(cfg) {
            var klass = Fields[cfg.type], field;
            if(klass){
                field = new klass(cfg);
            }
            return field;
        },
        initFields: function() {
            var register = this.register,
                instances = this.instances,
                factory = this.factory;
            $.each(register, function(i, cfg){
                var instance = factory(cfg);
                if(instance && instance.get('id')){
                    instances[instance.get('id')] = instance;
                }
            });
        },
        bindEvent: function(){
            var self = this, 
                runId = this.get('runId'), 
                flowId = this.get('flowId');
            $(this.get('wrapper'))
                .find('input,textarea')
                .filter(function(){
                    var $this = $(this);                    
                    return !($this.is(':reset,:file,:button,.AUTO,.FETCH,:disabled') || !(this.name ? this.name.match(/DATA_/gi) : false) || this.readOnly || this.readOnly === '' || $this.parents('.LIST_VIEW').size()) 
                })
                .filter('input:text,textarea');
        },
        saveWorkFlow: function(a){
            saveSignWorkFlow();
            var data = $("#edit_from").serialize();
            $.ajax({
                type: 'POST',
                url: 'edit_submit.php',
                cache: false,
                async: false,
                data: data + "&P="+p,
                beforeSend: function(){
                    $.ProLoading.show();       
                },
                success: function(data){
                    $.ProLoading.hide();
                    if(a) return;
                    $.ajax({
                        type: 'GET',
                	    url: 'sign.php',
                	    cache: false,
                	    data: {'P': p, 'RUN_ID': q_run_id,'FLOW_ID': q_flow_id,'PRCS_ID': q_prcs_id,'FLOW_PRCS': q_flow_prcs, 'OP_FLAG': q_op_flag},
                	    success: function(dataSign)
                        {

                		    $("#CONTENT").val("");
                		    $("#editSignBox").empty().append(dataSign);
                		    $("#editSignBox .read_detail:last").addClass("endline");
                		    showMessage(formsuccess);
                        }
                    });
                },
                error: function(data){
                    $.ProLoading.hide();  
                    showMessage(getfature);
                }
            });
        },
        
        //必填字段保存JS处理机制
        onSubmit: function() {
            var self = this, ret = null;
            $.each(self.instances, function() {
                var field = this;
                if(typeof field.onSubmit == 'function')
                {
                    var status = field && field.onSubmit && field.onSubmit();  
                    ret = ret === false ? false : status;
                }
            });
            return ret;
        }
    });
    exports.TFieldManager = window.TFieldManager = TFieldManager;
});


