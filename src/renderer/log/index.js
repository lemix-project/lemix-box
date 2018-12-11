import fs from 'fs'

let writeLog = (error) => {
    if (!fs.existsSync('log')) {
        fs.mkdirSync('log');
    }
    const date = new Date();
    const y = date.getFullYear();
    const m = date.getMonth() + 1 < 10
        ? '0' + date.getMonth() + 1
        : date.getMonth() + 1;
    const d = date.getDate() < 10
        ? '0' + date.getDate()
        : date.getDate();
    let len = 12;
    let $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let maxPos = $chars.length;
    let randomString = '';
    for (let i = 0; i < len; i++) {
        randomString += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    const errorFile = "_" + y + m + d + "_" + randomString;
    fs.writeFile('log/error' + errorFile + '.log', error, 'utf-8', function (err) {
        if (err) {

        }
    })
};

export default writeLog