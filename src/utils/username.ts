// 关于用户名称的工具

/**
 * 生成一个用户名，格式类似：
 * `Player_?????`
 */
export function spawnUserName(){
    return `Player_${~~(Math.random() * 90000) + 10000}`
}