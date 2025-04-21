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
    constructor(points, mapfunc, type, size) {
        this.points = points
        this.mapfunc = mapfunc
        this.type = type
        this.size = size
        this.color = null

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
        orig[0] = Math.ceil((orig[0] - this.size[0]) / 2) * orig[2]
        orig[1] = Math.floor((orig[1] - this.size[1]) / 2) * orig[2]
        let points = this.points.map(p => {
            return [p[0] * orig[2] + orig[0], p[1] * orig[2] + orig[1]]
        })

        if (colorOn) {
            if (this.color == null) {
                // Predefined-colors
                const predefinedColors = [
                    [0xd4, 0xaf, 0x37],
                    [0x22, 0x8b, 0x22],
                    [0x1e, 0x3a, 0x5f],
                    [0xff, 0x45, 0x00],
                    [0xa0, 0x52, 0x2d],
                ];

                const selectedColor = predefinedColors[Math.floor(p5Inst.random(0, predefinedColors.length))];
                const alphaValues = [0.8, 0.85, 0.9, 0.95, 1.0];
                const alpha = alphaValues[Math.floor(p5Inst.random(0, alphaValues.length))] * 255;

                this.color = p5Inst.color(
                    selectedColor[0],
                    selectedColor[1],
                    selectedColor[2],
                    alpha
                );
            }
            p5Inst.fill(this.color);
            p5Inst.stroke(this.color);
        } else {
            this.color = null;
            p5Inst.fill(0);
            p5Inst.stroke(0);
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
            // case CharType.BEZIER:
            //   p5Inst.noFill()
            //   p5Inst.strokeWeight(weight)
            //   p5bezier.draw(points, 'OPEN', 4)
            //   break
        }

        for (let i = 0; i < points.length; i++) {
            p5Inst.fill('red')
            p5Inst.ellipse(points[i][0], points[i][1], 5, 5)
        }
    }
}


let qiData = [
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
        [10, 10]
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
        [10, 10]
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
        [10, 10]
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
        [10, 10]
    )
]

let yueData = [
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
            return w
        },
        CharType.BLOCK_W,
        [7, 12]
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
        [7, 12]
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
        [7, 12]
    )
]

let muData = [
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
        [8, 12]
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
        [8, 12]
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
        [8, 12]
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
        [8, 12]
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
        [8, 12]
    ),
]

let shuiData = [
    new CharCompo(
        [
            [0, 1],
            [0, 3]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
            return w < 0? 0 : w
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
    new CharCompo(
        [
            [0, 8],
            [0, 10]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
            return w < 0? 0 : w
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
    new CharCompo(
        [
            [6, 4],
            [6, 2]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
            return w < 0? 0 : w
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
    new CharCompo(
        [
            [6, 11],
            [6, 9]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 6000, DefaultWidth, 0)
            return w < 0? 0 : w
        },
        CharType.BLOCK_W,
        [6, 12]
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
        [6, 12]
    ),
]

let tuData = [
    new CharCompo(
        [
            [0, 6],
            [12, 6]
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W,
        [12, 6]
    ),
    new CharCompo(
        [
            [6, 0.5],
            [6, 5.5],
            [6.001, 0.5]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 30)

            return w
        },
        CharType.ARC,
        [12, 6]
    )
]

let gongData = [
    new CharCompo(
        [
            [8, 0],
            [0, 0]
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W,
        [8, 12]
    ),
    new CharCompo(
        [
            [4, 0],
            [4, 6.2]
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W_MID,
        [8, 12]
    ),
    new CharCompo(
        [
            [4, 6.5],
            [4, 11.5],
            [4.002, 6.5]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 30)

            return w
        },
        CharType.ARC,
        [8, 12]
    )
]

let riData = [
    new CharCompo(
        [
            [6, 0.5],
            [6, 11.5],
            [6.001, 0.5]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 30)

            return w
        },
        CharType.ARC,
        [12, 12]
    ),
    new CharCompo(
        [
            [6, 6],
            [6, 6.001],
            [6.001, 6]
        ],
        (p5Inst, loudness, centroid) => {
            let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 30)

            return w
        },
        CharType.ARC,
        [12, 12]
    )
]

let banData = [
    new CharCompo(
        [
            [6, 12],
            [6, 0],
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
    new CharCompo(
        [
            [0, 0],
            [0, 5],
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
    new CharCompo(
        [
            [0, 5],
            [6, 5]
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
    new CharCompo(
        [
            [0, 7],
            [0, 12]
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
    new CharCompo(
        [
            [6, 7],
            [0, 7]
        ],
        (p5Inst, loudness, centroid) => {
            return DefaultWidth
        },
        CharType.BLOCK_W,
        [6, 12]
    ),
]

let yanData = [

]

let charData = [
    ['气', qiData],
    ['月', yueData],
    ['木', muData],
    ['水', shuiData],
    ['土', tuData],
    ['工', gongData],
    ['日', riData],
    ['爿', banData],
    ['言', yanData]
]

export { charData, DefaultWidth, CharType, CharCompo }