<template>
  <el-container v-loading="loading" id="current">
    <el-aside>
      <div class="header">
        <div><b>Current Project:</b></div>
        <div><i>{{projectName}}</i></div>
      </div>
      <div class="toolbar">
        <el-row>
          <el-col :span="12">
            <button class="btn" @click="buildAndUpload()">
              <img src="../../../static/images/build.png" alt=""><br>
              <span>Build & Upload</span>
            </button>
          </el-col>
          <el-col :span="12">
            <button class="btn" @click="exportMix()">
              <img src="../../../static/images/export.png" alt=""><br>
              <span>Export MixModule</span>
            </button>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="12">
            <button class="btn" @click="buildAndRun()">
              <img src="../../../static/images/build.png" alt=""><br>
              <span>Build & Run</span>
            </button>
          </el-col>
          <el-col :span="12">
            <button class="btn" @click="swichProject()">
              <img src="../../../static/images/swtich.png" alt=""><br>
              <span>Swtich Project</span>
            </button>
          </el-col>
        </el-row>
      </div>
      <div class="footer">Powered by LemonIT.CN</div>
    </el-aside>
    <el-main>
      <el-tree :data="projectData">
                <span class="custom-tree-node" slot-scope="{ node, data }">
                    <span>
                        <span v-if="data.isIncludeHtml">
                            <img class="icon" src="../../../static/images/page.png" alt="">
                        </span>
                        <span v-else>
                            <img class="icon" src="../../../static/images/dir.png" alt="">
                        </span>
                        <span>{{ node.label }}</span>
                    </span>
                    <span>
                        <span v-show="!data.isIncludeHtml&&data.children.length===0">
                            <el-button type="text" size="mini" @click="addDir(data)">
                            <img class="icon" src="../../../static/images/dir-add.png" alt="">
                        </el-button>
                        <el-button type="text" size="mini" @click="addModel(node, data)">
                            <img class="icon" src="../../../static/images/page-add.png" alt="">
                        </el-button>
                        </span>
                        <span id="remove"
                              v-show="!(['config','pages','static'].includes(node.label)&&node.level ===1)">
                            <el-button type="text" size="mini" @click="remove(data)">
                            <img class="remove" src="../../../static/images/remove.png" alt="">
                        </el-button>
                        </span>
                    </span>
                </span>
      </el-tree>
      <div class="btn">
        <img class="icon" src="../../../static/images/dir-add.png" alt="">
        <el-button type="text" size="mini" @click="addRootDir()">
          Add root directory
        </el-button>
      </div>
    </el-main>
    <el-dialog
      :visible.sync="dialogVisible"
      width="340px"
      @opened="makeQRCode"
    >
      <div id="qrCode" v-loading="dialogLoading"></div>
      <span slot="footer" class="dialog-footer">
        </span>
    </el-dialog>
    <el-dialog title="Please input configuration" :visible.sync="dialogFormVisible" width="60%" @closed="closed()">
      <el-form ref="form" :model="form" :rules="rules" label-position="left">
        <el-form-item label="author" :label-width="formLabelWidth" prop="author"
                      :inline-message="isInline">
          <el-input v-model="form.author" autocomplete="off" size="mini"></el-input>
        </el-form-item>
        <el-form-item label="entrance" :label-width="formLabelWidth" prop="entrance"
                      :inline-message="isInline">
          <el-input v-model="form.entrance" autocomplete="off" size="mini"></el-input>
        </el-form-item>
        <el-form-item label="description" :label-width="formLabelWidth" prop="description"
                      :inline-message="isInline">
          <el-input v-model="form.description" autocomplete="off" size="mini"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="complete('form')" size="mini">确 定</el-button>
      </div>
    </el-dialog>
    <div id="box"></div>
  </el-container>
</template>

