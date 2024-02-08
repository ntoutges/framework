export class SmartInterval {
    callback;
    timeout = 0;
    iId = null;
    tId = null;
    _isPaused = false;
    lastTick = (new Date()).getTime();
    constructor(callback, interval = 0, // default case -- means will not run
    runImmediate = false // if false: will set wait [interval] seconds before sending first callback. if true: will callback immediately
    ) {
        this.setCallback(callback);
        this.interval = interval;
        if (runImmediate)
            this.callback();
    }
    set interval(interval) {
        const oldInterval = this.timeout;
        this.timeout = interval;
        if (interval > 0 && oldInterval != this.timeout && !this._isPaused) { // new and valid interval
            this.createInterval();
        }
    }
    get interval() { return this.timeout; }
    setCallback(callback) {
        this.callback = callback;
    }
    pause() {
        if (this._isPaused)
            return; // already is paused
        if (this.iId)
            clearInterval(this.iId);
        if (this.tId)
            clearTimeout(this.tId);
        this.iId = null;
        this.tId = null;
        this._isPaused = true;
    }
    play() {
        if (!this._isPaused)
            return; // already is playing
        this.createInterval();
        this._isPaused = false;
    }
    // stop current interval, and wait [this.timeout]ms to send the next
    resetCycle() {
        this.pause();
        this.lastTick = null; // force interval to restart with no reference to last time callback was fired
        this.play();
    }
    get isPaused() { return this._isPaused; }
    createInterval() {
        const now = (new Date()).getTime();
        if (this.iId != null)
            clearInterval(this.iId); // remove old interval, then replace it
        if (this.tId != null)
            clearTimeout(this.tId); // remove old timeout
        if (this.lastTick == null)
            this.lastTick = now;
        // [delay] allows interval to run smoothly throuhg plays and pauses
        const delay = Math.max(this.timeout - (now - this.lastTick), 0); // value in range [0,this.timeout]
        this.tId = setTimeout(() => {
            this.tId = null; // no longer in use
            this.lastTick = now;
            this.callback();
            // create brand new interval
            this.iId = setInterval(() => {
                this.lastTick = (new Date()).getTime();
                this.callback();
            }, this.timeout);
        }, delay);
    }
    get id() { return this.iId; }
}
//# sourceMappingURL=smartInterval.js.map