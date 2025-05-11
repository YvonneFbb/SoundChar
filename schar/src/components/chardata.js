'use client'

// Better not modify it.
const DefaultWidth = 30

const CharType = {
    BLOCK_W: 0,
    BLOCK_W_MID: 1,
    ARC: 2,
    POLYLINE: 3,
    CIRCLE: 4,
}

// 删除现有的calculateArc和calculateArcFromTwoPoints函数，用一个统一的函数代替
function calculateArcUnified(points) {
    // 如果有三个点，并且不共线，使用传统三点确定圆弧
    if (points.length === 3) {
        // 解构三点坐标
        const [A, B, C] = points.map(p => ({ x: p[0], y: p[1] }))
        // 三点共线检测 (向量叉积法)
        const vecAB = { x: B.x - A.x, y: B.y - A.y }
        const vecAC = { x: C.x - A.x, y: C.y - A.y }

        // 如果不共线，使用传统的三点圆弧计算
        if (vecAB.x * vecAC.y !== vecAB.y * vecAC.x) {
            // 计算垂直平分线方程组
            const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
            const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }
            // AB垂直平分线方程: (B.x - A.x)(x - midAB.x) + (B.y - A.y)(y - midAB.y) = 0
            const eq1 = {
                a: B.x - A.x,
                b: B.y - A.y,
                c: (B.x - A.x) * midAB.x + (B.y - A.y) * midAB.y
            }
            // BC垂直平分线方程: (C.x - B.x)(x - midBC.x) + (C.y - B.y)(y - midBC.y) = 0
            const eq2 = {
                a: C.x - B.x,
                b: C.y - B.y,
                c: (C.x - B.x) * midBC.x + (C.y - B.y) * midBC.y
            }
            // 解线性方程组
            const det = eq1.a * eq2.b - eq2.a * eq1.b
            if (det === 0) return null // 平行线无解
            const h = (eq2.b * eq1.c - eq1.b * eq2.c) / det
            const k = (eq1.a * eq2.c - eq2.a * eq1.c) / det
            const r = Math.hypot(A.x - h, A.y - k)
            // 计算三点相对于圆心的角度（弧度）
            const angles = points.map(p => {
                const dx = p[0] - h,
                    dy = p[1] - k
                let angle = Math.atan2(dy, dx)
                return angle < 0 ? angle + 2 * Math.PI : angle // 转0~2π
            })
            // 确定绘制顺序 (保持输入点顺序)
            const sorted = angles.slice().sort((a, b) => a - b)

            // 判断跨零情况 (如355°→5°)
            const isCrossZero = sorted[2] - sorted[0] > Math.PI
            const start = isCrossZero ? sorted[2] : sorted[0]
            const end = isCrossZero ? sorted[1] + 2 * Math.PI : sorted[2]
            return {
                center: [h, k],
                radius: r,
                startAngle: start,
                endAngle: end,
                clockwise: angles[1] > angles[0]
            }
        }
    }

    // 如果三点共线，或者只有两个点，检查是否有角度信息
    let arcAngle = null;
    if (points.length >= 3 && typeof points[2][0] === 'number') {
        arcAngle = points[2][0]; // 第三个点的x坐标作为角度
    } else if (points.length === 2) {
        arcAngle = 90; // 默认90度
    } else {
        return null; // 无法计算
    }

    // 使用两点和角度计算圆弧
    const A = { x: points[0][0], y: points[0][1] };
    const B = { x: points[1][0], y: points[1][1] };

    // 计算两点之间的距离 (弦长)
    const chordLength = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));

    // 计算半径 (基于弦和圆心角的关系)
    const angleRadians = Math.PI * arcAngle / 180;
    const radius = chordLength / (2 * Math.sin(angleRadians / 2));

    // 计算两点的中点
    const midpoint = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

    // 计算从A指向B的向量
    const vectorAB = { x: B.x - A.x, y: B.y - A.y };

    // 计算垂直于AB的向量 (有两个方向，选择使圆弧角度小于180度的方向)
    // 注意：对于小圆弧，圆心应该在弦的"外侧"
    const perpVector = { x: -vectorAB.y, y: vectorAB.x };

    // 归一化垂直向量
    const perpLength = Math.sqrt(perpVector.x * perpVector.x + perpVector.y * perpVector.y);
    const perpNorm = { x: perpVector.x / perpLength, y: perpVector.y / perpLength };

    // 计算圆心到中点的距离
    const distToCenter = Math.sqrt(radius * radius - (chordLength / 2) * (chordLength / 2));

    // 确定圆心在弦的哪一侧（对于小圆弧）
    // 默认使用小圆弧，圆心应该在弦的外侧
    const center = {
        x: midpoint.x + perpNorm.x * distToCenter,
        y: midpoint.y + perpNorm.y * distToCenter
    };

    // 计算从圆心到A和B的角度
    const angleA = Math.atan2(A.y - center.y, A.x - center.x);
    const angleB = Math.atan2(B.y - center.y, B.x - center.x);

    // 确保角度范围为0~2π
    const startAngle = angleA < 0 ? angleA + 2 * Math.PI : angleA;
    let endAngle = angleB < 0 ? angleB + 2 * Math.PI : angleB;

    // 计算角度差，确保使用小圆弧（角度差小于180度）
    let angleDiff = Math.abs(endAngle - startAngle);
    if (angleDiff > Math.PI) {
        // 如果角度差大于180度，调整终点角度
        if (endAngle > startAngle) {
            endAngle = startAngle - (2 * Math.PI - angleDiff);
        } else {
            endAngle = startAngle + (2 * Math.PI - angleDiff);
        }
    }

    return {
        center: [center.x, center.y],
        radius: radius,
        startAngle: startAngle,
        endAngle: endAngle,
        clockwise: endAngle > startAngle // 根据角度关系确定方向
    };
}

