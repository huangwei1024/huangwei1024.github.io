'use strict';
var cheerio = require('cheerio');
var baseUrl = "/static"
var cdnUrl = "http://dn-huangweipro.qbox.me";
var loading = "/images/loading_spinner.gif";
var oldsrc = '';
function stringStartsWith(string, prefix) {
    return string.slice(0, prefix.length) == prefix;
}
function lazyloadImg(source) {
    var $ = cheerio.load(source, {
        decodeEntities: false
    });
    $("#posts").find('img').each(function(index, element) {
        oldsrc = $(element).attr('src');
        if (oldsrc && stringStartsWith(oldsrc, baseUrl) && !$(element).hasClass('hx_lazyimg')) {
            //$(element).addClass('hx_lazyimg');
            $(element).attr({
                src: loading,
                'data-original': cdnUrl + oldsrc
            });
        }
    });
    return $.html();
}
hexo.extend.filter.register('after_render:html', lazyloadImg);