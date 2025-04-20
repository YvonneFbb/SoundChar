'use client'

import React, { useRef, useState, useEffect } from 'react'
import initBezier from 'p5bezier'
import dynamic from 'next/dynamic'

/* For pic taking only */
let takePic = false
let cnt = 0
let lCnt = 0
let lCntMax = 18
let cCnt = 0
let cCntMax = 10

const Sketch = dynamic(
  () =>
    import('react-p5').then(mod => {
      if (typeof window !== 'undefined' && !window.p5SoundLoaded) {
        require('p5/lib/addons/p5.sound.min')

        window.p5SoundLoaded = true // 标记只加载一次
      }
      return mod.default
    }),
  { ssr: false }
)

const CharType = {
  BLOCK_W: 0,
  BLOCK_W_MID: 1,
  ARC: 2,
  // BEZIER: 5
}

class Sampler {
  constructor(p5Inst, sampleInterval = 300) {
    this.mic = new window.p5.AudioIn()
    this.fft = new window.p5.FFT(0.8, 64)
    this.fft.setInput(this.mic)
    this.p5 = p5Inst

    this.sampleInterval = sampleInterval
    this.lastSampleTime = 0
    this.loudness = 0
    this.centroid = 0
    this.gate = 50
    this.active = false
  }

  async enable() {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.start(() => {
      this.mic.amp(0.8)
    })
  }

  async stop() {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.stop()
  }

  sample() {
    const currentTime = this.p5.millis()
    if (currentTime - this.lastSampleTime >= this.sampleInterval) {
      this.lastSampleTime = currentTime
      const spectrum = this.fft.analyze()

      this.loudness = this.fft.getEnergy('lowMid', 'highMid')
      this.centroid = this.fft.getCentroid()

      this.active = this.loudness > this.gate
    }
    return { loudness: this.loudness, centroid: this.centroid }
  }
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
      // case CharType.BEZIER:
    }
  }

  draw(p5Inst, orig, loudness, centroid, colorOn) {
    const { weight, smooth } = this.mapfunc(p5Inst, loudness, centroid)
    orig[0] = Math.ceil((orig[0] - this.size[0]) / 2) * orig[2]
    orig[1] = Math.floor((orig[1] - this.size[1]) / 2) * orig[2]
    let points = this.points.map(p => {
      return [p[0] * orig[2] + orig[0], p[1] * orig[2] + orig[1]]
    })

    if (colorOn) {
      if (this.color == null) {
        // 创建 RGB 颜色数组
        const colors = [
          p5Inst.random(240, 255),
          p5Inst.random(0, 50),
          p5Inst.random(0, 200)
        ]
        // 随机打乱颜色数组顺序
        colors.sort(() => Math.random() - 0.5)

        // 使用打乱后的颜色创建新的颜色
        this.color = p5Inst.color(
          colors[0], // 随机通道 1
          colors[1], // 随机通道 2
          colors[2], // 随机通道 3
          255 * 0.6
        )
      }
      p5Inst.fill(this.color)
      p5Inst.stroke(this.color)
    } else {
      this.color = null
      p5Inst.fill(0)
      p5Inst.stroke(0)
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
      // case CharType.BEZIER:
      //   p5Inst.noFill()
      //   p5Inst.strokeWeight(weight)
      //   p5bezier.draw(points, 'OPEN', 4)
      //   break
    }

    // for (let i = 0; i < points.length; i++) {
    //   p5Inst.fill('red')
    //   p5Inst.ellipse(points[i][0], points[i][1], 5, 5)
    // }
  }
}

const LRControlButtons = ({ onIncrement, onDecrement }) => (
  <div>
    <div className='absolute top-1/2 left-32 -translate-x-1/2 -translate-y-1/2 z-10'>
      <button onClick={onDecrement}>
        <svg width='40' height='40' viewBox='0 0 100 100'>
          {/* 这里的三角形顶点在 (20,50) 为指向左边，
              另外两个点在 (80,20) 和 (80,80)，构成一个较为接近正三角形的形状 */}
          <polygon
            points='20,50 80,20 80,80'
            fill='#0c75ff'
            stroke='black'
            strokeWidth='3'
          />
        </svg>
      </button>
    </div>
    <div className='absolute top-1/2 right-32 -translate-x-1/2 -translate-y-1/2 z-10'>
      <button onClick={onIncrement}>
        <svg width='40' height='40' viewBox='0 0 100 100'>
          {/* 这里的三角形顶点在 (80,50) 为指向右边，
              另外两个点在 (20,20) 和 (20,80) */}
          <polygon
            points='80,50 20,20 20,80'
            fill='#0c75ff'
            stroke='black'
            strokeWidth='3'
          />
        </svg>
      </button>
    </div>
  </div>
)

