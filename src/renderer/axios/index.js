import axios from 'axios';
import {Message} from 'element-ui';

const instance = axios.create({
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsib2F1dGgyLXJlc291cmNlIiwiend0LWJhc2Utc2VydmljZSJdLCJleHAiOjE1NDYwMDU3NDgsInVzZXJfbmFtZSI6Inh1eGluIiwianRpIjoiZDJkNzE3Y2EtOWY5Yi00NzZhLWJjZDctYzkwMzY0NGFkNzk5IiwiY2xpZW50X2lkIjoiYXR0ZW5kYW5jZS1zZXJ2aWNlIiwic2NvcGUiOlsidHJ1c3RlZCJdfQ.UIVvByHa8lombo-ch1AIBub20SVHnOmvxeogbr9y7R1RuLAtJz4PT5-7M-OWY3EW53a0N7D70PNGlHFaLZTkVNx7zqFB6TBBpejnNlTj9cxro_Cwnm5MX8pHxwuxP0esOuxf6vdG6JZlE6w3LfTg6BGo9G-rW_zk3ILhSJ3Zv38',
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
