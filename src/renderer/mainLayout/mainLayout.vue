<template>
    <!--<div>-->
    <!--<el-row>-->
    <!--<el-button size="small" @click="dialogVisible = true">生成二维码</el-button>-->
    <!--<el-button size="small" type="primary" @click="readDir('E:\\Git')">遍历E盘Git文件夹</el-button>-->
    <!--<el-button size="small" type="primary" @click="callBat()">Call bat</el-button>-->
    <!--</el-row>-->
    <!--<input type="file" id="file" webkitdirectory directory-->
    <!--style="filter:alpha(opacity=0);opacity:0;width: 0;height: 0;"/>-->
    <!--<el-button size="small" type="primary" @click="selectFile()">select file</el-button>-->
    <!--<el-dialog-->
    <!--title="二维码"-->
    <!--:visible.sync="dialogVisible"-->
    <!--width="400px"-->
    <!--@opened="makeQRCode"-->
    <!--&gt;-->
    <!--<div id="qrcode" v-loading="loading"></div>-->
    <!--<span slot="footer" class="dialog-footer">-->
    <!--<el-button @click="dialogVisible = false" size="mini">取 消</el-button>-->
    <!--<el-button type="primary" @click="dialogVisible = false" size="mini">确 定</el-button>-->
    <!--</span>-->
    <!--</el-dialog>-->
    <!--</div>-->
    <el-container v-loading="loading" element-loading-text="正在加载插件...">
        <el-aside>
            <div id="header">
                <img src="../../../static/images/lemon-it-logo.png" alt="">
                <div>LEMIX TOOL BOX</div>
            </div>
            <ul>
                <li>
                    <el-button>Creat new Lemix Project</el-button>
                </li>
                <li>
                    <el-button @click="selectFile()">Open an exists Lemix Project</el-button>
                </li>
                <li>
                    <el-button>Tool box settings</el-button>
                </li>
                <li>
                    <el-button>View Lemix source</el-button>
                </li>
            </ul>
            <div id="footer">
                <input type="file" id="file" webkitdirectory directory/>
                <div>Powered by LemonIT.CN</div>
            </div>
        </el-aside>
        <el-main>
            <ul>
                <li class="projectList" v-for="(project,index) in projectList">
                    <el-row>
                        <el-col :span="23">
                            <div class="name">
                                <el-button type="text" v-text="project.name"
                                           @click="openProject(index,project)"></el-button>
                            </div>
                            <div class="path">Path:{{project.path}}</div>
                        </el-col>
                        <el-col :span="1">
                            <i class="close el-icon-close" @click="handleClose(index)"></i>
                        </el-col>
                    </el-row>
                </li>
            </ul>
        </el-main>
    </el-container>
</template>

