
const env = window.navigator.userAgent.toLowerCase();
const Env = {
    isInWeixin() {
        return env.indexOf('micromessenger') !== -1;
    },
    isInApp() {
        return /(^|;\s)app\//.test(env);
    },
    isInIOS() {
        return env.match(/(iphone|ipod|ipad);?/i);
    },
    isInAndroid() {
        return env.match(/android|adr/i);
    },
    isInPc() {
        return !(Env.isInAndroid() ||
            Env.isInApp() ||
            Env.isInIOS() ||
            Env.isInWeixin());
    },

    get env() {
        return this.isInPc() ? 'PC' : 'Mobile';
    },
}