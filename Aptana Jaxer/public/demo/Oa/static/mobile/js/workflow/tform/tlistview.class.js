/*
 *  TListViewManager
 *  by tl @2015-05-05
 *
 */
define('TListView', function (require, exports, module) {
    var $ = jQuery;
    var Base = require('base');
    var Fields = require('ReportFieldLoder');
    var getFieldClass = function (c) {
        /*
        var Field2ClassMap = {
            input: 'RRichtextField',
            user: 'RUserField',
            data: 'RDateField',
            select: 'RSelectField'
        };
        */
        return Fields[c];
    };
    var TListViewManager = Base.extend({
        attrs: {
            wrapper: '#content'
        },
        initialize: function (config, store) {
            TListViewManager.superclass.initialize.call(this, config);
            this.$wrapper = $(this.get('wrapper'));
            this.$wrapper.html("");
            this.register = store || [];
            this.instances = {};
            this.lists = [];
            this.initMainBlocks(store.main);
            this.initDetailBlocks(store.detail);
        },
        regist: function (cfg) {
            this.register.push(cfg);
        },
        factory: function (cfg, $wrapper) {
            var klass = getFieldClass(cfg.fieldtype),
                field;
            if (klass) {
                cfg.listManager = this;//对每一条记录过滤每一种类型的控件过程中传入这一条记录对象
                field = new klass(cfg, $wrapper);
            }
            return field;
        },
        initMainBlocks: function (blocks){
            var self = this;
            $.each(blocks, function (i, block) {
                var $block = self.parseBlock(block);
                self.initFields(block.item, $block);
            });
            if(self.register.flag == 0){
                self.get('wrapper').trigger('calc');
            }
            $('#page_list_detail .read_detail:last').addClass("last");
        },
        initDetailBlocks: function (blocks){
            if(!blocks){
                return;
            }
            var self = this;
            $.each(blocks, function (i, block) {
                self.initListManager(block, self.$wrapper);
            });
        },
        initListManager: function(cfg, $wrapper){
            if(!cfg){
                return;
            }
            this.lists.push(
                new ReportListFieldManager({ 
                    wrapper: $wrapper
                }, cfg)
            );
        },
        initFields: function (fields, $block) {
            var self = this,
                register = this.register,
                instances = this.instances;
            $.each(fields, function (i, cfg) {
                var instance = self.factory(this, $block);
                if (instance && instance.get('id')) {
                    instances[instance.get('id')] = instance;
                }
            });
        },
        bindEvent: function () {
            var self = this,
                runId = this.get('runId'),
                flowId = this.get('flowId');
        },
        parseBlock: function(d){
            var tmpl = '\
<div class="reportBlock report-block-header clearfix">\
  <h3><%=title%></h3>\
</div>\
';
            var $block = $($.parseTpl(tmpl, d));
            this.$wrapper.append( $block );

            return $block;
        },
        createId: (function (i) {
            return function () {
                return i++;
            }
        })(0),
        save: function () {
            return this.$el.serializeArray();
        },
        appendFieldElement: function (el) {
            $(this.get('wrapper')).append(el);
        },
        destroy: function(){
            this.$el.remove();
        },
        updateFields: function(){
            
        },
        updateDataFromFields: function(){
            $.each(this.instances, function(i, field){
                field.updateDataFromField && field.updateDataFromField();
            });
        },
        serializeArray: function(){
            var self = this, ret = [], list = {};
            $.each(this.instances, function(i, field){
                field.getData && ret.push(field.getData());
            });
            $.each(this.lists || [], function(i, l){
                list['DATA_'+l.getId()] = (l.serializeArray());
            });
            return list;
        }
    });
    var ReportListFieldManager = TListViewManager.extend({
        attrs: {
            wrapper: 'body',
            emptyTips: '#emptyTips'
        },
        initialize: function (config, store) {
            TListViewManager.superclass.initialize.call(this, config);
            this.$wrapper = $(this.get('wrapper'));
            this.$emptyTips = $(this.get('emptyTips'));
            this.register = store || [];
            this.instances = {};
            this.$el = this.parseBlock(store);
            this.initFields(store.item, this.$el);
            //(store.op == 'do') && this.buildCreateHelper();
            this.bindEvent();
            this.sumobj = null;
            store.sumArr && this.createSum();
            store.sumArr && this.$el.trigger('_calcSum');
        },
        getId: function(){
            return this.register.id;	
        },
        bindEvent: function(){
            var self = this;
            this.$el.on('tap click', '.report-create-helper, .report-list-icon-create', function(){
                self.createItem();
            });
            this.$el.bind('_calcSum', function(){
                self.calcSum();
            });
        },
        calcSum: function(){
            var self = this;
            $.each(self.register.sumArr, function(i, obj){
                if(obj.sumflag == 1){
                    var sum = 0;
                    $.each(self.instances, function(k, v){
                        $.each(v.cfg.item, function(k1, v1){
                            if(v1.id == obj.id){
                                if(v1.colvalue == ""){v1.colvalue = 0;}
                                sum += parseInt(v1.colvalue);
                            };
                        });
                    });
                    obj.colvalue = sum;
                }
            });
            self.sumobj.cfg.item = self.register.sumArr;
            self.sumobj.render();
        },
        createSum: function(){
            var self = this;
            var id = (new Date).getTime();
            var sumArr = {
                id: id,
                index: 'sum',
                title: ( this.register.title ?  this.register.title + ' - ' : this.register.title ) + sumTitle,
                item: []
            };
            sumArr.item = $.extend(true, [], this.register.sumArr);
            var $el = $('#sum');
            $.each([sumArr], function (i, cfg) {
                var instance = self.sumfactory(this, $el);
                self.sumobj = instance;
            });
        },
        sumfactory: function (cfg, $block) {
            var klass = getFieldClass('RListField'),
                field;
            if (klass) {
                field = new klass(cfg, $block);
            }
            return field;
        },
        initFields: function (fields, $block) {
            var self = this,
                register = this.register,
                instances = this.instances;
            if(fields.length == 0){
                this.$emptyTips.show();
                return;
            }
            this.$emptyTips.hide();
            $.each(fields, function (i, cfg) {
                var instance = self.factory(this, $block);
                if (instance && instance.get('id')) {
                    instances[instance.get('id')] = instance;
                }
                instance.on('click', $.proxy(self.itemClickHandle, self) );
                instance.on('delete', $.proxy(self.itemDeleteHandle, self) );
            });
        },
        factory: function (cfg, $block) {
            var klass = getFieldClass('RListField'),
                field;
            if (klass) {
                field = new klass(cfg, $block);
            }
            return field;
        },
        parseBlock: function(d){
            var tmpl = '\
<div class="reportBlock report-block-header clearfix">\
  <h3><%=title%></h3>\
  <div class="report-block-header-op">'
    +((d.op == '1' && d.add_op == 1) ? '<a class="report-list-icon-create" href="javascript:void(0);"></a>' : '')+        
'<a class="report-list-icon-tableview" href="javascript:;" onclick="<%=obj.url%>"></a>\
</div></div>\
';
            var $block = $($.parseTpl(tmpl, d));
            this.$wrapper.append( $block );

            return $block;
        },
        buildCreateHelper: function(){
            this.$el.append('<div class="read_detail clearfix report-create-helper"><em>'+createItemBtn+'</em></div>');  
        },
        createItem: function(){
            var self = this,
                id   = (new Date).getTime();
            var schema = {
                id: id,
                index: 'new',
                title: ( this.register.title ?  this.register.title + ' - ' : this.register.title ) + createBtn,
                item: []
            };
            schema.item = $.extend(true, [], this.register.schema);
            this.initFields([schema], this.$el);
            this.itemClickHandle(this.instances[id], {
                close: function(){
                    this.$el.remove();
                    this.destroy();
                },
                save: function(){
                    this.state = 'add';
                    self.register.sumArr && self.$el.trigger('_calcSum');
                }
            });
        },
        itemDeleteHandle: function(item, callbacks){
            if(this.instances[item.cfg.id]){
                delete this.instances[item.cfg.id];
            }
            item.$el.remove();
        },
        itemClickHandle: function(item, callbacks){
            var self = this;
            var flag = 0;
            if(item.get('index') == 'new' || item.get('index') == 'sum'){
                flag = 1;
            };
            var $panel = $('<div>').attr({
                'id': 'page_list_detail',
                'class': 'pages'
            }).appendTo('body');
            reback(18, 'list_detail');
            var $inner = $('<div>').appendTo($panel);
            var $btnwrapper = $("<div style='text-align: center;margin-top:15px;'>").appendTo($panel);
            var $close = $('<button>').text(closeItemBtn).addClass("reportclose").appendTo($btnwrapper);
            var $save = $('<button>').text(saveItemBtn).addClass("reportbtn").appendTo($btnwrapper);
            $panel.append('<div class="holder-40"></div>');
            $(".pages").hide();
            $close.click(function(){ 
                $panel.remove();
                $("#page_18").show('fast',function(){
                    pageInit(18);
                });
                callbacks && callbacks.close && callbacks.close.call(item);
            });
            $save.click(function(){
                l.updateDataFromFields();
                item.render();
                self.register.sumArr && self.$el.trigger('_calcSum');
                $panel.remove();
                $("#page_18").show('fast',function(){
                    pageInit(18);
                });
                
                callbacks && callbacks.save && callbacks.save.call(item);
            });
            l = new TListViewManager({
                wrapper: $inner
            }, {
                main: [item.cfg],
                id: this.getId(),
                flag: flag
            });
            setTimeout(function(){
                $panel.show();
            }, 1)
        },
        serializeArray: function(){
            //var ret = [];
            var str = "";
            $.each(this.instances, function(i, field){
                var data = field.getData() 
                //data && ret.push(field.getData());
                data && (str+=field.getData());
            });
            return str;
            //return ret;
        }

    });
    exports.TListViewManager = window.TListViewManager = TListViewManager;
});
define('ReportFieldLoder', ["RTextField", "RDateField", "RCheckBoxField", "RRadioField", "RCalcCtrlField", "RRawField", "RTextAreaField", "RSelectField", "RListField"], function (require, exports, module) {
    var depends = module.dependencies;
    for (var i in depends) {
        var mod = require(depends[i]);
        exports[depends[i]] = mod ? mod[depends[i]] : null;
    }
});

