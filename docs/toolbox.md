# 工具箱

↑ 前端(显示、互动)
↓ 后端(数据、事件)

- 实体 Entity
    - 变换 Transform
        - 位置 Position
            - 让自己沿当前方向移动number单位
            - 设自己的(_x_,y)坐标为number单位
            - 将自己的(_x_,y)坐标增加number单位
            ***
            - 获取自己的当前(_x_,y)坐标
        - 缩放 Scale
            - 设自己的缩放为number%
            - 将自己的缩放增加number%
            ***
            - 获取自己的当前缩放
        - 方向 Direction
            - 设自己的方向为number度
            - 将自己的方向(_向左_，向右)增加number度
            - 让自己面向(鼠标指针,其它对象)
            ***
            - 获取自己的当前方向
        - 图层 Layer
            - 设自己的图层为number层
            - 将自己的图层(_上移_，下移)number层

            ***
            - 获取自己的图层
    - 外观 Appearance
        - 图像 Images
            - 让自己显示(图像名)
            ***
            - 设自己的(_x_,y)拉伸为number%
            - 将自己的(_x_,y)拉伸增加number%
            - 获取自己的(_x_,y)当前拉伸
            ***
            - 设自己的切图层数为(_2x2_,3x3)
            - 设自己的切图(_横_,纵)距离为number(%,_单位_)
            - 获取自己的当前切图层数
            - 获取自己的当前切图(_横_,纵)距离，基于(百分比, _单位_)
        - 特效 Effects
          <!-- 特效选择框：
                  - *透明度*
                  - 亮度
                  - 饱和度
                  - 对比度
                  - 鱼眼
                  - 漩涡
               -->
            - 设自己的(特效选择框)特效为number%
            - 让自己的(特效选择框)特效增加number%
            ***
            - 获取自己的(特效选择框)特效
    - 碰撞 Collision
        - 自己是否碰到了(对象名)
        - 当自己碰到了(对象名)



- 音频 Audio
    - 播放 Play
        - 播放音频(音效名)并把ID作为string，然后(堵塞，_继续_)
        - (_继续_,暂停,停止)ID为string的音频
        - 设ID为string的音频播放到number秒
        - 让所有音频(全部暂停,全部继续,_全部停止_)
        ***
        - 以数组形式获取所有音频ID
        - 获取ID为string的音频(_当前播放时长_,是否暂停,是否存在)
    - 特效 Effects
      <!-- 特效集选择框：
                - *音调*
                - 速度
            -->
        - 设ID为string的音频的(特效集)特效为number%
        - 将ID为string的音频的(特效集)特效增加number%
        - 重置ID为string的音频的(特效集)特效
        - 重置ID为string的音频的所有特效
        - 重置所有音频的(特效集)特效
        - 重置所有音频的所有特效
        ***
        - 获取ID为string的音频的(特效集)特效百分比

- 资源 Resources
    - 从URL[string]获取并添加一个资源并称做string
    - 获取资源string // 返回一个ID，在实体会做多池检查，这个ID是无序的，不用担心重名
    - 资源string是否存在
    - 重命名资源string为string
    - 删除资源string
      // 数据应该是 dataUrl

- 事件 Events
    - 生命周期 Lifecycle
        - 当项目开始运行
        - 当项目结束运行
        - 当项目已运行number毫秒
    - 时间 Time
        - 项目已运行时长
        ***
        - 创建计时器string
        - 重置计时器string
        - 删除计时器string
        ***
        - 计时器string
        - 当计时器string的时长超过number毫秒
    - 输入 Input
        - 获取鼠标的(x,y)坐标
        - 获取鼠标是否碰到了自己
        ***
        - 获取键盘是否被按下
        - 获取键盘最近按下了什么键
        ***
        - 获取麦克风的响度
        - 以数组形式获取麦克风的频谱，共number条
        ***
        - 当鼠标碰到了这个对象，且(分,不分)是否显示在第一层
        - 当鼠标移动了一单位
        - 当鼠标的(_左键_,中键,右键)被(_按下_,松开,单击)且(碰到了这个实体,没有碰到这个实体,_不论如何_)
        - 当键盘的(任意键,...)被(_按下_,松开,单击)

- 控制 Control
    - 流程 Flow
        - 等待x秒
        - 等待直到boolean为真
        ***
        - 跳出这个嵌套 #break
        ***
        - 停止这个脚本
        - 停止项目
    - 条件 Condition
        - 如果boolean成立则 (可以加否则如果、否则)
    - 循环 Loop
        - 当boolean成立时无限循环
        - 重复执行number次并提供次数：[次数(可改名)](会给出这个脚本已运行了多少次)
        - 对于array中的每一[项(可改名)]
    - 匹配 Match
        - 匹配 string | number
        - 若是 string | number
        - 默认
- 运算 Operator
    - 数学 Math 
        - number (+,-,\*,/,%,^) number
        - 从number到number随机一个数
    - 逻辑 Logic
        - unknown (=,!=,>,>=,<,<=) unknown
        - 取反 (boolean)
        - (真,假)
    - 科学 Scientific
        - (sin,cos,tan,asin,acos,atan...)(number)
    - 字符串
        - 合并string和string
        - 通过string拆分string为数组
        - string的第number位到number位
        - string的长度

- 数据 Data
    - 数据 Data
        - [新增一个数据]
        - 将(数据名)设为 unknown
        - 将(数据名)增加 number
        - 将(数据名)(自增,自减,自除,自乘,自余) number
    - 数组 Array
        - 向(数据名)内添加 unknown 项
        - 让(数据名)删除第 number 项
        - 让(数据名)删除(开始,结束)项
        - 获取(数据名)的第 number 项
        - 获取(数据名)的项长度
        - 筛选(数据名)中不符合[表达式]的项
        - 查找(数据名)中值为unknown的(项数)
    - 对象 Object
        - 向(数据名)内添加 string 键，unknown 值
        - 让(数据名)删除键 string 和其中的值
        - 获取(数据名)的所有(键,值)
        - 获取(数据名)中对应键 string 的值
        - 获取(数据名)的项长度

- 函数 Function
    - [创建一个函数]
    - 返回 unknown
    - 运行标签为(分支标签)的分支
    - 将(值)数据设为unknown

- 调试 Debug
    - 输出(日志，警告，错误) string
    - 崩溃并报错string
    - 断点
