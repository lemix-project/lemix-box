let makeLogo = (el,src)=>{
    el._el.style.position = "relative";
    let logoImg = document.createElement("img");
    logoImg.setAttribute("src", src);
    let logoHeight = (el._htOption.height * 0.2).toString(),
        logoWidth = (el._htOption.width * 0.2).toString(),
        logoTop = (el._htOption.height * 0.4 - 5).toString(),
        logoLeft = (el._htOption.width * 0.4 - 5).toString();
    logoImg.style.cssText = "position:absolute;z-index:9999;border:6px solid #ffffff";
    logoImg.style.height = logoHeight + "px";
    logoImg.style.width = logoWidth + "px";
    logoImg.style.top = logoTop + "px";
    logoImg.style.left = logoLeft + "px";
    el._el.appendChild(logoImg);
}

export default makeLogo;