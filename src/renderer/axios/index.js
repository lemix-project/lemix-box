import axios from 'axios';
import {Message} from 'element-ui';

const instance = axios.create({
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsib2F1dGgyLXJlc291cmNlIiwiend0LWJhc2Utc2VydmljZSJdLCJleHAiOjE1NDQ3MDgwNDQsInVzZXJfbmFtZSI6Inh1eGluIiwianRpIjoiODkzNGRkMzItNjYzNy00Y2VkLTgwYTItNTU0NGZkNjkzN2MyIiwiY2xpZW50X2lkIjoiYXR0ZW5kYW5jZS1zZXJ2aWNlIiwic2NvcGUiOlsidHJ1c3RlZCJdfQ.EXNuNU4Qdb1dbMA-oy27jK3rr4O01othaMz1k0-kBg85ZiYttsfyQYT48OC6qv_4GrUDPam1i48-ACNXqaVyeAANogo61RZXMJg0hG0ani5-htOVWw8v7biuqTWBBSWVFZqoUuxLJkQBEo9ETLlNKGtqTDwggBGS2tRXUacQcCI',
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
