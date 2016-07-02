import { EventEmitter } from 'events'
import url from 'url'
import qs from 'qs'
import request from 'browser-request'


export default class Zoneminder extends EventEmitter {
  constructor(apiBase, mode = 'jpeg', maxfps = 30) {
    super()
    this._apiBase = apiBase
    this._maxfps = maxfps
    this._mode = mode
    this._init()
  }

  _events = null
  _monitors = null

  _init() {
    this._refreshMonitors()
      .then(::this._refreshZMEvents)
      .then(() => this.emit('initialized'))
  }

  _refreshMonitors() {
    return apiRequest(url.resolve(this._apiBase, 'api/monitors.json'))
      .then(({ monitors }) => this._monitors = monitors.map(({ Monitor }) => ({ stream: this.getMonitorURL(Monitor.Id), ...Monitor })))
  }

  _refreshZMEvents() {
    return true
  }

  getMonitorURL(monitor_id) {
    const query = qs.stringify({
      maxfps: this._maxfps,
      mode: this._mode,
      monitor: monitor_id,
      rand: Math.random()
    })
    return url.resolve(this._apiBase, `cgi-bin/nph-zms?${query}`)
  }

  get monitors() {
    return this._monitors
  }

  get events() {
    return this._events
  }
}

export function apiRequest(requestURL) {
  return new Promise((resolve, reject) => request({
    url: requestURL,
    json: true
  }, (err, res, body) => {
    if (err) return reject(err)
    resolve(body)
  }))
}