// 优化记忆化函数工具，增加过期时间防止内存泄漏
function memoize(fn, maxCacheSize = 200) {
    const cache = new Map();
    const cacheTimestamps = new Map();

    // 设置缓存过期时间（毫秒）
    const CACHE_EXPIRY = 30000; // 30秒

    return function (...args) {
        const key = JSON.stringify(args);
        const now = Date.now();

        // 如果缓存命中且未过期
        if (cache.has(key) && now - cacheTimestamps.get(key) < CACHE_EXPIRY) {
            return cache.get(key);
        }

        // 计算结果并缓存
        const result = fn.apply(this, args);

        // 如果缓存大小超过最大值，删除最旧的项
        if (cache.size >= maxCacheSize) {
            let oldestKey = null;
            let oldestTime = now;

            for (const [k, timestamp] of cacheTimestamps.entries()) {
                if (timestamp < oldestTime) {
                    oldestKey = k;
                    oldestTime = timestamp;
                }
            }

            if (oldestKey) {
                cache.delete(oldestKey);
                cacheTimestamps.delete(oldestKey);
            }
        }

        cache.set(key, result);
        cacheTimestamps.set(key, now);
        return result;
    };
}

// 使用优化后的记忆化函数包装统一的圆弧计算
const calculateArcMemoized = memoize(calculateArcUnified);

class CharCompo {
    constructor(points, mapfunc, type, startAngle = 90, endAngle = 90) {
        this.points = points
        this.mapfunc = mapfunc
        this.type = type
        this.color = null
        this.startAngle = startAngle // 开头切边角度（默认90度，垂直于线条走向）
        this.endAngle = endAngle // 结尾切边角度（默认90度，垂直于线条走向）
        console.log(this.points)

        this.block = {
            angle: 0,
            distance: 0
        }
        this.arc = null

        // 添加缓存相关属性
        this.cachedTransformedPoints = null;
        this.cachedWeight = null;
        this.lastLoudness = null;
        this.lastCentroid = null;
        this.lastOrig = null;
    }

    init(p5Inst) {
        switch (this.type) {
            case CharType.BLOCK_W:
            case CharType.BLOCK_W_MID:
                this.block.angle = p5Inst.atan2(
                    this.points[1][1] - this.points[0][1],
                    this.points[1][0] - this.points[0][0]
                )
                this.block.distance = p5Inst.dist(
                    this.points[0][0],
                    this.points[0][1],
                    this.points[1][0],
                    this.points[1][1]
                )
                break
            case CharType.ARC:
                // 使用统一的圆弧计算函数
                this.arc = calculateArcMemoized(this.points)
                if (!this.arc) {
                    console.error('Failed to calculate arc from points:', this.points)
                }
                break
            case CharType.POLYLINE:
                // 确保有足够的点来计算方向
                if (this.points.length < 2) {
                    console.error('Polyline needs at least 2 points')
                }
                break
            case CharType.CIRCLE:
                // 确保有足够的点来计算圆
                if (this.points.length < 2) {
                    console.error('Circle needs at least 2 points: center and radius point')
                }
                break
        }
    }

    // 计算转换后的点坐标 (新函数)
    getTransformedPoints(orig) {
        // 检查是否需要重新计算 (如果orig发生变化)
        const origChanged = !this.lastOrig ||
            this.lastOrig[0] !== orig[0] ||
            this.lastOrig[1] !== orig[1] ||
            this.lastOrig[2] !== orig[2];

        if (origChanged || !this.cachedTransformedPoints) {
            this.cachedTransformedPoints = this.points.map(p => [
                p[0] * orig[2] + orig[0],
                p[1] * orig[2] + orig[1]
            ]);
            this.lastOrig = [...orig];
        }

        return this.cachedTransformedPoints;
    }

    // 计算组件权重 (新函数)
    calculateWeight(p5Inst, loudness, centroid) {
        // 检查参数是否发生变化
        if (this.lastLoudness === loudness &&
            this.lastCentroid === centroid &&
            this.cachedWeight !== null) {
            return this.cachedWeight;
        }

        // 计算并缓存新的权重值
        this.lastLoudness = loudness;
        this.lastCentroid = centroid;
        this.cachedWeight = this.mapfunc(p5Inst, loudness, centroid);

        return this.cachedWeight;
    }

