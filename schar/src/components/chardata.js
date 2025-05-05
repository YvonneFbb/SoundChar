'use client'

const DefaultWidth = 30

const CharType = {
    BLOCK_W: 0,
    BLOCK_W_MID: 1,
    ARC: 2,
    POLYLINE: 3,
}

function calculateArc(points) {
    // 解构三点坐标
    const [A, B, C] = points.map(p => ({ x: p[0], y: p[1] }))
    // 三点共线检测 (向量叉积法)
    const vecAB = { x: B.x - A.x, y: B.y - A.y }
    const vecAC = { x: C.x - A.x, y: C.y - A.y }
    if (vecAB.x * vecAC.y === vecAB.y * vecAC.x) return null
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
    const angleRef = angles[0]
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

class CharCompo {
    constructor(points, mapfunc, type) {
        this.points = points
        this.mapfunc = mapfunc
        this.type = type
        this.color = null
        console.log(this.points)

        this.block = {
            angle: 0,
            distance: 0
        }
        this.arc = null
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
                if (this.points.length !== 3) {
                    console.error('Arc needs 3 points')
                    break
                }
                this.arc = calculateArc(this.points)
                break
        }
    }

    draw(p5Inst, orig, loudness, centroid, colorOn) {
        const weight = this.mapfunc(p5Inst, loudness, centroid)
        let points = this.points.map(p => {
            return [p[0] * orig[2] + orig[0], p[1] * orig[2] + orig[1]]
        })

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
                p5Inst.strokeWeight(1)
                p5Inst.translate(points[0][0], points[0][1])
                p5Inst.rotate(this.block.angle)
                p5Inst.rect(0, 0, this.block.distance * orig[2], -weight)
                p5Inst.pop()
                break
            case CharType.BLOCK_W_MID:
                p5Inst.push()
                p5Inst.strokeWeight(1)
                p5Inst.translate(points[0][0], points[0][1])
                p5Inst.rotate(this.block.angle)
                p5Inst.rect(0, -weight / 2, this.block.distance * orig[2], weight)
                p5Inst.pop()
                break
            case CharType.ARC:
                p5Inst.push()
                p5Inst.noFill()
                p5Inst.strokeWeight(weight)
                p5Inst.strokeCap(p5Inst.SQUARE)
                p5Inst.translate(
                    this.arc.center[0] * orig[2] + orig[0],
                    this.arc.center[1] * orig[2] + orig[1]
                )
                p5Inst.rotate(this.arc.startAngle)
                p5Inst.arc(
                    0,
                    0,
                    this.arc.radius * orig[2] * 2,
                    this.arc.radius * orig[2] * 2,
                    0,
                    this.arc.endAngle - this.arc.startAngle,
                    this.arc.clockwise ? 'OPEN' : 'PIE'
                )
                p5Inst.pop()
                break
            case CharType.POLYLINE:
                p5Inst.push()
                p5Inst.noFill()
                p5Inst.strokeWeight(weight)
                p5Inst.strokeCap(p5Inst.SQUARE)
                p5Inst.beginShape()
                for (let i = 0; i < points.length; i++) {
                    p5Inst.vertex(points[i][0], points[i][1])
                }
                p5Inst.endShape()
                p5Inst.pop()
                break
        }

        // for (let i = 0; i < points.length; i++) {
        //     p5Inst.fill('red')
        //     p5Inst.ellipse(points[i][0], points[i][1], 5, 5)
        // }
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
    }

    init(p5Inst) {
        this.components.forEach(component => {
            component.init(p5Inst);
        });
        this.initialized = true;
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
        if (!this.initialized) {
            this.init(p5Inst);
        }

        // 只在从 false 切换到 true 时重新分配颜色
        if (colorOn && !this.lastColorOn) {
            this.assignRandomColors(p5Inst);
        }
        this.lastColorOn = colorOn; // 更新状态

        const orig = [
            Math.ceil((canvas[0] - this.size[0]) / 2) * canvas[2],
            Math.floor((canvas[1] - this.size[1]) / 2) * canvas[2],
            canvas[2],
        ];

        this.components.forEach(component => {
            component.draw(p5Inst, orig, loudness, centroid, colorOn);
        });
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
                [6, 0.5],
                [6, 5.5],
                [6.001, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.ARC,
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
                [4, 6.5],
                [4, 11.5],
                [4.002, 6.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 80)
                return w
            },
            CharType.ARC,
        )
    ],
    [8, 12]
)

let riData = new Character(
    "日",
    [
        new CharCompo(
            [
                [6, 0.5],
                [6, 11.5],
                [6.001, 0.5]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.ARC,
        ),
        new CharCompo(
            [
                [6, 6],
                [6, 6.001],
                [6.001, 6]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 200)
                return w
            },
            CharType.ARC,
        )
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
                [3, 7.5],
                [3, 11.5],
                [3.001, 7.5]
            ],
            (p5Inst, loudness, centroid) => {
                loudness = p5Inst.map(loudness, 0, 150, 1, 2)
                centroid = p5Inst.map(centroid, 0, 8000, 1, 2)
                let w = p5Inst.map(loudness * centroid, 1, 4, DefaultWidth, 80)
                return w
            },
            CharType.ARC,
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
                [2, 5.001],
                [7, 5],
                [2, 4.999]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 0)
                return w
            },
            CharType.ARC,
        )
    ],
    [8, 12]
)

let mu2Data = new Character(
    "目",
    [
        new CharCompo(
            [
                [5, 3],
                [5, 3.001],
                [5.001, 3]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(loudness, 0, 150, DefaultWidth, 60)
                return w
            },
            CharType.ARC,
        ),
        new CharCompo(
            [
                [0.5, 3.2],
                [5, 0],
                [10, 3.2]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
                return w
            },
            CharType.ARC,
        ),
        new CharCompo(
            [
                [0.5, 2.8],
                [5, 6],
                [10, 2.8]
            ],
            (p5Inst, loudness, centroid) => {
                let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 0)
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
        // new CharCompo(
        //     [
        //         [0, 5],
        //         [3.5, 1.5],
        //         [7, 5]
        //     ],
        //     (p5Inst, loudness, centroid) => {
        //         loudness = p5Inst.map(loudness, 0, 150, 1, 2)
        //         centroid = p5Inst.map(centroid, 0, 8000, 1, 1.2)
        //         let w = p5Inst.map(loudness * centroid, 1, 2.4, DefaultWidth, 50)
        //         return w
        //     },
        //     CharType.POLYLINE,
        // ),
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


let charData = [
    qiData,
    yueData,
    jinData,
    muData,
    shuiData,
    tuData,
    gongData,
    riData,
    banData,
    yanData,
    caoData,
    shiData,
    mu2Data,
    yiData
]

export { charData, DefaultWidth, CharType }