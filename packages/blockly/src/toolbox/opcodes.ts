const OPCODES = {
    // 呈现 - 运动
    forward: 'motion.forward',
    moveTo: 'motion.moveTo',
    setX: 'motion.setX',
    setY: 'motion.setY',
    changeX: 'motion.changeX',
    changeY: 'motion.changeY',
    setXY: 'motion.setXY',
    changeXY: 'motion.changeXY',
    entitiesMenu: 'menu.entities',

    // 呈现 - 方向
    turnLeft: 'motion.turnLeft',
    turnRight: 'motion.turnRight',
    setHeading: 'motion.setHeading',
    faceTo: 'motion.faceTo',
    heading: 'motion.heading',

    // 呈现 - 显示
    setSize: 'display.setSize',
    changeSize: 'display.changeSize',
    size: 'display.size',
    show: 'display.show',
    hide: 'display.hide',
    visible: 'display.visible',
    switchCostume: 'display.switchCostume',
    costume: 'display.costume',
    changeEffect: 'display.changeEffect',
    setEffect: 'display.setEffect',
    effect: 'display.effect',
    setBlendMode: 'display.setBlendMode',
    blendMode: 'display.blendMode',
    setClip: 'display.setClip',
    resetClip: 'display.resetClip',
    clip: 'display.clip',
    changeLayer: 'display.changeLayer',
    setLayer: 'display.setLayer',
    layer: 'display.layer',

    // 呈现 - 文字
    showText: 'text.show',
    setFont: 'text.setFont',
    setTextColor: 'text.setTextColor',
    setTextBorderColor: 'text.setTextBorderColor',
    setTextBorderWidth: 'text.setTextBorderWidth',
    textMetric: 'text.metric',
    textColor: 'text.color',
    stopText: 'text.stop',
    textShowing: 'text.showing',
    textFont: 'text.font',
    textContent: 'text.content',

    assetSelector: 'asset.selector',

    // 事件
    whenStartClicked: 'event.whenStartClicked',
    whenMouse: 'event.whenMouse',
    whenKey: 'event.whenKey',
    whenTouched: 'event.whenTouched',
    whenAfter: 'event.whenAfter',

    // 流程
    wait: 'flow.wait',
    waitUntil: 'flow.waitUntil',
    repeatWhile: 'flow.repeatWhile',
    repeatTimes: 'flow.repeatTimes',
    repeatTimeCount: 'flow.repeatTimeCount',
    repeatTimeValue: 'flow.repeatTimeValue',
    forEach: 'flow.forEach',
    breakLoop: 'flow.break',
    continueLoop: 'flow.continue',
    exitScript: 'flow.exitScript',
    stopProject: 'flow.stopProject',

    // 分支
    if: 'branch.if',
    match: 'branch.match',
    matchCase: 'branch.matchCase',
    matchDefault: 'branch.matchDefault',

    // 感知 - 输入
    mouseX: 'sensing.mouseX',
    mouseY: 'sensing.mouseY',
    mousePressed: 'sensing.mousePressed',
    keyPressed: 'sensing.keyPressed',
    lastKey: 'sensing.lastKey',
    pressedKeys: 'sensing.pressedKeys',
    micData: 'sensing.micData',
    ask: 'sensing.ask',
    username: 'sensing.username',
    daysSince2000: 'sensing.daysSince2000',
    currentTime: 'sensing.currentTime',
    timer: 'sensing.timer',
    startTimer: 'sensing.startTimer',
    resetTimer: 'sensing.resetTimer',
    stopTimer: 'sensing.stopTimer',

    // 感知 - 检测
    touching: 'sensing.touching',
    distanceTo: 'sensing.distanceTo',

    // 计算 - 数学
    add: 'math.add',
    subtract: 'math.subtract',
    multiply: 'math.multiply',
    divide: 'math.divide',
    power: 'math.power',
    mod: 'math.mod',
    round: 'math.round',
    unary: 'math.unary',
    constant: 'math.constant',
    random: 'math.random',

    // 计算 - 逻辑
    and: 'logic.and',
    or: 'logic.or',
    not: 'logic.not',

    // 计算 - 字符串
    join: 'string.join',
    letterOf: 'string.letterOf',
    substring: 'string.substring',
    split: 'string.split',
    char: 'string.char',
    contains: 'string.contains',
    stringLength: 'string.length',

    // 数据 - 输入框
    number: 'type.number',
    string: 'type.string',
    boolean: 'type.boolean',
    null: 'type.null',
    color: 'input.color',
    angle: 'input.angle',

    // 数据 - 对象
    emptyObject: 'object.empty',
    objectKeys: 'object.keys',
    objectValues: 'object.values',
    objectGet: 'object.get',
    objectHas: 'object.has',
    objectSize: 'object.size',
    objectDelete: 'object.delete',
    objectSet: 'object.set',

    // 数据 - 列表
    emptyArray: 'array.empty',
    arrayGet: 'array.getItem',
    arrayLength: 'array.length',
    arrayIndexOf: 'array.indexOf',
    arrayPush: 'array.push',
    arrayInsert: 'array.insert',
    arrayRemove: 'array.remove',

    // 数据 - 临时数据
    getTemp: 'temp.get',
    defineTemp: 'temp.define',
    deleteTemp: 'temp.delete',
    hasTemp: 'temp.has',

    // 函数
    execute: 'function.execute',
    executeReturn: 'function.executeReturn',
    inlineFunction: 'function.inline',
} as const;

type TOPCODES_VALUE = (typeof OPCODES)[keyof typeof OPCODES];

export { OPCODES, type TOPCODES_VALUE };