    draw(p5Inst, orig, loudness, centroid, colorOn) {
        // 使用缓存函数获取转换后的点和权重
        const weight = this.calculateWeight(p5Inst, loudness, centroid);
        const points = this.getTransformedPoints(orig);

        if (colorOn) {
            p5Inst.fill(this.color);
            p5Inst.stroke(this.color);
        } else {
            p5Inst.fill(0, 255 * 0.8);
            p5Inst.stroke(0, 255 * 0.8);
        }

        switch (this.type) {
            case CharType.BLOCK_W:
                p5Inst.push()
                p5Inst.strokeWeight(0)
                p5Inst.translate(points[0][0], points[0][1])
                p5Inst.rotate(this.block.angle)

                // 使用自定义路径实现斜切边的矩形
                p5Inst.beginShape()
                // 计算起始角度的偏移量
                const startTanRad = p5Inst.radians(this.startAngle - 90)
                const endTanRad = p5Inst.radians(this.endAngle - 90)
                const startOffsetX = weight * Math.tan(startTanRad) * (startTanRad > 0 ? -1 : 1)
                const endOffsetX = weight * Math.tan(endTanRad) * (endTanRad < 0 ? -1 : 1)

                // 左下角（起点）
                p5Inst.vertex(startOffsetX, 0)
                // 右下角
                p5Inst.vertex(this.block.distance * orig[2] + endOffsetX, 0)
                // 右上角
                p5Inst.vertex(this.block.distance * orig[2], -weight)
                // 左上角
                p5Inst.vertex(0, -weight)
                p5Inst.endShape(p5Inst.CLOSE)
                p5Inst.pop()
                break

            case CharType.BLOCK_W_MID:
                p5Inst.push()
                p5Inst.strokeWeight(0)
                p5Inst.translate(points[0][0], points[0][1])
                p5Inst.rotate(this.block.angle)

                // 使用自定义路径实现斜切边的矩形
                p5Inst.beginShape()
                // 计算起始角度的偏移量
                const startTanRadMid = p5Inst.radians(this.startAngle - 90)
                const endTanRadMid = p5Inst.radians(this.endAngle - 90)
                const startOffsetXMid = (weight / 2) * Math.tan(startTanRadMid) * (startTanRadMid > 0 ? -1 : 1)
                const endOffsetXMid = (weight / 2) * Math.tan(endTanRadMid) * (endTanRadMid < 0 ? -1 : 1)

                // 左下角（起点）
                p5Inst.vertex(startOffsetXMid, weight / 2)
                // 右下角
                p5Inst.vertex(this.block.distance * orig[2] + endOffsetXMid, weight / 2)
                // 右上角
                p5Inst.vertex(this.block.distance * orig[2] - endOffsetXMid, -weight / 2)
                // 左上角
                p5Inst.vertex(-startOffsetXMid, -weight / 2)
                p5Inst.endShape(p5Inst.CLOSE)
                p5Inst.pop()
                break

            case CharType.ARC:
                p5Inst.push()
                p5Inst.noFill()
                p5Inst.strokeWeight(weight)
                // 使用角度而不是预设的strokeCap
                p5Inst.strokeCap(p5Inst.SQUARE) // 基础样式，具体角度在下面处理

                // 计算起始角度和结束角度的偏移
                const arcStartAngleOffset = p5Inst.radians(this.startAngle - 90)
                const arcEndAngleOffset = p5Inst.radians(this.endAngle - 90)

                p5Inst.translate(
                    this.arc.center[0] * orig[2] + orig[0],
                    this.arc.center[1] * orig[2] + orig[1]
                )

                // 调整弧线的起始和结束角度
                const adjustedStartAngle = this.arc.startAngle + arcStartAngleOffset
                const adjustedEndAngle = this.arc.endAngle - arcEndAngleOffset

                p5Inst.rotate(adjustedStartAngle)
                p5Inst.arc(
                    0,
                    0,
                    this.arc.radius * orig[2] * 2,
                    this.arc.radius * orig[2] * 2,
                    0,
                    adjustedEndAngle - adjustedStartAngle,
                    this.arc.clockwise ? 'OPEN' : 'PIE'
                )
                p5Inst.pop()
                break

            case CharType.POLYLINE:
                p5Inst.push()
                p5Inst.noFill()
                p5Inst.strokeWeight(weight)
                p5Inst.strokeCap(p5Inst.SQUARE)

                if (points.length >= 2) {
                    // 计算起始点和结束点的切线方向
                    const firstDir = {
                        x: points[1][0] - points[0][0],
                        y: points[1][1] - points[0][1]
                    }
                    const lastDir = {
                        x: points[points.length - 1][0] - points[points.length - 2][0],
                        y: points[points.length - 1][1] - points[points.length - 2][1]
                    }

                    // 计算切边角度的偏移量
                    const startOffsetAngle = p5Inst.radians(this.startAngle - 90)
                    const endOffsetAngle = p5Inst.radians(this.endAngle - 90)

                    // 根据角度偏移量和权重计算偏移距离
                    const startMag = Math.sqrt(firstDir.x * firstDir.x + firstDir.y * firstDir.y)
                    const firstDirNorm = { x: firstDir.x / startMag, y: firstDir.y / startMag }
                    const startOffsetX = -weight / 2 * Math.tan(startOffsetAngle) * firstDirNorm.y
                    const startOffsetY = weight / 2 * Math.tan(startOffsetAngle) * firstDirNorm.x

                    const endMag = Math.sqrt(lastDir.x * lastDir.x + lastDir.y * lastDir.y)
                    const lastDirNorm = { x: lastDir.x / endMag, y: lastDir.y / endMag }
                    const endOffsetX = weight / 2 * Math.tan(endOffsetAngle) * lastDirNorm.y
                    const endOffsetY = -weight / 2 * Math.tan(endOffsetAngle) * lastDirNorm.x

                    // 创建新的点集合，修改起点和终点
                    const adjustedPoints = [...points]
                    adjustedPoints[0] = [points[0][0] + startOffsetX, points[0][1] + startOffsetY]
                    adjustedPoints[points.length - 1] = [points[points.length - 1][0] + endOffsetX, points[points.length - 1][1] + endOffsetY]

                    // 绘制路径
                    p5Inst.beginShape()
                    for (let i = 0; i < adjustedPoints.length; i++) {
                        p5Inst.vertex(adjustedPoints[i][0], adjustedPoints[i][1])
                    }
                    p5Inst.endShape()
                } else {
                    // 如果点不足，则使用原始方式绘制
                    p5Inst.beginShape()
                    for (let i = 0; i < points.length; i++) {
                        p5Inst.vertex(points[i][0], points[i][1])
                    }
                    p5Inst.endShape()
                }
                p5Inst.pop()
                break

            case CharType.CIRCLE:
                p5Inst.push()
                p5Inst.noFill()
                p5Inst.strokeWeight(weight)
                p5Inst.strokeCap(p5Inst.SQUARE)
                const center = points[0]; // 第一个点作为圆心
                const radius = p5Inst.dist(center[0], center[1], points[1][0], points[1][1]); // 第二个点到圆心的距离作为半径
                p5Inst.circle(center[0], center[1], radius * 2); // p5.js的circle函数参数是直径，所以半径*2
                p5Inst.pop()
                break
        }

        for (let i = 0; i < points.length; i++) {
            p5Inst.fill('red')
            p5Inst.ellipse(points[i][0], points[i][1], 5, 5)
        }
    }
}