<script>
  import fs from 'fs'
  import path from 'path'
  import JSZip from 'jszip'
  import FileSaver from 'file-saver'
  import QRCode from 'qrcodejs2'
  import chokidar from 'chokidar'
  import Build from '../build/index'
  import {ipcRenderer} from 'electron'
  import lemix from '../../../static/lemix'

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
        iconPath: '',
        dialogVisible: false,
        watcher: null,
        downloadUrl: '',
        dialogLoading: false,
        // host: 'http://testapi-lyzwt.lnzhongwang.net',
        // port: '31029',
        host: 'http://192.168.11.203:8082',
        filters: [],
        form: {
          'author': '',
          'entrance': '',
          'description': ''
        },
        rules: {
          entrance: [
            {required: true, message: 'Please input entrance', trigger: 'blur'}
          ],
          description: [
            {required: true, message: 'Please input description', trigger: 'blur'}
          ]
        },
        dialogFormVisible: false,
        formLabelWidth: '90px',
        isInline: true,
      }
    },
    methods: {
      /**
       * 界面初始化
       */
      init() {
        if (this.$route.params.project) {
          let project = this.$route.params.project;
          this.projectName = project.name;
          this.projectPath = project.path;
          this.projectModel.children = [];
          this.$set(this, "projectData", this.projectModel.children);
          this.filter();
          this.readDir(project.path);
        }
      },
      /**
       * 读取项目目录结构
       * @param path
       * @param model
       */
      readDir(path, model = this.projectModel) {
        let _this = this;
        let menu = fs.readdirSync(path);
        menu.forEach(function (ele) {
          if (!_this.filters.includes(path + '\\' + ele)) {
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
          }
        })
      },
      /**
       * 返回主页面
       */
      swichProject() {
        this.$router.push({
          name: 'mainLayout'
        });
        if (this.watcher) {
          this.watcher.close();
        }
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
          templatePath = __dirname + "/static/template/index.html";
        }
        let currentPath = data.path;
        this.inputDirName()
          .then(({value}) => {
              if (value) {
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
              } else {
                reject()
              }
            }
          ).catch((err) => {
          throw err;
        });
      },
      /**
       * 编译
       * @param callback
       */
      buildProject(callback) {
        let projectPath = this.projectPath;
        let buildPath = path.resolve('./projectDist');
        this.loading = true;
        let pluginPath;
        if (process.env.NODE_ENV !== "development") {
          pluginPath = __dirname.replace(".asar", "") + "/static/build/index.js";
        } else {
          pluginPath = "static/build/index.js";
        }
        Build.build(projectPath, buildPath);
        callback(buildPath);
        // this.removeDir(buildPath);
        this.loading = false;
      }
      ,
      /**
       * 上传
       */
      buildAndUpload() {
        if (this.isNewProject()) {
          this.dialogFormVisible = true
        } else {
          this.buildProject(this.upLoadZip);
        }
      }
      ,
      /**
       * 导出
       */
      exportMix() {
        if (this.isNewProject()) {
          this.dialogFormVisible = true
        } else {
          this.buildProject(this.exportMix);
        }
      }
      ,
      /**
       * 压缩（导出）
       * @param buildPath
       */
      exportMix(buildPath) {
        let zip = new JSZip();
        let projectName = this.projectName;
        this.setPackageTime(buildPath);
        this.read(buildPath, zip);
        zip.generateAsync({type: 'blob'})
          .then(function (content) {
            FileSaver.saveAs(content, projectName + '.zip');
          });
      }
      ,
      /**
       * 压缩（上传）
       * @param buildPath
       */
      upLoadZip(buildPath) {
        this.setPackageTime(buildPath);
        const config = this.getConfig(buildPath);
        const iconBuffer = this.getIcon(buildPath); // 获取图片
        let zip = new JSZip();
        this.read(buildPath, zip);
        zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}) // 获取插件
          .then((packageBuffer) => {
            let data = {
                'config': config,
                'package': packageBuffer,
                'icon': iconBuffer,
                'identifier': config.identifier,
                'version': config.version,
                'author': config.author,
                'entrance': config.entrance,
                'package_time': config.package_time
              },
              url = this.host + '/lemix/upload';
            this.$http.put(url, JSON.stringify(data)).then(res => {
              let id = res.data.pkid;
              this.iconPath = res.data.icon_path
              this.getDownloadUrl(id)
            }).catch(err => {
              console.log(err.response.data);
            })
          })
      }
      ,
      /**
       * 写入时间戳
       * @param path
       */
      setPackageTime(path) {
        const package_time = Number(new Date());
        let configJson = this.getConfig(path);
        configJson.package_time = package_time;
        fs.writeFileSync(path + '/config/config.json', JSON.stringify(configJson), 'utf-8');
      }
      ,
      /**
       * 获取插件配置
       * @param path
       * @returns {json}
       */
      getConfig(path) {
        return JSON.parse(fs.readFileSync(path + '/config/config.json', 'utf-8'));
      }
      ,
      /**
       * 获取插件图标
       * @param path
       * @returns {Buffer}
       */
      getIcon(path) {
        return fs.readFileSync(path + '/config/icon.png');
      }
      ,
      /**
       * 获取预签名地址并上传
       * @param type
       * @param buffer
       */
      getPreSignedUrl(type) {
        let suffix = type === 'plugin' ? this.projectName + '.zip' : 'icon.png';
        let bucket = type === 'plugin' ? 'zwt' : 'public';
        let path = 'plugin/' + Number(new Date()) + '/' + suffix;
        const data = {
          "bucket_name": bucket,
          "path": path,
          "http_method": "PUT"
        };
        type === 'plugin' ? this.pluginPath = 'zwt/' + path : this.iconPath = 'public/' + path;
        const url = this.host + ':' + this.port + '/base/attachment/action/generate-s3-pre-signed-url';
        return this.$http.post(url, JSON.stringify(data))
      }
      ,
      uploadPreSignedUrl(data, buffer) {
        // 预签名地址上传
        return this.$http.put(data, buffer)
      },
      /**
       * 新增插件条目
       * @param config
       */
      addPlugin(config) {
        // let url = 'http://192.168.12.53:31022/base/plugin';
        /**
         * show qrcode when insert plugin;
         * show message when update plugin;
         * the param is
         */
        let url = this.host + ':' + this.port + '/base/plugin';
        let data = {
          'pkid': '97604895dc7147cc9fdb5ba70f599f63', // 插件主键
          'name': config.name,
          'identifier': config.identifier,
          'plugin_path': this.pluginPath,
          'icon_path': this.iconPath,
          'description': config.description,
          'author': config.author
        };
        console.log(JSON.stringify(data, null, 2));
        this.$http.put(url, JSON.stringify(data)).then((res) => {
          console.log(res)
          this.$message({message: '更新成功', type: 'success'});
          // let pkid = res.data.pkid,
          //     package_time = res.data.package_time;
          // this.getDownloadUrl(pkid, package_time);
        }, error => {
          console.log(error);
        }).catch((error) => {
          console.log(error)
          this._writeLog(error);
        })
      }
      ,
      /**
       * 读取编译后的项目文件，添加到压缩对象
       * @param path
       * @param zip
       */
      read(path, zip) {
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
          }
        )
      }
      ,
      /**
       * 监听项目目录结构是否有改动
       */
      watchFileTrees() {
        let _this = this;
        this.watcher = chokidar.watch(_this.projectPath, {ignored: /.idea|node_modules/});
        let log = console.log.bind(console);
        let ready = false;
        this.watcher
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
      }
      ,
      /**
       * 输入文件夹或者文件名
       */
      inputDirName() {
        return this.$prompt('Please input directory(page) name:', {
          confirmButtonText: 'Create',
          showCancelButton: false,
          inputPattern: /^[A-Za-z]+$/,
          inputErrorMessage: 'Please input directory(page) name correctly!(e.g.:[a-zA-Z])'
        })
      }
      ,
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
      }
      ,
      /**
       * 删除文件夹
       * @param fileUrl
       */
      removeDir(fileUrl) {
        let files = fs.readdirSync(fileUrl);//读取该文件夹
        let _this = this;
        files.forEach(function (file) {
          let stats = fs.statSync(fileUrl + '/' + file);
          if (stats.isDirectory()) {
            _this.removeDir(fileUrl + '/' + file);
          } else {
            fs.unlinkSync(fileUrl + '/' + file);
          }
        });
        fs.rmdirSync(fileUrl);
      }
      ,
      /**
       * 获取插件临时下载路径
       * @param pkid
       * @param package_time
       */
      getDownloadUrl(pkid, package_time) {
        /**
         * 更新描述
         * 由原来获取下载路径生成二维码
         * 改为将获取版本信息和下载路径的接口（下文的url）生成二维码
         * 扫描二维码直接返回
         * 包含版本信息和下载地址的Json
         */
          // let url = this.host + '/lemix/moduleVersion?mmv_identifier=' + pkid;
        let url = this.host + '/lemix/moduleVersion/' + pkid;
        this.dialogVisible = true;
        this.downloadUrl = url;
        // 暂时搁置
        // let url = this.host + ':' + this.port + '/base/plugin/action/get-temp-url?pkid=' + pkid + '&package_time=' + package_time;
        // this.$http.get(url).then(res => {
        //     this.downloadUrl = JSON.stringify(res.data.ext_list[0]);// 临时下载路径，生成二维码
        //     this.dialogVisible = true;
        // }).catch(error => {
        //     console.log(error);
        //     this._writeLog(error);
        // })
      }
      ,
      /**
       * dialog opened 回调（生成二维码）
       */
      makeQRCode() {
        this.dialogLoading = true;
        let codeEle = document.querySelector("#qrCode");
        this.removeAllChilds();
        let qrCode = new QRCode(codeEle, {width: 300, height: 300});
        // let iconSrc = this.host + ':31005/' + this.iconPath;
        let iconSrc = this.host + '/lemix/' + this.iconPath
        let downloadUrl = this.downloadUrl;
        qrCode.makeCode(downloadUrl);
        this._makeLogo(qrCode, iconSrc);
        this.dialogLoading = false;
      }
      ,
      /**
       * 清除已存在的二维码
       */
      removeAllChilds() {
        let codeEle = document.querySelector("#qrCode");
        while (codeEle.hasChildNodes()) //当elem下还存在子节点时 循环继续
        {
          codeEle.removeChild(codeEle.firstChild);
        }
      }
      ,
      /**
       * 删除文件夹（或页面）
       * @param data
       */
      remove(data) {
        this.$confirm('此操作将删除该文件, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          /**
           * ----- 待优化 -----
           * chokidar监听文件变化，
           * 当通过node fs 文件系统删除文件夹时，
           * 会产生类似异步删除操作的报错
           * 即总是报‘父文件夹不为空’这个错误，
           * 暂时解决方法为：临时关闭文件监听，
           * 删除操作结束后重启监听程序，
           * 并刷新页面
           */
          this.watcher.close();
          let selectPath = data.path;
          this.removeDir(selectPath);
          this.$message({
            type: 'success',
            message: '删除成功!'
          });
          this.init();
          this.watchFileTrees();
        }).catch((err) => {
          if (err === 'cancel') {
            this.$message({
              type: 'info',
              message: '已取消删除操作'
            });
          } else {
            this._writeLog(err);
            this.$message({
              type: 'info',
              message: '操作失败，详情请查看日志文件'
            });
          }
        });
      },
      filter() {
        let filePath = this.projectPath;
        if (fs.existsSync(filePath + '/.lemix')) {
          let lemix = fs.readFileSync(filePath + '/.lemix', 'utf-8').replace(/[\r\n]/g, "^");
          let lemixArray = lemix.split('^^');
          lemixArray.push('.lemix');
          lemixArray.forEach((value, index) => {
            if (value !== '') {
              this.filters.push(filePath + '\\' + value);
            }
          });
        }
      },
      complete(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.dialogFormVisible = false;
            let projectPath = this.projectPath,
              config = this.getConfig(projectPath),
              source = {
                'author': this.form.author,
                'entrance': this.form.entrance,
                'description': this.form.description
              };
            Object.assign(config, source)
            fs.writeFileSync(projectPath + '/config/config.json', JSON.stringify(config), 'utf-8')
            this.buildProject(this.upLoadZip);
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      closed() {
        this.$refs['form'].resetFields()
      },
      isNewProject() {
        let projectPath = this.projectPath;
        const config = this.getConfig(projectPath);
        return (!config.description || !config.entrance)
      },
      buildAndRun() {
        if (this.isNewProject()) {
          this.dialogFormVisible = true
        } else {
          this.buildProject(this.runMix)
        }
      },
      runMix(buildPath) {
        const ele = document.querySelector('#box')
        const src = `file:///${buildPath}/pages/main/index.html`
        const preload = `file:///${buildPath}/../static/lemix-electron.min.js`
        const webView = lemix.webView.manage.create({ele, src, preload})
        ipcRenderer.on('MAIN_TO_RENDER', (event, message) => {
          let messageObject = JSON.parse(message)
          let params = Object.assign(messageObject.params, {'webView': webView})
          let fn = lemix.common.fn.getFn(messageObject.type)
          fn(params)
          console.log(params)
        })
      }
    }
    ,
    mounted() {
      this.init()
      this.watchFileTrees()
    }
  }
