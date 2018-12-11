<template>
    <el-container v-loading="loading">
        <el-aside>
            <div class="header">
                <div><b>Current Project:</b></div>
                <div><i>{{projectName}}</i></div>
            </div>
            <div class="toolbar">
                <!--<el-row>-->
                <!--<el-col :span="12">-->
                <!--<div><img src="../../../static/images/run.jpg" alt=""></div>-->
                <!--</el-col>-->
                <!--<el-col :span="12">-->
                <!--<div><img src="../../../static/images/export.jpg" alt=""></div>-->
                <!--</el-col>-->
                <!--</el-row>-->
                <!--<el-row>-->
                <!--<el-col :span="12">-->
                <!--<div><img src="../../../static/images/swich.jpg" alt=""></div>-->
                <!--</el-col>-->
                <!--</el-row>-->
                <el-row>
                    <el-button size="small" @click="buildAndRun()">Build & Run</el-button>
                    <el-button size="small" @click="exportMix()">Export MixModule</el-button>
                </el-row>
                <el-row>
                    <el-button size="small" @click="swichProject()">Swich Project</el-button>
                </el-row>
            </div>
            <div class="footer">Power by LemonIT.CN</div>
        </el-aside>
        <el-main>
            <el-tree :data="projectData">
                <span class="custom-tree-node" slot-scope="{ node, data }">
                    <span>{{ node.label }}</span>
                    <span v-show="!data.isIncludeHtml&&data.children.length===0">
                        <el-button
                                type="text"
                                size="mini"
                                @click="() => addDir(data)"
                        >
                            addDir
                        </el-button>
                        <el-button
                                type="text"
                                size="mini"
                                @click="() => addModel(node, data)"
                        >
                            addModel                        </el-button>
                    </span>
                </span>
            </el-tree>
            <div class="btn">
                <el-button type="text" size="mini" @click="addRootDir()">Add root directory</el-button>
            </div>
        </el-main>
    </el-container>
</template>

