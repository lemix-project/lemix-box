import axios from 'axios';
import {Message} from 'element-ui';

const instance = axios.create({
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsib2F1dGgyLXJlc291cmNlIiwiend0LWJhc2Utc2VydmljZSJdLCJleHAiOjE1NDY1MjgxOTEsInVzZXJfbmFtZSI6Inh1eGluIiwianRpIjoiOTA4NTEzMjYtNWY3NS00YzM0LWFkYjktNzc5MWMwNjIxOGUyIiwiY2xpZW50X2lkIjoiYXR0ZW5kYW5jZS1zZXJ2aWNlIiwic2NvcGUiOlsidHJ1c3RlZCJdfQ.MT92RKOWZWOw5oKbY7vXqKbSZMXOvsn439uZQf76ZXeLZm1y8q6Xtl0UfDlBFadUMt9ZBf2MDYq3nB8cl13V5LrqZYP3b-FgvJnGS1YIh2Gm98XZPdSaiNe5j0EnYZqUr_TKqB_0HyvhXC1Ms1i6V9kk8PsZrViuprBObH-E1pk',
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