define('RTextField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var Base = require('base');
    var RTextField = Base.extend({
        attrs: {
            id: null
        },
        initialize: function (cfg, $wrapper) {
            RTextField.superclass.initialize.call(this, cfg);
            this.cfg = cfg;
            this.$el = $(this.parseTpl(cfg));
            this.$field = this.getField();
            this.$wrapper = $wrapper;
            this.appendFieldElement(this.$el);
            this.bindEvent();
            this.initialized();
        },
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field">\
    ' + (cfg.editable == 1 ?
      '<input value="<%=colvalue%>" name="<%=id%>" type="text" />'
    : '<span><%=colvalue%></span><input value="<%=colvalue%>" name="<%=id%>" type="hidden" />') +
  '</div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        appendFieldElement: function(el){
            this.$wrapper.append(el);
        },
        getField: function(){ 
            return this.$el.find('input')
        },
        getValue: function(){ return this.getField().val() },
        updateDataFromField: function(){
            var oldvalue = this.cfg.colvalue;
            this.cfg.colvalue = this.getValue();
            this.cfg.isChanged = !(oldvalue == this.cfg.colvalue);            
        },
        getData: function(){
            var ret = {};
            if(this.cfg.editable){
                ret.name = this.cfg.id;
                ret.value = this.getValue();
                ret.displaystyle = this.cfg.displaystyle;   
            }
            return ret;
        },
        initialized: function(){
            this.cfg.editable == "1" && this.$el.addClass('field-editable');
        },
        bindEvent: function(){},
        bindCalc: function(instances, rule, result, reminder){
            var $input = this.getField(),
                self   = this;
            $input.bind("keyup paste _calced", function(){
                var ret = [];
                ret.push(instances);
                ret.push(rule);
                ret.push(result);
                ret.push(reminder);
                self.cfg.listManager.get('wrapper').trigger('calc', ret);
            });
        }
    });
    exports.RTextField = window.RTextField = RTextField;
});
define('RDateField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var RDateField = RTextField.extend({
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field">\
    ' + (cfg.editable == 1 ?
      '<input value="<%=colvalue%>" name="<%=id%>" type="text" />'
    : '<span><%=colvalue%></span><input value="<%=colvalue%>" name="<%=id%>" type="hidden" />') +
  '</div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        initialized: function(){
            if(this.cfg.editable){
                var $input = this.getField();
                $input.attr("readonly","true");
                if(this.cfg.displaystyle == "yyyy-MM-dd"){
                    $input.attr({"data-type":"date"});
                }else{
                    $input.attr({"data-type":"datetime"});
                }
                $input.focus(function(){
                    if($input.attr("data-type") == "date"){
                        $('[data-type="date"]').mobiscroll().date({
                            theme: 'ios7',
                            lang: 'zh',
                            dateFormat: 'yy-mm-dd',
                            display: 'bottom',
                            dateOrder: 'ddMMyy',
                            mode: 'scroller'
                        });
                    }
                    else if($input.attr("data-type") == "datetime"){
                        $('[data-type="datetime"]').mobiscroll().datetime({
                            theme: 'ios7',
                            lang: 'zh',
                            dateFormat: 'yy-mm-dd',
                            display: 'bottom',
                            mode: 'scroller'
                        });
                    }
                    else if($input.attr("data-type") == "time"){
                        $('[data-type="time"]').mobiscroll().time({
                            theme: 'ios7',
                            lang: 'zh',
                            display: 'bottom',
                            dateFormat: 'hh:mm',
                            mode: 'scroller'
                        });
                    }
                });  
                this.cfg.editable == "1" && this.$el.addClass('field-editable');
            }
        }

    });
    exports.RDateField = window.RDateField = RDateField;
});
define('RCalcCtrlField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var Math = require('math');
    var RCalcCtrlField = RTextField.extend({
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field"><span></span><input value="" name="<%=id%>" type="hidden" /></div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        getField: function(){ 
            return this.$el.find('span')
        },
        setValue: function(str, reminder){
            var res = math.eval(str);
            res = res.toFixed(reminder);
            this.$el.find('span').text(res);
        },
        updateDataFromField: function(){
            var oldvalue = this.cfg.colvalue;
            this.cfg.colvalue = this.getValue();
            this.cfg.isChanged = !(oldvalue == this.cfg.colvalue);
        },
        getValue: function(){ return this.getField().text() },
        initialized: function(){
            //在每条记录中过滤每个计算控件的cfg里新增对应的上级记录对象listManager，调用这个在listManager中实现获取对应的dom对象，并对dom绑事件
            //this.cfg.listManager && this.cfg.listManager.initCalc(this.cfg);
            this.cfg.listManager && this.initCalc(this.cfg); 
        },
        initCalc: function(cfg){
            var self = this,
                instances = this.cfg.listManager.instances,
                rule      = this.cfg.code_select_value,
                reminder  = 0;
            if(rule.indexOf('|')!=-1){
                reminder  = rule.substr(rule.indexOf('|')+1,1);//余数
                rule = rule.substr(0,rule.indexOf('|'));//提纯公式
            }
            var arr = rule.match(/(\d+)/g);
            var list_id = this.cfg.listManager.register.id;
            $.each(arr, function(k, v){
                var obj = instances['list_'+list_id+'_col_'+v];
                obj.bindCalc(instances, cfg.code_select_value, cfg.id, reminder);
            });
            self.cfg.listManager.get('wrapper').bind('calc', function(){
                self.calc(arguments[1],arguments[2],arguments[3],arguments[4]);
            });
        },
        calc: function(instances, rule, result, reminder){
            var self      = this,
                instances = instances? instances: this.cfg.listManager.instances,
                rule      = rule? rule: this.cfg.code_select_value,
                result    = result? result: this.cfg.id,
                reminder  = reminder? reminder: 0;
            if(rule.indexOf('|')!=-1){
                reminder  = rule.substr(rule.indexOf('|')+1,1);//余数
                rule = rule.substr(0,rule.indexOf('|'));//提纯公式
            }
            var arr  = rule.match(/(\d+)/g);
            //var list_id = this.cfg.listManager.register.main[0].id;
            var list_id = this.cfg.listManager.register.id;
            $.each(instances, function(k, v){
                $.each(arr, function(m, n){
                    if(v.cfg.id == ('list_'+list_id+'_col_'+n)){
                        var re = new RegExp("\\["+n+"\\]","ig");
                        var calv = 0;
                        calv = (v.getValue()=='' ? 0: v.getValue());
                        rule = rule.replace(re,calv);
                    }
                });
            });
            instances[result].setValue(rule, reminder);
            instances[result].getField().trigger('_calced');
        },
        bindCalc: function(instances, rule, result, reminder){
            var self   = this,
                $input = this.getField();
            $input.bind("_calced", function(){
                self.cfg.listManager.get('wrapper').trigger('calc', [instances, rule, result, reminder]);
            });
        }
    });
    exports.RCalcCtrlField = window.RCalcCtrlField = RCalcCtrlField;
});
define('RSelectField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var RSelectField = RTextField.extend({
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field">\
  ' + (cfg.editable == 1 ?
      '<select value="<%=colvalue%>" name="<%=id%>" title="<%=colname%>"></select>'
    : '<span><%=colvalue%></span><input value="<%=colvalue%>" name="<%=id%>" type="hidden" />') +
  '</div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        renderOption: function (cfg) {
            var code_select_value = cfg.code_select_value,
                opData = code_select_value ? code_select_value.split('|') : [],
                html = [];
            $.each(opData, function () {
                if (this == '') {
                    return
                }
                var selected = this == cfg.colvalue ? ' selected ' : '';
                html.push('<option value="' + this + '" ' + selected + '>' + this + '</option>');
            });
            this.$field.append(html.join(''));
        }, 
        getField: function(){ 
            if(this.cfg.editable == "1"){
                return this.$el.find('select')
            }else{
                return this.$el.find('input')
            }
        },
        getValue: function(){
            if(this.cfg.editable == "1"){
                return this.getField().find('option:selected').val()
            }else{
                return this.getField().val()
            }
        },
        initialized: function(){
            if(this.cfg.editable && this.cfg.editable == "1"){
                this.renderOption(this.cfg);
                this.$el.addClass('field-editable');
            }
        },
        bindCalc: function(instances, rule, result, reminder){
            var self    = this,
                $select = self.getField(),
                ret     = [];
            ret.push(instances);
            ret.push(rule);
            ret.push(result);
            ret.push(reminder);
            if(self.cfg.editable == "1"){
                $select.bind("change _calced", function(){
                    self.cfg.listManager.get('wrapper').trigger('calc', ret);
                });
            }
            else{
                $select.bind("_calced", function(){
                    self.cfg.listManager.get('wrapper').trigger('calc', ret);
                });
            }
        }
    });
    exports.RSelectField = window.RSelectField = RSelectField;
});
define('RListField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var RListField = RTextField.extend({
        attrs: {
            id: null
        },
        initialize: function (cfg, $wrapper) {
            RTextField.superclass.initialize.call(this, cfg);
            var self = this;
            this.cfg = cfg;
            this.$el = $(this.parseTpl(cfg));
            this.$wrapper = $wrapper;
            this.appendFieldElement(this.$el);
            this.$el.on('click tap', function(){
                self.trigger('click', self); 
            });
            this.bindEvent();
        },
        bindEvent: function(){
            var self = this;
            this.$el.delegate('.deleteBtn', 'tap click', function(e){
                e.stopPropagation();
                var delflag=confirm(confirmDelete); 
                if (delflag == true){ 
                    self.trigger('delete', self);
                    return true; 
                } 
                else{
                    return false; 
                } 
            });
        },
        parseTpl: function (cfg) {
            var id = this.get('id');
            var tmpl = (function(){
                var fields = [];
                $.each(cfg.item, function(i, v){
                    if(i == 0){
                        fields.push('<h6 class="clearfix"><b class="no">'+(cfg.index)+'</b><em>' + v.colname + ': ' + emptyHelper(v.colvalue) + '</em>'+ ( cfg.index=='sum' ?'': ('<div class="deleteBtn">'+ deleteBtn +'</div>')) +'</h6>');
                    }else{
                        fields.push('<em>' + v.colname + ': ' + emptyHelper(v.colvalue) + '</em>');
                    }
                });
                
                return '<div class="read_detail clearfix tag-RListField">'+ fields.join('\n\r') +'</div>';
            })();
            return $.parseTpl(tmpl, cfg)
        },
        render: function(){
            this.$el.html( $(this.parseTpl(this.cfg)).html() );
        },
        appendFieldElement: function(el){
            this.$wrapper.append(el);
        },
        getData: function(){
            //var ret = [];
            var data_str = "";
            $.each(this.cfg.item, function(){
                if(this.fieldtype == "RRadioField" || this.fieldtype == "RCheckBoxField")
                {
                    data_str += this.colvalue + "`";
                }
                else if(this.fieldtype == "RTextAreaField")
                {
                    var the_value = this.colvalue;
                    the_value = the_value.toString();
                    the_value = the_value.replace(/`/g, '[0x60]');
                    var textarea_html = the_value + "`";
                    textarea_html = textarea_html.replace(/\r\n/g, "&lt;br&gt;");
                    textarea_html = textarea_html.replace(/\n/g, "&lt;br&gt;");
                    data_str += textarea_html;
                }
                else
                {
                    var the_value = this.colvalue;
                    the_value = the_value.toString();
                    the_value = the_value.replace(/`/g, '[0x60]');
            		data_str += the_value + "`";
                }
            });
            data_str = data_str.replace(/\r\n/g, "&lt;br&gt;");
            data_str += "\n";
            return data_str;
        }
    });
    function emptyHelper(c){
        return c == '' ? ' - ' : c;
    }
    exports.RListField = window.RListField = RListField;
});