class Character {
    constructor(name, components, size) {
        this.name = name;
        this.components = components;
        this.size = size;
        this.initialized = false;
        this.colorGroups = [
            // 第一组：浅灰白色系
            [
                [0xe5, 0xe5, 0xe5], // e5e5e5
                [0xed, 0xee, 0xe9], // edeee9
                [0xec, 0xef, 0xee], // ecefee
                [0xe9, 0xeb, 0xf6], // e9ebf6
                [0xe6, 0xe9, 0xea], // e6e9ea
                [0xef, 0xeb, 0xe6], // efebe6
                [0xe9, 0xea, 0xe5], // e9eae5
                [0xf6, 0xf3, 0xe8], // f6f3e8
                [0xeb, 0xe5, 0xe3], // ebe5e3
                [0xf4, 0xed, 0xe3], // f4ede3
                [0xf7, 0xf3, 0xe1], // f7f3e1
                [0xeb, 0xef, 0xe9], // ebefe9
                [0xe6, 0xea, 0xe4], // e6eae4
                [0xe8, 0xe8, 0xe8], // e8e8e8
            ],
            // 第二组：蓝绿色系
            [
                [0x66, 0x79, 0x8c], // 66798c
                [0x80, 0x95, 0x96], // 809596
                [0xae, 0xc1, 0xc8], // aec1c8
                [0x27, 0x51, 0x7a], // 27517a
                [0x2d, 0x6a, 0x85], // 2d6a85
                [0x3e, 0x93, 0x8b], // 3e938b
                [0x69, 0xa0, 0xad], // 69a0ad
                [0x95, 0xb6, 0xa4], // 95b6a4
                [0x17, 0x2e, 0x59], // 172e59
                [0x44, 0x52, 0x9a], // 44529a
                [0x4f, 0xab, 0xc0], // 4fabc0
                [0x72, 0xc2, 0xd1], // 72c2d1
                [0x59, 0xab, 0xcb], // 59abcb
                [0x66, 0xa0, 0xc1], // 66a0c1
            ],
            // 第三组：深灰黑色系
            [
                [0x56, 0x55, 0x5b], // 56555b
                [0x4d, 0x4f, 0x5f], // 4d4f5f
                [0x42, 0x44, 0x5c], // 42445c
                [0x38, 0x39, 0x4b], // 38394b
                [0x34, 0x34, 0x3d], // 34343d
                [0x32, 0x3a, 0x39], // 323a39
                [0x27, 0x2a, 0x2b], // 272a2b
                [0x3b, 0x39, 0x2d], // 3b392d
                [0x2e, 0x32, 0x2c], // 2e322c
                [0x2c, 0x26, 0x2d], // 2c262d
                [0x21, 0x23, 0x2e], // 21232e
                [0x2d, 0x32, 0x32], // 2d3232
                [0x10, 0x1b, 0x27], // 101b27
                [0x16, 0x06, 0x07], // 160607
            ],
            // 第四组：红棕色系
            [
                [0xca, 0x75, 0x66], // ca7566
                [0xc8, 0x5d, 0x4e], // c85d4e
                [0xc6, 0x4b, 0x34], // c64b34
                [0x95, 0x36, 0x30], // 953630
                [0x7b, 0x28, 0x26], // 7b2826
                [0x61, 0x20, 0x28], // 612028
                [0xae, 0x56, 0x60], // ae5660
                [0xc9, 0x4d, 0x2a], // c94d2a
                [0xc0, 0x54, 0x39], // c05439
                [0xb6, 0x33, 0x28], // b63328
                [0x8e, 0x2c, 0x35], // 8e2c35
                [0x95, 0x2d, 0x2b], // 952d2b
                [0x5f, 0x1e, 0x20], // 5f1e20
            ],
            // 第五组：金黄色系
            [
                [0xf2, 0xe7, 0xc6], // f2e7c6
                [0xe2, 0xca, 0x79], // e2ca79
                [0xe4, 0xc6, 0x51], // e4c651
                [0xde, 0xba, 0x49], // deba49
                [0xdb, 0xb4, 0x5e], // dbb45e
                [0xdf, 0xb0, 0x47], // dfb047
                [0xdf, 0x9c, 0x41], // df9c41
                [0xe2, 0xc8, 0x73], // e2c873
                [0xe2, 0xc9, 0x79], // e2c979
                [0xe1, 0xd5, 0x80], // e1d580
                [0xe3, 0xc6, 0x51], // e3c651
                [0xdf, 0xba, 0x4c], // dfba4c
                [0xdd, 0xaf, 0x51], // ddaf51
                [0xde, 0x9d, 0x41], // de9d41
            ]
        ];
        this.alphaValues = [0.6, 0.65, 0.7, 0.75, 0.8];
        this.usedGroups = new Set();
        this.lastColorOn = false;

        // 增加缓存相关属性
        this.lastParams = {
            loudness: null,
            centroid: null,
            colorOn: null,
            canvas: null
        };
    }

