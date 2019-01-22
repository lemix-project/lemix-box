<template>
    <el-container v-loading="loading" element-loading-text="正在创建项目..." id="mainLayout">
        <el-aside>
            <div id="header">
                <img src="../../../static/images/lemon-it-logo.png" alt="">
                <div>LEMIX TOOL BOX</div>
            </div>
            <ul>
                <li>
                    <el-button @click="createProject()">Creat new Lemix Project</el-button>
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
        <el-dialog title="Please input configuration" :visible.sync="dialogFormVisible" width="60%" @closed="closed()">
            <el-form ref="form" :model="form" :rules="rules" label-position="left">
                <el-form-item label="projectName" :label-width="formLabelWidth" prop="projectName"
                              :inline-message="isInline">
                    <el-input v-model="form.projectName" autocomplete="off" size="mini"></el-input>
                </el-form-item>
                <el-form-item label="namespace" :label-width="formLabelWidth" prop="namespace"
                              :inline-message="isInline">
                    <el-select v-model="form.namespace" placeholder="please choose namespace" size="mini">
                        <el-option
                                v-for="item in namespace"
                                :key="item.ns_identifier"
                                :label="item.ns_name"
                                :value="item.ns_identifier"
                        >
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="identifier" :label-width="formLabelWidth" prop="identifier"
                              :inline-message="isInline">
                    <el-input v-model="form.identifier" autocomplete="off" size="mini"></el-input>
                </el-form-item>
                <el-form-item label="name" :label-width="formLabelWidth" prop="name" :inline-message="isInline">
                    <el-input v-model="form.name" autocomplete="off" size="mini"></el-input>
                </el-form-item>
                <el-form-item label="description" :label-width="formLabelWidth" prop="description"
                              :inline-message="isInline">
                    <el-input v-model="form.description" autocomplete="off" size="mini"></el-input>
                </el-form-item>
                <el-form-item label="author" :label-width="formLabelWidth" prop="author" :inline-message="isInline">
                    <el-input v-model="form.author" autocomplete="off" size="mini"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button type="primary" @click="complete('form')">确 定</el-button>
            </div>
        </el-dialog>
    </el-container>
</template>

