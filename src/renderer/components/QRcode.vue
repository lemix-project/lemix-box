<template>
    <div>
        <input id="text" type="text" value="zhongwang"/>
        <div id="qrcode"></div>
    </div>
</template>

<script>
    import QRCode from "qrcodejs2";

    export default {
        name: "QRcode",
        methods:{
            makeCode(){
                let codeEle = document.querySelector("#qrcode");
                let qrcode = new QRCode(codeEle, {width: 400, height: 400});
                let elText = document.getElementById("text");
                if (!elText.value) {
                    alert("Input a text");
                    elText.focus();
                    return;
                }
                let src = "static/images/logo.png";
                qrcode.makeCode(elText.value);
                this._makeLogo(qrcode,src)
            },
            listener(){
                let text = document.querySelector("#text");
                let _this = this;
                text.addEventListener("keydown", function (e) {
                    if (e.keyCode === 13) {
                        _this.removeAllChilds();
                        _this.makeCode();
                    }
                });
                text.addEventListener("blur", function () {
                    _this.removeAllChilds();
                    _this.makeCode();
                })
            },
            removeAllChilds(){
                let codeEle = document.querySelector("#qrcode");
                while(codeEle.hasChildNodes()) //当elem下还存在子节点时 循环继续
                {
                    codeEle.removeChild(codeEle.firstChild);
                }
            }
        },
        mounted(){
            this.makeCode();
            this.listener()
        }
    }
</script>

<style scoped>
    #qrcode {
        width: 400px;
        height: 400px;
        margin-top: 15px;
    }
</style>