    init(p5Inst) {
        if (!this.initialized) {
            // 批量初始化所有组件
            for (let i = 0; i < this.components.length; i++) {
                this.components[i].init(p5Inst);
            }
            this.assignRandomColors(p5Inst);
            this.initialized = true;
        }
    }

    assignRandomColors(p5Inst) {
        // 重置已使用的颜色组
        this.usedGroups.clear();

        // 创建可用颜色组的索引数组
        const availableGroups = Array.from({ length: this.colorGroups.length }, (_, i) => i);

        // 随机打乱颜色组顺序
        for (let i = availableGroups.length - 1; i > 0; i--) {
            const j = Math.floor(p5Inst.random(0, i + 1));
            [availableGroups[i], availableGroups[j]] = [availableGroups[j], availableGroups[i]];
        }

        this.components.forEach((component, index) => {
            // 选择颜色组
            let groupIndex;
            if (index < this.colorGroups.length) {
                // 如果组件数量小于等于颜色组数量，使用打乱后的顺序
                groupIndex = availableGroups[index];
            } else {
                // 如果组件数量大于颜色组数量，随机选择一个组
                groupIndex = Math.floor(p5Inst.random(0, this.colorGroups.length));
            }
            this.usedGroups.add(groupIndex);

            // 从选定的组中随机选择一个颜色
            const selectedGroup = this.colorGroups[groupIndex];
            const selectedColor = selectedGroup[Math.floor(p5Inst.random(0, selectedGroup.length))];
            const alpha = this.alphaValues[Math.floor(p5Inst.random(0, this.alphaValues.length))] * 255;

            // 设置组件的颜色
            component.color = p5Inst.color(
                selectedColor[0],
                selectedColor[1],
                selectedColor[2],
                alpha
            );
        });
    }

    draw(p5Inst, canvas, loudness, centroid, colorOn) {
        // 确保组件已初始化
        if (!this.initialized) {
            this.init(p5Inst);
        }

        // 检查参数是否发生变化
        const paramsChanged =
            this.lastParams.loudness !== loudness ||
            this.lastParams.centroid !== centroid ||
            this.lastParams.colorOn !== colorOn ||
            !this.lastParams.canvas ||
            this.lastParams.canvas[0] !== canvas[0] ||
            this.lastParams.canvas[1] !== canvas[1] ||
            this.lastParams.canvas[2] !== canvas[2];

        // 颜色模式变化时重新分配颜色
        if (colorOn !== this.lastParams.colorOn) {
            if (colorOn) {
                this.assignRandomColors(p5Inst);
            }
        }

        // 更新参数缓存
        this.lastParams = {
            loudness,
            centroid,
            colorOn,
            canvas: [...canvas]
        };

        // 计算原点坐标 (用于定位) - 优先确保Character完全居中
        const orig = [
            ((canvas[0] - this.size[0]) / 2) * canvas[2], // 移除Math.ceil，确保精确居中
            ((canvas[1] - this.size[1]) / 2) * canvas[2], // 移除Math.floor，确保精确居中
            canvas[2],
        ];

        // 绘制所有组件
        for (let i = 0; i < this.components.length; i++) {
            this.components[i].draw(p5Inst, orig, loudness, centroid, colorOn);
        }
    }
}