define('RCheckBoxField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var RCheckBoxField = RTextField.extend({
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field">\
    ' + (cfg.editable == 1 ?      
      '<div class="checkWrapper"></div>'
    : '<span><%=colvalue%></span><input value="<%=colvalue%>" name="<%=id%>" type="hidden" />') +
  '</div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        getField: function(){ 
            if(this.cfg.editable == "1"){
                return this.$el.find('.checkWrapper') 
            }else{
                return this.$el.find('input') 
            }
        },
        getValue: function(){
            if(this.cfg.editable == "1"){
                var str = "";
                this.getField().find('.checked').each(function(){
                    var val = $(this).next('label').text();
                    str += val + ',';
                });
                str = str.substr(0, str.length-1);
                return str;
            }
            else{
                return this.getField().val()
            }
        },
        updateDataFromField: function(){
            var oldvalue = this.cfg.colvalue;
            this.cfg.colvalue = this.getValue();
            this.cfg.isChanged = !(oldvalue == this.cfg.colvalue);
        },
        renderItem: function(cfg){
            this.$field = this.getField();
            var code_select_value = cfg.code_select_value,
                opData = code_select_value ? code_select_value.split('|') : [],
                default_items = cfg.colvalue,
                defaultData = default_items ? default_items.split(',') : [],
                html = [];
            $.each(opData, function (k, v) {
                if (this == '') {
                    return
                }
                var checked = $.inArray(v, defaultData)==-1 ? '' : 'checked';
                html.push('<input type="checkbox" name="'+cfg.id+'" id="'+ cfg.id+'_'+k +'" ' + checked + ' /><label for="'+ cfg.id+'_'+k +'">'+ this +'</label>');
            });
            this.$field.append(html.join(''));
        },
        initialized: function(){ 
            if(this.cfg.editable && this.cfg.editable == "1"){ 
                this.renderItem(this.cfg);
                this.$el.addClass('field-editable');
                $('input').iCheck({ 
                    checkboxClass: 'icheckbox_square-blue',
                    radioClass: 'iradio_square-blue'
                });
            }
        },
        bindCalc: function(instances, rule, result, reminder){
            var self   = this,
                $field = self.getField(),
                ret = [];
            ret.push(instances);
            ret.push(rule);
            ret.push(result);
            ret.push(reminder);
            if(self.cfg.editable == "1"){
                $field.find('input').each(function(){
                    var $this = $(this);
                    $this.on('ifChanged _calced', function(event){
                        setTimeout(function(){ 
                            self.cfg.listManager.get('wrapper').trigger('calc', ret);
                        },1000);
                    });
                }); 
            }else{
                $field.on('_calced', function(event){ 
                     self.cfg.listManager.get('wrapper').trigger('calc', ret);
                });
            } 
        }
    });
    exports.RCheckBoxField = window.RCheckBoxField = RCheckBoxField;
});
define('RRadioField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var RRadioField = RTextField.extend({
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field">\
    ' + (cfg.editable == 1 ?      
      '<div class="radioWrapper"></div>'
    : '<span><%=colvalue%></span><input value="<%=colvalue%>" name="<%=id%>" type="hidden" />') +
  '</div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        getField: function(){ 
            if(this.cfg.editable == "1"){
                return this.$el.find('.radioWrapper') 
            }else{
                return this.$el.find('input') 
            }
        },
        getValue: function(){
            if(this.cfg.editable == "1"){
                return this.getField().find('.checked').next('label').text();
            }else{
                return this.getField().val()
            }
        },
        updateDataFromField: function(){
            var oldvalue = this.cfg.colvalue;
            this.cfg.colvalue = this.getValue();
            this.cfg.isChanged = !(oldvalue == this.cfg.colvalue);
        },
        renderItem: function(cfg){
            var code_select_value = cfg.code_select_value,
                opData = code_select_value ? code_select_value.split('|') : [],
                html = [];
            this.$field = this.getField();
            $.each(opData, function (k, v) {
                if (this == '') {
                    return
                }
                var checked = this == cfg.colvalue ? ' checked ' : '';
                html.push('<input type="radio" name="'+cfg.id+'" id="'+ cfg.id+'_'+k +'" ' + checked + ' /><label for="'+ cfg.id+'_'+k +'">'+ this +'</label>');
            });
            this.$field.append(html.join(''));
        },
        initialized: function(){
            if(this.cfg.editable && this.cfg.editable == "1"){ 
                this.renderItem(this.cfg);
                this.$el.addClass('field-editable');
                $('input').iCheck({ 
                    checkboxClass: 'icheckbox_square-blue',
                    radioClass: 'iradio_square-blue'
                });
            }
        },
        bindCalc: function(instances, rule, result, reminder){
            var self   = this,
                $field = self.getField(),
                ret = [];
            ret.push(instances);
            ret.push(rule);
            ret.push(result);
            ret.push(reminder);
            if(self.cfg.editable == "1"){  
                $field.find('input').each(function(){
                    var $this = $(this);
                    $this.on('ifChanged _calced', function(event){
                        setTimeout(function(){
                            self.cfg.listManager.get('wrapper').trigger('calc', ret);
                        },1000);
                    });
                });  
            }else{
                $field.on('_calced', function(event){
                    self.cfg.listManager.get('wrapper').trigger('calc', ret);
                });
            }
        }
    });
    exports.RRadioField = window.RRadioField = RRadioField;
});
define('RTextAreaField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var RTextAreaField = RTextField.extend({
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field">\
    ' + (cfg.editable == 1 ?      
      '<textarea name="<%=id%>" value="<%=colvalue%>"><%=colvalue%></textarea>'
    : '<span><%=colvalue%></span><input value="<%=colvalue%>" name="<%=id%>" type="hidden" />') +
  '</div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        initialized: function(){
            if(this.cfg.editable){ 
                this.cfg.editable == "1" && this.$el.addClass('field-editable');
            }
        },
        getField: function(){ 
            if(this.cfg.editable == "1"){
                return this.$el.find('textarea')
            }else{
                return this.$el.find('input')
            }   
        },
        bindCalc: function(instances, rule, result, reminder){
            var self   = this,
                $input = this.getField(),
                ret = [];
            ret.push(instances);
            ret.push(rule);
            ret.push(result);
            ret.push(reminder);
            if(self.cfg.editable == "1"){
                $input.bind("keyup paste _calced", function(){
                    self.cfg.listManager.get('wrapper').trigger('calc', ret);
                });
            }else{
                $input.bind("_calced", function(){
                    self.cfg.listManager.get('wrapper').trigger('calc', ret);
                });
            }
        }
    });
    exports.RTextAreaField = window.RTextAreaField = RTextAreaField;
});
define('RRawField', function (require, exports, module) {
    var $ = window.jQuery || window.Zepto;
    var RTextField = require('RTextField').RTextField;
    var RRawField = RTextField.extend({
        parseTpl: function (cfg) {
            var tmpl = '\
<div class="read_detail clearfix tag-<%=fieldtype%>">\
  <em><%=colname%>:</em>\
  <div class="field">\
    <input value="<%=colvalue%>" name="<%=id%>" type="hidden" />\
  </div>\
</div>\
';
            return $.parseTpl(tmpl, cfg)
        },
        initialized: function(){
        }
    });
    exports.RRawField = window.RRawField = RRawField;
});

