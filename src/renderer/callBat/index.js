import child_process from 'child_process'
import {Message} from 'element-ui'

let callBat = function (fileName, args, options) {
    const child = child_process.execFile(fileName, args, options, (error, stdout, stderr) => {
        if (error) {
            throw error;
        }
        console.log(stdout);
        Message({message:"bat执行成功",type:"success"});
    });
}

export default callBat