let qiData = new Character(
    "气",
    [
        new CharCompo(
            [
                [0, 0],
                [0, 4]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 4],
                [10, 4]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 60) {
                    w = p5Inst.map(loudness, 0, 60, DefaultWidth, 20)
                } else {
                    w = p5Inst.map(loudness, 60, 180, 20, 1)
                }

                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 7],
                [10, 7]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 60)

                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 10],
                [10, 10]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 15)

                return w
            },
            CharType.BLOCK_W,
        )
    ],
    [10, 10]
)

let yueData = new Character(
    "月",
    [
        new CharCompo(
            [
                [0, 0],
                [0, 12]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (centroid < 1000) {
                    w = 30
                } else {
                    w = p5Inst.map(centroid, 1000, 5000, 30, 10)
                }
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [2, 4],
                [2, 8]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 120, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 0.5],
                [5.5, 6],
                [0, 11.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 80)
                return w
            },
            CharType.ARC,
        )
    ],
    [7, 12]
)

let jinData = new Character(
    "金",
    [
        new CharCompo(
            [
                [4, 0.5],
                [0.5, 4]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 100)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [7.5, 4],
                [4, 0.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 100)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1.5, 3.5],
                [6.5, 3.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [4, 4],
                [4, 11],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [2, 6.5],
                [4, 8.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 50)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4, 8.5],
                [6, 6.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 50)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [2, 8.5],
                [0, 10.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [8, 10.5],
                [6, 8.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0.5, 13],
                [7.5, 13]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 80)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
    ],
    [8, 13]
)

let huoData = new Character(
    "火",
    [
        new CharCompo(
            [
                [0.5, 0.5],
                [3, 3],
                [6, 0.5],
                [9, 3],
                [11.5, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 30) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 30, 150, DefaultWidth, 80)
                }
                return w < 0 ? 0 : w
            },
            CharType.POLYLINE,
        ),
        new CharCompo(
            [
                [0.5, 0],
                [6, 7.5],
                [11.5, 0]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 5000, DefaultWidth, 0)
                return w
            },
            CharType.ARC,
        )
    ],
    [12, 8]
)

let muData = new Character(
    "木",
    [
        new CharCompo(
            [
                [4, 0],
                [4, 12]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 30) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 30, 150, DefaultWidth, 0)
                }
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [0.5, 1.5],
                [4, 5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 110)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4, 5],
                [7.5, 1.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 110)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4, 7],
                [0.5, 10.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 110)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [7.5, 10.5],
                [4, 7]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 110)
                return w
            },
            CharType.BLOCK_W,
        ),
    ],
    [8, 12]
)

let shuiData = new Character(
    "水",
    [
        new CharCompo(
            [
                [0, 1],
                [0, 3]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 8],
                [0, 10]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 4],
                [6, 2]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 11],
                [6, 9]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3.6, 0.2],
                [2.2, 5],
                [3.8, 7],
                [2.4, 11.8]
            ],
            (p5Inst, loudness, centroid) => {
                if (loudness < 50) {
                    return DefaultWidth
                } else {
                    let w = p5Inst.map(loudness, 50, 150, DefaultWidth, 90)
                    return w
                }
            },
            CharType.POLYLINE,
        ),
    ],
    [6, 12]
)

let tuData = new Character(
    "土",
    [
        new CharCompo(
            [
                [0, 6],
                [12, 6]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 120)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 3],
                [6, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.CIRCLE,
        )
    ],
    [12, 6]
)

let gongData = new Character(
    "工",
    [
        new CharCompo(
            [
                [8, 0],
                [0, 0]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 150)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4, 0],
                [4, 6.2]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 0)
                }
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [4, 9],
                [4, 6.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 80)
                return w
            },
            CharType.CIRCLE,
        )
    ],
    [8, 12]
)

let riData = new Character(
    "日",
    [
        new CharCompo(
            [
                [6, 6],
                [6, 0.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.CIRCLE,
        ),
        new CharCompo(
            [
                [6, 6],
                [6, 6.1],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 200)
                return w
            },
            CharType.CIRCLE,
        ),
    ],
    [12, 12]
)

let banData = new Character(
    "爿",
    [
        new CharCompo(
            [
                [6, 12],
                [6, 0],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 5000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 0],
                [0, 5],
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 120)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 5],
                [6, 5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 120)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 7],
                [0, 12]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 120)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 7],
                [0, 7]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 50) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 50, 150, DefaultWidth, 100)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
    ],
    [6, 12]
)

