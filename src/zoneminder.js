import { EventEmitter } from 'events'
import url from 'url'
import qs from 'qs'
import request from 'browser-request'


export default class Zoneminder extends EventEmitter {
  constructor({ apiBase, mode = 'jpeg', maxfps = 30, authHash = null }) {
    super()
    this._authHash = authHash
    this._apiBase = apiBase
    this._maxfps = maxfps
    this._mode = mode
    this._init()
  }

  _events = null
  _monitors = null

  _init() {
    Promise.all([this._refreshMonitors(), this._refreshZMEvents()])
      .then(() => this.emit('initialized'))
  }

  _refreshMonitors() {
    return apiRequest(url.resolve(this._apiBase, `api/monitors.json${this._authHash ? ('?auth=' + this._authHash) : ''}`))
      .then(({ monitors }) => this._monitors = monitors.map(({ Monitor }) => ({ stream: this._resolveMonitorStream(Monitor.Id), ...Monitor })))
  }

  _refreshZMEvents() {
    return true
  }

  _resolveMonitorStream(monitor_id) {
    const query = qs.stringify({
      maxfps: this._maxfps,
      mode: this._mode,
      monitor: monitor_id,
      rand: Math.random(),
      authHash: this._authHash
    }, { skipNulls: true })
    return url.resolve(this._apiBase, `cgi-bin/nph-zms?${query}`)
  }

  addMonitor(Monitor) {
    return apiRequest(url.resolve(this._apiBase, `${this._authHash ? ('?auth=' + this._authHash) : ''}`), 'POST', { form: { Monitor } })
  }

  get monitors() {
    return this._monitors
  }

  get events() {
    return this._events
  }
}

export function apiRequest(requestURL, method = 'GET', parms = {}) {
  return new Promise((resolve, reject) => request({
    method,
    url: requestURL,
    json: true,
    ...parms
  }, (err, res, body) => {
    if (err) return reject(err)
    resolve(body)
  }))
}