</script>

<style scoped>
  .icon {
    position: relative;
    top: 1px;
    height: 12px;
  }

  #remove {
    height: 12px;
    overflow: hidden;
  }

  #remove .remove {
    position: relative;
    top: 2px;
    height: 14px;
    margin-left: 8px;
  }

  #qrCode {
    width: 300px;
    height: 300px;
  }

  aside {
    position: relative;
    background-color: #353535;
    color: #FFFFFF;
    height: 543px;
    width: 200px !important;
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

  aside .toolbar .el-col {
    text-align: center;
    margin: 2px 0;
  }

  aside .toolbar button {
    background-color: transparent !important;
    color: #FFFFFF;
    border: 1px solid #505050;
    width: 80px;
    height: 80px;
    font-size: 10px;
    outline-color: #909399;
  }

  aside .toolbar button img {
    height: 24px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  aside .footer {
    position: absolute;
    bottom: 10px;
    left: 60px;
    font-family: Helvetica;
    font-size: 10px;
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

  @keyframes mymove {
    from {
      left: 300px;
    }
    to {
      left: 0;
    }
  }

  .push {
    animation: mymove;
    -webkit-animation: mymove
  }

  #box {
    height: 543px;
    width: 300px;
    overflow: hidden;
    position: relative
  }

  #box #navigation {
    display: block;
    height: 40px;
    background-color: #007aff;
    text-align: center;
    line-height: 40px
  }

  #box #navigation .go-back {
    position: absolute;
    left: 0;
    top: 3px;
    background-color: transparent;
    border: none;
    color: black;
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

  #current .el-dialog {
    background-color: #353535;
  }

  #current .el-dialog .el-dialog__title {
    color: #ffffff;
  }

  #mainLayout .el-dialog .el-form-item__label {
    color: #ffffff !important;
  }

  #current .el-input {
    width: 200px;
  }

  #current .el-form-item {
    margin-bottom: 0;
  }

  #current .el-form--label-left .el-form-item__label {
    color: #ffffff;
  }

  #current .el-dialog__footer .el-button--mini, .el-button--small {
    background-color: transparent;
    border-color: #666;
  }
</style>