let yanData = new Character(
    "言",
    [
        new CharCompo(
            [
                [0, 0.5],
                [6, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 60)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [1, 1],
                [3, 3]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 0.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 0.6)
                let w = DefaultWidth * loudness * centroid
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 3],
                [5, 1]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 0.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 0.6)
                let w = DefaultWidth * loudness * centroid
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 1.5],
                [3, 8]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 150)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [1, 4],
                [3, 6]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 0.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 0.6)
                let w = DefaultWidth * loudness * centroid
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 6],
                [5, 4]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 0.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 0.6)
                let w = DefaultWidth * loudness * centroid
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 9.5],
                [3, 7.5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 2)
                let w = p5Inst.map(loudness * centroid, 1, 4, DefaultWidth, 80)
                return w
            },
            CharType.CIRCLE,
        ),
    ],
    [6, 12]
)

let caoData = new Character(
    "草",
    [
        new CharCompo(
            [
                [0, 5],
                [6, 5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 1],
                [0, 5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 5],
                [6, 1]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 0],
                [3, 12]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 3)
                let w = p5Inst.map(loudness * centroid, 1, 3.6, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
    ],
    [6, 12]
)

let shiData = new Character(
    "石",
    [
        new CharCompo(
            [
                [8, 0],
                [0, 0],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 3)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 3.6, DefaultWidth, 350)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 0],
                [0, 12]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 3)
                let w = p5Inst.map(loudness * centroid, 1, 3.6, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4.5, 5],
                [2, 5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w
            },
            CharType.CIRCLE,
        ),
    ],
    [8, 12]
)

let mu2Data = new Character(
    "目",
    [
        new CharCompo(
            [
                [5, 3],
                [5, 3.1],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 80)
                return w
            },
            CharType.CIRCLE,
        ),
        new CharCompo(
            [
                [0.5, 3.2],
                [5, 0.5],
                [10, 3.2]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w
            },
            CharType.ARC,
        ),
        new CharCompo(
            [
                [0.5, 2.8],
                [5, 5.5],
                [10, 2.8]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
                return w
            },
            CharType.ARC,
        ),

    ],
    [10, 6]
)

let yiData = new Character(
    "衣",
    [
        new CharCompo(
            [
                [3.5, 0],
                [3.5, 1.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [3.5, 0.8],
                [-0.35, 4.65],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 50)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [7.35, 4.65],
                [3.5, 0.8],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 50)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 7.5],
                [1.75, 5.75],
                [3.5, 7.5],
                [5.25, 5.75],
                [7, 7.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.POLYLINE,
        ),
        new CharCompo(
            [
                [1, 6],
                [1, 12]

            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 2)
                let w = p5Inst.map(loudness * centroid, 1, 2.2, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1, 12],
                [5, 12]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.1)
                let w = p5Inst.map(loudness * centroid, 1, 2.2, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        )
    ],
    [7, 12]
)

let kouData = new Character(
    "口",
    [
        new CharCompo(
            [
                [11.8, 2.5],
                [0.2, 2.5],
            ],
            (p5Inst, loudness, centroid) => {
                // let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 100)
                let w
                if (loudness < 30) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 30, 150, DefaultWidth, 150)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1.2, 0.4],
                [6, 8.5],
                [10.8, 0.4]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.ARC,
        )
    ],
    [12, 9]
)

let chongData = new Character(
    "虫",
    [
        new CharCompo(
            [
                [2.5, 2.5],
                [2.5, 2.45]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 100)
                return w
            },
            CharType.CIRCLE,
        ),
        new CharCompo(
            [
                [2.5, 2.5],
                [2.5, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 60) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 60, 180, DefaultWidth, 0)
                }
                return w
            },
            CharType.CIRCLE,
        ),
        new CharCompo(
            [
                [2.5, 4.5],
                [2, 7.5],
                [3, 10],
                [2.5, 13]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 50)
                return w
            },
            CharType.POLYLINE,
        )
    ],
    [5, 13]
)

let fuData = new Character(
    "阝",
    [
        new CharCompo(
            [
                [5, 0],
                [0, 0]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 60) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 60, 180, DefaultWidth, 100)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1.5, 0.5],
                [4.5, 3.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [5, 4],
                [0, 4]
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 60) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 60, 180, DefaultWidth, 100)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1.5, 4.5],
                [4.5, 7.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [5, 12],
                [5, 0]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 150)
                return w
            },
            CharType.BLOCK_W,
        )
    ],
    [5, 12]
)

let xinData = new Character(
    "心",
    [
        new CharCompo(
            [
                [3.5, 0],
                [0, 3.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 150)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [5.5, 2],
                [3.5, 0],
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 60) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 60, 180, DefaultWidth, 100)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [12, 3.5],
                [8.5, 0],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 150)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [8.5, 0],
                [6.5, 2],
            ],
            (p5Inst, loudness, centroid) => {
                let w
                if (loudness < 60) {
                    w = DefaultWidth
                } else {
                    w = p5Inst.map(loudness, 60, 180, DefaultWidth, 100)
                }
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1.5, 5.5],
                [6, 10],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 6000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 10],
                [10.5, 5.5],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 6000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4.75, 4.75],
                [3, 6.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [7.25, 4.75],
                [9, 6.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W_MID,
        ),
    ],
    [12, 10]
)

