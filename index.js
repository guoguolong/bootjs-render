"use strict";

const common = require('bootjs-common');
const _ = require('lodash');

function _autoRender(ctx, data, layout, viewPath, callback) {
    let {renderHandler, req, res, next, defaultEngine} = ctx ;
    let cbFunc = callback || viewPath || layout;
    if (typeof cbFunc !== 'function') cbFunc = null;

    if (layout === undefined) layout = true;
    let dataRes = new common.HtmlResponse();
    dataRes.viewPath = res.locals.__viewPath__;
    if (data && data.constructor && data.constructor.name === 'HtmlResponse') { // 忽略参数2、参数3
        dataRes = data;
        if (typeof dataRes.viewPath !== 'string') {
            dataRes.viewPath = res.locals.__viewPath__;
        }
    } else {
        if (typeof data === 'string') { // 参数1:viewPath； 参数2:data, 参数3:忽略
            dataRes.viewPath = data;
            if (typeof layout === 'object') {
                dataRes.data = layout;
            }
        } else if (typeof data === 'object') {// 参数1:data 参数2:layout, 参数3:viewPath
            dataRes.data = data;
            dataRes.layout = layout;
            if(viewPath) {
                dataRes.viewPath = viewPath;
            }
        }
    }
    dataRes.data = dataRes.data || {};
    dataRes.data.__engine__ = dataRes.data.__engine__ || defaultEngine || 'ejs';
    if (!dataRes.viewPath.match(/(\.ejs)$|(\.njk)$/)) { //无扩展名.
        dataRes.viewPath += '.' + dataRes.data.__engine__;
    }
    if (dataRes.data.__engine__ === 'njk') {
        dataRes.layout = false;
    }
    if (dataRes.layout === true) { // 获取配置文件的默认layout配置，仅对ejs有效
        if (renderHandler) {
            if(renderHandler.HtmlResponse) {
                if(renderHandler.HtmlResponse.layout) {
                    dataRes.layout = renderHandler.HtmlResponse.layout;
                }
            }
        }
    }
    dataRes.merge(); // 合并结果到result属性.
    res.render(dataRes.viewPath, dataRes.result, cbFunc);
};

module.exports = function(defaultRenderHandler) {
    return {
        htmlRender: function(req, res, next) {
            let HtmlResponse = common.HtmlResponse;
            let renderHandler = _.merge({}, defaultRenderHandler);
            res.htmlRender = function(data, layout, viewPath, callback) {
                let cbFunc = callback || viewPath || layout;
                if (typeof cbFunc !== 'function') cbFunc = null;

                if (layout === undefined) layout = true;
                let dataRes = new HtmlResponse();
                dataRes.viewPath = res.locals.__viewPath__;
                if (data && data.constructor && data.constructor.name === 'HtmlResponse') { // 忽略参数2、参数3
                    dataRes = data;
                    if (typeof dataRes.viewPath !== 'string') {
                        dataRes.viewPath = res.locals.__viewPath__;
                    }
                } else {
                    if (typeof data === 'string') { // 参数1:viewPath； 参数2:data, 参数3:忽略
                        dataRes.viewPath = data;
                        if (typeof layout === 'object') {
                            dataRes.data = layout;
                        }
                    } else if (typeof data === 'object') {// 参数1:data 参数2:layout, 参数3:viewPath
                        dataRes.data = data;
                        dataRes.layout = layout;
                        if(viewPath) {
                            dataRes.viewPath = viewPath;
                        }
                    }
                }
                if (dataRes.layout === true) { // 获取配置文件的默认layout配置
                    if (renderHandler) {
                        if(renderHandler.HtmlResponse) {
                            if(renderHandler.HtmlResponse.layout) {
                                dataRes.layout = renderHandler.HtmlResponse.layout;
                            }
                        }
                    }
                }
                dataRes.merge(); // 合并结果到result属性.
                res.render(dataRes.viewPath, dataRes.result, cbFunc);
            };
            next();
        },
        htmlRender: function(req, res, next) {
            let renderHandler = _.merge({}, defaultRenderHandler);
            res.htmlRender = function(data, layout, viewPath, callback) {
                return _autoRender({renderHandler, req, res, next, defaultEngine: 'ejs'}, data, layout, viewPath, callback);
            };
            next();
        },
        autoRender: function(req, res, next) {
            let renderHandler = _.merge({}, defaultRenderHandler);
            res.autoRender = function(data, layout, viewPath, callback) {
                return _autoRender({renderHandler, req, res, next, defaultEngine: 'njk'}, data, layout, viewPath, callback);
            };
            next();
        },
        apiRender: function(req, res, next) {
            res.apiRender = function(data, code, message) {
                let apiResp = null;
                if (data.constructor.name === 'ApiResponse') {
                    apiResp = data;
                } else {
                    apiResp = new common.ApiResponse();
                    apiResp.data = data;
                    if (code) {
                        apiResp.setCode(code, message);
                    }
                }
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.send(apiResp.encode());
            };
            next();
        }
    };
}