<script>
    import fs from 'fs'
    import path from 'path'
    import child_process from 'child_process'
    import JSZip from 'jszip'
    import FileSaver from 'file-saver'
    import watch from 'watch'

    export default {
        name: "currentProject",
        data() {
            return {
                projectName: '',
                projectPath: '',
                htmlReg: /index\.html$/,
                projectData: [],
                projectModel: {
                    'children': []
                },
                loading: false,
                pluginPath: '',
                iconPath: ''
            }
        },
        methods: {
            /**
             * 初始化
             */
            init() {
                if (this.$route.params.project) {
                    let project = this.$route.params.project;
                    this.projectName = project.name;
                    this.projectPath = project.path;
                    this.projectModel.children = [];
                    this.$set(this, "projectData", this.projectModel.children);
                    this.readDir(project.path);
                    this.watchFileTrees();
                }
            },
            /**
             * 读取项目目录结构
             * @param path
             * @param parent
             */
            readDir(path, model = this.projectModel) {
                let _this = this;
                let menu = fs.readdirSync(path);
                menu.forEach(function (ele) {
                    let info = fs.statSync(path + "\\" + ele);
                    if (info && info.isDirectory()) {
                        let dir = {
                            'label': ele,
                            'children': [],
                            'isIncludeHtml': false,
                            'path': path + '\\' + ele
                        };
                        model.children.push(dir);
                        _this.readDir(path + "\\" + ele, dir);
                    } else {
                        if (_this.htmlReg.test(ele)) {
                            model.isIncludeHtml = true;
                        }
                    }
                })
            },
            swichProject() {
                this.$router.push({
                    name: 'mainLayout'
                })
            },
            /**
             * 添加一个子级空目录
             * @param data
             */
            addDir(data) {
                let path = data.path;
                this.inputDirName()
                    .then(({value}) => {
                        fs.mkdirSync(path + "\\" + value);
                    }).catch((err) => {
                    throw err;
                })

            },
            /**
             * 添加一个子级目录，包含index.html模板
             * @param node
             * @param data
             */
            addModel(node, data) {
                let templatePath = path.resolve('./static/template/index.html');
                if (process.env.NODE_ENV !== "development") {
                    templatePath = __dirname.replace(".asar", "") + "/static/template/index.html";
                }
                let currentPath = data.path;
                this.inputDirName()
                    .then(({value}) => {
                        fs.readFile(templatePath, "utf-8", function (err, template) {
                            if (!err) {
                                let newPath = currentPath + "\\" + value;
                                fs.mkdir(newPath, function (err) {
                                    if (!err) {
                                        fs.writeFile(newPath + "\\index.html", template, "utf-8", function (err) {
                                            if (err) {
                                                console.warn(err);
                                            } else {

                                            }
                                        })
                                    }
                                })
                            } else {
                                throw err;
                            }
                        })
                    }).catch((err) => {
                    throw err;
                });
            },
            /**
             * 编译
             */
            buildProject(callback) {
                let projectPath = this.projectPath;
                let buildPath = path.resolve('./projectDist');
                let _this = this;
                this.loading = true;
                let pluginPath;
                if (process.env.NODE_ENV !== "development") {
                    pluginPath = __dirname.replace(".asar", "") + "/static/build/index.js";
                } else {
                    pluginPath = "static/build/index.js";
                }
                child_process.exec('node ' + pluginPath + " " + projectPath + " " + buildPath, function (error, stdout, stderr) {
                    if (error) {
                        _this._writeLog(error);
                        _this.loading = false;
                        return;
                    }
                    console.log(stdout);
                    callback(buildPath);
                    _this.emptyDir(buildPath);
                    _this.rmEmptyDir(buildPath);
                    _this.loading = false;
                })
            },
            /**
             * 上传
             */
            buildAndRun() {
                this.buildProject(this.upLoadZip);
            },
            /**
             * 导出
             */
            exportMix() {
                this.buildProject(this.condense)
            },
            /**
             * 压缩导出
             * @param buildPath
             */
            condense(buildPath) {
                let zip = new JSZip();
                let projectName = this.projectName;
                this.setPackageTime(buildPath);
                this.read(buildPath, zip);
                zip.generateAsync({type: 'blob'})
                    .then(function (content) {
                        // see FileSaver.js
                        // console.log(content);
                        FileSaver.saveAs(content, projectName + '.zip');
                    });
            },
            /**
             * 压缩上传
             * @param buildPath
             */
            upLoadZip(buildPath) {
                this.setPackageTime(buildPath);
                const config = this.getConfig(buildPath);
                const iconBuffer = this.getIcon(buildPath); // 获取图片
                let _this = this;
                let zip = new JSZip();
                this.read(buildPath, zip);
                zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}) // 获取插件
                    .then(function (pluginBuffer) {
                        _this.getPreSignedUrl('plugin', pluginBuffer);
                        _this.getPreSignedUrl('icon', iconBuffer);
                        // setTimeout(function () {
                        _this.addPlugin(config)
                        // }, 2000)

                    })
            },
            setPackageTime(path) {
                const package_time = Number(new Date());
                let configJson = this.getConfig(path);
                configJson.package_time = package_time;
                fs.writeFileSync(path + '/config/config.json', JSON.stringify(configJson), 'utf-8');
            },
            getConfig(path) {
                return JSON.parse(fs.readFileSync(path + '/config/config.json', 'utf-8'));
            },
            getIcon(path) {
                return fs.readFileSync(path + '/config/icon.png');
            },
            getPreSignedUrl(type, buffer) {
                let suffix = type === 'plugin' ? this.projectName + '.zip' : 'icon.png';
                let bucket = type === 'plugin' ? 'zwt' : 'public';
                let path = 'plugin/' + this.getDate() + '/' + suffix;
                const data = {
                    "bucket_name": bucket,
                    "path": path,
                    "http_method": "PUT"
                };
                console.log(bucket, path);
                type === 'plugin' ? this.pluginPath = 'zwt/' + path : this.iconPath = 'public/' + path;
                const url = 'http://192.168.12.53:31022/base/attachment/action/generate-s3-pre-signed-url';
                this.$http.post(url, JSON.stringify(data)).then((res) => {
                    // 上传
                    // return this.$http.put(res.data, buffer);
                    this.$http.put(res.data, buffer).then((res) => {
                        console.log(type, 'success');
                    }).catch((error) => {
                        console.log(error);
                        this._writeLog(error);
                    })
                }).catch((error) => {
                    console.log(error);
                    this._writeLog(error);
                })

            },
            addPlugin(config) {
                let url = 'http://192.168.12.53:31022/base/plugin';
                let data = {
                    'name': config.name,
                    'identifier': config.identifier,
                    "plugin_path": this.pluginPath,
                    "icon_path": this.iconPath,
                    "description": config.description,
                    "author": config.author
                }
                this.$http.post(url, JSON.stringify(data)).then((res) => {
                    this.$message({message: '上传成功！', type: 'success'})
                }).catch((error) => {
                    console.log(error);
                    this._writeLog(error);
                })
            },
            /**
             * 读取编译后的项目文件，添加到压缩对象
             */
            read(path, zip) {
                // let config = fs.readFileSync(path, 'utf-8');
                let _this = this;
                let menu = fs.readdirSync(path);
                menu.forEach(function (ele) {
                    let info = fs.statSync(path + "\\" + ele);
                    if (info && info.isDirectory()) {
                        let folder = zip.folder(ele);
                        _this.read(path + "\\" + ele, folder);
                    } else {
                        let fr = fs.readFileSync(path + "\\" + ele);
                        zip.file(ele, fr);
                    }
                })
            },
            /**
             * 监听项目目录结构是否有改动
             */
            watchFileTrees() {
                let _this = this;
                let chokidar = require('chokidar');
                let watcher = chokidar.watch(_this.projectPath);
                let log = console.log.bind(console);
                let ready = false;
                watcher
                    .on('ready', function () {
                        console.info('Initial scan complete. Ready for changes.');
                        ready = true
                    })
                    .on('add', function (path) {
                        if (ready) {
                            log('File', path, 'has been added');
                            _this.init();
                        }
                    })
                    .on('addDir', function (path) {
                        if (ready) {
                            log('Directory', path, 'has been added');
                            // _this.readDir(_this.projectPath);
                            _this.init();
                        }
                    })
                    .on('change', function (path) {
                        if (ready) {
                            log('File', path, 'has been changed');
                            _this.init();
                        }
                    })
                    .on('unlink', function (path) {
                        if (ready) {
                            log('File', path, 'has been removed');
                            _this.init();
                        }
                    })
                    .on('unlinkDir', function (path) {
                        if (ready) {
                            log('Directory', path, 'has been removed');
                            _this.init();
                        }
                    })
            },
            /**
             * 输入文件夹或者文件名
             */
            inputDirName() {
                return this.$prompt('Please input directory(page) name:', {
                    confirmButtonText: 'Create',
                    showCancelButton: false
                })
            },
            /**
             * 添加跟文件夹
             */
            addRootDir() {
                let path = this.projectPath;
                this.inputDirName().then(({value}) => {
                    fs.mkdirSync(path + "\\" + value);
                }).catch((err) => {
                    throw err;
                })
            },
            /**
             * 清空文件夹
             * @param fileUrl
             */
            emptyDir(fileUrl) {
                let files = fs.readdirSync(fileUrl);//读取该文件夹
                let _this = this;
                files.forEach(function (file) {
                    let stats = fs.statSync(fileUrl + '/' + file);
                    if (stats.isDirectory()) {
                        _this.emptyDir(fileUrl + '/' + file);
                    } else {
                        fs.unlinkSync(fileUrl + '/' + file);
                    }
                });
            },
            /**
             * 删除空文件夹
             * @param fileUrl
             */
            rmEmptyDir(fileUrl) {
                let files = fs.readdirSync(fileUrl);
                let _this = this;
                if (files.length > 0) {
                    var tempFile = 0;
                    files.forEach(function (fileName) {
                        tempFile++;
                        _this.rmEmptyDir(fileUrl + '/' + fileName);
                    });
                    if (tempFile == files.length) {//删除母文件夹下的所有字空文件夹后，将母文件夹也删除
                        fs.rmdirSync(fileUrl);
                    }
                } else {
                    fs.rmdirSync(fileUrl);
                }
            },
            getDate() {
                const date = new Date();
                const y = date.getFullYear();
                const m = date.getMonth() + 1 < 10
                    ? '0' + date.getMonth() + 1
                    : date.getMonth() + 1;
                const d = date.getDate() < 10
                    ? '0' + date.getDate()
                    : date.getDate();
                return y.toString() + m + d;
            },
            uploadFile(url, fileName) {
                let options = {
                    method: 'PUT',
                    url: url,
                    body: fs.readFileSync(fileName)
                }
            }
        },
        mounted() {
            this.init();
            // this.getPreSignedUrl();
        }
    }