<script>
    import QRCode from 'qrcodejs2'
    import fs from 'fs'
    import asar from 'asar'

    export default {
        name: "mainLayout",
        data() {
            return {
                dialogVisible: false,
                loading: false,
                projectList: [],
                test: {},
                loading: false,
            }
        },
        methods: {
            /**
             * dialog opened 回调
             */
            makeQRCode() {
                this.loading = true;
                let codeEle = document.querySelector("#qrcode");
                this.removeAllChilds();
                let qrcode = new QRCode(codeEle, {width: 300, height: 300});
                let src = "static/images/logo.png";
                let randomString = this.randomString(64);
                qrcode.makeCode(randomString);
                this._makeLogo(qrcode, src);
                this.loading = false;
            },
            /**
             * 清除已存在的二维码
             */
            removeAllChilds() {
                let codeEle = document.querySelector("#qrcode");
                while (codeEle.hasChildNodes()) //当elem下还存在子节点时 循环继续
                {
                    codeEle.removeChild(codeEle.firstChild);
                }
            },
            /**
             * 生成随机字符串
             * @param len
             * @returns {string}
             */
            randomString(len) {
                len = len || 32;
                let $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let maxPos = $chars.length;
                let randomString = '';
                for (let i = 0; i < len; i++) {
                    randomString += $chars.charAt(Math.floor(Math.random() * maxPos));
                }
                return randomString;
            },
            /**
             * 遍历文件
             */
            // readDir(path) {
            //     let _this = this;
            //     fs.readdir(path, function (err, menu) {
            //         if (!menu)
            //             return;
            //         menu.forEach(function (ele) {
            //             fs.stat(path + "\\" + ele, function (err, info) {
            //                 if (info && info.isDirectory()) {
            //                     console.log("dir: " + ele)
            //                     _this.readDir(path + "\\" + ele);
            //                 } else {
            //                     console.log("file: " + ele)
            //                 }
            //             })
            //         })
            //     })
            // },
            /**
             * 批处理
             */
            // callBat() {
            //     let current_path = path.join(__dirname);
            //     let current_path_array = current_path.split("\\");
            //     current_path_array.splice(-4, 4);
            //     let absolute_path = current_path_array.join("\\");
            //     this._callBat("test.bat", null, {cwd: absolute_path})
            // },
            /**
             * 选择项目
             */
            selectFile() {
                let file_input = document.querySelector("#file");
                file_input.click();
            },
            fileInputListener() {
                let file_input = document.querySelector("#file");
                let _this = this;
                file_input.addEventListener("change", function () {
                    if (this.files.length > 0) {
                        let projectPath = this.files[0].path;
                        let projectName = projectPath.split("\\").splice(-1).toString();
                        _this.projectList.push({"name": projectName, "path": projectPath});
                    }
                });
            },
            /**
             * 从项目列表移除项目
             */
            handleClose(index) {
                this.projectList.splice(index, 1);
                let file_input = document.querySelector("#file");
                file_input.value = "";
            },
            /**
             * 打开项目
             */
            openProject(index, project) {
                if (index !== 0) {
                    let currentProject = this.projectList.splice(index, 1);
                    this.projectList.unshift(currentProject[0]);
                    let fr = JSON.stringify(this.projectList);
                    fs.writeFile("project.json", fr, "utf-8", function (err) {
                        if (err) {
                            console.warn(err);
                        } else {

                        }
                    })
                }
                /*****路由跳转*****/
                fs.readdir(project.path, function (err) {
                    if (err) {
                        console.warn(err);
                    } else {
                        this.$router.push({
                            name: 'currentProject',
                            params: {
                                project: project
                            }
                        })
                    }
                }.bind(this));
            },
            /**
             * 读取项目列表
             */
            readProject() {
                let _this = this;
                if (fs.existsSync("project.json")) {
                    fs.readFile("project.json", "utf-8", function (err, fr) {
                        if (err) {
                            _this._writeLog(err);
                        } else {
                            _this.projectList = JSON.parse(fr);
                        }
                    })
                }
            }
        },
        mounted() {
            this.fileInputListener();
            this.readProject();
        },
        watch: {
            projectList: {
                handler(val, o) {
                    let fr = JSON.stringify(val);
                    let _this = this;
                    fs.writeFile("project.json", fr, "utf-8", function (err) {
                        if (err) {
                            _this._writeLog(err);
                        }
                    })
                }
                ,
                deep: true,
            }
        }
    }
</script>

<style scoped>
    ul {
        padding: 20px;
    }

    li {
        list-style: none;
        height: 40px;
        line-height: 40px;
    }

    button {
        border: none;
        text-align: left;
        background-color: transparent !important;
        color: #ffffff;
        padding: 0;
    }

    aside {
        background-color: #3F4042;
        color: #ffffff;
        width: 240px !important;
    }

    aside ul {
        background-color: #3A3A3A;
        margin: 0;
    }

    aside #header {
        height: 213px;
        text-align: center;
    }

    aside #header img {
        margin-top: 40px;
        margin-bottom: 10px;
    }

    aside #footer {
        width: 100%;
        height: 130px;
        text-align: center;
        background-color: #414244;
        position: relative;
    }

    aside #footer div {
        position: absolute;
        bottom: 10px;
        left: 60px;
        font-family: Helvetica;
        font-size: 10px;
    }

    main {
        background-color: #353535;
        color: #ffffff;
    }

    #file {
        filter: alpha(opacity=0);
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute
    }

    .projectList {
        width: 100%;
        height: 40px;
        background-color: #484848;
        margin: 5px 0;
        padding: 10px;
    }

    .projectList:hover .close {
        opacity: 1;
    }

    .projectList .name {
        height: 20px;
        width: 80%;
        line-height: 20px;
    }

    .projectList .name button {
        font-weight: bold;
        color: #FFF !important;
    }

    .projectList .path {
        height: 20px;
        width: 80%;
        line-height: 20px;
    }

    .projectList .close {
        line-height: 40px;
        opacity: 0;
        cursor: pointer;
        transition: opacity 1s;
        transform: rotate(0deg);
    }

    .projectList .close:hover {
        transform: rotate(360deg);
        transition: all 0.5s ease;
    }
</style>