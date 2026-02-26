// Utility: wait for global THREE to be available before initializing dependent code
(function () {
    window.waitForTHREE = async function (timeoutMS = 10000) {
        if (window.THREE) return window.THREE;
        return new Promise((resolve, reject) => {
            let waited = 0;
            const interval = setInterval(() => {
                if (window.THREE) {
                    clearInterval(interval);
                    const info = document.getElementById('status');
                    if(info) info.innerText = 'Three.js geladen';
                    resolve(window.THREE);
                }
                waited += 200;
                if (waited >= timeoutMS) {
                    clearInterval(interval);
                    const msg = `THREE.js not available after timeout (${timeoutMS}ms).`;
                    console.warn('[three-waiter]', msg);
                    const info = document.getElementById('status');
                    if(info) info.innerText = 'Three.js konnte nicht geladen werden';
                    reject(new Error(msg));
                }
            }, 200);
        });
    };
})();