<script>
    import fs from 'fs'
    import path from 'path'

    export default {
        name: "mainLayout",
        data() {
            return {
                projectList: [],
                test: {},
                loading: false,
                flag: '',
                templatePath: '',
                form: {
                    'projectName': '',
                    'namespace': '',
                    'identifier': '',
                    'name': '',
                    'description': '',
                    'author': ''
                },
                dialogFormVisible: false,
                formLabelWidth: '90px',
                projectPath: '',
                projectName: '',
                namespace: [],
                host: 'http://192.168.11.203:8082',
                createPath: '',
                isInline: true,
                rules: {
                    projectName: [
                        {required: true, message: 'Please input projectName', trigger: 'blur'},
                    ],
                    namespace: [
                        {required: true, message: 'Please choose namespace', trigger: 'change'},
                    ],
                    identifier: [
                        {required: true, message: 'Please input identifier', trigger: 'blur'},
                    ],
                    name: [
                        {required: true, message: 'Please input name', trigger: 'blur'},
                    ],
                    description: [
                        {required: true, message: 'Please input description', trigger: 'blur'},
                    ],
                    author: [
                        {required: true, message: 'Please input author', trigger: 'blur'},
                    ]
                }
            }
        },
        methods: {
            /**
             * 打开项目
             */
            selectFile() {
                let file_input = document.querySelector("#file");
                this.flag = 'open';
                file_input.value = '';
                file_input.click();
            },
            /**
             * 创建项目
             */
            createProject() {
                let file_input = document.querySelector("#file");
                this.flag = 'create';
                file_input.value = '';
                file_input.click();
            },
            /**
             * 监听input_file
             */
            fileInputListener() {
                let file_input = document.querySelector("#file");
                let _this = this;
                file_input.addEventListener("change", function () {
                    if (file_input.files.length > 0) {
                        if (_this.flag === 'open') {
                            let projectPath = file_input.files[0].path;
                            let projectName = projectPath.split("\\").splice(-1).toString();
                            _this.projectList.push({"name": projectName, "path": projectPath});
                        } else if (_this.flag === 'create') {
                            _this.createPath = file_input.files[0].path;
                            _this.dialogFormVisible = true;
                            _this.getNamespace();
                        }
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
            },
            /**
             * 输入文件夹或者文件名
             */
            inputDirName() {
                return this.$prompt('Please input project name:', {
                    confirmButtonText: 'Create',
                    showCancelButton: false,
                    inputPattern: /^[A-Za-z]+$/,
                    inputErrorMessage: 'Please input project name correctly!(e.g.:[a-zA-Z])'
                })
            },
            /**
             * 读取模板
             * @param projectPath
             */
            readTemp(projectPath) {
                let templatePath = path.resolve('./static/template');
                if (process.env.NODE_ENV !== "development") {
                    templatePath = __dirname + "/static/template";
                }

                if (!fs.existsSync(projectPath)) {
                    fs.mkdirSync(projectPath)
                }
                this.templatePath = templatePath;
                fs.readFile(templatePath + '/projectTemp.json', 'utf-8', (err, fr) => {
                    if (err) {
                        this._writeLog(err);
                    } else {
                        let temp = JSON.parse(fr);
                        this.create(temp, projectPath);
                        // 将新创建的项目添加到项目列表
                        this.projectList.push({"name": this.projectName, "path": projectPath})
                    }

                })
            },
            /**
             * 创建项目目录结构
             * @param temp
             * @param path
             */
            create(temp, path) {
                for (let key in temp) {
                    let sub = temp[key];
                    if (sub.children) {
                        let cPath = path + '\\' + sub.name;
                        fs.mkdirSync(cPath);
                        this.create(sub.children, cPath);
                    } else {
                        let cPath = path + '\\' + sub.name;
                        if (sub.name === 'index.html') {
                            let buffer = fs.readFileSync(this.templatePath + '/index.html');
                            fs.writeFileSync(cPath, buffer)
                        } else if (sub.name === 'config.json' && path.split('\\').pop() === 'config') {
                            let configuration = fs.readFileSync(this.templatePath + '/config.json', 'utf-8'),
                                configObj = JSON.parse(configuration),
                                config = {
                                    "identifier": this.form.identifier,
                                    "name": this.form.name,
                                    "author": this.form.author
                                };
                            Object.assign(configObj, config)
                            fs.writeFileSync(cPath, JSON.stringify(configObj), 'utf-8');
                        } else if (sub.name === 'icon.png') {
                            let buffer = fs.readFileSync(this.templatePath + '/icon.png');
                            fs.writeFileSync(cPath, buffer)
                        } else {
                            fs.writeFileSync(cPath, "");
                        }
                    }
                }
            },
            complete(formName) {
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        this.dialogFormVisible = false;
                        this.projectPath = this.createPath + '\\' + this.form.projectName;
                        this.projectName = this.form.projectName;
                        let param = {
                            "ns_identifier": this.form.namespace,
                            "mm_name": this.form.name,
                            "bundle_identifier": this.form.identifier,
                            "mm_description": this.form.description
                        }, url = this.host + '/lemix/module';
                        this.$http.post(url, JSON.stringify(param)).then(res => {
                            console.log(res);
                            this.readTemp(this.projectPath);
                        }).catch(err => {
                            console.log(err);
                        })
                    } else {
                        console.log('error submit!!');
                        return false;
                    }
                });
            },
            getNamespace() {
                let url = this.host + '/lemix/nameSpace';
                this.$http.get(url).then(res => {
                    console.log(res);
                    this.namespace = res.data
                }).catch(err => {
                    console.log(err);
                })
            },
            closed(){
                this.$refs['form'].resetFields()
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
<style>
    #mainLayout .el-dialog {
        background-color: #353535;
    }

    #mainLayout .el-dialog .el-dialog__title {
        color: #ffffff;
    }

    #mainLayout .el-dialog .el-form-item__label {
        color: #ffffff !important;
    }

    #mainLayout .el-input {
        width: 200px;
    }

    #mainLayout .el-form-item {
        margin-bottom: 0;
    }
</style>