const MySketch = ({ className }) => {
  const [globalInt, setGlobalInt] = useState(0)
  const [audioAllowed, setAudioAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [canvasSize, setCanvasSize] = useState([800, 800])
  const [colorOn, setColorOn] = useState(false)

  const samplerRef = useRef()
  const p5bezierRef = useRef()
  const globalIntRef = useRef(globalInt)
  const containerRef = useRef(null)
  const canvasSizeRef = useRef(canvasSize)

  const handleResize = () => {
    const { width, height } = containerRef.current.getBoundingClientRect()
    setCanvasSize([width, height])
  }

  const drawGrid = (p5Inst, gridSize = 30) => {
    p5Inst.push();
    p5Inst.stroke(220); // 浅灰色网格线
    p5Inst.strokeWeight(0.5);

    // 绘制水平线
    for (let y = 0; y < p5Inst.height; y += gridSize) {
      p5Inst.line(0, y, p5Inst.width, y);
    }

    // 绘制垂直线
    for (let x = 0; x < p5Inst.width; x += gridSize) {
      p5Inst.line(x, 0, x, p5Inst.height);
    }

    p5Inst.pop();
  }

  useEffect(() => {
    globalIntRef.current = globalInt
  }, [globalInt])
  useEffect(() => {
    canvasSizeRef.current = canvasSize
  }, [canvasSize])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setup = (p5Inst, canvasParentRef) => {
    const canvas = p5Inst
      .createCanvas(canvasSizeRef.current, canvasSizeRef.current)
      .parent(canvasParentRef)
    samplerRef.current = new Sampler(p5Inst, 5)
    p5bezierRef.current = initBezier(canvas)

    for (let data of charData) {
      data[1].forEach(char => {
        char.init(p5Inst)
      })
    }

    setIsLoading(false)

    p5Inst.getAudioContext().suspend()
  }

  const draw = p5Inst => {
    const gridSize = 30
    if (
      p5Inst.width !== canvasSizeRef.current[0] ||
      p5Inst.height !== canvasSizeRef.current[1]
    ) {
      p5Inst.resizeCanvas(canvasSizeRef.current[0], canvasSizeRef.current[1])
    }
    p5Inst.background(255)
    drawGrid(p5Inst, gridSize)

    const data = samplerRef.current?.sample(p5Inst)
    if (takePic && audioAllowed && lCnt <= lCntMax && cCnt <= cCntMax) {
      data.centroid = cCnt * 1000
      data.loudness = lCnt * 10
      cnt += 1
    }

    charData[globalIntRef.current][1].forEach(char => {
      char.draw(
        p5Inst,
        [canvasSizeRef.current[0] / gridSize, canvasSizeRef.current[1] / gridSize, gridSize],
        data.loudness,
        data.centroid,
        colorOn
      )
    })

    if (takePic && cnt >= 15) {
      if (audioAllowed && lCnt <= lCntMax && cCnt <= cCntMax) {
        p5Inst.saveCanvas(
          'myCanvas' + '-' + data.centroid + '-' + data.loudness,
          'png'
        )
      }

      cnt = 0
      lCnt += 1
      if (lCnt > lCntMax) {
        cCnt += 1
        lCnt = 0
      }
    }
  }

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {!isLoading && (
        <LRControlButtons
          onIncrement={() => {
            setGlobalInt(prev =>
              prev >= charData.length - 1 ? prev : prev + 1
            )
          }}
          onDecrement={() => setGlobalInt(prev => (prev < 1 ? prev : prev - 1))}
        />
      )}

      {isLoading && (
        <div className='inset-0 bg-gray-100 flex items-center justify-center'>
          Loading audio...
        </div>
      )}

      {!isLoading && (
        <div className='fixed top-[80px] right-4 transform -translate-y-1/2'>
          <div
            onClick={() => setColorOn(!colorOn)}
            className='relative w-8 h-5 flex items-center rounded-full p-1 cursor-pointer overflow-hidden border-[1px] border-black'
          >
            {/* 背景层 */}
            <div
              className={`absolute inset-0 transition-opacity ${colorOn
                ? 'opacity-100 bg-gradient-to-tr from-[#0c75ff] to-[#f6c7ac]'
                : 'opacity-0 bg-gradient-to-tr from-[#0c75ff] to-[#f6c7ac]'
                }`}
            />
            <div
              className={`absolute inset-0 transition-opacity bg-black ${colorOn ? 'opacity-0' : 'opacity-100'
                }`}
            />
            {/* 圆形滑块 */}
            <div
              className={`relative bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${colorOn ? 'translate-x-[9px]' : 'translate-x-[-3px]'
                }`}
            ></div>
          </div>
        </div>
      )}

      {!isLoading && (
        <p className='absolute text-2xl font-bold top-20 left-1/2 -translate-x-1/2 z-10 song-font'>
          {charData[globalInt][0]}
        </p>
      )}

      {!isLoading && (
        <button
          className='absolute text-xl font-bold bottom-1/4 left-1/2 -translate-x-1/2 flex gap-8 z-10'
          onClick={async () => {
            if (!audioAllowed) {
              // 如果音频未开启，则启动音频
              await samplerRef.current?.enable()
              setAudioAllowed(true)
            } else {
              // 如果音频已开启，则暂停/停止麦克风输入
              samplerRef.current?.mic.stop()
              setAudioAllowed(false)
            }
          }}
        >
          {audioAllowed ? 'PAUSE' : 'START'}
        </button>
      )}

      <Sketch setup={setup} draw={draw} />
    </div>
  )
}

