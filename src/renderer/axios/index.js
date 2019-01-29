import axios from 'axios';
import {Message} from 'element-ui';

const instance = axios.create({
    headers: {
        'Content-Type': 'application/json'
    },
    defaults: {
        timeout: 600000
    }
});
// 封装axios post
// export const uploadFileRequest = (url, params) => {
//   return axios({
//     method: 'post',
//     url: `${base}${url}`,
//     data: params,
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   });
// }
instance.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            // 这里统一做异常处理
            switch (error.response.status) {
                case 500:
                    Message({message: '连接超时', type: 'error'});
                    break;
                default:
                    Message({message:error.response.data.message,type:'error'});
            }
        }
        return Promise.reject(error);
    });

export default instance;
