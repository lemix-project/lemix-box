let fs = require('fs');
let minify = require('html-minifier').minify;
let UglifyJS = require("uglify-js");
let cleanCSS = require('clean-css');
let cssMinify = new cleanCSS();
let babel = require('babel-core');
let es2015 = require('babel-preset-es2015');
// const filePath = process.argv[2];
// const distPath = process.argv[3];
const htmlReg = /index\.html$/;
const jsReg = /\.js$/;
const cssReg = /index\.css$/;
let filters = new Array();

let build = function (filePath, distPath) {
    filter(filePath);
    // 创建根目录./dist
    if (fs.existsSync(distPath)) {
        makeDir(filePath, distPath);
    } else {
        fs.mkdirSync(distPath);
        makeDir(filePath, distPath);
        // fs.mkdir(distPath, function (err) {
        //     if (err) {
        //         console.warn(err);
        //     } else {
        //         makeDir(filePath, distPath);
        //     }
        // })
    }
};

let filter = function (filePath) {
    if (fs.existsSync(filePath + '/.lemix')) {
        let lemix = fs.readFileSync(filePath + '/.lemix', 'utf-8').replace(/[\r\n]/g, "^");
        let lemixArray = lemix.split('^^');
        lemixArray.push('.lemix');
        lemixArray.forEach(function (value, index) {
            if (value !== '') {
                filters.push(filePath + '/' + value);
            }
        });
    }
};

// 创建菜单
let makeDir = function (currentPath, buildPath) {
    let subFiles = fs.readdirSync(currentPath);
    subFiles.forEach(function (ele) {
        if (!filters.includes(currentPath + '/' + ele)) {
            let info = fs.statSync(currentPath + '\\' + ele);
            if (info && info.isDirectory()) {
                if (!fs.existsSync(buildPath + "\\" + ele)) {
                    fs.mkdirSync(buildPath + "\\" + ele);
                }
                makeDir(currentPath + "\\" + ele, buildPath + "\\" + ele);
            } else {
                if (fs.existsSync(buildPath)) {
                    makeFile(buildPath, currentPath, ele);
                } else {
                    fs.mkdirSync(buildPath);
                    makeFile(buildPath, currentPath, ele);
                }
            }
        }
    })
}

// 创建文件
let makeFile = function (buildPath, currentPath, fileName) {
    if (!jsReg.test(fileName) && !cssReg.test(fileName)) {
        if (htmlReg.test(fileName)) {
            let fr = fs.readFileSync(currentPath + '\\' + fileName, 'utf-8');
            // fs.readFile(currentPath + "\\" + fileName, "utf-8", function (err, fr) {
            let html = minify(
                fr, {
                    removeComments: true,               // 删除注释
                    collapseWhitespace: true,           // 删除空格
                    minifyJS: true,
                    minifyCSS: true,
                    removeScriptTypeAttributes: true,    // 删除script的类型属性
                    removeStyleLinkTypeAttributes: true  // 删除style的类型属性
                });
            html = jsHandle(html, currentPath + "\\" + fileName);
            fr = cssHandle(html, currentPath + "\\" + fileName);
            fs.writeFileSync(buildPath + '\\' + fileName, fr, 'utf-8');
            // fs.writeFile(buildPath + "\\" + fileName, fr, "utf-8", function (err) {
            //     if (err) {
            //         console.warn(err);
            //     } else {
            //         console.log(buildPath + "\\" + fileName, "is done");
            //     }
            // })
            // });
        } else if (!jsReg.test(fileName) && !cssReg.test(fileName)) {
            // fs.readFile(currentPath + "\\" + fileName, function (err, file) {
            //     if (err) {
            //         console.log(err);
            //     } else {
            //         fs.writeFile(buildPath + "\\" + fileName, file, function (err) {
            //             if (err) {
            //                 console.warn(err);
            //             } else {
            //                 console.log(buildPath + "\\" + fileName, "is done");
            //             }
            //         })
            //     }
            // });
            let file = fs.readFileSync(currentPath + '\\' + fileName);
            fs.writeFileSync(buildPath + '\\' + fileName, file);
        }
    }
}

// 获取script标签和link标签的索引数组
let searchSubStr = function (str, subStr) {
    let positions = new Array();
    let pos = str.indexOf(subStr);
    while (pos > -1) {
        positions.push(pos);
        pos = str.indexOf(subStr, pos + 1);
    }
    return positions;
}

// 获取js和css的绝对路径
let getRelative = function (src, path) {
    let srcMap = src.split("/");
    let srcArray = src.split("/");
    if (srcArray[0] === "" || srcArray[0] === ".") {
        srcArray.splice(0, 1);
    }
    let pathArray = path.split("\\");
    pathArray.splice(pathArray.length - 1, 1);
    srcMap.forEach(function (value, index) {
        if (value === "..") {
            srcArray.splice(0, 1);
            pathArray.splice(pathArray.length - 1, 1);
        }
    })
    let relativeUrlArray = pathArray.concat(srcArray);
    let relativeUrl = relativeUrlArray.join("\\");
    return relativeUrl;
}

// 处理js
let jsHandle = function (htmlData, path) {
    let jsStrings = new String();
    let jsStarts = searchSubStr(htmlData, "<script src");
    let jsEnds = searchSubStr(htmlData, "><\/script>");
    let relativeUrls = new Array();
    if (jsStarts.length > 0) {
        for (let index = 0; index < jsStarts.length; index++) {
            let jsString = htmlData.substring(jsStarts[index], jsEnds[index] + 10);
            if (jsString.indexOf("/static/") > 0) {
                continue;
            }
            jsStrings += jsString;
            let jsStringArray = jsString.split('"');
            let jsSrc = jsStringArray[1];
            let relativeUrl = getRelative(jsSrc, path); // 获取绝对路径
            relativeUrls.push(relativeUrl);
        }
    }
    if (relativeUrls.length > 0) {
        let uglifyCodes = new String();
        relativeUrls.forEach(function (url) {
            let code = babelES6(url);
            let uglifyCode = UglifyJS.minify(code).code;
            uglifyCodes = uglifyCodes + uglifyCode;
            // uglifyCodes = uglifyCodes + code;
            console.log(url + " is done");
        })
        htmlData = htmlData.replace(jsStrings, "<script>" + uglifyCodes + "</script>");
    }
    return htmlData;
}

// 处理css
let cssHandle = function (htmlData, path) {
    let cssStarts = searchSubStr(htmlData, "<link rel");
    let cssEnds = searchSubStr(htmlData, ".css");
    if (cssStarts.length > 0) {
        let codes = new String();
        let cssStrings = new String();
        for (let index = 0; index < cssStarts.length; index++) {
            let cssString = htmlData.substring(cssStarts[index], cssEnds[index] + 6);
            if (cssString.indexOf("/static/") > 0) {
                continue;
            }
            cssStrings += cssString;
            let cssStringArray = cssString.split('"');
            let cssHref = cssStringArray[3];
            let relativeUrl = getRelative(cssHref, path); // 获取绝对路径
            let code = fs.readFileSync(relativeUrl, 'utf-8');
            codes += cssMinify.minify(code).styles;
            console.log(relativeUrl + " is done");
        }
        htmlData = htmlData.replace(cssStrings, "<style>" + codes + "</style>")
    }
    return htmlData;
}

// 编译es6
let babelES6 = function (fileName) {
    return babel.transformFileSync(fileName, {presets: [es2015]}).code;
}

export default {
    build
}