const DefaultWidth = 30

let qiData = [
  new CharCompo(
    [
      [0, 0],
      [0, 4]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 80)

      return {
        weight: w,
        smooth: 3
      }
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

      return {
        weight: w,
        smooth: 3
      }
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

      return {
        weight: w,
        smooth: 3
      }
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

      return {
        weight: w,
        smooth: 3
      }
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
        w = p5Inst.map(centroid, 0, 1000, DefaultWidth, 30)
      } else {
        w = p5Inst.map(centroid, 1000, 6000, 30, 10)
      }

      return {
        weight: w,
        smooth: 3
      }
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
      let w = p5Inst.map(loudness, 0, 120, DefaultWidth, 80)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_W,
    [7, 12]
  ),
  new CharCompo(
    [
      [0.5, 0.5],
      [6.5, 6],
      [0.5, 11.5]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(centroid, 0, 8000, DefaultWidth, 30)

      return {
        weight: w,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
    },
    CharType.BLOCK_W,
    [6, 12]
  ),
  new CharCompo(
    [
      [3.6, 0.2],
      [2.3, 5.1]
    ],
    (p5Inst, loudness, centroid) => {
      return {
        weight: DefaultWidth,
        smooth: 3
      }
    },
    CharType.BLOCK_W_MID,
    [6, 12]
  ),
  new CharCompo(
    [
      [2.25, 4.75],
      [3.75, 7.3]
    ],
    (p5Inst, loudness, centroid) => {
      return {
        weight: DefaultWidth,
        smooth: 3
      }
    },
    CharType.BLOCK_W_MID,
    [6, 12]
  ),
  new CharCompo(
    [
      [3.7, 6.9],
      [2.4, 11.7]
    ],
    (p5Inst, loudness, centroid) => {
      return {
        weight: DefaultWidth,
        smooth: 3
      }
    },
    CharType.BLOCK_W_MID,
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
      return {
        weight: DefaultWidth,
        smooth: 3
      }
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

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.ARC,
    [12, 6]
  )
]

let charData = [
  ['气', qiData],
  ['月', yueData],
  ['木', muData],
  ['水', shuiData],
  ['土', tuData]
]


export default MySketch
