import axios from 'axios'
// import request from 'sync-request'
// const request = require('sync-request')

const syncRequest = ({url, method, header, body, success, failed}) => {
  return axios({
    method:  method,
    url: url,
    data: body,
    headers: header
  })
}

const asyncRequest = ({url, method, header, body, success, failed}) => {
  return axios({
    method:  method,
    url: url,
    data: body,
    headers: header
  })
}

const uploadFile = () => {

}

const downloadFile = () => {

}

export default {
  syncRequest,
  asyncRequest,
  uploadFile,
  downloadFile
}
