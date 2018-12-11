import axios from 'axios';
import {Message} from 'element-ui';

const instance = axios.create({
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsib2F1dGgyLXJlc291cmNlIiwiend0LWJhc2Utc2VydmljZSJdLCJleHAiOjE1NDQ0NDY5NTgsInVzZXJfbmFtZSI6Inh1eGluIiwianRpIjoiZDZhOTNiNTktODI5OS00MDIzLTkzZGMtNGIwYzZlMmJmZmUwIiwiY2xpZW50X2lkIjoiYXR0ZW5kYW5jZS1zZXJ2aWNlIiwic2NvcGUiOlsidHJ1c3RlZCJdfQ.kQ-axV1O98OHB8R2s3YeswknwmbmyzctR-E1w4Z7xAyzrHsWdgPVX5JXlOGJzZr0CUEgG8_yU4V1SYTNGzHHHfzQwREWSrxQe6qoogsrpIk44D-uxf3oaJWQg48QqARsPOMzFdiZmcJkaBxy-3lxy_-SMIVPOY3LRvU7zTHbPLE',
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
                case 409:
                    Message({message: error.response.data.message, type: 'error'});
                    break;
            }
        }
        return Promise.reject(error);
    });

export default instance;