let baoData = new Character(
    "勹",
    [
        new CharCompo(
            [
                [3, 0],
                [3, 3]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.5)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 2],
                [0, 5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.5)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 5],
                [3, 2]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 5],
                [2.7, 7.7]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [2.4, 7],
                [2.4, 13]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
    ],
    [6, 13]
)

let yuData = new Character(
    "雨",
    [
        new CharCompo(
            [
                [8, 0],
                [0, 0]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.4)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.4)
                let w = p5Inst.map(loudness * centroid, 1, 2, DefaultWidth, 200)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 0],
                [0, 5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.21, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [8, 5],
                [8, 0],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.1)
                let w = p5Inst.map(loudness * centroid, 1, 1.21, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4, 0],
                [4, 5],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [0, 6],
                [0, 10]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.21, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [8, 10],
                [8, 6],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.1)
                let w = p5Inst.map(loudness * centroid, 1, 1.21, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [4, 6],
                [4, 10],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
    ],
    [8, 10]
)

let jin2Data = new Character(
    "斤",
    [
        new CharCompo(
            [
                [8, 12],
                [8, 1.5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
            90, 60
        ),
        new CharCompo(
            [
                [1, 4.5],
                [8, 0.5],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
            90, -60
        ),
        new CharCompo(
            [
                [2, 2],
                [1, 4.5],
                [3.5, 5.35]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 100)
                return w
            },
            CharType.POLYLINE,
        ),
    ],
    [8, 10]
)
let zuData = new Character(
    "足",
    [
        new CharCompo(
            [
                [4, 3],
                [4, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 100)
                return w < 0 ? 0 : w
            },
            CharType.CIRCLE,
        ),
        new CharCompo(
            [
                [4, 6.5],
                [4, 12]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.1)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.3)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 40)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [0, 12],
                [8, 12]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.3)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.1)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 40)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1, 7],
                [1, 9]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 1, 8000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [3.5, 11.5],
                [1, 9],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 1, 8000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.ARC,
        ),
        new CharCompo(
            [
                [3.5, 9.5],
                [5, 9.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 1, 150, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [7, 7.5],
                [5, 9.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 1, 150, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.ARC,
        ),
    ],
    [8, 12]
)

let chuoData = new Character(
    "辶",
    [
        new CharCompo(
            [
                [5, 0],
                [5, 9]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [1.8, 11.8],
                [5, 9],
                [8, 11.8]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 60)
                return w < 0 ? 0 : w
            },
            CharType.POLYLINE,
        ),
        new CharCompo(
            [
                [3, 3.5],
                [0.5, 1],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 60)
                return w < 0 ? 0 : w
            },
            CharType.ARC,
        ),
        new CharCompo(
            [
                [7, 3.5],
                [9.5, 6],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 60)
                return w < 0 ? 0 : w
            },
            CharType.ARC,
        ),
        new CharCompo(
            [
                [3, 3.5],
                [7, 3.5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 60)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
    ],
    [10, 12]
)

let mianData = new Character(
    "宀",
    [
        new CharCompo(
            [
                [5, 0],
                [0, 5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 60)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [10, 5],
                [5, 0],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 60)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [1.5, 4],
                [1.5, 12]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 150)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [8.5, 12],
                [8.5, 4],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 150)
                return w
            },
            CharType.BLOCK_W,
        ),
    ],
    [10, 12]
)

let yangData = new Character(
    "央",
    [
        new CharCompo(
            [
                [0, 0],
                [0, 4]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 4],
                [7, 4]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 100)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [7, 4],
                [7, 0]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [5, 0.5],
                [2, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 100)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3.5, 0.5],
                [3.5, 9]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [3.5, 8],
                [0, 11.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [7, 11.5],
                [3.5, 8],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 100)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3.5, 4.5],
                [1.5, 6.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [5.5, 6.5],
                [3.5, 4.5],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W,
        ),
    ],
    [7, 12]
)

let weiData = new Character(
    "未",
    [
        new CharCompo(
            [
                [0, 0],
                [0, 3],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [0, 3],
                [3, 6]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 3],
                [6, 0]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 6],
                [6, 3],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [3, 1],
                [3, 12],
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 1.2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
                let w = p5Inst.map(loudness * centroid, 1, 1.44, DefaultWidth, 100)
                return w < 0 ? 0 : w
            },
            CharType.BLOCK_W_MID,
        ),
        new CharCompo(
            [
                [3, 7],
                [0, 10],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
        new CharCompo(
            [
                [6, 10],
                [3, 7],
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.BLOCK_W,
        ),
    ],
    [6, 12]
)


let charData = [
    // qiData,
    // yueData,
    // jinData,
    // muData,
    // shuiData,
    // huoData,
    // tuData,
    // gongData,
    // riData,
    // banData,
    // yanData,
    // caoData,
    // shiData,
    // mu2Data,
    // yiData,
    // kouData,
    // chongData,
    // fuData,
    // xinData,
    baoData,
    yuData,
    jin2Data,
    zuData,
    chuoData,
    mianData,
    yangData,
    weiData,
]

export { charData, DefaultWidth, CharType }