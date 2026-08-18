import greet from './userscript1.js';
import onDisable from './userscript2.js';

export default ctx => {
    greet(ctx);
    return () => {
        onDisable(ctx);
    };
};