</script>

<style scoped>

    aside {
        position: relative;
        background-color: #353535;
        color: #FFFFFF;
        height: 543px;
    }

    aside .header {
        height: 80px;
        padding: 16px;
    }

    aside .header i {
        font-style: normal;
        font-size: 14px;
    }

    aside .toolbar {
        height: 200px;
        padding: 16px;
    }

    aside .toolbar button {
        background-color: transparent !important;
        color: #FFFFFF;
    }

    aside .footer {
        position: absolute;
        width: 100%;
        bottom: 10px;
        text-align: center;
        font-size: 12px;
    }

    main {
        position: relative;
        background-color: #2E2E2E;
        padding: 0;
    }

    main .el-tree {
        background-color: #2E2E2E;
        padding: 20px;
    }

    main .el-tree .el-tree-node,
    main .el-tree .is-current {
        background-color: transparent !important;
    }

    main .el-tree .el-tree-node .el-tree-node__content,
    main .el-tree .is-current .el-tree-node__content {
        background-color: transparent !important;
        color: #ACACAC;
    }

    .custom-tree-node {
        color: #ACACAC;
        background-color: transparent;
    }

    main .custom-tree-node {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        padding-right: 8px;
    }

    main .btn {
        position: absolute;
        bottom: 0;
        width: 100%;
        text-align: center;
    }

</style>

<style>
    main .el-tree .el-tree-node .el-tree-node__content,
    main .el-tree .is-current .el-tree-node__content {
        background-color: #404040;
        color: #ACACAC;
        margin: 2px 0;
    }

    main .el-tree .el-tree-node .el-tree-node__children,
    main .el-tree .is-current .el-tree-node__children {
        margin: 2px 0;
    }

    main .el-tree .el-tree-node .el-tree-node__content .el-button,
    main .el-tree .is-current .el-tree-node__content .el-button {
        color: #ACACAC;
    }

    .el-message-box {
        background-color: #2E2E2E !important;
        border: none;
        border-radius: 0;
        color: #ffffff;
    }

    .el-message-box .el-message-box__message {
        color: #ACACAC;
    }

    .el-message-box .el-button {
        background-color: #434343 !important;
        border-color: #5C5C5C;
        color: #ACACAC;
    }
</style>